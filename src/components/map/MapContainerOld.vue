<script setup lang="ts">

export interface MapContainerProps {
    innerWidth?: number,
    innerHeight?: number,
    outerWidth?: string,
    outerHeight?: string
}

const {
    innerWidth = 100,
    innerHeight = 100,
    outerWidth = "100%",
    outerHeight = "100%"
} = defineProps<MapContainerProps>()

</script>


<template>

<div 
    id="map-container" 
    class="relative bg-green-100 border border-black rounded"
    :style="{
      '--outer-width': outerWidth,
      '--outer-height': outerHeight,
      '--map-inner-width': innerWidth,
      '--map-inner-height': innerHeight
    }"
>
    <slot />
</div>

</template>

<style scoped>

#map-container {
    width: var(--outer-width);
    height: var(--outer-height);
}

</style>