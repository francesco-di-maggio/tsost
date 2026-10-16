import { getCollection, type CollectionEntry } from "astro:content";
import { url } from "./url";
import { layout, separate, short, type Node, type Edge } from "./graph";

export type Note = CollectionEntry<"course">;

export const SECTIONS = {
  weeks: "Schedule",
  assignments: "Assignments",
  concepts: "Concepts",
  tools: "Tools",
  resources: "Resources",
} as const;

// The groups in each section, in order. Weeks and assignments are grouped by year instead.
export const GROUPS: Partial<Record<keyof typeof SECTIONS, string[]>> = {
  concepts: ["Sound", "Systems"],
  tools: ["Hardware", "Software", "Middleware"],
  resources: ["Reference", "Help"],
};

// The line under each section's title.
export const LEADS: Record<keyof typeof SECTIONS, string> = {
  weeks: "Weeks, dates and focus.",
  assignments: "What to make and hand in.",
  concepts: "Ideas the course builds on.",
  tools: "Hardware and software used in the course.",
  resources: "References, examples and help.",
};

export type Section = keyof typeof SECTIONS;

// "concepts/listening" → section and slug. The home note has no section.
export const section = (n: Note) => n.id.split("/")[0] as Section;
export const href = (n: Note) => url(`course/${n.id}/`);

export async function notes() {
  return (await getCollection("course")).filter((n) => n.id !== "home");
}

// Numbered sections by number, the others by title.
export async function notesOf(s: Section) {
  return (await notes())
    .filter((n) => section(n) === s)
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

// Links in a note's body to other notes: "/tsost/course/concepts/listening/" → "concepts/listening".
const linksIn = (n: Note) =>
  [...(n.body ?? "").matchAll(/\(\/[^)]*?\/course\/([a-z0-9-]+\/[a-z0-9-]+)\/\)/g)].map((m) => m[1]);

// Notes that link to this one, as in Obsidian's backlinks.
export async function backlinks(n: Note) {
  return (await notes()).filter((x) => x.id !== n.id && linksIn(x).includes(n.id));
}

// The course as a network: course → sections → notes, plus the links between notes.
export async function courseGraph() {
  const all = await notes();
  const nodes: Node[] = [{ id: "course", label: "Course", kind: "project", href: url("course/"), x: 0, y: 0 }];
  const edges: Edge[] = [];
  for (const s of Object.keys(SECTIONS) as Section[]) {
    nodes.push({ id: s, label: SECTIONS[s], kind: "type", href: url(`course/${s}/`), x: 0, y: 0 });
    edges.push({ a: "course", b: s, kind: "tree" });
  }
  const ids = new Set(all.map((n) => n.id));
  for (const n of all) {
    nodes.push({ id: n.id, label: short(n.data.title), kind: "item", href: href(n), x: 0, y: 0 });
    edges.push({ a: section(n), b: n.id, kind: "tree" });
    for (const to of new Set(linksIn(n))) {
      if (!ids.has(to) || to === n.id) continue;
      if (!edges.some((e) => e.kind === "ref" && ((e.a === to && e.b === n.id) || (e.a === n.id && e.b === to)))) edges.push({ a: n.id, b: to, kind: "ref" });
    }
  }
  layout(nodes, edges);
  separate(nodes);
  return { nodes, edges };
}

// "Tuesday 21/04/2026, 13:30–17:00h" → that day.
const day = (text?: string) => {
  const m = text?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) : undefined;
};
const fact = (n: Note, key: string) => n.data.facts.find(([k]) => k === key)?.[1];

import type { Moment } from "./components/Timeline.astro";

// The course in time: weeks, deadlines and runs, newest first.
export async function moments(runs: { date: Date; end?: Date; title: string; planned: boolean }[]) {
  const list: Moment[] = [];
  for (const n of await notesOf("weeks")) {
    const date = day(fact(n, "Date"));
    if (date) list.push({ date, kind: "Week", title: [n.data.title, fact(n, "Focus")].filter(Boolean).join(": "), href: href(n), week: true });
  }
  for (const n of await notesOf("assignments")) {
    const date = day(fact(n, "Due"));
    if (date) list.push({ date, kind: "Due", title: [n.data.title, fact(n, "Task")].filter(Boolean).join(": "), href: href(n) });
  }
  for (const r of runs) list.push({ date: r.date, end: r.end, kind: r.planned ? "Next run" : "Run", title: r.title, href: url("course/") });
  return list.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
