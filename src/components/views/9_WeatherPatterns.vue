<template>
  <div :class="['weatherPatterns body_content', windowWidth]">
    <PageHeader title="Weather Patterns" :tagline="pageTagLine" icon="weather"/>

    <!-- Filter Bar -->
    <div class="body_content-group filterbar">
      <div class="wrapper">
        <toggleFilter
          v-for="(filter, index) in filters"
          :key="filter.name"
          :name="filter.name"
          :enabled="filter.enabled || null"
          @click="changeFilter(index)"
        />
      </div>
    </div>

    <!-- Weather Table -->
    <div :class="['body_content-group rdrTable', windowWidth]">
      <ul class="rdrTable_header">
        <li class="rdrTable_row">
          <p class="rdrTable_row-name">Zone</p>
          <p class="rdrTable_row-weather">Previous (8h ago)</p>
          <p class="rdrTable_row-weather">Current</p>
          <p class="rdrTable_row-weather">Next (8h)</p>
          <p class="rdrTable_row-weather">After (16h)</p>
        </li>
      </ul>

      <hr class="rdrTable_split" />

      <ul class="rdrTable_body">
        <li
          v-for="zone in filteredZones"
          :key="zone.mapCode"
          class="rdrTable_row"
        >
          <!-- ZONE NAME -->
          <div class="rdrTable_row-name">
            <p>{{ zone.name }}</p>
          </div>

          <!-- PREVIOUS WEATHER -->
          <div class="rdrTable_row-weather">
            <p>{{ getWeatherForecast(zone.mapCode)?.previous.name || 'Unknown' }}</p>
          </div>

          <!-- CURRENT WEATHER -->
          <div class="rdrTable_row-weather">
            <p>{{ getWeatherForecast(zone.mapCode)?.current.name || 'Unknown' }}</p>
          </div>

          <!-- NEXT WEATHER -->
          <div class="rdrTable_row-weather">
            <p>{{ getWeatherForecast(zone.mapCode)?.next1.name || 'Unknown' }}</p>
          </div>

          <!-- AFTER WEATHER -->
          <div class="rdrTable_row-weather">
            <p>{{ getWeatherForecast(zone.mapCode)?.next2.name || 'Unknown' }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import PageHeader from '../ui/displayPageHeader.vue'
import toggleFilter from '../ui/buttons/toggleFilter.vue'
import EorzeaWeather from 'eorzea-weather'

interface Zone {
  name: string
  mapCode: string
  expansion: string
}

interface WeatherForecast {
  previous: { name: string; time: string }
  current: { name: string; time: string }
  next1: { name: string; time: string }
  next2: { name: string; time: string }
}

interface Filter {
  name: string
  enabled: boolean
}

const props = defineProps<{
  ffxivData?: any
}>()

const pageTagLine = 'Browse weather patterns for zones across Eorzea.'
const windowWidth = ref('desktop')
const filters = ref<Filter[]>([])
const filterSelected = ref('')
const weatherCache = new Map<string, WeatherForecast>()

const uniqueExpansions = computed<string[]>(() => {
  if (!props.ffxivData?.areas) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const area of props.ffxivData.areas) {
    if (area.inoverview === 1 && area.expansion && !seen.has(area.expansion)) {
      seen.add(area.expansion)
      result.push(area.expansion)
    }
  }
  return result.sort()
})

const zones = computed(() => {
  if (!props.ffxivData?.areas) return []

  const seen = new Set<string>()
  const uniqueZones: Zone[] = []

  for (const area of props.ffxivData.areas) {
    if (!area.mapcode || area.inoverview === 0 || seen.has(area.mapcode)) continue
    seen.add(area.mapcode)
    uniqueZones.push({
      name: area.zone,
      mapCode: area.mapcode,
      expansion: area.expansion,
    })
  }

  return uniqueZones
})

const filteredZones = computed(() => {
  if (!filterSelected.value) return zones.value
  return zones.value.filter(zone => zone.expansion === filterSelected.value)
})

function initFilters() {
  filters.value = uniqueExpansions.value.map((name, i) => ({
    name,
    enabled: i === 0,
  }))
  filterSelected.value = filters.value[0]?.name ?? ''
}

function changeFilter(arrayIndex: number) {
  filters.value.forEach((f, i) => { f.enabled = i === arrayIndex })
  filterSelected.value = filters.value[arrayIndex].name
}

watch(uniqueExpansions, () => {
  if (uniqueExpansions.value.length > 0) {
    initFilters()
  }
}, { immediate: true })

function getWeatherForecast(mapCode: string): WeatherForecast | null {
  if (weatherCache.has(mapCode)) {
    return weatherCache.get(mapCode) || null
  }

  try {
    const now = new Date()
    const current = EorzeaWeather.getWeather(mapCode, now)
    if (!current) return null

    const previous = EorzeaWeather.getWeather(mapCode, new Date(now.getTime() - 8 * 60 * 60 * 1000))
    const next1 = EorzeaWeather.getWeather(mapCode, new Date(now.getTime() + 8 * 60 * 60 * 1000))
    const next2 = EorzeaWeather.getWeather(mapCode, new Date(now.getTime() + 16 * 60 * 60 * 1000))

    const forecast: WeatherForecast = {
      previous: { name: previous || 'Unknown', time: '-8h' },
      current: { name: current, time: 'Now' },
      next1: { name: next1 || 'Unknown', time: '+8h' },
      next2: { name: next2 || 'Unknown', time: '+16h' },
    }

    weatherCache.set(mapCode, forecast)
    return forecast
  } catch {
    return null
  }
}
</script>

<style scoped lang="scss">
.weatherPatterns {
  padding: 0;
}

.rdrTable_header {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(45, 212, 191, 0.3);
  border-bottom: 1px solid rgba(45, 212, 191, 0.3);
}

.rdrTable_row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
  gap: 0;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid rgba(45, 212, 191, 0.1);
  align-items: center;

  &:hover {
    background: rgba(45, 212, 191, 0.05);
  }

  p {
    padding: 12px;
    margin: 0;
    font-size: 14px;
    text-align: center;
    word-break: break-word;
  }
}

.rdrTable_header .rdrTable_row {
  background: rgba(45, 212, 191, 0.1);
  font-weight: 600;
  color: #2dd4bf;

  p {
    padding: 14px 12px;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 0.5px;
  }

  &:hover {
    background: rgba(45, 212, 191, 0.1);
  }
}

.rdrTable_row-name {
  text-align: left;
  color: #2dd4bf;
  font-weight: 500;
}

.rdrTable_row-weather {
  color: #fff;
  font-size: 13px;
}

.rdrTable_split {
  display: none;
}

.rdrTable_body {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 0;
  }
}

@media (max-width: 768px) {
  .rdrTable_row {
    grid-template-columns: 1fr;
    padding: 8px;

    p {
      padding: 4px 0;
    }
  }

  .rdrTable_header .rdrTable_row {
    display: none;
  }

  .rdrTable_body .rdrTable_row {
    display: flex;
    flex-direction: column;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    margin-bottom: 8px;
    border: 1px solid rgba(45, 212, 191, 0.2);
  }

  .rdrTable_row-name {
    font-weight: bold;
    text-align: left;
  }
}</style>
