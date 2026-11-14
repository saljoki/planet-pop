import * as THREE from 'three';
import { R, TAU, frame, tangentBasis } from '../../core/Geo.js';
import { mulberry32 } from '../../core/Noise.js';
import { dailySeed } from '../Daily.js';
import { MISSIONS } from '../Missions.js';
import { LESSONS, LESSON_TEXT, lessonPrompt } from '../Lessons.js';
import { Coach } from '../screens/Coach.js';
import { Run } from './Run.js';
import { DeliveryRun } from './DeliveryRun.js';

const _m = new THREE.Matrix4(), _target = new THREE.Vector3();

/** A patient first parcel: five small steps, no clock, no Rex and a fresh plane after a wreck. */
export class LessonRun extends DeliveryRun {
  constructor(game, opts) {
    super(game, opts);
    this.rand = mulberry32(dailySeed('lesson'));
    this.step = 0;
    this.wait = 0;
    this.ringTarget = null;
  }

  get coached() { return true; }
  get hasRival() { return false; }
  get layout() { return { badge: null, stats: false, arrow: false }; }

  takeoff() {
    const at = super.takeoff();
    this.time = 0;
    return at;
  }

  begin() {
    const g = this.game;
    this.coach = (g.coach ??= new Coach(g));
    g.el.classList.add('lesson');
    this.helpWasHidden = g.hud.dom.help.classList.contains('hidden');
    g.hud.dom.help.classList.add('hidden');
    g.hud.dom.goal.textContent = '';
    // Weather still affects the plane; the coach owns the lesson's instructions.
    Object.assign(g.hazards, { warnedStorm: true, warnedAsh: true, warnedHeat: true, warnedWind: true, warnedIce: true });
    g.props.beacon.visible = false;
    g.props.rings.forEach((ring) => this.placeRing(ring));
    this.enter(0);
  }

  /** Begin a step; the screenshot scenes can use this to inspect each prompt. */
  enter(index) {
    this.step = index;
    this.effort = 0;
    this.idle = 0;
    this.wait = 0;
    this.bestDistance = Infinity;
    const g = this.game, pl = this.player, id = LESSONS[index].id;
    if (id === 'ring') {
      this.ringTarget = g.props.rings.reduce((a, b) => a.position.distanceTo(pl.pos) < b.position.distanceTo(pl.pos) ? a : b);
      g.props.ahead(this.ringTarget, pl);
      // Keep ahead()'s gentle placement, but use our seed for the lesson's direction and height.
      const side = pl.up.clone().cross(pl.fwd), d = pl.up.clone().addScaledVector(pl.fwd, 0.25 + this.rand() * 0.05)
        .addScaledVector(side, (this.rand() - 0.5) * 0.04).normalize();
      this.putRing(this.ringTarget, d, pl.fwd, Math.max(R + 2.3, this.planet.groundR(d) + 0.9));
    }
    if (id === 'deliver') {
      const towns = this.planet.cities.sites.filter((town) => pl.up.angleTo(town.c) >= 0.35);
      this.dest = towns.reduce((a, b) => pl.up.angleTo(a.c) < pl.up.angleTo(b.c) ? a : b);
      this.markDest();
    }
    this.prompt(true);
  }

  /** Celebrate, then leave a moment to notice the tick before the next prompt. */
  advance() {
    if (this.wait > 0 || this.game.over) return;
    this.coach.tick();
    this.app.sfx.play('ring');
    this.wait = 0.6;
  }

  prompt(force = false) {
    if (this.game.over || this.wait > 0) return;
    const g = this.game, id = LESSONS[this.step].id;
    let text = lessonPrompt(this.step, { touch: g.touch, pad: !!this.app.gamepad?.state,
      invertY: !!this.app.settings?.get('invertY') });
    if (id === 'deliver' && this.player.up.angleTo(this.dest.c) < 0.25
      && this.player.alt >= this.planet.surfR(this.dest.c) + 3.2) text = LESSON_TEXT.lower;
    if (force || text !== this.coach.dom.text.textContent) this.coach.say(this.step, text);
  }

  update(dt) {
    if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) this.enter(this.step + 1);
      return;
    }
    const step = LESSONS[this.step], pl = this.player, inp = pl.input;
    const input = step.id === 'steer' ? Math.abs(pl.turnInput()) > 0.05
      : step.id === 'climb' ? Math.abs((inp.up ? 1 : 0) - (inp.down ? 1 : 0) + (+inp.climb || 0)) > 0.05
      : step.id === 'boost' ? inp.boost && pl.boost > 0.02 : false;
    let progressed = false;
    if (input) {
      this.effort += dt;
      progressed = true;
      if (this.effort + 1e-6 >= step.seconds) { this.advance(); return; }
    }
    if (step.id === 'ring' || step.id === 'deliver') {
      const distance = step.id === 'ring' ? pl.pos.distanceTo(this.ringTarget.position)
        : pl.up.angleTo(this.dest.c) * R + Math.max(0, pl.alt - this.planet.surfR(this.dest.c) - 2.3);
      if (distance < this.bestDistance - 0.05) { this.bestDistance = distance; progressed = true; }
    }
    this.idle = progressed ? 0 : this.idle + dt;
    if (this.idle >= 10) {
      this.idle = 0;
      this.coach.nudge();
      this.app.sfx.play('beep');
    }
    if (step.id === 'deliver' && this.arrived()) this.deliver();
    this.prompt();
  }

  /** A blue ring only teaches this step when collected while its prompt is up. */
  ring() { if (LESSONS[this.step].id === 'ring') this.advance(); }

  /** Seeded scatter keeps all the lesson's rings repeatable, including after collection. */
  placeRing(ring) {
    const y = this.rand() * 2 - 1, angle = this.rand() * TAU, r = Math.sqrt(1 - y * y);
    const d = new THREE.Vector3(r * Math.cos(angle), y, r * Math.sin(angle));
    this.putRing(ring, d, tangentBasis(d)[0].applyAxisAngle(d, this.rand() * TAU),
      Math.max(R + 1.8 + this.rand() * 1.4, this.planet.groundR(d) + 0.9));
  }

  putRing(ring, d, fwd, radius) {
    frame(_m, d.clone().multiplyScalar(radius), d, fwd);
    ring.position.setFromMatrixPosition(_m);
    ring.quaternion.setFromRotationMatrix(_m);
  }

  crashed() { Run.prototype.crashed.call(this); }
  zapped() {}
  caughtUfo() {}
  checkEnd() {}
  wrecked() { this.game.respawnSoon(); }

  deliver() {
    if (LESSONS[this.step].id !== 'deliver' || this.game.over) return;
    const paid = this.game.progress.finishLesson();
    this.coach.hide();
    this.game.finish({ title: LESSON_TEXT.title,
      html: `${LESSON_TEXT.delivered}${paid ? `<br>${LESSON_TEXT.reward}` : ''}`,
      next: MISSIONS[0], again: LESSON_TEXT.again, bigAgain: false }, 'trophy');
  }

  hud(hud) {
    hud.dom.goal.textContent = '';
    const id = LESSONS[this.step].id, aim = !this.game.over && this.wait <= 0
      ? id === 'ring' ? _target.copy(this.ringTarget.position).normalize() : id === 'deliver' ? this.dest.c : null : null;
    hud.dom.arrow.classList.toggle('hidden', !aim);
    if (aim) hud.pointAt(aim);
    this.prompt();
  }

  end() {
    this.coach?.hide();
    this.game.el.classList.remove('lesson');
    this.game.hud.dom.help.classList.toggle('hidden', this.helpWasHidden);
    super.end();
  }
}
