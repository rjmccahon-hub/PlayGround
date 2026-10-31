import * as THREE from '../vendor/three.module.js'
import {
  BLOCKS, AIR, ID_TO_KEY, KEY_TO_ID, isOpaque, isSolid, isWater, buildAtlas, blockColor
} from './blocks.js'

export const WORLD = 80
export const HEIGHT = 48
export const CHUNK = 16
export const WATER_LEVEL = 11

const B = key => KEY_TO_ID[key]
const idx = (x, y, z) => (y * WORLD + z) * WORLD + x

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t) }
function lerp(a, b, t) { return a + (b - a) * t }
function hash2(x, z, seed = 0) {
  let h = x * 374761393 + z * 668265263 + seed * 2246822519
  h = (h ^ (h >> 13)) * 1274126177
  return ((h ^ (h >> 16)) >>> 0) / 4294967296
}

function islandRadius(angle) {
  return 29.5 + 3.2 * Math.sin(angle * 3 + 0.8) + 2.1 * Math.sin(angle * 5 + 2.4) + 1.2 * Math.sin(angle * 8 + 0.2)
}

const FACE_DEFS = [
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.86, tile: 'side' },
  { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.82, tile: 'side' },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1, tile: 'top' },
  { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.72, tile: 'bottom' },
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.92, tile: 'side' },
  { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.78, tile: 'side' }
]
const CORNER_SIGNS = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
const AO_CURVE = [0.62, 0.74, 0.87, 1]

export class World {
  constructor(scene) {
    this.scene = scene
    this.data = new Uint8Array(WORLD * WORLD * HEIGHT)
    this.base = new Uint8Array(WORLD * WORLD * HEIGHT)
    this.edits = new Map()
    this.chunks = new Map()
    this.group = new THREE.Group()
    this.group.name = 'voxel-world'
    scene.add(this.group)
    this.atlas = buildAtlas()
    this.opaqueMat = new THREE.MeshLambertMaterial({ map: this.atlas.texture, vertexColors: true })
    this.waterMat = new THREE.MeshLambertMaterial({
      color: 0x63d4ef, transparent: true, opacity: 0.68,
      emissive: 0x0e4d5e, emissiveIntensity: 0.35, depthWrite: false
    })
    this.generate()
  }

  /* ----------------------------- generation ----------------------------- */

