# Planet Pop — Phase A: the first five minutes

Handoff spec for Codex. Claude reviews the result; Ata decides when it merges.

- **Repo:** https://github.com/Saljoki/planet-pop
- **Base:** `main` at `878b636` (v0.17.0)
- **Branch:** `phase-a-first-five-minutes`
- **Ships as:** v0.18.0
- **Put this file at:** `docs/PHASE_A.md` (first commit)

---

## 1. Read first

1. `CLAUDE.md`, `docs/HANDOFF.md`, `docs/EXTENDING.md`. Their rules apply to you exactly as written.
2. This file, start to finish, before writing code.

## 2. Why this phase exists

Planet Pop is a good arcade game hidden inside a planet viewer. Today a new phone player sees a planet and four icon
buttons. The only way into the game is `✈️ Play Sky Courier`, inside the ☰ panel, below a dozen settings, and that
panel starts closed under 700 px. Then comes a briefing with a goal, up to five tips and three lines of controls.

Phase A makes the game the first thing a player sees and teaches flying by doing.

**Done when:** a brand-new player on a phone taps one button, is flying within seconds, and delivers a first parcel
inside 60 seconds without reading a paragraph of text.

### The flow after Phase A

```
page load ─→ START SCREEN (the planet builds behind it)
               │
               ├─ PLAY ─┬─ new pilot ────→ FLYING LESSON ─→ results ─→ First Flight mission, or Home
               │        └─ everyone else ─→ HOME ─→ a card ─→ short briefing ─→ run ─→ results ─→ Home
               │
               └─ Explore ─→ the planet view, as today, plus a ▶ Play button in the top bar
```

## 3. Ground rules

From the repo's own docs, restated because they are the ones most often broken:

- Plain ES modules. No build step, no new dependencies, no network calls, no external URLs or asset files.
- **One class per file.** Data-only modules are fine. Small UI extends `js/ui/Widget.js`; full-screen menus extend
  `js/ui/Overlay.js`.
- Saved state goes through `js/core/Store.js`. **Never change the format of an existing `planetpop.*` key.** This
  phase adds one optional field to an existing JSON object (section 5, A3) and one new device-setting key (A5).
  Nothing else.
- After adding, renaming or removing any served file: `npm run precache`.
- Work on the branch. Do not merge into `main`.

Specific to this phase:

- **Phone first.** Every new screen must work at 390 × 844 and 844 × 390, with touch, keyboard and controller. Use the
  safe-area variables in `css/base.css` (`--st`, `--sb`, `--sl`, `--sr`).
- **Logic lives in methods, not inside event listeners.** The test DOM (`tests/helpers/dom.mjs`) fires no events, so
  a test can only call methods. Listeners should be one-liners that call a method.
- **Cache elements in `this.dom`.** The test DOM returns a new element on every `querySelector`.
- **Use `?.` for App members the tests don't build.** `makeApp()` in `tests/helpers/world.mjs` has no `start`,
  `music`, `map`, `trip`, `spaceCourier`, `friends` or `ambience`.
- **Tone of text:** short, friendly, emoji-led, British spelling, like the strings already there.
- **Don't touch:** world generation, vehicle handling, scoring, `MISSIONS`, the daily seed, the friends protocol,
  existing save keys, the ☰ panel's settings. No refactors outside the files this spec names.
- Keep new text for cards, lessons and tunes in the data modules named below, so a later phase can translate it.

### Known traps

- **`flyOn()` in unit tests.** `game.startMission()`, `startDaily()` and the new `startLesson()` go through
  `flyOn()`, which calls `app.newPlanet()` when the planet doesn't match. `makeApp()` has no `newPlanet`. In tests,
  call `game.start({ … })` directly, or stub the `start…` method you are checking was called.
- **`flyOn()` compares planet settings exactly.** The default first planet (seed 20261014, land 45%, 5 cities,
  classic) equals `MISSIONS[0].planet`. Keep it that way, so a new pilot's lesson starts with no rebuild.
