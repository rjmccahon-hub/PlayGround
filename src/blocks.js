import * as THREE from '../vendor/three.module.js'

/* ------------------------------------------------------------------ *
 *  Block registry — the palette of the realm
 * ------------------------------------------------------------------ */

export const BLOCKS = {
  grass: {
    name: 'Grass', tiles: { top: 'grass_top', side: 'grass_side', bottom: 'dirt' },
    ui: { top: '#7ac653', left: '#6b4a2f', right: '#8a5f3c' },
    hardness: 0.22, placeable: true, price: 2, desc: 'Soft turf for rolling hills.'
  },
  dirt: {
    name: 'Dirt', tiles: { top: 'dirt', side: 'dirt', bottom: 'dirt' },
    ui: { top: '#9a6843', left: '#7d5235', right: '#8d5d3b' },
    hardness: 0.2, placeable: true, price: 1, desc: 'Humble, dependable earth.'
  },
  stone: {
    name: 'Stone', tiles: { top: 'stone', side: 'stone', bottom: 'stone' },
    ui: { top: '#9aa5b1', left: '#7f8995', right: '#8e99a5' },
    hardness: 0.45, placeable: true, price: 3, desc: 'The bones of the floating isles.'
  },
  cobble: {
    name: 'Cobblestone', tiles: { top: 'cobble', side: 'cobble', bottom: 'cobble' },
    ui: { top: '#a3adb8', left: '#828d99', right: '#939eaa' },
    hardness: 0.5, placeable: true, price: 4, desc: 'Chunky stones for sturdy walls.'
  },
  sandstone: {
    name: 'Sandstone', tiles: { top: 'sandstone_top', side: 'sandstone', bottom: 'sandstone_top' },
    ui: { top: '#f0d9a3', left: '#d9bd84', right: '#e7cb94' },
    hardness: 0.4, placeable: true, price: 4, desc: 'Warm blocks from the sunlit quarries.'
  },
  planks: {
    name: 'Oak Planks', tiles: { top: 'planks', side: 'planks', bottom: 'planks' },
    ui: { top: '#dca55f', left: '#b97e3f', right: '#cc914d' },
    hardness: 0.28, placeable: true, price: 3, desc: 'Sawn boards, ready for a cozy keep.'
  },
  log: {
    name: 'Oak Log', tiles: { top: 'log_top', side: 'log_side', bottom: 'log_top' },
    ui: { top: '#c99a5e', left: '#6d4729', right: '#815634' },
    hardness: 0.35, placeable: true, price: 4, desc: 'Timber with lovely growth rings.'
  },
  leaves: {
    name: 'Leaves', tiles: { top: 'leaves', side: 'leaves', bottom: 'leaves' },
    ui: { top: '#5baa45', left: '#3f8231', right: '#4c963a' },
    hardness: 0.15, placeable: true, price: 2, desc: 'A leafy canopy for shady corners.'
  },
  roof: {
    name: 'Roof Tile', tiles: { top: 'roof', side: 'roof', bottom: 'roof' },
    ui: { top: '#8c5ad6', left: '#6b40b0', right: '#7c4cc4' },
    hardness: 0.4, placeable: true, price: 6, desc: 'Royal purple shingles.'
  },
  gold: {
    name: 'Gold Block', tiles: { top: 'gold', side: 'gold', bottom: 'gold' },
    ui: { top: '#ffd45e', left: '#d6a42b', right: '#eab93c' },
    hardness: 0.65, placeable: true, price: 18, desc: 'Impossibly shiny. The castle loves it.'
  },
  glass: {
    name: 'Glass', tiles: { top: 'glass', side: 'glass', bottom: 'glass' },
    ui: { top: '#d9f5fa', left: '#a8dbe7', right: '#bce7f0' },
    hardness: 0.25, placeable: true, price: 5, desc: 'Frosted panes for bright halls.'
  },
  brick: {
    name: 'Red Brick', tiles: { top: 'brick', side: 'brick', bottom: 'brick' },
    ui: { top: '#c2604a', left: '#9d4937', right: '#ae5340' },
    hardness: 0.45, placeable: true, price: 5, desc: 'Classic brickwork with cream mortar.'
  },
  mossy: {
    name: 'Mossy Stone', tiles: { top: 'mossy', side: 'mossy', bottom: 'mossy' },
    ui: { top: '#95a88e', left: '#778a70', right: '#84977c' },
    hardness: 0.5, placeable: true, price: 5, desc: 'Ancient stone, softened by the sky.'
  },
  snow: {
    name: 'Snow', tiles: { top: 'snow', side: 'snow', bottom: 'snow' },
    ui: { top: '#f4f9fd', left: '#dbe8f2', right: '#e8f1f8' },
    hardness: 0.18, placeable: true, price: 3, desc: 'A crisp dusting from the high clouds.'
  },
  window: {
    name: 'Glow Window', tiles: { top: 'window', side: 'window', bottom: 'window' },
    ui: { top: '#ffe08b', left: '#f0b94e', right: '#ffcf6b' },
    hardness: 0.3, placeable: true, price: 8, desc: 'Warm light that glows after dusk.'
  },
  bounce: {
    name: 'Bounce Pad', tiles: { top: 'bounce', side: 'bounce_side', bottom: 'bounce_side' },
    ui: { top: '#ff6fa8', left: '#d63c7f', right: '#ef5594' },
    hardness: 0.25, placeable: true, price: 10, desc: 'Boing! Launch yourself skyward.'
  },
  banner: {
    name: 'Royal Banner', tiles: { top: 'banner', side: 'banner', bottom: 'banner' },
    ui: { top: '#8d5ddb', left: '#6b40b0', right: '#7c4cc4' },
    hardness: 0.3, placeable: true, price: 12, desc: 'The crest of Sunnyhollow.'
  },
  water: {
    name: 'Water', tiles: { top: 'water', side: 'water', bottom: 'water' },
    ui: { top: '#6fd6f2', left: '#48b9d9', right: '#5ac8e8' },
    hardness: 0, placeable: false, liquid: true, desc: 'Cool, clear pond water.'
  }
}

