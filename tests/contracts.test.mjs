import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, makeWorld } from './helpers/world.mjs';
import { Career } from '../js/game/Career.js';
import { CONTRACTS, tierFor, pickContracts, runCounts, crateCoins } from '../js/game/Contracts.js';
import { XP } from '../js/game/Ranks.js';
import { MISSIONS } from '../js/game/Missions.js';
import { makeSaveCode, readSaveCode, applySave } from '../js/core/SaveCode.js';
import { Gamepad } from '../js/game/input/Gamepad.js';

beforeEach(() => localStorage.clear());
const setup = (date = () => '2026-10-14') => {
  const app = makeApp({}), g = app.game;
  g.career = new Career(app, g.progress, date);
  return { app, g, c: g.career, p: g.progress };
};
const jobs = (c, ids, tier = 0) => { const d = c.today(); d.ids = ids; d.tier = tier; return d; };

test('three deterministic groups, eligibility, tiers and thirty dates without adjacent repeats', () => {
  assert.equal(CONTRACTS.length, 18);
  assert.deepEqual([1, 9, 10, 19, 20, 30].map(tierFor), [0, 0, 1, 1, 2, 2]);
  for (let tier = 0; tier < 3; tier++) {
    let last;
    for (let n = 0; n < 30; n++) {
      const date = new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10);
      const ids = pickContracts(date, tier, { stars: 0 });
      assert.deepEqual(ids, pickContracts(date, tier, { stars: 0 }));
      assert.equal(new Set(ids).size, 3);
      assert.deepEqual(ids.map((id) => CONTRACTS.find((c) => c.id === id).group), ['A', 'B', 'C']);
      assert.notDeepEqual(ids, last); last = ids;
      if (!tier) assert.ok(!ids.includes('route'));
      assert.ok(!pickContracts(date, tier, { stars: 183 }).includes('star'));
    }
  }
});

test('adding stats accumulate, best stats keep a run maximum, and each job pays once', () => {
  const { c, p } = setup();
  jobs(c, ['parcels', 'combo', 'taxi']);
  c.counts({ deliveries: 4, combo: 2, taxi: 1 });
  c.counts({ deliveries: 4, combo: 1, taxi: 1 });
  assert.equal(c.contracts[0].done, true);
  assert.equal(c.contracts[1].have, 2);
  assert.equal(c.contracts[2].have, 2);
  assert.equal(p.coins, 40); assert.equal(c.xp, XP.contract);
  c.counts({ deliveries: 100 });
  assert.equal(p.coins, 40); assert.equal(c.xp, XP.contract);
  c.count('combo', 3);
  assert.equal(c.contracts[1].done, true);
  assert.equal(c.xp, XP.contract * 2); // rank coins cannot feed XP
  assert.equal(c.news().filter((s) => s.includes('done!')).length, 2);
});

test('crate needs three jobs and its receipt survives reload, with a fresh UTC day clearing counts', () => {
  let date = '2026-10-14';
  const { app, c, p } = setup(() => date);
  jobs(c, ['parcels', 'combo', 'taxi']);
  assert.equal(c.openCrate(), 0);
  c.counts({ deliveries: 8, combo: 3, taxi: 3 });
  assert.equal(c.crateReady, true);
  assert.match(c.news().join('\n'), /All three done/);
  const before = c.xp, coins = p.coins;
  assert.equal(c.openCrate(), crateCoins(date));
  assert.equal(c.xp, before + XP.crate);
  assert.equal(p.coins, coins + crateCoins(date));
  assert.equal(c.openCrate(), 0);
  const reload = new Career(app, p, () => date);
  assert.equal(reload.crateReady, false); assert.equal(reload.openCrate(), 0);
  assert.equal(reload.contracts.filter((j) => j.done).length, 3);
  date = '2026-10-15';
  assert.deepEqual(reload.today().counts, {});
  assert.deepEqual(reload.today().done, []);
  assert.equal(reload.today().date, date);
  assert.equal(reload.today().crate, false);
});

