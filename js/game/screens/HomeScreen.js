import { Overlay } from '../../ui/Overlay.js';
import { HOME_CARDS, cardStat, nextUp } from '../HomeCards.js';

/** What to play next, with one way into every mode and a separate hangar for upgrades and paint. */
export class HomeScreen extends Overlay {
  constructor(app, game) {
    super({ id: 'home', html: `
      <header class="home-head"><h2>🏠 Planet Pop</h2><span id="hoCoins"></span></header>
      <button id="hoPilot"><span id="hoPilotText"></span><span id="hoXp" class="xp-bar"><i></i></span></button>
      <button id="hoNext" class="big"></button>
      <div id="hoCards"></div>
      <footer class="home-foot">
        <button id="hoHangar">🛠️ Hangar</button><button id="hoTrophies"></button>
        <button id="hoOptions" title="Options">⚙️</button><button id="hoExplore">🌍 Explore</button>
      </footer>` });
    this.app = app;
    this.game = game;
    const $ = (id) => this.$(id);
    this.dom = {
      coins: $('hoCoins'), pilot: $('hoPilot'), pilotText: $('hoPilotText'), xp: $('hoXp').firstElementChild, next: $('hoNext'), cards: $('hoCards'),
      hangar: $('hoHangar'), trophies: $('hoTrophies'), options: $('hoOptions'), explore: $('hoExplore'),
      trophyBox: app.hud.$('trophyBox'),
    };
    this.dom.pilot.addEventListener('click', () => this.pilot());
    this.dom.next.addEventListener('click', () => this.next());
    this.dom.cards.addEventListener('click', (e) => this.pick(e.target.closest?.('button[data-card]')?.dataset.card));
    this.dom.hangar.addEventListener('click', () => this.hangar());
    this.dom.trophies.addEventListener('click', () => this.trophies());
    this.dom.options.addEventListener('click', () => this.options());
    this.dom.explore.addEventListener('click', () => this.hide());
  }

  show() {
    this.render(); super.show();
    const news = this.game.career.news();
    if (news.length) this.app.hud.toast(news.join(' · '));
  }

  render() {
    const p = this.game.progress, d = this.dom, trophies = this.app.achievements, offer = nextUp(p);
    d.coins.textContent = `🪙 ${p.coins.toLocaleString('en-GB')}`;
    const career = this.game.career, next = career.toNext;
    d.pilotText.textContent = `🎖️ ${career.rank} · ${career.rankName}${this.app.settings.playerName ? ` · ${this.app.settings.playerName}` : ''}`;
    d.xp.style.width = `${next ? next.have / next.need * 100 : 100}%`;
    d.next.innerHTML = `<span class="next-title">${offer.icon} ${offer.title}</span><small>${offer.text}</small>`;
    d.cards.innerHTML = HOME_CARDS.map((c) => `<button data-card="${c.id}"><span class="card-icon" aria-hidden="true">${c.icon}</span>
      <span class="card-name">${c.name}</span><small>${cardStat(c.id, p) || c.desc}</small></button>`).join('');
    const count = p.affordable(trophies.done);
    d.hangar.textContent = `🛠️ Hangar${count > 0 ? ` · ${count} to buy` : ''}`;
    d.trophies.textContent = `🏆 ${trophies.done.size} / ${trophies.list().length}`;
  }

  /** A card always closes Home before showing its board, briefing or run. */
  pick(id) {
    if (!HOME_CARDS.some((c) => c.id === id)) return;
    this.hide();
    const g = this.game;
    if (id === 'courier') g.launch();
    else if (id === 'daily') g.startDaily();
    else if (id === 'missions') g.board.show();
    else if (id === 'space') this.app.spaceCourier?.openBoard();
    else if (id === 'roads') g.roads.show();
    else if (id === 'free') g.launch({ free: true });
  }

  next() {
    const offer = nextUp(this.game.progress);
    if (offer.mission) { this.hide(); this.game.startMission(offer.mission); }
    else this.pick(offer.card);
  }

  options() { this.game.options.show(() => { if (this.open) this.render(); }); }
  pilot() { this.hide(); this.game.pilot.show(); }
  hangar() { this.hide(); this.game.openHangar(); }
  trophies() { this.trophiesShown = true; this.app.hud.showTrophies(this.app.achievements.list()); }
  get trophiesOpen() { return !!this.trophiesShown && !this.dom.trophyBox.classList.contains('hidden'); }
  closeTrophies() { this.dom.trophyBox.classList.add('hidden'); this.trophiesShown = false; }
}
