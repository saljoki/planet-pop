import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from './helpers/world.mjs';
import { MISSIONS } from '../js/game/Missions.js';
import { worldOf } from '../js/space/Worlds.js';
import { Progress } from '../js/game/Progress.js';
import { readPad } from '../js/game/input/Gamepad.js';

const def = (id) => MISSIONS.find((m) => m.id === id);

describe('missions', () => {
  beforeEach(() => localStorage.clear());

  it('unlock one at a time and pay their reward once', () => {
    const p = new Progress();
    assert.ok(p.missionUnlocked(0) && !p.missionUnlocked(1));
    assert.equal(p.completeMission(MISSIONS[0]), MISSIONS[0].reward);
    assert.equal(p.completeMission(MISSIONS[0]), 0, 'paid twice');
    assert.ok(p.missionUnlocked(1) && !p.missionUnlocked(2));
    assert.equal(new Progress().coins, MISSIONS[0].reward, 'reward not saved');
    assert.ok(!p.chapterOpen('earth'), 'one completion alone does not meet Earth’s star gate');
    p.recordStars('first', 3);
    assert.ok(p.chapterOpen('earth'), 'three stars open Earth');
  });

  it('each mission planet has what its mission needs', async () => {
    const seen = new Map();
    for (const m of MISSIONS) {
      const key = JSON.stringify(m.planet);
      if (!seen.has(key)) {
        const { planet } = await makeWorld(m.planet);
        seen.set(key, {
          cities: planet.cities.sites.length, airports: planet.airports.list.length,
          volcanoes: planet.volcanoes.length, theme: planet.theme.id, storms: planet.weather.storms.length,
          landmarks: planet.landmarks.list.map((l) => l.name), loops: planet.landmarks.list.filter((l) => l.loop).length,
          ice: planet.rings?.ice.length ?? 0, wind: planet.world?.wind ?? 0,
        });
        planet.dispose();
      }
      const w = seen.get(key);
      assert.ok(w.cities >= 2, `${m.id}: not enough cities`);
      assert.equal(w.theme, m.planet.world ? worldOf(m.planet.world).theme : m.planet.theme);
      if (m.landmark) assert.ok(w.landmarks.includes(m.landmark), `${m.id}: no ${m.landmark}`);
      if (m.failIf === 'zaps' || m.id === 'dust') assert.ok(w.storms >= 2, `${m.id}: only ${w.storms} storms`);
      if (m.goal.stat === 'loops') assert.ok(w.loops, `${m.id}: no storm to fly round`);
      if (m.goal.stat === 'threads') assert.ok(w.ice > 100, `${m.id}: no ring ice`);
      if (m.id === 'gale') assert.ok(w.wind > 0, 'no wind on Neptune');
      if (m.goal.stat === 'refuels') assert.ok(w.airports > 0, `${m.id}: no airport to refuel at`);
      if (m.eruptions) assert.ok(w.volcanoes >= 2, `${m.id}: only ${w.volcanoes} volcano`);
    }
  });
});

describe('mission runs', () => {
  let app, planet;
  before(async () => {
    localStorage.clear();
    ({ app, planet } = await makeWorld(def('first').planet));
  });

  it('First Flight: three deliveries complete it, pay the reward and unlock the next', () => {
    const game = app.game, coins = game.progress.coins;
    game.start({ mission: def('first') });
    assert.ok(game.run.def && !game.hud.dom.mission.classList.contains('hidden'));
    for (let i = 0; i < 3; i++) game.run.deliver();
    game.update(1 / 60);
    assert.ok(game.over);
    assert.match(game.results.dom.title.textContent, /complete/);
    assert.ok(game.progress.missionDone('first'));
    assert.ok(game.progress.coins >= coins + def('first').reward);
    assert.ok(!game.results.dom.next.classList.contains('hidden'), 'no Next mission button');
    game.again();
    assert.equal(game.run.def.id, 'first', 'again should replay the same mission');
    game.stop();
  });

  it('Handle With Care fails when the fragile parcel breaks', () => {
    const game = app.game, pl = (game.start({ mission: def('care') }), game.player);
    game.run.cargo = { ...game.run.cargo, fragile: true };
    pl.up.copy(game.run.from.c);
    pl.alt = planet.groundR(pl.up) - 0.05;
    pl.invuln = 0;
    game.update(1 / 60);
    assert.ok(game.over);
    assert.match(game.results.dom.title.textContent, /failed/);
    assert.match(game.results.dom.result.innerHTML, /broke/);
    assert.ok(!game.progress.missionDone('care'));
    game.stop();
  });

  it('running out of time fails a mission', () => {
    const game = app.game;
    game.start({ mission: def('rings') });
    game.run.time = 0.001;
    game.update(1 / 60);
    assert.ok(game.over);
    assert.match(game.results.dom.result.innerHTML, /Out of time/);
    game.stop();
  });

  it('Night Shift starts in the dark, Outrun Rex starts with Rex, Close Encounter calls the UFO', () => {
    const game = app.game;
    game.start({ mission: def('night') });
    assert.ok(planet.nightAt(game.run.from.c) > 0.5, 'the start city is in daylight');
    game.stop();
    game.start({ mission: def('rex') });
    assert.ok(game.run.rival, 'no Rex at the start');
    game.stop();
    game.start({ mission: def('ufo') });
    assert.equal(planet.ufo.state, 'away');
    assert.equal(planet.ufo.timer, def('ufo').ufoIn);
    game.stop();
  });

  it('the same mission always gets the same route', () => {
    const game = app.game, route = () => {
      game.start({ mission: def('rush') });
      const legs = [game.run.from.name, game.run.dest.name];
      for (let i = 0; i < 5; i++) { game.run.deliver(); legs.push(`${game.run.dest.name}:${game.run.cargo.id}`); }
      game.stop();
      return legs;
    };
    const a = route();
    assert.deepEqual(route(), a);
    assert.ok(a.filter((l) => l.endsWith(':urgent')).length >= 1, 'Rush Hour should favour urgent parcels');
  });
});

