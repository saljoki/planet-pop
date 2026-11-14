import { Overlay } from '../../ui/Overlay.js';
import { crateCoins } from '../Contracts.js';

/** Today's three jobs, and the crate earned by finishing the set. */
export class TodayScreen extends Overlay {
  constructor(app, game) {
    super({ id: 'today', html: `<h2>📋 Today</h2><div id="tdContracts"></div>
      <div class="today-rewards"><button id="tdCrate"></button><div id="tdStreak"></div><button id="tdGift" hidden></button>
      <button id="tdClose">✕ Home</button></div>` });
    this.app = app;
    this.game = game;
    this.dom = { contracts: this.$('tdContracts'), crate: this.$('tdCrate'), streak: this.$('tdStreak'), gift: this.$('tdGift'), close: this.$('tdClose') };
    this.dom.crate.addEventListener('click', () => this.crate());
    this.dom.close.addEventListener('click', () => this.close());
  }

  show() { this.render(); super.show(); }
  render() {
    const c = this.game.career, day = c.today(), d = this.dom;
    d.contracts.innerHTML = c.contracts.map((job) => `<div class="contract${job.done ? ' done' : ''}"><span>${job.done ? '✔ ' : ''}${job.text}</span>
      <small>${job.have} / ${job.need}</small><strong>+${job.coins} 🪙</strong></div>`).join('');
    d.crate.hidden = !c.crateReady && !day.crate;
    d.crate.disabled = !!day.crate;
    d.crate.textContent = day.crate ? `🎁 Crate opened: +${crateCoins(day.date)} 🪙` : '🎁 Open your crate';
  }

  crate() { this.game.career.openCrate(); this.render(); }
  close() { this.hide(); this.game.openHome(); }
  escape() { this.close(); }
}
