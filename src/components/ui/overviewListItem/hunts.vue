<template>
    <ul>
        <li class="overviewListItem" 
            v-for="node in data" :key="node.ID" 
            @click="$emit('focusNode', node)" >
            
            <div class="overviewListItem_header">
                <iconAndText :text="`${node.name} - Lv.${node.level}`" :icon="`hunts${node.rank == 'SS' ? '_ss' : ''}`"/>
                <p class="forceright">{{ `Rank: ${node.rank}` }}</p>
            </div>

            <hr />

            <div class="overviewListItem_body">
                <div>
                    <p>{{ `Respawn (Defeat): ${node.respawn}` }}</p>
                </div>

                <div>
                    <p>{{ `Respawn (Maintenance): ${node.maintenance ? node.maintenance : 'Immediate'}` }}</p>
                </div>

                <div class="specialTrigger" v-if="node.trigger">
                    <p>{{ `Special Trigger: ${node.trigger}` }}</p>
                    <div v-if="node.weather1">
                        <p>{{ node.weather1 }}</p>
                        <p v-if="node.weather2">{{ node.weather2 }}</p>
                    </div>
                </div>

                <div class="points">
                    <ul>
                        <li v-for="p in node.points" :key="p.ID">
                            {{ `x${p.x}, y${p.y}` }}
                        </li>
                    </ul>
                </div>
            </div>
        </li>
    </ul>
</template>

<script lang="ts">
import displayAreaText from '../../ui/displayAreaText.vue';
import iconAndText from '../../ui/iconAndText.vue'

    export default {
        name: 'List Item - Hunts',
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

        &_body {
            display: grid;
            grid-template-columns: 1fr 1fr;
            

            .specialTrigger {
                padding: 3px 2px;
                grid-column: 1 / span 2;
            }
        }

        .points {
            grid-column: 1 / span 2;
            width: 100%;
            ul {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                justify-items: center;
                li {color: $levelColor}
            }
        }

        


    }

</style>