<template>
    <div class="vista_enlarge">
        <vistaSmallAPI :node="node" :size="'large'"/>
    </div>
</template>

<script lang="ts" setup>
import vistaSmallAPI from '../api/vistaImg.vue'

defineProps(['node'])
</script>

<style scoped lang="scss">

    .vista_enlarge {
        width: 100%;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.816);
        z-index: 15000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    #imgDisplay {
        border: 3px solid #fff;
        width: 100%;
        max-width: 1000px;
        margin: 1rem;
    }

</style>