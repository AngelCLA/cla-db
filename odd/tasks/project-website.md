# Project Website (CLA DB)

Public website for `@clatech/db` (CLA DB): a landing page in a new repo directory plus rebranding of the existing docs site.

## Specs

- S1: "Necesitamos una web para el proyecto." (original request; scope resolved as landing + docs rebrand)
- S2: Scope = "Ambas" — landing for the fork and rebranding of the `docs-src` Docusaurus site to the CLA DB identity.
- S3: Location = "Nuevo dir en el repo" — the landing lives in a new directory (e.g. `web/`), not inside `docs-src/`; `src/` untouched.
- S4: Design follows the captured project design system (`design/system.md`): dark scheme (`#0D0F18`), primary `#ED168F`, gradient `#ED168F → #b2218b → #752a8a`, monospace type, square-corner components.
- S5: Landing content is honest to the fork's facts: minimal Apache 2.0 fork of RxDB (base `17.6.0+522`), package `@clatech/db` v0.1.0, removed only the `COL23` collection limit, public API and on-disk compatibility preserved, verification suite with 14/20/50/100-collection benchmarks, planned external adapters (Cloudflare D1, R2, SQLite, OPFS).
- S6: Docs rebrand preserves the Docusaurus build (`npm run docs:build` keeps working) and only touches `docs-src/`, never the generated `/docs`.
- S7: Landing copy is in Spanish (user decision); code comments, commit messages and repository-facing docs stay in English. Copy uses neutral Spanish, no Argentine voseo (user correction).
- S8: Primary design direction is a faithful replica of the user's reference site `cla-db.lonemerit8.chatgpt.site` (artboard `04-replica-espanol.html`): dark background, bright pink accent, sans-serif headlines with monospace kicker/badge/caption accents, isometric stacked-plates illustration, "STACK NATIVO" bar, feature cards. The site could not be fetched (HTTP 401 behind Cloudflare), so below-the-fold sections (Arquitectura, Documentación, footer) are reconstructed from fork facts and remain subject to user correction with screenshots.

- S9: "que el hero se parezca a este /home/claangel/Imágenes/Capturas de pantalla/Captura desde 2026-11-25 01-58-42.png"

- S10: "Manten la escencia que llevamos hacia el momento. pero hay que agregar mas info como la que esta en la landing de rxdb. https://rxdb.info/"

## Tasks

- T1 (S4): Capture design system to `design/system.md` + `design/system.html`. Route: inline. Commit: with T4 landing slice.
- T2 (S1, S4, S5, S8): Design landing artboards under `design/cla-db-landing/` (01-03 original directions, 04 replica of the reference). Route: inline. Commit: with T4 landing slice.
- T3 (S1): Canvas validation with the user; chosen artboard `04-replica-espanol.html`. Route: user decision. Commit: n/a. DONE.
- T4 (S1-S5, S7, S8): Implement landing in `web/` (React 19 + TypeScript + Vite). Route: inline (isolated new app, no independent units). Commit: pending. DONE, verification recorded in Log L7.
- T5 (S2, S6): Rebrand `docs-src` to CLA DB. Route: inline or writer per triggers. Commit: separate slice. PENDING.
- T6 (S9): Refine only the implemented hero to match the supplied screenshot. Route: bounded writer. Commit: none. DONE; automated evidence in L10, visual comparison remains manual.
- T7 (S10): Expand the Spanish landing with relevant technical information inspired by the upstream landing while preserving the current design. Route: bounded discovery and implementation. Commit: none. DONE; evidence in L12.
- T8 (S7): Neutralize the landing Spanish: replace Argentine voseo with neutral impersonal/tuteo forms in `web/` copy and its render checks. Route: inline. Commit: none. DONE; evidence in L14.

## Log

