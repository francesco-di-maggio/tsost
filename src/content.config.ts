import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Related items are named "collection/id", e.g. "publications/tei25-decentralized-tuis".
const base = {
  title: z.string(),
  summary: z.string(),
  related: z.array(z.string()).default([]),
};

const load = (name: string) => glob({ pattern: "**/*.md", base: `./src/content/${name}` });

const publications = defineCollection({
  loader: load("publications"),
  schema: z.object({
    ...base,
    authors: z.array(z.string()),
    venue: z.string(),
    kind: z.string(),
    year: z.number().optional(),
    status: z.string().optional(),
    date: z.coerce.date().optional(),
    publisher: z.string().optional(),
    doi: z.string().optional(),
    pdf: z.string().optional(),
    links: z.array(z.url()).default([]),
    licence: z.string().optional(),
    key: z.string(),
    note: z.string().optional(),
  }),
});

// TESI: the toolkit. Each part sits in one layer; nodes have numbered iterations.
const tesi = defineCollection({
  loader: load("tesi"),
  schema: z.object({
    ...base,
    layer: z.enum(["thing", "smart", "sound"]),
    iteration: z.number().optional(),
    status: z.enum(["current", "exploring", "earlier"]),
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
    specs: z.array(z.tuple([z.string(), z.string()])).default([]),
    repository: z.url().optional(),
    site: z.url().optional(),
  }),
});

const courses = defineCollection({
  loader: load("courses"),
  schema: z.object({
    ...base,
    code: z.string(),
    institution: z.string(),
    period: z.string(),
    status: z.enum(["planned"]).optional(),
    teachers: z.array(z.string()).default([]),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    site: z.url().optional(),
  }),
});

export const collections = { publications, tesi, courses };
