const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x + 0.5, y + 0.5, size)
      const i = y * (size * 4 + 1) + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

const BLACK = [0, 0, 0]
const GOLD = [254, 211, 76]
const STRIPES = [
  [248, 238, 165],
  [253, 224, 59],
  [251, 201, 50],
  [234, 171, 0],
]
const STRIPE_TOP = 0.8

function icon(x, y, size) {
  const u = x / size
  const v = y / size
  const r = 0.22
  const cx = Math.min(Math.max(u, r), 1 - r)
  const cy = Math.min(Math.max(v, r), 1 - r)
  const outside = Math.hypot(u - cx, v - cy) - r
  const edge = 1 / size
  const alpha = Math.max(0, Math.min(1, 0.5 - outside / edge))
  if (alpha === 0) return [0, 0, 0, 0]

  let base = BLACK
  if (v >= STRIPE_TOP) base = STRIPES[Math.min(3, Math.floor(u * 4))]

  const check = Math.min(distToSegment(u, v, 0.25, 0.44, 0.42, 0.6), distToSegment(u, v, 0.42, 0.6, 0.75, 0.25))
  const stroke = Math.max(0.085, 1.1 / size)
  const gold = v < STRIPE_TOP - 0.02 ? Math.max(0, Math.min(1, (stroke - check) / edge + 0.5)) : 0
  const mix = (i) => Math.round(base[i] * (1 - gold) + GOLD[i] * gold)
  return [mix(0), mix(1), mix(2), Math.round(alpha * 255)]
}

const root = path.join(__dirname, '..')
const dir = path.join(__dirname, 'icons')
fs.mkdirSync(dir, { recursive: true })
for (const size of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png(size, icon))
}
fs.writeFileSync(path.join(root, 'frontend', 'public', 'favicon.png'), png(64, icon))
fs.writeFileSync(path.join(root, 'docs', 'store-logo-300.png'), png(300, icon))
console.log('icons written to extension/icons, frontend/public/favicon.png and docs/store-logo-300.png')
