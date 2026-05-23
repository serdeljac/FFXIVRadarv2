<template>
    <div :class="[`container`, `${menuState}`]">
        <button class="buymecoffee_btn button">
            <img :src="getIconImg('coffee')" />
            <p v-if="menuState != 'compact'">Buy me a coffee!</p>
        </button>
    </div>
</template>

<script lang="ts" setup>
    function getIconImg(name: string) {
        return new URL(`/src/assets/icons/${name}.webp`, import.meta.url).href
    }
</script>

<script lang="ts">
    export default {
        name: "Dontate Button",
        props: ['menuState']
    }
</script>

<style scoped lang="scss">

/* From Uiverse.io by Spacious74 */ 
button {
  
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