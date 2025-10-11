<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue'

export interface MapContainerProps {
    /** Zoom-out limit */
    minScale?: number
    /** Zoom-in limit */
    maxScale?: number
    /** Value greater than one, defining the zoom speed. 1.01 is very slow, 2 is quite fast, ... */
    scaleFactor?: number
}

const {
    scaleFactor = 1.15,
    minScale = 0.5,
    maxScale = 2
} = defineProps<MapContainerProps>()


// Tracks scale
const scale: Ref<number> = defineModel<number>('scale', {default: 1})

// Tracks drag state
const isDragging: Ref<boolean> = ref(false)
const dragStartX: Ref<number|undefined> = ref(undefined)
const dragStartY: Ref<number|undefined> = ref(undefined)

// Zoom - we have a 250ms animation for smooth zooming
// The scale is updated instantly, but the contentRect will be desync while this animation plays
// If another zoom event happens during a playing animation, anchor and limit computations will be incorrect
// So instead we push the expected contentRect properties
let lastZoom: number = 0
let cachedContentRect: {
    offsetX: number // + containerRect.left to get the expected contentRect.left
    offsetY: number // + containerRect.top to get the expected contentRect.top
    width: number
    height: number
}|undefined = undefined
let handlingZoom: boolean = false // Debounce lock for the event handler

onMounted(() => {
    
    const mapContainer: HTMLElement | null = document.querySelector("#map-container") 
    const mapContent: HTMLElement | null = document.querySelector("#map-content")

    if (!mapContainer || !mapContent) {
        console.warn("Problem when retrieving mapContainer or mapContent")
        return
    }
    
    function panToPercent(xPercent: number, yPercent: number) {

        if (!mapContainer) return
        if (!mapContent) return

        const containerRect = mapContainer.getBoundingClientRect() 
        const contentRect = mapContent.getBoundingClientRect()

        const newOffsetX = (contentRect.left - contentRect.right) * xPercent / 100. + (containerRect.right+containerRect.left) / 2 - containerRect.left
        const newOffsetY = (contentRect.top - contentRect.bottom) * yPercent / 100. + (containerRect.bottom+containerRect.top) / 2 - containerRect.top

        mapContent.style.transformOrigin = `0% 0%`
        mapContent.style.transform = `translate(${newOffsetX}px, ${newOffsetY}px) scale(${scale.value})`
    }

    // Zoom on mouse wheel
    mapContainer?.addEventListener("wheel", (event) => {

        if (handlingZoom) { 
            console.warn("Already handling zoom event, debouncing"); 
            return 
        }
        handlingZoom = true

        if (!mapContainer || !mapContent) {
            handlingZoom = false
            return
        }

        event.preventDefault()

        // Determine new zoom level
        
        const delta = event.deltaY > 0 ? 1/scaleFactor : scaleFactor
        const oldScale = scale.value
        const newScale = Math.min(Math.max(oldScale * delta, minScale), maxScale)

        if (oldScale === newScale) {
            handlingZoom = false
            return
        }
        
        const containerRect = mapContainer.getBoundingClientRect()
        const contentRect = mapContent.getBoundingClientRect()

        let contentRectLeft = contentRect.left
        let contentRectTop = contentRect.top
        let contentRectWidth = contentRect.width
        let contentRectHeight = contentRect.height

        // We cannot rely on contentRect if we're mid zoom animation
        if (performance.now() - lastZoom < 250 && cachedContentRect) {
            contentRectLeft = cachedContentRect?.offsetX + containerRect.left
            contentRectTop = cachedContentRect?.offsetY + containerRect.top
            contentRectWidth = cachedContentRect.width
            contentRectHeight = cachedContentRect.height
        }
        
        // Determine zoom anchor
        const anchorX = (event.clientX - contentRectLeft)
        const anchorY = (event.clientY - contentRectTop)

        // Formulas, new/old + Offset/Anchor/Scale
        // Anchor is where the mouse is content-wise, we want this point to stay under the mouse
        // nO + nA = oO + oA
        // nA = oA/oS*nS
        // nO = oO + oA - ()
        // oO + oA = event.clientX - containerRect.left

        const newOffsetX = event.clientX - containerRect.left - anchorX / oldScale * newScale
        const newOffsetY = event.clientY - containerRect.top - anchorY / oldScale * newScale

        const newOffsetXSafe = Math.min(0, Math.max(- contentRectWidth / oldScale * newScale + containerRect.width, newOffsetX))
        const newOffsetYSafe = Math.min(0, Math.max(- contentRectHeight / oldScale * newScale + containerRect.height, newOffsetY))

        mapContent.style.transition = "all .25s" // Smooth zoom
        mapContent.style.transformOrigin = `0% 0%`
        mapContent.style.transform = `translate(${newOffsetXSafe}px, ${newOffsetYSafe}px) scale(${newScale})`
        
        scale.value = newScale

        // Expected pooosition at the end of zoom anim
        lastZoom = performance.now()
        cachedContentRect = {
            offsetX: newOffsetXSafe,
            offsetY: newOffsetYSafe,
            width: contentRect.width / oldScale * newScale,
            height: contentRect.height / oldScale * newScale
        }

        handlingZoom = false
    })

    mapContainer.addEventListener("mousedown", (event) => {
        isDragging.value = true
        const contentRect = mapContent.getBoundingClientRect()
        dragStartX.value = event.clientX - contentRect.left
        dragStartY.value = event.clientY - contentRect.top
        mapContainer.style.cursor = "grabbing"
    })

    mapContainer.addEventListener("mousemove", (event) => {
        
        if (!isDragging.value) return
        if (!dragStartX.value) return
        if (!dragStartY.value) return
        
        const containerRect = mapContainer.getBoundingClientRect()
        const contentRect = mapContent.getBoundingClientRect()

        const newOffsetX = event.clientX - dragStartX.value - containerRect.left
        const newOffsetY = event.clientY - dragStartY.value - containerRect.top

        const newOffsetXSafe = Math.min(0, Math.max(- contentRect.width + containerRect.width, newOffsetX))
        const newOffsetYSafe = Math.min(0, Math.max(- contentRect.height + containerRect.height, newOffsetY))

        mapContent.style.transition = "all 0s" // Snappy pan
        mapContent.style.transform = `translate(${newOffsetXSafe}px, ${newOffsetYSafe}px) scale(${scale.value})`

    })

    mapContainer.addEventListener("mouseup", () => {
        isDragging.value = false
        mapContainer.style.cursor = "grab"
    })

    // Setup
    panToPercent(50,50)
})

</script>

<template>

    <div id="map-container" class="size-full overflow-hidden cursor-grab">

        <div id="map-content" class="size-fit">

            <slot></slot>

        </div>
    
    </div>
    
</template>
