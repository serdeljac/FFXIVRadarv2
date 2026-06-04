<template>
  <section :class="[`eorzeaOverview body_content`, windowWidth]">

    <!-- Map Display -->
    <div
      class="body_content-group mapDisplay"
      :style="{ width: `${columnLayout}px`, height: `${columnLayout}px` }">
      <mapDisplay
        v-if="focusNode"
        :ffxivData="ffxivData"
        :focusNode="focusNode"
        :mapSize="columnLayout"
        class="mapDisplay_root" />
    </div>

    <!-- Map Context Panel -->
    <div class="body_content-group mapContext">

      <!-- Header: location title + zone/search toggles -->
      <div class="mapContext_header">
        <div class="mapContext_header-location">
          <template v-if="!enableSearchMenu">
            <h2>{{ currentZone.region }}</h2>
            <h2>{{ currentZone.zone }}</h2>
            <h3>{{ currentZone.expansion }}</h3>
          </template>
          <template v-else>
            <h2>Search...</h2>
          </template>
        </div>

        <div class="mapContext_header-zonesearch">
          <toggleMenuBtn
            name="Change Zone"
            :disabled="enableSearchMenu || null"
            :enabled="enableZoneMenu || null"
            @click="enableZoneMenu = true" />

          <toggleMenuBtn
            name="Search"
            :enabled="enableSearchMenu || null"
            @click="enableSearchMenu = !enableSearchMenu" />
        </div>
      </div>

      <!-- Tab Bar (zone mode) -->
      <div v-if="!enableSearchMenu" class="mapContext_header-tabbar">
        <div
          v-for="(nodes, jobKey) in zoneNodes"
          :key="jobKey"
          :class="['tab', { disabled: nodes.length === 0, activeTab: tabSelected === jobKey }]"
          @click="selectTab(jobKey)">
          <iconAndText :icon="jobKey" />
        </div>
      </div>

      <!-- Search Bar -->
      <div v-else class="mapContext_header-searchbar">
        <searchBar :modelValue="searchName" @selected="filterByInputValue" />
      </div>

      <!-- Node list — zone mode -->
      <template v-if="!enableSearchMenu">
        <gatheringList
          v-if="tabSelected === 'miner'"
          :data="zoneNodes.miner"
          :timerList="timerList"
          :focusNode="focusNode"
          :windowWidth="windowWidth"
          @changeTracked="(e: any) => $emit('changeTracked', e)"
          @focusNode="(e: any) => (focusNode = e)" />

        <gatheringList
          v-if="tabSelected === 'botany'"
          :data="zoneNodes.botany"
          :timerList="timerList"
          :focusNode="focusNode"
          :windowWidth="windowWidth"
          @changeTracked="(e: any) => $emit('changeTracked', e)"
          @focusNode="(e: any) => (focusNode = e)" />

        <sightseeingList
          v-if="tabSelected === 'sightseeing'"
          :data="zoneNodes.sightseeing"
          :timerList="timerList"
          :weatherList="weatherList"
          :focusNode="focusNode"
          :windowWidth="windowWidth"
          @openVistaImg="(e: any) => $emit('openVistaImg', e)"
          @changeTracked="(e: any) => $emit('changeTracked', e)"
          @focusNode="(e: any) => (focusNode = e)" />

        <fatesList
          v-if="tabSelected === 'fates'"
          :data="zoneNodes.fates"
          :focusNode="focusNode"
          :windowWidth="windowWidth"
          @focusNode="(e: any) => (focusNode = e)" />

        <huntsList
          v-if="tabSelected === 'eliteHunts'"
          :data="zoneNodes.eliteHunts"
          :focusNode="focusNode"
          :windowWidth="windowWidth"
          @focusNode="(e: any) => (focusNode = e)" />

        <aethercurrentList
          v-if="tabSelected === 'aethercurrents'"
          :data="zoneNodes.aethercurrents"
          :focusNode="focusNode"
          :windowWidth="windowWidth"
          @focusNode="(e: any) => (focusNode = e)" />
      </template>

      <!-- Node list — search mode -->
      <template v-else>
        <ul>
          <li v-for="d in searchResults" :key="d.ID">
            <gatheringList
              v-if="d.job === 'miner' || d.job === 'botany'"
              :data="[d]"
              :timerList="timerList"
              :focusNode="focusNode"
              :windowWidth="windowWidth"
              @changeTracked="(e: any) => $emit('changeTracked', e)"
              @focusNode="(e: any) => (focusNode = e)" />

            <sightseeingList
              v-if="d.job === 'sightseeing'"
              :data="[d]"
              :timerList="timerList"
              :weatherList="weatherList"
              :focusNode="focusNode"
              :windowWidth="windowWidth"
              @changeTracked="(e: any) => $emit('changeTracked', e)"
              @focusNode="(e: any) => (focusNode = e)" />

            <fatesList
              v-if="d.job === 'fates'"
              :data="[d]"
              :focusNode="focusNode"
              :windowWidth="windowWidth"
              @focusNode="(e: any) => (focusNode = e)" />

            <huntsList
              v-if="d.job === 'eliteHunts'"
              :data="[d]"
              :focusNode="focusNode"
              :windowWidth="windowWidth"
              @focusNode="(e: any) => (focusNode = e)" />
          </li>
        </ul>
      </template>

    </div>

    <!-- Zone Selection Modal -->
    <zoneSelect
      v-if="enableZoneMenu"
      :zoneList="zoneSelection"
      :windowWidth="windowWidth"
      @zoneSelected="changeZone"
      @closeMenu="(e: boolean) => (enableZoneMenu = e)" />

  </section>
