import EorzeaWeather from 'eorzea-weather'

export interface WeatherForecast {
    previous: { name: string; time: string }
    current: { name: string; time: string }
    next1: { name: string; time: string }
    next2: { name: string; time: string }
}

export function getWeatherForecast(zoneMapCode: string): WeatherForecast {
    const now = new Date()
    const eorzea = EorzeaWeather

    const weatherList = eorzea.getWeatherList(zoneMapCode)
    if (!weatherList || weatherList.length === 0) {
        throw new Error(`Weather data not found for zone: ${zoneMapCode}`)
    }

    const currentWeather = eorzea.getWeather(zoneMapCode, now)
    if (!currentWeather) {
        throw new Error(`Unable to determine current weather for zone: ${zoneMapCode}`)
    }

    const get8HourBefore = new Date(now.getTime() - 8 * 60 * 60 * 1000)
    const previousWeather = eorzea.getWeather(zoneMapCode, get8HourBefore)

    const get8HourAfter = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const nextWeather1 = eorzea.getWeather(zoneMapCode, get8HourAfter)

    const get16HourAfter = new Date(now.getTime() + 16 * 60 * 60 * 1000)
    const nextWeather2 = eorzea.getWeather(zoneMapCode, get16HourAfter)

    return {
        previous: {
            name: previousWeather?.name || 'Unknown',
            time: 'Previous (8h ago)',
        },
        current: {
            name: currentWeather.name,
            time: 'Current',
        },
        next1: {
            name: nextWeather1?.name || 'Unknown',
            time: 'Next (8h)',
        },
        next2: {
            name: nextWeather2?.name || 'Unknown',
            time: 'After (16h)',
        },
    }
}

export function getWeatherHistory(zoneMapCode: string, hoursBack: number = 24): Array<{ name: string; timestamp: Date }> {
    const eorzea = EorzeaWeather
    const history = []
    const now = new Date()

    for (let i = 0; i <= hoursBack; i += 8) {
        const checkTime = new Date(now.getTime() - i * 60 * 60 * 1000)
        const weather = eorzea.getWeather(zoneMapCode, checkTime)
        if (weather) {
            history.push({
                name: weather.name,
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
