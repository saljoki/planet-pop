# Planet Pop — Phase B3: the hangar

Handoff spec for a builder agent. Claude reviews the result; Ata decides when it merges.

- **Repo:** https://github.com/Saljoki/planet-pop
- **Base:** `main` at `48ad274` (v0.19.0)
- **Branch:** `phase-b3-hangar`
- **Version:** do not bump it. Claude sets the version when the branches merge.
- **This file:** `docs/PHASE_B3.md`, already on the branch

**Another agent is building Phase B2 on `phase-b2-career` at the same time.** Section 3 lists the files that belong
to that branch. Do not touch them, and do not rebase onto or merge that branch.

---

## 1. Read first

1. `CLAUDE.md`, `docs/HANDOFF.md`, `docs/EXTENDING.md`. Their rules apply exactly as written.
2. `docs/DESIGN.md`, sections 5.6, 5.7 and 6, for why each thing here exists.
3. This file, start to finish, before writing code.

## 2. Why this phase exists

The shop holds 10,470 coins of things to buy: 18 upgrade levels and four paint jobs. By Claude's estimate, Phase B2
gives a pilot about 96,000 coins over twenty hours. Without more to buy, coins stop meaning anything after the second evening.

Phase B3 gives the hangar about 76,000 coins of things worth wanting: five more craft that each fly differently,
upgrade tracks that run to five levels, six more paint jobs, five trails, and supplies, which are the one thing that
can be bought again and again.

## 3. Ground rules

From the repo's docs, restated because they are the ones most often broken:

- Plain ES modules. No build step, no new dependencies, no network calls, no external URLs or asset files.
- **One class per file.** Data-only and function-only modules are fine.
- Saved state goes through `js/core/Store.js`. **Never change the format of an existing `planetpop.*` key.** This
  phase adds four optional fields to the existing `planetpop.courier` JSON: `craft`, `crafts`, `trail` and `trails`.
  Nothing else. Supplies are never saved: they are bought at take-off and used on that flight.
- **Every price a player has already paid stays as it is.** Existing upgrade levels and paint jobs keep their cost
  and their effect.
- After changing any served file: `npm run precache`.
- Work on the branch. Do not merge into `main`.

Specific to this phase:

- **Logic lives in methods, not inside event listeners.** The test DOM fires no events.
- **Cache elements in `this.dom`.** The test DOM returns a new element on every `querySelector`.
- **Phone first.** The briefing must keep its Start button visible without scrolling at 390 × 844, 360 × 780 and
  844 × 390 with the supplies row showing. The hangar may scroll; its section headers must stay readable.
- **Tone of text:** short, friendly, emoji-led, British spelling.

### Files Phase B2 is changing — do not edit

`js/game/Rival.js`, `js/game/runs/TaxiRun.js`, `RaceRun.js`, `MissionRun.js` and `DailyRun.js`,
`js/ui/Achievements.js`, `js/core/SaveCode.js`, `js/game/screens/HomeScreen.js`, `OptionsMenu.js`,
`MissionBoard.js`, `RoadBoard.js` and `ParcelBoard.js`, `js/game/HomeCards.js`, `js/space/SpaceCourier.js`,
`js/game/input/Gamepad.js`, `css/home.css`, `css/phone.css`, `tests/home.test.mjs`, `tests/saves.test.mjs`,
`tests/options.test.mjs`, `tests/browser/scenes/courier.mjs` and `phone.mjs`, `README.md`, `docs/HANDOFF.md`,
`docs/EXTENDING.md`, `docs/DESIGN.md`, and the version in `package.json`, `package-lock.json` and
`js/core/Version.js`. B2 also adds `js/game/Career.js`, `Ranks.js`, `Contracts.js` and `Economy.js`; do not create
files with those names.

### Files both branches change

`js/game/Progress.js`, `js/game/runs/DeliveryRun.js`, `js/game/CourierGame.js` and `precache.js`. Change only what
this spec names in them. Claude resolves the overlaps at merge.

So that the two branches stay apart:

