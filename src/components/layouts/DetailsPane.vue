<template>
    <aside class="details">

        <div class="details_close">
            <trashButton @click="$emit('closeDetails', false)"/>
        </div>

        <div class="details_map">
            <mapDisplay class="miniMap" :ffxivData="ffxivData" :focusNode="node" :singleOnly="true" v-if="node"/>
        </div>

        <div class="details_location">
            <h3>{{ `${node.area.region} > ${node.area.zone}` }}</h3>
            <h4>{{ `(x${node.x}, y${node.y})` }}</h4>
        </div>

        <div class="details_content">

            <div v-if="node.job == 'miner' || node.job == 'botany'">

                <div class="details_content-name">
                    <p>{{`${node.name}`}}</p>
                    <p>{{ `Lv. ${node.level} ${'★★★★★'.slice(0, node.stars)}` }}</p>
                </div>

                <div class="details_content-pairedCells">
                    <div class="isBlock">
                        <p>Requirement:</p>
                        <p>{{ `${node.job_sub.charAt(0).toUpperCase() + node.job_sub.slice(1)} - Lv. ${node.node_level}` }}</p>
                        <p v-if="node.tomb">{{ node.tomb }}</p>
                    </div>

                    <div class="isBlock" :data-rowAndTimeActive="checkRowActive(node, 'time')">
                        <p class="timeDisplay">Time:</p>
                        <p class="timeDisplay">{{ fetchTimerCountdown(node.time) }}</p>
                    </div>
                </div>

                <div class="isBlock" v-if="node.usage == 'aetherial'">
                    <h3>Aetherial Reduction Materials:</h3>
                    <ul>
                        <li>{{ node.usage_info.result1 }}</li>
                        <li>{{ node.usage_info.result2 }}</li>
                        <li>{{ node.usage_info.result3 }}</li>
                    </ul>
                </div>

                <div class="isBlock">
                    <h3>Other Materials:</h3>
                    <ul>
                        <li v-for="d in getOtherMaterials" :key="d.ID">
                            {{ `${d.name} - Lv. ${d.level} ${'★★★★★'.slice(0, d.stars)}` }}
                        </li>
                    </ul>
                </div>
                
            </div>

            <div v-if="node.job == 'sightseeing'">

                <div class="details_content-name">
                    <iconAndText :text="`${node.name}`" :icon="node.job_sub"/>
                </div>

                <div class="details_content-previewImg">
                    <img :src="getVistaPreviewImgSmall(node.area.icon, node.no)" /> 
                </div>

                <div class="details_content-notes">
                    <p>
                        <span v-if="node.mount">[Flying Mount Required]</span>
                        {{ node.notes }}
                    </p>
                </div>

                <div class="details_content-pairedCells">
                    <div class="isBlock" :data-rowAndTimeActive="checkRowActive(node, 'weather')">
                        <p class="timeDisplay">Weather:</p>
                        <div v-if="node.weather1">
                            <p :data-timeActive="checkTimeActive('weather1', node)">{{ node.weather1 }}</p>
                            <p v-if="node.weather2" :data-timeActive="checkTimeActive('weather2', node)">{{ node.weather2 }}</p>
                        </div>
                        <p v-else>Any Weather</p>
                    </div>

                    <div class="isBlock" :data-rowAndTimeActive="checkRowActive(node, 'time')">
                        <p class="timeDisplay">Time:</p>
                        <p class="timeDisplay">{{ fetchTimerCountdown(node.time) }}</p>
                    </div>
                </div>

                <div class="details_content-emote isBlock">
                    <iconAndText :text="`${node.emote} `" :icon="node.emote"/>
                </div>  
            </div>

            <div v-if="node.job == 'aethercurrents'">

                <div class="details_content-name">
                    <iconAndText :text="`Aether Current #${node.order}`" :icon="node.job_sub"/>
                </div>

                <div class="details_content-questName isBlock" v-if="node.name">
                    <h3>Acquired from quest:</h3>
                    <iconAndText :icon="`quest_${node.name_type}`" :text="`${node.name} - Lv.${node.name_level}`"/>
                </div>

                <div class="details_content-unlockName isBlock" v-if="node.unlock">
                    <h3>Must complete:</h3>
                    <iconAndText  :icon="`quest_${node.unlock_type}`" :text="`${node.unlock} - Lv.${node.unlock_level}`"/>
                </div> 
            </div>
            
        </div>
    </aside>
</template>

<script lang="ts" setup>
    // function getIconImg(name: string) {
    //     return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    // }
    function getVistaPreviewImgSmall(expansion: string, no: number) {
        return new URL(`/src/assets/sightseeing/${expansion}/ss${expansion}${no.toString()}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
import mapDisplay from './MapDisplay.vue'
import iconAndText from '../ui/iconAndText.vue'
import trashButton from '../ui/trashButton.vue'

    export default {
        name: "Details Pane",
        components: {mapDisplay, iconAndText, trashButton},
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
            checkRowActive(arr: any, type: string) {

                if (type == 'time') {
                    let currentTime = arr.time ? this.timerList.find((o: any) => o.ID == arr.time).stateActive : null
                    if (currentTime) {return true}
                    return null
                }

                if (type == 'weather') {
                    let curWeather = this.weatherList[arr.area.mapcode]
                    if (curWeather == arr.weather1 || curWeather == arr.weather2) {return true}
                    return null
                }

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
        overflow-Y: auto;
        overflow-X: hidden;

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

            &-name {
                font-size: 1.2rem;
                text-align: center;
                background-color: $borderColor;
                padding: 0.2rem 0;
            }

            .isBlock {
                border: 1px solid #fff;
                padding: 0.5rem;
                text-align: center;
                margin-top: 1rem;
                
            }

            &-pairedCells {
                display: flex;
                width: 100%;
                justify-content: space-around;
                gap: 0 10px;
                & > div {
                    display: flex;
                    justify-content: center;
                    width: 50%;
                    text-align: center;
                    flex-direction: column;
                } 
            }

            &-previewImg {
                display: flex;
                justify-content: center;
                margin-top: 1rem;
                img {
                    width: 160px;
                    aspect-ratio: 1/1;
                    border: 1px solid #fff;
                    cursor: pointer;
                }
            }

            &-notes {
                margin-top: 0.5rem;
                width: 100%;
                text-align: center;
                span {font-weight: bold;}
            }

            &-questName, &-unlockName {
                h3 {margin-bottom: 0.3rem}
            }
        }
    }

</style>