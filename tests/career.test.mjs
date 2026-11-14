import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, makeWorld } from './helpers/world.mjs';
import { RANKS, MAX_RANK, XP, xpForRank, rankFor, rankReward } from '../js/game/Ranks.js';
import { Career } from '../js/game/Career.js';
import { Gamepad } from '../js/game/input/Gamepad.js';
import { MISSIONS } from '../js/game/Missions.js';
import { makeSaveCode, readSaveCode, applySave } from '../js/core/SaveCode.js';

const legacy = { coins: 900, best: 2400, levels: { engine: 2 }, owned: ['classic'], skin: 'classic', daily: null,
  missions: ['first', 'rush', 'flag', 'storm'], bests: {}, lesson: true, stars: { first: 3, rush: 2 } };
beforeEach(() => localStorage.clear());

test('all thirty rank boundaries agree, including one XP either side', () => {
  assert.equal(RANKS.length, MAX_RANK);
  assert.deepEqual([1, 2, 3, 4, 5, 30].map(xpForRank), [0, 300, 800, 1500, 2400, 89900]);
  for (let r = 1; r <= MAX_RANK; r++) {
    assert.equal(rankFor(xpForRank(r)), r);
    assert.equal(rankFor(xpForRank(r) - 1), Math.max(1, r - 1));
    assert.equal(rankFor(xpForRank(r) + 1), r);
  }
});

test('rank rewards pay every crossed rank, without earning XP from the payout', () => {
  const { career: c, progress: p } = makeApp({}).game;
  assert.equal(c.addXp(300), 1);
  assert.equal(c.rank, 2);
  assert.equal(c.xp, 300);
  assert.equal(p.coins, 100);
  assert.equal(c.news().length, 1);
  assert.deepEqual(c.toNext, { have: 0, need: 500 });
  assert.equal(c.news().length, 0);
  c.reset(); p.reset();
  assert.equal(c.addXp(1500), 3);
  assert.equal(p.coins, [2, 3, 4].reduce((n, r) => n + rankReward(r), 0));
  assert.equal(c.news().length, 3);
  c.addXp(xpForRank(30));
  assert.equal(c.rank, 30);
  assert.equal(c.toNext, null);
});

test('earned coins give XP and reward coins do not', () => {
  const { career: c, progress: p } = makeApp({}).game;
  p.addCoins(85);
  assert.equal(c.xp, 85);
  p.addCoins(500, false);
  assert.equal(c.xp, 85);
  c.mark();
  p.addCoins(15);
  const run = {};
  c.runEnded(run); c.runEnded(run);
  assert.deepEqual(c.news(), ['🎖️ +15 XP']);
});

test('the v0.19 fixture starts at 700 XP and keeps everything except the earned rank back pay unchanged', () => {
  localStorage.setItem('planetpop.courier', JSON.stringify(legacy));
  const app = makeApp({}), { career: c, progress: p } = app.game;
  assert.equal(c.xp, 700);
  assert.equal(c.rank, 2);
  assert.equal(p.coins, 1000);
  const saved = JSON.parse(localStorage.getItem('planetpop.courier'));
  assert.deepEqual({ ...saved, coins: 900 }, legacy);
  assert.equal(c.news().length, 1);
  assert.equal(new Career(app, p).xp, 700);
  assert.equal(p.coins, 1000);
});

test('the career travels in a save code and survives a reload', async () => {
  const app = makeApp({}), c = app.game.career;
  c.addXp(320);
  const code = await makeSaveCode();
  localStorage.clear();
  applySave(await readSaveCode(code));
  const loaded = makeApp({}).game;
  assert.equal(loaded.career.xp, 320);
  assert.equal(loaded.career.rank, 2);
  assert.equal(loaded.progress.coins, 100);
});

test('reset in Options returns the pilot to rank 1 and 0 XP', () => {
  const game = makeApp({}).game;
  game.career.addXp(3200);
  game.options.reset(); game.options.reset();
  assert.equal(game.career.rank, 1);
  assert.equal(game.career.xp, 0);
  assert.equal(game.progress.coins, 0);
});

