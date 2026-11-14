import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp } from './helpers/world.mjs';
import { SpaceCourier } from '../js/space/SpaceCourier.js';
import { Gamepad } from '../js/game/input/Gamepad.js';

beforeEach(() => localStorage.clear());
const setup = () => {
  const app = makeApp({}); app.spaceCourier = new SpaceCourier(app);
  return { app, g: app.game };
};
const pressB = (app) => {
  const previous = navigator.getGamepads;
  navigator.getGamepads = () => [{ connected: true, axes: [], buttons: [{}, { pressed: true }] }];
  try { new Gamepad(app).update(); } finally { navigator.getGamepads = previous; }
};
for (const id of ['missions', 'roads', 'space']) for (const via of ['close', 'escape', 'controller']) {
  test(`${id} opened from Home returns Home through ${via}`, () => {
    const { app, g } = setup();
    g.openHome(); g.home.pick(id);
    const board = id === 'missions' ? g.board : id === 'roads' ? g.roads : app.spaceCourier.board;
    assert.equal(g.home.open, false); assert.equal(board.open, true);
    if (via === 'controller') pressB(app); else board[via]();
    assert.equal(board.open, false); assert.equal(g.home.open, true);
    g.home.hide();
  });
}

test('a space board reopened from the system map clears the previous Home callback', () => {
  const { app, g } = setup();
  g.openHome(); g.home.pick('space'); app.spaceCourier.board.close(); g.home.hide();
  app.map = { open: true };
  app.spaceCourier.openBoard(); pressB(app);
  assert.equal(app.spaceCourier.board.open, false);
  assert.equal(app.map.open, true); assert.equal(g.home.open, false);
});

test('choosing a mission, road trip or parcel hides its board without calling Home', () => {
  const { app, g } = setup();
  let chosen;
  g.board.onPlay = (mission) => { chosen = mission.id; };
  g.openHome(); g.home.pick('missions'); assert.equal(g.board.play('first'), true);
  assert.equal(chosen, 'first'); assert.equal(g.home.open, false); assert.equal(g.board.open, false);
  g.roads.onPlay = (opts) => { chosen = opts.road; };
  g.openHome(); g.home.pick('roads'); assert.equal(g.roads.play('taxi'), true);
  assert.equal(chosen, 'taxi'); assert.equal(g.home.open, false); assert.equal(g.roads.open, false);
  app.spaceCourier.take = (offer) => { chosen = offer.to; return true; };
  g.openHome(); g.home.pick('space');
  app.spaceCourier.board.act('take', 0);
  assert.ok(chosen); assert.equal(g.home.open, false); assert.equal(app.spaceCourier.board.open, false);
});

test('the results Missions button also installs the Home return callback', () => {
  const { g } = setup();
  g.results.board(); assert.equal(g.board.open, true);
  g.board.close(); assert.equal(g.home.open, true); g.home.hide();
});
