// Sky Courier: the hangar, the briefing and Options, runs of every kind, the pause menu.
// One of the screenshot run's scene files (see ../screenshots.mjs); the helpers are described in ../harness.mjs.

export default async function courier({ page, frames, until, scene }) {
  await scene('hangar', 'Sky Courier hangar, with the player\'s name at the top', async () => {
    await page.evaluate(() => { app.rig.release(true); app.game.progress.addCoins(400); app.game.openHangar(); });
    await frames(3);
  });
  await scene('briefing', 'The briefing before a courier run: the goal, tips and the controls for this device', async () => {
    await page.click('#hGo'); // a real click from the hangar
    await until(() => app.game.briefing.open);
    await frames(2);
  });
  await scene('options', 'Options: Invert Y, steering sensitivity, sound, briefing, reset progress', async () => {
    await page.click('#bOptions');
    await until(() => app.game.options.open);
    await page.click('#oInvert'); // Jordan's favourite
    if (!(await page.evaluate(() => app.settings.get('invertY')))) throw new Error('Invert Y did not switch on');
    await frames(2);
  });
  await scene('briefing-inverted', 'Back on the briefing: the controls now say up dives', async () => {
    await page.click('#oDone');
    await until(() => !app.game.options.open && app.game.briefing.open);
    const text = await page.evaluate(() => document.getElementById('bControls').textContent);
    if (!/up to dive/.test(text)) throw new Error(`controls not updated for Invert Y: ${text}`);
    await page.evaluate(() => app.settings.set('invertY', false));
    await frames(1);
  });
  await scene('courier', 'Sky Courier in flight, with the player\'s name over the plane', async () => {
    await page.click('#bStart').catch(() => {}); // Start on the briefing (if that scene ran)
    await page.evaluate(() => { app.game.hangar.hide(); app.game.start(); });
    await until(() => app.rig.mode === 'game');
    await frames(4);
  });
  await scene('lightning', 'Lightning striking the plane inside a thundercloud', async () => {
    await page.evaluate(() => { // pause the world, park the plane in a storm, let the chase camera catch up
      app.togglePause();
      const { planet, game } = app, storm = planet.weather.storms[0], pl = game.player;
      const c = planet.weather.stormCenter(storm, pl.pos.clone());
      pl.up.copy(c).normalize();
      pl.alt = c.length() - 0.3;
      pl.fwd.copy(storm.u).addScaledVector(pl.up, -storm.u.dot(pl.up)).normalize();
      pl.sync();
    });
    await frames(12);
    await page.evaluate(() => {
      const { planet, game } = app;
      planet.weather.strike(planet.weather.storms[0], game.player.pos.clone());
      planet.weather.boltT = 0.33; // a visible moment of the flicker; paused, so it stays
      planet.weather.bolt.visible = true;
    });
    await frames(2);
  });
  await scene('rival', 'Rival Rex racing just ahead, with his name tag', async () => {
    await page.evaluate(() => { // still paused: one delivery spawns Rex, then park him ahead and to the left
      const { game, planet } = app, pl = game.player;
      game.run.deliver();
      pl.up.copy(game.run.from.c); // out of the storm: just took off from the city we delivered to
      pl.alt = planet.groundR(pl.up) + 1.8;
      pl.fwd.copy(game.run.dest.c).addScaledVector(pl.up, -game.run.dest.c.dot(pl.up)).normalize();
      pl.sync();
      const rex = game.run.rival.plane, left = pl.up.clone().cross(pl.fwd).normalize();
      rex.up.copy(pl.up).applyAxisAngle(left, 0.1).addScaledVector(left, 0.02).normalize(); // +angle about left = forward
      rex.fwd.copy(pl.fwd).addScaledVector(rex.up, -pl.fwd.dot(rex.up)).normalize();
      rex.alt = pl.alt + 0.15;
      rex.sync();
      game.hud.update();
    });
    await frames(12); // let the chase camera settle, then pin the name tag (paused, so the game loop doesn't)
    await page.evaluate(() => app.game.run.rival.placeTag());
    await frames(2);
  });
  await scene('daily-over', 'End of a daily challenge run, with the share button', async () => {
    await page.evaluate(() => {
      const { game } = app;
      game.stop();
      game.start({ daily: true });
      game.run.deliver();
      game.run.deliver();
      game.run.time = 0.01; // start() already unpaused the world
    });
    await until(() => app.game.over);
    await frames(2);
  });
  const missionParams = await page.evaluate(() => ({ ...app.params }));
  const missionViewport = page.viewport();
  const missionDefs = () => page.evaluate(async () => { window.MISSIONS = (await import('./js/game/Missions.js')).MISSIONS; });
  const missionStart = async (id) => {
    await missionDefs();
    await page.evaluate(async (id) => {
      const g = app.game, def = MISSIONS.find((m) => m.id === id);
      if (!def) throw new Error(`No mission named ${id}`);
      g.stop();
      g.hangar.hide();
      g.board.hide();
      g.briefing.hide();
      g.options.hide();
      g.results.hide();
      if (app.paused) app.togglePause();
      await g.startMission(def); // build the mission's own world, even in a filtered screenshot run
      if (g.briefing.open) g.briefing.start();
      if (!g.active || g.run.def?.id !== id) throw new Error(`Mission ${id} did not start`);
      app.togglePause(); // let the camera settle without visits, pickups or clock ticks
      g.pauseMenu.hide();
      g.hud.update();
    }, id);
    await until(() => app.rig.mode === 'game');
  };
  const missionStars = async () => {
    await missionDefs();
    await page.evaluate(() => {
      const p = app.game.progress;
      p.reset();
      p.completeMission(MISSIONS[0]); // one legacy star, then two for Rush Hour open Earth at three
    });
    await missionStart('rush');
    await page.evaluate(() => {
      const g = app.game, run = g.run;
      run.missionElapsed = Math.max(0, run.def.par - 5);
      run.tally[run.def.goal.stat] = run.def.goal.target;
      run.tally.knocks = 1;
      run.endMission('done');
      const card = g.results.dom.result.textContent;
      if (!card.includes('⭐⭐☆') || !card.includes('🔓 Earth is open!')) throw new Error(`Missing two-star chapter result: ${card}`);
      if (g.progress.starsFor('rush') !== 2 || g.progress.totalStars !== 3) throw new Error('Unexpected stars in the results fixture');
    });
    await frames(4);
  };
  await scene('missions', 'The mission board, with the first mission done', async () => {
    await missionDefs();
    await page.evaluate(() => { app.game.stop(); app.game.hangar.hide(); app.game.progress.completeMission(MISSIONS[0]); app.game.board.show(); });
    await frames(2);
  });
  await scene('mission-hud', 'Flying a mission: the goal next to the score, the arrow pointing at a runway', async () => {
    await page.evaluate(() => { app.game.board.hide(); app.game.start({ mission: MISSIONS.find((m) => m.id === 'pitstop') }); });
    await until(() => app.rig.mode === 'game');
    await frames(4);
  });
  await scene('mission-complete', 'Mission complete, with the reward and the next mission', async () => {
    await page.evaluate(() => {
      const g = app.game;
      g.stop();
      g.progress.missions.delete('rush');
      g.start({ mission: MISSIONS.find((m) => m.id === 'rush') });
      g.run.tally.urgent = 2; // as if two urgent parcels just went out
      g.update(1 / 60);
    });
    await until(() => app.game.over);
    await frames(2);
  });
  await scene('mission-tour', 'Earth photo tour: the arrow points at the next landmark to photograph', async () => {
    await missionStart('wonders');
    await frames(8);
    await page.evaluate(() => {
      const g = app.game, run = g.run, aim = run.target(g.player.up);
      if (app.planet.world?.id !== 'earth' || run.tally.visits !== 0 || !aim) throw new Error('Earth photo tour was not staged');
      if (!run.def.tour.some((name) => aim.text.includes(name))) throw new Error(`Tour arrow missed its landmark: ${aim.text}`);
      if (!g.hud.hasGoal || !g.hud.dom.goal.textContent.includes('📷 Photo')) throw new Error('Photo goal or arrow is missing');
    });
  });
  await scene('mission-fetch', 'Moon Rock: fly to Tycho to collect the parcel before delivering it', async () => {
    await missionStart('moonrock');
    await frames(8);
    await page.evaluate(() => {
      const g = app.game, run = g.run, goal = g.hud.dom.goal.textContent;
      if (app.planet.world?.id !== 'moon' || run.collected || run.cargo !== null) throw new Error('Moon rock was already collected');
      if (!/Collect the.*Moon rock at Tycho/.test(goal) || !g.hud.hasGoal) throw new Error(`Pickup goal or arrow is missing: ${goal}`);
    });
  });
  await scene('mission-stars', 'Two mission stars, each goal checked, and Earth opening at three total stars', missionStars);
  await scene('mission-stars-phone', 'Two-star mission results and the new chapter at 390 × 844', async () => {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await missionStars();
    await page.evaluate(() => {
      const box = app.game.results.el.querySelector('.panel').getBoundingClientRect();
      if (box.left < 0 || box.right > innerWidth || box.top < 0 || box.bottom > innerHeight) throw new Error('Mission result card is outside the phone viewport');
    });
  });
  await page.setViewport(missionViewport);
  await page.evaluate(async (params) => {
    const g = app.game;
    g.stop();
    g.board.hide();
    g.briefing.hide();
    g.results.hide();
    if (app.paused) app.togglePause();
    const changed = ['seed', 'land', 'cities', 'theme', 'world'].some((key) => app.params[key] !== params[key]);
    if (changed) {
      Object.assign(app.params, params);
      await app.newPlanet(params.seed, false, params.theme, params.world ?? null);
    }
  }, missionParams);
  await scene('free-flight', 'Free flight: no clock or parcels, just the plane and the planet', async () => {
    await page.evaluate(() => { app.game.stop(); app.game.start({ free: true }); });
    await until(() => app.rig.mode === 'game');
    await frames(6);
  });
  await scene('pause-menu', 'The pause menu', async () => {
    await page.evaluate(() => app.togglePause());
    await frames(2);
  });
  await scene('pause-resume', 'Clicking Resume on the pause menu carries on flying', async () => {
    await page.click('#pResume'); // a real click: the menu sits inside the click-through game layer
    await frames(2);
    if (await page.evaluate(() => app.paused)) throw new Error('Resume did not respond to a click');
  });
  await page.evaluate(() => { if (app.paused) app.togglePause(); app.game.stop(); });
}
