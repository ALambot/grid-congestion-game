<script setup lang="ts">
import { computed, type Ref } from 'vue';


export interface MapLineProps {
    id?: string,
    lineKey: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    flow?: number,
    capacity?: number,
    reactance: number
}

const {
    lineKey,
    startX,
    startY,
    endX,
    endY,
    flow,
    capacity,
    reactance
} = defineProps<MapLineProps>()

const minX = Math.min(startX, endX)
const maxX = Math.max(startX, endX)
const minY = Math.min(startY, endY)
const maxY = Math.max(startY, endY)

const width = maxX - minX
const height = maxY - minY

const dist = Math.sqrt(width**2 + height**2)
const angleDeg = Math.atan((endY-startY)/(endX-startX)) / Math.PI * 180 + 180 * Number((endX < startX))

const hsl: Ref<{h: number, s: number, l: number}> = computed(() => {

    // Undefined -> grey
    if (flow === undefined || capacity === undefined) return {h: 0, s: 0, l: 50}

    // Zero -> white
    if (Math.round(flow*100) === 0) return {h: 0, s: 0, l: 100}
    
    // Overloaded -> red
    if (Math.abs(flow) > capacity) return {h: 0, s: 100, l: 50}

    // Color depending on the loading :
    // 0% white / light-green
    // 50% green
    // 70% orange
    // 100%+ red

    const intensity = Math.min(Math.abs(flow)/capacity, 1)
    const intensityInv = 1 - intensity

    const hue = 20 + intensityInv * 80
    const light = 80 - intensity * 20

    return {h: hue, s: 100, l: light}
})

const speed: Ref<number> = computed(() => {
    return Math.round( Math.abs(flow ?? 0) / 40) + 1
})

const forward: Ref<boolean> = computed(() => {
    return (flow ?? 0) > 0
})

const reverse: Ref<boolean> = computed(() => {
    return (flow ?? 0) < 0
})

const size: Ref<number> = computed(() => {
    return 6 + 2* Math.floor((capacity??100)/20)
})

const overloaded: Ref<boolean> = computed(() => {
    return Math.abs(flow ?? 0) > (capacity ?? 0)
})

const absFlow: Ref<string|undefined> = computed(() => flow !== undefined ? Math.abs(flow).toFixed(2) : undefined)

const absLoading: Ref<string|undefined> = computed(() => flow !== undefined && capacity !== undefined ? Math.abs(flow/capacity*100).toFixed(2) : undefined)
const absLoadingShort: Ref<string|undefined> = computed(() => flow !== undefined && capacity !== undefined ? Math.abs(flow/capacity*100).toFixed(0) : undefined)

</script>

<template>

    <div 
        id="map-line" 
        class=""
        :style="{
            '--start-x': startX,
            '--start-y': startY,
            '--end-x': endX,
            '--end-y': endY,
            '--min-x': minX,
            '--max-x': maxX,
            '--min-y': minY,
            '--max-y': maxY,
            '--width': width,
            '--height': height,
            '--dist': dist,
            '--angle-deg': angleDeg,
            
            '--hue': hsl.h,
            '--saturation': hsl.s,
            '--light': hsl.l,

            '--speed': speed,
            '--linesize': size
        }"
    >
        <div class="map-line-visual" :class="{'forward': forward, 'reverse': reverse, 'overloaded': overloaded}">
            
            <div class="line-tooltip items-center justify-center">
                <div class="line-tooltip-content bg-white py-1.5 px-2 border flex flex-col text-sm ui-shadow">
                    <div class="text-nowrap">HV AC - <span class="font-mono bg-stone-100">{{ lineKey }}</span></div>
                    <div v-if="overloaded" class="text-red-700 font-bold">Overloaded !</div>
                    <div class="text-nowrap">Flow: <span class="font-bold">{{ absFlow ?? '-' }}</span> /{{ capacity }} MW</div>
                    <div class="text-nowrap">Loading: <span class="font-bold">{{ absLoading ?? '-' }}</span> %</div>
                    <div class="text-nowrap">Reactance: {{ reactance }} p.u</div>
                </div>
            </div>

            <div v-if="absLoadingShort" class="line-loading items-center justify-center h-full">
                <div class="bg-white py-0.5 px-1 border text-sm rounded-full ui-shadow">
                    <div class="text-nowrap"><span class="font-bold">{{ absLoadingShort ?? '-' }}</span> %</div>
                </div>
            </div>

        </div>

        
        
    </div>

</template>

<style scoped>

#map-line {
    position: absolute;
    left: calc(var(--start-x)*1px);
    top: calc(var(--start-y)*1px);

    overflow: visible;

    z-index: 115;
}

#map-line:hover {
    z-index: 116;
}

.map-line-visual {

    position: absolute;

    --line-color: hsl(var(--hue), calc(var(--saturation)*1%), calc(var(--light)*1%));
    --arrow-color: white;
    --arrow-color-inverse: black;
    border: 1px solid black;

    z-index: 116;

    width: calc(var(--dist)*1px);
    margin-left: 0;
    height: calc(var(--linesize)*1px);
    margin-top: calc(var(--linesize)/-2*1px);

    transform-origin: 0% 50%;
    transform: rotate(calc(var(--angle-deg)*1deg));

    background: white;

    cursor: pointer;

    box-shadow: 0px 0px 3px grey;

    /** clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 51% 100%, 51% 0%, 49% 0%, 49% 100%, 0% 100%); */
}

.map-line-visual.overloaded {
    box-shadow: 0px 0px 20px red;
}

@keyframes FlowAnimForward {
    0%{background-position:0px 50%}
    100%{background-position:100px 50%}
}

@keyframes FlowAnimReverse {
    0%{background-position:100px 50%}
    100%{background-position:0px 50%}
}

.map-line-visual.forward {
    background: conic-gradient(at calc(var(--linesize)/2*1px) 50%, var(--line-color) 0deg 225deg, var(--arrow-color) 230deg 310deg, var(--line-color) 315deg 360deg);
    background-size: calc(100px/var(--speed));
    animation: FlowAnimForward 2s linear infinite;
}

.map-line-visual.reverse {
    background: conic-gradient(from 180deg at calc(100% - var(--linesize)/2*1px) 50%, var(--line-color) 0deg 225deg, var(--arrow-color) 230deg 310deg, var(--line-color) 315deg 360deg);
    background-size: calc(100px/var(--speed));
    animation: FlowAnimReverse 2s linear infinite;
}

.map-line-visual:hover {
    --line-color: hsl(var(--hue), 100%, 50%);
    --arrow-color: black;
    border: 2px solid black;
}

.line-tooltip {
    position: relative;
    display: none;
    transform-origin: 50% 0%;
    transform: rotate(calc(var(--angle-deg)*-1deg)) translateY(-50%);
    z-index: 2200;
    user-select: none;
}

.map-line-visual:hover .line-tooltip {
    display: flex;
}

.line-tooltip-content {
    border-radius: 1rem;
}


.line-loading {
    position: relative;
    display: flex;
    transform-origin: 50% 50%;
    transform: rotate(calc(var(--angle-deg)*-1deg));
    z-index: 2200;
    user-select: none;
    pointer-events: none;
}

.map-line-visual:hover .line-loading {
    display: none;
}

.ui-shadow{
    box-shadow: 0 0 5px grey;
}

</style>