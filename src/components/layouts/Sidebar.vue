<template>
    <aside>
        <!-- Clock Display -->
        <div 
            v-if="sidebarLayout == 'compact'"
            :class="[`sidebar_clockdisplay collapsed`]" 
            @click="clockIs24Format = !clockIs24Format">
            <h2 v-if="clockIs24Format">
                {{ eorzeaClock.display24Hr }} <br/>
                {{ clockMinute }}
            </h2>
            <h2 v-else>
                {{ eorzeaClock.display12Hr }} <br/>
                {{ clockMinute }} <br />
                {{ eorzeaClock.display24Hr > 12 ? 'PM' : 'AM' }}
            </h2>
        </div>

        <div 
            v-else
            :class="[`sidebar_clockdisplay extended`]" 
            @click="clockIs24Format = !clockIs24Format">
            <p>Eorzea Clock:</p>
            <h2 v-if="clockIs24Format">
                {{ `${eorzeaClock.display24Hr}:${clockMinute}` }}
            </h2>
            <h2 v-else>
                {{ `${eorzeaClock.display12Hr}:${clockMinute} ${eorzeaClock.display24Hr > 12 ? 'PM' : 'AM'}` }}
            </h2>
        </div>

        <!-- List of Links -->
        <sidebarLinks :sidebarLayout="sidebarLayout"/>

        <!-- Footer -->
        <footer>
            <donateBtn :sidebarLayout="sidebarLayout"/>
            <p>&copy; 2023&ndash;{{ currentYear }} FFXIV Radar.<br/>Not affiliated with Square Enix.</p>
        </footer>
    </aside>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import donateBtn from '../ui/buttons/donate.vue'
import sidebarLinks from './parts/sidebarLinks.vue'
import { padNumber } from '../../hooks/hooks.ts'

const props = defineProps(['sidebarLayout', 'eorzeaClock'])

const clockIs24Format = ref(true)

const clockMinute = computed(() => padNumber(props.eorzeaClock.displayMin))
const currentYear = new Date().getFullYear()
</script>