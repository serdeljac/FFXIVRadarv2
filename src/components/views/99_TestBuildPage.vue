<template>
    <section :class="[`eorzeaOverview body_content leafletMap`, windowWidth]">

        <!-- Header -->
        <PageHeader :title="`Eorzea Overview`" :tagline="pageTagLine"/>

        <!-- Content Layout -->
        <div class="body_content-group mapContext">

            <!-- Map Zone -->
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

            <!-- Filter & Data Content -->
            <div class="eorzeaOverview_contentArea">

                <!-- Filter: Zone Select -->
                <div class="zoneSelect">
                    <span class="eorzeaOverview_filterLabel">Zone select</span>
                    <select
                        v-model="selectedZone"
                        class="eorzeaOverview_select"
                        @change="loadZone(selectedZone)">
                        <optgroup
                            v-for="group in zoneGroups"
                            :key="group.expansion"
                            :label="group.expansion">
                            <option
                                v-for="zone in group.zones"
                                :key="zone.zone"
                                :value="zone.zone">
                                {{ zone.zone }}
                            </option>
                        </optgroup>
                    </select>
                    <span class="eorzeaOverview_arrow">▾</span>
                </div>

                <!-- Filter: Node Checkboxes -->
                <div class="eorzeaOverview_checkboxes">
                    <span class="eorzeaOverview_filterLabel">Filter icons</span>
                    <label
                        v-for="t in ICON_TYPES"
                        :key="t.key"
                        class="eorzeaOverview_checkbox">
                        <input
                            type="checkbox"
                            v-model="filters[t.key]"
                            @change="toggleType(t.key)" />
                        <span class="eorzeaOverview_checkbox-box"></span>
                        <span class="eorzeaOverview_checkbox-label">{{ t.label }}</span>
                        <span class="eorzeaOverview_checkbox-count">{{ counts[t.key] }}</span>
                    </label>
                </div>

                <!-- Data Content -->
                <div v-if="detailName" class="leafletMap_vista">
                    <div class="leafletMap_vistaHead">
                        <span class="leafletMap_vistaTitle">{{ detailName }}</span>
                        <span v-if="detailLoading" class="leafletMap_vistaStatus">Loading…</span>
                    </div>
                    <p v-if="detailError" class="leafletMap_vistaError">⚠ {{ detailError }}</p>
                    <div
                        v-for="row in detailRows"
                        :key="row.key"
                        class="leafletMap_vistaRow">
                        <span class="leafletMap_vistaKey">{{ row.key }}</span>
                        <span class="leafletMap_vistaVal">{{ row.value }}</span>
                    </div>
                </div>
            </div>

        </div>
    </section>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageHeader from '../ui/displayPageHeader.vue'


const pageTagLine = 'Browse every zone in Final Fantasy XIV on an interactive map. Select a zone using the zone picker, then switch between tabs to view Mining nodes, Botany nodes, Sightseeing Log vistas, FATE spawn locations, Elite Hunt marks, and Aether Currents — all plotted on the zone map with coordinates. Use the Search tab to find any resource across all zones by name.'


// ffxivData is injected into every router view by App.vue.
const props = defineProps<{ ffxivData: any }>()

// ─── Config ───────────────────────────────────────────────────────────────
const BASE_URL = 'https://v2.xivapi.com'
// FFXIV map asset images from xivapi are 2048×2048 px, and MapMarker X/Y are
// stored in that same 2048-unit space, so markers map 1:1 onto the overlay.
const MAP_PX = 2048
// The radar's node transx/transy were precomputed for an 800px map, so scale
// them up to our 2048px overlay.
const NODE_SCALE = MAP_PX / 800
const ICON_SIZE = 28 // px, on-screen size of a marker icon
// The app's own gathering/sightseeing icons live in this S3 bucket
// (same source as components/API/iconImg.vue).
const ICON_CDN = 'https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/icons'
const DEFAULT_ZONE = 'Limsa Lominsa Lower Decks'
// Generic "area point" markers — sub-area / district name flags (e.g. "Hawkers'
// Round", "Bulwark Hall"). Excluded to reduce clutter.
const AREA_POINT_ICON_IDS = new Set([60442])
// The MapMarker `Type` field is 0 across the board, so icon types are derived
// from the data we do have: the aetheryte has a distinctive icon id, the rest
// split into named landmarks/shops vs. unlabelled markers.
const AETHERYTE_ICON_IDS = new Set([60453])
type IconType = 'aetheryte' | 'landmark' | 'other' | 'sightseeing' | 'mining' | 'botany' | 'fates'
const ICON_TYPES: { key: IconType; label: string }[] = [
    { key: 'aetheryte', label: 'Aetherytes' },
    { key: 'landmark', label: 'Landmarks & Shops' },
    { key: 'other', label: 'Other Markers' },
    { key: 'sightseeing', label: 'Sightseeing' },
    { key: 'mining', label: 'Mining' },
    { key: 'botany', label: 'Botany' },
    { key: 'fates', label: 'FATEs' },
]

