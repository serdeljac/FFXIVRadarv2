<template>
  <div class="map-viewer">

    <header class="map-header">
      <div class="title-row">
        <svg class="compass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="12,2 14.5,9.5 12,8 9.5,9.5" fill="currentColor" stroke="none"/>
          <polygon points="12,22 9.5,14.5 12,16 14.5,14.5" fill="currentColor" stroke="none" opacity="0.4"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
        <h1>Eorzea Atlas</h1>
      </div>
      <p class="tagline">Search maps from across the realm</p>
    </header>

    <div class="search-row">
      <div class="search-field" :class="{ focused: inputFocused }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" class="s-icon">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          placeholder="Search a zone… e.g. Limsa Lominsa, Gridania"
          @keydown.enter="doSearch"
          @focus="inputFocused = true"
          @blur="inputFocused = false"
          aria-label="Zone name search"
          autocomplete="off"
          spellcheck="false"
        />
        <button v-if="query" class="x-btn" @click="clearAll" aria-label="Clear">✕</button>
      </div>
      <button class="go-btn" @click="doSearch" :disabled="loading || !query.trim()">
        <span v-if="loading" class="spin"></span>
        <span v-else>Search</span>
      </button>
    </div>

    <div v-if="error" class="error-msg" role="alert">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ error }}
    </div>

    <!-- Results list (before a map is selected) -->
    <section
      v-if="results.length && !activeMap"
      class="results-panel"
      aria-label="Zone results"
    >
      <p class="results-label">{{ results.length }} zone{{ results.length !== 1 ? 's' : '' }} found</p>
      <ul class="result-list" role="list">
        <li
          v-for="zone in results"
          :key="zone.mapId"
          class="result-row"
          role="listitem"
          @click="selectMap(zone)"
          tabindex="0"
          @keydown.enter="selectMap(zone)"
        >
          <div class="zone-thumb" :style="thumbStyle(zone)" aria-hidden="true">
            <span v-if="!zone.thumbLoaded" class="thumb-placeholder">✦</span>
          </div>
          <div class="zone-info">
            <span class="zone-name">{{ zone.placeName }}</span>
            <span class="zone-region" v-if="zone.regionName && zone.regionName !== zone.placeName">{{ zone.regionName }}</span>
          </div>
          <svg class="arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </li>
      </ul>
    </section>

    <!-- Map viewer -->
    <section v-if="activeMap" class="map-display" aria-label="Map display">
      <div class="map-nav">
        <button class="back-btn" @click="backToResults">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
        <div class="map-title-block">
          <h2 class="map-zone-name">{{ activeMap.placeName }}</h2>
          <span class="map-region" v-if="activeMap.regionName && activeMap.regionName !== activeMap.placeName">{{ activeMap.regionName }}</span>
        </div>
        <div class="map-id-badge">#{{ activeMap.mapId }}</div>
      </div>

      <div class="map-frame" :class="{ 'map-loading': mapImgLoading, 'map-error': mapImgError }">
        <div v-if="mapImgLoading" class="map-loader" aria-live="polite">
          <div class="loader-ring"></div>
          <span>Loading map…</span>
        </div>
        <div v-if="mapImgError && !mapImgLoading" class="map-img-error">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          <p>Map image unavailable for this zone.</p>
          <p class="sub">Map ID: <code>{{ activeMap.mapId }}</code></p>
        </div>
        <img
          v-show="!mapImgLoading && !mapImgError"
          :src="activeMap.imgUrl"
          :alt="`Map of ${activeMap.placeName}`"
          class="map-img"
          @load="onMapLoad"
          @error="onMapError"
        />
      </div>

      <div class="map-footer">
        <a :href="activeMap.imgUrl" target="_blank" rel="noopener noreferrer" class="open-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open full image
        </a>
        <span class="powered">via XIVAPI v2</span>
      </div>
    </section>

    <!-- Idle suggestions -->
    <div v-if="!results.length && !activeMap && !loading" class="idle-panel">
      <p class="idle-label">Popular zones</p>
      <div class="suggestion-grid">
        <button
          v-for="s in presets"
          :key="s.label"
          class="preset-btn"
          @click="quickSearch(s.query)"
        >
          <span class="preset-icon" aria-hidden="true">{{ s.icon }}</span>
          <span>{{ s.label }}</span>
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const BASE = 'https://v2.xivapi.com'