describe('missions on the real worlds', () => {
  beforeEach(() => localStorage.clear());

  it('One Small Step: the flag goes to Tranquility Base, by hopper', async () => {
    const { app, planet } = await makeWorld({ world: 'moon' }), game = app.game;
    game.start({ mission: def('flag') });
    const run = game.run, pl = game.player;
    assert.equal(pl.style, 'hopper');
    assert.equal(run.dest.name, 'Tranquility Base');
    assert.ok(!run.rival, 'Rex on the Moon');
    game.update(1 / 60);
    assert.match(game.hud.dom.goal.textContent, /🚩 Flag → Tranquility Base/);
    pl.up.copy(run.dest.c);
    pl.alt = planet.surfR(run.dest.c) + 1;
    game.update(1 / 60);
    assert.ok(game.over);
    assert.match(game.results.dom.title.textContent, /complete/);
    assert.ok(game.progress.missionDone('flag'));
    game.stop();
    planet.dispose();
  });

  it('Room Service carries a fragile cake to the Ice Hotel, and a crash ends it', async () => {
    const { app, planet } = await makeWorld({ world: 'pluto' }), game = app.game;
    game.start({ mission: def('hotel') });
    const run = game.run, pl = game.player;
    assert.equal(run.cargo.id, 'fragile');
    assert.equal(run.dest.name, 'The Ice Hotel');
    pl.up.copy(run.from.c);
    pl.alt = planet.groundR(pl.up) - 0.05;
    pl.invuln = 0;
    game.update(1 / 60);
    assert.ok(game.over);
    assert.match(game.results.dom.result.innerHTML, /broke/);
    game.stop();
    planet.dispose();
  });

  it('Acid Rain ends at the first lightning strike; Mars has dust storms without lightning', async () => {
    const { app, planet } = await makeWorld({ world: 'venus' }), game = app.game;
    game.start({ mission: def('acid') });
    game.run.zapped();
    game.update(1 / 60);
    assert.ok(game.over);
    assert.match(game.results.dom.result.innerHTML, /lightning/);
    game.stop();
    planet.dispose();

    const mars = await makeWorld({ world: 'mars' }), w = mars.planet.weather;
    assert.ok(w.dusty && w.storms.length === 2);
    assert.equal(w.entities[0].name, 'Dust Storm 1');
    let strikes = 0;
    w.strike = () => strikes++;
    for (let i = 0; i < 400; i++) w.update(0.05, i * 0.05);
    assert.equal(strikes, 0, 'lightning in a dust storm');
    const g = mars.app.game;
    g.start({ mission: def('dust') });
    const pl = g.player, health = pl.health;
    w.stormCenter(w.storms[0], pl.pos);
    g.hazards.update(1);
    assert.ok(pl.health < health, 'the grit wears the glider down');
    assert.equal(g.run.tally.zaps, 0);
    g.stop();
    mars.planet.dispose();
  });

  it('Keep to the Shade only sends parcels to towns in the dark, without stopping the Sun', async () => {
    const { app, planet } = await makeWorld({ world: 'mercury' }), game = app.game, day = app.sky.dayLength;
    game.start({ mission: def('shade') });
    const run = game.run, dark = planet.cities.sites.filter((s) => s !== run.from && planet.nightAt(s.c) > 0.5);
    if (dark.length) assert.ok(planet.nightAt(run.dest.c) > 0.5, 'a parcel to a town in the sunshine');
    assert.equal(app.sky.dayLength, day);
    game.stop();
    planet.dispose();
  });
});

