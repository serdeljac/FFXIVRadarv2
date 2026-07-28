<template>
    <section :class="[`eorzeaOverview body_content leafletMap`, windowWidth]">

        
        <PageHeader :title="`Eorzea Overview`" :tagline="pageTagLine" icon="eorzeamap"/>

        
        <div class="body_content-group mapContext">

            
            <div class="leafletMap_content">
                <div class="leafletMap_stage">
                    <transition name="leafletMap_fade">
                        <div v-if="isLoading" class="leafletMap_overlay">
                            <div class="leafletMap_spinner"></div>
                            <span class="leafletMap_overlayText">Loading map…</span>
                        </div>
                        <div v-else-if="hasError" class="leafletMap_overlay leafletMap_overlay--error">
                            <span>⚠ Failed to load map: {{ errorMsg }}</span>
                        </div>
                    </transition>
                    <div ref="mapEl" class="leafletMap_canvas"></div>
                </div>
            </div>

            
            <div class="eorzeaOverview_contentArea">

                
                <div class="zoneSelect" ref="zoneSelectEl" @keydown.esc="closeZoneList">
                    <span id="zoneSelectLabel" class="eorzeaOverview_filterLabel">Zone select</span>
                    <!-- The ▾ used to be a sibling <span> outside the button, so
                         clicking the arrow — the obvious affordance — did nothing.
                         It now lives inside the trigger. -->
                    <button
                        type="button"
                        ref="zoneTriggerEl"
                        class="eorzeaOverview_select eorzeaOverview_select--trigger"
                        aria-haspopup="listbox"
                        aria-controls="zoneSelectList"
                        aria-labelledby="zoneSelectLabel"
                        :aria-expanded="isZoneListOpen ? 'true' : 'false'"
                        @click="isZoneListOpen = !isZoneListOpen">

                        <span>{{ selectedZone }}</span>
                        <span class="eorzeaOverview_arrow" aria-hidden="true">▾</span>
                    </button>

                    <ul
                        v-if="isZoneListOpen"
                        id="zoneSelectList"
                        class="eorzeaOverview_zoneList"
                        role="listbox"
                        aria-labelledby="zoneSelectLabel">
                        <li
                            v-for="group in zoneGroups"
                            :key="group.expansion"
                            role="group"
                            :aria-label="group.expansion"
                            class="eorzeaOverview_zoneGroup">
                            <span class="eorzeaOverview_zoneGroupLabel">{{ group.expansion }}</span>
                            <button
                                v-for="zone in group.zones"
                                :key="zone.zone"
                                type="button"
                                role="option"
                                :aria-selected="zone.zone === selectedZone"
                                class="eorzeaOverview_zoneOption"
                                :class="{ 'eorzeaOverview_zoneOption--active': zone.zone === selectedZone }"
                                @click="selectZone(zone.zone)">
                                <iconImgAPI :name="zone.type ? zone.type : 'world'" class="eorzeaOverview_zoneIcon" />
                                <span>{{ zone.zone }}</span>
                            </button>
                        </li>
                    </ul>
                </div>

                
                <div class="eorzeaOverview_checkboxes markertypes">
                    <span class="eorzeaOverview_filterLabel">Map markers</span>
                    <div>
                    <label
                        v-for="t in MARKER_TYPES"
                        :key="t.key"
                        :class="[`eorzeaOverview_checkbox`, {'inactive': counts[t.key] == 0}]">
                        <input
                            type="checkbox"
                            :checked="filters[t.key] && counts[t.key] > 0"
                            :disabled="counts[t.key] == 0"
                            @change="toggleType(t.key, ($event.target as HTMLInputElement).checked)" />
                        <span class="eorzeaOverview_checkbox-box"></span>
                        <span class="eorzeaOverview_checkbox-label">{{ t.label }}</span>
                        <span class="eorzeaOverview_checkbox-count">{{ counts[t.key] }}</span>
                    </label>
                    </div>
                </div>

                
                <div class="eorzeaOverview_checkboxes datalayers">
                    <label
                        v-for="t in DATA_TYPES"
                        :key="t.key"
                        :class="[`eorzeaOverview_checkbox`, {'inactive': counts[t.key] == 0}]">
                        <input
                            type="radio"
                            name="dataLayer"
                            :value="t.key"
                            :disabled="counts[t.key] == 0"
                            v-model="selectedData"
                            @change="selectDataLayer(t.key as any)" />
                        <span class="eorzeaOverview_checkbox-box"></span>
                        <span class="eorzeaOverview_checkbox-label">{{ t.label }}</span>
                        <span class="eorzeaOverview_checkbox-count">{{ counts[t.key] }}</span>
                    </label>
                </div>

                
                <div
                    v-if="selectedData == 'sightseeing' && tableRows.length"
                    :class="['rdrTable rdrTable--sightseeing', windowWidth]">

                    <ul class="rdrTable_header">
                        <li class="rdrTable_row">
                            <p class="rdrTable_row-name">Vista</p>
                            <p class="rdrTable_row-flying">Flying</p>
                            <p class="rdrTable_row-emote">Emote</p>
                            <p class="rdrTable_row-time">Timer</p>
                        </li>
                    </ul>

                    <hr class="rdrTable_split" />

                    <ul class="rdrTable_body">
                        <li
                            v-for="(row, ri) in tableRows"
                            :key="ri"
                            :class="['rdrTable_row', { 'rdrTable_row--selected': row.node_code === selectedCode }]"
                            :data-rowActive="isNodeActive(row, timerList, weatherList)"
                            @click="selectTableRow(row)">

                            <div class="rdrTable_row-name">
                                <ToggleDetails
                                    :label="`View details for ${row.name}`"
                                    @click.stop="$emit('openDetails', row)"/>
                                <DisplayItemName :item="row.name" :node="row"/>
                            </div>

                            <div class="rdrTable_row-flying">{{ row.mount ? 'YES' : 'NO' }}</div>
                            <div class="rdrTable_row-emote">{{ row.emote }}</div>

                            <div class="rdrTable_row-time">
                                <ToggleTracking
                                    v-if="row?.time"
                                    :trackingEnabled="row?.tracked"
                                    :remove="row.tracked"
                                    @click.stop="$emit('changeTracked', row)" />
                                <DisplayTime v-if="row?.time" :node="row"/>
                            </div>
                        </li>
                    </ul>
                </div>

                
                <div v-if="selectedData == 'mining' || selectedData == 'botany'" class="rdrTableGroups">

                    <template v-for="(group, gi) in tableRows" :key="gi">
                        <!-- One card per gathering node. The timer belongs to the node
                             rather than any single item, so it sits in the group's
                             header strip instead of a rowspanned cell. -->
                        <div
                            v-if="isGathering && group._items.length"
                            :class="['rdrTable rdrTable--gathering', windowWidth,
                                     { 'rdrTable--selected': group.node_code === selectedCode }]"
                            @click="selectTableRow(group)"
                            @mouseenter="hoveredNodeCode = group.node_code"
                            @mouseleave="hoveredNodeCode = null">

                            <ul class="rdrTable_header">
                                <li class="rdrTable_row">
                                    <p class="rdrTable_row-name">Item</p>
                                    <p class="rdrTable_row-attributes">Usage</p>
                                    <p class="rdrTable_row-time">
                                        <ToggleTracking
                                            v-if="group.time"
                                            :trackingEnabled="group._items[0].tracked"
                                            :remove="group._items[0].tracked"
                                            @click.stop="$emit('changeTracked', group._items[0])" />
                                        <DisplayTime v-if="group.time" :node="group._items[0]" />
                                        <span v-else>Any Time</span>
                                    </p>
                                </li>
                            </ul>

                            <hr class="rdrTable_split" />

                            <ul class="rdrTable_body">
                                <li v-for="it in group._items" :key="it.ID" class="rdrTable_row">

                                    <div class="rdrTable_row-name">
                                        <DisplayItemName :item="it.name" :node="it"/>
                                    </div>

                                    <div class="rdrTable_row-attributes">
                                        <span class="hasContext" :data-context="capitalize(it.job_sub)">
                                            <iconImgAPI :name="it.job_sub"/>
                                        </span>

                                        <span v-if="it.usage" class="hasContext" :data-context="fetchUsageAttrName(it)">
                                            <iconImgAPI :name="fetchUsageImgName(it)"/>
                                        </span>

                                        <span v-if="it.node_name === 'Legendary'" class="hasContext" :data-context="`Requires ${it.tomb}`">
                                            <iconImgAPI :name="'folklore'"/>
                                        </span>
                                    </div>

                                    <div class="rdrTable_row-time"></div>
                                </li>
                            </ul>
                        </div>
                    </template>

                </div>

                
                <template v-if="selectedData == 'fishing'">
                    <div v-if="tableRows.length" :class="['rdrTable rdrTable--fishingSpots', windowWidth]">
                        <ul class="rdrTable_header">
                            <li class="rdrTable_row">
                                <p class="rdrTable_row-name">Spot</p>
                                <p class="rdrTable_row-level">Lv</p>
                                <p class="rdrTable_row-rare">Rare</p>
                                <p class="rdrTable_row-fish">Fish</p>
                            </li>
                        </ul>

                        <hr class="rdrTable_split" />

                        <ul class="rdrTable_body">
                            <li
                                v-for="(row, ri) in tableRows"
                                :key="ri"
                                :class="['rdrTable_row', { 'rdrTable_row--selected': row.node_code === selectedCode }]"
                                @click="selectTableRow(row)">
                                <div class="rdrTable_row-name">{{ row.name }}</div>
                                <div class="rdrTable_row-level">{{ row.level || '—' }}</div>
                                <div class="rdrTable_row-rare">{{ row.rare || '—' }}</div>
                                <div class="rdrTable_row-fish">{{ row.fish || '—' }}</div>
                            </li>
                        </ul>
                    </div>

                    <div
                        v-if="detailRowSelected && fishDetails.length"
                        :class="['rdrTable rdrTable--fishDetail', windowWidth]">
                        <ul class="rdrTable_header">
                            <li class="rdrTable_row">
                                <p class="rdrTable_row-tracking"></p>
                                <p class="rdrTable_row-name">Fish</p>
                                <p class="rdrTable_row-actions">Actions</p>
                                <p class="rdrTable_row-time">Timer</p>
                            </li>
                        </ul>

                        <hr class="rdrTable_split" />

                        <ul class="rdrTable_body">
                            <li v-for="fish in fishDetails" :key="fish.id" class="rdrTable_row">
                                <div class="rdrTable_row-tracking">
                                    <ToggleDetails
                                        :label="`View details for ${fish.name}`"
                                        @click="$emit('openDetails', fish)"/>
                                </div>

                                <div class="rdrTable_row-name">
                                    <DisplayItemName :item="fish.name" :node="fish"/>
                                    <ul class="rdrTable_subList">
                                        <li v-if="fish.bait != 'mooch'">Bait: {{ fish.bait }}</li>
                                        <template v-else>
                                            <li>Mooch: {{ fish.mooch_name1 }}</li>
                                            <li v-if="fish.mooch_name2">Mooch: {{ fish.mooch_name2 }}</li>
                                            <li v-if="fish.mooch_name3">Mooch: {{ fish.mooch_name3 }}</li>
                                        </template>
                                    </ul>
                                </div>

                                <div class="rdrTable_row-actions">
                                    <span>{{ fish.hookset }}</span>
                                    <span class="tug">{{ formatTug(fish.tug) }}</span>
                                </div>

                                <div class="rdrTable_row-time">
                                    <ToggleTracking
                                        v-if="fish.time"
                                        :trackingEnabled="fish.tracked"
                                        :remove="fish.tracked"
                                        @click.stop="$emit('changeTracked', fish)" />
                                    <DisplayTime v-if="fish.time" :node="fish" />
                                    <span v-else>Any Time</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </template>

                
                <div
                    v-if="selectedData == 'fates' && tableRows.length"
                    :class="['rdrTable rdrTable--fates', windowWidth,
                             { 'rdrTable--hasReward': tableRows[0].seals || tableRows[0].gemstones }]">

                    <ul class="rdrTable_header">
                        <li class="rdrTable_row">
                            <p class="rdrTable_row-name">FATE</p>
                            <p class="rdrTable_row-type">Type</p>
                            <p class="rdrTable_row-exp">EXP</p>
                            <p class="rdrTable_row-gil">Gil</p>
                            <p v-if="tableRows[0].seals" class="rdrTable_row-reward">Seals</p>
                            <p v-else-if="tableRows[0].gemstones" class="rdrTable_row-reward">Gems</p>
                        </li>
                    </ul>

                    <hr class="rdrTable_split" />

                    <ul class="rdrTable_body">
                        <li
                            v-for="(row, ri) in tableRows"
                            :key="ri"
                            :class="['rdrTable_row', { 'rdrTable_row--selected': row.node_code === selectedCode }]"
                            @click="selectTableRow(row)">

                            <div class="rdrTable_row-name">
                                <ToggleDetails
                                    :label="`View details for ${row.name}`"
                                    @click.stop="$emit('openDetails', row)"/>
                                <span>{{ `${row.name} - Lv.${row.level}` }}</span>
                            </div>

                            <div class="rdrTable_row-type">{{ row.job_sub }}</div>
                            <div class="rdrTable_row-exp">{{ row.exp }}</div>
                            <div class="rdrTable_row-gil">{{ row.gil }}</div>
                            <div v-if="row.seals" class="rdrTable_row-reward">{{ row.seals }}</div>
                            <div v-else-if="row.gemstones" class="rdrTable_row-reward">{{ row.gemstones }}</div>
                        </li>
                    </ul>
                </div>

                <div
                    v-if="selectedData == 'eliteHunts' && tableRows.length"
                    :class="['rdrTable rdrTable--hunts', windowWidth]">

                    <ul class="rdrTable_header">
                        <li class="rdrTable_row">
                            <p class="rdrTable_row-name">Mark</p>
                            <p class="rdrTable_row-rank">Rank</p>
                            <p class="rdrTable_row-respawn">Respawn</p>
                            <p class="rdrTable_row-trigger">Trigger</p>
                        </li>
                    </ul>

                    <hr class="rdrTable_split" />

                    <ul class="rdrTable_body">
                        <li
                            v-for="(row, ri) in tableRows"
                            :key="ri"
                            :class="['rdrTable_row', { 'rdrTable_row--selected': row.node_code === selectedCode }]"
                            @click="selectTableRow(row)">
                            <div class="rdrTable_row-name">{{ `${row.name} - Lv.${row.level}` }}</div>
                            <div class="rdrTable_row-rank">{{ row.rank }}</div>
                            <div class="rdrTable_row-respawn">{{ row.respawn }}</div>
                            <div class="rdrTable_row-trigger">{{ row.trigger ? row.trigger : 'none' }}</div>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
    </section>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageHeader from '../components/PageHeader.vue'
