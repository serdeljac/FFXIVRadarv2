<template>
    <svg class="navIcon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <g v-if="name === 'eorzeamap'">
            <path fill-rule="evenodd"
                d="M6 13 L22 13 L17 22 L1 22 Z
                   M7.1 13.9 L19.9 13.9 L15.9 21.1 L3.1 21.1 Z" />
            <path fill-rule="evenodd"
                d="M17 8 A5 5 0 1 0 7 8 A5 5 0 1 0 17 8 Z
                   M14.3 8 A2.3 2.3 0 1 0 9.7 8 A2.3 2.3 0 1 0 14.3 8 Z" />
            <path d="M8 11 L16 11 L12 15 Z" />
        </g>

        <path v-else-if="name === 'gathering'"
            d="M6 3 L18 3 L12 12 L18 21 L6 21 L12 12 Z" />

        <path v-else-if="name === 'sightseeing'" fill-rule="evenodd"
            d="M9 5 L15 5 L15 8 L22 8 L22 20 L2 20 L2 8 L9 8 Z
               M16.5 14 A4.5 4.5 0 1 0 7.5 14 A4.5 4.5 0 1 0 16.5 14 Z" />

        <path v-else-if="name === 'aethercurrents'" fill-rule="evenodd"
            d="M12 2 L20 12 L12 22 L4 12 Z
               M4 11.5 H20 V12.5 H4 Z
               M11.5 2 H12.5 V22 H11.5 Z" />

        <g v-else-if="name === 'bluemage'">
            <path fill-rule="evenodd"
                d="M11 12 A4 4 0 1 0 3 12 A4 4 0 1 0 11 12 Z
                   M8.8 12 A1.8 1.8 0 1 0 5.2 12 A1.8 1.8 0 1 0 8.8 12 Z" />
            <path fill-rule="evenodd"
                d="M21 12 A4 4 0 1 0 13 12 A4 4 0 1 0 21 12 Z
                   M18.8 12 A1.8 1.8 0 1 0 15.2 12 A1.8 1.8 0 1 0 18.8 12 Z" />
            <rect x="7" y="10.5" width="10" height="3" />
        </g>

        <path v-else-if="name === 'news'" fill-rule="evenodd"
            d="M4 3 H20 V21 H4 Z
               M7 7 H17 V8.2 H7 Z
               M7 10.5 H17 V11.7 H7 Z
               M7 14 H14 V15.2 H7 Z
               M7 17.5 H17 V18.7 H7 Z" />

        <path v-else-if="name === 'about'" fill-rule="evenodd"
            d="M22 12 A10 10 0 1 0 2 12 A10 10 0 1 0 22 12 Z
               M13.2 7.5 A1.4 1.4 0 1 0 10.4 7.5 A1.4 1.4 0 1 0 13.2 7.5 Z
               M10.8 10 H13.2 V17.5 H10.8 Z" />

        <path v-else-if="name === 'privatepolicy'"
            d="M4 5 L12 2 L20 5 L20 11 C20 17 16 20.5 12 22 C8 20.5 4 17 4 11 Z" />
    </svg>
</template>

<script lang="ts" setup>
defineProps<{ name: string }>()
</script>

<style scoped lang="scss">
.navIcon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: $dim;
    transition: color 0.15s ease;
}
</style>
