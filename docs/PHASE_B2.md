# Planet Pop — Phase B2: rank, Rex and reasons to come back

Handoff spec for a builder agent. Claude reviews the result; Ata decides when it merges.

- **Repo:** https://github.com/Saljoki/planet-pop
- **Base:** `main` at `48ad274` (v0.19.0)
- **Branch:** `phase-b2-career`
- **Version:** 0.20.0, in the last package
- **This file:** `docs/PHASE_B2.md`, already on the branch

`docs/DESIGN.md` lists one phase B2. It is split in two, as B was. **B2 (this file)** is the pilot's career: coins
retuned, rank, trophies that pay, Rex's ladder, contracts, the streak and the gift. **B3 (`docs/PHASE_B3.md`)** is
the hangar: craft, more upgrade levels, paint, trails and supplies. The passport is B4.

**Another agent is building Phase B3 on `phase-b3-hangar` at the same time.** Section 3 lists the files that belong
to that branch. Do not touch them, and do not rebase onto or merge that branch.

---

## 1. Read first

1. `CLAUDE.md`, `docs/HANDOFF.md`, `docs/EXTENDING.md`. Their rules apply exactly as written.
2. `docs/DESIGN.md`, sections 4 to 6, for why each thing here exists.
3. This file, start to finish, before writing code.

## 2. Why this phase exists

After phases A and B1 a new player reaches the game, learns to fly and has 61 missions. Three things are still
missing:

1. **Coins come too fast.** An average pilot earns about 125 coins a minute, so the whole shop (10,470 coins) takes
   under two hours and a mission reward is worth less than one run.
2. **Nothing grows from flight to flight.** Coins are spent and gone. There is no number that only goes up.
3. **Nothing asks the player back tomorrow** except the daily route itself.

Phase B2 slows coin income to about 50 a minute, adds a pilot rank that everything feeds, makes trophies pay, has
Rex keep pace with the pilot, and gives each day three contracts, a streak and a gift.

## 3. Ground rules

From the repo's docs, restated because they are the ones most often broken:

- Plain ES modules. No build step, no new dependencies, no network calls, no external URLs or asset files.
- **One class per file.** Data-only and function-only modules are fine.
- Saved state goes through `js/core/Store.js`. **Never change the format of an existing `planetpop.*` key.** This
  phase adds one new key, `planetpop.career`, and adds it to `SAVED_KEYS` in `js/core/SaveCode.js`. Nothing else.
- After changing any served file: `npm run precache`.
- Work on the branch. Do not merge into `main`.

Specific to this phase:

- **Logic lives in methods, not inside event listeners.** The test DOM fires no events.
- **Cache elements in `this.dom`.** The test DOM returns a new element on every `querySelector`.
- **Phone first.** Every new or changed screen must fit 390 × 844, 360 × 780 and 844 × 390 without scrolling,
  checked with `getBoundingClientRect` in a screenshot scene, as Phase A's scenes do.
- **Days are UTC days**, from `todayKey()` in `js/game/Daily.js`, the same clock the daily uses.
- **Tone of text:** short, friendly, emoji-led, British spelling. 🎖️ is rank, 🪙 is coins, ⭐ stays stars and score.
- **Every coin payout that is a reward** (rank-up, trophy, contract, crate, streak, gift) goes through
  `progress.addCoins(n, false)` and gives no experience of its own. See B2.2.

### Files Phase B3 is changing — do not edit

`UPGRADES`, `SKINS`, `statsFor` and the shop methods in `js/game/Progress.js`; everything in `js/game/vehicles/`;
`js/game/runs/Run.js`; `js/game/screens/Hangar.js` and `Briefing.js`; `index.html`; `tests/progress.test.mjs`;
`tests/browser/screenshots.mjs`. B3 also adds `js/game/Crafts.js`, `Gates.js`, `Supplies.js`, `css/hangar.css` and
`tests/browser/scenes/hangar.mjs`; do not create files with those names.

### Files both branches change

`js/game/Progress.js`, `js/game/runs/DeliveryRun.js`, `js/game/CourierGame.js` and `precache.js`. Change only what
this spec names in them. Claude resolves the overlaps at merge.

### Known traps

- **`tests/helpers/pilot.mjs` is the scripted reference pilot from B1.** The new class is called `Career` so the two
  are never confused.
- **`makeApp()` in `tests/helpers/world.mjs` wraps `achievements.unlock`.** The wrapper calls the original, so a hook
  inside `unlock` still fires.