import ToggleTracking from '../components/buttons/ToggleTracking.vue'
import ToggleDetails from '../components/buttons/ToggleDetails.vue'
import DisplayTime from '../components/display/DisplayTime.vue'
import DisplayItemName from '../components/display/DisplayItemName.vue'
import iconImgAPI from '../modules/FetchIconImage.vue'
import { isNodeActive, capitalize, fetchUsageAttrName, fetchUsageImgName, formatTug} from '../hooks/hooks.ts'

// Describes what the page actually does. The previous copy advertised a "Search
// tab" for finding resources across all zones (there is no search on this page)
// and called the data-layer radio group "tabs".
const pageTagLine = 'Browse every zone in Final Fantasy XIV on an interactive map. Select a zone using the zone picker, then choose a data layer to view Mining nodes, Botany nodes, Sightseeing Log vistas, FATE spawn locations, Elite Hunt marks, and Aether Currents — all plotted on the zone map with coordinates. Toggle the map markers to show aetherytes and zone exits alongside them.'

const props = defineProps<{
    ffxivData: any
    eorzeaClock?: any
    timerList?: any[]
    windowWidth?: string
    weatherList?: any
}>()

defineEmits(['changeTracked', 'openDetails', 'openVistaImg'])

const BASE_URL = 'https://v2.xivapi.com'
const MAP_PX = 2048
const NODE_SCALE = MAP_PX / 800
const ICON_SIZE = 28
const ICON_CDN = import.meta.env.DEV ? '/s3/icons' : 'https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/icons'
const DEFAULT_ZONE = 'Limsa Lominsa Lower Decks'
const AREA_POINT_ICON_IDS = new Set([60442])
const AETHERYTE_ICON_IDS = new Set([60453])
const ZONE_EXIT_ICON_IDS = new Set([60441, 60414, 60428])
type IconType = 'aetheryte' | 'zoneExit' | 'misc' | 'sightseeing' | 'mining' | 'botany' | 'fishing' | 'fates' | 'eliteHunts'
const ICON_TYPES: { key: IconType; label: string }[] = [
    { key: 'aetheryte', label: 'Aetherytes' },
    { key: 'zoneExit', label: 'Zone Exits' },
    { key: 'misc', label: 'Misc' },
    { key: 'sightseeing', label: 'Sightseeing' },
    { key: 'mining', label: 'Mining' },
    { key: 'botany', label: 'Botany' },
    { key: 'fishing', label: 'Fishing' },
    { key: 'fates', label: 'FATEs' },
    { key: 'eliteHunts', label: 'Elite Hunts' },
]
type DataType = 'sightseeing' | 'mining' | 'botany' | 'fishing' | 'fates' | 'eliteHunts'
const MARKER_TYPES = ICON_TYPES.filter((t) => ['aetheryte', 'zoneExit', 'misc'].includes(t.key))
const DATA_TYPES = ICON_TYPES.filter((t) => !['aetheryte', 'zoneExit', 'misc'].includes(t.key))

