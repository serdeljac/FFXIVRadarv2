<template>
    <aside class="details">

        <div class="details_close">
            <trashButton @click="$emit('closeDetails', false)" />
        </div>

        <div class="details_map">
            <mapDisplay
                v-if="node"
                class="miniMap"
                :ffxivData="ffxivData"
                :focusNode="node"
                :singleOnly="true"
            />
        </div>

        <div class="details_location">
            <h3>{{ node.area.region }} &gt; {{ node.area.zone }}</h3>
            <h4>(x{{ node.x }}, y{{ node.y }})</h4>
        </div>

        <div class="details_content">

            <!-- ── Gathering (Miner / Botany) ───────────────────────── -->
            <template v-if="isGathering">

                <div class="details_content-name">
                    <p>{{ node.name }}</p>
                    <p>Lv. {{ node.level }} {{ stars(node.stars) }}</p>
                </div>

                <div class="details_content-pairedCells">
                    <div class="isBlock">
                        <p>Requirement:</p>
                        <p>{{ capitalize(node.job_sub) }} – Lv. {{ node.node_level }}</p>
                        <p v-if="node.tomb">{{ node.tomb }}</p>
                    </div>

                    <div class="isBlock" :data-row-and-time-active="isRowActive(node, 'time') || null">
                        <p class="timeDisplay">Time:</p>
                        <p class="timeDisplay">{{ timerCountdown(node.time) }}</p>
                    </div>
                </div>

                <div class="isBlock" v-if="node.usage === 'aetherial'">
                    <h3>Aetherial Reduction Materials:</h3>
                    <ul>
                        <li v-if="node.usage_info.result1">{{ node.usage_info.result1 }}</li>
                        <li v-if="node.usage_info.result2">{{ node.usage_info.result2 }}</li>
                        <li v-if="node.usage_info.result3">{{ node.usage_info.result3 }}</li>
                    </ul>
                </div>

                <div class="isBlock">
                    <h3>Other Materials:</h3>
                    <ul>
                        <li v-for="d in otherMaterials" :key="d.ID">
                            {{ d.name }} – Lv. {{ d.level }} {{ stars(d.stars) }}
                        </li>
                    </ul>
                </div>

            </template>

            <!-- ── Sightseeing ─────────────────────────────────────── -->
            <template v-else-if="node.job === 'sightseeing'">

                <div class="details_content-name">
                    <iconAndText :text="node.name" :icon="node.job_sub" />
                </div>

                <div class="details_content-previewImg">
                    <img :src="vistaPreviewImg" />
                </div>

                <div class="details_content-notes">
                    <p>
                        <span v-if="node.mount">[Flying Mount Required]</span>
                        {{ node.notes }}
                    </p>
                </div>

                <div class="details_content-pairedCells">
                    <div class="isBlock" :data-row-and-time-active="isRowActive(node, 'weather') || null">
                        <p class="timeDisplay">Weather:</p>
                        <template v-if="node.weather1">
                            <p :data-time-active="isWeatherActive('weather1', node) || null">{{ node.weather1 }}</p>
                            <p v-if="node.weather2" :data-time-active="isWeatherActive('weather2', node) || null">{{ node.weather2 }}</p>
                        </template>
                        <p v-else>Any Weather</p>
                    </div>

                    <div class="isBlock" :data-row-and-time-active="isRowActive(node, 'time') || null">
                        <p class="timeDisplay">Time:</p>
                        <p class="timeDisplay">{{ timerCountdown(node.time) }}</p>
                    </div>
                </div>

                <div class="details_content-emote isBlock">
                    <iconAndText :text="node.emote" :icon="node.emote" />
                </div>

            </template>

            <!-- ── Aether Currents ─────────────────────────────────── -->
            <template v-else-if="node.job === 'aethercurrents'">

                <div class="details_content-name">
                    <iconAndText :text="`Aether Current #${node.order}`" :icon="node.job_sub" />
                </div>

                <div class="details_content-questName isBlock" v-if="node.name">
                    <h3>Acquired from quest:</h3>
                    <iconAndText :icon="`quest_${node.name_type}`" :text="`${node.name} – Lv.${node.name_level}`" />
                </div>

                <div class="details_content-unlockName isBlock" v-if="node.unlock">
                    <h3>Must complete:</h3>
                    <iconAndText :icon="`quest_${node.unlock_type}`" :text="`${node.unlock} – Lv.${node.unlock_level}`" />
                </div>

            </template>

        </div>
    </aside>
