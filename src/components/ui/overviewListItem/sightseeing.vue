<template>
    <ul>
        <li v-for="node in data" :key="node.ID"
            :class="[`overviewListItem`, {'compact': windowWidth == 'tablet' || windowWidth == 'mobile'}]"
            @click="$emit('focusNode', node)"
            :data-rowFocused="node.node_code == focusNode.node_code ? true : null"
            :data-rowActive="checkRowActive(node)">

            <div class="overviewListItem_header">
                <iconAndText 
                    :text="`Sightseeing Log #${node.no} - ${node.name}`" 
                    :icon="`${node.job_sub}`"/>

                <div class="forceright">
                    <toggleTrackingBtn
                            v-if="node.time" 
                            :trackingEnabled="node.tracked"
                            class="hasContext"
                            data-context="Track Node"
                            @click="$emit('changeTracked', node)" />
                    <p>{{ fetchTimerCountdowns(node.time) }}</p>
                </div>
            </div>

            <hr/>

            <div class="overviewListItem_body">

                <div class="previewImg" :id="`previewImg${node.ID}`" @click="$emit('openVistaImg', node)"></div>

                <div class="overviewListItem_contents">

                    <div class="weatherAndEmote">
                        <div>
                            <p v-if="node.weather1" :data-timeActive="checkTimeActive('weather1', node)">{{ node.weather1 }}</p>
                            <p v-if="node.weather2" :data-timeActive="checkTimeActive('weather2', node)">{{ node.weather2 }}</p>
                            <p v-if="!node.weather1">Any Weather</p>
                        </div>
                        <div>
                            <iconAndText :text="`${node.emote}`" :icon="`${node.emote}`"/>
                        </div>
                    </div>
                    
                    <div class="notes">
                        <p>
                            <span v-if="node.mount">[Flying Mount Required]</span>
                            {{ node.notes }}
                        </p>
                    </div>
                </div>
            </div>
        </li>
    </ul>
</template>

<script lang="ts">
    import displayAreaText from '../../ui/displayAreaText.vue';
    import iconAndText from '../../ui/iconAndText.vue';
    import toggleTrackingBtn from '../../ui/buttons/toggleTracking.vue';
    import axios from 'axios'

    export default {
        name: 'List Item - Sightseeing',
        components: {displayAreaText, iconAndText, toggleTrackingBtn},
        props: ['data', 'timerList', 'weatherList', 'focusNode', 'windowWidth'],
        emits: ['focusNode', 'changeTracked', 'openVistaImg'],
        data() {
            return {
                storeFocusedNode: {} as any
            }
        },
        methods: {
            fetchTimerCountdowns(time: string) {
                if (time) {
                    let results = this.timerList.find((o: any) => o.ID == time).countdown
                    return results
                }
                return 'Any Time'
            },
            checkTimeActive(type: string, arr: any) {
                if (type == 'weather1' || type == 'weather2') {
                    let curWeather = this.weatherList[arr.area.mapcode]
                    let triggerWeather = arr[type]
                    if (curWeather == triggerWeather) {return true}
                    return null
                }

                if (type == 'time' && arr.time) {
                    let results = this.timerList.find((o: any) => o.ID == arr.time).stateActive
                    results = results ? true : null
                    return results
                }
                return null
            },
            checkRowActive(arr: any) {
                let match1: boolean
                let match2: boolean

                //Match1 - Get Time State
                if (arr.time) {
                    let currentTimeState = this.timerList.find((o: any) => o.ID == arr.time).stateActive
                    match1 = currentTimeState ? true : null
                }

                //Match2 - Get Weather State
                if (arr.weather1) {
                    let curWeather = this.weatherList[arr.mapcode]
                    let condition1 = arr.weather1 == curWeather ? true :  false
                    let condition2 = (arr.weather2 == curWeather) && arr.weather2 ? true :  false
                    match2 = condition1 || condition2 ? true : false
                }

                if (!arr.weather1) {return match1}
                return match1 == match2 ? true : null
            },
            async loadVistaPreviewImg(): Promise<void> {
                const CACHE_NAME = 'ffxivmap_vista'
                let expansion = this.data[0].expansion.replace(/[-,'\s]/g, '').toLowerCase()
                await this.$nextTick() // ensure DOM is up to date
                const els = Array.from(document.getElementsByClassName('previewImg')) as HTMLElement[]
                

                if (!els.length) return

                const cache = await caches.open(CACHE_NAME)  // open cache once, outside the loop
                const l = this.data.length

                for (let i = 0; i < l; i++) {
                    const d = this.data[i]
                    const imageUrl = `https://ffxivradarvista.s3.ca-central-1.amazonaws.com/${expansion}/small/${d.no}.webp`
                    const curEle = els[i]

                    try {
                        const cached = await cache.match(imageUrl)

                        if (cached) {
                            const blob = await cached.blob()
                            curEle.style.backgroundImage = `url('${URL.createObjectURL(blob)}')`
                            continue  // ← was `return`, which exited the entire loop early
                        }

                        const response = await axios.get<Blob>(imageUrl, {
                            responseType: 'blob',
                            timeout: 5000,
                        })
                        const blob = response.data
                        await cache.put(
                            imageUrl,
                            new Response(blob, { headers: { 'Content-Type': blob.type } })
                        )
                        curEle.style.backgroundImage = `url('${URL.createObjectURL(blob)}')`

                    } catch (error: any) {
                        curEle.style.backgroundImage = `url('/src/assets/blankmap.webp')`
                        console.error(`EorzeaMap: failed to load vista image for "${d.no}": ${error.message}`)
                    }
                }
            },
        },
        mounted() {
            this.storeFocusedNode = this.focusNode
            this.loadVistaPreviewImg()
        },
        watch: {
            'data'() {
                this.$nextTick(() => {
            this.loadVistaPreviewImg()
        })
    }
        },
    }
</script>

<style scoped lang="scss">
    .previewImg {
        background-size: cover;
        aspect-ratio: 1 / 1;
        border: 1px solid #fff;
        cursor: pointer;
        transition: all 0.07 linear;
        user-select: none;
        width: 100px;
        height: 100px;
        &:hover {
            box-shadow: inset 0px 0px 4px #fff,
            0px 0px 4px #fff;
        }
    }

    .overviewListItem {

        &.compact {
            .overviewListItem_body {
                display: block;
                .notes {text-align: center;}
            }
        }

        &_body {
            display: flex;
            gap: 20px;
        }

        &_contents {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 100%;
            margin-top: 6px;
            height: 100px;
            justify-content: center;
            .weatherAndEmote {
                display: grid;
                justify-items: center;
                grid-template-columns: 1fr 1fr;
                width: 100%;
                p {color: grey;}
                div {
                    display: flex;
                    gap: 10px;
                }
            }
            .notes {
                width: 100%;
                span {font-weight: bold;}
            }
        }
    }

</style>