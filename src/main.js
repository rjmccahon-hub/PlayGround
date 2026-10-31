import * as THREE from '../vendor/three.module.js'
import { World, WORLD, HEIGHT } from './world.js'
import { BLOCKS, KEY_TO_ID } from './blocks.js'
import { Player } from './player.js'
import { Particles } from './particles.js'
import { Audio } from './audio.js'
import { Quests } from './quests.js'
import { createNPCs } from './npcs.js'
import { UI } from './ui.js'
import { HATS } from './character.js'

const SAVE_KEY = 'cubic-kingdoms-save-v1'
const isTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
  navigator.maxTouchPoints > 0 ||
  window.innerWidth <= 700
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

/* ---------------------------------------------------------------- scene */

const canvas = document.getElementById('game')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false })
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.4 : 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.16
renderer.shadowMap.enabled = !isTouch
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.08, 500)
camera.position.set(40, 22, 62)
scene.fog = new THREE.Fog(0xbfe9ff, 55, 240)

const hemi = new THREE.HemisphereLight(0xcdefff, 0x5a4a33, 0.92)
scene.add(hemi)
const ambient = new THREE.AmbientLight(0xffffff, 0.3)
scene.add(ambient)

const sunLight = new THREE.DirectionalLight(0xfff2d0, 1.35)
sunLight.castShadow = !isTouch
sunLight.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048)
sunLight.shadow.camera.left = -44
sunLight.shadow.camera.right = 44
sunLight.shadow.camera.top = 44
sunLight.shadow.camera.bottom = -44
sunLight.shadow.camera.near = 0.5
sunLight.shadow.camera.far = 180
sunLight.shadow.bias = -0.0006
sunLight.shadow.normalBias = 0.035
sunLight.target.position.set(40, 12, 40)
scene.add(sunLight, sunLight.target)

const moonLight = new THREE.DirectionalLight(0x9fb4ff, 0.1)
scene.add(moonLight)

// soft sky fill so south-facing castle walls stay inviting
const fillLight = new THREE.DirectionalLight(0xcfe6ff, 0.42)
fillLight.position.set(0, 35, 90)
fillLight.target.position.set(40, 12, 40)
scene.add(fillLight, fillLight.target)

/* -------------------------------------------------------------- sky dome */

