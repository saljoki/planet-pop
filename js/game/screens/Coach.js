import { Widget } from '../../ui/Widget.js';
import { LESSONS } from '../Lessons.js';

/** The flying lesson's one short prompt and its progress dots. */
export class Coach extends Widget {
  constructor(game) {
    super({ id: 'gCoach', className: 'badge', parent: game.el,
      html: '<div id="gCoachText"></div><div id="gCoachDots" aria-label="Lesson progress"></div>' });
    this.dom = { text: this.$('gCoachText'), dots: this.$('gCoachDots') };
  }

  say(index, text) {
    this.dom.text.textContent = text;
    this.dom.dots.innerHTML = LESSONS.map((_, i) => `<span aria-hidden="true" class="${i < index ? 'done' : i === index ? 'current' : ''}"></span>`).join('');
    this.el.classList.remove('ticked');
    this.el.classList.remove('nudged');
    this.show();
  }

  tick() { this.flash('ticked'); }

  nudge() { this.flash('nudged'); }

  /** Restart the CSS flash without a timer surviving the run. */
  flash(name) {
    this.el.classList.remove(name);
    void this.el.offsetWidth;
    this.el.classList.add(name);
  }

  hide() {
    super.hide();
    this.el.classList.remove('ticked');
    this.el.classList.remove('nudged');
  }
}
