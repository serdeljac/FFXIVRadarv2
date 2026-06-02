<template>
  <div class="ffxiv-search">
    <header class="search-header">
      <div class="logo-row">
        <span class="crystal-icon" aria-hidden="true">✦</span>
        <h1>Eorzea Item Search</h1>
        <span class="crystal-icon" aria-hidden="true">✦</span>
      </div>
      <p class="subtitle">Browse the realm's compendium via XIVAPI</p>
    </header>

    <div class="search-bar-wrapper">
      <div class="search-bar">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="query"
          type="text"
          placeholder="Search for an item… e.g. Elixir, Leather, Potion"
          @input="onInput"
          @keydown.enter="searchNow"
          aria-label="Item search input"
          autocomplete="off"
          spellcheck="false"
        />
        <button
          v-if="query"
          class="clear-btn"
          @click="clearSearch"
          aria-label="Clear search"
        >✕</button>
      </div>
      <button class="search-btn" @click="searchNow" :disabled="loading || !query.trim()">
        <span v-if="loading" class="spinner" aria-hidden="true"></span>
        <span v-else>Search</span>
      </button>
    </div>

    <div v-if="error" class="error-banner" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {{ error }}
    </div>

    <section v-if="!loading && results.length" class="results-section" aria-label="Search results">
      <div class="results-meta">
        <span class="results-count">{{ results.length }} result{{ results.length !== 1 ? 's' : '' }}</span>
        <span v-if="searchedTerm" class="results-term">for "{{ searchedTerm }}"</span>
      </div>

      <ul class="results-list" role="list">
        <li
          v-for="item in results"
          :key="item.row_id"
          class="result-item"
          role="listitem"
        >
          <div class="item-icon-wrap">
            <img
              v-if="item.icon"
              :src="iconUrl(item.icon)"
              :alt="item.name"
              class="item-icon"
              loading="lazy"
              @error="onIconError($event)"
            />
            <div v-else class="item-icon-placeholder" aria-hidden="true">?</div>
          </div>

          <div class="item-info">
            <span class="item-name">{{ item.name || '(unnamed)' }}</span>
            <span v-if="item.itemKind" class="item-kind">{{ item.itemKind }}</span>
          </div>

          <div class="item-meta">
            <span class="item-ilvl" v-if="item.levelItem">iLv {{ item.levelItem }}</span>
            <span class="item-id">#{{ item.row_id }}</span>
          </div>
        </li>
      </ul>
    </section>

    <div v-else-if="!loading && searched && !results.length" class="empty-state" role="status">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="empty-icon">
        <path d="M9.172 14.828 12 12m0 0 2.828-2.828M12 12l2.828 2.828M12 12 9.172 9.172M21 21l-6-6"/>
        <circle cx="11" cy="11" r="8"/>
      </svg>
      <p>No items found for <strong>"{{ searchedTerm }}"</strong></p>
      <p class="empty-hint">Try a different term or check your spelling.</p>
    </div>

    <div v-if="!searched && !loading" class="idle-state" aria-label="Search suggestions">
      <p class="idle-hint">Try searching for:</p>
      <div class="suggestions">
        <button
          v-for="s in suggestions"
          :key="s"
          class="suggestion-pill"
          @click="quickSearch(s)"
        >{{ s }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const query = ref('')
const results = ref([])
const loading = ref(false)
const error = ref('')
const searched = ref(false)
const searchedTerm = ref('')

let debounceTimer = null

const suggestions = ['Elixir', 'Potion', 'Leather', 'Mithril', 'Aetheryte', 'Darksteel']

function iconUrl(path) {
  if (!path) return null
  if (typeof path === 'string' && path.startsWith('http')) return path
  return `https://v2.xivapi.com/img-misc/060443.png`
}

function onIconError(e) {
  e.target.style.display = 'none'
  e.target.nextElementSibling?.style && (e.target.nextElementSibling.style.display = 'flex')
}

function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (query.value.trim().length >= 2) searchNow()
  }, 400)
}

async function searchNow() {
  const term = query.value.trim()
  if (!term) return

  loading.value = true
  error.value = ''
  results.value = []
  searched.value = false
  searchedTerm.value = term

  try {
    const encoded = encodeURIComponent(`Name~"${term}"`)
    const url = `https://v2.xivapi.com/api/search?sheets=Item&fields=Name,Icon,LevelItem,ItemKind&query=${encoded}&limit=30`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    const data = await res.json()

    results.value = (data.results || []).map(r => ({
      row_id: r.row_id,
      name: r.fields?.Name ?? '',
      icon: r.fields?.Icon?.path ?? null,
      levelItem: r.fields?.LevelItem ?? null,
      itemKind: r.fields?.ItemKind?.fields?.Name ?? null,
    })).filter(i => i.name)

    searched.value = true
  } catch (e) {
    error.value = e.message || 'Failed to fetch results. Please try again.'
  } finally {
    loading.value = false
  }
}

