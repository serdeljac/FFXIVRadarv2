<template>

  <div :class="[`container`, `${sidebarLayout}`]" @click="openDonate">
        <button class="buymecoffee_btn button">
            <iconImgAPI :name="'coffee'"/>
            <p v-if="sidebarLayout != 'compact'">Buy me a coffee!</p>
        </button>
    </div>
</template>

<script lang="ts" setup>
import iconImgAPI from '../../api/iconImg.vue'

const PAYPAL_URL = 'https://www.paypal.com/donate/?hosted_button_id=QVN2JEULAZ2UC'

defineProps(['sidebarLayout'])

function openDonate() {
  window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer')
}
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
  background: linear-gradient(90deg, #03a9f4, #f441a5);
  border-radius: 0.9em;
  width: 200px;
  z-index: 50;
  cursor: pointer;

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
  filter: blur(0);
  transition: filter 0.4s ease;
  z-index: 40;
}

.container:hover::before {
  background: linear-gradient(90deg, #03a9f4, #f441a5);
  filter: blur(1.2em);
  z-index: 40;
  
}

.container:active::before {
  filter: blur(0.2em);
  z-index: 40;
}
</style>