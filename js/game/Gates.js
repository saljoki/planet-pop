/** The pilot's rank for the hangar's gates. A game built without a career has every gate open. */
export const pilotRank = (game) => game?.career?.rank ?? 30;