interface ZoneEntry {
    zone: string
    type: string
    variant: string
}
interface ZoneGroup {
    expansion: string
    zones: ZoneEntry[]
}
interface MapMeta {
    imageUrl: string
    markerRange: number | null
}

const mapEl = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMsg = ref('')
const selectedZone = ref(DEFAULT_ZONE)
const zoneGroups = ref<ZoneGroup[]>([])
const isZoneListOpen = ref(false)
const zoneSelectEl = ref<HTMLElement | null>(null)
const zoneTriggerEl = ref<HTMLButtonElement | null>(null)

// Escape closes the zone list and hands focus back to the trigger, so keyboard
// users aren't stranded on a control that just disappeared.
function closeZoneList() {
    if (!isZoneListOpen.value) return
    isZoneListOpen.value = false
    zoneTriggerEl.value?.focus()
}
const filters = reactive<Record<IconType, boolean>>({ aetheryte: true, zoneExit: true, misc: false, sightseeing: true, mining: true, botany: true, fishing: true, fates: true, eliteHunts: true })
const counts = reactive<Record<IconType, number>>({ aetheryte: 0, zoneExit: 0, misc: 0, sightseeing: 0, mining: 0, botany: 0, fishing: 0, fates: 0, eliteHunts: 0 })
const selectedData = ref<DataType | ''>('')
const tableRows = ref<any[]>([])
const fishingRows = ref<any[]>([])
const isGathering = computed(() => selectedData.value === 'mining' || selectedData.value === 'botany')
const selectedCode = ref<string | null>(null)
const hoveredNodeCode = ref<string | null>(null)
let selectedMarkers: L.Marker[] = []
const nodeMarkers = new Map<any, L.Marker>()
const huntMarkers = new Map<any, L.Marker[]>()
let detailRowSelected = ref<any | null>(null)
const fishDetails = computed(() => {
    if (!detailRowSelected.value?.name) return []
    const allFish = props.ffxivData?.fishing ?? []
    return allFish.filter((fish: any) => fish.spot === detailRowSelected.value.name)
})

import { watch } from 'vue'
watch(() => fishDetails.value, (fish) => {
    for (const item of fish) {
        if (item.name) ensureItemIcon(item.name)
        if (item.bait && item.bait !== '-') ensureItemIcon(item.bait)
    }
})
interface DetailGroup {
    name: string
    rows: { key: string; value: string }[]
    error: string
}
const detailGroups = ref<DetailGroup[]>([])
const detailLoading = ref(false)
let detailToken = 0

let map: L.Map | null = null
let overlay: L.ImageOverlay | null = null
const typeLayers = {} as Record<IconType, L.LayerGroup>
let loadToken = 0

onMounted(async () => {
    if (!mapEl.value) return

    buildZoneGroups()

    map = L.map(mapEl.value, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 3,
        zoomSnap: 0.25,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
        wheelPxPerZoomLevel: 120,
    })

    for (const { key } of ICON_TYPES) {
        typeLayers[key] = L.layerGroup()
    }
    for (const { key } of MARKER_TYPES) {
        if (filters[key]) typeLayers[key].addTo(map)
    }

    await loadZone(selectedZone.value)

    document.addEventListener('click', onZoneSelectDocumentClick)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', onZoneSelectDocumentClick)

    if (map) {
        map.remove()
        map = null
        overlay = null
    }
})

function buildZoneGroups() {
    const areas: any[] = props.ffxivData?.areas ?? []
    const order: string[] = []
    const byExpansion = new Map<string, Map<string, ZoneEntry>>()

    for (const area of areas) {
        if (!area.inoverview) continue
        const { expansion, zone, type } = area
        if (!byExpansion.has(expansion)) {
            byExpansion.set(expansion, new Map())
            order.push(expansion)
        }
        const zones = byExpansion.get(expansion)!
        if (!zones.has(zone)) {
            zones.set(zone, {
                zone,
                type,
                variant: String(area.variant ?? 0).padStart(2, '0'),
            })
        }
    }

    zoneGroups.value = order.map((expansion) => ({
        expansion,
        zones: [...byExpansion.get(expansion)!.values()],
    }))
}

