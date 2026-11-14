import { Overlay } from '../../ui/Overlay.js';
import { RANKS, MAX_RANK, rankReward } from '../Ranks.js';
import { REX_LIVERIES, liveryFor } from '../Rival.js';
import { CRAFTS } from '../Crafts.js';
import { SLOT_RANKS } from '../Supplies.js';

/** The pilot's lasting progress: the next three rank rewards, and the next craft and supply slot a rank opens. */
export class PilotCard extends Overlay {
  constructor(app, game) {
    super({ id: 'pilot', html: `<h2 id="pcRank"></h2><div id="pcBar" class="xp-bar"><i></i></div>
      <p id="pcXp"></p><ol id="pcNext"></ol><p id="pcGates"></p><p id="pcRex"></p>
      <div class="career-actions"><button id="pcName"></button><button id="pcClose">✕ Home</button></div>` });
    this.app = app;
    this.game = game;
    this.dom = { rank: this.$('pcRank'), bar: this.$('pcBar').firstElementChild, xp: this.$('pcXp'),
      next: this.$('pcNext'), gates: this.$('pcGates'), rex: this.$('pcRex'), name: this.$('pcName'), close: this.$('pcClose') };
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
    const craft = CRAFTS.find((k) => k.rank > c.rank), slot = SLOT_RANKS.findIndex((r) => r > c.rank);
    const gates = [craft && `${craft.icon} ${craft.name} at rank ${craft.rank}`, slot >= 0 && `supply slot ${slot + 1} at rank ${SLOT_RANKS[slot]}`].filter(Boolean);
    d.gates.textContent = gates.length ? `🔓 Next to open: ${gates.join(' · ')}` : '🔓 Every craft and supply slot is open';
    d.name.textContent = `🧑‍✈️ ${this.app.settings.playerName || 'Add your name'}`;
    const paint = liveryFor(c.rank), nextPaint = REX_LIVERIES.find((l) => l.rank > c.rank);
    d.rex.textContent = `😈 You ${c.rex.you.toLocaleString('en-GB')} · Rex ${c.rex.rex.toLocaleString('en-GB')} · ${paint.name}\n${nextPaint ? `Next paint: ${nextPaint.name} at rank ${nextPaint.rank}` : 'All Rex paint unlocked'}`;
  }

  name() { this.game.options.show(() => this.render()); }
  close() { this.hide(); this.game.openHome(); }
  escape() { this.close(); }
}
