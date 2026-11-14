import { MISSIONS } from './Missions.js';

export const LESSON_PLANET = MISSIONS[0].planet;
export const LESSON_COINS = 50;

/** One prompt at a time, chosen for the controls the pilot is using. */
export const LESSONS = [
  { id: 'steer', touch: 'Drag left and right to steer', keys: '← → to steer', pad: 'Left stick to steer', seconds: 1.2 },
  { id: 'climb', touch: 'Drag up to climb, down to dive', keys: '↑ ↓ to climb and dive', pad: 'Stick up and down to climb and dive', seconds: 1.2 },
  { id: 'boost', touch: 'Hold BOOST', keys: 'Hold Space', pad: 'Hold A', seconds: 1 },
  { id: 'ring', text: 'Fly through the blue ring' },
  { id: 'deliver', text: 'Follow the arrow. Swoop low through the pink beacon!' },
];

export const LESSON_TEXT = {
  lower: 'Lower! Swoop through the beacon',
  title: "🎓 You're a courier!",
  delivered: 'First parcel delivered',
  reward: `🪙 +${LESSON_COINS} coins`,
  again: '↻ Lesson again',
};

/** Invert Y changes the words as well as the plane's controls. */
export function lessonPrompt(index, { touch = false, pad = false, invertY = false } = {}) {
  const step = LESSONS[index];
  let text = step.text ?? step[pad ? 'pad' : touch ? 'touch' : 'keys'];
  if (step.id === 'climb' && invertY) text = text.replace(/climb|dive/g, (word) => word === 'climb' ? 'dive' : 'climb');
  return text;
}
