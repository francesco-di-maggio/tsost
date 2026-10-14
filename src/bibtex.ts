import type { CollectionEntry } from "astro:content";

export function bibtex({ data }: CollectionEntry<"papers">) {
  const fields: [string, string | undefined][] = [
    ["title", data.title],
    ["author", data.authors.map(lastFirst).join(" and ")],
    ["booktitle", data.venue],
    ["publisher", data.publisher],
    ["year", String(data.year)],
    ["doi", data.doi],
  ];
  const body = fields.filter(([, v]) => v).map(([k, v]) => `  ${k} = {${v}}`).join(",\n");
  return `@inproceedings{${data.key},\n${body}\n}`;
}

function lastFirst(name: string) {
  const parts = name.split(" ");
  const i = parts.findIndex((p, n) => n > 0 && /^[a-z]/.test(p));
  const split = i > 0 ? i : parts.length - 1;
  return `${parts.slice(split).join(" ")}, ${parts.slice(0, split).join(" ")}`;
}
