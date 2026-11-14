import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp } from './helpers/world.mjs';
import { setRank } from './helpers/rank.mjs';

beforeEach(() => localStorage.clear());

test('an empty rank-one hangar has four sections, five locked craft and thirty upgrade pips', () => {
  const g = makeApp({}).game, h = g.hangar;
  setRank(g, 1);
  h.show();
  assert.equal((h.el.innerHTML.match(/<details /g) || []).length, 4);
  assert.equal((h.dom.crafts.innerHTML.match(/class="craft-card locked"/g) || []).length, 5);
  assert.match(h.dom.crafts.innerHTML, /Flying/);
  assert.equal((h.dom.ups.innerHTML.match(/○/g) || []).length, 30);
  assert.equal(h.dom.craftHeader.textContent, '✈️ Craft · Classic');
  assert.equal(h.dom.upgradeHeader.textContent, '🔧 Upgrades · 0 / 30');
  assert.equal(h.dom.paintHeader.textContent, '🎨 Paint · 1 / 12');
  assert.equal(h.dom.trailHeader.textContent, '💨 Trails · 1 / 6');
  assert.equal(h.dom.sections.craft.open, true);
});

test('at rank thirty and 50,000 coins all five craft can be bought', () => {
  const g = makeApp({}).game, h = g.hangar;
  setRank(g, 30); g.progress.addCoins(50000, false); h.show();
  assert.equal((h.dom.crafts.innerHTML.match(/class="craft-card buy"/g) || []).length, 5);
  assert.deepEqual([...h.dom.crafts.innerHTML.matchAll(/data-craft="([^"]+)"/g)].map((m) => m[1]), ['classic', 'bulldog', 'hummingbird', 'mule', 'swift', 'comet']);
  assert.match(h.dom.crafts.innerHTML, /data-craft="bulldog"[^>]*>🪙 3,000/);
  assert.match(h.dom.crafts.innerHTML, /data-craft="swift"[^>]*>🪙 9,000/);
  assert.doesNotMatch(h.dom.crafts.innerHTML, /🔒 Rank/);
  assert.equal((h.dom.skins.innerHTML.match(/data-skin=/g) || []).length, 12);
  assert.equal((h.dom.trails.innerHTML.match(/data-trail=/g) || []).length, 6);
});

test('the delegated purchase flies Bulldog, refreshes the header and pays only once', () => {
  const g = makeApp({}).game, h = g.hangar;
  setRank(g, 4); g.progress.addCoins(50000, false); h.show();
  h.click({ target: { closest: () => ({ dataset: { craft: 'bulldog' } }) } });
  assert.equal(g.progress.craft, 'bulldog');
  assert.equal(g.progress.coins, 47000);
  assert.equal(h.dom.craftHeader.textContent, '✈️ Craft · Bulldog');
  assert.match(h.dom.crafts.innerHTML, /data-craft="bulldog" disabled>Flying/);
  h.pickCraft('classic'); h.pickCraft('bulldog');
  assert.equal(g.progress.coins, 47000);
  h.pickTrail('snow');
  assert.equal(h.dom.trailHeader.textContent, '💨 Trails · 2 / 6');
});

test('opening a section closes the others and reopening the hangar starts with Craft', () => {
  const h = makeApp({}).game.hangar;
  h.show();
  for (const id of ['upgrades', 'paint', 'trails']) {
    h.dom.sections[id].open = true;
    h.sectionToggled(id);
    assert.deepEqual(Object.entries(h.dom.sections).filter(([, section]) => section.open).map(([key]) => key), [id]);
  }
  h.hide(); h.show();
  assert.deepEqual(Object.entries(h.dom.sections).filter(([, section]) => section.open).map(([key]) => key), ['craft']);
});
