import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { mulberry32 } from '../js/core/Noise.js';
import { MISSIONS } from '../js/game/Missions.js';
import { DailyRun, DAILY_PARCELS } from '../js/game/runs/DailyRun.js';

const DEFAULT_PLANET = { seed: 20261014, land: 0.45, cities: 5 };

describe('courier clocks and the daily route', () => {
  let app, planet, game;
  before(async () => {
    localStorage.clear();
    ({ app, planet } = await makeWorld(DEFAULT_PLANET));
    game = app.game;
  });
  beforeEach(() => { game.stop(); localStorage.clear(); game.progress.reset(); });
  after(() => { game.stop(); planet.dispose(); });

  it('delivery bonuses fall from twenty seconds to a six-second floor', () => {
    game.start();
    const run = game.run;
    for (const [deliveries, bonus] of [[0, 20], [1, 19], [2, 18], [14, 6], [19, 6]]) {
      run.deliveries = deliveries;
      assert.equal(run.deliveryBonus(), bonus);
    }
  });

  it('deliveries and rings respect the clock cap, and the toast shows the time gained', () => {
    game.start();
    const run = game.run, toast = app.hud.toast, messages = [];
    app.hud.toast = (message) => messages.push(message);
    try {
      assert.equal(run.clockCap, run.stats.startTime + 9);
      for (let i = 0; i < 25; i++) {
        run.time = run.clockCap - 1;
        run.deliver();
        assert.equal(run.time, run.clockCap);
        run.ring(game.props.rings[0]);
        assert.equal(run.time, run.clockCap);
      }
      assert.ok(messages.some((message) => message.endsWith('(+1 s)')));
      run.time = 20;
      run.deliveries = 3;
      run.deliver();
      assert.equal(run.time, 37);
      assert.ok(messages.at(-1).endsWith('(+17 s)'));
    } finally { app.hud.toast = toast; }
  });

  it('a mission still adds twenty seconds on its fifth delivery and has no clock cap', () => {
    game.start({ mission: MISSIONS[0] });
    const run = game.run;
    for (let i = 0; i < 4; i++) run.deliver();
    run.time = run.stats.startTime + 100;
    const before = run.time;
    assert.equal(run.deliveryBonus(), 20);
    assert.equal(run.clockCap, Infinity);
    run.deliver();
    assert.equal(run.time, before + 20);
    run.ring(game.props.rings[0]);
    assert.equal(run.time, before + 25);
  });

  it('the van courier keeps its twenty-second bonus, uncapped clock and existing toast', () => {
    game.start({ road: 'van' });
    const run = game.run, toast = app.hud.toast, messages = [];
    app.hud.toast = (message) => messages.push(message);
    try {
      for (let i = 0; i < 4; i++) run.deliver();
      run.time = run.stats.startTime + 100;
      const before = run.time;
      assert.equal(run.clockCap, Infinity);
      assert.equal(run.deliveryBonus(), 20);
      run.deliver();
      assert.equal(run.time, before + 20);
      assert.doesNotMatch(messages.at(-1), /\(\+\d+ s\)/);
    } finally { app.hud.toast = toast; }
  });

  it('an ace in the stock plane runs out of time in under eight simulated minutes', (t) => {
    const random = Math.random;
    Math.random = mulberry32(7);
    try { game.start(); } finally { Math.random = random; }
    const run = game.run, player = game.player, dt = 1 / 60;
    assert.equal(player.stats.speed, 1);
    let seconds = 0, crashes = 0;
    for (; seconds < 8 * 60 && !game.over; seconds += dt) {
      player.steerToward(run.destPoint(), 1.5);
      player.input.boost = player.up.angleTo(run.destPoint()) > 0.3 && player.boost > 0.3;
      player.invuln = Infinity; // the reference ace never crashes or takes a lightning strike
      app.simTime += dt;
      app.sky.update(dt);
      planet.update(dt, app.simTime);
      game.update(dt);
      if (player.crashed) crashes++;
    }
    t.diagnostic(`Ace: ${seconds.toFixed(1)} s, ${run.deliveries} deliveries`);
    assert.equal(crashes, 0);
    assert.ok(game.over, `ace was still flying after ${seconds.toFixed(1)} s (${run.deliveries} deliveries)`);
    assert.match(game.results.dom.title.textContent, /Time's up/);
    assert.ok(seconds < 8 * 60);
  });

  it('the tenth parcel can be stolen, and the remaining-time bonus is recorded exactly once', () => {
    game.start({ daily: true });
    const run = game.run;
    for (let i = 0; i < DAILY_PARCELS - 1; i++) run.deliver();
    assert.ok(!game.over);
    game.hud.update();
    assert.equal(game.hud.dom.daily.textContent, '📅 9 / 10');
    run.time = 41.9;
    const score = run.score;
    run.steal();
    assert.ok(game.over);
    assert.equal(run.deliveries, 9);
    assert.equal(run.stolen, 1);
    assert.equal(run.parcels, DAILY_PARCELS);
    assert.equal(run.score, score + 410);
    assert.equal(game.progress.dailyBest(run.date), run.score);
    assert.equal(game.hud.dom.daily.textContent, '📅 10 / 10');
    assert.equal(game.results.dom.title.textContent, '🏁 Route complete!');
    assert.match(game.results.dom.result.innerHTML, /⏱ 41 s left: \+410/);
    run.checkEnd();
    run.gameOver();
    run.deliver();
    run.steal();
    game.update(1);
    assert.equal(run.score, score + 410);
    assert.equal(run.parcels, DAILY_PARCELS);
    assert.equal(game.progress.dailyBest(run.date), run.score);
  });

  for (const ending of ['delivery', 'broken delivery', 'steal']) {
    it(`the last daily parcel loads no new destination or parcel after a ${ending}`, () => {
      game.start({ daily: true });
      const run = game.run;
      for (let i = 0; i < DAILY_PARCELS - 1; i++) run.deliver();
      const dest = run.dest, cargo = run.cargo, random = run.rand, toast = app.hud.toast, messages = [];
      let rolls = 0;
      run.rand = () => { rolls++; return random(); };
      app.hud.toast = (message) => messages.push(message);
      try {
        if (ending === 'steal') run.steal();
        else {
          run.broken = ending === 'broken delivery';
          run.deliver();
        }
        assert.ok(game.over);
        assert.equal(run.parcels, DAILY_PARCELS);
        assert.equal(game.results.dom.title.textContent, '🏁 Route complete!');
        assert.ok(!messages.some((message) => /\bNew\s/.test(message)), `announced another parcel: ${messages.join(' | ')}`);
        assert.ok(!messages.some((message) => message.includes('Grab the next one!')), 'asked for another parcel after the route ended');
        assert.equal(rolls, 0, 'rolled another parcel after the last one');
        assert.equal(run.dest, dest);
        assert.equal(run.cargo, cargo);
      } finally { app.hud.toast = toast; run.rand = random; }
    });
  }

  it('handing over broken parcels cannot extend the daily past its ten parcels', () => {
    game.start({ daily: true });
    const run = game.run;
    for (let i = 0; i < DAILY_PARCELS; i++) {
      run.broken = true;
      run.deliver();
    }
    assert.ok(game.over);
    assert.equal(run.deliveries, 0);
    assert.equal(run.parcels, DAILY_PARCELS);
    assert.equal(game.results.dom.title.textContent, '🏁 Route complete!');
  });

  it('the daily can time out before ten parcels without a finish bonus', () => {
    game.start({ daily: true });
    const run = game.run;
    run.time = 0.001;
    game.player.invuln = Infinity;
    game.update(1 / 60);
    assert.ok(game.over);
    assert.equal(run.parcels, 0);
    assert.equal(run.finishSeconds, null);
    assert.match(game.results.dom.title.textContent, /Time's up/);
    assert.doesNotMatch(game.results.dom.result.innerHTML, /s left:/);
    assert.equal(game.progress.dailyBest(run.date), run.score);
  });

  it('identical daily routes and flight times give identical final scores', () => {
    const fly = () => {
      game.start({ daily: true });
      const run = game.run, route = [];
      for (let i = 0; i < DAILY_PARCELS; i++) {
        route.push(`${run.from.name}>${run.dest.name}:${run.cargo.id}`);
        run.elapsed = 8;
        run.time = 40;
        run.deliver();
      }
      const result = { route, score: run.score, bonus: run.finishSeconds * 10 };
      assert.ok(game.over);
      game.stop();
      return result;
    };
    assert.deepEqual(fly(), fly());
  });

  it('a zero-duration paused frame does not consume the daily clock or finish a parcel', () => {
    game.start({ daily: true });
    const run = game.run, time = run.time, elapsed = run.elapsed;
    game.player.up.copy(run.dest.c);
    game.player.alt = planet.surfR(run.dest.c) + 1;
    game.update(0);
    assert.equal(run.time, time);
    assert.equal(run.elapsed, elapsed);
    assert.equal(run.parcels, 0);
    assert.ok(!game.over);
    assert.equal(DailyRun.briefing().goal, 'Ten parcels on today’s route, the same for everyone, in the stock plane. Your best score today counts.');
  });
});
