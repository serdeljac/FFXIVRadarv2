<template>
    <ul>
        <li v-for="(material, nodeCode) in nodeList" :key="nodeCode"
            class="overviewListItem"
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
                        <img 
                            v-if="d.time" 
                            :class="[`iconSize trackingIcon`, {'remove': d.tracked}]" :src="getIconImg('alarm')" 
                            @click="$emit('changeTracked', d)"/>
                        {{`${d.name} - Lv. ${d.level} ${'★'.repeat(d.stars)}`}}
                        <img class="iconSize2" v-if="d.usage == 'aetherial'" :src="getIconImg('collectability')" />
                        <img class="iconSize2" v-if="d.usage == 'customdelivery'" :src="getIconImg('customdelivery')" />
                    </li>
                </ul>
                <p class="tombRequire" v-if="material[0].tomb">{{ `Requires ${material[0].tomb}` }}</p>
            </div>
        </li>
    </ul>
</template>

<script lang="ts" setup>
    function getIconImg(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import displayAreaText from '../../ui/displayAreaText.vue';
    import iconAndText from '../../ui/iconAndText.vue'

    export default {
        name: 'List Item - Gathering',
        components: {displayAreaText, iconAndText},
        props: ['data', 'timerList', 'focusNode'],
        emits: ['focusNode', 'changeTracked'],
        data() {
            return {
                nodeList: {} as any,
            }
        },
        created() {
            //Create and object where property is the node_code and the contents are the materials
            this.groupNodes() 
        },
        methods: {
            fetchTimerCountdowns(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return 'Any Time'
            },
            groupNodes() {
                let groupedNodes: any = {}

                //Fetch each unique node_code
                let fetchNodeCodes = this.data.filter((obj: any, index: any) => 
                    index === this.data.findIndex((o: any) => obj.node_code === o.node_code)
                );

                //Filter each material based on the found node_code
                for (const d in fetchNodeCodes) {
                    let nodeCode = fetchNodeCodes[d].node_code
                    let materials = this.data.filter((o: any) => o.node_code == nodeCode)
                    materials.sort((a, b) => b.isshard + a.isshard);
                    groupedNodes[nodeCode] = materials
                }

                this.nodeList = groupedNodes
            },
            checkRowActive(arr: any) {
                let currentTime = arr.time ? this.timerList.find((o: any) => o.ID == arr.time).stateActive : null
                if (currentTime) {return true}
                return null
            },
        },
    }
</script>

<style scoped lang="scss">
    .overviewListItem {

        &_list li {
            display: flex;
            align-items: center;
            font-size: 0.8rem;
            img {width: 20px;}
        }

        .tombRequire {
            width: 100%;
            text-align: right;
            color: grey;
            font-style: italic;
        }
    }

</style>