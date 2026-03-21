<template>
  <div :class="[`app_container`, `menustate_${menuState}`]" :data-screenMode="windowWidth">
    <trackingBar :class="[`tracking_bar`]"/>
    <menuButton :class="[`menu_Btn`, {'tracking_pos' : menuState == 'hidden-extended' || menuState == 'mobile-extended'}]" @click="menuToggle()"/>
    <sidebar :class="[`sidebar`]" :menuState="menuState"/>
    <main :class="[`main_content`]">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import sidebar from './components/layouts/Sidebar.vue';
import trackingBar from './components/layouts/TrackingBar.vue';
import menuButton from './components/ui/ButtonMenu.vue';

export default {
  name: 'Root',
  components: {
    sidebar,
    trackingBar,
    menuButton
  },
  data() {
    return {
      windowWidth: '' as String,
      menuState: 'extended' as String,
    }
  },
  created() {
    this.enabledWindowResizeResponse()
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
      }
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