- **Styles** go in a new `css/hangar.css`, linked in `index.html` after `home.css`. Put this phase's small-screen
  rules in that file too, in their own media queries.
- **Screenshot scenes** go in a new `tests/browser/scenes/hangar.mjs`, added to the list in
  `tests/browser/screenshots.mjs` after `courier`.
- **Docs:** write the README, HANDOFF and EXTENDING lines in the PR description. Claude applies them at merge.

### Known traps

- **Rank comes from Phase B2, which is not in this branch.** Read it only through `pilotRank(game)` in
  `js/game/Gates.js` (below). With no career it returns 30, so everything is open. Tests set
  `game.career = { rank: n }`.
- **`Vehicle.damage()` multiplies by `stats.armour`**, the share of a knock that gets through. Five levels of the
  old formula would reach zero. Section 7.1 gives the new table.
- **The daily flies the stock plane.** `DailyRun` uses `BASE_STATS`; it must also fly the Classic craft and take no
  supplies. You may not edit `DailyRun.js`: make the base class's hooks do the right thing for it (see B3.2).
- **"Fly again" repeats the run's options.** It must not repeat supplies for free.

## 4. Decisions already made

| # | Decision |
|---|---|
| 1 | Six craft. A craft is a set of stat multipliers and a silhouette. It flies as a plane, glider, hopper or ship to suit the world, as now. |
| 2 | Craft open by rank and are then bought with coins: Swift 4, Hummingbird 7, Mule 10, Bulldog 14, Comet 18. |
| 3 | Upgrades run to five levels on all six tracks. Old levels keep their price and effect. |
| 4 | Twelve paint jobs and six trails. Paint and trails have no rank gate. |
| 5 | Three supplies: shield, spare tank, head start. One of each per flight, in courier runs only. |
| 6 | Supply slots open by rank: one at rank 3, two at rank 8, three at rank 13. Below rank 3 the row is hidden. |
| 7 | Nothing here is sold for money, and nothing here works in the daily. |
| 8 | The passport moves to its own phase, B4. |

## 5. Work packages

Build in this order, one commit each, named `B3.n: …`. Lint and tests pass at every commit.

| Package | What |
|---|---|
| B3.0 | Housekeeping (already done) |
| B3.1 | Five upgrade levels |
| B3.2 | Six craft |
| B3.3 | Paint and trails |
| B3.4 | Supplies |
| B3.5 | The hangar screen |
| B3.6 | Wrap-up |

---

### B3.0 Housekeeping

Already done by Claude in the branch's first commit: this file is at `docs/PHASE_B3.md`. Nothing to do.

---

### B3.1 Five upgrade levels

**The player gets:** two more levels on most tracks, one more on the engine, three more on the ring magnet.

**`js/game/Progress.js`**

- `UPGRADES`: extend each `costs` array to five entries with the prices in section 7.1. Keep the first entries
  exactly as they are.
- `statsFor`: armour reads from a table, `[1, 0.8, 0.6, 0.4, 0.3, 0.2]`. Every other formula stays as it is.
- `desc` for armour becomes `Crashes and lightning do less damage`.

**Tests** — in `tests/progress.test.mjs`:

- Each track has five levels, and the first prices are unchanged (engine 150, 350, 700, 1,200; wings 120, 300, 600;
  tank 150, 400, 800; magnet 200, 500; clock 250, 600, 1,100; armour 200, 450, 900).
- All thirty levels cost 30,770 coins.
- Armour lets through 1, 0.8, 0.6, 0.4, 0.3 and 0.2 of a knock at levels 0 to 5, never zero.
- A v0.19.0 save with `{"engine":4,"armour":3}` keeps those levels and their stats.

**Accept when:** a pilot with every upgrade at level 5 can still be wrecked.

---

### B3.2 Six craft

**The player gets:** five more craft to earn, each better at one thing and worse at another.

**New files**

