<template>
    <aside
        :class="['details', windowWidth]"
        role="dialog"
        aria-label="Node details"
        ref="paneEl"
        :tabindex="isFullScreen ? -1 : undefined"
        @keydown.esc="$emit('openDetails', node)">

        <!-- Header -->
        <div class="details_header">
            <button
                type="button"
                class="details_closeBtn hasContext"
                data-context="Close"
                aria-label="Close details panel"
                @click="$emit('openDetails', node)">
                <CloseDetailsPane />
            </button>

            <DisplayItemName class="detailsItemName" :item="node.job != 'aethercurrents' ? node.name : aetherCurrentName(node)" :node="node" :hideAttr="true"/>
        </div>

        <!-- Map -->
        <div v-if="hasMap" class="details_mapStage">
            <transition name="details_fade">
                <div v-if="isMapLoading" class="details_mapOverlay">
                    <div class="details_mapSpinner"></div>
                </div>
                <div v-else-if="mapHasError" class="details_mapOverlay details_mapOverlay--error">
                    <span>⚠ Failed to load map</span>
                </div>
            </transition>
            <div ref="mapEl" class="details_mapCanvas"></div>
        </div>

        <!-- Location -->
        <div class="details_location">
            <DisplayArea :node="node"/>
        </div>

        <!-- Content Details -->
        <div class="details_content">

            <!-- Mining and Botany -->
            <template v-if="isGathering">
                <div class="details_requirements">
                    <ul>
                        <li>
                            <p>{{ `${node.job_sub}:` }}</p>
                            <p>{{ node.node_level }}</p>
                        </li>
                        <li v-if="node.perception">
                            <p>Perception:</p>
                            <p>{{ node.perception }}</p>
                        </li>
                        <li :data-rowActive="isNodeActiveNow">
                            <p>Timer:</p>
                            <p>
                                <DisplayTime :node="node" />
                            </p>
                        </li>
                        <li v-if="node.tomb">
                            <p>Tomb Req:</p>
                            <p>{{ node.tomb }}</p>
                        </li>
                    </ul>
                </div>

                <div class="details_panel" v-if="node.usage === 'aetherial'">
                    <h3>Aetherial Reduction Materials</h3>
                    <ul>
                        <li v-if="node.usage_info.result1">{{ node.usage_info.result1 }}</li>
                        <li v-if="node.usage_info.result2">{{ node.usage_info.result2 }}</li>
                        <li v-if="node.usage_info.result3">{{ node.usage_info.result3 }}</li>
                    </ul>
                </div>

                <div class="details_panel">
                    <h3>Other Materials</h3>
                    <ul>
                        <li v-for="d in otherMaterials" :key="d.ID">
                            {{ d.name }} – Lv. {{ d.level }} {{ stars(d.stars) }}
                        </li>
                    </ul>
                </div>
            </template>

            <!-- Fishing -->
            <template v-else-if="isFishing">
                <div class="details_requirements">
                    <ul>
                        <li v-if="node.bait != 'mooch'">
                            <p>Recommended Bait:</p>
                            <p>{{ baitLabel }}</p>
                        </li>
                        <li v-else>
                            <p>Mooch:</p>
                            <p>
                                {{ node.mooch_name1 }}
                                {{ node.mooch_name2 ? `, ${node.mooch_name2}` : ''}}
                                {{ node.mooch_name3 ? `, ${node.mooch_name3}` : ''}}
                            </p>
                        </li>
                        <li>
                            <p>Hookset:</p>
                            <p>{{ node.hookset }}</p>
                        </li>
                        <li>
                            <p>Tug:</p>
                            <p>{{ formatTug(node.tug) }}</p>
                        </li>
                        <li :data-rowActive="isNodeActiveNow">
                            <p>Timer:</p>
                            <p>{{ nodeTimer }}</p>
                        </li>
                    </ul>
                </div>

                <div class="details_panel" v-if="requiredWeather.length">
                    <h3>Weather Condition</h3>
                    <ul>
                        <li v-if="precedingWeather.length">{{ precedingWeather.join(' / ') }} &rarr;</li>
                        <li>{{ requiredWeather.join(' / ') }}</li>
                    </ul>
                </div>

                <div class="details_panel" v-if="node.notes">
                    <h3>Notes</h3>
                    <p>{{ node.notes }}</p>
                </div>

                <div class="details_panel">
                    <h3>Other Fish Here</h3>
                    <ul>
                        <li v-for="d in otherMaterials" :key="d.ID" class="otherFishingList">
                            <p>{{ `${d.name} - Lv.${d.level} ${formatStars(d.stars)}` }}</p>
                            <p>{{ d.bait }}</p>
                        </li>
                    </ul>
                </div>
            </template>

            <!-- Sightseeing -->
            <template v-else-if="node.job === 'sightseeing'">
                <div class="details_requirements">
                    <ul>
                        <li>
                            <p>EXP Earned:</p>
                            <DisplayExp :iconName="'exp'" :text="getVistaInfo('exp')" :type="'exp'"/>
                        </li>
                        <li>
                            <p>Level Range:</p>
                            <p>{{ getVistaInfo('level') }}</p>
                        </li>
                        <li :data-rowActive="isNodeActiveNow">
                            <p>Active:</p>
                            <p class="details_timeAndWeather">
                                <span>{{ nodeTimer }}</span>
                            </p>
                        </li>
                        <li>
                            <p>Emote:</p>
                            <DisplayEmote :node="node" />
                        </li>
                    </ul>
                </div>

                <div class="details_panel" v-if="node.notes">
                    <h3>Notes</h3>
                    <p>{{ node.notes }}</p>
                </div>

                <div class="details_previewAndGuide">
                    <FetchVistaImage :node="node" :size="'small'" @click="$emit('openVistaImg', node)"/>
                </div>
            </template>

            <!-- Aether Currents -->
            <template v-else-if="node.job === 'aethercurrents'">
                <div class="details_panel" v-if="node.name">
                    <h3>Acquired from quest</h3>
                    <DisplayQuest :node="node" :requested="'name'" />
                </div>

                <div class="details_panel" v-if="node.unlock">
                    <h3>Must complete</h3>
                    <DisplayQuest :node="node" :requested="'unlock'" />
                </div>
            </template>

        </div>
    </aside>
