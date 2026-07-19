// Shared helper functions used across multiple components.
// Anything reused in more than one file (or generic enough that it should be)
// belongs here rather than being copy-pasted between components.

/** Capitalizes the first letter of a string; returns '' for falsy input. */
export function capitalize(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
}

/** Filters an array down to the first occurrence of each unique value of `key`. */
export function getUniqueByKey(array: any[], key: string): any[] {
    const seen = new Set()
    return array.filter(obj => {
        if (seen.has(obj[key])) return false
        seen.add(obj[key])
        return true
    })
}

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

/**
 * "Region > Zone" for a node's area. Fishing holes are named spots rather than
 * zones and only some of them exist in areas.json; the rest keep their raw name
 * as `area`, which is all there is to show for them.
 */
export function formatAreaLabel(area: any): string {
    if (!area) return ''
    return typeof area === 'string' ? area : `${area.region} > ${area.zone}`
}

/** Zero-pads a number below 10 to two digits (e.g. Eorzea clock minutes). */
export function padNumber(num: number): string {
    return num < 10 ? `0${num}` : `${num}`
}

/** Repeats the star glyph `count` times (clamped to non-negative). */
export function formatStars(count: number): string {
    return '★'.repeat(Math.max(0, count ?? 0))
}

export function formatTug(count: number): string {
    return '!'.repeat(Math.max(0, count ?? 0))
}

/** Looks up a timer entry from `timerList` by ID. */
export function findTimer(timerList: any[], id: any): any {
    return id ? timerList.find((o: any) => o.ID === id) : undefined
}

/** Whether the timer with the given ID is currently in its active window. */
export function isTimerActive(timerList: any[], id: any): boolean {
    return !!findTimer(timerList, id)?.stateActive
}

/** Countdown display string for a timer ID, or 'Any Time' if there's no active timer. */
export function getTimerCountdown(timerList: any[], id: any): string {
    return findTimer(timerList, id)?.countdown ?? 'Any Time'
}

/** Whether the current weather for `mapcode` matches the given weather name. */
export function isWeatherMatch(weatherList: Record<string, any>, mapcode: string, weather?: string | false): boolean {
    return !!weather && weatherList[mapcode] === weather
}

/**
 * Whether a node is "active" right now: its timer window is open, and (for
 * sightseeing nodes, which also require the right weather) the current
 * weather matches one of its two accepted conditions.
 */
export function isNodeActive(node: any, timerList: any[], weatherList: Record<string, any>): boolean | null {
    const timerState = isTimerActive(timerList, node.time) ? true : null

    if (node.job === 'sightseeing') {
        const weatherState = (isWeatherMatch(weatherList, node.area.mapcode, node.weather1)
            || isWeatherMatch(weatherList, node.area.mapcode, node.weather2)) ? true : null
        return timerState && weatherState ? true : null
    }
    return timerState
}


export function EorzeaMap (node: any, timerList: any[], weatherList: Record<string, any>) {
    if (!node.time) {return 'Any Time'}

    //Mining and Botany Checks
    if (node.job == 'mining' || node.job == 'botany') {
        return node.time ? timerList.find((o: any) => o.ID === node.time) : undefined
    }

    //Sightseeing Checks
    if (node.job == 'sightseeing') {
        const time = timerList.find((o: any) => o.ID === node.time).stateActive
        const weather = (isWeatherMatch(weatherList, node.area.mapcode, node.weather1)
            || isWeatherMatch(weatherList, node.area.mapcode, node.weather2)) ? true : false
        console.log(weather, time)
        return time && weather ? 'Active' : 'Inactive'
    }
    //Return Active, Inactive, Any
}