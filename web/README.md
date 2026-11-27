# CLA DB website

Public landing and Spanish documentation for CLA DB (`@clatech/db`). React 19 + TypeScript, built with Vite, isolated from the published package.

## Commands

```sh
npm install
npm run dev      # development server on http://127.0.0.1:4321
npm run build    # type-check plus production bundle into dist/
npm run preview  # serve the production build on http://127.0.0.1:4321
npm run check    # rendered pages, design tokens, and runnable examples
```

## Design source

The implementation follows `design/cla-db-landing/04-replica-espanol.html` for layout, sections and copy, with every color, font, spacing step and radius taken from `design/system.md`.

Mapping notes:

- Page background is `#0D0F18`, the recorded dark surface. Cards and panels use the documented card rule: background equal to the base background plus a 1px border in the `#20293C` tone.
- The accent is `#ED168F`, and the isometric illustration uses the brand gradient `#ED168F` to `#752a8a`. The reference site's brighter pink and warmer near-black are not part of the project tokens.
- Typography is the project monospace stack (`Atkinson Hyperlegible Mono` with system fallbacks). The reference artboard used a sans-serif display face.
- Radii are limited to the recorded values: `8px` for buttons, `4px` for small tiles and badges, square corners for cards.
- The design system records no shadow tokens, so the page ships none.

## Verification

`npm run check` renders the React tree in Node and asserts:

1. Every section of the chosen artboard is present with its Spanish copy and anchors (`#instalacion`, `#caracteristicas`, `#arquitectura`, `#documentacion`).
2. Every color in `src/styles/tokens.css` exists in `design/system.md`, and colors used only by the artboard never leak into the tokens.
3. The install selector keeps its contract: `src/install.ts` exposes exactly the npm, pnpm, Bun, Yarn, and Deno commands for the single `@clatech/db` package, arrow/Home/End movement resolves to the expected target, copying writes the selected command exactly once, a missing clipboard reports `unavailable`, and a rejected write reports `failed`. The rendered markup has one labelled tablist, one selected tab in the tab order, `aria-controls` per tab, a labelled panel, and a polite status region.
4. The landing menu opens `/docs`, the documentation header links back to landing sections, and Open Graph identifies the published `0.1.3` release.
5. The documentation sidebar points to real sections, and the displayed examples execute with the CLA DB package.

Limitation: the check runs in Node without a DOM, so it verifies the selector logic and the rendered ARIA contract, not real browser focus movement or the system clipboard. Keyboard interaction and clipboard behaviour in a browser need manual or browser-run verification.

Install commands live in `src/install.ts` and are mirrored in the repository `README.md`. Change both together.

## Direct links and Vercel

Vite emits independent `dist/index.html` and `dist/docs.html` entries. With Vercel's project root set to `web/` and the Vite output set to `dist`, `vercel.json` maps `/docs` to the documentation HTML without changing the landing route.

After building and starting `npm run preview`, check the production assets locally. Run the same check against the Vercel Preview URL for the revision under review:

```sh
npm run check:routes -- http://127.0.0.1:4321
npm run check:routes -- https://<your-preview>.vercel.app
```

In the browser, paste `/docs#dexie` directly into the address bar and confirm the Dexie heading is visible. Then navigate to another section from the sidebar.

## Layout

```
src/
  App.tsx              section composition
  content.ts           landing copy (Spanish) and data
  install.ts           install commands and selector logic
  docs-main.tsx        documentation entry and shared site chrome
  docs/                Spanish guides and sidebar
  styles/tokens.css    design tokens from design/system.md
  styles/global.css    reset, primitives (.button, .surface, .section, .kicker)
  components/          Header, Hero, CoreIllustration, StackBar, Install, Features,
                       Architecture, Docs, CodeWindow, Footer
scripts/               headless render and token verification
```
