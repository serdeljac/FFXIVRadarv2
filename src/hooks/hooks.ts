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
