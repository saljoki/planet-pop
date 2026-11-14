import { Widget } from './Widget.js';
import { VERSION } from '../core/Version.js';

/** The planet builds behind a transparent title screen; PLAY is ready when the first build is done. */
export class StartScreen extends Widget {
  constructor(app) {
    super({ id: 'start', html: `
      <h1 id="stTitle">Planet Pop!</h1>
      <div id="stHello" class="hidden"></div>
      <div class="start-actions">
        <button id="stPlay" class="big" disabled>🌍 Building planet…</button>
        <button id="stExplore" disabled>🌍 Explore the planet</button>
      </div>
      <button id="stOptions" title="Options">⚙️</button>
      <small id="stVersion">v${VERSION}</small>` });
    this.app = app;
    this.loaded = false;
    const $ = (id) => this.$(id);
    this.dom = { play: $('stPlay'), explore: $('stExplore'), options: $('stOptions'), version: $('stVersion'), hello: $('stHello') };
    this.dom.play.disabled = true;
    this.dom.explore.disabled = true;
    this.dom.play.addEventListener('click', () => this.play());
    this.dom.explore.addEventListener('click', () => this.explore());
    this.dom.options.addEventListener('click', () => this.options());
    addEventListener('keydown', (e) => this.key(e));
  }

  static wanted({ roomLink, dailyLink }) { return !roomLink && !dailyLink; }

  ready() {
    this.loaded = true;
    this.dom.play.disabled = false;
    this.dom.play.textContent = '▶ PLAY';
    this.dom.explore.disabled = false;
  }

  show() {
    this.greet();
    super.show();
    this.app.hud.setStartMode(true);
  }

  hide() {
    if (!this.open) return;
    super.hide();
    this.app.hud.setStartMode(false);
  }

  greet() {
    const name = this.app.settings.playerName;
    this.dom.hello.textContent = name ? `👋 ${name}` : '';
    this.dom.hello.classList.toggle('hidden', !name);
  }

  /** Start is not on Overlay's Esc stack: every open menu above it must own its input. */
  get covered() {
    const a = this.app, g = a.game;
    return !!(g?.options?.open || g?.home?.open || g?.hangar?.open || g?.briefing?.open || g?.board?.open || g?.roads?.open
      || g?.results?.open || g?.pauseMenu?.open || a.hud.about?.open || a.friendsMenu?.open || a.map?.open || a.photo?.active
      || document.querySelectorAll('.overlay:not(.hidden)').length);
  }

  key(e) {
    if (!this.open || !this.loaded || this.covered || e.repeat) return;
    if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); this.play(); }
    else if (e.code === 'Escape') { e.preventDefault(); this.explore(); }
  }

  play() {
    if (!this.open || !this.loaded || this.covered) return;
    this.hide();
    this.app.game.play();
  }

  explore() {
    if (!this.open || !this.loaded || this.covered) return;
    this.hide();
  }

  /** The harness dismisses the title without choosing a game. HUD restoration is part of hiding it. */
  dismiss() { this.hide(); }
  options() { this.app.game?.options.show(() => this.greet()); }
}
