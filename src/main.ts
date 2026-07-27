import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style/style.scss';
import App from './App.vue'

const home = () => import("./components/views/0_Home.vue");
const eorzeaOverview = () => import("./components/views/1_EorzeaOverview.vue");
const timedNodes = () => import('./components/views/2_TimedMiningBotany.vue')
const timedFishing = () => import('./components/views/10_TimedFishing.vue')
const sightseeing = () => import('./components/views/3_SightseeingVistas.vue')
const aetherCurrents = () => import('./components/views/4_AetherCurrents.vue')
const blueMageSpells = () => import('./components/views/5_BlueMageAbilities.vue')
const news = () => import('./components/views/6_RadarNews.vue')
const aboutUs = () => import('./components/views/7_AboutUs.vue')
const privatePolicy = () => import('./components/views/8_PrivatePolicy.vue')
const weatherPatterns = () => import('./components/views/9_WeatherPatterns.vue')
const pageNotFound = () => import('./components/views/Error404.vue')

const SITE_NAME = 'FFXIV Radar'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: home, props: true, meta: { title: 'Gathering companion for Final Fantasy XIV' } },
    // Renamed from the all-lowercase "/eorzeaoverview" so multi-word routes are
    // consistently camelCase. No redirect is needed: vue-router matches paths
    // case-insensitively by default, so old links and bookmarks still resolve
    // here (verified with /eorzeaoverview and /EORZEAOVERVIEW).
    { path: "/eorzeaOverview", component: eorzeaOverview, props: true, meta: { title: 'Eorzea Overview — interactive zone map' } },
    { path: "/timedNodes", component: timedNodes, props: true, meta: { title: 'Timed Mining & Botany nodes' } },
    { path: "/timedFishing", component: timedFishing, props: true, meta: { title: 'Timed Fishing holes' } },
    { path: "/sightseeing", component: sightseeing, props: true, meta: { title: 'Sightseeing Log vistas' } },
    { path: "/aetherCurrents", component: aetherCurrents, props: true, meta: { title: 'Aether Currents' } },
    { path: "/blueMageAbilities", component: blueMageSpells, props: true, meta: { title: 'Blue Mage spell locations' } },
    { path: "/news", component: news, props: true, meta: { title: 'News' } },
    { path: "/aboutUs", component: aboutUs, props: true, meta: { title: 'About' } },
    { path: "/privatePolicy", component: privatePolicy, props: true, meta: { title: 'Privacy Policy' } },
    { path: "/weatherPatterns", component: weatherPatterns, props: true, meta: { title: 'Weather Patterns forecast' } },
    { path: "/:pathMatch(.*)*", component: pageNotFound, meta: { title: 'Page not found' } },
  ],
  linkExactActiveClass: "currentPage",
});

// Every route previously rendered the same <title>, so tabs, history entries and
// bookmarks were indistinguishable. Set after each navigation rather than in a
// guard so it reflects the route actually landed on (including redirects).
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
})

createApp(App).use(router).mount('#app')
