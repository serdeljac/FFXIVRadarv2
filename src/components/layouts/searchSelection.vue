<template>
    <div :class="[`zoneSelect`]">
        <div class="zoneSelect_background" @click="$emit('closeMenu', false)"></div>
        <div :class="[`zoneSelect_foreground`, windowWidth]">
            <h2>Select Zone</h2>
                <!-- Flex All six expansions -->
                <div class="zoneSelect_wrapper">
                    <!-- List -->
                    <div class="zoneSelect_group" v-for="(regions, expansionIndex) in zoneList" :key="expansionIndex">
                        <h3 class="zoneSelect_list-expansion">
                            <img class="iconSize" :src="getIconImageURL(regions[Object.keys(regions)[0]][0].icon)" />
                            {{ expansionIndex }}
                        </h3>
                        <hr />
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

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: 'Zone Select',
        props: ['zoneList', 'windowWidth'],
        emits: ['zoneSelected', 'closeMenu'],
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
            margin: 2rem 8rem;
            width: calc(100vw - 16rem);
            height: calc(100vh - 4rem);
            background-color: $buttonBackgroundColor;
            border-radius: $borderRadius;
            overflow: hidden;
            padding: 1rem;
            box-shadow: 2px 2px 4px #000;
            &.desktop-small, &.tablet, &.mobile {
                margin: 1rem 1.5rem;
                width: calc(100vw - 3rem);
                height: calc(100vh - 2rem);
            }
        }

        h2 {
            text-align: center;
            width: 100%;
            padding-bottom: 20px;
        }

        &_wrapper {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(6, minmax(200px, 1fr));
            gap: 20px;
            hr {margin: 4px 0;}
        }

        &_list-expansion {
            display: flex;
        }

        &_list {
            li {
                padding: 3px 6px;
                margin: 3px 0;
                transition: all .07s linear;
                border-radius: $borderRadius;
                cursor: pointer;
                &:hover {
                    background-color: $buttonBackgroundColorHover;
                }
            }
        }


    }
</style>