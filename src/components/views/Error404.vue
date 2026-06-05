<template>
  <div class="not-found">
    <canvas ref="starCanvas" class="star-canvas"></canvas>
    <div class="scanlines"></div>

    <div class="content">
      <p class="eyebrow">// RADAR SIGNAL ERROR</p>

      <h1 class="error-code">
        <span style="--d:0">4</span><span class="zero" style="--d:1">0</span><span style="--d:2">4</span>
      </h1>

      <div class="divider"></div>

      <p class="title">Node Not Found</p>
      <p class="description">
        The aetheric node you're searching for does not appear on the radar.
        It may have despawned, been moved, or never existed in this data crystal.
      </p>

      <div class="badges">
        <span class="badge red">SIGNAL: NULL</span>
        <span class="badge amber">COORDS: UNKNOWN</span>
        <span class="badge teal">REGION: THE VOID</span>
      </div>

      <div class="actions">
        <a href="/" class="btn primary">↩ Return to Eorzea</a>
        <a href="/timedMiningBotany" class="btn outline">⏰ Timed Nodes</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound404',
  mounted() {
    this.initStars()
  },
  beforeUnmount() {
    cancelAnimationFrame(this._frame)
  },
  methods: {
    initStars() {
      const canvas = this.$refs.starCanvas
      const ctx = canvas.getContext('2d')
      let stars = []
      const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = (window.innerHeight - 180)
        stars = Array.from({ length: 200 }, () => ({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.3 + 0.2,
          base: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.8 + 0.3,
        }))
      }
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const t = Date.now() / 1000
        stars.forEach(s => {
          const a = s.base + Math.sin(t * s.speed) * 0.15
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(180,210,255,${a})`
          ctx.fill()
        })
        this._frame = requestAnimationFrame(draw)
      }
      window.addEventListener('resize', resize)
      resize()
      draw()
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Rajdhani:wght@400;500;600&family=Share+Tech+Mono&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.not-found {
  --teal:   #2dd4bf;
  --teal-g: rgba(45,212,191,0.22);
  --amber:  #f59e0b;
  --red:    #ef4444;
  --dim:    #5a6e90;
  --text:   #c8d8f0;

  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b0d1a;
  font-family: 'Rajdhani', sans-serif;
  color: var(--text);
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

.content {
  position: relative; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  gap: 20px;
  padding: 48px 32px;
  max-width: 560px;
  width: 100%;
}

.eyebrow {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: var(--teal);
  opacity: 0.75;
  animation: fadeUp 0.5s ease both;
}

.error-code {
  font-family: 'Cinzel', serif;
  font-size: clamp(5.5rem, 16vw, 9rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.04em;
  color: var(--text);
  display: flex;
}

.error-code span {
  display: inline-block;
  animation: fadeUp 0.55s ease both;
  animation-delay: calc(var(--d) * 0.1s);
  text-shadow: 0 0 40px rgba(180,210,255,0.15);
}

.error-code .zero {
  color: var(--teal);
  text-shadow: 0 0 24px var(--teal-g), 0 0 60px var(--teal-g);
  animation: fadeUp 0.55s ease both, pulse 3s ease-in-out 0.7s infinite;
  animation-delay: 0.1s, 0.7s;
}

@keyframes pulse {
  0%,100% { text-shadow: 0 0 24px var(--teal-g), 0 0 60px var(--teal-g); }
  50%      { text-shadow: 0 0 40px rgba(45,212,191,0.45), 0 0 90px rgba(45,212,191,0.2); }
}

.divider {
  width: 220px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--teal), transparent);
  opacity: 0.45;
  animation: expand 0.7s ease 0.35s both;
}

@keyframes expand {
  from { width: 0; opacity: 0; }
  to   { width: 220px; opacity: 0.45; }
}

.title {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #dde8ff;
  animation: fadeUp 0.55s ease 0.25s both;
}

.description {
  font-size: 1rem;
  line-height: 1.75;
  color: var(--dim);
  max-width: 400px;
  animation: fadeUp 0.55s ease 0.35s both;
}

.badges {
  display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
  animation: fadeUp 0.55s ease 0.45s both;
}

.badge {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  padding: 4px 11px;
  border-radius: 3px;
  border: 1px solid;
}
.badge.red   { color: var(--red);   border-color: rgba(239,68,68,0.35);  background: rgba(239,68,68,0.07);  }
.badge.amber { color: var(--amber); border-color: rgba(245,158,11,0.35); background: rgba(245,158,11,0.07); }
.badge.teal  { color: var(--teal);  border-color: rgba(45,212,191,0.3);  background: rgba(45,212,191,0.06); }

.actions {
  display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;
  margin-top: 4px;
  animation: fadeUp 0.55s ease 0.55s both;
}

.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 22px;
  border-radius: 6px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem; font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn.primary {
  background: var(--teal); color: #0b0d1a; border-color: var(--teal);
}
.btn.primary:hover {
  background: #4fe9d5;
  box-shadow: 0 0 20px var(--teal-g);
  transform: translateY(-1px);
}

.btn.outline {
  background: transparent; color: var(--teal); border-color: var(--teal);
}
.btn.outline:hover {
  background: rgba(45,212,191,0.08);
  box-shadow: 0 0 14px var(--teal-g);
  transform: translateY(-1px);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .content { padding: 32px 20px; }
  .actions { flex-direction: column; align-items: stretch; }
  .btn { justify-content: center; }
}
</style>