function selectZone(zoneName: string) {
    selectedZone.value = zoneName
    isZoneListOpen.value = false
    loadZone(zoneName)
}

function onZoneSelectDocumentClick(e: MouseEvent) {
    if (isZoneListOpen.value && zoneSelectEl.value && !zoneSelectEl.value.contains(e.target as Node)) {
        isZoneListOpen.value = false
    }
}

function variantForZone(zoneName: string): string {
    for (const group of zoneGroups.value) {
        const match = group.zones.find((z) => z.zone === zoneName)
        if (match) return match.variant
    }
    return '00'
}

async function loadZone(zoneName: string) {
    if (!map) return

    const token = ++loadToken
    isLoading.value = true
    hasError.value = false
    clearDetails()
    selectMarker(null)
    nodeMarkers.clear()
    huntMarkers.clear()
    fishingRows.value = []
    for (const { key } of ICON_TYPES) {
        typeLayers[key]?.clearLayers()
        counts[key] = 0
    }

    try {
        const meta = await resolveMapMeta(zoneName, variantForZone(zoneName))

        if (token !== loadToken || !map) return

        await preloadImage(meta.imageUrl)
        if (token !== loadToken || !map) return

        const bounds: L.LatLngBoundsExpression = [[0, 0], [MAP_PX, MAP_PX]]

        if (overlay) {
            overlay.setUrl(meta.imageUrl)
            overlay.setBounds(L.latLngBounds(bounds))
        } else {
            overlay = L.imageOverlay(meta.imageUrl, bounds).addTo(map)
        }

        map.setMaxBounds(bounds)
        map.fitBounds(bounds)
        isLoading.value = false

        renderSightseeing(zoneName)
        renderGathering(zoneName, 'miner', 'mining')
        renderGathering(zoneName, 'botany', 'botany')
        renderFates(zoneName)
        renderEliteHunts(zoneName)
        buildTable()

        if (meta.markerRange != null) {
            renderMapMarkers(meta.markerRange, token)
        }
        renderFishing(zoneName, token)
    } catch (err: any) {
        if (token !== loadToken) return
        console.error('[LeafletMap] map load failed', err)
        hasError.value = true
        errorMsg.value = err?.message ?? 'Unknown error'
        isLoading.value = false
    }
}

function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Map image failed to load'))
        img.src = url
    })
}

async function resolveMapMeta(zoneName: string, variant: string): Promise<MapMeta> {
    const query = encodeURIComponent(`PlaceName.Name~"${zoneName}"`)
    const searchUrl = `${BASE_URL}/api/search?sheets=Map&query=${query}&fields=Id,MapMarkerRange,PlaceName.Name&limit=1`

    const res = await fetch(searchUrl)
    if (!res.ok) throw new Error(`Search request failed (${res.status})`)

    const data = await res.json()
    const firstResult = data?.results?.[0]
    if (!firstResult) throw new Error(`No map found for "${zoneName}"`)

    const rawId = firstResult.fields?.Id
    if (!rawId) throw new Error('Map result is missing an Id')

    const idBase = String(rawId).split('/')[0]
    const markerRange = firstResult.fields?.MapMarkerRange

    return {
        imageUrl: `${BASE_URL}/api/asset/map/${idBase}/${variant}`,
        markerRange: typeof markerRange === 'number' ? markerRange : null,
    }
}