- **The address bar is rewritten after every load** (`App.updateUrl`). A query string does not mean "came from a
  link". Use `app.roomLink` and `app.dailyLink`, which `App` already captures.
- **The start screen is not an `Overlay`**, so it is not in the Esc stack. Options can open on top of it; its own
  keys must do nothing while anything is on top.
- **The loading overlay** (`hud.setLoading`) sits above everything. Shown during the first build, it would cover the
  start screen.
- **The idle tour** (`TourMode.free`) starts after a minute with no input unless every new screen is listed there.
- **ESLint scans the whole repo.** Keep scratch scripts outside it.
- **Don't run `npm test` and the screenshots at the same time.** The browser has crashed when they overlapped.

## 4. Decisions already made

Do not reopen these. If one turns out to be impossible, stop and say so in the PR (section 10).

| # | Decision |
|---|---|
| 1 | The hangar keeps its name and becomes upgrades and paint jobs only. Its six mode buttons move to a new **Home** screen. There is no separate Shop in this phase. |
| 2 | The start screen shows on every launch. It doubles as the loading screen for the first planet. |
| 3 | The lesson is a new run (`LessonRun`), separate from the First Flight mission. `MISSIONS` does not change. |
| 4 | The lesson flies on First Flight's planet (`MISSIONS[0].planet`), which equals the default first planet, so a plain first load needs no rebuild. |
| 5 | "Lesson done" is an optional `lesson` field in the existing `planetpop.courier` JSON. No new save key. |
| 6 | Finishing the lesson pays 50 coins, once. |
| 7 | Music is synthesised on the existing AudioContext, like every other sound. No audio files. |
| 8 | The planet view (Explore) has no music; ambience stays its soundscape. |
| 9 | Results and pause keep `🌍 Back to planet`. Results swaps `🛠️ Hangar` for `🏠 Home`. |

## 5. Work packages

Seven packages, in this order, **one commit each**. The game must work and all checks must pass after every commit.

| | Package | Size |
|---|---|---|
| A0 | Housekeeping | Tiny |
| A1 | Home screen; hangar slimmed | Medium |
| A2 | Start screen and the Play button | Medium |
| A3 | The flying lesson | Large |
| A4 | Short briefings, quieter starts | Small |
| A5 | Music | Medium |
| A6 | Wrap-up: version, docs, full checks | Small |

---

### A0. Housekeeping

- Add this file as `docs/PHASE_A.md`.
- Add `AGENTS.md` at the repo root with exactly this:

```markdown
# Planet Pop: notes for coding agents

Read `CLAUDE.md`, then `docs/HANDOFF.md` and `docs/EXTENDING.md`. Every rule there applies to every agent.
The current phase's spec, if there is one, is in `docs/` (for example `docs/PHASE_A.md`).
```

---

### A1. Home screen; hangar slimmed

**The player gets:** one clear screen for "what do I play", with a big "next up" button, and a hangar that is only
about improving the plane.

**New files**

- `js/game/HomeCards.js` (data and pure functions, no class):
  - `HOME_CARDS`: six entries `{ id, icon, name, desc }` in this order: `courier`, `daily`, `missions`, `space`,
    `roads`, `free`.
  - `cardStat(id, progress)`: the one-line stat under a card's name.
    - `courier`: `⭐ Best 1,240`, or `Not flown yet`.
    - `daily`: today's place from `dailyPlace()`, then `⭐ 938 today` or `not flown today`.
    - `missions`: `7 of 22 done` (count from `MISSIONS`, never a hard-coded 22).
    - `space`, `roads`, `free`: empty string.
  - `nextUp(progress)`: what the big button offers, `{ icon, title, text, card?, mission? }`. First match wins:
    1. First Flight (`MISSIONS[0]`) not done → that mission.
    2. Today's daily not flown (`progress.dailyBest(todayKey()) === null`) → the `daily` card.
    3. The first mission in `MISSIONS` order that is unlocked and not done → that mission.
    4. Otherwise → the `courier` card.
