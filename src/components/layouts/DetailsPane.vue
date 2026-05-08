<template>
    <aside class="details">

        <div class="details_close">
            <img class="iconSize"
                :src="getIconImg('close')" 
                @click="$emit('closeDetails', [])"/>
        </div>

        <div class="details_map">
            <mapDisplay class="miniMap" :ffxivData="ffxivData" :focusNode="node" :singleOnly="true" v-if="node"/>
        </div>

        <div class="details_location">
            <h2>{{ node.area.region }}</h2>
            <h3>{{ `${node.area.zone} ` }}</h3>
            <h4>{{ `(x${node.x}, y${node.y})` }}</h4>
        </div>

        <div class="details_content">

            <div v-if="node.job == 'miner' || node.job == 'botany'">

                <div class="title">
                    <iconAndText :text="`
                        ${node.node_name} 
                        ${node.job_sub.charAt(0).toUpperCase() + node.job_sub.slice(1)} 
                        Node - Lv.${node.node_level}`" :icon="node.job_sub"/>
                </div>

                <div class="name">
                    <p>{{`${node.name} - Lv. ${node.level} ${'★★★★★'.slice(0, node.stars)}`}}</p>
                </div>

                <div class="detailInfo">
                    <div class="detailInfo_left">
                        <p>Requirement:</p>
                        <p>{{ `${node.job_sub.charAt(0).toUpperCase() + node.job_sub.slice(1)} - Lv. ${node.node_level}` }}</p>
                        <p v-if="node.tomb">{{ node.tomb }}</p>
                    </div>

                    <div class="detailInfo_right" :data-rowActive="checkRowActive(node)">
                        <p>Time:</p>
                        <p>{{ fetchTimerCountdown(node.time) }}</p>
                    </div>
                </div>

                <div class="aetherialInfo" v-if="node.usage == 'aetherial'">
                    <h3>Aetherial Reduction Materials:</h3>
                    <ul>
                        <li>{{ node.usage_info.result1 }}</li>
                        <li>{{ node.usage_info.result2 }}</li>
                        <li>{{ node.usage_info.result3 }}</li>
                    </ul>
                </div>

                <div class="materialInfo">
                    <h3>Other Materials:</h3>
                    <ul>
                        <li v-for="d in getOtherMaterials" :key="d.ID">
                            {{ d.name }}
                        </li>
                    </ul>
                </div>
                
            </div>

            <div v-if="node.job == 'sightseeing'">

                <div class="title">
                    <iconAndText :text="`${node.name} `" :icon="node.job_sub"/>
                </div>

                <div class="previewImg">
                    <img :src="getVistaPreviewImgSmall(node.area.icon, node.no)" /> 
                </div>

                <div class="detailInfo">
                    <div class="detailInfo_left">
                        <p>Weather:</p>
                        <div>
                            <p :data-timerActive="checkTimeActive('weather1', node)">{{ node.weather1 }}</p>
                            <p v-if="node.weather2" :data-timerActive="checkTimeActive('weather2', node)">{{ node.weather2 }}</p>
                        </div>
                        <p v-if="!node.weather1">Any Weather</p>
                    </div>

                    <div class="detailInfo_right" :data-rowActive="checkRowActive(node)">
                        <p>Time:</p>
                        <p>{{ fetchTimerCountdown(node.time) }}</p>
                    </div>
                </div>
            </div>

            <div v-if="node.job == 'aethercurrents'">
                {{ node.job }}
            </div>
            
        </div>
    </aside>
</template>

<script lang="ts" setup>
    function getIconImg(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
    function getVistaPreviewImgSmall(expansion: string, no: number) {
        return new URL(`/src/assets/sightseeing/${expansion}/ss${expansion}${no.toString()}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
import mapDisplay from './MapDisplay.vue'
import iconAndText from '../ui/iconAndText.vue'

    export default {
        name: "Details Pane",
        components: {mapDisplay, iconAndText},
        props: ['ffxivData', 'node', 'timerList', 'weatherList'],
        emits: ['closeDetails'],
        data() {
            return {
                showNone: false as boolean
            }
        },
        computed: {
            getOtherMaterials() {
                let nodeCode = this.node.node_code
                let materialList = this.ffxivData[this.node.job].filter((o: any) => o.node_code == nodeCode && o.name != this.node.name)
                if (materialList.length == 0) {
                    let empty = [{name: 'None', ID: '000'}]
                    return empty
                }
                return materialList
            }
        },
        methods: {
            fetchTimerCountdown(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return 'Any Time'
            },
            checkRowActive(arr: any) {
                let currentTime = arr.time ? this.timerList.find((o: any) => o.ID == arr.time).stateActive : null
                if (currentTime) {return true}
                return null
            },
            checkTimeActive(type: string, arr: any) {
                if (type == 'weather1' || type == 'weather2') {
                    let curWeather = this.weatherList[arr.area.mapcode]
                    let triggerWeather = arr[type]
                    if (curWeather == triggerWeather) {return true}
                    return null
                }

                if (type == 'time' && arr.time) {
                    let results = this.timerList.find((o: any) => o.ID == arr.time).stateActive
                    results = results ? true : null
                    return results
                }
                return null
            },
        }
    }
</script>

<style scoped lang="scss">

    .details {
        position: fixed;
        right: 0;
        bottom: 0;
        width: calc(400px + 2rem);
        height: calc(100vh - $trackingbarHeight);
        padding: 0.25rem 1rem;
        background-color: $bodyBackgroundColor;
        border-left: 1px solid $borderColor;
        display: flex;
        flex-direction: column;

        &_close {
            margin-top: 1rem;
            img {cursor: pointer}
        }

        &_map {
            height: 400px;
            margin-top: 1rem;
        }

        .miniMap {
            transform: scale(0.5);
            transform-origin: top left;
        }

        &_location {
            text-align: center;
            margin-top: 0.5rem;
        }

        &_content {
            margin-top: 1rem;

            .title, .name {
                display: flex;
                justify-content: center;
            }

            .detailInfo {
                display: flex;
                width: 100%;
                justify-content: space-around;
                gap: 0 10px;
                & > div {
                    display: flex;
                    width: 50%;
                    text-align: center;
                    flex-direction: column;
                } 
            }

            .aetherialInfo, .materialInfo, .detailInfo_left, .detailInfo_right {
                margin: 1rem auto;
                border: 1px solid #fff;
                padding: 0.5rem;
                text-align: center;
            }

            .previewImg {
                display: flex;
                justify-content: center;
                margin-top: 1rem;
                img {
                    width: 200px;
                    aspect-ratio: 1/1;

                }
            }
        }
    }

</style>