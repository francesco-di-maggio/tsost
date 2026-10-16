import { TYPES, items, types } from "./items";
import { url } from "./url";

export type Node = { id: string; label: string; kind: "project" | "type" | "item"; href: string; x: number; y: number; current?: boolean };
export type Edge = { a: string; b: string; kind: "tree" | "ref" };

export const R = { project: 9, type: 6, item: 4 };
export const WIDTH = 640;
export const HEIGHT = 480;
const PAD = { left: 40, right: 210, y: 40 };

const cut = (text: string) => (text.length > 32 ? text.slice(0, 31) + "…" : text);
const short = (title: string) => cut(title.split(":")[0]);

// The site as a network: project → sections → items, plus the references between items.
export async function graph() {
  const all = await items();
  const nodes: Node[] = [{ id: "project", label: "TSOST", kind: "project", href: url(), x: 0, y: 0 }];
  const edges: Edge[] = [];
  for (const type of await types()) {
    nodes.push({ id: type, label: TYPES[type].title, kind: "type", href: url(`${type}/`), x: 0, y: 0 });
    edges.push({ a: "project", b: type, kind: "tree" });
  }
  for (const item of all) {
    nodes.push({ id: item.key, label: short(item.title), kind: "item", href: item.href, x: 0, y: 0, current: item.current });
    const parent = (item.entry.data as { parent?: string }).parent;
    edges.push({ a: parent ? `${item.type}/${parent}` : item.type, b: item.key, kind: "tree" });
    for (const key of item.related) {
      if (!edges.some((e) => e.kind === "ref" && e.a === key && e.b === item.key)) edges.push({ a: item.key, b: key, kind: "ref" });
    }
  }
  // Two items with the same short label (the TESI toolkit and the TESI paper): the one titled longer shows more of its title.
  const leaves = nodes.filter((n) => n.kind === "item");
  for (const n of leaves) {
    const title = all.find((i) => i.key === n.id)!.title;
    if (title !== n.label && leaves.some((m) => m !== n && m.label === n.label)) n.label = cut(title);
  }
  layout(nodes, edges);
  separate(nodes);
  return { nodes, edges };
}

// Force-directed layout (Fruchterman–Reingold), deterministic: same input, same picture.
function layout(nodes: Node[], edges: Edge[]) {
  const k = Math.sqrt((WIDTH * HEIGHT) / nodes.length) * 0.9;
  nodes.forEach((n, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    n.x = Math.cos(a) * 100 * (n.kind === "item" ? 2 : 1);
    n.y = Math.sin(a) * 100 * (n.kind === "item" ? 2 : 1);
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let t = 60;
  for (let step = 0; step < 600; step++) {
    const dx = new Map<Node, number>(nodes.map((n) => [n, 0]));
    const dy = new Map<Node, number>(nodes.map((n) => [n, 0]));
    for (const a of nodes) for (const b of nodes) {
      if (a === b) continue;
      const x = a.x - b.x, y = a.y - b.y, d = Math.max(Math.hypot(x, y), 0.01), f = (k * k) / d;
      dx.set(a, dx.get(a)! + (x / d) * f);
      dy.set(a, dy.get(a)! + (y / d) * f);
    }
    for (const e of edges) {
      const a = byId.get(e.a)!, b = byId.get(e.b)!;
      const x = a.x - b.x, y = a.y - b.y, d = Math.max(Math.hypot(x, y), 0.01), f = (d * d) / k;
      dx.set(a, dx.get(a)! - (x / d) * f); dy.set(a, dy.get(a)! - (y / d) * f);
      dx.set(b, dx.get(b)! + (x / d) * f); dy.set(b, dy.get(b)! + (y / d) * f);
    }
    for (const n of nodes) {
      if (n.kind === "project") continue;
      const x = dx.get(n)!, y = dy.get(n)!, d = Math.max(Math.hypot(x, y), 0.01);
      n.x += (x / d) * Math.min(d, t);
      n.y += (y / d) * Math.min(d, t);
    }
    t = Math.max(t * 0.99, 0.5);
  }
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const w = WIDTH - PAD.left - PAD.right, h = HEIGHT - 2 * PAD.y;
  const s = Math.min(w / (x1 - x0 || 1), h / (y1 - y0 || 1));
  for (const n of nodes) {
    n.x = PAD.left + (n.x - x0) * s + (w - (x1 - x0) * s) / 2;
    n.y = PAD.y + (n.y - y0) * s + (h - (y1 - y0) * s) / 2;
  }
}

// Each node's dot and label as a box. Labels are 11px mono (0.6em a character); sections add letter spacing.
const CHAR = { project: 7.5, type: 7.5, item: 6.6 };
const box = (n: Node) => ({
  x0: n.x - R[n.kind] - 3,
  x1: n.x + R[n.kind] + 6 + n.label.length * CHAR[n.kind],
  y0: n.y - 9,
  y1: n.y + 9,
});

// Push overlapping boxes apart along the shorter overlap, within the frame. TSOST stays put.
function separate(nodes: Node[]) {
  for (let pass = 0; pass < 300; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], p = box(a), q = box(b);
      const ox = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0);
      const oy = Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0);
      if (ox <= 0 || oy <= 0) continue;
      moved = true;
      const [ka, kb] = a.kind === "project" ? [0, 1] : b.kind === "project" ? [1, 0] : [0.5, 0.5];
      if (oy < ox) {
        const d = (a.y < b.y ? -1 : 1) * (oy + 1);
        a.y += d * ka; b.y -= d * kb;
      } else {
        const d = (a.x < b.x ? -1 : 1) * (ox + 1);
        a.x += d * ka; b.x -= d * kb;
      }
    }
    for (const n of nodes) {
      const w = box(n).x1 - n.x;
      n.x = Math.min(Math.max(n.x, 16), WIDTH - w - 4);
      n.y = Math.min(Math.max(n.y, 16), HEIGHT - 16);
    }
    if (!moved) break;
  }
}
