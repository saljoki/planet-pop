import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { rewardCoins } from './helpers/rewards.mjs';
import { coinsFor, RING_COINS, UFO_COINS, RACE_COINS } from '../js/game/Economy.js';
import { CARGO } from '../js/game/Cargo.js';
import { MISSIONS } from '../js/game/Missions.js';

describe('the scored-run economy', () => {
  let app, planet, game;
  before(async () => {
    localStorage.clear();
    ({ app, planet } = await makeWorld({ seed: 20261014, land: 0.45, cities: 5 }));
    game = app.game;
  });
  beforeEach(() => game.stop());
  after(() => { game.stop(); planet.dispose(); });

  it('rounds points into coins at the shared rate', () => {
    assert.equal(coinsFor(250), 10);
    assert.equal(coinsFor(0), 0);
    assert.equal(coinsFor(12), 0);
  });

  it('a 400-point delivery pays 16, a ring pays 2, and the UFO pays 12', () => {
    game.start();
    const run = game.run;
    run.cargo = CARGO.standard;
    run.combo = 3;
    run.elapsed = run.par;
    run.deliver();
    assert.equal(run.score, 400);
    assert.equal(run.coins, 16);
    run.ring(game.props.rings[0]);
    assert.equal(run.coins, 16 + RING_COINS);
    run.caughtUfo();
    assert.equal(run.coins, 30);
    assert.equal(UFO_COINS, 12);
  });

  it('taxi fares use the shared rate and races pay 60 or 12', () => {
    game.start({ road: 'taxi' });
    const taxi = game.run;
    taxi.pickUp();
    taxi.fare.elapsed = taxi.fare.par;
    taxi.dropOff();
    assert.equal(taxi.score, 200);
    assert.equal(taxi.coins, 8);
    for (const won of [true, false]) {
      game.stop();
      game.start({ road: 'race' });
      const before = game.progress.coins;
      const rewards = rewardCoins(game.progress, () => game.run.over(won));
      assert.equal(game.progress.coins - before, RACE_COINS[won ? 'win' : 'lose'] + rewards);
    }
  });

  it('a first mission completion still pays its full reward once', () => {
    const p = game.progress, def = MISSIONS[0];
    assert.equal(p.completeMission(def), def.reward);
    assert.equal(p.completeMission(def), 0);
  });
});
