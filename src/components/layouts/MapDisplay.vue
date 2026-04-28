<template>
    <div class="mapDisplay">
        <div class="mapDisplay_background"
            :style="`background-image: url('${getMapImg(focusNode[0].area.zone)}')`">
        </div>
        <div class="mapDisplay_overlay">

            <div 
                v-for="d in fetchAetheryteNodes" :key="d.ID"
                class="mapIcon aetheryte"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg('aetheryte')" />
            </div>
            
            <div 
                v-for="d in fetchGatheringNodes" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="d.node_code == focusNode[0].node_code ? true : null"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job_sub)" />
            </div>
            
            <div
                v-for="d in fetchVistaNodes" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="d.node_code == focusNode[0].node_code ? true : null"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg('sightseeing')" />
            </div>
            
            <div
                v-for="d in fetchFateNodesSingle" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="d.node_code == focusNode[0].node_code ? true : null"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(`fate_${d.job_sub}`)" />
            </div>
            
            <div 
                v-for="d in fetchFateNodesSet" :key="d.ID" 
                class="mapIcon chain"
                :style="`transform: translate(${getCoordinates(d)})`"
                :data-chainNo="d.chain_no" 
                :data-mapIconActive="d.chain_set == focusNode[0].chain_set ? true : null">
                <img :src="getIconImg(`fate_${d.job_sub}`)" />
            </div>

            <div 
                v-for="d in fetchHuntNodes" :key="d.ID" 
                class="mapIcon chain"
                :style="`transform: translate(${getCoordinates(d)})`" 
                :data-mapIconActive="checkRank(d.ranks)">
                <img :src="getIconImg(`hunts`)" />
            </div>

            <div
                v-for="d in fetchAetherNodes" :key="d.ID"
                class="mapIcon"
                :data-mapIconActive="d.node_code == focusNode[0].node_code ? true : null"
                :style="`transform: translate(${getCoordinates(d)})`">
                <img :src="getIconImg(d.job_sub)" />
            </div>

        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImg(name: string) {
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
        props: ['ffxivData', 'focusNode'],
        data() {
            return {
                nodes: {} as Array<object>,
            }
        },
        computed: {
            fetchAetheryteNodes() {
                if (!this.focusNode[0]) {return []}
                let r = this.ffxivData.aetheryte.filter((o: any) => o.zone == this.focusNode[0].area.zone)
                return r
            },
            fetchGatheringNodes() {
                if (this.focusNode[0].job != 'miner' && this.focusNode[0].job != 'botany') {return []}
                let miningList = this.ffxivData.miner.filter((o: any) => o.area.zone == this.focusNode[0].area.zone)
                let botanyList = this.ffxivData.botany.filter((o: any) => o.area.zone == this.focusNode[0].area.zone)
                return [...miningList, ...botanyList]
            },
            fetchVistaNodes() {
                if (this.focusNode[0].job != 'sightseeing') {return []}
                let r = this.ffxivData.sightseeing.filter((o: any) => o.zone == this.focusNode[0].area.zone)
                return r
            },
            fetchFateNodesSingle() {
                if (this.focusNode[0].job != 'fates') {return []}
                let r = this.ffxivData.fates.filter((o: any) => o.zone == this.focusNode[0].area.zone && !o.chain_set)
                return r
            },
            fetchFateNodesSet() {
                if (this.focusNode[0].job != 'fates') {return []}
                let r = this.ffxivData.fates.filter((o: any) => o.zone == this.focusNode[0].area.zone && o.chain_set)
                return r
            },
            fetchHuntNodes() {
                if (this.focusNode[0].job != 'hunts') {return []}
                let r = this.ffxivData.eliteHunts.filter((o: any) => o.zone == this.focusNode[0].area.zone).map(o => o.points).flat()

                let allPoints = r.filter((obj: any, index: any) => 
                    index === r.findIndex((o: any) => obj.transx === o.transx && obj.transy === o.transy)
                );

                return allPoints
            },
            fetchAetherNodes() {
                if (this.focusNode[0].job != 'aethercurrents') {return []}
                let r = this.ffxivData.aethercurrents.filter((o: any) => o.zone == this.focusNode[0].area.zone)
                return r
            },
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