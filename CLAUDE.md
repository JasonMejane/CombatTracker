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
    `setCa`, `rename`, `setMaxHp`, `addDeathSave` (`success`/`failure`/`nat1`/`nat20`)
    /`deathState`/`revive`, `isDown`, `canAct`, `sortByInitiative`, `nextActiveId`,
    `removeCreature` (hands the turn on when the active creature is removed),
    `healthState` (`healthy` / `bloodied` ≤ ½ max HP / `critical` ≤ ¼ / `down`;
    temp HP ignored — drives the HP bar colour).
  - `catalog.js` — reusable-creature templates: `createCatalogCreature` (delegates
    to `createCreature` with `initiative: 1`), `setBaseHp`, `sortByName`,
    `filterBySide`, `spawnFromCatalog` (fresh encounter creature: new id, chosen
    initiative, full HP, CA carried over, cleared conditions/temp HP/death saves),
    `uniqueEnemyName` (appends `Goblin 2`, `Goblin 3`, … when an enemy of that name
    is already in the encounter), `filterByName` (case-insensitive substring),
    `spawnGroup(source, initiative, count, encounter)` (N enemy copies sharing one
    initiative with numbered names; players always once) and `playersNotInEncounter`.
  - `turns.js` — `nextTurn`/`previousTurn` over `{ activeCreatureId, round }`
    (wrapping to the top starts a new round; stepping back before round 1's first
    turn is a no-op). Built on `nextActiveId`/`previousActiveId`.
  - `history.js` — undo stack: `record` (capped at 50 snapshots), `undo`, and
    `describeHpChange(before, after)` for the "Orc −3 temp HP, −2 HP" toast label
    (appends "· Concentration DC n" or "· Concentration lost"), `concentrationDc`
    (half the damage taken incl. temp HP, min 10, max 30; null if not concentrating,
    not hit, or dropped to 0).
  - `conditions.js` — `CONDITIONS` catalog (`key`/`label`/`emoji`) +
    `conditionEmoji`/`conditionLabel` lookups.
  - `dice.js` — `rollD20` (random integer 1–20) and `rollInitiative(bonus)`
    (`rollD20() + bonus`); used by the NPC send flow and the add form's 🎲 button.
  - `storage.js` — `loadState`/`saveState` (`creatures`, `activeCreatureId`,
    `round` — defaults to 1 for older saves) over `STORAGE_KEY` and
    `loadCatalog`/`saveCatalog` over `CATALOG_KEY` (separate keys); both return
    defaults on missing/corrupt JSON and backfill legacy creatures via
    `normalizeCreature` (`conditions`/`tempHp`/`ca`); `loadPrefs`/`savePrefs` over
    `PREFS_KEY` (`{ keepAwake }`, default `true`).
  - `wakeLock.js` — `createWakeLock({ nav, doc, onChange })` → `{ supported,
update(wanted), destroy }`: a small side-effecting wrapper (injectable for tests)
    over the Screen Wake Lock API. Re-requests on `visibilitychange` (browsers drop
    the lock when the page is hidden), releases a lock granted after it stopped being
    wanted, and swallows every refusal.
  - `version.js` — update detection. Each build stamps `__APP_VERSION__` (Vercel
    commit SHA, else ISO build time; `define` in `vite.config.js`, declared in
    `src/vite-env.d.ts`) and emits
    `/version.json` (never precached; Vercel serves it `no-store`).
    `fetchLatestVersion` (cache-busted, null on any failure), `isUpdateAvailable`,
    `watchForUpdate({ current, onAvailable })` (checks on load and on every return to
    the foreground; returns a stop fn) and `applyUpdate()` (asks the service worker to
    update, waits for a new worker to take control or turn `redundant`, then reloads —
    always, within 12 s, whatever fails). Tests run offline: `src/test/setup.js` stubs
    `fetch` to reject.
- **`src/components/*.svelte` — presentation.** Stateless where possible; all
  actions flow up through **callback props** (`onAdjustHp`, `onAdd`, …), never
  events or stores.

`App.svelte` is the single source of truth: holds `creatures` + `activeCreatureId` +
`round` and `catalog` as `$state`, persists each with its own `$effect` (`saveState` /
`saveCatalog`), and wires every encounter handler through a `change(id, apply,
describe)` helper that calls a pure `lib` function. Every encounter change (turns
included) goes through `commit(label, apply)`, which pushes a `$state.snapshot` onto
the in-memory `history` (not persisted) and shows a 5 s `Toast` with the label and an
Undo button (turn changes pass `label: null`, so no toast). Nothing uses the
browser's `confirm()`: undoable encounter actions (e.g. removing a combatant) just
act and rely on Undo, while New encounter and catalog deletes go through
`askThen(question, action)` → `ConfirmDialog` (in-app `alertdialog`, focus on
Cancel, Escape/backdrop cancel). While `prefs.keepAwake` and combat is running
(`activeCreatureId !== null`) an `$effect` asks `wakeLock.update(true)`; the header's
`AwakeToggle` (☀, `aria-pressed`, glows while the lock is actually held) only renders
when `wakeLock.supported`. On the encounter page the header's `New encounter` button
sits just left of it (visible text shortened to "New" under 420px). When a newer
build is live, `UpdateBanner` (always-mounted `aria-live` region; Reload / ✕ Dismiss,
dismissal lasts for the session and returns focus to the active tab) floats in the
bottom dock above `TurnBar`, so it never pushes the page down. The header tabs are a WAI-ARIA `tablist`
(`aria-selected`, roving `tabindex`, ←/→ keys) controlling one `tabpanel`. `hpTargetId` opens the
shared `HpSheet` (numpad bottom sheet: Damage / Heal / Temp HP) for one creature.
A `view` `$state`
(`'encounter'` | `'catalog'`) toggles the two pages via header tabs (the Encounter tab
shows a combatant count). `sendFromCatalog(id, initiative, count)` spawns a
`spawnGroup` into `creatures` and `sendParty` spawns the chosen players; both go
through `commit` (undoable toast) and **stay on the catalog**. The catalog copy is
kept. Catalog edits (`editCatalog`, HP/AC, add/delete) are not in the undo history.
`addCreature` also adds a catalog template when the form sets `saveToCatalog`. The
dock (toast slot + `TurnBar`) renders on both views; `TurnBar` only on the encounter.

