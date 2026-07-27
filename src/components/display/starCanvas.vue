<template>
    <canvas ref="starCanvas" class="star-canvas"></canvas>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Star {
    x: number
    y: number
    r: number
    base: number
    speed: number
}

const starCanvas = ref<HTMLCanvasElement | null>(null)
let frame = 0
let resize: (() => void) | null = null
let motionQuery: MediaQueryList | null = null
let onMotionChange: (() => void) | null = null

onMounted(() => {
    const canvas = starCanvas.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let stars: Star[] = []
    const onResize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        stars = Array.from({ length: 220 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.3 + 0.2,
            base: Math.random() * 0.55 + 0.2,
            speed: Math.random() * 0.7 + 0.3,
        }))
    }

    // CSS cannot reach a canvas drawn per frame, so the reduced-motion
    // preference has to be honoured here: paint the starfield once at rest
    // instead of running a twinkle loop for as long as the app is open.
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const paint = (animated: boolean) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const t = Date.now() / 1000
        stars.forEach(s => {
            const a = animated ? s.base + Math.sin(t * s.speed) * 0.12 : s.base
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(180,210,255,${a})`
            ctx.fill()
        })
    }

    const draw = () => {
        paint(true)
        frame = requestAnimationFrame(draw)
    }

    const start = () => {
        cancelAnimationFrame(frame)
        if (motionQuery?.matches) paint(false)
        else draw()
    }

    // Resizing rebuilds the star field and clears the canvas, so it has to
    // repaint afterwards — with the loop stopped nothing else would.
    resize = () => {
        onResize()
        start()
    }
    onMotionChange = start

    window.addEventListener('resize', resize)
    // Re-evaluate if the user changes the preference while the app is open.
    motionQuery.addEventListener('change', onMotionChange)
    resize()
})

onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    if (resize) window.removeEventListener('resize', resize)
    if (motionQuery && onMotionChange) motionQuery.removeEventListener('change', onMotionChange)
})
</script>