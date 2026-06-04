<template>
    <div :class="[`iconAndText`, addClass, {'notext': !text}]" :chainNo="chainNo ? chainNo : null">
        <iconImgAPI :name="fetchIconName"/>
        <iconImgAPI v-if="secIcon" :name="secIcon"/>
        <p v-if="text">{{ text }}</p>
    </div>
</template>

<script lang="ts">
    import iconImgAPI from '../API/iconImg.vue';
    export default {
        name: "Icon & Text",
        props: ['icon', 'text', 'addClass', 'chainNo', 'secIcon'],
        components: {iconImgAPI},
        computed: {
            fetchIconName() {
                if (this.icon == 'Crafting') {return `sq_${this.icon}`}
                else if (this.icon == 'eliteHunts') {return 'hunts'}
                let toLowerCaseName = this.icon.toLowerCase()
                return toLowerCaseName
            },
            fetchOtherIconName() {
                if (this.secIcon == 'Crafting') {return `sq_${this.secIcon}`}
                else if (this.secIcon == 'eliteHunts') {return 'hunts'}
                let toLowerCaseName = this.secIcon.toLowerCase()
                return toLowerCaseName
            }
        },
    }
</script>

<style scoped lang="scss">
    .iconAndText {
        display: inline-flex;
        align-items: center;
        &.notext img {margin: 0}
        &.rewards {
            img {margin-right: 2px;}
            p {margin-right: 6px;}
        }

        &[chainno] {
            img {opacity: 0.7;}
            &::before {
                @extend .inheritChainNo;
            }
        }
    }
</style>