<template>
    <div class="mapDisplay">
        <!-- {{ focusNode.length == 0 ? null : focusNode }} -->
        <div class="mapDisplay_background"
            :style="`background-image: url('${getMapImg(focusNode.area.zone)}')`">
        </div>
        <div class="mapDisplay_overlay">

            <img v-for="d in fetchAetheryteNodes" :key="d.ID"
                :src="getIconImg('aetheryte')" 
                class="mapIcon"
                :style="`transform: translate(${getCoordinates(d)})`"/>
            
            <img v-for="d in fetchMiningNodes" :key="d.ID"
                :src="getIconImg(d.job_sub)" 
                class="mapIcon"
                :data-mapIconActive="d.ID == focusNode.ID ? true : null"
                :style="`transform: translate(${getCoordinates(d)})`"/>
            
            <img v-for="d in fetchVistaNodes" :key="d.ID"
                :src="getIconImg('sightseeing')" 
                class="mapIcon"
                :style="`transform: translate(${getCoordinates(d)})`"/>

        </div>
    </div>
</template>

<script lang="ts" setup>
    function getIconImg(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }

    function getMapImg(name: string) {
        let convertName = name.replace(/[-,',\s]/g, '').toLowerCase()
        return new URL(`/src/assets/maps/${convertName}.webp`, import.meta.url).href
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
                // let r = this.ffxivData.aetheryte.filter((o: any) => o.zone == this.focusNode.area.zone)
                // return r
            },
            fetchMiningNodes() {
                console.log(this.focusNode)
                // if (this.focusNode.job == 'miner') {
                // let r = this.ffxivData.miner.filter((o: any) => o.area.zone == this.focusNode.area.zone)
                // return r
                // }
            },
            fetchVistaNodes() {
                // let r = this.ffxivData.sightseeing.filter((o: any) => o.zone == this.focusNode.area.zone)
                // return r
            }
        },
        methods: {
            fetchAllIcons() {
                // Miner, Botany, Sightseeing, Fates, Hunts, AetherCurrents, Aetheryte

            },
            getCoordinates(arr: any) {

                 if (!arr.transx) {
                    // let mapsize = this.currentMapData.map[0].mapsize
                    let x = Math.floor((arr.x/800)*800)
                    let y = Math.floor((arr.y/800)*800)
                    return `${x}px, ${y}px`
                }

                return `${arr.transx}px, ${arr.transy}px`
            }
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
            width: $iconSize;
            margin-left: calc($iconSize / -2);
            margin-top: calc($iconSize / -2);
            z-index: 10;
            position: absolute;
        }

        // &_overlay {
        //     position: absolute;
        // }
    }

</style>