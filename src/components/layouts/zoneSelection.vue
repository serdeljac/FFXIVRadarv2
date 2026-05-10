<template>
    <div :class="[`zoneSelect`]">

        <div class="zoneSelect_background" @click="$emit('closeMenu', false)"></div>

        <div :class="[`zoneSelect_foreground`, windowWidth]">
            <h2 class="zoneSelect_titleHeader">Select Zone</h2>
            <!-- Flex All six expansions -->
            <div class="zoneSelect_wrapper">
                <div class="zoneSelect_groupExpansions" v-for="(region, expansionIndex) in zoneList" :key="expansionIndex">
                    <h3 class="zoneSelect_titleExpansion">
                        <img class="iconSize3" :src="getIconImageURL(expansionIndex.toString())"/>
                    </h3>
                    <div class="zoneSelect_groupRegions">
                        <div  v-for="(zones, regionIndex) in region" :key="regionIndex">
                            <ul>
                                <li>
                                    <h3 class="zoneSelect_titleRegion">
                                        <img class="iconSize2" :src="getIconImageURL(zones[0].regionicon)"/>
                                        {{ regionIndex }}
                                    </h3>
                                </li>
                                <li v-for="d in zones" :key="d.ID" 
                                    class="selectable"
                                    @click="$emit('zoneSelected', d); $emit('closeMenu', false)">
                                    <img class="iconSize2" :src="getIconImageURL(d.type ? d.type : 'world')"/>
                                    {{ d.zone }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        name = name.toLowerCase().replace(/ /g,'')
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
            background-color: $bodyBackgroundColor;
            border-radius: $borderRadius;
            overflow: hidden auto;
            padding: 1rem;
            box-shadow: 2px 2px 4px #000;
            &.desktop-small, &.tablet, &.mobile {
                margin: 1rem 1.5rem;
                width: calc(100vw - 3rem);
                height: calc(100vh - 2rem);
            }
        }

        &_titleHeader {
            text-align: center;
            width: 100%;
            padding-bottom: 20px;
        }

        &_titleExpansion {
            align-self: center;
            justify-self: center;
            img {transform: translateX(-7px)}
        }

        &_titleRegion {
            border-bottom: 1px solid #797979;
            margin-bottom: 6px;
        }

        &_groupExpansions {
            display: grid;
            grid-template-columns: 200px auto;
            border: 1px solid #797979;
            padding: 10px;
        }

        &_groupRegions {
            width: 100%;
            display: inline-flex;
            gap: 40px;
        }

        &_wrapper {
            display: flex;
            flex-direction: column;
            gap: 20px;
            
        }

        .selectable {
            margin: 4px 0;
            cursor: pointer;
            padding: 4px;
            border-radius: $borderRadius;
            &:hover {
                background-color: $listBackgroundColorHover;
            }
        }




    }
</style>