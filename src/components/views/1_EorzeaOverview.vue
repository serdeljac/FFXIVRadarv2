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

                
                <div class="zoneSelect" ref="zoneSelectEl">
                    <span class="eorzeaOverview_filterLabel">Zone select</span>
                    <button
                        type="button"
                        class="eorzeaOverview_select eorzeaOverview_select--trigger"
                        @click="isZoneListOpen = !isZoneListOpen">
                        
                        <span>{{ selectedZone }}</span>
                    </button>
                    <span class="eorzeaOverview_arrow">▾</span>

                    <ul v-if="isZoneListOpen" class="eorzeaOverview_zoneList">
                        <li
                            v-for="group in zoneGroups"
                            :key="group.expansion"
                            class="eorzeaOverview_zoneGroup">
                            <span class="eorzeaOverview_zoneGroupLabel">{{ group.expansion }}</span>
                            <button
                                v-for="zone in group.zones"
                                :key="zone.zone"
                                type="button"
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
                            @change="toggleType(t.key)" />
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

                
                <div v-if="selectedData == 'sightseeing'" class="leafletMap_table sightseeing">
                    <table v-if="tableRows.length">
                        <thead>
                            <tr>
                                <th>Vista</th>
                                <th>Flying Req?</th>
                                <th>Emote</th>
                                <th>Timer</th>
                            </tr>
                        </thead>
                        <tbody>
                                <tr
                                    v-for="(row, ri) in tableRows"
                                    :key="ri"
                                    :class="[`leafletMap_tableRow`, 
                                    { 'leafletMap_tableRow--active': row.node_code === selectedCode }]"
                                    :data-rowActive="isNodeActive(row, timerList, weatherList)"
                                    @click="selectTableRow(row)">
                                    <td class="verticalCenter">
                                        <toggleDetailsBtn
                                            v-if="windowWidth !== 'mobile'"
                                            class="hasContext"
                                            data-context="View Details"
                                            @click="$emit('openDetails', detailRowSelected)"/>
                                        <span class="verticalCenter-text">{{ row.name }}</span>
                                    </td>
                                    <td>{{ row.mount ? 'YES' : 'NO' }}</td>
                                    <td>{{ row.emote }}</td>
                                    <td class="leafletMap_tableRow--buttons">
                                        <toggleTrackingBtn
                                            v-if="row?.time"
                                            :trackingEnabled="row?.tracked"
                                            class="hasContext"
                                            data-context="Track Node"
                                            @click="$emit('changeTracked', row)"
                                            />
                                        
                                        <span>
                                            {{ EorzeaMap(row, timerList, weatherList) }}
                                        </span>
                                        
                                    </td>
                                </tr>
                        </tbody>
                    </table>
                </div>

                
                <div v-if="selectedData == 'mining' || selectedData == 'botany'" class="leafletMap_table miningAndBotany">

                    <template v-for="(group, gi) in tableRows" :key="gi">
                        <table v-if="isGathering && group._items.length" class="leafletMap_nodeTable">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Usage</th>
                                    <th class="leafletMap_cellTimer">Timer</th>
                                </tr>
                            </thead>
                            <tbody
                                :class="{
                                    'leafletMap_nodeTableBody--active': group.node_code === selectedCode,
                                }"
                                @click="selectTableRow(group)"
                                @mouseenter="hoveredNodeCode = group.node_code"
                                @mouseleave="hoveredNodeCode = null">
                                <tr
                                    v-for="(it, ii) in group._items"
                                    :key="it.ID"
                                    class="leafletMap_tableRow"
                                    :class="{
                                        'leafletMap_groupStart': ii === 0,
                                    }">

                                    <td class="leafletMap_cellItem">
                                        <div>
                                        <img
                                            v-if="itemIcons[it.name]"
                                            :src="itemIcons[it.name]"
                                            :alt="it.name"
                                            class="leafletMap_itemImg" />
                                        <span>{{ it.name }} - Lv. {{ it.level }}{{ it.stars ? ' ' + '★'.repeat(it.stars) : '' }}</span>
                                        <iconImgAPI v-if="it.usage === 'aetherial'" class="iconSize2 shiftCollect" :name="'collectability'"/>
                                        </div>
                                    </td>

                                    <td class="leafletMap_cellTrack">
                                            <span class="hasContext" :data-context="capitalize(it.job_sub)">
                                                <iconImgAPI :name="it.job_sub"/>
                                            </span>

                                            <span v-if="it.usage" class="hasContext" :data-context="fetchUsageAttrName(it)">
                                                <iconImgAPI :name="fetchUsageImgName(it)"/>
                                            </span>

                                            <span v-if="it.node_name === 'Legendary'" class="hasContext" :data-context="`Requires ${it.tomb}`">
                                                <iconImgAPI :name="'folklore'"/>
                                            </span>
                                    </td>

                                    <td
                                        v-if="ii === 0"
                                        :rowspan="group._items.length"
                                        class="leafletMap_cellTimer">
                                        <toggleTrackingBtn
                                            v-if="group.time"
                                            :trackingEnabled="it.tracked"
                                            @click.stop="$emit('changeTracked', it)" />
                                        <timeDisplay v-if="group.time" :timerList="timerList" :timeId="group.time" />
                                        <span v-else>Any Time</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </template>

                </div>

                
                <div v-if="selectedData == 'fishing'" class="leafletMap_table fishing">
                    <table v-if="tableRows.length">
                        <thead>
                            <tr>
                                <th>Spot</th>
                                <th>Lv</th>
                                <th>Rare</th>
                                <th>Fish</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(row, ri) in tableRows"
                                :key="ri"
                                class="leafletMap_tableRow"
                                :class="{ 'leafletMap_tableRow--active': row.node_code === selectedCode }"
                                @click="selectTableRow(row)">
                                <td class="leafletMap_cellItem">{{ row.name }}</td>
                                <td>{{ row.level || '-' }}</td>
                                <td>{{ row.rare || '-' }}</td>
                                <td>{{ row.fish || '-' }}</td>
                            </tr>
                        </tbody>
                    </table>

                    
                    <div v-if="detailRowSelected && fishDetails.length" class="leafletMap_table fishing">
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Fish</th>
                                    <th>Actions</th>
                                    <th>Timer</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="fish in fishDetails" :key="fish.id" class="leafletMap_tableRow">
                                    <td>
                                        <toggleDetailsBtn
                                            v-if="windowWidth !== 'mobile'"
                                            class="hasContext"
                                            data-context="View Details"
                                            @click="$emit('openDetails', fish)"/>
                                    </td>
                                    <td class="leafletMap_cellItem">
                                        <div>
                                            <img
                                                v-if="itemIcons[fish.name]"
                                                :src="itemIcons[fish.name]"
                                                :alt="fish.name"
                                                class="leafletMap_itemImg" />
                                            <span>{{ `${fish.name} - Lv.${fish.level} ${formatStars(fish.stars)}` }}</span>
                                        </div>
                                        <ul class="lowerlist">
                                            <li v-if="fish.bait != 'mooch'">
                                                <span>Bait: {{ fish.bait }}</span>
                                            </li>
                                            <li v-else>
                                                <ul>
                                                    <li>Mooch: {{ fish.mooch_name1 }}</li>
                                                    <li v-if="fish.mooch_name2">Mooch: {{ fish.mooch_name2 }}</li>
                                                    <li v-if="fish.mooch_name3">Mooch: {{ fish.mooch_name3 }}</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </td>
                                    <td class="leafletMap_cellItem">
                                        <div>Action: {{ fish.hookset }}</div>
                                        <div>Tug: <span class="tug">{{ formatTug(fish.tug) }}</span></div>
                                    </td>
                                    <td class="leafletMap_cellTimer">
                                        <toggleTrackingBtn
                                            v-if="fish.time"
                                            :trackingEnabled="fish.tracked"
                                            @click.stop="$emit('changeTracked', fish)" />
                                        <timeDisplay v-if="fish.time" :timerList="timerList" :timeId="fish.time" />
                                        <span v-else>Any Time</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                
                <div v-if="selectedData == 'fates'" class="leafletMap_table fates">
                    <table v-if="tableRows.length">
                        <thead>
                            <tr>
                                <th>FATE</th>
                                <th>Type</th>
                                <th>EXP</th>
                                <th>Gil</th>
                                <th v-if="tableRows[0].seals">Seals</th>
                                <th v-else-if="tableRows[0].gemstones">Gems</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(row, ri) in tableRows"
                                :key="ri"
                                :class="[`leafletMap_tableRow`,
                                { 'leafletMap_tableRow--active': row.node_code === selectedCode }]"
                                @click="selectTableRow(row)">
                                <td class="verticalCenter">
                                    <toggleDetailsBtn
                                            v-if="windowWidth !== 'mobile'"
                                            class="hasContext"
                                            data-context="View Details"
                                            @click="$emit('openDetails', row)"/>
                                    <span class="verticalCenter-text">{{ `${row.name} - Lv.${row.level}` }}</span>
                                </td>
                                <td>{{ row.job_sub }}</td>
                                <td>{{ row.exp }}</td>
                                <td>{{ row.gil }}</td>
                                <td v-if="row.seals">{{ row.seals }}</td>
                                <td v-else-if="row.gemstones">{{ row.gemstones }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                
                <div v-if="selectedData == 'eliteHunts'" class="leafletMap_table eliteHunts">
                    <table v-if="tableRows.length">
                        <thead>
                            <tr>
                                <th>Mark</th>
                                <th>Rank</th>
                                <th>Respawn</th>
                                <th>Trigger?</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(row, ri) in tableRows"
                                :key="ri"
                                :class="[`leafletMap_tableRow`,
                                { 'leafletMap_tableRow--active': row.node_code === selectedCode }]"
                                @click="selectTableRow(row)">
                                <td >
                                    <div class="verticalCenter">
                                        {{ `${row.name} - Lv.${row.level}` }}
                                    </div>
                                </td>
                                <td>{{ row.rank }}</td>
                                <td>{{ row.respawn }}</td>
                                <td class="largenotes">{{ row.trigger ? row.trigger : 'none' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    </section>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageHeader from '../ui/displayPageHeader.vue'
import toggleTrackingBtn from '../ui/buttons/toggleTracking.vue'
import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
import timeDisplay from '../ui/displayTime.vue'
import iconImgAPI from '../api/iconImg.vue'
import { isNodeActive, EorzeaMap, capitalize, fetchUsageAttrName, fetchUsageImgName, formatStars, formatTug} from '../../hooks/hooks.ts'

const pageTagLine = 'Browse every zone in Final Fantasy XIV on an interactive map. Select a zone using the zone picker, then switch between tabs to view Mining nodes, Botany nodes, Sightseeing Log vistas, FATE spawn locations, Elite Hunt marks, and Aether Currents — all plotted on the zone map with coordinates. Use the Search tab to find any resource across all zones by name.'

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

function toggleType(key: IconType) {
    if (!map) return
    if (filters[key]) typeLayers[key].addTo(map)
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

    &_content {
        position: relative; z-index: 10;
        width: 100%; max-width: 800px;
        display: flex; flex-direction: column;
        align-items: center; gap: 22px;
    }

    &_stage {
        position: relative;
        width: 800px;
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
            color: #ff9b9b;
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
        width: 800px;
        height: 800px;
        max-width: 100%;
        background: #060a12;
        border: 1px solid $buttonBorder;
        border-radius: 10px;
        overflow: hidden;
        z-index: 1;
    }

}

.mapContext {
    justify-content: space-around;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
}

.zoneSelect {
    position: relative;
}

.eorzeaOverview {

    &_contentArea {
        position: relative;
        width: 100%;
        max-width: 600px;
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
        font-family: 'Cinzel', serif;
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
        max-width: 600px;
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
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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
    font-family: 'Cinzel', serif;
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
    color: #ff9b9b;
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

.leafletMap_nodeTable {
        border: 1px solid rgba(45, 212, 191, 0.15);
}

.leafletMap_nodeTable:not(:last-child) {
        margin-bottom: 16px;
}

/* ── Radio (data layer) — round box to distinguish from checkboxes ── */
.eorzeaOverview_checkbox input[type="radio"] + .eorzeaOverview_checkbox-box {
    border-radius: 50%;
}

/* ── Zone table for the selected data layer ── */
.leafletMap_table {
    width: 100%;
    margin-top: 14px;

    &.sightseeing, &.fishing, &.fates, &.eliteHunts {
        tbody tr:hover {
            background: rgba(45, 212, 191, 0.05);
        }
        tbody .leafletMap_tableRow--active{
            background: rgba(45, 212, 191, 0.18) !important;
        }
    }

    &.miningAndBotany {
        tbody:hover {
            background: rgba(45, 212, 191, 0.05);
        }
        tbody.leafletMap_nodeTableBody--active {
            background: rgba(45, 212, 191, 0.18);
        }
        .leafletMap_cellTimer > div {
            margin: auto;
        }
        .shiftCollect {
            transform: translate(-8px, -2px)
        }
    }

    .leafletMap_cellTimer {
        max-width: 60px;
        text-align: center;
    }

    &.fishing {
        .leafletMap_cellTimer {
            & > div {margin: auto;}
            max-width: 60px;
            text-align: center;
        }
    }

    &.eliteHunts {
        .largenotes {
            max-width: 160px;
        }
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
        margin-bottom: 10px;
        border-radius: 8px;
    }

    thead th {
        text-align: left;
        padding: 8px 12px;
        background: rgba(45, 212, 191, 0.1);
        color: $teal;
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        white-space: nowrap;
        border-bottom: 1px solid $teal;
    }

    tbody td {
        padding: 7px 12px;
        color: #c8d8f0;
        border-top: 1px solid rgba(45, 212, 191, 0.08);
        vertical-align: middle;
    }

    tbody tr {
        cursor: pointer;
    }

    /* Mining/Botany tables: highlight entire tbody */

    .leafletMap_table tbody.leafletMap_nodeTableBody--active ~ tbody.leafletMap_nodeTableBody--active td,
    .leafletMap_table tbody:hover td {
        background: rgba(45, 212, 191, 0.05);
    }

    tbody .leafletMap_tableRow--buttons {
        display: flex;
        align-items: center;
        span {margin-left: 6px;}
    }
}

/* Gathering table cells. Each item is its own row; the timer cell uses rowspan
   to span the node and is centered. */
.leafletMap_cellItem div {
    display: flex;
    align-items: center;
    gap: 8px;
}
.leafletMap_cellItem ul {
    margin-top: 4px;
}
.leafletMap_itemImg {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    filter: drop-shadow(0 0 1px #000);
}
.leafletMap_cellTrack {
    text-align: left;
}
.leafletMap_cellTrack > * {
    display: inline-flex;
}
.leafletMap_cellMeta {
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem;
    color: #5a6e90;
    white-space: nowrap;
    text-transform: capitalize;
}
.leafletMap_cellTimer {
    text-align: center;
    vertical-align: middle;
}
/* Stronger divider between gathering nodes than between items within a node. */
.leafletMap_table tbody tr.leafletMap_groupStart td {
    border-top: 1px solid rgba(45, 212, 191, 0.25);
}

.leafletMap_tableEmpty {
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 8px;
    color: #5a6e90;
    font-size: 0.85rem;
    text-align: center;
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
