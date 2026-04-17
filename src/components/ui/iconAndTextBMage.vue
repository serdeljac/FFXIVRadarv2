<template>
    <div class="iconToText">
        <img class="iconSize" :src="getIconImageURL(bmData)"/>
        <p>
            {{ bmData[2][0] }}
            <span v-if="bmData[2][1]" class="cord">{{ `(x${bmData[2][1]}, y${bmData[2][2]})` }}</span>
        </p>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(data: any) {
        if (data[1]) {
            return new URL(`/src/assets/icons/sq_${data[1]}.webp`, import.meta.url).href
        }
        return new URL(`/src/assets/icons/sq_${data[0]}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Icon & Text Blue Mage",
        props: ['bmData'],
    }
</script>

<style scoped lang="scss">
    .iconToText {
        display: inline-flex;
        align-items: center;
    }

    .cord {
        color: rgb(123, 123, 238);
        margin-left: 4px;
    }
</style>