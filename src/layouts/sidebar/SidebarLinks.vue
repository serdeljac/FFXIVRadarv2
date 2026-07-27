<template>
    <nav aria-label="Main">
        <ul :class="[`linkList`, sidebarLayout]">
            <li v-for="a in linkList" :key="a.id">
                <router-link :to="a.href" :aria-label="a.name">

                    <div v-if="sidebarLayout == 'compact'" :class="['linkList-collapse']">
                        <routerIcon :name="a.iconName"/>
                    </div>

                    <div v-else :class="['linkList-extended']" >
                        <routerIcon :name="a.iconName"/>
                        <p>{{ a.displayName }}</p>
                    </div>

                </router-link>
            </li>
        </ul>
    </nav>
</template>

<script lang="ts" setup>
    defineProps(['sidebarLayout'])
    import routerIcon from './SidebarIcons.vue';
    import { linkList } from './SidebarLinks.ts'
</script>

<style scoped lang="scss">
    .linkList-extended :deep(.navIcon) {
        margin-right: 2px;
    }

    a:hover :deep(.navIcon),
    a.router-link-exact-active :deep(.navIcon) {
        color: $teal;
    }
</style>