const skyUniforms = {
  topColor: { value: new THREE.Color('#3f9fe0') },
  bottomColor: { value: new THREE.Color('#c9efff') },
  sunColor: { value: new THREE.Color('#fff3b0') },
  sunDir: { value: new THREE.Vector3(0.4, 0.7, 0.2) },
  exponent: { value: 0.72 }
}
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(310, 40, 24),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: `varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `varying vec3 vWorld;
      uniform vec3 topColor, bottomColor, sunColor, sunDir;
      uniform float exponent;
      void main() {
        vec3 dir = normalize(vWorld);
        float h = max(dir.y, 0.0);
        vec3 col = mix(bottomColor, topColor, pow(h, exponent));
        float d = max(dot(dir, normalize(sunDir)), 0.0);
        col += sunColor * pow(d, 300.0) * 1.6;
        col += sunColor * pow(d, 9.0) * 0.13;
        gl_FragColor = vec4(col, 1.0);
      }`
  })
)
sky.frustumCulled = false
scene.add(sky)

const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(7, 18, 14), new THREE.MeshBasicMaterial({ color: 0xfff3b0, fog: false }))
scene.add(sunMesh)
const sunHalo = new THREE.Mesh(
  new THREE.SphereGeometry(13, 18, 14),
  new THREE.MeshBasicMaterial({ color: 0xffd45e, transparent: true, opacity: 0.18, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })
)
scene.add(sunHalo)
const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(4.6, 18, 14), new THREE.MeshBasicMaterial({ color: 0xe8efff, fog: false }))
scene.add(moonMesh)

const starGeo = new THREE.BufferGeometry()
{
  const arr = []
  for (let i = 0; i < 900; i++) {
    const u = Math.random() * Math.PI * 2
    const v = Math.acos(Math.random() * 2 - 1)
    const r = 240
    arr.push(Math.sin(v) * Math.cos(u) * r, Math.cos(v) * r, Math.sin(v) * Math.sin(u) * r)
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
}
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
  color: 0xffffff, size: 1.4, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, fog: false
}))
scene.add(stars)

/* ------------------------------------------------------------ clouds etc */

const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.93, emissive: 0x6a7a9a, emissiveIntensity: 0.08 })
const clouds = new THREE.Group()
scene.add(clouds)
const cloudGroups = []
let seed = 1234567
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
for (let i = 0; i < 22; i++) {
  const g = new THREE.Group()
  const n = 3 + Math.floor(rand() * 4)
  for (let j = 0; j < n; j++) {
    const w = 3 + rand() * 6, h = 1.1 + rand() * 1.8, d = 2.5 + rand() * 4
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cloudMat)
    b.position.set((rand() - .5) * 7, (rand() - .5) * 1.2, (rand() - .5) * 6)
    g.add(b)
  }
  const a = rand() * Math.PI * 2
  const r = 18 + rand() * 62
  g.position.set(40 + Math.cos(a) * r, 24 + rand() * 18, 40 + Math.sin(a) * r)
  g.userData.speed = 0.35 + rand() * 0.5
  clouds.add(g)
  cloudGroups.push(g)
}
// cloud sea below the island
for (let i = 0; i < 26; i++) {
  const g = new THREE.Group()
  for (let j = 0; j < 3; j++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(9 + rand() * 14, 1.5 + rand() * 2, 7 + rand() * 12), cloudMat)
    b.position.set((rand() - .5) * 12, (rand() - .5) * 2, (rand() - .5) * 10)
    g.add(b)
  }
  g.position.set(40 + (rand() - .5) * 190, -12 + rand() * 10, 40 + (rand() - .5) * 190)
  g.userData.speed = 0.15 + rand() * 0.3
  clouds.add(g)
  cloudGroups.push(g)
}

function makeDistantIsland(x, y, z, scale) {
  const g = new THREE.Group()
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x6fbf4a })
  const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8a5a3b })
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x7d8794 })
  const layers = [
    [10, 1.2, 10, 0, grassMat],
    [10, 2.4, 10, -1.8, dirtMat],
    [8, 2, 8, -3.6, stoneMat],
    [5.5, 1.8, 5.5, -5.2, stoneMat],
    [3, 1.4, 3, -6.6, stoneMat]
  ]
  for (const [w, h, d, yy, m] of layers) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
    b.position.y = yy
    g.add(b)
  }
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 0.8), new THREE.MeshLambertMaterial({ color: 0x6d4729 }))
  trunk.position.set(2, 2.4, 1)
  g.add(trunk)
  const leaves = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.6, 4.4), new THREE.MeshLambertMaterial({ color: 0x4f9a3d }))
  leaves.position.set(2, 4.6, 1)
  g.add(leaves)
  g.position.set(x, y, z)
  g.scale.setScalar(scale)
  g.userData.baseY = y
  g.userData.phase = rand() * 6
  scene.add(g)
  return g
}
const distantIslands = [
  makeDistantIsland(-58, 22, 8, 1.3),
  makeDistantIsland(126, 32, 84, 1.7),
  makeDistantIsland(18, 8, 128, 1.2),
  makeDistantIsland(108, 48, -52, 1.5),
  makeDistantIsland(-40, 6, 112, 1.0)
]

// birds
const birds = []
for (let i = 0; i < 4; i++) {
  const g = new THREE.Group()
  const wingMat = new THREE.MeshBasicMaterial({ color: 0x2b2b45 })
  const l = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.35), wingMat)
  l.position.x = -0.75
  const r = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.35), wingMat)
  r.position.x = 0.75
  g.add(l, r)
  g.userData = { phase: rand() * 10, radius: 26 + rand() * 24, height: 28 + rand() * 10, speed: 0.08 + rand() * 0.06, wingL: l, wingR: r }
  scene.add(g)
  birds.push(g)
}

// fireflies
const fireflyGeo = new THREE.BufferGeometry()
{
  const arr = []
  for (let i = 0; i < 110; i++) {
    const a = rand() * Math.PI * 2
    const r = rand() * 32
    arr.push(40 + Math.cos(a) * r, 12 + rand() * 14, 40 + Math.sin(a) * r)
  }
  fireflyGeo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3))
}
const fireflyMat = new THREE.PointsMaterial({ color: 0xffe28a, size: 0.55, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
const fireflies = new THREE.Points(fireflyGeo, fireflyMat)
scene.add(fireflies)

/* -------------------------------------------------------------- world */

const world = new World(scene)
world.buildChunks()

/* ------------------------------------------------------------ game object */

const game = {
  started: false,
  paused: false,
  uiOpen: false,
  startedAt: 0,
  realmName: 'Sunnyhollow',
  coins: 40,
  xp: 0,
  level: 1,
  xpNext: 120,
  inventory: {
    grass: 64, dirt: 64, stone: 64, cobble: 64, sandstone: 48, planks: 64,
    log: 32, leaves: 24, roof: 40, gold: 12, glass: 24, brick: 32,
    mossy: 24, snow: 20, window: 12, bounce: 8, banner: 10
  },
  hotbar: ['grass', 'stone', 'planks', 'log', 'cobble', 'sandstone', 'roof', 'glass', 'gold'],
  selected: 0,
  unlockedHats: ['none', 'explorer'],
  wardrobe: { hat: 'explorer', shirt: '#2fb6c9', hair: '#5b3a25' },
  qualityHigh: !isTouch,
  muted: false,
  nearNpc: null,
  timeOfDay: 0.4,
  lastSave: 0,
  scene, camera, renderer, world,
  get selectedKey() { return this.hotbar[this.selected] || null },
  notify(text, type = 'info') {
    this.ui?.notify(text, type)
    if (type === 'quest' || type === 'success') this.ui?.log(text, 'Realm')
  },
  log(text, who) { this.ui?.log(text, who) },
  sfx(name, volume) { this.audio?.sfx(name, volume) },
  setUIOpen(open) {
    this.uiOpen = open
    this.paused = open
    if (open) {
      this.player?.stopMine()
      if (document.pointerLockElement === canvas) document.exitPointerLock()
    }
  },
  start() {
    if (this.started) return
    this.started = true
    this.startedAt = performance.now()
    this.paused = false
    this.audio.init()
    this.audio.setMuted(this.muted)
    this.ui.setSound(this.muted)
    if (isTouch) this.ui.setTouch(true)
    this.ui.startScreen()
    this.save()
    this.log('Sunnyhollow is yours to shape.', 'Realm')
    setTimeout(() => this.ui.notify(isTouch
      ? 'Drag the joystick to move · hold MINE to dig · tap PLACE to build'
      : 'Hold left-click to mine · Right-click to build', 'info'), 2600)
  },
  selectSlot(i) {
    this.selected = clamp(i, 0, this.hotbar.length - 1)
    this.ui?.refreshInventory()
  },
  assignHotbar(key) {
    if (!BLOCKS[key]?.placeable) return
    this.hotbar[this.selected] = key
    this.ui?.refreshInventory()
  },
  addItem(key, n) {
    if (!BLOCKS[key]) return
    this.inventory[key] = (this.inventory[key] || 0) + n
    this.ui?.refreshInventory()
  },
  addCoins(n) {
    this.coins += n
    this.ui?.refreshPlayer()
    this.ui?.refreshShop()
  },
  addXP(n) {
    this.xp += n
    let leveled = false
    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext
      this.level++
      this.xpNext = Math.round(this.xpNext * 1.28 + 32)
      this.coins += 20
      leveled = true
      this.notify(`Level ${this.level}! +20 coins`, 'success')
      this.sfx('level', 0.8)
      this.particles.confetti(this.player.pos.x, this.player.pos.y + 2.3, this.player.pos.z, 34)
    }
    if (!leveled) this.ui?.refreshPlayer()
    else { this.ui?.refreshPlayer(); this.ui?.refreshShop() }
  },
  onBlockBroken(key, pos) {
    this.addItem(key, 1)
    this.quests.event('collect', key)
    this.addXP(key === 'gold' ? 5 : 1)
    if (key === 'gold') this.notify('Gold Block collected!', 'item')
    this.saveSoon()
  },
  onBlockPlaced(key, pos) {
    this.quests.event('place')
    this.addXP(1)
    this.saveSoon()
  },
  buy(key, amount, price) {
    if (this.coins < price) {
      this.notify('Not enough coins. Complete quests to earn more!', 'warn')
      this.sfx('deny', 0.7)
      return false
    }
    this.coins -= price
    this.addItem(key, amount)
    this.sfx('coin', 0.8)
    this.notify(`Bought ${BLOCKS[key].name} ×${amount}`, 'success')
    this.ui?.refreshPlayer()
    this.saveSoon()
    return true
  },
  unlockHat(key) {
    if (!HATS[key] || this.unlockedHats.includes(key)) return
    this.unlockedHats.push(key)
    this.notify(`Hat unlocked: ${HATS[key].name}`, 'success')
    this.sfx('coin', 0.7)
    this.ui?.refreshWardrobe()
    this.saveSoon()
  },
  setHat(key) {
    if (!this.unlockedHats.includes(key)) return
    this.wardrobe.hat = key
    this.player.character.setHat(key)
    this.ui?.refreshWardrobe()
    this.ui?.drawAvatars()
    this.saveSoon()
  },
  setShirt(color) {
    this.wardrobe.shirt = color
    this.player.character.setColors({ shirt: color })
    this.ui?.drawAvatars()
    this.saveSoon()
  },
  setHair(color) {
    this.wardrobe.hair = color
    this.player.character.setColors({ hair: color })
    this.ui?.drawAvatars()
    this.saveSoon()
  },
  toggleSound() {
    this.muted = !this.muted
    this.audio.init()
    this.audio.setMuted(this.muted)
    this.ui.setSound(this.muted)
    this.notify(this.muted ? 'Sound off' : 'Sound on', 'info')
    this.saveSoon()
  },
  toggleQuality() {
    this.qualityHigh = !this.qualityHigh
    renderer.shadowMap.enabled = this.qualityHigh
    sunLight.castShadow = this.qualityHigh
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.qualityHigh ? 2 : 1))
    renderer.setSize(window.innerWidth, window.innerHeight)
    this.notify(`Graphics set to ${this.qualityHigh ? 'High' : 'Cozy'}`, 'info')
    this.saveSoon()
    return this.qualityHigh
  },
  saveSoon() {
    if (performance.now() - this.lastSave > 2500) this.save()
  },
  save() {
    if (!this.started) return
    try {
      const data = {
        version: 1,
        world: world.serializeEdits(),
        inventory: this.inventory,
        hotbar: this.hotbar,
        selected: this.selected,
        coins: this.coins,
        xp: this.xp,
        level: this.level,
        xpNext: this.xpNext,
        unlockedHats: this.unlockedHats,
        wardrobe: this.wardrobe,
        quests: this.quests.serialize(),
        player: this.player.serialize(),
        timeOfDay: this.timeOfDay,
        muted: this.muted,
        qualityHigh: this.qualityHigh
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
      this.lastSave = performance.now()
    } catch (e) { console.warn('Save failed', e) }
  },
  reset() {
    try { localStorage.removeItem(SAVE_KEY) } catch (e) { /* ignore */ }
    world.resetEdits()
    this.coins = 40
    this.xp = 0
    this.level = 1
    this.xpNext = 120
    this.inventory = {
      grass: 64, dirt: 64, stone: 64, cobble: 64, sandstone: 48, planks: 64,
      log: 32, leaves: 24, roof: 40, gold: 12, glass: 24, brick: 32,
      mossy: 24, snow: 20, window: 12, bounce: 8, banner: 10
    }
    this.hotbar = ['grass', 'stone', 'planks', 'log', 'cobble', 'sandstone', 'roof', 'glass', 'gold']
    this.selected = 0
    this.unlockedHats = ['none', 'explorer']
    this.wardrobe = { hat: 'explorer', shirt: '#2fb6c9', hair: '#5b3a25' }
    this.timeOfDay = 0.4
    for (const [id, s] of Object.entries(this.quests.states)) { s.status = 'available'; s.progress = 0 }
    this.quests.emit()
    this.player.resetToSpawn(false)
    this.player.character.setHat('explorer')
    this.player.character.setColors({ shirt: '#2fb6c9', hair: '#5b3a25' })
    this.ui.refreshInventory()
    this.ui.refreshQuestPanel()
    this.ui.refreshWardrobe()
    this.ui.drawAvatars()
    this.ui.notify('The realm has been reset. A fresh sky awaits!', 'success')
    this.save()
  },
  interact() {
    if (this.uiOpen) return
    if (this.nearNpc) {
      this.sfx('ui')
      this.ui.openDialogue(this.nearNpc)
    }
  }
}

game.particles = new Particles(scene)
game.audio = new Audio()
game.quests = new Quests(game)
const player = new Player(game, scene, world, camera)
game.player = player
game.npcs = createNPCs(scene, world, game)
const ui = new UI(game)
game.ui = ui
ui.setTouch(isTouch)
ui.init()
ui.setSound(false)

// beacon crystal + beam + lights
const beacon = new THREE.Group()
beacon.position.set(73.5, 20.3, 27.5)
const crystalMat = new THREE.MeshLambertMaterial({ color: 0xffd45e, emissive: 0xffa51e, emissiveIntensity: 1.1 })
const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), crystalMat)
crystal.castShadow = true
beacon.add(crystal)
const beaconRing = new THREE.Mesh(
  new THREE.TorusGeometry(1.1, 0.07, 8, 28),
  new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.8 })
)
beaconRing.rotation.x = Math.PI / 2
beacon.add(beaconRing)
scene.add(beacon)
const beaconBeam = new THREE.Mesh(
  new THREE.CylinderGeometry(0.16, 0.7, 16, 12, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
)
beaconBeam.position.set(73.5, 28, 27.5)
scene.add(beaconBeam)
const beaconLight = new THREE.PointLight(0xffc94d, 1.4, 16, 2)
beaconLight.position.set(73.5, 21, 27.5)
scene.add(beaconLight)

const windowLights = [
  [40.5, 21, 36.5], [40.5, 22, 27.5], [33.5, 24, 34.5], [47.5, 24, 34.5]
].map(([x, y, z]) => {
  const l = new THREE.PointLight(0xffb84d, 0.7, 12, 2)
  l.position.set(x, y, z)
  scene.add(l)
  return l
})

/* -------------------------------------------------------------- loading */

function loadSave() {
  let data
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') } catch (e) { data = null }
  if (!data) return
  try {
    if (Array.isArray(data.world)) world.applyEdits(data.world)
    if (data.inventory && typeof data.inventory === 'object') {
      for (const key of Object.keys(BLOCKS)) {
        if (Number.isFinite(data.inventory[key])) game.inventory[key] = Math.max(0, Math.floor(data.inventory[key]))
      }
    }
    if (Array.isArray(data.hotbar)) {
      game.hotbar = data.hotbar.slice(0, 9).map(k => (k && BLOCKS[k]?.placeable ? k : null))
      while (game.hotbar.length < 9) game.hotbar.push(null)
    }
    if (Number.isInteger(data.selected)) game.selected = clamp(data.selected, 0, 8)
    if (Number.isFinite(data.coins)) game.coins = Math.max(0, Math.floor(data.coins))
    if (Number.isFinite(data.xp)) game.xp = Math.max(0, Math.floor(data.xp))
    if (Number.isFinite(data.level)) game.level = Math.max(1, Math.floor(data.level))
    if (Number.isFinite(data.xpNext)) game.xpNext = Math.max(20, Math.floor(data.xpNext))
    if (Array.isArray(data.unlockedHats)) game.unlockedHats = data.unlockedHats.filter(h => HATS[h])
    if (!game.unlockedHats.includes('none')) game.unlockedHats.unshift('none')
    if (!game.unlockedHats.includes('explorer')) game.unlockedHats.push('explorer')
    if (data.wardrobe) {
      if (HATS[data.wardrobe.hat] && game.unlockedHats.includes(data.wardrobe.hat)) game.wardrobe.hat = data.wardrobe.hat
      if (typeof data.wardrobe.shirt === 'string') game.wardrobe.shirt = data.wardrobe.shirt
      if (typeof data.wardrobe.hair === 'string') game.wardrobe.hair = data.wardrobe.hair
    }
    if (data.quests) game.quests.load(data.quests)
    if (Number.isFinite(data.timeOfDay)) game.timeOfDay = data.timeOfDay
    if (typeof data.muted === 'boolean') game.muted = data.muted
    if (typeof data.qualityHigh === 'boolean') {
      game.qualityHigh = data.qualityHigh
      renderer.shadowMap.enabled = game.qualityHigh
      sunLight.castShadow = game.qualityHigh
    }
    if (data.player) player.load(data.player)
    player.character.setHat(game.wardrobe.hat)
    player.character.setColors({ shirt: game.wardrobe.shirt, hair: game.wardrobe.hair })
    ui.setSound(game.muted)
    ui.refreshInventory()
    ui.refreshQuestPanel()
    ui.refreshWardrobe()
    ui.drawAvatars()
    ui.notify('Welcome back, Builder. The realm remembered you.', 'info')
  } catch (e) {
    console.warn('Save load failed', e)
  }
}
loadSave()

/* --------------------------------------------------------------- sky/time */

const dayTop = new THREE.Color('#3f9fe0')
const dayBottom = new THREE.Color('#c9efff')
const nightTop = new THREE.Color('#070726')
const nightBottom = new THREE.Color('#241d4d')
const duskTop = new THREE.Color('#5b4aa8')
const duskBottom = new THREE.Color('#ffab63')
const sunDay = new THREE.Color('#fff2d0')
const sunDusk = new THREE.Color('#ff9a4d')
const moonColor = new THREE.Color('#9fb4ff')
const tmpA = new THREE.Color(), tmpB = new THREE.Color()
let lastNight = false

function updateSky(dt) {
  if (game.started) game.timeOfDay = (game.timeOfDay + dt / 360) % 1
  const t = game.timeOfDay
  const angle = t * Math.PI * 2 - Math.PI / 2
  const sunDir = new THREE.Vector3(Math.cos(angle) * 0.82, Math.sin(angle), Math.sin(angle * 0.5) * 0.32).normalize()
  const sunY = sunDir.y
  const day = smoothstep(-0.09, 0.3, sunY)
  const dusk = Math.max(0, 1 - Math.abs(sunY) / 0.34) * (sunY > -0.32 ? 1 : 0)

  tmpA.copy(nightTop).lerp(dayTop, day).lerp(duskTop, dusk * 0.55)
  tmpB.copy(nightBottom).lerp(dayBottom, day).lerp(duskBottom, dusk * 0.82)
  skyUniforms.topColor.value.copy(tmpA)
  skyUniforms.bottomColor.value.copy(tmpB)
  skyUniforms.sunDir.value.copy(sunDir)
  skyUniforms.sunColor.value.copy(sunDay).lerp(sunDusk, dusk)
  scene.fog.color.copy(tmpB).lerp(tmpA, 0.35)
  renderer.setClearColor(scene.fog.color, 1)

  sunMesh.position.copy(sunDir).multiplyScalar(235)
  sunHalo.position.copy(sunMesh.position)
  sunMesh.visible = sunY > -0.12
  sunHalo.visible = sunMesh.visible
  moonMesh.position.copy(sunDir).multiplyScalar(-235)
  moonMesh.visible = sunY < 0.12
  stars.material.opacity = clamp(-sunY * 2.6, 0, 0.9)

  const sunIntensity = clamp(sunY * 1.8 + 0.08, 0.03, 1.45)
  sunLight.position.set(40 + sunDir.x * 75, 12 + sunDir.y * 75, 40 + sunDir.z * 75)
  sunLight.target.position.set(40, 12, 40)
  sunLight.intensity = sunIntensity
  sunLight.color.copy(sunDay).lerp(sunDusk, dusk)
  moonLight.position.set(40 - sunDir.x * 70, 12 - sunDir.y * 70, 40 - sunDir.z * 70)
  moonLight.intensity = clamp(-sunY * 0.45, 0, 0.32)
  hemi.intensity = 0.36 + day * 0.5
  hemi.color.copy(tmpA)
  hemi.groundColor.set(day > 0.4 ? '#5a4a33' : '#2b2547')
  ambient.intensity = 0.12 + day * 0.12
  renderer.toneMappingExposure = 1.06 + day * 0.16

  const night = sunY < -0.05
  if (night !== lastNight) {
    lastNight = night
    game.audio.setNight(night)
    fireflyMat.opacity = night ? 0.95 : 0
  }
  fireflyMat.opacity = clamp(-sunY * 2.2, 0, 0.95)
  for (const l of windowLights) l.intensity = 0.15 + (1 - day) * 1.15
  beaconLight.intensity = 1.1 + (1 - day) * 0.8
  beaconBeam.material.opacity = 0.1 + (1 - day) * 0.12

  // drift clouds
  for (const g of cloudGroups) {
    g.position.x += g.userData.speed * dt
    if (g.position.x > 175) g.position.x = -95
  }
  // distant islands bob
  for (const g of distantIslands) {
    g.position.y = g.userData.baseY + Math.sin(performance.now() * 0.0003 + g.userData.phase) * 1.4
  }
  // birds
  const now = performance.now() * 0.001
  for (const b of birds) {
    const u = b.userData
    const a = now * u.speed + u.phase
    b.position.set(40 + Math.cos(a) * u.radius, u.height + Math.sin(now * 0.7 + u.phase) * 1.6, 40 + Math.sin(a) * u.radius)
    b.rotation.y = -a
    const flap = Math.sin(now * 6 + u.phase) * 0.5
    u.wingL.rotation.z = flap
    u.wingR.rotation.z = -flap
    b.visible = sunY > -0.05
  }
  // beacon sparkle
  crystal.rotation.y += dt * 1.1
  crystal.rotation.x = Math.sin(now * 0.8) * 0.16
  crystal.position.y = Math.sin(now * 1.6) * 0.14
  beaconRing.rotation.z += dt * 0.6
  beaconRing.scale.setScalar(1 + Math.sin(now * 2.2) * 0.06)
  if (Math.random() < dt * 2.6) {
    game.particles.sparkle(73.5, 20.3 + crystal.position.y, 27.5, '#ffe28a', 1, 0.35)
  }
  // fountain jet
  if (Math.random() < dt * 7) {
    game.particles.sparkle(40.5, 15.5, 47.5, '#bff4ff', 2, 0.55)
  }
}

/* --------------------------------------------------------------- save/load */

setInterval(() => { if (game.started && !game.uiOpen) game.save() }, 15000)
window.addEventListener('pagehide', () => game.save())

/* ---------------------------------------------------------------- input */

const keys = new Set()
const joystick = { active: false, id: null, x: 0, y: 0, cx: 0, cy: 0 }
const lookTouch = { id: null, x: 0, y: 0 }
let mouseDrag = null
let lastLockHint = 0

function requestLock() {
  if (!game.started || game.uiOpen) return
  try { canvas.requestPointerLock?.() } catch (e) { /* ignore */ }
}

window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  const code = e.code
  if (code === 'Escape') {
    const open = document.querySelector('.modal:not(.hidden)')
    if (open) { ui.closeModal(open.id); e.preventDefault(); return }
    if (document.pointerLockElement === canvas) { document.exitPointerLock(); return }
    if (game.started) { ui.openModal('pause'); e.preventDefault() }
    return
  }
  if (!game.started) return
  if (code === 'KeyI') {
    e.preventDefault()
    ui.activeModal === 'inventory' ? ui.closeModal('inventory') : ui.openModal('inventory')
    return
  }
  if (code === 'KeyB') {
    e.preventDefault()
    ui.activeModal === 'shop' ? ui.closeModal('shop') : ui.openModal('shop')
    return
  }
  if (code === 'KeyC') {
    e.preventDefault()
    ui.activeModal === 'wardrobe' ? ui.closeModal('wardrobe') : ui.openModal('wardrobe')
    return
  }
  if (code === 'KeyH') {
    e.preventDefault()
    ui.activeModal === 'help' ? ui.closeModal('help') : ui.openModal('help')
    return
  }
  if (code === 'KeyM') { game.toggleSound(); return }
  if (game.uiOpen) return
  if (code === 'KeyE') { game.interact(); return }
  if (code === 'KeyG') { player.playEmote(player.emote === 'dance' ? 'wave' : 'dance'); game.sfx('emote', 0.6); return }
  if (code === 'Space') {
    e.preventDefault()
    if (!e.repeat) player.jump()
    keys.add('jump')
    return
  }
  if (code === 'ShiftLeft' || code === 'ShiftRight') { player.sprint = true; return }
  if (/^Digit[1-9]$/.test(code)) { game.selectSlot(Number(code.slice(5)) - 1); game.sfx('ui', 0.5); return }
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
    e.preventDefault()
    keys.add(code)
  }
})

window.addEventListener('keyup', e => {
  if (e.code === 'Space') { player.releaseJump(); keys.delete('jump') }
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') player.sprint = false
  keys.delete(e.code)
})

window.addEventListener('blur', () => {
  keys.clear()
  player.releaseJump()
  player.sprint = false
  player.stopMine()
})

// pointer lock look
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas && !game.uiOpen) {
    player.look(e.movementX, e.movementY)
  }
})
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas
  if (!locked) {
    player.stopMine()
    if (game.started && !game.uiOpen && !game.paused && performance.now() - lastLockHint > 4000) {
      lastLockHint = performance.now()
      ui.notify('Mouse released — click the world to look around.', 'info')
    }
  }
})

canvas.addEventListener('contextmenu', e => e.preventDefault())

canvas.addEventListener('pointerdown', e => {
  if (!game.started || game.uiOpen) return
  if (e.pointerType === 'touch') {
    if (lookTouch.id === null) {
      lookTouch.id = e.pointerId
      lookTouch.x = e.clientX
      lookTouch.y = e.clientY
      canvas.setPointerCapture?.(e.pointerId)
    }
    return
  }
  if (e.button !== 0 && e.button !== 2) return
  const locked = document.pointerLockElement === canvas
  mouseDrag = { x: e.clientX, y: e.clientY, moved: 0, button: e.button, locked }
  if (locked) {
    if (e.button === 0) player.startMine()
    else player.queuePlace()
  }
})

canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') {
    if (lookTouch.id === e.pointerId) {
      const dx = e.clientX - lookTouch.x
      const dy = e.clientY - lookTouch.y
      lookTouch.x = e.clientX
      lookTouch.y = e.clientY
      player.look(dx * 2.5, dy * 2.5)
    }
    return
  }
  if (mouseDrag && document.pointerLockElement !== canvas) {
    const dx = e.clientX - mouseDrag.x
    const dy = e.clientY - mouseDrag.y
    mouseDrag.moved += Math.abs(dx) + Math.abs(dy)
    mouseDrag.x = e.clientX
    mouseDrag.y = e.clientY
    if (mouseDrag.moved > 3) player.look(dx * 1.7, dy * 1.7)
  }
})

canvas.addEventListener('pointerup', e => {
  if (e.pointerType === 'touch') {
    if (lookTouch.id === e.pointerId) lookTouch.id = null
    return
  }
  if (!mouseDrag) return
  const wasDrag = mouseDrag.moved > 5
  const locked = document.pointerLockElement === canvas
  if (!locked && !wasDrag && game.started && !game.uiOpen) requestLock()
  if (locked) {
    if (e.button === 0) player.stopMine()
  }
  mouseDrag = null
})
canvas.addEventListener('pointercancel', () => { mouseDrag = null; lookTouch.id = null })

window.addEventListener('wheel', e => {
  if (!game.started || game.uiOpen) return
  e.preventDefault()
  const dir = Math.sign(e.deltaY)
  if (!dir) return
  game.selectSlot((game.selected + dir + 9) % 9)
  game.sfx('ui', 0.4)
}, { passive: false })

/* ------------------------------------------------------------ mobile input */

const stickEl = document.getElementById('stick')
const joyEl = document.getElementById('joystick')
function updateStickVisual() {
  stickEl.style.transform = `translate(${joystick.x * 32}px, ${-joystick.y * 32}px)`
}
joyEl.addEventListener('pointerdown', e => {
  if (!game.started || game.uiOpen) return
  e.preventDefault(); e.stopPropagation()
  const r = joyEl.getBoundingClientRect()
  joystick.active = true
  joystick.id = e.pointerId
  joystick.cx = r.left + r.width / 2
  joystick.cy = r.top + r.height / 2
  joystick.x = 0; joystick.y = 0
  joyEl.setPointerCapture?.(e.pointerId)
  updateStickVisual()
})
joyEl.addEventListener('pointermove', e => {
  if (!joystick.active || joystick.id !== e.pointerId) return
  e.preventDefault()
  const dx = e.clientX - joystick.cx
  const dy = e.clientY - joystick.cy
  const max = 38
  const d = Math.hypot(dx, dy)
  const k = d > max ? max / d : 1
  joystick.x = (dx * k) / max
  joystick.y = (-dy * k) / max
  updateStickVisual()
})
function endJoystick(e) {
  if (joystick.id !== e.pointerId) return
  joystick.active = false
  joystick.id = null
  joystick.x = 0; joystick.y = 0
  updateStickVisual()
}
joyEl.addEventListener('pointerup', endJoystick)
joyEl.addEventListener('pointercancel', endJoystick)

function bindHold(id, onDown, onUp) {
  const el = document.getElementById(id)
  el.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation()
    if (!game.started || game.uiOpen) return
    el.classList.add('pressed')
    el.setPointerCapture?.(e.pointerId)
    onDown()
  })
  const up = e => {
    e.preventDefault(); e.stopPropagation()
    el.classList.remove('pressed')
    onUp?.()
  }
  el.addEventListener('pointerup', up)
  el.addEventListener('pointercancel', up)
  el.addEventListener('pointerleave', e => { if (e.buttons) up(e) })
}
bindHold('btn-jump', () => player.jump(), () => player.releaseJump())
bindHold('btn-mine', () => player.startMine(), () => player.stopMine())
bindHold('btn-place', () => player.queuePlace())
bindHold('btn-interact', () => game.interact())
bindHold('btn-emote', () => { player.playEmote(player.emote === 'dance' ? 'wave' : 'dance'); game.sfx('emote', 0.5) })

/* ---------------------------------------------------------------- loop */

const clock = new THREE.Clock()
let nearCheck = 0

function updatePlayerInput() {
  let mx = 0, my = 0
  if (keys.has('KeyW') || keys.has('ArrowUp')) my += 1
  if (keys.has('KeyS') || keys.has('ArrowDown')) my -= 1
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1
  if (joystick.active) {
    mx = joystick.x
    my = joystick.y
    player.sprint = Math.hypot(joystick.x, joystick.y) > 0.92
  }
  player.setMove(mx, my)
}

function updateNearby() {
  nearCheck -= 1
  if (nearCheck > 0) return
  nearCheck = 4
  let best = null
  let bestDist = 3.7
  for (const npc of game.npcs) {
    const dx = npc.pos.x - player.pos.x
    const dz = npc.pos.z - player.pos.z
    const dy = Math.abs(npc.pos.y - player.pos.y)
    const d = Math.hypot(dx, dz)
    if (d < bestDist && dy < 2.6) { best = npc; bestDist = d }
  }
  if (best !== game.nearNpc) {
    game.nearNpc = best
    ui.setInteractPrompt(best)
  }
}

function updateBeaconQuest() {
  if (game.quests.status('beacon') !== 'active') return
  const dx = player.pos.x - 73.5
  const dz = player.pos.z - 27.5
  if (Math.hypot(dx, dz) < 3.1 && player.pos.y > 15.8) {
    game.quests.reachBeacon()
    game.particles.sparkle(73.5, 20, 27.5, '#ffe28a', 50, 1.8)
  }
}

function animate() {
  requestAnimationFrame(animate)
  const dt = Math.min(clock.getDelta(), 0.05)
  const time = clock.elapsedTime

  updateSky(dt)

  if (game.started) {
    updatePlayerInput()
    player.update(dt, time)
    world.flushDirty()
    for (const npc of game.npcs) npc.update(dt, time, player)
    updateNearby()
    updateBeaconQuest()
    ui.update(dt, renderer)
  } else {
    // slow cinematic orbit behind the title screen
    const a = time * 0.045
    camera.position.set(40 + Math.sin(a) * 44, 33 + Math.sin(time * 0.09) * 3.5, 40 + Math.cos(a) * 44)
    camera.lookAt(40, 15.5, 34)
    camera.fov = 52
    camera.updateProjectionMatrix()
    for (const npc of game.npcs) npc.update(dt, time, player)
    ui.update(dt, renderer)
  }

  game.particles.update(dt)
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, game.qualityHigh ? 2 : 1))
  renderer.setSize(window.innerWidth, window.innerHeight)
  ui.setTouch(isTouch || window.innerWidth <= 700)
})

window.addEventListener('gesturestart', e => e.preventDefault())

// first render, then reveal
renderer.render(scene, camera)
setTimeout(() => ui.hideLoading(), 500)
animate()

window.CUBIC_KINGDOMS = game
