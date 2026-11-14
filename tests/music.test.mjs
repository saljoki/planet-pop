import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers/dom.mjs';
import { TUNES } from '../js/ui/Tunes.js';
import { Music } from '../js/ui/Music.js';
import { SAVED_KEYS } from '../js/core/SaveCode.js';
import { makeApp } from './helpers/world.mjs';

function param(hold = true) {
  const p = {
    value: 0, events: [],
    setValueAtTime(value, time) { this.events.push(['set', value, time]); },
    linearRampToValueAtTime(value, time) { this.events.push(['ramp', value, time]); },
    setTargetAtTime(value, time, rate) { this.events.push(['target', value, time, rate]); },
    cancelScheduledValues(time) { this.events.push(['cancel', null, time]); },
  };
  if (hold) p.cancelAndHoldAtTime = (time) => p.events.push(['hold', null, time]);
  return p;
}

function audio(hold = true) {
  const node = (extra = {}) => ({ connect(to) { this.to = to; return to; }, disconnect() { this.disconnected = true; }, ...extra });
  const c = { currentTime: 0, state: 'running', sampleRate: 8000, destination: node(), oscillators: [], hats: [], gains: [] };
  const source = (kind) => {
    const s = node({ frequency: param(hold), starts: [], stops: [],
      start(time) { assert.ok(time <= c.currentTime + 0.25000001, 'note starts within scheduling horizon'); this.starts.push(time); },
      stop(time) { this.stops.push(time); },
    });
    c[kind].push(s);
    return s;
  };
  c.createOscillator = () => source('oscillators');
  c.createBufferSource = () => source('hats');
  c.createGain = () => { const g = node({ gain: param(hold) }); c.gains.push(g); return g; };
  c.createBiquadFilter = () => node({ frequency: param(hold) });
  c.createBuffer = (_, size) => ({ getChannelData: () => new Float32Array(size) });
  return c;
}

function setup(hold = true) {
  localStorage.clear();
  const ctx = audio(hold), app = { sfx: { enabled: true, ctx }, game: { active: true, over: false, run: { layout: { stats: true }, time: 60 } } };
  return { app, ctx, music: new Music(app) };
}

test('tunes have eight bars of bounded, released notes and the flight tune is faster', () => {
  assert.deepEqual(Object.keys(TUNES), ['menu', 'flight', 'space']);
  assert.ok(TUNES.flight.bpm > TUNES.menu.bpm);
  for (const [id, tune] of Object.entries(TUNES)) {
    assert.equal(tune.id, id);
    assert.equal(tune.bars, 8);
    assert.equal(tune.steps, 16);
    assert.ok(tune.bpm > 0);
    for (const voice of tune.voices) {
      assert.ok(['square', 'triangle', 'sine', 'noise'].includes(voice.wave));
      assert.ok(voice.gain > 0 && voice.gain <= 1);
      for (const note of voice.notes) {
        assert.ok(Number.isInteger(note.step) && note.step >= 0);
        assert.ok(note.freq >= 55 && note.freq <= 2000);
        assert.ok(note.length > 0 && note.step + note.length <= tune.bars * tune.steps);
      }
    }
  }
  for (const tune of [TUNES.menu, TUNES.flight]) {
    assert.ok(tune.voices.some((v) => v.wave === 'square'));
    assert.ok(tune.voices.some((v) => v.wave === 'triangle'));
    assert.ok(tune.voices.some((v) => v.wave === 'noise'));
  }
});

test('four seconds of flight schedule precisely the pitched notes and hats on the tune grid', () => {
  const { ctx, music } = setup(), tune = TUNES.flight;
  for (let frame = 0; frame <= 80; frame++) { ctx.currentTime = frame / 20; music.update(0.05); }
  const span = 60 / tune.bpm / 4;
  const expected = (noise) => tune.voices.filter((v) => (v.wave === 'noise') === noise)
    .flatMap((v) => v.notes.filter((n) => n.step * span < 4.25 - 1e-8));
  assert.equal(ctx.oscillators.length, expected(false).length);
  assert.equal(ctx.hats.length, expected(true).length);
  for (const source of ctx.oscillators) {
    const at = source.starts[0], end = source.stops[0], envelope = source.to.gain.events;
    assert.ok(end > at);
    assert.deepEqual(envelope[0], ['set', 0, at]);
    assert.deepEqual(envelope.at(-1), ['ramp', 0, end], 'release reaches silence before the source stops');
  }
});

test('sound off and zero music volume schedule no notes, including after a tune has started', () => {
  for (const setting of ['sound', 'volume']) {
    const { app, ctx, music } = setup();
    if (setting === 'sound') app.sfx.enabled = false;
    else music.setVolume(0);
    for (let frame = 0; frame <= 80; frame++) { ctx.currentTime = frame / 20; music.update(0.05); }
    assert.equal(ctx.oscillators.length + ctx.hats.length, 0);
    app.sfx.enabled = true;
    music.setVolume(0.4);
    music.update(0.05);
    const before = ctx.oscillators.length + ctx.hats.length;
    assert.ok(before > 0);
    if (setting === 'sound') app.sfx.enabled = false;
    else music.setVolume(0);
    ctx.currentTime += 0.05;
    music.update(0.05);
    assert.equal(ctx.oscillators.length + ctx.hats.length, before);
    assert.equal(music.current, null);
    assert.equal(music.master.gain.events.at(-1)[1], 0);
  }
});

