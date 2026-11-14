# Planet Pop — Phase B1: the clock, the daily and the missions

Handoff spec for a builder agent. Claude reviews the result; Ata decides when it merges.

- **Repo:** https://github.com/Saljoki/planet-pop
- **Base:** `main` at `878b636` (v0.17.0)
- **Branch:** `phase-b1-missions`
- **Version:** do not bump it. Claude sets the version when the branches merge.
- **Put this file at:** `docs/PHASE_B1.md`, and the design at `docs/DESIGN.md` (first commit)

**Another agent is building Phase A on `phase-a-first-five-minutes` at the same time.** Section 3 lists the files
that belong to that branch. Do not touch them, and do not rebase onto or merge that branch.

---

## 1. Read first

1. `CLAUDE.md`, `docs/HANDOFF.md`, `docs/EXTENDING.md`. Their rules apply exactly as written.
2. `docs/DESIGN.md`, for why each thing here exists.
3. This file, start to finish, before writing code.

## 2. Why this phase exists

Three findings from the code and from simulated pilots:

1. **The courier run never ends for a competent pilot.** Each delivery adds 20 seconds and a clean leg takes about
   12, so the clock only grows. A scripted pilot flew for 15 minutes without running out.
2. **The daily challenge is that same endless run**, so its score measures patience, not skill. It cannot carry a
   leaderboard.
3. **Missions are 22 one-off tasks.** Five worlds have none, nothing is worth replaying, and the real-world list is
   one long line.

Phase B1 gives the run an ending, makes the daily a ten-parcel route, and turns missions into 18 chapters of 61
missions with three stars each.

## 3. Ground rules

From the repo's docs, restated because they are the ones most often broken:

- Plain ES modules. No build step, no new dependencies, no network calls, no external URLs or asset files.
- **One class per file.** Data-only and function-only modules are fine.
- Saved state goes through `js/core/Store.js`. **Never change the format of an existing `planetpop.*` key.** This
  phase adds one optional field (`stars`) to the existing `planetpop.courier` JSON. Nothing else.
- After changing any served file: `npm run precache`.
- Work on the branch. Do not merge into `main`.

Specific to this phase:

- **Logic lives in methods, not inside event listeners.** The test DOM fires no events.
- **Cache elements in `this.dom`.** The test DOM returns a new element on every `querySelector`.
- **Tone of text:** short, friendly, emoji-led, British spelling.
- Every real-world fact in a mission brief is already checked. Use the briefs in section 7 word for word.

### Files Phase A is changing — do not edit

`js/App.js`, `js/ui/Hud.js`, `js/ui/ControlPanel.js`, `js/ui/TourMode.js`, `js/camera/CameraRig.js`,
`js/game/CourierGame.js`, `js/game/input/Gamepad.js`, `js/game/runs/Run.js`, `js/game/runs/modes.js`,
`js/game/screens/Hangar.js`, `Briefing.js`, `ResultsScreen.js`, `OptionsMenu.js`, `PauseMenu.js`, `index.html`,
`css/phone.css`, `tests/options.test.mjs`, `tests/browser/harness.mjs`, `tests/browser/scenes/phone.mjs` and
`road.mjs`, `AGENTS.md`, `README.md`, and the version in `package.json`, `package-lock.json` and
`js/core/Version.js`.

Leave `js/game/screens/CourierHud.js` alone too: its badges take text, so nothing here needs it changed.

Everything this phase needs can be done without them:

- A results card's text is the `html` a run passes to `game.finish()`.
- The mission badge is `hud.dom.mission.textContent`; the daily badge is `hud.dom.daily.textContent`.
- Briefing text is what a run's `static briefing()` returns.

### Files both branches change

- `js/game/Progress.js`: Phase A adds a `lesson` field and two methods. Add yours without reordering or reformatting
  what is there.
- `precache.js`: generated. It will conflict at merge and Claude regenerates it.
- `docs/EXTENDING.md`, `docs/HANDOFF.md`: edit only the sections named in B1.6.
- `tests/browser/scenes/courier.mjs`: edit only the mission scenes.

### Known traps

- **`flyOn()` in unit tests.** `game.startMission()` and `startDaily()` call `app.newPlanet()` when the planet
  doesn't match, and `makeApp()` has none. In tests, build the world with `makeWorld(def.planet)` and call
  `game.start({ mission: def })`, as `tests/missions.test.mjs` does.
- **`MISSIONS[0]` must stay `first`, with its planet unchanged.** Phase A's flying lesson and its Home screen both
  depend on it.
- **`progress.missionDone(id)`, `missionUnlocked(i)` and `completeMission(def)` keep their signatures and return
  types.** Phase A's Home screen calls the first two.
- **Rex only levels up when `hasRival` is true**, and `MissionRun.hasRival` is false on real worlds. See B1.2.
- **`Feats` looks for one landmark with `loop`** and unlocks the trophy it names. See B1.2.
- **ESLint scans the whole repo.** Keep scratch scripts outside it.
- **Don't run `npm test` and the screenshots at the same time.**

## 4. Decisions already made

Do not reopen these. If one cannot be built as written, stop that package and say so in the PR.

| # | Decision |
|---|---|
| 1 | Courier clock: the first delivery adds 20 s, each later one a second less, never below 6 s. The clock cannot rise above its starting time plus 9 s. |
| 2 | Missions keep the flat +20 s and have no cap. Their difficulty is their goal, not the clock. |
| 3 | The daily is exactly ten parcels. A parcel Rex steals counts as one of the ten. Seconds left at the end are worth 10 points each. |
| 4 | Each real world is a chapter of three missions. Flight school is the ten existing made-up-planet missions. |
| 5 | Three stars: finish, beat the par time, meet the bonus goal. Stars pay no coins. |
| 6 | Stars open chapters. Travel in Explore stays open to every world. |
| 7 | Inside a chapter, missions open in order. A mission already completed is always playable. |
| 8 | An old save's completed missions count as one star each. |
| 9 | Existing missions keep their id, planet, goal, reward and flags. Only their position changes, and each gains a par and a bonus. |
| 10 | Coin amounts and prices do not change in this phase. |

## 5. Work packages

Seven packages, in this order, **one commit each**. Lint and tests pass after every commit.

| | Package | Size |
|---|---|---|
| B1.0 | Housekeeping | Tiny |
| B1.1 | The clock and the ten-parcel daily | Small |
| B1.2 | New counters and mission rules | Medium |
| B1.3 | Chapters, stars and unlocking | Medium |
| B1.4 | The 39 new missions, and par times | Large |
| B1.5 | The mission board | Medium |
| B1.6 | Wrap-up | Small |

---

### B1.0 Housekeeping

