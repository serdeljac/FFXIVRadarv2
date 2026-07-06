import * as cheerio from 'cheerio'

const CHARACTER_ID = process.env.LODESTONE_CHARACTER_ID || '48930632'
const REGION = process.env.LODESTONE_REGION || 'na'
const PROFILE_URL = `https://${REGION}.finalfantasyxiv.com/lodestone/character/${CHARACTER_ID}/`
const CLASS_JOB_URL = `${PROFILE_URL}class_job/`

const CACHE_TTL_MS = 30 * 60 * 1000
export const EDGE_CACHE_HEADER = 'public, s-maxage=1800, stale-while-revalidate=3600'

const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const MAGICAL_RANGED_JOBS = new Set(['Black Mage', 'Summoner', 'Red Mage', 'Pictomancer', 'Blue Mage'])

export interface JobLevel {
    job: string
    role: string | null
    level: number | null
    icon: string | null
}

export interface CharacterPayload {
    id: string
    name: string
    title: string | null
    world: string | null
    dataCenter: string | null
    avatar: string | null
    portrait: string | null
    race: string | null
    clan: string | null
    gender: string | null
    nameday: string | null
    guardian: string | null
    cityState: string | null
    grandCompany: string | null
    grandCompanyRank: string | null
    freeCompany: string | null
    activeJob: {
        name: string | null
        icon: string | null
        level: number | null
    }
    levels: JobLevel[]
    fetchedAt: string
}

let cache: { data: CharacterPayload; expiresAt: number } | null = null

export async function getCharacter(): Promise<CharacterPayload> {
    if (cache && cache.expiresAt > Date.now()) {
        return cache.data
    }

    try {
        const data = await fetchCharacter()
        cache = { data, expiresAt: Date.now() + CACHE_TTL_MS }
        return data
    } catch (err) {
        if (cache) return cache.data
        throw err
    }
}

async function loadPage(url: string): Promise<ReturnType<typeof cheerio.load>> {
    const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-US,en;q=0.9' },
    })
    if (!res.ok) throw new Error(`Lodestone request failed (${res.status})`)
    return cheerio.load(await res.text())
}

async function fetchCharacter(): Promise<CharacterPayload> {
    const $ = await loadPage(PROFILE_URL)

    const name = $('.frame__chara__name').first().text().trim()
    if (!name) throw new Error('Could not find character on Lodestone (page layout may have changed)')

    const title = $('.frame__chara__title').first().text().trim() || null

    const worldText = $('.frame__chara__world').first().text().trim()
    const worldMatch = /(\w+)\s*\[(\w+)]/.exec(worldText)
    const world = worldMatch?.[1] ?? worldText ?? null
    const dataCenter = worldMatch?.[2] ?? null

    const avatar = $('.frame__chara__face img').first().attr('src') ?? null
    const portrait = $('.js__image_popup img').first().attr('src') ?? avatar

    const blockValue = (label: string): string => {
        let value = ''
        $('.character-block__title').each((_, el) => {
            const $title = $(el)
            if ($title.text().trim().toLowerCase() !== label.toLowerCase()) return
            const $next = $title.next()
            if ($next.is('.character-block__name') || $next.is('.character-block__birth')) {
                value = $next.text().trim()
            }
        })
        return value
    }

    const raceClanGenderBlock = $('.character-block')
        .filter((_, el) => /race\/clan\/gender/i.test($(el).text()))
        .first()
    const raceClanGenderText = raceClanGenderBlock.find('.character-block__name').first().html() ?? ''
    const raceClanGenderMatch = /(.*?)<br\s*\/?>\s*(.*?)\s*\/\s*(.+)/is.exec(raceClanGenderText)
    const race = raceClanGenderMatch?.[1]?.trim() ?? null
    const clan = raceClanGenderMatch?.[2]?.trim() ?? null
    const gender = raceClanGenderMatch?.[3]?.replace(/<[^>]+>/g, '').trim() ?? null

    const nameday = blockValue('Nameday') || null
    const guardian = blockValue('Guardian') || null
    const cityState = blockValue('City-state') || null

    const grandCompanyText = blockValue('Grand Company')
    const grandCompanyMatch = /(.+?)\s*\/\s*(.+)/.exec(grandCompanyText)
    const grandCompany = grandCompanyMatch?.[1]?.trim() ?? grandCompanyText ?? null
    const grandCompanyRank = grandCompanyMatch?.[2]?.trim() ?? null

    const freeCompany = $('.character__freecompany__name h4').first().text().trim() || null

    const activeJobIcon = $('.character__class_icon img').first().attr('src') ?? null
    const activeJobLevelMatch = /LEVEL\s*(\d+)/i.exec($('.character__class__data p').first().text())
    const activeJobLevel = activeJobLevelMatch ? Number(activeJobLevelMatch[1]) : null

    const $cj = await loadPage(CLASS_JOB_URL)
    const levels: JobLevel[] = []
    $cj('.character__job__role').each((_, roleEl) => {
        const $role = $cj(roleEl)
        const role = $role.find('h4').first().text().trim() || null

        $role.find('.character__job li').each((_, el) => {
            const $li = $cj(el)
            const job = $li.find('.character__job__name').first().text().trim()
            if (!job) return

            const levelText = $li.find('.character__job__level').first().text().trim()
            const icon = $li.find('.character__job__icon img').first().attr('src') ?? null

            levels.push({
                job,
                role: MAGICAL_RANGED_JOBS.has(job) ? 'Magical Ranged DPS' : role,
                level: !levelText || levelText === '-' ? null : Number(levelText),
                icon,
            })
        })
    })

    const activeJob = {
        name: levels.find((l) => l.icon === activeJobIcon)?.job ?? null,
        icon: activeJobIcon,
        level: activeJobLevel,
    }

    return {
        id: CHARACTER_ID,
        name,
        title,
        world,
        dataCenter,
        avatar,
        portrait,
        race,
        clan,
        gender,
        nameday,
        guardian,
        cityState,
        grandCompany,
        grandCompanyRank,
        freeCompany,
        activeJob,
        levels,
        fetchedAt: new Date().toISOString(),
    }
}
