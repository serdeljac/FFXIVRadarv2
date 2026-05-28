import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style/style.scss';
import App from './App.vue'

const home = () => import('./components/views/1_EorzeaOverview.vue')
const timedNodes = () => import('./components/views/2_TimedMiningBotany.vue')
const sightseeing = () => import('./components/views/3_SightseeingVistas.vue')
const aetherCurrents = () => import('./components/views/4_AetherCurrents.vue')
const blueMageSpells = () => import('./components/views/5_BlueMageAbilities.vue')
const news = () => import('./components/views/6_RadarNews.vue')
const aboutUs = () => import('./components/views/7_AboutUs.vue')
const privatePolicy = () => import('./components/views/8_PrivatePolicy.vue')
const pageNotFound = () => import('./components/views/Error404.vue')

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/timedMiningBotany' },
        { path: '/eorzeaoverview', component: home },
        { path: '/timedMiningBotany', component: timedNodes, props: true },
        { path: '/sightseeing', component: sightseeing, props: true },
        { path: '/aetherCurrents', component: aetherCurrents, props: true },
        { path: '/blueMageAbilities', component: blueMageSpells, props: true },
        { path: '/News', component: news, props: true },
        { path: '/aboutUs', component: aboutUs, props: false},
        { path: '/privatePolicy', component: privatePolicy, props: false },
        { path: '/:pathMatch(.*)*', component: pageNotFound } //pathMatch can changeb to whatever
    ],
    linkExactActiveClass: 'currentPage'
})

createApp(App).use(router).mount('body')
