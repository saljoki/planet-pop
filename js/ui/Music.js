import { loadNumber, saveNumber } from '../core/Store.js';
import { TUNES } from './Tunes.js';

const KEY = 'planetpop.music', AHEAD = 0.25, FADE = 0.8, LEVEL = 0.10;

/** Frame-driven music on the effects AudioContext, with its own device volume and no timers. */
export class Music {
  constructor(app) {
    this.app = app;
    this.volume = Math.min(1, Math.max(0, loadNumber(KEY, 0.4)));
    this.tracks = [];
    this.current = null;
    this.lastTime = null;
    this.master = null;
  }

  setVolume(v) {
    this.volume = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.4;
    saveNumber(KEY, this.volume);
  }

  want() {
    const app = this.app, g = app.game;
    if (app.map?.open || app.trip?.active) return 'space';
    if (g?.active && !g.over) return 'flight';
    // Options can replace a menu temporarily; keep its soundtrack while it is on top.
    if ([app.start, g?.home, g?.hangar, g?.board, g?.roads, g?.briefing, g?.results, g?.options, app.spaceCourier?.board].some((m) => m?.open)) return 'menu';
    return null;
  }

  start() {
    const c = this.app.sfx.ctx;
    this.master = c.createGain();
    this.master.gain.value = 0;
    this.master.connect(c.destination);
    this.gate = c.createGain();
    this.gate.gain.value = 0;
    this.gate.connect(this.master);
  }

  /** Hold the actual envelope through a rapid change, including on older AudioParam implementations. */
  hold(param, now, value) {
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else {
      param.cancelScheduledValues(now);
      param.setValueAtTime(value, now);
    }
  }

  fadeValue(track, now) {
    const f = track.fade, t = Math.min(1, Math.max(0, (now - f.start) / FADE));
    return f.from + (f.to - f.from) * t;
  }

  fade(track, to, now) {
    const from = this.fadeValue(track, now), gain = track.gain.gain;
    this.hold(gain, now, from);
    gain.linearRampToValueAtTime(to, now + FADE);
    track.fade = { from, to, start: now };
    track.until = to ? Infinity : now + FADE;
  }

  change(id, now) {
    if (this.current?.tune.id === id || (!this.current && !id)) return;
    if (this.current) this.fade(this.current, 0, now);
    this.current = null;
    if (!id) return;
    const c = this.app.sfx.ctx, gain = c.createGain();
    gain.gain.value = 0;
    gain.connect(this.gate);
    const track = { tune: TUNES[id], gain, step: 0, next: now, sources: new Set(), fade: { from: 0, to: 0, start: now } };
    this.fade(track, 1, now);
    this.tracks.push(track);
    this.current = track;
  }

  /** A short audio-clock lease: even long pads fade out within 0.45 s of the last animation frame. */
  heartbeat(now) {
    const h = this.beat;
    const level = !h ? 0 : now < h.start + 0.01 ? h.from + (1 - h.from) * (now - h.start) / 0.01
      : now <= h.start + AHEAD ? 1 : Math.max(0, 1 - (now - h.start - AHEAD) / 0.2);
    const gain = this.gate.gain;
    this.hold(gain, now, level);
    gain.linearRampToValueAtTime(1, now + 0.01);
    gain.setValueAtTime(1, now + AHEAD);
    gain.linearRampToValueAtTime(0, now + 0.45);
    this.beat = { start: now, from: level };
  }

  speed(track) {
    const run = this.app.game?.run, left = run?.job?.left ?? run?.time;
    return track.tune.id === 'flight' && run?.layout?.stats && !run.coached && left <= 10 ? 1.12 : 1;
  }

  noise() {
    if (this.noiseBuffer) return this.noiseBuffer;
    const c = this.app.sfx.ctx, buffer = c.createBuffer(1, c.sampleRate / 5, c.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return (this.noiseBuffer = buffer);
  }

  note(track, voice, note, at, span) {
    const c = this.app.sfx.ctx, noise = voice.wave === 'noise';
    const source = noise ? c.createBufferSource() : c.createOscillator(), env = c.createGain();
    const duration = note.length * span, end = at + duration;
    const attack = Math.min(0.03, duration * 0.18), release = Math.min(0.05, duration * 0.3);
    let filter = null;
    if (noise) {
      source.buffer = this.noise();
      source.loop = true;
      filter = c.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = note.freq;
      source.connect(filter).connect(env);
    } else {
      source.type = voice.wave;
      source.frequency.setValueAtTime(note.freq, at);
      source.connect(env);
    }
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(voice.gain, at + attack);
    env.gain.setValueAtTime(voice.gain, end - release);
    env.gain.linearRampToValueAtTime(0, end);
    env.connect(track.gain);
    const item = { source, env, filter, end };
    track.sources.add(item);
    source.onended = () => this.ended(track, item);
    source.start(at);
    source.stop(end);
  }

  ended(track, item) {
    item.source.disconnect();
    item.env.disconnect();
    item.filter?.disconnect();
    track.sources.delete(item);
    if (track.discarded && !track.sources.size) track.gain.disconnect();
  }

  discard(track, now) {
    track.discarded = true;
    for (const item of track.sources) {
      item.source.stop(now);
      if (now <= this.app.sfx.ctx.currentTime) this.ended(track, item);
    }
    if (!track.sources.size) track.gain.disconnect();
  }

  /** Schedule starts only a quarter-second ahead; the audio clock keeps the grid steady between frames. */
  update(dt) {
    const app = this.app, c = app.sfx?.ctx;
    if (!c || c.state !== 'running') return;
    const now = c.currentTime, on = app.sfx.enabled && this.volume > 0 && !document.hidden;
    if (!on) {
      if (this.master) this.master.gain.setTargetAtTime(0, now, 0.005);
      for (const track of this.tracks) this.discard(track, now + 0.03);
      this.tracks = [];
      this.current = null;
      this.lastTime = null;
      return;
    }
    if (!this.master) this.start();
    // A stopped frame loop must resume from here, without playing a backlog of missed notes.
    if (this.lastTime !== null && now - this.lastTime > 0.5) {
      for (const track of this.tracks) this.discard(track, now);
      this.tracks = [];
      this.current = null;
    }
    this.master.gain.setTargetAtTime(LEVEL * this.volume * (app.paused ? 0.3 : 1), now, 0.03);
    this.heartbeat(now);
    this.change(this.want(), now);
    for (const track of this.tracks) {
      if (track.until <= now) continue;
      const span = 60 / track.tune.bpm / 4 / this.speed(track), limit = Math.min(now + AHEAD, track.until);
      while (track.next < limit - 1e-8) {
        if (track.next >= now - 1e-8) {
          for (const voice of track.tune.voices) {
            for (const note of voice.notes) if (note.step === track.step) this.note(track, voice, note, track.next, span);
          }
        }
        track.next += span;
        track.step = (track.step + 1) % (track.tune.bars * track.tune.steps);
      }
      for (const item of track.sources) if (item.end <= now) this.ended(track, item);
    }
    this.tracks = this.tracks.filter((track) => {
      if (track.until > now) return true;
      this.discard(track, now);
      return false;
    });
    this.lastTime = now;
  }
}
