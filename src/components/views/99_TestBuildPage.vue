<template>
    <div class="testBuild">
        <div class="testBuild_bar">
            <h1 class="testBuild_title">Leaflet Map — Test Build</h1>

            <div class="testBuild_controls">
                <!-- Layer toggles -->
                <label
                    v-for="layer in layerDefs"
                    :key="layer.key"
                    class="testBuild_toggle">
                    <input
                        type="checkbox"
                        v-model="visible[layer.key]"
                        @change="onToggleLayer(layer.key)" />
                    {{ layer.label }}<span v-if="counts[layer.key]"> ({{ counts[layer.key] }})</span>
                </label>

                <!-- Zone selector -->
                <select
                    v-model="selectedZone"
                    class="testBuild_select"
                    @change="onZoneChange">
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
            </div>
        </div>

        <!-- Loading / error overlays -->
        <div v-if="isLoading" class="testBuild_status">Loading map…</div>
        <div v-else-if="hasError" class="testBuild_status testBuild_status--error">
            ⚠ Failed to load map: {{ errorMsg }}
        </div>

        <!-- Leaflet mount point -->
        <div ref="mapEl" class="testBuild_map"></div>

        <!-- Items panel: gathering/fishing nodes resolve their item list via API -->
        <div v-if="showItemsPanel" class="testBuild_info">
            <div class="testBuild_info-head">
                <span>Items at node</span>
            </div>
            <div v-if="itemsLoading" class="testBuild_info-empty">Loading items…</div>
            <div v-else-if="itemsError" class="testBuild_info-empty testBuild_info-empty--error">
                {{ itemsError }}
            </div>
            <pre v-else-if="nodeItems" class="testBuild_info-body">{{ prettyItems }}</pre>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ─── Props ────────────────────────────────────────────────────────────────
// ffxivData is injected into every router view by App.vue.
const props = defineProps<{ ffxivData: any }>()

// ─── Config ───────────────────────────────────────────────────────────────
const BASE_URL = 'https://v2.xivapi.com'
// The app's own gathering/sightseeing/fate icons live in this S3 bucket
// (same source as components/API/iconImg.vue).
const ICON_CDN = 'https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/icons'
// FFXIV map asset images from xivapi are 2048×2048 px, and MapMarker X/Y are
// stored in that same 2048-unit space, so API markers map 1:1 onto the overlay.
const MAP_PX = 2048
// The radar's node transx/transy were precomputed for an 800px map (see
// MapDisplay.vue), so scale them up to our 2048px overlay.
const NODE_SCALE = MAP_PX / 800
const ICON_SIZE = 28 // px, on-screen size of a marker icon
const DEFAULT_ZONE = 'Limsa Lominsa Lower Decks'
// Generic "area point" markers — sub-area / district name flags (e.g. "Hawkers'
// Round", "Bulwark Hall"). Excluded from the map-icon layer to reduce clutter.
const AREA_POINT_ICON_IDS = new Set([60442])

// ─── Layers ───────────────────────────────────────────────────────────────
type LayerKey = 'mapMarkers' | 'gathering' | 'fishing' | 'sightseeing' | 'fates'
const layerDefs: { key: LayerKey; label: string }[] = [
    { key: 'mapMarkers', label: 'Map icons' },
    { key: 'gathering', label: 'Gathering' },
    { key: 'fishing', label: 'Fishing' },
    { key: 'sightseeing', label: 'Sightseeing' },
    { key: 'fates', label: 'Fates' },
]

// ─── Types ──────────────────────────────────────────────────────────────────
interface ZoneEntry {
    zone: string
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

// ─── State ──────────────────────────────────────────────────────────────────
const mapEl = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMsg = ref('')
const selectedZone = ref(DEFAULT_ZONE)
const zoneGroups = ref<ZoneGroup[]>([])
const visible = reactive<Record<LayerKey, boolean>>({
    mapMarkers: true,
    gathering: true,
    fishing: true,
    sightseeing: true,
    fates: true,
})
const counts = reactive<Record<LayerKey, number>>({
    mapMarkers: 0,
    gathering: 0,
    fishing: 0,
    sightseeing: 0,
    fates: 0,
})
// Tracks the most recently clicked icon; drives whether the items panel shows.
const selectedInfo = ref<any>(null)

// Items panel: the node + item list for a clicked gathering/fishing node, fetched
// from the FFXIV API on demand.
const nodeItems = ref<any>(null)
const itemsLoading = ref(false)
const itemsError = ref('')
const prettyItems = computed(() =>
    nodeItems.value ? JSON.stringify(nodeItems.value, null, 2) : '',
)
const showItemsPanel = computed(() => {
    const d = selectedInfo.value
    return !!d && (d.job === 'miner' || d.job === 'botany' || d.type === 'fishing')
})
// Guards the items fetch against rapid clicks / stale responses.
let itemsToken = 0
// Radar job_sub → xivapi GatheringType name.
const GATHERING_TYPE: Record<string, string> = {
    mining: 'Mining',
    quarrying: 'Quarrying',
    logging: 'Logging',
    harvesting: 'Harvesting',
}

let map: L.Map | null = null
let overlay: L.ImageOverlay | null = null
const layers = {} as Record<LayerKey, L.LayerGroup>
// Guards against out-of-order responses when zones are switched quickly.
let loadToken = 0

// ─── Lifecycle ────────────────────────────────────────────────────────────
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

