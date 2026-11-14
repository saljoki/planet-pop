import { UPGRADES, SKINS } from '../Progress.js';
import { Overlay } from '../../ui/Overlay.js';

/**
 * Spend coins on upgrades and paint jobs. Closing the hangar returns to Home.
 */
export class Hangar extends Overlay {
  constructor(app, progress, { onOptions, onClose }) {
    super({ id: 'hangar', html: `
      <button id="hClose" class="close" title="Close">✕</button>
      <button id="hOptions" class="opts" title="Options">⚙️</button>
      <h2>🛠️ Hangar</h2>
      <label class="who" title="Your name, for your results and the daily share">🧑‍✈️<input id="hName" type="text" maxlength="16" placeholder="Your name?" autocomplete="nickname" enterkeyhint="done"></label>
      <div class="coins" id="hCoins"></div>
      <div id="hUpgrades"></div>
      <h3>Paint jobs</h3>
      <div id="hSkins" class="skins"></div>
` });
    this.app = app;
    this.progress = progress;
    const $ = (id) => this.$(id);
    this.dom = { coins: $('hCoins'), ups: $('hUpgrades'), skins: $('hSkins') };
    this.onClose = onClose;
    this.onOptions = onOptions;
    this.on('hOptions', 'click', () => this.options());
    this.on('hClose', 'click', () => this.close());
    const name = (this.nameInput = $('hName')), s = app.settings;
    name.addEventListener('change', () => { s.setPlayerName(name.value); name.value = s.playerName; this.greet(); });
    name.addEventListener('keydown', (e) => { if (e.key === 'Enter') name.blur(); });
    this.el.addEventListener('click', (e) => {
      const b = e.target.closest?.('button[data-buy], button[data-skin]');
      if (!b || b.disabled) return;
      if (b.dataset.buy) this.buy(b.dataset.buy);
      else this.pickSkin(b.dataset.skin);
    });
  }

  show() {
    this.nameInput.value = this.app.settings.playerName;
    this.render();
    super.show();
  }

  hide() {
    if (this.open) this.app.settings.setPlayerName(this.nameInput.value); // (in case it's closed while typing)
    super.hide();
  }

  close() { this.hide(); this.onClose?.(); }

  escape() { this.close(); }

  options() { this.hide(); this.onOptions?.(); }

  /** A hello when the player has just given their name. */
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

  render() {
    const p = this.progress, trophies = this.app.achievements.done;
    this.dom.coins.innerHTML = `🪙 <b>${p.coins}</b> coins · best run ⭐ ${p.best}`;
    this.dom.ups.innerHTML = UPGRADES.map((u) => {
      const lvl = p.level(u.id), cost = p.nextCost(u.id);
      const pips = u.costs.map((_, i) => (i < lvl ? '●' : '○')).join('');
      const btn = cost == null
        ? '<button disabled>MAX</button>'
        : `<button data-buy="${u.id}" ${p.coins < cost ? 'disabled' : ''}>🪙 ${cost}</button>`;
      return `<div class="upg"><span class="icon">${u.icon}</span>
        <div class="info">${u.name} <span class="pips">${pips}</span><small>${u.desc}</small></div>${btn}</div>`;
    }).join('');
    this.dom.skins.innerHTML = SKINS.map((s) => {
      const state = p.skinState(s, trophies);
      const label = { equipped: '✔ Flying', owned: 'Equip', buy: `🪙 ${s.cost}`, locked: `🏆 ${s.trophyName}` }[state];
      const disabled = state === 'locked' || (state === 'buy' && p.coins < s.cost);
      return `<button class="skin ${state}" data-skin="${s.id}" ${disabled ? 'disabled' : ''}>
        <span class="swatch" style="background:${s.body};border-color:${s.trim}"></span>${s.name}<small>${label}</small></button>`;
    }).join('');
  }
}
