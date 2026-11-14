import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp } from './helpers/world.mjs';
import { HOME_CARDS, cardStat, nextUp } from '../js/game/HomeCards.js';
import { Progress, UPGRADES, SKINS } from '../js/game/Progress.js';
import { MISSIONS } from '../js/game/Missions.js';
import { todayKey, dailyPlace } from '../js/game/Daily.js';

beforeEach(() => localStorage.clear());

test('next-up offers First Flight, the daily, the first unfinished unlocked mission, then a courier run', () => {
  const p = new Progress();
  assert.equal(nextUp(p).mission, MISSIONS[0]);
  p.completeMission(MISSIONS[0]);
  assert.equal(nextUp(p).card, 'daily');
  p.recordDaily(todayKey(), 0);
  const next = nextUp(p);
  assert.equal(next.mission, MISSIONS[1]);
  assert.equal(next.title, MISSIONS[1].name);
  assert.equal(next.text, MISSIONS[1].brief);
  for (const m of MISSIONS) p.completeMission(m);
  assert.equal(nextUp(p).card, 'courier');
});

test('card stats describe a fresh pilot and remember scores, today and completed missions', () => {
  const p = new Progress();
  assert.deepEqual(HOME_CARDS.map((c) => c.id), ['courier', 'daily', 'missions', 'space', 'roads', 'free']);
  assert.equal(cardStat('courier', p), 'Not flown yet');
  assert.equal(cardStat('daily', p), `${dailyPlace()} · not flown today`);
  assert.equal(cardStat('missions', p), '⭐ 0 / 183');
  for (const id of ['space', 'roads', 'free']) assert.equal(cardStat(id, p), '');
  p.recordScore(1240);
  p.recordDaily(todayKey(), 938);
  for (const m of MISSIONS.slice(0, 3)) p.completeMission(m);
  assert.equal(cardStat('courier', p), '⭐ Best 1,240');
  assert.equal(cardStat('daily', p), `${dailyPlace()} · ⭐ 938 today`);
  assert.equal(cardStat('missions', p), '⭐ 3 / 183');
  p.daily.date = '2000-01-01';
  assert.equal(cardStat('daily', p), `${dailyPlace()} · not flown today`, 'yesterday is not today');
});

test('all six Home cards hide Home before launching or opening the right place', () => {
  const app = makeApp({}), game = app.game, home = game.home, called = [];
  const note = (name, opts) => { assert.equal(home.open, false, `${name} opened before Home closed`); called.push([name, opts]); };
  game.launch = (opts) => note('launch', opts);
  game.startDaily = () => note('daily');
  game.board.show = () => note('missions');
  game.roads.show = () => note('roads');
  app.spaceCourier = { openBoard: () => note('space') };
  for (const id of HOME_CARDS.map((c) => c.id)) { home.show(); home.pick(id); }
  assert.deepEqual(called, [
    ['launch', undefined], ['daily', undefined], ['missions', undefined], ['space', undefined],
    ['roads', undefined], ['launch', { free: true }],
  ]);
  home.show();
  home.pick('unknown');
  assert.equal(home.open, true, 'a click outside the cards should do nothing');
  home.hide();
});

test('Home next takes the suggested mission or card, and active runs do not open Home', () => {
  const app = makeApp({}), game = app.game, home = game.home;
  let mission, daily = false;
  game.startMission = (m) => { mission = m; assert.equal(home.open, false); };
  game.startDaily = () => { daily = true; assert.equal(home.open, false); };
  game.openHome();
  home.next();
  assert.equal(mission, MISSIONS[0]);
  game.progress.completeMission(MISSIONS[0]);
  home.show();
  home.next();
  assert.equal(daily, true);
  game.active = true;
  game.openHome();
  assert.equal(home.open, false);
  game.active = false;
});

test('affordable counts each next upgrade and unowned paint job, respecting price and trophies', () => {
  const p = new Progress();
  assert.equal(p.affordable(), 0);
  p.coins = 150;
  assert.equal(p.affordable(), 3, 'engine, wings and tank');
  p.coins = 5000;
  assert.equal(p.affordable(), 10, 'six next upgrades and four paint jobs');
  assert.equal(p.affordable(new Set(['ace'])), 10, 'earned paint is not something to buy');
  for (const u of UPGRADES) p.levels[u.id] = u.costs.length;
  assert.equal(p.affordable(), 4, 'maxed upgrades cannot be bought');
  p.owned = new Set(SKINS.filter((s) => !s.trophy).map((s) => s.id));
  assert.equal(p.affordable(), 0, 'owned paint cannot be bought again');
});

test('Home renders from cached elements and the hangar only has upgrades and paint', () => {
  const app = makeApp({}), game = app.game, home = game.home;
  app.settings.setPlayerName('Ata');
  game.progress.coins = 150;
  home.show();
  assert.equal(home.dom.pilotText.textContent, '🎖️ 1 · Cadet · Ata');
  assert.equal(home.dom.coins.textContent, '🪙 150');
  assert.equal(home.dom.hangar.textContent, '🛠️ Hangar · 3 to buy');
  assert.equal(home.dom.trophies.textContent, `🏆 0 / ${app.achievements.list().length}`);
  assert.equal((home.dom.cards.innerHTML.match(/data-card=/g) || []).length, 6);
  assert.match(home.dom.next.innerHTML, /First Flight/);
  assert.equal(home.trophiesOpen, false);
  home.trophies();
  assert.equal(home.trophiesOpen, true);
  assert.equal(home.open, true, 'Home stays behind the trophy list');
  home.closeTrophies();
  assert.equal(home.trophiesOpen, false);
  assert.equal(home.open, true);
  assert.doesNotMatch(game.hangar.el.innerHTML, /hGo|hDailyNote|hMissions|hDaily|hFree|hRoads|hSpace/);
  home.hangar();
  assert.equal(home.open, false);
  assert.equal(game.hangar.open, true);
  game.hangar.close();
  assert.equal(game.hangar.open, false);
  assert.equal(home.open, true, 'closing the hangar returns Home');
  home.hide();
});