// ─── Types ────────────────────────────────────────────────────────────────
interface ZoneEntry {
    zone: string    // PlaceName used both as the display label and the map lookup key
    variant: string // two-digit xivapi asset variant, e.g. "00"
}
interface ZoneGroup {
    expansion: string
    zones: ZoneEntry[]
}
interface MapMeta {
    imageUrl: string
    markerRange: number | null
}

// ─── State ────────────────────────────────────────────────────────────────
const mapEl = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMsg = ref('')
const selectedZone = ref(DEFAULT_ZONE)
const zoneGroups = ref<ZoneGroup[]>([])
// Which icon types are visible, and how many of each are on the current map.
const filters = reactive<Record<IconType, boolean>>({ aetheryte: true, landmark: true, other: true, sightseeing: true, mining: true, botany: true, fates: true })
const counts = reactive<Record<IconType, number>>({ aetheryte: 0, landmark: 0, other: 0, sightseeing: 0, mining: 0, botany: 0, fates: 0 })

// Details for a clicked node (vista / gathering): the local node merged with
// FFXIVAPI data, flattened into a single array of { key, value } rows.
const detailName = ref('')
const detailRows = ref<{ key: string; value: string }[]>([])
const detailLoading = ref(false)
const detailError = ref('')
// Guards the detail fetch against rapid clicks / stale responses.
let detailToken = 0

let map: L.Map | null = null
let overlay: L.ImageOverlay | null = null
// One marker layer per icon type so each can be toggled independently.
const typeLayers = {} as Record<IconType, L.LayerGroup>
// Guards against out-of-order responses when zones are switched quickly.
let loadToken = 0

// ─── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
    if (!mapEl.value) return

    buildZoneGroups()

    // CRS.Simple maps pixel coordinates directly to lat/lng — no geographic
    // projection — which is exactly what we want for a flat game-map image.
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

    // A layer per icon type; only the ones whose filter is on are added to the map.
    for (const { key } of ICON_TYPES) {
        typeLayers[key] = L.layerGroup()
        if (filters[key]) typeLayers[key].addTo(map)
    }

    await loadZone(selectedZone.value)
})

onBeforeUnmount(() => {
    // Tear down Leaflet to avoid leaks / duplicate maps on route change & HMR.
    if (map) {
        map.remove()
        map = null
        overlay = null
    }
})

// ─── Zone list ──────────────────────────────────────────────────────────────
// Build a deduplicated zone list grouped by expansion, mirroring the overview
// page's `inoverview` filter. Preserves first-seen ordering.
function buildZoneGroups() {
    const areas: any[] = props.ffxivData?.areas ?? []
    const order: string[] = []
    const byExpansion = new Map<string, Map<string, ZoneEntry>>()

    for (const area of areas) {
        if (!area.inoverview) continue
        const { expansion, zone } = area
        if (!byExpansion.has(expansion)) {
            byExpansion.set(expansion, new Map())
            order.push(expansion)
        }
        const zones = byExpansion.get(expansion)!
        if (!zones.has(zone)) {
            zones.set(zone, {
                zone,
                variant: String(area.variant ?? 0).padStart(2, '0'),
            })
        }
    }

    zoneGroups.value = order.map((expansion) => ({
        expansion,
        zones: [...byExpansion.get(expansion)!.values()],
    }))
}

function variantForZone(zoneName: string): string {
    for (const group of zoneGroups.value) {
        const match = group.zones.find((z) => z.zone === zoneName)
        if (match) return match.variant
    }
    return '00'
}

