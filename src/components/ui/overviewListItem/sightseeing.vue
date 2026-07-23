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
import vistaSmallAPI from '../../api/vistaImg.vue'
import { getTimerCountdown, isTimerActive, isWeatherMatch } from '../../../hooks/hooks.ts'

const props = defineProps(['data', 'timerList', 'weatherList', 'focusNode', 'windowWidth'])
defineEmits(['focusNode', 'changeTracked', 'openVistaImg'])

function fetchTimerCountdowns(time: string) {
    return getTimerCountdown(props.timerList, time)
}

function checkTimeActive(type: string, arr: any) {
    if (type == 'weather1' || type == 'weather2') {
        return isWeatherMatch(props.weatherList, arr.area.mapcode, arr[type]) ? true : null
    }

    if (type == 'time' && arr.time) {
        return isTimerActive(props.timerList, arr.time) ? true : null
    }
    return null
}

// A vista row is active only when its timer window and weather condition agree:
// weatherless vistas fall back to the timer state alone.
function checkRowActive(arr: any) {
    const match1 = arr.time ? (isTimerActive(props.timerList, arr.time) ? true : null) : undefined

    if (!arr.weather1) return match1
    const match2 = isWeatherMatch(props.weatherList, arr.area.mapcode, arr.weather1)
        || isWeatherMatch(props.weatherList, arr.area.mapcode, arr.weather2)

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