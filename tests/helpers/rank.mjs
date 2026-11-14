import { xpForRank } from '../../js/game/Ranks.js';

/** Put the pilot at a rank for a gate test: no rank rewards are paid and no news is queued. */
export function setRank(game, rank) {
  game.career.data.xp = xpForRank(rank);
  game.career.save();
}
