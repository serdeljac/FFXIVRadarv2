<template>
    <ul>
        <li class="overviewListItem" v-for="node in groupNodes()" :key="node[0]" @click="$emit('focusNode', node)">

            <div class="overviewListItem_header">
                <displayAreaText :areaObj="node[0]"  />
                <p>{{ fetchTimerCountdowns(node[0].time) }}</p>
            </div>
            
            <hr/>
            <ul class="overviewListItem_list">
                <li v-for="d in node" :key="d.ID">
                    {{ d.name }}
                </li>
            </ul>
        </li>
    </ul>
</template>

<script lang="ts">
import displayAreaText from '../../ui/displayAreaText.vue';
    export default {
        name: 'List Item Gathering',
        components: {displayAreaText},
        props: ['data', 'timerList'],
        emits: ['focusNode'],
        
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
                    groupedNodes[d] = results
                }
                
                return groupedNodes
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
        margin: 10px auto;
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