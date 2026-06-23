<template>
  <div class="home">
    
    <div class="scanlines"></div>

    <div class="content">

      <!-- Logo + clock -->
      <header class="hero">
        <div class="logo-wrap">
          <span class="logo-hex">⬡</span>
          <h1 class="logo-text">FFXIV <span class="accent">Radar</span></h1>
        </div>
        <p class="tagline">Your aetheric compass for Eorzea</p>
        <div class="clock-row">
          <span class="clock-label">Eorzea Clock</span>
          <span class="clock-time">{{ `${eorzeaClock.display24Hr}:${clockMinute}` }}</span>
        </div>
        <div class="divider"></div>
      </header>

      <!-- Nav grid -->
      <nav class="nav-grid">

        <router-link 
          v-for="l in links" :key="l.link" 
          :to="`/${l.link}`"  
          :class="[`nav-btn`, {'featured': l.featured}]">
            <iconImgAPI :name="`sq_${l.icon}`"/>
            <span class="nav-label">{{ l.label }}</span>
            <span class="nav-arrow">→</span>
          </router-link>
        
      </nav>

      <div class="home_content">
        <h2>Welcome to FFXIVRadar</h2>
        <p>FFXIVRadar is a gathering companion tool designed to help Final Fantasy XIV players find, track, and plan their gathering activities more efficiently. Whether you are searching for a specific crafting material, preparing for a gathering session, or simply exploring the world of Eorzea, FFXIVRadar provides an organized way to discover important node locations and related information.</p>
        <p>Finding the right resource can sometimes mean searching through multiple areas, remembering spawn locations, or waiting for limited-time gathering opportunities. FFXIVRadar brings this information together in one place by allowing players to search for items directly or explore interactive maps that display gathering nodes and useful details.</p>  
        <p>The interactive map system allows you to select a specific region and view available gathering locations with relevant node data. This makes it easier to understand where resources are located, plan efficient routes, and spend more time gathering instead of manually searching for information.
</p>
        <p>Many valuable resources in Final Fantasy XIV appear only during specific windows, making timing an important part of gathering. FFXIVRadar includes tracking tools for timed nodes, allowing players to monitor available and upcoming gathering opportunities directly from the site interface.
</p>
        <p>Whether you are a new player learning gathering, a crafter collecting materials, or an experienced player optimizing your resource routes, FFXIVRadar is built to make gathering information easier to access. The goal is simple: provide a reliable, convenient tool that helps players spend less time looking for nodes and more time enjoying the game.</p>
        </div>






      <footer class="page-footer">
        <a href="https://www.paypal.com/donate/?hosted_button_id=QVN2JEULAZ2UC" target="_blank" class="coffee-btn">
          <span>☕</span> Buy me a coffee!
        </a>
        <p class="footer-copy">© 2023 FFXIV Radar. All rights reserved.</p>
      </footer>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import iconImgAPI from '../API/iconImg.vue'

const props = defineProps(['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'])

const clockMinute = computed(() => {
  const m = props.eorzeaClock.displayMin
  return m < 10 ? `0${m}` : m
})

const links = [
  {
    link: 'eorzeaoverview',
    featured: true,
    label: 'Eorzea Overview',
    icon: 'eorzeamap'
  },
  {
    link: 'timedMiningBotany',
    featured: true,
    label: 'Timed Mining / Botany',
    icon: 'gathering'
  },
  {
    link: 'sightseeing',
    featured: false,
    label: 'Sightseeing',
    icon: 'sightseeing'
  },
  {
    link: 'aetherCurrents',
    featured: false,
    label: 'Aether Currents',
    icon: 'aethercurrents'
  },
  {
    link: 'blueMageAbilities',
    featured: false,
    label: 'Blue Mage Abilities',
    icon: 'bluemage'
  },
  {
    link: 'news',
    featured: false,
    label: 'FFXIV Radar News',
    icon: 'news'
  },
  {
    link: 'aboutUs',
    featured: false,
    label: 'About Us',
    icon: 'about'
  },
  {
    link: 'privatePolicy',
    featured: false,
    label: 'Privacy Policy',
    icon: 'privatepolicy'
  },
]
</script>

<style scoped lang="scss">
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.home {
  display: flex;
  align-items: center;
  justify-content: center;
    
  color: $fontColor;
  font-family: 'Rajdhani', sans-serif;
  overflow: hidden;
  position: relative;
}

.scanlines {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: repeating-linear-gradient(
    to bottom, transparent, transparent 3px,
    rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px
  );
}