async function renderMapMarkers(range: number, token: number) {
    try {
        const fields = 'X,Y,Icon.id,Icon.path,PlaceNameSubtext.Name,Type'
        const url = `${BASE_URL}/api/sheet/MapMarker?after=${range}&limit=400&fields=${fields}`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Marker request failed (${res.status})`)

        const data = await res.json()
        if (token !== loadToken || !map) return

        const rows: any[] = (data?.rows ?? []).filter((r: any) => r.row_id === range)

        for (const row of rows) {
            const f = row.fields ?? {}
            const iconId = f.Icon?.id ?? 0
            const iconPath = f.Icon?.path
            if (!iconId || !iconPath || AREA_POINT_ICON_IDS.has(iconId)) continue

            const latlng: L.LatLngExpression = [MAP_PX - f.Y, f.X]
            const name = (f.PlaceNameSubtext?.fields?.Name ?? '').replace(/\n/g, ' — ').trim()
            const type = classifyMarker(iconId, name, f.Type)
            makeMarker(latlng, mapMarkerIconUrl(iconPath), name).addTo(typeLayers[type])
            counts[type]++
        }
    } catch (err) {
        console.error('[LeafletMap] marker load failed', err)
    }
}

function classifyMarker(iconId: number, name: string, markerType: number): IconType {
    if (AETHERYTE_ICON_IDS.has(iconId) || /aetheryte/i.test(name)) return 'aetheryte'
    if (ZONE_EXIT_ICON_IDS.has(iconId)) return 'zoneExit'
    if (markerType === 1) return 'zoneExit'
    return 'misc'
}

// Driven by the checkbox's own checked state rather than by negating `filters`:
// the input is bound with a one-way :checked, so the DOM is the authority on what
// the user just did. Writing `filters` back is what makes the box survive the next
// re-render — without it the layer never moved and the tick silently reverted.
function toggleType(key: IconType, checked: boolean) {
    filters[key] = checked
    if (!map) return
    if (checked) typeLayers[key].addTo(map)
    else typeLayers[key].remove()
}

function selectDataLayer(key: DataType) {
    if (selectedData.value !== key) {
        selectMarker(null)
        detailRowSelected.value = null
    }
    selectedData.value = key
    if (map) {
        for (const { key: dk } of DATA_TYPES) {
            if (dk === key) typeLayers[dk].addTo(map)
            else typeLayers[dk].remove()
        }
    }
    buildTable()
}

function buildTable() {
    const zone = selectedZone.value
    const key = selectedData.value
    const d = props.ffxivData ?? {}
    if (!key) {
        tableRows.value = []
        return
    }
    if (key === 'fishing') {
        tableRows.value = fishingRows.value
        return
    }
    const byZone = (arr: any[], path: 'zone' | 'areaZone') =>
        (arr ?? []).filter((n: any) => (path === 'zone' ? n.zone === zone : n.area?.zone === zone))
    const sources: Record<Exclude<DataType, 'fishing'>, any[]> = {
        sightseeing: byZone(d.sightseeing, 'zone'),
        mining: groupByNodeCode(byZone(d.miner, 'areaZone')),
        botany: groupByNodeCode(byZone(d.botany, 'areaZone')),
        fates: byZone(d.fates, 'zone'),
        eliteHunts: byZone(d.eliteHunts, 'zone'),
    }
    tableRows.value = sources[key]

    if (key === 'mining' || key === 'botany') {
        for (const row of tableRows.value) {
            for (const it of row._items ?? []) ensureItemIcon(it.name)
        }
    }
}

const itemIcons = reactive<Record<string, string | null>>({})
// Lazily resolves an item's icon URL from xivapi, caching by name. The null
// placeholder is written up front so concurrent rows don't refetch the same item.
async function ensureItemIcon(name: string) {
    if (name in itemIcons) return
    itemIcons[name] = null
    try {
        const query = encodeURIComponent(`Name="${name}"`)
        const res = await fetch(`${BASE_URL}/api/search?sheets=Item&query=${query}&fields=Icon.path&limit=1`)
        if (!res.ok) return
        const data = await res.json()
        const path = data?.results?.[0]?.fields?.Icon?.path
        if (path) itemIcons[name] = mapMarkerIconUrl(path)
    } catch {
        /* leave null — the row still shows the name + tracker */
    }
}

function groupByNodeCode(nodes: any[]): any[] {
    const groups = new Map<string, any>()
    for (const n of nodes) {
        const code = n.node_code
        const existing = groups.get(code)
        if (existing) {
            existing._items.push(n)
            existing.name += `, ${n.name}`
            if (!existing.time && n.time) existing.time = n.time
        } else {
            groups.set(code, { ...n, _items: [n] })
        }
    }
    return [...groups.values()]
}

function makeMarker(
    latlng: L.LatLngExpression,
    iconUrl: string,
    name: string,
    onClick?: () => void,
): L.Marker {
    const icon = L.icon({
        iconUrl,
        iconSize: [ICON_SIZE, ICON_SIZE],
        iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
        className: 'leafletMap_markerIcon',
    })
    const marker = L.marker(latlng, { icon })
    if (name) {
        marker.bindTooltip(name, {
            direction: 'top',
            offset: [0, -ICON_SIZE / 2],
            className: 'leafletMap_tooltip',
        })
    }
    if (onClick) {
        marker.on('click', () => {
            selectMarker(marker)
            onClick()
        })
    }
    return marker
}

function registerNodeMarker(marker: L.Marker, nodes: any[], repRow: any) {
    ;(marker as any)._repRow = repRow
    for (const n of nodes) nodeMarkers.set(n, marker)
}

function selectMarkers(markers: L.Marker[], repRow: any) {
    for (const m of selectedMarkers) m.getElement()?.classList.remove('leafletMap_markerIcon--active')
    selectedMarkers = markers
    for (const m of markers) m.getElement()?.classList.add('leafletMap_markerIcon--active')
    selectedCode.value = repRow?.node_code ?? null
}

function selectMarker(marker: L.Marker | null) {
    selectMarkers(marker ? [marker] : [], marker ? (marker as any)._repRow : null)
}

function selectHunt(hunt: any) {
    const markers = huntMarkers.get(hunt) ?? []
    selectMarkers(markers, hunt)
    if (markers.length && map) map.panTo(markers[0].getLatLng())
}

function selectTableRow(row: any) {
    detailRowSelected.value = row
    if (selectedData.value === 'eliteHunts') {
        selectHunt(row)
        return
    }
    const lookup = row._items ? row._items[0] : row
    let marker = nodeMarkers.get(lookup) ?? null

    if (!marker && selectedData.value === 'fishing' && row.node_code) {
        for (const [key, value] of nodeMarkers) {
            if (key.node_code === row.node_code) {
                marker = value
                break
            }
        }
    }

    selectMarker(marker)
    selectedCode.value = row.node_code ?? null
    if (marker && map) map.panTo(marker.getLatLng())
}

function mapMarkerIconUrl(path: string): string {
    return `${BASE_URL}/api/asset?path=${encodeURIComponent(path)}&format=png`
}

function nodeLatLng(node: any): L.LatLngExpression | null {
    let px: number, py: number
    if (typeof node.transx === 'number' && typeof node.transy === 'number') {
        px = node.transx
        py = node.transy
    } else {
        const mapsize = node.area?.mapsize
        if (typeof mapsize !== 'number' || typeof node.x !== 'number' || typeof node.y !== 'number') {
            return null
        }
        px = (node.x / mapsize) * 800
        py = (node.y / mapsize) * 800
    }
    return [MAP_PX - py * NODE_SCALE, px * NODE_SCALE]
}

function renderSightseeing(zone: string) {
    const nodes: any[] = (props.ffxivData?.sightseeing ?? []).filter((n: any) => n.zone === zone)
    const layer = typeLayers.sightseeing
    let count = 0
    for (const n of nodes) {
        const latlng = nodeLatLng(n)
        if (!latlng) continue
        const m = makeMarker(latlng, `${ICON_CDN}/sightseeing.webp`, n.name, () => {
            selectDataLayer('sightseeing')
            showNodeDetails(n, fetchVistaApi)
        })
        registerNodeMarker(m, [n], n)
        m.addTo(layer)
        count++
    }
    counts.sightseeing = count
}

function renderGathering(zone: string, job: 'miner' | 'botany', typeKey: IconType) {
    const nodes: any[] = (props.ffxivData?.[job] ?? []).filter((n: any) => n.area?.zone === zone)
    const layer = typeLayers[typeKey]

    const byPosition = new Map<string, any[]>()
    for (const n of nodes) {
        const key = `${n.transx},${n.transy},${n.x},${n.y}`
        if (!byPosition.has(key)) byPosition.set(key, [])
        byPosition.get(key)!.push(n)
    }

    let count = 0
    for (const here of byPosition.values()) {
        const latlng = nodeLatLng(here[0])
        if (!latlng) continue
        const label = here.map((n) => n.name).join(', ')
        const m = makeMarker(latlng, `${ICON_CDN}/${here[0].job_sub}.webp`, label, () => {
            selectDataLayer(typeKey as DataType)
            showNodeDetails(here, fetchItemApi)
        })
        registerNodeMarker(m, here, here[0])
        m.addTo(layer)
        count++
    }
    counts[typeKey] = count
}

function renderFates(zone: string) {
    const nodes: any[] = (props.ffxivData?.fates ?? []).filter((n: any) => n.zone === zone)
    const layer = typeLayers.fates
    let count = 0
    for (const n of nodes) {
        const latlng = nodeLatLng(n)
        if (!latlng) continue
        const m = makeMarker(latlng, `${ICON_CDN}/fate_${n.job_sub}.webp`, n.name, () => {
            selectDataLayer('fates')
            showNodeDetails(n, fetchFateApi)
        })
        registerNodeMarker(m, [n], n)
        m.addTo(layer)
        count++
    }
    counts.fates = count
}

async function renderFishing(zone: string, token: number) {
    const layer = typeLayers.fishing
    try {
        const query = encodeURIComponent(`TerritoryType.PlaceName.Name~"${zone}"`)
        const fields = 'PlaceName.Name,X,Z,Rare,GatheringLevel,Item[].Name'
        const url = `${BASE_URL}/api/search?sheets=FishingSpot&query=${query}&fields=${fields}&limit=50`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Fishing lookup failed (${res.status})`)

        const data = await res.json()
        if (token !== loadToken || !map) return

        const results: any[] = data?.results ?? []
        const rows: any[] = []
        let count = 0

        for (const r of results) {
            const f = r.fields ?? {}
            const name = f.PlaceName?.fields?.Name ?? ''
            if (!name) continue

            const fish = (f.Item ?? [])
                .map((it: any) => it.fields?.Name)
                .filter((n: string) => !!n)
                .join(', ')

            const row = {
                name,
                zone,
                level: f.GatheringLevel ?? null,
                rare: f.Rare ? '★ Rare' : '',
                fish,
                node_code: `fishing_${r.row_id}`,
            }
            rows.push(row)

            const latlng: L.LatLngExpression = [MAP_PX - (f.Z ?? 0), f.X ?? 0]
            const m = makeMarker(latlng, `${ICON_CDN}/fishing.webp`, name, () => {
                selectDataLayer('fishing')
                showNodeDetails(row, fetchFishingApi)
            })
            registerNodeMarker(m, [row], row)
            m.addTo(layer)
            count++
        }

        fishingRows.value = rows
        counts.fishing = count
        if (selectedData.value === 'fishing') buildTable()
    } catch (err) {
        console.error('[LeafletMap] fishing load failed', err)
    }
}

