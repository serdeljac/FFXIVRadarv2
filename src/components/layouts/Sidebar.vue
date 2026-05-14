<template>
    <aside :class="['sidebar', menuState]">

        <div class="sidebar_clockdisplay extended" @click="$emit('toggleClock')">
            <p>Eorzea Clock:</p>
            <h2>{{ eorzeaClock.formatIs24Hour ? eorzeaClock.formatTime24Hour : eorzeaClock.formatTime12Hour }}</h2>
        </div>

        <ul class="sidebar_items">
            <li v-for="a in link_list" :key="a.id">
                <router-link :to="`/${a.link}`" :class="[{'inactive': !a.active }]">
                    <div class="sidebar_items-link">
                        <img class="iconSize" :src="getIconImageURL(a.icon)" alt="icn" />
                        <p>{{ a.name }}</p>
                    </div>
                </router-link>
            </li>
        </ul>

        <footer>
            <donateBtn :menuState="menuState"/>
            <p>&copy; 2023 FFXIV Radar. All rights reserved. <br />This site not built with AI.</p>
        </footer>
    </aside>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/sq_${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import donateBtn from '../ui/donateNow.vue'

    export default {
        name: 'Sidebar',
        props: ['menuState', 'eorzeaClock'],
        emits: ['toggleClock'],
        components: {donateBtn},
        data() {
            return {
                forceExpanded: true,
                link_list: [
                    {
                        id: 1,
                        name: 'Eorzea Overview',
                        icon: 'eorzeamap',
                        link: 'EorzeaOverview',
                        active: true,
                    },
                    
                    {
                        id: 2,
                        name: 'Timed Mining/Botany',
                        icon: 'gathering',
                        link: 'TimedMiningBotany',
                        active: true,
                    },
                    {
                        id: 4,
                        name: 'Sightseeing',
                        icon: 'sightseeing',
                        link: 'Sightseeing',
                        active: true,
                    },
                    {
                        id: 6,
                        name: 'Aether Currents',
                        icon: 'aethercurrents',
                        link: 'AetherCurrents',
                        active: true,
                    },
                    {
                        id: 7,
                        name: 'Blue Mage Abilities',
                        icon: 'bluemage',
                        link: 'BlueMageAbilities',
                        active: true,
                    },
                    {
                        id: 8,
                        name: 'FFXIV Radar News',
                        icon: 'news',
                        link: 'News',
                        active: false,
                    },
                    {
                        id: 9,
                        name: 'About Us',
                        icon: 'about',
                        link: 'AboutUs',
                        active: false,
                    },
                    {
                        id: 10,
                        name: 'Private Policy',
                        icon: 'privatepolicy',
                        link: 'PrivatePolicy',
                        active: false,
                    }
                ],
            }
        },
    }
</script>

<style scoped lang="scss">
    .sidebar {
        z-index: 100;
        border-right: 1px solid $borderColor;
        transition: all .23s ease;
        display: grid;
        grid-template-rows: minmax(auto, 200px) 1fr minmax(80px, auto);
        background-color: $bodyBackgroundColor;

        //Collapsed Sidebar Adjustments Only
        &.compact {
            width: $sidebarWidthCollapse;
            grid-template-columns: $sidebarWidthCollapse;
            .sidebar_clockdisplay {
                &.expanded {display: none;}
                &.collapsed {display: block;}
                p {display: none;}
                padding-left: 0.5rem;
                h2 {font-size: 1.5rem;}
            }
            .sidebar_items-link {
                padding-left: 0;
                img {margin: auto;}
                p {display: none;}
            }
            footer p {
                margin: 1rem 0.5rem;
            }
        }

        &_clockdisplay {
            align-self: center;
            padding: $paddingSize;
            padding-left: 2rem;
            text-align: center;
            user-select: none;
            cursor: pointer;
            h2 {font-size: 3rem;}
            &.expanded {display: block;}
            &.collapsed {display: none;}
        }

        &_items {
            .currentPage div {background-color: $borderColor;}
            &-link {
                padding: $paddingSize;
                padding-left: 2rem;
                display: inline-flex;
                align-items: center;
                gap: 7px;
                user-select: none;
                width: 100%;
                transition: background-color 0.05s linear;
                &:hover {
                    background-color: $borderColorFade;
                }
            }
        }

        footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            p {margin: 1rem 0;}
            align-self: center;
            font-size: 0.75rem;
            text-align: center;
        }
    }
</style>