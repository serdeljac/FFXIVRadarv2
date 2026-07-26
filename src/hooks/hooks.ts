import { ref, onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { resolveWeather } from '../components/api/weatherForecast'

// One clock for every countdown in the app. Components that each ran their own
// interval drifted up to a second apart, so the same node could read "43m 4s" on
// its page and "43m 5s" in the tracking bar. Sharing the tick means every caller
// formats from the identical timestamp. The interval only runs while something
// is subscribed to it.
const sharedNow = ref(Date.now())
let clockHandle: ReturnType<typeof setInterval> | undefined
let clockSubscribers = 0

export function useNow(): Ref<number> {
    onMounted(() => {
        clockSubscribers++
        if (!clockHandle) {
            sharedNow.value = Date.now()
            clockHandle = setInterval(() => { sharedNow.value = Date.now() }, 1000)
        }
    })

    onUnmounted(() => {
        clockSubscribers--
        if (clockSubscribers <= 0) {
            clockSubscribers = 0
            clearInterval(clockHandle)
            clockHandle = undefined
        }
    })

    return sharedNow
}

export function capitalize(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

// Keeps the first row for each distinct value of `key`, dropping later duplicates.
export function getUniqueByKey(array: any[], key: string): any[] {
    const seen = new Set()
    return array.filter(obj => {
        if (seen.has(obj[key])) return false
        seen.add(obj[key])
        return true
    })
}

// Builds the human-readable usage label for a node, branching on usage type:
// aetherial reduction lists its three results, custom delivery and gather
// scripts get their own phrasing, everything else is just the capitalized usage.
export function fetchUsageAttrName(node: any): string {
    if (node.usage === 'aetherial') {
        const { result1, result2, result3 } = node.usage_info
        return [result1, result2, result3].map(capitalize).join(', ')
    }
    if (node.usage === 'customdelivery') return `Deliver to ${node.usage_info}`
    if (node.usage === 'scripts') return `${capitalize(node.usage_info)} Gather Scripts`
    return capitalize(node.usage)
}

export function fetchUsageImgName(node: any): string {
    if (node.usage === 'scripts') return `${node.usage_info}gatherscripts`
    if (node.usage === 'crafting') return 'sq_crafting'
    return node.usage
}

// Fishing holes absent from areas.json stay a bare string; zones become "Region > Zone".
export function formatAreaLabel(area: any): string {
    if (!area) return ''
    return typeof area === 'string' ? area : `${area.region} > ${area.zone}`
}

export function padNumber(num: number): string {
    return num < 10 ? `0${num}` : `${num}`
}

export function formatStars(count: number): string {
    return '★'.repeat(Math.max(0, count ?? 0))
}

export function formatTug(count: number): string {
    return '!'.repeat(Math.max(0, count ?? 0))
}

export function findTimer(timerList: any[], id: any): any {
    return id ? timerList.find((o: any) => o.ID === id) : undefined
}

export function isTimerActive(timerList: any[], id: any): boolean {
    return !!findTimer(timerList, id)?.stateActive
}

export function getTimerCountdown(timerList: any[], id: any): string {
    return findTimer(timerList, id)?.countdown ?? 'Any Time'
}

export function isWeatherMatch(weatherList: Record<string, any>, mapcode: string, weather?: string | false): boolean {
    return !!weather && weatherList[mapcode] === weather
}

// A node is active when its timer window is open; sightseeing nodes additionally
// require the current weather to match one of their two accepted conditions.
export function isNodeActive(node: any, timerList: any[], weatherList: Record<string, any>): boolean | null {
    const timerState = isTimerActive(timerList, node.time) ? true : null

    if (node.job === 'sightseeing') {
        const weatherState = (isWeatherMatch(weatherList, node.area.mapcode, node.weather1)
            || isWeatherMatch(weatherList, node.area.mapcode, node.weather2)) ? true : null
        return timerState && weatherState ? true : null
    }
    return timerState
}

// ── Eorzea time ─────────────────────────────────────────────────────────────
// Eorzea runs 3600/175 faster than real time: one ET day (1440 ET minutes) takes
// 70 real minutes. Weather rolls three times a day, at ET 00:00/08:00/16:00 — the
// same boundaries App.vue rebuilds weatherList on — so a weather window is exactly
// a third of an ET day. Both grids are anchored to the unix epoch with no offset,
// which is what lets us index windows straight off Date.now().
const ET_MINUTE_MS = 175_000 / 60
const ET_DAY_MINUTES = 1440
const ET_DAY_MS = ET_DAY_MINUTES * ET_MINUTE_MS      // 4_200_000
const WEATHER_WINDOW_MINUTES = 480
const WEATHER_WINDOW_MS = ET_DAY_MS / 3              // 1_400_000

// How far ahead prediction will look before giving up. 500 windows is ~8 real
// days; a vista pairing a rare weather with a narrow time band still lands well
// inside that.
const MAX_LOOKAHEAD_WINDOWS = 500

// Eorzea minute-of-day (0-1439) at a real timestamp. Verified against eorzea-time.
export function eorzeaMinuteAt(ms: number): number {
    return Math.floor((ms * (3600 / 175)) / 60000) % ET_DAY_MINUTES
}

export function formatDuration(totalSeconds: number): string {
    const s = Math.max(0, Math.floor(totalSeconds))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h ${m}m ${sec}s`
    if (m > 0) return `${m}m ${sec}s`
    return `${sec}s`
}

// Expands a timer row into non-wrapping [start, end) intervals in ET minutes.
// A window whose end hour is at or before its start hour (timer35 is 18 -> 2)
// crosses midnight and splits into two intervals. An empty result means the node
// has no time restriction at all.
export function timerWindows(timer: any): Array<[number, number]> {
    if (!timer) return []
    const raw: Array<[number, number]> = []
    for (let i = 0; i < (timer.sets ?? 1); i++) {
        const start = timer[`start${i}`] * 60
        const end = timer[`end${i}`] * 60
        if (start === end) continue
        if (end > start) {
            raw.push([start, end])
        } else {
            raw.push([start, ET_DAY_MINUTES])
            raw.push([0, end])
        }
    }
    if (!raw.length) return []

    // Merge overlapping and touching intervals, so sets that butt up against each
    // other (0-6 plus 6-12) count as one uninterrupted window.
    raw.sort((a, b) => a[0] - b[0])
    const merged: Array<[number, number]> = [[raw[0][0], raw[0][1]]]
    for (let i = 1; i < raw.length; i++) {
        const last = merged[merged.length - 1]
        if (raw[i][0] <= last[1]) last[1] = Math.max(last[1], raw[i][1])
        else merged.push([raw[i][0], raw[i][1]])
    }

    // A window covering the whole day (0-24) is just "no time restriction"; saying
    // so here stops callers treating midnight as an edge the node lapses at.
    if (merged.length === 1 && merged[0][0] === 0 && merged[0][1] >= ET_DAY_MINUTES) return []
    return merged
}

const inWindows = (windows: Array<[number, number]>, etMin: number): boolean =>
    windows.some(([s, e]) => etMin >= s && etMin < e)

// resolveWeather is pure for a given (zone, window), so results are memoised per
// weather window — a few hundred vistas sharing a handful of zones would otherwise
// recompute the same forecast thousands of times per prediction sweep.
const weatherWindowCache = new Map<string, string | null>()

function weatherAtWindow(mapcode: string, windowIndex: number): string | null {
    const key = `${mapcode}|${windowIndex}`
    const hit = weatherWindowCache.get(key)
    if (hit !== undefined) return hit
    // Sampling mid-window keeps us clear of any rounding right on the boundary.
    const weather = resolveWeather(mapcode, new Date(windowIndex * WEATHER_WINDOW_MS + WEATHER_WINDOW_MS / 2))
    if (weatherWindowCache.size > 5000) weatherWindowCache.clear()
    weatherWindowCache.set(key, weather)
    return weather
}

// ── Timed node prediction ───────────────────────────────────────────────────
// Vistas and fishing holes both spawn on an ET time range combined with the zone
// weather, so "when does this next happen" can't be read off the timer alone.
// Weather is constant within a window, which turns both questions — how long a
// spawn lasts, and when the next one starts — into a walk over that window grid.

interface NodeWindowState {
    active: boolean
    /** Timestamp the current state flips at; Infinity when nothing is scheduled. */
    until: number
}

// The weather half of a spawn condition:
//   required, no chain -> the zone weather must be one of `required`
//   required + chain   -> the zone weather must be one of `chain`, *and* the
//                         window before it one of `required` (fishing transitions)
//   neither            -> no weather restriction at all
interface WeatherRule {
    required: string[]
    chain: string[]
    mapcode?: string
    /** App's cached current weather, trusted for its own window so a row can never
     *  contradict the weather column rendered next to it. */
    live?: { index: number; weather: string | null }
}

function weatherRule(
    node: any,
    weatherList: Record<string, any>,
    requiredKeys: string[],
    chainKeys: string[],
    now: number,
): WeatherRule {
    const mapcode = node.area?.mapcode
    return {
        required: requiredKeys.map(k => node[k]).filter(Boolean),
        chain: chainKeys.map(k => node[k]).filter(Boolean),
        mapcode,
        live: mapcode
            ? { index: Math.floor(now / WEATHER_WINDOW_MS), weather: weatherList[mapcode] || null }
            : undefined,
    }
}

function weatherInWindow(rule: WeatherRule, windowIndex: number): string | null {
    if (rule.live && windowIndex === rule.live.index) return rule.live.weather
    return weatherAtWindow(rule.mapcode as string, windowIndex)
}

function weatherRuleHolds(rule: WeatherRule, windowIndex: number): boolean {
    if (!rule.required.length) return true
    if (!rule.mapcode) return false

    const current = weatherInWindow(rule, windowIndex) as string
    if (!rule.chain.length) return rule.required.includes(current)

    // Chained: this window carries the "after" weather and the one before it the
    // "before", so a transition only counts on the window it completes in.
    return rule.chain.includes(current)
        && rule.required.includes(weatherInWindow(rule, windowIndex - 1) as string)
}

const timeWindowHolds = (windows: Array<[number, number]>, at: number): boolean =>
    !windows.length || inWindows(windows, eorzeaMinuteAt(at))

const holdsAt = (windows: Array<[number, number]>, rule: WeatherRule, at: number): boolean =>
    timeWindowHolds(windows, at) && weatherRuleHolds(rule, Math.floor(at / WEATHER_WINDOW_MS))

// How long an already-spawned node stays up. Both constraints are piecewise
// constant, so this walks boundary to boundary while they still hold — a run can
// outlast the window it began in, either because the timer wraps midnight (18 -> 2
// is stored as two intervals) or because consecutive weather windows both satisfy
// the node. Infinity means nothing ever ends it.
function activeRunEnd(windows: Array<[number, number]>, rule: WeatherRule, from: number): number {
    let at = from

    for (let guard = 0; guard < MAX_LOOKAHEAD_WINDOWS; guard++) {
        let timeEnd = Infinity
        if (windows.length) {
            const etAt = eorzeaMinuteAt(at)
            const open = windows.find(([s, e]) => etAt >= s && etAt < e)
            if (!open) return at
            timeEnd = at + (open[1] - etAt) * ET_MINUTE_MS
        }

        let weatherEnd = Infinity
        if (rule.required.length) {
            const windowIndex = Math.floor(at / WEATHER_WINDOW_MS)
            if (!weatherRuleHolds(rule, windowIndex)) return at
            weatherEnd = (windowIndex + 1) * WEATHER_WINDOW_MS
        }

        const next = Math.min(timeEnd, weatherEnd)
        if (!isFinite(next)) return Infinity
        // Always strictly greater than `at`, so this can't spin. Landing exactly on
        // the boundary re-tests against whatever window starts there, which is what
        // lets a contiguous run carry through.
        at = next
    }

    // Only reachable if a run outlasts the whole lookahead. Reporting no end beats
    // reporting the arbitrary point the guard happened to stop at.
    return Infinity
}

// When the node next spawns: walk forward a weather window at a time and, in each
// window that satisfies the weather rule, intersect the ET minutes it spans with
// the node's time ranges.
function nextSpawnAt(windows: Array<[number, number]>, rule: WeatherRule, from: number): number {
    if (rule.required.length && !rule.mapcode) return Infinity

    const firstWindow = Math.floor(from / WEATHER_WINDOW_MS)
    const segments = windows.length ? windows : [[0, ET_DAY_MINUTES] as [number, number]]

    for (let i = 0; i < MAX_LOOKAHEAD_WINDOWS; i++) {
        const windowIndex = firstWindow + i
        if (!weatherRuleHolds(rule, windowIndex)) continue

        const windowStart = windowIndex * WEATHER_WINDOW_MS
        const etBase = (windowIndex % 3) * WEATHER_WINDOW_MINUTES
        let soonest = Infinity

        for (const [s, e] of segments) {
            const lo = Math.max(s, etBase)
            const hi = Math.min(e, etBase + WEATHER_WINDOW_MINUTES)
            if (lo >= hi) continue
            const segmentEnd = windowStart + (hi - etBase) * ET_MINUTE_MS
            if (segmentEnd <= from) continue
            const segmentStart = windowStart + (lo - etBase) * ET_MINUTE_MS
            // Clamped so a segment straddling `from` can never report negative time.
            soonest = Math.min(soonest, Math.max(segmentStart, from))
        }

        if (soonest < Infinity) return soonest
    }

    return Infinity
}

// Cached because the forward sweep is far too costly to redo for every row on
// every one-second tick. An entry stays valid until its `until` passes; the live
// weather in the key busts it early when a zone rerolls.
const nodeStateCache = new Map<string, NodeWindowState>()

function cachedNodeState(key: string, windows: Array<[number, number]>, rule: WeatherRule, now: number): NodeWindowState {
    const hit = nodeStateCache.get(key)
    if (hit && now < hit.until) return hit

    const state = holdsAt(windows, rule, now)
        ? { active: true, until: activeRunEnd(windows, rule, now) }
        : { active: false, until: nextSpawnAt(windows, rule, now) }

    if (nodeStateCache.size > 4000) nodeStateCache.clear()
    nodeStateCache.set(key, state)
    return state
}

function cacheKey(kind: string, node: any, rule: WeatherRule): string {
    return `${kind}|${node.ID}|${node.time}|${rule.required.join()}|${rule.chain.join()}|${rule.mapcode}|${rule.live?.weather}`
}

// Countdown to the node's next change of state: while spawned that's how much
// longer it stays up, otherwise how long until its conditions next line up.
// '—' means no spawn was found within the lookahead.
function nodeTimerLabel(kind: string, node: any, windows: Array<[number, number]>, rule: WeatherRule, now: number): string | null {
    const { active, until } = cachedNodeState(cacheKey(kind, node, rule), windows, rule, now)
    if (until === Infinity) return active ? null : '—'
    return formatDuration((until - now) / 1000)
}

// ── Sightseeing ─────────────────────────────────────────────────────────────
const SIGHTSEE_WEATHER_KEYS = ['weather1', 'weather2']

function sightseeParts(node: any, timerList: any[], weatherList: Record<string, any>, now: number) {
    return {
        windows: timerWindows(findTimer(timerList, node.time)),
        rule: weatherRule(node, weatherList, SIGHTSEE_WEATHER_KEYS, [], now),
    }
}

// null means the vista is gated by neither a time range nor weather, so there is
// no countdown to run. Pair with isSightseeActive to tell which direction it runs.
export function sightseeTimer(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): string | null {
    if (!node.time) return null
    const { windows, rule } = sightseeParts(node, timerList, weatherList, now)
    if (!windows.length && !rule.required.length) return null
    return nodeTimerLabel('vista', node, windows, rule, now)
}

// Companion to sightseeTimer, shaped for a class binding. Only a vista gated by
// both a time range and a weather condition can light up — missing either means
// it isn't a timed spawn worth highlighting, so bail before doing any work.
export function isSightseeActive(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): boolean {
    if (!node.time || !node.weather1) return false
    const { windows, rule } = sightseeParts(node, timerList, weatherList, now)
    return cachedNodeState(cacheKey('vista', node, rule), windows, rule, now).active
}

// ── Fishing ─────────────────────────────────────────────────────────────────
// Unlike vistas, a fishing hole can be gated by a timer alone, weather alone, or
// both, and its weather may be a transition: weatherchain1-3 is the weather that
// must be blowing *now*, having followed one of weather1-3 in the window before.
const FISH_WEATHER_KEYS = ['weather1', 'weather2', 'weather3']
const FISH_CHAIN_KEYS = ['weatherchain1', 'weatherchain2', 'weatherchain3']

// Holes absent from areas.json keep `area` as a bare fishing-hole name, so there
// is no mapcode and their weather can never be resolved. Reported once per area:
// these functions run for every visible row on every tick, so logging each call
// would bury the console.
const reportedFishAreas = new Set<string>()

function reportUnresolvableFishWeather(node: any) {
    const area = typeof node.area === 'string'
        ? node.area
        : node.spot ?? node.area?.zone ?? 'unknown'
    if (reportedFishAreas.has(area)) return
    reportedFishAreas.add(area)
    console.error(`Cannot weather using fishing area: ${area}`)
}

function fishParts(node: any, timerList: any[], weatherList: Record<string, any>, now: number) {
    const rule = weatherRule(node, weatherList, FISH_WEATHER_KEYS, FISH_CHAIN_KEYS, now)
    if (rule.required.length && !rule.mapcode) reportUnresolvableFishWeather(node)

    return {
        windows: timerWindows(findTimer(timerList, node.time)),
        rule,
    }
}

// null means the hole has neither a timer nor a weather requirement, so it is
// always up and there is nothing to count down.
export function fishTimer(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): string | null {
    const { windows, rule } = fishParts(node, timerList, weatherList, now)
    if (!windows.length && !rule.required.length) return null
    return nodeTimerLabel('fish', node, windows, rule, now)
}

// Companion to fishTimer, shaped for a class binding. A hole gated by neither a
// timer nor weather is always available and never highlighted.
export function isFishNodeActive(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): boolean {
    const { windows, rule } = fishParts(node, timerList, weatherList, now)
    if (!windows.length && !rule.required.length) return false
    return cachedNodeState(cacheKey('fish', node, rule), windows, rule, now).active
}

// ── Tracked nodes ───────────────────────────────────────────────────────────
// The tracking bar mixes all four trackable jobs, so each node is routed to the
// same timer its own page shows: vistas and fishing holes go through the window
// engine above, while mining and botany still read straight off the timer list.

export function isTrackedNodeActive(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): boolean {
    if (node.job === 'sightseeing') return isSightseeActive(node, timerList, weatherList, now)
    if (node.job === 'fishing') return isFishNodeActive(node, timerList, weatherList, now)
    return !!nodeTimeChecker(node, timerList, true)
}

export function trackedNodeTimer(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): string {
    if (node.job === 'sightseeing') {
        // Matches the vista page, which labels an untimed vista rather than
        // counting down to nothing.
        return node.time ? sightseeTimer(node, timerList, weatherList, now) ?? 'Any Time' : 'Any Time'
    }
    if (node.job === 'fishing') return fishTimer(node, timerList, weatherList, now) ?? 'Any Time'
    return nodeTimeChecker(node, timerList, false)
}


// Overview-table status cell: untimed nodes read "Any Time", mining/botany return
// their raw timer entry, and sightseeing resolves to "Active"/"Inactive" from both
// timer window and weather.
export function EorzeaMap (node: any, timerList: any[], weatherList: Record<string, any>) {
    if (!node.time) {return 'Any Time'}

    if (node.job == 'mining' || node.job == 'botany') {
        return node.time ? timerList.find((o: any) => o.ID === node.time) : undefined
    }

    if (node.job == 'sightseeing') {
        const time = timerList.find((o: any) => o.ID === node.time).stateActive
        const weather = (isWeatherMatch(weatherList, node.area.mapcode, node.weather1)
            || isWeatherMatch(weatherList, node.area.mapcode, node.weather2)) ? true : false
        return time && weather ? 'Active' : 'Inactive'
    }
}

// Dual-purpose timer lookup: with requestActiveState it returns the active flag
// (true/null), otherwise the countdown string ("Anytime" when the node is untimed).
export function nodeTimeChecker (
    node: any,
    timerList: any[],
    requestActiveState: boolean
) {
    if (!node.time) {
        return requestActiveState ? null : 'Anytime'
    }
    const id = node.time
    let timerListObj = timerList.find((o) => o.ID == id)
    if (requestActiveState) {return timerListObj.stateActive ? true : null}
    return timerListObj.countdown
}