- `js/game/screens/HomeScreen.js`: `class HomeScreen extends Overlay`, id `home`.
  - Header: `🏠 Planet Pop`, coins in `#hoCoins`, a `#hoName` button (`🧑‍✈️ Ata`, or `🧑‍✈️ Add your name`) that opens
    Options.
  - `#hoNext`: the next-up button, `class="big"`, the most prominent thing on the screen.
  - `#hoCards`: one `<button data-card="…">` per card: icon, name, stat (or `desc` when the stat is empty). Two
    columns on a phone upright, three on wider screens.
  - Footer: `#hoHangar` (`🛠️ Hangar`, plus ` · 2 to buy` when `progress.affordable()` is above zero),
    `#hoTrophies` (`🏆 12 / 55`, opens the existing trophy list), `#hoOptions` (`⚙️`), `#hoExplore` (`🌍 Explore`,
    closes Home).
  - Methods: `render()`; `show()` renders, then shows; `pick(id)` does what tapping a card does; `next()` does what
    `#hoNext` does. One delegated click listener calls `pick`.
  - What each card does (Home hides first):
    - `courier` → `game.launch()`
    - `daily` → `game.startDaily()`
    - `missions` → `game.board.show()`
    - `space` → `app.spaceCourier?.openBoard()`
    - `roads` → `game.roads.show()`
    - `free` → `game.launch({ free: true })`
- `css/home.css`: styles for Home (and, later in this phase, the start screen and the coach). Link it in
  `index.html` after `menus.css` and before `photo.css`. Small-screen rules go in `css/phone.css`, as the repo does.

**Changed files**

- `js/game/Progress.js`: add `affordable(trophies)`: how many upgrades and paint jobs the player can buy right now.
- `js/game/screens/Hangar.js`:
  - Remove the `.hfoot` block: `hGo`, `hMissions`, `hDaily`, `hFree`, `hRoads`, `hSpace` and `hDailyNote`.
  - Constructor becomes `(app, progress, { onOptions, onClose })`. The ✕ calls `onClose`.
  - Everything else (name field, coins, upgrades, paint jobs, `buy`, `pickSkin`, `render`) stays as it is.
- `js/game/CourierGame.js`:
  - `this.home = new HomeScreen(app, this)`.
  - `openHome()`: does nothing while a run is active; otherwise shows Home.
  - `openHangar()` stays. Closing the hangar opens Home.
- Everything that used to open the hangar as "the way in" now opens Home:
  - `ControlPanel` `#playBtn`
  - the `?daily` link branch in `App.newPlanet` (keep its toast, reworded for Home)
  - `Briefing.back()`'s final `else`
  - `Gamepad` (below)
- `js/game/screens/ResultsScreen.js`: replace `#gHangar` (`🛠️ Hangar`) with `#gHome` (`🏠 Home`): stop the run, open
  Home. Leave `#gExit` alone.
- `js/game/input/Gamepad.js`:
  - Start with nothing open → Home.
  - Home open: A → `home.next()`, B → close.
  - Hangar open: B → close (which opens Home). A does nothing.
  - Road board open: B → Home.
- `js/ui/TourMode.js`: `free` is also false while Home is open.
- `js/game/screens/OptionsMenu.js`: after a progress reset, re-render Home if it is open (as it does for the hangar).

**Tests** — new `tests/home.test.mjs`:

- `nextUp` returns each of its four answers for the right progress.
- `cardStat` for a fresh pilot and for one with a best score, a daily best and three missions done.
- `home.pick(id)` for all six ids: Home closes and the right thing opens or launches.
- `progress.affordable()` counts correctly at 0, 150 and 5,000 coins.
- The hangar's HTML no longer contains `hGo` or `hDailyNote`.

**Screenshot scenes**

