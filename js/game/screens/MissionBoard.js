import { MISSIONS, missionIndex } from '../Missions.js';
import { CHAPTERS, missionsIn } from '../Chapters.js';
import { Overlay } from '../../ui/Overlay.js';

/** The pilot's journey through Flight school and the worlds, with their stars and the gates still ahead. */
export class MissionBoard extends Overlay {
  constructor(app, progress, onPlay) {
    super({ id: 'missions', html: `
      <div class="mission-header" id="mHead">
        <button class="close" id="mClose" title="Close">✕</button>
        <h2>🎯 Missions</h2>
        <div class="coins" id="mStars"></div>
      </div>
      <div id="mList"></div>` });
    this.app = app;
    this.progress = progress;
    this.onPlay = onPlay;
    this.dom = { close: this.$('mClose'), header: this.$('mHead'), stars: this.$('mStars'), list: this.$('mList'), panel: this.el.firstElementChild };
    this.dom.close.addEventListener('click', () => this.hide());
    this.el.addEventListener('click', (e) => this.play(e.target.closest?.('button[data-play]')?.dataset.play));
  }

  show() {
    this.render();
    this.dom.panel.scrollTop = 0;
    super.show();
    this.revealCurrentChapter();
  }

  /** Keep a three-flight chapter and the next gate in view, including near the end of the journey. */
  revealCurrentChapter() {
    const { panel, header, current, nextGate } = this.dom;
    if (!panel.getBoundingClientRect || !header.getBoundingClientRect || !current?.getBoundingClientRect) return;
    const bounds = panel.getBoundingClientRect(), start = current.getBoundingClientRect();
    const end = (nextGate ?? current).getBoundingClientRect(), bottom = bounds.bottom - panel.clientTop;
    const available = panel.clientHeight - header.getBoundingClientRect().height;
    if (end.bottom - start.top <= available && end.bottom > bottom) panel.scrollTop += end.bottom - bottom;
  }

  /** Both a new flight and a replay use the same unlocked mission and callback. */
  play(id) {
    const i = missionIndex(id);
    if (i < 0 || !this.progress.missionUnlocked(i)) return false;
    this.hide();
    this.onPlay(MISSIONS[i]);
    return true;
  }

  chapterStars(id) { return missionsIn(id).reduce((n, m) => n + this.progress.starsFor(m.id), 0); }

  chapterState(id) {
    if (!this.progress.chapterOpen(id)) return 'closed';
    const max = missionsIn(id).length * 3;
    return max > 0 && this.chapterStars(id) === max ? 'done' : 'open';
  }

  summary(chapter) {
    const state = this.chapterState(chapter.id);
    if (state === 'closed') return `🔒 ${chapter.name} · ${chapter.gate - this.progress.totalStars} more ⭐ to open`;
    return `${chapter.icon} ${chapter.name} · ⭐ ${this.chapterStars(chapter.id)} / ${missionsIn(chapter.id).length * 3}${state === 'done' ? ' ✔' : ''}`;
  }

  row(m) {
    const p = this.progress, state = p.missionDone(m.id) ? 'done' : p.missionUnlocked(missionIndex(m.id)) ? 'open' : 'locked';
    const stars = p.starsFor(m.id), btn = state === 'locked' ? '<button disabled aria-label="Mission locked">🔒</button>'
      : `<button data-play="${m.id}" class="${state === 'open' ? 'big' : ''}">${state === 'done' ? '↻ Again' : '▶ Fly'}</button>`;
    return `<div class="mission ${state}"><span class="icon">${state === 'done' ? '✅' : m.icon}</span>
      <div class="info"><div class="mission-title">${m.name}<span class="mission-stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span></div>
      <small>${m.brief}</small><small class="reward">${state === 'done' ? 'earned' : `🪙 ${m.reward}`}</small></div>${btn}</div>`;
  }

  render() {
    const p = this.progress, current = CHAPTERS.find((c) => missionsIn(c.id).some((m) => !p.missionDone(m.id) && p.missionUnlocked(missionIndex(m.id))));
    this.dom.stars.textContent = `⭐ ${p.totalStars} / ${MISSIONS.length * 3}`;
    this.dom.list.innerHTML = CHAPTERS.map((c) => {
      const state = this.chapterState(c.id);
      return `<details class="chapter" data-chapter="${c.id}" data-state="${state}"${c === current ? ' open' : ''}>
        <summary>${this.summary(c)}</summary>${missionsIn(c.id).map((m) => this.row(m)).join('')}</details>`;
    }).join('');
    this.dom.current = current ? this.dom.list.querySelector(`[data-chapter="${current.id}"]`) : null;
    this.dom.nextGate = this.dom.current?.nextElementSibling?.querySelector('summary') ?? null;
  }
}
