import { describe, it, before, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { Rival, REX, liveryFor } from '../js/game/Rival.js';
import { xpForRank } from '../js/game/Ranks.js';
import { CARGO } from '../js/game/Cargo.js';
import { MISSIONS } from '../js/game/Missions.js';
import { cardStat } from '../js/game/HomeCards.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
describe("Rex's career ladder", () => {
  let app, planet, game;
  const rivals = [];
  before(async () => {
    localStorage.clear();
    ({ app, planet } = await makeWorld(MISSIONS[0].planet)); game = app.game;
  });
  beforeEach(() => { game.stop(); game.progress.reset(); game.career.reset(); });
  afterEach(() => { rivals.splice(0).forEach((r) => r.dispose()); game.stop(); });
  after(() => planet.dispose());
  const rival = (rank) => {
    const from = planet.cities.sites[0];
    const r = new Rival(planet, { from, heading: from.u, rank, tag: game.hud.dom.rival, toScreen: () => null });
    rivals.push(r); return r;
  };

  it('chooses the latest livery threshold, including the first and final ranks', () => {
    assert.deepEqual([1, 4, 5, 24, 25, 30].map((r) => liveryFor(r).name),
      ['Purple Menace', 'Purple Menace', 'Night Shift', 'Chrome', 'Gold Rex', 'Gold Rex']);
    assert.equal(rival(30).plane.paint.body, '#ffc93c');
  });

  it('keeps rank 1 speed and the level cap, adding the tuned 0.0725 at rank 30', () => {
    const a = rival(1), b = rival(30);
    near(a.plane.stats.speed, 0.8);
    near(b.plane.stats.speed, 0.8725);
    a.setLevel(10); b.setLevel(10);
    near(a.plane.stats.speed, 1.1); near(b.plane.stats.speed, 1.1725);
    a.setLevel(99); near(a.plane.stats.speed, 1.1);
  });

  it('boosts only from rank 10, loaded, in range and out of rest', () => {
    const from = planet.cities.sites[0], dest = planet.cities.sites[1];
    for (const [rank, loaded, resting, close, boosted] of [
      [9, true, false, true, false], [10, false, false, true, false],
      [10, true, true, true, false], [10, true, false, false, false], [10, true, false, true, true],
    ]) {
      const r = rival(rank), at = close ? dest : from;
      r.plane.place(at.c, at.u); r.plane.alt = planet.groundR(at.c) + 2;
      r.loaded = loaded; r.rest = resting ? 1 : 0; r.restAt = dest.c;
      r.update(1 / 60, dest, CARGO.standard);
      assert.equal(r.boosting, boosted);
      near(r.plane.stats.speed, r.baseSpeed * (boosted ? REX.boost : 1));
    }
  });

  it('missions and the daily use rank 1 speed in the real pilot-rank livery', () => {
    game.career.addXp(xpForRank(12));
    for (const opts of [{ daily: true }, { mission: MISSIONS[0] }]) {
      game.start(opts); game.run.spawnRival();
      const r = game.run.rival;
      r.setLevel(0);
      assert.equal(r.rank, 1);
      near(r.plane.stats.speed, 0.8);
      assert.equal(r.plane.paint.body, '#e63946');
      game.stop();
    }
  });

  it('counts only intact deliveries with Rex flying, plus his steals, and saves the score', () => {
    game.start();
    game.run.deliver();
    assert.deepEqual(game.career.rex, { you: 0, rex: 0 });
    game.run.deliver();
    assert.deepEqual(game.career.rex, { you: 1, rex: 0 });
    game.run.broken = true; game.run.deliver();
    assert.deepEqual(game.career.rex, { you: 1, rex: 0 });
    game.run.steal();
    assert.deepEqual(game.career.rex, { you: 1, rex: 1 });
    assert.deepEqual(JSON.parse(localStorage.getItem('planetpop.career')).rex, { you: 1, rex: 1 });
    assert.match(cardStat('courier', game.progress, game.career), /You 1 · Rex 1/);
  });

  it('announces new paint and the boost lesson once as the rank boundaries are passed', () => {
    game.career.addXp(xpForRank(10));
    const news = game.career.news().join('\n');
    assert.match(news, /Rex has new paint: Night Shift/);
    assert.match(news, /Rex has new paint: Red Alert/);
    assert.match(news, /Rex has learned to boost/);
    game.career.addXp(1);
    assert.deepEqual(game.career.news(), []);
  });
});
