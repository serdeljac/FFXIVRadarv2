/**
 * Weather-rate tables and forecast algorithm for Dawntrail zones.
 *
 * The bundled 'eorzea-weather' npm package (v3.2.0, last published May 2022
 * with no newer version since) predates Dawntrail, so it has no data for
 * these 8 zones. Without this module, getWeatherForecast() silently fell
 * back to a fake hash-based pattern for them — which only changed every 8
 * *real* hours (instead of every 8 Eorzea hours, ~23 real minutes, like
 * every other zone), making them appear frozen, and never matched actual
 * game weather.
 *
 * This module reimplements the same public, community-documented FFXIV
 * weather algorithm that 'eorzea-weather' itself uses internally — verified
 * to produce byte-identical target values against eorzea-weather's own
 * output across 20,000 sampled weather periods (see verification notes in
 * project history) — and pairs it with weather-rate tables for the 8
 * Dawntrail zones.
 *
 * Rate table data source: Asvel/ffxiv-weather (actively maintained, see
 * https://github.com/Asvel/ffxiv-weather/blob/master/src/Weather.ts), whose
 * own target-calculation algorithm independently matches the one below.
 * Weather *type sets* were cross-checked against zone weather-icon listings
 * on the FFXIV community wiki (consolegameswiki.com / gamerescape.com) for
 * all 8 zones; Solution Nine's single fixed "Fair Skies" weather and the
 * other 7 zones' weather-type sets matched exactly. Living Memory is the one
 * zone with a conflicting signal: one wiki briefly listed a 5th weather type
 * ("Reminiscence") not present in Asvel's table or in Gamer Escape's listing
 * (which matches Asvel's 4 types exactly) — worth spot-checking in-game if
 * you notice Living Memory's forecast ever looks wrong.
 */

// Ordered [weatherName, cumulativeUpperBound] pairs. A forecast "target"
// (0-99) resolves to the first entry whose upperBound is greater than the
// target — i.e. entries are checked in order and bounds are cumulative,
// exactly like the rate tables 'eorzea-weather' uses for its own zones.
type WeatherRateEntry = [name: string, upperBound: number]

const DAWNTRAIL_WEATHER_RATES: Record<string, WeatherRateEntry[]> = {
    tuliyollal: [['Clear Skies', 40], ['Fair Skies', 80], ['Clouds', 85], ['Fog', 95], ['Rain', 100]],
    urqopacha: [['Clear Skies', 20], ['Fair Skies', 50], ['Clouds', 70], ['Fog', 80], ['Wind', 90], ['Snow', 100]],
    kozamauka: [['Clear Skies', 25], ['Fair Skies', 60], ['Clouds', 75], ['Fog', 85], ['Rain', 95], ['Showers', 100]],
    yakTel: [['Clear Skies', 15], ['Fair Skies', 55], ['Clouds', 70], ['Fog', 85], ['Rain', 100]],
    solutionNine: [['Fair Skies', 100]],
    shaaloani: [['Clear Skies', 5], ['Fair Skies', 50], ['Clouds', 70], ['Dust Storms', 85], ['Gales', 100]],
    heritageFound: [['Fair Skies', 5], ['Clouds', 25], ['Fog', 40], ['Rain', 45], ['Thunderstorms', 50], ['Umbral Static', 100]],
    livingMemory: [['Rain', 10], ['Fog', 20], ['Clouds', 40], ['Fair Skies', 100]],
}

export const DAWNTRAIL_ZONE_CODES: string[] = Object.keys(DAWNTRAIL_WEATHER_RATES)

/**
 * Standard Eorzea-weather target algorithm: real-world time -> a 0-99
 * "target" value that zone rate tables resolve to a weather name. Bell
 * changes every 175 real seconds (1 Eorzea hour); the target itself only
 * changes once per 8-Eorzea-hour weather window (1400 real seconds).
 */
function calcWeatherTarget(date: Date): number {
    const unixSeconds = Math.floor(date.getTime() / 1000)
    const bell = Math.trunc(unixSeconds / 175)
    const totalDays = Math.trunc(unixSeconds / 4200) >>> 0
    const increment = (bell + 8 - (bell % 8)) % 24
    const calcBase = totalDays * 100 + increment
    const step1 = ((calcBase << 11) ^ calcBase) >>> 0
    const step2 = ((step1 >>> 8) ^ step1) >>> 0
    return step2 % 100
}

/** Returns the Dawntrail weather name for `zoneMapCode` at `date`, or null if the zone isn't one of the 8 covered here. */
export function getDawntrailWeather(zoneMapCode: string, date: Date): string | null {
    const rates = DAWNTRAIL_WEATHER_RATES[zoneMapCode]
    if (!rates) return null

    const target = calcWeatherTarget(date)
    for (const [name, upperBound] of rates) {
        if (target < upperBound) return name
    }
    // Unreachable — the last entry's upperBound is always 100 — but keeps TS happy and fails safe.
    return rates[rates.length - 1][0]
}