</template>

<script lang="ts" setup>
    const props = defineProps(['ffxivData', 'node', 'timerList', 'weatherList', 'windowWidth'])
    defineEmits(['openDetails', 'openVistaImg'])
    import CloseDetailsPane from '../../components/buttons/CloseDetailsPane.vue'
    import DisplayItemName from '../../components/display/DisplayItemName.vue'
    import DisplayArea from '../../components/display/DisplayArea.vue'
    import DisplayTime from '../../components/display/DisplayTime.vue'
    import DisplayExp from '../../components/display/DisplayExp.vue'
    import DisplayEmote from '../../components/display/DisplayEmote.vue'
    import FetchVistaImage from '../../modules/FetchVistaImage.vue'
    import DisplayQuest from '../../components/display/DisplayQuest.vue'
    import { formatStars, formatTug, isNodeWindowActive, nodeCountdown, useNow, aetherCurrentName } from '../../hooks/hooks.ts'

    import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
    import L from 'leaflet'
    import 'leaflet/dist/leaflet.css'

const paneEl = ref<HTMLElement | null>(null)
const isFullScreen = computed(() => props.windowWidth === 'mobile')

const stars = formatStars

const isGathering = computed(() => props.node.job === 'miner' || props.node.job === 'botany')
const isFishing = computed(() => props.node.job === 'fishing')

// False for fishing holes absent from areas.json, which have no zone to map.
const hasMap = computed(() => !!props.node?.area?.zone)

const baitLabel = computed(() => (props.node.bait === 'mooch' ? 'Mooch' : props.node.bait))

