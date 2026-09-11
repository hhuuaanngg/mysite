# Astro website

This project uses Astro 7, React 19 islands and Tailwind CSS 4. Check the installed
Astro version and relevant official documentation before changing framework APIs.

- Keep the existing Notion-style layout, fonts and original content assets.
- Detail links must end in `/` to match `trailingSlash: "always"`; verify card
  clicks and article previous/next links in the dev server, not just direct URLs.
- Keep both Showcase tab panels mounted. Each list owns its page state; switching
  between works and articles must preserve both page numbers and displayed items.
- Static JSX and Astro components render at build time. Only SiteHeader, Showcase and Contact
  need client hydration. Content parsing and Markdown bodies stay build-only.
- Markdown source files remain under `src/content/articles` and `src/content/works`.
- Read content through `astro:content` collections; render bodies with `render()` and
  `<Content />`. Frontmatter schemas live in `src/lib/content-schemas.ts`. Hydrated
  components only receive metadata, never collection entries or full bodies.
- `render()` headings are the TOC source. The official Unified Markdown processor
  preserves existing anchors and presentation through `src/lib/markdown-plugins.mjs`;
  keep image captions, tables, safe links and Shiki syntax highlighting build-only.
- Use `npm run dev` for the website and local studio together (5680/5681), or Docker
  for 5780/5781. The wrappers supervise Astro directly so agent CLI auto-background
  behavior does not terminate the studio or orphan the browser test server.
- Build through `npm run build` or the studio publisher to preserve selected-draft
  isolation. Exported files stay in `out/`; the local studio is not part of that site.
- Release builds symlink node_modules. Keep Vite caches outside that shared tree
  and ignore `.studio`/`out` in the dev watcher. Test a real build while preview is
  running, then reload and verify all hydrated sections in the running Docker site.
- Run `npm run check`, `npm run lint`, `npm test`, `npm run test:publishing`, and
  `npm run test:preview`, `npm run build`; use `npm run test:e2e` for browser changes.
