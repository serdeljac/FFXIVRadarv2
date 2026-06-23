<template>
    <input id="searchBox" ref="searchBox" type="text" :value="modelValue" @input="inputValue" placeholder="Search..." />
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'

defineProps(['modelValue'])
const emit = defineEmits(['selected'])

const searchBox = ref<HTMLInputElement | null>(null)

function inputValue(event: Event) {
    emit('selected', (event.target as HTMLInputElement).value)
}

onMounted(() => searchBox.value?.focus())
</script>

<style scoped lang="scss">
    input[type=text] {
        min-width: 300px;
        margin: 10px 0.5rem;
        border: 1px solid $buttonBackgroundColor;
        border-radius: $borderRadius;
        padding: 0.5rem 1rem;
        background-color: $bodyBackgroundColor;
        color: $fontColor;
        height: 40px;
    }
</style>