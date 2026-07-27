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
    defineProps(['bmData'])
    import iconImgAPI from '../../modules/FetchIconImage.vue'
    function getIconImageURL(data: any) {
        return data[1] ? `sq_${data[1]}` : `sq_${data[0]}`
    }
</script>

<style scoped lang="scss">
    .iconToText {
        display: inline-flex;
        align-items: center;
    }

    .cord {
        color: $teal;
        margin-left: 4px;
    }
</style>