import * as THREE from '../vendor/three.module.js'
import { createCharacter } from './character.js'
import { BLOCKS, KEY_TO_ID, isWater, blockColor } from './blocks.js'
import { WORLD, HEIGHT } from './world.js'

const UP = new THREE.Vector3(0, 1, 0)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt))
function dampAngle(a, b, lambda, dt) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * (1 - Math.exp(-lambda * dt))
}

export class Player {
  constructor(game, scene, world, camera) {
    this.game = game
    this.scene = scene
    this.world = world
    this.camera = camera
    this.pos = new THREE.Vector3(40.5, 12.05, 54.5)
    this.vel = new THREE.Vector3()
    this.radius = 0.31
    this.height = 1.78
    this.onGround = false
    this.coyote = 0
    this.jumpBuffer = 0
    this.speed = 0
    this.facing = Math.PI
    this.cameraYaw = 0
    this.cameraPitch = 0.34
    this.cameraDist = 7.5
    this.cameraTarget = new THREE.Vector3(this.pos.x, this.pos.y + 1.35, this.pos.z)
    this.cameraPos = new THREE.Vector3()
    this.lookSensitivity = 0.0023
    this.mineHold = false
    this.placeQueued = false
    this.mineProgress = 0
    this.target = null
    this.mineCooldown = 0
    this.placeCooldown = 0
    this.stepCooldown = 0
    this.walkTime = 0
    this.emote = ''
    this.emoteTimer = 0
    this.bounceCooldown = 0
    this.inWater = false
    this.fov = 62
    this.moveInput = { x: 0, y: 0 }
    this.jumpHeld = false
    this.sprint = false
    this.lastGroundY = this.pos.y
    this.spawn = new THREE.Vector3(40.5, 12.05, 54.5)
    this.checkpoint = null

    this.character = createCharacter({ hat: 'explorer' })
    this.character.root.position.copy(this.pos)
    this.character.root.rotation.y = this.facing
    scene.add(this.character.root)
    this.cameraPos.copy(this.cameraTarget).add(new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
    ).multiplyScalar(this.cameraDist))

