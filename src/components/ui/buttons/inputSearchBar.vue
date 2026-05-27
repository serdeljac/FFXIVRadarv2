<template>
    <input id="searchBox" ref="searchBox" type="text" :value="modelValue" @input="inputValue" placeholder="Search..." />
</template>

<script lang="ts">
    export default {
        name: "Filter Search",
        props: ['modelValue'],
        emits: ['selected'],
        methods: {
            inputValue(event: any) {
                this.$emit('selected', event.target.value);
            },
        },
        mounted() {
            (this.$refs.searchBox as HTMLInputElement).focus()
        },
    }
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