- **Trophies and rank-ups now change the wallet.** Existing tests that compare `progress.coins` with a run's coins
  can start failing for that reason. Fix the expectation, never the payout, and list each one in the PR.
- **`CourierGame.finish()` is the one place every results card passes through.** Use it; do not edit each run.

## 4. Decisions already made

| # | Decision |
|---|---|
| 1 | Coins from points are points ÷ 25 (was ÷ 10). Mission rewards, space parcels and fuel stars do not change. |
| 2 | One experience number, shown as XP. Every coin earned by playing is 1 XP. Stars, trophies, contracts and streak days add fixed XP. |
| 3 | 30 ranks. Going from rank n to n + 1 costs 300 + 200 × (n − 1) XP. Rank 30 needs 89,900 XP in all. |
| 4 | A rank-up pays 50 × the new rank in coins. |
| 5 | A trophy pays 100 coins and 200 XP. Trophies already won pay once, on first launch. |
| 6 | Rex's speed follows the pilot's rank in courier runs only. In missions and the daily he flies as he does today. |
| 7 | Contracts are the same for everyone on a given day, drawn from the date. Their size follows the pilot's rank. |
| 8 | The streak counts days on which the daily was flown. One missed day in any seven is forgiven. |
| 9 | The gift and the crate are opened with a tap, never automatically. Phase E hangs a rewarded ad on that tap. |
| 10 | Existing players keep every coin. Their starting XP is 100 a star plus 200 a trophy. |

## 5. Work packages

Build in this order, one commit each, named `B2.n: …`. Lint and tests pass at every commit.

| Package | What |
|---|---|
| B2.0 | Housekeeping (already done) |
| B2.1 | Coins retuned |
| B2.2 | The career: experience and rank |
| B2.3 | Trophies pay |
| B2.4 | Rex's ladder |
| B2.5 | Contracts and the crate |
| B2.6 | The streak and the gift |
| B2.7 | Boards go back to Home |
| B2.8 | Wrap-up |

---

### B2.0 Housekeeping

Already done by Claude in the branch's first commit: this file is at `docs/PHASE_B2.md`, and the phases table in
`docs/DESIGN.md` has the B2, B3 and B4 rows. Nothing to do.

---

### B2.1 Coins retuned

**The player gets:** a mission reward that is worth more than a run again.

**New file** `js/game/Economy.js` (data and functions):

```js
export const COIN_RATE = 25;                                   // points for one coin, in every scored run
export const coinsFor = (points) => Math.round(points / COIN_RATE);
export const RING_COINS = 2, UFO_COINS = 12;
export const RACE_COINS = { win: 60, lose: 12 };
```

**Changed files**

- `js/game/runs/DeliveryRun.js`: deliveries pay `coinsFor(pts)`; rings and the UFO use the constants above. Remove
  the local `RING_COINS` and `UFO_COINS`.
- `js/game/runs/MissionRun.js` line 208 and `js/game/runs/TaxiRun.js` line 87: `coinsFor(…)`.
- `js/game/runs/RaceRun.js`: `WIN_COINS` and `LOSE_COINS` become `RACE_COINS.win` and `.lose`. The briefing line
  that quotes them follows.
- Space parcels (`js/space/SpaceCourier.js`), fuel stars (`js/space/Trip.js`) and mission rewards do not change.

**Tests** — new `tests/economy.test.mjs`:

- `coinsFor(250)` is 10, `coinsFor(0)` is 0, `coinsFor(12)` is 0.
- A delivery worth 400 points pays 16 coins; a ring pays 2; the UFO pays 12.
- A taxi fare and a won race pay by the new figures.
- A mission's first completion still pays its full `reward`.

**Report in the PR:** coins a minute in a courier run for the four pilots in `docs/DESIGN.md` section 6, mean of ten
runs. The average pilot should land between 45 and 65.

**Accept when**

- No file outside `Economy.js` contains a points-to-coins number.
- The average pilot earns 45 to 65 coins a minute.

---

### B2.2 The career: experience and rank

**The player gets:** a rank that every flight moves, a bar on Home that shows how close the next one is, and coins
each time it goes up.

**New files**

