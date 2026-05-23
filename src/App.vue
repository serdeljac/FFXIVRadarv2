<template>
  <Analytics />
  <div :class="[`app_container`, `menustate_${menuState}`]" :data-screenMode="windowWidth">
    
    <trackingBar 
      :class="[`tracking_bar_pos`]" 
      :windowWidth="windowWidth"
      :timerList="timerList"
      :weatherList="weatherList"
      :trackinglist="trackinglist"
      @openDetails="openDetails"
      @changeTracked="changeTracked"
      />

    <buttonMenu 
      :class="[`menu_Btn`, {'tracking_pos' : menuState == 'hidden-extended' || menuState == 'mobile-extended'}]" 
      @click="toggleMenu()"/>

    <sidebar 
      :class="[`sidebar_pos`]" 
      :menuState="menuState"
      :eorzeaClock="eorzeaClock" 
      @toggleClock="toggleClock"/>

    <main 
      :class="[`main_content`]" 
      @click="toggleForceMenu()">
        <promotionBanner />
        <router-view 
          :ffxivData="ffxivData"
          :windowWidth="windowWidth"
          :timerList="timerList"
          :weatherList="weatherList"
          @sendToDetails="(e: any) => detailsPanel = e"
          @changeTracked="changeTracked"/>
    </main>

    <detailspane 
      v-if="openDetailSidebar && (windowWidth != 'tablet' && windowWidth != 'mobile')" 
      :node="detailsPanel" 
      :ffxivData="ffxivData"
      :timerList="timerList"
      :weatherList="weatherList"
      @closeDetails="(e: any) => openDetailSidebar = e"/>
      
  </div>
</template>

<script lang="ts" setup>
import { Analytics } from '@vercel/analytics/vue';
</script>

<script lang="ts">
  //API's
  import EorzeaTime from 'eorzea-time';
  import EorzeaWeather from 'eorzea-weather';

  //Components
  import promotionBanner from './components/layouts/PromotionBanner.vue';
  import sidebar from './components/layouts/Sidebar.vue';
  import trackingBar from './components/layouts/TrackingBar.vue';
  import buttonMenu from './components/ui/ButtonMenu.vue';
  import detailspane from './components/layouts/DetailsPane.vue'

  //JSON Data
  import areaRaw from './assets/json/areas.json';
  import expansionsRaw from './assets/json/data_expansions.json';
  import miningRaw from './assets/json/nodes_miner.json';
  import botanyRaw from './assets/json/nodes_botany.json';
  import aetherialRaw from './assets/json/data_aetherial.json';
  import aetheryteRaw from './assets/json/nodes_aetheryte.json';
  import sightseeingRaw from './assets/json/nodes_sightseeing.json';
  import huntsEliteRaw from './assets/json/data_hunts.json'
  import huntsPointsRaw from './assets/json/nodes_huntpoints.json'
  import aetherCurrentRaw from './assets/json/nodes_aethercurrent.json';
  import fatesRaw from './assets/json/nodes_fates.json'
  import blueMageRaw from './assets/json/data_bluemage.json'
  import timerRaw from './assets/json/data_timer.json';
  