Add `docs/DESIGN.md` and this file as `docs/PHASE_B1.md`. Nothing else.

---

### B1.1 The clock and the ten-parcel daily

**The player gets:** a courier run that builds to a finish, and a daily that takes three minutes and gives a score
worth comparing.

**`js/game/runs/DeliveryRun.js`**

- Replace the flat `DELIVERY_BONUS` with a method, `deliveryBonus()`: `max(6, 20 − deliveries so far)`. So the first
  delivery adds 20 s, the second 19, and from the fifteenth on, 6.
- Add `get clockCap()`: the run's starting time plus 9 s. After adding time for a delivery or a ring, clamp the
  clock to it.
- The delivery pop already shows the points. Add the seconds gained to the "new parcel" toast: `… (+17 s)`.
- Add one line to `COURIER_TIPS`: `Each delivery adds a little less time than the last, so make every second count.`

**`js/game/runs/MissionRun.js`:** override both, so missions keep +20 s and no cap.

**`js/game/runs/DailyRun.js`**

- `DAILY_PARCELS = 10`.
- The run ends when ten parcels have been delivered or stolen (title `🏁 Route complete!`), or when the clock runs
  out (`⏰ Time's up!`, as now).
- On completing the route, add `10 × whole seconds left` to the score before it is recorded, and show it:
  `⏱ 41 s left: +410`.
- The daily badge reads `📅 4 / 10`.
- Briefing goal: `Ten parcels on today’s route, the same for everyone, in the stock plane. Your best score today
  counts.`
- The shared text does not change (a Phase A test checks its wording).
- The saved format (`daily: { date, best }`) does not change.

**Tests** — new `tests/clock.test.mjs`:

- `deliveryBonus()` returns 20, 19, 18 for the first three deliveries and 6 for the twentieth.
- The clock never exceeds `clockCap` after deliveries and rings.
- A mission still adds 20 s on its fifth delivery and has no cap.
- **The regression test, which must fail on v0.17.0:** an ace pilot (steer straight at the destination every frame,
  boost when more than 0.3 rad away with over 30% in the tank, never crash) on the default planet in the stock plane
  runs out of time in under 8 simulated minutes.
- The daily ends at exactly ten parcels, counts a stolen one, adds the finish bonus once, and records the total.

Reference figures from Claude's simulation of this rule (stock plane, default planet, mean of three runs). Yours
should land within about 20%:

| Pilot | Run length | Deliveries |
|---|---|---|
| Ace: straight at the town, boosts, never crashes | 4:47 | 23 |
| Good: looks away 15% of the time, crashes every 45 s | 4:00 | 18 |
| Average: no boost, looks away 30%, crashes every 25 s | 2:58 | 10 |
| Beginner: no boost, looks away 50%, crashes every 14 s | 2:30 | 8 |

**Accept when**

- The ace pilot's courier run ends.
- A daily run can never exceed ten parcels, and two pilots flying the same route identically get the same score.
- No mission's clock behaves differently from v0.17.0.

---

### B1.2 New counters and mission rules

**The player gets:** nothing visible yet. This is the machinery the new missions need.

**New counters** in `DeliveryRun`'s `tally`, all starting at 0:

| Counter | Counts |
|---|---|
| `crashes` | Every crash, including the one that breaks a fragile parcel |
| `knocks` | Every crash, every lightning strike and every ring-ice hit |
| `stolen` | Every parcel Rex steals |
| `combo` | The highest combo reached |
| `visits` | Landmarks visited on a `tour` |
| `sun` | Seconds spent in Mercury's sunshine (`game.hazards.hot`) |

**New mission flags**, applied in `MissionRun`:

- **`tour: [names]`** — landmarks to fly low over, in any order. There are no parcels and no town deliveries.
  - "Low over" is the delivery test, applied to the landmark: within 0.07 rad, and below its surface plus 3.2.
  - The arrow points at the nearest landmark not yet visited. The goal line names it: `📷 Photo → Mount Everest`,
    using the mission's `item` (or `📍` without one).
  - Each visit: a pop with the landmark's name, the `deliver` sound, `visits` goes up, the clock gains 20 s, and the
    plane is patched up as for a delivery.
  - Rings appear along the way to the current target.
- **`fetch: name`** — the mission's parcel waits at this landmark.
  - Until it is collected nothing can be delivered. The arrow points at the landmark and the goal line reads
    `Collect the 🪨 Moon rock at Tycho`.
  - Flying low over it collects it: pop `GOT IT!`, the `ring` sound. `carry` (if set) applies from this moment.
  - Then the parcel goes to a town chosen by the mission's seeded `rand`, and it is an ordinary delivery.
- **`sunny: true`** — the mirror of `dark`: parcels go to towns in daylight, while there are any.
- **`rexLevel: n`** — with `rival: true`, Rex starts at this level instead of 0, and gains one more with each
  delivery.

**Changes to existing behaviour**

- A mission with `rival: true` on a real world: Rex gains a level with each delivery, as he does on made-up planets.
  Missions without `rival: true` on real worlds still have no Rex.
- `FAIL_REASON` gains `stolen: '😈 Rex stole a parcel.'`
- `STAT_LABEL` gains `combo: 'combo'`, `visits: 'visited'`, `ash: 's in the plume'`.
- `progress()` shows whole numbers. An `ash` goal counts whole seconds.
- `target()` points the arrow for `tour` and `fetch`.
- **Loops without a trophy.** In `js/space/Worlds.js`, give `The Hexagon` (Saturn) and `The Great Dark Spot`
  (Neptune) `loop: true`. In `js/game/Feats.js`, a landmark whose `loop` is `true` works exactly like the Great Red
  Spot's but unlocks no trophy. Jupiter's `loop: 'redspot'` is unchanged. These two lines are the only edits to
  `Worlds.js`.

**Tests** — in `tests/missions.test.mjs`, using small test-only mission objects (the real ones arrive in B1.4):

- `tour`: three landmarks visited in any order complete it; flying high over one doesn't count; the arrow moves to
  the nearest one left.
- `fetch`: a delivery swoop before collecting does nothing; collecting then delivering completes it; a `carry:
  'fragile'` parcel breaks only after it is collected.
- `sunny` on Mercury picks towns in daylight.
- `rival: true` on the Moon: Rex is there from the start and his level rises with deliveries. `rexLevel: 6` starts
  him at 6.
- `failIf: 'stolen'` ends the mission with the new reason.
- A `combo` goal completes at the target combo. An `ash` goal shows `2 / 3 s in the plume`, never a fraction.
- `knocks` counts a crash, a lightning strike and an ice hit once each.
- A full loop round the Hexagon calls `run.looped()` and unlocks no trophy.

