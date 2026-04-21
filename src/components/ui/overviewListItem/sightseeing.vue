<template>
    <ul>
        <li class="overviewListItem" v-for="node in groupNodes()" :key="node">
            {{ node }}
            <!-- <div class="overviewListItem_header">
                <displayAreaText :areaObj="node[0]"  />
                <p>{{ fetchTimerCountdowns(node[0].time) }}</p>
            </div>
            
            
            <hr/>
            <div v-for="d in node" :key="d.ID">
                {{ d.name }}
            </div> -->
        </li>
    </ul>
</template>

<script lang="ts">
import displayAreaText from '../../ui/displayAreaText.vue';
    export default {
        name: 'List Item Gathering',
        components: {displayAreaText},
        props: ['data', 'timerList'],
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
                return groupedNodes
            }
        },
        
    }
</script>

<style scoped lang="scss">

</style>