function renderEliteHunts(zone: string) {
    const hunts: any[] = (props.ffxivData?.eliteHunts ?? []).filter((h: any) => h.area?.zone === zone)
    const layer = typeLayers.eliteHunts

    const byPosition = new Map<string, { point: any; hunts: any[] }>()
    for (const hunt of hunts) {
        for (const p of hunt.points ?? []) {
            const key = `${p.transx},${p.transy},${p.x},${p.y}`
            if (!byPosition.has(key)) byPosition.set(key, { point: p, hunts: [] })
            byPosition.get(key)!.hunts.push(hunt)
        }
    }

    let count = 0
    for (const { point, hunts: here } of byPosition.values()) {
        const latlng = nodeLatLng({ ...point, area: here[0].area })
        if (!latlng) continue
        const iconName = here.some((h) => h.rank === 'SS') ? 'hunts_ss' : 'hunts'
        const label = here.map((h) => `${h.name} (${h.rank})`).join(', ')
        const m = makeMarker(latlng, `${ICON_CDN}/${iconName}.webp`, label, () => {
            selectDataLayer('eliteHunts')
            selectHunt(here[0])
            showNodeDetails(here, fetchHuntApi)
        })
        ;(m as any)._repRow = here[0]
        for (const hunt of here) {
            if (!huntMarkers.has(hunt)) huntMarkers.set(hunt, [])
            huntMarkers.get(hunt)!.push(m)
        }
        m.addTo(layer)
        count++
    }
    counts.eliteHunts = count
}

async function showNodeDetails(
    nodes: any | any[],
    apiFetcher: (name: string) => Promise<Record<string, any> | null>,
) {
    const list: any[] = Array.isArray(nodes) ? nodes : [nodes]
    const token = ++detailToken
    detailLoading.value = true
    detailGroups.value = list.map((n) => ({ name: n.name, rows: [], error: '' }))

    const groups = await Promise.all(
        list.map(async (n): Promise<DetailGroup> => {
            try {
                const apiFields = await apiFetcher(n.name)
                return { name: n.name, rows: mergeNode(n, apiFields), error: '' }
            } catch (err: any) {
                return { name: n.name, rows: mergeNode(n, null), error: err?.message ?? 'API lookup failed' }
            }
        }),
    )

    if (token !== detailToken) return
    detailGroups.value = groups
    detailLoading.value = false
}

async function fetchVistaApi(name: string): Promise<Record<string, any> | null> {
    const query = encodeURIComponent(`Name~"${name}"`)
    const fields = 'Name,Description,Emote.Name,MinTime,MaxTime,PlaceName.Name,IconList.path'
    const url = `${BASE_URL}/api/search?sheets=Adventure&query=${query}&fields=${fields}&limit=10`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Vista lookup failed (${res.status})`)

    const data = await res.json()
    const results: any[] = data?.results ?? []
    const match = results.find((r) => r.fields?.Name === name) ?? results[0]
    if (!match) return null

    const f = match.fields ?? {}
    return {
        api_name: f.Name ?? null,
        api_region: f.PlaceName?.fields?.Name ?? null,
        api_emote: f.Emote?.fields?.Name ?? null,
        api_minTime: f.MinTime ?? null,
        api_maxTime: f.MaxTime ?? null,
        api_description: (f.Description ?? '').trim() || null,
        api_icon: f.IconList?.path ? mapMarkerIconUrl(f.IconList.path) : null,
    }
}

async function fetchItemApi(name: string): Promise<Record<string, any> | null> {
    const query = encodeURIComponent(`Name="${name}"`)
    const fields = 'Name,Description,LevelItem.value,Rarity,ItemUICategory.Name,Icon.path,StackSize,PriceLow,CanBeHq'
    const url = `${BASE_URL}/api/search?sheets=Item&query=${query}&fields=${fields}&limit=5`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Item lookup failed (${res.status})`)

    const data = await res.json()
    const results: any[] = data?.results ?? []
    const match = results.find((r) => r.fields?.Name === name) ?? results[0]
    if (!match) return null

    const f = match.fields ?? {}
    return {
        api_name: f.Name ?? null,
        api_category: f.ItemUICategory?.fields?.Name ?? null,
        api_itemLevel: f.LevelItem?.value ?? null,
        api_rarity: f.Rarity ?? null,
        api_stackSize: f.StackSize ?? null,
        api_sellPrice: f.PriceLow ?? null,
        api_canBeHq: f.CanBeHq ?? null,
        api_description: (f.Description ?? '').trim() || null,
        api_icon: f.Icon?.path ? mapMarkerIconUrl(f.Icon.path) : null,
    }
}

async function fetchFishingApi(_name: string): Promise<Record<string, any> | null> {
    return null
}

async function fetchFateApi(name: string): Promise<Record<string, any> | null> {
    const query = encodeURIComponent(`Name~"${name}"`)
    const fields = 'Name,Description,ClassJobLevel,ClassJobLevelMax,Icon.path'
    const url = `${BASE_URL}/api/search?sheets=Fate&query=${query}&fields=${fields}&limit=10`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`FATE lookup failed (${res.status})`)

    const data = await res.json()
    const results: any[] = data?.results ?? []
    const match = results.find((r) => r.fields?.Name === name) ?? results[0]
    if (!match) return null

    const f = match.fields ?? {}
    return {
        api_name: f.Name ?? null,
        api_level: f.ClassJobLevel ?? null,
        api_levelMax: f.ClassJobLevelMax ?? null,
        api_description: (f.Description ?? '').trim() || null,
        api_icon: f.Icon?.path ? mapMarkerIconUrl(f.Icon.path) : null,
    }
}

