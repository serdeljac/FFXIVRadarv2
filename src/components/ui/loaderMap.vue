<template>
    <div class="container">
        
      <div class="chocobo">
        <svg width="80" height="72" viewBox="0 0 80 72" xmlns="http://www.w3.org/2000/svg" role="img">

          <g class="leg">
            <rect x="34" y="54" width="5" height="14" rx="2" fill="#e8b800"/>
            <rect x="29" y="66" width="10" height="3" rx="1" fill="#c89800"/>
            <rect x="27" y="67" width="4" height="2" rx="1" fill="#c89800"/>
            <rect x="39" y="67" width="4" height="2" rx="1" fill="#c89800"/>
          </g>
          <g class="leg2">
            <rect x="41" y="54" width="5" height="14" rx="2" fill="#d4a800"/>
            <rect x="36" y="66" width="10" height="3" rx="1" fill="#b89000"/>
            <rect x="34" y="67" width="4" height="2" rx="1" fill="#b89000"/>
            <rect x="46" y="67" width="4" height="2" rx="1" fill="#b89000"/>
          </g>

          <ellipse cx="40" cy="46" rx="18" ry="14" fill="#f5c842"/>

          <g class="wing">
            <ellipse cx="28" cy="40" rx="10" ry="6" fill="#e8b800" transform="rotate(-15,28,40)"/>
            <ellipse cx="24" cy="42" rx="7" ry="4" fill="#d4a800" transform="rotate(-20,24,42)"/>
          </g>

          <g class="neck">
            <rect x="38" y="26" width="10" height="22" rx="5" fill="#f5c842"/>
            <ellipse cx="43" cy="22" rx="11" ry="10" fill="#f5c842"/>
            <rect x="36" y="14" width="6" height="7" rx="2" fill="#f0b820" transform="rotate(-10,39,17)"/>
            <rect x="49" y="13" width="5" height="6" rx="2" fill="#f0b820" transform="rotate(10,51,16)"/>
            <rect x="52" y="15" width="4" height="5" rx="2" fill="#e8a010" transform="rotate(20,54,17)"/>

            <ellipse cx="50" cy="19" rx="6" ry="5" fill="#e8982a"/>
            <circle cx="52" cy="17" r="2.5" fill="#1a0a00"/>
            <circle cx="53" cy="16" r="1" fill="#fff"/>

            <rect x="50" y="22" width="10" height="4" rx="2" fill="#e8982a"/>
            <rect x="57" y="23" width="5" height="2" rx="1" fill="#d07820"/>
          </g>

          <ellipse cx="40" cy="46" rx="18" ry="14" fill="none" stroke="#d4a000" stroke-width="1"/>
        </svg>
      </div>
      <p>Loading Maps...</p>
    </div>
</template>

<script lang="ts" setup>
</script>

<script lang="ts">
    export default {
        name: "Loading Image"
    }
</script>

<style scoped lang="scss">
    .container {
        background-color: #323232;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    p {
        margin-top: 120px;
        font-size: 3rem;
    }

.chocobo {
    position: absolute;
    margin-left: 80px;
    animation: choco-run 0.25s steps(1) infinite;
  }

  .leg { animation: legs 0.25s steps(2) infinite; transform-origin: 38px 54px; }
            .leg2 { animation: legs2 0.25s steps(2) infinite; transform-origin: 44px 54px; }
            @keyframes legs { 0% { transform: rotate(-18deg); } 50% { transform: rotate(18deg); } }
            @keyframes legs2 { 0% { transform: rotate(18deg); } 50% { transform: rotate(-18deg); } }
            .wing { animation: wing-flap 0.5s steps(2) infinite; transform-origin: 32px 36px; }
            @keyframes wing-flap { 0% { transform: rotate(-8deg); } 50% { transform: rotate(5deg); } }
            .neck { animation: neck-bob 0.5s steps(2) infinite; transform-origin: 42px 30px; }
            @keyframes neck-bob { 0% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }

  @keyframes choco-run {
    0%   { transform: translateX(-50%) translateY(0); }
    25%  { transform: translateX(-50%) translateY(-3px); }
    50%  { transform: translateX(-50%) translateY(0px); }
    75%  { transform: translateX(-50%) translateY(-2px); }
    100% { transform: translateX(-50%) translateY(0); }
  }

</style>