test('a first mission pays reward XP and all its new stars; a replay pays neither twice', async () => {
  const { app, planet } = await makeWorld(MISSIONS[0].planet), game = app.game, def = MISSIONS[0];
  try {
    game.start({ mission: def });
    game.run.tally.deliveries = def.goal.target;
    game.run.endMission('done');
    assert.equal(game.career.xp, def.reward + 3 * XP.star);
    assert.match(game.results.dom.result.innerHTML, /XP/);
    const before = game.career.xp;
    game.stop();
    game.start({ mission: def });
    game.run.tally.deliveries = def.goal.target;
    game.run.endMission('done');
    assert.equal(game.career.xp, before);
  } finally { game.stop(); planet.dispose(); }
});

test('Pilot closes to Home and cached elements show the rank, XP and next three rewards', () => {
  const game = makeApp({}).game;
  game.career.addXp(1820);
  game.home.show(); game.home.pilot();
  assert.equal(game.home.open, false);
  assert.equal(game.pilot.open, true);
  assert.equal(game.pilot.dom.rank.textContent, '🎖️ Rank 4 · Senior Courier');
  assert.equal(game.pilot.dom.xp.textContent, '320 / 900 XP to rank 5');
  assert.equal((game.pilot.dom.next.innerHTML.match(/<li>/g) || []).length, 3);
  game.pilot.escape();
  assert.equal(game.home.open, true);
  game.home.hide();
});

test('coins banked by a live courier run earn the same XP', async () => {
  const { app, planet } = await makeWorld(MISSIONS[0].planet), g = app.game;
  try {
    g.start();
    const before = g.career.xp;
    g.run.earn(85);
    assert.equal(g.career.xp - before, g.run.coins);
    g.stop();
    assert.match(g.career.news().join(' '), /\+85 XP/);
  } finally { g.stop(); planet.dispose(); }
});

test('controller B closes the pilot card back to Home', () => {
  const app = makeApp({}), pad = new Gamepad(app), saved = navigator.getGamepads;
  app.game.pilot.show();
  navigator.getGamepads = () => [{ connected: true, axes: [], buttons: [{}, { pressed: true }] }];
  try {
    pad.update();
    assert.equal(app.game.pilot.open, false);
    assert.equal(app.game.home.open, true);
  } finally { navigator.getGamepads = saved; app.game.home.hide(); }
});

test('a new trophy pays once across repeats, reloads, save codes and a progress reset', async () => {
  let app = makeApp({});
  const messages = [];
  app.hud.toast = (text) => messages.push(text);
  app.achievements.unlock('courier');
  assert.match(messages.at(-1), /\+100 🪙/);
  assert.equal(app.game.progress.coins, 100);
  assert.equal(app.game.career.xp, 200);
  app.achievements.unlock('courier');
  assert.equal(app.game.progress.coins, 100);
  const code = await makeSaveCode();
  localStorage.clear(); applySave(await readSaveCode(code));
  app = makeApp({});
  assert.equal(app.game.progress.coins, 100);
  assert.equal(app.game.career.xp, 200);
  app.game.options.reset(); app.game.options.reset();
  app = makeApp({});
  app.achievements.unlock('courier');
  assert.equal(app.game.progress.coins, 0);
  assert.equal(app.game.career.xp, 0);
  assert.equal(app.game.career.trophy('unknown'), false);
});

test('legacy stars and three trophies pay 550 back pay in one welcome line, only once', () => {
  localStorage.setItem('planetpop.courier', JSON.stringify(legacy));
  localStorage.setItem('planetpop.trophies', JSON.stringify(['courier', 'combo', 'mechanic']));
  let app = makeApp({});
  assert.equal(app.game.career.xp, 1300);
  assert.equal(app.game.career.rank, 3);
  assert.equal(app.game.progress.coins, 1450);
  assert.equal(app.game.career.news().length, 1);
  app = makeApp({});
  assert.equal(app.game.progress.coins, 1450);
  assert.equal(app.game.career.xp, 1300);
  assert.deepEqual(app.game.career.news(), []);
});
