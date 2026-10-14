import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Related items are named "collection/id", e.g. "papers/tei25-decentralized-tuis".
const base = {
  title: z.string(),
  summary: z.string(),
  related: z.array(z.string()).default([]),
};

const load = (name: string) => glob({ pattern: "**/*.md", base: `./src/content/${name}` });

const papers = defineCollection({
  loader: load("papers"),
  schema: z.object({
    ...base,
    authors: z.array(z.string()),
    venue: z.string(),
    kind: z.string(),
    year: z.number(),
    date: z.coerce.date().optional(),
    publisher: z.string().optional(),
    doi: z.string().optional(),
    pdf: z.string().optional(),
    key: z.string(),
    note: z.string().optional(),
  }),
});

const tools = defineCollection({
  loader: load("tools"),
  schema: z.object({
    ...base,
    host: z.string(),
    protocol: z.string(),
    version: z.string(),
    licence: z.string(),
    site: z.url(),
    repository: z.url(),
  }),
});

const workshops = defineCollection({
  loader: load("workshops"),
  schema: z.object({
    ...base,
    venue: z.string(),
    format: z.string(),
    date: z.coerce.date(),
  }),
});

const courses = defineCollection({
  loader: load("courses"),
  schema: z.object({
    ...base,
    code: z.string(),
    institution: z.string(),
    period: z.string(),
    teachers: z.array(z.string()),
    start: z.coerce.date(),
    end: z.coerce.date(),
    site: z.url(),
  }),
});

export const collections = { papers, tools, workshops, courses };
