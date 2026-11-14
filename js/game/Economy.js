/** Scored-run payouts. Mission rewards, space parcels and fuel stars keep their own prices. */
export const COIN_RATE = 25;
export const coinsFor = (points) => Math.round(points / COIN_RATE);
export const RING_COINS = 2, UFO_COINS = 12;
export const RACE_COINS = { win: 60, lose: 12 };
