# ⚔️ Combat Tracker

A lightweight PWA for D&D Dungeon Masters to run combat encounters from a phone
(or PC). Add allies and enemies, order them by initiative, track HP, temporary
HP, conditions and death saves — fully offline, with everything saved locally on
the device. No account, no server, no internet required.

## Features

- **Initiative order** — combatants are listed highest-initiative first; players
  win ties over enemies.
- **Players vs enemies** — player rows are green, enemy rows red.
- **Active turn** — the current combatant's row is highlighted; **Next turn**
  advances around the order.
- **Editable initiative** — tap a combatant's initiative value to change it; the
  list re-sorts instantly.
- **Armor class (CA)** — each creature carries a CA, shown beside its name in both
  the encounter and the catalog; tap the value to edit it inline (defaults to 10).
- **Creature Catalog** — a separate page to keep reusable creatures (your players
  and pre-made enemies). Sort alphabetically, filter by player/enemy, edit each
  one's base HP, and **send** a creature into the current encounter (you're asked
  for its initiative). The catalog copy stays for reuse; sending a duplicate enemy
  auto-numbers it (`Goblin`, `Goblin 2`, `Goblin 3`, …).
- **HP tracking** — an amount field with damage (`−`) and heal (`+`) buttons; an
  HP bar shows `current/max` at a glance.
- **Temporary HP** — a 🛡 control sets a temp pool (shown as a hatched segment);
  damage drains temp HP first, and healing never restores it.
- **Conditions** — tap `+` below a combatant's HP bar to toggle 5e conditions
  (plus Concentration); active ones show as emojis there.
- **Downed combatants** — enemies at 0 HP grey out; players show a death-save
  tracker (3 successes = stable, 3 failures = dead). Anyone can be **revived**
  (back to 1 HP).
- **Offline & installable** — works with no connection and installs to the home
  screen as an app.
- **Local persistence** — the encounter is restored automatically on reopen.

## Use

### Install as an app

**Android (Chrome):** open the site, then either tap the **Install** button in
the header or use the browser menu → *Add to Home screen*. It launches
full-screen like a native app.

**Desktop (Chrome/Edge):** click the **Install** button in the header, or the
install icon in the address bar.

Once installed it runs offline; combat state is stored on the device.

### Manage an encounter

1. **Add a combatant** — fill in the form at the bottom: **Name**, **HP**,
   optional **Max HP** (defaults to HP if left blank), **CA** (armor class,
   defaults to 10), **Initiative**, and toggle **Player** or **Enemy**. Tap **Add**.
2. **Run turns** — tap **Next turn** to move the highlight down the initiative
   order (it wraps around at the end). Tap a row's **initiative** number to edit
   it; the order updates immediately. Tap the **CA** value to edit a combatant's
   armor class.
3. **Apply damage or healing** — set the amount on a row, then tap `−` to damage
   or `+` to heal. Healing is capped at Max HP.
4. **Grant temporary HP** — set an amount and tap 🛡; each tap adds to the pool.
   Temp HP is absorbed before normal HP and is shown as `20/20 (+6)`.
5. **Track conditions** — tap `+` below the HP bar and toggle conditions; their
   emojis appear there. Tap again to remove.
6. **Handle the dying** — enemies at 0 HP grey out. Players at 0 HP show death
   saves: tap ✓ / ✗ to record successes and failures. **Revive** brings any
   combatant back at 1 HP and clears their death saves.