describe('controller', () => {
  const pad = (axes, pressed = []) => ({ axes, buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i), value: pressed.includes(i) ? 1 : 0 })) });

  it('maps sticks, d-pad and buttons to flight controls', () => {
    assert.deepEqual(readPad(pad([-0.9, 0])), { left: true, right: false, up: false, down: false, boost: false, a: false, b: false, start: false, horn: false });
    assert.ok(readPad(pad([0, 0], [3])).horn, 'Y honks');
    const s = readPad(pad([0.1, -0.8], [0, 9]));
    assert.ok(!s.left && !s.right && s.up && s.boost && s.a && s.start, 'stick up, A and Start');
    assert.ok(readPad(pad([0, 0], [15])).right, 'd-pad right');
    assert.ok(readPad(pad([0, 0], [7])).boost, 'right trigger boosts');
    assert.ok(!readPad(pad([0.2, -0.2])).left, 'small stick wobbles are ignored');
  });

  it('only changes in controller state touch the plane, so the keyboard keeps working', async () => {
    const { app: a, planet: p } = await makeWorld({ seed: 42, land: 0.25, cities: 2 });
    const game = a.game;
    game.start();
    game.player.input.left = true;                 // held on the keyboard
    game.controls.pad(readPad(pad([0, 0])), readPad(pad([0, 0])));
    assert.ok(game.player.input.left, 'an idle controller cancelled a key');
    game.controls.pad(readPad(pad([0.9, 0])), readPad(pad([0, 0])));
    assert.ok(game.player.input.right);
    game.stop();
    p.dispose();
  });
});

const trial = (id, world, flags = {}) => ({
  id, icon: '📦', name: id, brief: 'A test flight.', planet: { world },
  goal: { stat: 'deliveries', target: 99 }, reward: 10, par: 120, ...flags,
});