**Accept when:** every existing mission test passes untouched, apart from the one in section 8.

---

### B1.3 Chapters, stars and unlocking

**The player gets:** three stars to earn on every mission, and worlds that open as the stars add up.

**New files**

- `js/game/Chapters.js` (data and functions):
  - `CHAPTERS`: `school` first (`🎓 Flight school`, gate 0), then one per world in the order and with the gates in
    section 7. A world chapter takes its icon and name from `worldOf(id)`.
  - `chapterOf(mission)`: `mission.planet.world ?? 'school'`.
  - `missionsIn(chapterId)`: that chapter's missions, in `MISSIONS` order.
- `js/game/Stars.js` (functions):
  - `starGoals(def)`: the three goals as short text: `['Finish', 'Under 1:10', 'No knocks']`.
  - `starsEarned(def, { elapsed, tally })`: 1 for finishing, +1 when `elapsed <= def.par`, +1 when the bonus is met.
  - A bonus is `{ stat, min, text }` or `{ stat, max, text }`, tested against the tally. A mission with no `bonus`
    uses `{ stat: 'knocks', max: 0, text: 'No knocks' }`.

**Mission data** (`js/game/Missions.js`): every mission gains `par` (seconds, set in B1.4) and may have `bonus`.
Until B1.4, give the 22 existing missions a placeholder `par: 120`.

**`js/game/Progress.js`**

- `stars`: `{ [missionId]: 1 | 2 | 3 }`, loaded from and saved to `planetpop.courier`. Missing means `{}`.
- `starsFor(id)`: the saved value; or 1 when the mission is done and has no saved value; otherwise 0.
- `get totalStars()`.
- `recordStars(id, n)`: keeps the best; returns true when it improved.
- `chapterOpen(chapterId)`: `totalStars` has reached the chapter's gate, **or** any mission in it is already done.
- `missionUnlocked(i)`, new rule: the mission is done; **or** its chapter is open and it is either the chapter's
  first mission or the one before it in the chapter is done.
- `reset()` clears `stars`.

**`js/game/runs/MissionRun.js`**

- Keep the mission's elapsed time (it starts at 0 and runs while the run is live and not paused).
- The mission badge reads `🎯 1 / 3 parcels · ⭐ 28`: the seconds left to earn the time star, then `⭐ –` once it has
  gone.
- `static briefing()`: the first tip is the star goals: `⭐ Finish · ⭐ Under 1:10 · ⭐ No knocks`.
- `endMission()`:
  - On a win, work out the stars, call `recordStars`, and add to the card:
    - the stars earned: `⭐⭐☆`
    - each goal with a tick or a cross: `✔ Under 1:10 (0:58)` · `✖ No knocks (2)`
    - `Best: ⭐⭐⭐` when this wasn't the best
    - `🔓 Mars is open!` when this result opened a chapter
  - "Next": the next mission in the chapter; after a chapter's last, the first unfinished mission of the next open
    chapter; otherwise none.
- The `missions` and `spacemissions` trophies keep their rule: every mission on the made-up planets, or every
  mission on the real worlds.

**Tests** — new `tests/stars.test.mjs`:

- `starsEarned` for: finished late with knocks (1), finished in time with knocks (2), finished late and clean (2),
  finished in time and clean (3), and each bonus shape (`min`, `max`).
- `recordStars` keeps the best and saves it.
- Unlock rules: only Flight school's first mission is open on an empty save; 3 stars open Earth's first mission and
  not its second; completing a mission opens the next in its chapter; a done mission in a closed chapter is
  playable.
- This v0.17.0 save loads unchanged, shows one star for each of its four missions, and has Jupiter's `storm`
  playable although Jupiter's chapter is closed:
  `{"coins":900,"best":2400,"levels":{"engine":2},"owned":["classic"],"skin":"classic","daily":null,"missions":["first","rush","flag","storm"],"bests":{}}`
- The results card shows the stars, the goals and `🔓` when a chapter opens.
- `completeMission` still pays once and returns the coins.

**Accept when**

- A player with a v0.17.0 save loses nothing and can replay everything they had finished.
- The time star's countdown is visible throughout a mission.

---

### B1.4 The 39 new missions, and par times

**The player gets:** three missions on every world, each using what makes that world different.

- Add the 39 missions in section 7 to `MISSIONS`. Appendix A has them as code, ready to paste.
- Reorder `MISSIONS` to match section 7: Flight school's ten, then each world's three. Existing missions move but
  are otherwise untouched.
- Give the four existing fragile missions (`care`, `hotel`, `chill`, `sample`) the bonus
  `{ stat: 'rings', min: 3, text: 'Collect 3 rings' }`. A crash already fails them, so "No knocks" would be free.

**Par times**

- New `tests/helpers/pilot.mjs`: the reference pilot. Each frame it steers at `run.target(player.up)?.c ??
  run.destPoint()` with `player.steerToward(aim, 1.5)`, and boosts when the aim is more than 0.3 rad away and the
  tank is over 30%. Stock plane.
- New `scripts/pars.mjs`: flies every mission the pilot can fly and prints its time.
- `par` = the pilot's time × the chapter's factor, rounded up to the next 5 s:

| Chapters | Factor |
|---|---|
| Flight school, Earth, the Moon, Mars | 1.6 |
| Venus, Mercury, Jupiter, Io, Europa, Ganymede | 1.45 |
| Saturn, Titan, Enceladus, Uranus, Neptune, Triton, Pluto, Charon | 1.3 |

- The pilot cannot fly goals on `rings`, `refuels`, `ufo`, `loops`, `threads`, `ash` or `combo`. For those, write a
  short scripted flight per kind, or fly it by hand, and set the par from that with the same factor. List these
  missions and their source in the PR.
- No par under 20 s or over 240 s.

**Tests**

- Extend "each mission planet has what its mission needs" in `tests/missions.test.mjs`:
  - every `tour`, `fetch` and `landmark` name is a landmark on that world
  - a `tour` goal's target equals the number of landmarks
  - a `loops` goal needs a landmark with `loop`
  - `sunny` and a `sun` bonus need a world with `heat`
  - an `ash` goal needs `eruptions`
  - `rexLevel` needs `rival`
- New data checks:
  - ids are unique
  - `MISSIONS[0].id` is `first`
  - every one of the 22 v0.17.0 missions is present with the same planet, goal, reward and flags
  - every world in `WORLD_IDS` has exactly three missions
  - every mission has a par between 20 and 240
  - no brief is longer than 115 characters
- New `tests/pilot.test.mjs`: on every mission the reference pilot can fly, with the stock plane, it finishes inside
  the clock and earns the time star. A pilot that does nothing earns no star on any mission.

