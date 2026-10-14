import { itemsOf, type Item, type Stage } from "./items";

type Part = { stages: Stage[]; status: string; iteration?: number };
export const part = (i: Item) => i.entry.data as Part;

const RANK: Record<string, number> = { current: 0, exploring: 1, earlier: 2 };
const first = (i: Item) => ["node", "network", "mapping", "sound"].indexOf(part(i).stages[0]);
// In signal order by first stage; within it current, then exploring, then earlier; later iterations first.
const order = (a: Item, b: Item) =>
  first(a) - first(b) || RANK[part(a).status] - RANK[part(b).status] || (part(b).iteration ?? 0) - (part(a).iteration ?? 0);

export async function parts() {
  return (await itemsOf("tesi")).sort(order);
}

export const partLabel = (i: Item) => [part(i).iteration && `v${part(i).iteration}`, part(i).status].filter(Boolean).join(" · ");
