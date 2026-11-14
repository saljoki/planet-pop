# Planet Pop: handoff

Read this, then `CLAUDE.md` and `docs/EXTENDING.md`, before changing anything.

Planet Pop is a cartoony Three.js planet with life on it, the Sky Courier mini-game, road trips, friends, and a real solar
system you can fly round.

- **Repo:** https://github.com/Saljoki/planet-pop
- **Live:** https://saljoki.github.io/planet-pop/ (GitHub Pages, deploys on every push to `main`)
- **Current branch version:** v0.18.0 on `phase-a-first-five-minutes`, based on v0.17.0 (`878b636`).
  Phase A is awaiting review and has not been merged into `main`.
- **Current spec:** [PHASE_A.md](PHASE_A.md), the first-five-minutes flow, packages A0–A6 and the PR template.
- **Keep this file current.** At the end of each phase, update "Where things stand", the version, and any new gotchas.

## How Ata works

- **Simple and to the point.** Confident, direct language, with no hedging and no fallback phrasing.
- **One class per file.** This is a hard rule; data-only modules are fine.
- **Branches and merges.** Work on a branch, push it, and share the compare link:
  `https://github.com/Saljoki/planet-pop/compare/main...<branch>?expand=1`. Merge into `main` only when he says so.
- **Checking the deploy.** After a merge, wait for the "pages build and deployment" run to succeed:
  `gh run list -R Saljoki/planet-pop`.
- **CI.** The CI workflow fails within about 3 seconds because of a GitHub billing lock, not the code. Ignore it, and
  run the checks locally instead.
- **Phases.** He works in phases. He asks "What's next?", picks options, and you build them as one phase on one branch.
- **Testing.** He plays on his phone afterwards and reports back.
- **Version.** Bump it at the end of each phase in `package.json`, `package-lock.json` (lines 3 and 9) and
  `js/core/Version.js`. A test checks they match.
- **Docs.** Update `README.md` and `docs/EXTENDING.md` in the same phase.

## Checks

| Check | Command | Time | Notes |
|---|---|---|---|
| Tests | `npm test` | about 3 min | node:test suites with a fake DOM |
| Lint | `npm run lint` | | ESLint scans the whole repo, so keep scratch scripts outside it (see "Gotchas") |
| Precache | `npm run precache` | | After any change to a served file. A test fails if `precache.js` is stale |
| Screenshots | `npm run screenshots` | about 95 min for the full set | Puppeteer on software WebGL. Images go to `screenshots/`, which isn't committed |

- **Fewer screenshot scenes.** `SCENES=name1,name2` runs only the scenes whose names contain those words. Scenes build
  on earlier ones in the same area file (`tests/browser/scenes/*.mjs`), so include the scene that opens the world.
- **Full screenshot runs.** Run the full set in the background with a timeout over 100 minutes. Don't run `npm test`
  at the same time: the browser has crashed when the two ran together.
- **What to look at.** Look at the screenshots yourself (read the PNGs) for anything visible. The run ending with
  "✔ No page or shader errors" isn't enough.

## Map of the code

- `js/App.js`: the frame loop and planets, plus the start screen and frame-driven music.
  - `newPlanet`, `buildPlanet` and `buildWorld(id)` build planets.
  - `swapIn(planet)` puts a planet in place and sets the sky's day length and declination from the world.
- `js/world/Planet.js`: the module list (terrain, roads, cities, nature, life, weather and so on).
  - Each module is a class with `update` and `entities`.
- `js/space/`: the real worlds and the solar system.
  - **`Worlds.js`:** the 17 visitable worlds (each world's id, seed, theme, towns, gravity, day, shape, peaks and
    landmarks). Its header comment documents every field.
  - **`WorldThemes.js`:** their looks.
  - **`Bodies.js`:** map bodies with NASA's numbers. Moons have `parent`, `days`, `L0`, `gap`, `au` and `around`.
  - **`Orbits.js`:** JPL orbital elements, plus `orbitAngle` for moons.
  - **The system map:** `SystemMap`, `SystemScene`, `MapView` and `BodyArt`.
  - **Rocket trips:** `Trip` runs the countdown, climb, cruise and landing; `Cruise` is the mini-game on the map.
  - **`SpaceCourier.js`:** parcels between worlds, and Rex.
- `js/core/WorldShape.js`: a real world's ground. Feature kinds are dome, bowl, basin, crater, ridge/valley along
  `points`, cap and paint.
  - The terrain worker uses it too.