**Screenshot scenes:** new `mission-tour` (Earth, `wonders`, the arrow on a landmark), `mission-fetch` (the Moon,
`moonrock`, before collecting), and `mission-stars` (a results card with two stars and a chapter opening).

**Accept when**

- Every world has three missions and every one can be completed in the stock plane.
- No two missions next to each other in a chapter ask for the same thing.

---

### B1.5 The mission board

**The player gets:** a board that shows the journey: chapters, stars, what's next and what it takes to open the next
world.

**`js/game/screens/MissionBoard.js`**

- Header: `🎯 Missions` and `#mStars`: `⭐ 37 / 183`.
- One `<details class="chapter">` per chapter, in order. Its summary:
  - open chapter: `🌍 Earth · ⭐ 5 / 9`
  - closed chapter: `🔒 Mars · 4 more ⭐ to open`
  - finished chapter (nine stars): `🌕 The Moon · ⭐ 9 / 9 ✔`
- Open by default: the first chapter that has an unlocked, unfinished mission. The rest start closed.
- A mission row: the icon (✅ when done), the name, its stars `★★☆`, the brief, the reward (`🪙 300`, or `earned`),
  and the button: `▶ Fly`, `↻ Again` or `🔒`.
- Keep `button[data-play]` and the existing `onPlay` callback.
- Add `chapterState(id)`, returning `'open'`, `'closed'` or `'done'`, for the summary line and for tests.
- Styles go beside the existing mission styles in `css/menus.css`. Small-screen rules stay in that file's own media
  block; `css/phone.css` belongs to Phase A.

**Tests:** the board's HTML for an empty save (one chapter open, 17 closed with their gates), and for the v0.17.0
fixture in B1.3.

**Screenshot scenes:** re-shoot `missions` and `space-missions`; add `mobile-missions` (390 × 844) at the end of
`tests/browser/scenes/space.mjs`, restoring the desktop viewport afterwards.

**Accept when**

- At 390 × 844 the open chapter's three missions and the next chapter's gate are visible without scrolling.
- A locked chapter says exactly how many stars it still needs.

---

### B1.6 Wrap-up

- `npm run precache`.
- `docs/EXTENDING.md`, the "Add a mission" section only: the new flags, counters, `par`, `bonus`, chapters, and how
  to run `scripts/pars.mjs`.
- `docs/HANDOFF.md`, only these: the mission count and file list in "Map of the code", and a line under "Where things
  stand" pointing at `docs/DESIGN.md` and this file.
- Leave `README.md` and the version alone. List the README sentences that are now wrong in the PR.
- Run every check in section 9 one last time.

## 6. What stays exactly as it is

- The courier run's scoring, combo rule, ring bonus, crash penalty, Rex's speeds and coin amounts.
- Every existing mission's planet, goal, reward and special conditions.
- The daily's seed, planet and stock plane.
- Free flight, road trips, the space courier, Explore, friends, trophies, saves.

## 7. The missions

61 missions in 18 chapters. "Opens at" is the total stars needed. **new** marks the 39 to add.

#### 🎓 Flight school · open from the start

The ten existing missions on made-up planets, in their present order, unchanged.

| # | id | Mission | Bonus star |
|---|---|---|---|
| 1 | `first` | 📦 First Flight | No knocks |
| 2 | `rush` | ⚡ Rush Hour | No knocks |
| 3 | `rings` | 💍 Ring Master | No knocks |
| 4 | `care` | 🥚 Handle With Care | Collect 3 rings |
| 5 | `pitstop` | ⛽ Pit Stop | No knocks |
| 6 | `heavy` | 🏋️ Heavy Lifter | No knocks |
| 7 | `rex` | 😈 Outrun Rex | No knocks |
| 8 | `night` | 🌙 Night Shift | No knocks |
| 9 | `ufo` | 🛸 Close Encounter | No knocks |
| 10 | `ash` | 🌋 Ash Dodger | No knocks |

#### 🌍 Earth · opens at 3 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 11 | `airmail` | ✉️ Air Mail **new** | Deliver 4 parcels between Earth’s great cities. | deliveries ≥ 4 | No knocks | 150 |
| 12 | `express` | 📮 Express Post **new** | Deliver fast enough to build a x4 combo. | combo ≥ 4 | Collect 5 rings | 250 |
| 13 | `wonders` | 📷 Wonders of the World **new** | Photograph Mount Everest, the Sahara and the Amazon. Fly low over each one. | `tour`: Mount Everest, The Sahara, The Amazon | No knocks | 300 |

#### 🌕 The Moon · opens at 6 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 14 | `flag` | 🚩 One Small Step | *(existing, unchanged)* | `landmark`: Tranquility Base | No knocks | 150 |
| 15 | `moonrock` | 🪨 Moon Rock **new** | Collect a rock from Tycho crater and fly it to the lab. | `fetch`: Tycho, then 1 delivery | No knocks | 200 |
| 16 | `spacerace` | 🏁 Space Race **new** | Rex wants the Moon too. Beat him to 3 towns in a row. | rexStreak ≥ 3 · Rex from the start | Rex steals nothing | 300 |

#### 🔴 Mars · opens at 10 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 17 | `dust` | 🌪️ Dust Storm Medicine | *(existing, unchanged)* | urgent ≥ 3 · more urgent parcels | No knocks | 250 |
| 18 | `rovers` | 🤖 Rover Rescue **new** | Fly a spare wheel to the rover in Gale crater and another to the one in Jezero crater. | `tour`: Gale crater, Jezero crater | No knocks | 250 |
| 19 | `olympus` | 🌋 Top of the Solar System **new** | Carry a heavy weather station up Olympus Mons, the tallest volcano on any planet. | `landmark`: Olympus Mons (heavy) | Collect 3 rings | 350 |

#### 🟡 Venus · opens at 15 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 20 | `cloudhop` | ☁️ Cloud City Shuttle **new** | Deliver 4 parcels between Venus’s floating towns. | deliveries ≥ 4 | No knocks | 250 |
| 21 | `ballast` | 🎈 Ballast Run **new** | The rafts need ballast to stay level. Deliver 3 heavy parcels. | heavy ≥ 3 · more heavy parcels | Collect 5 rings | 350 |
| 22 | `acid` | ⚡ Acid Rain | *(existing, unchanged)* | deliveries ≥ 3 · fails on `zaps` | No knocks | 300 |

#### 🪨 Mercury · opens at 20 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 23 | `shade` | 🌗 Keep to the Shade | *(existing, unchanged)* | night ≥ 3 · `dark` | No knocks | 350 |
| 24 | `sundash` | ☀️ Sunrise Dash **new** | Deliver 2 parcels to towns in full sunshine. Get in and out before you cook. | deliveries ≥ 2 · `sunny` | Under 15 s in the sunshine | 350 |
| 25 | `gallery` | 🎨 Gallery Tour **new** | Mercury’s craters are named after artists. Visit Beethoven, Rembrandt and Hokusai. | `tour`: Beethoven, Rembrandt, Hokusai | Under 20 s in the sunshine | 400 |

