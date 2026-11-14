import { CRAFTS, craftStats } from './Crafts.js';
import { MISSIONS } from './Missions.js';
import { CHAPTERS, chapterOf, missionsIn } from './Chapters.js';
import { LESSON_COINS } from './Lessons.js';
import { loadJson, saveJson, loadNumber, forget } from '../core/Store.js';

const KEY = 'planetpop.courier', OLD_BEST_KEY = 'planetpop.best';

/** Hangar upgrades (they work on every vehicle). Each entry in `costs` is one level. */
export const UPGRADES = [
  { id: 'engine', icon: '🚀', name: 'Engine', desc: '+8% speed per level', costs: [150, 350, 700, 1200, 2000] },
  { id: 'wings', icon: '🛩️', name: 'Wings', desc: '+12% turning per level', costs: [120, 300, 600, 1100, 1900] },
  { id: 'tank', icon: '⛽', name: 'Boost tank', desc: 'Boost lasts longer and refills faster', costs: [150, 400, 800, 1400, 2200] },
  { id: 'magnet', icon: '🧲', name: 'Ring magnet', desc: 'Grab rings from further away', costs: [200, 500, 900, 1500, 2300] },
  { id: 'clock', icon: '⏱️', name: 'Head start', desc: '+10 s on the clock per level', costs: [250, 600, 1100, 1800, 2800] },
  { id: 'armour', icon: '🛡️', name: 'Armour', desc: 'Crashes and lightning do less damage', costs: [200, 450, 900, 1500, 2400] },
];

/** Plane paint jobs: bought with coins, or unlocked by a trophy. */
export const SKINS = [
  { id: 'classic', name: 'Classic', body: '#ffd23f', trim: '#ff4d4d', cost: 0 },
  { id: 'fire', name: 'Fireball', body: '#ff4d4d', trim: '#ffd23f', cost: 250 },
  { id: 'sky', name: 'Sky Blue', body: '#9fd8ff', trim: '#3f6fff', cost: 250 },
  { id: 'mint', name: 'Mint', body: '#a8f0cf', trim: '#2ee59d', cost: 400 },
  { id: 'midnight', name: 'Midnight', body: '#4a4f9e', trim: '#ff5fa2', cost: 600 },
  { id: 'gold', name: 'Golden Ace', body: '#ffcf33', trim: '#1b1530', trophy: 'ace', trophyName: 'Sky Ace' },
  { id: 'sunset', name: 'Sunset', body: '#ff8c42', trim: '#7a1e48', cost: 500 },
  { id: 'ocean', name: 'Ocean', body: '#1f6fb2', trim: '#9fe8ff', cost: 500 },
  { id: 'bubblegum', name: 'Bubblegum', body: '#ff8fcf', trim: '#ffffff', cost: 600 },
  { id: 'forest', name: 'Forest', body: '#2f7d4f', trim: '#ffd23f', cost: 600 },
  { id: 'ink', name: 'Ink', body: '#1b1530', trim: '#ffd23f', cost: 700 },
  { id: 'pearl', name: 'Pearl', body: '#f4f0e6', trim: '#8f5cff', cost: 700 },
];

/** Classic leaves the colour to the world's plane, glider, hopper or ship style. */
export const TRAILS = [
  { id: 'classic', name: 'Classic', color: null, life: 1.6, grow: 2, cost: 0 },
  { id: 'snow', name: 'Snow', color: '#ffffff', life: 2.4, grow: 2, cost: 500 },
  { id: 'candy', name: 'Candy', color: '#ff8fcf', life: 1.8, grow: 2, cost: 600 },
  { id: 'ember', name: 'Ember', color: '#ff8c42', life: 1, grow: 3, cost: 800 },
  { id: 'aurora', name: 'Aurora', color: '#5dffc9', life: 2.2, grow: 2, cost: 900 },
  { id: 'stardust', name: 'Stardust', color: '#ffe066', life: 3, grow: 1.2, cost: 1100 },
];

/** Plane stats for the given upgrade levels. */
function statsFor(L) {
  return {
    speed: 1 + 0.08 * L('engine'),
    turn: 1 + 0.12 * L('wings'),
    drain: 0.35 * (1 - 0.15 * L('tank')),
    regen: 0.08 * (1 + 0.4 * L('tank')),
    magnet: 0.55 + 0.3 * L('magnet'),
    startTime: 90 + 10 * L('clock'),
    armour: [1, 0.8, 0.6, 0.4, 0.3, 0.2][L('armour')], // share of a knock's damage that gets through
  };
}

/** The stock plane, used for the daily challenge so everyone flies the same machine. */
export const BASE_STATS = statsFor(() => 0);

