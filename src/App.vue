<template>
  <div :class="[`app_container`]" :data-screenMode="windowWidth">
    <trackingBar @menuCondition="toggledMenu"/>
    <sidebar :windowWidth="windowWidth" :menuCondition="menuCondition"/>
      <main>
        <router-view />
      </main>
  </div>
</template>

<script lang="ts">
import sidebar from './components/layouts/Sidebar.vue';
import trackingBar from './components/layouts/TrackingBar.vue';

export default {
  name: 'Root',
  components: {
    sidebar,
    trackingBar
  },
  data() {
    return {
      windowWidth: '' as String,
      menuCondition: true as Boolean,
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

        if (curWidth >= desktopWidthLg) {this.windowWidth = 'desktop-large'}
        else if (curWidth >= desktopWidthSm && curWidth < desktopWidthLg) {this.windowWidth = 'desktop-small'}
        else if (curWidth >= tabletWidth && curWidth < desktopWidthSm) {this.windowWidth = 'tablet'}
        else if (curWidth < tabletWidth) {this.windowWidth = 'mobile'}
        else {console.error('Cannot get Window Width!'); this.windowWidth = 'desktop-large'}
      },
      toggledMenu(menuCondition: boolean) {
        this.menuCondition = menuCondition;
      }
  }
}
</script>

<style scoped lang="scss">
  .app_container {
    display: flex;
    flex-wrap: wrap;
    grid-template-columns: auto auto;

    .trackingbar {width: 100%; grid-column: 1 / span 2;}
    main {
      padding: 1rem $paddingSize $paddingSize 2rem;
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


  }
</style>