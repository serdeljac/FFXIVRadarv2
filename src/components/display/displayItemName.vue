<template>
    <div class="itemName">
        <img
            v-if="iconUrl && node.job != 'sightseeing'"
            :src="iconUrl"
            :alt="item"
            class="itemName_icon"
            loading="lazy" />
         <iconImgAPI v-else-if="node.job == 'sightseeing'" :name="node.job"/>
        <span v-else class="itemName_icon itemName_icon--pending" aria-hidden="true"></span>
        <!-- Reserves the icon's footprint while it resolves, so a table of rows
             doesn't shift sideways as each request lands. -->

        <span class="itemName_label">
            {{ item }}
        </span>
        <span class="itemName_label" v-if="node.job =='miner' || node.job == 'botany' || node.job == 'fishing'">
            {{ `- Lv. ${node.level} ${'★'.repeat(node.stars)}` }}
        </span>
        <span class="itemAttr_label" v-if="node.attribute && node.attribute == 'Hidden'">
            [Hidden]
        </span>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { fetchItemIconUrl } from '../../modules/itemIcon.ts'
import iconImgAPI from '../../modules/FetchIconImage.vue'

const props = defineProps<{ item: string, node: any }>()

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
            color: $fontColor !important;
        }
    }

</style>
