# TSOST: The Sound of Smart Things

PhD research project of Francesco Di Maggio. Tangible interaction and sound design.

This repo: the umbrella site on GitHub Pages. One place to find all project work.

## Content

Published, confirmed work only. Thinking and open questions stay in sessions, the vault and `PLAN.md`.

| Part | |
|---|---|
| Items | One Markdown file per item in `src/content/{papers,tools,workshops,courses}/`; schema per type in `src/content.config.ts` |
| References | `related: ["collection/id"]`; the other side is generated. Unknown keys fail the build |
| Sections | Generated lists; a section with no items is hidden |
| Timeline, Graph | Derived from item dates and references |
| Node | `src/node.ts`: the visitor's browser as a Homie 5 device, opt-in, `tsost/5/{id}` on public shiftr |

## Tools

| Repo | Status | |
|---|---|---|
| [mqtt-max](https://github.com/francesco-di-maggio/mqtt-max) (`~/Documents/GitHub/mqtt-max`) | 0.1.0, unreleased | MQTT for Max: client, broker, send and receive, Homie. Includes the Remote, a web app that sends touch, motion and sound level from phones, tablets and computers. Site: francesco-di-maggio.github.io/mqtt-max |

Other repos in `~/Documents/GitHub` may belong here. Ask before listing them.

## Decisions so far

- Tools keep their own names and repos. TSOST is the umbrella, not a rename.
- Possible later: a GitHub organisation `tsost`, site at `tsost.github.io`, tool repos transferred into it.
- Site technology: Astro (2026-10-14). Same for the personal site.
- Interactive pages can receive live data from the mqtt-max Remote over MQTT (WebSocket).

## Open

- Earlier draft: `~/Documents/PhD/TSOST`, an HTML5 UP template. Usable: title, subtitle ("A research project at the intersection of Tangible Interaction and Sound Design"), handle @fradimaggio. The rest is placeholder.
- Existing Obsidian notes: vault `PhD/` (thesis) and `Publish/TSOST-26/` (course site). Research context and repo map: `~/.claude/tsost.md`.