    for (const def of layerDefs) {
        layers[def.key] = L.layerGroup().addTo(map)
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

// ─── Loading orchestration ──────────────────────────────────────────────────
function onZoneChange() {
    loadZone(selectedZone.value)
}

function onToggleLayer(key: LayerKey) {
    if (!map) return
    if (visible[key]) layers[key].addTo(map)
    else layers[key].remove()
}

async function loadZone(zoneName: string) {
    if (!map) return

    const token = ++loadToken
    isLoading.value = true
    hasError.value = false
    selectedInfo.value = null
    nodeItems.value = null
    itemsError.value = ''
    itemsLoading.value = false
    for (const def of layerDefs) {
        layers[def.key].clearLayers()
        counts[def.key] = 0
    }

    try {
        const meta = await resolveMapMeta(zoneName, variantForZone(zoneName))

        // A newer zone selection superseded this request — discard it.
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

        // The radar's own nodes come from local data — render immediately.
        renderNodeLayers(zoneName)

        // API-backed layers (map markers + fishing spots) each need their own
        // network call; run them in parallel so neither blocks the other, and
        // let each handle its own errors so one failing never hides the rest.
        const apiTasks: Promise<void>[] = [renderFishing(zoneName, token)]
        if (meta.markerRange != null) {
            apiTasks.push(renderMapMarkers(meta.markerRange, token))
        }
        await Promise.all(apiTasks)
    } catch (err: any) {
        if (token !== loadToken) return
        console.error('[TestBuildPage] map load failed', err)
        hasError.value = true
        errorMsg.value = err?.message ?? 'Unknown error'
        isLoading.value = false
    }
}

// ─── Marker construction ────────────────────────────────────────────────────
function makeMarker(latlng: L.LatLngExpression, iconUrl: string, data: any): L.Marker {
    const icon = L.icon({
        iconUrl,
        iconSize: [ICON_SIZE, ICON_SIZE],
        iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
        className: 'testBuild_markerIcon',
    })
    const marker = L.marker(latlng, { icon })
    // Clicking an icon surfaces its data object and (for gathering/fishing) its
    // item list in the panels below.
    marker.on('click', () => onMarkerClick(data))
    return marker
}

function onMarkerClick(data: any) {
    selectedInfo.value = data
    loadNodeItems(data)
}

// Resolve the items for a clicked node via the FFXIV API. Only gathering and
// fishing nodes have item lists; everything else clears the panel.
async function loadNodeItems(data: any) {
    const token = ++itemsToken
    const isGather = data?.job === 'miner' || data?.job === 'botany'
    const isFishing = data?.type === 'fishing'

    if (!isGather && !isFishing) {
        nodeItems.value = null
        itemsError.value = ''
        itemsLoading.value = false
        return
    }

    nodeItems.value = null
    itemsError.value = ''
    itemsLoading.value = true

    try {
        const result = isFishing
            ? await fetchFishingItems(data)
            : await fetchGatheringItems(data)
        if (token !== itemsToken) return
        nodeItems.value = result
    } catch (err: any) {
        if (token !== itemsToken) return
        itemsError.value = err?.message ?? 'Failed to load items'
    } finally {
        if (token === itemsToken) itemsLoading.value = false
    }
}

// Gathering: resolve through GatheringPoint (which links a base to a territory)
// so the result is pinned to the actual zone — the same item can appear in
// several node types within one zone, so zone + type + level disambiguate it.
async function fetchGatheringItems(node: any): Promise<any> {
    const typeName = GATHERING_TYPE[node.job_sub] ?? null
    const zone: string | null = node.area?.zone ?? null

    // The territory condition only *boosts* matches in boilmaster (it isn't a
    // strict filter), so we still filter the results client-side below.
    const conds = [`GatheringPointBase.Item[].Item.Name="${node.name}"`]
    if (zone) conds.push(`TerritoryType.PlaceName.Name="${zone}"`)
    const query = encodeURIComponent(conds.join(' '))
    const fields = [
        'GatheringPointBase.GatheringType.Name',
        'GatheringPointBase.GatheringLevel',
        'GatheringPointBase.Item[].Item.Name',
        'TerritoryType.PlaceName.Name',
        'PlaceName.Name',
        'Count',
    ].join(',')
    const url = `${BASE_URL}/api/search?sheets=GatheringPoint&query=${query}&fields=${fields}&limit=20`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Item lookup failed (${res.status})`)

    const data = await res.json()
    const candidates = (data?.results ?? [])
        .map((r: any) => {
            const b = r.fields?.GatheringPointBase?.fields ?? {}
            return {
                terr: r.fields?.TerritoryType?.fields?.PlaceName?.fields?.Name ?? null,
                place: r.fields?.PlaceName?.fields?.Name ?? null,
                revealed: r.fields?.Count ?? null, // items revealed per gathering
                type: b.GatheringType?.fields?.Name ?? null,
                level: b.GatheringLevel ?? null,
                items: (b.Item ?? [])
                    .map((it: any) => ({
                        name: it.fields?.Item?.fields?.Name,
                        id: it.fields?.Item?.row_id,
                    }))
                    .filter((o: any) => o.name && o.id), // drop empty item slots (id 0)
            }
        })
        .filter((c: any) => c.items.length > 0)

    if (candidates.length === 0) {
        return {
            node: { kind: 'gathering', type: typeName, level: node.node_level, zone, data: node },
            items: [],
        }
    }

    // Narrow to this zone first, then prefer the matching gathering type + level.
    const inZone = zone ? candidates.filter((c: any) => c.terr === zone) : candidates
    const pool = inZone.length ? inZone : candidates
    const best =
        pool.find((c: any) => c.type === typeName && c.level === node.node_level) ??
        pool.find((c: any) => c.type === typeName) ??
        pool[0]

    return {
        node: {
            kind: 'gathering',
            type: best.type ?? typeName,
            level: best.level,
            zone: best.terr,
            location: best.place,
            revealed: best.revealed, // number of items shown per gathering
            data: node, // the raw radar JSON node that was clicked
        },
        items: await enrichItems(best.items),
    }
}

// Fishing: FishingSpot.Item is the array of catchable fish for the spot, and
// the row also carries the node details (fishing level, place, zone, radius).
async function fetchFishingItems(data: any): Promise<any> {
    const fields = 'PlaceName.Name,GatheringLevel,TerritoryType.PlaceName.Name,Radius,Item[].Name'
    const res = await fetch(
        `${BASE_URL}/api/sheet/FishingSpot/${data.fishingSpotId}?fields=${encodeURIComponent(fields)}`,
    )
    if (!res.ok) throw new Error(`Item lookup failed (${res.status})`)

    const json = await res.json()
    const f = json?.fields ?? {}
    const items = (f.Item ?? [])
        .map((it: any) => ({ name: it.fields?.Name, id: it.row_id }))
        .filter((o: any) => o.name && o.id) // drop empty trailing slots (id 0)

    return {
        node: {
            kind: 'fishing',
            location: f.PlaceName?.fields?.Name ?? data.name,
            level: f.GatheringLevel ?? null, // fishing level
            zone: f.TerritoryType?.fields?.PlaceName?.fields?.Name ?? data.zone,
            radius: f.Radius ?? data.radius,
            data, // the clicked fishing-spot source object
        },
        items: await enrichItems(items),
    }
}

// Enrich each {name,id} item with details from the Item sheet, batched by id.
// On failure, returns the items unchanged so the list still renders.
async function enrichItems(items: { name: string; id: number }[]): Promise<any[]> {
    const ids = items.map((i) => i.id).filter(Boolean)
    if (ids.length === 0) return items

    // LevelItem.value keeps the response small (the full ItemLevel row is a
    // large stat block we don't need).
    const fields = 'Description,LevelItem.value,Rarity,ItemUICategory.Name,Icon.path,StackSize,PriceLow,CanBeHq'
    const url = `${BASE_URL}/api/sheet/Item?rows=${ids.join(',')}&fields=${encodeURIComponent(fields)}`

    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Item detail lookup failed (${res.status})`)

        const data = await res.json()
        const byId = new Map<number, any>()
        for (const row of data?.rows ?? []) byId.set(row.row_id, row.fields ?? {})

        return items.map((it) => {
            const f = byId.get(it.id)
            if (!f) return it
            return {
                ...it,
                category: f.ItemUICategory?.fields?.Name ?? null,
                itemLevel: f.LevelItem?.value ?? null,
                rarity: f.Rarity ?? null,
                stackSize: f.StackSize ?? null,
                sellPrice: f.PriceLow ?? null,
                canBeHq: f.CanBeHq ?? null,
                description: (f.Description ?? '').trim() || null,
                icon: f.Icon?.path
                    ? `${BASE_URL}/api/asset?path=${encodeURIComponent(f.Icon.path)}&format=png`
                    : null,
            }
        })
    } catch (err) {
        console.error('[TestBuildPage] item enrichment failed', err)
        return items
    }
}

