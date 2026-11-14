// Hangar and supplies: independent setup in every scene, including phone sizes.
export default async function hangar({ page, frames, until, scene }) {
  const viewport = page.viewport();
  const closeMenus = () => page.evaluate(() => {
    const g = app.game;
    g.stop();
    for (const key of ['home', 'hangar', 'briefing', 'options', 'board', 'roads', 'results', 'pauseMenu']) g[key].hide();
    app.start?.dismiss();
    document.querySelectorAll('.bubble').forEach((e) => e.remove());
    if (app.paused) app.togglePause();
  });
  const shop = async (section) => {
    await closeMenus();
    await page.evaluate((section) => {
      const g = app.game, p = g.progress;
      p.reset(); p.addCoins(50000); g.career = { rank: 30 };
      p.chooseCraft('swift', 30); p.chooseSkin('sky', app.achievements.done);
      for (const id of ['engine', 'engine', 'wings', 'wings', 'tank', 'clock', 'armour']) p.buy(id);
      g.openHangar(); g.hangar.openSection(section);
    }, section);
    await frames(2);
  };
  const briefing = async () => {
    await closeMenus();
    await page.evaluate(() => {
      const g = app.game;
      g.career = { rank: 13 }; g.progress.coins = 5000;
      g.briefing.show({});
    });
    for (const id of ['shield', 'tank', 'clock']) await page.click(`[data-supply="${id}"]`);
    await frames(2);
    await page.evaluate(() => {
      const g = app.game, panel = g.briefing.el.querySelector('.panel');
      panel.scrollTop = 0;
      const start = g.briefing.dom.start.getBoundingClientRect(), box = panel.getBoundingClientRect();
      if (start.top < Math.max(0, box.top) || start.bottom > Math.min(innerHeight, box.bottom) || start.left < 0 || start.right > innerWidth) throw new Error('Start is outside the visible briefing');
      if (panel.scrollHeight > panel.clientHeight + 1) throw new Error('The closed briefing needs scrolling');
      if (g.briefing.dom.supplies.classList.contains('hidden') || g.briefing.supplyCost !== 150) throw new Error('All three supplies are not selected');
    });
  };
  const flight = async (craft, trail, showTrail = false) => {
    await closeMenus();
    await page.evaluate(({ craft, trail, showTrail }) => {
      const g = app.game, p = g.progress;
      g.career = { rank: 30 }; p.coins = 50000; p.levels = {};
      p.chooseCraft(craft, 30); p.chooseTrail(trail);
      g.start();
      const pl = g.player;
      pl.alt = app.planet.groundR(pl.up) + 3; pl.invuln = Infinity; pl.input.boost = true;
      // Lay a real two-second trail before pausing, so software rendering cannot hide it between frames.
      for (let i = 0; i < 120; i++) g.update(1 / 60);
      pl.input.boost = false;
      if (showTrail) Object.defineProperty(pl, 'chase', { value: { back: 3.2, up: 1.5, ahead: -.4 } });
      app.togglePause(); g.pauseMenu.hide(); g.hud.update();
      if (g.run.craft.id !== craft || g.player.trail.mesh.count < 1) throw new Error('Craft or trail did not reach the live vehicle');
    }, { craft, trail, showTrail });
    await until(() => app.rig.mode === 'game');
    await frames(10);
  };
  for (const [id, title] of [['craft', 'Craft'], ['upgrades', 'Upgrades'], ['paint', 'Paint jobs'], ['trails', 'Trails']]) {
    await scene(`hangar-${id}`, `${title}: the hangar's four exclusive sections`, () => shop(id));
  }
  await scene('briefing-supplies', 'Three one-flight supplies selected, 150 coins at take-off', briefing);
  await scene('briefing-empty-wallet', 'An empty wallet explains why supplies cannot be selected', async () => {
    await closeMenus();
    await page.evaluate(() => {
      const g = app.game;
      g.career = { rank: 13 }; g.progress.coins = 0; g.briefing.show({});
      if (g.briefing.dom.supplyNote.textContent !== 'Not enough coins') throw new Error('Missing wallet explanation');
      if (![...g.briefing.dom.supplyButtons.querySelectorAll('button')].every((b) => b.disabled)) throw new Error('Unaffordable supply is enabled');
    });
    await frames(2);
  });
  for (const craft of ['swift', 'hummingbird', 'mule', 'bulldog', 'comet']) {
    await scene(`flight-craft-${craft}`, `${craft}: its silhouette from the chase camera`, () => flight(craft, 'classic'));
  }
  for (const trail of ['snow', 'candy', 'ember', 'aurora', 'stardust']) {
    await scene(`flight-trail-${trail}`, `${trail}: the selected colour, lifetime and growth in flight`, () => flight('classic', trail, true));
  }
  await scene('supply-shield', 'A bought shield absorbs a knock: SHIELD!, full health and combo intact', async () => {
    await flight('classic', 'classic');
    await closeMenus();
    await page.evaluate(() => {
      const g = app.game;
      g.progress.coins = 5000; g.career = { rank: 30 };
      g.briefing.show({}); g.briefing.toggleSupply('shield'); g.briefing.start(); g.player.invuln = Infinity;
    });
    await frames(24);
    await page.evaluate(() => {
      const g = app.game;
      app.togglePause(); g.pauseMenu.hide();
      g.run.combo = 4;
      g.player.damage(.25);
      const timeout = window.setTimeout;
      // Hold the real pop for its screenshot on slow software WebGL; restore the timer immediately.
      window.setTimeout = (fn, ms, ...args) => timeout(fn, ms === 1350 ? 30000 : ms, ...args);
      try { g.run.crashed(); } finally { window.setTimeout = timeout; }
      document.querySelectorAll('.bubble').forEach((e) => { e.style.animationPlayState = 'paused'; e.style.animationDelay = '-.4s'; });
      g.hud.update();
      if (g.player.health !== 1 || g.run.combo !== 4 || g.run.tally.knocks !== 0) throw new Error('Shield did not absorb the knock');
      if (![...document.querySelectorAll('.bubble')].some((e) => e.textContent === '🛡️ SHIELD!')) throw new Error('Shield pop is missing');
    });
    await frames(1);
  });
  await scene('mobile-hangar-craft', 'Every craft button is reachable at 390 × 844', async () => {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await shop('craft');
    await page.evaluate(() => {
      const panel = app.game.hangar.el.querySelector('.panel');
      for (const button of panel.querySelectorAll('[data-craft]')) {
        button.scrollIntoView({ block: 'center' });
        const r = button.getBoundingClientRect(), box = panel.getBoundingClientRect();
        if (r.left < 0 || r.right > innerWidth || r.top < box.top || r.bottom > box.bottom) throw new Error(`Craft button is unreachable: ${button.dataset.craft}`);
      }
      for (const card of panel.querySelectorAll('.craft-card')) if (card.scrollWidth > card.clientWidth) throw new Error('Craft text overflows');
      panel.scrollTop = 0;
    });
    await frames(2);
  });
  for (const [label, width, height] of [['mobile-briefing-supplies', 390, 844], ['small-briefing-supplies', 360, 780], ['landscape-briefing-supplies', 844, 390]]) {
    await scene(label, `Start and all supplies visible at ${width} × ${height}`, async () => {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await briefing();
    });
  }
  await closeMenus();
  await page.setViewport(viewport);
  await page.evaluate(() => { delete app.game.career; app.game.progress.reset(); });
}
