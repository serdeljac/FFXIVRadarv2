import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style/style.scss';
import App from './App.vue'

const home = () => import('./components/views/EorzeaOverview.vue')
const timedNodes = () => import('./components/views/TimedMiningBotany.vue')
const sightseeing = () => import('./components/views/SightseeingVistas.vue')
const aetherCurrents = () => import('./components/views/AetherCurrents.vue')
const blueMageSpells = () => import('./components/views/BlueMageAbilities.vue')
const news = () => import('./components/views/RadarNews.vue')
const aboutUs = () => import('./components/views/AboutUs.vue')
const privatePolicy = () => import('./components/views/PrivatePolicy.vue')
const pageNotFound = () => import('./components/views/Error404.vue')

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/eorzeaoverview' },
        { path: '/eorzeaoverview', component: home },
        { path: '/timedMiningBotany', component: timedNodes, props: true },
        // { path: '/timedFishing', component: fishing, props: true },
        { path: '/sightseeing', component: sightseeing, props: true },
        { path: '/aetherCurrents', component: aetherCurrents, props: true },
        { path: '/blueMageAbilities', component: blueMageSpells, props: true },
        { path: '/News', component: news, props: true },
        { path: '/aboutUs', component: aboutUs, props: true },
        { path: '/privatePolicy', component: privatePolicy, props: true },
        { path: '/:pathMatch(.*)*', component: pageNotFound } //pathMatch can changeb to whatever
    ],
    linkExactActiveClass: 'currentPage'
})

createApp(App).use(router).mount('body')
