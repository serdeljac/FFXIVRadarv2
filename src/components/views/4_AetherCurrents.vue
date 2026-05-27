<template>
    <div :class="[`aetherCurrents body_content`, windowWidth]">
        
        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <toggleFilterBtn 
                    v-for="(d, index) in filters" :key="d[1]" 
                    :name="d[1]"
                    :icon="d[1]" 
                    :enabled="!d[2] ? true : null"
                    @click="changeFilter(index)"/>

            </div>
        </div>

        <!-- Table -->
        <div :class="[`body_content-group rdrTable`, windowWidth]">

            <ul class="rdrTable_header">
                <li class="rdrTable_row">
                    <p class="rdrTable_row-tracking"></p>
                    <p class="rdrTable_row-quest">Quest</p>
                    <p class="rdrTable_row-unlock">Unlock Requirement</p>
                    <p class="rdrTable_row-area">Location</p>
                </li>
            </ul>

            <hr class="rdrTable_split"/>

            <ul :class="[`rdrTable_body`]">
                <li v-for="d in allAetherNodes[filterSelected]" :key="d.ID" 
                :class="[`rdrTable_row`, d.specialClass]">

                    <!-- ICON -->
                    <div class="rdrTable_row-tracking" v-if="windowWidth != 'mobile' && windowWidth != 'tablet'">
                        <toggleDetailsBtn  
                            @click="$emit('openDetails', d)"
                            class="hasContext"
                            :data-context="`View Details`"/>
                    </div>

                    <!-- QUEST NAME -->
                    <div class="rdrTable_row-quest">
                        <toggleDetailsBtn  
                            v-if="windowWidth == 'mobile' || windowWidth == 'tablet'"
                            @click="$emit('openDetails', d)"
                            class="hasContext"
                            :data-context="`View Details`"/>

                        <img v-if="d.name" class="iconSize" :src="getIconImageURL(`quest_${d.name_type}`)" />
                        <p v-if="d.name">{{ `${d.name} - Lv.${d.name_level}` }}</p>
                        <p v-else>{{ `Aether Current #${d.no}` }}</p>
                    </div>

                    <!-- UNLOCK CONDITION -->
                    <div class="rdrTable_row-unlock" v-if="windowWidth != 'mobile' || d.unlock">
                        <img v-if="d.unlock" class="iconSize" :src="getIconImageURL(`quest_${d.unlock_type}`)" />
                        <p v-if="d.unlock">{{ `${d.unlock} - Lv.${d.unlock_level}` }}</p>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <areaDisplay :node="d"/>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
    import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
    import areaDisplay from '../ui/displayArea.vue'

    export default {
        name: "Aether Currents",
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['openDetails'],
        components: {toggleFilterBtn, toggleDetailsBtn, areaDisplay},
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