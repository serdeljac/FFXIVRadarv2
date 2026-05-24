<template>
    <ul :class="[`linkList`, sidebarLayout]">
        <li v-for="a in link_list" :key="a.id">
            <router-link :to="`/${a.link}`">

                <div v-if="sidebarLayout == 'compact'" :class="['linkList-collapse']">
                    <img :src="getIconImageURL(`sq_${a.icon}`)" />
                </div>

                <div v-else :class="['linkList-extended']" >
                    <img :src="getIconImageURL(`sq_${a.icon}`)" />
                    <p>{{ a.name }}</p>
                </div>

            </router-link>
        </li>
    </ul>
</template>

<script lang="ts" setup>
    const link_list = [
        {
            id: 1,
            name: 'Eorzea Overview',
            icon: 'eorzeamap',
            link: 'EorzeaOverview',
        },
        
        {
            id: 2,
            name: 'Timed Mining/Botany',
            icon: 'gathering',
            link: 'TimedMiningBotany',
        },
        {
            id: 4,
            name: 'Sightseeing',
            icon: 'sightseeing',
            link: 'Sightseeing',
        },
        {
            id: 6,
            name: 'Aether Currents',
            icon: 'aethercurrents',
            link: 'AetherCurrents',
        },
        {
            id: 7,
            name: 'Blue Mage Abilities',
            icon: 'bluemage',
            link: 'BlueMageAbilities',
        },
        {
            id: 8,
            name: 'FFXIV Radar News',
            icon: 'news',
            link: 'News',
        },
        {
            id: 9,
            name: 'About Us',
            icon: 'about',
            link: 'AboutUs',
        },
        {
            id: 10,
            name: 'Private Policy',
            icon: 'privatepolicy',
            link: 'PrivatePolicy',
        }
    ]

    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "List Items",
        props: ['sidebarLayout'],
    }
</script>