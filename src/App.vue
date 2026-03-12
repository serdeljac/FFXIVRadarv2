<template>
  <div :class="[`app_container`]" :data-screenMode="windowWidth">

    <sidebar />

    <div class="app_content">
      <trackingBar />
      <main>
        <h1>Hello World!</h1>
        <p>{{ windowWidth }}</p>
      </main>
    </div>


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
        else {console.error('Cannot get Window Width!'); this.windowWidth = 'desktop'}
      },
  }
}
</script>

<style scoped lang="scss">
  .app_container {
    display: flex;

    &[data-screenMode='desktop-large'] {
      .sidebar, .sidebar .wrapper {width: $sidebarWidthExpand;}
    }

    &[data-screenMode='desktop-small'] {
      .sidebar, .sidebar .wrapper  {width: $sidebarWidthCollapse;}
    }

    &[data-screenMode='tablet'] {
      .sidebar {width: 0;} 
      .sidebar .wrapper {width: $sidebarWidthExpand;}
    }

    &[data-screenMode='mobile'] {
      .sidebar {width: 0;} 
      .sidebar .wrapper {width: $sidebarWidthExpand;}
    }






    min-height: 100vh;

    .sidebar {
      overflow: hidden;
      height: 100vh;
      transition: width .23s ease;
    }

    .app_content {
      width: 100%;
    }

    main {
      padding: $paddingSize;
    }


  }
</style>