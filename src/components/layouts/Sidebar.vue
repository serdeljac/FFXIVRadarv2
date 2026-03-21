<template>
    <aside :class="['sidebar', menuState]">

        <div v-if="menuState === 'extended' || menuState === 'overlay-extended'" class="sidebar_clockdisplay extended">
            <p>Erozean Clock:</p>
            <h2>12:45</h2>
        </div>

        <div v-else class="sidebar_clockdisplay collapsed">
            <h2>12</h2>
            <h2>45</h2>
        </div>

        <ul class="sidebar_items">
            <li v-for="a in link_list" :key="a.id">
                <router-link :to="`/${a.link}`" :class="[{'inactive': !a.active }]">
                    <div class="sidebar_items-link">
                        <img class="icon" :src="`../../assets/icons/sq_${a.icon}.webp`" alt="icn" />
                        <p>{{ a.name }}</p>
                    </div>
                </router-link>
            </li>
        </ul>

        <footer>
            <p>&copy; 2023 FFXIV Radar. All rights reserved.</p>
        </footer>
    </aside>
</template>

<script lang="ts">
    export default {
        name: 'Sidebar',
        props: ['windowWidth', 'menuState'],
        data() {
            return {
                forceExpanded: true,
                link_list: [
                    {
                        id: 1,
                        name: 'Eorzea Overview',
                        icon: 'eorzeaMap',
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
        height: calc(100vh - $trackingbarHeight);
        border-right: 1px solid $borderColor;
        transition: all .23s ease;
        display: grid;
        grid-template-rows: minmax(auto, 200px) 1fr minmax(80px, auto);
        position: fixed;
        top: $trackingbarHeight;
        background-color: $bodyBackgroundColor;

        
        //Collapsed Sidebar Adjustments Only
        &.compact {
            width: $sidebarWidthCollapse;
            grid-template-columns: $sidebarWidthCollapse;
            .sidebar_clockdisplay {
                &.expanded {display: none;}
                &.collapsed {display: block;}
                padding-left: 0.5rem;
                h2 {font-size: 2rem;}
            }
            .sidebar_items-link {
                padding-left: 0;
                img {margin: auto;}
                p {display: none;}
            }
        }

        // &.overlay-extended {
        //     position: absolute;
        //     left: 0;
        //     top: 0;
        // }

        // &.hidden-extended {
        //     position: absolute;
        //     left: -$sidebarWidthExpand + 1px;
        //     top: 0;
        // }

        &_clockdisplay {
            align-self: center;
            padding: $paddingSize;
            padding-left: 2rem;
            text-align: center;
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
                width: 100%;
                transition: background-color 0.05s linear;
                &:hover {
                    background-color: $borderColorFade;
                }
            }
        }

        footer {
            align-self: center;
            font-size: 0.75rem;
            text-align: center;
        }


    }


</style>