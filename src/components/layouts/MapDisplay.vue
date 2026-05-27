<template>
    <div class="mapDisplay" :style="`width: ${mapSize}px; height: ${mapSize}px`">
        <div class="mapDisplay_background" id="ffmap" :style="` transform: scale(${mapSize / 800})`"></div>

        <div class="mapDisplay_overlay" :style="`transform: scale(${mapSize / 800})`">
            <div v-for="d in getAetheyteNodes" :key="d.ID"
                class="mapIcon aetheryte"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job, 'aetheryte')" />
            </div>

            <div v-for="d in getUnchainedNodes" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="d.node_code == focusNode.node_code ? true : null"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>

            <div v-for="d in getChainedNodes" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="d.chain_set == focusNode.chain_set ? true : null"
                :data-chainNo="d.chain_no"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>

            <div v-for="d in getHuntNodes" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="checkRank(d.ranks)"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job, d.ranks)" />
            </div>

        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImg(jobName: string, subJob: string) {
        let name: string = subJob
        if (jobName == 'fates') {name = `fate_${subJob}`}
        if (jobName == 'eliteHunts') {name = subJob == 'SS' ? 'hunts_ss' : `hunts`}
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    import axios from "axios";

    export default {
        name: 'Eorzea Map',
        props: ['ffxivData', 'focusNode', 'singleOnly', 'mapSize'],
        computed: {
            getAetheyteNodes() {
                let f = this.focusNode
                let results = this.ffxivData.aetheryte.filter((o: any) => o.zone == f.area.zone)
                return results
            },
            getUnchainedNodes() {
                let f = this.focusNode
                if (f.job == 'eliteHunts') {return []}
                let results = this.ffxivData[f.job].filter((o: any) => o.area.zone == f.area.zone && !o.chain_set)
                return results
            },
            getChainedNodes() {
                let f = this.focusNode
                if (f.job == 'eliteHunts') {return []}
                let results = this.ffxivData[f.job].filter((o: any) => o.area.zone == f.area.zone && o.chain_set)
                return results
            },
            getHuntNodes() {
                let f = this.focusNode
                if (f.job != 'eliteHunts') {return []}
                let results = this.ffxivData[f.job].filter((o: any) => o.area.zone == f.area.zone).map((o: any) => o.points).flat()

                let allPoints = results.filter((obj: any, index: any) => 
                    index === results.findIndex((o: any) => obj.transx === o.transx && obj.transy === o.transy)
                );

                for (const d in allPoints) {
                    allPoints[d]['job'] = 'eliteHunts'
                    allPoints[d]['job_sub'] = this.ffxivData.eliteHunts.find((o: any) => o.points.includes(allPoints[d])).rank
                }
                return allPoints
            }
        },
        methods: {
            getCoordinates(arr: any) {
                if (arr.transx) {return `${arr.transx}px, ${arr.transy}px`}
                    let mapsize = arr.area.mapsize
                    let x = Math.floor((arr.x/mapsize)*800)
                    let y = Math.floor((arr.y/mapsize)*800)
                    return `${x}px, ${y}px`
            },
            checkRank(rank: string) {
                let current_rank = this.focusNode.rank
                let results = rank.includes(current_rank) ? true : null
                return results
            },
            async getImgUrl(zone: string) {

                //Url of image
                const convert_name = zone.replace(/[-,',\s]/g, '').toLowerCase()
                const imageUrl = `https://ffxivradarmaps.s3.ca-central-1.amazonaws.com/${convert_name}.webp`;

                try {
                    const CACHE_NAME = "ffxivmap_cache";
                    const cache = await caches.open(CACHE_NAME);
                    const cached = await cache.match(imageUrl);

                    if (cached) {
                        //If found, use the image from cache
                        const blob = await cached.blob();
                        const cachedURL = URL.createObjectURL(blob);

                        document.getElementById("ffmap").style.backgroundImage = `url('${cachedURL}')`
                        console.log('Image loaded from Cache: ', cachedURL)
                    } else {
                        //If unfound in cache, fetch and append downloaded image into cache
                        const response: any = await axios.get(imageUrl, { 
                            responseType: "blob",
                            timeout: 5000,
                        });
                        const axiosURL = URL.createObjectURL(response.data);
                        document.getElementById("ffmap").style.backgroundImage = `url('${axiosURL}')`

                        const blob = response.data;
                        await cache.put(imageUrl, new Response(blob, {
                            headers: { "Content-Type": blob.type },
                        }));
                        URL.createObjectURL(blob);
                        console.log('Image downloaded from Axios: ', axiosURL)
                    }
                } catch (error) {
                    document.getElementById("ffmap").style.backgroundImage = `url('/src/assets/blankmap.jpg')`
                    console.error(`Error getting FFXIVRADARMAPS API: ${error.message}`)
                    throw error
                }
            },
        },
        mounted() {
            this.getImgUrl(this.focusNode.area.zone)
        },
        updated() {
            this.getImgUrl(this.focusNode.area.zone)
        },
    }
</script>

<style scoped lang="scss">

.lock {
    position: absolute;
    z-index:99999;
    background: #000;
}
    .mapDisplay {
        width: 800px;
        height: 800px;
    }

    .mapDisplay {
        & > div {
            width: 800px;
            height: 800px;
            aspect-ratio: 1/1;
            position: absolute;
            transform-origin: top left;
        }

        .mapIcon {
            z-index: 10;
            position: absolute;
            img {
                width: $iconSize;
                margin-left: calc($iconSize / -2);
                margin-top: calc($iconSize / -2);
                filter: drop-shadow(0px 0px 2px #000);
            }
            &:before {
                @extend .inheritChainNo;
                content: attr(data-chainNo);
                transform: translate(2px, -1px);
            }
            &:not([data-mapIconActive]):not(.aetheryte) {
                filter: brightness(0.7);
            }
        }

        

    }

</style>