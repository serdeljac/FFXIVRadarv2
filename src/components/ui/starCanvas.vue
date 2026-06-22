<template>
    <canvas ref="starCanvas" class="star-canvas"></canvas>
</template>

<script>
    export default {
        name: "Star Canvas",
        mounted() {
            this.initStars()
        },
        beforeUnmount() {
            cancelAnimationFrame(this._frame)
        },
        methods: {
            initStars() {
            const canvas = this.$refs.starCanvas
            const ctx    = canvas.getContext('2d')
            let stars    = []
            const resize = () => {
                canvas.width  = window.innerWidth
                canvas.height = window.innerHeight
                stars = Array.from({ length: 220 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.3 + 0.2,
                base: Math.random() * 0.55 + 0.2,
                speed: Math.random() * 0.7 + 0.3,
                }))
            }
            const draw = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                const t = Date.now() / 1000
                stars.forEach(s => {
                const a = s.base + Math.sin(t * s.speed) * 0.12
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