  generate() {
    const data = this.data
    data.fill(0)
    this.tops = new Uint8Array(WORLD * WORLD)
    this.kinds = new Uint8Array(WORLD * WORLD)

    for (let z = 0; z < WORLD; z++) {
      for (let x = 0; x < WORLD; x++) {
        const dx = x - 40, dz = z - 40
        const d = Math.hypot(dx, dz)
        const ang = Math.atan2(dz, dx)
        const radius = islandRadius(ang)
        if (d > radius + 0.5) { this.tops[z * WORLD + x] = 0; continue }

        const edge = smooth((radius - d) / 8)
        let h = 11 + 1.5 * Math.sin(x * 0.18) * Math.cos(z * 0.16) + 1.0 * Math.sin((x + z) * 0.12) + 0.55 * Math.sin(x * 0.41 + z * 0.27)
        h = 7.4 + (h - 7.4) * edge
        let kind = 0 // 0 grass, 1 cobble, 2 sandstone

        // pond bowl
        const pondD = Math.hypot(x - 56, z - 48)
        if (pondD < 8.4) {
          if (pondD < 5.2) { h = 8; kind = 2 }
          else if (pondD < 7.1) { h = 10; kind = 2 }
          else h = lerp(h, 11, smooth((8.4 - pondD) / 1.3))
        }

        // village plaza and paths
        const plazaD = Math.hypot(x - 40, z - 49)
        const onPath = (x >= 37.5 && x <= 42.5 && z >= 36 && z <= 57) || (z >= 46.5 && z <= 49.5 && x >= 43 && x <= 53)
        if (plazaD < 8.6) { h = lerp(h, 11, smooth((8.6 - plazaD) / 3)); if (plazaD < 7.6) kind = 1 }
        if (onPath) { h = lerp(h, 11, 0.92); kind = 1 }
        const spawnD = Math.hypot(x - 40, z - 54)
        if (spawnD < 6) { h = lerp(h, 11, smooth((6 - spawnD) / 3)); if (spawnD < 4.5) kind = 1 }

        // castle plateau
        const insideX = x >= 30 && x <= 50, insideZ = z >= 18 && z <= 38
        if (insideX && insideZ) {
          h = 15
          kind = 0
        } else {
          const ox = Math.max(30 - x, 0, x - 50), oz = Math.max(18 - z, 0, z - 38)
          const od = Math.hypot(ox, oz)
          if (od < 3) { h = lerp(h, 15, smooth((3 - od) / 3) * 0.85); kind = 0 }
        }

        const top = Math.max(2, Math.round(h))
        this.tops[z * WORLD + x] = top
        this.kinds[z * WORLD + x] = kind

        const depth = 4.5 + 9.5 * Math.pow(1 - clamp(d / radius, 0, 1), 1.6) + hash2(x, z, 7) * 2.5
        const bottom = Math.max(1, Math.round(top - depth))
        const grassTop = kind === 0
        const surface = kind === 1 ? 'cobble' : kind === 2 ? 'sandstone' : 'grass'
        for (let y = bottom; y <= top; y++) {
          let key
          if (y === top) key = surface
          else if (y >= top - 2) key = kind === 2 ? (hash2(x, y, z) > .5 ? 'sandstone' : 'dirt') : 'dirt'
          else {
            const r = hash2(x * 3 + y, z * 5, 11)
            key = r > 0.94 ? 'mossy' : r > 0.89 ? 'cobble' : 'stone'
          }
          if (y <= bottom + 1 && hash2(x, y, z + 4) > 0.55) key = 'mossy'
          data[idx(x, y, z)] = B(key)
        }
        if (!grassTop && kind !== 1) {
          // soft sandy lip around the pond
          if (top + 1 < HEIGHT) data[idx(x, top + 1, z)] = AIR
        }
      }
    }

    this.buildPathsAndStairs()
    this.buildCastle()
    this.buildFountain()
    this.buildPond()
    this.buildTrees()
    this.buildBoulders()
    this.buildParkour()
    this.base.set(data)
    this.edits.clear()
  }

  setRaw(x, y, z, key) {
    if (x < 0 || x >= WORLD || z < 0 || z >= WORLD || y < 0 || y >= HEIGHT) return
    this.data[idx(x, y, z)] = key === AIR ? AIR : B(key)
  }
  clearRaw(x, y, z) {
    if (x < 0 || x >= WORLD || z < 0 || z >= WORLD || y < 0 || y >= HEIGHT) return
    this.data[idx(x, y, z)] = AIR
  }
  columnTo(x, z, top, key, bottom = null) {
    if (x < 0 || x >= WORLD || z < 0 || z >= WORLD) return
    const b = bottom == null ? Math.max(0, top - 12) : bottom
    for (let y = 0; y < HEIGHT; y++) {
      if (y > top) this.clearRaw(x, y, z)
      else if (y === top) this.setRaw(x, y, z, key)
      else if (y >= b) this.setRaw(x, y, z, y > top - 3 ? 'dirt' : 'stone')
    }
    this.tops[z * WORLD + x] = top
  }

