# Planet Pop — Phase B4: the passport

Handoff spec for a builder agent. Claude reviews the result; Ata decides when it merges.

- **Repo:** https://github.com/Saljoki/planet-pop
- **Base:** `main` at `b150a6d` (v0.21.0)
- **Branch:** `phase-b4-passport`
- **Version:** 0.22.0, in the last package
- **This file:** `docs/PHASE_B4.md`, already on the branch

No other agent is working on the repo. Every file is yours to change within this spec.

---

## 1. Read first

1. `CLAUDE.md`, `docs/HANDOFF.md`, `docs/EXTENDING.md`. Their rules apply exactly as written.
2. `docs/DESIGN.md`, sections 4, 5.4 and 5.10, for why this exists.
3. This file, start to finish, before writing code.

## 2. Why this phase exists

The game has 17 real worlds and 44 named landmarks, each with a true fact attached. Nothing rewards a pilot for
seeing them. Missions visit 28 of the landmarks once; the other 16 are never pointed at. A pilot who reaches a world
has no record of having been there.

The passport is the collection that lasts longest. It gives every world a page, every page a set of stamps, a reason
to fly somewhere new today, and a picture worth sending to a friend. That picture is the first thing in the game a
player shares that is about them and not about a score.

## 3. Ground rules

From the repo's docs, restated because they are the ones most often broken:

- Plain ES modules. No build step, no new dependencies, no network calls, no external URLs or asset files.
- **One class per file.** Data-only and function-only modules are fine.
- Saved state goes through `js/core/Store.js`. **Never change the format of an existing `planetpop.*` key.** This
  phase adds one key, `planetpop.passport`. Nothing else is added to any existing key.
- After changing any served file: `npm run precache`.
- Work on the branch. Do not merge into `main`.

Specific to this phase:

- **Logic lives in methods, not inside event listeners.** The test DOM fires no events.
- **Cache elements in `this.dom`.** The test DOM returns a new element on every `querySelector`.
- **Every reward coin uses `progress.addCoins(n, false)`.** Earned coins pay XP; rewards must not.
- **Save the receipt before paying.** A stamp, a page and the finished passport each pay once, across reloads, save
  codes and resets.
- **The passport only watches.** It never changes a run's score, clock, coins, route or random numbers. The daily
  must stay the same for everyone.
- **Phone first.** The sizes are 390 × 844, 360 × 780, 844 × 390, 780 × 360 and 667 × 375.
- **Tone of text:** short, friendly, emoji-led, British spelling.

### Known traps

- **`planetpop.visited` is written before the game exists.** `App.swapIn` calls `achievements.visitWorld(id)` for
  the first planet, before `app.game` is built. The passport's constructor must read the key itself.
- **A landmark has no id.** Its `name` in `js/space/Worlds.js` is its permanent id from now on. Say so in
  `docs/EXTENDING.md`.
- **Tests that need a rank** use `setRank(game, rank)` from `tests/helpers/rank.mjs` and grant coins with
  `addCoins(n, false)`. Never replace `game.career` with a stub.
- **The results card holds career lines in `#gNews`.** One line a run for stamps, not one a stamp: a photo tour
  stamps five landmarks.
- **A mission and the daily build real worlds.** Starting one visits that world, so the arrival stamp can land
  while the "Building…" toast is up. That is correct.
- **Toasts draw over every overlay** (layer 30). Keep stamp toasts to one line of text.

## 4. Decisions already made

| # | Decision |
|---|---|
| 1 | Eighteen pages, in chapter order: Flight school, then the 17 worlds. |
| 2 | Four kinds of stamp: arrival, first delivery, each landmark, all missions. 97 stamps in all (table 7.1). |
| 3 | A landmark is stamped by passing within 0.09 rad of it in any vehicle during any run, at any height. Explore mode does not stamp. |
| 4 | A stamp pays 50 XP. A full page pays 200 coins and 300 XP. The full passport pays 2,000 coins and 1,000 XP. |
| 5 | Stamps a pilot has already earned are filled in and paid once, on the first launch after the update. |
| 6 | A page has a **Fly there** button: a sightseeing flight on that world, with the arrow on the nearest landmark still to stamp. No clock, no coins. |
| 7 | A page can be shared as a picture: 1080 × 1350, drawn on a canvas, sent with the system share sheet or saved. |
| 8 | Home's footer gets a passport button with the count. |
| 9 | A rank-up says what it opens in the hangar (B4.1). It was missing from B2 and B3. |
| 10 | No new trophies, missions, worlds, landmarks or contracts. |

