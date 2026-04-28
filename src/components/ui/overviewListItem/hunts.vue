<template>
    <ul>
        <li class="overviewListItem" 
            v-for="node in data" :key="node.ID" 
            @click="focusNode = [node]; emitFocusNode"
            :data-rowFocused="node.node_code == focusNode[0].node_code ? true : null">
            
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
        }
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
            margin-top: 10px;
            ul {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr 1fr;
                justify-items: center;
                font-size: 14px;
                li {color: $levelColor}
            }
        }

        


    }

</style>