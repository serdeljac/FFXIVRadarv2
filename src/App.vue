<template>
  <div :class="[`app_container`, `menustate_${menuState}`]" :data-screenMode="windowWidth">
    <trackingBar :class="[`tracking_bar`]"/>
    <menuButton :class="[`menu_Btn`, {'tracking_pos' : menuState == 'hidden-extended' || menuState == 'mobile-extended'}]" @click="menuToggle()"/>
    <sidebar :class="[`sidebar`]" :menuState="menuState"/>
    <main :class="[`main_content`]">
      <router-view />
      {{ ffxivData }}
    </main>
  </div>
</template>

<script lang="ts">
  //API's
  // import EorzeaTime from 'eorzea-time';
  // import EorzeaWeather from 'eorzea-weather';

  //Components
  import sidebar from './components/layouts/Sidebar.vue';
  import trackingBar from './components/layouts/TrackingBar.vue';
  import menuButton from './components/ui/ButtonMenu.vue';

  //JSON Data
  import areaRaw from '../assets/json/area.json';
  import expansionsRaw from '../assets/json/data_expansions.json';
  import miningRaw from '../assets/json/nodes_mining.json';
  import botanyRaw from '../assets/json/nodes_botany.json';
  // import aetheryteRaw from '../assets/json/nodes_aetheryte.json';
  // import aetherCurrentRaw from '../assets/json/nodes_aethercurrent.json';
  // import sightseeingRaw from '../assets/json/nodes_sightseeing.json';
  // import huntsElite from '../assets/json/data_hunts.json'
  // import fatesRaw from '../assets/json/nodes_fates.json'
  // import blueMageRaw from '../assets/json/data_bluemage.json'
  // import timerRaw from '../assets/json/data_timer.json';
  import aetherialRaw from '../assets/json/data_aetherial.json';
  // import huntsPointsRaw from '../assets/json/nodes_huntpoints.json'

export default {
  name: 'App Root',
  components: {sidebar, trackingBar, menuButton},
  data() {
    return {
      windowWidth: '' as String,
      menuState: 'extended' as String,
      ffxivData: {},
    }
  },
  created() {
    this.enabledWindowResizeResponse()
    this.setupInitialFFXIVData()
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
      menuToggle() {
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
      setupInitialFFXIVData() {
        this.setAreaData()
        this.ffxivData['expansionData'] = expansionsRaw
        this.setMiningAndBotanyData(miningRaw)
        this.setMiningAndBotanyData(botanyRaw)
      },

      setAreaData() {
        this.ffxivData['areaData'] = areaRaw
        for (const d in this.ffxivData['areaData']) {
          this.ffxivData['areaData'][d]['isSubarea'] =  areaRaw[d]['isSubarea'] == 'TRUE' ? true : false
          this.ffxivData['areaData'][d]['inOverview'] =  areaRaw[d]['inOverview'] == 'TRUE' ? true : false
          this.ffxivData['areaData'][d]['weather'] = ''
        }
      },
      setMiningAndBotanyData(arr: any) {
        let type = arr[0].type  
        this.ffxivData[type] = arr
        for (const d in arr) {
          this.ffxivData[type][d].time = arr[d].time == '' ? false : arr[d].time
          this.ffxivData[type][d].usage = this.getUsageData(arr[d].usage, arr[d].info, arr[d].name)
          this.ffxivData[type][d].area = this.getAreaData(arr[d].area)
          this.ffxivData[type][d].tracked = false
        }
      },
      getUsageData(usage: string, info: string, name: string) {
        if (!usage) {return false}

        let r = {
          'usage': usage,
          'info': usage != 'aetherial' ? info : name,
          'details': usage == 'aetherial' ? getMaterials(name) : []
        }

        function getMaterials(name: string) {
          let r = aetherialRaw.find( o => o.name == name)
          return [r.result1, r.result2, r.result3]
        }

        return r
      },
      getAreaData(name: string) {
        let r: any
        r = areaRaw.find(o => o.zone == name || o.area == name || o.point == name)
        if (!r) {return console.error(`Cannot find area: ${name}`)}
        r.icon = expansionsRaw.find(o => o.expansion == r.expansion).icon
        return r
      },
  }
}
</script>

<style scoped lang="scss">
  .app_container {
    display: flex;
    flex-wrap: wrap;

    &.menustate_extended {
      .tracking_bar {padding-left: 1rem;}
      .sidebar {width: $sidebarWidthExpand; left: 0;}
      .menu_Btn {left: $sidebarWidthExpand - 16px;}
      .main_content {
        width: calc(100% - #{$sidebarWidthExpand});
        margin-left: $sidebarWidthExpand;
      }
    }

    &.menustate_compact {
      .tracking_bar {padding-left: 1rem;}
      .menu_Btn {left: $sidebarWidthCollapse - 16px;}
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      } 
    }

    &.menustate_overlay-extended {
      .tracking_bar {padding-left: 1rem;}
      .sidebar {width: $sidebarWidthExpand; left: 0;}
      .menu_Btn {left: $sidebarWidthExpand - 16px;}
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      } 
    }

    &.menustate_hidden-extended {
      .tracking_bar {padding-left: 30px;}
      .sidebar {left: -$sidebarWidthExpand + 1px;}
      .menu_Btn {left: 1.5rem;}
      .main_content {
        width: 100%;
        margin-left: 0;
      } 
    }

    &.menustate_mobile-extended {
      .tracking_bar {padding-left: 30px;}
      .sidebar {width: $sidebarWidthExpand;}
      .menu_Btn {left: 1.5rem;}
      .main_content {
        width: 100%;
        margin-left: 0;
      } 
    }
  }

  .tracking_bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: $trackingbarHeight;
    z-index: 100;
  }

  .sidebar {
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
    padding: 1rem $paddingSize $paddingSize 2rem;
    min-height: 100vh;
    margin-top: $trackingbarHeight;
    margin-left: $sidebarWidthExpand;
  }
</style>