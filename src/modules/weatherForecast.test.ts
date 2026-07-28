import { describe, expect, it } from 'vitest'
import { resolveWeather, zoneWeatherCode } from './weatherForecast'
import areas from '../assets/json/areas.json'

const ENDWALKER_AND_DAWNTRAIL_ZONES = [
    'Old Sharlayan', 'Radz-at-Han', 'Labyrinthos', 'Thavnair',
    'Garlemald', 'Mare Lamentorum', 'Elpis', 'Ultima Thule',
    'Tuliyollal', 'Solution Nine', 'Urqopacha', "Kozama'uka",
    "Yak T'el", 'Shaaloani', 'Heritage Found', 'Living Memory',
]

describe('zoneWeatherCode', () => {
    it('prefers an explicit mapcode', () => {
        expect(zoneWeatherCode({ zone: 'Central Thanalan', mapcode: 'centralThanalan' })).toBe('centralThanalan')
    })

    it('derives the code from the zone name when the mapcode is blank', () => {
        // Sub-area rows (fishing holes, gathering points) carry mapcode: "", and no
        // Endwalker or Dawntrail area row has one at all.
        expect(zoneWeatherCode({ zone: 'Thavnair', mapcode: '' })).toBe('thavnair')
        expect(zoneWeatherCode({ zone: 'Radz-at-Han', mapcode: '' })).toBe('radzAtHan')
        expect(zoneWeatherCode({ zone: 'Old Sharlayan', mapcode: '' })).toBe('oldSharlayan')
        expect(zoneWeatherCode({ zone: "Kozama'uka", mapcode: '' })).toBe('kozamauka')
        expect(zoneWeatherCode({ zone: "Yak T'el", mapcode: '' })).toBe('yakTel')
        expect(zoneWeatherCode({ zone: 'Mare Lamentorum' })).toBe('mareLamentorum')
    })

    it('returns an empty string when there is nothing to derive from', () => {
        // Fishing holes missing from areas.json keep `area` as the raw name string.
        expect(zoneWeatherCode('Blustery Cloudtop')).toBe('')
        expect(zoneWeatherCode(undefined)).toBe('')
        expect(zoneWeatherCode(null)).toBe('')
        expect(zoneWeatherCode({ zone: '', mapcode: '' })).toBe('')
    })
})

describe('resolveWeather', () => {
    it('resolves every Endwalker and Dawntrail zone', () => {
        // These are the zones the eorzea-weather library predates; before the rate
        // tables covered them their nodes could never match a weather condition.
        for (const zone of ENDWALKER_AND_DAWNTRAIL_ZONES) {
            const code = zoneWeatherCode({ zone })
            expect(resolveWeather(code, new Date()), zone).not.toBeNull()
        }
    })

    it('resolves every zone in areas.json except The Gold Saucer', () => {
        const unresolved = new Set<string>()
        for (const area of areas as any[]) {
            if (!area.zone) continue
            const code = zoneWeatherCode(area)
            if (!code || resolveWeather(code, new Date()) === null) unresolved.add(area.zone)
        }
        // The Gold Saucer has no weather of its own and the pages exclude it.
        expect([...unresolved]).toEqual(['The Gold Saucer'])
    })

    it('still answers from the library for pre-Endwalker zones', () => {
        expect(resolveWeather('centralThanalan', new Date())).not.toBeNull()
        expect(resolveWeather('theRubySea', new Date())).not.toBeNull()
    })
})
