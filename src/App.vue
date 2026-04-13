<template>
  <div :class="[`app_container`, `menustate_${menuState}`]" :data-screenMode="windowWidth">
    <trackingBar 
      :class="[`tracking_bar_pos`]" 
      :windowWidth="windowWidth"
      :timerList="timerList"
      :trackinglist="trackinglist"
      @openDetails="(e) => detailsPanel = e"
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
        <router-view 
        :ffxivData="ffxivData"
        :windowWidth="windowWidth"
        :timerList="timerList"
        @sendToDetails="(e: any) => detailsPanel = e"
        @changeTracked="(e: any) => changeTracked(e)"/>
    </main>

    <aside 
      :class="[`details_pos`, {'show' : detailsPanel.length > 0}]">
      Details
    </aside>
  </div>
</template>

<script lang="ts">
  //API's
  import EorzeaTime from 'eorzea-time';
  import EorzeaWeather from 'eorzea-weather';

  //Components
  import sidebar from './components/layouts/Sidebar.vue';
  import trackingBar from './components/layouts/TrackingBar.vue';
  import buttonMenu from './components/ui/ButtonMenu.vue';

  //JSON Data
  import areaRaw from './assets/json/area.json';
  import expansionsRaw from './assets/json/data_expansions.json';
  import miningRaw from './assets/json/nodes_mining.json';
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
  components: {sidebar, trackingBar, buttonMenu}, 
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
      intervalTicks: 0 as number,
      detailsPanel: {} as any,
      trackinglist: [] as any,
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
        this.setAreaData()
        this.ffxivData['expansionData'] = expansionsRaw
        this.setMiningAndBotanyData(miningRaw)
        this.setMiningAndBotanyData(botanyRaw)
        this.setAetheryteData()
        this.setSightseeingData()
        this.setEliteHuntsData()
        this.setAetherCurrentData()
        this.setFatesData()
        this.setBlueMageData()

        this.setEorzeaClock()
        this.setGoldSaucerClockState()
        this.setTimerData()
        this.getTimerCountdown()
      },
      setAreaData() {
        this.ffxivData.areas = areaRaw
        for (const d in this.ffxivData.areas) {
          let obj = this.ffxivData.areas[d]
          let getIcon = expansionsRaw.find(o => o.expansion == obj.expansion).icon
          this.ffxivData.areas[d].isSubarea = obj.isSubarea == 'TRUE' ? true : false
          this.ffxivData.areas[d].inOverview = obj.inOverview == 'TRUE' ? true : false
          this.ffxivData.areas[d].weather = obj.mapcode ? EorzeaWeather.getWeather(obj.mapcode, new Date()) : false
          this.ffxivData.areas[d].icon = getIcon
        }
      },
      setMiningAndBotanyData(arr: any) {
        let type = arr[0].job
        this.ffxivData[type] = arr
        for (const d in this.ffxivData[type]) {
          let obj = this.ffxivData[type][d]
          
          this.ffxivData[type][d].tracked = false
          this.ffxivData[type][d].time = obj.time == '' ? false : obj.time

          let myAreaData = this.ffxivData.areas.find(o => o.area == obj.area)
          let myPointData = this.ffxivData.areas.find(o => o.point == obj.area)
          if (!myAreaData && !myPointData) {console.error(`Cannot find area in App.JS: ${this.ffxivData[type][d].ID}`, this.ffxivData[type][d].area)}
          this.ffxivData[type][d].area = myAreaData ? myAreaData : myPointData

          this.ffxivData[type][d].usage = obj.usage ? obj.usage : 'crafting'
          this.ffxivData[type][d].usage_info = obj.usage ? getSpecificUsageData(obj) : 'crafting'
        }

        function getSpecificUsageData(arr: any) {
          if (arr.usage == 'customdelivery' || arr.usage == 'scripts') {return arr.usage_info}
          else if (arr.usage == 'aetherial') {
            let r = aetherialRaw.find( o => o.name == arr.name)
            return r
          }
          return false
        }
      },
      setAetheryteData() {
        this.ffxivData.aetheryte = aetheryteRaw
        for (const d in this.ffxivData.aetheryte) {
          let obj = this.ffxivData.aetheryte[d]
          let myAreaData = this.ffxivData.areas.find(o => o.zone == obj.zone)
          this.ffxivData.aetheryte[d].area = myAreaData
        }
      },
      setSightseeingData() {
        this.ffxivData.sightseeing = sightseeingRaw
        for (const d in this.ffxivData.sightseeing) {
          let obj = this.ffxivData.sightseeing[d]

          this.ffxivData.sightseeing[d].job = 'sightseeing'
          this.ffxivData.sightseeing[d].job_sub = 'sightseeing'
          this.ffxivData.sightseeing[d].tracked = false
          this.ffxivData.sightseeing[d].time = obj.time == '' ? false : obj.time
          this.ffxivData.sightseeing[d].mount = obj.mount == 'TRUE' ? true : false

          let myAreaData = this.ffxivData.areas.find(o => o.zone == obj.zone)
          this.ffxivData.sightseeing[d].area = myAreaData
        }
      },
      setEliteHuntsData() {
        this.ffxivData.eliteHunts = huntsEliteRaw
        for (const d in this.ffxivData.eliteHunts) {
          let obj = this.ffxivData.eliteHunts[d]
          this.ffxivData.eliteHunts[d].job = 'hunts'
          this.ffxivData.eliteHunts[d].job_sub = 'hunts'
          this.ffxivData.eliteHunts[d].rank = obj.rank == 'SS' ? 'SS' : obj.rank.slice(0,1)

          let myAreaData = this.ffxivData.areas.find(o => o.area == obj.area)
          this.ffxivData.eliteHunts[d].area = myAreaData

          let myPointData = getPointsData(obj.zone, obj.rank)
          this.ffxivData.eliteHunts[d].points = myPointData
        }

        function getPointsData(zone: string, rank: string) {
          let zonesArr = huntsPointsRaw.filter(o => o.zone == zone)
          let results:any = []
          for (const i in zonesArr) {
            let r = zonesArr[i].ranks.includes(rank)
            if (r) {results.push(zonesArr[i])}}
          return results
        }
      },
      setAetherCurrentData() {
        this.ffxivData.aethercurrents = aetherCurrentRaw
        for (const d in this.ffxivData.aethercurrents) {
          let obj = this.ffxivData.aethercurrents[d]
          this.ffxivData.aethercurrents[d].job = 'aethercurrents'
          this.ffxivData.aethercurrents[d].job_sub = obj.name ? 'currentquest' : 'current'

          let myAreaData = this.ffxivData.areas.find(o => o.zone == obj.zone)
          this.ffxivData.aethercurrents[d].area = myAreaData
        }
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
        
        const typeList = blueMageRaw.filter((obj: any, index: any) => 
            index === blueMageRaw.findIndex((o: any) => obj.type1 === o.type1)
        );
        for (const d in typeList) {
            this.ffxivData.bluemageFilters[d] = ['type1', typeList[d].type1, false]
        }
        this.ffxivData.bluemageFilters.unshift(['type1', 'All', true])


        let areaData = this.ffxivData.areas
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
                'type': sortDataRows(bmAbility.map(o => o.type1), bmAbility.map(o => o.type2), false),
                'location': sortDataRows(bmAbility.map(o => o.type1), bmAbility.map(o => o.location), true, bmAbility.map(o => o.x), bmAbility.map(o => o.y)),
                'npc': sortDataRows(bmAbility.map(o => o.type1), bmAbility.map(o => o.npc), false),
                'notes':sortDataRows(bmAbility.map(o => o.type1), bmAbility.map(o => o.notes), false),
            }

            function sortDataRows(category: any, data: any, isLoc: boolean, x?: any, y?: any) {
                let results = []
                if (!isLoc) {
                  for (const i in category) {
                      results[i] = [category[i], data[i] ? data[i] : '-']
                  }
                } else {
                  let location = []
                  for (const i in category) {
                    let areaFound = areaData.find(o => o.zone == data[i])
                    location = areaFound ? {
                        'area': {
                            'zone': areaFound.zone,
                            'icon': areaFound.icon,
                            },
                        'x': x[i] ? x[i] : null,
                        'y': y[i] ? y[i] : null,
                    } : data[i]
                    results[i] = [category[i], location]
                  }
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
        if (this.eorzeaClock.minutes == 0 && this.eorzeaClock.minutes < 2) {this.getWeatherData()}
        if (this.eorzeaClock.minutes == 480 && this.eorzeaClock.minutes < 482) {this.getWeatherData()}
        if (this.eorzeaClock.minutes == 960 && this.eorzeaClock.minutes < 962) {this.getWeatherData()}

      },
      formatTimeRemaining(total: number) {
        let h = Math.floor(total / 3600);
        let m = Math.floor((total - (h * 3600)) / 60 );
        let s = Math.floor(total - ((h * 3600) + (m * 60)));
        if (h > 0) {return `${h}h ${m}m ${s}s`}
        else if (m > 0) {return `${m}m ${s}s`}
        return `${s}s`
      },
      getWeatherData() {
        this.ffxivData.areas.forEach((area: any) => {
          if (area.mapcode) {
            let x = EorzeaWeather.getWeather(area.mapcode, new Date());
            area.weather = x
          }
        });
      },
      changeTracked(e: any) {
        let index = this.ffxivData[e.job].findIndex(o => o.ID == e.ID)
        this.ffxivData[e.job][index].tracked = !this.ffxivData[e.job][index].tracked

        if (this.ffxivData[e.job][index].tracked) {
          this.trackinglist.push(this.ffxivData[e.job][index])
        } else {
          this.trackinglist = this.trackinglist.filter(o => o.ID != e.ID)
        }
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
    height: calc(100vh - $trackingbarHeight);
  }

  .menu_Btn {
    position: fixed;
    top: 100px;
    transition: all .23s ease;
    z-index: 101;
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