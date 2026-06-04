<template>
    <div :class="['aetherCurrents body_content', windowWidth]">

        <!-- Filter Bar -->
        <div class="body_content-group filterbar">
            <div class="wrapper">
                <toggleFilterBtn
                    v-for="([, name, disabled], index) in filters"
                    :key="name"
                    :name="name"
                    :icon="name"
                    :enabled="disabled ? null : true"
                    @click="changeFilter(index)"
                />
            </div>
        </div>

        <!-- Table -->
        <div :class="['body_content-group rdrTable', windowWidth]">

            <ul class="rdrTable_header">
                <li class="rdrTable_row">
                    <p class="rdrTable_row-tracking"></p>
                    <p class="rdrTable_row-quest">Quest</p>
                    <p class="rdrTable_row-unlock">Unlock Requirement</p>
                    <p class="rdrTable_row-area">Location</p>
                </li>
            </ul>

            <hr class="rdrTable_split"/>

            <ul class="rdrTable_body">
                <li
                    v-for="d in currentNodes"
                    :key="d.ID"
                    :class="['rdrTable_row', d.specialClass]"
                >
                    <!-- ICON (desktop only) -->
                    <div v-if="isDesktop" class="rdrTable_row-tracking">
                        <toggleDetailsBtn
                            class="hasContext"
                            data-context="View Details"
                            @click="$emit('openDetails', d)"
                        />
                    </div>

                    <!-- QUEST NAME -->
                    <div class="rdrTable_row-quest">
                        <toggleDetailsBtn
                            v-if="!isDesktop"
                            class="hasContext"
                            data-context="View Details"
                            @click="$emit('openDetails', d)"
                        />
                        <iconImgAPI v-if="d.name" :name="`quest_${d.name_type}`"/>
                        <p>{{ d.name ? `${d.name} - Lv.${d.name_level}` : `Aether Current #${d.no}` }}</p>
                    </div>

                    <!-- UNLOCK CONDITION -->
                    <div v-if="!isMobile || d.unlock" class="rdrTable_row-unlock">
                        <iconImgAPI v-if="d.unlock" :name="`quest_${d.unlock_type}`"/>
                        <p v-if="d.unlock">{{ `${d.unlock} - Lv.${d.unlock_level}` }}</p>
                    </div>

                    <!-- AREA -->
                    <div class="rdrTable_row-area">
                        <areaDisplay :node="d" />
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script lang="ts">
    import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
    import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
    import areaDisplay from '../ui/displayArea.vue'
    import iconImgAPI from '../API/iconImg.vue';

    export default {
        name: 'AetherCurrents',
        components: { toggleFilterBtn, toggleDetailsBtn, areaDisplay, iconImgAPI },
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
        emits: ['openDetails'],
        data() {
            return {
                filters: [] as [string, string, boolean][],
                filterSelected: '' as string,
            }
        },
        computed: {
            isMobile(): boolean {
                return this.windowWidth === 'mobile'
            },
            isDesktop(): boolean {
                return this.windowWidth !== 'mobile' && this.windowWidth !== 'tablet'
            },
            allAetherNodes(): Record<string, any[]> {
                const aetherList: any[] = this.ffxivData.aethercurrents
                const seen = new Set<string>()
                const result: Record<string, any[]> = {}
                for (const item of aetherList) {
                    if (!seen.has(item.expansion)) {
                        seen.add(item.expansion)
                        result[item.expansion] = []
                    }
                    result[item.expansion].push(item)
                }
                return result
            },
            currentNodes(): any[] {
                return this.allAetherNodes[this.filterSelected] ?? []
            },
        },
        created() {
            this.createFilterList()
        },
        methods: {
            createFilterList() {
                const aetherList: any[] = this.ffxivData.aethercurrents
                const seen = new Set<string>()
                const filters: [string, string, boolean][] = []
                for (const item of aetherList) {
                    if (!seen.has(item.expansion)) {
                        seen.add(item.expansion)
                        filters.push(['expansion', item.expansion, true])
                    }
                }
                if (filters.length > 0) {
                    filters[0][2] = false
                    this.filterSelected = filters[0][1]
                }
                this.filters = filters
            },
            changeFilter(arrayIndex: number) {
                for (const f of this.filters) { f[2] = true }
                this.filters[arrayIndex][2] = false
                this.filterSelected = this.filters[arrayIndex][1]
            },
        },
    }
</script>