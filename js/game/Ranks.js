/** Career ranks and rewards. XP is never spent. */
export const RANKS = ['Cadet', 'Trainee', 'Courier', 'Senior Courier', 'Navigator', 'Wingman', 'Flight Officer',
  'Pilot', 'Senior Pilot', 'Captain', 'Senior Captain', 'Flight Leader', 'Squadron Leader', 'Wing Commander',
  'Ace', 'Double Ace', 'Triple Ace', 'Stormrider', 'Ringrunner', 'Commodore', 'Star Courier', 'Moon Courier',
  'Planet Hopper', 'Voyager', 'Pathfinder', 'Trailblazer', 'Legend', 'Air Marshal', 'Star Marshal', 'Sky Marshal'];
export const MAX_RANK = 30;
export const xpForRank = (r) => 300 * (r - 1) + 100 * (r - 1) * (r - 2);
export const rankFor = (xp) => {
  let rank = 1;
  while (rank < MAX_RANK && xp >= xpForRank(rank + 1)) rank++;
  return rank;
};
export const rankReward = (r) => 50 * r;
export const XP = { star: 100, trophy: 200, contract: 150, crate: 300, streak: 100, streakWeek: 300 };
export const TROPHY_COINS = 100;
