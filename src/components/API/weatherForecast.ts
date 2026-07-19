import EorzeaWeather from 'eorzea-weather'
import { getDawntrailWeather } from './weatherDawntrail'

export interface WeatherForecast {
    previous: { name: string; time: string }
    current: { name: string; time: string }
    next1: { name: string; time: string }
    next2: { name: string; time: string }
}

const weatherCycle = ['Clear Skies', 'Fair Skies', 'Clouds', 'Fog', 'Wind', 'Gales', 'Rain', 'Showers', 'Thunderstorms', 'Dust Storm', 'Snow', 'Blizzards', 'Gloom', 'Auroras', 'Darkness', 'Heavensward Meteors']

/**
 * Resolves weather for a zone at a given time. Tries the bundled
 * eorzea-weather library first (covers zones through Shadowbringers, plus
 * Eureka/Bozja), then the Dawntrail rate tables in ./weatherDawntrail.
 * Returns null if neither source recognizes the zone.
 */
function resolveWeather(zoneMapCode: string, date: Date): string | null {
    try {
        const libraryWeather = EorzeaWeather.getWeather(zoneMapCode, date)
        if (libraryWeather) return libraryWeather
    } catch (error) {
        console.warn(`Error getting weather for ${zoneMapCode}:`, error)
    }

    return getDawntrailWeather(zoneMapCode, date)
}

export function getWeatherForecast(zoneMapCode: string): WeatherForecast {
    const now = new Date()

    const currentWeather = resolveWeather(zoneMapCode, now)

    // If weather isn't available from either real data source, use fallback
    if (!currentWeather) {
        // Generate consistent weather using zone hash and time
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
