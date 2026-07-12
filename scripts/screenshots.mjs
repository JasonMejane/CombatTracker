// Captures responsive screenshots of the app across the target device sizes in
// both orientations, seeding localStorage with a sample encounter + catalog so
// rows, HP/CA and controls are visible. Also logs any horizontal overflow per
// size (the key responsive regression to watch for). Used for the manual visual
// pass — there is no automated coverage for layout.
//
// Needs Playwright's browser (one-time) and a running preview server:
//   npx playwright install chromium         # one-time browser download
//   npm run build && npm run preview        # serves the built app (default :4173)
//   npm run screenshots                     # or with args: npm run screenshots -- <baseUrl> <outDir>
// Defaults: baseUrl http://localhost:4173/, outDir screenshots/ (git-ignored)

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:4173/'
const OUT = process.argv[3] ?? 'screenshots'
mkdirSync(OUT, { recursive: true })

const creature = (id, name, isPlayer, over = {}) => ({
  id,
  name,
  maxHp: 30,
  currentHp: 21,
  initiative: isPlayer ? 15 : 12,
  ca: 14,
  isPlayer,
  deathSaves: { successes: 0, failures: 0 },
  conditions: [],
  tempHp: 0,
  ...over,
})

const state = {
  creatures: [
    creature('a', 'Aria Longname the Bard', true, { conditions: ['poisoned', 'prone'] }),
    creature('b', 'Goblin', false, { currentHp: 5, tempHp: 4 }),
    creature('c', 'Ancient Red Dragon', false, { maxHp: 300, currentHp: 300, initiative: 20 }),
  ],
  activeCreatureId: 'a',
}
const catalog = [
  creature('k1', 'Goblin', false),
  creature('k2', 'Town Guard', true),
  creature('k3', 'Owlbear', false, { maxHp: 59, currentHp: 59 }),
]

// Portrait dimensions; sizes under 900px wide are also shot rotated to landscape.
const targets = [
  { name: 'iphone-se', w: 375, h: 667 },
  { name: 'iphone-pro', w: 390, h: 844 },
  { name: 'ipad', w: 820, h: 1180 },
  { name: 'desktop', w: 1280, h: 900 },
]

function orientationsFor({ w, h }) {
  if (w >= 900) return [['landscape', w, h]]
  return [
    ['portrait', w, h],
    ['landscape', h, w],
  ]
}

async function shoot(page, label) {
  await page.waitForTimeout(400) // let the splash overlay fade
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: true })
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

async function captureView(ctx, target, ori, w, h) {
  const page = await ctx.newPage()
  await page.setViewportSize({ width: w, height: h })
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await shoot(page, `${target.name}-${ori}-encounter`)
  await page.getByRole('button', { name: 'Catalog' }).click()
  await shoot(page, `${target.name}-${ori}-catalog`)
  console.log(`${target.name}-${ori}: hOverflow=${await overflow(page)}px`)
  await page.close()
}

const browser = await chromium.launch()
const ctx = await browser.newContext()
await ctx.addInitScript(
  ([s, c]) => {
    localStorage.setItem('combat-tracker-state', s)
    localStorage.setItem('combat-tracker-catalog', c)
  },
  [JSON.stringify(state), JSON.stringify(catalog)],
)

for (const target of targets) {
  for (const [ori, w, h] of orientationsFor(target)) {
    await captureView(ctx, target, ori, w, h)
  }
}
await browser.close()
console.log(`\nwrote screenshots to ${OUT}/`)
