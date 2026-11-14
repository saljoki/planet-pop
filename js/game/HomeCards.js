import { MISSIONS } from './Missions.js';
import { todayKey, dailyPlace } from './Daily.js';

/** The six ways in from Home, in display order. Keep their words here for future translation. */
export const HOME_CARDS = [
  { id: 'courier', icon: '📦', name: 'Courier run', desc: 'Beat the clock. Deliver parcels!' },
  { id: 'daily', icon: '📅', name: 'Daily challenge', desc: 'One planet. Same route for everyone.' },
  { id: 'missions', icon: '🎯', name: 'Missions', desc: 'A new challenge every flight.' },
  { id: 'space', icon: '🚀', name: 'Space courier', desc: 'Take parcels to other worlds.' },
  { id: 'roads', icon: '🚗', name: 'Road trips', desc: 'Drive, race or take a boat out.' },
  { id: 'free', icon: '🕊️', name: 'Free flight', desc: 'No clock. Just you and the sky.' },
];

/** The one-line progress note on a card; cards without progress use their description. */
export function cardStat(id, progress, career = null) {
  if (id === 'courier') {
    const best = progress.best ? `⭐ Best ${progress.best.toLocaleString('en-GB')}` : 'Not flown yet', score = career?.rex;
    return `${best}${score && (score.you || score.rex) ? ` · You ${score.you.toLocaleString('en-GB')} · Rex ${score.rex.toLocaleString('en-GB')}` : ''}`;
  }
  if (id === 'daily') {
    const best = progress.dailyBest(todayKey());
    return `${dailyPlace()} · ${best === null ? 'not flown today' : `⭐ ${best.toLocaleString('en-GB')} today`}`;
  }
  if (id === 'missions') return `⭐ ${progress.totalStars} / ${MISSIONS.length * 3}`;
  return '';
}

/** The first useful next flight: First Flight, today's daily, an unlocked mission, then a courier run. */
export function nextUp(progress) {
  const mission = (m) => ({ icon: m.icon, title: m.name, text: m.brief, mission: m });
  const card = (id) => {
    const c = HOME_CARDS.find((entry) => entry.id === id);
    return { icon: c.icon, title: c.name, text: id === 'daily' ? dailyPlace() : c.desc, card: id };
  };
  if (!progress.missionDone(MISSIONS[0].id)) return mission(MISSIONS[0]);
  if (progress.dailyBest(todayKey()) === null) return card('daily');
  const next = MISSIONS.find((m, i) => progress.missionUnlocked(i) && !progress.missionDone(m.id));
  return next ? mission(next) : card('courier');
}
