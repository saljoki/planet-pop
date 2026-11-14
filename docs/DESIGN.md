# Planet Pop: game design

The design every phase builds towards. Ata gave Claude a free hand on 14 November 2026, with one brief: an interesting
game, players who come back, and a commercial future. Every open decision is settled here.

- **Put this file at:** `docs/DESIGN.md`
- **Agents:** build to this. Each phase has its own spec in `docs/`. Where a spec and this file disagree, the spec
  wins for that phase and this file gets corrected.
- **Numbers marked "target"** are tuned in their phase with the simulated pilots described in section 6.

---

## 1. The game

**Sky Courier: deliver parcels across the real solar system, one short flight at a time.**

You fly a small plane. You pick up a parcel, race it to the next town, swoop through the beacon and keep the combo
alive, while your rival Rex tries to get there first. Every world is real and every world changes the rules: Mercury's
sunshine cooks you, Neptune's wind shoves you west, Saturn's ring ice has to be threaded.

A session is 3 to 10 minutes on a phone. A flight is 1 to 5 minutes.

## 2. Who it's for

Anyone from about nine years old. It has to be safe for a child and still worth an adult's commute. That means no
chat, no strangers, no forced ads, and nothing sold that wins a race.

## 3. Pillars

1. **Fly first.** One tap from launch to flying. Nothing is taught with a paragraph that can be taught in the air.
2. **Every world changes the rules.** Real science is the content. A new world is a new way to fly, never a new skin.
3. **Always something to chase.** At four time scales: this flight, today, this week, and for good.
4. **Fair and kind.** Skill and time earn everything that matters. Money buys looks and convenience.
5. **Small and offline.** A tiny download that plays with no connection. Being online adds rivals.

## 4. What the player chases

| When | What | System | Phase |
|---|---|---|---|
| This flight | Beat the clock, hold the combo, beat Rex | The courier run and its clock | B1 |
| This flight | Three stars | Missions | B1 |
| Today | Today's route, ten parcels, one best score | The daily | B1 |
| Today | Three small jobs | Contracts | B2 |
| Today | Keep the streak, open the gift | Streak and gift | B2 |
| This week | The world of the week | Events and leaderboards | D |
| For good | The next rank | Pilot rank | B2 |
| For good | The next world | Chapters, opened by stars | B1 |
| For good | Every craft, every paint job | The hangar | B3 |
| For good | Every stamp | The passport | B4 |
| For good | Beating Rex for good | Rex's ladder | B2 |

## 5. Systems

### 5.1 The courier run, and its clock (B1)

The courier run is the heart of the game, and today it never ends for a competent pilot. Every delivery adds 20
seconds, and a clean leg takes about 12. Section 6 has the measurements.

The rule from B1:

- The first delivery adds 20 s. Each one after adds a second less, never below 6 s.
- The clock cannot rise above its starting time plus 9 s (99 s in the stock plane).
- Rex keeps getting faster with every delivery, as now.

A beginner's run changes by a few seconds. A strong run now builds to a finish at about four minutes, which is where
"one more go" comes from.

As built in B3: no courier run lasts longer than eight minutes. The clock's ceiling winds down to zero at 7:59 (a
bought head start adds ten seconds). A plane with every upgrade at five collected enough rings with its magnet to
fly for ever; the limit stops that without touching an ordinary run. The daily, missions and the van keep their
own clocks.

### 5.2 The daily (B1)

Today's route is **exactly ten parcels** in the stock plane. The run ends when ten have been delivered or stolen, or
the clock runs out. Seconds left at the end are worth 10 points each. As built, a pilot who finishes the route takes
about a minute and a half (ace 1:27, average 1:40), and a beginner runs out of clock at about five parcels. That
makes it a short ritual with scores that can be compared, which the leaderboard in phase D needs.

### 5.3 Missions, chapters and stars (B1)

- **61 missions:** ten in Flight school on made-up planets, then three on each of the 17 real worlds.
- **Each world is a chapter** with an arc: meet the world, meet its twist, master it.
- **Three stars a mission:** finish it, beat the par time, meet a bonus goal. 183 stars in all.
- **Stars open chapters**, from Earth at 3 stars to Charon at 104. Travel stays open: anyone can visit any world in
  Explore; stars gate that world's missions.
- **Rex follows you out:** he races you on the Moon, on Jupiter and at Pluto.

`docs/PHASE_B1.md` has every mission.

### 5.4 Pilot rank (B2)

- 30 ranks, from Cadet to Sky Marshal. Everything gives experience: coins earned in flight, new stars, contracts,
  trophies, streak days.
