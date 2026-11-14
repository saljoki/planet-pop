# Planet Pop: handoff

Read this, then `CLAUDE.md` and `docs/EXTENDING.md`, before changing anything.

Planet Pop is a cartoony Three.js planet with life on it, the Sky Courier mini-game, road trips, friends, and a real solar
system you can fly round.

- **Repo:** https://github.com/Saljoki/planet-pop
- **Live:** https://saljoki.github.io/planet-pop/ (GitHub Pages, deploys on every push to `main`)
- **Current version:** v0.21.0 on `main`. Phases A, B1, B2 and B3 are merged.
- **Design and specs:** [DESIGN.md](DESIGN.md) is the game's design and decisions log. [PHASE_A.md](PHASE_A.md) and
  [PHASE_B1.md](PHASE_B1.md), [PHASE_B2.md](PHASE_B2.md) and [PHASE_B3.md](PHASE_B3.md) are the merged specs.
- **Keep this file current.** At the end of each phase, update "Where things stand", the version, and any new gotchas.

## How Ata works

- **Simple and to the point.** Confident, direct language, with no hedging and no fallback phrasing.
- **One class per file.** This is a hard rule; data-only modules are fine.
- **Branches and merges.** Work on a branch, push it, and share the compare link:
  `https://github.com/Saljoki/planet-pop/compare/main...<branch>?expand=1`. Merge into `main` only when he says so.
- **Checking the deploy.** After a merge, wait for the "pages build and deployment" run to succeed:
  `gh run list -R Saljoki/planet-pop`.
