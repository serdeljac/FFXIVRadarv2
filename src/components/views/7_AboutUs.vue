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
            
        </div>

    </div>
</template>

<script lang="ts" setup>
import PageHeader from '../ui/displayPageHeader.vue'

defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])

const pageTagLine = ''
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
</style>