- `courier.mjs`, scene `briefing`: open Home and click `[data-card="courier"]` instead of `#hGo`.
- `road.mjs`: open Home and click `[data-card="roads"]` instead of `#hRoads`.
- New scene `home` (desktop, after `hangar`) and `mobile-home` (in `phone.mjs`).

**Accept when**

- From Home, every one of the ten ways to play can be chosen in at most two taps.
- At 390 × 844 the next-up button and all six cards are visible without scrolling.
- The hangar shows no mode buttons, and closing it returns to Home.
- A v0.17.0 save loads with the same coins, upgrades, paint, missions and bests.

---

### A2. Start screen and the Play button

**The player gets:** a title screen with one big PLAY button, and a Play button that is always visible in the planet
view.

**New file** — `js/ui/StartScreen.js`: `class StartScreen extends Widget`, id `start`.

- Not an `Overlay`: no dimmed backdrop. The planet is fully visible behind it. It takes all pointer input while open.
- Contents:
  - A large `Planet Pop!` title.
  - `#stPlay`: `▶ PLAY`, `class="big"`, the largest control on the screen, in the lower third where a thumb reaches.
  - `#stExplore`: `🌍 Explore the planet`, smaller.
  - `#stOptions`: `⚙️`. A small `#stVersion` (`v0.18.0`). `#stHello` (`👋 Ata`) when a name is saved.
- Methods:
  - `ready()`: the first planet is built; enable the buttons.
  - `play()`: hide, then `game.play()`.
  - `explore()`: hide; the planet view appears exactly as today.
  - `dismiss()`: hide with no side effects (tests and the screenshot harness use it).
  - `static wanted({ roomLink, dailyLink })`: false for an invite link or a daily link, true otherwise.
- While the first planet builds: both buttons disabled, PLAY reads `🌍 Building planet…`.
- Keys while it is open and nothing is on top of it: Enter or Space → PLAY, Esc → Explore. Controller: A or Start →
  PLAY, B → Explore.

**Changed files**

- `js/App.js`:
  - Create `this.start` after the HUD and before the first `newPlanet`, and show it straight away when
    `StartScreen.wanted(...)`.
  - For the initial build only, skip `hud.setLoading(true)` when the start screen is showing (its overlay would cover
    the start screen). Call `start.ready()` when the build finishes.
  - Invite links (`?room=`) and daily links (`?daily`) behave as they do now, with Home in place of the hangar.
- `js/ui/Hud.js`:
  - `setStartMode(on)`: hides `#title`, `#hint`, `#worldTag`, `#topBtns` and the ☰ panel and sets `body.at-start`;
    restores them after. Model it on `setGameMode`.
  - Add `#homeBtn` (`▶ Play`, styled as the primary button) as the first button in `#topBtns`, so it hides whenever
    the top bar hides. It calls `game.play()`. On phones (rules in `phone.css`) pin it bottom-centre, above the hint
    and inside the safe area, at thumb size, with the word "Play" showing.
  - Ignore the N, H, T, M and P shortcuts while the start screen or Home is open.
- `js/game/CourierGame.js`: add `play()`. In this package it calls `openHome()`. A3 extends it.
- `js/ui/ControlPanel.js`: `#playBtn` reads `▶ Play` and calls `game.play()`.
- `js/ui/TourMode.js`: `free` is also false while the start screen is open.
- `js/camera/CameraRig.js`: while the start screen is open the planet turns gently from the first frame (today it
  waits for six idle seconds).
- `tests/browser/harness.mjs`: `open()` and `second()` call `app.start?.dismiss()` once the planet is ready, so every
  existing scene still starts from the planet view.

**Tests** — new `tests/start.test.mjs` (build a `StartScreen` on a `makeApp()` app, as `touch.test.mjs` does for
`TourMode`):

- Buttons are disabled until `ready()`.
- `play()` hides it and opens Home for a pilot with progress.
- `explore()` hides it and restores the HUD pieces `setStartMode` hid.
- `wanted()` is false for an invite link and for a daily link.

