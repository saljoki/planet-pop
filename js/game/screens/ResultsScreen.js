import { Overlay } from '../../ui/Overlay.js';

/**
 * The card at the end of a run: a title, what happened, and where to go next (fly again, the next mission, share,
 * the mission board, the hangar, or back to the planet). Runs say what goes on it (see game.finish). Esc is left
 * to the game, which quits the run.
 */
export class ResultsScreen extends Overlay {
  constructor(game) {
    super({ id: 'gOver', parent: game.el, escapes: false, html: `
        <div id="gCopy">
          <div id="gWho" class="who hidden"></div><h2 id="gTitle">⏰ Time's up!</h2><p id="gResult"></p>
          <div id="gNews" class="hidden"></div>
        </div>
        <div class="results-actions">
          <button id="gNext" class="big hidden">▶ Next mission</button><button id="gAgain" class="big">✈️ Fly again</button>
          <button id="gShare" class="hidden">🔗 Share result</button><button id="gBoard" class="hidden">🎯 Missions</button>
          <button id="gHome">🏠 Home</button><button id="gExit">🌍 Back to planet</button>
        </div>
      ` });
    this.game = game;
    this.nextMission = null;
    this.dom = {
      title: this.$('gTitle'), result: this.$('gResult'), next: this.$('gNext'), again: this.$('gAgain'),
      share: this.$('gShare'), board: this.$('gBoard'), who: this.$('gWho'), copy: this.$('gCopy'), news: this.$('gNews'),
    };
    this.on('gAgain', 'click', () => {
      const fn = this.againFn;
      if (!fn) { game.again(); return; }
      game.stop();
      fn();
    });
    this.on('gNext', 'click', () => { const next = this.nextMission; game.stop(); game.startMission(next); });
    this.on('gBoard', 'click', () => this.board());
    this.on('gShare', 'click', () => game.run?.share());
    this.on('gHome', 'click', () => this.home());
    this.on('gExit', 'click', () => game.stop());
  }

  board() { this.game.stop(); this.game.board.show(() => this.game.openHome()); }
  home() { this.game.stop(); this.game.openHome(); }

  /**
   * title, html: what to say · news: career lines · again: the Fly again button's label, bigAgain: whether it's the main button ·
   * next: a mission to offer next · board: offer the mission board · share: offer 🔗 Share · againFn: what the again
   * button does instead of the same run again (the space courier's Next parcel).
   */
  show({ title, html, news = [], again = '✈️ Fly again', bigAgain = true, next = null, board = false, share = false, againFn = null }) {
    this.againFn = againFn;
    const d = this.dom;
    const name = this.game.app.settings.playerName;
    d.who.textContent = name ? `${this.game.player?.kind === 'plane' ? '🧑‍✈️' : '🧑'} ${name}` : '';
    d.who.classList.toggle('hidden', !name);
    d.title.textContent = title;
    d.result.innerHTML = html;
    d.news.replaceChildren(...news.map((line) => {
      const span = document.createElement('span');
      span.textContent = line;
      return span;
    }));
    d.news.classList.toggle('hidden', !news.length);
    d.copy.scrollTop = 0;
    d.again.textContent = again;
    d.again.classList.toggle('big', bigAgain);
    this.nextMission = next;
    d.next.classList.toggle('hidden', !next);
    d.board.classList.toggle('hidden', !board);
    d.share.classList.toggle('hidden', !share);
    super.show();
  }
}
