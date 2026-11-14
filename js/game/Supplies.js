import { runClass } from './runs/modes.js';
import { DeliveryRun } from './runs/DeliveryRun.js';

/** Bought at take-off, never saved or carried into another flight. */
export const SUPPLIES = [
  { id: 'shield', icon: '🛡️', name: 'Shield', desc: 'Takes the first knock for you', cost: 60 },
  { id: 'tank', icon: '⚡', name: 'Spare tank', desc: 'Refills your boost once, when it runs out', cost: 40 },
  { id: 'clock', icon: '⏱️', name: 'Head start', desc: '10 more seconds on the clock', cost: 50 },
];
export const SLOT_RANKS = [3, 8, 13];
export const slotsFor = (rank) => SLOT_RANKS.filter((gate) => rank >= gate).length;
export const suppliesAllowed = (opts = {}) => runClass(opts) === DeliveryRun;
