import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp, makeWorld } from './helpers/world.mjs';
import { Career, STREAK_COINS, giftCoins } from '../js/game/Career.js';
import { XP, rankReward } from '../js/game/Ranks.js';
import { makeSaveCode, readSaveCode, applySave } from '../js/core/SaveCode.js';
import { MISSIONS } from '../js/game/Missions.js';

beforeEach(() => localStorage.clear());
const setup = () => {
  let date = '2026-10-01';
  const app = makeApp({}), p = app.game.progress, c = new Career(app, p, () => date);
  app.game.career = c;
  return { app, p, c, day: (n) => { date = `2026-10-${String(n).padStart(2, '0')}`; return date; } };
};

test('eight consecutive UTC days pay the week and restart at twenty coins without reward XP', () => {
  const { c, p, day } = setup(), paid = [];
  for (let n = 1; n <= 8; n++) {
    const date = day(n); paid.push(c.dailyFlown(date));
    assert.equal(c.dailyFlown(date), 0);
    assert.equal(c.streakDays, n);
  }
  assert.deepEqual(paid, [...STREAK_COINS, 20]);
  assert.equal(c.data.streak.days, 8);
  assert.equal(c.xp, 7 * XP.streak + XP.streakWeek);
  assert.equal(p.coins, paid.reduce((a, b) => a + b, 0) + rankReward(2) + rankReward(3));
  assert.match(c.news().join('\n'), /Day 7 in a row: \+150/);
});

test('one miss is forgiven, another within the week resets, and a miss eight days later is forgiven', () => {
  const { c, day } = setup();
  c.dailyFlown(day(1)); c.dailyFlown(day(3));
  assert.equal(c.data.streak.days, 2); assert.equal(c.data.streak.forgiven, '2026-10-03');
  assert.match(c.news().join('\n'), /one missed day forgiven/);
  c.dailyFlown(day(5));
  assert.equal(c.data.streak.days, 1); assert.equal(c.data.streak.forgiven, '2026-10-03');
  for (const n of [6, 7, 8, 9, 11]) c.dailyFlown(day(n));
  assert.equal(c.data.streak.days, 6); assert.equal(c.data.streak.forgiven, '2026-10-11');
  const xp = c.xp;
  assert.equal(c.dailyFlown('2026-10-09'), 0); assert.equal(c.xp, xp);
});

test('streak visibility allows an available forgiven gap, and reading never mutates the save', () => {
  const { c, day } = setup();
  c.dailyFlown(day(1));
  day(3); const saved = localStorage.getItem('planetpop.career');
  assert.equal(c.streakDays, 1); assert.equal(c.streakNext, 25);
  assert.equal(localStorage.getItem('planetpop.career'), saved);
  day(4); assert.equal(c.streakDays, 0); assert.equal(c.streakNext, 20);
  c.dailyFlown(day(4)); c.dailyFlown(day(6));
  day(8); assert.equal(c.streakDays, 0);
});

test('a real daily needs a delivered parcel and uses its own date, counting abandoned runs too', async () => {
  const { app, planet } = await makeWorld(MISSIONS[0].planet), g = app.game;
  try {
    g.career.date = () => '2026-10-02';
    g.start({ daily: true }); g.run.date = '2026-10-01'; g.stop();
    assert.equal(g.career.data.streak.days, 0);
    g.start({ daily: true }); g.run.date = '2026-10-01'; g.run.deliver();
    const run = g.run; g.stop(); g.career.runEnded(run);
    assert.equal(g.career.data.streak.days, 1); assert.equal(g.career.data.streak.last, '2026-10-01');
    g.start({ daily: true }); g.run.date = '2026-10-01'; g.run.deliver(); g.stop();
    assert.equal(g.career.data.streak.days, 1);
    g.start({ daily: true }); g.run.date = '2026-10-02'; g.run.deliver(); g.stop();
    assert.equal(g.career.data.streak.days, 2);
  } finally { g.stop(); planet.dispose(); }
});

test('gift is seeded by UTC date, opens once, adds no XP, and is the same for every pilot', () => {
  const { c, p, day } = setup();
  assert.equal(c.giftReady, true);
  const paid = c.openGift();
  assert.ok([20, 30, 40, 60].includes(paid)); assert.equal(paid, giftCoins('2026-10-01'));
  assert.equal(p.coins, paid); assert.equal(c.xp, 0);
  assert.equal(c.giftReady, false); assert.equal(c.openGift(), 0);
  day(2); assert.equal(c.giftReady, true); assert.equal(c.openGift(), giftCoins('2026-10-02'));
  assert.equal(c.xp, 0);
  localStorage.clear(); assert.equal(setup().c.openGift(), paid);
});

test('gift and streak receipts survive reload, a save code and another time in the same UTC day', async () => {
  const { app, c, p } = setup();
  c.dailyFlown('2026-10-01'); c.openGift();
  const coins = p.coins, xp = c.xp, code = await makeSaveCode();
  localStorage.clear(); applySave(await readSaveCode(code));
  const reloaded = setup();
  assert.equal(reloaded.c.openGift(), 0); assert.equal(reloaded.c.dailyFlown('2026-10-01'), 0);
  assert.equal(reloaded.p.coins, coins); assert.equal(reloaded.c.xp, xp);
  const later = new Career(app, reloaded.p, () => new Date('2026-10-01T23:59:59Z').toISOString().slice(0, 10));
  assert.equal(later.openGift(), 0); assert.equal(later.dailyFlown('2026-10-01'), 0);
  assert.equal(reloaded.p.coins, coins); assert.equal(later.xp, xp);
});

test('Today displays the weekly dots, gift amount and Home reminders from its cached controls', () => {
  const { app, c } = setup(), g = app.game;
  c.dailyFlown('2026-10-01'); g.today.show();
  assert.match(g.today.dom.streak.innerHTML, /1 day/);
  assert.match(g.today.dom.streak.innerHTML, /flown today/);
  assert.match(g.today.dom.gift.textContent, /Open today's gift/);
  g.today.gift();
  assert.equal(g.today.dom.gift.disabled, true);
  assert.match(g.today.dom.gift.textContent, /Today's gift: \+\d+ 🪙/);
  g.today.close();
  assert.match(g.home.dom.today.textContent, /🔥 1/);
  assert.doesNotMatch(g.home.dom.today.textContent, /Gift!/);
  g.home.hide();
});
