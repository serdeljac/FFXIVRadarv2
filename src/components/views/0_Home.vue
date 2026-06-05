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
        <a href="/eorzeaoverview"    class="nav-btn" style="--i:0">
          <span class="nav-icon">🌍</span>
          <span class="nav-label">Eorzea Overview</span>
          <span class="nav-arrow">→</span>
        </a>
        <a href="/timedMiningBotany"       class="nav-btn featured" style="--i:1">
          <span class="nav-icon">⏰</span>
          <span class="nav-label">Timed Mining / Botany</span>
          <span class="nav-arrow">→</span>
        </a>
        <a href="/sightseeing" class="nav-btn" style="--i:2">
          <span class="nav-icon">🔭</span>
          <span class="nav-label">Sightseeing Log</span>
          <span class="nav-arrow">→</span>
        </a>
        <a href="/aetherCurrents"      class="nav-btn" style="--i:3">
          <span class="nav-icon">✨</span>
          <span class="nav-label">Aether Currents</span>
          <span class="nav-arrow">→</span>
        </a>
        <a href="/blueMageAbilities"   class="nav-btn" style="--i:4">
          <span class="nav-icon">💙</span>
          <span class="nav-label">Blue Mage Abilities</span>
          <span class="nav-arrow">→</span>
        </a>
        <a href="/news"        class="nav-btn" style="--i:5">
          <span class="nav-icon">📡</span>
          <span class="nav-label">FFXIV Radar News</span>
          <span class="nav-arrow">→</span>
        </a>
        <a href="/aboutUs"       class="nav-btn" style="--i:6">
          <span class="nav-icon">📖</span>
          <span class="nav-label">About Us</span>
          <span class="nav-arrow">→</span>
        </a>
        <a href="/privatePolicy"     class="nav-btn" style="--i:7">
          <span class="nav-icon">🔒</span>
          <span class="nav-label">Privacy Policy</span>
          <span class="nav-arrow">→</span>
        </a>
      </nav>

      <footer class="page-footer">
        <a href="https://www.paypal.com/donate/?hosted_button_id=QVN2JEULAZ2UC" target="_blank" class="coffee-btn">
          <span>☕</span> Buy me a coffee!
        </a>
        <p class="footer-copy">© 2023 FFXIV Radar. All rights reserved.</p>
      </footer>

    </div>
  </div>
</template>

<script>
const PAYPAL_URL = 'https://www.paypal.com/donate/?hosted_button_id=QVN2JEULAZ2UC'

export default {
  name: 'HomePage',
  props: ['ffxivData', 'eorzeaClock', 'timerList', 'windowWidth', 'weatherList'],
  computed: {
    clockMinute() {
        let m = this.eorzeaClock.displayMin
        let fix = m < 10 ? `0${m}` : m
        return fix
      }
  },
    methods: {
    openDonate() {
      window.open(PAYPAL_URL, '_blank', 'noopener,noreferrer')
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.home {
  --teal:   #2dd4bf;
  --teal-g: rgba(45,212,191,0.2);
  --dim:    #5a6e90;
  --text:   #c8d8f0;
  --border: rgba(45,212,191,0.15);

  display: flex;
  align-items: center;
  justify-content: center;
    
  color: var(--text);
  font-family: 'Rajdhani', sans-serif;
  overflow: hidden;
  position: relative;
}

.star-canvas {
  position: fixed; inset: 0;
  pointer-events: none; z-index: 0;
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
  font-size: 2rem; color: var(--teal);
  filter: drop-shadow(0 0 8px var(--teal-g));
  animation: hexPulse 3s ease-in-out infinite;
}
@keyframes hexPulse {
  0%,100% { filter: drop-shadow(0 0 8px var(--teal-g)); }
  50%      { filter: drop-shadow(0 0 18px rgba(45,212,191,0.5)); }
}

.logo-text {
  font-family: 'Cinzel', serif;
  font-size: clamp(1.9rem, 5vw, 2.6rem);
  font-weight: 700; letter-spacing: 0.05em;
  color: #e8f0ff;
}
.logo-text .accent {
  color: var(--teal);
  text-shadow: 0 0 24px var(--teal-g);
}

.tagline {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.78rem; letter-spacing: 0.13em;
  color: var(--dim); text-transform: uppercase;
}

.clock-row {
  display: flex; align-items: baseline; gap: 10px;
  margin-top: 4px;
}
.clock-label {
  font-size: 0.72rem; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--dim);
}
.clock-time {
  font-family: 'Share Tech Mono', monospace;
  font-size: 1.55rem; color: var(--text);
  text-shadow: 0 0 14px rgba(180,210,255,0.2);
}

.divider {
  width: 180px; height: 1px; margin-top: 6px;
  background: linear-gradient(90deg, transparent, var(--teal), transparent);
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
  border: 1px solid var(--border);
  background: rgba(255,255,255,0.03);
  text-decoration: none; color: var(--text);
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
  background: var(--teal);
  transform: scaleY(0);
  transition: transform 0.2s ease;
  box-shadow: 0 0 8px var(--teal-g);
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
  color: var(--teal);
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
  color: var(--dim); font-size: 0.9rem;
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
  text-decoration: none; color: var(--dim);
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem; font-weight: 600;
  letter-spacing: 0.04em;
  transition: all 0.2s;
}
.coffee-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.2);
  color: var(--text);
}

.footer-copy {
  font-size: 0.68rem; color: var(--dim);
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