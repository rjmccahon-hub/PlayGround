import * as THREE from '../vendor/three.module.js'
import { blockColor } from './blocks.js'

export class Particles {
  constructor(scene) {
    this.scene = scene
    this.geo = new THREE.BoxGeometry(0.14, 0.14, 0.14)
    this.pool = []
    this.active = []
    for (let i = 0; i < 180; i++) {
      const m = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 }))
      m.visible = false
      m.matrixAutoUpdate = true
      this.scene.add(m)
      this.pool.push(m)
    }
  }

  _get() {
    const m = this.pool.pop()
    if (!m) {
      const old = this.active.shift()
      return old || null
    }
    return m
  }

  burst(x, y, z, key, count = 10, power = 1) {
    const color = new THREE.Color(blockColor(key))
    for (let i = 0; i < count; i++) {
      const m = this._get()
      if (!m) return
      m.visible = true
      m.material.color.copy(color).offsetHSL((Math.random() - .5) * .06, 0, (Math.random() - .5) * .12)
      m.material.opacity = 1
      m.position.set(x + (Math.random() - .5) * .6, y + (Math.random() - .5) * .6, z + (Math.random() - .5) * .6)
      const s = 0.5 + Math.random() * 1.1
      m.scale.setScalar(s)
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)
      this.active.push({
        mesh: m, life: 0.45 + Math.random() * 0.5, maxLife: 0.95,
        vx: (Math.random() - .5) * 4 * power,
        vy: (Math.random() * 3.2 + 1) * power,
        vz: (Math.random() - .5) * 4 * power,
        spin: (Math.random() - .5) * 10,
        gravity: 12
      })
    }
  }

  sparkle(x, y, z, color = '#ffe28a', count = 14, power = 1) {
    const c = new THREE.Color(color)
    for (let i = 0; i < count; i++) {
      const m = this._get()
      if (!m) return
      m.visible = true
      m.material.color.copy(c)
      m.material.opacity = 1
      m.position.set(x, y, z)
      m.scale.setScalar(0.4 + Math.random() * 0.8)
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)
      const a = Math.random() * Math.PI * 2
      const sp = (0.8 + Math.random() * 2.2) * power
      this.active.push({
        mesh: m, life: 0.7 + Math.random() * 0.9, maxLife: 1.6,
        vx: Math.cos(a) * sp, vy: 0.6 + Math.random() * 2.4 * power, vz: Math.sin(a) * sp,
        spin: (Math.random() - .5) * 8, gravity: 2.5
      })
    }
  }

  confetti(x, y, z, count = 40) {
    const colors = ['#ffd45e', '#ff6fa8', '#6fd6f2', '#8c5ad6', '#7ac653', '#fff3c0']
    for (let i = 0; i < count; i++) {
      const m = this._get()
      if (!m) return
      m.visible = true
      m.material.color.set(colors[i % colors.length])
      m.material.opacity = 1
      m.position.set(x + (Math.random() - .5) * 2, y + Math.random() * .5, z + (Math.random() - .5) * 2)
      m.scale.setScalar(0.5 + Math.random())
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3)
      this.active.push({
        mesh: m, life: 1.4 + Math.random() * 1.4, maxLife: 2.8,
        vx: (Math.random() - .5) * 6, vy: 3 + Math.random() * 5, vz: (Math.random() - .5) * 6,
        spin: (Math.random() - .5) * 12, gravity: 6
      })
    }
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i]
      p.life -= dt
      if (p.life <= 0) {
        p.mesh.visible = false
        this.pool.push(p.mesh)
        this.active.splice(i, 1)
        continue
      }
      p.vy -= p.gravity * dt
      p.mesh.position.x += p.vx * dt
      p.mesh.position.y += p.vy * dt
      p.mesh.position.z += p.vz * dt
      p.mesh.rotation.x += p.spin * dt
      p.mesh.rotation.y += p.spin * 0.7 * dt
      p.mesh.material.opacity = Math.min(1, p.life * 2.2)
      const s = Math.min(1, p.life * 2) * (p.mesh.scale.x > 0 ? 1 : 1)
      p.mesh.scale.multiplyScalar(1 - dt * 0.8)
    }
  }
}
