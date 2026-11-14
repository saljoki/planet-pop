import { UPGRADES, SKINS, TRAILS } from '../Progress.js';
import { CRAFTS } from '../Crafts.js';
import { pilotRank } from '../Gates.js';
import { Overlay } from '../../ui/Overlay.js';

/** Craft, upgrades, paint and trails. Closing the hangar returns to Home. */
export class Hangar extends Overlay {
  constructor(app, progress, { onOptions, onClose }) {
    super({ id: 'hangar', html: `
      <button id="hClose" class="close" title="Close">✕</button>
      <button id="hOptions" class="opts" title="Options">⚙️</button>
      <h2>🛠️ Hangar</h2>
      <label class="who" title="Your name, for your results and the daily share">🧑‍✈️<input id="hName" type="text" maxlength="16" placeholder="Your name?" autocomplete="nickname" enterkeyhint="done"></label>
      <div class="coins" id="hCoins"></div>
      <details id="hCraftSection" name="hangar-section"><summary id="hCraftHeader"></summary><div id="hCrafts" class="crafts"></div></details>
      <details id="hUpgradeSection" name="hangar-section"><summary id="hUpgradeHeader"></summary><div id="hUpgrades"></div></details>
      <details id="hPaintSection" name="hangar-section"><summary id="hPaintHeader"></summary><div id="hSkins" class="skins"></div></details>
      <details id="hTrailSection" name="hangar-section"><summary id="hTrailHeader"></summary><div id="hTrails" class="skins"></div></details>` });
    this.app = app;
    this.progress = progress;
    const $ = (id) => this.$(id);
    this.dom = { coins: $('hCoins'), ups: $('hUpgrades'), skins: $('hSkins'), crafts: $('hCrafts'), trails: $('hTrails'),
      craftHeader: $('hCraftHeader'), upgradeHeader: $('hUpgradeHeader'), paintHeader: $('hPaintHeader'), trailHeader: $('hTrailHeader'),
      sections: { craft: $('hCraftSection'), upgrades: $('hUpgradeSection'), paint: $('hPaintSection'), trails: $('hTrailSection') } };
    this.onClose = onClose;
    this.onOptions = onOptions;
    this.nameInput = $('hName');
    this.nameInput.addEventListener('change', () => this.rename());
    this.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.nameInput.blur(); });
    this.el.addEventListener('click', (e) => this.click(e));
    for (const [id, section] of Object.entries(this.dom.sections)) section.addEventListener('toggle', () => this.sectionToggled(id));
  }

  click(e) {
    const b = e.target.closest?.('button');
    if (!b || b.disabled) return;
    if (b.id === 'hClose') this.close();
    else if (b.id === 'hOptions') this.options();
    else if (b.dataset.buy) this.buy(b.dataset.buy);
    else if (b.dataset.skin) this.pickSkin(b.dataset.skin);
    else if (b.dataset.craft) this.pickCraft(b.dataset.craft);
    else if (b.dataset.trail) this.pickTrail(b.dataset.trail);
  }

  openSection(id) {
    for (const [key, section] of Object.entries(this.dom.sections)) section.open = key === id;
  }

  sectionToggled(id) { if (this.dom.sections[id].open) this.openSection(id); }

  show() {
    this.nameInput.value = this.app.settings.playerName;
    this.openSection('craft');
    this.render();
    super.show();
  }

  hide() {
    if (this.open) this.app.settings.setPlayerName(this.nameInput.value);
    super.hide();
  }

  close() { this.hide(); this.onClose?.(); }
  escape() { this.close(); }
  options() { this.hide(); this.onOptions?.(); }

  rename() {
    this.app.settings.setPlayerName(this.nameInput.value);
    this.nameInput.value = this.app.settings.playerName;
    this.greet();
  }

  greet() {
    const n = this.app.settings.playerName;
    if (n && n !== this.greeted) this.app.hud.toast(`👋 Hi, ${n}! Ready to fly?`);
    this.greeted = n;
  }

  buy(id) {
    const ok = this.progress.buy(id);
    this.app.sfx.play(ok ? 'ring' : 'crash');
    if (ok) this.app.achievements.unlock('mechanic');
    this.render();
  }

  pickSkin(id) {
    const ok = this.progress.chooseSkin(id, this.app.achievements.done);
    this.app.sfx.play(ok ? 'ring' : 'crash');
    this.render();
  }

  pickCraft(id) {
    const ok = this.progress.chooseCraft(id, pilotRank(this.app.game));
    this.app.sfx.play(ok ? 'ring' : 'crash');
    this.render();
  }

  pickTrail(id) {
    const ok = this.progress.chooseTrail(id);
    this.app.sfx.play(ok ? 'ring' : 'crash');
    this.render();
  }

  render() {
    const p = this.progress, trophies = this.app.achievements.done, d = this.dom, rank = pilotRank(this.app.game);
    d.coins.innerHTML = `🪙 <b>${p.coins}</b> coins · best run ⭐ ${p.best}`;
    d.craftHeader.textContent = `✈️ Craft · ${p.craftDef.name}`;
    d.upgradeHeader.textContent = `🔧 Upgrades · ${UPGRADES.reduce((n, u) => n + p.level(u.id), 0)} / 30`;
    d.paintHeader.textContent = `🎨 Paint · ${SKINS.filter((s) => ['owned', 'equipped'].includes(p.skinState(s, trophies))).length} / 12`;
    d.trailHeader.textContent = `💨 Trails · ${p.trails.size} / 6`;
    d.crafts.innerHTML = CRAFTS.map((c) => {
      const state = p.craftState(c, rank), label = { flying: 'Flying', owned: 'Fly', buy: `🪙 ${c.cost.toLocaleString('en-GB')}`, locked: `🔒 Rank ${c.rank}` }[state];
      const disabled = state === 'flying' || state === 'locked' || (state === 'buy' && p.coins < c.cost);
      return `<article class="craft-card ${state}"><h3>${c.icon} ${c.name}</h3><p>Good at ${c.good}</p><p>Gives up ${c.gives}</p>
        <button data-craft="${c.id}" ${disabled ? 'disabled' : ''}>${label}</button></article>`;
    }).join('');
    d.ups.innerHTML = UPGRADES.map((u) => {
      const lvl = p.level(u.id), cost = p.nextCost(u.id), pips = u.costs.map((_, i) => (i < lvl ? '●' : '○')).join('');
      const btn = cost == null ? '<button disabled>MAX</button>' : `<button data-buy="${u.id}" ${p.coins < cost ? 'disabled' : ''}>🪙 ${cost}</button>`;
      return `<div class="upg"><span class="icon">${u.icon}</span><div class="info">${u.name} <span class="pips">${pips}</span><small>${u.desc}</small></div>${btn}</div>`;
    }).join('');
    d.skins.innerHTML = SKINS.map((s) => {
      const state = p.skinState(s, trophies), label = { equipped: '✔ Flying', owned: 'Equip', buy: `🪙 ${s.cost}`, locked: `🏆 ${s.trophyName}` }[state];
      const disabled = state === 'locked' || (state === 'buy' && p.coins < s.cost);
      return `<button class="skin ${state}" data-skin="${s.id}" ${disabled ? 'disabled' : ''}><span class="swatch" style="background:${s.body};border-color:${s.trim}"></span>${s.name}<small>${label}</small></button>`;
    }).join('');
    d.trails.innerHTML = TRAILS.map((t) => {
      const state = p.trailState(t), label = { equipped: '✔ Flying', owned: 'Equip', buy: `🪙 ${t.cost}` }[state];
      return `<button class="skin ${state}" data-trail="${t.id}" ${state === 'buy' && p.coins < t.cost ? 'disabled' : ''}><span class="swatch trail-swatch" style="background:${t.color ?? '#fff4c2'}"></span>${t.name}<small>${label}</small></button>`;
    }).join('');
  }
}