**Screenshot scenes:** `start` (desktop) and `mobile-start` (phone). Show it with `app.start.show()`, since the
harness dismisses it on load.

**Accept when**

- A fresh load shows the start screen at once, with PLAY disabled until the planet is ready and no second loading
  overlay.
- PLAY is reachable with one thumb at 390 × 844 and is not under the notch or the home indicator.
- In the planet view on a phone, `▶ Play` is visible without opening anything.
- All existing screenshot scenes still pass unchanged.

---

### A3. The flying lesson

**The player gets:** a first flight that teaches steering, climbing, boosting, rings and delivering, one short prompt
at a time, with no clock and no way to fail.

**New files**

- `js/game/Lessons.js` (data): `LESSON_PLANET` (`MISSIONS[0].planet`), `LESSON_COINS = 50`, and `LESSONS`:

| id | Prompt (touch) | Prompt (keys) | Prompt (controller) | Done when |
|---|---|---|---|---|
| `steer` | Drag left and right to steer | ← → to steer | Left stick to steer | 1.2 s of steering input in total |
| `climb` | Drag up to climb, down to dive | ↑ ↓ to climb and dive | Stick up and down to climb and dive | 1.2 s of climb or dive input in total |
| `boost` | Hold BOOST | Hold Space | Hold A | 1 s of boosting |
| `ring` | Fly through the blue ring | same | same | a ring collected during this step |
| `deliver` | Follow the arrow. Swoop low through the pink beacon! | same | same | the parcel is delivered |

  With Invert Y on, the `climb` prompt swaps "climb" and "dive", as `controlsFor()` does in `Briefing.js`.

- `js/game/screens/Coach.js`: `class Coach extends Widget`, id `gCoach`, in the game layer.
  - Shows the current prompt (`#gCoachText`) and five progress dots (`#gCoachDots`).
  - Top centre, below the safe area. At least 22 px text on a phone.
  - Must never cover the left-half thumb area, the BOOST button, the arrow or the mini-map.
  - Methods: `say(index, text)`, `tick()` (a ✔ flash), `nudge()` (a pulse), `hide()`.

- `js/game/runs/LessonRun.js`: `class LessonRun extends DeliveryRun`.
  - `get coached()` is true. `get hasRival()` is false. No clock: the time never counts down and `checkEnd()` does
    nothing. Layout: no stat badges, no mode badge.
  - `rand` is seeded (as `MissionRun` does with `mulberry32(dailySeed('lesson'))`), so the lesson is the same every
    time.
  - `begin()`: no intro toast. The beacon and the arrow stay hidden until the `deliver` step. The goal line
    (`#gGoal`) stays empty; only the coach talks.
  - Each frame it measures the current step from `player.input` (`turnInput()`, the climb inputs, boosting) and
    advances when the step's condition is met: `coach.tick()`, the `ring` sound, a 0.6 s pause, the next prompt.
  - `ring` step: on entering it, move the nearest ring a little way ahead with `props.ahead(ring, player)` and point
    the arrow at it. A ring collected in an earlier step does not count.
  - `deliver` step: on entering it, choose the parcel's town: the nearest town at least 0.35 rad from the plane.
    Show the beacon and point the arrow. If the plane is within 0.25 rad of the town but too high to deliver, the
    prompt becomes `Lower! Swoop through the beacon`.
  - 10 s on one step with no progress → `coach.nudge()` and the `beep` sound. Never skip a step automatically.
  - Crashes cost nothing but the bonk. A wreck gives a fresh plane at the nearest town (`game.respawnSoon()`), and
    the lesson carries on at the same step.
  - On delivery: `progress.finishLesson()`, then `game.finish(...)` with:
    - title `🎓 You're a courier!`
    - text `First parcel delivered` and, the first time, `🪙 +50 coins`
    - `next: MISSIONS[0]` (the existing `▶ Next mission` button starts First Flight on the same planet)
    - `again: '↻ Lesson again'`, `bigAgain: false`
    - sound `trophy`

**Changed files**

