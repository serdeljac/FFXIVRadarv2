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

// One weather window is 8 Eorzea hours, which is 1400 real seconds — the same
// boundaries App.vue rebuilds weatherList on (0/8/16 ET).
const WEATHER_WINDOW_MS = 1400 * 1000

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
