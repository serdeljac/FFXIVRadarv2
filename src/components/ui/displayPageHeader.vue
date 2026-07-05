<template>
    <header class="pageHeader">
        <div class="pageHeader_titleRow">
            <h1 class="pageHeader_title">
                <navIcon v-if="icon" :name="icon" class="pageHeader_icon"/>{{ title.split(' ', 2)[0] }} <span class="accent">{{ fixtitle(title) }}</span>
            </h1>
        </div>
        <p class="pageHeader_tagline">
            {{ tagline }}
        </p>
        <div class="pageHeader_divider"></div>
    </header>
</template>

<script lang="ts">
    import navIcon from './navIcon.vue'

    export default {
        name: "Page Header",
        props: ['title', 'tagline', 'icon'],
        components: { navIcon },
        methods: {
            fixtitle(text: string) {
                let firstSec = text.split(' ', 2)[0]
                let secondSec = text.split(firstSec, 2)[1]
                return secondSec
            }
        }
    }
</script>

<style scoped lang="scss">
    .pageHeader {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        text-align: center;
        width: 100%;

        &_titleRow {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        &_title {
            font-family: 'Cinzel', serif;
            font-size: clamp(1.6rem, 4vw, 2.2rem);
            font-weight: 700;
            letter-spacing: 0.05em;
            color: #e8f0ff;
            margin: 0;

            :deep(.navIcon) {
                width: 1em;
                height: 1em;
                color: $teal;
                vertical-align: -0.12em;
                margin-right: 0.25em;
                flex-shrink: 0;
            }
        }

        .accent {
            color: $teal;
            text-shadow: 0 0 24px $tealShadow;
        }

        &_tagline {
            font-family: 'Share Tech Mono', monospace;
            letter-spacing: 0.13em;
            text-transform: uppercase;
        }

        &_divider {
            width: 180px; height: 1px; margin-top: 4px;
            background: linear-gradient(90deg, transparent, $teal, transparent);
            opacity: 0.4;
        }
    }

</style>