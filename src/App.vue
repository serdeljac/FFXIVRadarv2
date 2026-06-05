<template>
  <Analytics />
  <div :class="[`app_container`, `menustate_${sidebarLayout}`, windowWidth]">
    <starCanvas />

    <trackingBar
      :class="[`trackingbar`, sidebarLayout, windowWidth]"
      :windowWidth="windowWidth"
      :timerList="timerList"
      :weatherList="weatherList"
      :trackinglist="trackinglist"
      @openDetails="openDetails"
      @changeTracked="changeTracked" />

    <buttonMenu
      :class="[`menu_Btn`, { tracking_pos: sidebarLayout === 'hidden-extended' || sidebarLayout === 'mobile-extended' }]"
      @click="toggleMenu" />

    <sidebar
      :class="[`sidebar`, sidebarLayout, windowWidth]"
      :sidebarLayout="sidebarLayout"
      :eorzeaClock="eorzeaClock" />

    <main :class="[`main_content`]" @click="toggleForceMenu">
      <promotionBanner />
      <Transition name="fade" mode="out-in">
      <router-view
        :key="$route.path"
        :ffxivData="ffxivData"
        :windowWidth="windowWidth"
        :timerList="timerList"
        :weatherList="weatherList"
        :eorzeaClock="eorzeaClock"

        @openVistaImg="(e: any) => openVistaImg(e)"
        @openDetails="openDetails"
        @changeTracked="changeTracked" />
    </Transition>
    </main>

    <detailspane
      v-if="openDetailSidebar && windowWidth !== 'tablet' && windowWidth !== 'mobile'"
      :node="detailsPanel"
      :ffxivData="ffxivData"
      :timerList="timerList"
      :weatherList="weatherList"
      @openDetails="openDetails" 
      @openVistaImg="openVistaImg"/>

    <vistaLarge 
      v-if="openVistaImgDisplay"
      @click="openVistaImg(vistaImg)"
      :node="vistaImg"/>

  </div>
</template>

<script lang="ts">
// APIs
import EorzeaTime from 'eorzea-time';
import EorzeaWeather from 'eorzea-weather';
import { Analytics } from '@vercel/analytics/vue';

// Components
import promotionBanner from './components/layouts/PromotionBanner.vue';
import sidebar from './components/layouts/Sidebar.vue';
import trackingBar from './components/layouts/TrackingBar.vue';
import buttonMenu from './components/ui/buttons/toggleSidebarMenu.vue';
import detailspane from './components/layouts/DetailsPane.vue';
import vistaLarge from './components/layouts/ExpandVistaImg.vue'
import starCanvas from './components/ui/starCanvas.vue'

// JSON Data
import areaRaw from './assets/json/areas.json';
import expansionsRaw from './assets/json/data_expansions.json';
import miningRaw from './assets/json/nodes_miner.json';
import botanyRaw from './assets/json/nodes_botany.json';
import aetherialRaw from './assets/json/data_aetherial.json';
import aetheryteRaw from './assets/json/nodes_aetheryte.json';
import sightseeingRaw from './assets/json/nodes_sightseeing.json';
import huntsEliteRaw from './assets/json/data_hunts.json';
import huntsPointsRaw from './assets/json/nodes_huntpoints.json';
import aetherCurrentRaw from './assets/json/nodes_aethercurrent.json';
import fatesRaw from './assets/json/nodes_fates.json';
import blueMageRaw from './assets/json/data_bluemage.json';
import timerRaw from './assets/json/data_timer.json';

// Gold Saucer repeats every 20 real-time minutes (1200 seconds).
// Active windows: [0–600), [1200–1800), [2400–3000)
const GS_CYCLE = 1200; // seconds
const GS_ACTIVE_WINDOW = 600; // seconds active per cycle

// Eorzea weather changes at Eorzea-minute 0, 480, and 960
const WEATHER_CHANGE_EORZEA_MINUTES = [0, 480, 960] as const;