describe('new mission rules', () => {
  beforeEach(() => localStorage.clear());

  it('a tour visits landmarks in any order, rejects high passes and points to the nearest one left', async () => {
    const { app, planet } = await makeWorld({ world: 'earth' }), game = app.game;
    const names = ['Mount Everest', 'The Sahara', 'The Amazon'];
    game.start({ mission: trial('test-tour', 'earth', { tour: names, item: '📷 Photo', goal: { stat: 'visits', target: 3 } }) });
    const pops = [], pop = app.sfx.pop.bind(app.sfx);
    app.sfx.pop = (...args) => { pops.push(args); pop(...args); };
    try {
      const run = game.run, pl = game.player;
      assert.equal(run.cargo, null, 'a tour has no town parcels');
      for (const [i, name] of ['The Sahara', 'Mount Everest', 'The Amazon'].entries()) {
        const spot = planet.landmarks.list.find((l) => l.name === name);
        pl.up.copy(spot.d);
        pl.alt = planet.surfR(spot.d) + 4;
        assert.ok(run.target(pl.up).c.angleTo(spot.d) < 1e-7, `${name} is nearest`);
        assert.equal(run.target(pl.up).text, `📷 Photo → ${name}`);
        run.update(0.01);
        assert.equal(run.tally.visits, i, 'a high pass counted');
        const time = run.time;
        pl.alt = planet.surfR(spot.d) + 1;
        pl.health = 0.4;
        run.update(0.01);
        assert.equal(run.tally.visits, i + 1);
        assert.equal(pops.at(-1)[1], name);
        assert.equal(pops.at(-1)[3], 'deliver');
        assert.ok(Math.abs(run.time - time - 19.99) < 1e-8, 'a visit adds twenty seconds');
        assert.ok(Math.abs(pl.health - 0.55) < 1e-8, 'a visit repairs the plane');
        assert.equal(run.tally.deliveries, 0, 'a photo counted as a town parcel');
        if (i < names.length - 1) {
          const left = planet.landmarks.list.filter((l) => names.includes(l.name) && !run.visited.has(l.name));
          const nearest = left.reduce((a, b) => a.d.angleTo(pl.up) < b.d.angleTo(pl.up) ? a : b);
          assert.ok(run.target(pl.up).c.angleTo(nearest.d) < 1e-7);
          let ringAim;
          const route = game.props.alongRoute;
          game.props.alongRoute = (ring, from, to) => { ringAim = to; };
          try { run.placeRing(game.props.rings[0]); } finally { game.props.alongRoute = route; }
          assert.ok(ringAim.angleTo(nearest.d) < 1e-7, 'rings do not follow the tour target');
        }
      }
      assert.ok(game.over);
      assert.match(game.results.dom.title.textContent, /complete/);
    } finally { game.stop(); planet.dispose(); }
  });

  it('a fetch collects at its landmark before any town delivery can count', async () => {
    const { app, planet } = await makeWorld({ world: 'moon' }), game = app.game;
    game.start({ mission: trial('test-fetch', 'moon', { fetch: 'Tycho', item: '🪨 Moon rock', goal: { stat: 'deliveries', target: 1 } }) });
    const pops = [], pop = app.sfx.pop.bind(app.sfx);
    app.sfx.pop = (...args) => { pops.push(args); pop(...args); };
    try {
      const run = game.run, pl = game.player, tycho = planet.landmarks.list.find((l) => l.name === 'Tycho');
      assert.equal(run.cargo, null);
      assert.equal(run.target(pl.up).text, 'Collect the 🪨 Moon rock at Tycho');
      pl.up.copy(planet.cities.sites.find((s) => s.c.angleTo(tycho.d) > 0.1).c);
      pl.alt = planet.surfR(pl.up) + 1;
      run.update(0.01);
      run.deliver();
      assert.equal(run.tally.deliveries, 0);
      assert.equal(run.collected, false);
      pl.up.copy(tycho.d);
      pl.alt = planet.surfR(tycho.d) + 4;
      run.update(0.01);
      assert.equal(run.collected, false, 'a high pass picked up the parcel');
      pl.alt = planet.surfR(tycho.d) + 1;
      run.update(0.01);
      assert.equal(run.collected, true);
      assert.equal(pops.at(-1)[1], 'GOT IT!');
      assert.equal(pops.at(-1)[3], 'ring');
      assert.equal(run.tally.deliveries, 0);
      assert.ok(planet.cities.sites.includes(run.dest), 'the collected parcel has no town destination');
      pl.up.copy(run.dest.c);
      pl.alt = planet.surfR(pl.up) + 1;
      run.update(0.01);
      assert.ok(game.over);
      assert.equal(run.tally.deliveries, 1);
      assert.match(game.results.dom.title.textContent, /complete/);
    } finally { game.stop(); planet.dispose(); }
  });

  it('a fetched fragile parcel can only break after it has been collected', async () => {
    const { app, planet } = await makeWorld({ world: 'moon' }), game = app.game;
    game.start({ mission: trial('test-fragile-fetch', 'moon', { fetch: 'Tycho', carry: 'fragile', failIf: 'broken' }) });
    try {
      const run = game.run, pl = game.player;
      run.crashed();
      run.checkEnd();
      assert.equal(run.tally.broken, 0);
      assert.ok(!game.over, 'an uncollected parcel broke');
      pl.up.copy(run.fetchSpot.c);
      pl.alt = planet.surfR(pl.up) + 1;
      run.update(0.01);
      assert.equal(run.cargo.id, 'fragile');
      run.crashed();
      run.checkEnd();
      assert.equal(run.tally.broken, 1);
      assert.ok(game.over);
      assert.match(game.results.dom.result.innerHTML, /fragile parcel broke/);
    } finally { game.stop(); planet.dispose(); }
  });

  it('sunny missions choose daylight towns and count seconds in Mercury sunshine', async () => {
    const { app, planet } = await makeWorld({ world: 'mercury' }), game = app.game;
    game.start({ mission: trial('test-sunny', 'mercury', { sunny: true }) });
    try {
      const run = game.run;
      for (let i = 0; i < 4; i++) {
        const light = planet.cities.sites.filter((s) => s !== run.from && planet.nightAt(s.c) < 0.5);
        if (light.length) assert.ok(planet.nightAt(run.dest.c) < 0.5, 'a parcel was sent into darkness');
        run.deliver();
      }
      game.player.up.copy(run.from.c);
      game.hazards.hot = true;
      run.update(2.25);
      assert.equal(run.tally.sun, 2.25);
      game.hazards.hot = false;
      run.update(0.25);
      assert.equal(run.tally.sun, 2.25);
    } finally { game.stop(); planet.dispose(); }
  });

  it('Rex starts and levels up on real-world rival missions, including a specified starting level', async () => {
    const { app, planet } = await makeWorld({ world: 'moon' }), game = app.game;
    try {
      for (const level of [0, 6]) {
        game.start({ mission: trial(`test-rival-${level}`, 'moon', { rival: true, rexLevel: level }) });
        const run = game.run;
        assert.ok(run.rival);
        assert.ok(Math.abs(run.rival.plane.stats.speed - (0.8 + 0.03 * level)) < 1e-8);
        run.deliver();
        assert.ok(Math.abs(run.rival.plane.stats.speed - (0.8 + 0.03 * (level + 1))) < 1e-8);
        game.stop();
      }
    } finally { game.stop(); planet.dispose(); }
  });

  it('a stolen parcel ends a mission with its reason and increments the stolen counter', async () => {
    const { app, planet } = await makeWorld({ world: 'moon' }), game = app.game;
    game.start({ mission: trial('test-stolen', 'moon', { rival: true, failIf: 'stolen' }) });
    try {
      const run = game.run;
      run.steal();
      run.checkEnd();
      assert.equal(run.tally.stolen, 1);
      assert.ok(game.over);
      assert.match(game.results.dom.result.innerHTML, /😈 Rex stole a parcel\./);
    } finally { game.stop(); planet.dispose(); }
  });

  it('combo goals count the highest combo and ash progress shows whole seconds', async () => {
    const { app, planet } = await makeWorld({ world: 'moon' }), game = app.game;
    try {
      game.start({ mission: trial('test-combo', 'moon', { goal: { stat: 'combo', target: 3 } }) });
      const run = game.run;
      run.deliver();
      run.deliver();
      assert.equal(run.tally.combo, 3);
      run.crashed();
      assert.equal(run.combo, 1);
      assert.equal(run.tally.combo, 3, 'a knock lost the best combo');
      run.checkEnd();
      assert.ok(game.over);
      assert.match(game.results.dom.title.textContent, /complete/);
      game.stop();
      game.start({ mission: trial('test-ash-goal', 'moon', { goal: { stat: 'ash', target: 3 } }) });
      game.run.inAsh(2.9);
      assert.deepEqual(game.run.progress(), { have: 2, need: 3, text: '2 / 3 s in the plume' });
      game.run.inAsh(0.2);
      game.run.checkEnd();
      assert.ok(game.over);
      assert.match(game.results.dom.title.textContent, /complete/);
    } finally { game.stop(); planet.dispose(); }
  });

  it('a ground crash, lightning and ice each add one knock, and only ground crashes add crashes', async () => {
    const { app, planet } = await makeWorld({ world: 'moon' }), game = app.game;
    game.start({ mission: trial('test-knocks', 'moon') });
    try {
      const run = game.run;
      run.cargo = { ...run.cargo, fragile: true };
      run.crashed();
      assert.equal(run.tally.crashes, 1, 'the crash that broke the parcel was lost');
      assert.equal(run.tally.broken, 1);
      run.zapped();
      run.iced();
      assert.equal(run.tally.knocks, 3);
      assert.equal(run.tally.crashes, 1, 'ring ice counted as a ground crash');
      assert.equal(run.tally.ice, 1);
      assert.equal(run.tally.zaps, 1);
      run.crashed();
      assert.equal(run.tally.crashes, 2);
      assert.equal(run.tally.knocks, 4);
      assert.equal(run.tally.broken, 1, 'the same parcel broke twice');
    } finally { game.stop(); planet.dispose(); }
  });

  it('a full Hexagon loop counts without unlocking a trophy', async () => {
    const { app, planet } = await makeWorld({ world: 'saturn' }), game = app.game;
    game.start({ mission: trial('test-hexagon', 'saturn', { goal: { stat: 'loops', target: 1 } }) });
    try {
      const run = game.run, pl = game.player, storm = game.feats.storm, trophies = app.unlocked.length;
      assert.equal(storm.name, 'The Hexagon');
      assert.equal(storm.trophy, true);
      const [u, v] = storm.basis, r = 0.25;
      for (let i = 0; i <= 160; i++) {
        const a = (Math.PI * 2 + 0.02) * i / 160;
        pl.up.copy(storm.d).multiplyScalar(Math.cos(r))
          .addScaledVector(u, Math.sin(r) * Math.cos(a)).addScaledVector(v, Math.sin(r) * Math.sin(a));
        game.feats.circle(pl);
      }
      assert.equal(run.tally.loops, 1);
      assert.equal(app.unlocked.length, trophies);
      assert.equal(worldOf('neptune').landmarks.find((l) => l.name === 'The Great Dark Spot').loop, true);
    } finally { game.stop(); planet.dispose(); }
  });
});
