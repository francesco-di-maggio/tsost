import { getCollection, type CollectionEntry } from "astro:content";
import { url } from "./url";

export const TYPES = {
  papers: { title: "Papers", caption: "Papers, workshops and book chapters, with BibTeX and DOI." },
  tools: { title: "Tools", caption: "Software and toolkits, each in its own repository." },
  courses: { title: "Courses", caption: "Teaching." },
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
  date?: Date;
  year?: number;
  href: string;
  related: string[];
  entry: Entry;
};

const day = (d: Date) => d.toISOString().slice(0, 10);
// A file in public/, or a full URL.
const asset = (path: string) => (/^https?:/.test(path) ? path : `${import.meta.env.BASE_URL.replace(/\/$/, "")}/${path}`);

function label(entry: Entry) {
  switch (entry.collection) {
    case "papers": return `${entry.data.kind} · ${entry.data.year ?? entry.data.status}`;
    case "tools": return entry.data.version;
    case "courses": return `${entry.data.code} · ${entry.data.start.getUTCFullYear()}`;
  }
}

function when(entry: Entry): { date?: Date; year?: number } {
  switch (entry.collection) {
    case "papers": return { date: entry.data.date, year: entry.data.year };
    case "tools": return {};
    case "courses": return { date: entry.data.start, year: entry.data.start.getUTCFullYear() };
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
    href: url(`${entry.collection}/${entry.id}/`),
    related: entry.data.related,
    entry,
    ...when(entry),
  };
}

// Newest first; items without a date last.
const newest = (a: Item, b: Item) =>
  (b.year ?? 0) - (a.year ?? 0) || (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0);

export async function items() {
  const all = (await Promise.all(Object.keys(TYPES).map((t) => getCollection(t as Type)))).flat().map(toItem);
  const keys = new Set(all.map((i) => i.key));
  for (const item of all) {
    for (const key of item.related) if (!keys.has(key)) throw new Error(`${item.key}: related item ${key} does not exist`);
  }
  return all.sort(newest);
}

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

export function facts(entry: Entry): [string, string, string?][] {
  switch (entry.collection) {
    case "papers": {
      const d = entry.data;
      return [
        ["Authors", d.authors.join(", ")],
        ["Venue", d.venue],
        ["Type", d.kind],
        d.year ? ["Year", String(d.year)] : ["Status", d.status ?? ""],
        ...(d.publisher ? [["Publisher", d.publisher] as [string, string]] : []),
        ...(d.doi ? [["DOI", d.doi, `https://doi.org/${d.doi}`] as [string, string, string]] : []),
        ...(d.pdf ? [["PDF", "Download", asset(d.pdf)] as [string, string, string]] : []),
        ...(d.licence ? [["Licence", d.licence] as [string, string]] : []),
        ...d.links.map((l) => ["Link", l.replace(/^https:\/\//, "").replace(/\/$/, ""), l] as [string, string, string]),
        ...(d.note ? [["Note", d.note] as [string, string]] : []),
      ];
    }
    case "tools": {
      const d = entry.data;
      return [
        ["Host", d.host],
        ["Protocol", d.protocol],
        ["Version", d.version],
        ["Licence", d.licence],
        ["Site", d.site.replace(/^https:\/\//, "").replace(/\/$/, ""), d.site],
        ["Repository", d.repository.replace(/^https:\/\//, ""), d.repository],
      ];
    }
    case "courses": {
      const d = entry.data;
      return [
        ["Code", d.code],
        ["Institution", d.institution],
        ["Period", d.period],
        ["Dates", `${day(d.start)} – ${day(d.end)}`],
        ["Teachers", d.teachers.join(", ")],
        ["Site", d.site.replace(/^https:\/\//, ""), d.site],
      ];
    }
  }
}
