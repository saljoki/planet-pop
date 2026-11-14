import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { makePilotWorld, canFly, flyMission, scriptedPilot } from './helpers/pilot.mjs';
import { MISSIONS } from '../js/game/Missions.js';

describe('stock-plane mission pilots', () => {
  beforeEach(() => localStorage.clear());

  for (const def of MISSIONS) {
    it(`${def.id}: ${canFly(def) ? 'the reference pilot' : 'a scripted flight'} finishes with the time star`, async () => {
      const { app, planet } = await makePilotWorld(def);
      try {
        const result = flyMission(app, def, canFly(def) ? undefined : { pilot: scriptedPilot(def) });
        assert.ok(result.won, `${def.id}: ${JSON.stringify(result)}`);
        assert.ok(result.elapsed <= def.par, `${def.id}: ${result.elapsed.toFixed(2)} s exceeds par ${def.par}`);
        assert.ok(result.remaining > 0, `${def.id}: finished after the clock ran out`);
        assert.ok(app.game.progress.missionDone(def.id));
        assert.ok(app.game.progress.starsFor(def.id) >= 2, `${def.id}: finish and time stars were not saved`);
      } finally { app.game.stop(); planet.dispose(); }
    });

    it(`${def.id}: idle controls earn no star`, async () => {
      const { app, planet } = await makePilotWorld(def);
      try {
        const result = flyMission(app, def, { pilot: null, limit: 3600 });
        assert.equal(result.over, true, `${def.id}: idle flight stayed live for an hour`);
        assert.equal(result.won, false, `${def.id}: idle flight completed the mission`);
        assert.equal(app.game.progress.starsFor(def.id), 0);
        assert.equal(app.game.progress.missionDone(def.id), false);
      } finally { app.game.stop(); planet.dispose(); }
    });
  }
});
