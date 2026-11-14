import * as THREE from 'three';
import { R } from '../core/Geo.js';
import { Plane } from './vehicles/Plane.js';

export const REX_LIVERIES = [
  { rank: 1, name: 'Purple Menace', body: '#8f5cff', trim: '#1b1530' },
  { rank: 5, name: 'Night Shift', body: '#2b2d6e', trim: '#ffd23f' },
  { rank: 10, name: 'Red Alert', body: '#e63946', trim: '#1b1530' },
  { rank: 15, name: 'Toxic', body: '#7ddc1f', trim: '#1b1530' },
  { rank: 20, name: 'Chrome', body: '#cfd8e3', trim: '#3a4a5f' },
  { rank: 25, name: 'Gold Rex', body: '#ffc93c', trim: '#7a4a00' },
];
export const liveryFor = (rank) => REX_LIVERIES.findLast((l) => l.rank <= rank) ?? REX_LIVERIES[0];
export const REX = { name: 'Rival Rex', skin: REX_LIVERIES[0], streak: 5, rest: 3,
  rankStep: 0.0025, boostRank: 10, boostRange: 0.35, boost: 1.15 };
export { REX as RIVAL }; // The road and space courier keep the existing tuning and purple paint.
const _v = new THREE.Vector3();
const PICKUP = 0.1; // how close (radians) Rex must pass to the pickup city to collect the parcel

const statsFor = (level, rank) => ({ speed: 0.8 + 0.03 * Math.min(level, 10) + REX.rankStep * (rank - 1), turn: 1, drain: 0, regen: 0 });

/**
 * Rival Rex: an AI courier racing you for every parcel.
 * He has to collect each parcel from its pickup city first; if he then swoops over the destination before you, he steals the delivery.
 */
export class Rival {
  /** from: the pickup city · start/heading: where he takes off · tag: his name label · toScreen: world → screen px. */
  constructor(planet, { from, start = from.c, heading, tag, toScreen, rank = 1, liveryRank = rank }) {
    this.planet = planet;
    this.rank = rank;
    this.plane = new Plane(planet, start, heading, statsFor(0, rank), liveryFor(liveryRank));
    this.baseSpeed = this.plane.stats.speed;
    this.tag = tag;
    this.toScreen = toScreen;
    this.rest = 0;      // seconds spent circling after a steal, so he doesn't chain steals
    this.restAt = null;
    this.newLeg(from);
    tag.classList.remove('hidden');
  }

  setLevel(level) { this.plane.stats = statsFor(level, this.rank); this.baseSpeed = this.plane.stats.speed; }

  /** A new parcel is waiting at `from`. */
  newLeg(from) {
    this.pickup = from.c;
    this.loaded = this.plane.up.angleTo(from.c) < PICKUP;
  }

  /** After stealing, Rex circles the city for a moment before chasing the next parcel. */
  gloat(city) {
    this.rest = REX.rest;
    this.restAt = city.c;
  }

  /** Flies one step toward `dest`; returns true when Rex got there first. */
  update(dt, dest, cargo) {
    const pl = this.plane;
    this.rest = Math.max(0, this.rest - dt);
    this.boosting = this.rank >= REX.boostRank && this.loaded && this.rest <= 0 && pl.up.angleTo(dest.c) < REX.boostRange;
    pl.stats.speed = this.baseSpeed * (this.boosting ? REX.boost : 1);
    if (this.cargo !== cargo) {
      this.cargo = cargo;
      pl.setCargo(cargo);
      pl.cargoSpeed = pl.cargoClimb = 1; // the crate is just for looks: Rex isn't slowed down by heavy parcels
    }
    if (this.rest > 0) pl.steerToward(this.restAt, 1.8);
    else pl.steerToward(this.loaded ? dest.c : this.pickup);
    pl.update(dt);
    this.loaded ||= pl.up.angleTo(this.pickup) < PICKUP;
    this.placeTag();
    return this.loaded && this.rest <= 0 && pl.up.angleTo(dest.c) < 0.07 && pl.alt < this.planet.surfR(dest.c) + 3.2;
  }

  placeTag() {
    const pl = this.plane, s = this.toScreen(_v.copy(pl.up).multiplyScalar(pl.alt + 0.2));
    this.tag.classList.toggle('hidden', !s);
    if (!s) return;
    this.tag.style.left = `${s.x}px`;
    this.tag.style.top = `${s.y}px`;
  }

  /** Ground distance to a point, in the game's "km". */
  kmTo(c) { return Math.round(this.plane.up.angleTo(c) * R * 100); }

  get pos() { return this.plane.pos; }

  dispose() {
    this.plane.dispose();
    this.tag.classList.add('hidden');
  }
}
