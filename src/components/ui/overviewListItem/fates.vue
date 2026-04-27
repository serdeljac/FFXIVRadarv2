<template>
    <ul>
        <li class="overviewListItem" 
            v-for="node in fetchNoChainSet()" :key="node.ID" 
            @click="focusNode = [node]; emitFocusNode"
            :data-rowFocused="node.node_code == focusNode[0].node_code ? true : null">

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
            @click="focusNode = nodeSet; emitFocusNode"
            :data-rowFocused="nodeSet[0].node_code == focusNode[0].node_code ? true : null">

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
                    let curChainSet = fetchChainSets[d].chain_set
                    let results = this.data.filter((o:any) => o.chain_set == curChainSet)
                    groupedChainSet.push(results)
                }

                return groupedChainSet
            },
            checkNodeSetFocus(arr: any) {
                console.log(arr)
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