- `js/game/runs/Run.js`: `get coached() { return false; }`, documented like the other hooks.
- `js/game/runs/modes.js`: `if (opts.lesson) return LessonRun;` and the doc comment.
- `js/game/Progress.js`:
  - `lesson`: boolean, loaded from and saved to `planetpop.courier` (missing means false).
  - `get needsLesson()`: `lesson` is false **and** the pilot has no coins, no best score, no missions done, no
    upgrade levels and no road-trip bests. So nobody who has already played is sent to the lesson.
  - `finishLesson()`: sets `lesson`, pays `LESSON_COINS` the first time only, returns the coins paid.
  - `skipLesson()`: sets `lesson`, pays nothing.
  - `reset()` clears `lesson`: a reset pilot is a new pilot.
- `js/game/CourierGame.js`:
  - `startLesson()`: `flyOn(LESSON_PLANET, { lesson: true }, '🎓 Getting your plane ready…')`.
  - `launch()`: a lesson never shows the briefing.
  - `play()`: `needsLesson` → `startLesson()`, otherwise `openHome()`.
  - `start()`: skip the two start-of-run toasts (the touch controls reminder and the runway tip) when
    `run.coached`.
- `js/game/screens/PauseMenu.js`: `#pSkip` (`⏭ Skip the lesson`), shown only during a lesson: unpause,
  `progress.skipLesson()`, stop the run, open Home.
- `js/game/screens/OptionsMenu.js`: `#oLesson` (`🎓 Flying lesson`) in the Game section, hidden while a run is
  active: close Options, `game.startLesson()`.

**Tests** — new `tests/lesson.test.mjs` on the lesson planet:

- Each step advances on its own input and not on another step's input.
- A scripted pilot (set `player.input` for the first three steps, then `steerToward` the ring, then the town)
  finishes in under 45 simulated seconds.
- No clock and no Rex: after 200 simulated seconds of doing nothing the run is still active and `run.rival` is null.
- A wreck mid-lesson respawns the plane and keeps the current step.
- Finishing sets `lesson`, pays 50 coins the first time and 0 the second.
- `needsLesson` is true for an empty save, and false for this v0.17.0 fixture, which must also load unchanged:
  `{"coins":320,"best":940,"levels":{"engine":1},"owned":["classic","sky"],"skin":"sky","daily":null,"missions":["first"],"bests":{}}`
- `launch({ lesson: true })` starts the run with no briefing, even with the briefing option on.
- Skipping marks the lesson done and pays nothing.

Add to `tests/start.test.mjs`: `play()` starts the lesson for a fresh pilot.

**Screenshot scenes:** `lesson-steer`, `lesson-ring`, `lesson-done` (desktop) and `mobile-lesson` (phone, a thumb on
the stick).

**Accept when**

- New pilot: one tap on PLAY, no menu, no briefing, flying.
- Every prompt is one short line; nothing else on screen is giving instructions.
- The lesson cannot be failed, and cannot be lost by doing nothing.
- A pilot with any existing progress never sees the lesson unless they ask for it in Options.
- The coach clears the thumb area, BOOST, the arrow and the mini-map at 390 × 844 and 844 × 390.

---

### A4. Short briefings, quieter starts

**The player gets:** a briefing that is a title, one line and a Start button.

**Changed files**

- `js/game/screens/Briefing.js`:
  - The panel shows the icon and title, the goal line, and `▶ Start` / `⚙️ Options` / `✕ Back`.
  - The tips, the controls and the "don't show this" checkbox move inside
    `<details id="bMore"><summary>ℹ️ How to play</summary>…</details>`, closed by default.
  - Keep the ids `bTips`, `bControls` and `bSkip`, and keep `briefingFor()` and `controlsFor()` unchanged: tests and
    the `briefing-inverted` scene read them.
- `js/game/CourierGame.js` `start()`: the touch controls reminder toast shows only while `progress.lesson` is false.
  The runway tip stays as it is.

