// Generates the iOS PWA launch (startup) images: a centered crossed-swords logo
// on the dark theme background, one PNG per Apple device resolution. Also prints
// the matching <link rel="apple-touch-startup-image"> tags for index.html.
// Zero-dependency PNG encoder (Node zlib), self-contained by design.
// Usage: node scripts/generate-splash.mjs <outDir>

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BG = [26, 20, 16] // #1a1410
const STEEL = [214, 209, 199] // #d6d1c7 blades
const GOLD = [201, 162, 39] // #c9a227 guards + pommels
const SS = 4 // supersampling factor
const LOGO_FRACTION = 0.3 // logo box side as a fraction of the shorter edge

// Geometry mirrors favicon.svg (viewBox 0..1).
const BLADES = [
  [0.22, 0.82, 0.82, 0.2],
  [0.78, 0.82, 0.18, 0.2],
]
const GUARDS = [
  [0.25, 0.62, 0.41, 0.78],
  [0.75, 0.62, 0.59, 0.78],
]
const POMMELS = [
  [0.2, 0.84],
  [0.8, 0.84],
]
const BLADE_HALF = 0.035
const GUARD_HALF = 0.03
const POMMEL_R = 0.05

// Device resolutions (CSS points + device pixel ratio); each yields a portrait
// and a landscape (swapped dimensions) launch image.
const DEVICES = [
  { w: 320, h: 568, dpr: 2 },
  { w: 375, h: 667, dpr: 2 },
  { w: 375, h: 812, dpr: 3 },
  { w: 390, h: 844, dpr: 3 },
  { w: 393, h: 852, dpr: 3 },
  { w: 414, h: 896, dpr: 2 },
  { w: 414, h: 896, dpr: 3 },
  { w: 428, h: 926, dpr: 3 },
  { w: 430, h: 932, dpr: 3 },
  { w: 768, h: 1024, dpr: 2 },
  { w: 810, h: 1080, dpr: 2 },
  { w: 820, h: 1180, dpr: 2 },
  { w: 834, h: 1194, dpr: 2 },
  { w: 1024, h: 1366, dpr: 2 },
]

function segDist(px, py, [ax, ay, bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function near(px, py, segments, half) {
  return segments.some((s) => segDist(px, py, s) < half)
}

function inCircle(px, py, [cx, cy], r) {
  return Math.hypot(px - cx, py - cy) < r
}

function logoColorAt(u, v) {
  if (near(u, v, GUARDS, GUARD_HALF) || POMMELS.some((p) => inCircle(u, v, p, POMMEL_R))) return GOLD
  if (near(u, v, BLADES, BLADE_HALF)) return STEEL
  return BG
}

function sampleLogoBox(px, py, box) {
  const acc = [0, 0, 0]
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const u = (px + (sx + 0.5) / SS) / box
      const v = (py + (sy + 0.5) / SS) / box
      const c = logoColorAt(u, v)
      acc[0] += c[0]
      acc[1] += c[1]
      acc[2] += c[2]
    }
  }
  const n = SS * SS
  return [Math.round(acc[0] / n), Math.round(acc[1] / n), Math.round(acc[2] / n)]
}

function splashColorAt(x, y, box, originX, originY) {
  const insideBox = x >= originX && x < originX + box && y >= originY && y < originY + box
  return insideBox ? sampleLogoBox(x - originX, y - originY, box) : BG
}

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function makePng(width, height) {
  const box = Math.round(Math.min(width, height) * LOGO_FRACTION)
  const originX = Math.round((width - box) / 2)
  const originY = Math.round((height - box) / 2)
  const raw = Buffer.alloc(height * (width * 3 + 1))
  let p = 0
  for (let y = 0; y < height; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = splashColorAt(x, y, box, originX, originY)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

function linkTag({ w, h, dpr }, file, orientation) {
  const media =
    `screen and (device-width: ${w}px) and (device-height: ${h}px) ` +
    `and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: ${orientation})`
  return `<link rel="apple-touch-startup-image" media="${media}" href="/splash/${file}" />`
}

function writeSplash(width, height, file) {
  writeFileSync(`${outDir}/${file}`, makePng(width, height))
  console.log(`wrote ${outDir}/${file}`)
}

const outDir = process.argv[2] ?? 'public/splash'
mkdirSync(outDir, { recursive: true })
const tags = []
for (const device of DEVICES) {
  const width = device.w * device.dpr
  const height = device.h * device.dpr
  const portraitFile = `apple-splash-${width}-${height}.png`
  const landscapeFile = `apple-splash-${height}-${width}-landscape.png`
  writeSplash(width, height, portraitFile)
  writeSplash(height, width, landscapeFile)
  tags.push(linkTag(device, portraitFile, 'portrait'))
  tags.push(linkTag(device, landscapeFile, 'landscape'))
}
console.log('\n<!-- iOS launch images -->')
console.log(tags.join('\n'))