- **CI.** GitHub CI is switched off. Run lint, tests and the required screenshot scenes locally; never overlap
  tests or flight simulations with the browser screenshot run.
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
  `SCENES_EXACT=home,today` matches whole labels, avoiding unrelated areas that share a word such as courier.
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
    stats and suggestion order. `screens/Hangar.js` has the Craft / Upgrades / Paint / Trails accordion.
    `screens/Briefing.js` keeps its tips, controls and skip choice inside closed How to play details, offers the
    courier run's supplies and takes their payment at Start.
  - **Lesson:** `runs/LessonRun.js`, `Lessons.js` (steps and text) and `screens/Coach.js`; separate from First Flight,
    on the same default planet, with no countdown or Rex. The sun follows the plane at noon; a missed practice
    ring returns ahead at the plane's height. The previous day length is restored when the lesson ends.
    `Progress` keeps the optional `lesson` flag and pays 50
    coins on first completion; skipping marks it done without coins.
  - **Career:** `Career.js` owns `planetpop.career`, XP, rank/trophy receipts, Rex score, UTC contracts, crate,
    daily streak and gift. `Ranks.js` owns names/thresholds/rewards, `Economy.js` run pay, `Contracts.js` jobs and
    real-run counters. `screens/PilotCard.js` and `TodayScreen.js` are reached from the rank/Today rows on Home.
  - **Hangar:** `Crafts.js` owns the six craft and their stat multipliers, `Supplies.js` the one-flight supplies
    (prices, slot ranks, eligible modes), and `Gates.js` the pilot's rank for every gate: always read it through
    `pilotRank(game)`. Paint, trails and upgrade levels are data in `Progress.js`.
  - **Runs:** `runs/*Run.js` are the game modes. `Run.js` documents the hooks and `modes.js` picks the run.
  - **Hazards and moves:** `FlightHazards` (storms, dust, heat, ring ice, wind) and `Feats` (long jumps, loops round
    a storm, threading Saturn's ring).
  - **Data:** `Missions.js` (61 missions in 18 chapters), `Chapters.js` (chapter order and gates),
    `Stars.js` (three-star goals) and `Daily.js` (the world of the day).
- `js/ui/StartScreen.js`: a transparent `Widget` over the first planet build, with PLAY, Explore and Options.
  `Hud.setStartMode()` hides and restores the planet-view furniture. Invite and daily links bypass the title.
- `js/ui/Music.js` and `Tunes.js`: menu, flight and space loops synthesised on the effects AudioContext. Music
  follows the frame loop, crossfades between states and leaves Explore to `Ambience`.
- `js/ui/Achievements.js`: the 55 trophies, in `GROUPS` for the trophy list.
  - `TrophyWatch.js` holds the "follow a …" trophy rules.
- `js/net/`: friends. `PROTOCOL = 2`, and worlds are checked against `WORLD_IDS`.
- **Saves:** `js/core/Store.js` and `SaveCode.js`. `SAVED_KEYS` lists the progress keys, including
  `planetpop.visited`, `planetpop.courier` (with its optional `lesson`, `stars`, `craft`, `crafts`, `trail` and
  `trails` fields) and `planetpop.career`.
  New progress keys go there; device settings such as `planetpop.ambience` and `planetpop.music` stay out. Existing key formats never change.

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

- **Phase A is merged (v0.18.0).** The first launch shows PLAY while the planet builds; a new pilot flies the
  five-step lesson (always in daylight; a missed ring comes back in front), and returning pilots go to Home. Modes
  moved from the hangar to Home, the hangar keeps upgrades and paint, briefings open short, the flight badges wrap
  on an upright phone, and menu/flight/space music has its own Options slider. Spec: [PHASE_A.md](PHASE_A.md).
- **Phase B1 is merged (v0.19.0).** The courier clock tapers (20 s falling to 6 s a delivery, capped at start + 9 s),
  the daily is ten parcels with a finish bonus, and there are 61 missions in 18 chapters with three stars each and
  star gates. The game's design and decisions are in [DESIGN.md](DESIGN.md); the spec is [PHASE_B1.md](PHASE_B1.md).
- **Music still needs Ata's ear.** Audio scheduling, states and persistence are tested; the tunes themselves are
  his to judge. It has its own volume slider in Options.
- **Phase B2 is merged (v0.20.0).** Coins use points ÷ 25, rank reaches Sky Marshal at 89,900 XP, trophies
  back-pay once, and Rex has a speed and paint ladder and a running score. Contracts, crate, streak and gift use
  UTC dates and travel in save codes. Career lines on the results card sit in `#gNews`; the card's text scrolls
  and its buttons never leave the screen. Spec: [PHASE_B2.md](PHASE_B2.md).
- **Phase B3 is merged (v0.21.0).** Six craft, five levels on each upgrade track, twelve paint jobs, six trails
  and one-flight courier supplies; the whole shop is 75,770 coins. The Bulldog opens at rank 4, the Hummingbird
  at 7, the Mule at 10, the Swift at 14 and the Comet at 18; supply slots open at ranks 3, 8 and 13. Home's hangar
  button counts the whole shop at the pilot's rank, and the pilot card names the next craft and slot to open.
  Styles are in `css/hangar.css`, after `home.css`; scenes are in `tests/browser/scenes/hangar.mjs`, after the
  courier area. Spec: [PHASE_B3.md](PHASE_B3.md).
- **B2 gotchas:** all reward coins must use `addCoins(n, false)`; contract income reads the run, not the wallet.
  Record mission stars before `completeMission` so the implicit legacy first star cannot suppress new-star XP.
  Options keeps trophies, so reset retains their payment receipts. New career fields default when absent.
  A save code with courier progress and no career clears the browser's career, so it is rebuilt from the save.
  Rex's `rankStep` is 0.0025 (0.004 failed the ace limit); daily and mission speed stays at rank 1.
  Boards close through callbacks; selecting a flight only hides. `Briefing.back` reopens a board with the same
  way Home.
- **B3 gotchas:** the optional `craft`, `crafts`, `trail` and `trails` fields in `planetpop.courier` are omitted
  while only the defaults are owned; a missing field means Classic. Supplies are never saved; "Fly again" and a
  launch without a briefing strip them. The daily's `BASE_STATS` identity also selects the Classic shape and trail.
  A plain courier run's clock ceiling winds down to zero at 7:59 (a bought head start adds ten seconds), because
  level-five magnets could otherwise keep a run going for ever; the daily, missions and the van keep their own clocks.
- **Tests that need a rank** call `setRank(game, rank)` from `tests/helpers/rank.mjs` and grant coins with
  `addCoins(n, false)`. Never replace `game.career` with a stub: every run start and finish calls it, and earned
  coins pay XP and rank rewards that change a test's sums.
- **Next:** B4 adds the passport. The daily's rings and UFO must be seeded from the route before a leaderboard (D).
  At 667 × 375 a first mission's rank-up lines start below the fold of the results card; phase C's phone pass
  should shrink the buttons at that height. Claude reviews; Ata decides merges.
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