export const BLOCK_IDS = Object.keys(BLOCKS)
export const AIR = 0
export const ID_TO_KEY = [null, ...BLOCK_IDS]
export const KEY_TO_ID = Object.fromEntries(BLOCK_IDS.map((k, i) => [k, i + 1]))
export const MAX_ID = BLOCK_IDS.length

export const isOpaque = id => id !== AIR && !BLOCKS[ID_TO_KEY[id]].liquid
export const isSolid = id => id !== AIR && !BLOCKS[ID_TO_KEY[id]].liquid
export const isWater = id => id !== AIR && BLOCKS[ID_TO_KEY[id]].liquid

/* ------------------------------------------------------------------ *
 *  Pixel-art texture atlas, drawn procedurally so the game is offline
 * ------------------------------------------------------------------ */

const TILE = 32
const GRID = 8
const ATLAS = TILE * GRID

function rngFor(seed) {
  let s = seed >>> 0
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex)
  const f = v => Math.max(0, Math.min(255, Math.round(v + amt)))
  return `rgb(${f(r)},${f(g)},${f(b)})`
}
function px(c, x, y, color) { c.fillStyle = color; c.fillRect(x, y, 1, 1) }

function noiseFill(c, base, variance, rng, size = 16) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (rng() - 0.5) * 2 * variance
      px(c, x, y, shade(base, v))
    }
  }
}

