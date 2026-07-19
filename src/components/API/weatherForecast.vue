<template>
  <div v-if="forecast" class="weather_forecast">
    <div class="weather_section">
      <div class="weather_label">{{ forecast.previous.time }}</div>
      <div class="weather_name">{{ forecast.previous.name }}</div>
    </div>

    <div class="weather_section active">
      <div class="weather_label">{{ forecast.current.time }}</div>
      <div class="weather_name">{{ forecast.current.name }}</div>
    </div>

    <div class="weather_section">
      <div class="weather_label">{{ forecast.next1.time }}</div>
      <div class="weather_name">{{ forecast.next1.name }}</div>
    </div>

    <div class="weather_section">
      <div class="weather_label">{{ forecast.next2.time }}</div>
      <div class="weather_name">{{ forecast.next2.name }}</div>
    </div>
  </div>
  <div v-else class="weather_forecast weather_loading">
    <span>Loading weather...</span>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { getWeatherForecast, type WeatherForecast } from './weatherForecast'

interface Props {
  zoneMapCode: string
}

const props = defineProps<Props>()

const forecast = ref<WeatherForecast | null>(null)
const error = ref<string | null>(null)

onMounted(() => {
  try {
    forecast.value = getWeatherForecast(props.zoneMapCode)
  } catch (err: any) {
    error.value = err.message
    console.error('Failed to load weather forecast:', err)
  }
})
</script>

<style scoped lang="scss">
  .weather_forecast {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    font-size: 12px;

    &.weather_loading {
      justify-content: center;
      color: #999;
    }
  }

  .weather_section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px;
    border-radius: 2px;
    transition: background-color 0.2s;

    &.active {
      background: rgba(45, 212, 191, 0.2);
      border: 1px solid rgba(45, 212, 191, 0.5);
    }

    &:hover:not(.active) {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  .weather_label {
    color: #999;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .weather_name {
    color: #2dd4bf;
    font-weight: 500;
    text-align: center;
    word-break: break-word;
  }
</style>