// Convert the radar's 800px-based transx/transy to a CRS.Simple latlng. The
// overlay's top-left sits at the north-west corner, so latitude is flipped.
function nodeLatLng(transx: number, transy: number): L.LatLngExpression {
    return [MAP_PX - transy * NODE_SCALE, transx * NODE_SCALE]
}

function nodeIconUrl(name: string): string {
    return `${ICON_CDN}/${name}.webp`
}

// ─── Local node layers (gathering / sightseeing / fates) ───────────────────
function renderNodeLayers(zone: string) {
    const data = props.ffxivData ?? {}

    // Gathering: miner + botany. Their `area` is resolved to an object upstream
    // in App.vue, so match on area.zone. Icon name is the job_sub.
    const gathering: any[] = [
        ...(data.miner ?? []),
        ...(data.botany ?? []),
    ].filter((n) => n.area?.zone === zone)
    counts.gathering = addNodes('gathering', gathering, (n) => n.job_sub)

    // Sightseeing vistas keyed by `zone` directly.
    const sightseeing: any[] = (data.sightseeing ?? []).filter((n: any) => n.zone === zone)
    counts.sightseeing = addNodes('sightseeing', sightseeing, () => 'sightseeing')

    // Fates keyed by `zone`; icon follows the existing fate_<job_sub> convention.
    const fates: any[] = (data.fates ?? []).filter((n: any) => n.zone === zone)
    counts.fates = addNodes('fates', fates, (n) => `fate_${n.job_sub}`)
}

