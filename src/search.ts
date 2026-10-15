import { url } from "./url";

type Entry = { type: string; title: string; text: string; href: string; find: string };

const MAX = 8;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

let index: Promise<(Entry & { key: string })[]> | undefined;

function load() {
  index ??= fetch(url("search.json").replace(/\/$/, ""))
    .then((r) => r.json() as Promise<Entry[]>)
    .then((all) => all.map((e) => ({ ...e, key: fold(`${e.title} ${e.find}`) })));
  return index;
}

// Every word of the query must appear somewhere in the entry.
async function find(query: string) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return (await load()).filter((e) => words.every((w) => e.key.includes(w))).slice(0, MAX);
}

function row(e: Entry) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.className = "row";
  a.href = e.href;
  const text = document.createElement("span");
  text.className = "text";
  const b = document.createElement("b");
  b.textContent = e.title;
  const sub = document.createElement("span");
  sub.className = "sub";
  sub.textContent = e.text;
  text.append(b, sub);
  const label = document.createElement("span");
  label.className = "label";
  label.textContent = e.type;
  a.append(text, label);
  li.append(a);
  return li;
}

export function startSearch() {
  const panel = document.getElementById("search")!;
  const input = document.getElementById("search-input") as HTMLInputElement;
  const results = document.getElementById("search-results")!;
  const button = document.getElementById("search-open")!;

  function open() {
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    input.focus();
    input.select();
    load();
  }

  function close() {
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  async function render() {
    const query = input.value;
    const found = await find(query);
    if (input.value !== query) return;
    results.replaceChildren(...found.map(row));
    if (query.trim() && !found.length) {
      const li = document.createElement("li");
      li.className = "none";
      li.textContent = "No results.";
      results.append(li);
    }
  }

  button.addEventListener("click", () => (panel.hidden ? open() : close()));
  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Enter") results.querySelector("a")?.click();
  });
  document.addEventListener("keydown", (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    if (e.key === "/" && !typing) { e.preventDefault(); open(); }
    if (e.key === "Escape") close();
  });
  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target as Node) && !button.contains(e.target as Node)) close();
  });
  document.addEventListener("astro:after-swap", close);
}
