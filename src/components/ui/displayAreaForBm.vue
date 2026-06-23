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
import iconImgAPI from '../API/iconImg.vue'

defineProps(['bmData'])

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
        color: rgb(123, 123, 238);
        margin-left: 4px;
    }
</style>