- `js/game/Gates.js` (function only): `export const pilotRank = (game) => game?.career?.rank ?? 30;`
- `js/game/Crafts.js` (data and functions):
  - `CRAFTS`: the six in section 7.2. Each: `{ id, icon, name, good, gives, rank, cost, mods, shape }`.
  - `craftStats(stats, craft)`: a copy of `stats` with the craft's `mods` applied. `speed` and `turn` multiply;
    `drain` multiplies; `armour` multiplies and never drops below 0.1; `hauler: true` is copied across.

**Changed files**

- `js/game/Progress.js`:
  - `craft` (the one being flown, default `'classic'`) and `crafts` (owned, always including `'classic'`), loaded
    from and saved to `planetpop.courier`. Missing means Classic only. `reset()` returns to Classic only.
  - `get craftDef()`.
  - `get stats()` returns `craftStats(statsFor(levels), craftDef)`. `BASE_STATS` stays the stock Classic.
  - `craftState(craft, rank)`: `'flying'`, `'owned'`, `'buy'` or `'locked'` (rank too low).
  - `chooseCraft(id, rank)`: flies it, buying it first if needed. Returns false when locked or unaffordable.
- `js/game/vehicles/Plane.js`:
  - The constructor takes a sixth argument, `shape` (default `{ span: 1, girth: 1 }`). `span` multiplies the wing
    span on top of the style's own. `girth` multiplies the body's radius. On a hopper or a ship only `girth`
    applies.
  - `setCargo()`: when `stats.hauler` is set, `cargoSpeed` and `cargoClimb` stay at 1.
- `js/game/runs/Run.js`: `vehicle()` passes `this.craft.shape`. Add `get craft()`: the Classic when `this.stats`
  is `BASE_STATS`, otherwise `progress.craftDef`. That is how the daily stays stock without editing `DailyRun.js`.
- Rex keeps the Classic's shape.

**Tuning, and what to report.** Fly the four pilots from `docs/DESIGN.md` section 6 in a courier run on the default
planet with no upgrades, ten runs each, in each of the six craft. Report run length, deliveries and score for all
24 cases.

- For the good pilot, no craft's mean score may be below 85% or above 125% of the Classic's.
- Each craft must be the best of the six in at least one line you can name: for example the Mule on runs of heavy
  parcels, the Bulldog for the beginner's run length. If one is never best, change its numbers and say so.
- With every upgrade at level 5 in the Swift, the ace's courier run must still end in under eight simulated minutes.

**Tests** — new `tests/crafts.test.mjs`:

- `craftStats` for each craft against stock stats; armour never below 0.1.
- The Mule carries a heavy parcel at full speed and climb; the Classic does not.
- A locked craft cannot be chosen; a craft at the right rank costs its price once and is then free to switch to.
- The daily flies the Classic's stats and shape whatever craft is selected.
- A v0.19.0 save loads flying the Classic with nothing else changed.
- `pilotRank` is 30 with no career and follows `game.career.rank` when there is one.

**Accept when**

- The 24-case table is in the PR and both limits hold.
- Each craft is recognisable from behind at a glance in its screenshot.

---

### B3.3 Paint and trails

**The player gets:** six more paint jobs, and five trails that change the puffs behind the craft.

**`js/game/Progress.js`**

- `SKINS`: add the six in section 7.3 after the existing six. Keep the existing six exactly as they are.
- `TRAILS`, exported: the six in section 7.3. Each: `{ id, name, color, life, grow, cost }`.
- `trail` (default `'classic'`) and `trails` (owned), saved like the craft. `get trailDef()`, `trailState(trail)`
  and `chooseTrail(id)`, working as their paint-job equivalents do.
- `affordable()` also counts craft the pilot's rank allows and trails. Give it the rank as a second argument.

**`js/game/vehicles/Plane.js`:** the constructor takes a seventh argument, `trail`. When given, its `color`, `life`
and `grow` replace the defaults passed to `Trails`. Hoppers and ships use it too. `Run.vehicle()` passes
`progress.trailDef`. Rex keeps the default.

**Tests** — in `tests/crafts.test.mjs`:

- Twelve paint jobs; the first six unchanged; all paid ones cost 5,100 coins.
- Six trails costing 3,900 coins; the Classic trail is free and always owned.
- Buying and switching a trail works like a paint job and survives a reload.
- `affordable(trophies, rank)` counts upgrades, paint, trails and craft, and leaves out craft above the rank.

