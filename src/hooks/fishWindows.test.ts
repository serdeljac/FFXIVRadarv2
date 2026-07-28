import { describe, expect, it } from 'vitest'
import { fishTimer, isFishNodeActive } from './hooks.ts'
import { resolveWeather, zoneWeatherCode } from '../modules/weatherForecast'
import timerList from '../assets/json/data_timer.json'
import areasJson from '../assets/json/areas.json'
import fishingJson from '../assets/json/nodes_fishing.json'

const WEATHER_WINDOW_MS = 1_400_000
const areas = areasJson as any[]
const fishing = fishingJson as any[]

// A fixed instant so the weather every assertion depends on is deterministic.
const NOW = Date.UTC(2026, 6, 28, 12, 0, 0)
const windowMid = (index: number) => new Date(index * WEATHER_WINDOW_MS + WEATHER_WINDOW_MS / 2)
const weatherAt = (code: string, at: number) => resolveWeather(code, windowMid(Math.floor(at / WEATHER_WINDOW_MS)))

// App.vue's setFishingData: a hole's `area` is matched against areas.json, and
// unmatched ones keep the raw name string.
const areaFor = (name: string) =>
    areas.find((o) => o.area === name) ??
    areas.find((o) => o.point === name) ??
    areas.find((o) => o.zone === name) ??
    name

// App.vue's createWeatherList, keyed the same way the app keys it.
function buildWeatherList(at: number): Record<string, any> {
    const list: Record<string, any> = {}
    for (const area of areas) {
        const code = zoneWeatherCode(area)
        if (!code || code in list) continue
        list[code] = weatherAt(code, at) || false
    }
    return list
}

const weatherList = buildWeatherList(NOW)

const nodesOf = (expansion: string) =>
    fishing
        .filter((o) => o.expansion === expansion && (o.time || o.weather1))
        .map((o) => ({ ...o, spot: o.area, time: o.time || false, area: areaFor(o.area) }))

describe('fishing windows in zones with no mapcode', () => {
    it.each(['Endwalker', 'Dawntrail'])(
        'resolves a weather zone for every weather-gated %s hole',
        (expansion) => {
            const unresolved = nodesOf(expansion)
                .filter((n) => n.weather1 || n.weather2 || n.weather3)
                .filter((n) => !zoneWeatherCode(n.area))
                .map((n) => n.spot)

            // Every Endwalker and Dawntrail area row carries mapcode: "", so this is
            // exactly the case that used to leave all of them without a window.
            expect(unresolved).toEqual([])
        }
    )

    it('gives an Endwalker hole a real countdown rather than "—"', () => {
        // Thavnair's area rows have no mapcode, so this only works if the weather is
        // looked up by zone name.
        const node = {
            ID: 'test-thavnair-fog',
            job: 'fishing',
            time: false,
            area: { zone: 'Thavnair', mapcode: '' },
            weather1: 'Fog',
        }
        expect(zoneWeatherCode(node.area)).toBe('thavnair')
        expect(fishTimer(node, timerList as any[], weatherList, NOW)).not.toBe('—')
    })

    it('marks a hole active exactly when its zone weather is the one blowing', () => {
        const current = weatherAt('labyrinthos', NOW)!
        const other = ['Clear Skies', 'Fair Skies', 'Clouds', 'Rain'].find((w) => w !== current)!

        const matching = {
            ID: 'test-labyrinthos-match',
            job: 'fishing',
            time: false,
            area: { zone: 'Labyrinthos', mapcode: '' },
            weather1: current,
        }
        const mismatched = { ...matching, ID: 'test-labyrinthos-miss', weather1: other }

        expect(isFishNodeActive(matching, timerList as any[], weatherList, NOW)).toBe(true)
        expect(isFishNodeActive(mismatched, timerList as any[], weatherList, NOW)).toBe(false)
    })

    it('never reports a weather the zone cannot roll', () => {
        // Ultima Thule only has Astromagnetic Storms, Fair Skies and Umbral Wind, so
        // a hole asking for anything else can never open — the countdown must say so
        // rather than inventing one.
        const impossible = {
            ID: 'test-ultima-impossible',
            job: 'fishing',
            time: false,
            area: { zone: 'Ultima Thule', mapcode: '' },
            weather1: 'Blizzards',
        }
        expect(fishTimer(impossible, timerList as any[], weatherList, NOW)).toBe('—')
    })

    it('leaves at most one Endwalker hole without a window', () => {
        // The remaining one is a data error: Limne 18's Sophos Deka-okto asks for
        // Clear Skies, which Ultima Thule never rolls.
        const stuck = nodesOf('Endwalker')
            .filter((n) => fishTimer(n, timerList as any[], weatherList, NOW) === '—')
            .map((n) => n.name)

        expect(stuck).toEqual(['Sophos Deka-okto'])
    })
})
