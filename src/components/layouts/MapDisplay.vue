<template>
    <div class="mapDisplay">
        <div class="mapDisplay_background"
            :style="`background-image: url('${getMapImg(focusNode.area.zone)}')`">
        </div>
        <div class="mapDisplay_overlay">

            <div v-for="d in getAetheyteNodes" :key="d.ID"
                class="mapIcon"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job, d.job_sub)" />
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

    function getMapImg(zone: string) {
        let convert_name = zone.replace(/[-,',\s]/g, '').toLowerCase()
        return new URL(`/src/assets/maps/${convert_name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: 'Eorzea Map',
        props: ['ffxivData', 'focusNode', 'singleOnly'],
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