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
            <p>&copy; 2023 FFXIV Radar. All rights reserved.</p>
        </footer>
    </aside>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import donateBtn from '../ui/buttons/donate.vue'
import sidebarLinks from './parts/sidebarLinks.vue'

const props = defineProps(['sidebarLayout', 'eorzeaClock'])

const clockIs24Format = ref(true)

const clockMinute = computed(() => {
    const m = props.eorzeaClock.displayMin
    return m < 10 ? `0${m}` : m
})
</script>