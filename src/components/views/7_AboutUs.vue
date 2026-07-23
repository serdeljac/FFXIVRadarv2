<template>
    <div :class="[`aboutUs body_content`, windowWidth]">
        
        <!-- Header -->
        <PageHeader :title="`About Us`" :tagline="pageTagLine" icon="about"/>

        <div class="body_content-group">

                <div class="about">

                <h2>What is FFXIV Radar?</h2>
                <p>
                    FFXIV Radar is a free, community-built companion tool for players of Final Fantasy XIV Online. It brings together essential in-game information — timed gathering nodes, sightseeing log locations, aether current quests, fate spawn points, elite hunt marks, and Blue Mage ability sources — into a single, easy-to-use reference that you can keep open alongside the game.
                </p>

                <h2>Who made it?</h2>
                <p>
                    This site was created by a FFXIV player and web developer based in British Columbia, Canada. I started playing FFXIV shortly after its original launch and have been adventuring through Eorzea ever since — all the way through A Realm Reborn, Heavensward, Stormblood, Shadowbringers, Endwalker, and Dawntrail. The frustration of constantly alt-tabbing to wikis and spreadsheets was the spark that led to building FFXIV Radar.
                </p>
                <p>
                    The site was built from scratch using Vite, Vue 3, and TypeScript. Most of the underlying data was collected manually during my own playthroughs — documented in spreadsheets and then converted to structured JSON — so every entry has been personally verified in-game. Weather data is powered by the eorzea-weather library, which accurately replicates the Eorzea weather simulation engine.
                </p>

                <h2>What tools does FFXIV Radar include?</h2>
                <ul>
                    <li><strong>Eorzea Overview</strong> — An interactive zone map showing gathering nodes, sightseeing vistas, fate spawn locations, elite hunt marks, and aether currents for every zone in the game. Switch zones from the built-in zone picker or use the search bar to find any resource by name.</li>
                    <li><strong>Timed Mining &amp; Botany</strong> — A filterable, paginated list of all timed gathering nodes (unspoiled nodes and ephemeral nodes), showing spawn windows, locations, item yields, and whether you’re currently tracking them.</li>
                    <li><strong>Sightseeing Log</strong> — A full tracker for the in-game Sightseeing Log quest, covering all expansions. Each entry includes the required weather, time of day, emote, and mount conditions, plus preview images for the vista location.</li>
                    <li><strong>Aether Currents</strong> — A checklist of every aether current quest and field current location, organised by expansion and region, so you can track which zones you’ve fully attuned.</li>
                    <li><strong>Blue Mage Abilities</strong> — A reference table listing every Blue Magic spell, the enemy or NPC you need to learn it from, the minimum level required, and the location where that enemy can be found.</li>
                </ul>

                <h2>How is the data maintained?</h2>
                <p>
                    Data is updated manually as new FFXIV patches and expansions release. Because the information is hand-verified rather than scraped from external databases, it tends to be more accurate for edge cases — things like exact node coordinates, correct emote conditions for sightseeing vistas, and Blue Mage enemy locations that wikis sometimes get wrong. Check the <strong>FFXIV Radar News</strong> section for a log of all recent data additions and corrections.
                </p>

                <h2>Is it free?</h2>
                <p>
                    Yes, completely free with no registration required. If FFXIV Radar has saved you time or helped you complete a tricky log entry, a small coffee donation via PayPal is always appreciated — it helps cover hosting costs and motivates future updates.
                </p>

                <p>Yours truly, the Almighty Viera — 2026.</p>
            </div>
        </div>

        <div class="body_content-group">
            <div class="charCard">

                <div v-if="charLoading" class="charCard_state">
                    <div class="charCard_spinner"></div>
                    <span>Loading character…</span>
                </div>

                <div v-else-if="charError" class="charCard_state charCard_state--error">
                    <span>⚠ Could not load character info from the Lodestone right now.</span>
                </div>

                <template v-else-if="character">

                    <div class="charCard_banner">
                        <p v-if="character.title" class="charCard_title">{{ character.title }}</p>
                        <h2 class="charCard_name">{{ character.name }}</h2>
                        <p v-if="character.world" class="charCard_world">
                            {{ character.world }}<span v-if="character.dataCenter"> [{{ character.dataCenter }}]</span>
                        </p>
                    </div>

                    <div class="charCard_profile">

                        <div class="charCard_attributes">
                            <ul>
                                <li v-if="character.race">
                                    <p>Race / Clan / Gender</p>
                                    <p>
                                        {{ character.race }}<template v-if="character.clan">, {{ character.clan }}</template
                                        ><template v-if="character.gender"> / {{ character.gender }}</template>
                                    </p>
                                </li>
                                <li v-if="character.nameday">
                                    <p>Nameday</p>
                                    <p>{{ character.nameday }}</p>
                                </li>
                                <li v-if="character.guardian">
                                    <p>Guardian</p>
                                    <p>{{ character.guardian }}</p>
                                </li>
                                <li v-if="character.cityState">
                                    <p>City-state</p>
                                    <p>{{ character.cityState }}</p>
                                </li>
                                <li v-if="character.grandCompany">
                                    <p>Grand Company</p>
                                    <p>
                                        {{ character.grandCompany }}<template v-if="character.grandCompanyRank"> / {{ character.grandCompanyRank }}</template>
                                    </p>
                                </li>
                                <li v-if="character.freeCompany">
                                    <p>Free Company</p>
                                    <p>{{ character.freeCompany }}</p>
                                </li>
                            </ul>
                        </div>

                        <div class="charCard_portraitStage">
                            <div v-if="character.activeJob.name" class="charCard_jobBadge">
                                <img v-if="character.activeJob.icon" :src="character.activeJob.icon" :alt="character.activeJob.name" />
                                <span>
                                    <em v-if="character.activeJob.level">Lv. {{ character.activeJob.level }}</em>
                                    <strong>{{ character.activeJob.name }}</strong>
                                </span>
                            </div>
                            <img
                                v-if="character.portrait || character.avatar"
                                :src="character.portrait ?? character.avatar ?? undefined"
                                :alt="character.name"
                                class="charCard_portrait" />
                        </div>
                    </div>

                    <div v-if="groupedLevels.length" class="charCard_levels">
                        <p class="charCard_levelsTitle">Jobs &amp; Levels</p>

                        <div v-for="group in groupedLevels" :key="group.role" class="charCard_levelGroup">
                            <p class="charCard_levelGroupTitle">{{ group.role }}</p>
                            <div class="charCard_levelsGrid">
                                <div
                                    v-for="jl in group.jobs"
                                    :key="jl.job"
                                    class="charCard_levelChip"
                                    :class="{
                                        'charCard_levelChip--maxed': jl.level !== null && jl.level >= 100,
                                        'charCard_levelChip--locked': jl.level === null,
                                    }">
                                    <img v-if="jl.icon" :src="jl.icon" :alt="jl.job" class="charCard_levelChip-icon" />
                                    <span class="charCard_levelChip-job">{{ jl.job }}</span>
                                    <span class="charCard_levelChip-lvl">{{ jl.level ?? '—' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </template>
            </div>
        </div>

    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../ui/displayPageHeader.vue'

defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])

