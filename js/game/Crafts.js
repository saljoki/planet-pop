/** Each craft trades one strength for another; world-specific styles keep these proportions. */
export const CRAFTS = [
  { id: 'classic', icon: '✈️', name: 'Classic', good: 'Everything, a little', gives: 'Nothing', rank: 1, cost: 0, mods: {}, shape: { span: 1, girth: 1 } },
  { id: 'bulldog', icon: '🐶', name: 'Bulldog', good: 'Armour', gives: 'Turning', rank: 4, cost: 3000, mods: { armour: 0.6, turn: 0.85 }, shape: { span: 0.95, girth: 1.4 } },
  { id: 'hummingbird', icon: '🐦', name: 'Hummingbird', good: 'Turning', gives: 'Boost tank', rank: 7, cost: 5000, mods: { turn: 1.35, drain: 1.3 }, shape: { span: 0.65, girth: 0.85 } },
  { id: 'mule', icon: '🐴', name: 'Mule', good: "Heavy parcels don't slow it", gives: 'Top speed', rank: 10, cost: 7000, mods: { hauler: true, speed: 0.97 }, shape: { span: 1.15, girth: 1.25 } },
  { id: 'swift', icon: '⚡', name: 'Swift', good: 'Speed', gives: 'Armour', rank: 14, cost: 9000, mods: { speed: 1.06, armour: 1.6 }, shape: { span: 0.8, girth: 0.9 } },
  { id: 'comet', icon: '☄️', name: 'Comet', good: 'Boost lasts twice as long', gives: 'Cruising speed', rank: 18, cost: 12000, mods: { drain: 0.5, speed: 0.93 }, shape: { span: 0.9, girth: 0.8 } },
];

/** Apply a craft without mutating the player's upgrade stats or the daily's stock stats. */
export function craftStats(stats, craft) {
  const result = { ...stats }, mods = craft.mods;
  for (const key of ['speed', 'turn', 'drain', 'armour']) if (mods[key] !== undefined) result[key] *= mods[key];
  result.armour = Math.max(0.1, result.armour);
  if (mods.hauler) result.hauler = true;
  return result;
}