const query = ref('')
const results = ref([])
const activeMap = ref(null)
const loading = ref(false)
const error = ref('')
const inputFocused = ref(false)
const mapImgLoading = ref(false)
const mapImgError = ref(false)
const inputEl = ref(null)

const presets = [
  { label: 'Limsa Lominsa', query: 'Limsa Lominsa', icon: '⚓' },
  { label: 'Gridania', query: 'Gridania', icon: '🌿' },
  { label: "Ul'dah", query: "Ul'dah", icon: '🏛' },
  { label: 'Ishgard', query: 'Ishgard', icon: '❄' },
  { label: 'Mor Dhona', query: 'Mor Dhona', icon: '🔮' },
  { label: 'The Firmament', query: 'Firmament', icon: '🕊' },
]

function mapImgUrl(mapId) {
  // The map asset endpoint: /api/asset/map/{id}/{variant}
  // mapId from the Map sheet Id field e.g. "s1d1/00" or "f1d1/00"
  return `${BASE}/api/asset/map/${mapId}`
}

function thumbStyle(zone) {
  return {
    backgroundImage: `url(${zone.imgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

async function doSearch() {
  const term = query.value.trim()
  if (!term) return

  loading.value = true
  error.value = ''
  results.value = []
  activeMap.value = null

  try {
    const q = encodeURIComponent(`PlaceName.Name~"${term}"`)
    const url = `${BASE}/api/search?sheets=Map&fields=Id,PlaceName,PlaceName.Name,PlaceNameRegion,PlaceNameRegion.Name,SizeFactor&query=${q}&limit=20`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error ${res.status}`)
    
    const data = await res.json()
console.log(data)
    const seen = new Set()
    results.value = (data.results || [])
      .map(r => {
        const mapId = r.fields?.Id ?? null
        if (!mapId || seen.has(mapId)) return null
        seen.add(mapId)
        return {
          mapId,
          placeName: r.fields?.PlaceName?.fields?.Name ?? r.fields?.['PlaceName.Name'] ?? '(Unknown)',
          regionName: r.fields?.PlaceNameRegion?.fields?.Name ?? r.fields?.['PlaceNameRegion.Name'] ?? '',
          imgUrl: mapImgUrl(mapId),
          thumbLoaded: false,
        }
      })
      .filter(Boolean)
      .filter(z => z.placeName !== '(Unknown)' && z.placeName !== '')

    if (!results.value.length) {
      error.value = `No zones found for "${term}". Try a different name.`
    }
  } catch (e) {
    error.value = e.message || 'Failed to fetch zones.'
  } finally {
    loading.value = false
  }
}

function selectMap(zone) {
  activeMap.value = zone
  mapImgLoading.value = true
  mapImgError.value = false
}

function backToResults() {
  activeMap.value = null
  mapImgLoading.value = false
  mapImgError.value = false
}

function onMapLoad() {
  mapImgLoading.value = false
  mapImgError.value = false
}

function onMapError() {
  mapImgLoading.value = false
  mapImgError.value = true
}

function clearAll() {
  query.value = ''
  results.value = []
  activeMap.value = null
  error.value = ''
  inputEl.value?.focus()
}

function quickSearch(term) {
  query.value = term
  doSearch()
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.map-viewer {
  min-height: 100vh;
  background: #090b0f;
  color: #d4cfc4;
  font-family: 'EB Garamond', Georgia, serif;
  padding: 2.5rem 1.5rem 4rem;
  max-width: 800px;
  margin: 0 auto;
}

/* Header */
.map-header { text-align: center; margin-bottom: 2rem; }

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  margin-bottom: 0.35rem;
}

.compass-icon {
  width: 28px;
  height: 28px;
  color: #7a9cc4;
  flex-shrink: 0;
}

.map-header h1 {
  font-family: 'Cinzel', serif;
  font-size: 1.9rem;
  font-weight: 600;
  color: #bfa97a;
  letter-spacing: 0.07em;
  margin: 0;
}

.tagline {
  font-size: 0.95rem;
  color: #5a5850;
  font-style: italic;
  margin: 0;
}

