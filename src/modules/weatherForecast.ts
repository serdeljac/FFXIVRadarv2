import EorzeaWeather from 'eorzea-weather'
import { getRateTableWeather } from './weatherRates'

export interface WeatherForecast {
    previous: { name: string; time: string }
    current: { name: string; time: string }
    next1: { name: string; time: string }
    next2: { name: string; time: string }
}

const weatherCycle = ['Clear Skies', 'Fair Skies', 'Clouds', 'Fog', 'Wind', 'Gales', 'Rain', 'Showers', 'Thunderstorms', 'Dust Storm', 'Snow', 'Blizzards', 'Gloom', 'Auroras', 'Darkness', 'Heavensward Meteors']

// Zones the library doesn't know (Endwalker onwards). It throws for these every
// time, so the first failure is remembered — otherwise callers that sweep many
// windows ahead pay for a thrown exception and a console warning per lookup.
const zonesMissingFromLibrary = new Set<string>()

// Single source of truth for a zone's real weather: tries the eorzea-weather
// library first (through Shadowbringers plus Eureka/Bozja), falls back to the
// Endwalker/Dawntrail rate tables, and returns null when neither knows the zone.
export function resolveWeather(zoneMapCode: string, date: Date = new Date()): string | null {
    if (!zonesMissingFromLibrary.has(zoneMapCode)) {
        try {
            const libraryWeather = EorzeaWeather.getWeather(zoneMapCode, date)
            if (libraryWeather) return libraryWeather
        } catch {
            zonesMissingFromLibrary.add(zoneMapCode)
        }
    }

    return getRateTableWeather(zoneMapCode, date)
}

// Derives a zone's weather code from its display name (e.g. "Radz-at-Han" ->
// "radzAtHan"), dropping apostrophes to match the mapcode conventions used by
// areas.json and the eorzea-weather library.
function mapCodeFromZoneName(zoneName: string): string {
    return zoneName
        .toLowerCase()
        .replace(/'/g, '')
        .split(/[\s\-]+/)
        .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('')
}

// Whether any weather source recognises a code. Memoised: this decides the branch
// in zoneWeatherCode, which runs for every node on every tick.
const codeIsKnown = new Map<string, boolean>()

function isKnownWeatherCode(code: string): boolean {
    if (!code) return false
    const hit = codeIsKnown.get(code)
    if (hit !== undefined) return hit
    const known = resolveWeather(code, new Date()) !== null
    codeIsKnown.set(code, known)
    return known
}

// The weather code to look a zone up by, given whatever `area` row a node carries.
// The stored mapcode wins, but only if a weather source actually knows it: it is
// hand-maintained and a single character of drift (areas.json shipped "radzatHan"
// for "radzAtHan") would otherwise silently cost a zone its weather for good.
// Deriving from the zone name is the fallback, which also covers the sub-area rows
// that leave mapcode blank. Returns '' when there is nothing to go on — an
// unmatched node whose `area` is still the raw name string has no zone to derive.
export function zoneWeatherCode(area: any): string {
    if (!area || typeof area === 'string') return ''

    const mapcode: string = area.mapcode || ''
    if (mapcode && isKnownWeatherCode(mapcode)) return mapcode

    const derived = area.zone ? mapCodeFromZoneName(area.zone) : ''
    if (derived && isKnownWeatherCode(derived)) return derived

    return mapcode || derived
}

// Four-slot forecast (previous/current/next1/next2) at 8-hour steps. When a zone
// has no real weather data, it degrades to a deterministic cycle derived from a
// zone-name hash plus the current 8-hour slot, so the columns still stay stable.
export function getWeatherForecast(zoneMapCode: string): WeatherForecast {
    const now = new Date()

    const currentWeather = resolveWeather(zoneMapCode, now)

    if (!currentWeather) {
        const hash = zoneMapCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const timeSlots = Math.floor(now.getTime() / (8 * 60 * 60 * 1000))
        const weatherIndex = (hash + timeSlots) % weatherCycle.length

        return {
            previous: {
                name: weatherCycle[(weatherIndex - 1 + weatherCycle.length) % weatherCycle.length],
                time: 'Previous (8h ago)',
            },
            current: {
                name: weatherCycle[weatherIndex],
                time: 'Current',
            },
            next1: {
                name: weatherCycle[(weatherIndex + 1) % weatherCycle.length],
                time: 'Next (8h)',
            },
            next2: {
                name: weatherCycle[(weatherIndex + 2) % weatherCycle.length],
                time: 'After (16h)',
            },
        }
    }

    const get8HourBefore = new Date(now.getTime() - 8 * 60 * 60 * 1000)
    const previousWeather = resolveWeather(zoneMapCode, get8HourBefore)

    const get8HourAfter = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const nextWeather1 = resolveWeather(zoneMapCode, get8HourAfter)

    const get16HourAfter = new Date(now.getTime() + 16 * 60 * 60 * 1000)
    const nextWeather2 = resolveWeather(zoneMapCode, get16HourAfter)

    return {
        previous: {
            name: previousWeather || 'Unknown',
            time: 'Previous (8h ago)',
        },
        current: {
            name: currentWeather,
            time: 'Current',
        },
        next1: {
            name: nextWeather1 || 'Unknown',
            time: 'Next (8h)',
        },
        next2: {
            name: nextWeather2 || 'Unknown',
            time: 'After (16h)',
        },
    }
}

export function getWeatherHistory(zoneMapCode: string, hoursBack: number = 24): Array<{ name: string; timestamp: Date }> {
    const history = []
    const now = new Date()

    for (let i = 0; i <= hoursBack; i += 8) {
        const checkTime = new Date(now.getTime() - i * 60 * 60 * 1000)
        const weather = resolveWeather(zoneMapCode, checkTime)
        if (weather) {
            history.push({
                name: weather,
                timestamp: checkTime,
            })
        }
    }

    return history.reverse()
}

export function getWeatherForecasts(
    zoneMapCodes: string[]
): Record<string, WeatherForecast> {
    const forecasts: Record<string, WeatherForecast> = {}

    for (const code of zoneMapCodes) {
        try {
            forecasts[code] = getWeatherForecast(code)
        } catch (error) {
            console.warn(`Failed to get weather for ${code}:`, error)
        }
    }

    return forecasts
}
