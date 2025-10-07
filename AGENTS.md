# Repository Guidelines

## Project Structure & Module Organization
The root directory hosts the production-ready HTML entry points (`index.html`, `01-wall.html`, `02-comment.html`, `03-contributors.html`, `04-artworks.html`, `comment-mobile.html`). Shared behaviour lives in `script.js` (GSAP animations, Supabase access) and styling is split between `styles.css` (desktop) and `mobile.css`. Assets downloaded from Supabase reside in `.database_downloaded/`. Experimental assets and scratch files belong in `.test/` and are excluded from deployment; keep `AGENTS-guide.md` there for historical context only. TypeScript helpers, such as `lib/supabase.ts`, provide the reusable client factory when running scripts outside the browser. Keep new modules close to their page-level consumer; prefer folder-per-page if the file grows beyond one screen.

## Build, Test, and Development Commands
Install dependencies with `npm install`; this pulls Bootstrap and Supabase clients used by the HTML pages. The project ships as static files (no bundler step), so preview locally with `npx http-server . -c-1` or `npx serve .`. Update third-party libraries sparingly; run `npm outdated` before upgrading. When pulling fresh Supabase assets, mirror the structure under `.database_downloaded/` so existing loaders continue to resolve paths.

## Coding Style & Naming Conventions
JavaScript uses 2-space indentation, `const`/`let` declarations, and descriptive lowerCamelCase (`resolvePlanCardTheme`). Keep functions pure where possible and colocate helper constants above their usage. CSS custom properties (see `:root` in `styles.css`) drive theming; extend them instead of hard-coding colours. HTML ids map to animation hooks, so follow the existing `section-panel-*` naming patterns and prefer `data-*` attributes for configuration. Avoid non-ASCII characters unless mirroring external copy.

## Testing Guidelines
There is no automated test harness. Validate pages manually in Chromium and WebKit at 1920px and mobile widths. Confirm Supabase interactions by checking the network panel for `200` responses and consistent payload shapes. The `.test/test.html` sandbox can host prototype widgets before promoting them to production files; annotate the file with TODOs when behaviour diverges from live pages.

## Commit & Pull Request Guidelines
Recent history uses short, lower-case summaries (`filter-alert`, `all error fixed`). Keep future commits in the present imperative mood (`add floor selector`, `refine comment polling`). Reference issue ids with a trailing `(#123)` when available. Pull requests should include: purpose, impacted pages, screenshots for UI changes, and manual test notes (device, browser, Supabase dataset). Request review from at least one maintainer before merging and squash merge unless a feature branch captures a long-running effort.

## Security & Configuration Tips
Local development needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Store them in environment variables or a non-committed `.env` file; never hard-code production secrets. If you download Supabase storage files, keep public assets under `.database_downloaded/` and redact private data before committing.