  buildPathsAndStairs() {
    // grand stairway up to the gate
    const stepTops = { 37: 14, 38: 13, 39: 12, 40: 11 }
    for (const [zs, top] of Object.entries(stepTops)) {
      const z = Number(zs)
      for (let x = 36; x <= 44; x++) {
        this.columnTo(x, z, top, 'cobble', top - 3)
        // gold trim on the balustrade
        if (x === 36 || x === 44) this.setRaw(x, top + 1, z, 'gold')
      }
    }
    // cobble apron in front of stairs
    for (let z = 41; z <= 57; z++) {
      for (let x = 37; x <= 43; x++) {
        if (Math.hypot(x - 40, z - 49) < 8.6 || (x >= 38 && x <= 42)) {
          for (let y = 12; y <= 15; y++) this.clearRaw(x, y, z)
          this.setRaw(x, 11, z, 'cobble')
          this.tops[z * WORLD + x] = 11
        }
      }
    }
    // plaza pattern — rings of stone and a warm sandstone medallion
    for (let z = 40; z <= 58; z++) {
      for (let x = 31; x <= 49; x++) {
        const d = Math.hypot(x - 40, z - 49)
        if (d < 8.2) {
          const ring = Math.floor(d * 1.4)
          for (let y = 12; y <= 14; y++) this.clearRaw(x, y, z)
          this.setRaw(x, 11, z, ring % 2 ? 'cobble' : (d < 2.2 ? 'gold' : 'stone'))
          this.tops[z * WORLD + x] = 11
        }
      }
    }
    // path east to the pond
    for (let x = 44; x <= 54; x++) for (let z = 47; z <= 49; z++) {
      this.setRaw(x, 11, z, 'cobble'); this.tops[z * WORLD + x] = 11
    }
  }

