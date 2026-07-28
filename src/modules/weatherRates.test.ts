import { describe, expect, it } from 'vitest'
import { getRateTableWeather } from './weatherRates'

// One weather window is 8 Eorzea hours = 1,400,000 real ms, anchored to the epoch.
const WEATHER_WINDOW_MS = 1_400_000
const midWindow = (index: number) => new Date(index * WEATHER_WINDOW_MS + WEATHER_WINDOW_MS / 2)
const nowWindow = Math.floor(Date.now() / WEATHER_WINDOW_MS)

// The weather each zone can actually roll, straight from the game's WeatherRate
// sheet. Anything outside these sets means a rate table was mistranscribed.
const ZONE_WEATHERS: Record<string, string[]> = {
    // Endwalker
    oldSharlayan: ['Clear Skies', 'Fair Skies', 'Clouds', 'Fog', 'Snow'],
    radzAtHan: ['Fog', 'Rain', 'Clear Skies', 'Fair Skies', 'Clouds'],
    labyrinthos: ['Clear Skies', 'Fair Skies', 'Clouds', 'Rain'],
    thavnair: ['Fog', 'Rain', 'Showers', 'Clear Skies', 'Fair Skies', 'Clouds'],
    garlemald: ['Snow', 'Thunder', 'Rain', 'Fog', 'Clouds', 'Fair Skies', 'Clear Skies'],
    mareLamentorum: ['Umbral Wind', 'Moon Dust', 'Fair Skies'],
    elpis: ['Clouds', 'Umbral Wind', 'Fair Skies', 'Clear Skies'],
    ultimaThule: ['Astromagnetic Storms', 'Fair Skies', 'Umbral Wind'],
    // Dawntrail
    tuliyollal: ['Clear Skies', 'Fair Skies', 'Clouds', 'Fog', 'Rain'],
    urqopacha: ['Clear Skies', 'Fair Skies', 'Clouds', 'Fog', 'Wind', 'Snow'],
    kozamauka: ['Clear Skies', 'Fair Skies', 'Clouds', 'Fog', 'Rain', 'Showers'],
    yakTel: ['Clear Skies', 'Fair Skies', 'Clouds', 'Fog', 'Rain'],
    solutionNine: ['Fair Skies'],
    shaaloani: ['Clear Skies', 'Fair Skies', 'Clouds', 'Dust Storms', 'Gales'],
    heritageFound: ['Fair Skies', 'Clouds', 'Fog', 'Rain', 'Thunderstorms', 'Umbral Static'],
    livingMemory: ['Rain', 'Fog', 'Clouds', 'Fair Skies'],
}

describe('getRateTableWeather', () => {
    it('returns null for a zone the tables do not cover', () => {
        // Pre-Endwalker zones are the eorzea-weather library's job, not this module's.
        expect(getRateTableWeather('centralThanalan', new Date())).toBeNull()
        expect(getRateTableWeather('', new Date())).toBeNull()
    })

    it('covers all 8 Endwalker and all 8 Dawntrail zones', () => {
        for (const code of Object.keys(ZONE_WEATHERS)) {
            expect(getRateTableWeather(code, new Date()), code).not.toBeNull()
        }
    })

    it.each(Object.entries(ZONE_WEATHERS))(
        'only ever rolls a weather %s actually has',
        (code, allowed) => {
            const rolled = new Set<string>()
            for (let i = 0; i < 600; i++) rolled.add(getRateTableWeather(code, midWindow(nowWindow + i))!)
            for (const weather of rolled) expect(allowed, `${code} rolled ${weather}`).toContain(weather)
        }
    )

    it('holds one weather for the whole 8-hour window and rerolls on the boundary', () => {
        // Endwalker's Garlemald has 7 weather types, so 400 windows are certain to
        // contain a change — a table stuck on one value would fail the second half.
        const index = nowWindow
        const start = getRateTableWeather('garlemald', new Date(index * WEATHER_WINDOW_MS))
        const end = getRateTableWeather('garlemald', new Date((index + 1) * WEATHER_WINDOW_MS - 1))
        expect(end).toBe(start)

        const distinct = new Set<string>()
        for (let i = 0; i < 400; i++) distinct.add(getRateTableWeather('garlemald', midWindow(index + i))!)
        expect(distinct.size).toBeGreaterThan(1)
    })

    it('follows the rate table proportions', () => {
        // Solution Nine is Fair Skies 100% of the time, and Ultima Thule rolls
        // Astromagnetic Storms on 15% of windows — a shifted cumulative bound would
        // move that share well outside this tolerance.
        const samples = 4000
        for (let i = 0; i < samples; i++) {
            expect(getRateTableWeather('solutionNine', midWindow(nowWindow + i))).toBe('Fair Skies')
        }

        let storms = 0
        for (let i = 0; i < samples; i++) {
            if (getRateTableWeather('ultimaThule', midWindow(nowWindow + i)) === 'Astromagnetic Storms') storms++
        }
        expect(storms / samples).toBeGreaterThan(0.11)
        expect(storms / samples).toBeLessThan(0.19)
    })
})