/** Coins, upgrade levels, paint jobs and best scores, saved in this browser. */
export class Progress {
  constructor() {
    const s = loadJson(KEY, {}), oldBest = loadNumber(OLD_BEST_KEY, 0);
    this.coins = s.coins | 0;
    this.best = Math.max(s.best | 0, oldBest); // carries over the best score from before the hangar existed
    this.levels = { ...(s.levels || {}) };
    this.owned = new Set(s.owned || ['classic']);
    this.skin = this.owned.has(s.skin) ? s.skin : 'classic';
    this.crafts = new Set(['classic', ...(s.crafts || []).filter((id) => CRAFTS.some((c) => c.id === id))]);
    this.craft = this.crafts.has(s.craft) ? s.craft : 'classic';
    this.trails = new Set(['classic', ...(s.trails || []).filter((id) => TRAILS.some((t) => t.id === id))]);
    this.trail = this.trails.has(s.trail) ? s.trail : 'classic';
    this.daily = s.daily || null; // { date, best } for the most recent daily challenge played
    this.missions = new Set(s.missions || []); // ids of completed missions
    this.bests = { ...(s.bests || {}) };       // the road trips' bests: taxi and van scores, the race's fastest time
    this.lesson = s.lesson === true;          // optional since v0.18.0: completed or deliberately skipped
    this.stars = { ...(s.stars || {}) };       // optional since v0.19.0: best stars per mission; old completed missions count as one
  }

  save() {
    const data = { coins: this.coins, best: this.best, levels: this.levels, owned: [...this.owned], skin: this.skin, daily: this.daily,
      missions: [...this.missions], bests: this.bests, lesson: this.lesson, stars: this.stars };
    if (this.craft !== 'classic' || this.crafts.size > 1) Object.assign(data, { craft: this.craft, crafts: [...this.crafts] });
    if (this.trail !== 'classic' || this.trails.size > 1) Object.assign(data, { trail: this.trail, trails: [...this.trails] });
    saveJson(KEY, data);
  }

  level(id) { return this.levels[id] | 0; }

  /** Price of the next level, or null when maxed. */
  nextCost(id) { return UPGRADES.find((u) => u.id === id)?.costs[this.level(id)] ?? null; }

  /** Next purchases at this rank. Omitted rank keeps the pre-B2 Home call compatible. */
  affordable(trophies = new Set(), rank) {
    const skins = rank === undefined ? SKINS.slice(0, 6) : SKINS;
    return UPGRADES.filter((u) => this.nextCost(u.id) !== null && this.nextCost(u.id) <= this.coins).length
      + skins.filter((s) => this.skinState(s, trophies) === 'buy' && s.cost <= this.coins).length
      + (rank === undefined ? 0 : CRAFTS.filter((c) => this.craftState(c, rank) === 'buy' && c.cost <= this.coins).length
        + TRAILS.filter((t) => this.trailState(t) === 'buy' && t.cost <= this.coins).length);
  }

  buy(id) {
    const cost = this.nextCost(id);
    if (cost == null || this.coins < cost) return false;
    this.coins -= cost;
    this.levels[id] = this.level(id) + 1;
    this.save();
    return true;
  }

  /** 'equipped' | 'owned' | 'buy' | 'locked' (trophy skins are owned once the trophy is earned). */
  skinState(skin, trophies) {
    if (this.skin === skin.id) return 'equipped';
    if (this.owned.has(skin.id) || (skin.trophy && trophies.has(skin.trophy))) return 'owned';
    return skin.trophy ? 'locked' : 'buy';
  }

  /** Equip a skin, buying it first if needed. Returns false if it can't be afforded or is locked. */
  chooseSkin(id, trophies) {
    const skin = SKINS.find((s) => s.id === id);
    if (!skin) return false;
    const state = this.skinState(skin, trophies);
    if (state === 'locked') return false;
    if (state === 'buy') {
      if (this.coins < skin.cost) return false;
      this.coins -= skin.cost;
    }
    this.owned.add(id);
    this.skin = id;
    this.save();
    return true;
  }

  get craftDef() { return CRAFTS.find((c) => c.id === this.craft) || CRAFTS[0]; }

  craftState(craft, rank) {
    if (this.craft === craft.id) return 'flying';
    if (this.crafts.has(craft.id)) return 'owned';
    return rank < craft.rank ? 'locked' : 'buy';
  }

  /** Buy once, then switch freely between owned craft. */
  chooseCraft(id, rank) {
    const craft = CRAFTS.find((c) => c.id === id);
    if (!craft) return false;
    const state = this.craftState(craft, rank);
    if (state === 'locked' || (state === 'buy' && this.coins < craft.cost)) return false;
    if (state === 'buy') this.coins -= craft.cost;
    this.crafts.add(id);
    this.craft = id;
    this.save();
    return true;
  }

  get trailDef() { return TRAILS.find((t) => t.id === this.trail) || TRAILS[0]; }