// Add a set of nodes to a layer, returning how many were placed. Nodes without
// usable transx/transy are skipped rather than landing at the map origin.
function addNodes(
    key: LayerKey,
    nodes: any[],
    iconName: (n: any) => string,
): number {
    const layer = layers[key]
    let count = 0
    for (const n of nodes) {
        if (typeof n.transx !== 'number' || typeof n.transy !== 'number') continue
        makeMarker(nodeLatLng(n.transx, n.transy), nodeIconUrl(iconName(n)), n).addTo(layer)
        count++
    }
    return count
}

// ─── API: base map ──────────────────────────────────────────────────────────
// Mirrors the search flow in components/API/mapImg.vue: look up the Map sheet
// by PlaceName, then build the asset URL and grab its MapMarkerRange.
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
    const markerRange = firstResult.fields?.MapMarkerRange ?? null

    return {
        imageUrl: `${BASE_URL}/api/asset/map/${idBase}/${variant}`,
        markerRange: typeof markerRange === 'number' ? markerRange : null,
    }
}

// ─── API: map markers ─────────────────────────────────────────────────────
// MapMarker is a subrow sheet keyed by the map's MapMarkerRange. `after=N` is
// inclusive of row_id N, so we page from the range and keep only its subrows.
async function renderMapMarkers(range: number, token: number) {
    const fields = 'X,Y,Icon.id,Icon.path,PlaceNameSubtext.Name,Type'
    const url = `${BASE_URL}/api/sheet/MapMarker?after=${range}&limit=400&fields=${fields}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Marker request failed (${res.status})`)

    const data = await res.json()
    if (token !== loadToken || !map) return

    const rows: any[] = (data?.rows ?? []).filter((r: any) => r.row_id === range)

    let count = 0
    for (const row of rows) {
        const f = row.fields ?? {}
        const iconId = f.Icon?.id ?? 0
        const iconPath = f.Icon?.path
        // Skip: icon id 0 = label-only marker (zone-exit text), and the generic
        // area-point flags that just clutter the map.
        if (!iconId || !iconPath || AREA_POINT_ICON_IDS.has(iconId)) continue

        const latlng: L.LatLngExpression = [MAP_PX - f.Y, f.X]
        const info = {
            type: 'mapMarker',
            name: (f.PlaceNameSubtext?.fields?.Name ?? '').replace(/\n/g, ' — ').trim() || null,
            iconId,
            X: f.X,
            Y: f.Y,
            markerType: f.Type,
        }
        makeMarker(latlng, mapMarkerIconUrl(iconPath), info).addTo(layers.mapMarkers)
        count++
    }

    counts.mapMarkers = count
}