## 5. Work packages

Build in this order, one commit each, named `B4.n: …`. Lint and tests pass at every commit.

| Package | What |
|---|---|
| B4.0 | Housekeeping |
| B4.1 | Rank-ups say what they open |
| B4.2 | Pages, stamps and rewards |
| B4.3 | Stamps in flight |
| B4.4 | The passport screen |
| B4.5 | Sightseeing flights |
| B4.6 | A page as a picture |
| B4.7 | Wrap-up |

### B4.0 Housekeeping

Confirm the branch is at `b150a6d` plus this file, `npm run lint` is clean and `npm test` passes 494 of 494. No code
changes. Report the counts in the PR.

### B4.1 Rank-ups say what they open

A pilot who reaches rank 4 is not told the Bulldog is now for sale.

- In `Career.addXp`, after a rank's own line and before Rex's lines, and never while `migrating`:
  - a craft whose `rank` equals the new rank: `🔓 New in the hangar: 🐶 Bulldog`
  - a supply slot whose rank equals the new rank: `🔓 Supply slot 1 is open`
- Read `CRAFTS` and `SLOT_RANKS`; no numbers are repeated in `Career.js`.
- Add `career.say(line)`, which queues one news line. The passport uses it. Nothing else may push to `lines` from
  outside `Career`.

**Tests:** crossing rank 3 queues the slot line; rank 4 the Bulldog line; a jump from rank 2 to rank 8 queues, in
order, each rank line followed by what that rank opens; an old save's welcome-back still queues exactly one line.

**Accept when:** the eight gates (craft at 4, 7, 10, 14, 18; slots at 3, 8, 13) each produce their line once.

### B4.2 Pages, stamps and rewards

**New `js/game/PassportPages.js`** (data and functions only):

- `PAGES`: one entry per chapter in `CHAPTERS` order: `{ id, icon, name, stamps }`. The first page's id is
  `school`.
- Each stamp is `{ id, kind, icon, label, hint, note }`:

  | Kind | Id | Icon | Label | Hint when not yet earned | On which pages |
  |---|---|---|---|---|---|
  | `arrival` | `mars:arrival` | 🛬 | Arrived | Land here | The 17 worlds |
  | `delivery` | `mars:delivery` | 📦 | First delivery | Deliver a parcel here | All 18 |
  | `landmark` | `mars:at:Olympus Mons` | 📍 | The landmark's name | Fly over it | Each landmark of the world, in `Worlds.js` order |
  | `chapter` | `mars:chapter` | 🎯 | All missions | Finish its 3 missions (10 on Flight school) | All 18 |

  A page lists them in that order. A landmark stamp's `note` is the landmark's `note`; the others have none.
- `pageOf(planet)`: the planet's world id, or `school` for any made-up planet.
- `STAMP_TOTAL` (97), `STAMP_XP` is not here: add `stamp: 50, page: 300, passport: 1000` to `XP` in `Ranks.js`.
- `PAGE_COINS = 200`, `PASSPORT_COINS = 2000`, `NEAR = 0.09`.

**New `js/game/Passport.js`** (class `Passport`), built in `CourierGame` straight after `Career`:

- Key `planetpop.passport`: `{ stamps: { '<stamp id>': '<UTC day, YYYY-MM-DD>' }, pages: ['<page id>'], done: false }`.
  Load it defensively: unknown stamp ids and page ids are dropped, wrong types become empty.
- `has(id)`, `count`, `pageCount(pageId)` → `{ have, of }`, `pageFull(pageId)`, `paid(pageId)`.
- `stamp(id)`: returns false for an unknown or already-held id. Otherwise it records today's UTC day, saves, pays
  `XP.stamp`, remembers the stamp for the run's summary, then:
  - if its page is now full and not in `pages`: add it, save, pay `PAGE_COINS` and `XP.page`, and say
    `📕 Mars page full! +200 🪙`;
  - if every page is in `pages` and `done` is false: set it, save, pay `PASSPORT_COINS` and `XP.passport`, and say
    `📕 Passport complete! +2,000 🪙`.
