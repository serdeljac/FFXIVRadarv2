# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server on port 6020 (falls back to 6021+ if taken)
npm run build    # vue-tsc -b && vite build — typecheck runs first and will fail the build
npm run preview  # serve the production build
npx vue-tsc -b   # typecheck only, without building
```

There is **no test framework** in this project — no vitest/jest, no test script. Verify changes by
building and by exercising the running app. For logic in `src/hooks/hooks.ts`, a practical approach is
to bundle it standalone and run it against the real JSON data:

```bash
npx esbuild src/hooks/hooks.ts --bundle --format=esm --platform=node --outfile=.tmp-hooks.mjs --external:eorzea-weather
```

`tsconfig.app.json` sets `noUnusedLocals` and `noUnusedParameters`, so unused variables break the build.

## Architecture

### App.vue owns all shared state

`src/App.vue` is a single ~790-line Options API root that is the app's only data layer. It loads all
14 JSON files from `src/assets/json/` in one `Promise.all`, normalizes each set (`setMiningAndBotanyData`,
`setFishingData`, …), and holds `ffxivData`, `timerList`, `weatherList`, `eorzeaClock`, and `trackinglist`.

Every route receives the same five props through a single `<router-view>` binding, so a new page in
`src/main.ts` automatically gets `ffxivData`, `windowWidth`, `timerList`, `weatherList`, `eorzeaClock`
without extra plumbing. Node objects in `trackinglist` are the **same references** as those in
`ffxivData[job]`, so mutating `.tracked` on one is visible everywhere.

A 1-second `setInterval` (`onClockTick`) decrements timer countdowns, advances the Eorzea clock every
3rd tick, and rebuilds `weatherList` when the clock crosses a weather boundary.

### Eorzea time and the window prediction engine (`src/hooks/hooks.ts`)

This is the least obvious part of the codebase and the place most bugs live.

Eorzea runs 3600/175× faster than real time: one ET day (1440 ET minutes) takes 70 real minutes, and
weather rerolls three times a day at ET 00:00/08:00/16:00 — a **1,400,000 ms** window. Both grids are
anchored to the unix epoch with no offset, which is what lets a window be indexed directly off
`Date.now()` (`Math.floor(now / WEATHER_WINDOW_MS)`). `eorzeaMinuteAt()` has been verified against the
`eorzea-time` library.

Spawn conditions are piecewise-constant on that grid, so both questions — *how long does this stay up*
and *when does it next open* — are solved by walking window boundaries:

- `timerWindows(timer)` expands a `data_timer.json` row into non-wrapping `[start, end)` ET-minute
  intervals. **29 of 135 timers cross midnight** (e.g. `18 → 2`) and become two intervals; touching
  intervals get merged, and a full-day window collapses to `[]` meaning "no restriction".
- `activeRunEnd()` walks forward while conditions still hold — a run can outlast the window it began in,
  either because the timer wraps midnight or because consecutive weather windows both satisfy the node.
- `nextSpawnAt()` scans forward a window at a time, intersecting satisfying windows with the time ranges.
- Results are cached per node until their `until` timestamp passes; weather lookups are memoised per
  `(zone, window)`. Without this the sweep is far too costly to redo every second.

Weather rules differ by job: sightseeing needs `weather1|weather2` to match *now*; fishing additionally
supports a **transition** — `weatherchain1-3` must be blowing now, having followed one of `weather1-3`
in the *previous* window.

### Two timer systems coexist

| Job | Active state | Countdown |
|---|---|---|
| miner / botany | `nodeTimeChecker(node, timerList, true)` | `nodeTimeChecker(node, timerList, false)` |
| sightseeing | `isSightseeActive` | `sightseeTimer` |
| fishing | `isFishNodeActive` | `fishTimer` |
| any (tracking bar, details pane) | `isNodeWindowActive` | `nodeCountdown` |

`nodeCountdown` / `isNodeWindowActive` dispatch on `node.job`, so mixed-job surfaces show the same value
a node's own page shows. Mining/botany still uses the legacy path.

**Known bug:** `recalcTimerCountdowns` in App.vue does not handle wrap-around windows — for a `18 → 2`
timer both of its branches are false all day, so those 29 timers report `stateActive: false` permanently.
The window engine sidesteps this via `timerWindows`; anything reading `timerList[].stateActive` directly
inherits the bug.

### Countdowns must use the shared clock

`useNow()` returns one app-wide reactive timestamp. Components that render countdowns **must** use it —
sightseeing/fishing countdowns derive from real time, not from the mutating `timerList` entries, so
without it a page freezes. Independent per-component intervals also drift apart, which previously made
the same node read `43m 4s` on its page and `43m 5s` in the tracking bar.

### Styling

`vite.config.ts` injects `@use "/src/style/variables.scss" as *` into **every** SCSS block, so `$teal`,
`$dim`, `$borderRadius` etc. are available without importing. Editing `src/style/variables.scss`
re-themes the whole app; it is the single source of colour truth and documents its contrast ratios.

Data tables share an `rdrTable` structure (`_header` → `_split` → `_body`, rows as CSS grid) with base
styles in `src/style/style.scss`; each page sets its own `grid-template-columns`. Responsive behaviour
is driven by the `windowWidth` class App.vue puts on containers (`desktop-large` ≥1700, `desktop-small`
≥1260, `tablet` ≥800, `mobile` below) rather than media queries — match that pattern rather than adding
`@media` blocks. `2_TimedMiningBotany.vue` is the canonical reference for a page's table styling.

### Serverless API

`api/character.ts` is a Vercel function wrapping `api/_lodestone.ts` (Cheerio scrape of the Lodestone).
Vite has no serverless runtime, so `vite.config.ts` registers dev middleware that serves `/api/character`
by `ssrLoadModule`-ing the same file — keep both paths working when changing it. Icons load from S3, with
a `/s3/` dev proxy configured in the same file.

## Gotchas

- **Import `hooks.ts` with the `.ts` extension.** Mixed specifiers (`'../../hooks/hooks'` vs
  `'.../hooks.ts'`) resolve to different URLs in the dev graph and create two module instances, silently
  duplicating the weather and node-state caches.
- **`min-width: 0` on flex children that contain tables.** Flex items default to `min-width: auto` and
  refuse to shrink below content width, producing horizontal overflow.
- **The global `*, a { color: $fontColor }` reset defeats inherited colour.** Setting `color` on a
  wrapper never reaches the `<p>` inside — style the text element directly.
- **Vue keeps a literal `false` on non-boolean attributes.** For `data-` attributes driving CSS, return
  `true | null` (or append `|| null`), otherwise `data-x="false"` still matches `[data-x]`.
- **Data gaps are expected, not bugs.** ~169 fishing holes are absent from `areas.json` and keep `area`
  as a bare string with no `mapcode`, so their weather cannot be resolved (`—`). A few weather names in
  `nodes_fishing.json` (`Lightning`, `Overcast`, `Umbral *`, `Thunderstorms` where the zone yields
  `Thunder`) never occur in any zone.
- `resolveWeather` falls back to Dawntrail rate tables for zones the `eorzea-weather` library rejects,
  and remembers the failure so a forward sweep doesn't throw and log per lookup.


## Test Requirements

Before marking any task as complete:
1. Write unit tests for new functionality
2. Run the full test suite with 'npm run build'
3. Fix the errors during the build until the result is OK
4. Check the desired output and if fail:
- Analyze the failure
- Fix the code (not the tests, unless tests are incorrect)
5. Re-run test until all pass