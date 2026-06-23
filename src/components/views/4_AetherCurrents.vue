<template>
    <div :class="['aetherCurrents body_content', windowWidth]">

        <!-- Header -->
        <PageHeader :title="`Aether Currents`" :tagline="pageTagLine"/>

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

<script lang="ts" setup>
import { ref, computed } from 'vue'
import toggleFilterBtn from '../ui/buttons/toggleFilter.vue'
import toggleDetailsBtn from '../ui/buttons/toggleDetailMenu.vue'
import areaDisplay from '../ui/displayArea.vue'
import iconImgAPI from '../API/iconImg.vue'
import PageHeader from '../ui/displayPageHeader.vue'

const props = defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])
defineEmits(['openDetails'])

const filters = ref<[string, string, boolean][]>([])
const filterSelected = ref('')
const pageTagLine = "Aether Currents must be attuned before you can fly in each zone introduced from Heavensward onward. Each zone has a set of currents to collect — some are rewards from specific quests, while others are hidden out in the open world at fixed coordinates. This tracker lists every aether current quest and field current for each expansion zone, with the unlock requirements and location so you can get airborne as quickly as possible."

const isMobile = computed(() => props.windowWidth === 'mobile')
const isDesktop = computed(() => props.windowWidth !== 'mobile' && props.windowWidth !== 'tablet')

const allAetherNodes = computed<Record<string, any[]>>(() => {
    const aetherList: any[] = props.ffxivData.aethercurrents
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
})

const currentNodes = computed(() => allAetherNodes.value[filterSelected.value] ?? [])

function createFilterList() {
    const aetherList: any[] = props.ffxivData.aethercurrents
    const seen = new Set<string>()
    const list: [string, string, boolean][] = []
    for (const item of aetherList) {
        if (!seen.has(item.expansion)) {
            seen.add(item.expansion)
            list.push(['expansion', item.expansion, true])
        }
    }
    if (list.length > 0) {
        list[0][2] = false
        filterSelected.value = list[0][1]
    }
    filters.value = list
}

function changeFilter(arrayIndex: number) {
    for (const f of filters.value) { f[2] = true }
    filters.value[arrayIndex][2] = false
    filterSelected.value = filters.value[arrayIndex][1]
}

createFilterList()
</script>

<style scoped lang="scss">
    .aetherCurrents {
        .breakspace {
            margin-bottom: 2rem;
        }

        .rdrTable_row {
            grid-template-columns: 80px 300px 300px auto;
        }

        .rdrTable_row-quest,
        .rdrTable_row-unlock {
            display: flex;
            align-items: center;
        }

        .rdrTable_row-quest .hasContext {
            margin-right: 6px;
        }

        .rdrTable.tablet {
            .rdrTable_header,
            .rdrTable_split {
                display: none;
            }

            .rdrTable_row {
                grid-template-columns: 1fr 1fr;
            }

            .rdrTable_row-area {
                grid-column: 1 / span 2;
            }
        }

        .rdrTable.mobile {
            .rdrTable_header,
            .rdrTable_split {
                display: none;
            }

            .rdrTable_row {
                grid-template-columns: 1fr;
            }

            .rdrTable_row-no {
                display: none;
            }
        }
    }
</style>