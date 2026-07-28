# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server on port 6020 (falls back to 6021+ if taken)
npm run build    # vue-tsc -b && vite build — typecheck runs first and will fail the build
npm run preview  # serve the production build
npm test         # vitest run — src/**/*.test.ts
npm run test:watch
npx vue-tsc -b   # typecheck only, without building
```

Tests are vitest (`vitest.config.ts` merges the app's Vite config, so SCSS variable injection applies).
Test files live next to what they cover and are inside `tsconfig.app.json`'s `include`, so a test that
imports something missing **fails `npm run build`**, not just `npm test`.

The weather and window-prediction code is tested against the real JSON in `src/assets/json/` rather
than fixtures — `src/hooks/fishWindows.test.ts` replicates App.vue's `setFishingData` /
`createWeatherList` so it exercises the same shapes the app builds. For ad-hoc exploration of
`src/hooks/hooks.ts` you can still bundle it standalone:

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

### One countdown path, reached from the node alone

| Job | Active state | Countdown |
|---|---|---|
| miner / botany | `isGatherNodeActive` | `gatherTimer` |
| sightseeing | `isSightseeActive` | `sightseeTimer` |
| fishing | `isFishNodeActive` | `fishTimer` |
| any surface | `isNodeWindowActive(node)` | `nodeCountdown(node)` |

All six run on the window engine, so every job's countdown comes out of `timerWindows`. `nodeCountdown`
/ `isNodeWindowActive` dispatch on `node.job` and read the timer and weather lists from the sources
App.vue hands to `registerNodeTimeSources`, so a caller passes only the node — which is what lets
`ui/displayTime.vue` render any node's countdown as `<displayTime :node="d"/>`. Prefer that component
over calling the hooks from a page.

**Known bugs in the legacy `timerList` countdown** — `recalcTimerCountdowns` in App.vue, still the source
of `timerList[].countdown` and `.stateActive`, and inherited by anything reading those directly
(`nodeTimeChecker`, `isNodeActive`, `EorzeaMap`):

- It converts ET minutes to real seconds as `minsUntil * 3`, but an ET minute is `175/60 = 2.9167`
  seconds. Its countdowns therefore run ~2.9% long — up to two minutes off for a full-day wait — and
  flip to active that late.
- It does not handle wrap-around windows: for a `18 → 2` timer both of its branches are false all day,
  so those 29 timers report `stateActive: false` permanently.

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
- **Never look weather up by `area.mapcode`.** Only zone-level rows from the original data carry one;
  every sub-area row (fishing hole, gathering point) has `mapcode: ""`, and **no Endwalker or Dawntrail
  area has a mapcode at all**. Use `zoneWeatherCode(area)` from `modules/weatherForecast.ts`, which
  falls back to deriving the code from the zone name (`"Radz-at-Han"` → `radzAtHan`). Reading
  `.mapcode` directly is what left every EW/DT fishing hole with no window.
- **Data gaps are expected, not bugs.** 7 fishing areas — the Diadem cloudtops and `Open Sirensong Sea`
  — are absent from `areas.json` and keep `area` as a bare string, so they have no zone to resolve
  weather from (`—`). A few weather names in `nodes_fishing.json` (`Lightning`, `Overcast`,
  `Thunderstorms` where the zone yields `Thunder`, and Ultima Thule's `Clear Skies`) never occur in
  their zone. `src/hooks/fishWindows.test.ts` pins the Endwalker list at exactly one such row.
- `resolveWeather` falls back to the Endwalker/Dawntrail rate tables in `modules/weatherRates.ts` for
  zones the `eorzea-weather` library rejects (it stops at Shadowbringers), and remembers the failure so
  a forward sweep doesn't throw and log per lookup. Those tables are transcribed from the game's own
  `WeatherRate` sheet via xivapi v2 (`TerritoryType` → `WeatherRate`); the shared target algorithm is
  verified against the library on zones it does know.
- `getWeatherForecast` invents a deterministic weather cycle for zones `resolveWeather` can't answer.
  Nothing real hits that path any more (only The Gold Saucer, which the page excludes) — if a whole
  expansion's forecast ever looks plausible but wrong, that fallback is why.


## Test Requirements

Before marking any task as complete:
1. Write unit tests for new functionality
2. Run the full test suite with 'npm run build'
3. Fix the errors during the build until the result is OK
4. Check the desired output and if fail:
- Analyze the failure
- Fix the code (not the tests, unless tests are incorrect)
5. Re-run test until all pass


## Security Requirements

- Never hardcore credentials
- ALWAYS use enviromental variables
- Use .env.example for templates, never commit .env files
- Sanitize all user inputs before database queries
- Use parameterized queries, never string concatenation for SQL
- Log errors without exposing sensitive data