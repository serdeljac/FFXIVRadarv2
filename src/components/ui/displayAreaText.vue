<template>
    <p>
        {{ `${areaObj.area.area}` }}
        <span>{{ `(x${areaObj.x}, y${areaObj.y})` }}</span>
    </p>
</template>

<script>
    export default {
        name: "Display Area in Text",
        props: ['areaObj']
    }
</script>

<style scoped lang="scss">
    p {
        display:inline-flex;
        align-items: center;
        span {
            color: rgb(91, 91, 221);
            margin-left: 4px;
        }
    }
</style>