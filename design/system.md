# CLA DB Design System

Captured from the project's existing design sources. Values are recorded only where found in the sources.

## Colors

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--ifm-color-primary` | `#ED168F` | Primary action color (links, buttons, search) | `docs-src/src/css/custom.css` |
| `--ifm-color-primary-dark` | `#ED168F` | Hover states | `docs-src/src/css/custom.css` |
| `--ifm-color-primary-darker` | `#8d2089` | Pressed states | `docs-src/src/css/custom.css` |
| `--color-top` | `#ED168F` | Gradient top / solid button background | `docs-src/src/css/custom.css` |
| `--color-middle` | `#b2218b` | Gradient middle | `docs-src/src/css/custom.css` |
| `--color-bottom` | `#752a8a` | Gradient bottom | `docs-src/src/css/custom.css` |
| `--bg-color` | `#20293C` | Page background tone | `docs-src/src/css/custom.css` |
| `--bg-color-dark` | `#0D0F18` | Dark background (dark theme base) | `docs-src/src/css/custom.css` |
| `--bg-color-code` | `#282330` | Code block background | `docs-src/src/css/custom.css` |
| `--shiki-foreground` | `#F8F8F2` | Code text | `docs-src/src/css/custom.css` |
| `--shiki-token-comment` | `#6272A4` | Code comments | `docs-src/src/css/custom.css` |
| `--shiki-token-keyword` | `#BD93F9` | Code keywords | `docs-src/src/css/custom.css` |
| `--shiki-token-function` | `#50FA7B` | Code functions | `docs-src/src/css/custom.css` |
| `--shiki-token-string` | `#F1FA8C` | Code strings | `docs-src/src/css/custom.css` |
| `--shiki-token-string-expression` | `#FF79C6` | Code string expressions | `docs-src/src/css/custom.css` |
| `--shiki-token-constant` | `#8BE9FD` | Code constants | `docs-src/src/css/custom.css` |
| `--shiki-token-parameter` | `#FFB86C` | Code parameters | `docs-src/src/css/custom.css` |
| `--fontColor-white` | `#ffffff` | Primary text on dark | `docs-src/src/css/custom.css` |
| `--fontColor-gray` | `lightgray` | Secondary text | `docs-src/src/css/custom.css` |
| Ionic primary (examples only) | `#e6008d` / shade `#ca007c` / tint `#e91a98` | Mobile example app theme | `examples/ionic/src/theme/variables.css` |

The brand gradient runs top to bottom: `#ED168F` → `#b2218b` → `#752a8a`.

The site is dark-only: `color-scheme: dark`, background `#0D0F18`, navbar `#0D0F18`.

## Typography

- Base and monospace font: `"Atkinson Hyperlegible Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace`. It is a variable-weight mono font (weight 100-900) embedded as a data URI in `docs-src/src/css/custom.css`. The design canvas cannot reference the data URI externally; artboards use the fallback monospace system stack to approximate it.
- Font size scale (source: `docs-src/src/css/custom.css`):
  - `--fontSizes-xs`: `0.75rem`
  - `--fontSizes-s`: `0.9rem`
  - `--fontSizes-m`: `1rem`
  - `--fontSizes-l`: `1.25rem`
  - `--fontSizes-xl`: `1.5rem`
  - `--fontSizes-2xl`: `1.75rem`
  - `--fontSizes-3xl`: `2rem`
  - `--fontSizes-5xl`: `2.5rem`
- Heading margin bottom: `40px`.
- Code font size: `var(--fontSizes-s)` (0.9rem).

## Spacing

- `--space-between-blocks`: `0px` (blocks are separated by their own paddings).
- Button padding: `10px 18px`.
- Docs main width: `max-width: 92rem` (~1408px).
- Sidebar link padding-left: `60px`.

## Radius

- Buttons: `border-radius: 8px`.
- Article images with padding: `4px`.
- Article images (radius variant): `10px`.

## Shadows

No shadow tokens found in the sources.

## Component rules

- **Button**: solid background `--color-top` (`#ED168F`), 1px solid border same color, radius 8px, white bold text, padding 10px 18px, cursor pointer (source: `.button` in `docs-src/src/css/custom.css`).
- **Footer**: solid 1px white top border (source: `.footer`).
- **Cards**: background equals navbar background `#0D0F18` (source: `.card`).
- **Dark blocks**: `.dark` / `.block.dark` use `#0D0F18` (source: `docs-src/src/css/custom.css`).
- **Code blocks**: background `#282330`, Dracula-like token palette listed above (source: `pre[data-theme]` rules and `--shiki-*` tokens).
- **No round borders beyond the recorded radii**: follow the project rule of square-cornered components; the 8px button radius and 4px/10px image radii are the recorded exceptions.
