import { TYPES, authors, items } from "../items";
import { SECTIONS, href, notes, section } from "../course";

// One entry per work, publication, course edition and course note. `find` is what the search matches; it is not shown.
export async function GET() {
  const list: { type: string; title: string; text: string; href: string; find: string }[] = (await items()).map((i) => {
    const d = i.entry.data as { authors?: string[]; equal?: number; venue?: string };
    return {
      type: TYPES[i.type].one,
      title: i.title,
      text: i.summary,
      href: i.href,
      find: [i.title, i.summary, i.kind, d.authors && authors({ authors: d.authors, equal: d.equal }), d.venue, i.entry.body].join(" "),
    };
  });
  for (const n of await notes()) {
    list.push({
      type: `Course · ${SECTIONS[section(n)]}`,
      title: n.data.title,
      text: n.data.summary,
      href: href(n),
      find: [n.data.title, n.data.summary, n.body].join(" "),
    });
  }
  return new Response(JSON.stringify(list), { headers: { "Content-Type": "application/json" } });
}
