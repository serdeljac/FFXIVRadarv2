// Weather-rate tables and forecast algorithm for the 8 Dawntrail zones that the
// eorzea-weather package (last updated 2022) predates and cannot cover. Each
// entry is an ordered [weatherName, cumulativeUpperBound] pair: a 0-99 forecast
// target resolves to the first entry whose upperBound exceeds it. Rates come from
// Asvel/ffxiv-weather; weather-type sets were cross-checked against community wikis.
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

// Standard Eorzea weather-target algorithm: hashes real-world time into a 0-99
// value the rate tables resolve to a weather name. The target only changes once
// per 8-Eorzea-hour window; the bit-mixing steps mirror the game's own formula.
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

// Dawntrail weather name for a zone at a given time, or null when the zone isn't
// one of the 8 covered here.
export function getDawntrailWeather(zoneMapCode: string, date: Date): string | null {
    const rates = DAWNTRAIL_WEATHER_RATES[zoneMapCode]
    if (!rates) return null

    const target = calcWeatherTarget(date)
    for (const [name, upperBound] of rates) {
        if (target < upperBound) return name
    }
    return rates[rates.length - 1][0]
}