const pageTagLine = ''

interface JobLevel {
    job: string
    role: string | null
    level: number | null
    icon: string | null
}
interface CharacterInfo {
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
    activeJob: { name: string | null; icon: string | null; level: number | null }
    levels: JobLevel[]
    fetchedAt: string
}

const character = ref<CharacterInfo | null>(null)
const charLoading = ref(true)
const charError = ref(false)

// Buckets the flat job list by role, keeping Lodestone's own first-seen ordering
// (Tank, Healer, DPS, then crafters/gatherers) so no explicit sort is needed.
const groupedLevels = computed(() => {
    if (!character.value) return []
    const groups: { role: string; jobs: JobLevel[] }[] = []
    for (const jl of character.value.levels) {
        const role = jl.role ?? 'Other'
        let group = groups.find((g) => g.role === role)
        if (!group) {
            group = { role, jobs: [] }
            groups.push(group)
        }
        group.jobs.push(jl)
    }
    return groups
})

onMounted(async () => {
    try {
        const res = await fetch('/api/character')
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        character.value = await res.json()
    } catch (err) {
        console.error('[AboutUs] failed to load character info', err)
        charError.value = true
    } finally {
        charLoading.value = false
    }
})
</script>

<style scoped lang="scss">
    .aboutUs {
        .about {
            max-width: 800px;
            min-width: 300px;
            margin: 40px auto;
        }

        h2 {
            margin: 20px 0;
        }

        p,
        ul {
            margin-bottom: 1rem;
        }

        li {
            margin: 6px 0;
        }
    }

    /* ── Character card ── */
    @keyframes charCard_spin {
        to { transform: rotate(360deg); }
    }

    .charCard {
        max-width: 900px;
        min-width: 300px;
        margin: 40px auto;
        padding: 24px;
        border: 1px solid $buttonBorder;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.03);
        font-family: 'Rajdhani', sans-serif;
        color: $fontColor;

        &_state {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 2rem 0;
            color: $dim;
            font-size: 0.9rem;

            &--error {
                color: #ff9b9b;
            }
        }

        &_spinner {
            width: 26px;
            height: 26px;
            border: 3px solid $buttonBorder;
            border-top-color: $teal;
            border-radius: 50%;
            animation: charCard_spin 0.8s linear infinite;
        }

        /* ── Banner: title / name / world ── */
        &_banner {
            text-align: center;
            padding-bottom: 16px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(45, 212, 191, 0.12);
        }

        &_title {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.72rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: $teal;
            margin-bottom: 4px;
        }

        &_name {
            font-family: 'Cinzel', serif;
            font-size: 1.6rem;
            font-weight: 600;
            color: #e8f0ff;
            margin: 0 0 4px;
        }

        &_world {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.8rem;
            color: $dim;
        }

        /* ── Profile: attributes (left) + portrait (right) ── */
        &_profile {
            display: grid;
            grid-template-columns: 1fr 220px;
            gap: 24px;
            align-items: start;
        }

        &_attributes {
            border: 1px solid $buttonBorder;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.02);
            padding: 4px 16px;

            ul {
                list-style: none;
            }

            li {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: 10px 0;

                & + li {
                    border-top: 1px solid rgba(45, 212, 191, 0.08);
                }

                p:first-of-type {
                    font-family: 'Share Tech Mono', monospace;
                    font-size: 0.7rem;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: $teal;
                }

                p:nth-of-type(2) {
                    font-size: 0.95rem;
                    color: #e8f0ff;
                }
            }
        }

        &_portraitStage {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }

        &_jobBadge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border: 1px solid rgba(45, 212, 191, 0.35);
            border-radius: 20px;
            background: rgba(45, 212, 191, 0.08);
            font-size: 0.85rem;
            white-space: nowrap;

            img {
                width: 22px;
                height: 22px;
                flex-shrink: 0;
            }

            span {
                display: flex;
                flex-direction: column;
                line-height: 1.2;
            }

            em {
                font-style: normal;
                font-family: 'Share Tech Mono', monospace;
                font-size: 0.68rem;
                color: $teal;
            }

            strong {
                font-weight: 600;
                color: #e8f0ff;
            }
        }

        &_portrait {
            width: 100%;
            border-radius: 10px;
            border: 1px solid rgba(45, 212, 191, 0.35);
            box-shadow: 0 0 18px rgba(45, 212, 191, 0.12);
        }

        /* ── Jobs & Levels ── */
        &_levels {
            margin-top: 24px;
            padding-top: 18px;
            border-top: 1px solid rgba(45, 212, 191, 0.12);
        }

        &_levelsTitle {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.72rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: $teal;
            margin-bottom: 14px;
        }

        &_levelGroup {
            & + & {
                margin-top: 14px;
            }
        }

        &_levelGroupTitle {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.68rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: $dim;
            margin-bottom: 8px;
        }

        &_levelsGrid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 8px;
        }

        &_levelChip {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            padding: 6px 12px;
            border: 1px solid $buttonBorder;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.02);
            font-size: 0.85rem;

            &-icon {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
            }

            &-job {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            &-lvl {
                font-family: 'Share Tech Mono', monospace;
                font-size: 0.8rem;
                color: $dim;
                flex-shrink: 0;
            }

            &--maxed {
                border-color: rgba(45, 212, 191, 0.4);

                .charCard_levelChip-lvl {
                    color: $teal;
                }
            }

            &--locked {
                opacity: 0.5;
            }
        }

        @media (max-width: 640px) {
            &_profile {
                grid-template-columns: 1fr;
            }

            &_portraitStage {
                order: -1;
            }

            &_portrait {
                max-width: 220px;
            }
        }
    }
</style>
