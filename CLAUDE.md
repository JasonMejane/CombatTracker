# CLAUDE.md

Combat Tracker — an offline-first PWA for D&D DMs to run combat encounters
(initiative order, HP, temp HP, conditions, death saves). No backend, no account;
all state lives in `localStorage`.

## Stack

Svelte 5 (runes) · Vite · vite-plugin-pwa · plain CSS · Vitest +
@testing-library/svelte (jsdom). Node 24+. Static build; deployed to Vercel.

## Commands

- `npm run dev` — dev server with HMR
- `npm test` — run the suite once (use before considering any task done)
- `npm run test:watch` / `npm run test:ui` — watch / Vitest UI
- `npm run build` — production build (emits the PWA service worker)
- `npm run lint` / `npm run lint:fix` — ESLint (flat config, Svelte-aware)
- `npm run format` / `npm run format:check` — Prettier write / verify
- `npm run check` — svelte-check (component/prop/rune diagnostics)
- `npm run icons` — regenerate PWA PNG icons from `scripts/generate-icons.mjs`
- `npm run splash` — regenerate iOS launch images from `scripts/generate-splash.mjs`
- `npm run screenshots` — responsive screenshots across device sizes/orientations
  via `scripts/screenshots.mjs` (Playwright; needs `npm run preview` running and a
  one-time `npx playwright install chromium`; output in git-ignored `screenshots/`)

## Architecture

Two layers, kept strictly apart:

- **`src/lib/*.js` — pure logic, no Svelte.** Every function is non-mutating
  (returns `{ ...creature, ... }`), small, and cyclomatic complexity < 4. Functions
  are **JSDoc-typed** against the shared `Creature` shape in `src/lib/types.js`
  (`@typedef {import('./types.js').Creature}`); keep new lib functions annotated.
  - `creatures.js` — `createCreature` (armor class `ca` defaults to 10),
    `damage`/`heal`, `setTempHp`/`addTempHp`, `toggleCondition`, `setInitiative`,
    `setCa`, `addDeathSave`/`deathState`/`revive`, `isDown`, `sortByInitiative`,
    `nextActiveId`.
  - `catalog.js` — reusable-creature templates: `createCatalogCreature` (delegates
    to `createCreature` with `initiative: 1`), `setBaseHp`, `sortByName`,
    `filterBySide`, `spawnFromCatalog` (fresh encounter creature: new id, chosen
    initiative, full HP, CA carried over, cleared conditions/temp HP/death saves),
    `uniqueEnemyName` (appends `Goblin 2`, `Goblin 3`, … when an enemy of that name
    is already in the encounter).
  - `conditions.js` — `CONDITIONS` catalog (`key`/`label`/`emoji`) +
    `conditionEmoji`/`conditionLabel` lookups.
  - `dice.js` — `rollD20` (random integer 1–20) and `rollInitiative(bonus)`
    (`rollD20() + bonus`); used by the NPC send flow.
  - `storage.js` — `loadState`/`saveState` over `STORAGE_KEY` and
    `loadCatalog`/`saveCatalog` over `CATALOG_KEY` (separate keys); both return
    defaults on missing/corrupt JSON and backfill legacy creatures via
    `normalizeCreature` (`conditions`/`tempHp`/`ca`).
- **`src/components/*.svelte` — presentation.** Stateless where possible; all
  actions flow up through **callback props** (`onDamage`, `onAdd`, …), never
  events or stores.

`App.svelte` is the single source of truth: holds `creatures` + `activeCreatureId`
and `catalog` as `$state`, persists each with its own `$effect` (`saveState` /
`saveCatalog`), and wires every encounter handler by mapping over creatures through
a `update(id, change)` helper that calls a pure `lib` function. A `view` `$state`
(`'encounter'` | `'catalog'`) toggles the two pages via header tabs. `sendFromCatalog`
spawns a catalog creature into `creatures` (de-duplicating enemy names with
`uniqueEnemyName`) and switches back to the encounter; the catalog copy is kept.

Component tree: `App → CreatureList → CreatureRow → { HpBar, ConditionPicker }`,
plus `AddCreatureRow` and `InstallButton` for the encounter, and
`App → CatalogPage → CatalogRow → SendToEncounterForm` (with `AddCreatureRow`
`showInitiative={false}`) for the catalog. `AddCreatureRow` is a disclosure that
renders below each list: a collapsed `＋ Add creature` button that reveals the shared
`AddCreatureForm` when clicked and auto-closes after a successful add (mirroring the
`CreatureRow` `+ Add condition` → `ConditionPicker` pattern). `CreatureList` owns the
`sortByInitiative` ordering; `CatalogPage` owns `sortByName` + `filterBySide`.
Both `CreatureRow` (initiative + CA) and `CatalogRow` (HP + CA) use the same
click-to-edit inline pattern (commits on Enter/blur).

## Conventions

- **TDD, always.** Write the failing test first, implement, then `npm test`; fix
  before moving on. Pure logic and every component are fully covered.
- **Svelte 5 runes only:** `$state`, `$derived`, `$props`, `$effect`. Pass
  behavior via callback props; no `createEventDispatcher`, no writable stores.
- **Component tests** use `@testing-library/svelte`; query by role/label
  (`getByLabelText`, `getByRole`), drive with `fireEvent`, assert on the callback
  spy (`vi.fn()`). Mirror the existing `Foo.svelte` + `Foo.test.js` pairing.
- **Keep logic pure and out of components.** New rules go in `src/lib` as
  non-mutating functions, tested in isolation, then wired into `App.svelte`.
- **CSS** is plain and dark-themed via custom-property tokens in `app.css`
  (`--bg`, `--surface`, `--accent`, `--player`/`--enemy`, `--down`, `--border`,
  `--text`/`--text-muted`). Reuse tokens; no CSS framework.
- Minimal changes; no unrelated refactors. Comments only where truly needed —
  let clear names carry the meaning.
- **Tooling gate:** keep `npm run lint`, `npm run format:check` and `npm run check`
  green alongside `npm test`. ESLint enforces `complexity ≤ 4` on `src/` (off for
  test files); Prettier owns formatting (don't hand-fight it); svelte-check runs with
  `checkJs: true` and type-checks the app via the JSDoc `Creature` type (test files
  excluded in `jsconfig`, so keep deliberately-partial fixtures in `*.test.js`).

## Data model

```js
Creature {
  id, name,
  maxHp, currentHp,          // maxHp defaults to currentHp (hp) when omitted
  initiative,
  ca,                        // armor class; defaults to 10 when omitted
  isPlayer,                  // true = player (green), false = enemy (red)
  deathSaves: { successes, failures },  // max 3 each
  conditions: string[],      // condition keys → emojis
  tempHp,                    // drained by damage before currentHp; heal never restores it
}
```

Behavior worth knowing: `damage` spends `tempHp` first; `heal` caps at `maxHp`;
initiative sorts descending with players winning ties; `nextActiveId` wraps around
the ordered list. Legacy saves missing `conditions`/`tempHp` are backfilled on load.
Catalog creatures share this exact shape (with `initiative: 1`) and persist under a
separate key; editing catalog HP (`setBaseHp`) sets `currentHp` and `maxHp` together.
Sending asks only for initiative (default 0) — a creature's `ca` carries over
unchanged. For NPCs the send form also offers an initiative **bonus** (default 0,
not persisted) and a **Roll** button that sets initiative to `rollD20() + bonus`;
players type their own rolled initiative.

## Notes

- Per repo policy: do not commit or push — the author reviews all changes.
