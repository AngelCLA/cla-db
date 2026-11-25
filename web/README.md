# CLA DB landing site

Public landing page for CLA DB (`@clatech/db`). React 19 + TypeScript, built with Vite, isolated from the published package.

## Commands

```sh
npm install
npm run dev      # development server on http://127.0.0.1:4321
npm run build    # type-check plus production bundle into dist/
npm run preview  # serve the production build on http://127.0.0.1:4321
npm run check    # structural and design-token verification
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

1. Every section of the chosen artboard is present with its Spanish copy and anchors (`#caracteristicas`, `#arquitectura`, `#documentacion`).
2. Every color in `src/styles/tokens.css` exists in `design/system.md`, and colors used only by the artboard never leak into the tokens.

## Layout

```
src/
  App.tsx              section composition
  content.ts           landing copy (Spanish) and data
  styles/tokens.css    design tokens from design/system.md
  styles/global.css    reset, primitives (.button, .surface, .section, .kicker)
  components/          Header, Hero, CoreIllustration, StackBar, Features,
                       Architecture, Docs, CodeWindow, Footer
scripts/               headless render and token verification
```
