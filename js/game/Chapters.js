import { MISSIONS } from './Missions.js';
import { worldOf } from '../space/Worlds.js';

/** Mission chapters, in travel order; gates count the pilot's best stars across all missions. */
export const CHAPTERS = [
  { id: 'school', icon: '🎓', name: 'Flight school', gate: 0 },
  ...[
    ['earth', 3], ['moon', 6], ['mars', 10], ['venus', 15], ['mercury', 20], ['jupiter', 26],
    ['io', 32], ['europa', 38], ['ganymede', 44], ['saturn', 51], ['titan', 58], ['enceladus', 65],
    ['uranus', 72], ['neptune', 80], ['triton', 88], ['pluto', 96], ['charon', 104],
  ].map(([id, gate]) => {
    const { icon, name } = worldOf(id);
    return { id, icon, name, gate };
  }),
];

export const chapterOf = (mission) => mission.planet.world ?? 'school';

export const missionsIn = (chapterId) => MISSIONS.filter((m) => chapterOf(m) === chapterId);
