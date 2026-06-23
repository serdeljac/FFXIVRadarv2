<template>
    <ul>
        <li v-for="(material, nodeCode) in nodeList" :key="nodeCode"
            :class="[`overviewListItem`, {'compact': windowWidth == 'tablet' || windowWidth == 'mobile'}]"
            @click="$emit('focusNode', material[0])"
            :data-rowFocused="nodeCode == focusNode.node_code ? true : null" 
            :data-rowAndTimeActive="checkRowActive(material[0])">

            <div class="overviewListItem_header">
                <iconAndText :text="`
                    ${material[0].node_name} 
                    ${material[0].job_sub.charAt(0).toUpperCase() + material[0].job_sub.slice(1)} 
                    Node - Lv.${material[0].node_level}`" :icon="material[0].job_sub"/>
                

                <div class="forceright">
                    <p class="timeDisplay">{{ fetchTimerCountdowns(material[0].time) }}</p>
                </div>
            </div>

            <hr/>

            <div class="overviewListItem_body">
                <ul class="overviewListItem_list">
                    <li v-for="d in material" :key="d.ID" >
                        <toggleTrackingBtn
                            v-if="d.time" 
                            :trackingEnabled="d.tracked"
                            class="hasContext"
                            data-context="Track Node"
                            @click="$emit('changeTracked', d)" />

                        {{`${d.name} - Lv. ${d.level} ${'★'.repeat(d.stars)}`}}
                        <iconImgAPI class="iconSize2" v-if="d.usage == 'aetherial'" :name="'collectability'"/>
                        <iconImgAPI class="iconSize2" v-if="d.usage == 'customdelivery'" :name="'customdelivery'"/>
                    </li>
                </ul>
                <p class="tombRequire" v-if="material[0].tomb">{{ `Requires ${material[0].tomb}` }}</p>
            </div>
        </li>
    </ul>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import iconAndText from '../../ui/iconAndText.vue'
import toggleTrackingBtn from '../../ui/buttons/toggleTracking.vue'
import iconImgAPI from '../../API/iconImg.vue'

const props = defineProps(['data', 'timerList', 'focusNode', 'windowWidth'])
defineEmits(['focusNode', 'changeTracked'])

const nodeList = ref<any>({})

function fetchTimerCountdowns(time: string) {
    if (time) return props.timerList.find((o: any) => o.ID == time).countdown
    return 'Any Time'
}

// Build an object keyed by node_code whose contents are that node's materials.
function groupNodes() {
    const groupedNodes: any = {}

    const fetchNodeCodes = props.data.filter((obj: any, index: number) =>
        index === props.data.findIndex((o: any) => obj.node_code === o.node_code)
    )

    for (const d in fetchNodeCodes) {
        const nodeCode = fetchNodeCodes[d].node_code
        const materials = props.data.filter((o: any) => o.node_code == nodeCode)
        materials.sort((a: any, b: any) => b.isshard + a.isshard)
        groupedNodes[nodeCode] = materials
    }

    nodeList.value = groupedNodes
}

function checkRowActive(arr: any) {
    const currentTime = arr.time ? props.timerList.find((o: any) => o.ID == arr.time).stateActive : null
    return currentTime ? true : null
}

groupNodes()
watch(() => props.data, groupNodes)
</script>

<style scoped lang="scss">
    .overviewListItem {

        &.compact {
            .overviewListItem_list {
                display: block;
            }
        }

        &_list li {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
            img {
                width: 14px;
                height: 14px;
            }
        }

        .tombRequire {
            width: 100%;
            text-align: right;
            color: grey;
            font-style: italic;
        }
    }

</style>