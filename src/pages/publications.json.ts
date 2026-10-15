import { itemsOf, venue } from "../items";

// The publications as data, for the personal site: one source for both sites.
export async function GET() {
  const list = (await itemsOf("publications")).map(({ id, entry }) => {
    if (entry.collection !== "publications") throw new Error(`${id} is not a publication`);
    const d = entry.data;
    return {
      id,
      title: d.title,
      authors: d.authors,
      equal: d.equal,
      year: d.year,
      date: d.date,
      venue: venue(d),
      kind: d.kind,
      status: d.status,
      doi: d.doi,
      url: d.links[0],
    };
  });
  return new Response(JSON.stringify(list), { headers: { "Content-Type": "application/json" } });
}