**Tests:** in `tests/options.test.mjs`, add a check that the tips and controls sit inside `bMore`. The existing
briefing-text tests must pass untouched.

**Screenshot scenes:** `briefing`, `briefing-inverted` and `mobile-briefing` re-shot; update their notes.

**Accept when**

- At 390 × 844 and 844 × 390 the Start button is visible without scrolling, for the longest mission brief.
- Opening "How to play" shows exactly the tips and controls a v0.17.0 briefing showed.

---

### A5. Music

**The player gets:** a soundtrack on the menus, in flight and in space.

This is the one package Ata must judge by ear. Keep it self-contained so it can be tuned or reverted alone.

**New files**

- `js/ui/Tunes.js` (data): three tunes, `menu`, `flight` and `space`. Each is
  `{ id, bpm, bars: 8, steps: 16, voices: [{ wave, gain, notes }] }`, with notes placed on the step grid.
  - `menu` and `flight`: bright and bouncy, major or major-pentatonic, square and triangle waves, a bass line, a lead
    and a light noise hat. `flight` is faster than `menu`.
  - `space`: slow, sparse, triangle and sine pads.
  - No note crosses the end of the loop, and every note ends with a short release, so the seam never clicks.
- `js/ui/Music.js`: `class Music`.
  - Uses `app.sfx.ctx` and its own master gain to the destination, as `Ambience` does.
  - `update(dt)`, called from `App.frame()` after `ambience.update`, schedules notes at most 0.25 s ahead. No
    timers: when the frame loop stops, the music stops.
  - `want()` picks the tune:
    - `space`: the system map is open or a trip is under way.
    - `flight`: a run is active and not over.
    - `menu`: the start screen, Home, the hangar, a board, the briefing or a results card is showing.
    - nothing: the planet view.
  - A change of tune crossfades over 0.8 s and starts the new tune from its first bar.
  - `flight` plays 12% faster while a clocked run has 10 seconds or less left.
  - Paused: the music drops to 30%.
  - Silent when the Sound switch is off or the volume is 0.
  - At full volume the master gain is 0.10 or less, so effects always sit on top.
  - `setVolume(v)`; `volume` is saved under the new key `planetpop.music` with `loadNumber` / `saveNumber`, default
    0.4. It is a device setting like `planetpop.ambience`: **do not** add it to `SAVED_KEYS`.

**Changed files**

- `js/App.js`: `this.music = new Music(this)` and the `update` call.
- `js/game/screens/OptionsMenu.js`: a `Music` slider in the Sound section (`#oMus`, `#oMusVal`), 0 to 100 in steps
  of 5, the same pattern as Ambience.

**Tests** — new `tests/music.test.mjs`:

- Every tune is well formed: voices fit `bars × steps`, frequencies are between 55 and 2,000 Hz, gains are at most 1,
  and no note crosses the loop end.
- With a fake AudioContext that counts oscillators, four seconds of `flight` schedules the number of notes the tune
  data predicts, and nothing is scheduled with sound off or the volume at 0.
- `want()` returns the right tune for each state listed above.
- The volume is remembered, and `planetpop.music` is not in `SAVED_KEYS`.

**Accept when**

- No clicks at loop seams or on tune changes.
- Effects stay clearly audible over the music at every volume.
- Backgrounding the tab stops the music within half a second.
- Ata has listened and said yes. Until then the package is "ready for his ear", not "done".

---

### A6. Wrap-up

- Version 0.18.0 in `package.json`, `package-lock.json` (lines 3 and 9) and `js/core/Version.js`.
- `npm run precache`.
- `README.md`: how you start playing now; Home; what the hangar is; the lesson; the short briefing; music.
- `docs/EXTENDING.md`: "Add a Home card", "Add a lesson step", "Add a tune"; add `home.css` to the styles list.
- `docs/HANDOFF.md`: version, "Where things stand", the map of the code, any new gotcha, and a pointer to this file.
- Run every check in section 7 one last time.

