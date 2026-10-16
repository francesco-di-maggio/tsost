import { getCollection, type CollectionEntry } from "astro:content";
import { url } from "./url";

export type Note = CollectionEntry<"course">;

export const SECTIONS = {
  weeks: "Weeks",
  assignments: "Assignments",
  concepts: "Concepts",
  tools: "Tools",
  resources: "Resources",
} as const;
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