</template>

<script lang="ts">
import toggleMenuBtn      from '../ui/buttons/toggleMenu.vue';
import searchBar          from '../ui/buttons/inputSearchBar.vue'; // fixed typo: seachBar → searchBar
import iconAndText        from '../ui/iconAndText.vue';
import zoneSelect         from '../layouts/zoneSelection.vue';
import gatheringList      from '../ui/overviewListItem/gathering.vue';
import sightseeingList    from '../ui/overviewListItem/sightseeing.vue';
import fatesList          from '../ui/overviewListItem/fates.vue';
import huntsList          from '../ui/overviewListItem/hunts.vue';
import aethercurrentList  from '../ui/overviewListItem/aethercurrents.vue';
import mapDisplay         from '../layouts/MapDisplay.vue';

// Ordered job keys — drives tab rendering order and auto-select priority
const JOB_KEYS = ['miner', 'botany', 'sightseeing', 'fates', 'eliteHunts', 'aethercurrents'] as const;
type JobKey = typeof JOB_KEYS[number];

// Aetherial result field names — extend here if data grows beyond result3
const AETHERIAL_RESULT_FIELDS = ['result1', 'result2', 'result3'] as const;

export default {
  name: 'EorzeaOverview',

  components: {
    toggleMenuBtn,
    searchBar,
    iconAndText,
    zoneSelect,
    gatheringList,
    sightseeingList,
    fatesList,
    huntsList,
    aethercurrentList,
    mapDisplay,
  },

  props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
  emits: ['changeTracked', 'openVistaImg'],

  data() {
    return {
      currentZone:     {} as any,
      zoneSelection:   {} as Record<string, Record<string, any[]>>,
      zoneNodes: {
        miner:          [] as any[],
        botany:         [] as any[],
        sightseeing:    [] as any[],
        fates:          [] as any[],
        eliteHunts:     [] as any[],
        aethercurrents: [] as any[],
      } as Record<JobKey, any[]>,
      tabSelected:      '' as string,
      focusNode:        null as any,
      enableZoneMenu:   false as boolean,
      enableSearchMenu: false as boolean,
      searchName:       '' as string,
      searchResults:    [] as any[],
    };
  },

  computed: {
    columnLayout(): number {
      const dims: Record<string, number> = {
        'desktop-large': 600,
        'desktop-small': 600,
        tablet:          500,
        mobile:          400,
      };
      // Fallback to 600 for unknown breakpoints
      return dims[this.windowWidth] ?? 600;
    },
  },

  created() {
    // TODO: Replace hardcoded index with a reliable default zone identifier
    // areas[7] is used intentionally as a known starting zone; the find() call
    // above it was dead code and has been removed.
    this.currentZone = this.ffxivData.areas[7];

    this.createZoneSelectionArray();
    this.fetchNodesInCurrentZone();
  },

  methods: {
    // ─── Zone Selection ───────────────────────────────────────────────────────

    createZoneSelectionArray() {
      // Only include areas flagged for overview
      const overviewAreas: any[] = this.ffxivData.areas.filter((o: any) => o.inoverview);

      // Build expansion → region → zones structure using Maps for O(1) dedup
      // instead of repeated findIndex O(n²) calls
      const expansionOrder: string[] = [];
      const byExpansion = new Map<string, Map<string, any[]>>();

      for (const area of overviewAreas) {
        const { expansion, region, zone } = area;

        if (!byExpansion.has(expansion)) {
          byExpansion.set(expansion, new Map());
          expansionOrder.push(expansion);
        }
        const regionMap = byExpansion.get(expansion)!;

        if (!regionMap.has(region)) {
          regionMap.set(region, []);
        }
        const zones = regionMap.get(region)!;

        // Deduplicate zones by zone name
        if (!zones.some((z) => z.zone === zone)) {
          zones.push(area);
        }
      }

      // Convert Maps back to the plain-object shape the zoneSelect component expects
      const finalList: Record<string, Record<string, any[]>> = {};
      for (const expansion of expansionOrder) {
        finalList[expansion] = {};
        for (const [region, zones] of byExpansion.get(expansion)!) {
          finalList[expansion][region] = zones;
        }
      }

      this.zoneSelection = finalList;
    },

    fetchNodesInCurrentZone() {
      const zone = this.currentZone.zone;

      this.zoneNodes.miner          = this.ffxivData.miner.filter((o: any) => o.area?.zone === zone);
      this.zoneNodes.botany         = this.ffxivData.botany.filter((o: any) => o.area?.zone === zone);
      this.zoneNodes.sightseeing    = this.ffxivData.sightseeing.filter((o: any) => o.zone === zone);
      this.zoneNodes.fates          = this.ffxivData.fates.filter((o: any) => o.zone === zone);
      this.zoneNodes.eliteHunts     = this.ffxivData.eliteHunts.filter((o: any) => o.zone === zone);
      this.zoneNodes.aethercurrents = this.ffxivData.aethercurrents.filter((o: any) => o.zone === zone);

      // Auto-select the first tab that has data, preserving JOB_KEYS order
      this.tabSelected = '';
      this.focusNode = null;
      for (const key of JOB_KEYS) {
        if (this.zoneNodes[key].length > 0) {
          this.tabSelected = key;
          this.focusNode   = this.zoneNodes[key][0];
          break;
        }
      }
    },

    selectTab(jobKey: string) {
      if (this.zoneNodes[jobKey]?.length === 0) return; // ignore disabled tabs
      this.tabSelected = jobKey;
      this.focusNode   = this.zoneNodes[jobKey][0];
    },

    changeZone(e: any) {
      this.currentZone = e;
      this.fetchNodesInCurrentZone(); // tabSelected reset happens inside
    },

    // ─── Search ───────────────────────────────────────────────────────────────

    filterByInputValue(e: any) {
      this.searchName = e;

      const query = (e ?? '').trim().toLowerCase();
      if (query.length <= 2) {
        this.searchResults = [];
        return;
      }

      const includes = (val: string | undefined) =>
        val ? val.toLowerCase().includes(query) : false;

      // Standard name-match filters
      const minerData      = this.ffxivData.miner.filter((o: any) => includes(o.name));
      const botanyData     = this.ffxivData.botany.filter((o: any) => includes(o.name));
      const sightseeingData = this.ffxivData.sightseeing.filter((o: any) => includes(o.name));
      const huntsData      = this.ffxivData.eliteHunts.filter((o: any) => includes(o.name));
      // Fixed precedence bug: original was `a && b || c && d` (&&  > ||),
      // meaning the fates condition wasn't bracketed correctly; now explicit.
      const fatesData      = this.ffxivData.fates.filter(
        (o: any) => includes(o.name) || includes(o.bossname),
      );

      // Aetherial secondary-result matches — extracted to a standalone method
      // to avoid re-declaring a closure on every keystroke
      const minerAetherialData  = this.findAetherialMatches(this.ffxivData.miner,  query);
      const botanyAetherialData = this.findAetherialMatches(this.ffxivData.botany, query);

      // Deduplicate: aetherial nodes whose *name* also matched would appear twice
      const nameMatchIds = new Set([
        ...minerData.map((o: any)  => o.ID),
        ...botanyData.map((o: any) => o.ID),
      ]);
      const uniqueAetherialMiner  = minerAetherialData.filter((o: any) => !nameMatchIds.has(o.ID));
      const uniqueAetherialBotany = botanyAetherialData.filter((o: any) => !nameMatchIds.has(o.ID));

      this.searchResults = [
        ...minerData,
        ...botanyData,
        ...uniqueAetherialMiner,
        ...uniqueAetherialBotany,
        ...sightseeingData,
        ...huntsData,
        ...fatesData,
      ];
    },

    findAetherialMatches(arr: any[], query: string): any[] {
      // Only examine aetherial-usage nodes; check all declared result fields
      return arr.filter((o: any) => {
        if (o.usage !== 'aetherial' || !o.usage_info) return false;
        return AETHERIAL_RESULT_FIELDS.some(
          (field) => o.usage_info[field]?.toLowerCase().includes(query),
        );
      });
    },
  },
};
</script>