- `sync()`: stamps what can be read from other saves and is not yet held:
  - `arrival` for each world id in `planetpop.visited`;
  - `chapter` for each chapter whose missions are all done.
- **First launch** (no saved key): `sync()`, and also:
  - `delivery` on `school` when `progress.best > 0` or any Flight school mission is done;
  - `delivery` on a world when any mission of its chapter is done;
  - each landmark named in a done mission's `tour`, `landmark` or `fetch`.

  Then queue one line and no others from the passport:
  `📕 Your passport already has 11 stamps and 1 full page. +200 🪙` (drop "and … full page(s)" and the coins when
  there are none; no line when there are no stamps). Rank lines that the XP causes appear as usual. The
  constructor always saves the key, so this happens once.
- `runEnded()`: `sync()`, then one line for the stamps earned since the last call:
  `📕 New stamps: Tycho, Copernicus, The Moon missions` (a landmark by name; the others as the page's name and
  "arrival", "delivery" or "missions"; after three names, `+2 more`). Nothing when there are none.
- `reset()` (Options → Reset): keeps `arrival` stamps and their dates, clears every other stamp, `pages` and `done`,
  and saves. Arrivals stay because `planetpop.visited` stays; they are not paid again.
- Hooks: `Achievements.visitWorld` calls `this.onVisit?.(id)` after saving; the passport sets it to `sync`.
  `CourierGame.finish` and `stop` call `passport.runEnded()` before `career.runEnded(run)`, so the stamps' XP and
  lines are on the same results card. `OptionsMenu.reset` calls `passport.reset()`.
- **Save codes:** add `planetpop.passport` to `SAVED_KEYS`. In `applySave`, a code with `planetpop.courier` and no
  `planetpop.passport` forgets the browser's passport, so it is rebuilt from the imported save (the same rule the
  career has).

**The fixture.** In a clean browser set, then build the app:

```
planetpop.courier  {"coins":900,"best":2400,"levels":{"engine":2},"owned":["classic"],"skin":"classic","daily":null,
                    "missions":["first","rush","airmail","express","wonders","flag"],"bests":{},"lesson":true,
                    "stars":{"first":3,"rush":2}}
planetpop.visited  ["earth","moon","mars"]
planetpop.career   {"xp":2000,"paid":[]}
```

