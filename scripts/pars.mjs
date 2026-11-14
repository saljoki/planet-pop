// Fly the stock plane through every mission and print the measurement behind its par time.
import { makePilotWorld, canFly, flyMission, scriptedPilot } from '../tests/helpers/pilot.mjs';
import { MISSIONS } from '../js/game/Missions.js';

const EASY = new Set(['school', 'earth', 'moon', 'mars']);
const MIDDLE = new Set(['venus', 'mercury', 'jupiter', 'io', 'europa', 'ganymede']);
const factorFor = (def) => EASY.has(def.planet.world ?? 'school') ? 1.6 : MIDDLE.has(def.planet.world) ? 1.45 : 1.3;
const rows = [];
for (const def of MISSIONS) {
  localStorage.clear();
  const { app, planet } = await makePilotWorld(def);
  try {
    const source = canFly(def) ? 'reference' : `scripted ${def.goal.stat}`;
    const flight = flyMission(app, def, canFly(def) ? undefined : { pilot: scriptedPilot(def) });
    if (!flight.won) throw new Error(`${def.id}: ${source} failed after ${flight.elapsed.toFixed(2)} s (${JSON.stringify(flight.tally)})`);
    const par = Math.max(20, Math.min(240, Math.ceil((flight.elapsed * factorFor(def)) / 5) * 5));
    rows.push({ id: def.id, source, seconds: Number(flight.elapsed.toFixed(2)), factor: factorFor(def), par });
    process.stderr.write(`${def.id}: ${flight.elapsed.toFixed(2)} s\n`);
  } finally { app.game.stop(); planet.dispose(); }
}
if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
else {
  console.log('| Mission | Source | Flight (s) | Factor | Par (s) |');
  console.log('|---|---|---:|---:|---:|');
  rows.forEach((r) => console.log(`| ${r.id} | ${r.source} | ${r.seconds.toFixed(2)} | ${r.factor} | ${r.par} |`));
}
