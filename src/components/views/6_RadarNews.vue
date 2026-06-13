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