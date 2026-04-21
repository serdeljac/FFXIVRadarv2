<template>
    <ul>
        <li class="overviewListItem" v-for="node in groupNodes()" :key="node.ID" @click="$emit('focusNode', node)" :data-rowActive="checkRowActive(node)">

            <div class="overviewListItem_header">
                <iconAndText :text="`Sightseeing Log #${node.no} - ${node.name}`" :icon="`${node.job_sub}`"/>
                <div class="overviewListItem_timer">
                    <img 
                        class="iconSize"
                        v-if="node.time" 
                        :src="getIconImg(node.tracked ? 'remove' : 'add')" 
                        @click="$emit('changeTracked', node)"/>
                    <p>{{ fetchTimerCountdowns(node.time) }}</p>
                </div>
            </div>

            <hr/>

            <div class="overviewListItem_body">
                <img class="previewImg" :src="getVistaPreviewImgSmall(node.area.icon, node.no)" :alt="`IMG`"/>
                <div class="overviewListItem_contents">
                    <div class="weatherAndEmote">
                        <div>
                            <p :data-timerActive="checkTimeActive('weather1', node)">{{ node.weather1 }}</p>
                            <p v-if="node.weather2" :data-timerActive="checkTimeActive('weather2', node)">{{ node.weather2 }}</p>
                            <p v-if="!node.weather1">Any Weather</p>
                        </div>
                        <div class="emote">
                            <iconAndText :text="`${node.emote}`" :icon="`${node.emote}`"/>
                        </div>
                    </div>
                    
                    <div class="notes">
                        <p>
                            <span v-if="node.mount">[Mount Required]</span>
                            {{ node.notes }}
                        </p>
                    </div>
                </div>
            </div>
        </li>
    </ul>
</template>

<script lang="ts" setup>
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
        name: 'List Item Gathering',
        components: {displayAreaText, iconAndText},
        props: ['data', 'timerList'],
        emits: ['focusNode', 'changeTracked'],
        methods: {
            fetchTimerCountdowns(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return 'Any Time'
            },
            groupNodes() {
                
                let fetchNodeCodes = this.data.filter((obj: any, index: any) => 
                    index === this.data.findIndex((o: any) => obj.node_code === o.node_code)
                );

                let groupedNodes = []

                for (const d in fetchNodeCodes) {
                    let node_code = fetchNodeCodes[d].node_code
                    let results = this.data.filter((o: any) => o.node_code == node_code)
                    results.sort((a, b) => b.isshard + a.isshard);
                    groupedNodes.push(results)
                }
                    groupedNodes = this.data
                return this.data
            },
            checkTimeActive(type: string, arr: any) {

                if (type == 'weather1' || type == 'weather2') {
                    let x = arr.area.weather
                    let y = arr[type]
                    if (x == y) {return true}
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
                if (arr.weather1 && arr.area.weather) {
                    let condition1 = arr.weather1 == arr.area.weather ? true :  false
                    let condition2 = (arr.weather2 == arr.area.weather) && arr.weather2 ? true :  false
                    match2 = condition1 || condition2 ? true : false
                }

                if (!arr.weather1) {return match1}
                return match1 == match2 ? true : null
            }
        },
        
    }
</script>

<style scoped lang="scss">

    .overviewListItem {
        max-width: 600px;
        background-color: $listBackgroundColor;
        border-radius: $borderRadius;
        border: 1px solid $listBackgroundColor;
        padding: 6px 4px;
        margin: 2px auto;
        cursor: pointer;
        transition: all .07s linear;
        &:hover {
            border: 1px solid $fontColor;
        }

        &_header {
            display: flex;
            width: 100%;
            justify-content: space-between;
            padding: 5px 0.5rem;
        }

        &_timer {
            display: flex;
            align-items: center;
        }

        hr {
            width: 94%;
            margin: 4px auto;
        }

        &_body {
            display: flex;
            gap: 10px;
            .previewImg {
                width: 100px;
                height: 100px;
                aspect-ratio: 1/1;
                margin: 6px;
            }
        }

        &_contents {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            margin-top: 6px;
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