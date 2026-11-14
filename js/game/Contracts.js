import { mulberry32 } from '../core/Noise.js';
import { dailySeed } from './Daily.js';
import { DeliveryRun } from './runs/DeliveryRun.js';
import { DailyRun } from './runs/DailyRun.js';
import { MissionRun } from './runs/MissionRun.js';
import { TaxiRun } from './runs/TaxiRun.js';
import { RaceRun } from './runs/RaceRun.js';

/** Three daily jobs: one collection, one skill and one reason to try another mode. */
export const CONTRACTS = [
  {id: "parcels", group: "A", text: "📦 Deliver {n} parcels", stat: "deliveries", need: [8, 12, 16], coins: 40},
  {id: "urgent", group: "A", text: "⚡ Deliver {n} urgent parcels", stat: "urgent", need: [2, 3, 4], coins: 50},
  {id: "fragile", group: "A", text: "🥚 Deliver {n} fragile parcels in one piece", stat: "fragile", need: [2, 3, 4], coins: 50},
  {id: "heavy", group: "A", text: "🏋️ Deliver {n} heavy parcels", stat: "heavy", need: [2, 3, 4], coins: 50},
  {id: "rings", group: "A", text: "💍 Fly through {n} blue rings", stat: "rings", need: [10, 15, 20], coins: 40},
  {id: "coins", group: "A", text: "🪙 Earn {n} coins flying or driving", stat: "coins", need: [100, 150, 200], coins: 40},
  {id: "combo", group: "B", text: "🔥 Reach a x{n} combo", stat: "combo", need: [3, 4, 5], coins: 50, best: true},
  {id: "rexrow", group: "B", text: "😈 Beat Rex to {n} parcels in a row", stat: "rexrow", need: [2, 3, 4], coins: 60, best: true},
  {id: "score", group: "B", text: "⭐ Score {n} in one courier run", stat: "score", need: [1500, 2500, 4000], coins: 60, best: true},
  {id: "night", group: "B", text: "🌙 Deliver {n} parcels to towns in the dark", stat: "night", need: [2, 3, 4], coins: 50},
  {id: "refuel", group: "B", text: "⛽ Skim a runway {n} times", stat: "refuels", need: [1, 2, 3], coins: 40},
  {id: "daily", group: "C", text: "📅 Fly today's daily", stat: "daily", need: [1, 1, 1], coins: 40},
  {id: "route", group: "C", text: "🏁 Finish all ten parcels in the daily", stat: "route", need: [0, 1, 1], coins: 70},
  {id: "mission", group: "C", text: "🎯 Complete {n} mission (a replay counts)", stat: "mission", need: [1, 1, 2], coins: 50},
  {id: "star", group: "C", text: "⭐ Earn {n} new star", stat: "star", need: [1, 1, 2], coins: 70},
  {id: "taxi", group: "C", text: "🚕 Drive {n} taxi fares", stat: "taxi", need: [3, 4, 5], coins: 50},
  {id: "race", group: "C", text: "🏁 Beat Rex in the road race", stat: "race", need: [1, 1, 1], coins: 60},
  {id: "space", group: "C", text: "🚀 Deliver a parcel to another world", stat: "space", need: [1, 1, 1], coins: 70},
];

export const tierFor = (rank) => rank < 10 ? 0 : rank < 20 ? 1 : 2;

export function pickContracts(date, tier, { stars = 0 } = {}) {
  const rand = mulberry32(dailySeed(date) ^ 0xC0FFEE);
  return ['A', 'B', 'C'].map((group) => {
    const pool = CONTRACTS.filter((c) => c.group === group && c.need[tier] > 0 && !(c.id === 'star' && stars >= 183));
    return pool[Math.floor(rand() * pool.length)].id;
  });
}

/** The fourth draw follows the three jobs, independently of rank or completed stars. */
export function crateCoins(date) {
  const rand = mulberry32(dailySeed(date) ^ 0xC0FFEE);
  rand(); rand(); rand();
  return [100, 150, 250][Math.floor(rand() * 3)];
}

/** Read real run results; mission rewards and career payouts never enter the flying-coins stat. */
export function runCounts(run) {
  const counts = { ...run.tally, coins: run.coins || 0, rexrow: run.tally?.rexStreak || 0 };
  if (run.constructor === DeliveryRun) counts.score = run.score;
  if (run instanceof DailyRun) {
    counts.daily = run.tally.deliveries > 0 ? 1 : 0;
    counts.route = run.parcels >= 10 ? 1 : 0;
  }
  if (run instanceof MissionRun) counts.mission = run.game.over && run.check() === 'done' ? 1 : 0;
  if (run instanceof TaxiRun) counts.taxi = run.fares;
  if (run instanceof RaceRun) counts.race = run.won ? 1 : 0;
  return Object.fromEntries(Object.entries(counts).filter(([, n]) => Number.isFinite(n) && n > 0));
}