const painters = {
  grass_top(c, rng) {
    noiseFill(c, '#6fbf4a', 16, rng)
    for (let i = 0; i < 14; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, rng() > .5 ? '#86d45e' : '#58a63a')
    for (let i = 0; i < 3; i++) {
      const x = 2 + ((rng() * 12) | 0), y = 2 + ((rng() * 12) | 0)
      px(c, x, y, '#ffe27a'); px(c, x + 1, y, '#fff3b0'); px(c, x, y + 1, '#e7c34b')
    }
  },
  grass_side(c, rng) {
    noiseFill(c, '#8a5a3b', 15, rng)
    for (let x = 0; x < 16; x++) {
      const depth = 3 + ((rng() * 3) | 0)
      for (let y = 0; y < depth; y++) px(c, x, y, shade('#6fbf4a', (rng() - .5) * 26))
      px(c, x, depth, rng() > .55 ? '#5da53e' : '#7bcb55')
    }
    for (let i = 0; i < 7; i++) px(c, (rng() * 16) | 0, 6 + ((rng() * 9) | 0), rng() > .5 ? '#a06a46' : '#74482f')
  },
  dirt(c, rng) {
    noiseFill(c, '#8a5a3b', 18, rng)
    for (let i = 0; i < 12; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, rng() > .5 ? '#6f4429' : '#a5714b')
    for (let i = 0; i < 3; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#6d665e')
  },
  stone(c, rng) {
    noiseFill(c, '#a6b2bf', 14, rng)
    for (let i = 0; i < 6; i++) {
      let x = (rng() * 16) | 0, y = (rng() * 16) | 0
      for (let s = 0; s < 4; s++) {
        px(c, x, y, '#87929f'); x += rng() > .5 ? 1 : 0; y += rng() > .35 ? 1 : 0
      }
    }
    for (let i = 0; i < 9; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#c0cad5')
  },
  cobble(c, rng) {
    c.fillStyle = '#7c8794'; c.fillRect(0, 0, 16, 16)
    const stones = [[1, 1, 6, 4], [8, 1, 7, 3], [1, 6, 4, 4], [6, 5, 5, 5], [12, 5, 3, 4], [1, 11, 6, 4], [8, 11, 7, 4], [12, 10, 3, 3]]
    for (const [x, y, w, h] of stones) {
      const base = shade('#b2bcc8', (rng() - .5) * 18)
      c.fillStyle = base; c.fillRect(x, y, w, h)
      c.fillStyle = shade('#c7d1dc', 8); c.fillRect(x, y, w, 1)
      c.fillStyle = shade('#939eaa', -6); c.fillRect(x, y + h - 1, w, 1)
      for (let i = 0; i < 3; i++) px(c, x + ((rng() * w) | 0), y + ((rng() * h) | 0), shade('#a3aeba', (rng() - .5) * 20))
    }
  },
  sandstone(c, rng) {
    noiseFill(c, '#e6cf9b', 10, rng)
    for (let y = 0; y < 16; y++) {
      if (y % 5 === 0) for (let x = 0; x < 16; x++) px(c, x, y, '#d5b981')
      if (y % 5 === 1) for (let x = 0; x < 16; x++) px(c, x, y, '#f1dda9')
    }
    for (let i = 0; i < 8; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#cbb078')
  },
  sandstone_top(c, rng) {
    noiseFill(c, '#efd8a2', 9, rng)
    for (let i = 0; i < 10; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#ddc18b')
  },
  planks(c, rng) {
    noiseFill(c, '#c98f4e', 12, rng)
    for (let y = 3; y < 16; y += 4) for (let x = 0; x < 16; x++) px(c, x, y, '#9e6a33')
    for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) if (rng() > .3) px(c, x, y, '#dda762')
    for (let i = 0; i < 8; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#b47a3d')
    for (let y = 1; y < 16; y += 4) { px(c, 3, y + 1, '#6f4a24'); px(c, 11, y + 1, '#6f4a24') }
  },
  log_side(c, rng) {
    noiseFill(c, '#7b5230', 12, rng)
    for (let x = 0; x < 16; x += 3) for (let y = 0; y < 16; y++) px(c, x, y, '#5d3c22')
    for (let i = 0; i < 10; i++) { const x = (rng() * 16) | 0; for (let y = 0; y < 16; y++) if (rng() > .5) px(c, x, y, '#8f6238') }
    for (let i = 0; i < 6; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#a4764a')
  },
  log_top(c, rng) {
    noiseFill(c, '#c99a5e', 9, rng)
    for (let r = 6; r >= 1; r -= 2) {
      for (let a = 0; a < 40; a++) {
        const ang = (a / 40) * Math.PI * 2
        px(c, Math.round(8 + Math.cos(ang) * r), Math.round(8 + Math.sin(ang) * r), '#a87a45')
      }
    }
    px(c, 8, 8, '#8a6033'); px(c, 7, 8, '#8a6033'); px(c, 8, 7, '#8a6033')
  },
  leaves(c, rng) {
    noiseFill(c, '#4f9a3d', 20, rng)
    for (let i = 0; i < 22; i++) {
      const x = (rng() * 16) | 0, y = (rng() * 16) | 0
      c.fillStyle = rng() > .5 ? '#3f8231' : '#67b44d'; c.fillRect(x, y, 2, 1)
    }
    for (let i = 0; i < 6; i++) { const x = (rng() * 16) | 0, y = (rng() * 16) | 0; px(c, x, y, '#2e6a25') }
  },
  roof(c, rng) {
    noiseFill(c, '#7b4bc4', 12, rng)
    for (let y = 2; y < 16; y += 4) {
      for (let x = 0; x < 16; x++) {
        px(c, x, y, '#5f349f')
        const off = (Math.floor(y / 4) % 2) * 4
        if ((x + off) % 8 === 0) for (let k = 0; k < 4; k++) px(c, x, y + k, '#5f349f')
      }
    }
    for (let i = 0; i < 12; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#9463d8')
  },
  gold(c, rng) {
    noiseFill(c, '#f2c34a', 10, rng)
    for (let y = 0; y < 16; y += 8) for (let x = 0; x < 16; x++) px(c, x, y, '#c7962a')
    for (let y = 0; y < 16; y += 8) {
      const off = (y / 8) % 2 ? 8 : 0
      for (let x = off; x < 16; x += 16) for (let yy = 0; yy < 8; yy++) px(c, x, y + yy, '#c7962a')
    }
    for (let i = 0; i < 10; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#ffe28a')
    px(c, 3, 3, '#fff3c0'); px(c, 4, 3, '#ffe9a8'); px(c, 3, 4, '#ffe9a8')
  },
  glass(c, rng) {
    noiseFill(c, '#bfe9f2', 7, rng)
    c.strokeStyle = '#8fc9d8'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, 15, 15)
    for (let i = 0; i < 5; i++) { px(c, 3 + i, 11 - i, '#eefcff'); px(c, 4 + i, 11 - i, '#ffffff') }
    for (let i = 0; i < 4; i++) px(c, 11 - i, 3 + i, '#e0f7fc')
  },
  brick(c, rng) {
    c.fillStyle = '#e0c9b0'; c.fillRect(0, 0, 16, 16)
    for (let row = 0; row < 4; row++) {
      const y = row * 4
      for (let col = 0; col < 3; col++) {
        const x = (row % 2) * 3 + col * 6 - 2
        const base = shade('#b4573f', (rng() - .5) * 16)
        c.fillStyle = base; c.fillRect(x + 1, y + 1, 5, 3)
        c.fillStyle = shade(base, 10); c.fillRect(x + 1, y + 1, 5, 1)
      }
    }
    for (let i = 0; i < 6; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#8f3d2c')
  },
  mossy(c, rng) {
    painters.cobble(c, rng)
    for (let i = 0; i < 26; i++) {
      const x = (rng() * 16) | 0, y = (rng() * 16) | 0
      px(c, x, y, rng() > .5 ? '#5f8a4d' : '#6f9a57')
      if (rng() > .6) px(c, (x + 1) % 16, y, '#4f7840')
    }
  },
  snow(c, rng) {
    noiseFill(c, '#f2f7fb', 6, rng)
    for (let i = 0; i < 12; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#dbe8f2')
    for (let i = 0; i < 5; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#ffffff')
  },
  window(c, rng) {
    noiseFill(c, '#ffcf6b', 8, rng)
    for (let i = 0; i < 10; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#ffe9a8')
    c.fillStyle = '#6b4426'
    c.fillRect(0, 0, 16, 2); c.fillRect(0, 14, 16, 2); c.fillRect(0, 0, 2, 16); c.fillRect(14, 0, 2, 16)
    c.fillRect(7, 0, 2, 16); c.fillRect(0, 7, 16, 2)
  },
  bounce(c, rng) {
    noiseFill(c, '#ff5fa2', 12, rng)
    c.fillStyle = '#ffd1e6'
    const star = [[8, 3], [9, 3], [8, 4], [9, 4], [7, 5], [8, 5], [9, 5], [10, 5], [8, 6], [9, 6], [8, 7], [9, 7], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [8, 9], [9, 9], [8, 10], [9, 10]]
    for (const [x, y] of star) px(c, x, y, '#ffe4f0')
    c.strokeStyle = '#d63c7f'; c.strokeRect(0.5, 0.5, 15, 15)
  },
  bounce_side(c, rng) {
    noiseFill(c, '#d63c7f', 14, rng)
    for (let x = 0; x < 16; x += 4) for (let y = 0; y < 16; y++) px(c, x, y, '#b32e69')
    for (let i = 0; i < 8; i++) px(c, (rng() * 16) | 0, (rng() * 16) | 0, '#ff8cbb')
  },
  banner(c, rng) {
    noiseFill(c, '#7b4bc4', 10, rng)
    c.fillStyle = '#f2c34a'; c.fillRect(6, 2, 4, 12)
    c.fillStyle = '#ffe28a'; c.fillRect(7, 3, 2, 10)
    c.fillStyle = '#f2c34a'
    c.fillRect(4, 5, 8, 2); c.fillRect(5, 7, 2, 2); c.fillRect(9, 7, 2, 2)
    c.fillStyle = '#5f349f'; c.fillRect(0, 14, 16, 2)
  },
  water(c, rng) {
    noiseFill(c, '#58c8e8', 10, rng)
    for (let i = 0; i < 8; i++) {
      const x = (rng() * 14) | 0, y = (rng() * 16) | 0
      px(c, x, y, '#9ce6f7'); px(c, x + 1, y, '#9ce6f7'); px(c, x + 2, y, '#7cd9ef')
    }
  }
}

let atlasData = null

export function buildAtlas() {
  if (atlasData) return atlasData
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS; canvas.height = ATLAS
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  const names = Object.keys(painters)
  const uv = {}
  names.forEach((name, i) => {
    const col = i % GRID, row = Math.floor(i / GRID)
    const tile = document.createElement('canvas')
    tile.width = 16; tile.height = 16
    const tctx = tile.getContext('2d')
    tctx.imageSmoothingEnabled = false
    painters[name](tctx, rngFor(1000 + i * 7919))
    ctx.drawImage(tile, col * TILE, row * TILE, TILE, TILE)
    uv[name] = {
      u0: (col * TILE + 0.5) / ATLAS,
      v0: 1 - ((row + 1) * TILE - 0.5) / ATLAS,
      u1: ((col + 1) * TILE - 0.5) / ATLAS,
      v1: 1 - (row * TILE + 0.5) / ATLAS
    }
  })
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  atlasData = { texture, uv, canvas }
  return atlasData
}

/* ------------------------------------------------------------------ *
 *  UI helpers — isometric block icons and crack overlay
 * ------------------------------------------------------------------ */

export function makeBlockIcon(key, size = 64) {
  const b = BLOCKS[key]
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  const s = size / 64
  const cx = size / 2
  const topY = 8 * s, midY = 24 * s, botY = 56 * s
  const half = 24 * s, inset = 12 * s
  ctx.lineJoin = 'round'

  // top diamond
  ctx.beginPath()
  ctx.moveTo(cx, topY); ctx.lineTo(cx + half, topY + inset); ctx.lineTo(cx, midY + (midY - topY) * 0 + inset * 0); ctx.lineTo(cx - half, topY + inset); ctx.closePath()
  ctx.fillStyle = b.ui.top; ctx.fill()
  // left face
  ctx.beginPath()
  ctx.moveTo(cx - half, topY + inset); ctx.lineTo(cx, midY + inset); ctx.lineTo(cx, botY); ctx.lineTo(cx - half, botY - inset); ctx.closePath()
  ctx.fillStyle = b.ui.left; ctx.fill()
  // right face
  ctx.beginPath()
  ctx.moveTo(cx + half, topY + inset); ctx.lineTo(cx, midY + inset); ctx.lineTo(cx, botY); ctx.lineTo(cx + half, botY - inset); ctx.closePath()
  ctx.fillStyle = b.ui.right; ctx.fill()

  // speckle detail
  ctx.save()
  ctx.beginPath(); ctx.moveTo(cx, topY); ctx.lineTo(cx + half, topY + inset); ctx.lineTo(cx, midY + inset); ctx.lineTo(cx - half, topY + inset); ctx.closePath(); ctx.clip()
  ctx.globalAlpha = .22
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 ? '#ffffff' : '#000000'
    ctx.fillRect(cx - half + Math.random() * half * 2, topY + Math.random() * inset * 2, 3 * s, 3 * s)
  }
  ctx.restore()
  ctx.globalAlpha = .16
  ctx.fillStyle = '#000'; ctx.fillRect(cx, midY + inset, half, botY - midY - inset)
  ctx.globalAlpha = 1

  // outline + highlight
  ctx.strokeStyle = 'rgba(20,16,38,.55)'; ctx.lineWidth = 2.5 * s
  ctx.beginPath()
  ctx.moveTo(cx, topY); ctx.lineTo(cx + half, topY + inset); ctx.lineTo(cx + half, botY - inset); ctx.lineTo(cx, botY); ctx.lineTo(cx - half, botY - inset); ctx.lineTo(cx - half, topY + inset); ctx.closePath(); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, midY + inset); ctx.lineTo(cx, botY); ctx.moveTo(cx - half, topY + inset); ctx.lineTo(cx, midY + inset); ctx.lineTo(cx + half, topY + inset); ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2 * s
  ctx.beginPath(); ctx.moveTo(cx - half + 2 * s, topY + inset + 2 * s); ctx.lineTo(cx - half + 2 * s, botY - inset - 2 * s); ctx.stroke()
  return c
}

let crackCanvas = null
export function makeCrackTexture() {
  if (crackCanvas) return crackCanvas
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const ctx = c.getContext('2d')
  ctx.strokeStyle = 'rgba(20,14,10,.9)'
  ctx.lineWidth = 1.2
  const rng = rngFor(4242)
  for (let i = 0; i < 7; i++) {
    let x = 16, y = 16
    ctx.beginPath(); ctx.moveTo(x, y)
    for (let s = 0; s < 5; s++) {
      x += (rng() - .5) * 12; y += (rng() - .5) * 12
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,255,255,.18)'
  ctx.lineWidth = .6
  for (let i = 0; i < 5; i++) {
    let x = 16, y = 16
    ctx.beginPath(); ctx.moveTo(x, y)
    for (let s = 0; s < 4; s++) { x += (rng() - .5) * 12; y += (rng() - .5) * 12; ctx.lineTo(x, y) }
    ctx.stroke()
  }
  crackCanvas = new THREE.CanvasTexture(c)
  crackCanvas.magFilter = THREE.NearestFilter
  crackCanvas.minFilter = THREE.NearestFilter
  crackCanvas.generateMipmaps = false
  return crackCanvas
}

export function blockColor(key) {
  return BLOCKS[key]?.ui?.top || '#ffffff'
}
