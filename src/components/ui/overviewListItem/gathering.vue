<template>
    <ul>
        <li 
            class="overviewListItem" 
            v-for="node in groupNodes()" :key="node[0]" 
            @click="$emit('focusNode', node)" 
            :data-rowActive="checkRowActive(node[0])">

            <div class="overviewListItem_header">
                <iconAndText :text="`
                    ${node[0].node_name} 
                    ${node[0].job_sub.charAt(0).toUpperCase() + node[0].job_sub.slice(1)} 
                    Node
                    - Lv.${node[0].node_level}`" :icon="node[0].job_sub"/>

                <div class="overviewListItem_timer">
                    <img 
                        class="iconSize"
                        v-if="node[0].time" 
                        :src="getIconImg(node[0].tracked ? 'remove' : 'add')" 
                        @click="$emit('changeTracked', node[0])"/>
                    <p>{{ fetchTimerCountdowns(node[0].time) }}</p>
                </div>
            </div>
            
            <hr/>
            <ul class="overviewListItem_list">
                <li v-for="d in node" :key="d.ID">
                    {{`${d.name} - Lv. ${d.level} ${'★'.repeat(d.stars)}`}}
                </li>
            </ul>
            <p class="tombRequire" v-if="node[0].tomb">{{ `Requires ${node[0].tomb}` }}</p>
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
                    groupedNodes[d] = results
                }
                
                return groupedNodes
            },
            checkRowActive(arr: any) {
                let currentTime = arr.time ? this.timerList.find((o: any) => o.ID == arr.time).stateActive : null
                if (currentTime) {return true}
                return null
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

        .tombRequire {
            width: 100%;
            text-align: right;
            color: grey;
            font-style: italic;
        }
    }

</style>