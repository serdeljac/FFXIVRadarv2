import { resolveWeather } from '../components/api/weatherForecast'

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

// ── Sightseeing ─────────────────────────────────────────────────────────────
// A vista needs its ET time range and its zone weather to line up at the same
// moment, so "when does this next spawn" can't be read off the timer alone —
// weather has to be predicted forward window by window.

interface NodeWindowState {
    active: boolean
    /** Timestamp the current state flips at; Infinity when nothing is scheduled. */
    until: number
}

// Cached because the forward sweep is far too costly to redo for every vista on
// every one-second tick. The answer only changes once `until` passes, so entries
// stay valid until then; the weather key busts the cache when a zone rerolls.
const sightseeStateCache = new Map<string, NodeWindowState>()

function sightseeCacheKey(node: any, weatherList: Record<string, any>): string {
    const mapcode = node.area?.mapcode ?? ''
    return `${node.ID}|${node.time}|${node.weather1}|${node.weather2}|${mapcode}|${weatherList[mapcode]}`
}

// How long an already-spawned vista stays up. Both constraints are piecewise
// constant, so this walks boundary to boundary and keeps going while they still
// hold — a run can outlast the window it started in, either because the timer
// wraps midnight (18 -> 2 is stored as two intervals) or because consecutive
// weather windows both satisfy the node. Infinity means nothing ever ends it.
function activeRunEnd(
    windows: Array<[number, number]>,
    accepted: string[],
    mapcode: string | undefined,
    from: number,
): number {
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
        if (accepted.length) {
            const windowIndex = Math.floor(at / WEATHER_WINDOW_MS)
            if (!accepted.includes(weatherAtWindow(mapcode as string, windowIndex) as string)) return at
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

// Resolves whether a vista is spawned right now and when that changes. Current
// weather is read from weatherList (the same source displayWeather.vue highlights
// from, so the row and the weather text can never disagree); only *future*
// windows go through resolveWeather.
function sightseeState(node: any, timerList: any[], weatherList: Record<string, any>, now: number): NodeWindowState {
    const windows = timerWindows(findTimer(timerList, node.time))
    const accepted = [node.weather1, node.weather2].filter(Boolean)
    const mapcode = node.area?.mapcode
    const etNow = eorzeaMinuteAt(now)

    const timeOk = !windows.length || inWindows(windows, etNow)
    const weatherOk = !accepted.length || (!!mapcode && accepted.includes(weatherList[mapcode]))

    if (timeOk && weatherOk) {
        return { active: true, until: activeRunEnd(windows, accepted, mapcode, now) }
    }

    // A weather-gated vista with no mapcode can never be resolved.
    if (accepted.length && !mapcode) return { active: false, until: Infinity }

    // Walk forward a weather window at a time, and inside each one intersect the
    // ET minutes it spans with the node's time ranges.
    const firstWindow = Math.floor(now / WEATHER_WINDOW_MS)
    const segments = windows.length ? windows : [[0, ET_DAY_MINUTES] as [number, number]]

    for (let i = 0; i < MAX_LOOKAHEAD_WINDOWS; i++) {
        const windowIndex = firstWindow + i
        if (accepted.length && !accepted.includes(weatherAtWindow(mapcode, windowIndex) as string)) continue

        const windowStart = windowIndex * WEATHER_WINDOW_MS
        const etBase = (windowIndex % 3) * WEATHER_WINDOW_MINUTES
        let soonest = Infinity

        for (const [s, e] of segments) {
            const lo = Math.max(s, etBase)
            const hi = Math.min(e, etBase + WEATHER_WINDOW_MINUTES)
            if (lo >= hi) continue
            const segmentEnd = windowStart + (hi - etBase) * ET_MINUTE_MS
            if (segmentEnd <= now) continue
            const segmentStart = windowStart + (lo - etBase) * ET_MINUTE_MS
            // Clamped so a segment straddling `now` can never report negative time.
            soonest = Math.min(soonest, Math.max(segmentStart, now))
        }

        if (soonest < Infinity) return { active: false, until: soonest }
    }

    return { active: false, until: Infinity }
}

function cachedSightseeState(node: any, timerList: any[], weatherList: Record<string, any>, now: number): NodeWindowState {
    const key = sightseeCacheKey(node, weatherList)
    const hit = sightseeStateCache.get(key)
    if (hit && now < hit.until) return hit

    const state = sightseeState(node, timerList, weatherList, now)
    if (sightseeStateCache.size > 2000) sightseeStateCache.clear()
    sightseeStateCache.set(key, state)
    return state
}

// Vista countdown to the next change of state: while spawned that's how much
// longer it stays up, otherwise how long until the time range and zone weather
// next line up. null means the vista is gated by neither, so there is no
// countdown to run; '—' means no spawn was found within the lookahead.
// Pair with isSightseeActive to tell which direction the countdown is running.
export function sightseeTimer(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): string | null {
    if (!node.time) return null
    const gatedByTime = timerWindows(findTimer(timerList, node.time)).length > 0
    const gatedByWeather = !!(node.weather1 || node.weather2)
    if (!gatedByTime && !gatedByWeather) return null

    const { active, until } = cachedSightseeState(node, timerList, weatherList, now)
    // Only an exhausted lookahead reaches Infinity here, since an ungated vista
    // already returned above.
    if (until === Infinity) return active ? null : '—'
    return formatDuration((until - now) / 1000)
}

// Companion to sightseeTimer, shaped for a class binding. Only a vista gated by
// both a time range and a weather condition can light up — missing either means
// it isn't a timed spawn worth highlighting, so bail before doing any work.
export function isSightseeActive(node: any, timerList: any[], weatherList: Record<string, any>, now = Date.now()): boolean {
    if (!node.time || !node.weather1) return false
    return cachedSightseeState(node, timerList, weatherList, now).active
}

// Active state for a timed fishing hole. The timer window must always be open,
// and on top of that:
//   - no weather requirement  -> active on the timer alone
//   - weather but no chain    -> the zone's current weather must be one of weather1-3
//   - weather chain           -> the current weather must be one of weatherchain1-3
//                                *and* the window before it one of weather1-3
// Returns true/null (not false) so it can drive a `data-` attribute directly.
export function isFishNodeActive(node: any, timerList: any[], weatherList: Record<string, any>): true | null {
    if (!isTimerActive(timerList, node.time)) return null

    const requiredWeather = [node.weather1, node.weather2, node.weather3].filter(Boolean)
    if (!requiredWeather.length) return true

    // Fishing holes missing from areas.json keep `area` as a bare string, so there
    // is no mapcode to resolve weather against.
    const mapcode = node.area?.mapcode
    if (!mapcode) return null

    const currentWeather = weatherList[mapcode]
    if (!node.weatherchain1) {
        return requiredWeather.includes(currentWeather) ? true : null
    }

    const chainWeather = [node.weatherchain1, node.weatherchain2, node.weatherchain3].filter(Boolean)
    if (!chainWeather.includes(currentWeather)) return null

    const previousWeather = resolveWeather(mapcode, new Date(Date.now() - WEATHER_WINDOW_MS))
    return requiredWeather.includes(previousWeather) ? true : null
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
