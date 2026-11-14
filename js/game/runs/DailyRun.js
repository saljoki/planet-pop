import { mulberry32 } from '../../core/Noise.js';
import { BASE_STATS } from '../Progress.js';
import { todayKey, dailySeed, dailyPlace } from '../Daily.js';
import { DeliveryRun, COURIER_TIPS } from './DeliveryRun.js';

export const DAILY_PARCELS = 10;

/**
 * 📅 Today's challenge: a courier run in the stock plane, on a route seeded by the date, so everyone flies the same
 * run today. It keeps its own best (separate from the hangar best) and can be shared.
 */
export class DailyRun extends DeliveryRun {
  static briefing() {
    return { icon: '📅', title: 'Daily challenge', goal: 'Ten parcels on today’s route, the same for everyone, in the stock plane. Your best score today counts.',
      tips: COURIER_TIPS };
  }

  constructor(game, opts) {
    super(game, opts);
    this.date = todayKey();
    this.rand = mulberry32(dailySeed(this.date) ^ 0x9e3779b9);
    this.stats = BASE_STATS;
    this.parcels = 0;
    this.finished = false;
    this.finishSeconds = null;
  }

  get layout() { return { ...super.layout, badge: 'daily' }; }

  get intro() { return '📅 Daily challenge: stock plane, same route as everyone today. Good luck!'; }

  get resultHead() {
    return `📅 Daily ${this.date} · ${dailyPlace(this.date)}<br>${this.finishSeconds === null ? '' : `⏱ ${this.finishSeconds} s left: +${this.finishSeconds * 10}<br>`}`;
  }

  get shareable() { return true; }

  /** A broken parcel handed over still takes one place on today's route. */
  deliver() {
    if (this.finished) return;
    super.deliver();
    this.parcels++;
    this.checkEnd();
  }

  steal() {
    if (this.finished) return;
    super.steal();
    this.parcels++;
    this.checkEnd();
  }

  checkEnd() {
    if (this.parcels >= DAILY_PARCELS) this.gameOver('🏁 Route complete!');
    else super.checkEnd();
  }

  /** Bank the remaining whole seconds once, before recording the daily score. */
  gameOver(title) {
    if (this.finished) return;
    this.finished = true;
    if (this.parcels >= DAILY_PARCELS) {
      this.finishSeconds = Math.max(0, Math.floor(this.time));
      this.score += this.finishSeconds * 10;
    }
    super.gameOver(title);
  }

  hud(h) {
    h.dom.daily.textContent = `📅 ${this.parcels} / ${DAILY_PARCELS}`;
    super.hud(h);
  }

  recordBest() {
    const p = this.game.progress, prev = p.dailyBest(this.date);
    const line = p.recordDaily(this.date, this.score) ? '🎉 New best today!' : `Today's best: ${prev}`;
    this.app.achievements.unlock('daily');
    return line;
  }

  /** Copy a short brag plus a link that opens today's challenge. */
  async share() {
    const url = `${location.origin}${location.pathname}?daily`;
    const name = this.app.settings.playerName;
    const text = `📅 Planet Pop daily ${this.date} (${dailyPlace(this.date)}): ${name ? `${name} scored ` : ''}⭐ ${this.score} with ${this.deliveries} deliveries. Can you beat it? ${url}`;
    try {
      await navigator.clipboard.writeText(text);
      this.app.hud.toast('🔗 Result copied! Paste it to challenge a friend.');
    } catch {
      prompt('Copy your result:', text);
    }
  }
}
