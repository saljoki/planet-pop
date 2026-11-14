// Phones, upright and on their side.
// One of the screenshot run's scene files (see ../screenshots.mjs); the helpers are described in ../harness.mjs.
import { PLANET } from '../harness.mjs';
import { careerFits, stageRankUp, stageTrophy } from './courier.mjs';

async function phoneSize(page, until, width, height) {
  await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: width > height });
  await until(() => window.app?.planet && !app.building, 240000);
  await page.evaluate(() => app.start.dismiss());
}

export default async function phone({ page, frames, until, scene, open, ufoHere, problems }) {
  await scene('mobile', 'Phone-sized screen (390 × 844) with the ?debug stats overlay', async () => {
    await page.evaluate(() => app.game.stop());
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await open(`${PLANET}&debug`);
    await frames(4);
  });
  await scene('mobile-start', 'Phone: PLAY within a thumb’s reach, over the planet', async () => {
    await page.evaluate(() => app.start.show());
    await frames(2);
  });
  await page.evaluate(() => app.start.dismiss());
  await scene('mobile-home', 'Phone: next-up and all six Home cards without scrolling', async () => {
    await phoneSize(page, until, 390, 844);
    await page.evaluate(() => app.game.openHome());
    await frames(2);
    await careerFits(page, '#home');
  });
  await page.evaluate(() => app.game.home.hide());
  for (const [width, height] of [[390, 844], [360, 780]]) {
    if (width === 360) await scene('mobile-home-360', 'Small phone: Home and every card without scrolling', async () => {
      await phoneSize(page, until, width, height);
      await page.evaluate(() => app.game.openHome());
      await frames(2);
      await careerFits(page, '#home');
    });
    await scene(`mobile-trophy-pay-${width}`, `Phone (${width} × ${height}): a trophy's payout toast`, async () => {
      await phoneSize(page, until, width, height);
      await stageTrophy(page);
      await frames(1);
    });
    await page.evaluate(() => document.querySelector('#toasts [data-career-toast]')?.remove());
    await scene(`mobile-pilot-card-${width}`, `Phone (${width} × ${height}): the pilot card`, async () => {
      await phoneSize(page, until, width, height);
      await page.evaluate(() => { app.game.home.hide(); app.game.pilot.show(); });
      await frames(2);
      await careerFits(page, '#pilot');
    });
    await page.evaluate(() => app.game.pilot.hide());
    await scene(`mobile-rank-up-${width}`, `Phone (${width} × ${height}): three news lines and all results buttons`, async () => {
      await phoneSize(page, until, width, height);
      await stageRankUp(page);
      await frames(2);
      await careerFits(page, '#gOver');
    });
    await page.evaluate(() => { app.game.stop(); app.game.home.hide(); });
  }
  await phoneSize(page, until, 390, 844);
  await scene('mobile-sheet', 'Phone: the controls slide up from the bottom as a sheet', async () => {
    await page.evaluate(() => document.getElementById('panelToggle').click());
    await frames(2);
  });
  await scene('mobile-find', 'Phone: the Find sheet', async () => {
    await ufoHere();
    await page.evaluate(() => app.find.show());
    await frames(2);
  });
  await scene('mobile-info', 'Phone: press and hold on something for its info card', async () => {
    await page.evaluate(() => { app.find.hide(); app.rig.focus(app.planet.entities.find((e) => e.kind === 'train')); });
    await until(() => app.rig.mode === 'local');
    await page.evaluate(() => app.hud.info.show(app.planet.entities.find((e) => e.kind === 'train')));
    await frames(3);
  });
  await scene('mobile-tour', 'Phone: tour mode', async () => {
    await ufoHere();
    await page.evaluate(() => { app.hud.info.hide(); app.tour.start(); });
    await until(() => app.rig.mode === 'local');
    await frames(3);
  });
  await page.evaluate(() => app.tour.stop());
  await scene('mobile-lesson', 'Phone: the flying coach clears a thumb on the stick and BOOST', async () => {
    await page.evaluate(() => app.game.start({ lesson: true }));
    await until(() => app.rig.mode === 'game');
    await page.touchscreen.touchStart(110, 640);
    await page.touchscreen.touchMove(150, 600);
    await frames(4);
  });
  await page.touchscreen.touchEnd().catch(() => {});
  await scene('mobile-lesson-deliver', 'Phone: the delivery prompt, arrow and buttons stay clear of each other', async () => {
    await page.evaluate(() => { app.game.run.enter(4); app.game.hud.update(); });
    await frames(2);
  });
  await page.evaluate(() => app.game.stop());
  await scene('mobile-courier', 'Daily challenge on a phone, a thumb on the stick', async () => {
    await page.evaluate(() => { app.game.start({ daily: true }); app.game.run.deliver(); });
    await until(() => app.rig.mode === 'game');
    await page.touchscreen.touchStart(110, 640);
    await page.touchscreen.touchMove(150, 600);
    await frames(6);
  });
  await page.touchscreen.touchEnd().catch(() => {}); // (nothing to lift if that scene was filtered out)
  for (const [width, height] of [[390, 844], [360, 780]]) {
    await scene(`mobile-courier-badges-${width}`, `Phone (${width} × ${height}): a long mission badge, five-digit score and four-digit coins fit`, async () => {
      await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await page.evaluate(async () => {
        const { MISSIONS } = await import('./js/game/Missions.js');
        app.game.stop();
        app.game.start({ mission: MISSIONS.find((m) => m.id === 'rings') });
        app.paused = true; // Keep the staged badge values while the browser renders.
        app.game.hud.update();
        const d = app.game.hud.dom;
        d.mission.textContent = '🎯 0 / 3 through the ring · ⭐ 20s';
        d.score.textContent = '⭐ 99999';
        d.time.textContent = '⏱ 120';
        d.combo.textContent = '🔥 x5';
        d.coins.textContent = '🪙 9999';
        d.arrow.style.transform = 'rotate(45deg)'; // Its largest bounds must still clear the badge row.
      });
      await until(() => app.rig.mode === 'game');
      await frames(2);
      await page.evaluate(() => {
        const badges = [...document.querySelectorAll('#gStats .badge:not(.hidden)')];
        const controls = ['gArrow', 'gGoal', 'gMapBtn', 'gPauseBtn'].map((id) => document.getElementById(id));
        for (const badge of badges) {
          const r = badge.getBoundingClientRect();
          // Include the badge's 4 px shadow in the visible bounds and clearance checks.
          if (r.left < 0 || r.right + 4 > innerWidth || r.top < 0 || r.bottom + 4 > innerHeight)
            throw new Error(`${badge.id} is clipped at ${innerWidth} px`);
          if (badge.scrollWidth > badge.clientWidth) throw new Error(`${badge.id} text overflows at ${innerWidth} px`);
          for (const control of controls) {
            if (getComputedStyle(control).display === 'none') continue;
            const c = control.getBoundingClientRect();
            if (r.left < c.right && r.right + 4 > c.left && r.top < c.bottom && r.bottom + 4 > c.top)
              throw new Error(`${badge.id} overlaps ${control.id} at ${innerWidth} px`);
          }
        }
      });
    });
  }
  await page.evaluate(() => { app.paused = false; });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await scene('mobile-briefing', 'Phone: short briefing with Start visible and How to play closed', async () => {
    await page.evaluate(async () => {
      const { MISSIONS } = await import('./js/game/Missions.js'); // (the page was reloaded at phone size)
      app.game.stop();
      app.game.launch({ mission: MISSIONS.find((m) => m.id === 'rings') });
    });
    await until(() => app.game.briefing.open);
    await frames(2);
  });
  await page.evaluate(() => app.game.briefing.hide());
  await scene('mobile-drive', 'Driving on a phone: the speedometer above the BOOST button, the mini-map above that', async () => {
    await page.evaluate(() => {
      const g = app.game;
      g.stop();
      g.start({ drive: 'car' });
      const pl = g.player, town = app.planet.cities.sites.find((s) => pl.ground.roadAt(s.c)), spot = pl.ground.parking(town);
      pl.respawn(spot.at, spot.heading);
      pl.input.up = true;
      for (let i = 0; i < 60; i++) g.update(1 / 30);
    });
    await until(() => app.rig.mode === 'game');
    await frames(5);
  });
  await scene('mobile-free', 'Free flight on a phone', async () => {
    await page.evaluate(() => { app.game.stop(); app.game.start({ free: true }); });
    await until(() => app.rig.mode === 'game');
    await frames(5);
  });
  await scene('mobile-pause', 'Pause menu on a phone', async () => {
    await page.evaluate(() => app.togglePause());
    await frames(2);
  });
  if (await page.evaluate(() => app.game.pauseMenu.open)) { // (only if that scene ran)
    await page.tap('#pResume');
    if (await page.evaluate(() => app.paused)) problems.push('mobile-pause: tapping Resume did not resume');
  }
  await page.evaluate(() => { if (app.paused) app.togglePause(); });
  await scene('landscape-courier', 'Phone on its side, flying', async () => {
    await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
    await frames(5);
  });
  await scene('landscape-briefing', 'Phone on its side: the longest mission goal, with Start visible', async () => {
    await page.evaluate(async () => {
      const { MISSIONS } = await import('./js/game/Missions.js');
      const longest = MISSIONS.reduce((a, b) => a.brief.length > b.brief.length ? a : b);
      app.game.stop();
      app.game.launch({ mission: longest });
    });
    await until(() => app.game.briefing.open);
    const visible = await page.$eval('#bStart', (el) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
    });
    if (!visible) throw new Error('Start is outside the landscape viewport');
    await frames(2);
  });
  await page.evaluate(() => app.game.briefing.hide());
  await scene('landscape-lesson', 'Phone on its side: the coach clears the map, arrow, buttons and thumb', async () => {
    await page.evaluate(() => { app.game.stop(); app.game.start({ lesson: true }); app.game.run.enter(4); app.game.hud.update(); });
    await until(() => app.rig.mode === 'game');
    await page.touchscreen.touchStart(110, 270);
    await page.touchscreen.touchMove(145, 250);
    await frames(3);
  });
  await page.touchscreen.touchEnd().catch(() => {});
  await page.evaluate(() => app.game.stop());
  await scene('landscape-start', 'Phone on its side: the start screen and reachable PLAY', async () => {
    await page.evaluate(() => { app.game.stop(); app.start.show(); });
    await frames(2);
  });
  await page.evaluate(() => app.start.dismiss());
  await scene('landscape-home', 'Phone on its side: next-up and all six Home cards', async () => {
    await phoneSize(page, until, 844, 390);
    await page.evaluate(() => { app.game.stop(); app.game.openHome(); });
    await frames(2);
    await careerFits(page, '#home');
    const gap = await page.evaluate(() => document.getElementById('hoNext').getBoundingClientRect().top
      - document.getElementById('hoPilot').getBoundingClientRect().bottom);
    // The name button casts a 3 px shadow: leave at least 4 px clear below it.
    if (gap < 7) throw new Error(`Home's name button needs a clear 4 px gap; measured ${gap - 3} px`);
  });
  await page.evaluate(() => app.game.home.hide());
  await scene('landscape-trophy-pay', 'Phone on its side: a trophy payout toast', async () => {
    await phoneSize(page, until, 844, 390);
    await stageTrophy(page);
    await frames(1);
  });
  await page.evaluate(() => document.querySelector('#toasts [data-career-toast]')?.remove());
  await scene('landscape-pilot-card', 'Phone on its side: the pilot card and every control', async () => {
    await phoneSize(page, until, 844, 390);
    await page.evaluate(() => app.game.pilot.show());
    await frames(2);
    await careerFits(page, '#pilot');
  });
  await page.evaluate(() => { app.game.pilot.hide(); app.game.home.hide(); });
  await scene('landscape-rank-up', 'Phone on its side: three news lines and all results buttons', async () => {
    await phoneSize(page, until, 844, 390);
    await stageRankUp(page);
    await frames(2);
    await careerFits(page, '#gOver');
  });
  await page.evaluate(() => app.game.stop());
  await scene('landscape-panel', 'Phone on its side: the controls come in from the right', async () => {
    await page.evaluate(() => { app.game.stop(); document.getElementById('panel').classList.remove('hidden'); });
    await until(() => app.rig.mode === 'orbit');
    await frames(3);
  });
}
