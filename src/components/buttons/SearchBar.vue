<template>
    <!-- The label is visually hidden but present: a placeholder is not an
         accessible name, and it disappears as soon as the user types. -->
    <label class="visuallyHidden" :for="inputId">{{ label }}</label>
    <input
        :id="inputId"
        type="search"
        :value="modelValue"
        @input="inputValue"
        :placeholder="placeholder" />
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
    modelValue?: string
    label?: string
    placeholder?: string
    /** Opt-in only. Autofocusing on mount stole focus on every page visit and
     *  popped the on-screen keyboard on mobile. */
    autofocus?: boolean
}>(), {
    label: 'Search by name',
    placeholder: 'Search...',
})

const emit = defineEmits(['selected'])

// Was a hardcoded id="searchBox" — duplicated if two bars ever render together,
// which would silently break the label association.
const inputId = `searchBox-${Math.random().toString(36).slice(2, 9)}`

function inputValue(event: Event) {
    emit('selected', (event.target as HTMLInputElement).value)
}
</script>

<style scoped lang="scss">
    input[type=search] {
        // Was min-width: 300px, which overflowed the filter bar on a 375px screen.
        width: 100%;
        max-width: 300px;
        margin: 10px 0.5rem;
        border: 1px solid $buttonBackgroundColor;
        border-radius: $borderRadius;
        padding: 0.5rem 1rem;
        background-color: $bodyBackgroundColor;
        color: $fontColor;
        height: 40px;
    }
</style>