// Generates the PWA PNG icons from the crossed-swords geometry of favicon.svg.
// Zero-dependency PNG encoder (Node zlib) with 4x supersampling for smooth edges.
// Usage: node scripts/generate-icons.mjs <outDir>

import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BG = [26, 20, 16] // #1a1410
const STEEL = [214, 209, 199] // #d6d1c7 blades
const GOLD = [201, 162, 39] // #c9a227 guards + pommels
const SS = 4 // supersampling factor

// Geometry mirrors favicon.svg (viewBox 0..1), stroke widths as half-thickness.
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

function colorAt(u, v) {
  if (near(u, v, GUARDS, GUARD_HALF) || POMMELS.some((p) => inCircle(u, v, p, POMMEL_R))) return GOLD
  if (near(u, v, BLADES, BLADE_HALF)) return STEEL
  return BG
}

function sampledColor(x, y, size) {
  const acc = [0, 0, 0]
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const u = (x + (sx + 0.5) / SS) / size
      const v = (y + (sy + 0.5) / SS) / size
      const c = colorAt(u, v)
      acc[0] += c[0]
      acc[1] += c[1]
      acc[2] += c[2]
    }
  }
  const n = SS * SS
  return [Math.round(acc[0] / n), Math.round(acc[1] / n), Math.round(acc[2] / n)]
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

function makePng(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1))
  let p = 0
  for (let y = 0; y < size; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = sampledColor(x, y, size)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outDir = process.argv[2] ?? 'public/icons'
mkdirSync(outDir, { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(`${outDir}/icon-${size}.png`, makePng(size))
  console.log(`wrote ${outDir}/icon-${size}.png`)
}