Expected: **11 stamps** (three arrivals; deliveries on Flight school, Earth and the Moon; Mount Everest, The Sahara,
The Amazon and Tranquility Base; Earth's missions). Earth's page is full, 6 of 6. **XP 2,850** (2,000 + 11 × 50 +
300), **rank 5**, **coins 1,350** (900 + 200 for the page + 250 for rank 5). Two news lines: the passport's and
rank 5's. Every existing key is unchanged except `coins` in `planetpop.courier` and `xp` in `planetpop.career`.

**Tests:** table 7.1's counts for all 18 pages and the total of 97; the fixture's numbers; a second launch pays
nothing and queues nothing; a save code made after the first launch round-trips and pays nothing; a v0.21.0 save
code (no passport key) loaded over a browser with a fuller passport ends at the fixture's numbers; `reset()` keeps
the three arrivals, clears the rest and a later `sync()` pays nothing for them; the last stamp of the last page pays
the page and the passport once each; an unknown id is refused.

**Accept when:** the fixture gives exactly those numbers, and nothing pays twice.

### B4.3 Stamps in flight

- `Passport.watch(game)`, called once a frame from `CourierGame.update` while a run is active, next to
  `feats.update`:
  - when the run's `tally?.deliveries` is above zero: `stamp('<page>:delivery')`;
  - for each landmark of this planet not yet stamped: when `player.up.angleTo(landmark.d) < NEAR`, stamp it.
- Keep the list of landmarks still to stamp on the passport, rebuilt when the planet changes or a stamp lands. No
  arrays or vectors are created per frame.
- When a landmark is stamped in flight: `sfx.pop(player.pos.clone(), '📕 STAMPED!', '#8f5cff', 'ring')`, the
  `deliver` haptic, and one toast: `📕 Olympus Mons · The tallest volcano known: about 22 km high, two and a half Everests` (the
  name, then its note). Arrival, delivery and chapter stamps make no pop and no toast; they are in the run's summary line.
- It works in every run: courier, daily, missions, the lesson, free flight, free drive, road trips and the space
  courier's last stretch.

**Tests** (real flights on real planets, with the steering pilot from `tests/helpers/pilot.mjs`):

- on the Moon, flying from a town to Tycho stamps `moon:at:Tycho` once, pops once and toasts once; flying over it
  again does nothing;
- a delivery in a courier run on Mars stamps `mars:delivery`; one on the default planet stamps `school:delivery`;
- the daily for a fixed date, flown twice by the same scripted pilot with an empty and with a full passport, ends
  with the same score, deliveries and clock;
- the photo tour `wonders` stamps Earth's three landmarks and its results card has one stamps line;
- over a giant, passing the Great Red Spot's middle stamps it.

**Accept when:** a stamp lands the moment the pilot is over the landmark, and no run's result changes.

### B4.4 The passport screen

**New `js/game/screens/PassportScreen.js`** (an `Overlay`, id `passport`), opened from Home.

- **Contents:** title `📕 Passport`, the count `23 / 97`, and 18 buttons in page order, each with the page's icon and
  name and `3 / 8`. A paid page has the class `full` and a ✔.
- **A page:** `🔴 Mars · 5 / 8`; its stamps in a grid; a fact line; the reward line; the buttons.
  - An earned stamp shows its icon, label and date (`15 Nov 2026`), inked and slightly turned, like a rubber stamp.
    A stamp not yet earned shows its icon faint, its label and its hint.
  - Tapping a stamp puts its fact on the fact line: a landmark's note; for the others, the hint or
    `Stamped 15 Nov 2026`.
  - Reward line: `Fill the page: +200 🪙` or `✔ Page full: +200 🪙 paid`.
  - Buttons: `◀` and `▶` (the previous and next page, wrapping), `✈️ Fly there` (worlds only; B4.5),
    `🖼️ Share` (B4.6), `📕 All pages`, `✕ Home`.
- Methods, so tests can drive it without events: `show(pageId)`, `contents()`, `openPage(id)`, `turn(±1)`,
  `fact(stampId)`, `fly()`, `share()`, `close()`, `escape()`. `show()` calls `passport.sync()` first.
- Esc and controller B: from a page, back to the contents; from the contents, to Home. `✕ Home` always goes Home.
- It joins `Music`'s menu route and blocks `TourMode`, as the pilot card does. Controller B is added in `Gamepad.js`.
- **Home:** a fifth footer button, `#hoPassport`, between the hangar and the trophies: `📕 23 / 97`. Home must
  still fit without scrolling at 390 × 844, 360 × 780 and 844 × 390 with its fullest content: rank 30, a
  fifteen-letter name, the crate, a twelve-day streak and the gift all showing, a six-digit best, `Hangar · 26 to
  buy`, `📕 97 / 97` and `🏆 55 / 55`. The footer may take two rows on an upright phone.
- **Sizes:** on a page, every button is fully on screen at all five phone sizes and on a desktop; the stamps may
  scroll inside the panel and the buttons do not move when they do (the results card's pattern: `#gCopy` and
  `.results-actions`). The contents may scroll on a phone.
- Styles go in a new `css/passport.css`, linked after `hangar.css`, with its own phone rules.

**Tests:** the contents list 18 pages with the right counts for the fixture; Earth has the class `full`; Mars's page
has eight stamps in order, three earned after stamping two more; `turn` wraps both ways; `fact` shows a landmark's
note; `escape` goes page → contents → Home; Home's button reads `📕 11 / 97` for the fixture.

**Scenes** (new `tests/browser/scenes/passport.mjs`, after `hangar` in `screenshots.mjs`, each with its own setup):
`passport-contents`, `passport-page` (Mars, 5 of 8), `passport-full-page` (Earth); `mobile-passport-390`,
`mobile-passport-360`, `landscape-passport-844`, `landscape-passport-780`, `landscape-passport-667` (Pluto's page
with all eight stamps, checking every button is inside the screen); `mobile-passport-contents-360`. Re-shoot `home`,
`mobile-home`, `mobile-home-360` and `landscape-home`.

**Accept when:** a pilot can read what every missing stamp needs, and no button leaves the screen at any size.

### B4.5 Sightseeing flights

**New `js/game/runs/SightseeingRun.js`** (extends `FreeFlight`), chosen in `runs/modes.js` by `opts.sights`, checked
before `opts.free`.

- `PassportScreen.fly()` closes the passport and calls
  `game.flyOn({ world: id }, { free: true, sights: true }, '📕 Building Mars…')`.
- Briefing: `📕 Sightseeing`, goal `Fly over the landmarks to stamp your passport. No clock, no parcels.`
- The arrow and the pink beacon point at the nearest landmark of this world not yet stamped. When it is stamped
  they move to the next. When none is left: the arrow and beacon hide and the goal line reads
  `📕 Every landmark here is stamped`.
- Goal line while flying: `📕 Olympus Mons · 420 km`.
- No score, no coins, no Rex, no supplies. It takes off from the town nearest the first landmark. The Sightseer
  trophy's timer still counts.
- A world with no landmarks (Venus, Uranus) starts with the "every landmark" line; the arrival stamp still lands.
- "Fly again" repeats it. Its results card (a wreck) has the stamps line.

**Tests:** from the passport, `fly()` on Mars builds Mars and starts a `SightseeingRun`; the steering pilot,
following the arrow, stamps all five Mars landmarks and then the arrow hides; a courier run started afterwards has
its usual rules; `suppliesAllowed({ free: true, sights: true })` is false.

**Scenes:** `sightseeing` (Mars, the arrow and beacon on a landmark), `stamped` (the pop and the toast over it).

**Accept when:** the reference pilot fills every landmark of Mars and of the Moon from one take-off each. Report
both times.

### B4.6 A page as a picture

**New `js/game/PassportArt.js`** (functions only): `drawPage(g, W, H, model)` draws one page on a 2D context.

- `model`: `{ icon, name, have, of, full, stamps: [{ icon, label, date }], pilot, rank, rankName }`; `date` is null
  for a stamp not yet earned.
- The picture: cream paper, an ink border, `PLANET POP! PASSPORT` across the top, the world's icon and name, the
  stamps as round ink stamps in a grid (earned: icon, label and date, each turned a few degrees, the angle fixed by
  the stamp's place in the grid; not earned: a faint dashed circle and the label), `5 / 8`, a `PAGE FULL` seal when
  full, and along the bottom the pilot's name (when set) with `Rank 12 · Flight Leader` and `planet pop`.
- Use the game's font and ink colour as `PhotoMode.compose` does. No images are loaded.
- `PassportScreen.share()` draws a 1080 × 1350 canvas, turns it into a PNG and shows a preview inside the overlay:
  the picture, `💾 Save` (a download link named `planet-pop-passport-mars.png`), `📤 Share` (shown only when
  `navigator.canShare` accepts a file; it calls `navigator.share`), and `◀ Back`. Follow `PhotoMode.show` and
  `PhotoMode.share`.

**Tests:** with a recording context, `drawPage` writes the title, the world's name, every stamp's label, each earned
stamp's date and no date for the others; the same model draws the same calls twice; the file name follows the page.

**Scene:** `passport-share` (Earth's full page in the preview). Open the PNG and check nothing overlaps or is cut.

**Accept when:** the picture reads well at phone size, with eight stamps and with two.

### B4.7 Wrap-up

- Version 0.22.0 in `package.json`, `package-lock.json` (lines 3 and 9) and `js/core/Version.js`.
- `README.md`: the passport, sightseeing, sharing a page, and what a rank-up now says.
- `docs/EXTENDING.md`: "Add a passport stamp"; a landmark's name is its id, and adding a landmark adds a stamp and
  changes the total; `passport.css` in the styles list; `passport.mjs` in the scenes list.
- `docs/HANDOFF.md`: where things stand, the code map, the new key, the gotchas you found.
- `docs/DESIGN.md`: section 5.10 as built (the four kinds, the numbers), and the phase table.
- `npm run precache`. Run every check in section 9.

## 6. What stays exactly as it is

- Every run's score, clock, coins, route and random numbers. The daily.
- Every existing saved key's format. Trophies: still 55.
- Missions, worlds, landmarks, contracts, ranks, the shop and its prices.
- Explore mode, the system map and rocket trips.

## 7. Tables

### 7.1 Stamps on each page

| Page | Arrival | Delivery | Landmarks | Missions | Stamps |
|---|---:|---:|---:|---:|---:|
| Flight school | – | 1 | 0 | 1 | 2 |
| Earth | 1 | 1 | 3 | 1 | 6 |
| The Moon | 1 | 1 | 5 | 1 | 8 |
| Mars | 1 | 1 | 5 | 1 | 8 |
| Venus | 1 | 1 | 0 | 1 | 3 |
| Mercury | 1 | 1 | 5 | 1 | 8 |
| Jupiter | 1 | 1 | 1 | 1 | 4 |
| Io | 1 | 1 | 2 | 1 | 5 |
| Europa | 1 | 1 | 3 | 1 | 6 |
| Ganymede | 1 | 1 | 3 | 1 | 6 |
| Saturn | 1 | 1 | 1 | 1 | 4 |
| Titan | 1 | 1 | 4 | 1 | 7 |
| Enceladus | 1 | 1 | 1 | 1 | 4 |
| Uranus | 1 | 1 | 0 | 1 | 3 |
| Neptune | 1 | 1 | 1 | 1 | 4 |
| Triton | 1 | 1 | 2 | 1 | 5 |
| Pluto | 1 | 1 | 5 | 1 | 8 |
| Charon | 1 | 1 | 3 | 1 | 6 |
| **All** | **17** | **18** | **44** | **18** | **97** |

Build the pages from `CHAPTERS` and `WORLDS`; do not type this table into the code. A test checks the code against it.

### 7.2 Rewards

| What | Coins | XP | How many | Coins in all | XP in all |
|---|---:|---:|---:|---:|---:|
| A stamp | 0 | 50 | 97 | 0 | 4,850 |
| A full page | 200 | 300 | 18 | 3,600 | 5,400 |
| The full passport | 2,000 | 1,000 | 1 | 2,000 | 1,000 |
| **All** | | | | **5,600** | **11,250** |

## 8. Existing tests and scenes that change on purpose

- `tests/saves.test.mjs`: `SAVED_KEYS` gains `planetpop.passport`.
- `tests/home.test.mjs` and the Home scenes: five footer buttons.
- Any test that reads a results card's or Home's news exactly may gain a stamps line: a first delivery on a page
  stamps it. List each one in the PR with its old and new value.

Nothing else should need to change. If something does, say why in the PR.

## 9. Checks

Run and report each one:

1. `npm run lint`.
2. `npm test`.
3. `npm run screenshots` for every scene in `passport.mjs` and the re-shot Home scenes. Open each PNG. Run tests and
   screenshots separately.
4. **The fixture** in B4.2: its numbers, a second launch, a save code round trip, and a v0.21.0 save code made on
   `main` at `b150a6d` loaded on the branch.
5. **Sightseeing:** the reference pilot on Mars and on the Moon: landmarks stamped and the time each took.
6. **The daily is unchanged:** one fixed date, the same scripted pilot, with an empty and a full passport: score,
   deliveries and clock.
7. **A new pilot's first twenty minutes,** as in Phase B2: from an empty save, the lesson, First Flight, Rush Hour,
   then courier runs by the average pilot. Report rank, XP, coins and stamps. On `main` it ends at rank 5 or 6.

## 10. Out of scope

- New trophies, missions, worlds, landmarks or contracts. Stamps for towns.
- Anything online: accounts, boards, events (D). Ads and purchases (E). The mobile wrapper (C).
- Seeding the daily's rings and UFO from the route (D).
- The results card's button size at 667 × 375 (C's phone pass).

## 11. What to hand back

A pull request from `phase-b4-passport` into `main`, not merged, with this description:

```
## Phase B4: the passport

Compare: <link>

### Packages
- [ ] B4.0 … B4.7, each with its commit

### Checks
- lint, test (counts), screenshots (scenes run, PNGs opened)

### The fixture
<stamps, XP, rank, coins, lines; second launch; save codes>

### Sightseeing
<Mars and the Moon: landmarks stamped, time taken>

### The daily
<score, deliveries, clock: empty passport and full passport>

### A new pilot's first twenty minutes
<rank, XP, coins, stamps>

### Existing tests and scenes changed
<each one, old value → new value>

### Deviations from docs/PHASE_B4.md
### Questions and things found outside scope
```

Claude reviews it the same way as the earlier phases: lint, tests, the fixture, the flights flown again, the phone
sizes, then a verdict with file and line for anything to change.