export default {
  name: 'App Root',
  components: {sidebar, trackingBar, buttonMenu, detailspane, promotionBanner}, 
  data() {
    return {
      windowWidth: '' as String,
      menuState: 'extended' as String,
      ffxivData: {
        areas: [] as any,
        miner: [] as any,
        botany: [] as any,
        aetheryte: [] as any,
        sightseeing: [] as any,
        eliteHunts: [] as any,
        aethercurrents: [] as any,
        fates: [] as any,
        bluemageData: [] as any,
        bluemageFilters: [] as any
      },
      eorzeaClock: {
        formatIs24Hour: true,
        formatTime24Hour: '' as String,
        formatTime12Hour: '' as String,
        errorFindClock: false,
        minutes: 0 as number,
      },
      goldSaucer: {
        minutes: '' as String,
        active: false as boolean,
      },
      timerList: [] as any,
      weatherList: {} as any,
      intervalTicks: 0 as number,
      detailsPanel: {} as any,
      trackinglist: [] as any,
      openDetailSidebar: false as boolean
    }
  },
  async created() {
    try {
      this.enabledWindowResizeResponse()
      this.setupInitialFFXIVData()
    } catch (error) {
      console.error('Error in setupInitialFFXIVData()', error);
    }
    
    this.enableClockIntervalCount()
    setInterval(() => {this.enableClockIntervalCount()}, 1000)
  },
  methods: {
      enabledWindowResizeResponse() {
        window.addEventListener('resize', this.enabledWindowResizeResponse);
        let curWidth: number = window.innerWidth;
        let desktopWidthLg: number = 1700;
        let desktopWidthSm: number = 1260;
        let tabletWidth: number = 800;

        if (curWidth >= desktopWidthLg) {
          this.windowWidth = 'desktop-large'
          this.menuState = 'extended';
        }
        else if (curWidth >= desktopWidthSm && curWidth < desktopWidthLg) {
          this.windowWidth = 'desktop-small'
          this.menuState = 'compact';
        }
        else if (curWidth >= tabletWidth && curWidth < desktopWidthSm) {
          this.windowWidth = 'tablet'
          this.menuState = 'hidden-extended';
        }
        else if (curWidth < tabletWidth) {
          this.windowWidth = 'mobile'
          this.menuState = 'hidden-extended';
        } 
        else {
          console.error('Cannot get Window Width!');
          this.windowWidth = 'desktop-large';
          this.menuState = 'extended';
        }
      },
      toggleMenu() {
        if (this.windowWidth == 'desktop-large') {
          this.menuState = this.menuState == 'extended' ? 'compact' : 'extended';
        }
        else if (this.windowWidth == 'desktop-small') {
          this.menuState = this.menuState == 'compact' ? 'overlay-extended' : 'compact';
        }
        else if (this.windowWidth == 'tablet') {
          this.menuState = this.menuState == 'hidden-extended' ? 'mobile-extended' : 'hidden-extended';
        }
        else if (this.windowWidth == 'mobile') {
          this.menuState = this.menuState == 'hidden-extended' ? 'mobile-extended' : 'hidden-extended';
        }
      },
      toggleForceMenu() {
        if (this.windowWidth == 'desktop-small') {
          this.menuState = 'compact'
        }
        else if (this.windowWidth == 'tablet' || this.windowWidth == 'mobile') {
          this.menuState = 'hidden-extended'
        }

      },
      toggleClock() {
        this.eorzeaClock.formatIs24Hour = !this.eorzeaClock.formatIs24Hour;
      },
      setupInitialFFXIVData() {
        // Run these once on web load
        this.setAreaData();
        this.ffxivData['expansion'] = expansionsRaw;
        this.setMiningAndBotanyData(miningRaw, 'miner');
        this.setMiningAndBotanyData(botanyRaw, 'botany');
        this.setAetheryteData();
        this.setSightseeingData();
        this.setEliteHuntsData();
        this.setAetherCurrentData();
        this.setFatesData();
        this.setBlueMageData();
        this.createWeatherList();
        this.setEorzeaClock();
        this.setGoldSaucerClockState();
        this.setTimerData();
        this.getTimerCountdown();
      },
      setAreaData() {
        for (const i in areaRaw) {
          let obj: any = areaRaw[i];
          obj.issubarea = obj.issubarea == 1 ? true : false;
          obj.inoverview = obj.inoverview == 1 ? true : false;
          obj.type = obj.type ? obj.type : false;
          obj.icon = expansionsRaw.find((o: any) => o.expansion == obj.expansion).icon;
        };
        this.ffxivData['areas'] = areaRaw;
      },
      createWeatherList() {
        const areaList = this.ffxivData.areas.filter((obj: any, index: any) => 
            index === this.ffxivData.areas.findIndex((o: any) => obj.mapcode === o.mapcode)
        );
        
        areaList.forEach((o: any) => {
          if (o.mapcode) {
            let x = EorzeaWeather.getWeather(o.mapcode, new Date());
            this.weatherList[o.mapcode] = x ? x : false;
          }
        });
      },
      setMiningAndBotanyData(arr: any, job: string) {
        for (const i in arr) {
          let obj: any = arr[i];
          obj.tracked = false;
          obj.time = obj.time ? obj.time : false;
          obj.isshard = obj.isshard == 1 ? true : false;
          obj.tomb = obj.tomb ? obj.tomb : false;
          obj.perception = obj.perception ? obj.perception : false;
          obj.attribute = obj.attribute ? obj.attribute : false;
          obj.usage = obj.usage ? obj.usage : 'crafting';
          obj.usage_info = getSpecificUsageData(obj);
          obj.area = getSpecificAreaData(obj.area, this.ffxivData.areas);
        };

        this.ffxivData[job] = arr;

        function getSpecificUsageData(arr: any) {
          if (arr.usage == 'customdelivery' || arr.usage == 'scripts') {
            return arr.usage_info;
          }
          else if (arr.usage == 'aetherial') {
            let r = aetherialRaw.find((o: any) => o.name == arr.name);
            return r;
          };
          return false;
        };

        function getSpecificAreaData(area: string, areas: any[]) {
          let results = areas.find((o: any) => o.area == area);
          if (!results) {results = areas.find((o: any) => o.point == area);}
          if (!results) {console.error(`Cannot find area in App.JS: ${area}`); return area;}
          return results;
        };
      },
      setAetheryteData() {
        for (const i in aetheryteRaw) {
          let obj: any = aetheryteRaw[i];
          obj.point = obj.point ? obj.point : false;
          obj.job = 'aetheryte';
          obj.job_sub = 'aetheryte';
          obj.area = this.ffxivData.areas.find((o: any) => o.zone == obj.zone);
        };

        this.ffxivData.aetheryte = aetheryteRaw;
      },
      setSightseeingData() {
        for (const i in sightseeingRaw) {
          let obj: any = sightseeingRaw[i];
          obj.job = 'sightseeing';
          obj.job_sub = 'sightseeing';
          obj.tracked = false;
          obj.point = obj.point ? obj.point : false;
          obj.type = obj.type ? obj.type : false;
          obj.weather1 = obj.weather1 ? obj.weather1 : false;
          obj.weather2 = obj.weather2 ? obj.weather2 : false;
          obj.time = obj.time ? obj.time : false;
          obj.mount = obj.mount === 0 ? false : true;
          obj.area = this.ffxivData.areas.find((o: any) => o.zone == obj.zone);
        };

        this.ffxivData.sightseeing = sightseeingRaw;
      },
      setEliteHuntsData() {
        for (const i in huntsEliteRaw) {
          let obj: any = huntsEliteRaw[i];
          obj.job = 'eliteHunts';
          obj.job_sub = obj.rank == 'SS' ? 'SS' : obj.rank.slice(0,1)
          obj.trigger = obj.trigger ? obj.trigger : false;
          obj.weather1 = obj.weather1 ? obj.weather1 : false;
          obj.weather2 = obj.weather2 ? obj.weather2 : false;
          obj.maintenance = obj.maintenance ? obj.maintenance : false;
          obj.rank = obj.rank == 'SS' ? 'SS' : obj.rank.slice(0,1)
          obj.area = this.ffxivData.areas.find((o: any) => o.zone == obj.zone);
          obj.points = getPointsData(obj.zone, obj.rank);
        }

        this.ffxivData.eliteHunts = huntsEliteRaw;

        function getPointsData(zone: string, rank: string) {
          let zonesArr = huntsPointsRaw.filter(o => o.zone == zone);
          let narrowPoints = zonesArr.filter(o => o.ranks.includes(rank));
          return narrowPoints;
        };
      },
      setAetherCurrentData() {
        for (const i in aetherCurrentRaw) {
          let obj: any = aetherCurrentRaw[i];
          obj.job = 'aethercurrents';
          obj.job_sub = obj.name ? 'currentquest' : 'current';
          obj.area = this.ffxivData.areas.find((o: any) => o.zone == obj.zone);
        };
        this.ffxivData.aethercurrents = aetherCurrentRaw;
      },
      setFatesData() {
        this.ffxivData.fates = fatesRaw
        for (const d in this.ffxivData.fates) {
          let obj = this.ffxivData.fates[d]
          this.ffxivData.fates[d].job = 'fates'
          this.ffxivData.fates[d].chain_set = obj.chain_set == '' ? false : obj.chain_set

          let myAreaData = this.ffxivData.areas.find(o => o.zone == obj.zone)
          this.ffxivData.fates[d].area = myAreaData
        }
      },
      setBlueMageData() {
        //Create Filters for page
        const typeList = blueMageRaw.filter((obj: any, index: any) => 
            index === blueMageRaw.findIndex((o: any) => obj.type1 === o.type1)
        );
        for (const d in typeList) {
            this.ffxivData.bluemageFilters[d] = ['type1', typeList[d].type1, false]
        }
        this.ffxivData.bluemageFilters.unshift(['type1', 'All', true])

        let blueMageNo = blueMageRaw[Object.keys(blueMageRaw)[blueMageRaw.length-1]].no
        let bmAbility = []
        for (let i=0; i<blueMageNo; i++)  {
            bmAbility = blueMageRaw.filter(o => o.no == (i + 1))

            this.ffxivData.bluemageData[i] = {
                'ID': bmAbility[0].no,
                'no': bmAbility[0].no,
                'name': bmAbility[0].name,
                'level': bmAbility[0].level,
                'stars': bmAbility[0].stars,
                'category': bmAbility.map(o => o.type1),
                'location': groupData(
                  bmAbility.map(o => o.type1), 
                  bmAbility.map(o => o.type2),
                  bmAbility.map(o => o),
                  true
                ),
                'npc': groupData(
                  bmAbility.map(o => o.type1),
                  bmAbility.map(o => o.type2),
                  bmAbility.map(o => o.npc)
                ),
                'notes':groupData(
                  bmAbility.map(o => o.type1),
                  bmAbility.map(o => o.type2),
                  bmAbility.map(o => o.notes)
                ),
            }

            function groupData(types: Array<string>[], typesSub: Array<string>[], dataList: any[], searchLocation?: boolean, ) {
              if (!types) {console.error('No Type assigned to BlueMage Data, check Data', dataList); return false}

              let results: Array<any> = []
              for (const d in types) {
                let hold: Array<any> = []
                hold[0] = types[d]
                hold[1] = typesSub[d] ? typesSub[d] : false

                if (!searchLocation) {
                  hold[2] = dataList[d]
                } else {
                  let correctX = dataList[d].x ? dataList[d].x : false
                  let correctY = dataList[d].y ? dataList[d].y : false
                  hold[2] = [dataList[d].location, correctX, correctY]
                }
                results.push(hold)
              }

              return results
            }
        }
      },
      setEorzeaClock() {
        let rawclock: string = new EorzeaTime().toString()

        if (!rawclock) {
          this.eorzeaClock.errorFindClock = true
          console.error(`Cannot find Eorzea Clock: ${rawclock}`)
        }

        let hr = Number(rawclock.slice(0, 2))
        let min = Number(rawclock.slice(3, 5))
        this.eorzeaClock.minutes = min + (hr * 60)
        this.eorzeaClock.formatTime24Hour = this.get24HourClock(hr, min)
        this.eorzeaClock.formatTime12Hour = this.get12HourClock(hr, min)
      },
      setGoldSaucerClockState() {
        const now = new Date();
        const curTime: number = (now.getMinutes() * 60) + now.getSeconds()
        let results: any = [true, 0]

        if (curTime >= 0 && curTime < 600) {
          results = [true, 600 - curTime]
        } else if (curTime >= 600 && curTime < 1200) {
          results = [false, 1200 - curTime]
        } else if (curTime >= 1200 && curTime < 1800) {
          results = [true, 1800 - curTime]
        } else if (curTime >= 1800 && curTime < 2400) {
          results = [false, 2400 - curTime]
        } else if (curTime >= 2400 && curTime < 3000) {
          results = [true, 3000 - curTime]
        } else if (curTime >= 3000 && curTime < 3600) {
          results = [false, 3600 - curTime]
        }
        
        this.goldSaucer.active = results[0]
        this.goldSaucer.minutes = results[1]
      },
      setTimerData() {
        for (const d in timerRaw) {
          let obj = timerRaw[d]
          let st: any = [obj.start0, obj.start1, obj.start2]
          let en: any = [obj.end0, obj.end1, obj.end2]
          let myTimerData = {
            "ID": obj.ID,
            "displayRanges12Hr": this.getRangeTimes(true, st, en),
            "displayRanges24Hr": this.getRangeTimes(false, st, en),
            "stateActive": false as boolean,
            "minutes": 0 as number,
            "countdown": '' as String,
          }
          this.timerList[d] = myTimerData
        }
      },
      getRangeTimes(format12Hr: boolean, s: any, e: any) {
        let dur: any = []
        for (const i in [0,1,2]) {
          if (s[i] != e[i]) {
            if (format12Hr) {
              let a: string = `${this.get12HourClock(s[i], 0)} - ${this.get12HourClock(e[i], 0)}`
              dur.push(a)
            } else {
              let a: string = `${this.get24HourClock(s[i], 0)} - ${this.get24HourClock(e[i], 0)}`
              dur.push(a)
            }
          }
        } 
        return dur
      },
      get12HourClock(hr: number, min: number) {
        let newhr: number, 
            newmin: string, 
            daytime: string
        
        newhr = hr > 12 ? hr - 12 : hr
        newhr = newhr == 0 ? 12 : newhr
        newmin = min < 10 ? `0${min}` : min.toString()
        daytime = hr >= 12 && hr < 24 ? 'PM' : 'AM'
        return `${newhr}:${newmin} ${daytime}`
      },
      get24HourClock(hr: number, min: number) {
        let newhr: string,
            newmin: string

        newhr = hr < 10 ? `0${hr}` : hr.toString()
        newmin = min < 10 ? `0${min}` : min.toString()
        return `${newhr}:${newmin}`
      },
      getTimerCountdown() {
        let currentMinutes = this.eorzeaClock.minutes

        for (const d in timerRaw) {
          let obj  = timerRaw[d]
          let startArr: any = [obj.start0 * 60, obj.start1 * 60, obj.start2 * 60]
          let endArr: any = [obj.end0 * 60, obj.end1 * 60, obj.end2 * 60]

          if (obj.sets == 1) {
            if (currentMinutes <= startArr[0]) {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = startArr[0] - currentMinutes
            } else if (currentMinutes > startArr[0] && currentMinutes <= endArr[0]) {
              this.timerList[d].stateActive = true
              this.timerList[d].minutes = endArr[0] - currentMinutes
            } else {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = (1440 - currentMinutes) + startArr[0]
            }
          }

          else if (obj.sets == 2) {
            if (currentMinutes <= startArr[0]) {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = startArr[0] - currentMinutes
            } else if (currentMinutes > startArr[0] && currentMinutes <= endArr[0]) {
              this.timerList[d].stateActive = true
              this.timerList[d].minutes = endArr[0] - currentMinutes
            } else if (currentMinutes > startArr[0] && currentMinutes <= startArr[1]) {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = startArr[1] - currentMinutes
            } else if (currentMinutes > startArr[1] && currentMinutes <= endArr[1]) {
              this.timerList[d].stateActive = true
              this.timerList[d].minutes = endArr[1] - currentMinutes
            } else {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = (1440 - currentMinutes) + startArr[0]
            }
          }

          else if (obj.sets == 3) {
            if (currentMinutes <= startArr[0]) {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = startArr[0] - currentMinutes
            } else if (currentMinutes > startArr[0] && currentMinutes <= endArr[0]) {
              this.timerList[d].stateActive = true
              this.timerList[d].minutes = endArr[0] - currentMinutes
            } else if (currentMinutes > startArr[0] && currentMinutes <= startArr[1]) {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = startArr[1] - currentMinutes
            } else if (currentMinutes > startArr[1] && currentMinutes <= endArr[1]) {
              this.timerList[d].stateActive = true
              this.timerList[d].minutes = endArr[1] - currentMinutes
            } else if (currentMinutes > startArr[1] && currentMinutes <= startArr[2]) {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = startArr[2] - currentMinutes
            } else if (currentMinutes > startArr[2] && currentMinutes <= endArr[2]) {
              this.timerList[d].stateActive = true
              this.timerList[d].minutes = endArr[2] - currentMinutes
            } else {
              this.timerList[d].stateActive = false
              this.timerList[d].minutes = (1440 - currentMinutes) + startArr[0]
            }
          }

          this.timerList[d].minutes = this.timerList[d].minutes * 3
          this.timerList[d].countdown = this.formatTimeRemaining(this.timerList[d].minutes)
        }
      },
      enableClockIntervalCount() {
        //Every 1 tick
        this.intervalTicks = this.intervalTicks >= 30 ? 0 : this.intervalTicks + 1
        this.setGoldSaucerClockState();
        for (const d in this.timerList) {
          this.timerList[d].minutes = this.timerList[d].minutes - 1
          if (this.timerList[d].minutes <= 0) {this.getTimerCountdown(); break;}
          this.timerList[d].countdown = this.formatTimeRemaining(this.timerList[d].minutes)
        }

        //Every 3 ticks
        if (this.intervalTicks % 3 == 0) {
          this.setEorzeaClock()
          this.intervalTicks = 0
        }

        //Update weather conditions
        if (this.eorzeaClock.minutes == 0 && this.eorzeaClock.minutes < 2) {this.createWeatherList()}
        if (this.eorzeaClock.minutes == 480 && this.eorzeaClock.minutes < 482) {this.createWeatherList()}
        if (this.eorzeaClock.minutes == 960 && this.eorzeaClock.minutes < 962) {this.createWeatherList()}

      },
      formatTimeRemaining(total: number) {
        let h = Math.floor(total / 3600);
        let m = Math.floor((total - (h * 3600)) / 60 );
        let s = Math.floor(total - ((h * 3600) + (m * 60)));
        if (h > 0) {return `${h}h ${m}m ${s}s`}
        else if (m > 0) {return `${m}m ${s}s`}
        return `${s}s`
      },
      changeTracked(e: any) {
        let node: any = this.ffxivData[e.job];

        //Change the node's tracking state
        let index = node.findIndex(o => o.ID == e.ID)
        node[index].tracked = !node[index].tracked

        //Add or remove node from the trackinglist array
        if (node[index].tracked) {
          this.trackinglist.push(node[index])
          this.openDetailSidebar = true
          this.detailsPanel = e
        } else {
          this.trackinglist = this.trackinglist.filter((o: any) => o.ID != e.ID)
          this.openDetailSidebar = false
        }

      },
      openDetails(e: any) {
        this.openDetailSidebar = true
        this.detailsPanel = e
      },
  }
}
</script>

