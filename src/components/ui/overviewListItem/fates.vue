<template>
    <ul>
        <li v-for="node in nodeList.nochainset" :key="node.ID"
            :class="[`overviewListItem`, {'compact': windowWidth == 'tablet' || windowWidth == 'mobile'}]"
            @click="$emit('focusNode', node)"
            :data-rowFocused="node.node_code == focusNode.node_code ? true : null">

            <div class="overviewListItem_header">
                <iconAndText :text="`${node.name} - Lv.${node.level}`" :icon="`fate_${node.job_sub}`"/>
                <div class="rewards forceright">
                    <iconAndText :addClass="`rewards`" :text="`${node.exp}`" :icon="`exp`"/>
                    <iconAndText :addClass="`rewards`" :text="`${node.gil}`" :icon="`gil`"/>
                    <iconAndText :addClass="`rewards`" v-if="node.seals" :text="`${node.seals}`" :icon="`seals`"/>
                    <iconAndText :addClass="`rewards`" v-if="node.gemstones" :text="`${node.gemstones}`" :icon="`gemstones`"/>
                </div>
            </div>
        </li>

        <li v-for="(nodeSet, chainNo) in nodeList.chainset" :key="chainNo"
            class="overviewListItem"
            @click="$emit('focusNode', nodeSet[0])"
            :data-rowFocused="nodeSet[0].node_code == focusNode.node_code ? true : null">
            
            <div :class="[`overviewListItem_header set`]" v-for="(node, index) in nodeSet" :key="node.ID">
                <div class="chainArrow" v-if="index != 0">
                    <span v-if="nodeSet[Number(index) -1].chain_no != node.chain_no">⇩</span>
                    <span v-else>OR</span>
                </div>

                <div>
                    <iconAndText 
                        :text="`${node.name} - Lv.${node.level}`" 
                        :icon="`fate_${node.job_sub}`" 
                        :chainNo="node.chain_no"/>
                </div>

                <div class="forceright">
                    <iconAndText :addClass="`rewards`" :text="`${node.exp}`" :icon="`exp`"/>
                    <iconAndText :addClass="`rewards`" :text="`${node.gil}`" :icon="`gil`"/>
                    <iconAndText :addClass="`rewards`" v-if="node.seals" :text="`${node.seals}`" :icon="`seals`"/>
                    <iconAndText :addClass="`rewards`" v-if="node.gemstones" :text="`${node.gemstones}`" :icon="`gemstones`"/>
                </div>
            </div>
        </li>
    </ul>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import iconAndText from '../../ui/iconAndText.vue'

const props = defineProps(['data', 'focusNode', 'windowWidth'])
defineEmits(['focusNode'])

const nodeList = reactive<any>({})

// Separate data into two sets: individual fates and chained fates.
function groupNodes() {
    // Non-chained fates
    nodeList.nochainset = props.data.filter((o: any) => !o.chain_set)

    // Unique chain sets
    let chainList = props.data.filter((o: any) => o.chain_set)
    chainList = chainList.filter((obj: any, index: number) =>
        index === chainList.findIndex((o: any) => obj.chain_set === o.chain_set)
    )

    // Group each set into an object keyed by chain_set
    const groupedChainSet: any = {}
    for (const d in chainList) {
        const curSet = chainList[d].chain_set
        groupedChainSet[curSet] = props.data.filter((o: any) => o.chain_set == curSet)
    }
    nodeList.chainset = groupedChainSet
}

groupNodes()
</script>

<style scoped lang="scss">
    .overviewListItem {

        &.compact {
            .overviewListItem_header {
                display: flex;
                flex-direction: column;
                align-items: center;
                .iconAndText {
                    align-items: initial;
                    justify-content: center;
                }
            }
        }

        &_header {
            &.set {
                &:not(:last-of-type) {padding-bottom: 0px}
                &:not(:first-of-type) {padding-top: 0px}
            }
        }

        .chainArrow {
            grid-column: 1 / span 2;
            text-align: center;
            width: 50%;
        }

        &_list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-top: 5px;
            justify-content: center;
            li {
                padding: 3px 2px;
                text-align: center;
            }
        }
    }

</style>