const requiredWeather = computed<string[]>(() =>
    [props.node.weather1, props.node.weather2, props.node.weather3].filter(Boolean)
)
const precedingWeather = computed<string[]>(() =>
    [props.node.weatherchain1, props.node.weatherchain2, props.node.weatherchain3].filter(Boolean)
)

const otherMaterials = computed<any[]>(() => {
    const { node_code, name, job } = props.node
    const matches = props.ffxivData[job].filter((o: any) => o.node_code === node_code && o.name !== name)
    return matches.length ? matches : [{ name: 'None', ID: '000' }]
})

// Same clock and the same per-job routing the pages and tracking bar use, so a
// node's countdown reads identically wherever it is shown.
const nowMs = useNow()

// `|| null` because Vue keeps a literal `false` on a non-boolean attribute, which
// would leave every row matching the global [data-rowActive] rule.
const isNodeActiveNow = computed(() =>
    isNodeWindowActive(props.node, nowMs.value) || null)

const nodeTimer = computed(() =>
    nodeCountdown(props.node, nowMs.value))

function getVistaInfo(type: string) {
    const expFound = props.ffxivData.expansion.find((o: any) => o.expansion == props.node.expansion)
    if (type == 'exp') return expFound.vista_exp == 0 ? '0' : expFound.vista_exp
    if (type == 'level') return `LV. ${expFound.vista_min} - ${expFound.vista_max}`
}

// Mini Leaflet map: a single-zone, CRS.Simple image overlay marking only the
// zone's aetheryte(s) and the focused node.
const BASE_URL = 'https://v2.xivapi.com'
const MAP_PX = 2048
const NODE_SCALE = MAP_PX / 800
const ICON_SIZE = 26
const ICON_CDN = 'https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/icons'

const mapEl = ref<HTMLElement | null>(null)
const isMapLoading = ref(true)
const mapHasError = ref(false)

let map: L.Map | null = null
let overlay: L.ImageOverlay | null = null
let activeMarkers: L.Marker[] = []
let loadToken = 0

// Marker icon filename for the focused node: fates/eliteHunts use a special
// prefix, everything else uses job_sub directly (same rule as the overview map).
const focusIconName = computed(() => {
    const job = props.node?.job
    const jobSub = props.node?.job_sub
    if (!job) return ''
    if (job === 'fates') return `fate_${jobSub}`
    if (job === 'eliteHunts') return jobSub === 'SS' ? 'hunts_ss' : 'hunts'
    return jobSub
})

onMounted(() => {
    loadMap()
    if (isFullScreen.value) {
        document.body.style.overflow = 'hidden'
        // Focus the pane itself rather than the close button, so a screen reader
        // announces the node's details from the top instead of starting on "Close".
        paneEl.value?.focus()
    }
})

onBeforeUnmount(() => {
    destroyMap()
    document.body.style.overflow = ''
})

// Guards against the pane being resized across the mobile boundary while open,
// which would otherwise strand the scroll lock on or off.
watch(isFullScreen, (full) => {
    document.body.style.overflow = full ? 'hidden' : ''
})

watch(() => props.node, () => loadMap())

function destroyMap() {
    if (map) map.remove()
    map = null
    overlay = null
    activeMarkers = []
}

