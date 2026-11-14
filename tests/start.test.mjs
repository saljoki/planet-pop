import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeApp } from './helpers/world.mjs';
import { fakeEl } from './helpers/dom.mjs';
import { StartScreen } from '../js/ui/StartScreen.js';

const { document } = globalThis;

beforeEach(() => localStorage.clear());

function titleScreen() {
  const app = makeApp({});
  app.start = new StartScreen(app);
  return app;
}

const press = (code) => ({ code, repeat: false, preventDefault() {} });

test('start buttons wait for the first planet, then PLAY is enabled', () => {
  const app = titleScreen(), start = app.start;
  start.show();
  assert.equal(start.dom.play.disabled, true);
  assert.equal(start.dom.explore.disabled, true);
  let chosen = false;
  app.game.play = () => { chosen = true; };
  start.play();
  start.explore();
  start.key(press('Enter'));
  assert.equal(chosen, false);
  assert.equal(start.open, true);
  start.ready();
  assert.equal(start.dom.play.disabled, false);
  assert.equal(start.dom.explore.disabled, false);
  assert.equal(start.dom.play.textContent, '▶ PLAY');
  start.dismiss();
});

test('PLAY hides the start screen and opens Home for a pilot with progress', () => {
  const app = titleScreen(), start = app.start;
  app.game.progress.addCoins(100);
  start.ready();
  start.show();
  start.play();
  assert.equal(start.open, false);
  assert.equal(app.game.home.open, true);
  assert.equal(document.body.classList.contains('at-start'), false);
  app.game.home.hide();
});

test('Explore restores the HUD and its previous panel state', () => {
  const app = titleScreen(), start = app.start, hud = app.hud;
  hud.panel.show();
  start.ready();
  start.show();
  for (const id of ['title', 'hint', 'worldTag', 'topBtns']) assert.equal(hud.$(id).classList.contains('hidden'), true, id);
  assert.equal(hud.panel.open, false);
  assert.equal(document.body.classList.contains('at-start'), true);
  start.explore();
  for (const id of ['title', 'hint', 'worldTag', 'topBtns']) assert.equal(hud.$(id).classList.contains('hidden'), false, id);
  assert.equal(hud.panel.open, true);
  assert.equal(document.body.classList.contains('at-start'), false);
  assert.equal(app.game.home.open, false);
  hud.panel.hide();
  start.show();
  start.dismiss();
  assert.equal(hud.panel.open, false, 'an initially closed panel stays closed');
});

test('the start screen is wanted on ordinary launches, but invite and daily links go straight through', () => {
  assert.equal(StartScreen.wanted({ roomLink: null, dailyLink: false }), true);
  assert.equal(StartScreen.wanted({ roomLink: 'ABCD', dailyLink: false }), false);
  assert.equal(StartScreen.wanted({ roomLink: null, dailyLink: true }), false);
  assert.equal(StartScreen.wanted({ roomLink: 'ABCD', dailyLink: true }), false);
});

test('the greeting uses the saved name, and dismiss does not choose a game', () => {
  const app = titleScreen(), start = app.start;
  let chosen = false;
  app.game.play = () => { chosen = true; };
  app.settings.setPlayerName('Ata');
  start.show();
  assert.equal(start.dom.hello.textContent, '👋 Ata');
  assert.equal(start.dom.hello.classList.contains('hidden'), false);
  start.dismiss();
  assert.equal(chosen, false);
  app.settings.setPlayerName('');
  start.show();
  assert.equal(start.dom.hello.classList.contains('hidden'), true);
  start.dismiss();
});

test('Enter and Space play, Escape explores, and menus above Start own their input', () => {
  const app = titleScreen(), start = app.start;
  let played = 0;
  app.game.play = () => { played++; };
  start.ready();
  start.show();
  app.game.options.show();
  assert.equal(start.covered, true);
  for (const code of ['Enter', 'Space', 'Escape']) start.key(press(code));
  assert.equal(played, 0);
  assert.equal(start.open, true);
  app.game.options.hide();
  app.hud.about.show();
  start.key(press('Enter'));
  assert.equal(played, 0);
  app.hud.about.hide();
  const query = document.querySelectorAll;
  try {
    document.querySelectorAll = () => [fakeEl()]; // e.g. the trophy box, which is not an Overlay instance
    start.key(press('Escape'));
    assert.equal(start.open, true);
  } finally { document.querySelectorAll = query; }
  start.key(press('Enter'));
  assert.equal(start.open, false);
  assert.equal(played, 1);
  start.show();
  start.key(press('Space'));
  assert.equal(played, 2);
  start.show();
  start.key(press('Escape'));
  assert.equal(start.open, false);
  assert.equal(played, 2, 'Escape explores without playing');
});