// Convert a sheet icon path ("ui/icon/060000/060453.tex") to a PNG asset URL.
function mapMarkerIconUrl(path: string): string {
    return `${BASE_URL}/api/asset?path=${encodeURIComponent(path)}&format=png`
}

// ─── API: fishing spots ─────────────────────────────────────────────────────
// FishingSpot stores X/Z in the same texture-pixel space as MapMarker, so they
// place directly onto the 2048px overlay. Self-contained error handling keeps a
// fishing failure from hiding the other layers.
async function renderFishing(zone: string, token: number) {
    try {
        const query = encodeURIComponent(`TerritoryType.PlaceName.Name~"${zone}"`)
        const fields = 'X,Z,Radius,PlaceName.Name,TerritoryType.PlaceName.Name'
        const url = `${BASE_URL}/api/search?sheets=FishingSpot&query=${query}&fields=${fields}&limit=100`

        const res = await fetch(url)
        if (!res.ok) throw new Error(`Fishing request failed (${res.status})`)

        const data = await res.json()
        if (token !== loadToken || !map) return

        // `~` is a contains-match, so keep only spots whose territory is exactly
        // this zone.
        const spots: any[] = (data?.results ?? []).filter(
            (r: any) => r.fields?.TerritoryType?.fields?.PlaceName?.fields?.Name === zone,
        )

        let count = 0
        for (const s of spots) {
            const f = s.fields ?? {}
            if (typeof f.X !== 'number' || typeof f.Z !== 'number') continue
            const latlng: L.LatLngExpression = [MAP_PX - f.Z, f.X]
            const info = {
                type: 'fishing',
                name: f.PlaceName?.fields?.Name ?? null,
                zone,
                fishingSpotId: s.row_id,
                X: f.X,
                Z: f.Z,
                radius: f.Radius,
            }
            makeMarker(latlng, nodeIconUrl('fishing'), info).addTo(layers.fishing)
            count++
        }
        counts.fishing = count
    } catch (err) {
        console.error('[TestBuildPage] fishing load failed', err)
    }
}
</script>

<script lang="ts">
export default {
    name: 'TestBuildPage'
}
</script>

<style scoped lang="scss">
.testBuild {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;

    &_bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
    }

    &_title {
        margin: 0;
        font-size: 1.25rem;
        color: #e0d6c2;
    }

    &_controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    &_toggle {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        color: #e0d6c2;
        font-size: 0.9rem;
        cursor: pointer;
        user-select: none;
    }

    &_select {
        background: #1a1a1a;
        color: #e0d6c2;
        border: 1px solid #c8a96e;
        border-radius: 4px;
        padding: 0.4rem 0.6rem;
        font-size: 0.9rem;
        cursor: pointer;
        max-width: 320px;
    }

    &_status {
        padding: 0.5rem 0.75rem;
        margin-bottom: 0.5rem;
        background: rgba(0, 0, 0, 0.6);
        color: #e0d6c2;
        border-radius: 4px;
        font-size: 0.9rem;

        &--error {
            color: #ff9b9b;
        }
    }

    &_map {
        flex: 1 1 auto;
        min-height: 460px;
        width: 100%;
        background: #0a0a0a;
        border-radius: 6px;
        // Leaflet needs an explicitly sized container or it renders blank.
        z-index: 1;
    }

    &_info {
        margin-top: 0.75rem;
        background: #141414;
        border: 1px solid #2a2a2a;
        border-radius: 6px;
        overflow: hidden;
        flex: 0 0 auto;

        &-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.4rem 0.6rem;
            background: #1a1a1a;
            color: #c8a96e;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        &-body {
            margin: 0;
            padding: 0.6rem;
            max-height: 220px;
            overflow: auto;
            color: #d6e9c2;
            font-family: ui-monospace, "Cascadia Code", Menlo, Consolas, monospace;
            font-size: 0.8rem;
            line-height: 1.45;
            white-space: pre;
        }

        &-empty {
            padding: 0.6rem;
            color: #777;
            font-size: 0.85rem;

            &--error {
                color: #ff9b9b;
            }
        }
    }
}

// Crisp marker icons + subtle shadow so they read against the map.
:deep(.testBuild_markerIcon) {
    filter: drop-shadow(0 0 2px #000);
}
</style>
