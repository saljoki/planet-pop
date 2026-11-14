import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { MISSIONS, missionIndex } from '../js/game/Missions.js';
import { CHAPTERS, chapterOf, missionsIn } from '../js/game/Chapters.js';
import { starGoals, starsEarned } from '../js/game/Stars.js';
import { Progress } from '../js/game/Progress.js';
import { MissionRun } from '../js/game/runs/MissionRun.js';

const def = (id) => MISSIONS.find((m) => m.id === id);
const legacy = { coins: 900, best: 2400, levels: { engine: 2 }, owned: ['classic'], skin: 'classic', daily: null,
  missions: ['first', 'rush', 'flag', 'storm'], bests: {} };

describe('mission stars', () => {
  const clean = { par: 70 };

  it('describes the goals, including the default clean-flight bonus', () => {
    assert.deepEqual(starGoals(clean), ['Finish', 'Under 1:10', 'No knocks']);
    assert.deepEqual(starGoals({ par: 125, bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } }),
      ['Finish', 'Under 2:05', 'Collect 3 rings']);
  });

  it('awards one star for finishing, one for time and one for the bonus independently', () => {
    assert.equal(starsEarned(clean, { elapsed: 71, tally: { knocks: 2 } }), 1);
    assert.equal(starsEarned(clean, { elapsed: 58, tally: { knocks: 2 } }), 2);
    assert.equal(starsEarned(clean, { elapsed: 71, tally: { knocks: 0 } }), 2);
    assert.equal(starsEarned(clean, { elapsed: 58, tally: { knocks: 0 } }), 3);
    assert.equal(starsEarned(clean, { elapsed: 70, tally: { knocks: 0 } }), 3, 'the par itself earns the time star');
  });

  it('checks minimum and maximum bonuses at their boundaries', () => {
    const min = { par: 70, bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } };
    const max = { par: 70, bonus: { stat: 'sun', max: 15, text: 'Under 15 s in the sunshine' } };
    assert.equal(starsEarned(min, { elapsed: 60, tally: { rings: 2 } }), 2);
    assert.equal(starsEarned(min, { elapsed: 60, tally: { rings: 3 } }), 3);
    assert.equal(starsEarned(max, { elapsed: 60, tally: { sun: 15 } }), 3);
    assert.equal(starsEarned(max, { elapsed: 60, tally: { sun: 15.01 } }), 2);
  });
});

describe('saved stars and chapters', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the best stars, saves improvements and clears them on reset', () => {
    const p = new Progress();
    assert.equal(p.starsFor('first'), 0);
    assert.equal(p.recordStars('first', 2), true);
    assert.equal(p.recordStars('first', 1), false);
    assert.equal(p.recordStars('first', 2), false);
    assert.equal(new Progress().starsFor('first'), 2);
    assert.equal(p.recordStars('first', 3), true);
    assert.equal(new Progress().totalStars, 3);
    assert.equal(p.coins, 0, 'stars pay no coins');
    assert.deepEqual(JSON.parse(localStorage.getItem('planetpop.courier')).stars, { first: 3 });
    p.reset();
    assert.equal(p.totalStars, 0);
    assert.deepEqual(new Progress().stars, {});
  });

  it('opens chapters by stars and keeps missions sequential inside them', () => {
    const p = new Progress();
    assert.equal(CHAPTERS.length, 18);
    assert.deepEqual(MISSIONS.filter((m, i) => p.missionUnlocked(i)).map((m) => m.id), ['first']);
    assert.equal(chapterOf(def('first')), 'school');
    assert.equal(chapterOf(def('flag')), 'moon');
    assert.equal(missionsIn('school').length, 10);
    p.completeMission(def('first'));
    p.recordStars('first', 3);
    assert.ok(p.chapterOpen('earth'));
    assert.ok(!p.chapterOpen('moon'));
    assert.ok(p.missionUnlocked(missionIndex('rush')));
    assert.ok(!p.missionUnlocked(missionIndex('rings')));
    p.completeMission(def('rush'));
    p.recordStars('rush', 3);
    assert.ok(p.chapterOpen('moon'));
    assert.ok(p.missionUnlocked(missionIndex('flag')));
    assert.ok(!p.chapterOpen('mars'));
  });

  it('three stars open Earth’s first mission, with later missions opening one at a time', () => {
    const p = new Progress();
    p.completeMission(def('first'));
    p.recordStars('first', 3);
    assert.ok(p.missionUnlocked(missionIndex('airmail')));
    assert.ok(!p.missionUnlocked(missionIndex('express')));
    assert.ok(!p.missionUnlocked(missionIndex('wonders')));
    p.completeMission(def('airmail'));
    assert.ok(p.missionUnlocked(missionIndex('express')));
    assert.ok(!p.missionUnlocked(missionIndex('wonders')));
  });

  it('loads v0.17.0 progress unchanged and preserves every completed mission for replay', () => {
    localStorage.setItem('planetpop.courier', JSON.stringify(legacy));
    const p = new Progress();
    assert.equal(p.coins, 900);
    assert.equal(p.best, 2400);
    assert.deepEqual(p.levels, { engine: 2 });
    assert.deepEqual([...p.owned], ['classic']);
    assert.equal(p.skin, 'classic');
    assert.equal(p.daily, null);
    assert.deepEqual(p.bests, {});
    assert.deepEqual([...p.missions], legacy.missions);
    assert.deepEqual(p.stars, {});
    assert.equal(p.totalStars, 4);
    for (const id of legacy.missions) {
      assert.equal(p.starsFor(id), 1);
      assert.ok(p.missionUnlocked(missionIndex(id)), `${id} must stay playable`);
    }
    assert.ok(p.totalStars < CHAPTERS.find((c) => c.id === 'jupiter').gate, 'Jupiter’s star gate is still unmet');
    assert.ok(p.chapterOpen('jupiter'), 'the completed storm mission keeps its chapter open');
    assert.ok(!p.chapterOpen('mars'));
    p.save();
    const { stars, ...saved } = JSON.parse(localStorage.getItem('planetpop.courier'));
    assert.deepEqual(stars, {});
    assert.deepEqual(saved, legacy);
    assert.equal(p.recordStars('storm', 3), true);
    assert.equal(new Progress().totalStars, 6);
  });

  it('still returns and pays the mission reward exactly once', () => {
    const p = new Progress(), m = def('first');
    assert.equal(p.completeMission(m), m.reward);
    assert.equal(p.completeMission(m), 0);
    p.recordStars(m.id, 3);
    assert.equal(p.coins, m.reward);
    assert.equal(new Progress().coins, m.reward);
  });
});