export default {
  name: 'AppRoot',

  components: { sidebar, trackingBar, buttonMenu, detailspane, promotionBanner, vistaLarge, starCanvas },

  data() {
    return {
      windowWidth: '' as string,
      sidebarLayout: 'extended' as string,
      ffxivData: {
        areas: [] as any[],
        miner: [] as any[],
        botany: [] as any[],
        aetheryte: [] as any[],
        sightseeing: [] as any[],
        eliteHunts: [] as any[],
        aethercurrents: [] as any[],
        fates: [] as any[],
        bluemageData: [] as any[],
        bluemageFilters: [] as any[],
        expansion: [] as any[],
      },
      eorzeaClock: {
        display24Hr: 0 as number,
        display12Hr: 0 as number,
        displayMin: 0 as number,
        totalMin: 0 as number,
      },
      goldSaucer: {
        seconds: 0 as number,
        active: false as boolean,
      },
      intervalTicks: 0 as number,
      timerList: [] as any[],
      weatherList: {} as Record<string, any>,
      
      detailsPanel: {} as any,
      openDetailSidebar: false as boolean,

      vistaImg: [] as any,
      openVistaImgDisplay: false as boolean,

      trackinglist: [] as any[],
      _clockInterval: null as ReturnType<typeof setInterval> | null,
      _resizeHandler: null as (() => void) | null,
    };
  },

  created() {
    // Bind resize handler once so the same reference can be removed on unmount
    this._resizeHandler = this.onWindowResize.bind(this);
    window.addEventListener('resize', this._resizeHandler);
    this.onWindowResize();

    this.setupInitialFFXIVData();

    this._clockInterval = setInterval(() => {
      this.onClockTick();
    }, 1000);
  },

  unmounted() {
    // Clean up to prevent memory / listener leaks
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    if (this._clockInterval !== null) {
      clearInterval(this._clockInterval);
    }
  },

  methods: {
    // ─── Window & Layout ──────────────────────────────────────────────────────

    onWindowResize() {
      const w = window.innerWidth;
      if (w >= 1700) {
        this.windowWidth = 'desktop-large';
        this.sidebarLayout = 'extended';
      } else if (w >= 1260) {
        this.windowWidth = 'desktop-small';
        this.sidebarLayout = 'compact';
      } else if (w >= 800) {
        this.windowWidth = 'tablet';
        this.sidebarLayout = 'hidden-extended';
      } else {
        this.windowWidth = 'mobile';
        this.sidebarLayout = 'hidden-extended';
      }
    },

    toggleMenu() {
      const transitions: Record<string, [string, string]> = {
        'desktop-large': ['extended', 'compact'],
        'desktop-small': ['compact', 'overlay-extended'],
        tablet:          ['hidden-extended', 'mobile-extended'],
        mobile:          ['hidden-extended', 'mobile-extended'],
      };
      const pair = transitions[this.windowWidth as string];
      if (pair) {
        this.sidebarLayout = this.sidebarLayout === pair[0] ? pair[1] : pair[0];
      }
    },

    toggleForceMenu() {
      const collapseMap: Record<string, string> = {
        'desktop-small': 'compact',
        tablet:          'hidden-extended',
        mobile:          'hidden-extended',
      };
      const target = collapseMap[this.windowWidth as string];
      if (target) this.sidebarLayout = target;
    },

    // ─── Initial Data Setup ───────────────────────────────────────────────────

    setupInitialFFXIVData() {
      this.setAreaData();
      this.ffxivData.expansion = expansionsRaw as any[];
      this.setMiningAndBotanyData(miningRaw, 'miner');
      this.setMiningAndBotanyData(botanyRaw, 'botany');
      this.setAetheryteData();
      this.setSightseeingData();
      this.setEliteHuntsData();
      this.setAetherCurrentData();
      this.setFatesData();
      this.setBlueMageData();
      // Clock must be set before timers so totalMin is available
      this.setEorzeaClock();
      this.createWeatherList();
      this.setGoldSaucerState();
      this.setTimerData(); // builds list + calculates initial countdown
    },

    setAreaData() {
      const areas = (areaRaw as any[]).map((obj) => ({
        ...obj,
        issubarea: obj.issubarea === 1,
        inoverview: obj.inoverview === 1,
        type: obj.type || false,
        icon: (expansionsRaw as any[]).find((e) => e.expansion === obj.expansion)?.icon,
      }));
      this.ffxivData.areas = areas;
    },

    createWeatherList() {
      // Use a Set for O(1) dedup instead of findIndex O(n²)
      const seen = new Set<string>();
      for (const area of this.ffxivData.areas) {
        if (!area.mapcode || seen.has(area.mapcode)) continue;
        seen.add(area.mapcode);
        this.weatherList[area.mapcode] = EorzeaWeather.getWeather(area.mapcode, new Date()) || false;
      }
    },

    setMiningAndBotanyData(arr: any[], job: string) {
      const areas = this.ffxivData.areas;

      const getUsageInfo = (obj: any): any => {
        if (obj.usage === 'customdelivery' || obj.usage === 'scripts') return obj.usage_info;
        if (obj.usage === 'aetherial') return (aetherialRaw as any[]).find((o) => o.name === obj.name);
        return false;
      };

      const getAreaData = (areaName: string): any => {
        const result =
          areas.find((o) => o.area === areaName) ??
          areas.find((o) => o.point === areaName);
        if (!result) console.error(`Cannot find area in setMiningAndBotanyData: ${areaName}`);
        return result ?? areaName;
      };

      const processed = (arr as any[]).map((obj) => ({
        ...obj,
        tracked: false,
        time: obj.time || false,
        isshard: obj.isshard === 1,
        tomb: obj.tomb || false,
        perception: obj.perception || false,
        attribute: obj.attribute || false,
        usage: obj.usage || 'crafting',
        usage_info: getUsageInfo(obj),
        area: getAreaData(obj.area),
      }));

      (this.ffxivData as any)[job] = processed;
    },

    setAetheryteData() {
      this.ffxivData.aetheryte = (aetheryteRaw as any[]).map((obj) => ({
        ...obj,
        point: obj.point || false,
        job: 'aetheryte',
        job_sub: 'aetheryte',
        area: this.ffxivData.areas.find((o) => o.zone === obj.zone),
      }));
    },

    setSightseeingData() {
      this.ffxivData.sightseeing = (sightseeingRaw as any[]).map((obj) => ({
        ...obj,
        job: 'sightseeing',
        job_sub: 'sightseeing',
        tracked: false,
        point: obj.point || false,
        type: obj.type || false,
        weather1: obj.weather1 || false,
        weather2: obj.weather2 || false,
        time: obj.time || false,
        mount: obj.mount !== 0,
        area: this.ffxivData.areas.find((o) => o.zone === obj.zone),
      }));
    },

    setEliteHuntsData() {
      const getPointsData = (zone: string, rank: string): any[] =>
        (huntsPointsRaw as any[]).filter((o) => o.zone === zone && o.ranks.includes(rank));

      this.ffxivData.eliteHunts = (huntsEliteRaw as any[]).map((obj) => {
        const rankShort = obj.rank === 'SS' ? 'SS' : obj.rank.slice(0, 1);
        return {
          ...obj,
          job: 'eliteHunts',
          job_sub: rankShort,
          rank: rankShort,
          trigger: obj.trigger || false,
          weather1: obj.weather1 || false,
          weather2: obj.weather2 || false,
          maintenance: obj.maintenance || false,
          area: this.ffxivData.areas.find((o) => o.zone === obj.zone),
          points: getPointsData(obj.zone, rankShort),
        };
      });
    },

    setAetherCurrentData() {
      this.ffxivData.aethercurrents = (aetherCurrentRaw as any[]).map((obj) => ({
        ...obj,
        job: 'aethercurrents',
        job_sub: obj.name ? 'currentquest' : 'current',
        area: this.ffxivData.areas.find((o) => o.zone === obj.zone),
      }));
    },

    setFatesData() {
      this.ffxivData.fates = (fatesRaw as any[]).map((obj) => ({
        ...obj,
        job: 'fates',
        chain_set: obj.chain_set || false,
        area: this.ffxivData.areas.find((o) => o.zone === obj.zone),
      }));
    },

    setBlueMageData() {
      // Build type-filter list (unique type1 values)
      const seenTypes = new Set<string>();
      const filters: any[] = [['type1', 'All', true]];
      for (const entry of blueMageRaw as any[]) {
        if (!seenTypes.has(entry.type1)) {
          seenTypes.add(entry.type1);
          filters.push(['type1', entry.type1, false]);
        }
      }
      this.ffxivData.bluemageFilters = filters;

      // Use array length directly — no fragile Object.keys trick
      const maxNo: number = (blueMageRaw as any[])[blueMageRaw.length - 1].no;

      const groupData = (
        types: string[],
        typesSub: string[],
        dataList: any[],
        searchLocation = false,
      ): any[] =>
        types.map((type, i) => {
          const base: any[] = [type, typesSub[i] || false];
          if (!searchLocation) {
            base.push(dataList[i]);
          } else {
            const d = dataList[i];
            base.push([d.location, d.x || false, d.y || false]);
          }
          return base;
        });

      this.ffxivData.bluemageData = [];
      for (let no = 1; no <= maxNo; no++) {
        const abilities = (blueMageRaw as any[]).filter((o) => o.no === no);
        const types    = abilities.map((o) => o.type1);
        const typesSub = abilities.map((o) => o.type2);

        this.ffxivData.bluemageData.push({
          ID:       abilities[0].no,
          no:       abilities[0].no,
          name:     abilities[0].name,
          level:    abilities[0].level,
          stars:    abilities[0].stars,
          category: types,
          location: groupData(types, typesSub, abilities, true),
          npc:      groupData(types, typesSub, abilities.map((o) => o.npc)),
          notes:    groupData(types, typesSub, abilities.map((o) => o.notes)),
        });
      }
    },

    // ─── Eorzea Clock ─────────────────────────────────────────────────────────

    setEorzeaClock() {
      const raw: string = new EorzeaTime().toString();
      if (!raw) {
        console.error('Cannot fetch Eorzea Time');
        Object.assign(this.eorzeaClock, { display24Hr: 0, display12Hr: 0, displayMin: 0, totalMin: 0 });
        return;
      }
      const h24 = Number(raw.slice(0, 2));
      const min = Number(raw.slice(3, 5));
      this.eorzeaClock.display24Hr = h24;
      this.eorzeaClock.display12Hr = h24 > 12 ? h24 - 12 : h24;
      this.eorzeaClock.displayMin  = min;
      this.eorzeaClock.totalMin    = h24 * 60 + min;
    },

    // ─── Gold Saucer ──────────────────────────────────────────────────────────

    setGoldSaucerState() {
      const now = new Date();
      const elapsed = now.getMinutes() * 60 + now.getSeconds();
      // Within each 20-min cycle, active = first 10 min, inactive = second 10 min
      const posInCycle = elapsed % GS_CYCLE;
      this.goldSaucer.active  = posInCycle < GS_ACTIVE_WINDOW;
      this.goldSaucer.seconds = GS_ACTIVE_WINDOW - (posInCycle % GS_ACTIVE_WINDOW);
    },

    // ─── Timers ───────────────────────────────────────────────────────────────

    setTimerData() {
      this.timerList = (timerRaw as any[]).map((obj) => ({
        ID:               obj.ID,
        displayRanges12Hr: this.buildRangeStrings(true,  [obj.start0, obj.start1, obj.start2], [obj.end0, obj.end1, obj.end2]),
        displayRanges24Hr: this.buildRangeStrings(false, [obj.start0, obj.start1, obj.start2], [obj.end0, obj.end1, obj.end2]),
        stateActive: false as boolean,
        seconds:     0 as number,   // renamed from `minutes` — unit is seconds
        countdown:   '' as string,
      }));
      this.recalcTimerCountdowns();
    },

    buildRangeStrings(use12Hr: boolean, starts: number[], ends: number[]): string[] {
      const fmt = use12Hr ? this.fmt12Hr : this.fmt24Hr;
      return starts
        .map((s, i) => (s !== ends[i] ? `${fmt(s, 0)} - ${fmt(ends[i], 0)}` : null))
        .filter(Boolean) as string[];
    },

    fmt12Hr(hr: number, min: number): string {
      const h   = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
      const m   = min < 10 ? `0${min}` : `${min}`;
      const ampm = hr >= 12 && hr < 24 ? 'PM' : 'AM';
      return `${h}:${m} ${ampm}`;
    },

    fmt24Hr(hr: number, min: number): string {
      return `${hr < 10 ? '0' : ''}${hr}:${min < 10 ? '0' : ''}${min}`;
    },

    recalcTimerCountdowns() {
      const curMin = this.eorzeaClock.totalMin;

      (timerRaw as any[]).forEach((obj, d) => {
        const starts = [obj.start0 * 60, obj.start1 * 60, obj.start2 * 60];
        const ends   = [obj.end0   * 60, obj.end1   * 60, obj.end2   * 60];
        const sets   = obj.sets as number;

        let active = false;
        let minsUntil = 0;

        // Build ordered [start, end] windows for this timer (up to `sets` windows)
        const windows = Array.from({ length: sets }, (_, i) => [starts[i], ends[i]]);

        // Find which window the current time falls in
        let resolved = false;
        for (const [s, e] of windows) {
          if (curMin <= s) {
            // Before this window starts
            active    = false;
            minsUntil = s - curMin;
            resolved  = true;
            break;
          }
          if (curMin > s && curMin <= e) {
            // Inside this window
            active    = true;
            minsUntil = e - curMin;
            resolved  = true;
            break;
          }
        }

        if (!resolved) {
          // Past all windows — wrap to next Eorzea day
          active    = false;
          minsUntil = (1440 - curMin) + starts[0];
        }

        // Eorzea minutes → real-time seconds (1 Eorzea min ≈ 3 real seconds)
        const seconds = minsUntil * 3;

        this.timerList[d].stateActive = active;
        this.timerList[d].seconds     = seconds;
        this.timerList[d].countdown   = this.formatDuration(seconds);
      });
    },

    // ─── Clock Tick (1 s interval) ────────────────────────────────────────────

    onClockTick() {
      this.intervalTicks = this.intervalTicks >= 30 ? 0 : this.intervalTicks + 1;

      // Update Gold Saucer every tick
      this.setGoldSaucerState();

      // Decrement timer countdowns; recalc when any expires
      let needsRecalc = false;
      for (const entry of this.timerList) {
        entry.seconds -= 1;
        if (entry.seconds <= 0) {
          needsRecalc = true;
          break;
        }
        entry.countdown = this.formatDuration(entry.seconds);
      }
      if (needsRecalc) this.recalcTimerCountdowns();

      // Update Eorzea clock every 3 ticks (~3 s = 1 Eorzea minute)
      if (this.intervalTicks % 3 === 0) {
        this.setEorzeaClock();
      }

      // Refresh weather at each of the three daily Eorzea weather-change points
      // Using a 2-minute tolerance window to handle slight tick drift
      for (const boundary of WEATHER_CHANGE_EORZEA_MINUTES) {
        if (this.eorzeaClock.totalMin >= boundary && this.eorzeaClock.totalMin < boundary + 2) {
          this.createWeatherList();
          break;
        }
      }
    },

    // ─── Utilities ────────────────────────────────────────────────────────────

    formatDuration(totalSeconds: number): string {
      const s = Math.max(0, Math.floor(totalSeconds));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) return `${h}h ${m}m ${sec}s`;
      if (m > 0) return `${m}m ${sec}s`;
      return `${sec}s`;
    },

    // ─── Tracking & Details ───────────────────────────────────────────────────

    changeTracked(e: { job: string; ID: number }) {
      const nodes: any[] | undefined = (this.ffxivData as any)[e.job];
      if (!nodes) {
        console.error(`changeTracked: unknown job "${e.job}"`);
        return;
      }
      const index = nodes.findIndex((o) => o.ID === e.ID);
      if (index === -1) return;

      nodes[index].tracked = !nodes[index].tracked;

      if (nodes[index].tracked) {
        this.trackinglist.push(nodes[index]);
      } else {
        this.trackinglist = this.trackinglist.filter((o: any) => o.ID !== e.ID);
      }
    },

    openDetails(e: any) {
      if (this.detailsPanel.ID == e.ID) {
        this.openDetailSidebar = false;
        this.detailsPanel = []; 
      } else {
        this.openDetailSidebar = true
        this.detailsPanel = e;
      }
    },

    openVistaImg(e: any) {
      if (this.vistaImg.ID == e.ID) {
        this.vistaImg = []
        this.openVistaImgDisplay = false
      } else {
        this.vistaImg = e
        this.openVistaImgDisplay = true
      }
    }
  },
};
</script>