- `js/game/Ranks.js` (data and functions):
  - `RANKS`: the 30 names in section 7.1, in order.
  - `MAX_RANK = 30`.
  - `xpForRank(r)`: total XP needed to hold rank `r`: `300 × (r − 1) + 100 × (r − 1) × (r − 2)`.
  - `rankFor(xp)`: 1 to 30.
  - `rankReward(r)`: `50 × r` coins.
  - `XP = { star: 100, trophy: 200, contract: 150, crate: 300, streak: 100, streakWeek: 300 }`.
  - `TROPHY_COINS = 100`.

- `js/game/Career.js`: `class Career`. One per game, made in `CourierGame`'s constructor straight after `Progress`:
  `this.career = new Career(app, this.progress)`.
  - Saved under `planetpop.career` as one JSON object. Every field is optional when loading:

    ```json
    { "xp": 0, "paid": [], "rex": { "you": 0, "rex": 0 },
      "day": { "date": "2026-11-14", "tier": 0, "ids": [], "counts": {}, "done": [], "crate": false },
      "streak": { "days": 0, "last": null, "forgiven": null }, "gift": null }
    ```

  - `get xp()`, `get rank()`, `get rankName()`.
  - `get toNext()`: `{ have, need }` inside the current rank, or `null` at rank 30.
  - `addXp(n)`: adds, and for each rank passed pays `rankReward` with `progress.addCoins(coins, false)` and queues a
    news line. Saves. Returns the number of ranks gained.
  - `news()`: returns the queued lines and empties the queue.
  - `mark()`: remembers the XP at this moment. `CourierGame.start()` calls it.
  - `runEnded(run)`: once per run (guard with a flag on the run). Queues `🎖️ +85 XP` when the XP has grown since
    `mark()`. Later packages add to this method.
  - `reset()`: forgets the key and starts again as a new pilot.

**Changed files**

- `js/game/Progress.js` (only these four methods):
  - `addCoins(n, earned = true)`: when `earned`, also calls `this.onEarn?.(n)`.
  - `completeMission(def)`: after adding the reward, calls `this.onEarn?.(def.reward)`.
  - `recordStars(id, n)`: on an improvement, calls `this.onStars?.(n − before)`.
  - `finishLesson()`: the 50 coins count as earned: call `this.onEarn?.(LESSON_COINS)` the first time.
- `Career` sets `progress.onEarn = (n) => this.addXp(n)` and `progress.onStars = (n) => this.addXp(n × XP.star)`.
- `js/core/SaveCode.js`: add `'planetpop.career'` to `SAVED_KEYS`.
- `js/game/CourierGame.js`:
  - `start()`: `this.career.mark()`.
  - `finish(card, sound)`: call `this.career.runEnded(this.run)`, then append `this.career.news()` to `card.html`,
    one line each, before showing the card.
  - `stop()`: call `this.career.runEnded(this.run)` before the run is discarded, so an abandoned run still counts.
    Its news stays queued for Home.
- `js/game/screens/OptionsMenu.js`: resetting progress also calls `game.career.reset()`.
- `js/game/screens/HomeScreen.js` and `css/home.css`, `css/phone.css`:
  - `#hoName` is replaced by `#hoPilot`, a full-width button: `🎖️ 4 · Senior Courier · Ata` (or without the name),
    with a thin bar `#hoXp` showing progress to the next rank. It opens the pilot card.
  - Home toasts any queued news when it opens.
  - `HomeCards.cardStat('missions')` becomes `⭐ 12 / 183`.
- New `js/game/screens/PilotCard.js`: `class PilotCard extends Overlay`, id `pilot`.
  - `#pcRank` (`🎖️ Rank 4 · Senior Courier`), `#pcBar` and `#pcXp` (`320 / 900 XP to rank 5`), `#pcNext` (the next
    three ranks and what each pays), `#pcRex` (filled in B2.4), `#pcName` (the name button that used to be on Home:
    it opens Options), `#pcClose`. Closing returns to Home.
- `js/game/input/Gamepad.js`: with the pilot card open, B closes it.

**Existing players.** When there is no `planetpop.career` key but the pilot has stars or trophies:

- XP starts at `100 × progress.totalStars`.
- B2.3 then pays the trophies already won.
- Rank-ups reached this way pay as usual. Queue one news line for the lot, not one a rank:
  `🎖️ Welcome back: rank 9, Senior Pilot. +5,200 🪙 for what you had already earned.`

**Tests** — new `tests/career.test.mjs`:

- `xpForRank` gives 0, 300, 800, 1,500 and 2,400 for ranks 1 to 5, and 89,900 for rank 30. `rankFor` agrees at each
  boundary and one XP either side.
