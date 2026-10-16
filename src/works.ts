import { LAYERS, itemsOf, type Item, type Layer } from "./items";

type Work = { layer: Layer; parent?: string; status?: string; iteration?: number };
export const work = (i: Item) => i.entry.data as Work;

const RANK: Record<string, number> = { current: 0, exploring: 1, earlier: 2 };
// Current, then exploring, then earlier, then without status; later iterations first.
const order = (a: Item, b: Item) =>
  (RANK[work(a).status ?? ""] ?? 3) - (RANK[work(b).status ?? ""] ?? 3) || (work(b).iteration ?? 0) - (work(a).iteration ?? 0);

// Works of one parent (none: the top level), grouped by layer, in layer order. Empty layers are left out.
export async function byLayer(parent?: string) {
  const list = (await itemsOf("works")).filter((i) => work(i).parent === parent);
  return (Object.keys(LAYERS) as Layer[])
    .map((layer) => ({ layer, title: LAYERS[layer].title, items: list.filter((i) => work(i).layer === layer).sort(order) }))
    .filter((g) => g.items.length > 0);
}
