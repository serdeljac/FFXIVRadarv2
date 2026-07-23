import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style/style.scss';
import App from './App.vue'

const home = () => import("./components/views/0_Home.vue");
const eorzeaOverview = () => import("./components/views/1_EorzeaOverview.vue");
const timedNodes = () => import('./components/views/2_TimedNodes.vue')
const sightseeing = () => import('./components/views/3_SightseeingVistas.vue')
const aetherCurrents = () => import('./components/views/4_AetherCurrents.vue')
const blueMageSpells = () => import('./components/views/5_BlueMageAbilities.vue')
const news = () => import('./components/views/6_RadarNews.vue')
const aboutUs = () => import('./components/views/7_AboutUs.vue')
const privatePolicy = () => import('./components/views/8_PrivatePolicy.vue')
const weatherPatterns = () => import('./components/views/9_WeatherPatterns.vue')
const pageNotFound = () => import('./components/views/Error404.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: home, props: true },
    { path: "/eorzeaoverview", component: eorzeaOverview, props: true },
    { path: "/timedNodes", component: timedNodes, props: true },
    { path: "/sightseeing", component: sightseeing, props: true },
    { path: "/aetherCurrents", component: aetherCurrents, props: true },
    { path: "/blueMageAbilities", component: blueMageSpells, props: true },
    { path: "/news", component: news, props: true },
    { path: "/aboutUs", component: aboutUs, props: true },
    { path: "/privatePolicy", component: privatePolicy, props: true },
    { path: "/weatherPatterns", component: weatherPatterns, props: true },
    { path: "/:pathMatch(.*)*", component: pageNotFound },
  ],
  linkExactActiveClass: "currentPage",
});

createApp(App).use(router).mount('#app')