- A rank-up pays 50 × rank in coins and announces Rex paint at thresholds. Craft/supplies arrive in B3.
- Total XP for rank r is `300 × (r − 1) + 100 × (r − 1) × (r − 2)`; rank 30 is 89,900 XP.
  Earned coins give XP; reward coins do not. New stars give 100, trophies 200, contracts 150, crates 300,
  streak days 100 (300 on day seven).
- First-session check: lesson, First Flight, Rush Hour and three average courier runs in one continuous
  simulation, including camera/world trophies and production world swaps, reached rank 6, 4,176 XP,
  3,166 coins and 13 trophies in 8:15.63. That exceeds the rank 4–5 target. The reference-helper batch,
  rebuilding per leg without live camera trophies, reached rank 5, 2,717 XP, 2,107 coins and six trophies
  in 6:54. Neither opened a gift/crate or bought upgrades. Keep this phase's fixed XP values; review the
  faster integrated pacing before launch. Rank 30 in 15–20 hours remains an unmeasured long-term target.

### 5.5 Rex (B2)

- Rex is the face of the game. His speed follows your rank, so he is always close.
- Courier speed is `0.8 + 0.03 × min(level, 10) + 0.0025 × (rank − 1)`. Daily and missions keep rank 1 physics.
- From rank 10 he boosts by 1.15 while loaded, out of rest and within 0.35 rad of the destination.
- He earns five new liveries as you climb, and Home shows the running score between you: "You 34 · Rex 12".

### 5.6 Craft and the hangar (B3)

Six craft, each a trade-off, each flying as a plane, glider, hopper or ship to suit the world:

| Craft | Good at | Gives up | Opens at | Coins |
|---|---|---|---|---|
| Classic | Everything, a little | Nothing | The start | Free |
| Bulldog | Armour | Turning | Rank 4 | 3,000 |
| Hummingbird | Turning | Boost tank | Rank 7 | 5,000 |
| Mule | Heavy parcels don't slow it | Top speed | Rank 10 | 7,000 |
| Swift | Speed | Armour | Rank 14 | 9,000 |
| Comet | Boost lasts twice as long | Cruising speed | Rank 18 | 12,000 |

The Bulldog comes first because it forgives. The Swift was first in the spec; in review it wrecked every run of the
average pilot, who has no armour upgrades at rank 4, so the two swapped places and prices.

The six upgrade tracks have five levels each (30,770 coins). There are twelve paint jobs (5,100 coins for the ones
coins buy) and six trails (3,900). Home's hangar button counts what the wallet can buy at the pilot's rank, and the
pilot card names the next craft and supply slot a rank opens.

### 5.7 Supplies (B3)

One-flight extras bought with coins before take-off: a shield that absorbs the first knock, a spare boost tank, a
head start on the clock. One of each per flight. Never in the daily or in events. They are the sink that never runs
out, and in phase E a free one is what a rewarded ad gives.

As built: the shield costs 60 coins, the spare tank 40 and the head start (ten seconds) 50. Slots open at ranks 3,
8 and 13. Only the plain courier run takes them, and "Fly again" starts without them.

### 5.8 Contracts (B2)

Three seeded UTC jobs, one each from collecting, skill and variety. Targets freeze at the day’s starting rank
tier (1–9, 10–19, 20–30). The 18-job pool uses live counters; every tier-2 target was reached by a reference
pilot or a short detector script. Each pays 40–70 coins and 150 XP. Finishing all three offers a crate of
100/150/250 coins and 300 XP. Completed and abandoned runs count; reward coins are excluded from income.

### 5.9 Streak and gift (B2)

- A daily with at least one delivery pays 20, 25, 30, 35, 40, 50, then 150 coins; day eight starts at 20 again.
- One missed day can be forgiven every seven days. Streaks use the run’s own UTC date and pay once per date.
- The first visit offers a gift on Today: tap to open for 20, 30, 40 or 60 coins, with no XP. It is not auto-opened.

### 5.10 Passport (B4)

A stamp for every world visited, every landmark flown over and every chapter finished. A full page pays out, and any
page can be shared as a picture.

### 5.11 Trophies (B2)

The 55 trophies each pay 100 coins and 200 XP once. Trophies already won pay out once, on the first launch after the
update.

### 5.12 Events and leaderboards (D)

- A daily board, worldwide and among friends.
- A world of the week: one world, one twist (double wind, night only, heavy parcels only), its own board and a paint
  job that can only be won there.
- Scores are checked on the server before they count.

### 5.13 Explore and friends

Explore stays what it is: the whole solar system as a toy, free to roam. Friends rooms stay as they are until after
launch, then gain a shared race and a co-op delivery.

