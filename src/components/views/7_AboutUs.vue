<template>
    <div :class="[`aboutUs body_content`, windowWidth]">
        <div class="body_content-group">
            <h1>~ About Us ~</h1>

                <div class="about">

                <p>
                    This site was created for two main purposes: to showcase my skills as a web developer without resorting to AI for builds, and to aid my fellow FFXIV players my creating an easier way to navigate Eorzea in a simpler form. I started playing FFXIV a year after the day it was launched, and been on/off until a few years ago. Now I am playing all the way to Dawntrail (soon Evercold upon release).
                </p>

                <div class="about_img">

                </div>

                <p>
                    This site was built from scratch using Vite/Vue and Typescript, and will continue to expand. Most data was not gathered via API’s, but rather collected manually through my playthroughs on an excel spreadsheet, then implemented into JSON code. With the help of some API’s (such as eorzea-weather and soon FFXIV API), I hope to create more detailed data that will continue to stay up to date with FFXIV updates and changes.
                </p>

                <div class="about_img">

                </div>

                <p>
                    Thank you for all the support from players who tested and gave me feedback on changes. There is still much more work to be done and will be ongoing. Please check the FFXIV Radar News section for the latest changes.
                </p>

                <p>Yours truly, the Almighty Viera 2026.</p>
            </div>
        </div>

    </div>
</template>

<script lang="ts">
    export default {
        name: "About Us",
        props: ['ffxivData', 'timerList', 'windowWidth', 'weatherList'],
    }
</script>