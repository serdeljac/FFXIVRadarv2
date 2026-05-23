<template>
    <ul :class="[`linklist`, sidebarState]">
        <li v-for="a in link_list" :key="a.id">
            <router-link :to="`/${a.link}`">
                <iconAndText 
                    :addClass="'linklist_item'" 
                    :icon="`sq_${a.icon}`" 
                    :text="sidebarState == 'extended' ? a.name : '' "/>
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
        return new URL(`/src/assets/icons/sq_${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import iconAndText from '../../ui/iconAndText.vue'
    export default {
        name: "List Items",
        components: {iconAndText},
        props: ['sidebarState'],
    }
</script>

<style scoped lang="scss">
.linklist {

    //Responsive
    &.compact {
        padding-left: 0;
        img {margin: auto;}
        p {display: none;}
    }


    .currentPage &_item {background-color: $borderColor !important;}
    &_item{
        padding: $paddingSize;
        padding-left: 2rem;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        user-select: none;
        width: 100%;
        transition: background-color 0.05s linear;
        &:hover {background-color: $borderColorFade;}
    }
}
</style>