// ─── Loading ────────────────────────────────────────────────────────────────
async function loadZone(zoneName: string) {
    if (!map) return

    const token = ++loadToken
    isLoading.value = true
    hasError.value = false
    clearDetails()
    for (const { key } of ICON_TYPES) {
        typeLayers[key]?.clearLayers()
        counts[key] = 0
    }

    try {
        const meta = await resolveMapMeta(zoneName, variantForZone(zoneName))

        // A newer zone selection superseded this request — discard it.
        if (token !== loadToken || !map) return

        // Keep the loading animation up until the asset itself has downloaded
        // (the API call only resolves the URL). Preloading also means the
        // overlay paints instantly from cache once we swap it in.
        await preloadImage(meta.imageUrl)
        if (token !== loadToken || !map) return

        // In CRS.Simple, bounds are [[y0,x0],[y1,x1]]; 1 unit == 1 image pixel.
        const bounds: L.LatLngBoundsExpression = [[0, 0], [MAP_PX, MAP_PX]]

        // Swap the overlay rather than rebuilding the whole map.
        if (overlay) {
            overlay.setUrl(meta.imageUrl)
            overlay.setBounds(L.latLngBounds(bounds))
        } else {
            overlay = L.imageOverlay(meta.imageUrl, bounds).addTo(map)
        }

        map.setMaxBounds(bounds)
        map.fitBounds(bounds)
        isLoading.value = false

        // Sightseeing vistas and gathering nodes come from local data — render
        // them immediately.
        renderSightseeing(zoneName)
        renderGathering(zoneName, 'miner', 'mining')
        renderGathering(zoneName, 'botany', 'botany')
        renderFates(zoneName)

        // The map is visible now — fetch its icons in the background so a slow
        // marker request never blocks the map itself.
        if (meta.markerRange != null) {
            renderMapMarkers(meta.markerRange, token)
        }
    } catch (err: any) {
        if (token !== loadToken) return
        console.error('[LeafletMap] map load failed', err)
        hasError.value = true
        errorMsg.value = err?.message ?? 'Unknown error'
        isLoading.value = false
    }
}

// Resolve once the image has fully downloaded (or reject if it can't load), so
// the spinner stays up for the real cost of switching maps.
function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Map image failed to load'))
        img.src = url
    })
}

// ─── API: base map ────────────────────────────────────────────────────────
// Mirrors the search flow in components/API/mapImg.vue: look up the Map sheet
// by PlaceName, then build the asset URL. Also grabs the MapMarkerRange so we
// can fetch the zone's icons.
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

