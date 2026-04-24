<template>
    <ul>
        <li class="overviewListItem" 
            v-for="node in data" :key="node.ID" 
            @click="$emit('focusNode', node)" >

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
        props: ['data', 'timerList'],
        emits: ['focusNode', 'changeTracked'],
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