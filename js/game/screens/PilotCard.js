import { Overlay } from '../../ui/Overlay.js';
import { RANKS, MAX_RANK, rankReward } from '../Ranks.js';

/** The pilot's lasting progress, with the next three rank rewards. */
export class PilotCard extends Overlay {
  constructor(app, game) {
    super({ id: 'pilot', html: `<h2 id="pcRank"></h2><div id="pcBar" class="xp-bar"><i></i></div>
      <p id="pcXp"></p><ol id="pcNext"></ol><p id="pcRex"></p>
      <div class="career-actions"><button id="pcName"></button><button id="pcClose">✕ Home</button></div>` });
    this.app = app;
    this.game = game;
    this.dom = { rank: this.$('pcRank'), bar: this.$('pcBar').firstElementChild, xp: this.$('pcXp'),
      next: this.$('pcNext'), rex: this.$('pcRex'), name: this.$('pcName'), close: this.$('pcClose') };
    this.dom.name.addEventListener('click', () => this.name());
    this.dom.close.addEventListener('click', () => this.close());
  }

  show() { this.render(); super.show(); }
  render() {
    const c = this.game.career, d = this.dom, next = c.toNext;
    d.rank.textContent = `🎖️ Rank ${c.rank} · ${c.rankName}`;
    d.bar.style.width = `${next ? next.have / next.need * 100 : 100}%`;
    d.xp.textContent = next ? `${next.have.toLocaleString('en-GB')} / ${next.need.toLocaleString('en-GB')} XP to rank ${c.rank + 1}` : `🎖️ Maximum rank · ${c.xp.toLocaleString('en-GB')} XP`;
    d.next.innerHTML = Array.from({ length: Math.min(3, MAX_RANK - c.rank) }, (_, i) => c.rank + i + 1)
      .map((r) => `<li>🎖️ ${r} · ${RANKS[r - 1]}<strong>+${rankReward(r).toLocaleString('en-GB')} 🪙</strong></li>`).join('');
    d.name.textContent = `🧑‍✈️ ${this.app.settings.playerName || 'Add your name'}`;
  }

  name() { this.game.options.show(() => this.render()); }
  close() { this.hide(); this.game.openHome(); }
  escape() { this.close(); }
}
