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
- **HP tracking** — an amount field with damage (`−`) and heal (`+`) buttons; an
  HP bar shows `current/max` at a glance.
- **Temporary HP** — a 🛡 control sets a temp pool (shown as a hatched segment);
  damage drains temp HP first, and healing never restores it.
- **Conditions** — tap `+` by a name to toggle 5e conditions (plus
  Concentration); active ones show as emojis next to the name.
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
   optional **Max HP** (defaults to HP if left blank), **Initiative**, and toggle
   **Player** or **Enemy**. Tap **Add**.
2. **Run turns** — tap **Next turn** to move the highlight down the initiative
   order (it wraps around at the end).
3. **Apply damage or healing** — set the amount on a row, then tap `−` to damage
   or `+` to heal. Healing is capped at Max HP.
4. **Grant temporary HP** — set an amount and tap 🛡; each tap adds to the pool.
   Temp HP is absorbed before normal HP and is shown as `20/20 (+6)`.
5. **Track conditions** — tap `+` next to a name and toggle conditions; their
   emojis appear by the name. Tap again to remove.
6. **Handle the dying** — enemies at 0 HP grey out. Players at 0 HP show death
   saves: tap ✓ / ✗ to record successes and failures. **Revive** brings any
   combatant back at 1 HP and clears their death saves.

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

### Testing

The project follows a test-driven approach. Pure logic
(`src/lib/creatures.js`) and every component are covered with
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
                          #   conditions, temp HP, turn order)
    conditions.js         # condition catalog (key → label + emoji)
    storage.js            # load/save + migration to localStorage
  components/
    CreatureList.svelte   # sorts and renders rows, forwards actions
    CreatureRow.svelte    # one combatant: colors, HP bar, conditions, controls
    HpBar.svelte          # current/max fill bar with temp-HP segment
    AddCreatureForm.svelte# add a combatant
    ConditionPicker.svelte# toggle conditions
    InstallButton.svelte  # PWA install prompt
scripts/
  generate-icons.mjs      # zero-dependency PNG icon generator
public/
  favicon.svg             # crossed-swords favicon
  icons/                  # PWA icons (192 / 512)
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
  isPlayer,               // true = player (green), false = enemy (red)
  deathSaves: { successes, failures },
  conditions: string[],   // condition keys, rendered as emojis
  tempHp,                 // absorbed before currentHp; not restored by healing
}
```

Older saved data is migrated on load — missing `conditions` / `tempHp` are
backfilled with defaults.

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
