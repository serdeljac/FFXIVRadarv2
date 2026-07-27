import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style/style.scss';
import App from './App.vue'

const home = () => import("./router/Home.vue");
const eorzeaOverview = () => import("./router/1_EorzeaOverview.vue");
const timedNodes = () => import('./router/2_TimedMiningBotany.vue')
const timedFishing = () => import('./router/3_TimedFishing.vue')
const sightseeing = () => import('./router/4_SightseeingVistas.vue')
const aetherCurrents = () => import('./router/5_AetherCurrents.vue')
const blueMageSpells = () => import('./router/6_BlueMageAbilities.vue')
const weatherPatterns = () => import('./router/7_WeatherPatterns.vue')

const news = () => import('./router/10_RadarNews.vue')
const aboutUs = () => import('./router/11_AboutUs.vue')
const privatePolicy = () => import('./router/12_PrivatePolicy.vue')
const pageNotFound = () => import('./router/Error404.vue')

const SITE_NAME = 'FFXIV Radar'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: home, props: true, meta: { title: 'Gathering companion for Final Fantasy XIV' } },
    { path: "/eorzeaOverview", component: eorzeaOverview, props: true, meta: { title: 'Eorzea Overview — interactive zone map' } },
    { path: "/timedMiningBotany", component: timedNodes, props: true, meta: { title: 'Timed Mining & Botany Nodes' } },
    { path: "/timedFishing", component: timedFishing, props: true, meta: { title: 'Timed Fishing Nodes' } },
    { path: "/sightseeingVistas", component: sightseeing, props: true, meta: { title: 'Sightseeing Log Vistas' } },
    { path: "/aetherCurrents", component: aetherCurrents, props: true, meta: { title: 'Aether Currents' } },
    { path: "/blueMageAbilities", component: blueMageSpells, props: true, meta: { title: 'Blue Mage Spell Abilities' } },
    { path: "/news", component: news, props: true, meta: { title: 'FFXIV Radar News' } },
    { path: "/aboutUs", component: aboutUs, props: true, meta: { title: 'About' } },
    { path: "/privatePolicy", component: privatePolicy, props: true, meta: { title: 'Privacy Policy' } },
    { path: "/weatherPatterns", component: weatherPatterns, props: true, meta: { title: 'Weather Patterns' } },
    { path: "/:pathMatch(.*)*", component: pageNotFound, meta: { title: 'Page not found' } },
  ],
  linkExactActiveClass: "currentPage",
});

router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
})

createApp(App).use(router).mount('#app')
