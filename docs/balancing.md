# Orbit Janitor Balancing Notes

These values describe the current tuning surface for public demo review. Treat them as player-facing design notes, not a guarantee that every number should remain fixed.

## Sector Objectives

| Sector            | Objective                   | Starting Obstacles | Max Obstacles | Hazard Intensity | Event Waves                                 |
| ----------------- | --------------------------- | -----------------: | ------------: | ---------------: | ------------------------------------------- |
| Training Orbit    | Complete 3 training pickups |                  0 |             1 |             0.00 | None                                        |
| Low Orbit Cleanup | Reach 50 cleanup points     |                  2 |             4 |             0.95 | Solar Flare, Cleanup Frenzy                 |
| Debris Belt       | Collect 25 junk             |                  3 |             5 |             1.05 | Debris Storm, Satellite Net, Cleanup Frenzy |
| Solar Storm       | Survive 90 seconds          |                  2 |             4 |             1.35 | Solar Flare, Debris Storm                   |
| Night Side        | Reach 80 cleanup points     |                  3 |             5 |             1.45 | Satellite Net, Solar Flare                  |
| Comet Wake        | Survive 8 hazards           |                  3 |             5 |             1.65 | Comet Pass, Debris Storm, Solar Flare       |
| Endless Cleanup   | Endless high-score mode     |                  2 |             5 |             1.15 | All event-wave types                        |

## Upgrade Costs

Upgrade costs use the same curve for all upgrades until an upgrade reaches max level.

| Purchased Level | Scrap Cost |
| --------------: | ---------: |
|               1 |          5 |
|               2 |         10 |
|               3 |         18 |
|               4 |         30 |
|               5 |         45 |

## Upgrade Effects

| Upgrade          | Max Level | Effect                               |
| ---------------- | --------: | ------------------------------------ |
| Magnet Coil      |         5 | Junk pickup radius +0.08 per level.  |
| Fuel Tank        |         4 | Boost fuel max +10% per level.       |
| Turbo Regulator  |         5 | Boost recharge +8% per level.        |
| Shield Cell      |         1 | Blocks one crash per run.            |
| Lane Thrusters   |         4 | Lane switch duration -8% per level.  |
| Combo Stabilizer |         5 | Combo window +0.2 seconds per level. |

Scrap earned after a run equals junk collected plus any run bonus, with a 10 scrap bonus when the objective is complete.

## Hazard Pacing

Baseline hazard constants:

| Setting            |        Value |
| ------------------ | -----------: |
| First hazard spawn |    8 seconds |
| Base interval      |    7 seconds |
| Minimum interval   |  3.2 seconds |
| Telegraph duration | 1.25 seconds |
| Active duration    | 0.65 seconds |
| Arc width          | 0.65 radians |
| Collision radius   |         0.45 |

Hazard interval decreases as score increases and is modified by sector intensity, sector modifiers, event-wave effects, and endless scaling.

Default hazard unlock pacing when not restricted by a sector:

| Condition                | Hazard Types Added          |
| ------------------------ | --------------------------- |
| Start                    | Lane Arc                    |
| Score 10 or run time 30s | Double Lane Arc, Pulse Mine |
| Score 20 or run time 55s | Sweeper, Gate               |
| Score 30 or run time 75s | Debris Shower               |

Sector configs may restrict the available hazard set. Training Orbit disables normal hazards and lets the tutorial control hazard presentation. Comet Wake starts with late-pattern hazards because its objective is to survive hazards directly.

## Event Waves

Non-tutorial sectors can trigger a single finale-style event after at least 12 seconds and roughly 68% objective progress. Endless Cleanup schedules recurring events every 120-180 seconds.

Event waves are intentionally announced by a 2 second warning, then run for 13-15 seconds depending on type. During warning, regular hazard pressure is reduced so the callout is readable.

## Powerups

Powerups spawn during active runs every 20-35 seconds, expire after 12 seconds if uncollected, and only one collectible powerup should be present at a time.

| Powerup       | Duration or Effect                                   |
| ------------- | ---------------------------------------------------- |
| Magnet Surge  | 8 seconds of extra pickup range and light junk pull. |
| Time Dilation | 5 seconds at 60% obstacle/hazard timer speed.        |
| Overdrive     | 4 seconds of fuel-free boost.                        |
| Shield Pickup | Adds one temporary shield charge.                    |
| Combo Lock    | 6 seconds where the combo timer does not decrease.   |
| Scrap Cache   | Adds 5 bonus scrap.                                  |

## Tuning Questions

- Does Low Orbit Cleanup reach mission complete before the first event too often?
- Does Solar Storm remain readable once hazard cadence increases?
- Does Comet Wake feel fair with late-pattern hazards available immediately?
- Are upgrade costs high enough to make scrap meaningful without forcing too many failed runs?
- Are powerups tempting enough to change route decisions without trivializing hazards?
