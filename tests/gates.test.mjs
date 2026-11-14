import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp } from './helpers/world.mjs';
import { setRank } from './helpers/rank.mjs';
import { MISSIONS } from '../js/game/Missions.js';

beforeEach(() => localStorage.clear());

test("Home counts a craft only once the pilot's rank opens it", () => {
  const game = makeApp({}).game, home = game.home;
  game.progress.addCoins(3000, false);
  home.show();
  const before = Number(home.dom.hangar.textContent.match(/(\d+) to buy/)[1]);
  assert.equal(before, game.progress.affordable(game.app.achievements.done, 1));
  setRank(game, 4);
  home.render();
  assert.equal(home.dom.hangar.textContent, `🛠️ Hangar · ${before + 1} to buy`, 'the Bulldog joins at rank 4');
  setRank(game, 30);
  home.render();
  assert.equal(home.dom.hangar.textContent, `🛠️ Hangar · ${before + 1} to buy`, 'dearer craft are not affordable yet');
});

test('the pilot card names the next craft and supply slot a rank opens', () => {
  const game = makeApp({}).game, card = game.pilot;
  card.show();
  assert.equal(card.dom.gates.textContent, '🔓 Next to open: 🐶 Bulldog at rank 4 · supply slot 1 at rank 3');
  setRank(game, 4); card.render();
  assert.equal(card.dom.gates.textContent, '🔓 Next to open: 🐦 Hummingbird at rank 7 · supply slot 2 at rank 8');
  setRank(game, 13); card.render();
  assert.equal(card.dom.gates.textContent, '🔓 Next to open: ⚡ Swift at rank 14');
  setRank(game, 17); card.render();
  assert.equal(card.dom.gates.textContent, '🔓 Next to open: ☄️ Comet at rank 18');
  setRank(game, 18); card.render();
  assert.equal(card.dom.gates.textContent, '🔓 Every craft and supply slot is open');
});

test('a board reopened from a briefing still closes to Home', () => {
  const game = makeApp({}).game;
  game.briefing.show({ mission: MISSIONS[0] });
  game.briefing.back();
  assert.ok(game.board.open && !game.home.open);
  game.board.close();
  assert.ok(game.home.open && !game.board.open);
  game.home.hide();
  game.briefing.show({ road: 'van' });
  game.briefing.back();
  assert.ok(game.roads.open && !game.home.open);
  game.roads.close();
  assert.ok(game.home.open && !game.roads.open);
});

test('the hangar and the briefing read the same rank as the pilot card', () => {
  const game = makeApp({}).game;
  game.progress.addCoins(5000, false);
  game.hangar.show();
  assert.equal((game.hangar.dom.crafts.innerHTML.match(/class="craft-card locked"/g) || []).length, 5, 'rank 1 locks every craft');
  game.briefing.show({});
  assert.ok(game.briefing.dom.supplies.classList.contains('hidden'), 'no supply slot at rank 1');
  game.briefing.hide();
  setRank(game, 4);
  game.hangar.show();
  assert.match(game.hangar.dom.crafts.innerHTML, /data-craft="bulldog"[^>]*>🪙 3,000/);
  assert.equal((game.hangar.dom.crafts.innerHTML.match(/class="craft-card locked"/g) || []).length, 4);
  game.hangar.hide();
  game.briefing.show({});
  assert.ok(!game.briefing.dom.supplies.classList.contains('hidden'), 'one supply slot from rank 3');
  assert.ok(game.briefing.toggleSupply('shield'));
  assert.equal(game.briefing.toggleSupply('tank'), false, 'the second slot waits for rank 8');
});
