<template>
    <ul>
        <li class="overviewListItem" 
            v-for="node in data" :key="node.ID" 
            @click="focusNode = [node]; emitFocusNode" 
            :data-rowFocused="node.node_code == focusNode[0].node_code ? true : null" 
            :data-rowActive="checkRowActive(node)">

            <div class="overviewListItem_header">
                <iconAndText 
                    :text="`Sightseeing Log #${node.no} - ${node.name}`" 
                    :icon="`${node.job_sub}`"/>

                <div class="forceright">
                    <img class="iconSize"
                        v-if="node.time" 
                        :src="getIconImg(node.tracked ? 'remove' : 'add')" 
                        @click="$emit('changeTracked', node)"/>
                    <p>{{ fetchTimerCountdowns(node.time) }}</p>
                </div>
            </div>

            <hr/>

            <div class="overviewListItem_body">

                <div class="previewImg">
                    <img v-if="checkImgAvailable(node.area.icon, node.no)" :src="getVistaPreviewImgSmall(node.area.icon, node.no)" />
                </div>

                <div class="overviewListItem_contents">

                    <div class="weatherAndEmote">
                        <div>
                            <p :data-timerActive="checkTimeActive('weather1', node)">{{ node.weather1 }}</p>
                            <p v-if="node.weather2" :data-timerActive="checkTimeActive('weather2', node)">{{ node.weather2 }}</p>
                            <p v-if="!node.weather1">Any Weather</p>
                        </div>
                        <div>
                            <iconAndText :text="`${node.emote}`" :icon="`${node.emote}`"/>
                        </div>
                    </div>
                    
                    <div class="notes">
                        <p>
                            <span v-if="node.mount">[Flying Mount Required]</span>
                            {{ node.notes }}
                        </p>
                    </div>
                </div>
            </div>
        </li>
    </ul>
</template>

<script lang="ts" setup>
    function checkImgAvailable(expansion: string, no: number) {
        let results = new URL(`/src/assets/sightseeing/${expansion}/ss${expansion}${no.toString()}.webp`, import.meta.url).href
        let state = results.split("/").pop() == 'undefined' ? null : true
        return state
    };
    function getVistaPreviewImgSmall(expansion: string, no: number) {
        return new URL(`/src/assets/sightseeing/${expansion}/ss${expansion}${no.toString()}.webp`, import.meta.url).href
    }
    // function getVistaPreviewImgLarge(expansion: string, no: number) {
    //     return new URL(`/src/assets/sightseeing/${expansion}/ss${expansion}${no.toString()}.webp`, import.meta.url).href
    // }
    function getIconImg(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
import displayAreaText from '../../ui/displayAreaText.vue';
import iconAndText from '../../ui/iconAndText.vue'

    export default {
        name: 'List Item - Sightseeing',
        components: {displayAreaText, iconAndText},
        props: ['data', 'timerList', 'weatherList'],
        emits: ['focusNode', 'changeTracked'],
        data() {
            return {
                focusNode: [] as any,
            }
        },
        computed: {
            emitFocusNode() {
                this.$emit('focusNode', this.focusNode)
            }
        },
        created() {
            this.focusNode = [this.data[0]] //Set first found item as the focus (on tab select)
            this.emitFocusNode
        },
        methods: {
            fetchTimerCountdowns(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return 'Any Time'
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
            checkRowActive(arr: any) {
                let match1: boolean
                let match2: boolean

                //Match1 - Get Time State
                if (arr.time) {
                    let currentTimeState = this.timerList.find((o: any) => o.ID == arr.time).stateActive
                    match1 = currentTimeState ? true : null
                }

                //Match2 - Get Weather State
                if (arr.weather1) {
                    let curWeather = this.weatherList[arr.mapcode]
                    let condition1 = arr.weather1 == curWeather ? true :  false
                    let condition2 = (arr.weather2 == curWeather) && arr.weather2 ? true :  false
                    match2 = condition1 || condition2 ? true : false
                }

                if (!arr.weather1) {return match1}
                return match1 == match2 ? true : null
            }
        },
        
    }
</script>

<style scoped lang="scss">
    @keyframes pulse {
        0% {transform: scale(1)}
        50% {transform: scale(1.1)}
        100% {transform: scale(1)}
    }

    .previewImg {
        width: 100px;
        height: 100px;
        aspect-ratio: 1/1;

        border: 1px solid #fff;
        border-radius: $borderRadius;
        &::before {
            display: flex;
            align-items: center;
            justify-content: center;
            content: 'Loading...';
            position: absolute;
            z-index: 9;
            width: 100px;
            height: 100px;
            color: grey;
            animation: pulse 1s linear infinite;
        }
        img {
            width: 100%;
            position: relative;
            z-index: 10
        }
    }

    .overviewListItem {

        &_body {
            display: flex;
            gap: 20px;
        }

        &_contents {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            margin-top: 6px;
            height: 100px;
            justify-content: center;
            .weatherAndEmote {
                display: grid;
                justify-items: center;
                grid-template-columns: 1fr 1fr;
                width: 100%;
                p {color: grey;}
                div {
                    display: flex;
                    gap: 10px;
                }
            }
            .notes {
                width: 100%;
                span {font-weight: bold;}
            }
        }
    }

</style>