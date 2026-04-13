<template>
    <div>
        <promotionBanner length="wide"/>

        <div class="filterbar">
            <div v-for="(d, index) in filters" :key="d[1]">
                <buttonFilter 
                    :name="d[1]" 
                    :disabled="!d[2]"
                    @click="changeFilter(index)"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import displayAreaText from '../ui/displayAreaText.vue';
import buttonFilter from '../ui/ButtonFilter.vue';
import seachBar from '../ui/searchBar.vue';

    export default {
        name: "Blue Mage Abilities",
        components: {promotionBanner, displayAreaText, buttonFilter, seachBar},
        props: ['ffxivData', 'timerList', 'windowWidth'],
        emits: ['changeTracked', 'sendToDetails'],
        data() {
            return {
                filters: [] as any, //[Group, Name, State]
                filterSelected: '' as string,
            }
        },
        created() {
            this.createFilterList() //Run Once
        },
        methods: {
            createFilterList() {
                this.filters = this.ffxivData.bluemageFilters
            },
            changeFilter(arrayIndex: any) {
               //Set all values to Disabled
                for (const d in this.filters) {this.filters[d][2] = true}

                //Set new filter to enable
                this.filters[arrayIndex][2] = false
                this.filterSelected = this.filters[arrayIndex][1]
            }
        }
    }
</script>

<style scoped lang="scss">

</style>