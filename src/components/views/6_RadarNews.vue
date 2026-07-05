<template>
    <div :class="[`radarNews body_content`, windowWidth]">

        <!-- Header -->
        <PageHeader :title="`FFXIV Radar News`" :tagline="pageTagLine" icon="news"/>

        <!-- This will eventually be grabbed from a server -->
        <div class="body_content-group">

            <div class="bulleton">
                <div class="bulleton_profileImg">
                    <img :src="getIconImageURL('profile')"/>
                </div>
                <div class="bulleton_content">
                    <h2>v1.0 - Site has officially been launched!</h2>
                    <p class="bulleton_postdate">Posted: June 12, 2026 @ 18:38 PST</p>
                    <hr />
                    <div class="bulleton_details">
                        <ol class="bulleton_list-tier2">
                            <li>
                                <p>Welcome to FFXIV Radar. Please note some is still missing (ie Vista Images and Proper Fate Locations)</p>
                            </li>
                            <li>
                                <p>There will be more updated coming soon and will also include the new expansion: Evercold!</p>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script lang="ts" setup>
import PageHeader from '../ui/displayPageHeader.vue'

defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])

const pageTagLine = ''

function getIconImageURL(name: string) {
    return new URL(`/src/assets/${name}.jpg`, import.meta.url).href
}
</script>

<style scoped lang="scss">
    .radarNews {
        &.mobile {
            .bulleton {
                grid-template-columns: auto;
            }

            .bulleton_profileImg {
                display: none;
            }
        }

        .title {
            width: 100%;
            text-align: center;
        }

        .bulleton {
            max-width: 800px;
            min-width: 300px;
            margin: 40px auto;
            background-color: $listBackgroundColorHover;
            padding: 1rem 2rem;
            border-radius: $borderRadius;
            display: grid;
            gap: 10px;
            grid-template-columns: 0.5fr 1.5fr;
            align-items: center;
            box-shadow: rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px;

            &_postdate {
                opacity: 0.7;
                font-style: italic;
            }

            hr {
                margin: 0.5rem 10px;
            }

            &_details {
                padding: 0 20px;
            }

            li {
                margin-bottom: 8px;
            }

            .bulleton_list-tier1 > li {
                list-style-type: decimal;
                margin-bottom: 0.5rem;
            }

            .bulleton_list-tier2 > li {
                list-style-type: circle;
            }
        }
    }
</style>