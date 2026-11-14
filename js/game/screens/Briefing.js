import { pilotRank } from '../Gates.js';
import { SUPPLIES, slotsFor, suppliesAllowed } from '../Supplies.js';
import { Overlay } from '../../ui/Overlay.js';
import { runClass } from '../runs/modes.js';

/** What a run is about: { icon, title, goal, tips }, from its Run class. */
export function briefingFor(opts = {}) { return runClass(opts).briefing(opts); }

/** How to fly (or drive: vehicle 'car' or 'boat') with whatever is plugged in or touching the screen. */
export function controlsFor({ touch = false, pad = false, invertY = false, vehicle = 'plane' } = {}) {
  const lines = [];
  if (vehicle !== 'plane') {
    if (touch) lines.push('👆 Put a thumb on the left half and drag: sideways to steer, up to go, down to brake and reverse', '🔵 Hold BOOST to speed up, 📯 to honk', '⏸ Pause · 🗺️ shows or hides the map (tap the map to zoom)');
    else lines.push('⬅️➡️ Arrow keys or A / D to steer', '⬆️ Up or W to go, ⬇️ down or S to brake and reverse', '⚡ Space or Shift to boost · 📯 H honks', '⏸ P pauses, Esc quits · M shows or hides the map (click it to zoom)');
    if (pad) lines.push('🎮 Left stick steers, up to go and down to brake, A / RB / RT boost, Y honks, Start pauses');
    return lines;
  }
  const climb = invertY ? 'dive, down to climb (Invert Y is on)' : 'climb, down to dive';
  if (touch) {
    lines.push(`👆 Put a thumb on the left half and drag: sideways to steer, up to ${climb}`, '🔵 Hold BOOST to speed up', '⏸ Pause, with tilt steering in ⚙️ Options · 🗺️ the map');
  } else {
    lines.push('⬅️➡️ Arrow keys or A / D to steer', `⬆️⬇️ Arrow keys or W / S: up to ${climb}`, '⚡ Space or Shift to boost', '⏸ P pauses, Esc quits · M shows or hides the map');
  }
  if (pad) lines.push(`🎮 Left stick steers (up to ${climb}), A / RB / RT boost, Start pauses`);
  return lines;
}

/**
 * A short briefing before a Sky Courier run: title, goal and Start / Options / Back. How to play opens the original
 * tips, controls and "Don't show this again" choice. Enter starts, Esc goes back.
 */
export class Briefing extends Overlay {
  constructor(app, game) {
    super({ id: 'briefing', html: `
      <h2><span id="bIcon"></span> <span id="bTitle"></span></h2>
      <p id="bGoal" class="goal"></p>
      <div id="bSupplies" class="hidden"><div id="bSupplyButtons" class="supply-choices"></div><p id="bSupplyNote" class="supply-note" aria-live="polite"></p></div>
      <details id="bMore"><summary>ℹ️ How to play</summary>
        <ul id="bTips" class="tips"></ul>
        <h3>Controls</h3>
        <ul id="bControls" class="tips controls"></ul>
        <label class="skip"><input id="bSkip" type="checkbox"> Don’t show this before every run</label>
      </details>
      <div class="hrow"><button id="bStart" class="big">▶ Start</button><button id="bOptions">⚙️ Options</button><button id="bBack">✕ Back</button></div>` });
    this.app = app;
    this.game = game;
    this.pending = null;
    const $ = (id) => this.$(id);
    this.dom = {
      icon: $('bIcon'), title: $('bTitle'), goal: $('bGoal'), tips: $('bTips'), controls: $('bControls'),
      supplies: $('bSupplies'), supplyButtons: $('bSupplyButtons'), supplyNote: $('bSupplyNote'),
      skip: $('bSkip'), more: $('bMore'), start: $('bStart'), options: $('bOptions'), back: $('bBack'),
    };
    this.selected = new Set();
    this.dom.supplyButtons.addEventListener('click', (e) => {
      const button = e.target.closest?.('button[data-supply]');
      if (button) this.toggleSupply(button.dataset.supply);
    });
    this.dom.start.addEventListener('click', () => this.start());
    this.dom.options.addEventListener('click', () => this.options());
    this.dom.back.addEventListener('click', () => this.back());
    this.dom.skip.addEventListener('change', (e) => this.setSkip(e.target.checked));
    addEventListener('keydown', (e) => this.key(e));
    app.settings.onChange((k) => this.settingChanged(k));
  }

