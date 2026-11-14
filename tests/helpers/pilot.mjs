import * as THREE from 'three';
import { tangentBasis, smallCircle } from '../../js/core/Geo.js';
import { mulberry32 } from '../../js/core/Noise.js';
import { dailySeed } from '../../js/game/Daily.js';
import { makeWorld } from './world.mjs';

/** A reproducible world, including the UFO and eruption timers created with ambient randomness. */
export async function makePilotWorld(def) {
  const random = Math.random;
  Math.random = mulberry32(dailySeed(`pilot-world:${def.id}`));
  try { return await makeWorld(def.planet); }
  finally { Math.random = random; }
}

/** The goals that need their own flight rather than the parcel-route pilot. */
export const SCRIPTED_GOALS = new Set(['rings', 'refuels', 'ufo', 'loops', 'threads', 'ash', 'combo']);

export const canFly = (def) => !SCRIPTED_GOALS.has(def.goal.stat);

/** Stock-plane reference pilot: follow the run's arrow, diving near its target. */
export function steerPilot(game) {
  const pl = game.player, aim = game.run.target(pl.up)?.c ?? game.run.destPoint();
  pl.steerToward(aim, 1.5);
  pl.input.boost = pl.up.angleTo(aim) > 0.3 && pl.boost > 0.3;
}

/** Fly a live run with its real world, hazards, clock and scoring. A null pilot leaves every control idle. */
export function fly(app, { pilot = steerPilot, limit = 300, dt = 1 / 20 } = {}) {
  const g = app.game, run = g.run;
  let elapsed = 0;
  while (!g.over && elapsed < limit) {
    pilot?.(g, elapsed, dt);
    app.simTime += dt;
    app.sky.update(dt);
    app.planet.update(dt, app.simTime);
    g.update(dt);
    elapsed += dt;
  }
  return { elapsed: run.missionElapsed ?? elapsed, won: g.over && run.check() === 'done', over: g.over,
    tally: { ...run.tally }, remaining: run.time, score: run.score };
}

export function flyMission(app, def, options) {
  const random = Math.random;
  Math.random = mulberry32(dailySeed(`pilot:${def.id}`));
  try {
    app.game.start({ mission: def });
    return fly(app, options);
  } finally {
    app.game.stop();
    Math.random = random;
  }
}

const aim = new THREE.Vector3();
function altitude(pl, want) {
  pl.input.up = pl.alt < want - 0.06;
  pl.input.down = pl.alt > want + 0.06;
}
function steer(pl, target, want = null, boost = true) {
  pl.steerToward(target, 1.5);
  pl.input.boost = boost && pl.up.angleTo(target) > 0.3 && pl.boost > 0.3;
  if (want !== null) altitude(pl, want);
}

/** Controls for short demonstration flights through the actual game detectors. */
export function specialController(app, options = {}) {
  const game = app.game, run = game.run, pl = game.player;
  const stat = run.def.goal.stat;
  const state = { phase: 'approach', count: 0 };
  return function control() {
    if (stat === 'rings') {
      if (!state.ring || run.tally.rings !== state.count) {
        state.count = run.tally.rings;
        state.ring = game.props.rings.reduce((a,b)=>a.position.distanceTo(pl.pos)<b.position.distanceTo(pl.pos)?a:b);
        state.escape = false;
      }
      const ring = state.ring, target = aim.copy(ring.position).normalize(), distance = pl.up.angleTo(target);
      if (distance < 0.14 && pl.fwd.dot(target) < 0) state.escape = true;
      if (distance > 0.23) state.escape = false;
      if (state.escape) {
        pl.input.left = false; pl.input.right = false; pl.input.boost = false;
        altitude(pl,ring.position.length());
      } else steer(pl, target, distance<0.35 ? ring.position.length() : null);
      return;
    }
    if (stat === 'ufo') {
      const ufo = game.planet.ufo;
      if (ufo.state === 'arrive' || ufo.hovering) steer(pl, aim.copy(ufo.at).normalize(), ufo.at.length());
      else steer(pl, run.destPoint());
      return;
    }
    if (stat === 'refuels') {
      state.ap ??= game.planet.airports.list.reduce((a,b)=>a.c.angleTo(pl.up)<b.c.angleTo(pl.up)?a:b);
      const ap=state.ap;
      if (run.tally.refuels > state.count) {
        state.count=run.tally.refuels;
        state.phase='leave';
        state.exit=ap.c.clone().multiplyScalar(Math.cos(0.25)).addScaledVector(ap.fwd, Math.sin(0.25)*(pl.fwd.dot(ap.fwd)>0?1:-1));
      }
      if (state.phase==='leave' && pl.up.angleTo(ap.c)>0.2) state.phase='approach';
      const to=state.phase==='leave'?state.exit:ap.c;
      steer(pl,to, pl.up.angleTo(ap.c)<0.35 ? ap.top+0.45 : null, false);
      return;
    }
    if (stat === 'loops') {
      const storm=game.feats.storm, [u,v]=storm.basis;
      state.phi ??= Math.atan2(pl.up.dot(v),pl.up.dot(u));
      if (state.phase==='approach') {
        smallCircle(aim,storm.d,u,v,0.32,state.phi);
        if (pl.up.angleTo(aim)<0.07) state.phase='circle';
      }
      if (state.phase==='circle') {
        const phi=Math.atan2(pl.up.dot(v),pl.up.dot(u));
        smallCircle(aim,storm.d,u,v,0.32,phi+0.55);
      }
      steer(pl,aim,null,false);
      return;
    }
    if (stat === 'ash') {
      state.volcano ??= game.planet.volcanoes.filter(v=>v.d).reduce((a,b)=>a.d.angleTo(pl.up)<b.d.angleTo(pl.up)?a:b);
      const volcano=state.volcano;
      const [u,v]=state.basis ??= tangentBasis(volcano.d);
      const phi=Math.atan2(pl.up.dot(v),pl.up.dot(u));
      smallCircle(aim,volcano.d,u,v,0.055,phi+0.85);
      steer(pl,aim,volcano.top.length()+2.5,false);
      return;
    }
    if (stat==='threads') {
      const rings=game.planet.rings, axis=rings.axis;
      state.equator ??= pl.up.clone().addScaledVector(axis,-pl.up.dot(axis)).normalize().applyAxisAngle(axis, options.threadOffset ?? Math.PI / 8);
      state.sign ??= -(Math.sign(pl.up.dot(axis)) || 1);
      if (pl.up.dot(axis)*state.sign>0.17) state.sign*=-1;
      aim.copy(state.equator).multiplyScalar(Math.cos(0.22)).addScaledVector(axis,Math.sin(0.22)*state.sign);
      steer(pl,aim,rings.inner+(options.threadHeight ?? 1.2),false);
      return;
    }
    if (stat === 'combo') {
      const target = run.destPoint();
      steer(pl, target);
      // Save the last burst for the swoop to keep each delivery inside its combo window.
      pl.input.boost = pl.up.angleTo(target) > 0.15 && pl.boost > 0.15;
      return;
    }
    steer(pl,run.target(pl.up)?.c??run.destPoint());
  };
}

/** A per-attempt pilot for the mission kinds that need a scripted flight. */
export function scriptedPilot(def) {
  if (!['rings', 'refuels', 'ufo', 'loops', 'threads', 'ash', 'combo'].includes(def.goal.stat)) throw new Error(`No scripted flight for ${def.id}`);
  let previous, control;
  return (game) => {
    if (previous !== game.run) {
      previous = game.run;
      control = specialController(game.app);
    }
    control();
  };
}