// Loads (or reuses) the Leaflet map for the current node. A monotonic loadToken
// guards against races: any async step whose token is stale discards its result,
// so rapid node switches can't paint an outdated map. Zoneless nodes tear the map
// down instead.
async function loadMap() {
    if (!hasMap.value) {
        loadToken++
        destroyMap()
        isMapLoading.value = false
        return
    }

    const token = ++loadToken
    isMapLoading.value = true
    mapHasError.value = false

    await nextTick()
    if (token !== loadToken || !mapEl.value) return

    if (!map) {
        map = L.map(mapEl.value, {
            crs: L.CRS.Simple,
            minZoom: -2,
            maxZoom: 3,
            zoomSnap: 0.25,
            zoomControl: true,
            attributionControl: false,
            scrollWheelZoom: false,
            wheelPxPerZoomLevel: 120,
        })
    }

    for (const m of activeMarkers) m.remove()
    activeMarkers = []

    try {
        const zoneName = props.node.area.zone
        const variant = String(props.node.area.variant ?? 0).padStart(2, '0')
        const imageUrl = await resolveMapImageUrl(zoneName, variant)

        if (token !== loadToken || !map) return

        await preloadImage(imageUrl)
        if (token !== loadToken || !map) return

        const bounds: L.LatLngBoundsExpression = [[0, 0], [MAP_PX, MAP_PX]]

        if (overlay) {
            overlay.setUrl(imageUrl)
            overlay.setBounds(L.latLngBounds(bounds))
        } else {
            overlay = L.imageOverlay(imageUrl, bounds).addTo(map)
        }

        map.setMaxBounds(bounds)
        map.fitBounds(bounds)

        buildMarkers(zoneName)
        isMapLoading.value = false
    } catch (err: any) {
        if (token !== loadToken) return
        console.error('[DetailsPane] map load failed', err)
        mapHasError.value = true
        isMapLoading.value = false
    }
}

// Resolves only once the image has fully downloaded (rejects if it can't), so the
// loading spinner reflects the real cost of switching maps.
function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Map image failed to load'))
        img.src = url
    })
}

// Looks the Map sheet up by PlaceName via xivapi, then builds its asset URL.
async function resolveMapImageUrl(zoneName: string, variant: string): Promise<string> {
    const query = encodeURIComponent(`PlaceName.Name~"${zoneName}"`)
    const searchUrl = `${BASE_URL}/api/search?sheets=Map&query=${query}&fields=Id,PlaceName.Name&limit=1`

    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`Search request failed (${res.status})`)

    const data = await res.json()
    const firstResult = data?.results?.[0]
    if (!firstResult) throw new Error(`No map found for "${zoneName}"`)

    const rawId = firstResult.fields?.Id
    if (!rawId) throw new Error('Map result is missing an Id')

    const idBase = String(rawId).split('/')[0]
    return `${BASE_URL}/api/asset/map/${idBase}/${variant}`
}

// Places the zone's aetheryte markers (orientation only) plus the highlighted focus node.
function buildMarkers(zoneName: string) {
    const aetherytes: any[] = (props.ffxivData?.aetheryte ?? []).filter((a: any) => a.area?.zone === zoneName)
    for (const a of aetherytes) {
        const latlng = nodeLatLng(a)
        if (latlng) addMarker(latlng, `${ICON_CDN}/aetheryte.webp`, a.point || a.area?.point || 'Aetheryte')
    }

    const focusLatLng = nodeLatLng(props.node)
    if (focusLatLng) addMarker(focusLatLng, `${ICON_CDN}/${focusIconName.value}.webp`, props.node.name || '', true)
}

// Converts a node's coordinates to a Leaflet lat/lng on the 2048px overlay,
// preferring precomputed transx/transy and falling back to x/y over mapsize.
function nodeLatLng(node: any): L.LatLngExpression | null {
    let px: number, py: number
    if (typeof node?.transx === 'number' && typeof node?.transy === 'number') {
        px = node.transx
        py = node.transy
    } else {
        const mapsize = node?.area?.mapsize
        if (typeof mapsize !== 'number' || typeof node?.x !== 'number' || typeof node?.y !== 'number') return null
        px = (node.x / mapsize) * 800
        py = (node.y / mapsize) * 800
    }
    return [MAP_PX - py * NODE_SCALE, px * NODE_SCALE]
}

