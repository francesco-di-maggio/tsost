import { TYPES, items, types } from "./items";
import { url } from "./url";

export type Node = { id: string; label: string; kind: "project" | "type" | "item"; href: string; x: number; y: number; current?: boolean };
export type Edge = { a: string; b: string; kind: "tree" | "ref" };

export const WIDTH = 640;
export const HEIGHT = 480;
const PAD = { left: 40, right: 210, y: 40 };

const short = (title: string) => {
  const head = title.split(":")[0];
  return head.length > 32 ? head.slice(0, 31) + "…" : head;
};

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
    edges.push({ a: item.type, b: item.key, kind: "tree" });
    for (const key of item.related) {
      if (!edges.some((e) => e.kind === "ref" && e.a === key && e.b === item.key)) edges.push({ a: item.key, b: key, kind: "ref" });
    }
  }
  layout(nodes, edges);
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