describe('mission star briefing, clock and results', () => {
  let app, planet, game;
  before(async () => {
    localStorage.clear();
    ({ app, planet } = await makeWorld(def('first').planet));
    game = app.game;
  });
  beforeEach(() => {
    game.stop();
    app.paused = false;
    localStorage.clear();
    game.progress = new Progress();
  });
  after(() => { game.stop(); planet.dispose(); });

  it('puts the three star goals first in the briefing', () => {
    const m = def('first');
    assert.equal(MissionRun.briefing({ mission: m }).tips[0], starGoals(m).map((goal) => `⭐ ${goal}`).join(' · '));
  });

  it('counts the whole mission, across deliveries, only while it is live and unpaused', () => {
    game.start({ mission: def('first') });
    const run = game.run;
    assert.equal(run.missionElapsed, 0);
    run.update(2);
    run.deliver();
    assert.equal(run.elapsed, 0, 'a new parcel resets only its combo clock');
    assert.equal(run.missionElapsed, 2);
    app.paused = true;
    const time = run.time;
    run.update(20);
    assert.equal(run.missionElapsed, 2);
    assert.equal(run.time, time);
    app.paused = false;
    run.update(3);
    assert.equal(run.missionElapsed, 5);
    run.hud(game.hud);
    assert.match(game.hud.dom.mission.textContent, new RegExp(`⭐ ${def('first').par - 5}$`));
    run.missionElapsed = def('first').par + 0.01;
    run.hud(game.hud);
    assert.match(game.hud.dom.mission.textContent, /⭐ –$/);
    run.endMission('time');
    const elapsed = run.missionElapsed;
    run.update(5);
    assert.equal(run.missionElapsed, elapsed);
    assert.equal(game.progress.starsFor('first'), 0, 'a failed mission earns no star');
  });

  it('shows two stars, each goal and a newly opened chapter, without paying coins for stars', () => {
    game.progress.completeMission(def('rush')); // one old-style completion plus two new stars reaches Earth’s gate
    const mission = { ...def('first'), par: 70 };
    game.start({ mission });
    const run = game.run;
    run.missionElapsed = 58;
    run.tally.knocks = 2;
    run.tally.deliveries = def('first').goal.target;
    const coins = game.progress.coins;
    run.endMission('done');
    const html = game.results.dom.result.innerHTML;
    assert.match(html, /⭐⭐☆/);
    assert.match(html, /✔ Finish/);
    assert.match(html, /✔ Under 1:10 \(0:58\)/);
    assert.match(html, /✖ No knocks \(2\)/);
    assert.match(html, /🔓 Earth is open!/);
    assert.equal(game.progress.starsFor('first'), 2);
    assert.equal(game.progress.coins, coins + def('first').reward);
    assert.equal(game.results.nextMission.id, 'rush');
    run.endMission('done');
    assert.equal(game.progress.coins, coins + def('first').reward, 'a result cannot pay twice');
  });

  it('shows enough precision to explain a missed maximum bonus', () => {
    const mission = { ...def('first'), bonus: { stat: 'sun', max: 15, text: 'Under 15 s in the sunshine' } };
    game.start({ mission });
    game.run.tally.sun = 15.01;
    game.run.endMission('done');
    assert.equal(game.progress.starsFor('first'), 2);
    assert.match(game.results.dom.result.innerHTML, /✖ Under 15 s in the sunshine \(15\.1\)/);
  });

  it('keeps the previous best on a worse replay and offers the next mission inside the chapter', () => {
    game.progress.completeMission(def('first'));
    game.progress.recordStars('first', 3);
    game.start({ mission: def('first') });
    const run = game.run;
    run.missionElapsed = def('first').par + 1;
    run.tally.knocks = 2;
    run.endMission('done');
    assert.match(game.results.dom.result.innerHTML, /⭐☆☆/);
    assert.match(game.results.dom.result.innerHTML, /Best: ⭐⭐⭐/);
    assert.equal(game.progress.starsFor('first'), 3);
    assert.equal(game.results.nextMission.id, 'rush');
    assert.match(game.results.dom.result.innerHTML, /Already earned/);
  });

  it('offers the first unfinished mission of the next open chapter and skips completed chapters', () => {
    const p = game.progress;
    p.completeMission(def('first'));
    p.recordStars('first', 3);
    p.completeMission(def('airmail'));
    const run = new MissionRun(game, { mission: def('ash') });
    assert.equal(run.nextMission().id, 'express');
    p.completeMission(def('express'));
    p.completeMission(def('wonders'));
    assert.ok(p.chapterOpen('moon'));
    assert.equal(run.nextMission().id, 'flag');
  });

  it('has no Next offer after a chapter when no later chapter is open', () => {
    const run = new MissionRun(game, { mission: def('ash') });
    assert.equal(run.nextMission(), null);
  });
});
