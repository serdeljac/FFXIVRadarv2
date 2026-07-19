<template>
  <div :class="['weatherPatterns body_content', windowWidth]">
    <PageHeader title="Weather Patterns" :tagline="pageTagLine" icon="weather" />

    <!-- Filter Bar -->
    <div class="body_content-group filterbar">
      <div class="wrapper">
        <toggleFilterBtn
          v-for="(filter, index) in filters"
          :key="filter.name"
          :name="filter.name"
          :icon="filter.name"
          :enabled="filter.name == filterSelected  ? true : null"
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
          <div class="rdrTable_row-name">
            <p>{{ zone.name }}</p>
          </div>

          <div class="rdrTable_row-weather">
            <p>-</p>
          </div>

          <div class="rdrTable_row-weather">
            <p>-</p>
          </div>

          <div class="rdrTable_row-weather">
            <p>-</p>
          </div>

          <div class="rdrTable_row-weather">
            <p>-</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import PageHeader from '../ui/displayPageHeader.vue'
import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'

interface Zone {
  name: string
  mapCode: string
  expansion: string
  id?: string
}

interface Filter {
  group: string
  name: string
  enabled: boolean
}

const props = defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])

const pageTagLine = 'View weather patterns for zones across Eorzea.'
const filterSelected = ref('')

const uniqueExpansions = computed<string[]>(() => {
  // Get unique expansions from zones
  const seen = new Set<string>()
  const zoneExpansions: string[] = []
  for (const zone of zones.value) {
    if (zone.expansion && !seen.has(zone.expansion)) {
      seen.add(zone.expansion)
      zoneExpansions.push(zone.expansion)
    }
  }

  // Sort by order in ffxivData.expansions
  if (props.ffxivData?.expansion && Array.isArray(props.ffxivData.expansion)) {
    const expansionOrder = props.ffxivData.expansion.map((e: any) => e.expansion)
    return zoneExpansions.sort((a, b) => {
      const aIndex = expansionOrder.indexOf(a)
      const bIndex = expansionOrder.indexOf(b)
      return aIndex - bIndex
    })
  }

  return zoneExpansions
})

const zones = computed<Zone[]>(() => {
  if (!props.ffxivData?.areas) return []

  const seen = new Set<string>()
  const uniqueZones: Zone[] = []

  for (const area of props.ffxivData.areas) {
    const identifier = area.mapcode || area.ID
    if (!identifier || seen.has(identifier)) continue
    seen.add(identifier)
    uniqueZones.push({
      name: area.zone,
      mapCode: area.mapcode || '',
      expansion: area.expansion,
      id: area.ID,
    })
  }

  return uniqueZones
})

const filters = computed<Filter[]>(() => {
  return uniqueExpansions.value.map((name, i) => ({
    group: 'expansion',
    name,
    enabled: i === 0,
  }))
})

const filteredZones = computed<Zone[]>(() => {
  // Auto-select first expansion on initial load
  if (!filterSelected.value && filters.value.length > 0) {
    filterSelected.value = filters.value[0].name
  }
  if (!filterSelected.value) return zones.value
  return zones.value.filter(zone => zone.expansion === filterSelected.value)
})

function changeFilter(arrayIndex: number) {
  filterSelected.value = filters.value[arrayIndex].name
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
}
</style>
