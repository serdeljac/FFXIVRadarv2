<template>
    <aside :class="['sidebar', menuState]">

        <div class="sidebar_clockdisplay extended" @click="$emit('toggleClock')">
            <p>Eorzea Clock:</p>
            <h2>{{ eorzeaClock.formatIs24Hour ? eorzeaClock.formatTime24Hour : eorzeaClock.formatTime12Hour }}</h2>
        </div>

        <sidebarLinks :sidebarState="menuState"/>

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
    import sidebarLinks from './parts/sidebarItems.vue'

    export default {
        name: 'Sidebar',
        props: ['menuState', 'eorzeaClock'],
        emits: ['toggleClock'],
        components: {sidebarLinks, donateBtn},
        data() {
            return {
                forceExpanded: true,
                
            }
        },
    }
</script>

<style scoped lang="scss">
    .sidebar {
        display: grid;
        grid-template-rows: minmax(auto, 200px) 1fr minmax(80px, auto);
        z-index: 100;
        border-right: 1px solid $borderColor;
        background-color: $bodyBackgroundColor;
        transition: all .23s ease;
        overflow: hidden;

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
            text-align: center;
            user-select: none;
            cursor: pointer;
            h2 {font-size: 3rem;}
            &.expanded {display: block;}
            &.collapsed {display: none;}
        }

        footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 0.75rem;
            text-align: center;
            p {margin: 1rem 0;}
        }
    }
</style>