<template>
    <div class="mapDisplay">
        <div class="mapDisplay_background"
            :style="`background-image: url('${getMapImg(focusNode[0].area.zone)}')`">
        </div>
        <div class="mapDisplay_overlay">

            <div v-for="d in fetchFocusedNodes()" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="d.node_code == focusNode[0].node_code ? true : null"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job, d.job_sub)" />
            </div>

            <div v-for="d in fetchHuntNodes()" :key="d.ID"
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

    function getMapImg(zone: string) {
        let convert_name = zone.replace(/[-,',\s]/g, '').toLowerCase()
        return new URL(`/src/assets/maps/${convert_name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: 'Eorzea Map',
        props: ['ffxivData', 'focusNode', 'singleOnly'],
        methods: {
            fetchFocusedNodes() {
                if (this.focusNode[0].job == 'eliteHunts') {
                    let currentZone = this.focusNode[0].area.zone
                    let results = this.ffxivData.aetheryte.filter((o: any) => o.zone == currentZone)
                    return results
                }
                if (!this.singleOnly) {
                    let currentJob = this.focusNode[0].job
                    let currentZone = this.focusNode[0].area.zone
                    let nodeList = this.ffxivData[currentJob].filter((o: any) => o.area.zone == currentZone)
                    let aetheryteList = this.ffxivData.aetheryte.filter((o: any) => o.zone == currentZone)
                    let results = [...nodeList, ...aetheryteList]
                    return results
                } else {
                    return this.focusNode
                }
            },
            fetchHuntNodes() {
                if (this.focusNode[0].job != 'eliteHunts') {return []}
                let currentZone = this.focusNode[0].area.zone
                let r = this.ffxivData.eliteHunts.filter((o: any) => o.zone == currentZone).map(o => o.points).flat()

                let allPoints = r.filter((obj: any, index: any) => 
                    index === r.findIndex((o: any) => obj.transx === o.transx && obj.transy === o.transy)
                );
                for (const d in allPoints) {
                    allPoints[d]['job'] = 'eliteHunts'
                    allPoints[d]['job_sub'] = this.ffxivData.eliteHunts.find((o: any) => o.points.includes(allPoints[d])).rank
                }
                return allPoints
            },
            getCoordinates(arr: any) {
                if (arr.transx) {return `${arr.transx}px, ${arr.transy}px`}
                    let mapsize = arr.area.mapsize
                    let x = Math.floor((arr.x/mapsize)*800)
                    let y = Math.floor((arr.y/mapsize)*800)
                    return `${x}px, ${y}px`
            },
            checkRank(rank: string) {
                let current_rank = this.focusNode[0].rank
                let results = rank.includes(current_rank) ? true : null
                return results
            },
        }
    }
</script>

<style scoped lang="scss">
    .mapDisplay {
        & > div {
            width: 800px;
            height: 800px;
            aspect-ratio: 1/1;
            position: absolute;
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