<template>
    <div class="aethercurrents">
        <promotionBanner length="wide"/>
        
        <div class="filterbar">
            <div class="filterbar_group group1">
                <buttonFilter 
                    v-for="(d, index) in filters" :key="d[1]" 
                    :name="`${d[1]}`" 
                    :disabled="d[2]"
                    @click="changeFilter(index)"/>
            </div>
        </div>

        <div class="body_content">
            <ul class="rdrTable header">
                <li>
                    <p>Icon</p>
                    <p>Location</p>
                    <p>Quest</p>
                    <p>Unlock Requirement</p>
                </li>
            </ul>

            <hr class="rdrTable split"/>

            <ul :class="[`rdrTable body`]">
                <li v-for="d in allAetherNodes[filterSelected]" :key="d.ID" :class="[d.specialClass]">

                    <!-- ICON -->
                    <div>
                        <img :src="`/src/assets/icons/${d.name ? 'currentquest' : 'current'}.webp`" />
                    </div>

                    <!-- AREA -->
                    <div>
                        <displayAreaText class="areaname" :areaObj="d" :excludeBackground="true" @click="$emit('sendToDetails', d)"/>
                    </div>

                    <!-- QUEST NAME -->
                    <div>
                        <iconAndText v-if="d.name" :icon="`quest_${d.name_type}`" :text="`${d.name} - Lv.${d.name_level}`"/>
                    </div>

                    <!-- UNLOCK CONDITION -->
                    <div>
                        <iconAndText v-if="d.unlock" :icon="`quest_${d.unlock_type}`" :text="`${d.unlock} - Lv.${d.unlock_level}`"/>
                    </div>
                </li>
            </ul>
        </div>

    </div>
</template>

<script lang="ts">
import promotionBanner from '../layouts/PromotionBanner.vue';
import displayAreaText from '../ui/displayAreaText.vue';
import buttonFilter from '../ui/ButtonFilter.vue';
import iconAndText from '../ui/iconAndText.vue';

    export default {
        name: "Aether Currents",
        props: ['ffxivData', 'timerList', 'windowWidth'],
        emits: ['changeTracked', 'sendToDetails'],
        components: {promotionBanner, displayAreaText, buttonFilter, iconAndText},
        data() {
            return {
                filters: [] as any, //[Group, Name, State]
                filterSelected: '' as string,
                allAetherNodes: {} as any
            }
        },
        created() {
            this.createFilterList() //Run Once
            this.groupAethercurrentsByExpansion() //Run Once
        },
        methods: {
            createFilterList() {
                //Search for all Expansion names within Sightseeing Logs
                const expansionList = this.ffxivData.aethercurrents.filter((obj: any, index: any) => 
                    index === this.ffxivData.aethercurrents.findIndex((o: any) => obj.expansion === o.expansion)
                );

                //Append and set default filter list
                for (const d in expansionList) {
                    this.filters[d] = ['expansion', expansionList[d].expansion, true]
                }

                //Set default filter value
                this.filters[0][2] = false
                this.filterSelected = this.filters[0][1]
            },
            changeFilter(arrayIndex: any) {
                //Set all values to Disabled
                for (const d in this.filters) {this.filters[d][2] = true}

                //Set new filter to enable
                this.filters[arrayIndex][2] = false
                this.filterSelected = this.filters[arrayIndex][1]
            },
            groupAethercurrentsByExpansion() {
                let aetherList = this.ffxivData.aethercurrents

                //Create list of each Expansion name
                const expansionList = aetherList.filter((obj: any, index: any) => 
                    index === aetherList.findIndex((o: any) => obj.expansion === o.expansion)
                );

                let objWithExpansions: any = {}
                for (const d in expansionList) {
                    let filtered = aetherList.filter((o: any) => o.expansion == expansionList[d].expansion)
                    objWithExpansions[expansionList[d].expansion] = filtered
                }
                this.allAetherNodes = objWithExpansions
            },
        }
    }
</script>

<style scoped lang="scss">
    .rdrTable li {grid-template-columns: 80px auto 400px 400px;}
    .breakspace {margin-bottom: 2rem;}
</style>