<template>
    <div :class="[`iconAndText`, addClass, {'notext': !text}]" :chainNo="chainNo ? chainNo : null">
        <iconImgAPI :name="fetchIconName"/>
        <iconImgAPI v-if="secIcon" :name="secIcon"/>
        <p v-if="text">{{ text }}</p>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import iconImgAPI from '../API/iconImg.vue'

const props = defineProps(['icon', 'text', 'addClass', 'chainNo', 'secIcon'])

const fetchIconName = computed(() => {
    if (props.icon == 'Crafting') return `sq_${props.icon}`
    if (props.icon == 'eliteHunts') return 'hunts'
    return props.icon.toLowerCase()
})
</script>

<style scoped lang="scss">
    .iconAndText {
        display: inline-flex;
        align-items: center;
        &.notext img {margin: 0}
        &.rewards {
            img {margin-right: 2px;}
            p {margin-right: 6px;}
        }

        &[chainno] {
            img {opacity: 0.7;}
            &::before {
                @extend %inheritChainNo;
            }
        }
    }
</style>