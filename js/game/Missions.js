import { themeOf } from '../world/Themes.js';
import { worldOf } from '../space/Worlds.js';

/**
 * Sky Courier missions in chapter order: ten in Flight school, then three on every real world.
 * Each fixed planet supplies the mission's landmarks, towns and hazards. `goal.stat` names a run counter;
 * `failIf` ends the mission when that counter goes above zero. `par` is seconds for the time star, and `bonus`
 * supplies the third star's tally minimum or maximum (default: no knocks).
 * Setup flags: cargo, rival, rexLevel, night, dark, sunny, ufoIn, eruptions, landmark, tour, fetch, carry and item.
 */
export const MISSIONS = [
  { id: 'first', icon: '📦', name: 'First Flight', brief: 'Deliver 3 parcels.',
    planet: { seed: 20261014, land: 0.45, cities: 5, theme: 'classic' }, goal: { stat: 'deliveries', target: 3 }, reward: 100, par: 55 },
  { id: 'rush', icon: '⚡', name: 'Rush Hour', brief: 'Deliver 2 urgent parcels.',
    planet: { seed: 777, land: 0.45, cities: 6, theme: 'desert' }, goal: { stat: 'urgent', target: 2 }, reward: 150, par: 100, cargo: { urgent: 3 } },
  { id: 'rings', icon: '💍', name: 'Ring Master', brief: 'Fly through 15 blue rings. The arrow shows the nearest.',
    planet: { seed: 5, land: 0.45, cities: 4, theme: 'candy' }, goal: { stat: 'rings', target: 15 }, reward: 150, par: 35 },
  { id: 'care', icon: '🥚', name: 'Handle With Care', brief: 'Deliver 2 fragile parcels. Break one and it’s over.',
    planet: { seed: 777, land: 0.45, cities: 6, theme: 'ice' }, goal: { stat: 'fragile', target: 2 }, failIf: 'broken', reward: 200, par: 140, cargo: { fragile: 4 },
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  { id: 'pitstop', icon: '⛽', name: 'Pit Stop', brief: 'Refuel by skimming an airport runway twice.',
    planet: { seed: 42, land: 0.25, cities: 2, theme: 'classic' }, goal: { stat: 'refuels', target: 2 }, reward: 200, par: 20 },
  { id: 'heavy', icon: '🏋️', name: 'Heavy Lifter', brief: 'Deliver 3 heavy parcels.',
    planet: { seed: 9001, land: 0.6, cities: 6, theme: 'desert' }, goal: { stat: 'heavy', target: 3 }, reward: 250, par: 135, cargo: { heavy: 4 } },
  { id: 'rex', icon: '😈', name: 'Outrun Rex', brief: 'Beat Rival Rex to 3 cities in a row. He’s here from the start.',
    planet: { seed: 777, land: 0.45, cities: 6, theme: 'classic' }, goal: { stat: 'rexStreak', target: 3 }, reward: 250, par: 45, rival: true },
  { id: 'night', icon: '🌙', name: 'Night Shift', brief: 'Deliver 3 parcels to cities in darkness.',
    planet: { seed: 12345, land: 0.3, cities: 8, theme: 'ice' }, goal: { stat: 'night', target: 3 }, reward: 300, par: 40, night: true },
  { id: 'ufo', icon: '🛸', name: 'Close Encounter', brief: 'A UFO is coming. Fly right through it.',
    planet: { seed: 12345, land: 0.3, cities: 8, theme: 'candy' }, goal: { stat: 'ufo', target: 1 }, reward: 300, par: 30, ufoIn: 12 },
  { id: 'ash', icon: '🌋', name: 'Ash Dodger', brief: 'Deliver 4 parcels while the volcanoes erupt. Touch the ash and it’s over.',
    planet: { seed: 20261014, land: 0.45, cities: 5, theme: 'lava' }, goal: { stat: 'deliveries', target: 4 }, failIf: 'ash', reward: 400, par: 60, eruptions: true },
  // Earth
  { id: 'airmail', icon: '✉️', name: 'Air Mail', brief: 'Deliver 4 parcels between Earth’s great cities.',
    planet: { world: 'earth' }, goal: { stat: 'deliveries', target: 4 }, reward: 150, par: 80 },
  { id: 'express', icon: '📮', name: 'Express Post', brief: 'Deliver fast enough to build a x4 combo.',
    planet: { world: 'earth' }, goal: { stat: 'combo', target: 4 }, reward: 250, par: 40,
    bonus: { stat: 'rings', min: 5, text: 'Collect 5 rings' } },
  { id: 'wonders', icon: '📷', name: 'Wonders of the World', brief: 'Photograph Mount Everest, the Sahara and the Amazon. Fly low over each one.',
    planet: { world: 'earth' }, goal: { stat: 'visits', target: 3 }, reward: 300, par: 30, tour: ['Mount Everest','The Sahara','The Amazon'], item: '📷 Photo' },
  // The Moon
  { id: 'flag', icon: '🚩', name: 'One Small Step', brief: 'Fly a flag to Tranquility Base, where Apollo 11 landed.',
    planet: { world: 'moon' }, goal: { stat: 'landmark', target: 1 }, reward: 150, par: 20, landmark: 'Tranquility Base', item: '🚩 Flag' },
  { id: 'moonrock', icon: '🪨', name: 'Moon Rock', brief: 'Collect a rock from Tycho crater and fly it to the lab.',
    planet: { world: 'moon' }, goal: { stat: 'deliveries', target: 1 }, reward: 200, par: 25, fetch: 'Tycho', item: '🪨 Moon rock' },
  { id: 'spacerace', icon: '🏁', name: 'Space Race', brief: 'Rex wants the Moon too. Beat him to 3 towns in a row.',
    planet: { world: 'moon' }, goal: { stat: 'rexStreak', target: 3 }, reward: 300, par: 35, rival: true,
    bonus: { stat: 'stolen', max: 0, text: 'Rex steals nothing' } },
  // Mars
  { id: 'dust', icon: '🌪️', name: 'Dust Storm Medicine', brief: 'Deliver 3 urgent parcels of medicine while dust storms sweep Mars.',
    planet: { world: 'mars' }, goal: { stat: 'urgent', target: 3 }, reward: 250, par: 70, cargo: { urgent: 4 } },
  { id: 'rovers', icon: '🤖', name: 'Rover Rescue', brief: 'Fly a spare wheel to the rover in Gale crater and another to the one in Jezero crater.',
    planet: { world: 'mars' }, goal: { stat: 'visits', target: 2 }, reward: 250, par: 20, tour: ['Gale crater','Jezero crater'], item: '🛞 Spare wheel' },
  { id: 'olympus', icon: '🌋', name: 'Top of the Solar System', brief: 'Carry a heavy weather station up Olympus Mons, the tallest volcano on any planet.',
    planet: { world: 'mars' }, goal: { stat: 'landmark', target: 1 }, reward: 350, par: 25, landmark: 'Olympus Mons', carry: 'heavy', item: '🌡️ Weather station',
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  // Venus
  { id: 'cloudhop', icon: '☁️', name: 'Cloud City Shuttle', brief: 'Deliver 4 parcels between Venus’s floating towns.',
    planet: { world: 'venus' }, goal: { stat: 'deliveries', target: 4 }, reward: 250, par: 60 },
  { id: 'ballast', icon: '🎈', name: 'Ballast Run', brief: 'The rafts need ballast to stay level. Deliver 3 heavy parcels.',
    planet: { world: 'venus' }, goal: { stat: 'heavy', target: 3 }, reward: 350, par: 195, cargo: { heavy: 4 },
    bonus: { stat: 'rings', min: 5, text: 'Collect 5 rings' } },
  { id: 'acid', icon: '⚡', name: 'Acid Rain', brief: 'Deliver 3 parcels between the cloud towns of Venus. Get struck by lightning and it’s over.',
    planet: { world: 'venus' }, goal: { stat: 'deliveries', target: 3 }, failIf: 'zaps', reward: 300, par: 50 },
  // Mercury
  { id: 'shade', icon: '🌗', name: 'Keep to the Shade', brief: 'Deliver 3 parcels to towns on Mercury’s night side. The sunshine cooks you.',
    planet: { world: 'mercury' }, goal: { stat: 'night', target: 3 }, reward: 350, par: 35, dark: true },
  { id: 'sundash', icon: '☀️', name: 'Sunrise Dash', brief: 'Deliver 2 parcels to towns in full sunshine. Get in and out before you cook.',
    planet: { world: 'mercury' }, goal: { stat: 'deliveries', target: 2 }, reward: 350, par: 20, sunny: true,
    bonus: { stat: 'sun', max: 15, text: 'Under 15 s in the sunshine' } },
  { id: 'gallery', icon: '🎨', name: 'Gallery Tour', brief: 'Mercury’s craters are named after artists. Visit Beethoven, Rembrandt and Hokusai.',
    planet: { world: 'mercury' }, goal: { stat: 'visits', target: 3 }, reward: 400, par: 45, tour: ['Beethoven','Rembrandt','Hokusai'], item: '📷 Photo',
    bonus: { stat: 'sun', max: 20, text: 'Under 20 s in the sunshine' } },
  // Jupiter
  { id: 'stations', icon: '🎈', name: 'Station to Station', brief: 'Deliver 4 parcels between Jupiter’s balloon stations.',
    planet: { world: 'jupiter' }, goal: { stat: 'deliveries', target: 4 }, reward: 300, par: 60 },
  { id: 'storm', icon: '🌀', name: 'Eye of the Storm', brief: 'Fly a loop round Jupiter’s Great Red Spot, a storm wider than Earth.',
    planet: { world: 'jupiter' }, goal: { stat: 'loops', target: 1 }, reward: 300, par: 40 },
  { id: 'king', icon: '😈', name: 'King of the Clouds', brief: 'Deliver 4 parcels with Rex on your tail. If he steals one, it’s over.',
    planet: { world: 'jupiter' }, goal: { stat: 'deliveries', target: 4 }, reward: 400, par: 55, failIf: 'stolen', rival: true, rexLevel: 3 },
  // Io
  { id: 'sulphur', icon: '🌋', name: 'Sulphur Run', brief: 'Deliver 3 parcels on Io while its volcanoes erupt. Fly into a plume and it’s over.',
    planet: { world: 'io' }, goal: { stat: 'deliveries', target: 3 }, failIf: 'ash', reward: 400, par: 25, eruptions: true },
  { id: 'loki', icon: '🔥', name: 'Lake of Fire', brief: 'Fly a heat probe to Loki Patera, a lake of lava 200 km across.',
    planet: { world: 'io' }, goal: { stat: 'landmark', target: 1 }, reward: 300, par: 20, landmark: 'Loki Patera', item: '🌡️ Heat probe' },
  { id: 'thread', icon: '💍', name: 'Between the Volcanoes', brief: 'Fly through 12 rings while Io’s volcanoes erupt. Touch a plume and it’s over.',
    planet: { world: 'io' }, goal: { stat: 'rings', target: 12 }, reward: 400, par: 35, failIf: 'ash', eruptions: true },
  // Europa
  { id: 'sample', icon: '🧪', name: 'Ocean Sample', brief: 'Fly a sample of Europa’s hidden ocean to the scientists at Conamara Chaos. It’s fragile.',
    planet: { world: 'europa' }, goal: { stat: 'landmark', target: 1 }, failIf: 'broken', reward: 350, par: 20, landmark: 'Conamara Chaos', carry: 'fragile', item: '🧪 Ocean sample',
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  { id: 'drill', icon: '⛏️', name: 'Ice Core', brief: 'Collect an ice core at Pwyll crater and fly it to the lab. It’s fragile.',
    planet: { world: 'europa' }, goal: { stat: 'deliveries', target: 1 }, reward: 350, par: 30, failIf: 'broken', fetch: 'Pwyll', carry: 'fragile', item: '🧊 Ice core',
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  { id: 'signs', icon: '🐟', name: 'Signs of Life', brief: 'The scientists can’t wait. Deliver 3 urgent parcels.',
    planet: { world: 'europa' }, goal: { stat: 'urgent', target: 3 }, reward: 400, par: 80, cargo: { urgent: 4 },
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  // Ganymede
  { id: 'biggest', icon: '📦', name: 'The Biggest Moon', brief: 'Deliver 4 parcels on Ganymede, a moon wider than Mercury.',
    planet: { world: 'ganymede' }, goal: { stat: 'deliveries', target: 4 }, reward: 300, par: 45 },
  { id: 'aurora', icon: '🌌', name: 'Under the Aurora', brief: 'Deliver 3 parcels to towns in the dark, under Ganymede’s own aurora.',
    planet: { world: 'ganymede' }, goal: { stat: 'night', target: 3 }, reward: 350, par: 60, dark: true },
  { id: 'grooves', icon: '🗺️', name: 'Old Ground, New Ground', brief: 'Survey Galileo Regio, Uruk Sulcus and the crater Tros. Fly low over each one.',
    planet: { world: 'ganymede' }, goal: { stat: 'visits', target: 3 }, reward: 400, par: 35, tour: ['Galileo Regio','Uruk Sulcus','Tros'], item: '📷 Photo',
    bonus: { stat: 'rings', min: 5, text: 'Collect 5 rings' } },
  // Saturn
  { id: 'ringside', icon: '🪐', name: 'Ringside Seats', brief: 'Deliver 3 parcels between Saturn’s stations, under the rings.',
    planet: { world: 'saturn' }, goal: { stat: 'deliveries', target: 3 }, reward: 300, par: 60,
    bonus: { stat: 'threads', min: 1, text: 'Fly through the ring ice once' } },
  { id: 'ringrun', icon: '💫', name: 'Ring Run', brief: 'Fly through Saturn’s ring ice 3 times. Touch a chunk and it’s over.',
    planet: { world: 'saturn' }, goal: { stat: 'threads', target: 3 }, failIf: 'ice', reward: 400, par: 20 },
  { id: 'hexagon', icon: '⬡', name: 'Six Sides', brief: 'Fly a loop round the Hexagon, the six-sided jet stream at Saturn’s north pole.',
    planet: { world: 'saturn' }, goal: { stat: 'loops', target: 1 }, reward: 400, par: 30 },
  // Titan
  { id: 'huygens', icon: '📡', name: 'Battery for Huygens', brief: 'Take a new battery to the Huygens probe, which landed on Titan in 2005.',
    planet: { world: 'titan' }, goal: { stat: 'landmark', target: 1 }, reward: 300, par: 20, landmark: 'The Huygens landing site', item: '🔋 A battery' },
  { id: 'methane', icon: '🧪', name: 'Methane Sea', brief: 'Scoop a sample from Kraken Mare, a sea of liquid methane, and fly it to the lab.',
    planet: { world: 'titan' }, goal: { stat: 'deliveries', target: 1 }, reward: 350, par: 30, fetch: 'Kraken Mare', item: '🧪 Methane sample' },
  { id: 'airtour', icon: '🗺️', name: 'Titan Air Tour', brief: 'Fly low over Xanadu, Ligeia Mare and the Huygens landing site.',
    planet: { world: 'titan' }, goal: { stat: 'visits', target: 3 }, reward: 400, par: 30, tour: ['Xanadu','Ligeia Mare','The Huygens landing site'], item: '📷 Photo' },
  // Enceladus
  { id: 'snowball', icon: '⚪', name: 'Snowball Express', brief: 'Deliver 3 parcels between the two towns of the whitest moon there is.',
    planet: { world: 'enceladus' }, goal: { stat: 'deliveries', target: 3 }, reward: 300, par: 25,
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  { id: 'stripes', icon: '🐯', name: 'Tiger Stripes', brief: 'Fly a camera to the tiger stripes, the cracks the geysers spray from.',
    planet: { world: 'enceladus' }, goal: { stat: 'landmark', target: 1 }, reward: 350, par: 20, landmark: 'The tiger stripes', item: '📷 Camera' },
  { id: 'taste', icon: '⛲', name: 'Taste the Ocean', brief: 'Fly through a geyser for 3 seconds to catch a sample of the ocean below. Your engine will splutter!',
    planet: { world: 'enceladus' }, goal: { stat: 'ash', target: 3 }, reward: 450, par: 30, eruptions: true },
  // Uranus
  { id: 'chill', icon: '🧊', name: 'Cold Chain', brief: 'Deliver 2 fragile parcels between Uranus’s weather stations. Break one and it’s over.',
    planet: { world: 'uranus' }, goal: { stat: 'fragile', target: 2 }, failIf: 'broken', reward: 350, par: 70, cargo: { fragile: 4 },
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  { id: 'polarnight', icon: '🌑', name: 'The Long Night', brief: 'Deliver 2 parcels to the station where the Sun hasn’t risen for years.',
    planet: { world: 'uranus' }, goal: { stat: 'night', target: 2 }, reward: 400, par: 40, dark: true },
  { id: 'sideways', icon: '💍', name: 'The Sideways Planet', brief: 'Fly through 18 rings round the planet that rolls on its side.',
    planet: { world: 'uranus' }, goal: { stat: 'rings', target: 18 }, reward: 450, par: 35 },
  // Neptune
  { id: 'gale', icon: '💨', name: 'Gale Force', brief: 'Deliver 3 parcels on Neptune, where the wind blows you west all the time.',
    planet: { world: 'neptune' }, goal: { stat: 'deliveries', target: 3 }, reward: 400, par: 40 },
  { id: 'darkspot', icon: '🌀', name: 'The Great Dark Spot', brief: 'Fly a loop round the Great Dark Spot while the wind pushes you west.',
    planet: { world: 'neptune' }, goal: { stat: 'loops', target: 1 }, reward: 450, par: 30 },
  { id: 'supersonic', icon: '💨', name: 'Supersonic Winds', brief: 'Deliver 3 urgent parcels in winds of 2,000 km/h. Make the wind work for you.',
    planet: { world: 'neptune' }, goal: { stat: 'urgent', target: 3 }, reward: 500, par: 80, cargo: { urgent: 4 },
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  // Triton
  { id: 'backwards', icon: '🔄', name: 'The Backwards Moon', brief: 'Deliver 3 parcels on Triton, the moon that orbits the wrong way.',
    planet: { world: 'triton' }, goal: { stat: 'deliveries', target: 3 }, reward: 350, par: 55 },
  { id: 'cantaloupe', icon: '🍈', name: 'Cantaloupe Country', brief: 'Collect an ice sample from the cantaloupe terrain, ground that looks like a melon’s skin, and fly it to the lab.',
    planet: { world: 'triton' }, goal: { stat: 'deliveries', target: 1 }, reward: 400, par: 30, fetch: 'The cantaloupe terrain', item: '🧊 Ice sample',
    bonus: { stat: 'rings', min: 4, text: 'Collect 4 rings' } },
  { id: 'geysers', icon: '⛲', name: 'Nitrogen Geysers', brief: 'Deliver 3 parcels while Triton’s geysers erupt. Fly into a plume and it’s over.',
    planet: { world: 'triton' }, goal: { stat: 'deliveries', target: 3 }, reward: 450, par: 35, failIf: 'ash', eruptions: true },
  // Pluto
  { id: 'hotel', icon: '🛎️', name: 'Room Service', brief: 'Fly a birthday cake to the Ice Hotel on Pluto’s heart. Crash and it’s over.',
    planet: { world: 'pluto' }, goal: { stat: 'landmark', target: 1 }, failIf: 'broken', reward: 400, par: 20, landmark: 'The Ice Hotel', carry: 'fragile', item: '🎂 Birthday cake',
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  { id: 'heart', icon: '💙', name: 'Heart of Pluto', brief: 'Fly low over Sputnik Planitia, Tenzing Montes and Wright Mons, round Pluto’s heart.',
    planet: { world: 'pluto' }, goal: { stat: 'visits', target: 3 }, reward: 450, par: 25, tour: ['Sputnik Planitia','Tenzing Montes','Wright Mons'], item: '📷 Photo' },
  { id: 'edge', icon: '😈', name: 'Race to the Edge', brief: 'Rex has followed you all the way out. Beat him to 3 towns in a row.',
    planet: { world: 'pluto' }, goal: { stat: 'rexStreak', target: 3 }, reward: 500, par: 40, rival: true, rexLevel: 6,
    bonus: { stat: 'stolen', max: 0, text: 'Rex steals nothing' } },
  // Charon
  { id: 'ferry', icon: '⛴️', name: 'The Ferryman', brief: 'Deliver 3 parcels between Charon’s two towns.',
    planet: { world: 'charon' }, goal: { stat: 'deliveries', target: 3 }, reward: 400, par: 25,
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  { id: 'redpole', icon: '🔴', name: 'The Red Pole', brief: 'Fly a spectrometer to Mordor Macula, the dark red cap on Charon’s north pole.',
    planet: { world: 'charon' }, goal: { stat: 'landmark', target: 1 }, reward: 450, par: 20, landmark: 'Mordor Macula', item: '🔬 Spectrometer' },
  { id: 'master', icon: '🎓', name: 'Master Courier', brief: 'The last test, at the edge of the solar system: build a x5 combo.',
    planet: { world: 'charon' }, goal: { stat: 'combo', target: 5 }, reward: 500, par: 30 },
];

/** Where a mission is flown, for the board and the briefing: a real world, or a kind of made-up planet ({ icon, name }). */
export const placeOf = (m) => (m.planet.world ? worldOf(m.planet.world) : themeOf(m.planet.theme));

/** Readable names for the counters, for the HUD and the board. */
export const STAT_LABEL = {
  deliveries: 'parcels', urgent: 'urgent', fragile: 'fragile', heavy: 'heavy', rings: 'rings', refuels: 'refuels',
  rexStreak: 'in a row', night: 'at night', ufo: 'UFO', landmark: 'delivered', loops: 'loop', threads: 'through the ring',
  combo: 'combo', visits: 'visited', ash: 's in the plume',
};

export const missionIndex = (id) => MISSIONS.findIndex((m) => m.id === id);
