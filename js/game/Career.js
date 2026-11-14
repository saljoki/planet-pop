import { loadJson, saveJson, forget } from '../core/Store.js';
import { RANKS, MAX_RANK, XP, TROPHY_COINS, xpForRank, rankFor, rankReward } from './Ranks.js';
import { REX, REX_LIVERIES } from './Rival.js';
import { todayKey, dailySeed } from './Daily.js';
import { mulberry32 } from '../core/Noise.js';
import { DailyRun } from './runs/DailyRun.js';
import { CONTRACTS, tierFor, pickContracts, runCounts, crateCoins } from './Contracts.js';

export const STREAK_COINS = [20, 25, 30, 35, 40, 50, 150];
export const giftCoins = (date) => [20, 30, 40, 60][Math.floor(mulberry32(dailySeed(date) ^ 0x61F7)() * 4)];
const daysBetween = (a, b) => (Date.parse(a) - Date.parse(b)) / 86400000;
const KEY = 'planetpop.career';
const fresh = () => ({ xp: 0, paid: [], rex: { you: 0, rex: 0 },
  day: { date: null, tier: 0, ids: [], counts: {}, done: [], crate: false },
  streak: { days: 0, last: null, forgiven: null }, gift: null });

/** Flight-to-flight progress, kept separately from the existing wallet and purchases. */
export class Career {
  constructor(app, progress, date = todayKey) {
    this.date = date;
    this.app = app;
    this.progress = progress;
    const saved = loadJson(KEY, null), defaults = fresh();
    this.data = { ...defaults, ...saved, rex: { ...defaults.rex, ...saved?.rex },
      day: { ...defaults.day, ...saved?.day }, streak: { ...defaults.streak, ...saved?.streak } };
    this.data.xp = Number.isFinite(this.data.xp) ? Math.max(0, this.data.xp) : 0;
    this.data.paid = Array.isArray(this.data.paid) ? [...new Set(this.data.paid)] : [];
    this.lines = [];
    progress.onEarn = (n) => this.addXp(n);
    progress.onStars = (n) => { this.addXp(n * XP.star); this.count('star', n); };
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
      if (!this.migrating) {
        const paint = REX_LIVERIES.find((l) => l.rank === r);
        if (paint) this.lines.push(`😈 Rex has new paint: ${paint.name}.`);
        if (r === REX.boostRank) this.lines.push('😈 Rex has learned to boost.');
      }
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

  get rex() { return this.data.rex; }
  rexScore(you, rex) { this.data.rex.you += you; this.data.rex.rex += rex; this.save(); }

  runEnded(run) {
    if (!run || run.careerEnded) return;
    run.careerEnded = true;
    this.counts(runCounts(run));
    if (run instanceof DailyRun && run.tally.deliveries > 0) this.dailyFlown(run.date);
    const gained = this.xp - this.marked;
    if (gained > 0) this.lines.push(`🎖️ +${gained.toLocaleString('en-GB')} XP`);
  }

  today() {
    const date = this.date();
    if (this.data.day.date !== date) {
      this.data.day = { date, tier: tierFor(this.rank), ids: [], counts: {}, done: [], crate: false };
    }
    const day = this.data.day;
    if (day.ids.length !== 3) {
      day.ids = pickContracts(day.date, day.tier, { stars: this.progress.totalStars });
      this.save();
    }
    return day;
  }

  get contracts() {
    const day = this.today();
    return day.ids.map((id) => {
      const c = CONTRACTS.find((c) => c.id === id), need = c.need[day.tier];
      let text = c.text.replace('{n}', need);
      if (need === 2 && (id === 'mission' || id === 'star')) text = text.replace(id === 'mission' ? 'mission' : 'star', id === 'mission' ? 'missions' : 'stars');
      return { id, text, have: Math.min(need, day.counts[c.stat] || 0), need, coins: c.coins, done: day.done.includes(id) };
    });
  }

  count(stat, n) { this.counts({ [stat]: n }); }
  counts(values) {
    const day = this.today();
    for (const [stat, n] of Object.entries(values)) {
      const contract = CONTRACTS.find((c) => c.stat === stat);
      if (!contract || !Number.isFinite(n) || n <= 0) continue;
      day.counts[stat] = contract.best ? Math.max(day.counts[stat] || 0, n) : (day.counts[stat] || 0) + n;
    }
    for (const c of this.contracts) {
      if (c.done || c.have < c.need) continue;
      day.done.push(c.id);
      this.save();
      this.progress.addCoins(c.coins, false);
      this.addXp(XP.contract);
      this.lines.push(`📋 ${c.text}: done! +${c.coins} 🪙`);
      if (day.done.length === 3) this.lines.push('🎁 All three done: your crate is waiting on Home.');
    }
    this.save();
  }

  get crateReady() { const d = this.today(); return d.done.length === 3 && !d.crate; }
  openCrate() {
    if (!this.crateReady) return 0;
    const day = this.today(), coins = crateCoins(day.date);
    day.crate = true;
    this.save();
    this.progress.addCoins(coins, false);
    this.addXp(XP.crate);
    return coins;
  }

  canForgive(date) { return !this.data.streak.forgiven || daysBetween(date, this.data.streak.forgiven) >= 7; }
  dailyFlown(date) {
    const s = this.data.streak;
    if (s.last && date <= s.last) return 0;
    const gap = daysBetween(date, s.last), forgiven = gap === 2 && this.canForgive(date);
    s.days = gap === 1 || forgiven ? s.days + 1 : 1;
    s.last = date;
    if (forgiven) s.forgiven = date;
    this.save();
    const week = (s.days - 1) % 7, coins = STREAK_COINS[week];
    this.progress.addCoins(coins, false);
    this.addXp(week === 6 ? XP.streakWeek : XP.streak);
    this.lines.push(`🔥 Day ${s.days} in a row${forgiven ? ' (one missed day forgiven)' : ''}: +${coins} 🪙`);
    return coins;
  }

  get streakDays() {
    const s = this.data.streak, gap = daysBetween(this.date(), s.last);
    return !s.last || gap > 2 || (gap === 2 && !this.canForgive(this.date())) ? 0 : s.days;
  }
  get streakNext() { return STREAK_COINS[this.streakDays % 7]; }
  get giftReady() { return this.data.gift !== this.date(); }
  openGift() {
    if (!this.giftReady) return 0;
    const date = this.date(), coins = giftCoins(date);
    this.data.gift = date;
    this.save();
    this.progress.addCoins(coins, false);
    return coins;
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