**Accept when:** each trail is visibly different in its screenshot.

---

### B3.4 Supplies

**The player gets:** three one-flight extras to buy before a courier run.

**New file** `js/game/Supplies.js` (data and functions):

- `SUPPLIES`: the three in section 7.4. Each: `{ id, icon, name, desc, cost }`.
- `SLOT_RANKS = [3, 8, 13]` and `slotsFor(rank)`: 0 to 3.
- `suppliesAllowed(opts)`: true only for a plain courier run (`runClass(opts)` is `DeliveryRun` itself).

**Buying** (`js/game/screens/Briefing.js`)

- A row `#bSupplies` between the goal and "How to play", shown only when `suppliesAllowed(opts)` and the pilot has
  at least one slot. One toggle button per supply: `🛡️ Shield · 🪙 60`. A line under it:
  `1 of 2 slots · 🪙 60`, or `Not enough coins`.
- A supply that would exceed the slots or the wallet cannot be switched on.
- `Briefing.start()` pays for the chosen supplies with a new `Progress.spend(coins)` (false, and nothing taken, when
  the wallet is short) and starts the run with `opts.supplies = ['shield', …]`.
- The choice resets each time the briefing opens.
- With the briefing switched off in Options, runs start with no supplies.

**Using them**

- `js/game/CourierGame.js`: `again()` starts the run again without `supplies`.
- `js/game/runs/DeliveryRun.js`:
  - `takeoff()`: with `clock`, the clock starts 10 s higher, and `clockCap` is 10 s higher for the whole run.
  - `update()`: with `tank`, the first time the boost falls below 0.02 it is refilled to full, once, with a pop
    `⚡ SPARE TANK!`.
  - `knocked()` and `zapped()`: if the vehicle reports that its shield took this knock, skip every penalty and
    count: no time lost, combo kept, parcel unbroken, no `crashes` or `knocks` on the tally. Pop `🛡️ SHIELD!`.
- `js/game/vehicles/Vehicle.js`: a `shield` flag. `damage()` with the shield up takes no health, lowers the shield
  and sets `shielded` for the run to read and clear. `CourierGame.start()` raises it when the run has `shield`.
- The HUD's goal line is untouched. Show what is still unused as small icons next to the health bar.

**Tests** — new `tests/supplies.test.mjs`:

- `slotsFor` at ranks 1, 2, 3, 7, 8, 12, 13 and 30.
- `suppliesAllowed` is true for a courier run and false for the daily, a mission, the lesson, free flight, a road
  trip and the space courier.
- Starting with all three takes 150 coins once; "Fly again" takes nothing and gives nothing.
- A start the wallet cannot cover takes nothing and starts with no supplies.
- Head start: the clock starts at 100 s in the stock plane and can reach 109 s, never more.
- Spare tank: one refill, and only one.
- Shield: the first crash costs no health, no time and no combo, breaks no fragile parcel and is not on the tally;
  the second crash costs all of them. The same for lightning and ring ice.

**Accept when**

- No supply can reach the daily, a mission or the lesson by any route, including "Fly again" and a controller.
- The briefing's Start button is visible at the three phone sizes with the row showing.

---

### B3.5 The hangar screen

**The player gets:** one place for craft, upgrades, paint and trails that is still easy to read on a phone.

**`js/game/screens/Hangar.js`**

- Four sections, each a `<details>`, in this order: **Craft**, **Upgrades**, **Paint jobs**, **Trails**. Opening
  one closes the others. Craft is open when the hangar opens.
- Each header shows what is in it: `✈️ Craft · Swift`, `🔧 Upgrades · 7 / 30`, `🎨 Paint · 3 / 12`,
  `💨 Trails · 1 / 6`.
- **Craft:** one card each: icon, name, `Good at …`, `Gives up …`, and a button: `Flying`, `Fly`, `🪙 3,000`, or
  `🔒 Rank 4`.