function quickSearch(term) {
  query.value = term
  searchNow()
}

function clearSearch() {
  query.value = ''
  results.value = []
  searched.value = false
  searchedTerm.value = ''
  error.value = ''
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap');

*,
*::before,
*::after { box-sizing: border-box; }

.ffxiv-search {
  min-height: 100vh;
  background: #0d0b10;
  color: #e8dfc8;
  font-family: 'Crimson Pro', Georgia, serif;
  padding: 3rem 1.5rem 4rem;
  max-width: 760px;
  margin: 0 auto;
}

/* Header */
.search-header { text-align: center; margin-bottom: 2.5rem; }

.logo-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.logo-row h1 {
  font-family: 'Cinzel', serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: #c8a96e;
  letter-spacing: 0.06em;
  margin: 0;
}

.crystal-icon {
  color: #7a9cc4;
  font-size: 1.1rem;
  opacity: 0.7;
}

.subtitle {
  font-size: 1rem;
  color: #8a8070;
  font-style: italic;
  margin: 0;
  letter-spacing: 0.02em;
}

/* Search bar */
.search-bar-wrapper {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #1a1520;
  border: 1px solid #3d3428;
  border-radius: 4px;
  padding: 0 0.875rem;
  transition: border-color 0.2s;
}
.search-bar:focus-within { border-color: #c8a96e; }

.search-icon { color: #6a6055; flex-shrink: 0; }

.search-bar input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #e8dfc8;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 1.05rem;
  padding: 0.75rem 0;
  width: 100%;
}
.search-bar input::placeholder { color: #5a504a; }

.clear-btn {
  background: none;
  border: none;
  color: #6a6055;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
.clear-btn:hover { color: #c8a96e; }

.search-btn {
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  background: #c8a96e;
  color: #0d0b10;
  border: none;
  border-radius: 4px;
  padding: 0.7rem 1.25rem;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.search-btn:hover:not(:disabled) { background: #dbbf82; }
.search-btn:active:not(:disabled) { transform: scale(0.98); }
.search-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(13, 11, 16, 0.3);
  border-top-color: #0d0b10;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Error */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #2a1515;
  border: 1px solid #5c2222;
  border-radius: 4px;
  color: #e07070;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* Results */
.results-section { margin-top: 0.5rem; }

.results-meta {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: #6a6055;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
}
.results-count { color: #c8a96e; }
.results-term { color: #8a8070; }

.results-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  background: #141018;
  border: 1px solid #2a2228;
  border-radius: 4px;
  padding: 0.65rem 0.875rem;
  transition: border-color 0.15s, background 0.15s;
  cursor: default;
}
.result-item:hover {
  border-color: #4a3e2e;
  background: #1a1624;
}

.item-icon-wrap {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  position: relative;
}

.item-icon {
  width: 36px;
  height: 36px;
  border-radius: 3px;
  object-fit: cover;
  background: #2a2228;
  image-rendering: pixelated;
}

.item-icon-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 3px;
  background: #1e1820;
  border: 1px solid #2a2228;
  color: #4a4048;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 1rem;
  color: #e8dfc8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-kind {
  font-size: 0.78rem;
  color: #7a9cc4;
  font-style: italic;
}

.item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.item-ilvl {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  color: #c8a96e;
  letter-spacing: 0.05em;
}

.item-id {
  font-size: 0.7rem;
  color: #4a4048;
  font-style: italic;
}

/* Empty / Idle */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6a6055;
}
.empty-icon { margin: 0 auto 1rem; display: block; opacity: 0.4; }
.empty-state p { margin: 0.25rem 0; font-size: 1rem; }
.empty-state strong { color: #8a8070; }
.empty-hint { font-size: 0.85rem; font-style: italic; opacity: 0.7; }

.idle-state { text-align: center; padding: 2rem 0 1rem; }
.idle-hint {
  font-size: 0.85rem;
  color: #4a4048;
  font-family: 'Cinzel', serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.suggestion-pill {
  background: #1a1520;
  border: 1px solid #3d3428;
  border-radius: 20px;
  color: #c8a96e;
  font-family: 'Crimson Pro', Georgia, serif;
  font-size: 0.9rem;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  letter-spacing: 0.03em;
}
.suggestion-pill:hover {
  background: #231d1a;
  border-color: #c8a96e;
}

@media (max-width: 500px) {
  .logo-row h1 { font-size: 1.3rem; }
  .ffxiv-search { padding: 2rem 1rem 3rem; }
}
</style>