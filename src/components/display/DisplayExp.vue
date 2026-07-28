<template>
    <div :class="[`iconAndText`, type]">
        <p>{{ text }}</p>
        <iconImgAPI :name="iconName"/>
    </div>
</template>

<script lang="ts" setup>
    const props = defineProps(['iconName', 'text', 'type'])
    import iconImgAPI from '../../modules/FetchIconImage.vue'
</script>

<style scoped lang="scss">
    .iconAndText {
        display: inline-flex;
        align-items: center;
        margin: 0px 4px 0 6px;
        transform: translateY(-2px);
        img {margin: 0;}
        p {
            transform: translateY(1px);
            font-size: 1rem;
        }
        &.exp p {color: orange}
    }
</style>