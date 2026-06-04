<template>
  <div class="xiv-search">

    <!-- Search Form -->
    <div class="search-panel">
      <div class="field-group">
        <label class="field-label" for="char-name">Character name</label>
        <input
          id="char-name"
          v-model="localName"
          type="text"
          class="field-input"
          placeholder="e.g. Almighty Viera"
          @keydown.enter="search"
        />
      </div>

      <div class="field-group">
        <label class="field-label" for="char-server">Server</label>
        <select id="char-server" v-model="localServer" class="field-input">
          <option value="">— select server —</option>
          <optgroup v-for="dc in dataCenters" :key="dc.label" :label="dc.label">
            <option v-for="s in dc.servers" :key="s" :value="s">{{ s }}</option>
          </optgroup>
        </select>
      </div>

      <button class="search-btn" :disabled="!canSearch || status === 'loading'" @click="search">
        <span v-if="status === 'loading'" class="btn-spinner"></span>
        <span v-else>Search</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="status === 'error'" class="feedback error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      {{ errorMsg }}
    </div>

    <!-- No results -->
    <div v-else-if="status === 'empty'" class="feedback empty">
      No characters found for <strong>{{ lastQuery.name }}</strong> on <strong>{{ lastQuery.server }}</strong>.
    </div>

    <!-- Results -->
    <div v-else-if="status === 'results' && results.length" class="results-list">
      <p class="results-meta">{{ results.length }} result{{ results.length !== 1 ? 's' : '' }} found</p>
      <div
        v-for="char in results"
        :key="char.ID"
        class="result-card"
        :class="{ selected: selectedId === char.ID }"
        @click="selectCharacter(char)"
      >
        <img :src="char.Avatar" :alt="char.Name" class="result-avatar" />
        <div class="result-info">
          <p class="result-name">{{ char.Name }}</p>
          <p class="result-meta">{{ char.Server }}</p>
          <p class="result-rank" v-if="char.Rank">{{ char.Rank }}</p>
        </div>
        <div class="result-arrow" aria-hidden="true">›</div>
      </div>
    </div>

    <!-- Character detail panel -->
    <transition name="slide-up">
      <div v-if="status === 'detail'" class="detail-panel">

        <button class="back-btn" @click="backToResults">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
          Back to results
        </button>

        <div v-if="detailLoading" class="state-center">
          <span class="spinner-lg"></span>
          <p class="loading-text">Loading character…</p>
        </div>

        <div v-else-if="character" class="character-sheet">

          <div class="char-header">
            <img :src="character.Portrait" :alt="character.Name" class="char-portrait" />
            <div class="char-headline">
              <p class="char-title-tag" v-if="character.Title?.Name">{{ character.Title.Name }}</p>
              <h1 class="char-name">{{ character.Name }}</h1>
              <p class="char-world">{{ character.Server }} &mdash; {{ character.DC }}</p>
              <div class="char-badges">
                <span class="badge">{{ character.Race?.Name }}</span>
                <span class="badge">{{ character.Tribe?.Name }}</span>
                <span class="badge" v-if="activeJob">{{ activeJob.UnlockedState?.Name }}</span>
              </div>
            </div>
          </div>

          <div class="detail-grid">
            <div class="detail-card">
              <p class="detail-card-title">Character</p>
              <dl class="detail-list">
                <div class="dl-row"><dt>Nameday</dt><dd>{{ character.Nameday }}</dd></div>
                <div class="dl-row"><dt>Guardian</dt><dd>{{ character.GuardianDeity?.Name }}</dd></div>
                <div class="dl-row"><dt>City-state</dt><dd>{{ character.Town?.Name }}</dd></div>
                <div class="dl-row" v-if="character.FreeCompanyName">
                  <dt>Free company</dt><dd>{{ character.FreeCompanyName }}</dd>
                </div>
              </dl>
            </div>

            <div class="detail-card" v-if="activeJob">
              <p class="detail-card-title">Active job</p>
              <div class="job-feature">
                <img
                  v-if="activeJob.UnlockedState?.Icon"
                  :src="`https://xivapi.com${activeJob.UnlockedState.Icon}`"
                  class="job-icon-lg"
                  :alt="activeJob.UnlockedState.Name"
                />
                <div>
                  <p class="job-name">{{ activeJob.UnlockedState?.Name }}</p>
                  <div class="level-track">
                    <div class="level-fill" :style="{ width: Math.min(activeJob.Level, 100) + '%' }"></div>
                  </div>
                  <p class="job-level">Level {{ activeJob.Level }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Jobs grid -->
          <div v-if="sortedJobs.length" class="section">
            <p class="section-title">Jobs &amp; levels</p>
            <div class="jobs-grid">
              <div
                v-for="job in sortedJobs"
                :key="job.JobID"
                class="job-chip"
                :class="{ maxed: job.Level >= 100 }"
              >
                <img
                  v-if="job.UnlockedState?.Icon"
                  :src="`https://xivapi.com${job.UnlockedState.Icon}`"
                  class="chip-img"
                  :alt="job.UnlockedState.Name"
                />
                <span class="chip-label">{{ job.UnlockedState?.Name }}</span>
                <span class="chip-lvl" :class="{ gold: job.Level >= 100 }">{{ job.Level }}</span>
              </div>
            </div>
          </div>

          <!-- Gear -->
          <div v-if="gearItems.length" class="section">
            <p class="section-title">Equipped gear</p>
            <div class="gear-grid">
              <div v-for="item in gearItems" :key="item.slot" class="gear-chip">
                <img
                  v-if="item.Icon"
                  :src="`https://xivapi.com${item.Icon}`"
                  class="gear-img"
                  :alt="item.Name"
                />
                <div class="gear-text">
                  <span class="gear-slot">{{ item.slot }}</span>
                  <span class="gear-name">{{ item.Name }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// ─── Props ───────────────────────────────────────────────────────────────────

const props = defineProps({
  /**
   * Pre-fill the character name input.
   * Pass an empty string (default) to leave the field blank.
   */
  initialName: {
    type: String,
    default: '',
  },
  /**
   * Pre-fill the server selector.
   * Must match a valid XIVAPI server name (e.g. "Leviathan", "Balmung").
   */
  initialServer: {
    type: String,
    default: '',
  },
  /**
   * Optional XIVAPI private key — raises the rate limit from 20 req/s to higher.
   * Get yours at https://xivapi.com (login via Discord → Dev Account).
   */
  apiKey: {
    type: String,
    default: '',
  },
  /**
   * Whether to automatically trigger a search when the component mounts,
   * provided initialName and initialServer are both set.
   */
  autoSearch: {
    type: Boolean,
    default: false,
  },
})

// ─── Emits ───────────────────────────────────────────────────────────────────

const emit = defineEmits([
  /** Fired when the user selects a result card. Payload: full character object. */
  'character-selected',
  /** Fired when search results arrive. Payload: array of result objects. */
  'results',
  /** Fired on API error. Payload: error message string. */
  'error',
])

// ─── State ───────────────────────────────────────────────────────────────────

const BASE = 'https://xivapi.com'

const localName   = ref(props.initialName)
const localServer = ref(props.initialServer)

// status: idle | loading | results | empty | error | detail
const status      = ref('idle')
const results     = ref([])
const character   = ref(null)
const selectedId  = ref(null)
const detailLoading = ref(false)
const errorMsg    = ref('')
const lastQuery   = ref({ name: '', server: '' })
const prevResults = ref([])   // kept so "back" can restore the list

// ─── Server list ─────────────────────────────────────────────────────────────

const dataCenters = [
  { label: 'NA — Aether',    servers: ['Adamantoise','Cactuar','Faerie','Gilgamesh','Jenova','Midgardsormr','Sargatanas','Siren'] },
  { label: 'NA — Primal',    servers: ['Behemoth','Excalibur','Exodus','Famfrit','Hyperion','Lamia','Leviathan','Ultros'] },
  { label: 'NA — Crystal',   servers: ['Balmung','Brynhildr','Coeurl','Diabolos','Goblin','Malboro','Mateus','Zalera'] },
  { label: 'NA — Dynamis',   servers: ['Cuchulainn','Golem','Halicarnassus','Kraken','Maduin','Marilith','Seraph','Syldra'] },
  { label: 'EU — Chaos',     servers: ['Cerberus','Louisoix','Moogle','Omega','Phantom','Ragnarok','Sagittarius','Spriggan'] },
  { label: 'EU — Light',     servers: ['Alpha','Lich','Odin','Phoenix','Raiden','Shiva','Twintania','Zodiark'] },
  { label: 'JP — Elemental', servers: ['Aegis','Atomos','Carbuncle','Garuda','Gungnir','Kujata','Tonberry','Typhon'] },
  { label: 'JP — Gaia',      servers: ['Alexander','Bahamut','Durandal','Fenrir','Ifrit','Ridill','Tiamat','Ultima'] },
  { label: 'JP — Mana',      servers: ['Anima','Asura','Chocobo','Hades','Ixion','Masamune','Pandaemonium','Titan'] },
  { label: 'JP — Meteor',    servers: ['Belias','Mandragora','Ramuh','Shinryu','Unicorn','Valefor','Yojimbo','Zeromus'] },
  { label: 'OC — Materia',   servers: ['Bismarck','Ravana','Sephirot','Sophia','Zurvan'] },
]

// ─── Computed ─────────────────────────────────────────────────────────────────

const canSearch = computed(() => localName.value.trim().length >= 2 && localServer.value)

const activeJob = computed(() => {
  if (!character.value?.ClassJobs) return null
  const active = character.value.ActiveClassJobID
  return character.value.ClassJobs.find(j => j.JobID === active || j.ClassID === active)
    ?? character.value.ClassJobs[0]
})

const sortedJobs = computed(() => {
  if (!character.value?.ClassJobs) return []
  return [...character.value.ClassJobs]
    .filter(j => j.Level > 0)
    .sort((a, b) => b.Level - a.Level)
})

const gearItems = computed(() => {
  if (!character.value?.GearSet?.Gear) return []
  const slotMap = {
    MainHand: 'Main hand', OffHand: 'Off hand',
    Head: 'Head', Body: 'Body', Hands: 'Hands',
    Waist: 'Belt', Legs: 'Legs', Feet: 'Feet',
    Earrings: 'Earrings', Necklace: 'Necklace',
    Bracelets: 'Bracelets', Ring1: 'Ring 1', Ring2: 'Ring 2',
    SoulCrystal: 'Soul crystal',
  }
  return Object.keys(slotMap)
    .filter(k => character.value.GearSet.Gear[k]?.Item)
    .map(k => ({
      slot: slotMap[k],
      Name: character.value.GearSet.Gear[k].Item.Name,
      Icon: character.value.GearSet.Gear[k].Item.Icon,
    }))
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apiUrl(path) {
  const url = new URL(`${BASE}${path}`)
  if (props.apiKey) url.searchParams.set('private_key', props.apiKey)
  return url.toString()
}

async function apiFetch(path) {
  const res = await fetch(apiUrl(path))
  if (!res.ok) throw new Error(`XIVAPI returned ${res.status}`)
  return res.json()
}

// ─── Actions ──────────────────────────────────────────────────────────────────

async function search() {
  if (!canSearch.value || status.value === 'loading') return

  const name   = localName.value.trim()
  const server = localServer.value
  lastQuery.value = { name, server }

  status.value = 'loading'
  errorMsg.value = ''
  results.value = []
  character.value = null
  selectedId.value = null

  try {
    const data = await apiFetch(
      `/character/search?name=${encodeURIComponent(name)}&server=${encodeURIComponent(server)}`
    )

    if (!data.Results?.length) {
      status.value = 'empty'
      return
    }

    results.value = data.Results
    prevResults.value = data.Results
    status.value = 'results'
    emit('results', data.Results)

    // If exactly one result, jump straight to detail
    if (data.Results.length === 1) {
      await selectCharacter(data.Results[0])
    }
  } catch (e) {
    errorMsg.value = e.message ?? 'Failed to reach XIVAPI. Check your network or try again.'
    status.value = 'error'
    emit('error', errorMsg.value)
  }
}

async function selectCharacter(char) {
  selectedId.value = char.ID
  status.value = 'detail'
  detailLoading.value = true
  character.value = null

  try {
    const data = await apiFetch(`/character/${char.ID}?extended=1&data=CJ,GS`)
    character.value = data.Character
    emit('character-selected', data.Character)
  } catch (e) {
    errorMsg.value = e.message ?? 'Failed to load character profile.'
    status.value = 'error'
    emit('error', errorMsg.value)
  } finally {
    detailLoading.value = false
  }
}

function backToResults() {
  character.value = null
  selectedId.value = null
  status.value = prevResults.value.length ? 'results' : 'idle'
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  if (props.autoSearch && props.initialName && props.initialServer) {
    search()
  }
})

// Keep local fields in sync if parent updates props
watch(() => props.initialName,   v => { localName.value   = v })
watch(() => props.initialServer, v => { localServer.value = v })
</script>

<style scoped>
/* ── tokens ── */
.xiv-search {
  --xiv-accent: #c8a96e;
  --xiv-accent-dim: #a88748;
  --xiv-radius: 10px;
  --xiv-radius-sm: 6px;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--color-text-primary, #111);
  max-width: 720px;
}

/* ── search panel ── */
.search-panel {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 160px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary, #666);
}

.field-input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border-secondary, #d0d0d0);
  border-radius: var(--xiv-radius-sm);
  background: var(--color-background-primary, #fff);
  color: var(--color-text-primary, #111);
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}
.field-input:focus {
  border-color: var(--xiv-accent);
}

.search-btn {
  height: 40px;
  padding: 0 24px;
  background: var(--xiv-accent);
  color: #1a1208;
  font-size: 13px;
  font-weight: 600;
  border: none;
  border-radius: var(--xiv-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.search-btn:hover:not(:disabled) { background: var(--xiv-accent-dim); }
.search-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #1a1208;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ── feedback ── */
.feedback {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: var(--xiv-radius-sm);
  margin-bottom: 1rem;
}
.feedback.error {
  background: #fff1f0;
  color: #c0392b;
  border: 1px solid #fca5a5;
}
.feedback.empty {
  background: var(--color-background-secondary, #f5f5f5);
  color: var(--color-text-secondary, #555);
  border: 1px solid var(--color-border-tertiary, #e0e0e0);
}

/* ── results ── */
.results-meta {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary, #777);
  margin-bottom: 10px;
}

.results-list { display: flex; flex-direction: column; gap: 8px; }

.result-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--color-background-primary, #fff);
  border: 1px solid var(--color-border-tertiary, #e4e4e4);
  border-radius: var(--xiv-radius);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.result-card:hover { border-color: var(--xiv-accent); }
.result-card.selected { border-color: var(--xiv-accent); background: #fdf8ef; }

.result-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--color-border-tertiary, #ddd);
  flex-shrink: 0;
}

.result-info { flex: 1; }
.result-name { font-size: 15px; font-weight: 500; }
.result-meta { font-size: 12px; color: var(--color-text-secondary, #666); margin-top: 2px; }
.result-rank { font-size: 11px; color: var(--xiv-accent); margin-top: 2px; }
.result-arrow { font-size: 20px; color: var(--color-text-tertiary, #aaa); }

/* ── detail panel ── */
.detail-panel {
  border: 1px solid var(--color-border-tertiary, #e4e4e4);
  border-radius: var(--xiv-radius);
  padding: 1.25rem;
  background: var(--color-background-primary, #fff);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-secondary, #666);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.25rem;
  transition: color 0.15s;
}
.back-btn:hover { color: var(--xiv-accent); }

.state-center {
  display: flex; flex-direction: column;
  align-items: center; gap: 12px; padding: 3rem 0;
}
.spinner-lg {
  width: 32px; height: 32px;
  border: 3px solid var(--color-border-tertiary, #ddd);
  border-top-color: var(--xiv-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.loading-text { font-size: 13px; color: var(--color-text-secondary, #777); }

/* character sheet */
.char-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.char-portrait {
  width: 140px;
  height: auto;
  border-radius: var(--xiv-radius);
  border: 1px solid var(--color-border-tertiary, #ddd);
  object-fit: cover;
  flex-shrink: 0;
}

.char-title-tag {
  font-size: 11px;
  color: var(--xiv-accent);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 4px;
}
.char-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}
.char-world { font-size: 13px; color: var(--color-text-secondary, #666); margin-bottom: 10px; }

.char-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--color-background-secondary, #f3f3f3);
  border: 1px solid var(--color-border-tertiary, #e0e0e0);
  color: var(--color-text-secondary, #555);
}

/* detail cards */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 1.25rem;
}

.detail-card {
  background: var(--color-background-secondary, #f8f8f8);
  border: 1px solid var(--color-border-tertiary, #e4e4e4);
  border-radius: var(--xiv-radius);
  padding: 1rem;
}

.detail-card-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary, #777);
  margin-bottom: 10px;
}

.detail-list { display: flex; flex-direction: column; gap: 5px; }
.dl-row { display: flex; justify-content: space-between; font-size: 13px; }
.dl-row dt { color: var(--color-text-secondary, #666); }
.dl-row dd { font-weight: 500; text-align: right; max-width: 60%; }

/* active job */
.job-feature { display: flex; align-items: center; gap: 12px; }
.job-icon-lg {
  width: 40px; height: 40px;
  border-radius: var(--xiv-radius-sm);
  border: 1px solid var(--color-border-tertiary, #ddd);
}
.job-name { font-size: 15px; font-weight: 500; margin-bottom: 5px; }
.level-track {
  width: 100px; height: 4px;
  background: var(--color-border-tertiary, #ddd);
  border-radius: 2px; overflow: hidden; margin-bottom: 4px;
}
.level-fill { height: 100%; background: var(--xiv-accent); border-radius: 2px; }
.job-level { font-size: 12px; color: var(--color-text-secondary, #777); }

/* jobs grid */
.section { margin-bottom: 1.25rem; }
.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary, #777);
  margin-bottom: 10px;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
  gap: 7px;
}

.job-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--color-border-tertiary, #e4e4e4);
  border-radius: var(--xiv-radius-sm);
  background: var(--color-background-primary, #fff);
}
.job-chip.maxed { border-color: var(--xiv-accent); }
.chip-img { width: 26px; height: 26px; border-radius: 4px; flex-shrink: 0; }
.chip-label { flex: 1; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chip-lvl { font-size: 12px; font-weight: 500; color: var(--color-text-secondary, #777); }
.chip-lvl.gold { color: var(--xiv-accent); }

/* gear grid */
.gear-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 7px;
}

.gear-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--color-border-tertiary, #e4e4e4);
  border-radius: var(--xiv-radius-sm);
  background: var(--color-background-primary, #fff);
}
.gear-img { width: 28px; height: 28px; border-radius: 4px; flex-shrink: 0; }
.gear-text { display: flex; flex-direction: column; overflow: hidden; }
.gear-slot { font-size: 10px; color: var(--color-text-tertiary, #aaa); }
.gear-name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* transitions */
.slide-up-enter-active { transition: all 0.25s ease-out; }
.slide-up-enter-from   { opacity: 0; transform: translateY(8px); }

@keyframes spin { to { transform: rotate(360deg) } }

/* responsive */
@media (max-width: 480px) {
  .char-header { flex-direction: column; }
  .char-portrait { width: 100%; max-height: 220px; }
  .search-panel { flex-direction: column; }
  .search-btn { width: 100%; justify-content: center; }
}
</style>