#### 🟠 Jupiter · opens at 26 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 26 | `stations` | 🎈 Station to Station **new** | Deliver 4 parcels between Jupiter’s balloon stations. | deliveries ≥ 4 | No knocks | 300 |
| 27 | `storm` | 🌀 Eye of the Storm | *(existing, unchanged)* | loops ≥ 1 | No knocks | 300 |
| 28 | `king` | 😈 King of the Clouds **new** | Deliver 4 parcels with Rex on your tail. If he steals one, it’s over. | deliveries ≥ 4 · Rex from the start, level 3 · fails on `stolen` | No knocks | 400 |

#### 🌋 Io · opens at 32 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 29 | `sulphur` | 🌋 Sulphur Run | *(existing, unchanged)* | deliveries ≥ 3 · `eruptions` · fails on `ash` | No knocks | 400 |
| 30 | `loki` | 🔥 Lake of Fire **new** | Fly a heat probe to Loki Patera, a lake of lava 200 km across. | `landmark`: Loki Patera | No knocks | 300 |
| 31 | `thread` | 💍 Between the Volcanoes **new** | Fly through 12 rings while Io’s volcanoes erupt. Touch a plume and it’s over. | rings ≥ 12 · `eruptions` · fails on `ash` | No knocks | 400 |

#### 🧊 Europa · opens at 38 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 32 | `sample` | 🧪 Ocean Sample | *(existing, unchanged)* | `landmark`: Conamara Chaos (fragile) · fails on `broken` | Collect 3 rings | 350 |
| 33 | `drill` | ⛏️ Ice Core **new** | Collect an ice core at Pwyll crater and fly it to the lab. It’s fragile. | `fetch`: Pwyll (fragile), then 1 delivery · fails on `broken` | Collect 3 rings | 350 |
| 34 | `signs` | 🐟 Signs of Life **new** | The scientists can’t wait. Deliver 3 urgent parcels. | urgent ≥ 3 · more urgent parcels | Reach a x3 combo | 400 |

#### 🌑 Ganymede · opens at 44 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 35 | `biggest` | 📦 The Biggest Moon **new** | Deliver 4 parcels on Ganymede, a moon wider than Mercury. | deliveries ≥ 4 | No knocks | 300 |
| 36 | `aurora` | 🌌 Under the Aurora **new** | Deliver 3 parcels to towns in the dark, under Ganymede’s own aurora. | night ≥ 3 · `dark` | No knocks | 350 |
| 37 | `grooves` | 🗺️ Old Ground, New Ground **new** | Survey Galileo Regio, Uruk Sulcus and the crater Tros. Fly low over each one. | `tour`: Galileo Regio, Uruk Sulcus, Tros | Collect 5 rings | 400 |

#### 🪐 Saturn · opens at 51 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 38 | `ringside` | 🪐 Ringside Seats **new** | Deliver 3 parcels between Saturn’s stations, under the rings. | deliveries ≥ 3 | Fly through the ring ice once | 300 |
| 39 | `ringrun` | 💫 Ring Run | *(existing, unchanged)* | threads ≥ 3 · fails on `ice` | No knocks | 400 |
| 40 | `hexagon` | ⬡ Six Sides **new** | Fly a loop round the Hexagon, the six-sided jet stream at Saturn’s north pole. | loops ≥ 1 | No knocks | 400 |

#### 🟤 Titan · opens at 58 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 41 | `huygens` | 📡 Battery for Huygens | *(existing, unchanged)* | `landmark`: The Huygens landing site | No knocks | 300 |
| 42 | `methane` | 🧪 Methane Sea **new** | Scoop a sample from Kraken Mare, a sea of liquid methane, and fly it to the lab. | `fetch`: Kraken Mare, then 1 delivery | No knocks | 350 |
| 43 | `airtour` | 🗺️ Titan Air Tour **new** | Fly low over Xanadu, Ligeia Mare and the Huygens landing site. | `tour`: Xanadu, Ligeia Mare, The Huygens landing site | No knocks | 400 |

#### ❄️ Enceladus · opens at 65 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 44 | `snowball` | ⚪ Snowball Express **new** | Deliver 3 parcels between the two towns of the whitest moon there is. | deliveries ≥ 3 | Reach a x3 combo | 300 |
| 45 | `stripes` | 🐯 Tiger Stripes **new** | Fly a camera to the tiger stripes, the cracks the geysers spray from. | `landmark`: The tiger stripes | No knocks | 350 |
| 46 | `taste` | ⛲ Taste the Ocean **new** | Fly through a geyser for 3 seconds to catch a sample of the ocean below. Your engine will splutter! | ash ≥ 3 · `eruptions` | No knocks | 450 |

#### 💠 Uranus · opens at 72 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 47 | `chill` | 🧊 Cold Chain | *(existing, unchanged)* | fragile ≥ 2 · more fragile parcels · fails on `broken` | Collect 3 rings | 350 |
| 48 | `polarnight` | 🌑 The Long Night **new** | Deliver 2 parcels to the station where the Sun hasn’t risen for years. | night ≥ 2 · `dark` | No knocks | 400 |
| 49 | `sideways` | 💍 The Sideways Planet **new** | Fly through 18 rings round the planet that rolls on its side. | rings ≥ 18 | No knocks | 450 |

#### 🔵 Neptune · opens at 80 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 50 | `gale` | 💨 Gale Force | *(existing, unchanged)* | deliveries ≥ 3 | No knocks | 400 |
| 51 | `darkspot` | 🌀 The Great Dark Spot **new** | Fly a loop round the Great Dark Spot while the wind pushes you west. | loops ≥ 1 | No knocks | 450 |
| 52 | `supersonic` | 💨 Supersonic Winds **new** | Deliver 3 urgent parcels in winds of 2,000 km/h. Make the wind work for you. | urgent ≥ 3 · more urgent parcels | Reach a x3 combo | 500 |

#### ⚪ Triton · opens at 88 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 53 | `backwards` | 🔄 The Backwards Moon **new** | Deliver 3 parcels on Triton, the moon that orbits the wrong way. | deliveries ≥ 3 | No knocks | 350 |
| 54 | `cantaloupe` | 🍈 Cantaloupe Country **new** | Collect an ice sample from the cantaloupe terrain, ground that looks like a melon’s skin, and fly it to the lab. | `fetch`: The cantaloupe terrain, then 1 delivery | Collect 4 rings | 400 |
| 55 | `geysers` | ⛲ Nitrogen Geysers **new** | Deliver 3 parcels while Triton’s geysers erupt. Fly into a plume and it’s over. | deliveries ≥ 3 · `eruptions` · fails on `ash` | No knocks | 450 |

