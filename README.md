# TSOST: The Sound of Smart Things

Site of the PhD research by Francesco Di Maggio, Industrial Design, TU/e: works, publications, courses, a timeline and a graph. The visitor's browser can join as a node (Homie 5 over MQTT).

Live: [francescodimaggio.nl/tsost](https://francescodimaggio.nl/tsost/)

## Build

```sh
npm install
npm run dev     # local preview
npm run build   # static site in dist/
```

Built with [Astro](https://astro.build). Deployed to GitHub Pages on every push to `main`. Content is one Markdown file per item in `src/content/`.
