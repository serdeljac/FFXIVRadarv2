<template>
    <div class="displayArea">
        <iconImgAPI v-if="areaIcon" :name="areaIcon"/>
        <p>
            {{ areaLabel }}
            <span class="cord">{{ `(x${node.x}, y${node.y})` }}</span>
        </p>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import iconImgAPI from '../API/iconImg.vue'
import { formatAreaLabel } from '../../hooks/hooks.ts'

const props = defineProps(['node'])

const areaLabel = computed(() => formatAreaLabel(props.node.area))
// Bare spot names (fishing holes absent from areas.json) carry no expansion icon.
const areaIcon = computed(() => props.node.area?.icon ?? '')
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