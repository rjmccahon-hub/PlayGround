import * as THREE from '../vendor/three.module.js'
import { BLOCKS, ID_TO_KEY, makeBlockIcon } from './blocks.js'
import { QUEST_DEFS } from './quests.js'
import { HATS } from './character.js'

const $ = id => document.getElementById(id)
const SHOP_ITEMS = [
  { key: 'stone', amount: 50, price: 20 },
  { key: 'planks', amount: 50, price: 20 },
  { key: 'cobble', amount: 40, price: 18 },
  { key: 'sandstone', amount: 40, price: 22 },
  { key: 'glass', amount: 30, price: 30 },
  { key: 'roof', amount: 40, price: 32 },
  { key: 'gold', amount: 10, price: 45 },
  { key: 'bounce', amount: 10, price: 50 },
  { key: 'banner', amount: 20, price: 40 },
  { key: 'snow', amount: 40, price: 24 }
]
const SHIRT_COLORS = ['#2fb6c9', '#e0813f', '#6fae4a', '#9b6ad6', '#ff6fa8', '#f2c34a', '#3f6fd6', '#e8e4ef']
const HAIR_COLORS = ['#5b3a25', '#2c2033', '#c07a3a', '#f2c34a', '#ece8f4', '#d96b9b', '#4fc3d9']
const HAT_ICONS = { none: '·', explorer: '⌒', crown: '♛', wizard: '▲' }
const TOAST_ICONS = { info: '☁', quest: '✦', success: '★', warn: '!', item: '▣' }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawAvatar(canvas, colors = {}, hat = 'none') {
  const ctx = canvas.getContext('2d')
  const S = canvas.width
  const s = S / 128
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, S, S)
  const bg = ctx.createRadialGradient(52 * s, 38 * s, 8 * s, 64 * s, 64 * s, 82 * s)
  bg.addColorStop(0, '#4f8f6a')
  bg.addColorStop(0.55, '#2e6a78')
  bg.addColorStop(1, '#211c3f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, S, S)

  // shoulders / shirt
  ctx.fillStyle = colors.shirt || '#2fb6c9'
  roundRect(ctx, 18 * s, 96 * s, 92 * s, 44 * s, 20 * s); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,.18)'
  roundRect(ctx, 18 * s, 96 * s, 92 * s, 10 * s, 10 * s); ctx.fill()

  // head
  ctx.fillStyle = colors.skin || '#f0c49b'
  roundRect(ctx, 31 * s, 28 * s, 66 * s, 74 * s, 15 * s); ctx.fill()
  // ears
  ctx.beginPath(); ctx.arc(29 * s, 64 * s, 6 * s, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(99 * s, 64 * s, 6 * s, 0, Math.PI * 2); ctx.fill()

  // hair
  ctx.fillStyle = colors.hair || '#5b3a25'
  roundRect(ctx, 28 * s, 22 * s, 72 * s, 28 * s, 13 * s); ctx.fill()
  roundRect(ctx, 28 * s, 36 * s, 12 * s, 34 * s, 6 * s); ctx.fill()
  roundRect(ctx, 88 * s, 36 * s, 12 * s, 34 * s, 6 * s); ctx.fill()
  roundRect(ctx, 34 * s, 24 * s, 60 * s, 12 * s, 8 * s); ctx.fill()
  // fringe
  ctx.beginPath(); ctx.moveTo(34 * s, 50 * s); ctx.quadraticCurveTo(48 * s, 38 * s, 66 * s, 46 * s); ctx.quadraticCurveTo(54 * s, 52 * s, 34 * s, 50 * s); ctx.fill()

  // eyes
  for (const x of [48, 80]) {
    ctx.fillStyle = '#2a2233'
    roundRect(ctx, (x - 4) * s, 58 * s, 8 * s, 11 * s, 4 * s); ctx.fill()
    ctx.fillStyle = '#fff8ee'
    ctx.fillRect((x - 1) * s, 60 * s, 3 * s, 4 * s)
  }
  // brows
  ctx.fillStyle = colors.hair || '#5b3a25'
  roundRect(ctx, 42 * s, 53 * s, 12 * s, 3 * s, 2 * s); ctx.fill()
  roundRect(ctx, 74 * s, 53 * s, 12 * s, 3 * s, 2 * s); ctx.fill()
  // cheeks
  ctx.fillStyle = 'rgba(239,157,143,.55)'
  ctx.beginPath(); ctx.arc(42 * s, 76 * s, 5 * s, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(86 * s, 76 * s, 5 * s, 0, Math.PI * 2); ctx.fill()
  // smile
  ctx.strokeStyle = '#9c5a50'; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(64 * s, 77 * s, 8 * s, 0.18 * Math.PI, 0.82 * Math.PI); ctx.stroke()

  // hat
  if (hat === 'crown') {
    ctx.fillStyle = '#f2c34a'
    roundRect(ctx, 34 * s, 22 * s, 60 * s, 10 * s, 3 * s); ctx.fill()
    for (let i = 0; i < 5; i++) {
      const x = (40 + i * 12) * s
      ctx.beginPath(); ctx.moveTo(x - 4 * s, 22 * s); ctx.lineTo(x, 8 * s); ctx.lineTo(x + 4 * s, 22 * s); ctx.closePath(); ctx.fill()
    }
    ctx.fillStyle = '#ff5f8f'; ctx.beginPath(); ctx.arc(64 * s, 26 * s, 3 * s, 0, Math.PI * 2); ctx.fill()
  } else if (hat === 'wizard') {
    ctx.fillStyle = '#7b4bc4'
    ctx.beginPath(); ctx.moveTo(64 * s, 2 * s); ctx.lineTo(92 * s, 30 * s); ctx.lineTo(36 * s, 30 * s); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#6b40b0'
    roundRect(ctx, 26 * s, 27 * s, 76 * s, 8 * s, 4 * s); ctx.fill()
    ctx.fillStyle = '#f2c34a'
    for (let i = 0; i < 4; i++) {
      const x = (48 + i * 11) * s, y = (10 + i * 4) * s
      ctx.beginPath(); ctx.arc(x, y, 1.8 * s, 0, Math.PI * 2); ctx.fill()
    }
  } else if (hat === 'explorer') {
    ctx.fillStyle = '#e6c27a'
    ctx.beginPath(); ctx.ellipse(64 * s, 30 * s, 42 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill()
    roundRect(ctx, 42 * s, 10 * s, 44 * s, 22 * s, 11 * s); ctx.fill()
    ctx.fillStyle = '#6b8a4a'
    roundRect(ctx, 40 * s, 25 * s, 48 * s, 5 * s, 2 * s); ctx.fill()
  }
}

export class UI {
  constructor(game) {
    this.game = game
    this.iconCache = new Map()
    this.npcLabels = new Map()
    this._lastTargetKey = null
    this._lastProgress = -1
    this._lastCoins = -1
    this._lastLevel = -1
    this._lastXp = -1
    this._mapEditCount = -1
    this._mapBase = document.createElement('canvas')
    this._mapBase.width = 160
    this._mapBase.height = 160
    this.mapTimer = 0
    this.shopItems = SHOP_ITEMS
    this.activeModal = null
    this.touch = false
  }

  init() {
    this.game.quests.on(() => this.refreshQuestPanel())
    this.buildHotbar()
    this.buildInventory()
    this.buildShop()
    this.buildWardrobe()
    this.buildNpcLabels()
    this.bind()
    this.drawAvatars()
    this.refreshPlayer()
    this.refreshQuestPanel()
    this.refreshInventory()
    this.log('Welcome to Sunnyhollow, Builder!')
    this.log('Talk to the villagers — they have quests for you.', 'Realm')
    this.log(this.touch
      ? 'Drag the joystick to move. Drag the world to look around.'
      : 'Click the world to look around. WASD to move.', 'Realm')
  }

  icon(key) {
    if (!this.iconCache.has(key)) this.iconCache.set(key, makeBlockIcon(key, 96).toDataURL())
    return this.iconCache.get(key)
  }

  bind() {
    $('btn-play').addEventListener('click', () => this.game.start())
    $('btn-how').addEventListener('click', () => this.openModal('help'))
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal(btn.dataset.close))
    })
    $('btn-sound').addEventListener('click', () => this.game.toggleSound())
    $('btn-help').addEventListener('click', () => this.openModal('help'))
    $('btn-inventory').addEventListener('click', () => this.openModal('inventory'))
    $('btn-shop').addEventListener('click', () => this.openModal('shop'))
    $('btn-wardrobe').addEventListener('click', () => this.openModal('wardrobe'))
    $('btn-pause').addEventListener('click', () => this.openModal('pause'))
    $('coins-pill').addEventListener('click', () => this.openModal('shop'))
    $('coins-pill').addEventListener('keydown', e => { if (e.key === 'Enter') this.openModal('shop') })
    $('inv-shop-btn').addEventListener('click', () => { this.closeModal('inventory'); this.openModal('shop') })
    $('btn-resume').addEventListener('click', () => this.closeModal('pause'))
    $('btn-pause-help').addEventListener('click', () => this.openModal('help'))
    $('btn-save').addEventListener('click', () => { this.game.save(); this.notify('Realm saved to this browser.', 'success') })
    $('btn-reset').addEventListener('click', () => {
      if (window.confirm('Reset Sunnyhollow? This clears every block you have placed and restarts your progress.')) {
        this.game.reset()
        this.closeModal('pause')
      }
    })
    $('btn-quality').addEventListener('click', () => {
      const high = this.game.toggleQuality()
      $('btn-quality').textContent = `Graphics: ${high ? 'High' : 'Cozy'}`
    })

    $('shop-grid').addEventListener('click', e => {
      const btn = e.target.closest('.buy-btn')
      if (!btn) return
      const { key, amount, price } = btn.dataset
      if (this.game.buy(key, Number(amount), Number(price))) this.refreshInventory()
    })

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('pointerdown', e => {
        if (e.target === modal && modal.id !== 'pause') this.closeModal(modal.id)
      })
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.game.save()
    })
  }

  /* ------------------------------- HUD ------------------------------- */

  buildHotbar() {
    const bar = $('hotbar')
    bar.innerHTML = ''
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement('div')
      slot.className = 'slot'
      slot.dataset.index = i
      slot.innerHTML = `<span class="slot-key">${i + 1}</span><img alt=""><span class="slot-count"></span><span class="slot-name"></span>`
      slot.addEventListener('click', () => {
        this.game.selectSlot(i)
        this.game.sfx('ui')
        this.refreshInventory()
      })
      bar.appendChild(slot)
    }
  }

  refreshInventory() {
    const g = this.game
    const slots = $('hotbar').children
    for (let i = 0; i < slots.length; i++) {
      const el = slots[i]
      const key = g.hotbar[i]
      el.classList.toggle('selected', i === g.selected)
      el.classList.toggle('empty', !key)
      const img = el.querySelector('img')
      const count = el.querySelector('.slot-count')
      const name = el.querySelector('.slot-name')
      if (key) {
        img.src = this.icon(key)
        img.alt = BLOCKS[key].name
        count.textContent = g.inventory[key] ?? 0
        name.textContent = BLOCKS[key].name
        el.title = `${BLOCKS[key].name} — ${g.inventory[key] ?? 0}`
      } else {
        img.removeAttribute('src')
        count.textContent = ''
        name.textContent = 'Empty'
        el.title = 'Empty slot'
      }
    }
    $('inv-slot-num').textContent = g.selected + 1
    const grid = $('inventory-grid')
    if (grid && grid.children.length) {
      for (const card of grid.children) {
        const key = card.dataset.key
        const c = card.querySelector('.inv-count')
        const n = g.inventory[key] ?? 0
        c.textContent = n
        c.classList.toggle('zero', n <= 0)
        card.classList.toggle('selected', g.hotbar[g.selected] === key)
      }
    }
    this.refreshShop()
    this.refreshPlayer()
  }

  refreshPlayer() {
    const g = this.game
    $('coin-count').textContent = g.coins
    $('shop-coins').textContent = g.coins
    const pct = Math.max(0, Math.min(100, (g.xp / g.xpNext) * 100))
    $('xp-fill').style.width = pct + '%'
    $('xp-label').textContent = `${g.xp} / ${g.xpNext} XP`
    $('level-badge').textContent = g.level
    if (this._lastCoins !== g.coins || this._lastLevel !== g.level || this._lastXp !== g.xp) {
      this._lastCoins = g.coins; this._lastLevel = g.level; this._lastXp = g.xp
      this.refreshShop()
    }
  }

  drawAvatars() {
    drawAvatar($('avatar'), this.game.wardrobe, this.game.wardrobe.hat)
  }

  setSound(muted) {
    const b = $('btn-sound')
    b.classList.toggle('muted', muted)
    b.textContent = muted ? '♪̸' : '♪'
  }

  setTouch(touch) {
    this.touch = touch
    document.body.classList.toggle('touch', touch)
  }

  /* ----------------------------- inventory --------------------------- */

  buildInventory() {
    const grid = $('inventory-grid')
    grid.innerHTML = ''
    for (const key of Object.keys(BLOCKS)) {
      if (!BLOCKS[key].placeable) continue
      const card = document.createElement('div')
      card.className = 'inv-card'
      card.dataset.key = key
      card.innerHTML = `<span class="inv-count">0</span><img src="${this.icon(key)}" alt=""><span class="inv-name">${BLOCKS[key].name}</span><span class="inv-desc">${BLOCKS[key].desc}</span>`
      card.addEventListener('click', () => {
        this.game.assignHotbar(key)
        this.game.sfx('ui')
        this.refreshInventory()
        this.notify(`${BLOCKS[key].name} assigned to slot ${this.game.selected + 1}.`, 'info')
      })
      grid.appendChild(card)
    }
  }

  /* -------------------------------- shop ----------------------------- */

  buildShop() {
    const grid = $('shop-grid')
    grid.innerHTML = ''
    for (const item of SHOP_ITEMS) {
      const card = document.createElement('div')
      card.className = 'shop-card'
      card.innerHTML = `<img src="${this.icon(item.key)}" alt=""><div class="shop-info"><div class="sname">${BLOCKS[item.key].name}</div><div class="samount">×${item.amount} blocks</div></div><button class="buy-btn" data-key="${item.key}" data-amount="${item.amount}" data-price="${item.price}"><span class="coin-icon" style="width:10px;height:10px;display:inline-block;vertical-align:-1px;margin-right:3px"></span>${item.price}</button>`
      grid.appendChild(card)
    }
  }

  refreshShop() {
    const grid = $('shop-grid')
    if (!grid) return
    for (const btn of grid.querySelectorAll('.buy-btn')) {
      btn.disabled = this.game.coins < Number(btn.dataset.price)
    }
  }

  /* ------------------------------ wardrobe --------------------------- */

  buildWardrobe() {
    const grid = $('hat-grid')
    grid.innerHTML = ''
    for (const [key, hat] of Object.entries(HATS)) {
      const unlocked = this.game.unlockedHats.includes(key)
      const card = document.createElement('div')
      card.className = 'hat-card'
      card.dataset.hat = key
      card.innerHTML = `<div class="hat-icon">${HAT_ICONS[key]}</div><div><div class="hname">${hat.name}</div><div class="hdesc">${unlocked ? hat.desc : 'Locked — complete village quests.'}</div></div>`
      card.addEventListener('click', () => {
        if (!this.game.unlockedHats.includes(key)) {
          this.notify('That hat is locked. Help the villagers to earn it!', 'warn')
          this.game.sfx('deny')
          return
        }
        this.game.setHat(key)
        this.refreshWardrobe()
        this.drawAvatars()
        this.game.sfx('ui')
      })
      grid.appendChild(card)
    }
    const shirts = $('shirt-swatches')
    shirts.innerHTML = ''
    for (const color of SHIRT_COLORS) {
      const sw = document.createElement('button')
      sw.className = 'swatch'
      sw.style.background = color
      sw.dataset.color = color
      sw.setAttribute('aria-label', 'Shirt colour')
      sw.addEventListener('click', () => { this.game.setShirt(color); this.refreshWardrobe(); this.drawAvatars(); this.game.sfx('ui') })
      shirts.appendChild(sw)
    }
    const hair = $('hair-swatches')
    hair.innerHTML = ''
    for (const color of HAIR_COLORS) {
      const sw = document.createElement('button')
      sw.className = 'swatch'
      sw.style.background = color
      sw.dataset.color = color
      sw.setAttribute('aria-label', 'Hair colour')
      sw.addEventListener('click', () => { this.game.setHair(color); this.refreshWardrobe(); this.drawAvatars(); this.game.sfx('ui') })
      hair.appendChild(sw)
    }
    this.refreshWardrobe()
  }

  refreshWardrobe() {
    const g = this.game
    for (const card of $('hat-grid').children) {
      const key = card.dataset.hat
      const unlocked = g.unlockedHats.includes(key)
      card.classList.toggle('selected', key === g.wardrobe.hat)
      card.classList.toggle('locked', !unlocked)
      const desc = card.querySelector('.hdesc')
      if (desc) desc.textContent = unlocked ? HATS[key].desc : 'Locked — complete village quests.'
    }
    for (const sw of $('shirt-swatches').children) sw.classList.toggle('selected', sw.dataset.color === g.wardrobe.shirt)
    for (const sw of $('hair-swatches').children) sw.classList.toggle('selected', sw.dataset.color === g.wardrobe.hair)
  }

  /* ------------------------------- quests ---------------------------- */

  refreshQuestPanel() {
    const list = $('quest-list')
    const active = Object.entries(this.game.quests.states).filter(([, s]) => s.status === 'active' || s.status === 'ready')
    list.innerHTML = ''
    if (!active.length) {
      const done = Object.values(this.game.quests.states).filter(s => s.status === 'done').length
      list.innerHTML = `<div class="quest-empty">${done === 4
        ? 'Every quest complete. The realm is yours — <b>build something wonderful.</b>'
        : 'Talk to <b>Pip</b>, <b>Fern</b>, <b>Lady Marble</b>, and <b>Zippy</b> to find quests.'}</div>`
    } else {
      for (const [id, s] of active) {
        const def = QUEST_DEFS[id]
        const item = document.createElement('div')
        item.className = 'quest-item' + (s.status === 'ready' ? ' ready' : '')
        const pct = Math.min(100, (s.progress / def.goal) * 100)
        item.innerHTML = `<div class="quest-title"><span>${s.status === 'ready' ? '✦ ' : ''}${def.title}</span><span class="qgiver">${s.status === 'ready' ? 'Return to ' + def.giver : def.giver}</span></div>
          <div class="quest-progress"><span style="width:${pct}%"></span></div>`
        list.appendChild(item)
      }
    }
    this.refreshObjective()
    this.updateMarkers()
  }

  refreshObjective() {
    const states = this.game.quests.states
    const ready = Object.entries(states).find(([, s]) => s.status === 'ready')
    const active = Object.entries(states).find(([, s]) => s.status === 'active')
    let text
    if (ready) text = `Return to ${QUEST_DEFS[ready[0]].giver} — ${QUEST_DEFS[ready[0]].title}`
    else if (active) {
      const def = QUEST_DEFS[active[0]]
      text = `${def.active} · ${active[1].progress}/${def.goal}`
    } else {
      const done = Object.values(states).filter(s => s.status === 'done').length
      text = done >= 4 ? 'The realm is yours. Build something wonderful.' : 'Explore the realm and talk to the villagers'
    }
    $('objective').textContent = text
  }

  updateMarkers() {
    for (const [, entry] of this.npcLabels) {
      const status = this.game.quests.status(entry.npc.quest)
      const marker = entry.markerEl
      if (!marker) continue
      if (status === 'available') { marker.textContent = '!'; marker.className = 'npc-marker'; marker.style.display = '' }
      else if (status === 'ready') { marker.textContent = '?'; marker.className = 'npc-marker ready'; marker.style.display = '' }
      else if (status === 'done') { marker.textContent = '✓'; marker.className = 'npc-marker done'; marker.style.display = '' }
      else { marker.style.display = 'none' }
    }
  }

  /* ------------------------------ dialogue --------------------------- */

  openDialogue(npc) {
    this.currentNpc = npc
    const def = QUEST_DEFS[npc.quest]
    const status = this.game.quests.status(npc.quest)
    const progress = this.game.quests.progress(npc.quest)
    $('dialogue-name').textContent = npc.name
    $('dialogue-role').textContent = `${npc.role} · ${this.game.realmName || 'Sunnyhollow'}`
    drawAvatar($('dialogue-avatar'), {
      skin: npc.def.id === 'marble' ? '#f4d6b8' : '#f0c49b',
      hair: npc.def.hair, shirt: npc.def.shirt
    }, npc.def.hat)
    const textEl = $('dialogue-text')
    const progEl = $('dialogue-progress')
    const rewardEl = $('dialogue-reward')
    const actions = $('dialogue-actions')
    actions.innerHTML = ''
    rewardEl.innerHTML = ''
    progEl.classList.add('hidden')

    if (status === 'available') {
      textEl.textContent = def.text
      rewardEl.innerHTML = this.rewardChips(def)
      this.addDialogueButton(actions, 'Accept quest', 'primary-btn', () => {
        this.game.quests.accept(npc.quest)
        this.refreshQuestPanel()
        this.openDialogue(npc)
      })
      this.addDialogueButton(actions, 'Maybe later', 'ghost-btn', () => this.closeModal('dialogue'))
    } else if (status === 'active') {
      textEl.textContent = def.type === 'reach'
        ? 'The beacon is just past the floating stones. You can do it! I believe in you. Mostly.'
        : `Back already? ${def.active}. You have ${progress} of ${def.goal}.`
      progEl.classList.remove('hidden')
      progEl.innerHTML = `<div class="dp-label"><span>${def.active}</span><b>${progress} / ${def.goal}</b></div><div class="bar"><span style="width:${Math.min(100, progress / def.goal * 100)}%"></span></div>`
      rewardEl.innerHTML = this.rewardChips(def)
      this.addDialogueButton(actions, 'On it!', 'ghost-btn', () => this.closeModal('dialogue'))
    } else if (status === 'ready') {
      textEl.textContent = def.thanks
      rewardEl.innerHTML = this.rewardChips(def)
      this.addDialogueButton(actions, 'Claim reward', 'primary-btn', () => {
        this.game.quests.turnIn(npc.quest)
        this.refreshQuestPanel()
        this.closeModal('dialogue')
      })
      this.addDialogueButton(actions, 'Not yet', 'ghost-btn', () => this.closeModal('dialogue'))
    } else {
      textEl.textContent = def.thanks + ' The realm is better with you in it.'
      rewardEl.innerHTML = '<span class="reward-chip">✓ Quest complete</span>'
      this.addDialogueButton(actions, 'See you around', 'ghost-btn', () => this.closeModal('dialogue'))
    }
    this.openModal('dialogue')
  }

  rewardChips(def) {
    let html = `<span class="reward-chip"><span class="coin-icon"></span>${def.reward.coins}</span><span class="reward-chip">✦ ${def.reward.xp} XP</span>`
    if (def.reward.items) {
      for (const [key, n] of Object.entries(def.reward.items)) {
        html += `<span class="reward-chip"><img src="${this.icon(key)}" alt="">${BLOCKS[key].name} ×${n}</span>`
      }
    }
    if (def.unlockHat) html += `<span class="reward-chip">♛ ${HATS[def.unlockHat].name}</span>`
    return html
  }

  addDialogueButton(parent, label, cls, onClick) {
    const b = document.createElement('button')
    b.className = cls
    b.textContent = label
    b.addEventListener('click', onClick)
    parent.appendChild(b)
  }

  /* ------------------------------- labels ---------------------------- */

  buildNpcLabels() {
    const container = $('npc-labels')
    container.innerHTML = ''
    for (const npc of this.game.npcs) {
      const el = document.createElement('div')
      el.className = 'npc-label'
      el.innerHTML = `<div class="npc-marker">!</div><div class="npc-nameplate"><span class="npc-name">${npc.name}</span><span class="npc-role">${npc.role}</span></div><div class="npc-speech" style="display:none"></div>`
      container.appendChild(el)
      this.npcLabels.set(npc.def.id, {
        npc, el,
        markerEl: el.querySelector('.npc-marker'),
        speechEl: el.querySelector('.npc-speech')
      })
    }
    this.updateMarkers()
  }

  updateNpcLabels(camera, renderer) {
    if (!this.game.npcs) return
    const v = new THREE.Vector3()
    const w = renderer.domElement.clientWidth
    const h = renderer.domElement.clientHeight
    const player = this.game.player.pos
    for (const { npc, el, speechEl } of this.npcLabels.values()) {
      const dist = Math.hypot(npc.pos.x - player.x, npc.pos.z - player.z)
      if (dist > 30 || (this.touch && dist > 9)) { el.style.opacity = '0'; continue }
      npc.getAnchor(v)
      v.project(camera)
      if (v.z > 1 || v.z < -1) { el.style.opacity = '0'; continue }
      const x = (v.x * 0.5 + 0.5) * w
      const y = (-v.y * 0.5 + 0.5) * h
      if (x < -100 || x > w + 100 || y < -100 || y > h + 100) { el.style.opacity = '0'; continue }
      el.style.left = `${x}px`
      el.style.top = `${y}px`
      el.style.opacity = dist > 22 ? '0.35' : '1'
      const speech = npc.getSpeech()
      if (speech) {
        if (speechEl.textContent !== speech) speechEl.textContent = speech
        speechEl.style.display = ''
      } else {
        speechEl.style.display = 'none'
      }
    }
  }

  /* ------------------------------ target ----------------------------- */

  setTargetInfo(target, progress) {
    const label = $('target-label')
    const meter = $('break-meter')
    if (!target) {
      if (this._lastTargetKey !== null) {
        label.classList.remove('visible')
        meter.classList.remove('visible')
        this._lastTargetKey = null
        this._lastProgress = 0
      }
      return
    }
    if (target.key !== this._lastTargetKey) {
      this._lastTargetKey = target.key
      label.innerHTML = `${BLOCKS[target.key]?.name || 'Block'} <span class="tkey">· ${this.touch ? 'hold mine' : 'hold LMB'}</span>`
      label.classList.add('visible')
    }
    const p = Math.min(1, Math.max(0, progress || 0))
    if (Math.abs(p - this._lastProgress) > 0.02) {
      this._lastProgress = p
      meter.querySelector('span').style.width = (p * 100) + '%'
      meter.classList.toggle('visible', p > 0.02)
    }
  }

  setInteractPrompt(npc) {
    const el = $('interact-prompt')
    if (!npc) { el.classList.add('hidden'); return }
    el.classList.remove('hidden')
    el.innerHTML = this.touch
      ? `✦ Talk to <b>${npc.name}</b>`
      : `<kbd>E</kbd> Talk to <b>${npc.name}</b>`
  }

  /* ------------------------------ toasts ----------------------------- */

  notify(text, type = 'info') {
    const stack = $('toast-stack')
    while (stack.children.length >= 4) stack.firstChild.remove()
    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    const icon = document.createElement('span')
    icon.className = 'toast-icon'
    icon.textContent = TOAST_ICONS[type] || '•'
    const span = document.createElement('span')
    span.textContent = text
    toast.append(icon, span)
    stack.appendChild(toast)
    setTimeout(() => {
      toast.classList.add('out')
      setTimeout(() => toast.remove(), 320)
    }, type === 'quest' || type === 'success' ? 4200 : 2800)
  }

  log(text, who = 'You') {
    const log = $('chat-log')
    const line = document.createElement('div')
    line.className = 'chat-line'
    const whoSpan = document.createElement('span')
    whoSpan.className = 'who' + (who !== 'You' ? ' npc' : '')
    whoSpan.textContent = `${who}: `
    line.append(whoSpan, document.createTextNode(text))
    log.appendChild(line)
    while (log.children.length > 4) log.firstChild.remove()
    setTimeout(() => line.classList.add('fade'), 9000)
    setTimeout(() => line.remove(), 16000)
  }

  /* ------------------------------- modals ---------------------------- */

  openModal(id) {
    const modal = $(id)
    if (!modal) return
    // Only one panel at a time — opening Help from the pause menu should not
    // leave a hidden pause screen stacked underneath it.
    document.querySelectorAll('.modal:not(.hidden)').forEach(m => {
      if (m.id !== id) m.classList.add('hidden')
    })
    if (id === 'inventory') { this.refreshInventory() }
    if (id === 'shop') { this.refreshShop(); this.refreshPlayer() }
    if (id === 'wardrobe') this.refreshWardrobe()
    if (id === 'pause') $('btn-quality').textContent = `Graphics: ${this.game.qualityHigh ? 'High' : 'Cozy'}`
    modal.classList.remove('hidden')
    this.activeModal = id
    this.game.setUIOpen(true)
    this.game.sfx('ui')
  }

  closeModal(id) {
    const modal = $(id)
    if (!modal) return
    modal.classList.add('hidden')
    if (this.activeModal === id) this.activeModal = null
    const anyOpen = document.querySelector('.modal:not(.hidden)')
    if (!anyOpen) this.game.setUIOpen(false)
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'))
    this.activeModal = null
    this.game.setUIOpen(false)
  }

  /* ------------------------------ minimap ---------------------------- */

  buildMapBase() {
    const c = this._mapBase
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, 160, 160)
    const world = this.game.world
    const scale = 2
    for (let z = 0; z < 80; z++) {
      for (let x = 0; x < 80; x++) {
        const color = world.topColor(x, z)
        if (!color) continue
        ctx.fillStyle = color
        ctx.fillRect(x * scale, z * scale, scale, scale)
      }
    }
    this._mapEditCount = world.edits.size
  }

  updateMinimap(player, npcs) {
    if (!this.game.started) return
    if (this._mapEditCount !== this.game.world.edits.size) this.buildMapBase()
    const canvas = $('minimap')
    const ctx = canvas.getContext('2d')
    const S = canvas.width
    ctx.clearRect(0, 0, S, S)
    ctx.save()
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2); ctx.clip()
    const bg = ctx.createRadialGradient(S * .45, S * .4, 10, S * .5, S * .5, S * .6)
    bg.addColorStop(0, '#2b2550')
    bg.addColorStop(1, '#151129')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S)
    ctx.globalAlpha = 0.94
    ctx.drawImage(this._mapBase, 0, 0, S, S)
    ctx.globalAlpha = 1
    // soft vignette
    const vg = ctx.createRadialGradient(S / 2, S / 2, S * .28, S / 2, S / 2, S * .5)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(8,6,22,.5)')
    ctx.fillStyle = vg; ctx.fillRect(0, 0, S, S)
    const mx = (x) => (x / 80) * S
    const mz = (z) => (z / 80) * S
    // npc dots
    for (const npc of npcs) {
      const status = this.game.quests.status(npc.quest)
      if (status === 'done') continue
      ctx.beginPath()
      ctx.arc(mx(npc.pos.x), mz(npc.pos.z), 3.4, 0, Math.PI * 2)
      ctx.fillStyle = status === 'ready' ? '#8fe06a' : '#ffd45e'
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 7
      ctx.fill()
      ctx.shadowBlur = 0
    }
    // beacon
    const bx = mx(73), bz = mz(28)
    ctx.fillStyle = '#ffe28a'
    ctx.shadowColor = '#ffd45e'; ctx.shadowBlur = 10
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2
      const r = i % 2 === 0 ? 6 : 2.5
      ctx.lineTo(bx + Math.cos(a) * r, bz + Math.sin(a) * r)
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0
    // player arrow
    const px = mx(player.pos.x), pz = mz(player.pos.z)
    ctx.save()
    ctx.translate(px, pz)
    ctx.rotate(-player.cameraYaw)
    ctx.beginPath()
    ctx.moveTo(0, -8)
    ctx.lineTo(5.6, 6)
    ctx.lineTo(0, 3)
    ctx.lineTo(-5.6, 6)
    ctx.closePath()
    ctx.fillStyle = '#fff6e2'
    ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 4
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#2fb6c9'
    ctx.stroke()
    ctx.restore()
    ctx.restore()
    // outer ring
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,212,94,.28)'; ctx.lineWidth = 2; ctx.stroke()
  }

  /* ------------------------------ lifecycle -------------------------- */

  startScreen() {
    $('start-screen').classList.add('hidden')
    $('ui').classList.remove('ui-hidden')
    $('loading').classList.add('hidden')
    setTimeout(() => this.notify('Tip: hold left-click to mine. Press E to talk.', 'info'), 1400)
  }

  showLoading() { $('loading').classList.remove('hidden') }
  hideLoading() { $('loading').classList.add('hidden') }

  update(dt, renderer) {
    this.mapTimer -= dt
    if (this.mapTimer <= 0) {
      this.mapTimer = 0.12
      this.updateMinimap(this.game.player, this.game.npcs)
    }
    this.updateNpcLabels(this.game.camera, renderer)
  }
}
