<template>
    <div :class="[`zoneSelect`]">
        <div class="zoneSelect_background"></div>
        <div :class="[`zoneSelect_foreground`, windowWidth]">
            <h2>Select Zone</h2>
                <!-- Flex All six expansions -->
                <div class="zoneSelect_wrapper">
                    <!-- List -->
                    <div class="zoneSelect_group" v-for="(regions, expansionIndex) in zoneList" :key="expansionIndex">
                        <h3 class="zoneSelect_list-expansion">{{ expansionIndex }}</h3>
                        <div class="zoneSelect_list">
                            <ul v-for="(zones, regionsIndex) in regions" :key="regionsIndex">
                                <li v-for="(d, zonesIndex) in zones" :key="zonesIndex" @click="$emit('zoneSelected', d)">
                                    {{ d.zone }}
                                </li>
                            </ul>
                        </div>
                    
                </div>
            </div>

        </div>
    </div>
</template>

<script lang="ts">
    export default {
        name: 'Zone Select',
        props: ['zoneList', 'windowWidth'],
        emits: ['zoneSelected']
    }
</script>

<style scoped lang="scss">
    .zoneSelect {

        &_background {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            z-index: 998;
            background-color: rgba(0, 0, 0, 0.5);
        }

        &_foreground {
            @extend .zoneSelect_background;
            z-index: 999;
            margin: 5rem 8rem;
            width: calc(100vw - 16rem);
            height: calc(100vh - 10rem);
            background-color: $buttonBackgroundColor;
            border-radius: $borderRadius;
            overflow: hidden;
            padding: 1rem;
            &.desktop-small, &.tablet, &.mobile {
                margin: 1rem 1.5rem;
                width: calc(100vw - 3rem);
                height: calc(100vh - 2rem);
            }
        }

        &_wrapper {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(6, minmax(200px, 1fr));
        }

        &_list-expansion {

        }

        &_group {
            
            gap: 20px;
        }

        h2 {
            text-align: center;
            width: 100%;
            padding-bottom: 10px;
        }

        &_wrapper {
            height: 100%;
            
        }
    }
</style>