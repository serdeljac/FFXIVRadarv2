<template>
    <div :class="[`iconAndText`]">
        <iconImgAPI :name="iconName.toLowerCase()"/>
        <p v-if="text">{{ text }}</p>
    </div>
</template>

<script lang="ts" setup>
    const props = defineProps(['iconName', 'text'])
    import iconImgAPI from '../../modules/FetchIconImage.vue'
</script>

<style scoped lang="scss">
    .iconAndText {
        display: inline-flex;
        align-items: center;
        p {
            margin-left: 6px;
            transform: translateY(1px);
            font-size: 1rem;
        }
    }
</style>