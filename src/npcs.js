import * as THREE from '../vendor/three.module.js'
import { createCharacter } from './character.js'
import { QUEST_DEFS } from './quests.js'

const dampAngle = (a, b, lambda, dt) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * (1 - Math.exp(-lambda * dt))
}

export const NPC_DEFS = [
  {
    id: 'pip', name: 'Pip', role: 'Mason', quest: 'stone',
    x: 34.5, z: 43.5, radius: 2.4,
    shirt: '#e0813f', pants: '#5a4a3a', hair: '#7a4a2a', hat: 'explorer',
    lines: ['Mind the wet mortar!', 'A castle is just a pile of stones with ambition.', 'The fountain is my finest work. Mostly.']
  },
  {
    id: 'fern', name: 'Fern', role: 'Forester', quest: 'timber',
    x: 47.5, z: 54.5, radius: 2.6,
    shirt: '#6fae4a', pants: '#40543a', hair: '#c07a3a', hat: 'explorer',
    lines: ['The pond lilies are showing off again.', 'Oak is the king of trees. Do not tell the others.', 'Every good castle starts with a good log.']
  },
  {
    id: 'marble', name: 'Lady Marble', role: 'Realm Keeper', quest: 'banners',
    x: 40.5, z: 41.6, radius: 1.8,
    shirt: '#9b6ad6', pants: '#3f3358', hair: '#ece8f4', hat: 'crown',
    lines: ['Welcome to Sunnyhollow, builder.', 'The view from the keep is worth every stair.', 'Build boldly. The clouds are watching.']
  },
  {
    id: 'zippy', name: 'Zippy', role: 'Sky Scout', quest: 'beacon',
    x: 72.2, z: 29.2, radius: 1.1, scale: 0.82,
    shirt: '#4fc3d9', pants: '#d96b9b', hair: '#f2c34a', hat: 'none',
    lines: ['Boing! Did you see that?', 'The sky is basically a floor that forgot its blocks.', 'I have fallen off this island eleven times. Twelve is a lucky number.']
  }
]

export class NPC {
  constructor(def, scene, world, game) {
    this.def = def
    this.world = world
    this.game = game
    this.name = def.name
    this.role = def.role
    this.quest = def.quest
    this.radius = def.radius
    this.home = new THREE.Vector3(def.x, world.surfaceY(def.x, def.z), def.z)
    this.pos = this.home.clone()
    this.target = this.home.clone()
    this.wait = 1 + Math.random() * 3
    this.facing = Math.PI
    this.speed = 0
    this.time = Math.random() * 10
    this.speech = null
    this.speechUntil = 0
    this.nextChatter = 2 + Math.random() * 6
    this.nearPlayer = false
    this.character = createCharacter({
      shirt: def.shirt, pants: def.pants, hair: def.hair, hat: def.hat,
      skin: def.id === 'marble' ? '#f4d6b8' : '#f0c49b'
    })
    if (def.scale) this.character.root.scale.setScalar(def.scale)
    this.character.root.position.copy(this.pos)
    this.character.root.rotation.y = this.facing
    scene.add(this.character.root)
    this.label = null
    this.marker = null
    this.labelEl = null
    this.markerEl = null
  }

  say(text, duration = 4) {
    this.speech = text
    this.speechUntil = performance.now() + duration * 1000
  }

  getSpeech() {
    if (!this.speech || performance.now() > this.speechUntil) return null
    return this.speech
  }

  update(dt, time, player) {
    this.time += dt
    const dx = player.pos.x - this.pos.x
    const dz = player.pos.z - this.pos.z
    const dist = Math.hypot(dx, dz)
    this.nearPlayer = dist < 4.6

    if (this.nearPlayer) {
      this.speed = 0
      const target = Math.atan2(dx, dz)
      this.facing = dampAngle(this.facing, target, 6, dt)
      this.nextChatter -= dt
      if (this.nextChatter <= 0 && !this.getSpeech()) {
        this.say(this.def.lines[Math.floor(Math.random() * this.def.lines.length)], 4.5)
        this.nextChatter = 8 + Math.random() * 8
      }
    } else {
      this.nextChatter = Math.max(0.5, this.nextChatter - dt)
      this.wait -= dt
      if (this.wait <= 0) {
        const a = Math.random() * Math.PI * 2
        const r = Math.random() * this.radius
        const tx = this.def.x + Math.cos(a) * r
        const tz = this.def.z + Math.sin(a) * r
        const ty = this.world.surfaceY(tx, tz)
        if (Math.abs(ty - this.home.y) < 1.6) {
          this.target.set(tx, ty, tz)
        }
        this.wait = 2.5 + Math.random() * 5
      }
      const tdx = this.target.x - this.pos.x
      const tdz = this.target.z - this.pos.z
      const td = Math.hypot(tdx, tdz)
      if (td > 0.25) {
        const sp = 1.25
        this.speed = sp
        this.pos.x += (tdx / td) * sp * dt
        this.pos.z += (tdz / td) * sp * dt
        this.facing = dampAngle(this.facing, Math.atan2(tdx, tdz), 8, dt)
      } else {
        this.speed = 0
        if (Math.random() < 0.2 * dt) this.facing += 0.6
      }
      const sy = this.world.surfaceY(this.pos.x, this.pos.z)
      this.pos.y += (sy - this.pos.y) * Math.min(1, dt * 8)
      if (Math.abs(sy - this.home.y) > 2.2) {
        this.pos.copy(this.home)
        this.target.copy(this.home)
      }
    }

    this.character.root.position.copy(this.pos)
    this.character.root.rotation.y = this.facing
    this.character.update(dt, {
      speed: this.speed, grounded: true, time: this.time,
      mining: false, emote: this.nearPlayer && dist < 2.3 && Math.sin(time * 0.7 + this.time) > 0.93 ? 'wave' : '',
      lookPitch: 0
    })
  }

  getAnchor(out = new THREE.Vector3()) {
    out.set(this.pos.x, this.pos.y + 2.25, this.pos.z)
    return out
  }

  questState() {
    return this.game.quests.status(this.quest)
  }
}

export function createNPCs(scene, world, game) {
  return NPC_DEFS.map(def => new NPC(def, scene, world, game))
}