test('the stored tier stays fixed as rank increases and plural text follows the target', () => {
  const { c } = setup();
  jobs(c, ['parcels', 'score', 'mission'], 2);
  assert.match(c.contracts[2].text, /2 missions/);
  c.addXp(300);
  assert.equal(c.today().tier, 2);
  c.today().ids[2] = 'star';
  assert.match(c.contracts[2].text, /2 new stars/);
  c.progress.recordStars('first', 2);
  assert.equal(c.contracts[2].done, true);
});

test('real runs supply courier, daily, won mission, taxi and race counts, including an abandonment', async () => {
  const { app, planet } = await makeWorld(MISSIONS[0].planet), g = app.game;
  try {
    g.start();
    g.run.deliver(); g.run.deliver();
    const run = g.run, income = run.coins;
    assert.equal(runCounts(run).deliveries, 2); assert.equal(runCounts(run).coins, income);
    assert.equal(runCounts(run).score, run.score);
    jobs(g.career, ['parcels', 'score', 'mission']);
    g.stop();
    assert.equal(g.career.today().counts.deliveries, 2);
    g.career.runEnded(run);
    assert.equal(g.career.today().counts.deliveries, 2);
    g.start({ daily: true });
    for (let i = 0; i < 10; i++) g.run.deliver();
    assert.equal(runCounts(g.run).daily, 1); assert.equal(runCounts(g.run).route, 1);
    assert.ok(!('score' in runCounts(g.run))); g.stop();
    g.start({ mission: MISSIONS[0] });
    assert.ok(!runCounts(g.run).mission);
    for (let i = 0; i < MISSIONS[0].goal.target; i++) g.run.deliver();
    g.run.endMission('done');
    assert.equal(runCounts(g.run).mission, 1);
    assert.ok(!('score' in runCounts(g.run))); g.stop();
    g.start({ road: 'taxi' });
    for (let i = 0; i < 3; i++) { g.run.pickUp(); g.run.dropOff(); }
    assert.equal(runCounts(g.run).taxi, 3); g.stop();
    g.start({ road: 'race' }); g.run.over(true);
    assert.equal(runCounts(g.run).race, 1); assert.equal(runCounts(g.run).coins, 60);
  } finally { g.stop(); planet.dispose(); }
});

test('Today opens from Home, caches and renders its controls, and controller B returns Home', () => {
  const { app, g, c } = setup();
  jobs(c, ['parcels', 'combo', 'taxi']);
  g.home.show(); g.home.today();
  assert.equal(g.home.open, false); assert.equal(g.today.open, true);
  assert.match(g.today.dom.contracts.innerHTML, /0 \/ 8/);
  assert.equal(g.today.dom.crate.hidden, true);
  const getPads = navigator.getGamepads;
  navigator.getGamepads = () => [{ connected: true, axes: [], buttons: [{}, { pressed: true }] }];
  try { new Gamepad(app).update(); } finally { navigator.getGamepads = getPads; }
  assert.equal(g.today.open, false); assert.equal(g.home.open, true);
  g.home.hide();
});

test('contract and crate receipts survive a save-code round trip with optional fields omitted', async () => {
  const { app, c, p } = setup();
  jobs(c, ['parcels', 'combo', 'taxi']);
  c.counts({ deliveries: 8, combo: 3, taxi: 3 });
  const paid = c.openCrate(), coins = p.coins;
  const code = await makeSaveCode();
  localStorage.clear(); applySave(await readSaveCode(code));
  const again = setup();
  assert.equal(again.p.coins, coins);
  assert.equal(again.c.openCrate(), 0);
  assert.equal(again.c.contracts.every((j) => j.done), true);
  again.c.counts({ deliveries: 8, combo: 3, taxi: 3 });
  assert.equal(again.p.coins, coins);
  assert.ok([100, 150, 250].includes(paid));
  localStorage.setItem('planetpop.career', JSON.stringify({ xp: 50, day: { date: '2026-10-14' } }));
  const optional = new Career(app, p, () => '2026-10-14');
  assert.equal(optional.contracts.length, 3);
  assert.deepEqual(optional.today().counts, {});
  assert.deepEqual(optional.data.rex, { you: 0, rex: 0 });
});
