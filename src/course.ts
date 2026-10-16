import { getCollection, type CollectionEntry } from "astro:content";
import { url } from "./url";
import { layout, separate, short, type Node, type Edge } from "./graph";
import type { Moment } from "./components/Timeline.astro";

export type Note = CollectionEntry<"course">;

export type Section = "weeks" | "assignments" | "concepts" | "tools" | "resources";

// The course's sections, in nav order: title, the line under it, and the groups its notes are listed under.
// Weeks and assignments have no groups: they are grouped by year.
export const SECTIONS: Record<Section, { title: string; lead: string; groups: string[] }> = {
  weeks: { title: "Schedule", lead: "Weeks, dates and focus.", groups: [] },
  assignments: { title: "Assignments", lead: "What to make and hand in.", groups: [] },
  concepts: { title: "Concepts", lead: "Ideas the course builds on.", groups: ["Sound", "Systems"] },
  tools: { title: "Tools", lead: "Hardware and software used in the course.", groups: ["Hardware", "Software", "Middleware"] },
  resources: { title: "Resources", lead: "References, examples and help.", groups: ["Reference", "Help"] },
};
export const sections = Object.keys(SECTIONS) as Section[];

// "concepts/listening" → its section. The home note has none.
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

// The day a week meets or an assignment is due.
export const dateOf = (n: Note) => n.data.date ?? n.data.due;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// "21 Apr", as in lists.
export const dayMonth = (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
// "Tuesday 21 April 2026", as in facts.
export const fullDate = (d: Date) => `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

// Links in a note's body to other notes: "(/tsost/course/concepts/listening/)" → "concepts/listening".
const linksIn = (n: Note) =>
  [...(n.body ?? "").matchAll(/\(\/[^)]*?\/course\/([a-z0-9-]+\/[a-z0-9-]+)\/\)/g)].map((m) => m[1]);

// Notes that link to this one, as in Obsidian's backlinks.
export async function backlinks(n: Note) {
  return (await notes()).filter((x) => x.id !== n.id && linksIn(x).includes(n.id));
}

// The course as a network: course → sections → notes, plus the links between notes.
export async function courseGraph() {
  const all = await notes();
  const ids = new Set(all.map((n) => n.id));
  const nodes: Node[] = [{ id: "course", label: "Course", kind: "project", href: url("course/"), x: 0, y: 0 }];
  const edges: Edge[] = [];
  for (const s of sections) {
    nodes.push({ id: s, label: SECTIONS[s].title, kind: "type", href: url(`course/${s}/`), x: 0, y: 0 });
    edges.push({ a: "course", b: s, kind: "tree" });
  }
  // A link counts once, whichever note it starts from.
  const linked = new Set<string>();
  for (const n of all) {
    nodes.push({ id: n.id, label: short(n.data.title), kind: "item", href: href(n), x: 0, y: 0 });
    edges.push({ a: section(n), b: n.id, kind: "tree" });
    for (const to of linksIn(n)) {
      const key = [n.id, to].sort().join(" ");
      if (!ids.has(to) || to === n.id || linked.has(key)) continue;
      linked.add(key);
      edges.push({ a: n.id, b: to, kind: "ref" });
    }
  }
  layout(nodes, edges);
  separate(nodes);
  return { nodes, edges };
}

// The run in the notes, in time: weeks and deadlines, newest first.
export async function moments(): Promise<Moment[]> {
  const dated = [...(await notesOf("weeks")), ...(await notesOf("assignments"))].filter((n) => dateOf(n));
  return dated
    .map((n) => ({ date: dateOf(n)!, kind: n.data.date ? "Week" : "Due", title: `${n.data.title}: ${n.data.summary}`, href: href(n), week: Boolean(n.data.date) }))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}
