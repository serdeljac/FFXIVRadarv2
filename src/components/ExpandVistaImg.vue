<template>
    <!-- A real dialog: previously a bare overlay div with no role, no close
         button, no Escape handling and no focus management. The only way out was
         clicking the backdrop — including clicking the image itself, since the
         image sat inside the click target. -->
    <div
        class="vista_enlarge"
        role="dialog"
        aria-modal="true"
        :aria-label="`Vista preview: ${node?.name ?? 'Sightseeing vista'}`"
        ref="overlay"
        @click.self="close">

        <button
            type="button"
            class="vista_closeBtn"
            aria-label="Close vista preview"
            ref="closeBtn"
            @click="close">
            &times;
        </button>

        <!-- .stop so clicking the image itself no longer dismisses the dialog -->
        <div class="vista_frame" @click.stop>
            <vistaSmallAPI :node="node" :size="'large'"/>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import vistaSmallAPI from '../modules/FetchVistaImage.vue/index.js'

defineProps(['node'])
const emit = defineEmits(['close'])

const overlay = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

// The element that had focus before the dialog opened, so it can be handed back.
let previouslyFocused: HTMLElement | null = null

function close() {
    emit('close')
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
    }

    // Focus trap. Only the close button is focusable today, but keeping this
    // generic means adding controls later can't leak focus back to the page.
    if (e.key !== 'Tab' || !overlay.value) return

    const focusable = overlay.value.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
    }
}

onMounted(() => {
    previouslyFocused = document.activeElement as HTMLElement | null
    closeBtn.value?.focus()
    document.addEventListener('keydown', onKeydown)
    // Stop the page behind the dialog from scrolling.
    document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
    previouslyFocused?.focus?.()
})
</script>

<style scoped lang="scss">

    .vista_enlarge {
        width: 100%;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
        background-color: rgba(0, 0, 0, 0.816);
        z-index: 15000;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    .vista_frame {
        cursor: default;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .vista_closeBtn {
        position: absolute;
        top: 1rem;
        right: 1.5rem;
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        line-height: 1;
        appearance: none;
        background: $surfaceRaised;
        color: $fontColor;
        border: 1px solid $buttonBorder;
        border-radius: $borderRadius;
        cursor: pointer;
        transition: background-color 0.15s ease;

        &:hover {
            background: $surfaceOverlay;
        }
    }

    #imgDisplay {
        border: 3px solid #fff;
        width: 100%;
        max-width: 1000px;
        margin: 1rem;
    }

</style>