- `js/game/`: the Sky Courier game and everything around it.
  - **`CourierGame`** runs the show. `play()` sends a new pilot to `startLesson()`, otherwise to `openHome()`.
  - **Menus:** `screens/HomeScreen.js` owns the six mode cards and next flight; `HomeCards.js` holds their words,
    stats and suggestion order. `screens/Hangar.js` is upgrades and paint only. `screens/Briefing.js` keeps its
    tips, controls and skip choice inside closed How to play details.
  - **Lesson:** `runs/LessonRun.js`, `Lessons.js` (steps and text) and `screens/Coach.js`; separate from First Flight,
    on the same default planet, with no countdown or Rex. `Progress` keeps the optional `lesson` flag and pays 50
    coins on first completion; skipping marks it done without coins.
  - **Runs:** `runs/*Run.js` are the game modes. `Run.js` documents the hooks and `modes.js` picks the run.
  - **Hazards and moves:** `FlightHazards` (storms, dust, heat, ring ice, wind) and `Feats` (long jumps, loops round
    a storm, threading Saturn's ring).
  - **Data:** `Missions.js` (22 missions, in two lists) and `Daily.js` (the world of the day).
- `js/ui/StartScreen.js`: a transparent `Widget` over the first planet build, with PLAY, Explore and Options.
  `Hud.setStartMode()` hides and restores the planet-view furniture. Invite and daily links bypass the title.
- `js/ui/Music.js` and `Tunes.js`: menu, flight and space loops synthesised on the effects AudioContext. Music
  follows the frame loop, crossfades between states and leaves Explore to `Ambience`.
- `js/ui/Achievements.js`: the 55 trophies, in `GROUPS` for the trophy list.
  - `TrophyWatch.js` holds the "follow a …" trophy rules.
- `js/net/`: friends. `PROTOCOL = 2`, and worlds are checked against `WORLD_IDS`.
- **Saves:** `js/core/Store.js` and `SaveCode.js`. `SAVED_KEYS` lists the progress keys, including
  `planetpop.visited` and `planetpop.courier` (with its optional `lesson` flag). New progress keys go there; device
  settings such as `planetpop.ambience` and `planetpop.music` stay out. Existing key formats never change.

## Kinds of world (all in `Worlds.js` and `WorldThemes.js`)

- **Rocky:** Earth, the Moon, Mars, Mercury, Pluto, Io, Europa, Ganymede, Enceladus, Triton and Charon.
  - Theme `air: 'none'` (or `'thin'` on Mars) gives rovers instead of cars, and a hopper (or glider) instead of a plane.
  - Gravity is real.
- **Floating (Venus):** a cloud "sea" (the shape's `lift: -0.45`) with towns on rafts (`floating: true` and
  `world/Rafts.js`). Highway bridges join the rafts.
- **The giants (`giant: true`):** Jupiter, Saturn, Uranus and Neptune.
  - **Ground:** `stations(towns, pad)` builds the cloud sea and the rafts, with `roads: []`. There's no driving
    anywhere (the landed card, parcel board and road trips all check).
  - **Craft:** a ship (`Plane.styleFor`).
  - **Clouds:** stripes and storms are written into the sea's shader (`world/CloudBands.js`); the mini-map draws the
    stripes too.
  - **Extras:** Saturn's rings and ice (`world/Rings.js`), and Neptune's `wind` (in `FlightHazards`).
- **Special touches:**
  - **Mercury:** `heat`, and a town on rails (`rolling`, in `world/RollingTown.js`).
  - **Uranus:** `sunLat: 75`, which sets `Sky.decl`.
  - **Io, Europa, Enceladus and Triton:** named volcanoes or geysers (`world.volcanoes`), recoloured by the theme's
    `volcano`.
  - **Ganymede:** `aurora: true`.
  - **Earth:** real towns at real cities (`towns: [lat, lon, name]`).
  - **Sky planets:** a theme's sky `moons` can include `{ kind: 'map', body }`, which draws a planet as on the system
    map (Jupiter over its moons, Saturn over Titan and Enceladus, Pluto over Charon).

## The space courier and Rex

- **Offers:** `SpaceCourier.offer` pays `15 + 20·√au` (rounded to 5) times the cargo kind, and sets a time limit.
- **Contested parcels:** about 30% are `rex: true` and pay ×1.5.
- **The cruise race:**
  - `Cruise` flies Rex's rocket at 1.12× the cruise speed. He never boosts or hits rocks.
  - On arrival it stores `job.rex.lead`, the seconds he got there first.
- **The last stretch:**
  - `SpaceDropRun.spawnRex` puts him in with that lead: ahead means fast-forwarded, behind means circling the pad.
  - If he delivers first, `courier.lose()` takes the parcel and the streak.

## Gotchas learned the hard way

- **The fake DOM returns a new element on every `querySelector`.** Widgets should cache their elements in `this.dom`
  so tests can read them (LandedCard, ParcelBoard and WorldCard do).
- **The fake DOM fires no events.** Put behaviour in methods and make listeners call them. Test apps also omit
  `start`, `music`, `map`, `trip`, `spaceCourier`, `friends` and `ambience`; use optional access for those members.
- **First launch and links:** `StartScreen` is a `Widget`, outside the Overlay Esc stack. Its keys and controller
  actions must wait while a menu is above it. Use the captured `app.roomLink` / `app.dailyLink` to decide whether
  to show it: `App.updateUrl()` rewrites the address bar after loading. Skip the normal loading overlay only for
  the first build while Start is visible. New screens must also block `TourMode.free` while they are open.
- **`flyOn()` needs exact planet settings.** Keep the default seed 20261014, land 0.45, five cities and classic theme
  equal to `MISSIONS[0].planet` / `LESSON_PLANET`, so the first lesson needs no rebuild. Unit tests use
  `game.start({ lesson: true })` directly, or stub the `start…` method: `makeApp()` has no `newPlanet()`.
- **Music uses the audio clock.** Its 0.25-second scheduling horizon and heartbeat silence long space pads within
  0.45 seconds of the last frame. Keep the short note releases and crossfades when tuning it; no timers or files.
  Automated graph checks do not replace Ata listening.
- **Towns are big.**
  - `CITY_A` is 0.14 rad (about 8°, or 1,800 km on Earth).
  - Made-up towns must be 0.75 rad apart and sit fully on land. Listed towns are allowed 0.55 rad and a little sea at
    the edge.
  - That's why Earth's towns are inland cities: London, Lagos and Sydney can't fit.
- **Moon gaps on the map must be over about 2.4 + 1.6 × moon size ÷ planet size.** Otherwise a trip from the moon
  to its planet starts inside the stopping distance (the `Cruise` start and stop maths).
- **Adding a world reshuffles the daily.** The world of the day is `WORLD_IDS[hash % length]`, and the Grand Tour
  trophy needs every world in `WORLD_IDS`.
- **`'none'` as a sound name is a deliberate silent bubble.** A test checks that every other sound name used exists in
  `Sfx.js`.
- **Scratch scripts belong outside the repo** (ESLint scans everything). To import project modules from a scratch
  folder, symlink the repo's `node_modules` into it.
- **Some moon positions are guesses.** Real positions come from formulas for Io, Europa and Ganymede only (Meeus's).
  `L0` for Titan, Enceladus, Triton and Charon is a guess.

## Where things stand

- **Phase A is implemented on `phase-a-first-five-minutes` for v0.18.0.** The first launch shows PLAY while the
  planet builds; a new pilot flies the five-step lesson, and returning pilots go to Home. Modes moved from the
  hangar to Home, the hangar keeps upgrades and paint, briefings open short, and menu/flight/space music has its
  own Options slider. Existing progress and First Flight stay intact. The full scope and package order are in
  [PHASE_A.md](PHASE_A.md); see the PR for final check results and any deviations.
- **Music is ready for Ata's ear.** Audio scheduling, states and persistence are tested. Ata must listen and say yes
  before the music package is accepted. Claude reviews the phase; Ata decides when the branch merges.
- **The solar system plan is complete.** Ata's design doc, "Planet Pop: Solar System design" (a Claude Docs artifact
  at https://claude.ai/code/artifact/b60ea4c9-576b-422d-bcd5-7832d0323c2f), had four phases: Earth, Moon and Mars; the
  space courier; Venus, Mercury and Pluto; and the giants with their moons. All four shipped, plus a fifth phase:
  - Real towns on Earth and Rex in space.
  - Ganymede, Enceladus, Triton and Charon.
  - Polish: Uranus on its side, space sounds and grouped trophies.
- **Not yet checked on a phone:**
  - Performance of Saturn's rings and the balloon stations.
  - How the Rex race feels.

  Expect fixes from his report.
- **Ideas he hasn't picked yet:**
  - Missions for the four newest moons (they have none).
  - Real phases for the guessed moons.

  Wait for his "What's next?" before starting anything new.
