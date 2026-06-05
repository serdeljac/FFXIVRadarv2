<template>
    <div :class="[`radarNews body_content`, windowWidth]">

        <!-- Title -->
        <div class="body_content-group title">
            <h1>~ FFXIV Radar News ~</h1>
        </div>

        <!-- This will eventually be grabbed from a server -->
        <div class="body_content-group">
            <div class="bulleton">

                <div class="bulleton_profileImg">
                    <img :src="getIconImageURL('profile')"/>
                </div>
                <div class="bulleton_content">
                    <h2>V1.1 - Updated Sightseeing/Fate data</h2>
                    <p class="bulleton_postdate">Posted: May 2, 2026 @ 14:22 PST</p>
                    <hr />
                    <div class="bulleton_details">
                        <ol class="bulleton_list-tier1">
                            <li>
                                <p>Added sightseeing log data for A Realm Reborn #14-20 and #44-80</p>
                                <ul class="bulleton_list-tier2">
                                    <li>Notes are added</li>
                                    <li>Fixed 'Mount Required'</li>
                                    <li>Added preview and full size images</li>
                                </ul>
                            </li>
                            <li>
                                <p>Added proper icon locations on the map for fates</p>
                                <ul class="bulleton_list-tier2">
                                    <li>Added proper icon placement data</li>
                                    <li>Changed coordinates to more accurate locations</li>
                                </ul>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>

            <div class="bulleton">
                <div class="bulleton_profileImg">
                    <img :src="getIconImageURL('profile')"/>
                </div>
                <div class="bulleton_content">
                    <h2>v1.0 - Site has officially been launched!</h2>
                    <p class="bulleton_postdate">Posted: May 1, 2026 @ 16:43 PST</p>
                </div>
            </div>
        </div>

    </div>
</template>

<script lang="ts" setup>
    function getIconImageURL(name: string) {
        return new URL(`/src/assets/${name}.jpg`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Radar News",
        props: ['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'],
    }
</script>