- **Upgrades:** as now, with five pips.
- **Paint jobs** and **Trails:** grids, as paint is now. A trail's swatch shows its colour.
- The name field, the coins line, ✕ and ⚙️ stay where they are.
- Keep `buy(id)` and `pickSkin(id)`; add `pickCraft(id)` and `pickTrail(id)`. One delegated click listener.

**Tests:** the hangar's HTML for an empty save at rank 1 (five craft locked), at rank 30 with 50,000 coins (five to
buy), and after buying the Swift (flying it).

**Screenshot scenes** in `tests/browser/scenes/hangar.mjs`: `hangar-craft`, `hangar-upgrades`, `hangar-paint`,
`hangar-trails`, `briefing-supplies`, one flight scene for each of the five new craft, one for each of the five
new trails, `supply-shield` (the pop), and at 390 × 844: `mobile-hangar-craft` and `mobile-briefing-supplies`.

**Accept when**

- At 390 × 844 every craft card's button is reachable by scrolling the hangar, and no text is cut off.
- Closing the hangar still returns to Home.

---

### B3.6 Wrap-up

- `npm run precache`.
- In the PR description, the exact lines for `README.md`, `docs/HANDOFF.md` and `docs/EXTENDING.md` (how to add a
  craft, a trail and a supply). Do not edit those files.
- No version change.

## 6. What stays exactly as it is

- Every existing `planetpop.*` key and its format, and every price already in the shop.
- The six existing paint jobs, including the trophy one.
- The daily: stock stats, Classic craft, no supplies.
- Missions, the lesson, the road trips and the space courier: no supplies.
- Rex: his speed, shape and trail.

## 7. Tables

### 7.1 Upgrades

Existing prices are in plain type. New levels are bold.

| Track | Level 1 | 2 | 3 | 4 | 5 | Total |
|---|---|---|---|---|---|---|
| Engine | 150 | 350 | 700 | 1,200 | **2,000** | 4,400 |
| Wings | 120 | 300 | 600 | **1,100** | **1,900** | 4,020 |
| Boost tank | 150 | 400 | 800 | **1,400** | **2,200** | 4,950 |
| Ring magnet | 200 | 500 | **900** | **1,500** | **2,300** | 5,400 |
| Head start | 250 | 600 | 1,100 | **1,800** | **2,800** | 6,550 |
| Armour | 200 | 450 | 900 | **1,500** | **2,400** | 5,450 |

All thirty levels: 30,770 coins.

### 7.2 Craft

| id | Craft | Good at | Gives up | Rank | Coins | `mods` | `shape` |
|---|---|---|---|---|---|---|---|
| `classic` | ✈️ Classic | Everything, a little | Nothing | 1 | 0 | none | span 1, girth 1 |
| `swift` | ⚡ Swift | Speed | Armour | 4 | 3,000 | speed × 1.12, armour × 1.3 | span 0.8, girth 0.9 |
| `hummingbird` | 🐦 Hummingbird | Turning | Boost tank | 7 | 5,000 | turn × 1.35, drain × 1.3 | span 0.65, girth 0.85 |
| `mule` | 🐴 Mule | Heavy parcels don't slow it | Top speed | 10 | 7,000 | hauler, speed × 0.94 | span 1.15, girth 1.25 |
| `bulldog` | 🐶 Bulldog | Armour | Turning | 14 | 9,000 | armour × 0.6, turn × 0.85 | span 0.95, girth 1.4 |
| `comet` | ☄️ Comet | Boost lasts twice as long | Cruising speed | 18 | 12,000 | drain × 0.5, speed × 0.93 | span 0.9, girth 0.8 |

`armour` is the share of a knock that gets through, so a number above 1 means a weaker craft. The five to buy cost
36,000 coins. The `mods` are starting values: tune them with the pilots as B3.2 says.

### 7.3 Paint and trails

**New paint jobs**

