import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { CRAFTS, craftStats } from '../js/game/Crafts.js';
import { Progress, BASE_STATS, UPGRADES, SKINS, TRAILS } from '../js/game/Progress.js';
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

  it('keeps the first six paint jobs exactly and totals the expanded cosmetics', () => {
    assert.deepEqual(SKINS.slice(0, 6), [
      { id: 'classic', name: 'Classic', body: '#ffd23f', trim: '#ff4d4d', cost: 0 },
      { id: 'fire', name: 'Fireball', body: '#ff4d4d', trim: '#ffd23f', cost: 250 },
      { id: 'sky', name: 'Sky Blue', body: '#9fd8ff', trim: '#3f6fff', cost: 250 },
      { id: 'mint', name: 'Mint', body: '#a8f0cf', trim: '#2ee59d', cost: 400 },
      { id: 'midnight', name: 'Midnight', body: '#4a4f9e', trim: '#ff5fa2', cost: 600 },
      { id: 'gold', name: 'Golden Ace', body: '#ffcf33', trim: '#1b1530', trophy: 'ace', trophyName: 'Sky Ace' },
    ]);
    assert.equal(SKINS.length, 12);
    assert.equal(SKINS.reduce((n, skin) => n + (skin.cost || 0), 0), 5100);
    assert.equal(TRAILS.length, 6);
    assert.equal(TRAILS.reduce((n, trail) => n + trail.cost, 0), 3900);
  });

  it('buys a trail once, switches freely, reloads it and resets to Classic', () => {
    const p = game.progress;
    assert.equal(p.trail, 'classic');
    assert.deepEqual([...p.trails], ['classic']);
    assert.equal(p.chooseTrail('snow'), false);
    p.addCoins(1000);
    assert.equal(p.chooseTrail('snow'), true);
    assert.equal(p.coins, 500);
    assert.equal(p.chooseTrail('classic'), true);
    assert.equal(p.chooseTrail('snow'), true);
    assert.equal(p.coins, 500);
    const again = new Progress();
    assert.equal(again.trail, 'snow');
    assert.deepEqual([...again.trails], ['classic', 'snow']);
    again.reset();
    assert.equal(again.trail, 'classic');
    assert.deepEqual([...again.trails], ['classic']);
  });

  it('counts the full inventory with the explicit rank, while B2 owns the old Home call', () => {
    const p = game.progress;
    p.coins = 50000;
    assert.equal(p.affordable(new Set(), 1), 21);
    assert.equal(p.affordable(new Set(), 4), 22);
    assert.equal(p.affordable(new Set(), 30), 26);
    p.chooseCraft('swift', 4);
    p.chooseTrail('snow');
    p.chooseSkin('sunset', new Set());
    assert.equal(p.affordable(new Set(), 30), 23);
    for (const u of UPGRADES) p.levels[u.id] = 5;
    assert.equal(p.affordable(new Set(), 30), 17);
  });

  it('uses the chosen trail on a plane and keeps the daily on the Classic trail', () => {
    game.progress.trail = 'candy';
    game.start();
    assert.equal(game.player.trail.life, 1.8);
    assert.equal(game.player.trail.mesh.material.color.getHexString(), 'ff8fcf');
    game.stop();
    game.start({ daily: true });
    assert.equal(game.player.trail.life, 1.6);
    assert.equal(game.player.trail.mesh.material.color.getHexString(), 'fff4c2');
  });

});