## 6. Economy

### What the simulation shows today

Four scripted pilots flew the courier run on the default planet in the stock plane. The first row is v0.17.0; the
second is the clock rule in 5.1.

| | Beginner | Average | Good | Ace |
|---|---|---|---|---|
| **Today:** run length | 1:36 | 4:21 | never ends | never ends |
| **Today:** coins a run | 167 | 634 | 3,900 in 15 min | 5,600 in 15 min |
| **New clock:** run length | 2:30 | 2:58 | 4:00 | 4:47 |
| **New clock:** coins a run | 306 | 449 | 1,086 | 1,680 |
| **As built in B1:** run length | 1:55 | 2:41 | 4:00 | 5:08 |
| **As built in B1:** coins a run | 153 | 313 | 1,003 | 1,817 |

The pilots: the ace flies straight at the town, boosts and never crashes. The good pilot looks away 15% of the time
and crashes every 45 s. The average pilot doesn't boost, looks away 30% of the time and crashes every 25 s. The
beginner doesn't boost, looks away half the time and crashes every 14 s. The first two pairs of rows are the mean
of three runs; the as-built rows are the mean of ten, flown on the merged code. The beginner's 2:30 was noise from
three runs: a beginner's run is about as long as it was before.

The as-built run lengths were corrected at the B2 and B3 merge. The review harness stepped 16 frames for every 15
it counted, so its first figures (1:48, 2:31, 3:45, 4:49) read 6% short. The two older pairs of rows came from the
same harness and read short by the same amount; coins are unaffected.

Before B3 the shop cost 10,470 coins: about 3.5 hours of run income alone at B2's measured 49.74 coins a minute.
B3's shop is in "As built in B3" below.

### As built in B2 (v0.20.0)

A fresh batch of ten runs per pilot uses the same default planet and stock plane. Look-away is periodic in
10-second cycles at the stated 50/30/15% shares; crashes are real ground collisions every 14/25/45 seconds.
World and flight seeds are fixed per attempt. These samples are separate from the historical B1 batch above;
the clock and rank-1 Rex formulas were not retuned. Coin rates exclude all career rewards.

| Pilot | Mean length (s) | Mean run coins | Mean coins/minute |
|---|---:|---:|---:|
| Beginner | 102.24 | 54.1 | 30.17 |
| Average | 169.21 | 145.2 | 49.74 |
| Good | 259.56 | 444.8 | 102.99 |
| Ace | 320.63 | 784.4 | 146.28 |

The average's 49.74 coins/min passes the 45–65 target. Parcel/taxi points pay ÷ 25, rings 2, UFO 12, road races
60/12; mission and space pay stay unchanged. All sixteen Rex rank/pilot cases were flown ten times. Initial
rankStep 0.004 let Rex steal 21.56% from the rank-30 ace, above the 15% limit. Reducing it to 0.0025 while keeping
boost at 1.15 gives 12.86% for ace and 16.85% for good (limit 35%). Rank-1 results match the economy batch exactly.

Existing-save fixture: seven effective stars give 700 XP, rank 2 and 100 rank coins. Three existing trophies
raise that to 1,300 XP, rank 3 and 550 total back-pay coins; an existing 900-coin wallet becomes 1,450. A real save
code generated at main `48ad274` loads the same way. The only new saved key is `planetpop.career`.

### As built in B3 (v0.21.0)

| Sink | Coins |
|---|---:|
| Upgrades, six tracks of five levels | 30,770 |
| Five craft | 36,000 |
| Twelve paint jobs (the ones coins buy) | 5,100 |
| Six trails | 3,900 |
| **The whole shop** | **75,770** |

Every price from before B3 is unchanged, and old saves load as Classic with nothing added to them.

- **Time to own it.** At the average pilot's 50 coins a minute the shop is 25 hours of flying alone. Rank rewards
  (23,200 coins over ranks 2 to 30), trophies (5,500), mission rewards (14,200) and the daily jobs, crate, streak
  and gift shorten that. The 20-hour target is checked against real play before launch.
- **Craft, four pilots, eight runs each, no upgrades.** No pilot wrecked in the Bulldog. The Swift wrecked every
  run of the average pilot and the beginner, which is why it waits for rank 14. The good pilot scored 127% of the
  Classic in the Mule (Codex's ten runs: 116%).
- **The longest run.** An ace with every upgrade at five ends at eight minutes in the Classic and in the Swift.
- **The first session with both phases.** A new pilot's first twenty minutes (lesson, First Flight, Rush Hour,
  then courier runs by the average pilot) end at rank 5 with about 2,600 coins: one supply slot is open and the
  Bulldog is open and nearly affordable. Codex's stronger reference pilot reaches rank 6 in eight minutes.