- 300 XP from a fresh save: rank 2, 100 coins paid, one news line, and the payout itself adds no XP.
- A single `addXp` that crosses three ranks pays all three.
- Coins earned in a courier run add the same XP; `addCoins(n, false)` adds none.
- A first mission completion adds its reward in XP; a new star adds 100; a replay with no new star adds none of
  either.
- `planetpop.career` travels in a save code and survives a reload.
- **This v0.19.0 fixture** loads with every existing key unchanged, and starts at 700 XP before trophies:
  `planetpop.courier` =
  `{"coins":900,"best":2400,"levels":{"engine":2},"owned":["classic"],"skin":"classic","daily":null,"missions":["first","rush","flag","storm"],"bests":{},"lesson":true,"stars":{"first":3,"rush":2}}`
- Reset in Options returns the career to rank 1 with 0 XP.

**Screenshot scenes:** re-shoot `home`, `mobile-home`, `landscape-home`; add `pilot-card` (desktop) and
`mobile-pilot-card`; add `rank-up` (a results card carrying a rank-up line and an XP line).

**Accept when**

- At 390 × 844 and 360 × 780, Home still shows the next-up button and all six cards without scrolling.
- A results card with three news lines fits 390 × 844 with every button visible.
- A v0.19.0 save loses nothing.

---

### B2.3 Trophies pay

**The player gets:** 100 coins and 200 XP for every trophy, including the ones already won.

- `js/ui/Achievements.js`: inside `unlock(id)`, after saving a newly won trophy, call `this.onUnlock?.(id)`.
- `Career` sets `app.achievements.onUnlock = (id) => this.trophy(id)`.
- `Career.trophy(id)`: if `id` is not in `paid`, add it, pay `TROPHY_COINS` with `addCoins(n, false)` and add
  `XP.trophy`.
- The trophy toast gains ` · +100 🪙`.
- **Back pay:** on construction, pay every trophy in `achievements.done` that is not in `paid`. For an existing
  player this is part of the one welcome-back line in B2.2.

**Tests** — in `tests/career.test.mjs`:

- A new trophy pays 100 coins and 200 XP once; unlocking it again pays nothing.
- The B2.2 fixture with `planetpop.trophies` = `["courier","combo","mechanic"]` ends at 1,300 XP, rank 3 and 1,450
  coins (900 + 300 for trophies + 100 + 150 for ranks 2 and 3), with exactly one news line.
- A second construction pays nothing more.

**Accept when:** no trophy can pay twice, across reloads, save codes and resets.

---

### B2.4 Rex's ladder

**The player gets:** a rival who is always close, who learns to boost, who changes his paint as the pilot climbs,
and a running score against him.

**`js/game/Rival.js`**

- `REX_LIVERIES`, exported, lowest rank first:

  | From rank | Name | Body | Trim |
  |---|---|---|---|
  | 1 | Purple Menace | `#8f5cff` | `#1b1530` |
  | 5 | Night Shift | `#2b2d6e` | `#ffd23f` |
  | 10 | Red Alert | `#e63946` | `#1b1530` |
  | 15 | Toxic | `#7ddc1f` | `#1b1530` |
  | 20 | Chrome | `#cfd8e3` | `#3a4a5f` |
  | 25 | Gold Rex | `#ffc93c` | `#7a4a00` |

- `liveryFor(rank)`: the highest row at or below `rank`.
- The constructor takes `rank` (default 1) and paints the plane with `liveryFor(rank)`.
- Speed: `0.8 + 0.03 × min(level, 10) + REX.rankStep × (rank − 1)`, with `REX.rankStep = 0.004`.
- Boost, from `REX.boostRank = 10`: while Rex is carrying the parcel, is not resting and is within
  `REX.boostRange = 0.35` rad of the destination, his speed is multiplied by `REX.boost = 1.15`.
- Keep `REX` as one exported object so the numbers can be tuned in one place.

**Which rank Rex flies at**

- `DeliveryRun` gains `get rexRank() { return this.game.career.rank; }` and passes it to the `Rival`.
- `DailyRun` and `MissionRun` override it to return 1 for speed and boost. The daily must be the same for everyone,
  and missions have par times.
- Rex wears the livery for the pilot's real rank in every mode, since paint changes nothing.
- The road race and the space courier do not change.

**The running score**

