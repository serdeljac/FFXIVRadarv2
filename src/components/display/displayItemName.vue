<template>
    <div class="itemName">

        <!-- Images -->
        <div v-if="node.job == 'miner' || node.job == 'botany' || node.job == 'fishing'">
            <img v-if="iconUrl" :src="iconUrl" :alt="item" class="itemName_icon" loading="lazy" />
            <span v-else class="itemName_icon itemName_icon--pending" aria-hidden="true"></span>
        </div>

        <div v-else>
            <iconImgAPI :name="node.job"/>
        </div>

        <!-- Text -->
        <p>
            {{ item }}
            <span v-if="node.level">
                {{ `- Lv. ${node.level} ${formatStars(node.stars)}` }}
            </span>
            <span class="itemAttr_label" v-if="hideAttr && node.attribute && node.attribute == 'Hidden'">
                [Hidden]
            </span>
        </p>
        
    </div>
</template>

<script lang="ts" setup>
    const props = defineProps<{ item: string, node: any, hideAttr?: boolean }>()
    import { ref, watch } from 'vue'
    import { fetchItemIconUrl } from '../../modules/itemIcon.ts'
    import iconImgAPI from '../../modules/FetchIconImage.vue'
    import {formatStars} from '../../hooks/hooks.ts'
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
        align-items: center;
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

        p {
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

</style>
