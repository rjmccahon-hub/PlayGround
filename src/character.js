import * as THREE from '../vendor/three.module.js'

const mat = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts })
const box = (w, h, d, material) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

export const HATS = {
  none: { name: 'Bare Head', desc: 'Let the breeze through your hair.' },
  explorer: { name: 'Trail Hat', desc: 'A trusty brim for sky explorers.' },
  crown: { name: 'Sun Crown', desc: 'For the ruler of Sunnyhollow.' },
  wizard: { name: 'Cloud Wizard', desc: 'A pointy hat full of weather.' }
}

export function createCharacter(opts = {}) {
  const colors = {
    skin: opts.skin || '#f0c49b',
    hair: opts.hair || '#5b3a25',
    shirt: opts.shirt || '#2fb6c9',
    shirt2: opts.shirt2 || '#1f8fa3',
    pants: opts.pants || '#5d4b8c',
    shoes: opts.shoes || '#3a2e4e',
    backpack: opts.backpack || '#c1803f',
    hat: opts.hatColor || '#f2c34a'
  }
  const mats = {
    skin: mat(colors.skin), hair: mat(colors.hair), shirt: mat(colors.shirt),
    shirt2: mat(colors.shirt2), pants: mat(colors.pants), shoes: mat(colors.shoes),
    backpack: mat(colors.backpack), dark: mat('#2a2233'), white: mat('#fff8ee'),
    gold: mat('#f2c34a'), purple: mat('#7b4bc4'), straw: mat('#e6c27a'), blush: mat('#ef9d8f')
  }

  const root = new THREE.Group()
  const spin = new THREE.Group()
  const bob = new THREE.Group()
  root.add(spin)
  spin.add(bob)

  // legs
  const legL = new THREE.Group(); legL.position.set(-0.16, 0.62, 0)
  const legR = new THREE.Group(); legR.position.set(0.16, 0.62, 0)
  const legMeshL = box(0.25, 0.62, 0.28, mats.pants); legMeshL.position.y = -0.31
  const legMeshR = box(0.25, 0.62, 0.28, mats.pants); legMeshR.position.y = -0.31
  const shoeL = box(0.27, 0.14, 0.36, mats.shoes); shoeL.position.set(0, -0.55, 0.05)
  const shoeR = box(0.27, 0.14, 0.36, mats.shoes); shoeR.position.set(0, -0.55, 0.05)
  legL.add(legMeshL, shoeL); legR.add(legMeshR, shoeR)
  bob.add(legL, legR)

  // torso
  const torso = box(0.62, 0.64, 0.38, mats.shirt)
  torso.position.y = 0.94
  bob.add(torso)
  const belt = box(0.64, 0.1, 0.4, mats.shirt2)
  belt.position.y = 0.66
  bob.add(belt)
  const buckle = box(0.12, 0.1, 0.03, mats.gold)
  buckle.position.set(0, 0.66, 0.21)
  bob.add(buckle)

  // little backpack
  const pack = box(0.44, 0.42, 0.2, mats.backpack)
  pack.position.set(0, 0.98, -0.27)
  bob.add(pack)
  const packFlap = box(0.46, 0.12, 0.22, mat('#a96a33'))
  packFlap.position.set(0, 1.14, -0.27)
  bob.add(packFlap)
  for (const x of [-0.22, 0.22]) {
    const strap = box(0.07, 0.5, 0.05, mat('#8a5a2f'))
    strap.position.set(x, 0.98, -0.16)
    bob.add(strap)
  }

  // arms
  const armL = new THREE.Group(); armL.position.set(-0.41, 1.18, 0)
  const armR = new THREE.Group(); armR.position.set(0.41, 1.18, 0)
  const armMeshL = box(0.22, 0.56, 0.24, mats.shirt); armMeshL.position.y = -0.28
  const armMeshR = box(0.22, 0.56, 0.24, mats.shirt); armMeshR.position.y = -0.28
  const handL = box(0.2, 0.16, 0.22, mats.skin); handL.position.y = -0.62
  const handR = box(0.2, 0.16, 0.22, mats.skin); handR.position.y = -0.62
  armL.add(armMeshL, handL); armR.add(armMeshR, handR)
  bob.add(armL, armR)

  // head
  const head = new THREE.Group()
  head.position.y = 1.26
  const skull = box(0.66, 0.62, 0.62, mats.skin)
  skull.position.y = 0.33
  head.add(skull)
  // hair cap
  const hair = box(0.7, 0.2, 0.66, mats.hair)
  hair.position.y = 0.63
  head.add(hair)
  const fringe = box(0.7, 0.13, 0.12, mats.hair)
  fringe.position.set(0, 0.55, 0.29)
  head.add(fringe)
  const sideHairL = box(0.1, 0.28, 0.5, mats.hair)
  sideHairL.position.set(-0.34, 0.42, -0.02)
  const sideHairR = sideHairL.clone(); sideHairR.position.x = 0.34
  head.add(sideHairL, sideHairR)
  // face
  for (const x of [-0.16, 0.16]) {
    const eye = box(0.08, 0.12, 0.03, mats.dark)
    eye.position.set(x, 0.34, 0.32)
    head.add(eye)
    const glint = box(0.03, 0.04, 0.02, mats.white)
    glint.position.set(x + 0.02, 0.37, 0.34)
    head.add(glint)
    const cheek = box(0.09, 0.05, 0.02, mats.blush)
    cheek.position.set(x * 1.65, 0.22, 0.32)
    head.add(cheek)
  }
  const mouth = box(0.16, 0.035, 0.02, mat('#9c5a50'))
  mouth.position.set(0, 0.16, 0.325)
  head.add(mouth)
  // eyebrows
  for (const x of [-0.16, 0.16]) {
    const brow = box(0.13, 0.035, 0.02, mats.hair)
    brow.position.set(x, 0.45, 0.325)
    head.add(brow)
  }
  bob.add(head)

  // hats
  const hats = {}
  {
    const g = new THREE.Group()
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.14, 10), mats.gold)
    band.position.y = 0.7
    g.add(band)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 4), mats.gold)
      spike.position.set(Math.cos(a) * 0.34, 0.83, Math.sin(a) * 0.34)
      g.add(spike)
    }
    const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.07), mat('#ff5f8f', { emissive: '#7a1636', emissiveIntensity: .3 }))
    jewel.position.set(0, 0.73, 0.4)
    g.add(jewel)
    hats.crown = g
  }
  {
    const g = new THREE.Group()
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.55, 0.07, 12), mats.purple)
    brim.position.y = 0.7
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.62, 12), mats.purple)
    cone.position.y = 1.03
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12), mats.gold)
    band.position.y = 0.76
    g.add(brim, cone, band)
    for (let i = 0; i < 5; i++) {
      const a = i * 1.7
      const star = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), mat('#ffe28a', { emissive: '#7a5a10', emissiveIntensity: .4 }))
      star.position.set(Math.cos(a) * 0.26, 0.9 + (i % 3) * 0.1, Math.sin(a) * 0.26)
      g.add(star)
    }
    hats.wizard = g
  }
  {
    const g = new THREE.Group()
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.54, 0.06, 12), mats.straw)
    brim.position.y = 0.7
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.28, 12), mats.straw)
    dome.position.y = 0.84
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.08, 12), mat('#6b8a4a'))
    band.position.y = 0.76
    g.add(brim, dome, band)
    hats.explorer = g
  }
  for (const key of Object.keys(hats)) {
    hats[key].visible = false
    hats[key].traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
    head.add(hats[key])
  }
  let currentHat = opts.hat || 'none'
  if (hats[currentHat]) hats[currentHat].visible = true

  // soft blob shadow so the character reads on every device
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.52, 24),
    new THREE.MeshBasicMaterial({ color: 0x1a1830, transparent: true, opacity: 0.22, depthWrite: false })
  )
  blob.rotation.x = -Math.PI / 2
  blob.position.y = 0.02
  root.add(blob)

  const state = { walk: 0, swing: 0, mine: 0, emote: 0, wave: 0, dance: 0 }

  function setHat(key) {
    for (const k of Object.keys(hats)) hats[k].visible = k === key
    currentHat = key
  }
  function setColors(c) {
    if (c.skin) mats.skin.color.set(c.skin)
    if (c.hair) mats.hair.color.set(c.hair)
    if (c.shirt) { mats.shirt.color.set(c.shirt); mats.shirt2.color.set(new THREE.Color(c.shirt).multiplyScalar(0.78)) }
    if (c.pants) mats.pants.color.set(c.pants)
    if (c.backpack) mats.backpack.color.set(c.backpack)
  }

  function update(dt, s = {}) {
    const speed = s.speed || 0
    const grounded = s.grounded !== false
    const time = s.time || 0
    state.walk += dt * (4 + speed * 1.25)
    state.swing += dt * (8 + speed)
    const moving = speed > 0.25 && grounded
    const targetLeg = moving ? Math.sin(state.walk * 1.8) * Math.min(0.75, 0.28 + speed * 0.08) : 0
    const targetArm = moving ? -Math.sin(state.walk * 1.8) * Math.min(0.7, 0.22 + speed * 0.075) : 0
    const air = !grounded
    const mine = s.mining ? 1 : 0
    const emote = s.emote || ''

    const damp = 1 - Math.pow(0.0001, dt)
    const lerpR = (obj, axis, target, speedMul = 1) => {
      obj.rotation[axis] += (target - obj.rotation[axis]) * Math.min(1, damp * speedMul)
    }

    if (air) {
      lerpR(legL, 'x', -0.45, 1.4); lerpR(legR, 'x', 0.35, 1.4)
      lerpR(armL, 'x', -1.3, 1.2); lerpR(armR, 'x', -1.1, 1.2)
      lerpR(armL, 'z', -0.35, 1.2); lerpR(armR, 'z', 0.35, 1.2)
    } else if (emote === 'dance') {
      const t = time * 7
      lerpR(armL, 'x', -1.9 + Math.sin(t) * 0.7, 2)
      lerpR(armR, 'x', -1.9 - Math.sin(t) * 0.7, 2)
      lerpR(armL, 'z', -0.5 + Math.cos(t) * 0.4, 2)
      lerpR(armR, 'z', 0.5 - Math.cos(t) * 0.4, 2)
      lerpR(legL, 'x', Math.sin(t) * 0.45, 2)
      lerpR(legR, 'x', -Math.sin(t) * 0.45, 2)
      bob.position.y = Math.abs(Math.sin(t)) * 0.09
      spin.rotation.y += dt * 1.8
    } else if (emote === 'wave') {
      lerpR(armR, 'x', -2.5, 2.5)
      lerpR(armR, 'z', 0.5 + Math.sin(time * 9) * 0.3, 2.5)
      lerpR(armL, 'x', 0, 2)
      lerpR(legL, 'x', 0, 2); lerpR(legR, 'x', 0, 2)
    } else {
      lerpR(legL, 'x', targetLeg, 1.2)
      lerpR(legR, 'x', -targetLeg, 1.2)
      if (mine) {
        lerpR(armR, 'x', -1.7 + Math.sin(state.swing * 2.2) * 0.85, 2.4)
        lerpR(armR, 'z', 0.25, 2)
        lerpR(armL, 'x', targetArm * 0.5, 1.2)
        lerpR(armL, 'z', 0, 1.2)
      } else {
        lerpR(armL, 'x', targetArm, 1.2)
        lerpR(armR, 'x', -targetArm, 1.2)
        lerpR(armL, 'z', -0.06, 1.2)
        lerpR(armR, 'z', 0.06, 1.2)
      }
      if (emote !== 'dance') spin.rotation.y += (0 - spin.rotation.y) * Math.min(1, dt * 2)
      bob.position.y = moving ? Math.abs(Math.sin(state.walk * 1.8)) * 0.045 : Math.sin(time * 2.1) * 0.012
    }
    if (emote === 'dance') {
      bob.position.y = Math.abs(Math.sin(time * 7)) * 0.09
    }
    // head looks slightly toward camera pitch for life
    head.rotation.x += ((s.lookPitch || 0) * 0.35 - head.rotation.x) * Math.min(1, dt * 4)
    head.rotation.y = Math.sin(time * 0.5) * 0.04
  }

  return {
    root, spin, bob, head, parts: { legL, legR, armL, armR, torso, skull, hats }, mats,
    setHat, setColors, update,
    get hat() { return currentHat }
  }
}
