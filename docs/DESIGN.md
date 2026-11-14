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
| For good | Every craft, every paint job | The hangar | B2 |
| For good | Every stamp | The passport | B2 |
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
- A rank-up pays coins and sometimes opens something: a craft, a supply slot, a new Rex.
- Target: rank 5 in the first two sessions, rank 30 in 15 to 20 hours.

### 5.5 Rex (B2)

- Rex is the face of the game. His speed follows your rank, so he is always close.
- From rank 10 he boosts on the last stretch.
- He earns five new liveries as you climb, and Home shows the running score between you: "You 34 · Rex 12".

### 5.6 Craft and the hangar (B2)

Six craft, each a trade-off, each flying as a plane, glider, hopper or ship to suit the world:

| Craft | Good at | Gives up | Opens at |
|---|---|---|---|
| Classic | Everything, a little | Nothing | The start |
| Swift | Speed | Armour | Rank 4 |
| Hummingbird | Turning | Boost tank | Rank 7 |
| Mule | Heavy parcels don't slow it | Top speed | Rank 10 |
| Bulldog | Armour | Turning | Rank 14 |
| Comet | Boost lasts twice as long | Cruising speed | Rank 18 |

The six upgrade tracks grow to five levels each. Paint jobs grow to twelve, and trails arrive.

### 5.7 Supplies (B2)

One-flight extras bought with coins before take-off: a shield that absorbs the first knock, a spare boost tank, a
head start on the clock. One of each per flight. Never in the daily or in events. They are the sink that never runs
out, and in phase E a free one is what a rewarded ad gives.

### 5.8 Contracts (B2)

Three small jobs a day drawn from the counters the game already keeps: "deliver 5 fragile parcels", "fly through 20
rings", "beat Rex twice". Each pays coins and experience. Finishing all three opens a crate.

### 5.9 Streak and gift (B2)

- Flying the daily on consecutive days pays a little more each day, with a larger reward on day seven.
- One missed day a week is forgiven.
- The first launch of each day opens a small gift.

### 5.10 Passport (B2)

A stamp for every world visited, every landmark flown over and every chapter finished. A full page pays out, and any
page can be shared as a picture.

### 5.11 Trophies (B2)

The 55 trophies start paying coins and experience. Trophies already won pay out once, on the first launch after the
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
| **As built in B1:** run length | 1:48 | 2:31 | 3:45 | 4:49 |
| **As built in B1:** coins a run | 153 | 313 | 1,003 | 1,817 |

The pilots: the ace flies straight at the town, boosts and never crashes. The good pilot looks away 15% of the time
and crashes every 45 s. The average pilot doesn't boost, looks away 30% of the time and crashes every 25 s. The
beginner doesn't boost, looks away half the time and crashes every 14 s. The first two pairs of rows are the mean
of three runs; the as-built rows are the mean of ten, flown on the merged code. The beginner's 2:30 was noise from
three runs: a beginner's run is about as long as it was before.

Everything in today's shop costs 10,470 coins. An average pilot earns that in about an hour.

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

B1 adds 14,200 coins of mission rewards before B2 adds these sinks. That is fine between phases and wrong for a
public launch: B1 and B2 reach players together.

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
| Music | Synthesised, like every other sound |

## 10. Phases

| Phase | What | Who | When |
|---|---|---|---|
| A | The first five minutes | Codex | Merged, v0.18.0 |
| B1 | The clock, the daily, the missions | A second Codex session | Merged, v0.19.0 |
| B2 | Coin retune, rank, trophies that pay, Rex's ladder, contracts, streak and gift | Codex | Now |
| B3 | Craft, upgrade levels, paint, trails, supplies | A second Codex session | Now, in parallel |
| B4 | Passport | To assign | After B3 |
| C | Mobile wrapper | To assign | After B2 |
| D | Accounts, cloud save, boards, events | To assign | After C |
| E | Ads, Premium, packs | To assign | After D |
| F | Launch | Ata and Claude | After E |

Claude writes each spec and reviews each branch. Ata decides each merge.

## 11. Not doing

Loot boxes. Energy timers. Forced ads. Pay to win. Chat. Selling coins. A second currency. A story with cutscenes.
