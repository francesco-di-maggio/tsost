import { getCollection, type CollectionEntry } from "astro:content";
import { url } from "./url";

export const TYPES = {
  works: { one: "Work", title: "Works", caption: "Tools and toolkits, by layer." },
  publications: { one: "Publication", title: "Publications", caption: "Papers, workshops and book chapters." },
  courses: { one: "Course", title: "Course", caption: "The Sound of Smart Things, elective at TU/e Industrial Design." },
} as const;

export type Type = keyof typeof TYPES;
export type Entry = CollectionEntry<Type>;

export type Item = {
  key: string;
  type: Type;
  id: string;
  title: string;
  summary: string;
  label: string;
  kind: string;
  end?: Date;
  current: boolean;
  date?: Date;
  year?: number;
  href: string;
  // True when the item links to another site instead of a page here.
  away: boolean;
  related: string[];
  entry: Entry;
};

const day = (d: Date) => d.toISOString().slice(0, 10);
const month = (d: Date) => d.toISOString().slice(0, 7);
const strip = (u: string) => u.replace(/^https:\/\//, "").replace(/\/$/, "");
// A file in public/, or a full URL.
const asset = (path: string) => (/^https?:/.test(path) ? path : `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path}`);

// The toolkit, then its layers, as in the TEI '26 paper (hardware, middleware, software) and the thesis chapters.
export const LAYERS = {
  toolkit: { title: "Toolkit" },
  node: { title: "Node" },
  network: { title: "Network" },
  mapping: { title: "Mapping" },
  comparison: { title: "Comparison" },
} as const;
export type Layer = keyof typeof LAYERS;

function kind(entry: Entry) {
  switch (entry.collection) {
    case "publications": return `${entry.data.short} · ${entry.data.kind}`;
    case "works": return [LAYERS[entry.data.layer].title, entry.data.status].filter(Boolean).join(" · ");
    case "courses": return [entry.data.start.getUTCFullYear(), entry.data.status].filter(Boolean).join(" · ");
  }
}

function label(entry: Entry) {
  switch (entry.collection) {
    case "publications": return [entry.data.kind, entry.data.year, entry.data.status].filter(Boolean).join(" · ");
    case "works": return kind(entry);
    case "courses": return [entry.data.code, entry.data.start.getUTCFullYear(), entry.data.status].filter(Boolean).join(" · ");
  }
}

// When an item starts, and, for periods, when it ends. A current period runs to today.
function when(entry: Entry): { date?: Date; year?: number; end?: Date } {
  switch (entry.collection) {
    case "publications": return { date: entry.data.date, year: entry.data.year };
    case "works": {
      const { start, end, status } = entry.data;
      if (!start) return {};
      return { date: start, year: start.getUTCFullYear(), end: end ?? (status === "current" ? new Date() : undefined) };
    }
    case "courses": return { date: entry.data.start, year: entry.data.start.getUTCFullYear(), end: entry.data.end };
  }
}

function toItem(entry: Entry): Item {
  return {
    key: `${entry.collection}/${entry.id}`,
    type: entry.collection,
    id: entry.id,
    title: entry.data.title,
    summary: entry.data.summary,
    label: label(entry),
    kind: kind(entry),
    current: entry.collection === "works" && entry.data.status === "current",
    href: ("href" in entry.data && entry.data.href) || (entry.collection === "courses" ? url("course/") : url(`${entry.collection}/${entry.id}/`)),
    related: entry.data.related,
    // Course editions open the course site; documented works open their own site.
    away: entry.collection === "courses" || ("href" in entry.data && !!entry.data.href),
    entry,
    ...when(entry),
  };
}

// Newest first. A year without a date counts as the end of that year; no year at all sorts last.
const time = (i: Item) => i.date?.valueOf() ?? (i.year ? Date.UTC(i.year, 11, 31) : 0);
const newest = (a: Item, b: Item) => time(b) - time(a);

export async function items() {
  const all = (await Promise.all(Object.keys(TYPES).map((t) => getCollection(t as Type)))).flat().map(toItem);
  const keys = new Set(all.map((i) => i.key));
  for (const item of all) {
    for (const key of item.related) if (!keys.has(key)) throw new Error(`${item.key}: related item ${key} does not exist`);
  }
  return all.sort(newest);
}

// Where a section lives: the course is its own site.
export const sectionPath = (type: Type) => (type === "courses" ? "course/" : `${type}/`);

export async function itemsOf(type: Type) {
  return (await items()).filter((i) => i.type === type);
}

export async function types() {
  const all = await items();
  return (Object.keys(TYPES) as Type[]).filter((t) => all.some((i) => i.type === t));
}

// Related in both directions: what an item names, and what names it.
export async function related(item: Item) {
  const all = await items();
  return all.filter((i) => i.key !== item.key && (item.related.includes(i.key) || i.related.includes(item.key)));
}

// Authors, with * after those who contributed equally.
// Conferences: short name, year and place. Without a place (a book), the full venue.
export const venue = (d: { short: string; year?: number; place?: string; venue: string }) =>
  d.place ? `${d.short} '${String(d.year).slice(2)}, ${d.place}` : d.venue;

export const authors = (d: { authors: string[]; equal?: number }) =>
  d.authors.map((a, n) => (d.equal && n < d.equal ? `${a}*` : a)).join(", ");

export function facts(entry: Entry): [string, string, string?][] {
  switch (entry.collection) {
    case "publications": {
      const d = entry.data;
      return [
        ["Authors", authors(d)],
        ["Venue", d.venue],
        ["Type", d.kind],
        ...(d.year ? [["Year", String(d.year)] as [string, string]] : []),
        ...(d.status ? [["Status", d.status] as [string, string]] : []),
        ...(d.publisher ? [["Publisher", d.publisher] as [string, string]] : []),
        ...(d.doi ? [["DOI", d.doi, `https://doi.org/${d.doi}`] as [string, string, string]] : []),
        ...(d.pdf ? [["PDF", "Download", asset(d.pdf)] as [string, string, string]] : []),
        ...(d.licence ? [["Licence", d.licence] as [string, string]] : []),
        ...d.links.map((l) => ["Link", l.replace(/^https:\/\//, "").replace(/\/$/, ""), l] as [string, string, string]),
        ...(d.equal ? [["Note", "* Equal contribution."] as [string, string]] : []),
        ...(d.note ? [["Note", d.note] as [string, string]] : []),
      ];
    }
    case "works": {
      const d = entry.data;
      const to = d.end ? month(d.end) : d.status === "current" ? "present" : undefined;
      const period = d.start && (to ? `${month(d.start)} – ${to}` : month(d.start));
      return [
        ...(d.layer !== "toolkit" ? [["Layer", LAYERS[d.layer].title] as [string, string]] : []),
        ...(d.iteration ? [["Iteration", String(d.iteration)] as [string, string]] : []),
        ...(d.status ? [["Status", d.status[0].toUpperCase() + d.status.slice(1)] as [string, string]] : []),
        ...(period ? [["Period", period] as [string, string]] : []),
        ...d.specs,
        ...(d.site ? [["Site", strip(d.site), d.site] as [string, string, string]] : []),
        ...(d.repository ? [["Repository", strip(d.repository), d.repository] as [string, string, string]] : []),
      ];
    }
    case "courses": {
      const d = entry.data;
      return [
        ["Code", d.code],
        ["Institution", d.institution],
        ["Period", d.period],
        ...(d.status ? [["Status", "Planned"] as [string, string]] : []),
        ["Dates", d.end ? `${day(d.start)} – ${day(d.end)}` : `From ${month(d.start)}`],
        ...(d.teachers.length ? [["Teachers", d.teachers.join(", ")] as [string, string]] : []),
        ...(d.site ? [["Site", strip(d.site), d.site] as [string, string, string]] : []),
      ];
    }
  }
}
