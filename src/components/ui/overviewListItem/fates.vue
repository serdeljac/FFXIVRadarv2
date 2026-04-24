<template>
    <ul>
        <li class="overviewListItem" 
            v-for="node in fetchNoChainSet()" :key="node.ID" 
            @click="$emit('focusNode', node)" >

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

        <li class="overviewListItem" 
            v-for="nodeSet in fetchChainSet()" :key="nodeSet.ID"
            @click="$emit('focusNode', nodeSet[0])">

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

<script lang="ts">
import displayAreaText from '../../ui/displayAreaText.vue';
import iconAndText from '../../ui/iconAndText.vue'

    export default {
        name: 'List Item - Fates',
        components: {displayAreaText, iconAndText},
        props: ['data'],
        emits: ['focusNode'],
        methods: {
            fetchNoChainSet() {
                let noChainList = this.data.filter((o: any) => !o.chain_set)
                return noChainList
            },
            fetchChainSet() {
                let fetchChainSets = this.data.filter((obj: any, index: any) => 
                    index === this.data.findIndex((o: any) => obj.chain_set === o.chain_set)
                );

                fetchChainSets.shift()
                
                let groupedChainSet = []
                for (const d in fetchChainSets) {
                    console.log(fetchChainSets[d].ID)
                    let curChainSet = fetchChainSets[d].chain_set
                    let results = this.data.filter((o:any) => o.chain_set == curChainSet)
                    groupedChainSet.push(results)
                }

                return groupedChainSet
            },
        },
    }
</script>

<style scoped lang="scss">
    .overviewListItem {

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