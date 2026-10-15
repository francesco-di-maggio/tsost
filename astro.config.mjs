import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://francescodimaggio.nl",
  base: "/tsost",
  trailingSlash: "always",
  // mqtt is imported only on Connect; pre-bundle it so the dev server finds it.
  vite: { optimizeDeps: { include: ["mqtt"] } },
});