<style scoped lang="scss">
  .app_container {
    display: flex;
    flex-wrap: wrap;

    &.menustate_extended {
      .tracking_bar_pos {padding-left: 1rem;}
      .sidebar_pos {width: $sidebarWidthExpand; left: 0;}
      .menu_Btn {left: $sidebarWidthExpand - 16px;}
      .main_content {
        width: calc(100% - #{$sidebarWidthExpand});
        margin-left: $sidebarWidthExpand;
      }
    }

    &.menustate_compact {
      .tracking_bar_pos {padding-left: 1rem;}
      .menu_Btn {left: $sidebarWidthCollapse - 16px;}
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      } 
    }

    &.menustate_overlay-extended {
      .tracking_bar_pos {padding-left: 1rem;}
      .sidebar_pos {width: $sidebarWidthExpand; left: 0;}
      .menu_Btn {left: $sidebarWidthExpand - 16px;}
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      } 
    }

    &.menustate_hidden-extended {
      .tracking_bar_pos {padding-left: 30px;}
      .sidebar_pos {left: -$sidebarWidthExpand + 1px;}
      .menu_Btn {left: 1.5rem;}
      .main_content {
        padding: 1rem 0.5rem;
        width: 100%;
        margin-left: 0;
      } 
    }

    &.menustate_mobile-extended {
      .tracking_bar_pos {padding-left: 30px;}
      .sidebar_pos {width: $sidebarWidthExpand;}
      .menu_Btn {left: 1.5rem;}
      .main_content {
        width: 100%;
        margin-left: 0;
      } 
    }
  }

  .tracking_bar_pos {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: $trackingbarHeight;
    z-index: 100;
  }

  .sidebar_pos {
    position: fixed;
    top: $trackingbarHeight;
    left: 0;
    height: calc(100dvh - $trackingbarHeight);
  }

  .menu_Btn {
    position: fixed;
    top: 100px;
    transition: all .23s ease;
    z-index: 101;
    width: 32px;
    height: 32px;
    &.tracking_pos {top: 17px}
  }

  main {
    padding: 1rem 1.5rem $paddingSize 1.5rem;
    min-height: 100vh;
    margin-top: $trackingbarHeight;
    margin-left: $sidebarWidthExpand;
  }

  .details_pos {
    position: fixed;
    right: -300px;
    top: $trackingbarHeight;
    height: calc(100vh - $trackingbarHeight);
    width: 300px;
    border-left: 1px solid $borderColor;
    transform: all .23s ease;
    &.show {right: 0}
  }
</style>