test('music follows every menu, a live run and space, with the planet view silent', () => {
  const music = new Music({}), app = music.app;
  assert.equal(music.want(), null);
  for (const key of ['home', 'hangar', 'board', 'roads', 'briefing', 'results', 'options']) {
    app.game = { [key]: { open: true } };
    assert.equal(music.want(), 'menu', key);
  }
  app.game = {};
  app.start = { open: true };
  assert.equal(music.want(), 'menu');
  app.start.open = false;
  app.spaceCourier = { board: { open: true } };
  assert.equal(music.want(), 'menu');
  app.game.active = true;
  assert.equal(music.want(), 'flight', 'a live run wins over menus');
  app.game.over = true;
  assert.equal(music.want(), 'menu', 'results use menu music');
  app.map = { open: true };
  assert.equal(music.want(), 'space');
  app.map.open = false;
  app.trip = { active: true };
  assert.equal(music.want(), 'space');
  app.trip.active = false;
  app.spaceCourier.board.open = false;
  assert.equal(music.want(), null);
});

test('music remembers a clamped device volume outside save codes', () => {
  localStorage.clear();
  const music = new Music({});
  assert.equal(music.volume, 0.4);
  music.setVolume(0.65);
  assert.equal(new Music({}).volume, 0.65);
  assert.equal(localStorage.getItem('planetpop.music'), '0.65');
  music.setVolume(2);
  assert.equal(music.volume, 1);
  music.setVolume(-1);
  assert.equal(music.volume, 0);
  assert.ok(!SAVED_KEYS.includes('planetpop.music'));
});

test('the Options Sound slider uses its cached controls and remembers the chosen music volume', () => {
  localStorage.clear();
  const app = makeApp({ seed: 20261014, land: 0.45, cities: 5, theme: 'classic' });
  app.music = new Music(app);
  const options = app.game.options;
  options.render();
  assert.equal(options.dom.mus.value, 40);
  assert.equal(options.dom.musVal.textContent, '40%');
  options.setMusic('65');
  assert.equal(app.music.volume, 0.65);
  assert.equal(new Music({}).volume, 0.65);
  options.dom.mus.value = 0;
  options.render();
  assert.equal(options.dom.mus.value, 65);
  assert.equal(options.dom.musVal.textContent, '65%');
  const html = options.el.innerHTML;
  assert.match(html, /<h3>Sound<\/h3>[\s\S]*id="oMus"[\s\S]*<h3>Game<\/h3>/);
  assert.match(html, /id="oMus" type="range" min="0" max="100" step="5"/);
});

test('crossfades hold the current gain, last 0.8 s and begin the new tune at its first bar', () => {
  for (const hold of [true, false]) {
    const { app, ctx, music } = setup(hold);
    music.update(0.05);
    const flight = music.current;
    ctx.currentTime = 0.2;
    app.map = { open: true };
    music.update(0.05);
    const space = music.current;
    assert.equal(space.tune.id, 'space');
    assert.equal(flight.until, 1);
    assert.deepEqual(flight.gain.gain.events.at(-1), ['ramp', 0, 1]);
    assert.deepEqual(space.gain.gain.events.at(-1), ['ramp', 1, 1]);
    assert.ok([...space.sources].some((s) => s.source.starts[0] === 0.2), 'new tune starts on step zero');
    if (hold) assert.equal(flight.gain.gain.events.at(-2)[0], 'hold');
    else assert.deepEqual(flight.gain.gain.events.at(-2), ['set', 0.25, 0.2]);
    ctx.currentTime = 0.4;
    app.map.open = false;
    music.update(0.05);
    assert.ok(music.tracks.length === 3, 'rapid changes keep fading voices alive');
    if (!hold) assert.deepEqual(space.gain.gain.events.at(-2), ['set', 0.25, 0.4]);
  }
});

test('heartbeat silences pads within half a second, cleans old tracks, and pause ducks to 30%', () => {
  const { app, ctx, music } = setup();
  app.map = { open: true };
  music.setVolume(1);
  music.update(0.05);
  const pad = music.current;
  assert.ok([...pad.sources].some((s) => s.end > 0.5), 'space has sustained pads');
  assert.deepEqual(music.gate.gain.events.at(-1), ['ramp', 0, 0.45]);
  assert.equal(music.master.gain.events.at(-1)[1], 0.10);
  ctx.currentTime = 0.05;
  app.paused = true;
  music.update(0.05);
  assert.equal(music.master.gain.events.at(-1)[1], 0.03);
  ctx.currentTime = 5;
  music.update(0.05);
  assert.ok(pad.gain.disconnected);
  assert.equal(music.tracks.length, 1, 'resuming never catches up missed notes');
  assert.ok([...music.current.sources].some((s) => s.source.starts[0] === 5));
  app.map.open = false;
  app.game.active = false;
  music.update(0.05);
  for (let frame = 1; frame <= 17; frame++) { ctx.currentTime = 5 + frame / 20; music.update(0.05); }
  assert.equal(music.tracks.length, 0, 'the planet view lets the old tune fade away');
});

test('only a clocked flight in its last ten seconds speeds up by twelve percent', () => {
  const { app, music } = setup(), flight = { tune: TUNES.flight };
  assert.equal(music.speed(flight), 1);
  app.game.run.time = 10;
  assert.equal(music.speed(flight), 1.12);
  app.game.run.layout.stats = false;
  assert.equal(music.speed(flight), 1, 'free flight and a race have no countdown');
  app.game.run.layout.stats = true;
  app.game.run.coached = true;
  assert.equal(music.speed(flight), 1, 'the lesson has no countdown');
  app.game.run.coached = false;
  app.game.run.time = 0;
  app.game.run.job = { left: 11 };
  assert.equal(music.speed(flight), 1, 'space delivery reads its parcel clock');
  app.game.run.job.left = 9;
  assert.equal(music.speed(flight), 1.12);
  assert.equal(music.speed({ tune: TUNES.space }), 1);
});
