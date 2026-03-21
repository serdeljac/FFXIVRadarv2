<template>
  <div :class="[`app_container`, `menuState_${menuState}`]" :data-screenMode="windowWidth">
    <trackingBar :class="[`tracking_bar`]"/>
    <menuButton :class="[`menu_Btn`, windowWidth]" @click="menuToggle()"/>

    <sidebar :class="[`sidebar`]" :windowWidth="windowWidth" :menuState="menuState"/>
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
          this.menuState = this.menuState == 'hidden-extended' ? 'overlay-extended' : 'hidden-extended';
        }
        else if (this.windowWidth == 'mobile') {
          this.menuState = this.menuState == 'hidden-extended' ? 'overlay-extended' : 'hidden-extended';
        }
      }
  }
}
</script>

<style scoped lang="scss">
  .app_container {
    display: flex;
    flex-wrap: wrap;

    &.menuState_extended, &.menuState_overlay-extended, &.menuState_hidden-extended {
      .menu_Btn {left: $sidebarWidthExpand - 16px;}
      .sidebar {width: $sidebarWidthExpand; left: 0;}
      .main_content {
        width: calc(100% - #{$sidebarWidthExpand});
        margin-left: $sidebarWidthExpand;
      } 
    }

    &.menuState_compact {
      .menu_Btn {left: $sidebarWidthCollapse - 16px;}
      .sidebar {width: $sidebarWidthCollapse;}
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      } 
    }

    &.menuState_overlay-extended {
      .main_content {
        width: calc(100% - #{$sidebarWidthCollapse});
        margin-left: $sidebarWidthCollapse;
      } 
    }

    &.menuState_hidden-extended {
      .sidebar {left: -$sidebarWidthExpand + 1px;}
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
    



  .menu_Btn {
    position: fixed;
    left: $sidebarWidthExpand - 16px;
    top: 100px;
    transition: all .23s ease;
    z-index: 101;
    &.compact {left: $sidebarWidthCollapse - 16px;}
    &.mobile, &.tablet {top: 10px; left: 16px !important;}
    // &.hidden-extended {display: none;}
    // &.overlay-extended {display: block;}
  }


    // display: flex;

    // &[data-screenMode='desktop-large'] {
    //   .sidebar, .sidebar .wrapper {width: $sidebarWidthExpand;}
    // }

    // &[data-screenMode='desktop-small'] {
    //   .sidebar, .sidebar .wrapper  {width: $sidebarWidthCollapse;}
    // }

    // &[data-screenMode='tablet'] {
    //   .sidebar {width: 0;} 
    //   .sidebar .wrapper {width: $sidebarWidthExpand;}
    // }

    // &[data-screenMode='mobile'] {
    //   .sidebar {width: 0;} 
    //   .sidebar .wrapper {width: $sidebarWidthExpand;}
    // }






    // min-height: 100vh;

    // .sidebar {
    //   overflow: hidden;
    //   height: 100vh;
    //   transition: width .23s ease;
    // }

    // .app_content {
    //   width: 100%;
    // }

    // main {
    //   padding: $paddingSize;
    // }




    main {
      padding: 1rem $paddingSize $paddingSize 2rem;
      min-height: 100vh;
      margin-top: $trackingbarHeight;
      margin-left: $sidebarWidthExpand;
    }




</style>