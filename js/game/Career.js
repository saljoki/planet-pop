import { loadJson, saveJson, forget } from '../core/Store.js';
import { RANKS, MAX_RANK, XP, TROPHY_COINS, xpForRank, rankFor, rankReward } from './Ranks.js';

const KEY = 'planetpop.career';
const fresh = () => ({ xp: 0, paid: [], rex: { you: 0, rex: 0 },
  day: { date: null, tier: 0, ids: [], counts: {}, done: [], crate: false },
  streak: { days: 0, last: null, forgiven: null }, gift: null });

/** Flight-to-flight progress, kept separately from the existing wallet and purchases. */
export class Career {
  constructor(app, progress) {
    this.app = app;
    this.progress = progress;
    const saved = loadJson(KEY, null), defaults = fresh();
    this.data = { ...defaults, ...saved, rex: { ...defaults.rex, ...saved?.rex },
      day: { ...defaults.day, ...saved?.day }, streak: { ...defaults.streak, ...saved?.streak } };
    this.data.xp = Number.isFinite(this.data.xp) ? Math.max(0, this.data.xp) : 0;
    this.data.paid = Array.isArray(this.data.paid) ? [...new Set(this.data.paid)] : [];
    this.lines = [];
    progress.onEarn = (n) => this.addXp(n);
    progress.onStars = (n) => this.addXp(n * XP.star);
    app.achievements.onUnlock = (id) => this.trophy(id);
    const coins = progress.coins;
    this.migrating = true;
    if (!saved) this.addXp(progress.totalStars * XP.star);
    let trophies = 0;
    for (const id of app.achievements.done) if (this.trophy(id)) trophies++;
    this.migrating = false;
    if ((!saved && this.xp) || trophies) this.lines.push(`🎖️ Welcome back: rank ${this.rank}, ${this.rankName}. +${(progress.coins - coins).toLocaleString('en-GB')} 🪙 for what you had already earned.`);
    this.mark();
    this.save();
  }

  get xp() { return this.data.xp; }
  get rank() { return rankFor(this.xp); }
  get rankName() { return RANKS[this.rank - 1]; }
  get toNext() {
    return this.rank === MAX_RANK ? null : { have: this.xp - xpForRank(this.rank), need: xpForRank(this.rank + 1) - xpForRank(this.rank) };
  }

  addXp(n) {
    if (!Number.isFinite(n) || n <= 0) return 0;
    const before = rankFor(this.xp);
    this.data.xp += n;
    const after = rankFor(this.xp);
    for (let r = before + 1; r <= after; r++) {
      this.progress.addCoins(rankReward(r), false);
      if (!this.migrating) this.lines.push(`🎖️ Rank ${r} · ${RANKS[r - 1]}! +${rankReward(r)} 🪙`);
    }
    this.save();
    return after - before;
  }

  mark() { this.marked = this.xp; }
  news() { const lines = this.lines; this.lines = []; return lines; }

  trophy(id) {
    if (this.data.paid.includes(id) || !this.app.achievements.list().some((t) => t.id === id)) return false;
    this.data.paid.push(id);
    this.save();
    this.progress.addCoins(TROPHY_COINS, false);
    this.addXp(XP.trophy);
    return true;
  }

  runEnded(run) {
    if (!run || run.careerEnded) return;
    run.careerEnded = true;
    const gained = this.xp - this.marked;
    if (gained > 0) this.lines.push(`🎖️ +${gained.toLocaleString('en-GB')} XP`);
  }

  save() { saveJson(KEY, this.data); }
  reset() {
    forget(KEY);
    this.data = fresh();
    // Options keeps trophies. Keep their receipts too, so a reset cannot pay them again.
    this.data.paid = [...this.app.achievements.done];
    this.lines = [];
    this.mark();
    this.save();
  }
}
