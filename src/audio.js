export class Audio {
  constructor() {
    this.ctx = null
    this.master = null
    this.musicGain = null
    this.ambientGain = null
    this.muted = false
    this.started = false
    this.night = false
    this._musicTimer = null
    this._birdTimer = null
    this._step = 0
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.62
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.14
    this.musicGain.connect(this.master)
    this.ambientGain = this.ctx.createGain()
    this.ambientGain.gain.value = 0.35
    this.ambientGain.connect(this.master)
    this.noise = this.makeNoise()
    this.startAmbient()
    this.startMusic()
    this.started = true
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 2
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      d[i] = last * 3.2
    }
    return buf
  }

  startAmbient() {
    const src = this.ctx.createBufferSource()
    src.buffer = this.noise
    src.loop = true
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 520
    const gain = this.ctx.createGain()
    gain.gain.value = 0.055
    src.connect(filter).connect(gain).connect(this.ambientGain)
    src.start()
    this.windGain = gain

    const scheduleBird = () => {
      if (!this.ctx) return
      const delay = (4 + Math.random() * 7) * 1000
      this._birdTimer = setTimeout(() => {
        if (this.started && !this.night) this.chirp()
        scheduleBird()
      }, delay)
    }
    scheduleBird()
  }

  chirp() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const notes = 2 + Math.floor(Math.random() * 3)
    for (let i = 0; i < notes; i++) {
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = 'sine'
      const base = 1700 + Math.random() * 1400
      o.frequency.setValueAtTime(base, t + i * 0.11)
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * .4), t + i * 0.11 + 0.06)
      g.gain.setValueAtTime(0, t + i * 0.11)
      g.gain.linearRampToValueAtTime(0.05, t + i * 0.11 + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.11 + 0.1)
      o.connect(g).connect(this.ambientGain)
      o.start(t + i * 0.11); o.stop(t + i * 0.11 + 0.12)
    }
  }

  startMusic() {
    if (!this.ctx) return
    const scale = [0, 2, 4, 7, 9, 12, 14, 16]
    const base = 196
    const play = () => {
      if (!this.ctx || !this.started) return
      const t = this.ctx.currentTime
      if (!this.night) {
        const idx = Math.floor(Math.random() * scale.length)
        const f = base * Math.pow(2, scale[idx] / 12)
        this.pluck(f, t, 0.16)
        if (Math.random() > 0.55) this.pluck(f * 1.5, t + 0.22, 0.09)
        if (this._step % 4 === 0) this.pad(base / 2, t, 0.5)
      } else {
        const idx = Math.floor(Math.random() * 5)
        const f = base * Math.pow(2, [0, 3, 7, 10, 12][idx] / 12)
        this.pluck(f, t, 0.11)
        if (this._step % 3 === 0) this.pad(base / 2, t, 0.4)
      }
      this._step++
      this._musicTimer = setTimeout(play, 1800 + Math.random() * 1400)
    }
    play()
  }

  pluck(freq, t, vol) {
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    const f = this.ctx.createBiquadFilter()
    o.type = 'triangle'
    f.type = 'lowpass'
    f.frequency.value = 1800
    o.frequency.setValueAtTime(freq, t)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
    o.connect(f).connect(g).connect(this.musicGain)
    o.start(t); o.stop(t + 1.2)
  }

  pad(freq, t, vol) {
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol * 0.1, t + 1.2)
    g.gain.linearRampToValueAtTime(0.0001, t + 4.5)
    o.connect(g).connect(this.musicGain)
    o.start(t); o.stop(t + 4.6)
  }

  tone(freq, dur, type = 'sine', vol = 0.15, slide = null, delay = 0) {
    if (!this.ctx || this.muted) return
    const t = this.ctx.currentTime + delay
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(vol, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g).connect(this.master)
    o.start(t); o.stop(t + dur + 0.02)
  }

  noiseBurst(dur = 0.12, freq = 1000, vol = 0.15, type = 'bandpass') {
    if (!this.ctx || this.muted) return
    const t = this.ctx.currentTime
    const src = this.ctx.createBufferSource()
    src.buffer = this.noise
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = 0.8
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f).connect(g).connect(this.master)
    src.start(t); src.stop(t + dur + 0.02)
  }

  sfx(name, volume = 1) {
    if (!this.ctx) return
    const v = Math.min(1, volume)
    switch (name) {
      case 'step': this.noiseBurst(0.06, 420, 0.045 * v, 'lowpass'); break
      case 'jump': this.tone(260, 0.16, 'sine', 0.1 * v, 460); break
      case 'land': this.noiseBurst(0.1, 260, 0.1 * v, 'lowpass'); this.tone(120, 0.09, 'sine', 0.06 * v, 70); break
      case 'break': this.noiseBurst(0.14, 900, 0.2 * v, 'bandpass'); this.tone(180, 0.1, 'square', 0.035 * v, 90); break
      case 'place': this.noiseBurst(0.07, 600, 0.12 * v, 'lowpass'); this.tone(150, 0.08, 'triangle', 0.1 * v, 110); break
      case 'bounce': this.tone(280, 0.28, 'sine', 0.16 * v, 900); this.tone(560, 0.2, 'triangle', 0.05 * v, 1200, 0.04); break
      case 'splash': this.noiseBurst(0.28, 1800, 0.14 * v, 'highpass'); break
      case 'coin': this.tone(1046, 0.09, 'triangle', 0.1 * v); this.tone(1568, 0.14, 'triangle', 0.09 * v, null, 0.07); break
      case 'quest': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.09 * v, null, i * 0.1)); break
      case 'level': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.1 * v, null, i * 0.09)); break
      case 'ui': this.tone(620, 0.045, 'sine', 0.05 * v); break
      case 'deny': this.tone(140, 0.12, 'square', 0.06 * v, 110); break
      case 'emote': this.tone(700, 0.08, 'sine', 0.06 * v, 1000); break
      case 'beacon': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.7, 'sine', 0.07 * v, null, i * 0.14)); break
      case 'sell': this.tone(880, 0.08, 'square', 0.05 * v); this.tone(660, 0.12, 'square', 0.04 * v, null, 0.06); break
      default: break
    }
  }

  setMuted(m) {
    this.muted = m
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.62, this.ctx.currentTime, 0.05)
  }

  setNight(n) {
    this.night = n
    if (this.windGain) this.windGain.gain.setTargetAtTime(n ? 0.09 : 0.05, this.ctx.currentTime, 1.5)
  }
}
