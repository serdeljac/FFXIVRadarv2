<template>
    <div class="itemName">

        <!-- Image -->
        <iconImgAPI v-if="requested == 'name'" :name="`quest_${node.name_type}`" />
        <iconImgAPI v-else-if="requested == 'unlock'" :name="`quest_${node.unlock_type}`" />
        <iconImgAPI v-else :name="'current'" />

        <!-- Text -->
        <p v-if="requested == 'name'">{{ `${node.name} - Lv. ${node.name_level}` }}</p>
        <p v-else-if="requested == 'unlock'">{{ `${node.unlock} - Lv. ${node.unlock_level}` }}</p>
        <p v-else>{{ `#${node.no} Aether Current` }}</p>
        
    </div>
</template>

<script lang="ts" setup>
    const props = defineProps<{ node: any, requested?: string}>()
    import iconImgAPI from '../../modules/FetchIconImage.vue'
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
