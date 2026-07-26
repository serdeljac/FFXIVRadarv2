<template>
    <div class="itemName">
        <img
            v-if="iconUrl"
            :src="iconUrl"
            :alt="item"
            class="itemName_icon"
            loading="lazy" />
        <!-- Reserves the icon's footprint while it resolves, so a table of rows
             doesn't shift sideways as each request lands. -->
        <span v-else class="itemName_icon itemName_icon--pending" aria-hidden="true"></span>

        <span class="itemName_label">{{ item }}</span>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { fetchItemIconUrl } from '../api/itemIcon.ts'

const props = defineProps<{ item: string }>()

const iconUrl = ref<string | null>(null)

watch(
    () => props.item,
    async (name) => {
        iconUrl.value = null
        if (!name) return

        const resolved = await fetchItemIconUrl(name)
        // Guard against a slow response landing after the prop already moved on.
        if (props.item === name) iconUrl.value = resolved
    },
    { immediate: true }
)
</script>

<style scoped lang="scss">
    .itemName {
        display: inline-flex;
        align-items: flex-end;
        gap: 8px;
        min-width: 0;

        &_icon {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            object-fit: contain;
            color: $fontColor;
            filter: drop-shadow(0 0 1px #000);

            &--pending {
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.04);
                filter: none;
            }
        }

        &_label {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
</style>