/* ── Content wrapper ── */
.content {
  position: relative; z-index: 10;
  width: 100%; max-width: 680px;
  padding: 52px 32px 40px;
  display: flex; flex-direction: column;
  align-items: center; gap: 36px;
}

/* ── Hero ── */
.hero {
  display: flex; flex-direction: column;
  align-items: center; gap: 10px;
  text-align: center;
  animation: fadeUp 0.55s ease both;
}

.logo-wrap {
  display: flex; align-items: center; gap: 12px;
}

.logo-hex {
  font-size: 2rem; color: $teal;
  filter: drop-shadow(0 0 8px $tealShadow);
  animation: hexPulse 3s ease-in-out infinite;
}
@keyframes hexPulse {
  0%,100% { filter: drop-shadow(0 0 8px $tealShadow); }
  50%      { filter: drop-shadow(0 0 18px rgba(45,212,191,0.5)); }
}

.logo-text {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.9rem, 5vw, 2.6rem);
  font-weight: 700; letter-spacing: 0.05em;
  color: #e8f0ff;
}
.logo-text .accent {
  color: $teal;
  text-shadow: 0 0 24px $tealShadow;
}

.tagline {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.78rem; letter-spacing: 0.13em;
  color: $dim; text-transform: uppercase;
}

.clock-row {
  display: flex; align-items: baseline; gap: 10px;
  margin-top: 4px;
}
.clock-label {
  font-size: 0.72rem; text-transform: uppercase;
  letter-spacing: 0.1em; color: $dim;
}
.clock-time {
  font-family: 'Share Tech Mono', monospace;
  font-size: 1.55rem; color: $fontColor;
  text-shadow: 0 0 14px rgba(180,210,255,0.2);
}

.divider {
  width: 180px; height: 1px; margin-top: 6px;
  background: linear-gradient(90deg, transparent, $teal, transparent);
  opacity: 0.4;
  animation: expand 0.8s ease 0.2s both;
}
@keyframes expand {
  from { width: 0; opacity: 0; }
  to   { width: 180px; opacity: 0.4; }
}

/* ── Nav grid ── */
.nav-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.nav-btn {
  display: flex; align-items: center; gap: 13px;
  padding: 16px 18px;
  border-radius: 8px;
  border: 1px solid $buttonBorder;
  background: rgba(255,255,255,0.03);
  text-decoration: none; color: $fontColor;
  font-size: 0.97rem; font-weight: 600;
  letter-spacing: 0.03em;
  transition: all 0.2s;
  position: relative; overflow: hidden;
  animation: fadeUp 0.5s ease both;
  animation-delay: calc(var(--i) * 0.06s + 0.15s);
}

/* teal left-edge accent on hover */
.nav-btn::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 0 2px 2px 0;
  background: $teal;
  transform: scaleY(0);
  transition: transform 0.2s ease;
  box-shadow: 0 0 8px $tealShadow;
}

.nav-btn:hover {
  background: rgba(45,212,191,0.07);
  border-color: rgba(45,212,191,0.35);
  color: #e8f0ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 24px rgba(0,0,0,0.3);
}
.nav-btn:hover::before { transform: scaleY(1); }
.nav-btn:hover .nav-arrow {
  color: $teal;
  transform: translateX(3px);
}

/* Featured button spans full width */
.nav-btn.featured {
  grid-column: 1 / -1;
  border-color: rgba(45,212,191,0.28);
  background: rgba(45,212,191,0.05);
}
.nav-btn.featured .nav-icon { font-size: 1.3rem; }
.nav-btn.featured .nav-label { font-size: 1.05rem; }

.nav-icon {
  font-size: 1.15rem; flex-shrink: 0;
  width: 24px; text-align: center;
}
.nav-label { flex: 1; }
.nav-arrow {
  color: $dim; font-size: 0.9rem;
  transition: all 0.2s; flex-shrink: 0;
}

/* ── Footer ── */
.page-footer {
  display: flex; flex-direction: column;
  align-items: center; gap: 10px;
  animation: fadeUp 0.5s ease 0.55s both;
}

.coffee-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 20px; border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  text-decoration: none; color: $dim;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem; font-weight: 600;
  letter-spacing: 0.04em;
  transition: all 0.2s;
}
.coffee-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
  color: $fontColor;
}

.footer-copy {
  font-size: 0.68rem; color: $dim;
  letter-spacing: 0.04em;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .content { padding: 36px 18px 30px; }
  .nav-grid { grid-template-columns: 1fr; }
  .nav-btn.featured { grid-column: 1; }
}
</style>