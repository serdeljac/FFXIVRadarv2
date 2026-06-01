<template>

  <div :class="[`container`, `${sidebarLayout}`]" @click="openDonate">
        <button class="buymecoffee_btn button">
            <img :src="getIconImg('coffee')" />
            <p v-if="sidebarLayout != 'compact'">Buy me a coffee!</p>
        </button>
    </div>
</template>


<script lang="ts" setup>
    function getIconImg(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
const PAYPAL_URL = 'https://www.paypal.com/donate/?hosted_button_id=QVN2JEULAZ2UC'

export default {
  name: 'DonateButton',
  props: ['sidebarLayout'],

  data() {
    return {
      beating: false,
      beatInterval: null
    }
  },

  mounted() {
    // Subtle heartbeat animation loop
    this.beatInterval = setInterval(() => {
      this.beating = true
      setTimeout(() => { this.beating = false }, 300)
    }, 2800)
  },

  beforeUnmount() {
    clearInterval(this.beatInterval)
  },

  methods: {
    openDonate() {
      window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer')
    }
  }
}
</script>

<style scoped lang="scss">
.buymecoffee_btn {
    font-size: 1rem;
  padding: 0.6em 0.8em;
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
  img {width: 50px;}
}
.container {
  position: relative;
  padding: 3px;
  background: linear-gradient(90deg, #03a9f4, #f441a5);
  border-radius: 0.9em;
  width: 200px;

  &.compact {
    width: 50px;
    height: 50px;
    img {width: 30px;}
    button {
      width: 44px;
      height: 44px;
      padding: 6px;
    }
    p {display: none;}

  }
}

.container::before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto;
  border-radius: 0.9em;
  z-index: -10;
  filter: blur(0);
  transition: filter 0.4s ease;
}

.container:hover::before {
  background: linear-gradient(90deg, #03a9f4, #f441a5);
  filter: blur(1.2em);
}

.container:active::before {
  filter: blur(0.2em);
}
</style>