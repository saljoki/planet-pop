/** Eight-bar loops. A step is a sixteenth note; note lengths include their short release. */
const C = 130.813, D = 146.832, E = 164.814, F = 174.614, G = 195.998, A = 220;
const roots = [C, A / 2, F, G, C, F, G, C];
const melody = [
  [E * 4, G * 4, A * 4, G * 4, E * 4, D * 4],
  [E * 4, A * 4, G * 4, E * 4, D * 4, C * 4],
  [C * 4, D * 4, E * 4, G * 4, E * 4, D * 4],
  [D * 4, G * 4, A * 4, G * 4, D * 4, E * 4],
  [E * 4, G * 4, A * 4, G * 4, E * 4, C * 4],
  [C * 4, E * 4, G * 4, A * 4, G * 4, E * 4],
  [D * 4, G * 4, A * 4, G * 4, E * 4, D * 4],
  [E * 4, D * 4, C * 4, G * 2, C * 4, C * 4],
];
const bass = (busy) => roots.flatMap((root, bar) => Array.from({ length: busy ? 8 : 4 }, (_, i) => ({
  step: bar * 16 + i * (busy ? 2 : 4), freq: root * (i % 2 ? 1.5 : 1), length: busy ? 1.4 : 2.6,
})));
const lead = (busy) => melody.flatMap((notes, bar) => (busy ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 3, 6, 8, 11, 14]).map((step, i) => ({
  step: bar * 16 + step, freq: notes[i % notes.length], length: busy ? 1.2 : 1.4,
})));
const hats = (offbeat) => Array.from({ length: 64 }, (_, i) => ({ step: i * 2 + offbeat, freq: 1600, length: 0.28 }));

/** Synthesised voices only: square/triangle bass and melody, a quiet noise hat, and sparse space pads. */
export const TUNES = {
  menu: {
    id: 'menu', bpm: 100, bars: 8, steps: 16,
    voices: [
      { wave: 'triangle', gain: 0.32, notes: bass(false) },
      { wave: 'square', gain: 0.10, notes: lead(false) },
      { wave: 'noise', gain: 0.045, notes: hats(0) },
    ],
  },
  flight: {
    id: 'flight', bpm: 132, bars: 8, steps: 16,
    voices: [
      { wave: 'triangle', gain: 0.30, notes: bass(true) },
      { wave: 'square', gain: 0.09, notes: lead(true) },
      { wave: 'noise', gain: 0.04, notes: hats(1) },
    ],
  },
  space: {
    id: 'space', bpm: 62, bars: 8, steps: 16,
    voices: [
      { wave: 'triangle', gain: 0.24, notes: [C, A / 2, F, G].map((freq, i) => ({ step: i * 32, freq, length: 24 })) },
      { wave: 'sine', gain: 0.22, notes: [E * 2, C * 2, A * 2, D * 2].map((freq, i) => ({ step: i * 32 + 8, freq, length: 20 })) },
    ],
  },
};
