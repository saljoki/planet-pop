import { describe, it, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld, run } from './helpers/world.mjs';
import { Progress } from '../js/game/Progress.js';
import { MISSIONS } from '../js/game/Missions.js';
import { LESSON_PLANET, LESSON_COINS, LESSONS, LESSON_TEXT, lessonPrompt } from '../js/game/Lessons.js';
import { loadJson, saveJson } from '../js/core/Store.js';
import { StartScreen } from '../js/ui/StartScreen.js';

const release = (player) => { for (const key in player.input) player.input[key] = false; };

describe('the flying lesson', () => {
  let app, planet, game;
  before(async () => {
    localStorage.clear();
    ({ app, planet } = await makeWorld(LESSON_PLANET));
    game = app.game;
  });
  beforeEach(() => {
    game.stop();
    game.briefing.hide();
    game.home.hide();
    game.progress.reset();
  });
  after(() => { game.stop(); planet.dispose(); });

  it('each step accepts its own input, with a pause before the next prompt', () => {
    game.start({ lesson: true });
    const lesson = game.run, pl = game.player;
    lesson.ring(); // a ring collected before its prompt teaches nothing yet
    pl.input.up = true;
    lesson.update(1.3);
    assert.equal(lesson.step, 0, 'climbing completed steering');
    release(pl);
    pl.input.left = true;
    lesson.update(0.6);
    release(pl);
    pl.input.right = true;
    lesson.update(0.6);
    assert.equal(lesson.step, 0, 'the tick needs a moment before the next prompt');
    assert.ok(lesson.coach.el.classList.contains('ticked'));
    lesson.update(0.61);
    assert.equal(lesson.step, 1, 'steering input should add up across both directions');
    release(pl);
    pl.input.boost = true;
    lesson.update(1.3);
    assert.equal(lesson.step, 1, 'boosting completed climbing');
    release(pl);
    pl.input.down = true;
    lesson.update(1.2);
    lesson.update(0.61);
    assert.equal(lesson.step, 2);
    release(pl);
    pl.input.left = true;
    lesson.update(1.3);
    assert.equal(lesson.step, 2, 'steering completed boosting');
    release(pl);
    pl.input.boost = true;
    lesson.update(1);
    lesson.update(0.61);
    assert.equal(lesson.step, 3);
    release(pl);
    lesson.update(2);
    assert.equal(lesson.step, 3, 'the earlier ring collection completed this step');
    lesson.ring();
    lesson.update(0.61);
    assert.equal(lesson.step, 4);
    lesson.ring();
    assert.equal(lesson.step, 4, 'another ring completed delivering');
    assert.equal(lesson.wait, 0);
  });

  it('a scripted pilot flies in daylight from a midnight start and delivers in under 45 seconds', () => {
    const sky = app.sky, dayLength = sky.dayLength;
    game.start({ lesson: true });
    const town = game.player.up.clone();
    game.stop();
    sky.angle = Math.atan2(town.dot(sky.sv), town.dot(sky.su)) + Math.PI;
    sky.update(0);
    assert.ok(planet.nightAt(town) > 0.9, 'the lesson town must be dark before take-off');
    game.start({ lesson: true });
    assert.ok(planet.nightAt(game.player.up) < 0.1, 'the lesson should begin in daylight');
    const seen = new Set(), dt = 1 / 60;
    let seconds = 0;
    for (; seconds < 45 && !game.over; seconds += dt) {
      const lesson = game.run, pl = game.player, id = LESSONS[lesson.step].id;
      seen.add(id);
      release(pl);
      if (lesson.wait <= 0) {
        if (id === 'steer') pl.input.left = true;
        else if (id === 'climb') pl.input.up = true;
        else if (id === 'boost') pl.input.boost = true;
        else if (id === 'ring') {
          pl.steerToward(lesson.ringTarget.position.clone().normalize());
          // steerToward normally chooses a town's delivery height; here the target is a blue ring in the air.
          const height = lesson.ringTarget.position.length();
          pl.input.up = pl.alt < height - 0.1;
          pl.input.down = pl.alt > height + 0.1;
        } else pl.steerToward(lesson.dest.c, 1.5);
      }
      app.simTime += dt;
      app.sky.update(dt);
      planet.update(dt, app.simTime);
      game.update(dt);
      assert.ok(planet.nightAt(game.player.up) < 0.1, `night during ${id} at ${seconds.toFixed(2)} s`);
    }
    assert.deepEqual([...seen], LESSONS.map((step) => step.id));
    assert.ok(game.over, `still on ${LESSONS[game.run.step].id} after ${seconds.toFixed(1)} seconds`);
    assert.ok(seconds < 45, `first parcel took ${seconds.toFixed(1)} seconds`);
    assert.equal(game.results.dom.title.textContent, LESSON_TEXT.title);
    assert.equal(game.progress.coins, LESSON_COINS, 'practice rings must not pay extra coins');
    assert.equal(game.progress.lesson, true);
    game.stop();
    assert.equal(sky.dayLength, dayLength, 'stopping restores the previous day length');
  });

  it('brings a missed ring ahead so a climbing pilot can finish it flying straight and level', () => {
    game.start({ lesson: true });
    const lesson = game.run, dt = 1 / 60;
    let ringSeconds = 0, reachedRing = false;
    for (let seconds = 0; seconds < 25 && lesson.step < 4 && ringSeconds < 15; seconds += dt) {
      const pl = game.player, id = LESSONS[lesson.step].id;
      release(pl);
      if (lesson.wait <= 0) {
        if (id === 'steer') pl.input.left = true;
        else if (id === 'climb') pl.input.up = true;
        else if (id === 'boost') pl.input.boost = true;
      }
      if (id === 'ring') { reachedRing = true; ringSeconds += dt; }
      app.simTime += dt;
      app.sky.update(dt);
      planet.update(dt, app.simTime);
      game.update(dt);
    }
    assert.ok(reachedRing, 'the first three steps must be flown with their inputs');
    assert.equal(lesson.step, 4, `the level pilot is still chasing the ring after ${ringSeconds.toFixed(1)} s`);
    assert.ok(ringSeconds < 15);
    assert.equal(game.progress.coins, 0, 'a returned practice ring pays no coins');
  });

  it('has no clock or Rex and stays active through 200 idle seconds', () => {
    game.start({ lesson: true });
    const lesson = game.run, clock = lesson.time;
    run(app, 200, { dt: 1 / 20, game: true });
    assert.ok(game.active && !game.over);
    assert.equal(lesson.step, 0);
    assert.equal(lesson.time, clock);
    assert.equal(lesson.rival, null);
    assert.equal(game.progress.coins, 0);
    assert.ok(lesson.coach.el.classList.contains('nudged'));
    assert.ok(game.hud.dom.stats.every((el) => el.classList.contains('hidden')));
    assert.equal(game.hud.dom.goal.textContent, '');
  });

  it('a wreck respawns at the nearest town and keeps the same step', () => {
    game.start({ lesson: true });
    const lesson = game.run, pl = game.player;
    lesson.enter(2);
    const nearest = lesson.respawnPoint().at.clone();
    pl.damage(10);
    game.update(1 / 60);
    assert.ok(game.respawnT > 0 && !game.over);
    run(app, 2, { dt: 1 / 60, game: true });
    assert.equal(lesson.step, 2);
    assert.ok(game.active && !game.over);
    assert.equal(pl.wrecked, false);
    assert.equal(pl.health, 1);
    assert.ok(pl.up.angleTo(nearest) < 0.05, 'the fresh plane should take off from the nearest town');
  });

  it('completion pays once, offers First Flight and preserves the lesson flag', () => {
    for (const paid of [LESSON_COINS, 0]) {
      game.start({ lesson: true });
      const before = game.progress.coins;
      game.run.enter(4);
      game.run.deliver();
      assert.equal(game.progress.coins - before, paid);
      assert.ok(game.progress.lesson);
      assert.ok(new Progress().lesson, 'the completion flag was not saved');
      assert.equal(game.results.nextMission, MISSIONS[0]);
      assert.equal(game.results.dom.again.textContent, LESSON_TEXT.again);
      assert.equal(game.results.dom.again.classList.contains('big'), false);
      assert.equal(game.results.dom.result.innerHTML.includes(LESSON_TEXT.reward), paid > 0);
      assert.equal(game.run.coach.open, false);
      game.stop();
    }
  });

  it('only an empty save needs a lesson; the v0.17.0 fixture loads unchanged', () => {
    assert.equal(new Progress().needsLesson, true);
    const old = { coins: 320, best: 940, levels: { engine: 1 }, owned: ['classic', 'sky'], skin: 'sky',
      daily: null, missions: ['first'], bests: {} };
    saveJson('planetpop.courier', old);
    const p = new Progress();
    assert.equal(p.needsLesson, false);
    assert.equal(p.lesson, false);
    assert.deepEqual({ coins: p.coins, best: p.best, levels: p.levels, owned: [...p.owned], skin: p.skin,
      daily: p.daily, missions: [...p.missions], bests: p.bests }, old);
    p.save();
    const saved = loadJson('planetpop.courier', {});
    delete saved.lesson;
    assert.deepEqual(saved, old);
    for (const progress of [{ coins: 1 }, { best: 1 }, { levels: { wings: 1 } }, { missions: ['first'] }, { bests: { taxi: 0 } },
      { owned: ['classic', 'sky'] }, { daily: { date: '2026-11-13', best: 0 } }]) {
      saveJson('planetpop.courier', progress);
      assert.equal(new Progress().needsLesson, false, JSON.stringify(progress));
    }
    p.reset();
    assert.equal(p.needsLesson, true);
    assert.equal(p.lesson, false);
  });

  it('launches directly with the briefing option on', () => {
    app.settings.set('briefing', true);
    game.launch({ lesson: true });
    assert.ok(game.active && game.run.coached);
    assert.equal(game.briefing.open, false);
  });

  it('Options replays the lesson without leaving Start, Home, the hangar or a briefing above it', () => {
    app.start = new StartScreen(app);
    app.start.ready();
    const sources = [app.start, game.home, game.hangar, game.briefing];
    for (const source of sources) {
      if (source === game.briefing) source.show({});
      else source.show();
      game.options.show(() => source.show(source === game.briefing ? {} : undefined));
      game.options.lesson();
      assert.ok(game.active && game.run.coached);
      assert.equal(game.options.open, false);
      assert.ok(sources.every((menu) => !menu.open), 'the previous menu still covers the coach');
      game.stop();
    }
  });

  it('keeps Start visible when a lesson is requested while the planet is still building', async () => {
    app.start ??= new StartScreen(app);
    app.start.show();
    app.building = true;
    try {
      await game.startLesson();
      assert.equal(app.start.open, true);
      assert.equal(game.active, false);
    } finally {
      app.building = false;
      app.start.dismiss();
    }
  });

  it('leaves instructions to the coach, then restores normal hazard reminders for other runs', () => {
    const warnings = ['warnedStorm', 'warnedAsh', 'warnedHeat', 'warnedWind', 'warnedIce'];
    game.start({ lesson: true });
    assert.ok(warnings.every((key) => game.hazards[key]));
    game.stop();
    game.start({ free: true });
    assert.ok(warnings.every((key) => !game.hazards[key]));
    assert.equal(game.el.classList.contains('lesson'), false);
  });

  it('skipping marks it done, pays nothing and opens Home', () => {
    game.start({ lesson: true });
    game.pauseMenu.skip();
    assert.equal(game.progress.lesson, true);
    assert.equal(game.progress.coins, 0);
    assert.equal(new Progress().lesson, true);
    assert.equal(game.active, false);
    assert.equal(game.home.open, true);
    assert.equal(game.progress.finishLesson(), 0, 'a skipped lesson must not pay on replay');
  });

  it('nudges without skipping, gives the lower hint and changes prompts for controls and Invert Y', () => {
    game.start({ lesson: true });
    const lesson = game.run, pl = game.player;
    lesson.update(10.01);
    assert.equal(lesson.step, 0);
    assert.ok(lesson.coach.el.classList.contains('nudged'));
    assert.equal(lessonPrompt(1, { touch: true, invertY: true }), 'Drag up to dive, down to climb');
    assert.equal(lessonPrompt(2, { pad: true }), 'Hold A');
    lesson.enter(4);
    pl.up.copy(lesson.dest.c);
    pl.alt = planet.surfR(lesson.dest.c) + 4;
    lesson.hud(game.hud);
    assert.equal(lesson.coach.dom.text.textContent, LESSON_TEXT.lower);
    assert.equal(game.hud.dom.goal.textContent, '');
  });

  it('the route and every ring repeat from the same seed', () => {
    const snapshot = () => {
      game.start({ lesson: true });
      const lesson = game.run, initial = game.props.rings.map((ring) => ring.position.toArray());
      const from = lesson.from.name;
      lesson.enter(3);
      const ring = lesson.ringTarget.position.toArray();
      game.stop();
      return { from, initial, ring };
    };
    assert.deepEqual(snapshot(), snapshot());
  });
});
