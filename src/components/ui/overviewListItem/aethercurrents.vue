<template>
    <ul>
        <li v-for="node in nodeList.noquest" :key="node.ID"
            :class="[`overviewListItem`, {'compact': windowWidth == 'tablet' || windowWidth == 'mobile'}]"
            @click="$emit('focusNode', node)"
            :data-rowFocused="node.node_code == focusNode.node_code ? true : null" >

            <div class="overviewListItem_header">
                <iconAndText :text="`
                    ${node.name ? `${node.name} Lv.${node.name_level}` : `Aether Current #${node.no}`}`" 
                    :icon="node.job_sub"
                    :secIcon="node.name_type ? `quest_${node.name_type}`: null"/>
            </div>
        </li>

        <li v-for="node in nodeList.quest" :key="node.ID"
            :class="[`overviewListItem`, {'compact': windowWidth == 'tablet' || windowWidth == 'mobile'}]"
            @click="$emit('focusNode', node)"
            :data-rowFocused="node.node_code == focusNode.node_code ? true : null" >

            <div class="overviewListItem_header">
                <iconAndText :text="`
                    ${node.name ? `${node.name} Lv.${node.name_level}` : `Aether Current #${node.no}`}`" 
                    :icon="node.job_sub"
                    :secIcon="node.name_type ? `quest_${node.name_type}`: null"/>
            </div>

            <hr v-if="node.unlock"/>

            <div class="overviewListItem_body" v-if="node.unlock">
                <p>Must Complete: </p>
                <iconAndText :text="`${node.unlock} - Lv${node.unlock_level}`" :icon="`quest_${node.unlock_type}`"/>
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

// Splits aether currents into overworld nodes (no name) and quest-locked ones.
function groupNodes() {
    nodeList.noquest = props.data.filter((o: any) => !o.name)
    nodeList.quest = props.data.filter((o: any) => o.name)
}

groupNodes()
</script>

<style scoped lang="scss">
    .overviewListItem {
        &.compact {
            .overviewListItem_body {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
        }

        &_body {
            display: flex;
            align-items: center;
            & > p {margin-right: 10px;}
        } 
    }

</style>