- L1: User request verbatim: "Necesitamos una web para el proyecto."
- L2: User decisions: type = "Ambas" (landing + docs rebrand); location = "Nuevo dir en el repo".
- L3: Design system sync ran from 4 sources (`docs-src/src/css/custom.css`, collapse-button and search-bar styles, `examples/ionic/src/theme/variables.css`); 20 color tokens, 8 type steps, 3 radii recorded; fonts approximated with system monospace stack because the base64 font cannot be referenced from artboards.
- L4: Fork facts gathered from `UPSTREAM.md`, `ROADMAP.md`, `AGENTS.md`; root `package.json` confirms identity `@clatech/db` `0.1.1` with `claDb.upstreamVersion` `17.6.0`.
- L5: User shared reference site `cla-db.lonemerit8.chatgpt.site` (screenshot) and decided: faithful replica as artboard + landing copy in Spanish. Direct fetch failed (Cloudflare challenge), so artboard 04 replicates the visible hero/stack bar/features verbatim and reconstructs the below-fold sections from fork facts; pending user screenshots to correct any divergence.
- L6: Handoff received for `cla-db-landing/04-replica-espanol.html` (chosen artboard). T4 opened: implementation in `web/` with the project stack (React 19.3.1, TypeScript 6.0.3, Vite 8.3.8, following `examples/vite-vanilla-ts`). Artboard mapped to components, not copied: `Header`, `Hero`, `CoreIllustration`, `StackBar`, `Features`, `Architecture`, `Docs`, `CodeWindow`, `Footer`, copy in `src/content.ts`.
- L7: T4 verification. `npm run build` (tsc --noEmit + vite build) passes; `npm run check` renders the tree in Node and asserts 30 copy strings, 3 anchors, and 16 color tokens against `design/system.md`. RED observed for the token guard by temporarily injecting `#FF2E9E` (artboard-only color): the check failed with 2 findings, then passed after revert. Preview server: http://127.0.0.1:4321/.
- L8: Documented deviation: the artboard's invented visual values (bright pink `#FF2E9E`, near-black `#0B0709`, Inter display type, 10-16px radii) were replaced by project tokens (`#ED168F`, `#0D0F18`, monospace stack, 8px/4px radii, no shadows) per the handoff instruction and S4. Below-fold sections still pending user screenshots.
- L9: "que el hero se parezca a este /home/claangel/Imágenes/Capturas de pantalla/Captura desde 2026-11-25 01-58-42.png"
- L10: T6 uses a desktop-scale sans headline, mono badge and caption, token-based buttons and palette, and a static four-plate SVG wireframe. The example CTA now navigates to `#ejemplo`. The structural CTA test failed before the change and passed after it. Landing check and build passed, and the loopback preview served the new build. Repository lint, type check, build, and fast memory suite passed (1,895 tests) after web-only lint fixes. Browser screenshot comparison was not available in the environment.
- L11: "Manten la escencia que llevamos hacia el momento. pero hay que agregar mas info como la que esta en la landing de rxdb. https://rxdb.info/"
- L12: T7 adds four Spanish sections after the feature cards: offline workflow, Sync Engine, RxStorage choices, and schema/query/migration concepts. The hero and artboards are unchanged. The four related documentation links returned HTTP 200. Render checks observed RED before implementation and GREEN after; the web build and repository lint, type check, build, and fast memory suite also passed (1,895 tests). Verified that the local preview served the latest production assets. Browser visual comparison remains manual.
- L13: User request verbatim: "Necesito que el español que se usa en la web sea un español neutro, no español de argentina". Scope resolved to the landing in `web/` (S7, T8).
- L14: T8 replaced all Argentine voseo forms with neutral Spanish (impersonal/tuteo): `Empezá/Instalá/creá/subscribí/cambiá`, `Guardá/registrá/Consultá/Revisá/Retomá`, `tenés/Enviá/recibí/Podés/Elegí/necesitás`, `Definí/Sumá/Filtrá/suscribite/incrementá/transformá`, and the `DEFINÍ/CONSULTÁ/EVOLUCIONÁ` markers (now `DEFINIR/CONSULTAR/EVOLUCIONAR`). Also fixed the misspelling `subscribí` to `suscribe`. Files: `web/src/content.ts`, `web/src/components/TechnicalOverview.tsx`, `web/scripts/check-render.tsx` (5 asserted copy strings updated with the copy). Web `npm run check` and `npm run build` pass; repository lint, check-types, build pass; `npm run test:fast:memory` passes (1,916 tests).
