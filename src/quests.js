export const QUEST_DEFS = {
  timber: {
    title: 'Timber Time',
    giver: 'Fern',
    icon: 'log',
    short: 'Bring Fern 10 oak logs from the grove.',
    text: 'The trellis by the pond is falling apart, and my ladder has seen better days. Could you gather 10 oak logs for me? I will make it worth your while!',
    active: 'Gather oak logs',
    goal: 10,
    type: 'collect',
    match: 'log',
    reward: { coins: 60, xp: 40, items: { planks: 30 } },
    thanks: 'Oh, lovely! These will do nicely. Take some planks — and a few coins for your trouble.'
  },
  stone: {
    title: 'Stone Cold',
    giver: 'Pip',
    icon: 'stone',
    short: 'Deliver 14 stone to Pip the Mason.',
    text: 'The fountain is missing a few good stones, and I refuse to patch it with mud. Fourteen blocks of stone should do it. Mind the moss — actually, bring the moss too!',
    active: 'Mine stone for Pip',
    goal: 14,
    type: 'collect',
    match: 'stone',
    reward: { coins: 75, xp: 50, items: { cobble: 30 } },
    thanks: 'Sturdy, square, and delightfully grey. The fountain shall sing again!'
  },
  banners: {
    title: 'Raise the Banners',
    giver: 'Lady Marble',
    icon: 'banner',
    short: 'Place 20 blocks anywhere in the realm.',
    text: 'A realm is not a realm until someone builds something in it. Place 20 blocks of your choosing — a tower, a bench, a very small castle. Surprise me.',
    active: 'Place 20 blocks',
    goal: 20,
    type: 'place',
    reward: { coins: 120, xp: 80, items: { gold: 12, banner: 8 } },
    thanks: 'Splendid! Sunnyhollow grows more beautiful by the block. The Sun Crown is yours, builder.',
    unlockHat: 'crown'
  },
  beacon: {
    title: 'Touch the Sky',
    giver: 'Zippy',
    icon: 'gold',
    short: 'Leap the floating stones and touch the sky beacon.',
    text: 'See that shiny beacon on the little sky island? I dare you to hop across the floating stones and touch it. I will be right here, cheering very loudly.',
    active: 'Reach the sky beacon',
    goal: 1,
    type: 'reach',
    reward: { coins: 100, xp: 90, items: { bounce: 10, snow: 20 } },
    thanks: 'YOU DID IT! I knew you could! That was the coolest jump I have ever seen. Probably.',
    unlockHat: 'wizard'
  }
}

export class Quests {
  constructor(game) {
    this.game = game
    this.states = {}
    for (const id of Object.keys(QUEST_DEFS)) this.states[id] = { status: 'available', progress: 0 }
    this.listeners = []
  }

  on(fn) { this.listeners.push(fn) }
  emit() { for (const fn of this.listeners) fn(this) }

  status(id) { return this.states[id]?.status || 'available' }
  progress(id) { return this.states[id]?.progress || 0 }

  accept(id) {
    const s = this.states[id]
    if (!s || s.status !== 'available') return false
    s.status = 'active'
    s.progress = 0
    this.game.sfx('ui')
    this.game.notify(`Quest accepted: ${QUEST_DEFS[id].title}`, 'quest')
    this.emit()
    return true
  }

  event(type, key = null, amount = 1) {
    let changed = false
    for (const [id, s] of Object.entries(this.states)) {
      if (s.status !== 'active') continue
      const def = QUEST_DEFS[id]
      if (def.type === type) {
        if (type === 'collect' && def.match !== key) continue
        s.progress = Math.min(def.goal, s.progress + amount)
        if (s.progress >= def.goal) {
          s.status = 'ready'
          this.game.sfx('quest')
          this.game.notify(`Quest ready: ${def.title} — return to ${def.giver}!`, 'quest')
          this.game.particles.confetti(this.game.player.pos.x, this.game.player.pos.y + 2.2, this.game.player.pos.z, 26)
        }
        changed = true
      }
    }
    if (changed) this.emit()
  }

  turnIn(id) {
    const s = this.states[id]
    const def = QUEST_DEFS[id]
    if (!s || s.status !== 'ready') return false
    s.status = 'done'
    this.game.addCoins(def.reward.coins)
    this.game.addXP(def.reward.xp)
    if (def.reward.items) for (const [k, n] of Object.entries(def.reward.items)) this.game.addItem(k, n)
    if (def.unlockHat) this.game.unlockHat(def.unlockHat)
    this.game.sfx('quest')
    this.game.notify(`${def.title} complete! +${def.reward.coins} coins, +${def.reward.xp} XP`, 'success')
    this.game.particles.confetti(this.game.player.pos.x, this.game.player.pos.y + 2.4, this.game.player.pos.z, 46)
    this.game.ui.refreshQuestPanel()
    this.emit()
    return true
  }

  reachBeacon() {
    const s = this.states.beacon
    if (s.status === 'active') {
      s.progress = 1
      s.status = 'ready'
      this.game.sfx('beacon')
      this.game.notify('Sky beacon touched! Return to Zippy.', 'quest')
      this.game.particles.sparkle(this.game.player.pos.x, this.game.player.pos.y + 2, this.game.player.pos.z, '#ffe28a', 40, 1.6)
      this.emit()
    }
  }

  serialize() {
    const out = {}
    for (const [id, s] of Object.entries(this.states)) out[id] = { ...s }
    return out
  }
  load(data) {
    if (!data) return
    for (const id of Object.keys(this.states)) {
      if (data[id] && ['available', 'active', 'ready', 'done'].includes(data[id].status)) {
        this.states[id].status = data[id].status
        this.states[id].progress = Math.max(0, Math.min(QUEST_DEFS[id].goal, Number(data[id].progress) || 0))
      }
    }
    this.emit()
  }
}
