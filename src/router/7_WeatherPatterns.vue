<template>
  <div :class="['weatherPatterns body_content', windowWidth]">

    <PageHeader title="Weather Patterns" :tagline="pageTagLine" icon="weather" />

    <div class="body_content-group filterbar">
      <div class="wrapper">
        <ToggleFilter
          v-for="filter in filters"
          :key="filter.name"
          :name="filter.name"
          :icon="filter.name"
          :enabled="filter.name == filterSelected  ? true : null"
          @select="filterSelected = filter.name"
        />
      </div>
    </div>

    <div
      :class="['body_content-group rdrTable', windowWidth]"
      role="table"
      aria-label="Zone weather forecast">
      <ul class="rdrTable_header" role="rowgroup">
        <li class="rdrTable_row" role="row">
          <p class="rdrTable_row-name" role="columnheader">Zone</p>
          <p class="rdrTable_row-weather" role="columnheader">Previous</p>
          <p class="rdrTable_row-weather rdrTable_row-current" role="columnheader">Current</p>
          <p class="rdrTable_row-weather" role="columnheader">Next (8h)</p>
          <p class="rdrTable_row-weather" role="columnheader">After (16h)</p>
        </li>
      </ul>

      <hr class="rdrTable_split" />

      <ul class="rdrTable_body" role="rowgroup">
        <li
          v-for="zone in filteredZones"
          :key="zone.id"
          class="rdrTable_row"
          role="row">

          <div class="rdrTable_row-name" role="cell">
            <p>{{ zone.name }}</p>
          </div>

          <div class="rdrTable_row-weather" role="cell">
            <p>{{ zone.weather?.previous || '—' }}</p>
          </div>

          <div class="rdrTable_row-weather rdrTable_row-current" role="cell">
            <p>{{ zone.weather?.current || '—' }}</p>
          </div>

          <div class="rdrTable_row-weather" role="cell">
            <p>{{ zone.weather?.next1 || '—' }}</p>
          </div>

          <div class="rdrTable_row-weather" role="cell">
            <p>{{ zone.weather?.next2 || '—' }}</p>
          </div>
        </li>
      </ul>

      <div v-if="!filteredZones.length">
        <p class="noResults">No zones found for this expansion.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const props = defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])
  import PageHeader from '../components/PageHeader.vue'
  const pageTagLine = 'View weather patterns for zones across Eorzea.'

  import ToggleFilter from '../components/buttons/ToggleFilter.vue'

  import { ref, computed, watch } from 'vue'
  import { getWeatherForecast } from '../modules/weatherForecast'
  import { capitalize } from '../hooks/hooks.ts'

  const WEATHER_CHANGE_EORZEA_MINUTES = [0, 480, 960] as const

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

  const filterSelected = ref('')
  const weatherRefreshTick = ref(0)
  let lastWeatherBoundaryMin = -1

  // Watches the Eorzea clock and bumps the refresh tick once per boundary crossing.
  // A 2-minute tolerance absorbs whole-minute tick drift; leaving the window resets
  // the guard so the same boundary can fire again the next Eorzea day.
  watch(
    () => props.eorzeaClock?.totalMin,
    (totalMin: number | undefined) => {
      if (totalMin == null) return

      const crossedBoundary = WEATHER_CHANGE_EORZEA_MINUTES.find(
        (boundary) => totalMin >= boundary && totalMin < boundary + 2
      )

      if (crossedBoundary !== undefined && crossedBoundary !== lastWeatherBoundaryMin) {
        lastWeatherBoundaryMin = crossedBoundary
        weatherRefreshTick.value++
      } else if (crossedBoundary === undefined) {
        lastWeatherBoundaryMin = -1
      }
    }
  )

  // Distinct zone expansions, re-sorted into ffxivData's canonical expansion order.
  const uniqueExpansions = computed<string[]>(() => {
    const seen = new Set<string>()
    const zoneExpansions: string[] = []
    for (const zone of zones.value) {
      if (zone.expansion && !seen.has(zone.expansion)) {
        seen.add(zone.expansion)
        zoneExpansions.push(zone.expansion)
      }
    }

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

  interface ZoneWithWeather extends Zone {
    weather?: {
      previous: string
      current: string
      next1: string
      next2: string
    }
  }

  // Zones for the selected expansion, deduplicated by name, each annotated with its
  // four-slot forecast. Reads weatherRefreshTick so it re-runs on weather boundaries,
  // and auto-selects the first expansion on initial load.
  const filteredZones = computed<ZoneWithWeather[]>(() => {
    void weatherRefreshTick.value

    if (!filterSelected.value && filters.value.length > 0) {
      filterSelected.value = filters.value[0].name
    }

    if (!filterSelected.value || !props.ffxivData?.areas) return []

    const seen = new Set<string>()
    const uniqueZones: ZoneWithWeather[] = []
    const excludedZones = ['The Gold Saucer']

    for (const area of props.ffxivData.areas) {
      if (area.expansion === filterSelected.value && area.zone && !seen.has(area.zone) && !excludedZones.includes(area.zone)) {
        seen.add(area.zone)

        let weatherData = undefined
        const mapcode = area.mapcode || getMapcodeFromZoneName(area.zone)
        if (mapcode) {
          try {
            const forecast = getWeatherForecast(mapcode)
            weatherData = {
              previous: forecast.previous.name,
              current: forecast.current.name,
              next1: forecast.next1.name,
              next2: forecast.next2.name,
            }
          } catch (error) {
          }
        }

        uniqueZones.push({
          name: area.zone,
          mapCode: area.mapcode || '',
          expansion: area.expansion,
          id: area.ID,
          weather: weatherData,
        })
      }
    }

    return uniqueZones
  })


  // Derives a camelCase mapcode from a display zone name (e.g. "Radz-at-Han" ->
  // "radzAtHan"), dropping apostrophes to match the existing mapcode conventions.
  function getMapcodeFromZoneName(zoneName: string): string {
    return zoneName
      .toLowerCase()
      .replace(/'/g, '')
      .replace(/[\s\-]/g, ' ')
      .split(' ')
      .map((word, index) => (index === 0 ? word : capitalize(word)))
      .join('')
      .replace(/[\s\-]/g, '')
  }
</script>

<style scoped lang="scss">
    .weatherPatterns {
        font-family: 'Rajdhani', sans-serif;
        margin: 0 auto;

        &.mobile .filterbar :deep(.btn) {
            margin: 6px 5px;
        }

        /* ── Filter bar ── */
        .filterbar {
            padding: 16px 20px;
            max-width: 1200px;

            :deep(.btn) {
                border: 1px solid $buttonBorder;
                background: rgba(255, 255, 255, 0.03);
                color: $fontColor;
                font-family: 'Rajdhani', sans-serif;
                letter-spacing: 0.03em;
                border-radius: 8px;
                box-shadow: none;
                transition: all 0.2s;

                &[enabled] {
                    background: rgba(45, 212, 191, 0.12) !important;
                    border-color: rgba(45, 212, 191, 0.4);
                    color: #e8f0ff;
                }

                &:hover:not([disabled]) {
                    background: rgba(45, 212, 191, 0.07);
                    border-color: rgba(45, 212, 191, 0.35);
                    color: #e8f0ff;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
                }
            }
        }

        /* ── Table ── */
        .rdrTable {
            border: 1px solid $buttonBorder;
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.02);
            padding: 8px 12px 12px;

            &_header .rdrTable_row p {
                font-family: 'Share Tech Mono', monospace;
                font-size: 0.72rem;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: $teal;
            }

            &_split {
                border: none;
                border-top: 1px solid rgba(45, 212, 191, 0.15);
                margin: 4px 0 8px;
            }

            &_body .rdrTable_row {
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid transparent;
                transition: all 0.15s;

                &:hover {
                    background: rgba(45, 212, 191, 0.05);
                    border-color: rgba(45, 212, 191, 0.15);
                }
            }

            // Forecast cells are secondary; the zone name anchors the row.
            &_row-name p {
                color: $fontColor;
                font-weight: 600;
            }

            // Targets the <p> rather than the cell: the global `*` reset sets a
            // colour on every element, so a colour on the wrapper never reaches it.
            &_row-weather p {
                color: $dim;
                font-size: 0.9rem;
            }

            // "Current" is the value the page exists to answer, so it gets the
            // same teal emphasis the other tables give their live value.
            &_row-current p {
                color: $teal;
                font-family: 'Share Tech Mono', monospace;
                font-size: 0.85rem;
            }
        }

        .noResults {
            text-align: center;
            padding: 20px;
            color: $dim;
            font-family: 'Share Tech Mono', monospace;
            font-size: 0.85rem;
        }

        // Default layout
        .rdrTable_row {
            grid-template-columns: 260px repeat(4, 1fr);
        }

        // Tablet view
        .rdrTable.tablet {
            .rdrTable_row {
                grid-template-columns: 170px repeat(4, 1fr);
            }
        }

        // Mobile view — drop the two look-ahead columns rather than stacking,
        // matching how the other tables shed secondary columns.
        .rdrTable.mobile {
            .rdrTable_header,
            .rdrTable_split {
                display: none;
            }

            .rdrTable_row {
                grid-template-columns: auto 1fr;
            }

            .rdrTable_row-weather:not(.rdrTable_row-current) {
                display: none;
            }
        }
    }
</style>
