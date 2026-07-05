<template>
    <ul :class="[`linkList`, sidebarLayout]">
        <li v-for="a in link_list" :key="a.id">
            <router-link :to="`/${a.link}`">

                <div v-if="sidebarLayout == 'compact'" :class="['linkList-collapse']">
                    <navIcon :name="a.icon"/>
                </div>

                <div v-else :class="['linkList-extended']" >
                    <navIcon :name="a.icon"/>
                    <p>{{ a.name }}</p>
                </div>

            </router-link>
        </li>
    </ul>
</template>

<script lang="ts" setup>
    import navIcon from '../../ui/navIcon.vue';

    defineProps(['sidebarLayout'])

    const link_list = [
        {
            id: 1,
            name: 'Eorzea Overview',
            icon: 'eorzeamap',
            link: 'eorzeaoverview',
        },
        
        {
            id: 2,
            name: 'Timed Mining/Botany',
            icon: 'gathering',
            link: 'timedMiningBotany',
        },
        {
            id: 4,
            name: 'Sightseeing',
            icon: 'sightseeing',
            link: 'sightseeing',
        },
        {
            id: 6,
            name: 'Aether Currents',
            icon: 'aethercurrents',
            link: 'aetherCurrents',
        },
        {
            id: 7,
            name: 'Blue Mage Abilities',
            icon: 'bluemage',
            link: 'blueMageAbilities',
        },
        {
            id: 8,
            name: 'FFXIV Radar News',
            icon: 'news',
            link: 'news',
        },
        {
            id: 9,
            name: 'About Us',
            icon: 'about',
            link: 'aboutUs',
        },
        {
            id: 10,
            name: 'Private Policy',
            icon: 'privatepolicy',
            link: 'privatePolicy',
        },
    ]
</script>

<style scoped lang="scss">
    .linkList-extended :deep(.navIcon) {
        margin-right: 2px;
    }

    a:hover :deep(.navIcon),
    a.router-link-exact-active :deep(.navIcon) {
        color: $teal;
    }
</style>