/* Search */
.search-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.search-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0f1318;
  border: 1px solid #252d38;
  border-radius: 3px;
  padding: 0 0.875rem;
  transition: border-color 0.2s;
}
.search-field.focused { border-color: #7a9cc4; }

.s-icon { color: #3a4550; flex-shrink: 0; }

.search-field input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #d4cfc4;
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 1.05rem;
  padding: 0.72rem 0;
}
.search-field input::placeholder { color: #383e48; }

.x-btn {
  background: none;
  border: none;
  color: #454e58;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
.x-btn:hover { color: #bfa97a; }

.go-btn {
  font-family: 'Cinzel', serif;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  font-weight: 600;
  background: #7a9cc4;
  color: #090b0f;
  border: none;
  border-radius: 3px;
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.go-btn:hover:not(:disabled) { background: #92b0d4; }
.go-btn:active:not(:disabled) { transform: scale(0.97); }
.go-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.spin {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(9,11,15,0.25);
  border-top-color: #090b0f;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Error */
.error-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1a0f0f;
  border: 1px solid #4a2020;
  border-radius: 3px;
  color: #c46a6a;
  padding: 0.6rem 0.875rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* Results panel */
.results-panel { margin-top: 0.25rem; }

.results-label {
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #454e58;
  margin: 0 0 0.6rem;
}

.result-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  background: #0d1014;
  border: 1px solid #1a2028;
  border-radius: 3px;
  padding: 0.6rem 0.875rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  outline: none;
}
.result-row:hover,
.result-row:focus-visible {
  border-color: #7a9cc4;
  background: #111620;
}

.zone-thumb {
  width: 52px;
  height: 40px;
  border-radius: 2px;
  background: #1a2028;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.thumb-placeholder {
  color: #2a3540;
  font-size: 1rem;
}

.zone-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.zone-name {
  font-size: 1rem;
  color: #d4cfc4;
}
.zone-region {
  font-size: 0.78rem;
  color: #7a9cc4;
  font-style: italic;
}

.arrow-icon { color: #2a3540; flex-shrink: 0; }
.result-row:hover .arrow-icon,
.result-row:focus-visible .arrow-icon { color: #7a9cc4; }

/* Map display */
.map-display { margin-top: 0.25rem; }

.map-nav {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.875rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #0d1014;
  border: 1px solid #1a2028;
  border-radius: 3px;
  color: #7a9cc4;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s;
  flex-shrink: 0;
}
.back-btn:hover { border-color: #7a9cc4; }

.map-title-block {
  flex: 1;
  min-width: 0;
}
.map-zone-name {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: #bfa97a;
  margin: 0;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.map-region {
  font-size: 0.82rem;
  color: #7a9cc4;
  font-style: italic;
}

.map-id-badge {
  font-family: 'EB Garamond', monospace;
  font-size: 0.75rem;
  color: #2a3540;
  flex-shrink: 0;
}

.map-frame {
  width: 100%;
  background: #0d1014;
  border: 1px solid #1a2028;
  border-radius: 4px;
  overflow: hidden;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.map-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #3a4550;
  font-style: italic;
  font-size: 0.9rem;
}

.loader-ring {
  width: 36px;
  height: 36px;
  border: 2px solid #1a2028;
  border-top-color: #7a9cc4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.map-img-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #3a4550;
  text-align: center;
  padding: 2rem;
}
.map-img-error p { margin: 0; font-size: 0.9rem; }
.map-img-error .sub { font-size: 0.8rem; color: #2a3540; }
.map-img-error code {
  background: #111620;
  padding: 0.1em 0.4em;
  border-radius: 2px;
  font-size: 0.85em;
}

.map-img {
  width: 100%;
  height: auto;
  display: block;
}

.map-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.6rem;
  padding: 0 0.1rem;
}

.open-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #7a9cc4;
  font-size: 0.82rem;
  text-decoration: none;
  transition: color 0.15s;
}
.open-link:hover { color: #92b0d4; }

.powered {
  font-size: 0.72rem;
  color: #252d38;
  font-style: italic;
}

/* Idle */
.idle-panel { margin-top: 2rem; text-align: center; }
.idle-label {
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2a3540;
  margin-bottom: 0.875rem;
}

.suggestion-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.preset-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #0d1014;
  border: 1px solid #1a2028;
  border-radius: 20px;
  color: #7a9cc4;
  font-family: 'EB Garamond', Georgia, serif;
  font-size: 0.95rem;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.preset-btn:hover {
  border-color: #7a9cc4;
  background: #0f1620;
}
.preset-icon { font-size: 0.85em; }

@media (max-width: 500px) {
  .map-header h1 { font-size: 1.4rem; }
  .map-viewer { padding: 1.75rem 1rem 3rem; }
  .map-nav { flex-wrap: wrap; }
}
</style>