// ─── API: map markers (icons) ───────────────────────────────────────────────
// MapMarker is a subrow sheet keyed by the map's MapMarkerRange. `after=N` is
// inclusive of row_id N, so we page from the range and keep only its subrows.
async function renderMapMarkers(range: number, token: number) {
    try {
        const fields = 'X,Y,Icon.id,Icon.path,PlaceNameSubtext.Name,Type'
        const url = `${BASE_URL}/api/sheet/MapMarker?after=${range}&limit=400&fields=${fields}`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Marker request failed (${res.status})`)

        const data = await res.json()
        // A newer zone selection superseded this request — discard it.
        if (token !== loadToken || !map) return

        const rows: any[] = (data?.rows ?? []).filter((r: any) => r.row_id === range)

        for (const row of rows) {
            const f = row.fields ?? {}
            const iconId = f.Icon?.id ?? 0
            const iconPath = f.Icon?.path
            // Skip: icon id 0 = label-only marker (zone-exit text), and the
            // generic area-point flags that just clutter the map.
            if (!iconId || !iconPath || AREA_POINT_ICON_IDS.has(iconId)) continue

            const latlng: L.LatLngExpression = [MAP_PX - f.Y, f.X]
            const name = (f.PlaceNameSubtext?.fields?.Name ?? '').replace(/\n/g, ' — ').trim()
            const type = classifyMarker(iconId, name)
            makeMarker(latlng, mapMarkerIconUrl(iconPath), name).addTo(typeLayers[type])
            counts[type]++
        }
    } catch (err) {
        console.error('[LeafletMap] marker load failed', err)
    }
}

// Sort a marker into an icon type from the only reliable signals we have: the
// aetheryte's distinctive icon/name, then whether the marker carries a label.
function classifyMarker(iconId: number, name: string): IconType {
    if (AETHERYTE_ICON_IDS.has(iconId) || /aetheryte/i.test(name)) return 'aetheryte'
    return name ? 'landmark' : 'other'
}

// Checkbox handler: show or hide a whole icon type by adding/removing its layer.
function toggleType(key: IconType) {
    if (!map) return
    if (filters[key]) typeLayers[key].addTo(map)
    else typeLayers[key].remove()
}

// Build a Leaflet marker with an image icon, an optional hover tooltip, and an
// optional click handler.
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
    if (onClick) marker.on('click', onClick)
    return marker
}

// Convert a sheet icon path ("ui/icon/060000/060453.tex") to a PNG asset URL.
function mapMarkerIconUrl(path: string): string {
    return `${BASE_URL}/api/asset?path=${encodeURIComponent(path)}&format=png`
}

// ─── Local-data node layers (sightseeing / mining / botany / fates) ─────────
// Resolve a node's overlay position. Most nodes carry transx/transy in the
// radar's 800px space; some (e.g. many Thanalan/Coerthas FATEs) only have raw
// x/y game coordinates, so fall back to deriving the pixel position from the
// zone's mapsize — the same logic as MapDisplay.vue. Returns null if neither is
// usable. The result is scaled onto the 2048px overlay.
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

// Vistas come from ffxivData.sightseeing, keyed by zone.
function renderSightseeing(zone: string) {
    const nodes: any[] = (props.ffxivData?.sightseeing ?? []).filter((n: any) => n.zone === zone)
    const layer = typeLayers.sightseeing
    let count = 0
    for (const n of nodes) {
        const latlng = nodeLatLng(n)
        if (!latlng) continue
        makeMarker(latlng, `${ICON_CDN}/sightseeing.webp`, n.name, () =>
            showNodeDetails(n, fetchVistaApi),
        ).addTo(layer)
        count++
    }
    counts.sightseeing = count
}

// Gathering nodes (miner / botany) come from ffxivData[job]; their `area` is
// resolved to an object upstream, so match on area.zone. The icon follows the
// node's job_sub (mining / quarrying / logging / harvesting).
function renderGathering(zone: string, job: 'miner' | 'botany', typeKey: IconType) {
    const nodes: any[] = (props.ffxivData?.[job] ?? []).filter((n: any) => n.area?.zone === zone)
    const layer = typeLayers[typeKey]
    let count = 0
    for (const n of nodes) {
        const latlng = nodeLatLng(n)
        if (!latlng) continue
        makeMarker(latlng, `${ICON_CDN}/${n.job_sub}.webp`, n.name, () =>
            showNodeDetails(n, fetchItemApi),
        ).addTo(layer)
        count++
    }
    counts[typeKey] = count
}

// FATEs come from ffxivData.fates, keyed by zone. The icon follows the existing
// fate_<job_sub> naming convention (e.g. fate_slayenemies).
function renderFates(zone: string) {
    const nodes: any[] = (props.ffxivData?.fates ?? []).filter((n: any) => n.zone === zone)
    const layer = typeLayers.fates
    let count = 0
    for (const n of nodes) {
        const latlng = nodeLatLng(n)
        if (!latlng) continue
        makeMarker(latlng, `${ICON_CDN}/fate_${n.job_sub}.webp`, n.name, () =>
            showNodeDetails(n, fetchFateApi),
        ).addTo(layer)
        count++
    }
    counts.fates = count
}

// ─── Click → combine local data with FFXIVAPI data ──────────────────────────
// Shared by every clickable node type: merge the clicked node's local data with
// whatever the supplied fetcher pulls from the FFXIVAPI into one flat array.
async function showNodeDetails(
    node: any,
    apiFetcher: (name: string) => Promise<Record<string, any> | null>,
) {
    const token = ++detailToken
    detailName.value = node.name
    detailRows.value = []
    detailError.value = ''
    detailLoading.value = true

    try {
        const apiFields = await apiFetcher(node.name)
        if (token !== detailToken) return
        detailRows.value = mergeNode(node, apiFields)
    } catch (err: any) {
        if (token !== detailToken) return
        // Still show the local data even if the API lookup fails.
        detailRows.value = mergeNode(node, null)
        detailError.value = err?.message ?? 'API lookup failed'
    } finally {
        if (token === detailToken) detailLoading.value = false
    }
}

// Fetch the Adventure (Sightseeing Log) row for a vista by name.
async function fetchVistaApi(name: string): Promise<Record<string, any> | null> {
    const query = encodeURIComponent(`Name~"${name}"`)
    const fields = 'Name,Description,Emote.Name,MinTime,MaxTime,PlaceName.Name,IconList.path'
    const url = `${BASE_URL}/api/search?sheets=Adventure&query=${query}&fields=${fields}&limit=10`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Vista lookup failed (${res.status})`)

    const data = await res.json()
    const results: any[] = data?.results ?? []
    // `~` is a contains-match, so prefer the exact-name row when present.
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

// Fetch the Item row for a gathering node (its `name` is the gathered item).
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

// Fetch the Fate row for a FATE node by name.
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

// Flatten the local node + API fields into a single array of display rows.
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
    detailName.value = ''
    detailRows.value = []
    detailError.value = ''
    detailLoading.value = false
}
</script>

