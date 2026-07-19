<template>
  <section class="body_content weatherPatterns">
    <PageHeader title="Weather Patterns" :tagline="pageTagLine" icon="weather"/>

    <div class="weatherPatterns_content">
      <div v-if="expandedZone" class="weatherPatterns_detail">
        <button class="weatherPatterns_backBtn" @click="expandedZone = null">
          ← Back
        </button>

        <h2>{{ expandedZone.name }} - Weather Forecast</h2>

        <div class="weatherPatterns_forecast">
          <WeatherForecast :zoneMapCode="expandedZone.mapCode"/>
        </div>

        <div class="weatherPatterns_history">
          <h3>Recent Weather (Last 24 Hours)</h3>
          <div class="weatherPatterns_historyList">
            <div v-for="(weather, idx) in weatherHistory" :key="idx" class="weatherPatterns_historyItem">
              <div class="weatherPatterns_time">{{ formatTime(weather.timestamp) }}</div>
              <div class="weatherPatterns_weatherName">{{ weather.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="weatherPatterns_list">
        <div class="weatherPatterns_filterArea">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search zones..."
            class="weatherPatterns_search"
          />
        </div>

        <div class="weatherPatterns_zoneGrid">
          <div
            v-for="zone in filteredZones"
            :key="zone.mapCode"
            class="weatherPatterns_zoneCard"
            @click="selectZone(zone)"
          >
            <h3>{{ zone.name }}</h3>
            <div class="weatherPatterns_currentWeather">
              <div class="weatherPatterns_label">Current</div>
              <div class="weatherPatterns_weatherName">{{ getZoneCurrentWeather(zone.mapCode) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../ui/displayPageHeader.vue'
import WeatherForecast from '../API/weatherForecast.vue'
import EorzeaWeather from 'eorzea-weather'
import { getWeatherHistory } from '../API/weatherForecast'

interface Zone {
  name: string
  mapCode: string
}

const props = defineProps<{
  ffxivData?: any
}>()

const pageTagLine = 'View weather patterns for every zone in Eorzea. Check current conditions and forecast upcoming weather changes.'

const expandedZone = ref<Zone | null>(null)
const searchQuery = ref('')
const weatherHistory = ref<Array<{ name: string; timestamp: Date }>>([])

const zones = ref<Zone[]>([
  { name: 'Limsa Lominsa Lower Decks', mapCode: 'limsa_lominsa' },
  { name: 'Middle La Noscea', mapCode: 'middle_la_noscea' },
  { name: 'Lower La Noscea', mapCode: 'lower_la_noscea' },
  { name: 'Eastern La Noscea', mapCode: 'eastern_la_noscea' },
  { name: 'Western La Noscea', mapCode: 'western_la_noscea' },
  { name: 'Upper La Noscea', mapCode: 'upper_la_noscea' },
  { name: 'Outer La Noscea', mapCode: 'outer_la_noscea' },
  { name: 'New Gridania', mapCode: 'new_gridania' },
  { name: 'Central Shroud', mapCode: 'central_shroud' },
  { name: 'East Shroud', mapCode: 'east_shroud' },
  { name: 'South Shroud', mapCode: 'south_shroud' },
  { name: 'North Shroud', mapCode: 'north_shroud' },
  { name: 'Ul\'dah - Steps of Thal', mapCode: 'uldah' },
  { name: 'Western Thanalan', mapCode: 'western_thanalan' },
  { name: 'Central Thanalan', mapCode: 'central_thanalan' },
  { name: 'Eastern Thanalan', mapCode: 'eastern_thanalan' },
  { name: 'Southern Thanalan', mapCode: 'southern_thanalan' },
  { name: 'Northern Thanalan', mapCode: 'northern_thanalan' },
  { name: 'Coerthas Central Highlands', mapCode: 'coerthas_central' },
  { name: 'Mor Dhona', mapCode: 'mor_dhona' },
  { name: 'Coerthas Western Highlands', mapCode: 'coerthas_western' },
  { name: 'The Sea of Clouds', mapCode: 'sea_of_clouds' },
  { name: 'Azys Lla', mapCode: 'azys_lla' },
  { name: 'The Dravanian Forelands', mapCode: 'dravanian_forelands' },
  { name: 'The Dravanian Hinterlands', mapCode: 'dravanian_hinterlands' },
  { name: 'The Churning Mists', mapCode: 'churning_mists' },
  { name: 'Kugane', mapCode: 'kugane' },
  { name: 'The Fringes', mapCode: 'the_fringes' },
  { name: 'The Peaks', mapCode: 'the_peaks' },
  { name: 'The Lochs', mapCode: 'the_lochs' },
  { name: 'The Ruby Sea', mapCode: 'the_ruby_sea' },
  { name: 'Yanxia', mapCode: 'yanxia' },
  { name: 'The Azim Steppe', mapCode: 'azim_steppe' },
  { name: 'The Crystarium', mapCode: 'the_crystarium' },
  { name: 'Lakeland', mapCode: 'lakeland' },
  { name: 'Kholusia', mapCode: 'kholusia' },
  { name: 'Amh Araeng', mapCode: 'amh_araeng' },
  { name: 'Il Mheg', mapCode: 'il_mheg' },
  { name: 'The Rak\'tika Greatwood', mapCode: 'raktika_greatwood' },
  { name: 'The Tempest', mapCode: 'the_tempest' },
  { name: 'Old Sharlayan', mapCode: 'old_sharlayan' },
  { name: 'Labyrinthos', mapCode: 'labyrinthos' },
  { name: 'Thavnair', mapCode: 'thavnair' },
  { name: 'Garlemald', mapCode: 'garlemald' },
  { name: 'Mare Lamentorum', mapCode: 'mare_lamentorum' },
  { name: 'Ultima Thule', mapCode: 'ultima_thule' },
  { name: 'Elpis', mapCode: 'elpis' },
])

const filteredZones = computed(() => {
  if (!searchQuery.value) return zones.value
  const query = searchQuery.value.toLowerCase()
  return zones.value.filter(zone => zone.name.toLowerCase().includes(query))
})

function getZoneCurrentWeather(mapCode: string): string {
  try {
    const weather = EorzeaWeather.getWeather(mapCode, new Date())
    return weather?.name || 'Unknown'
  } catch {
    return 'N/A'
  }
}

function selectZone(zone: Zone) {
  expandedZone.value = zone
  try {
    weatherHistory.value = getWeatherHistory(zone.mapCode, 24)
  } catch (error) {
    console.error('Failed to load weather history:', error)
    weatherHistory.value = []
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}
</script>

<style scoped lang="scss">
  .weatherPatterns {
    padding: 20px;
  }

  .weatherPatterns_content {
    margin-top: 20px;
  }

  .weatherPatterns_detail {
    animation: slideIn 0.3s ease-in-out;
  }

  .weatherPatterns_backBtn {
    background: rgba(45, 212, 191, 0.1);
    border: 1px solid rgba(45, 212, 191, 0.5);
    color: #2dd4bf;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.2s;

    &:hover {
      background: rgba(45, 212, 191, 0.2);
    }
  }

  .weatherPatterns_detail h2 {
    font-size: 24px;
    margin-bottom: 20px;
    color: #2dd4bf;
  }

  .weatherPatterns_forecast {
    margin-bottom: 40px;
  }

  .weatherPatterns_history {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    padding: 20px;

    h3 {
      color: #2dd4bf;
      margin-bottom: 15px;
      font-size: 16px;
    }
  }

  .weatherPatterns_historyList {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .weatherPatterns_historyItem {
    background: rgba(45, 212, 191, 0.1);
    border: 1px solid rgba(45, 212, 191, 0.3);
    border-radius: 4px;
    padding: 12px;
    text-align: center;
  }

  .weatherPatterns_time {
    font-size: 11px;
    color: #999;
    margin-bottom: 6px;
  }

  .weatherPatterns_weatherName {
    color: #2dd4bf;
    font-weight: 500;
  }

  .weatherPatterns_filterArea {
    margin-bottom: 20px;
  }

  .weatherPatterns_search {
    width: 100%;
    max-width: 400px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(45, 212, 191, 0.3);
    border-radius: 4px;
    color: #fff;
    font-size: 14px;

    &::placeholder {
      color: #666;
    }

    &:focus {
      outline: none;
      border-color: rgba(45, 212, 191, 0.8);
      background: rgba(0, 0, 0, 0.7);
    }
  }

  .weatherPatterns_zoneGrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }

  .weatherPatterns_zoneCard {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(45, 212, 191, 0.3);
    border-radius: 4px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.6);
      border-color: rgba(45, 212, 191, 0.8);
      transform: translateY(-2px);
    }

    h3 {
      font-size: 16px;
      color: #2dd4bf;
      margin: 0 0 12px 0;
    }
  }

  .weatherPatterns_currentWeather {
    text-align: center;
  }

  .weatherPatterns_label {
    font-size: 11px;
    color: #999;
    margin-bottom: 6px;
  }

  .weatherPatterns_weatherName {
    color: #fff;
    font-weight: 500;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 768px) {
    .weatherPatterns_zoneGrid {
      grid-template-columns: 1fr;
    }
  }
</style>
