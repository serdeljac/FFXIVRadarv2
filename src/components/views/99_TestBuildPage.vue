<template>
    <section :class="[`eorzeaOverview body_content leafletMap`, windowWidth]">

        <header class="eorzeaOverview_header">
            <div class="eorzeaOverview_titleRow">
                <h1 class="eorzeaOverview_title">Eorzea <span class="accent">Overview</span></h1>
            </div>
            <p class="eorzeaOverview_tagline">
                Browse every zone in Final Fantasy XIV on an interactive map. Select a zone using the zone picker, then switch between tabs to view Mining nodes, Botany nodes, Sightseeing Log vistas, FATE spawn locations, Elite Hunt marks, and Aether Currents — all plotted on the zone map with coordinates. Use the Search tab to find any resource across all zones by name.
            </p>
            <div class="divider"></div>
        </header>

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

            <div class="eorzeaOverview_selectWrap">
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
                <span class="leafletMap_selectArrow">▾</span>
            </div>

        </div>
    </section>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ffxivData is injected into every router view by App.vue.
const props = defineProps<{ ffxivData: any }>()

// ─── Config ───────────────────────────────────────────────────────────────
const BASE_URL = 'https://v2.xivapi.com'
// FFXIV map asset images from xivapi are 2048×2048 px.
const MAP_PX = 2048
const DEFAULT_ZONE = 'Limsa Lominsa Lower Decks'

// ─── Types ────────────────────────────────────────────────────────────────
interface ZoneEntry {
    zone: string    // PlaceName used both as the display label and the map lookup key
    variant: string // two-digit xivapi asset variant, e.g. "00"
}
interface ZoneGroup {
    expansion: string
    zones: ZoneEntry[]
}

// ─── State ────────────────────────────────────────────────────────────────
const mapEl = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const hasError = ref(false)
const errorMsg = ref('')
const selectedZone = ref(DEFAULT_ZONE)
const zoneGroups = ref<ZoneGroup[]>([])

let map: L.Map | null = null
let overlay: L.ImageOverlay | null = null
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

    try {
        const imageUrl = await resolveMapImage(zoneName, variantForZone(zoneName))

        // A newer zone selection superseded this request — discard it.
        if (token !== loadToken || !map) return

        // Keep the loading animation up until the asset itself has downloaded
        // (the API call only resolves the URL). Preloading also means the
        // overlay paints instantly from cache once we swap it in.
        await preloadImage(imageUrl)
        if (token !== loadToken || !map) return

        // In CRS.Simple, bounds are [[y0,x0],[y1,x1]]; 1 unit == 1 image pixel.
        const bounds: L.LatLngBoundsExpression = [[0, 0], [MAP_PX, MAP_PX]]

        // Swap the overlay rather than rebuilding the whole map.
        if (overlay) {
            overlay.setUrl(imageUrl)
            overlay.setBounds(L.latLngBounds(bounds))
        } else {
            overlay = L.imageOverlay(imageUrl, bounds).addTo(map)
        }

        map.setMaxBounds(bounds)
        map.fitBounds(bounds)
        isLoading.value = false
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
// by PlaceName, then build the asset URL.
async function resolveMapImage(zoneName: string, variant: string): Promise<string> {
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
</script>

<script lang="ts">
export default {
    name: 'TestBuildPage',
    props: ['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'],
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

.leafletMap {
    --teal:   #2dd4bf;
    --teal-g: rgba(45, 212, 191, 0.2);
    --dim:    #5a6e90;
    --text:   #c8d8f0;
    --border: rgba(45, 212, 191, 0.15);

    position: relative;
    display: flex;
    justify-content: center;
    color: var(--text);
    font-family: 'Rajdhani', sans-serif;
}

.leafletMap_content {
    position: relative; z-index: 10;
    width: 100%; max-width: 980px;
    display: flex; flex-direction: column;
    align-items: center; gap: 22px;
}

/* ── Dropdown ── */

.leafletMap_selectArrow {
    position: absolute;
    right: 16px; top: 50%;
    transform: translateY(-50%);
    color: var(--teal);
    pointer-events: none;
    font-size: 0.8rem;
}

.divider {
    width: 180px; height: 1px; margin-top: 4px;
    background: linear-gradient(90deg, transparent, var(--teal), transparent);
    opacity: 0.4;
}

/* ── Map stage ── */
.leafletMap_stage {
    position: relative;
    width: 800px;
    max-width: 100%;
}

.leafletMap_canvas {
    width: 800px;
    height: 800px;
    max-width: 100%;
    background: #060a12;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    // Leaflet needs an explicitly sized container or it renders blank.
    z-index: 1;
}

/* Loading / error overlay — covers the map while a new zone is loading. */
.leafletMap_overlay {
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

.leafletMap_spinner {
    width: 44px;
    height: 44px;
    border: 3px solid var(--teal-g);
    border-top-color: var(--teal);
    border-radius: 50%;
    animation: leafletMap_spin 0.8s linear infinite;
    box-shadow: 0 0 18px rgba(45, 212, 191, 0.25);
}

.leafletMap_overlayText {
    opacity: 0.85;
    font-family: 'Share Tech Mono', monospace;
}

@keyframes leafletMap_spin {
    to { transform: rotate(360deg); }
}

/* Fade the overlay in/out as it appears and disappears. */
.leafletMap_fade-enter-active,
.leafletMap_fade-leave-active {
    transition: opacity 0.25s ease;
}
.leafletMap_fade-enter-from,
.leafletMap_fade-leave-to {
    opacity: 0;
}

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

@media (max-width: 480px) {
    .leafletMap_content { padding: 28px 14px 24px; }
}
</style>
