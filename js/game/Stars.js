/** Whole seconds, shown as a short flight time. */
export function flightTime(seconds) {
  const n = Math.max(0, Math.floor(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

/** A clean flight is the bonus unless the mission asks for something else. */
export const bonusGoal = (def) => def.bonus ?? { stat: 'knocks', max: 0, text: 'No knocks' };

export function bonusMet(def, tally) {
  const goal = bonusGoal(def), value = tally[goal.stat] ?? 0;
  return goal.min === undefined ? value <= goal.max : value >= goal.min;
}

/** The three goals shown on the board, briefing and results card. */
export function starGoals(def) {
  return ['Finish', `Under ${flightTime(def.par ?? 120)}`, bonusGoal(def).text];
}

/** Called only for a finished mission: stars carry no extra coin reward. */
export function starsEarned(def, { elapsed, tally }) {
  return 1 + Number(elapsed <= (def.par ?? 120)) + Number(bonusMet(def, tally));
}
