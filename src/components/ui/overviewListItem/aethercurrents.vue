<template>
    <ul>
        <li v-for="node in nodeList.noquest" :key="node.ID"
            class="overviewListItem"
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
            class="overviewListItem"
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

<script lang="ts">
    import displayAreaText from '../../ui/displayAreaText.vue';
    import iconAndText from '../../ui/iconAndText.vue'

    export default {
        name: 'List Item - Aether Currents',
        components: {displayAreaText, iconAndText},
        props: ['data', 'focusNode'],
        emits: ['focusNode'],
        data() {
            return {
                nodeList: {} as any,
            }
        },
        created() {
            this.groupNodes()
        },
        methods: {
            groupNodes() {
                //Filter by only non-quest nodes
                let noQuestNodes = this.data.filter((o: any) => !o.name)
                this.nodeList['noquest'] = noQuestNodes

                //Filter by only quest nodes
                let questNodes = this.data.filter((o: any) => o.name)
                this.nodeList['quest'] = questNodes
            },
        }
    }
</script>

<style scoped lang="scss">
    .overviewListItem {

        &_body {
            display: flex;
            align-items: center;
            & > p {margin-right: 10px;}
        } 
    }

</style>