- In `DeliveryRun.deliver()`, when Rex is flying and the parcel was not broken: `career.rexScore(1, 0)`.
- In `DeliveryRun.steal()`: `career.rexScore(0, 1)`.
- `HomeCards.cardStat('courier')` appends ` · You 34 · Rex 12` once either number is above zero.
- `PilotCard` `#pcRex` shows the same score, his current livery's name and the rank of his next one.
- A rank-up that changes his livery queues `😈 Rex has new paint: Night Shift.` At rank 10: `😈 Rex has learned to boost.`

**Tuning, and what to report.** Fly the four pilots from `docs/DESIGN.md` section 6 in a courier run on the default
planet in the stock plane, ten runs each, with the career's rank forced to 1, 10, 20 and 30. Report run length,
deliveries and parcels stolen for all sixteen cases.

- Rank 1 must match v0.19.0: the formula is unchanged there.
- At rank 30 the good pilot loses at most 35% of parcels to Rex and the ace at most 15%.
- If either limit is broken, lower `REX.rankStep` first, then `REX.boost`, until it holds. Say what you changed.

**Tests** — new `tests/rex.test.mjs`:

- `liveryFor` at ranks 1, 4, 5, 24, 25 and 30.
- Speed at level 0 is 0.8 at rank 1 and 0.916 at rank 30; the level term is unchanged.
- Rex boosts only from rank 10, only while loaded, only inside the range, and never while resting.
- A mission and the daily fly Rex at rank 1 speed whatever the pilot's rank, in the pilot's-rank livery.
- A delivery with Rex flying adds one to "you"; a steal adds one to "rex"; a broken parcel adds neither; a run
  before Rex takes off adds neither.

**Screenshot scene:** re-shoot `rival` at rank 12 (Red Alert).

**Accept when**

- Rex is unchanged for a rank 1 pilot.
- The sixteen-case table is in the PR and both limits hold.

---

### B2.5 Contracts and the crate

**The player gets:** three small jobs each day, a reward for each, and a crate for doing all three.

**New file** `js/game/Contracts.js` (data and functions):

- `CONTRACTS`: the pool in section 7.2. Each: `{ id, group, text, stat, need: [tier0, tier1, tier2], coins, best? }`.
  `best: true` means the day keeps the highest value from any one run; otherwise values add up.
- `tierFor(rank)`: 0 for ranks 1 to 9, 1 for 10 to 19, 2 for 20 to 30.
- `pickContracts(date, tier, { stars })`: three ids, one from each group, chosen with
  `mulberry32(dailySeed(date) ^ 0xC0FFEE)`. Skip `route` at tier 0. Skip `star` when `stars` is 183.
- `runCounts(run)`: what a finished run adds, as `{ stat: number }`. Section 7.2 says where each number comes from.

**`js/game/Career.js`**

- `today()`: if `day.date` is not `todayKey()`, start a new day: pick the three contracts at the pilot's current
  tier and store their ids and the tier. Returns the day.
- `get contracts()`: `[{ id, text, have, need, coins, done }]` for today, with `{n}` filled in.
- `runEnded(run)` adds `runCounts(run)` to today's counts (adding, or keeping the best), then pays every contract
  that has just been met: coins with `addCoins(n, false)`, `XP.contract`, and a news line
  `📋 Deliver 8 parcels: done! +40 🪙`. When the third is met, also queue
  `🎁 All three done: your crate is waiting on Home.`
- `count(stat, n)`: the same, for things that happen outside a run. `Progress.onStars` calls `count('star', n)`,
  and `SpaceCourier.deliver()` calls `count('space', 1)` for an unbroken parcel.
- `get crateReady()` and `openCrate()`: once a day, when all three are done. Pays 100, 150 or 250 coins (chosen by
  the same seeded generator, so it is the same for everyone that day) and `XP.crate`. Returns the coins.

**New screen** `js/game/screens/TodayScreen.js`: `class TodayScreen extends Overlay`, id `today`.

- `#tdContracts`: three rows, each with its text, `3 / 8` and its coins, ticked when done.
- `#tdCrate`: `🎁 Open your crate`, shown only when ready; after opening, `🎁 Crate opened: +150 🪙`.
- `#tdStreak` and `#tdGift` are filled in B2.6.
- `#tdClose`. Closing returns to Home.

**Home:** a new strip `#hoToday` between the next-up button and the cards: `📋 1 / 3` and, when a crate is waiting,
` · 🎁 Crate!`. It opens the Today screen. On a phone on its side it may sit in the footer row.