7. **Start fresh** — **New encounter** (at the bottom of the encounter, styled as
   a danger action so it isn't confused with **Next turn**) clears all combatants
   after confirmation.

### Build a catalog

Switch to the **Catalog** tab to manage reusable creatures:

1. **Add** — the same form as the encounter (no initiative field; it's asked when
   you send). Set **CA** if you like, toggle **Player** or **Enemy**, tap **Add**.
2. **Filter & sort** — use **All / Players / Enemies**; entries are always listed
   alphabetically.
3. **Edit HP / CA** — tap a creature's HP or CA value to change it in place.
4. **Send to encounter** — tap **Send to encounter**, enter an initiative, confirm.
   The creature is copied into the encounter (the catalog keeps its copy) with its
   CA carried over — only the initiative is asked. Sending an enemy whose name
   already exists there appends an index (`Goblin 2`, …).
5. **Remove** — tap ✕ to delete a creature from the catalog.

The catalog is saved on the device separately from the encounter and restored on
reopen.

## Develop

### Prerequisites

- Node.js 24+ and npm.

### Setup

```bash
npm install
npm run dev      # start the dev server (with HMR)
```

Open the printed local URL in a browser.

### Scripts

| Script                | What it does                                        |
| --------------------- | --------------------------------------------------- |
| `npm run dev`         | Start the Vite dev server.                          |
| `npm run build`       | Production build (generates the PWA service worker).|
| `npm run preview`     | Serve the production build locally.                 |
| `npm test`            | Run the test suite once.                            |
| `npm run test:watch`  | Run tests in watch mode.                            |
| `npm run test:ui`     | Run tests with the Vitest UI.                       |
| `npm run icons`       | Regenerate the PWA PNG icons from the crossed-swords geometry. |
| `npm run splash`      | Regenerate the iOS launch images from the same geometry.        |

### Testing

The project follows a test-driven approach. Pure logic
(`src/lib/` — `creatures.js`, `catalog.js`, `storage.js`) and every component are covered with
[Vitest](https://vitest.dev/) and
[@testing-library/svelte](https://testing-library.com/docs/svelte-testing-library/intro/)
(jsdom environment). Run `npm test` before committing.

### Project structure

```
src/
  App.svelte              # holds state, wires actions + persistence
  app.css                 # dark tabletop theme + shared tokens
  main.js                 # app entry
  lib/
    creatures.js          # pure combat logic (sort, damage, heal, death saves,
                          #   conditions, temp HP, turn order, set initiative/CA)
    catalog.js            # pure catalog logic (create/edit/sort/filter templates,
                          #   spawn into encounter, unique enemy naming)
    conditions.js         # condition catalog (key → label + emoji)
    storage.js            # load/save + migration to localStorage (encounter + catalog)
  components/
    CreatureList.svelte   # sorts and renders rows, forwards actions
    CreatureRow.svelte    # one combatant: colors, HP bar, editable initiative/CA,
                          #   conditions, controls
    HpBar.svelte          # current/max fill bar with temp-HP segment
    AddCreatureForm.svelte# add a combatant (initiative optional via showInitiative)
    ConditionPicker.svelte# toggle conditions
    CatalogPage.svelte    # catalog view: filter, sort, add, list rows
    CatalogRow.svelte     # one catalog creature: edit HP/CA, remove, send
    SendToEncounterForm.svelte # inline prompt for initiative when sending
    InstallButton.svelte  # PWA install prompt
scripts/
  generate-icons.mjs      # zero-dependency PNG icon generator
  generate-splash.mjs     # iOS launch-image generator (same geometry)
public/
  favicon.svg             # crossed-swords favicon
  icons/                  # PWA icons (192 / 512)
  splash/                 # iOS launch images
```

### Tech stack

- **[Svelte 5](https://svelte.dev/)** + **[Vite](https://vite.dev/)** — tiny,
  compiled, no runtime framework shipped.
- **[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)** — manifest + service
  worker for offline and installability.
- **Plain CSS** — a dark, tabletop-themed palette; no CSS framework.
- **localStorage** — the only persistence; no backend.
- **Vitest** + **Testing Library** — unit and component tests.

### Data model

```js
Creature {
  id, name,
  maxHp, currentHp,       // maxHp defaults to currentHp when not given
  initiative,
  ca,                     // armor class; defaults to 10 when not given
  isPlayer,               // true = player (green), false = enemy (red)
  deathSaves: { successes, failures },
  conditions: string[],   // condition keys, rendered as emojis
  tempHp,                 // absorbed before currentHp; not restored by healing
}
```

Older saved data is migrated on load — missing `conditions` / `tempHp` / `ca` are
backfilled with defaults.

Catalog creatures reuse the same `Creature` shape (created with `initiative: 1`
and stored under a separate localStorage key). Sending one builds a fresh
encounter creature — new `id`, the chosen initiative, full HP, and cleared
conditions / temp HP / death saves.

## Deploy

This is a static Vite build with no backend, so any static host works. The
repo includes a [`vercel.json`](vercel.json) for deploying to
[Vercel](https://vercel.com/):

```bash
npm i -g vercel
vercel        # first deploy, follow the prompts
vercel --prod # promote to production
```

Or import the GitHub repo in the Vercel dashboard — it auto-detects the Vite
framework preset, builds with `npm run build`, and serves the `dist/`
directory.

## License

[GNU GPLv3](LICENSE).