#### 🤍 Pluto · opens at 96 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 56 | `hotel` | 🛎️ Room Service | *(existing, unchanged)* | `landmark`: The Ice Hotel (fragile) · fails on `broken` | Collect 3 rings | 400 |
| 57 | `heart` | 💙 Heart of Pluto **new** | Fly low over Sputnik Planitia, Tenzing Montes and Wright Mons, round Pluto’s heart. | `tour`: Sputnik Planitia, Tenzing Montes, Wright Mons | No knocks | 450 |
| 58 | `edge` | 😈 Race to the Edge **new** | Rex has followed you all the way out. Beat him to 3 towns in a row. | rexStreak ≥ 3 · Rex from the start, level 6 | Rex steals nothing | 500 |

#### 🌘 Charon · opens at 104 ⭐

| # | id | Mission | Brief | Rule | Bonus star | 🪙 |
|---|---|---|---|---|---|---|
| 59 | `ferry` | ⛴️ The Ferryman **new** | Deliver 3 parcels between Charon’s two towns. | deliveries ≥ 3 | Reach a x3 combo | 400 |
| 60 | `redpole` | 🔴 The Red Pole **new** | Fly a spectrometer to Mordor Macula, the dark red cap on Charon’s north pole. | `landmark`: Mordor Macula | No knocks | 450 |
| 61 | `master` | 🎓 Master Courier **new** | The last test, at the edge of the solar system: build a x5 combo. | combo ≥ 5 | No knocks | 500 |

## 8. Existing tests and scenes that change on purpose

Only these. Any other existing test that needs editing is a regression: fix the code, not the test.

| File | What changes |
|---|---|
| `tests/missions.test.mjs` | "unlock one at a time and pay their reward once": unlocking now follows chapters and stars. Keep its reward checks. |
| `tests/courier.test.mjs` | The two daily tests, if they fly past ten parcels. Any step that assumes every delivery adds 20 s, or that relies on a clock above the cap. |
| `tests/browser/scenes/courier.mjs`, `space.mjs` | The mission scenes named in B1.4 and B1.5. |

## 9. Checks

Before every commit:

```
npm run lint
npm test
```

For packages that change something visible (B1.1, B1.3, B1.4, B1.5):

```
SCENES=hangar,courier,daily-over,missions,mission npm run screenshots
```

Scenes build on earlier ones in their file, so include the scene that opens the world a scene needs.

Once at the end (about 95 minutes; not while `npm test` runs):

```
npm run screenshots
```

Open the PNGs and look at them. CI on GitHub is dead (a billing lock), so everything is checked locally. If
screenshots cannot run in your environment, say so in the PR and Claude runs them in review.

## 10. Out of scope

- Anything in section 3's Phase A list: Home, the hangar, the start screen, the briefing's layout, the lesson, music.
- Pilot rank, Rex's ladder, craft, supplies, contracts, streaks, the passport, trophy rewards, coin amounts, prices.
- Road missions, new worlds, new landmarks, new trophies.
- Leaderboards, accounts, ads, purchases.
- Bugs you find outside this phase's files: list them in the PR.

## 11. What to hand back

Push the branch and open a pull request against `main`:

```markdown
## Phase B1: the clock, the daily and the missions

Compare: https://github.com/Saljoki/planet-pop/compare/main...phase-b1-missions?expand=1

### Packages
- [ ] B1.0 Housekeeping — <commit>
- [ ] B1.1 The clock and the ten-parcel daily — <commit>
- [ ] B1.2 New counters and mission rules — <commit>
- [ ] B1.3 Chapters, stars and unlocking — <commit>
- [ ] B1.4 The 39 new missions, and par times — <commit>
- [ ] B1.5 The mission board — <commit>
- [ ] B1.6 Wrap-up — <commit>

### Checks
- `npm run lint`: <result>
- `npm test`: <passed> / <total>
- Screenshots: <scenes run>, <problems line>, or "could not run here because …"

### The clock
<your four pilots' run lengths and deliveries, beside the reference table in B1.1>

### Par times
<the table printed by scripts/pars.mjs, and the missions whose par was set another way, with how>

### README lines to update at merge
<the sentences in README.md that are now wrong, with their replacements. Claude applies them.>

### Deviations from docs/PHASE_B1.md
<each one, with the reason. "None" if none.>

### Questions and things found outside scope
<list>
```

## 12. If something blocks you

- A decision in section 4 cannot be built as written: stop that package, explain in the PR, carry on with the next
  package that does not depend on it.
- A mission cannot be completed as designed (a landmark out of reach, a rule that never triggers): keep its id, name
  and world, make the smallest change that works, and list it under "Deviations".
- The spec is silent on a detail: choose the simplest thing that fits the existing code and list it.
- Never weaken, skip or delete a test to get to green.

## 13. How Claude will review

1. **Scope:** nothing from section 3's Phase A list is touched; one commit per package.
2. **Rules:** one class per file; `Store.js` only; `planetpop.courier` gains `stars` and nothing else changes; no new
   dependency; precache current; version untouched.
3. **Data:** the 39 missions match Appendix A; the 22 old ones are intact; `MISSIONS[0]` is `first`.
4. **The clock:** Claude re-runs its four pilots on the branch and compares with B1.1's table.
5. **Missions:** the reference pilot on every flyable mission; the others flown by script.
6. **Tests:** `npm run lint` and `npm test`; every test listed here exists and tests what it says; nothing outside
   section 8 changed.
7. **Screens:** the board and the results card at 1280 × 720 and 390 × 844, read from the PNGs.
8. **Old saves:** the fixture in B1.3, and a save code made on `main`.
9. **Verdict:** "ready to merge" or a list of changes with file and line. Ata decides the merge.

---

## Appendix A. The 39 new missions as code

Paste into `MISSIONS` in chapter order, with each existing mission moved to the place marked. `par` is added in
B1.4.

