<template>
    <aside aria-label="Sidebar">
        <button
            type="button"
            v-if="sidebarLayout == 'compact'"
            :class="[`sidebar_clockdisplay collapsed`]"
            :aria-label="clockToggleLabel"
            @click="clockIs24Format = !clockIs24Format">
            <h2 v-if="clockIs24Format">
                {{ eorzeaClock.display24Hr }} <br/>
                {{ clockMinute }}
            </h2>
            <h2 v-else>
                {{ eorzeaClock.display12Hr }} <br/>
                {{ clockMinute }} <br />
                {{ eorzeaClock.display24Hr > 12 ? 'PM' : 'AM' }}
            </h2>
        </button>

        <button
            type="button"
            v-else
            :class="[`sidebar_clockdisplay extended`]"
            :aria-label="clockToggleLabel"
            @click="clockIs24Format = !clockIs24Format">
            <p>Eorzea Clock:</p>
            <h2 v-if="clockIs24Format">
                {{ `${eorzeaClock.display24Hr}:${clockMinute}` }}
            </h2>
            <h2 v-else>
                {{ `${eorzeaClock.display12Hr}:${clockMinute} ${eorzeaClock.display24Hr > 12 ? 'PM' : 'AM'}` }}
            </h2>
        </button>

        <sidebarLinks :sidebarLayout="sidebarLayout"/>

        <footer>
            <!-- <donateBtn :sidebarLayout="sidebarLayout"/> -->
            <div :class="[`container`, `${sidebarLayout}`]">
                <a
                    class="buymecoffee_btn button"
                    :href="PAYPAL_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Buy me a coffee (opens PayPal in a new tab)">
                    <iconImgAPI :name="'coffee'"/>
                    <p v-if="sidebarLayout != 'compact'">Buy me a coffee!</p>
                </a>
            </div>
            <p>&copy; 2025&ndash;{{ currentYear }} FFXIV Radar.<br/>Not affiliated with Square Enix.</p>
        </footer>

    </aside>
</template>

<script lang="ts" setup>
    import { ref, computed } from 'vue'
    import { padNumber } from '../../hooks/hooks.ts'
    import sidebarLinks from './SidebarLinks.vue'
    import iconImgAPI from '../../modules/FetchIconImage.vue'


    const props = defineProps(['sidebarLayout', 'eorzeaClock'])
    const PAYPAL_URL = 'https://www.paypal.com/donate/?hosted_button_id=QVN2JEULAZ2UC'
    const clockIs24Format = ref(true)

    const clockMinute = computed(() => padNumber(props.eorzeaClock.displayMin))
    const currentYear = new Date().getFullYear()

    const clockToggleLabel = computed(
        () => `Eorzea clock, switch to ${clockIs24Format.value ? '12' : '24'}-hour format`
    )
</script>

<style scoped lang="scss">
    .buymecoffee_btn {
        font-size: 1rem;
        padding: 0em 0.8em;
        border-radius: 0.5em;
        border: none;
        background-color: #000;
        color: #fff;
        cursor: pointer;
        box-shadow: 2px 2px 3px #000000b4;
        display: inline-flex;
        align-items: center;
        font-weight: bold;
        font-style: italic;
        z-index: 50;
        position: relative;

        img {
            width: 40px;
            height: 40px;
        }
    }

    .container {
        position: relative;
        padding: 3px;
        background: linear-gradient(90deg, #2dd4bf, #0f766e);
        border-radius: 0.9em;
        width: 200px;
        z-index: 50;
        cursor: pointer;

        &.compact {
            width: 50px;
            height: 50px;
            img {width: 30px;}
            p {display: none;}
            .buymecoffee_btn {
                width: 44px;
                height: 44px;
                padding: 6px;
                justify-content: center;
            }
        }
    }

    .container::before {
        content: "";
        position: absolute;
        inset: 0;
        margin: auto;
        border-radius: 0.9em;
        filter: blur(0);
        transition: filter 0.4s ease;
        z-index: 40;
    }

    .container:hover::before {
        background: linear-gradient(90deg, #2dd4bf, #0f766e);
        filter: blur(1.2em);
        z-index: 40;
    }

    .container:active::before {
        filter: blur(0.2em);
        z-index: 40;
    }
</style>