  buildCastle() {
    const put = (x, y, z, k) => this.setRaw(x, y, z, k)
    // courtyard floor
    for (let x = 31; x <= 49; x++) for (let z = 20; z <= 36; z++) put(x, 15, z, 'stone')

    // outer curtain wall, two blocks thick, crenellated
    for (let y = 16; y <= 22; y++) {
      for (let x = 31; x <= 49; x++) for (let z = 20; z <= 36; z++) {
        const edge = x === 31 || x === 49 || z === 20 || z === 36
        const inner = x === 32 || x === 48 || z === 21 || z === 35
        if (!edge && !inner) continue
        put(x, y, z, y === 22 && (x + z) % 5 === 0 ? 'mossy' : (y === 16 ? 'cobble' : 'stone'))
      }
    }
    // crenellations
    for (let x = 31; x <= 49; x++) for (let z = 20; z <= 36; z++) {
      const edge = x === 31 || x === 49 || z === 20 || z === 36
      if (edge && (x + z) % 2 === 0) put(x, 23, z, 'stone')
    }
    // gold trim band
    for (let x = 31; x <= 49; x++) { put(x, 21, 36, 'gold'); put(x, 21, 20, 'gold') }
    for (let z = 20; z <= 36; z++) { put(31, 21, z, 'gold'); put(49, 21, z, 'gold') }

    // gate
    for (let x = 38; x <= 42; x++) {
      for (let y = 16; y <= 20; y++) for (let z = 35; z <= 36; z++) this.clearRaw(x, y, z)
      put(x, 21, 35, 'stone'); put(x, 21, 36, 'stone')
    }
    for (let x = 37; x <= 43; x++) put(x, 22, 36, 'stone')
    // gate torches and banners
    put(37, 19, 36, 'window'); put(43, 19, 36, 'window')
    for (let y = 17; y <= 20; y++) { put(36, y, 36, 'banner'); put(44, y, 36, 'banner') }
    put(36, 21, 36, 'gold'); put(44, 21, 36, 'gold')

    // corner towers
    const towers = [
      { x: 33, z: 22, h: 12, r: 2.6 },
      { x: 47, z: 22, h: 12, r: 2.6 },
      { x: 33, z: 34, h: 15, r: 2.7 },
      { x: 47, z: 34, h: 15, r: 2.7 }
    ]
    for (const t of towers) {
      const baseY = 16, topY = baseY + t.h
      for (let y = baseY; y <= topY; y++) {
        for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
          const d = Math.hypot(dx, dz)
          if (d > t.r) continue
          if (d > t.r - 0.9) put(t.x + dx, y, t.z + dz, y === topY ? 'cobble' : (y % 6 === 0 ? 'cobble' : 'stone'))
          else if (y === baseY) put(t.x + dx, y, t.z + dz, 'stone')
          else if (d < 1.2 && y > baseY && y < topY - 1) this.clearRaw(t.x + dx, y, t.z + dz)
        }
      }
      // battlement ring
      for (let a = 0; a < 16; a++) {
        const ang = (a / 16) * Math.PI * 2
        const bx = Math.round(t.x + Math.cos(ang) * (t.r + 0.2))
        const bz = Math.round(t.z + Math.sin(ang) * (t.r + 0.2))
        if (a % 2 === 0) put(bx, topY + 1, bz, 'stone')
      }
      // conical roof
      for (let i = 0; i < 6; i++) {
        const r = t.r + 0.5 - i * 0.5
        const y = topY + 1 + i
        for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
          if (Math.hypot(dx, dz) <= r) put(t.x + dx, y, t.z + dz, i === 0 ? 'roof' : (dx === 0 && dz === 0 && i > 3 ? 'gold' : 'roof'))
        }
      }
      put(t.x, topY + 7, t.z, 'gold')
      // tall window slits
      for (let y = 20; y <= topY - 3; y += 4) {
        put(t.x - Math.round(t.r), y, t.z, 'window')
      }
    }

    // central keep — hollow, with a throne room
    for (let x = 37; x <= 43; x++) for (let z = 24; z <= 30; z++) {
      const wall = x === 37 || x === 43 || z === 24 || z === 30
      if (wall) {
        for (let y = 16; y <= 27; y++) {
          let k = 'stone'
          if (y === 16) k = 'cobble'
          if (y === 27) k = 'gold'
          put(x, y, z, k)
        }
      } else {
        put(x, 15, z, 'stone')
        for (let y = 16; y <= 27; y++) this.clearRaw(x, y, z)
      }
    }
    // door
    for (let x = 39; x <= 41; x++) for (let y = 16; y <= 18; y++) this.clearRaw(x, y, 30)
    // keep windows
    for (const [x, y, z] of [[37, 21, 27], [43, 21, 27], [37, 24, 27], [43, 24, 27], [39, 21, 24], [41, 21, 24], [40, 24, 30], [38, 24, 30], [42, 24, 30]]) put(x, y, z, 'window')
    // keep roof
    for (let i = 0; i < 6; i++) {
      const r = 4.5 - i * 0.8
      const y = 28 + i
      for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
        if (Math.abs(dx) <= r && Math.abs(dz) <= r) put(40 + dx, y, 27 + dz, i === 0 ? 'roof' : (Math.abs(dx) <= 1 && Math.abs(dz) <= 1 && i > 3 ? 'gold' : 'roof'))
      }
    }
    put(40, 34, 27, 'gold'); put(40, 35, 27, 'gold')
    // throne and banners
    put(40, 16, 27, 'gold'); put(40, 17, 27, 'gold')
    for (let y = 18; y <= 21; y++) { put(39, y, 24, 'banner'); put(41, y, 24, 'banner') }
    put(40, 19, 24, 'window')
    // torches in the courtyard
    for (const [x, z] of [[35, 33], [45, 33], [35, 25], [45, 25]]) {
      put(x, 17, z, 'planks'); put(x, 18, z, 'window')
    }
    // a few supply crates
    for (const [x, z] of [[34, 32], [46, 32], [34, 23]]) {
      put(x, 16, z, 'planks'); put(x, 17, z, 'log')
    }
  }

  buildFountain() {
    const cx = 40, cz = 47
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      const d = Math.hypot(dx, dz)
      if (d <= 3.4 && d > 2.3) { this.setRaw(cx + dx, 12, cz + dz, 'stone'); this.setRaw(cx + dx, 11, cz + dz, 'stone') }
      else if (d <= 2.3) {
        this.clearRaw(cx + dx, 12, cz + dz)
        this.setRaw(cx + dx, 11, cz + dz, 'water')
        this.setRaw(cx + dx, 10, cz + dz, 'stone')
      }
    }
    for (let y = 12; y <= 14; y++) this.setRaw(cx, y, cz, 'stone')
    this.setRaw(cx, 15, cz, 'gold')
  }

  buildPond() {
    const cx = 56, cz = 48
    for (let dx = -5; dx <= 5; dx++) for (let dz = -5; dz <= 5; dz++) {
      const d = Math.hypot(dx, dz)
      if (d < 5.2) {
        for (let y = 9; y <= 10; y++) this.setRaw(cx + dx, y, cz + dz, 'water')
        this.setRaw(cx + dx, 8, cz + dz, 'sandstone')
        this.clearRaw(cx + dx, 11, cz + dz)
      }
    }
    // lily pads and a little dock
    for (const [x, z] of [[54, 46], [58, 49], [55, 51]]) this.setRaw(x, 11, z, 'leaves')
    for (let x = 49; x <= 51; x++) { this.setRaw(x, 11, 48, 'planks'); this.setRaw(x, 10, 48, 'log') }
    this.setRaw(52, 11, 48, 'planks')
  }

  addTree(x, z, size = 1) {
    const top = this.getTop(x, z)
    if (top <= 1) return
    const key = this.getKey(x, top, z)
    if (key !== 'grass' && key !== 'dirt') return
    const h = Math.round(3 + 2 * size)
    for (let i = 1; i <= h; i++) this.setRaw(x, top + i, z, 'log')
    const cy = top + h
    const r = size > 1.15 ? 3 : 2
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (let dy = -1; dy <= 2; dy++) {
      const d = Math.hypot(dx, dz) + Math.abs(dy) * 0.55
      if (d > r + 0.4) continue
      if (dx === 0 && dz === 0 && dy <= 0) continue
      if (this.getBlock(x + dx, cy + dy, z + dz) === AIR) this.setRaw(x + dx, cy + dy, z + dz, 'leaves')
    }
    // a couple of roots / mushrooms
    if (size > 1.1) this.setRaw(x + 1, top + 1, z + 1, 'mossy')
  }

  buildTrees() {
    const spots = [
      [15, 27, 1.2], [21, 56, 1], [58, 25, 1.25], [65, 60, 1], [19, 64, 1.1],
      [11, 44, 1], [49, 65, 1.2], [30, 17, 1], [66, 50, 1], [47, 61, 1],
      [25, 37, 0.9], [10, 35, 1.1], [57, 64, 1.2], [36, 63, 1], [67, 32, 1]
    ]
    for (const [x, z, s] of spots) this.addTree(x, z, s)
  }

  buildBoulders() {
    const spots = [[51, 59, 2], [24, 47, 1.5], [61, 56, 1.7], [18, 50, 1.3], [22, 30, 1.2]]
    for (const [x, z, s] of spots) {
      const top = this.getTop(x, z)
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 1; dy++) {
        if (Math.hypot(dx, dz) + dy * .6 < s) this.setRaw(x + dx, top + dy, z + dz, hash2(x + dx, z + dz, 3) > .55 ? 'mossy' : 'stone')
      }
    }
  }

  buildParkour() {
    // access steps on the east shore
    const steps = [[60, 40, 9], [61, 40, 10], [62, 40, 11], [63, 40, 12]]
    for (const [x, z, top] of steps) this.columnTo(x, z, top, 'cobble', top - 4)
    // launch platform
    for (let x = 64; x <= 68; x++) for (let z = 38; z <= 42; z++) {
      for (let y = 1; y <= 12; y++) {
        if (y === 12) this.setRaw(x, y, z, 'cobble')
        else if (this.getBlock(x, y, z) === AIR || y < 6) this.setRaw(x, y, z, y < 4 ? 'mossy' : 'stone')
      }
    }
    // floating stepping stones
    const platforms = [
      { x: 72, z: 42, top: 13, w: 3, d: 3, pad: false },
      { x: 76, z: 38, top: 14, w: 3, d: 3, pad: true },
      { x: 76, z: 34, top: 15, w: 3, d: 3, pad: false }
    ]
    for (const p of platforms) {
      for (let dx = -Math.floor(p.w / 2); dx <= Math.floor(p.w / 2); dx++) {
        for (let dz = -Math.floor(p.d / 2); dz <= Math.floor(p.d / 2); dz++) {
          for (let dy = 0; dy <= 1; dy++) {
            const y = p.top - dy
            this.setRaw(p.x + dx, y, p.z + dz, dy === 0 ? ((dx + dz) % 2 === 0 ? 'cobble' : 'stone') : 'mossy')
          }
        }
      }
      if (p.pad) this.setRaw(p.x, p.top, p.z, 'bounce')
      // gold corner caps sit flush with the deck
      const hw = Math.floor(p.w / 2), hd = Math.floor(p.d / 2)
      for (const [sx, sz] of [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]]) {
        this.setRaw(p.x + sx, p.top, p.z + sz, 'gold')
      }
      // hanging underside
      for (let i = 1; i <= 2; i++) this.setRaw(p.x, p.top - 1 - i, p.z, 'stone')
    }
    // sky islet
    const cx = 73, cz = 28
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      const d = Math.hypot(dx, dz)
      if (d > 3.7) continue
      const top = d < 1.6 ? 17 : 16
      for (let y = 10; y <= top; y++) {
        let k = 'stone'
        if (y === top) k = 'grass'
        else if (y >= top - 1) k = 'dirt'
        else if (hash2(cx + dx, y, cz + dz) > .8) k = 'mossy'
        this.setRaw(cx + dx, y, cz + dz, k)
      }
      if (d > 2.6 && hash2(cx + dx, cz + dz, 9) > .55) this.setRaw(cx + dx, top + 1, cz + dz, 'leaves')
    }
    // beacon
    this.setRaw(cx, 18, cz, 'gold')
    this.setRaw(cx, 19, cz, 'gold')
    // a couple of decorative rocks drifting nearby
    for (const [x, y, z] of [[68, 20, 45], [80 - 2, 22, 47], [69, 24, 22], [79, 18, 33]]) {
      if (x < WORLD && z < WORLD) { this.setRaw(x, y, z, 'mossy'); this.setRaw(x, y + 1, z, 'grass') }
    }
  }

  /* ------------------------------ access ------------------------------- */

  inBounds(x, y, z) {
    return x >= 0 && x < WORLD && z >= 0 && z < WORLD && y >= 0 && y < HEIGHT
  }
  getBlock(x, y, z) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z)
    if (!this.inBounds(x, y, z)) return AIR
    return this.data[idx(x, y, z)]
  }
  getKey(x, y, z) {
    const id = this.getBlock(x, y, z)
    return id === AIR ? null : ID_TO_KEY[id]
  }
  isSolid(x, y, z) { return isSolid(this.getBlock(x, y, z)) }
  isOpaque(x, y, z) { return isOpaque(this.getBlock(x, y, z)) }
  getTop(x, z) {
    x = Math.floor(x); z = Math.floor(z)
    if (x < 0 || x >= WORLD || z < 0 || z >= WORLD) return 0
    for (let y = HEIGHT - 1; y >= 0; y--) {
      if (isSolid(this.data[idx(x, y, z)])) return y
    }
    return 0
  }
  surfaceY(x, z) { return this.getTop(x, z) + 1 }
  surfaceKey(x, z) {
    const top = this.getTop(x, z)
    return top > 0 ? ID_TO_KEY[this.getBlock(x, top, z)] : null
  }

  setBlock(x, y, z, key, record = true) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z)
    if (!this.inBounds(x, y, z)) return false
    const id = key === AIR ? AIR : B(key)
    const i = idx(x, y, z)
    if (this.data[i] === id) return false
    this.data[i] = id
    if (record) {
      if (this.base[i] === id) this.edits.delete(i)
      else this.edits.set(i, id)
    }
    this.markDirtyAround(x, z)
    return true
  }
  removeBlock(x, y, z, record = true) { return this.setBlock(x, y, z, AIR, record) }

  markDirtyAround(x, z) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK)
    for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) {
      const key = `${cx + ax},${cz + az}`
      const chunk = this.chunks.get(key)
      if (chunk) chunk.dirty = true
    }
  }

  /* ------------------------------ meshing ------------------------------ */

  buildChunks() {
    for (let cx = 0; cx < WORLD / CHUNK; cx++) for (let cz = 0; cz < WORLD / CHUNK; cz++) {
      const key = `${cx},${cz}`
      this.chunks.set(key, { cx, cz, opaque: null, water: null, dirty: false })
      this.rebuildChunk(cx, cz)
    }
  }

  rebuildChunk(cx, cz) {
    const chunk = this.chunks.get(`${cx},${cz}`)
    if (!chunk) return
    chunk.dirty = false
    const x0 = cx * CHUNK, z0 = cz * CHUNK
    const pos = [], nor = [], uv = [], col = [], ind = []
    const wpos = [], wnor = [], wuv = [], wcol = [], wind = []
    const uvMap = this.atlas.uv
    let vcount = 0, wcount = 0
    const ao = [0, 0, 0, 0]

    const pushFace = (arrays, x, y, z, face, block, aoVals, shadeMul = 1) => {
      const { n, corners } = face
      const tileName = BLOCKS[block].tiles[face.tile] || BLOCKS[block].tiles.side
      const t = uvMap[tileName]
      const base = arrays.pos.length / 3
      for (let i = 0; i < 4; i++) {
        const c = corners[i]
        arrays.pos.push(x + c[0], y + c[1], z + c[2])
        arrays.nor.push(n[0], n[1], n[2])
        const u = i === 0 || i === 3 ? t.u0 : t.u1
        const v = i < 2 ? t.v0 : t.v1
        arrays.uv.push(u, v)
        const b = AO_CURVE[aoVals[i]] * face.shade * shadeMul
        arrays.col.push(b, b, b)
      }
      arrays.ind.push(base, base + 1, base + 2, base, base + 2, base + 3)
    }

    for (let x = x0; x < x0 + CHUNK; x++) {
      for (let z = z0; z < z0 + CHUNK; z++) {
        for (let y = 0; y < HEIGHT; y++) {
          const id = this.data[idx(x, y, z)]
          if (id === AIR) continue
          const block = ID_TO_KEY[id]
          const water = BLOCKS[block].liquid
          for (let f = 0; f < 6; f++) {
            const face = FACE_DEFS[f]
            const nx = x + face.n[0], ny = y + face.n[1], nz = z + face.n[2]
            const neighbor = this.getBlock(nx, ny, nz)
            if (water) {
              if (f !== 2) {
                if (neighbor !== AIR) continue
              } else if (isWater(neighbor) || isOpaque(neighbor)) continue
            } else if (isOpaque(neighbor)) continue

            for (let i = 0; i < 4; i++) {
              const [su, sv] = CORNER_SIGNS[i]
              const s1 = this.isOpaque(nx + face.u[0] * su, ny + face.u[1] * su, nz + face.u[2] * su)
              const s2 = this.isOpaque(nx + face.v[0] * sv, ny + face.v[1] * sv, nz + face.v[2] * sv)
              const cr = this.isOpaque(
                nx + face.u[0] * su + face.v[0] * sv,
                ny + face.u[1] * su + face.v[1] * sv,
                nz + face.u[2] * su + face.v[2] * sv
              )
              ao[i] = s1 && s2 ? 0 : 3 - (s1 + s2 + cr)
            }
            if (water) {
              const yOff = f === 2 ? -0.12 : 0
              const arr = { pos: wpos, nor: wnor, uv: wuv, col: wcol, ind: wind }
              // water faces sit slightly low and are unlit-warm
              const saved = ao.slice()
              pushFace(arr, x, y + yOff, z, face, block, saved, 1)
            } else {
              const arr = { pos, nor, uv, col, ind }
              pushFace(arr, x, y, z, face, block, ao)
            }
          }
        }
      }
    }

    const makeGeo = (arr) => {
      if (!arr.pos.length) return null
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr.pos, 3))
      g.setAttribute('normal', new THREE.Float32BufferAttribute(arr.nor, 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute(arr.uv, 2))
      g.setAttribute('color', new THREE.Float32BufferAttribute(arr.col, 3))
      g.setIndex(arr.ind)
      g.computeBoundingSphere()
      return g
    }

    if (chunk.opaque) {
      chunk.opaque.geometry.dispose()
      this.group.remove(chunk.opaque)
      chunk.opaque = null
    }
    if (chunk.water) {
      chunk.water.geometry.dispose()
      this.group.remove(chunk.water)
      chunk.water = null
    }
    const geo = makeGeo({ pos, nor, uv, col, ind })
    if (geo) {
      const mesh = new THREE.Mesh(geo, this.opaqueMat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.matrixAutoUpdate = false
      this.group.add(mesh)
      chunk.opaque = mesh
    }
    const wgeo = makeGeo({ pos: wpos, nor: wnor, uv: wuv, col: wcol, ind: wind })
    if (wgeo) {
      const mesh = new THREE.Mesh(wgeo, this.waterMat)
      mesh.receiveShadow = true
      mesh.renderOrder = 2
      mesh.matrixAutoUpdate = false
      this.group.add(mesh)
      chunk.water = mesh
    }
  }

  flushDirty() {
    for (const chunk of this.chunks.values()) if (chunk.dirty) this.rebuildChunk(chunk.cx, chunk.cz)
  }

  /* ---------------------------- collision ------------------------------ */

  collides(minX, minY, minZ, maxX, maxY, maxZ) {
    const x0 = Math.floor(minX), x1 = Math.floor(maxX - 1e-5)
    const y0 = Math.floor(minY), y1 = Math.floor(maxY - 1e-5)
    const z0 = Math.floor(minZ), z1 = Math.floor(maxZ - 1e-5)
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (this.isSolid(x, y, z)) return true
    }
    return false
  }

  /* ------------------------------ raycast ------------------------------ */

  raycast(origin, dir, maxDist = 7) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z)
    const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z)
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity
    const boundary = (p, step) => step > 0 ? (Math.floor(p) + 1 - p) : (p - Math.floor(p))
    let tMaxX = stepX !== 0 ? boundary(origin.x, stepX) * tDeltaX : Infinity
    let tMaxY = stepY !== 0 ? boundary(origin.y, stepY) * tDeltaY : Infinity
    let tMaxZ = stepZ !== 0 ? boundary(origin.z, stepZ) * tDeltaZ : Infinity
    let normal = [0, 0, 0]
    let t = 0
    for (let i = 0; i < 256; i++) {
      const id = this.getBlock(x, y, z)
      if (id !== AIR && !isWater(id)) {
        return { x, y, z, id, key: ID_TO_KEY[id], normal, distance: t }
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX; t = tMaxX; tMaxX += tDeltaX; normal = [-stepX, 0, 0]
      } else if (tMaxY < tMaxZ) {
        y += stepY; t = tMaxY; tMaxY += tDeltaY; normal = [0, -stepY, 0]
      } else {
        z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; normal = [0, 0, -stepZ]
      }
      if (t > maxDist) break
    }
    return null
  }

  /* ---------------------------- persistence ---------------------------- */

  serializeEdits() { return [...this.edits.entries()] }
  applyEdits(list) {
    if (!Array.isArray(list)) return
    for (const [i, id] of list) {
      if (!Number.isInteger(i) || i < 0 || i >= this.data.length) continue
      if (!Number.isInteger(id) || id < 0 || id > 255) continue
      this.data[i] = id
      this.edits.set(i, id)
    }
    for (const chunk of this.chunks.values()) chunk.dirty = true
    this.flushDirty()
  }
  resetEdits() {
    this.data.set(this.base)
    this.edits.clear()
    for (const chunk of this.chunks.values()) chunk.dirty = true
    this.flushDirty()
  }

  topColor(x, z) {
    const key = this.surfaceKey(x, z)
    return key ? blockColor(key) : null
  }
}
