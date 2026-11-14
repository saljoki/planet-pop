import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { SUPPLIES, slotsFor, suppliesAllowed } from '../js/game/Supplies.js';
import { MISSIONS } from '../js/game/Missions.js';
import { CARGO } from '../js/game/Cargo.js';
import { HARM } from '../js/game/vehicles/Vehicle.js';

describe('one-flight supplies', () => {
  let app, planet, game;
  before(async () => { localStorage.clear(); ({ app, planet } = await makeWorld({ seed: 20261014, land: .45, cities: 5 })); game = app.game; });
  beforeEach(() => { game.stop(); game.briefing.hide(); localStorage.clear(); game.progress.reset(); delete game.career; app.settings.set('briefing', true); });
  after(() => { game.stop(); planet.dispose(); });

  it('opens slots at ranks 3, 8 and 13', () => {
    assert.deepEqual([1, 2, 3, 7, 8, 12, 13, 30].map(slotsFor), [0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it('allows only the plain courier, never another run class', () => {
    assert.equal(suppliesAllowed({}), true);
    for (const opts of [{ daily: true }, { mission: MISSIONS[0] }, { lesson: true }, { free: true }, { drive: 'car' }, { road: 'van' }, { road: 'taxi' }, { road: 'race' }, { space: true }]) assert.equal(suppliesAllowed(opts), false);
  });

  it('pays 150 once through the briefing; Fly again removes every supply and costs nothing', () => {
    game.progress.addCoins(500);
    game.briefing.show({});
    for (const s of SUPPLIES) assert.ok(game.briefing.toggleSupply(s.id));
    assert.equal(game.progress.coins, 500);
    game.briefing.start();
    assert.equal(game.progress.coins, 350);
    assert.equal(game.run.time, 100);
    assert.equal(game.player.shield, true);
    assert.ok(game.run.supplies.has('tank'));
    assert.doesNotMatch(localStorage.getItem('planetpop.courier'), /supplies|shield/);
    game.briefing.start(); // a duplicate Enter/click does not pay again
    assert.equal(game.progress.coins, 350);
    game.again();
    assert.equal(game.progress.coins, 350);
    assert.equal(game.run.time, 90);
    assert.equal(game.player.shield, false);
    assert.equal(game.run.supplies.size, 0);
    assert.equal(game.run.opts.supplies.length, 0);
  });

  it('enforces slots and wallet, resets choices, and a short wallet starts without taking anything', () => {
    game.career = { rank: 8 };
    game.progress.addCoins(150);
    game.briefing.show({});
    assert.ok(game.briefing.toggleSupply('shield'));
    assert.ok(game.briefing.toggleSupply('tank'));
    assert.equal(game.briefing.toggleSupply('clock'), false);
    assert.equal(game.briefing.dom.supplyNote.textContent, '2 of 2 slots · 🪙 100');
    game.progress.coins = 90;
    game.briefing.start();
    assert.equal(game.progress.coins, 90);
    assert.equal(game.run.supplies.size, 0);
    assert.equal(game.player.shield, false);
    game.stop();
    game.briefing.show({});
    assert.equal(game.briefing.selected.size, 0);
    game.progress.coins = 0;
    game.briefing.renderSupplies();
    assert.equal(game.briefing.dom.supplyNote.textContent, 'Not enough coins');
    assert.equal(game.briefing.toggleSupply('shield'), false);
    assert.equal(game.briefing.dom.supplyNote.textContent, 'Not enough coins');
    assert.equal(game.progress.spend(1), false);
    assert.equal(game.progress.coins, 0);
  });

  it('hides below rank 3 and strips injected supplies from every forbidden route', () => {
    game.career = { rank: 2 };
    game.briefing.show({});
    assert.ok(game.briefing.dom.supplies.classList.contains('hidden'));
    assert.equal(game.briefing.toggleSupply('shield'), false);
    game.start({ supplies: ['shield', 'tank', 'clock'] });
    assert.equal(game.run.supplies.size, 0);
    game.stop();
    delete game.career;
    for (const opts of [{ daily: true }, { mission: MISSIONS[0] }, { lesson: true }, { free: true }, { road: 'van' }]) {
      game.briefing.show({ ...opts, supplies: ['shield', 'tank', 'clock'] });
      assert.ok(game.briefing.dom.supplies.classList.contains('hidden'));
      game.briefing.start();
      assert.equal(game.player.shield, false);
      assert.ok(!game.run.supplies?.size);
      assert.equal(game.run.headStart ?? 0, 0);
      game.again();
      assert.equal(game.player.shield, false);
      assert.ok(!game.run.supplies?.size);
      game.stop();
    }
  });

  it('skipping the briefing cannot carry supplies in from options', () => {
    app.settings.set('briefing', false);
    game.launch({ supplies: ['shield', 'tank', 'clock'] });
    assert.equal(game.run.supplies.size, 0);
    assert.equal(game.run.time, 90);
    assert.equal(game.player.shield, false);
  });

  it('head start raises both the start and the whole-run cap by ten seconds', () => {
    game.start({ supplies: ['clock'] });
    assert.equal(game.run.time, 100);
    assert.equal(game.run.clockCap, 109);
    for (let i = 0; i < 25; i++) { game.run.deliver(); game.run.ring(game.props.rings[0]); assert.ok(game.run.time <= 109); }
    assert.equal(game.run.time, 109);
  });

  it('spare tank refills below 0.02 once, and reports the pop and remaining icons', () => {
    game.start({ supplies: ['tank', 'shield'] });
    const pop = app.sfx.pop, messages = [];
    app.sfx.pop = (_pos, text) => messages.push(text);
    try {
      game.hud.update();
      assert.equal(game.hud.dom.supplies.textContent, '🛡️ ⚡');
      game.player.boost = .02; game.run.update(.01);
      assert.equal(game.player.boost, .02);
      game.player.boost = .019; game.run.update(.01);
      assert.equal(game.player.boost, 1);
      game.player.boost = 0; game.run.update(.01);
      assert.equal(game.player.boost, 0);
      assert.deepEqual(messages, ['⚡ SPARE TANK!']);
      game.hud.update();
      assert.equal(game.hud.dom.supplies.textContent, '🛡️');
    } finally { app.sfx.pop = pop; }
  });

  for (const kind of ['crash', 'lightning', 'ice']) {
    it(`a shield absorbs the first ${kind} and the second takes the existing penalties`, () => {
      game.start({ supplies: ['shield'] });
      const pl = game.player, run = game.run, amount = kind === 'lightning' ? HARM.lightning : HARM.crash;
      run.cargo = CARGO.fragile; pl.setCargo(run.cargo); run.combo = 4;
      const knock = () => { pl.damage(amount); run[kind === 'crash' ? 'crashed' : kind === 'ice' ? 'iced' : 'zapped'](); };
      const pop = app.sfx.pop, messages = [];
      app.sfx.pop = (_pos, text) => messages.push(text);
      try {
        knock();
        assert.equal(pl.health, 1); assert.equal(run.time, 90); assert.equal(run.combo, 4);
        assert.equal(run.broken, false); assert.equal(run.tally.crashes, 0); assert.equal(run.tally.knocks, 0); assert.equal(run.tally.ice, 0);
        assert.equal(pl.shielded, false); assert.equal(pl.shield, false);
        assert.deepEqual(messages, ['🛡️ SHIELD!']);
        knock();
        assert.equal(pl.health, 1 - amount);
        assert.equal(run.time, kind === 'lightning' ? 85 : 82);
        assert.equal(run.tally.knocks, 1);
        assert.equal(run.tally.crashes, kind === 'crash' ? 1 : 0);
        assert.equal(run.tally.ice, kind === 'ice' ? 1 : 0);
        assert.equal(run.combo, kind === 'lightning' ? 4 : 1);
        assert.equal(run.broken, kind !== 'lightning');
      } finally { app.sfx.pop = pop; }
    });
  }

  it('a real ground collision routes the shield through Vehicle.damage and the crash hook', () => {
    game.start({ supplies: ['shield'] });
    game.run.cargo = CARGO.fragile; game.run.combo = 4;
    const pl = game.player;
    pl.invuln = 0; pl.alt = planet.groundR(pl.up) - .05;
    game.update(1 / 60);
    assert.equal(pl.health, 1); assert.equal(game.run.tally.crashes, 0);
    assert.equal(game.run.tally.knocks, 0); assert.equal(game.run.combo, 4); assert.equal(game.run.broken, false);
  });

  it('a real lightning hit preserves boost and skips the ZAP penalty when shielded', () => {
    game.start({ supplies: ['shield'] });
    const pl = game.player, weather = planet.weather, storm = weather.storms[0], at = weather.stormAt, strike = weather.strike, random = Math.random;
    weather.stormAt = () => storm; weather.strike = () => {}; Math.random = () => 0;
    try {
      game.hazards.stormT = 0; pl.invuln = 0; pl.boost = .7;
      game.hazards.storm(.01);
      assert.equal(pl.health, 1); assert.equal(pl.boost, .7); assert.equal(game.run.time, 90); assert.equal(game.run.tally.knocks, 0);
      game.hazards.stormT = 0; pl.invuln = 0;
      game.hazards.storm(.01);
      assert.equal(pl.health, 1 - HARM.lightning); assert.equal(pl.boost, 0); assert.equal(game.run.time, 85); assert.equal(game.run.tally.knocks, 1);
    } finally { weather.stormAt = at; weather.strike = strike; Math.random = random; }
  });

  it('the head-start cap keeps its ten-second difference late in a long courier flight', () => {
    game.start({ supplies: ['clock'] });
    game.run.flightElapsed = 400;
    assert.equal(game.run.clockCap, 89);
    game.stop(); game.start();
    game.run.flightElapsed = 400;
    assert.equal(game.run.clockCap, 79);
  });

  it('real ring ice consumes a shield before the ice counter and crash penalties', () => {
    game.start({ supplies: ['shield'] });
    const rings = planet.rings;
    planet.rings = { ice: [{}], iceAt: () => true };
    try {
      game.player.invuln = 0;
      game.hazards.ice();
      assert.equal(game.player.health, 1);
      assert.equal(game.run.time, 90);
      assert.equal(game.run.tally.knocks, 0);
      assert.equal(game.run.tally.ice, 0);
      game.player.invuln = 0;
      game.hazards.ice();
      assert.equal(game.player.health, 1 - HARM.crash * .6);
      assert.equal(game.run.time, 82);
      assert.equal(game.run.tally.knocks, 1);
      assert.equal(game.run.tally.ice, 1);
    } finally { planet.rings = rings; }
  });

});
