import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { CRAFTS, craftStats } from '../js/game/Crafts.js';
import { Progress, BASE_STATS, UPGRADES } from '../js/game/Progress.js';
import { pilotRank } from '../js/game/Gates.js';
import { mulberry32 } from '../js/core/Noise.js';
import { CARGO } from '../js/game/Cargo.js';

const fixture = { coins: 900, best: 2400, levels: { engine: 4, armour: 3 }, owned: ['classic', 'sky'], skin: 'sky', daily: null,
  missions: ['first', 'rush'], bests: {}, lesson: true, stars: { first: 3, rush: 2 } };

describe('hangar craft', () => {
  let app, planet, game;
  before(async () => { localStorage.clear(); ({ app, planet } = await makeWorld({ seed: 20261014, land: .45, cities: 5 })); game = app.game; });
  beforeEach(() => { game.stop(); localStorage.clear(); game.progress.reset(); });
  after(() => { game.stop(); planet.dispose(); });

  it('applies each craft to a copy, keeping the stock stats intact and armour positive', () => {
    const mods = [{}, { speed: 1.06, armour: 1.3 }, { turn: 1.35, drain: 1.3 }, { hauler: true, speed: .94 }, { armour: .6, turn: .85 }, { drain: .5, speed: .93 }];
    CRAFTS.forEach((c, i) => {
      const expected = { ...BASE_STATS };
      for (const [key, value] of Object.entries(mods[i])) expected[key] = key === 'hauler' ? value : BASE_STATS[key] * value;
      assert.deepEqual(craftStats(BASE_STATS, c), expected);
      assert.notEqual(craftStats(BASE_STATS, c), BASE_STATS);
      assert.equal(craftStats({ ...BASE_STATS, armour: .01 }, c).armour, .1);
    });
    assert.equal(BASE_STATS.speed, 1);
    assert.equal(CRAFTS.reduce((n, c) => n + c.cost, 0), 36000);
  });

  it('the Mule carries heavy cargo at full speed and climb, while Classic gives both up', () => {
    for (const id of ['classic', 'mule']) {
      game.progress.craft = id;
      game.start();
      game.player.setCargo(CARGO.heavy);
      assert.equal(game.player.cargoSpeed, id === 'mule' ? 1 : .8);
      assert.equal(game.player.cargoClimb, id === 'mule' ? 1 : .7);
      game.stop();
    }
  });

  it('rank and wallet gate a purchase once; switching and reload keep ownership', () => {
    const p = game.progress;
    p.addCoins(8000);
    assert.equal(p.chooseCraft('swift', 3), false);
    assert.equal(p.coins, 8000);
    assert.equal(p.chooseCraft('swift', 4), true);
    assert.equal(p.coins, 5000);
    assert.equal(p.craftState(CRAFTS[1], 4), 'flying');
    assert.equal(p.chooseCraft('classic', 4), true);
    assert.equal(p.craftState(CRAFTS[1], 4), 'owned');
    assert.equal(p.chooseCraft('swift', 4), true);
    assert.equal(p.coins, 5000);
    assert.equal(p.chooseCraft('comet', 30), false);
    const again = new Progress();
    assert.equal(again.craft, 'swift');
    assert.deepEqual([...again.crafts], ['classic', 'swift']);
    again.reset();
    assert.equal(again.craft, 'classic');
    assert.deepEqual([...again.crafts], ['classic']);
  });

  it('the daily stays stock Classic with max upgrades and Comet selected', () => {
    game.progress.craft = 'comet';
    game.progress.levels = Object.fromEntries(UPGRADES.map((u) => [u.id, 5]));
    game.progress.coins = 10000;
    game.start({ daily: true });
    assert.equal(game.player.stats, BASE_STATS);
    assert.equal(game.run.craft.id, 'classic');
    assert.equal(game.player.group.children[0].geometry.parameters.radius, .08);
  });

  it('the exact v0.19.0 fixture loads as Classic with every old field preserved', () => {
    localStorage.setItem('planetpop.courier', JSON.stringify(fixture));
    const p = new Progress();
    assert.equal(p.craft, 'classic');
    assert.deepEqual([...p.crafts], ['classic']);
    p.save();
    const saved = JSON.parse(localStorage.getItem('planetpop.courier'));
    for (const [key, value] of Object.entries(fixture)) assert.deepEqual(saved[key], value, key);
    assert.deepEqual(Object.keys(saved).sort(), Object.keys(fixture).sort());
  });

  it('reads career only through the rank adapter', () => {
    assert.equal(pilotRank(), 30);
    assert.equal(pilotRank(game), 30);
    game.career = { rank: 7 };
    assert.equal(pilotRank(game), 7);
    delete game.career;
  });

  it('the ace in a fully upgraded Swift still runs out of time before eight minutes', (t) => {
    game.progress.craft = 'swift';
    game.progress.levels = Object.fromEntries(UPGRADES.map((u) => [u.id, 5]));
    const random = Math.random;
    Math.random = mulberry32(7);
    try {
      game.start();
      let elapsed = 0;
      const dt = 1 / 60;
      while (!game.over && elapsed < 480) {
        const pl = game.player;
        pl.steerToward(game.run.destPoint(), 1.5);
        pl.input.boost = pl.up.angleTo(game.run.destPoint()) > .3 && pl.boost > .3;
        pl.invuln = Infinity;
        app.simTime += dt; app.sky.update(dt); planet.update(dt, app.simTime); game.update(dt);
        elapsed += dt;
      }
      t.diagnostic(`Max Swift ace: ${elapsed.toFixed(2)}s, ${game.run.deliveries} deliveries`);
      assert.ok(game.over && elapsed < 480, `still flying at ${elapsed.toFixed(2)}s`);
    } finally { Math.random = random; }
  });
});
