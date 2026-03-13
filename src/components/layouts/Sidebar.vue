<template>
    <aside class="sidebar">

        <div class="wrapper">
            <menuButton 
            :class="['sidebar_menuBtn', {'collapsed': !isSidebarOpen}]"
            @click="toggleSidebar()"/>

            <div class="sidebar_clockdisplay">
                <p>Erozean Clock:</p>
                <h2>12:45</h2>
            </div>
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

    </aside>
</template>

<script lang="ts">
import menuButton from '../ui/ButtonMenu.vue';

    export default {
        name: 'Sidebar',
        components: {
            menuButton
        },
        data() {
            return {
                isSidebarOpen: true,
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
        methods: {
            toggleSidebar() {
                this.isSidebarOpen = !this.isSidebarOpen;
                this.$emit('toggleSidebar', this.isSidebarOpen);
            }
        }
    }
</script>

<style scoped lang="scss">
    .sidebar {
        width: $sidebarWidthExpand;
        height: calc(100vh - $trackingbarHeight);
        border-right: 1px solid $borderColor;

        .wrapper {
            overflow: hidden;
        }

        &_clockdisplay {
            padding: $paddingSize;
            padding-left: 2rem;
        }

        &_menuBtn {
            position: absolute;
            left: $sidebarWidthExpand - 16px;
            top: 100px;
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


    }


</style>