Component tree: `App → CreatureList → CreatureRow → { HpBar, ConditionPicker, EditCreatureForm }`,
plus `AddCreatureRow`, `InstallButton`, `HpSheet` and a sticky bottom dock
(`Toast` above `UpdateBanner` above `TurnBar`: ◀ previous turn, round + whose turn, ↶ undo, Next turn ▶)
for the encounter, and
`App → CatalogPage → { CatalogRow → { SendToEncounterForm, EditCreatureForm },
SendPartyForm }` (with `AddCreatureRow` `showInitiative={false}`) for the catalog.
`CatalogPage` has a search box and a `Send party` toggle (shown while catalog
players are missing from the encounter); `CatalogRow`'s ✎ opens `EditCreatureForm`
with `removeLabel="Delete from catalog"` — delete lives only there, away from Send.
`SendToEncounterForm` calls `onSend(initiative, count)` (Count/Bonus/Roll for NPCs).
`AddCreatureForm` starts with a coloured Player/Enemy segmented toggle, offers 🎲 +
`Init bonus` for enemies, and an `Also save to catalog` checkbox when
`offerSaveToCatalog` (encounter only). `AddCreatureRow` is a disclosure that
renders below each list: a collapsed `＋ Add creature` button that reveals the shared
`AddCreatureForm` when clicked and auto-closes after a successful add (mirroring the
`CreatureRow` `+ Add condition` → `ConditionPicker` pattern). `CreatureList` owns the
`sortByInitiative` ordering; `CatalogPage` (side filters are `aria-pressed`) owns `sortByName` + `filterBySide` +
`filterByName`.
Both `CreatureRow` (initiative + CA) and `CatalogRow` (HP + CA) use the same
click-to-edit inline pattern (commits on Enter/blur). `CreatureRow` is a compact flex
column (name line / HP line / optional conditions line). The HP bar + ± is one button
(`Adjust HP for <name>`, calls `onAdjustHp`) that opens `HpSheet`; for a downed
player the line shows death-save pips + ✓ ✗ 1 20 buttons and a separate ± button.
The row scrolls itself into view when it becomes active. The HP line also holds the
🏷 `Add condition` toggle and, for a downed enemy/dead player, Revive; a third line of
labelled condition chips (emoji + name, tap to remove) appears only when the
creature has conditions. Its ✎ button toggles
`EditCreatureForm` (name, max HP, remove from encounter — removal is confirmed in
`App`). `HpBar` floats the change in effective HP (current + temp) after each update,
is a `role="meter"` (value text like "7 of 10 HP, 3 temporary, bloodied") and colours
its fill by `healthState` variant. Rows are neutral cards with a 5px player/enemy
stripe on the left; the active row gets `aria-current`, an accent frame, a ▶ marker in
the list gutter and a bolder name. Death-save pips are one `role="img"` with a
"1 success, 2 failures" label; `TurnBar`'s status is `aria-live="polite"`.

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
  `--text`/`--text-muted`, `--hp-healthy`/`--hp-bloodied`/`--hp-critical`). Reuse tokens; no CSS framework. Size every button and inline field with
  `height: var(--control)` (icon buttons square: `width` too) and tags such as
  condition chips with `var(--chip)` — 36/28px for a mouse, 40/30px under
  `pointer: coarse`. Don't size controls with vertical padding. Only the HpSheet
  keypad/actions and the ConditionPicker tiles are deliberately larger.
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
the ordered list and skips creatures that can't act (`canAct`: downed enemies, dead
players — dying/stable players keep their turn). 5e rules at 0 HP: a hit adds a failed
death save (and knocks a stable creature back to dying); damage whose excess past 0
reaches `maxHp` kills outright (massive damage); healing from 0 clears death saves;
a natural 1 is two failures, a natural 20 revives at 1 HP; dropping to 0 ends
`concentration`. `setMaxHp` never heals, only caps `currentHp`. Armor class is stored
as `ca` but displayed as **AC** everywhere in the UI. Legacy saves missing `conditions`/`tempHp` are backfilled on load.
Catalog creatures share this exact shape (with `initiative: 1`) and persist under a
separate key; editing catalog HP (`setBaseHp`) sets `currentHp` and `maxHp` together.
Sending asks only for initiative (default 0) — a creature's `ca` carries over
unchanged. For NPCs the send form also offers an initiative **bonus** (default 0,
not persisted) and a **Roll** button that sets initiative to `rollD20() + bonus`;
players type their own rolled initiative.

## Notes

- Per repo policy: do not commit or push — the author reviews all changes.
