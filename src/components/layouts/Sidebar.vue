<template>
    <aside aria-label="Sidebar">
        <!-- Clock Display -->
        <!-- <button>, not a <div>: this toggles the 12/24-hour format, so it has
             to be reachable and operable from the keyboard like any other control. -->
        <button
            type="button"
            v-if="sidebarLayout == 'compact'"
            :class="[`sidebar_clockdisplay collapsed`]"
            :aria-label="clockToggleLabel"
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
        </button>

        <button
            type="button"
            v-else
            :class="[`sidebar_clockdisplay extended`]"
            :aria-label="clockToggleLabel"
            @click="clockIs24Format = !clockIs24Format">
            <p>Eorzea Clock:</p>
            <h2 v-if="clockIs24Format">
                {{ `${eorzeaClock.display24Hr}:${clockMinute}` }}
            </h2>
            <h2 v-else>
                {{ `${eorzeaClock.display12Hr}:${clockMinute} ${eorzeaClock.display24Hr > 12 ? 'PM' : 'AM'}` }}
            </h2>
        </button>

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

const clockToggleLabel = computed(
    () => `Eorzea clock, switch to ${clockIs24Format.value ? '12' : '24'}-hour format`
)
</script>