<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

  .app_container {
    display: flex;
    flex-wrap: wrap;

    // Extended — full-width sidebar
    &.menustate_extended {
      .trackingbar { padding-left: 1rem; }
      .sidebar     { width: $sidebarWidthExpand; left: 0; }
      .menu_Btn    { left: calc(#{$sidebarWidthExpand} - 16px); }
      .main_content {
        width: calc(100% - #{$sidebarWidthExpand});
        margin-left: $sidebarWidthExpand;
      }
    }

    // Compact — collapsed sidebar
    &.menustate_compact {
      .trackingbar { padding-left: 1rem; }
      .menu_Btn    { left: calc(#{$sidebarWidthCollapse} - 16px); }
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      }
    }

    // Overlay-extended — sidebar floats over compact layout
    &.menustate_overlay-extended {
      .trackingbar { padding-left: 1rem; }
      .sidebar     { width: $sidebarWidthExpand; left: 0; }
      .menu_Btn    { left: calc(#{$sidebarWidthExpand} - 16px); }
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      }
    }

    // Hidden-extended — sidebar off-screen, button at edge
    &.menustate_hidden-extended {
      .trackingbar { padding-left: 30px; }
      .sidebar     { left: calc(-#{$sidebarWidthExpand} + 1px); }
      .menu_Btn    { left: 1.5rem; }
      .main_content {
        width: 100%;
        margin-left: 0;
      }
    }

    // Mobile-extended — sidebar visible, overlaid on full-width content
    &.menustate_mobile-extended {
      .trackingbar { padding-left: 30px; }
      .sidebar     { width: $sidebarWidthExpand; }
      .menu_Btn    { left: 1.5rem; }
      .main_content {
        width: 100%;
        margin-left: 0;
      }
    }
  }

  .menu_Btn {
    position: fixed;
    top: 100px;
    transition: left 0.23s ease;
    z-index: 9999;
    width: 32px;
    height: 32px;

    &.tracking_pos { top: 17px; }
  }

  main {
    padding: 1rem 1.5rem $paddingSize 1.5rem;
    margin-top: $trackingbarHeight;
    margin-left: $sidebarWidthExpand;
    position: relative;
    z-index: 2;
  }

  // Note: .details_pos was dead code — detailspane position is controlled
  // by the component itself, not by an app-level class.
</style>