<script lang="ts">
export default {
    name: 'TestBuildPage',
    props: ['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'],
}
</script>

<style scoped lang="scss">

@keyframes leafletMap_spin {
    to { transform: rotate(360deg); }
}

.leafletMap {
    --teal:   #2dd4bf;
    --teal-g: rgba(45, 212, 191, 0.2);
    --text:   #c8d8f0;
    --border: rgba(45, 212, 191, 0.15);

    position: relative;
    display: flex;
    justify-content: center;
    color: var(--text);
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
        color: var(--text);
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
        border: 3px solid var(--teal-g);
        border-top-color: var(--teal);
        border-radius: 50%;
        animation: leafletMap_spin 0.8s linear infinite;
        box-shadow: 0 0 18px rgba(45, 212, 191, 0.25);
    }

    &_canvas {
        width: 800px;
        height: 800px;
        max-width: 100%;
        background: #060a12;
        border: 1px solid var(--border);
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
    
        optgroup {
            background: #0b1220;
            color: $teal;
            font-family: 'Cinzel', serif;
        }
    
        option {
            background: #0b1220;
            color: var(--text);
            font-family: 'Rajdhani', sans-serif;
            cursor: pointer;
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

    &_checkboxes {
        width: 100%;
        max-width: 360px;
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &_checkbox {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px 16px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text);
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

        &-label {flex: 1;}

        &-count {
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.8rem;
            color: $dim;
        }

        input:checked + &-box {
            background: var(--teal);
            border-color: var(--teal);
            box-shadow: 0 0 10px var(--teal-g);
        }
        input:checked + &-box::after {
            transform: rotate(45deg) scale(1);
        }
        input:focus-visible + &-box {
            box-shadow: 0 0 0 2px var(--teal-g);
        }
    }

}
    





























/* ── Clicked-vista detail panel ── */
.leafletMap_vista {
    width: 100%;
    max-width: 360px;
    margin-top: 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    overflow: hidden;
}

.leafletMap_vistaHead {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 11px 14px;
    background: rgba(45, 212, 191, 0.07);
    border-bottom: 1px solid var(--border);
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
    color: var(--teal);
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
    color: var(--teal);
    word-break: break-word;
}

.leafletMap_vistaVal {
    flex: 1;
    color: var(--text);
    word-break: break-word;
}

/* ── Map stage ── */




/* Loading / error overlay — covers the map while a new zone is loading. */








/* Fade the overlay in/out as it appears and disappears. */


/* Match Leaflet's controls to the dark teal theme. */
:deep(.leaflet-container) {
    background: #060a12;
    font-family: 'Rajdhani', sans-serif;
}
:deep(.leaflet-bar a) {
    background: rgba(11, 18, 32, 0.9);
    color: var(--text);
    border-color: var(--border);
}
:deep(.leaflet-bar a:hover) {
    background: rgba(45, 212, 191, 0.15);
    color: #e8f0ff;
}

/* Crisp marker icons with a subtle shadow so they read against the map. */
:deep(.leafletMap_markerIcon) {
    filter: drop-shadow(0 0 2px #000);
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