async function fetchHuntApi(name: string): Promise<Record<string, any> | null> {
    const query = encodeURIComponent(`BNpcName.Singular~"${name}"`)
    const fields = 'BNpcName.Singular,Rank,BNpcBase'
    const url = `${BASE_URL}/api/search?sheets=NotoriousMonster&query=${query}&fields=${fields}&limit=10`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Hunt lookup failed (${res.status})`)

    const data = await res.json()
    const results: any[] = data?.results ?? []
    const match = results.find((r) => r.fields?.BNpcName?.fields?.Singular === name) ?? results[0]
    if (!match) return null

    const f = match.fields ?? {}
    return {
        api_name: f.BNpcName?.fields?.Singular ?? null,
        api_rank: f.Rank ?? null,
        api_bNpcNameId: f.BNpcName?.row_id ?? null,
        api_bNpcBaseId: f.BNpcBase?.row_id ?? f.BNpcBase?.value ?? null,
    }
}

function mergeNode(node: any, api: Record<string, any> | null): { key: string; value: string }[] {
    const combined: Record<string, any> = { ...node, ...(api ?? {}) }
    return Object.entries(combined)
        .filter(([, value]) => value !== null && value !== undefined && value !== false && value !== '')
        .map(([key, value]) => ({
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
        }))
}

function clearDetails() {
    detailToken++
    detailGroups.value = []
    detailLoading.value = false
}
</script>

<style scoped lang="scss">

@keyframes leafletMap_spin {
    to { transform: rotate(360deg); }
}

.leafletMap {

    position: relative;
    display: flex;
    justify-content: center;
    font-family: 'Rajdhani', sans-serif;

    // Fixed 600px basis so the map keeps its square footprint and the content
    // area takes whatever is left. `min-width: 0` lets it shrink past that basis
    // once the row wraps — without it the 600px stage inside sets a min-content
    // floor and the map overflows its container on narrow viewports.
    &_content {
        position: relative; z-index: 10;
        flex: 0 1 600px;
        min-width: 0;
        max-width: 600px;
        display: flex; flex-direction: column;
        align-items: center; gap: 22px;
    }

    &_stage {
        position: relative;
        width: 600px;
        max-width: 100%;
    }

    &_fade-enter-active,
    &_fade-leave-active {
        transition: opacity 0.25s ease;
    }
    &_fade-enter-from,
    &_fade-leave-to {
        opacity: 0;
    }

    &_overlay {
        position: absolute;
        inset: 0;
        z-index: 20;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        border-radius: 10px;
        background: rgba(6, 10, 18, 0.78);
        backdrop-filter: blur(2px);
        font-size: 0.9rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;

        &--error {
            color: $red;
            text-transform: none;
            letter-spacing: 0.02em;
        }
    }

    &_overlayText {
        opacity: 0.85;
        font-family: 'Share Tech Mono', monospace;
    }

    &_spinner {
        width: 44px;
        height: 44px;
        border: 3px solid $buttonBorder;
        border-top-color: $teal;
        border-radius: 50%;
        animation: leafletMap_spin 0.8s linear infinite;
        box-shadow: 0 0 18px rgba(45, 212, 191, 0.25);
    }

    &_canvas {
        width: 600px;
        height: 600px;
        max-width: 100%;
        background: #060a12;
        border: 1px solid $buttonBorder;
        border-radius: 10px;
        overflow: hidden;
        z-index: 1;
    }

}

.mapContext {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 24px;
    width: 100%;
}

.zoneSelect {
    position: relative;
}

.eorzeaOverview {

    // Takes the space the map leaves. `min-width: 0` is what lets the wide
    // node tables shrink inside a flex item — without it they keep their
    // content width and push the row into a horizontal overflow.
    &_contentArea {
        position: relative;
        flex: 1 1 420px;
        min-width: 0;
        margin-top: 6px;
    }

    &_filterLabel {
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        color: $dim;
        margin-bottom: 2px;
        width: 100%;
        grid-column: 1 / span 2;
    }

    &_select {
        appearance: none;
        margin-top: 8px;
        width: 100%;
        padding: 13px 40px 13px 16px;
        border-radius: 8px;
        border: 1px solid $buttonBorder;
        background: rgba(255, 255, 255, 0.03);
        font-family: 'Rajdhani', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: rgba(45, 212, 191, 0.07);
            border-color: rgba(45, 212, 191, 0.35);
            color: #e8f0ff;
            cursor: pointer;
        }

        &:focus {
            outline: none;
            border-color: $teal;
            box-shadow: 0 0 0 1px $tealShadow;
            cursor: pointer;
        }

        &--trigger {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            text-align: left;
            color: inherit;
        }
    }

    &_arrow {
        position: absolute;
        right: 16px; top: 50px;
        transform: translateY(-50%);
        color: $teal;
        pointer-events: none;
        font-size: 0.8rem;
    }

    &_zoneIcon {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        object-fit: contain;
    }

    &_zoneList {
        position: absolute;
        left: 0; right: 0;
        top: 100%;
        z-index: 30;
        margin-top: 4px;
        max-height: 320px;
        overflow-y: auto;
        list-style: none;
        padding: 6px 0;
        border-radius: 8px;
        border: 1px solid $buttonBorder;
        background: #0b1220;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
    }

    &_zoneGroup {
        display: flex;
        flex-direction: column;
    }

    &_zoneGroupLabel {
        padding: 8px 16px 4px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 0.78rem;
        color: $teal;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    &_zoneOption {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 8px 16px;
        border: none;
        background: none;
        color: #c8d8f0;
        font-family: 'Rajdhani', sans-serif;
        font-size: 0.95rem;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;

        &:hover {
            background: rgba(45, 212, 191, 0.1);
            color: #e8f0ff;
        }

        &--active {
            background: rgba(45, 212, 191, 0.18);
            color: #e8f0ff;
        }
    }

    &_checkboxes {
        width: 100%;
        margin-top: 14px;

        &.markertypes > div {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;

            .eorzeaOverview_checkbox {
                flex: 1 1 140px;
                min-width: 120px;
                
            }
        }

        &.datalayers {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
        }
    }

    &_checkbox {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 5px 11px;
        border-radius: 8px;
        border: 1px solid $buttonBorder;
        background: rgba(255, 255, 255, 0.03);
        font-family: 'Rajdhani', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 0.03em;
        cursor: pointer;
        transition: all 0.2s;
        &.inactive {opacity: 0.3}

        &:hover {
            background: rgba(45, 212, 191, 0.07);
            border-color: rgba(45, 212, 191, 0.35);
            color: #e8f0ff;
        }

        input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
        }

        &-box {
            flex-shrink: 0;
            width: 18px;
            height: 18px;
            border-radius: 4px;
            border: 1px solid rgba(45, 212, 191, 0.45);
            background: rgba(6, 10, 18, 0.6);
            position: relative;
            transition: all 0.2s;

            &::after {
                content: '';
                position: absolute;
                left: 5px; top: 1px;
                width: 5px; height: 10px;
                border: solid #060a12;
                border-width: 0 2px 2px 0;
                transform: rotate(45deg) scale(0);
                transition: transform 0.15s ease;
            }
        }

        &-label {
            flex: 1;
            user-select: none;
        }

        &-count {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.8rem;
            color: $dim;
            user-select: none;
        }

        input:checked + &-box {
            background: $teal;
            border-color: $teal;
            box-shadow: 0 0 10px $tealShadow;
        }
        input:checked + &-box::after {
            transform: rotate(45deg) scale(1);
        }
        input:focus-visible + &-box {
            box-shadow: 0 0 0 2px $tealShadow;
        }
    }

    &_content {
        width: 100%;
        margin-top: 14px;
        border: 1px solid $buttonBorder;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.03);
        overflow: hidden;
    }

}

/* ── Clicked-vista detail panel ── */
.leafletMap_vistaHead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 14px;
    background: rgba(45, 212, 191, 0.07);
    border-bottom: 1px solid $buttonBorder;
}

.leafletMap_vistaTitle {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: #e8f0ff;
}

.leafletMap_vistaStatus {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    color: $teal;
}

.leafletMap_vistaError {
    padding: 8px 14px;
    color: $red;
    font-size: 0.85rem;
}

.leafletMap_vistaRow {
    display: flex;
    gap: 10px;
    padding: 7px 14px;
    font-size: 0.85rem;
    line-height: 1.4;

    & + & { border-top: 1px solid rgba(45, 212, 191, 0.08); }
}

.leafletMap_vistaKey {
    flex: 0 0 38%;
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.76rem;
    color: $teal;
    word-break: break-word;
}

.leafletMap_vistaVal {
    flex: 1;
    word-break: break-word;
}

/* ── Radio (data layer) — round box to distinguish from checkboxes ── */
.eorzeaOverview_checkbox input[type="radio"] + .eorzeaOverview_checkbox-box {
    border-radius: 50%;
}

/* ── Zone tables ──────────────────────────────────────────────────────────
   Same treatment as 2_TimedMiningBotany.vue: a bordered card, mono uppercase
   teal headers, a teal hairline split, and grid rows that highlight on hover.
   Columns are tighter here because these live in the content area beside the
   map rather than across the full page width. */
.rdrTable {
    margin-top: 14px;
    border: 1px solid $buttonBorder;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.02);
    padding: 8px 12px 12px;

    &_header .rdrTable_row p {
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: $teal;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    &_split {
        border: none;
        border-top: 1px solid rgba(45, 212, 191, 0.15);
        margin: 4px 0 8px;
    }

    &_body .rdrTable_row {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid transparent;
        transition: all 0.15s;
        cursor: pointer;
        font-size: 0.86rem;

        &:hover {
            background: rgba(45, 212, 191, 0.05);
            border-color: rgba(45, 212, 191, 0.15);
        }

        &--selected {
            background: rgba(45, 212, 191, 0.18) !important;
            border-color: rgba(45, 212, 191, 0.4) !important;
        }
    }

    // Cells that pair a control with a value.
    &_row-time,
    &_row-tracking,
    &_row-name {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    &_row-actions {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        font-size: 0.8rem;
        color: $dim;
    }

    &_row-trigger,
    &_row-fish,
    &_row-respawn,
    &_row-type {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        color: $dim;
    }

    &_subList {
        margin-top: 2px;
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.7rem;
        color: $dim;
    }

    :deep(.trackingTriggerBtn path),
    :deep(.toDetailsBtn path) {
        fill: $dim;
    }
    :deep(.trackingTriggerBtn.tracked path) {
        fill: $teal;
    }
    :deep(.trackingTriggerBtn:hover path),
    :deep(.toDetailsBtn:hover path) {
        fill: $teal !important;
    }

    .hasContext::before {
        background: rgba(11, 18, 32, 0.95);
        border: 1px solid rgba(45, 212, 191, 0.35);
        color: #e8f0ff;
        font-family: 'Rajdhani', sans-serif;
    }

    /* ── Column layouts ── */
    &--sightseeing .rdrTable_row  { grid-template-columns: minmax(0, 1fr) 60px 110px 110px; }
    &--gathering   .rdrTable_row  { grid-template-columns: minmax(0, 1fr) 110px 110px; }
    &--fishingSpots .rdrTable_row { grid-template-columns: minmax(0, 1.1fr) 44px 74px minmax(0, 1fr); }
    &--fishDetail  .rdrTable_row  { grid-template-columns: 34px minmax(0, 1fr) 130px 110px; }
    &--fates       .rdrTable_row  { grid-template-columns: minmax(0, 1fr) 90px 70px 70px; }
    &--fates.rdrTable--hasReward .rdrTable_row { grid-template-columns: minmax(0, 1fr) 84px 62px 62px 62px; }
    &--hunts       .rdrTable_row  { grid-template-columns: minmax(0, 1fr) 52px 90px minmax(0, 0.9fr); }

    /* Tablet / mobile — shed the least important columns rather than stacking,
       matching how the node tables degrade. */
    &.tablet,
    &.mobile {
        // Every column here carries meaning, so tighten the fixed ones and give
        // the item name whatever is left rather than dropping any.
        &.rdrTable--gathering .rdrTable_row { grid-template-columns: minmax(0, 1fr) 78px 92px; }

        &.rdrTable--sightseeing .rdrTable_row { grid-template-columns: minmax(0, 1fr) 100px; }
        &.rdrTable--sightseeing .rdrTable_row-flying,
        &.rdrTable--sightseeing .rdrTable_row-emote { display: none; }

        &.rdrTable--fishingSpots .rdrTable_row { grid-template-columns: minmax(0, 1fr) 44px; }
        &.rdrTable--fishingSpots .rdrTable_row-rare,
        &.rdrTable--fishingSpots .rdrTable_row-fish { display: none; }

        &.rdrTable--fishDetail .rdrTable_row { grid-template-columns: 34px minmax(0, 1fr) 100px; }
        &.rdrTable--fishDetail .rdrTable_row-actions { display: none; }

        &.rdrTable--fates .rdrTable_row,
        &.rdrTable--fates.rdrTable--hasReward .rdrTable_row { grid-template-columns: minmax(0, 1fr) 70px; }
        &.rdrTable--fates .rdrTable_row-exp,
        &.rdrTable--fates .rdrTable_row-gil,
        &.rdrTable--fates .rdrTable_row-reward { display: none; }

        &.rdrTable--hunts .rdrTable_row { grid-template-columns: minmax(0, 1fr) 52px; }
        &.rdrTable--hunts .rdrTable_row-respawn,
        &.rdrTable--hunts .rdrTable_row-trigger { display: none; }
    }
}

/* One card per gathering node; the whole card is the click target. */
.rdrTableGroups .rdrTable {
    cursor: pointer;

    &.rdrTable--selected {
        border-color: rgba(45, 212, 191, 0.4);
        background: rgba(45, 212, 191, 0.07);
    }

    &:hover {
        border-color: rgba(45, 212, 191, 0.3);
    }
}

/* Match Leaflet's controls to the dark teal theme. */
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

/* Crisp marker icons with a subtle shadow so they read against the map. */
:deep(.leafletMap_markerIcon) {
    filter: drop-shadow(0 0 2px #000);
}

/* Selected icon — pulses with a teal halo so it stands out from the rest.
   Animating `filter` (not `transform`) leaves Leaflet's positioning intact. */
:deep(.leafletMap_markerIcon--active) {
    z-index: 1000 !important;
    animation: leafletMap_iconPulse 1s ease-in-out infinite;
}
@keyframes leafletMap_iconPulse {
    0%, 100% {
        filter: drop-shadow(0 0 2px #000) drop-shadow(0 0 4px #2dd4bf);
    }
    50% {
        filter: drop-shadow(0 0 3px #000) drop-shadow(0 0 14px #2dd4bf) brightness(1.5);
    }
}

/* Hover label above each icon — styled to match the homepage's nav buttons. */
:deep(.leafletMap_tooltip.leaflet-tooltip) {
    background: rgba(11, 18, 32, 0.95);
    border: 1px solid rgba(45, 212, 191, 0.35);
    border-radius: 6px;
    padding: 5px 11px;
    color: #e8f0ff;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    white-space: nowrap;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
}
/* Recolor the little pointer triangle to match the dark bubble. */
:deep(.leafletMap_tooltip.leaflet-tooltip-top::before) {
    border-top-color: rgba(45, 212, 191, 0.35);
}

@media (max-width: 480px) {
    .leafletMap_content { padding: 28px 14px 24px; }
}
</style>