    this.buildHighlight()
    this.buildCrack()
    this.raycaster = new THREE.Raycaster()
  }

  buildHighlight() {
    const geo = new THREE.BoxGeometry(1.008, 1.008, 1.008)
    const edges = new THREE.EdgesGeometry(geo)
    this.highlight = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
      color: 0xffe28a, transparent: true, opacity: 0.95, depthTest: false
    }))
    this.highlight.renderOrder = 8
    this.highlight.visible = false
    this.scene.add(this.highlight)
    const faceMat = new THREE.MeshBasicMaterial({
      color: 0xffe28a, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide
    })
    this.highlightFace = new THREE.Mesh(geo, faceMat)
    this.highlightFace.visible = false
    this.highlightFace.renderOrder = 7
    this.scene.add(this.highlightFace)
  }

  buildCrack() {
    const c = document.createElement('canvas')
    c.width = c.height = 32
    const ctx = c.getContext('2d')
    ctx.strokeStyle = 'rgba(24,18,12,.95)'
    ctx.lineWidth = 1.4
    let seed = 99
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (let i = 0; i < 9; i++) {
      let x = 16, y = 16
      ctx.beginPath(); ctx.moveTo(x, y)
      for (let s = 0; s < 5; s++) { x += (rand() - .5) * 13; y += (rand() - .5) * 13; ctx.lineTo(x, y) }
      ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(c)
    tex.magFilter = THREE.NearestFilter
    tex.minFilter = THREE.NearestFilter
    tex.generateMipmaps = false
    this.crackTex = tex
    this.crack = new THREE.Mesh(
      new THREE.BoxGeometry(1.012, 1.012, 1.012),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
    )
    this.crack.visible = false
    this.crack.renderOrder = 9
    this.scene.add(this.crack)
  }

  resetToSpawn(notify = true) {
    this.pos.set(this.spawn.x, this.world.surfaceY(this.spawn.x, this.spawn.z) + 0.05, this.spawn.z)
    this.vel.set(0, 0, 0)
    this.cameraTarget.set(this.pos.x, this.pos.y + 1.35, this.pos.z)
    this.cameraPos.copy(this.cameraTarget)
    this.cameraYaw = 0
    this.cameraPitch = 0.34
    this.checkpoint = null
    if (notify) this.game.notify('Whoops! The clouds caught you.', 'info')
  }

  respawnFromFall() {
    const cp = this.checkpoint
    const stillSolid = cp && Math.abs(this.world.surfaceY(cp.x, cp.z) - cp.y) < 2.2
    if (stillSolid) {
      this.pos.copy(cp)
      this.vel.set(0, 0, 0)
      this.cameraTarget.set(this.pos.x, this.pos.y + 1.35, this.pos.z)
      this.cameraPos.copy(this.cameraTarget)
      this.game.notify('The sky caught you — back to the last stone!', 'info')
    } else {
      this.resetToSpawn()
    }
  }

  look(dx, dy) {
    this.cameraYaw -= dx * this.lookSensitivity
    this.cameraPitch = clamp(this.cameraPitch + dy * this.lookSensitivity, -0.38, 1.12)
    this.cameraYaw = ((this.cameraYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI
  }

  zoom(delta) {
    this.cameraDist = clamp(this.cameraDist + delta * 0.006, 3.8, 11)
  }

  setMove(x, y) { this.moveInput.x = clamp(x, -1, 1); this.moveInput.y = clamp(y, -1, 1) }
  jump() { this.jumpBuffer = 0.16; this.jumpHeld = true }
  releaseJump() { this.jumpHeld = false }
  startMine() { this.mineHold = true }
  stopMine() { this.mineHold = false; this.mineProgress = 0 }
  queuePlace() { this.placeQueued = true }
  playEmote(name) {
    this.emote = name
    this.emoteTimer = name === 'dance' ? 4.5 : 2.6
  }

  get selectedKey() { return this.game.selectedKey }

  getAABB(pos = this.pos) {
    return {
      minX: pos.x - this.radius, maxX: pos.x + this.radius,
      minY: pos.y, maxY: pos.y + this.height,
      minZ: pos.z - this.radius, maxZ: pos.z + this.radius
    }
  }
  collidesAt(pos) {
    const b = this.getAABB(pos)
    return this.world.collides(b.minX, b.minY, b.minZ, b.maxX, b.maxY, b.maxZ)
  }

  update(dt, time) {
    dt = Math.min(dt, 0.05)
    if (this.emoteTimer > 0) {
      this.emoteTimer -= dt
      if (this.emoteTimer <= 0) this.emote = ''
    }
    if (this.game.paused || !this.game.started) {
      this.updateVisual(dt, time)
      this.updateCamera(dt)
      return
    }

    this.mineCooldown = Math.max(0, this.mineCooldown - dt)
    this.placeCooldown = Math.max(0, this.placeCooldown - dt)
    this.bounceCooldown = Math.max(0, this.bounceCooldown - dt)
    this.stepCooldown = Math.max(0, this.stepCooldown - dt)
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt

    // water at the feet?
    this.inWater = isWater(this.world.getBlock(this.pos.x, this.pos.y + 0.1, this.pos.z)) ||
      isWater(this.world.getBlock(this.pos.x, this.pos.y + 0.9, this.pos.z))

    const fwd = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw))
    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw))
    const wish = new THREE.Vector3()
    wish.addScaledVector(fwd, this.moveInput.y)
    wish.addScaledVector(right, this.moveInput.x)
    if (wish.lengthSq() > 1) wish.normalize()
    const moving = wish.lengthSq() > 0.001
    const wantsSprint = this.sprint && this.moveInput.y > 0.2
    let maxSpeed = wantsSprint ? 8.4 : 5.3
    if (this.inWater) maxSpeed *= 0.62
    if (this.emote === 'dance') maxSpeed = 0
    const accel = this.onGround ? 13 : 4.2
    const targetVelX = wish.x * maxSpeed
    const targetVelZ = wish.z * maxSpeed
    if (maxSpeed > 0) {
      this.vel.x = damp(this.vel.x, targetVelX, accel, dt)
      this.vel.z = damp(this.vel.z, targetVelZ, accel, dt)
    } else {
      this.vel.x = damp(this.vel.x, 0, 8, dt)
      this.vel.z = damp(this.vel.z, 0, 8, dt)
    }

    // gravity & swimming
    if (this.inWater) {
      this.vel.y -= 4.5 * dt
      this.vel.y += 13 * dt
      this.vel.y = clamp(this.vel.y, -1.8, 3.2)
      if (this.jumpHeld) this.vel.y = Math.min(this.vel.y + 24 * dt, 4.4)
    } else {
      this.vel.y -= 26 * dt
      this.vel.y = Math.max(this.vel.y, -32)
    }

    if (this.onGround) this.coyote = 0.12
    else this.coyote = Math.max(0, this.coyote - dt)

    if (this.jumpBuffer > 0 && (this.coyote > 0 || this.inWater)) {
      if (this.inWater) {
        this.vel.y = 4.6
        this.game.sfx('splash', 0.5)
      } else {
        this.vel.y = 9.4
        this.game.sfx('jump', 0.7)
        this.game.particles.burst(this.pos.x, this.pos.y + 0.1, this.pos.z, 'grass', 5, 0.7)
      }
      this.jumpBuffer = 0
      this.coyote = 0
      this.onGround = false
      this.game.quests?.event('jump')
    }

    const wasGround = this.onGround
    this.moveWithCollision(dt)

    // landing
    if (!wasGround && this.onGround && this.vel.y <= 0.01) {
      this.game.sfx('land', 0.45)
      this.game.particles.burst(this.pos.x, this.pos.y + 0.05, this.pos.z, 'grass', 6, 0.5)
      // bounce pads
      const below = this.world.getKey(this.pos.x, this.pos.y - 0.2, this.pos.z)
      if (below === 'bounce' && this.bounceCooldown <= 0) {
        this.vel.y = 17.5
        this.onGround = false
        this.bounceCooldown = 0.35
        this.game.sfx('bounce', 0.8)
        this.game.particles.burst(this.pos.x, this.pos.y + 0.2, this.pos.z, 'bounce', 14, 1.4)
        this.game.quests?.event('bounce')
      }
    }

    // remember the last safe sky-stone so parkour falls are quick to retry
    if (this.onGround && this.pos.x > 58 && this.pos.x < 82 && this.pos.z > 20 && this.pos.z < 46 && this.pos.y > 10.5) {
      this.checkpoint = this.pos.clone()
    }
    if (this.pos.y < -12) this.respawnFromFall()

    // face movement direction
    const hspeed = Math.hypot(this.vel.x, this.vel.z)
    this.speed = hspeed
    if (hspeed > 0.4 && this.emote !== 'dance') {
      const targetFacing = Math.atan2(this.vel.x, this.vel.z)
      this.facing = dampAngle(this.facing, targetFacing, 14, dt)
    }
    if (this.emote === 'dance' && moving) {
      this.emote = ''
      this.emoteTimer = 0
    }

    this.updateTargeting(dt, time)
    this.updateVisual(dt, time)
    this.updateCamera(dt)

    // footsteps
    if (this.onGround && hspeed > 1.2) {
      this.walkTime += dt * hspeed
      if (this.walkTime > 1.55) {
        this.walkTime = 0
        this.game.sfx('step', 0.18)
      }
    }
  }

  moveWithCollision(dt) {
    const p = this.pos
    // X axis
    p.x += this.vel.x * dt
    if (this.collidesAt(p)) {
      if (this.tryStepUp()) { /* stepped */ } else { p.x -= this.vel.x * dt; this.vel.x = 0 }
    }
    // Z axis
    p.z += this.vel.z * dt
    if (this.collidesAt(p)) {
      if (this.tryStepUp()) { /* stepped */ } else { p.z -= this.vel.z * dt; this.vel.z = 0 }
    }
    // Y axis
    const oldY = p.y
    p.y += this.vel.y * dt
    if (this.collidesAt(p)) {
      p.y = oldY
      if (this.vel.y < 0) {
        this.onGround = true
      }
      this.vel.y = 0
    } else {
      this.onGround = false
    }
    // ground probe
    if (!this.onGround && this.vel.y <= 0) {
      const probe = { x: p.x, y: p.y - 0.04, z: p.z }
      if (this.collidesAt(probe)) this.onGround = true
    }
    if (this.onGround && this.vel.y < 0) this.vel.y = 0
  }

  tryStepUp() {
    if (!this.onGround || this.stepCooldown > 0) return false
    const oldY = this.pos.y
    this.pos.y += 1.02
    if (!this.collidesAt(this.pos)) {
      this.stepCooldown = 0.14
      return true
    }
    this.pos.y = oldY
    return false
  }

  updateTargeting(dt, time) {
    const dir = new THREE.Vector3()
    this.camera.getWorldDirection(dir)
    // The third-person camera sits ~7.5 blocks behind the builder, so the
    // crosshair ray needs extra length to reach blocks at a comfortable
    // building distance in front of the character.
    const hit = this.world.raycast(this.camera.position, dir, 15)
    const playerDist = hit ? Math.hypot(hit.x + .5 - this.pos.x, hit.y + .5 - (this.pos.y + 1), hit.z + .5 - this.pos.z) : Infinity
    if (hit && playerDist < 8.2) {
      this.target = hit
      this.highlight.visible = true
      this.highlightFace.visible = true
      this.highlight.position.set(hit.x + .5, hit.y + .5, hit.z + .5)
      this.highlightFace.position.copy(this.highlight.position)
      this.highlight.material.opacity = 0.7 + Math.sin(time * 4) * 0.25
      this.highlightFace.material.opacity = 0.06 + Math.sin(time * 4) * 0.03
      if (this.mineProgress > 0) {
        this.crack.visible = true
        this.crack.position.copy(this.highlight.position)
        this.crack.material.opacity = Math.min(1, this.mineProgress * 1.15)
      } else {
        this.crack.visible = false
      }
    } else {
      this.target = null
      this.highlight.visible = false
      this.highlightFace.visible = false
      this.crack.visible = false
      this.mineProgress = 0
    }

    // mining
    if (this.mineHold && this.target && this.mineCooldown <= 0) {
      if (!this.miningKey || this.miningKey !== `${this.target.x},${this.target.y},${this.target.z}`) {
        this.miningKey = `${this.target.x},${this.target.y},${this.target.z}`
        this.mineProgress = 0
      }
      const key = this.target.key
      const hardness = BLOCKS[key]?.hardness || 0.4
      this.mineProgress += dt / Math.max(0.12, hardness)
      // face the block while mining
      const tx = this.target.x + .5, tz = this.target.z + .5
      const targetFacing = Math.atan2(tx - this.pos.x, tz - this.pos.z)
      this.facing = dampAngle(this.facing, targetFacing, 18, dt)
      if (this.mineProgress >= 1) {
        this.breakTarget()
      }
    } else if (!this.mineHold) {
      this.mineProgress = 0
      this.miningKey = null
    }

    if (this.placeQueued) {
      this.placeQueued = false
      this.placeBlock()
    }

    this.game.ui?.setTargetInfo(this.target, this.mineProgress)
  }

  breakTarget() {
    const t = this.target
    if (!t) return
    const key = t.key
    if (!BLOCKS[key] || BLOCKS[key].liquid) { this.mineProgress = 0; return }
    const removed = this.world.removeBlock(t.x, t.y, t.z)
    if (!removed) { this.mineProgress = 0; return }
    this.mineProgress = 0
    this.miningKey = null
    this.mineCooldown = 0.06
    this.game.particles.burst(t.x + .5, t.y + .5, t.z + .5, key, 12, 1.1)
    this.game.sfx('break', 0.8)
    this.game.onBlockBroken(key, t)
  }

  placeBlock() {
    if (!this.target || this.placeCooldown > 0) return
    const key = this.selectedKey
    if (!key || !BLOCKS[key]?.placeable) return
    if ((this.game.inventory[key] || 0) <= 0) {
      this.game.notify(`Out of ${BLOCKS[key].name}!`, 'warn')
      this.game.sfx('deny', 0.6)
      return
    }
    const nx = this.target.x + this.target.normal[0]
    const ny = this.target.y + this.target.normal[1]
    const nz = this.target.z + this.target.normal[2]
    if (nx < 0 || nx >= WORLD || nz < 0 || nz >= WORLD || ny < 0 || ny >= HEIGHT) return
    const existing = this.world.getBlock(nx, ny, nz)
    if (existing !== 0 && !isWater(existing)) return
    // don't entomb yourself
    const b = {
      minX: nx, maxX: nx + 1, minY: ny, maxY: ny + 1, minZ: nz, maxZ: nz + 1
    }
    const p = this.getAABB()
    const overlap = b.minX < p.maxX - 0.02 && b.maxX > p.minX + 0.02 && b.minY < p.maxY - 0.02 && b.maxY > p.minY + 0.02 && b.minZ < p.maxZ - 0.02 && b.maxZ > p.minZ + 0.02
    if (overlap) {
      this.game.notify('Not enough room to build there.', 'warn')
      this.game.sfx('deny', 0.5)
      return
    }
    if (this.world.setBlock(nx, ny, nz, key)) {
      this.game.inventory[key]--
      this.placeCooldown = 0.14
      this.game.sfx('place', 0.7)
      this.game.particles.burst(nx + .5, ny + .5, nz + .5, key, 6, 0.5)
      this.game.onBlockPlaced(key, { x: nx, y: ny, z: nz })
      this.game.ui?.refreshInventory()
    }
  }

  updateVisual(dt, time) {
    this.character.root.position.copy(this.pos)
    this.character.root.rotation.y = this.facing
    this.character.update(dt, {
      speed: this.speed, grounded: this.onGround, time,
      mining: this.mineHold && !!this.target, emote: this.emote,
      lookPitch: -this.cameraPitch * 0.2
    })
  }

  updateCamera(dt) {
    const right = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw))
    const target = new THREE.Vector3(this.pos.x, this.pos.y + 1.42, this.pos.z).addScaledVector(right, 0.82)
    const offset = new THREE.Vector3(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
    ).multiplyScalar(this.cameraDist)
    let desired = target.clone().add(offset)
    // camera collision
    const dir = desired.clone().sub(target).normalize()
    const hit = this.world.raycast(target, dir, this.cameraDist + 0.4)
    if (hit) desired = target.clone().add(dir.multiplyScalar(Math.max(1.4, hit.distance - 0.35)))
    // keep camera inside the sky, not under the island
    if (desired.y < 0.6) desired.y = 0.6
    const k = 1 - Math.exp(-12 * dt)
    this.cameraPos.lerp(desired, k)
    this.cameraTarget.lerp(target, 1 - Math.exp(-18 * dt))
    this.camera.position.copy(this.cameraPos)
    this.camera.lookAt(this.cameraTarget)
    const targetFov = this.sprint && this.speed > 4 ? 68 : 62
    this.fov = damp(this.fov, targetFov, 6, dt)
    if (Math.abs(this.camera.fov - this.fov) > 0.05) {
      this.camera.fov = this.fov
      this.camera.updateProjectionMatrix()
    }
  }

  serialize() {
    return {
      x: this.pos.x, y: this.pos.y, z: this.pos.z,
      yaw: this.cameraYaw, pitch: this.cameraPitch, facing: this.facing,
      hat: this.character.hat
    }
  }
  load(data) {
    if (!data) return
    const x = Number(data.x), z = Number(data.z)
    if (Number.isFinite(x) && Number.isFinite(z) && x > 2 && x < WORLD - 2 && z > 2 && z < WORLD - 2) {
      this.pos.x = x; this.pos.z = z
      this.pos.y = Math.max(this.world.surfaceY(x, z) + 0.05, Math.min(HEIGHT - 3, Number(data.y) || 0))
      if (this.collidesAt(this.pos)) this.pos.y = this.world.surfaceY(x, z) + 0.05
    }
    if (Number.isFinite(data.yaw)) this.cameraYaw = data.yaw
    if (Number.isFinite(data.pitch)) this.cameraPitch = clamp(data.pitch, -0.38, 1.12)
    if (Number.isFinite(data.facing)) this.facing = data.facing
    this.cameraTarget.set(this.pos.x, this.pos.y + 1.42, this.pos.z)
    this.cameraPos.copy(this.cameraTarget)
  }
}