```js
  // Earth
  { id: 'airmail', icon: '✉️', name: 'Air Mail', brief: 'Deliver 4 parcels between Earth’s great cities.',
    planet: { world: 'earth' }, goal: { stat: 'deliveries', target: 4 }, reward: 150 },
  { id: 'express', icon: '📮', name: 'Express Post', brief: 'Deliver fast enough to build a x4 combo.',
    planet: { world: 'earth' }, goal: { stat: 'combo', target: 4 }, reward: 250,
    bonus: { stat: 'rings', min: 5, text: 'Collect 5 rings' } },
  { id: 'wonders', icon: '📷', name: 'Wonders of the World', brief: 'Photograph Mount Everest, the Sahara and the Amazon. Fly low over each one.',
    planet: { world: 'earth' }, goal: { stat: 'visits', target: 3 }, reward: 300, tour: ['Mount Everest','The Sahara','The Amazon'], item: '📷 Photo' },
  // The Moon
  // (existing 'flag' goes here, unchanged)
  { id: 'moonrock', icon: '🪨', name: 'Moon Rock', brief: 'Collect a rock from Tycho crater and fly it to the lab.',
    planet: { world: 'moon' }, goal: { stat: 'deliveries', target: 1 }, reward: 200, fetch: 'Tycho', item: '🪨 Moon rock' },
  { id: 'spacerace', icon: '🏁', name: 'Space Race', brief: 'Rex wants the Moon too. Beat him to 3 towns in a row.',
    planet: { world: 'moon' }, goal: { stat: 'rexStreak', target: 3 }, reward: 300, rival: true,
    bonus: { stat: 'stolen', max: 0, text: 'Rex steals nothing' } },
  // Mars
  // (existing 'dust' goes here, unchanged)
  { id: 'rovers', icon: '🤖', name: 'Rover Rescue', brief: 'Fly a spare wheel to the rover in Gale crater and another to the one in Jezero crater.',
    planet: { world: 'mars' }, goal: { stat: 'visits', target: 2 }, reward: 250, tour: ['Gale crater','Jezero crater'], item: '🛞 Spare wheel' },
  { id: 'olympus', icon: '🌋', name: 'Top of the Solar System', brief: 'Carry a heavy weather station up Olympus Mons, the tallest volcano on any planet.',
    planet: { world: 'mars' }, goal: { stat: 'landmark', target: 1 }, reward: 350, landmark: 'Olympus Mons', carry: 'heavy', item: '🌡️ Weather station',
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  // Venus
  { id: 'cloudhop', icon: '☁️', name: 'Cloud City Shuttle', brief: 'Deliver 4 parcels between Venus’s floating towns.',
    planet: { world: 'venus' }, goal: { stat: 'deliveries', target: 4 }, reward: 250 },
  { id: 'ballast', icon: '🎈', name: 'Ballast Run', brief: 'The rafts need ballast to stay level. Deliver 3 heavy parcels.',
    planet: { world: 'venus' }, goal: { stat: 'heavy', target: 3 }, reward: 350, cargo: { heavy: 4 },
    bonus: { stat: 'rings', min: 5, text: 'Collect 5 rings' } },
  // (existing 'acid' goes here, unchanged)
  // Mercury
  // (existing 'shade' goes here, unchanged)
  { id: 'sundash', icon: '☀️', name: 'Sunrise Dash', brief: 'Deliver 2 parcels to towns in full sunshine. Get in and out before you cook.',
    planet: { world: 'mercury' }, goal: { stat: 'deliveries', target: 2 }, reward: 350, sunny: true,
    bonus: { stat: 'sun', max: 15, text: 'Under 15 s in the sunshine' } },
  { id: 'gallery', icon: '🎨', name: 'Gallery Tour', brief: 'Mercury’s craters are named after artists. Visit Beethoven, Rembrandt and Hokusai.',
    planet: { world: 'mercury' }, goal: { stat: 'visits', target: 3 }, reward: 400, tour: ['Beethoven','Rembrandt','Hokusai'], item: '📷 Photo',
    bonus: { stat: 'sun', max: 20, text: 'Under 20 s in the sunshine' } },
  // Jupiter
  { id: 'stations', icon: '🎈', name: 'Station to Station', brief: 'Deliver 4 parcels between Jupiter’s balloon stations.',
    planet: { world: 'jupiter' }, goal: { stat: 'deliveries', target: 4 }, reward: 300 },
  // (existing 'storm' goes here, unchanged)
  { id: 'king', icon: '😈', name: 'King of the Clouds', brief: 'Deliver 4 parcels with Rex on your tail. If he steals one, it’s over.',
    planet: { world: 'jupiter' }, goal: { stat: 'deliveries', target: 4 }, reward: 400, failIf: 'stolen', rival: true, rexLevel: 3 },
  // Io
  // (existing 'sulphur' goes here, unchanged)
  { id: 'loki', icon: '🔥', name: 'Lake of Fire', brief: 'Fly a heat probe to Loki Patera, a lake of lava 200 km across.',
    planet: { world: 'io' }, goal: { stat: 'landmark', target: 1 }, reward: 300, landmark: 'Loki Patera', item: '🌡️ Heat probe' },
  { id: 'thread', icon: '💍', name: 'Between the Volcanoes', brief: 'Fly through 12 rings while Io’s volcanoes erupt. Touch a plume and it’s over.',
    planet: { world: 'io' }, goal: { stat: 'rings', target: 12 }, reward: 400, failIf: 'ash', eruptions: true },
  // Europa
  // (existing 'sample' goes here, unchanged)
  { id: 'drill', icon: '⛏️', name: 'Ice Core', brief: 'Collect an ice core at Pwyll crater and fly it to the lab. It’s fragile.',
    planet: { world: 'europa' }, goal: { stat: 'deliveries', target: 1 }, reward: 350, failIf: 'broken', fetch: 'Pwyll', carry: 'fragile', item: '🧊 Ice core',
    bonus: { stat: 'rings', min: 3, text: 'Collect 3 rings' } },
  { id: 'signs', icon: '🐟', name: 'Signs of Life', brief: 'The scientists can’t wait. Deliver 3 urgent parcels.',
    planet: { world: 'europa' }, goal: { stat: 'urgent', target: 3 }, reward: 400, cargo: { urgent: 4 },
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  // Ganymede
  { id: 'biggest', icon: '📦', name: 'The Biggest Moon', brief: 'Deliver 4 parcels on Ganymede, a moon wider than Mercury.',
    planet: { world: 'ganymede' }, goal: { stat: 'deliveries', target: 4 }, reward: 300 },
  { id: 'aurora', icon: '🌌', name: 'Under the Aurora', brief: 'Deliver 3 parcels to towns in the dark, under Ganymede’s own aurora.',
    planet: { world: 'ganymede' }, goal: { stat: 'night', target: 3 }, reward: 350, dark: true },
  { id: 'grooves', icon: '🗺️', name: 'Old Ground, New Ground', brief: 'Survey Galileo Regio, Uruk Sulcus and the crater Tros. Fly low over each one.',
    planet: { world: 'ganymede' }, goal: { stat: 'visits', target: 3 }, reward: 400, tour: ['Galileo Regio','Uruk Sulcus','Tros'], item: '📷 Photo',
    bonus: { stat: 'rings', min: 5, text: 'Collect 5 rings' } },
  // Saturn
  { id: 'ringside', icon: '🪐', name: 'Ringside Seats', brief: 'Deliver 3 parcels between Saturn’s stations, under the rings.',
    planet: { world: 'saturn' }, goal: { stat: 'deliveries', target: 3 }, reward: 300,
    bonus: { stat: 'threads', min: 1, text: 'Fly through the ring ice once' } },
  // (existing 'ringrun' goes here, unchanged)
  { id: 'hexagon', icon: '⬡', name: 'Six Sides', brief: 'Fly a loop round the Hexagon, the six-sided jet stream at Saturn’s north pole.',
    planet: { world: 'saturn' }, goal: { stat: 'loops', target: 1 }, reward: 400 },
  // Titan
  // (existing 'huygens' goes here, unchanged)
  { id: 'methane', icon: '🧪', name: 'Methane Sea', brief: 'Scoop a sample from Kraken Mare, a sea of liquid methane, and fly it to the lab.',
    planet: { world: 'titan' }, goal: { stat: 'deliveries', target: 1 }, reward: 350, fetch: 'Kraken Mare', item: '🧪 Methane sample' },
  { id: 'airtour', icon: '🗺️', name: 'Titan Air Tour', brief: 'Fly low over Xanadu, Ligeia Mare and the Huygens landing site.',
    planet: { world: 'titan' }, goal: { stat: 'visits', target: 3 }, reward: 400, tour: ['Xanadu','Ligeia Mare','The Huygens landing site'], item: '📷 Photo' },
  // Enceladus
  { id: 'snowball', icon: '⚪', name: 'Snowball Express', brief: 'Deliver 3 parcels between the two towns of the whitest moon there is.',
    planet: { world: 'enceladus' }, goal: { stat: 'deliveries', target: 3 }, reward: 300,
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  { id: 'stripes', icon: '🐯', name: 'Tiger Stripes', brief: 'Fly a camera to the tiger stripes, the cracks the geysers spray from.',
    planet: { world: 'enceladus' }, goal: { stat: 'landmark', target: 1 }, reward: 350, landmark: 'The tiger stripes', item: '📷 Camera' },
  { id: 'taste', icon: '⛲', name: 'Taste the Ocean', brief: 'Fly through a geyser for 3 seconds to catch a sample of the ocean below. Your engine will splutter!',
    planet: { world: 'enceladus' }, goal: { stat: 'ash', target: 3 }, reward: 450, eruptions: true },
  // Uranus
  // (existing 'chill' goes here, unchanged)
  { id: 'polarnight', icon: '🌑', name: 'The Long Night', brief: 'Deliver 2 parcels to the station where the Sun hasn’t risen for years.',
    planet: { world: 'uranus' }, goal: { stat: 'night', target: 2 }, reward: 400, dark: true },
  { id: 'sideways', icon: '💍', name: 'The Sideways Planet', brief: 'Fly through 18 rings round the planet that rolls on its side.',
    planet: { world: 'uranus' }, goal: { stat: 'rings', target: 18 }, reward: 450 },
  // Neptune
  // (existing 'gale' goes here, unchanged)
  { id: 'darkspot', icon: '🌀', name: 'The Great Dark Spot', brief: 'Fly a loop round the Great Dark Spot while the wind pushes you west.',
    planet: { world: 'neptune' }, goal: { stat: 'loops', target: 1 }, reward: 450 },
  { id: 'supersonic', icon: '💨', name: 'Supersonic Winds', brief: 'Deliver 3 urgent parcels in winds of 2,000 km/h. Make the wind work for you.',
    planet: { world: 'neptune' }, goal: { stat: 'urgent', target: 3 }, reward: 500, cargo: { urgent: 4 },
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  // Triton
  { id: 'backwards', icon: '🔄', name: 'The Backwards Moon', brief: 'Deliver 3 parcels on Triton, the moon that orbits the wrong way.',
    planet: { world: 'triton' }, goal: { stat: 'deliveries', target: 3 }, reward: 350 },
  { id: 'cantaloupe', icon: '🍈', name: 'Cantaloupe Country', brief: 'Collect an ice sample from the cantaloupe terrain, ground that looks like a melon’s skin, and fly it to the lab.',
    planet: { world: 'triton' }, goal: { stat: 'deliveries', target: 1 }, reward: 400, fetch: 'The cantaloupe terrain', item: '🧊 Ice sample',
    bonus: { stat: 'rings', min: 4, text: 'Collect 4 rings' } },
  { id: 'geysers', icon: '⛲', name: 'Nitrogen Geysers', brief: 'Deliver 3 parcels while Triton’s geysers erupt. Fly into a plume and it’s over.',
    planet: { world: 'triton' }, goal: { stat: 'deliveries', target: 3 }, reward: 450, failIf: 'ash', eruptions: true },
  // Pluto
  // (existing 'hotel' goes here, unchanged)
  { id: 'heart', icon: '💙', name: 'Heart of Pluto', brief: 'Fly low over Sputnik Planitia, Tenzing Montes and Wright Mons, round Pluto’s heart.',
    planet: { world: 'pluto' }, goal: { stat: 'visits', target: 3 }, reward: 450, tour: ['Sputnik Planitia','Tenzing Montes','Wright Mons'], item: '📷 Photo' },
  { id: 'edge', icon: '😈', name: 'Race to the Edge', brief: 'Rex has followed you all the way out. Beat him to 3 towns in a row.',
    planet: { world: 'pluto' }, goal: { stat: 'rexStreak', target: 3 }, reward: 500, rival: true, rexLevel: 6,
    bonus: { stat: 'stolen', max: 0, text: 'Rex steals nothing' } },
  // Charon
  { id: 'ferry', icon: '⛴️', name: 'The Ferryman', brief: 'Deliver 3 parcels between Charon’s two towns.',
    planet: { world: 'charon' }, goal: { stat: 'deliveries', target: 3 }, reward: 400,
    bonus: { stat: 'combo', min: 3, text: 'Reach a x3 combo' } },
  { id: 'redpole', icon: '🔴', name: 'The Red Pole', brief: 'Fly a spectrometer to Mordor Macula, the dark red cap on Charon’s north pole.',
    planet: { world: 'charon' }, goal: { stat: 'landmark', target: 1 }, reward: 450, landmark: 'Mordor Macula', item: '🔬 Spectrometer' },
  { id: 'master', icon: '🎓', name: 'Master Courier', brief: 'The last test, at the edge of the solar system: build a x5 combo.',
    planet: { world: 'charon' }, goal: { stat: 'combo', target: 5 }, reward: 500 },
```