  trailState(trail) {
    if (this.trail === trail.id) return 'equipped';
    return this.trails.has(trail.id) ? 'owned' : 'buy';
  }

  chooseTrail(id) {
    const trail = TRAILS.find((t) => t.id === id);
    if (!trail) return false;
    if (this.trailState(trail) === 'buy') {
      if (this.coins < trail.cost) return false;
      this.coins -= trail.cost;
    }
    this.trails.add(id);
    this.trail = id;
    this.save();
    return true;
  }

  /** Pay atomically; a short wallet never takes part of a price. */
  spend(coins) {
    if (!Number.isInteger(coins) || coins < 0 || this.coins < coins) return false;
    if (coins) { this.coins -= coins; this.save(); }
    return true;
  }

  addCoins(n) { this.coins += n; this.save(); }

  /** Existing pilots keep going where they left off; only an empty save needs the lesson. */
  get needsLesson() {
    return !this.lesson && !this.coins && !this.best && !this.missions.size && this.owned.size <= 1 && !this.daily
      && !Object.values(this.levels).some((n) => n > 0) && !Object.keys(this.bests).length;
  }

  /** The lesson's reward is paid once, independently of First Flight. */
  finishLesson() {
    if (this.lesson) return 0;
    this.lesson = true;
    this.coins += LESSON_COINS;
    this.save();
    return LESSON_COINS;
  }

  skipLesson() { this.lesson = true; this.save(); }

  /** Back to a brand-new pilot: no coins, upgrades, paint jobs, missions or best scores. */
  reset() {
    forget(KEY);
    forget(OLD_BEST_KEY);
    Object.assign(this, { coins: 0, best: 0, levels: {}, owned: new Set(['classic']), skin: 'classic', daily: null, missions: new Set(), bests: {}, lesson: false, stars: {}, craft: 'classic', crafts: new Set(['classic']), trail: 'classic', trails: new Set(['classic']) });
    this.save();
  }

  /** Returns true when this is a new best. */
  recordScore(score) {
    const record = score > this.best;
    if (record) this.best = score;
    this.save();
    return record;
  }

  /**
   * A road trip's best (`id` 'taxi', 'van' or 'race'): the highest score, or for the race the lowest time. Returns
   * the previous best (null if none) and whether this beat it.
   */
  recordBest(id, value, lowerWins = false) {
    const prev = this.bests[id] ?? null, record = prev === null || (lowerWins ? value < prev : value > prev);
    if (record) this.bests[id] = value;
    this.save();
    return { prev, record };
  }

  /** Today's best daily score, or null if today's challenge hasn't been flown. */
  dailyBest(date) { return this.daily?.date === date ? this.daily.best : null; }

  /** Returns true when this beats today's best daily score. */
  recordDaily(date, score) {
    const prev = this.dailyBest(date);
    const record = prev === null || score > prev;
    if (record) this.daily = { date, best: score };
    this.save();
    return record;
  }

  missionDone(id) { return this.missions.has(id); }

  /** Old saves keep one star for every completed mission, until the pilot improves it. */
  starsFor(id) { return this.stars[id] ?? (this.missionDone(id) ? 1 : 0); }

  get totalStars() { return MISSIONS.reduce((n, m) => n + this.starsFor(m.id), 0); }

  /** Keep the best result; returns true only when it improves the saved stars. */
  recordStars(id, n) {
    if (!Number.isInteger(n) || n < 1 || n > 3 || n <= this.starsFor(id)) return false;
    this.stars[id] = n;
    this.save();
    return true;
  }

  /** Completed missions keep their chapter open, even on a save from before star gates. */
  chapterOpen(chapterId) {
    const chapter = CHAPTERS.find((c) => c.id === chapterId);
    return !!chapter && (this.totalStars >= chapter.gate || missionsIn(chapterId).some((m) => this.missionDone(m.id)));
  }

  /** Within an open chapter, each completed mission opens the next; replays always stay open. */
  missionUnlocked(i) {
    const mission = MISSIONS[i];
    if (!mission) return false;
    if (this.missionDone(mission.id)) return true;
    const chapter = chapterOf(mission), list = missionsIn(chapter), at = list.indexOf(mission);
    return this.chapterOpen(chapter) && (at === 0 || this.missionDone(list[at - 1].id));
  }

  /** Marks a mission complete. Returns the coin reward: paid the first time only. */
  completeMission(def) {
    if (this.missions.has(def.id)) return 0;
    this.missions.add(def.id);
    this.coins += def.reward;
    this.save();
    return def.reward;
  }

  get skinDef() { return SKINS.find((s) => s.id === this.skin) || SKINS[0]; }

  /** Multipliers and values the player plane and the game use. */
  get stats() { return craftStats(statsFor((id) => this.level(id)), this.craftDef); }
}