  /** Show the briefing for a run with these options; Start begins it. */
  show(opts) {
    this.pending = { ...opts };
    delete this.pending.supplies;
    this.selected.clear();
    this.supplyError = '';
    this.dom.more.open = false;
    this.render();
    super.show();
  }

  render() {
    const b = briefingFor(this.pending || {}), d = this.dom, app = this.app;
    d.icon.textContent = b.icon;
    d.title.textContent = b.title;
    d.goal.textContent = b.goal;
    const li = (t) => `<li>${t}</li>`;
    d.tips.innerHTML = b.tips.map(li).join('');
    const vehicle = runClass(this.pending || {}).vehicleKind(this.pending || {});
    d.controls.innerHTML = controlsFor({ touch: this.game.touch, pad: !!app.gamepad?.state, invertY: app.settings.get('invertY'), vehicle }).map(li).join('');
    d.skip.checked = !app.settings.get('briefing');
    this.renderSupplies();
  }

  get supplyCost() { return SUPPLIES.filter((s) => this.selected.has(s.id)).reduce((n, s) => n + s.cost, 0); }

  toggleSupply(id) {
    this.supplyError = '';
    if (!suppliesAllowed(this.pending || {}) || !slotsFor(pilotRank(this.game))) return false;
    const supply = SUPPLIES.find((s) => s.id === id);
    if (!supply) return false;
    if (this.selected.has(id)) this.selected.delete(id);
    else if (this.selected.size >= slotsFor(pilotRank(this.game))) return false;
    else if (this.supplyCost + supply.cost > this.game.progress.coins) {
      this.supplyError = 'Not enough coins';
      this.renderSupplies();
      return false;
    } else this.selected.add(id);
    this.renderSupplies();
    return true;
  }

  renderSupplies() {
    const d = this.dom, slots = slotsFor(pilotRank(this.game));
    const allowed = suppliesAllowed(this.pending || {}) && slots > 0;
    d.supplies.classList.toggle('hidden', !allowed);
    d.supplyButtons.innerHTML = allowed ? SUPPLIES.map((s) => {
      const chosen = this.selected.has(s.id);
      const disabled = !chosen && (this.selected.size >= slots || this.supplyCost + s.cost > this.game.progress.coins);
      return `<button data-supply="${s.id}" title="${s.desc}" aria-pressed="${chosen}" ${disabled ? 'disabled' : ''}>${s.icon} ${s.name} · 🪙 ${s.cost}</button>`;
    }).join('') : '';
    const short = allowed && this.selected.size < slots && !SUPPLIES.some((s) => !this.selected.has(s.id) && this.supplyCost + s.cost <= this.game.progress.coins);
    d.supplyNote.textContent = this.supplyError || (short ? 'Not enough coins' : `${this.selected.size} of ${slots} slots · 🪙 ${this.supplyCost}`);
  }

  setSkip(checked) { this.app.settings.set('briefing', !checked); }
  settingChanged(key) { if (key === 'invertY' && this.open) this.render(); }

  key(e) {
    if (!this.open || this.game.options.open || (e.code !== 'Enter' && e.code !== 'Space')) return;
    if (e.target?.closest?.('button, input, select, textarea, summary')) return; // native keys operate the focused control
    e.preventDefault();
    this.start();
  }

  escape() { this.back(); }

  start() {
    if (!this.open) return;
    const opts = { ...this.pending };
    let supplies = suppliesAllowed(opts) && this.selected.size <= slotsFor(pilotRank(this.game)) ? [...this.selected] : [];
    if (!this.game.progress.spend(supplies.reduce((n, id) => n + SUPPLIES.find((s) => s.id === id).cost, 0))) supplies = [];
    if (supplies.length) opts.supplies = supplies;
    this.hide();
    this.pending = null;
    this.game.start(opts || {});
  }

  options() { this.game.options.show(() => this.open && this.render()); }

  /** Back to where the run was chosen: the mission board, road trips, planet (Drive this) or Home. */
  back() {
    if (!this.open) return;
    const opts = this.pending || {};
    this.hide();
    this.pending = null;
    if (opts.mission) this.game.board.show();
    else if (opts.take) return;
    else if (opts.drive || opts.road) this.game.roads.show();
    else this.game.openHome();
  }
}
