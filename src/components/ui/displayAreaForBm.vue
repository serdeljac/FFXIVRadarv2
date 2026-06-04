<template>
    <div class="iconToText">
        <iconImgAPI :name="getIconImageURL(bmData)"/>
        <p>
            {{ bmData[2][0] }}
            <span v-if="bmData[2][1]" class="cord">{{ `(x${bmData[2][1]}, y${bmData[2][2]})` }}</span>
        </p>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(data: any) {
        const name = data[1] ? `sq_${data[1]}` : `sq_${data[0]}`
        return name
    }

</script>

<script lang="ts">
    import iconImgAPI from '../API/iconImg.vue';
    export default {
        name: "Icon & Text Blue Mage",
        props: ['bmData'],
        components: {iconImgAPI}
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