## 6. Existing tests and scenes that change on purpose

Only these. Any other existing test or scene that needs editing is a regression: fix the code, not the test.

| File | What changes |
|---|---|
| `tests/options.test.mjs` | "Back returns to where it was chosen": Back from a courier-run briefing opens Home, not the hangar. |
| `tests/options.test.mjs` | The controller test: Start opens Home; A on Home launches next-up; B from the hangar returns to Home. |
| `tests/browser/scenes/courier.mjs` | `briefing` starts from Home (`[data-card="courier"]`), not `#hGo`. |
| `tests/browser/scenes/road.mjs` | Opens the road board from Home (`[data-card="roads"]`), not `#hRoads`. |
| `tests/browser/harness.mjs` | `open()` and `second()` dismiss the start screen. |

## 7. Checks

Run before every commit:

```
npm run lint
npm test
```

Run for every package that changes something visible (A1 to A4), with the scenes it adds or touches:

```
SCENES=start,home,lesson,hangar,briefing,options,courier,road-trips,mobile npm run screenshots
```

(`options` is there because `briefing-inverted` builds on it.)

Run once at the end (about 95 minutes; not at the same time as `npm test`):

```
npm run screenshots
```

Open the PNGs and look at them. "✔ No page or shader errors" is not enough.

CI on GitHub is dead (a billing lock, not the code). Everything is checked locally.

If screenshots cannot run in your environment, say so plainly in the PR. Claude runs them during review.

## 8. Out of scope

- Shop, ads, purchases, accounts, analytics, any server.
- Pilot rank, mission stars, new missions, craft collection, economy changes, daily streaks.
- Capacitor, native plugins, background pause, WebGL context-loss handling.
- A strings table or translations.
- Renaming or restyling anything this spec does not name.
- Fixing bugs you find outside this phase's files: list them in the PR instead.

## 9. What to hand back

Push the branch and open a pull request against `main` with this description:

```markdown
## Phase A: the first five minutes

Compare: https://github.com/Saljoki/planet-pop/compare/main...phase-a-first-five-minutes?expand=1

### Packages
- [ ] A0 Housekeeping — <commit>
- [ ] A1 Home screen; hangar slimmed — <commit>
- [ ] A2 Start screen and the Play button — <commit>
- [ ] A3 The flying lesson — <commit>
- [ ] A4 Short briefings — <commit>
- [ ] A5 Music (ready for Ata's ear) — <commit>
- [ ] A6 Wrap-up — <commit>

### Checks
- `npm run lint`: <result>
- `npm test`: <passed> / <total>
- Screenshots: <scenes run>, <problems line>, or "could not run here because …"

### Deviations from docs/PHASE_A.md
<each one, with the reason. "None" if none.>

### Questions and things found outside scope
<list>
```

## 10. If something blocks you

- A decision in section 4 cannot be built as written: stop that package, explain in the PR, carry on with the next
  package that does not depend on it.
- The spec is silent on a detail: choose the simplest thing that fits the existing code and list it under
  "Deviations".
- An existing test fails and it is not in section 6: that is a regression in your change.
- Never weaken, skip or delete a test to get to green.

## 11. How Claude will review

1. **Scope:** the diff touches only what this spec names; one commit per package.
2. **Rules:** one class per file; `Store.js` only; no existing key format changed; `planetpop.music` not in
   `SAVED_KEYS`; precache current; version in three places; docs updated; no new dependency; no external URL.
3. **Tests:** `npm run lint` and `npm test` on the branch; every new test listed here exists and tests what it says;
   no existing test changed outside section 6.
4. **Behaviour:** each "Accept when" line, checked in headless Chrome at 1280 × 720, 390 × 844 and 844 × 390, by
   reading the PNGs.
5. **Regression:** the existing scenes compared with `main`.
6. **Old saves:** the v0.17.0 fixture, and a save code made on `main` loaded on the branch.
7. **Verdict:** "ready to merge" or a list of changes with file and line. Ata decides the merge.
