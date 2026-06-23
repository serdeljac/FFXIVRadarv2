<template>
    <button :class="[`btn`]" :disabled="disabled" :enabled="enabled">
        {{ name }}
    </button>
</template>

<script lang="ts" setup>
defineProps(['name', 'disabled', 'enabled'])
</script>

<style scoped lang="scss">
    .btn {
        border: 1px solid $buttonBackgroundColor;
        background-color: $bodyBackgroundColor;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0 0.5rem;
        transition: background-color transform box-shadow 0.1s linear;
        border-radius: $borderRadius;
        height: 40px;
        font-weight: bold;
        margin: 10px 0.5rem;
        &[enabled] {background-color: $buttonBackgroundColor;}
        &[disabled] {
            opacity: 0.1;
            cursor: not-allowed;
        }
        &:hover:not([disabled]) {
            background-color: $buttonBackgroundColor;
            box-shadow: inset 0.4px 1px 4px $buttonBackgroundColorHover,
                0px 0px 3px $buttonBackgroundColorHover;
            transform: scale(1.05);
        }
    }
</style>