</template>

<script lang="ts" setup>
// function getVistaPreviewImgSmall(expansion: string, no: number): string {
//     return new URL(
//         `/src/assets/sightseeing/${expansion}/ss${expansion}${no}.webp`,
//         import.meta.url
//     ).href
// }
</script>

<script lang="ts">
import mapDisplay from './MapDisplay.vue'
import iconAndText from '../ui/iconAndText.vue'
import trashButton from '../ui/trashButton.vue'

// Module-level pure helper — no need to recreate per instance
function capitalize(str: string): string {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function stars(count: number): string {
    return '★'.repeat(Math.max(0, count ?? 0))
}

export default {
    name: 'DetailsPane',

    components: { mapDisplay, iconAndText, trashButton },

    props: ['ffxivData', 'node', 'timerList', 'weatherList'],

    emits: ['closeDetails'],

    computed: {
        // Avoids repeating the two-job OR condition across template and logic
        isGathering(): boolean {
            return this.node.job === 'miner' || this.node.job === 'botany'
        },

        // Cached image URL — only recalculated when node changes
        vistaPreviewImg(): string {
            return ''
            // return getVistaPreviewImgSmall(this.node.area.icon, this.node.no)
        },

        otherMaterials(): any[] {
            const { node_code, name, job } = this.node
            const matches = this.ffxivData[job].filter(
                (o: any) => o.node_code === node_code && o.name !== name
            )
            return matches.length ? matches : [{ name: 'None', ID: '000' }]
        },
    },

    methods: {
        capitalize,
        stars,

        timerCountdown(time: string): string {
            if (!time) return 'Any Time'
            return this.timerList.find((o: any) => o.ID === time)?.countdown ?? 'Any Time'
        },

        isRowActive(node: any, type: 'time' | 'weather'): boolean {
            if (type === 'time') {
                if (!node.time) return false
                return !!this.timerList.find((o: any) => o.ID === node.time)?.stateActive
            }
            if (type === 'weather') {
                const cur = this.weatherList[node.area.mapcode]
                return cur === node.weather1 || cur === node.weather2
            }
            return false
        },

        isWeatherActive(field: 'weather1' | 'weather2', node: any): boolean {
            return this.weatherList[node.area.mapcode] === node[field]
        },
    },
}
</script>

<style scoped lang="scss">
.details {
    position: fixed;
    right: 0;
    bottom: 0;
    width: calc(400px + 2rem);
    height: calc(100vh - $trackingbarHeight);
    padding: 0.25rem 1rem;
    background-color: $bodyBackgroundColor;
    border-left: 1px solid $borderColor;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;

    &_close {
        margin-top: 1rem;
        img { cursor: pointer; }
    }

    &_map {
        height: 400px;
        margin-top: 1rem;
    }

    .miniMap {
        transform: scale(0.5);
        transform-origin: top left;
    }

    &_location {
        text-align: center;
        margin-top: 0.5rem;
    }

    &_content {
        margin-top: 1rem;

        &-name {
            font-size: 1.2rem;
            text-align: center;
            background-color: $borderColor;
            padding: 0.2rem 0;
        }

        .isBlock {
            border: 1px solid #fff;
            padding: 0.5rem;
            text-align: center;
            margin-top: 1rem;
        }

        &-pairedCells {
            display: flex;
            width: 100%;
            justify-content: space-around;
            gap: 0 10px;

            & > div {
                display: flex;
                justify-content: center;
                width: 50%;
                text-align: center;
                flex-direction: column;
            }
        }

        &-previewImg {
            display: flex;
            justify-content: center;
            margin-top: 1rem;

            img {
                width: 160px;
                aspect-ratio: 1 / 1;
                border: 1px solid #fff;
                cursor: pointer;
            }
        }

        &-notes {
            margin-top: 0.5rem;
            width: 100%;
            text-align: center;
            span { font-weight: bold; }
        }

        &-questName,
        &-unlockName {
            h3 { margin-bottom: 0.3rem; }
        }
    }
}
</style>