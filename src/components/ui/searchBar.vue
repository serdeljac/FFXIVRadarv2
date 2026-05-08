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
        margin: 10px 10px;
        border: 1px solid $borderColor;
        border-radius: $borderRadius;
        padding: 0.5rem 1rem;
        background-color: $bodyBackgroundColor;
        color: $fontColor;
    }

</style>