import { itemsOf, type Item, type Layer } from "./items";

type Part = { layer: Layer; status: string; iteration?: number };
export const part = (i: Item) => i.entry.data as Part;

const RANK: Record<string, number> = { current: 0, exploring: 1, earlier: 2 };
// Current, then exploring, then earlier; later iterations first.
const order = (a: Item, b: Item) =>
  RANK[part(a).status] - RANK[part(b).status] || (part(b).iteration ?? 0) - (part(a).iteration ?? 0);

export async function partsOf(layer: Layer) {
  return (await itemsOf("tesi")).filter((i) => part(i).layer === layer).sort(order);
}

// The title already names the iteration (Node v3).
export const partLabel = (i: Item) => part(i).status;
