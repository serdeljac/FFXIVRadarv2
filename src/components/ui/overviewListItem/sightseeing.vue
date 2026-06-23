<template>
    <ul>
        <li v-for="node in data" :key="node.ID"
            :class="[`overviewListItem`, {'compact': windowWidth == 'tablet' || windowWidth == 'mobile'}]"
            @click="$emit('focusNode', node)"
            :data-rowFocused="node.node_code == focusNode.node_code ? true : null"
            :data-rowActive="checkRowActive(node)">

            <div class="overviewListItem_header">
                <iconAndText 
                    :text="`Sightseeing Log #${node.no} - ${node.name}`" 
                    :icon="`${node.job_sub}`"/>

                <div class="forceright">
                    <toggleTrackingBtn
                            v-if="node.time" 
                            :trackingEnabled="node.tracked"
                            class="hasContext"
                            data-context="Track Node"
                            @click="$emit('changeTracked', node)" />
                    <p>{{ fetchTimerCountdowns(node.time) }}</p>
                </div>
            </div>

            <hr/>

            <div class="overviewListItem_body">

                <vistaSmallAPI :node="node" :size="'small'" @click="$emit('openVistaImg', node);"/>

                <div class="overviewListItem_contents">

                    <div class="weatherAndEmote">
                        <div>
                            <p v-if="node.weather1" :data-timeActive="checkTimeActive('weather1', node)">{{ node.weather1 }}</p>
                            <p v-if="node.weather2" :data-timeActive="checkTimeActive('weather2', node)">{{ node.weather2 }}</p>
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
import iconAndText from '../../ui/iconAndText.vue'
import toggleTrackingBtn from '../../ui/buttons/toggleTracking.vue'
import vistaSmallAPI from '../../API/vistaImg.vue'

const props = defineProps(['data', 'timerList', 'weatherList', 'focusNode', 'windowWidth'])
defineEmits(['focusNode', 'changeTracked', 'openVistaImg'])

function fetchTimerCountdowns(time: string) {
    if (time) return props.timerList.find((o: any) => o.ID == time).countdown
    return 'Any Time'
}

function checkTimeActive(type: string, arr: any) {
    if (type == 'weather1' || type == 'weather2') {
        const curWeather = props.weatherList[arr.area.mapcode]
        return curWeather == arr[type] ? true : null
    }

    if (type == 'time' && arr.time) {
        return props.timerList.find((o: any) => o.ID == arr.time).stateActive ? true : null
    }
    return null
}

function checkRowActive(arr: any) {
    let match1: any
    let match2: any

    // Match1 — time state
    if (arr.time) {
        match1 = props.timerList.find((o: any) => o.ID == arr.time).stateActive ? true : null
    }

    // Match2 — weather state
    if (arr.weather1) {
        const curWeather = props.weatherList[arr.mapcode]
        const condition1 = arr.weather1 == curWeather ? true : false
        const condition2 = (arr.weather2 == curWeather) && arr.weather2 ? true : false
        match2 = condition1 || condition2 ? true : false
    }

    if (!arr.weather1) return match1
    return match1 == match2 ? true : null
}
</script>

<style scoped lang="scss">
    .previewImg {
        background-size: cover;
        aspect-ratio: 1 / 1;
        border: 1px solid #fff;
        cursor: pointer;
        transition: all 0.07 linear;
        user-select: none;
        width: 100px;
        height: 100px;
        &:hover {
            box-shadow: inset 0px 0px 4px #fff,
            0px 0px 4px #fff;
        }
    }

    .overviewListItem {

        &.compact {
            .overviewListItem_body {
                display: block;
                .notes {text-align: center;}
            }
        }

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