# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start Vite dev server at http://localhost:5173
npm run build    # tsc -b && vite build (type-check first, then bundle)
npm run preview  # serve the dist/ build locally
npx tsc --noEmit # type-check only, no output — run this before every build
```

There is no test runner configured. Validate changes with `npx tsc --noEmit` then `npm run build`.

## Architecture

### Stack
React 18 + Vite 6, TypeScript (strict), Zustand 5, TailwindCSS 3 (`darkMode: 'class'`), Lucide React icons, `qrcode.react` for QR codes on receipts.

### Routing
No router library. `useAppStore.huidigePagina` (type `Page`) drives which page renders. `App.tsx` renders the active page conditionally inside `<main>`. Adding a page requires: a new `Page` union member in `src/types/index.ts`, a new menu entry in `Sidebar.tsx`, and a new conditional render in `App.tsx`.

### State — Zustand stores (`src/store/`)

| Store | Persisted | Purpose |
|---|---|---|
| `useAppStore` | partial (sidebar collapsed state only) | active page, sidebar toggle |
| `useProductStore` | ✓ v3 + migrate | product catalogue |
| `useCategorieStore` | ✓ v1 + migrate | categories (name, hex color, sort order) |
| `useKortingStore` | ✓ v1 | discounts (3 types: stapel / gratis / percentage) |
| `useCartStore` | ✗ session | cart items, selected item id, quantity actions |
| `useTransactieStore` | ✗ session | 30-day demo + real transactions; refund logic |
| `useBetalingStore` | ✗ session | payment modal open/closed |
| `usePersoneelStore` | ✓ v2 + migrate | employees (naam, initialen, kleur, rol) |
| `useInstellingenStore` | ✓ | business info, logo (base64), receipt layout, dark mode |
| `useEtikettenStore` | ✓ | saved food label products |

**Selector rule:** Zustand selectors must return stable references — never sort/transform inside a selector. Use `useMemo` for derived data. Creating a new array or object inside a selector causes an infinite render loop.

### Discount calculation (`src/utils/kortingBerekening.ts`)
Two exported pure functions:
- `berekenKortingen(items, kortingen)` → `{ regels, totaal }` — aggregate discount per rule (used in totals panel and checkout)
- `berekenItemKortingMap(items, kortingen)` → `Map<productId, amount>` — per-product discount (used for strikethrough prices in cart rows)

Both functions apply the same date/active guards and support all three discount types. Keep them in sync when changing discount logic.

### Payment flow
`Cart` → `BetalingModal` (opens via `useBetalingStore.openModal`). The modal has internal `scherm` state cycling through: `methode → contant|pin|cadeaubon → bon`. The `bon` screen shows `BonView` with a 5-second countdown; "Ja" prints via `window.print()` with a dynamically injected `<style>` that sets `@page` size. After payment, `voegTransactieToe` is called and the cart is cleared.

### kg vs. stuk products
`product.prijsType === 'kg'` signals weight-based pricing. In the cart, `CartItem.aantal` stores **kg as a decimal** (e.g. `0.5` for 500 g). The numpad buffers raw grams as a string and converts on every keypress: `updateAantal(id, parseInt(gramBuffer) / 1000)`. Display converts back: `Math.round(aantal * 1000) + ' g'`. The `totaal()` function (`prijs × aantal`) works correctly for both modes because `prijs` is always per-unit (per stuk or per kg).

### Dark mode
Tailwind `darkMode: 'class'`. `App.tsx` syncs `useInstellingenStore.darkMode` to `document.documentElement.classList`. All components must add `dark:` variants alongside light-mode classes.

### Food label module (`EtikettenPage`)
Self-contained page with inline sub-components. The label preview scales a real-mm-sized `<div>` via `transform: scale(factor)` to fit the panel. Printing injects a `<style>` with `@page { size: Wmm Hmm }` and hides everything except `#etiket-print-area`.

### Print CSS
`src/index.css` has a global `@media print` rule that hides everything except `#bon-content` (receipt). The etiket page overrides this by injecting its own print style dynamically. Both approaches rely on `visibility: hidden` + `visibility: visible` rather than `display` to avoid reflow.

### localStorage keys
`pos-producten`, `pos-categorieen`, `pos-kortingen`, `pos-personeel`, `pos-instellingen`, `pos-etiketten`, `pos-app`. All persisted stores use `version` + `migrate` to handle schema changes — bump `version` and add a migration case when changing persisted state shape.