**Controller:** with Today open, B closes it.

**Tests** — new `tests/contracts.test.mjs`:

- `pickContracts` returns three different ids, one from each group; the same date and tier always give the same
  three; thirty consecutive dates never repeat a full set two days running.
- `route` never appears at tier 0; `star` never appears at 183 stars.
- `runCounts` for a courier run, a daily, a won mission, a taxi shift and a won race, each built from a real run in
  the test world.
- Adding stats add across two runs; `best` stats keep the higher run.
- Meeting a contract pays once, even if later runs keep adding to it.
- The crate cannot open before all three are done, opens once, and is gone after a reload.
- A new UTC day replaces the three contracts and clears the counts.
- An abandoned run still counts.

**Screenshot scenes:** `today` (desktop, one contract done), `mobile-today`, and re-shoot the Home scenes with the
strip.

**Accept when**

- Every contract in the pool can be completed by the reference pilot or a short scripted flight at tier 2. Report
  which pilot or script was used for each.
- Home still fits the three phone sizes with the strip in place.

---

### B2.6 The streak and the gift

**The player gets:** a little more each day they fly the daily, a bigger reward on the seventh day, one forgiven
miss a week, and a small gift on the first visit of each day.

**The streak** (`Career`, called from `runEnded` for a `DailyRun` in which at least one parcel was delivered, using
the run's own `date`):

- Already counted today: nothing.
- `last` was yesterday: `days + 1`.
- `last` was two days ago, and `forgiven` is empty or at least seven days before today: `days + 1`, and `forgiven`
  becomes today.
- Otherwise `days` becomes 1.
- Pay by place in the week, `((days − 1) mod 7) + 1`: 20, 25, 30, 35, 40, 50, 150 coins, with `addCoins(n, false)`.
  XP is `XP.streak`, or `XP.streakWeek` on the seventh day.
- News: `🔥 Day 3 in a row: +30 🪙`, or `🔥 Day 4 in a row (one missed day forgiven): +35 🪙`.
- `get streakDays()` returns 0 when the streak is already lost (more than the forgiven gap has passed), without
  changing what is saved.

**The gift** (`Career`):

- `get giftReady()`: `gift` is not `todayKey()`.
- `openGift()`: pays 20, 30, 40 or 60 coins, chosen by `mulberry32(dailySeed(date) ^ 0x61F7)`, with
  `addCoins(n, false)`. Sets `gift` to today. Returns the coins. No XP.

**Today screen**

- `#tdGift`: `🎁 Open today's gift`, then `🎁 Today's gift: +40 🪙`.
- `#tdStreak`: seven dots for the week, the ones flown filled in, and `🔥 3 days · fly today's daily for +35 🪙`,
  or `✔ flown today`.

**Home:** the `#hoToday` strip adds ` · 🔥 3` while a streak is alive and ` · 🎁 Gift!` while the gift is unopened.

**Tests** — new `tests/streak.test.mjs`, with the date supplied by the test:

- Seven consecutive days pay 20, 25, 30, 35, 40, 50 and 150, and day eight pays 20 again with `days` at 8.
- Two dailies on one day count once.
- One missed day is forgiven; a second miss within seven days resets to 1; a miss eight days after a forgiven one
  is forgiven again.
- A daily with no parcel delivered does not count.
- The gift opens once a day, pays one of the four amounts, the same amount for the same date, and adds no XP.

**Accept when:** nothing in this package can be earned twice in one UTC day by reloading, by a save code, or by
changing nothing but the time of day.

---

### B2.7 Boards go back to Home

**The player gets:** ✕ on Missions, Road trips and the Space courier board returns to Home when that is where they
came from.

- `MissionBoard.show(onClose)`, `RoadBoard.show(onClose)` and `SpaceCourier.openBoard(onClose)` remember the
  callback. ✕, Esc and controller B call `close()`: hide, then the callback. Choosing something to fly hides
  without calling it.
- `HomeScreen.pick()` passes `() => game.openHome()`. So does the results card's Missions button. Every other
  opener passes nothing and behaves as today. `Briefing.js` belongs to B3, so `Briefing.back()` stays as it is;
  Claude adds the callback there at merge.

**Tests:** from Home, each of the three boards closes back to Home by ✕ and by controller B; the space board opened
from the system map closes to the map as before.

---

### B2.8 Wrap-up

- Version 0.20.0 in `package.json`, `package-lock.json` (lines 3 and 9) and `js/core/Version.js`.
- `npm run precache`.
- `README.md`: coins, rank, trophies that pay, Rex's ladder, contracts, the streak and the gift; the new files in
  the structure list; the new test files.
- `docs/EXTENDING.md`: how to add a contract, a rank reward and a Rex livery.
- `docs/HANDOFF.md`: "Where things stand", the version, `Career` in the code map, and any new gotchas.
- `docs/DESIGN.md`: correct anything this phase proved wrong, with the measured figures.

## 6. What stays exactly as it is

- Every existing `planetpop.*` key and its format.
- Mission rewards, par times, stars, chapters and gates.
- The courier clock and the ten-parcel daily, including its score.
- The shop: every price, upgrade and paint job.
- Explore, friends rooms, the space courier's pay and the road trips' rules.

## 7. Tables

### 7.1 Ranks

| Rank | Name | Total XP | Pays | Also |
|---|---|---|---|---|
| 1 | Cadet | 0 | | |
| 2 | Trainee | 300 | 100 | |
| 3 | Courier | 800 | 150 | |
| 4 | Senior Courier | 1,500 | 200 | |
| 5 | Navigator | 2,400 | 250 | Rex: Night Shift |
| 6 | Wingman | 3,500 | 300 | |
| 7 | Flight Officer | 4,800 | 350 | |
| 8 | Pilot | 6,300 | 400 | |
| 9 | Senior Pilot | 8,000 | 450 | |
| 10 | Captain | 9,900 | 500 | Rex: Red Alert, and he boosts |
| 11 | Senior Captain | 12,000 | 550 | |
| 12 | Flight Leader | 14,300 | 600 | |
| 13 | Squadron Leader | 16,800 | 650 | |
| 14 | Wing Commander | 19,500 | 700 | |
| 15 | Ace | 22,400 | 750 | Rex: Toxic |
| 16 | Double Ace | 25,500 | 800 | |
| 17 | Triple Ace | 28,800 | 850 | |
| 18 | Stormrider | 32,300 | 900 | |
| 19 | Ringrunner | 36,000 | 950 | |
| 20 | Commodore | 39,900 | 1,000 | Rex: Chrome |
| 21 | Star Courier | 44,000 | 1,050 | |
| 22 | Moon Courier | 48,300 | 1,100 | |
| 23 | Planet Hopper | 52,800 | 1,150 | |
| 24 | Voyager | 57,500 | 1,200 | |
| 25 | Pathfinder | 62,400 | 1,250 | Rex: Gold Rex |
| 26 | Trailblazer | 67,500 | 1,300 | |
| 27 | Legend | 72,800 | 1,350 | |
| 28 | Air Marshal | 78,300 | 1,400 | |
| 29 | Star Marshal | 84,000 | 1,450 | |
| 30 | Sky Marshal | 89,900 | 1,500 | |

Rank-ups pay 23,200 coins in all. B3 adds what each rank opens in the hangar.

### 7.2 Contracts

`{n}` is the number for the pilot's tier. Stats add up over the day unless marked "best".

**Group A: flying**

| id | Text | Stat | Tier 0 / 1 / 2 | Coins | Counts |
|---|---|---|---|---|---|
| `parcels` | 📦 Deliver {n} parcels | deliveries | 8 / 12 / 16 | 40 | `tally.deliveries`, any plane or van run |
| `urgent` | ⚡ Deliver {n} urgent parcels | urgent | 2 / 3 / 4 | 50 | `tally.urgent` |
| `fragile` | 🥚 Deliver {n} fragile parcels in one piece | fragile | 2 / 3 / 4 | 50 | `tally.fragile` |
| `heavy` | 🏋️ Deliver {n} heavy parcels | heavy | 2 / 3 / 4 | 50 | `tally.heavy` |
| `rings` | 💍 Fly through {n} blue rings | rings | 10 / 15 / 20 | 40 | `tally.rings` |
| `coins` | 🪙 Earn {n} coins flying or driving | coins | 100 / 150 / 200 | 40 | the run's `coins` |

**Group B: skill**

| id | Text | Stat | Tier 0 / 1 / 2 | Coins | Counts |
|---|---|---|---|---|---|
| `combo` | 🔥 Reach a x{n} combo | combo (best) | 3 / 4 / 5 | 50 | `tally.combo` |
| `rexrow` | 😈 Beat Rex to {n} parcels in a row | rexrow (best) | 2 / 3 / 4 | 60 | `tally.rexStreak` |
| `score` | ⭐ Score {n} in one courier run | score (best) | 1,500 / 2,500 / 4,000 | 60 | `score`, plain courier runs only |
| `night` | 🌙 Deliver {n} parcels to towns in the dark | night | 2 / 3 / 4 | 50 | `tally.night` |
| `refuel` | ⛽ Skim a runway {n} times | refuels | 1 / 2 / 3 | 40 | `tally.refuels` |

**Group C: variety**

| id | Text | Stat | Tier 0 / 1 / 2 | Coins | Counts |
|---|---|---|---|---|---|
| `daily` | 📅 Fly today's daily | daily | 1 / 1 / 1 | 40 | a daily ends with at least one parcel delivered |
| `route` | 🏁 Finish all ten parcels in the daily | route | – / 1 / 1 | 70 | a daily ends with `parcels` at 10 |
| `mission` | 🎯 Complete {n} mission (a replay counts) | mission | 1 / 1 / 2 | 50 | a mission ends won |
| `star` | ⭐ Earn {n} new star | star | 1 / 1 / 2 | 70 | `Progress.onStars` |
| `taxi` | 🚕 Drive {n} taxi fares | taxi | 3 / 4 / 5 | 50 | `TaxiRun.fares` |
| `race` | 🏁 Beat Rex in the road race | race | 1 / 1 / 1 | 60 | a race ends won |
| `space` | 🚀 Deliver a parcel to another world | space | 1 / 1 / 1 | 70 | `SpaceCourier.deliver()`, unbroken |

Write "missions" and "stars" when `{n}` is 2.

## 8. Existing tests and scenes that change on purpose

| Where | Why |
|---|---|
| Any test that turns points into coins | Points ÷ 25, rings 2, UFO 12, race 60 and 12 |
| Any test that compares the wallet with a run's coins | Trophies and rank-ups now pay into it |
| `tests/home.test.mjs` | `#hoPilot` replaces `#hoName`; the missions card shows stars; the courier card shows the Rex score |
| `tests/saves.test.mjs` | `SAVED_KEYS` has one more key |
| The controller test in `tests/options.test.mjs` | B on a board opened from Home returns to Home |
| Scenes `home`, `mobile-home`, `landscape-home`, `rival` | New Home rows; Rex's livery |

List every changed expectation in the PR, with the old and new value. Change no other existing test or scene.

## 9. Checks

Run and report each one:

1. `npm run lint`.
2. `npm test`.
3. `npm run screenshots` for the scenes this phase adds or changes, and every scene in `courier.mjs` and
   `phone.mjs`. Open each PNG.
4. The coins-a-minute table (B2.1) and the sixteen-case Rex table (B2.4).
5. **A new pilot's first twenty minutes.** From an empty save, with the reference pilot: the lesson, First Flight,
   Rush Hour, then three courier runs flown by the average pilot. Report the rank, XP, coins and trophies at the
   end. The target is rank 4 or 5.
6. **Old saves:** the fixture in B2.2 and B2.3, and a save code made on `main` at `48ad274` loaded on the branch.

## 10. Out of scope

- Craft, upgrade levels, paint, trails and supplies (B3). The passport (B4).
- Anything online: accounts, boards, events (D). Ads and purchases (E).
- Seeding the daily's rings and UFO from the route. It is needed before a leaderboard and belongs to D.
- New missions, worlds or trophies.

## 11. What to hand back

A pull request from `phase-b2-career` into `main`, not merged, with this description:

```
## Phase B2: rank, Rex and reasons to come back

Compare: <link>

### Packages
- [ ] B2.0 … B2.8, each with its commit

### Checks
- lint, test (counts), screenshots (scenes run, PNGs opened)

### Coins a minute (B2.1)
<table: four pilots>

### Rex by rank (B2.4)
<table: four pilots × ranks 1, 10, 20, 30; anything you tuned>

### A new pilot's first twenty minutes
<rank, XP, coins, trophies>

### Old saves
<the fixture's numbers; the save-code check>

### Existing tests and scenes changed
<each one, old value → new value>

### Deviations from docs/PHASE_B2.md
### Questions and things found outside scope
```

Claude reviews it the same way as phases A and B1: lint, tests, the pilots flown again, old saves, the phone sizes,
then a verdict with file and line for anything to change.