- **Rex at rank 30,** twenty runs each in the stock plane: he takes 15.4% of the ace's parcels and 18.2% of the
  good pilot's. The ace sits on the 15% limit in the stock plane; a real rank-30 pilot flies an upgraded one.

### Targets (B2)

- **Coin income:** an average pilot earns about 60 coins a minute. Coins from a run become points ÷ 25, down from
  points ÷ 10, so a mission reward is again worth more than a run.
- **First purchase** inside the first session. Something affordable in most sessions of the first week.
- **About 20 hours** for an average pilot to own everything that isn't a supply.

| Sink | Target coins |
|---|---|
| Upgrades, six tracks of five levels | 30,000 |
| Five craft | 36,000 |
| Paint jobs and trails | 9,000 |
| Supplies | Endless |

Players keep every coin and purchase they have now.

B1 adds 14,200 coins of mission rewards; B3 adds these sinks. B2 changes pay and career rewards while preserving
all existing shop prices and purchases. Assess the full economy after B3 before a public launch.

## 7. Money (E)

- **Free to play.**
- **Rewarded ads, always the player's choice:** double the coins on a results card, 30 more seconds once per run, a
  repair once per run, a second daily gift, a free supply. Never in the daily, never forced, no banners.
- **Premium, about $4.99, once:** every ad reward without the ad, a craft livery set and a trail of its own, a badge
  on the boards.
- **Cosmetic packs, $0.99 to $2.99:** liveries, trails, horns, name tags.
- **Later:** a seasonal pass tied to the weekly events.
- **Never sold:** coins, stars, rank, speed, or anything that changes a score on a board.

Release order: CrazyGames first, because a portal brings players and a store doesn't. Then Android, then iOS.

## 8. How we'll know

Targets Claude is setting. They are goals, not industry figures.

- 35% of new players come back the next day; 12% are still playing a week later.
- The median session is 8 minutes.
- A third of daily players choose to watch at least one ad.

The first real numbers come from the CrazyGames Basic Launch, after phases A and B1. If fewer than one new player in
five returns the next day, the loop gets fixed before any store work starts.

## 9. Decisions

| Decision | Choice |
|---|---|
| Audience | General, about nine and up; an age screen; child-safe defaults |
| Business model | Free, rewarded ads, one Premium purchase, cosmetic packs |
| Backend | Supabase, RevenueCat, AdMob; nothing self-hosted |
| First release | CrazyGames, then Android, then iOS |
| Store name | "Planet Pop: Sky Courier" |
| What stars open | Each world's missions; travel stays open |
| Courier clock | 20 s falling by 1 s a delivery to 6 s; capped at start + 9 s |
| Daily | Ten parcels, stock plane, finish bonus |
| Mission count | 61: ten in Flight school, three on each world |
| Currencies | Coins only at launch; no bought currency |
| Coin income | Points ÷ 25 from B2 |
| Time to own everything | About 20 hours |
| Hangar | Keeps its name; a shop appears only when there is something to sell for money |
| Craft order | Bulldog at rank 4, Hummingbird 7, Mule 10, Swift 14, Comet 18 |
| Supplies | Shield 60, spare tank 40, head start 50; slots at ranks 3, 8 and 13; plain courier runs only |
| Longest courier run | Eight minutes |
| Rex and rank | 0.0025 of speed a rank in courier runs; boosts from rank 10; rank 1 in the daily and missions |
| Music | Synthesised, like every other sound |

## 10. Phases

| Phase | What | Who | When |
|---|---|---|---|
| A | The first five minutes | Codex | Merged, v0.18.0 |
| B1 | The clock, the daily, the missions | A second Codex session | Merged, v0.19.0 |
| B2 | Coin retune, rank, trophies that pay, Rex's ladder, contracts, streak and gift | Codex | Merged, v0.20.0 |
| B3 | Craft, upgrade levels, paint, trails, supplies | A second Codex session | Merged, v0.21.0 |
| B4 | Passport | To assign | Next |
| C | Mobile wrapper | To assign | After B2 |
| D | Accounts, cloud save, boards, events | To assign | After C |
| E | Ads, Premium, packs | To assign | After D |
| F | Launch | Ata and Claude | After E |

Claude writes each spec and reviews each branch. Ata decides each merge.

## 11. Not doing

Loot boxes. Energy timers. Forced ads. Pay to win. Chat. Selling coins. A second currency. A story with cutscenes.
