<template>
    <div class="displayArea">
        <iconImgAPI :name="node.area.icon"/>
        <p>
            {{ `${node.area.region} > ${node.area.zone}` }}
            <span class="cord">{{ `(x${node.x}, y${node.y})` }}</span>
        </p>
    </div>
</template>

<script lang="ts">
import iconImgAPI from '../API/iconImg.vue';
    export default {
        name: "Area Display",
        props: ['node'],
        components: {iconImgAPI}
    }
</script>

<style scoped lang="scss">
    .displayArea {
        display: inline-flex;
        align-items: center;

        img {
            margin-right: 6px;
            width: 20px;
            height: 20px;
            aspect-ratio: 1 / 1;
        }

        .cord {
            color: rgb(123, 123, 238);
            margin-left: 4px;
        }
    }
</style>