function addMarker(latlng: L.LatLngExpression, iconUrl: string, tooltip: string, isFocus = false) {
    if (!map) return
    const icon = L.icon({
        iconUrl,
        iconSize: [ICON_SIZE, ICON_SIZE],
        iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
        className: isFocus ? 'details_markerIcon details_markerIcon--active' : 'details_markerIcon',
    })
    const marker = L.marker(latlng, { icon })
    if (tooltip) {
        marker.bindTooltip(tooltip, {
            direction: 'top',
            offset: [0, -ICON_SIZE / 2],
            className: 'details_tooltip',
        })
    }
    marker.addTo(map)
    activeMarkers.push(marker)
}
</script>

<style scoped lang="scss">

@keyframes details_spin {
    to { transform: rotate(360deg); }
}

@keyframes details_iconPulse {
    0%, 100% { filter: drop-shadow(0 0 2px #000) drop-shadow(0 0 4px #2dd4bf); }
    50%      { filter: drop-shadow(0 0 3px #000) drop-shadow(0 0 14px #2dd4bf) brightness(1.5); }
}

@keyframes details_rowPulse {
    0%, 100% { background-color: rgba(45, 212, 191, 0.08); }
    50%      { background-color: rgba(45, 212, 191, 0.22); }
}

.details {
    position: fixed;
    right: 0;
    bottom: 0;
    width: calc(400px + 2rem);
    height: calc(100vh - $trackingbarHeight - 1px);
    padding: 1rem 1.25rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    background: $bodyBackgroundColor;
    border-left: 1px solid $buttonBorder;
    box-shadow: -12px 0 30px rgba(0, 0, 0, 0.35);
    font-family: 'Rajdhani', sans-serif;
    color: $fontColor;
    z-index: 999;

    // Mobile only: a full-screen sheet. Tablet keeps the side panel above —
    // there is room for it there, and covering the table would lose the context
    // the user is comparing against.
    &.mobile {
        width: 100%;
        left: 0;
        right: 0;
        top: $trackingbarHeight;
        height: auto;
        border-left: 0;
        box-shadow: none;
        // Above the sidebar overlay so it can't be tabbed behind.
        z-index: 10000;
        // Close button stays reachable without scrolling back up.
        .details_header {
            position: sticky;
            top: -1rem;
            z-index: 2;
            margin: -1rem -1.25rem 0;
            padding: 1rem 1.25rem;
            background: $bodyBackgroundColor;
            border-bottom: 1px solid $buttonBorder;
        }

        // The 1:1 map would eat most of a phone screen before any data is visible.
        .details_mapStage {
            aspect-ratio: 4 / 3;
        }
    }

    &:focus {
        outline: none;
    }

    &_header {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    &_closeBtn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 1px solid $buttonBorder;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: rgba(45, 212, 191, 0.07);
            border-color: rgba(45, 212, 191, 0.35);
        }

        :deep(.closeDetailsBtn) {
            width: 18px;
            height: 18px;
        }
        :deep(.closeDetailsBtn path) {
            fill: $dim;
            transition: fill 0.15s;
        }
        &:hover :deep(.closeDetailsBtn path) {
            fill: $teal !important;
        }
    }

    .detailsItemName {
        transform: translateY(2px)
    }

    &_headerName {
        flex: 1;
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 0.02em;
        color: #e8f0ff;
    }

    /* ── Mini map ── */
    &_mapStage {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        flex-shrink: 0;
    }

    &_mapCanvas {
        width: 100%;
        height: 100%;
        background: #060a12;
        border: 1px solid $buttonBorder;
        border-radius: 10px;
        overflow: hidden;
    }

    &_mapOverlay {
        position: absolute;
        inset: 0;
        z-index: 20;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border-radius: 10px;
        background: rgba(6, 10, 18, 0.78);
        backdrop-filter: blur(2px);
        font-size: 0.82rem;
        letter-spacing: 0.05em;

        &--error {
            color: $red;
        }
    }

    &_mapSpinner {
        width: 32px;
        height: 32px;
        border: 3px solid $buttonBorder;
        border-top-color: $teal;
        border-radius: 50%;
        animation: details_spin 0.8s linear infinite;
        box-shadow: 0 0 18px rgba(45, 212, 191, 0.25);
    }

    &_fade-enter-active,
    &_fade-leave-active {
        transition: opacity 0.25s ease;
    }
    &_fade-enter-from,
    &_fade-leave-to {
        opacity: 0;
    }

    /* ── Location ── */
    &_location {
        text-align: center;
        flex-shrink: 0;

        h3 {
            font-family: 'Rajdhani', sans-serif;
            font-size: 0.95rem;
            font-weight: 600;
            color: #e8f0ff;
        }

        h4 {
            margin-top: 2px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.76rem;
            font-weight: normal;
            color: $dim;
        }
    }

    &_locationPoint {
        display: block;
        font-size: 0.85rem;
        color: $teal;
    }

    /* ── Content ── */
    &_content {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    &_requirements {
        flex-shrink: 0;
        border: 1px solid $buttonBorder;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        padding: 2px 6px;

        ul { list-style: none; }

        li {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            gap: 8px;
            padding: 8px 8px;

            & + li {
                border-top: 1px solid rgba(45, 212, 191, 0.08);
            }

            p:first-of-type {
                font-family: 'Share Tech Mono', monospace;
                font-size: 0.76rem;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: $dim;
            }

            p:nth-of-type(2) {
                text-align: right;
            }

            p::first-letter {
                text-transform: capitalize;
            }
        }

        [data-rowActive] {
            animation: details_rowPulse 0.9s ease-in-out infinite;
            border-radius: 6px;
        }
    }

    &_timeAndWeather {
        display: inline-flex;
        gap: 10px;
    }

    &_panel {
        border: 1px solid $buttonBorder;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        padding: 10px 14px;
        text-align: center;

        h3 {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.72rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: $teal;
            margin-bottom: 6px;
        }

        ul {
            display: flex;
            flex-direction: column;
            gap: 4px;
            list-style: none;
        }

        :deep(.iconAndText) {
            justify-content: center;
        }
    }

    .otherFishingList {
        display: flex;
        width: 100%;
        justify-content: space-between;
    }

    &_previewAndGuide {
        display: flex;
        align-items: center;
        gap: 12px;

        p {
            flex: 1;
            font-size: 0.9rem;
        }

        :deep(.vista) {
            border-color: rgba(45, 212, 191, 0.35);
            border-radius: 8px;
            cursor: pointer;
            transition: box-shadow 0.2s;
            flex-shrink: 0;

            &:hover {
                box-shadow: 0 0 0 1px $teal, 0 0 16px $tealShadow;
            }
        }
    }

    &_flyingTag {
        display: inline-block;
        margin-right: 6px;
        color: $amber;
        font-weight: 600;
    }

    /* Leaflet marker styling — matches the map on the Eorzea Overview page. */
    :deep(.details_markerIcon) {
        filter: drop-shadow(0 0 2px #000);
    }
    :deep(.details_markerIcon--active) {
        z-index: 1000 !important;
        animation: details_iconPulse 1s ease-in-out infinite;
    }
    :deep(.leaflet-container) {
        background: #060a12;
        font-family: 'Rajdhani', sans-serif;
    }
    :deep(.leaflet-bar a) {
        background: rgba(11, 18, 32, 0.9);
        border-color: $buttonBorder;
    }
    :deep(.leaflet-bar a:hover) {
        background: rgba(45, 212, 191, 0.15);
        color: #e8f0ff;
    }
    :deep(.details_tooltip.leaflet-tooltip) {
        background: rgba(11, 18, 32, 0.95);
        border: 1px solid rgba(45, 212, 191, 0.35);
        border-radius: 6px;
        padding: 4px 10px;
        color: #e8f0ff;
        font-family: 'Rajdhani', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        white-space: nowrap;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    }
    :deep(.details_tooltip.leaflet-tooltip-top::before) {
        border-top-color: rgba(45, 212, 191, 0.35);
    }
}
</style>