| id | Name | Body | Trim | Coins |
|---|---|---|---|---|
| `sunset` | Sunset | `#ff8c42` | `#7a1e48` | 500 |
| `ocean` | Ocean | `#1f6fb2` | `#9fe8ff` | 500 |
| `bubblegum` | Bubblegum | `#ff8fcf` | `#ffffff` | 600 |
| `forest` | Forest | `#2f7d4f` | `#ffd23f` | 600 |
| `ink` | Ink | `#1b1530` | `#ffd23f` | 700 |
| `pearl` | Pearl | `#f4f0e6` | `#8f5cff` | 700 |

With the four already sold (1,500), paid paint comes to 5,100 coins.

**Trails**

| id | Name | Colour | Life (s) | Grow | Coins |
|---|---|---|---|---|---|
| `classic` | Classic | as now | as now | as now | 0 |
| `snow` | Snow | `#ffffff` | 2.4 | 2 | 500 |
| `candy` | Candy | `#ff8fcf` | 1.8 | 2 | 600 |
| `ember` | Ember | `#ff8c42` | 1.0 | 3 | 800 |
| `aurora` | Aurora | `#5dffc9` | 2.2 | 2 | 900 |
| `stardust` | Stardust | `#ffe066` | 3.0 | 1.2 | 1,100 |

The five to buy cost 3,900 coins.

### 7.4 Supplies

| id | Supply | What it does | Coins |
|---|---|---|---|
| `shield` | 🛡️ Shield | Takes the first knock for you | 60 |
| `tank` | ⚡ Spare tank | Refills your boost once, when it runs out | 40 |
| `clock` | ⏱️ Head start | 10 more seconds on the clock | 50 |

### 7.5 What the hangar now holds

| | Coins |
|---|---|
| Upgrades, thirty levels | 30,770 |
| Five craft | 36,000 |
| Paint | 5,100 |
| Trails | 3,900 |
| **Everything that is not a supply** | **75,770** |

## 8. Existing tests and scenes that change on purpose

| Where | Why |
|---|---|
| `tests/progress.test.mjs` | Five levels a track; armour's table; `affordable` takes a rank |
| Any test that asserts the hangar's HTML | Four sections |
| The `hangar` scene in `tests/browser/scenes/courier.mjs` | Leave it alone. It will show the new hangar; say so in the PR |

List every changed expectation in the PR, with the old and new value. Change no other existing test or scene.

## 9. Checks

Run and report each one:

1. `npm run lint`.
2. `npm test`.
3. `npm run screenshots` for every scene in `hangar.mjs`, plus `hangar`, `briefing` and `courier`. Open each PNG.
4. The 24-case craft table (B3.2).
5. **Old saves:** this v0.19.0 fixture loads with nothing changed, flying the Classic with the Classic trail, and a
   save code made on `main` at `48ad274` loads on the branch:
   `{"coins":900,"best":2400,"levels":{"engine":4,"armour":3},"owned":["classic","sky"],"skin":"sky","daily":null,"missions":["first","rush"],"bests":{},"lesson":true,"stars":{"first":3,"rush":2}}`
6. **The daily:** with the Comet, every upgrade at level 5 and 10,000 coins, the daily flies stock stats in the
   Classic and offers no supplies.

## 10. Out of scope

- Rank, experience, contracts, the streak, the gift, Rex and the coin retune (B2).
- The passport (B4).
- Anything sold for money (E).
- New worlds, missions or trophies.

## 11. What to hand back

A pull request from `phase-b3-hangar` into `main`, not merged, with this description:

```
## Phase B3: the hangar

Compare: <link>

### Packages
- [ ] B3.0 … B3.6, each with its commit

### Checks
- lint, test (counts), screenshots (scenes run, PNGs opened)

### Craft by pilot (B3.2)
<table: six craft × four pilots; what each craft is best at; anything you tuned>

### Old saves and the daily
<the fixture's result; the save-code check; the daily check>

### Existing tests and scenes changed
<each one, old value → new value>

### Lines for README.md, docs/HANDOFF.md and docs/EXTENDING.md
<exact text for Claude to apply at merge>

### Deviations from docs/PHASE_B3.md
### Questions and things found outside scope
```

Claude reviews it the same way as the earlier phases, then joins it with Phase B2: the shared files, the rank gates
on the pilot card, the docs and the version.
