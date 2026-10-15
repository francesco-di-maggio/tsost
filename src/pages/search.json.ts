import { TYPES, authors, items } from "../items";

// One entry per TESI part, publication and course. `find` is what the search matches; it is not shown.
export async function GET() {
  const list = (await items()).map((i) => {
    const d = i.entry.data as { authors?: string[]; equal?: number; venue?: string };
    return {
      type: TYPES[i.type].one,
      title: i.title,
      text: i.summary,
      href: i.href,
      find: [i.title, i.summary, i.kind, d.authors && authors({ authors: d.authors, equal: d.equal }), d.venue, i.entry.body].join(" "),
    };
  });
  return new Response(JSON.stringify(list), { headers: { "Content-Type": "application/json" } });
}
