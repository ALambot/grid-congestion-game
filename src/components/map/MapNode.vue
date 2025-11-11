<script setup lang="ts">
import type { InstantiatedLevel } from '@/levels/types';
import { computed, ref, watch, type Ref } from 'vue';
import BusBars, { type BusBarsLineProps, type BusBarsProps } from '@/components/map/BusBars.vue';
import type { BaseGridLineInput, BaseGridNodeInput, SubstationGridNodeInput } from '@/models/types';


export interface MapNodeProps {
    x: number
    y: number
    kind: "generator" | "load" | "substation"
    nodeKey: string
    name?: string
    power?: number
    uiScale: number
    icon?: BaseGridNodeInput["icon"]

    redispatch?: boolean
    redispatchMin?: number
    redispatchMax?: number

    level: InstantiatedLevel
}

const {
    nodeKey,
    kind,
    x,
    y,
    power=0,
    uiScale,
    level
} = defineProps<MapNodeProps>()

const powerSign = kind === "generator" ? 1 : -1

const powerInner = ref(powerSign*power)



watch(powerInner, (newVal, oldVal) => {
    if (newVal === oldVal) return
    if (powerInner.value === power) return
    level.submitGridAction({
        kind: "redispatch",
        nodeKey: nodeKey,
        power: Number(powerInner.value)
    })
})

const powerString: Ref<string> = computed(() => {
    if (!powerInner.value) return ""
    const sign = powerSign > 0 ? "+" : "-"
    return `${sign}${powerInner.value}`
})

const powerModeString: Ref<string> = computed(() => {
    if (!powerInner.value) return ""
    return (powerInner.value ?? 0) > 0 ? "Generation" : "Load"
})

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

const isPostHover = ref(false)
function triggerPostHover() {
    isPostHover.value = true
    setTimeout(() => {
        isPostHover.value = false
    }, 500)
}

// BusBars props
const busBarProps: Ref<BusBarsProps|undefined> = computed(() => {
    // Only applicable for substations
    if (kind !== "substation") return undefined

    // Getting the node TODO optimize
    const snodes = level.computedGrid.value?.nodes.substations.filter((substationNode: SubstationGridNodeInput) => substationNode.key === nodeKey)
    if (snodes?.length !== 1) return undefined
    const snode = snodes[0]


    // Getting the lines TODO optimize
    const regularLines: BaseGridLineInput[] = level.computedGrid.value?.lines.regular ?? []
    const hvdcLines: BaseGridLineInput[] = level.computedGrid.value?.lines.hvdc ?? []
    const allLines: BaseGridLineInput[] = hvdcLines.concat(regularLines)
    

    console.log(nodeKey)
    console.log(level.solvedGrid.value)

    const slines = allLines
    .filter((rline: BaseGridLineInput ) => rline.nodeFromKey === nodeKey || rline.nodeToKey === nodeKey)
    .map((rline: BaseGridLineInput) => {

        console.log(nodeKey, rline.key, rline.nodeFromKey, rline.nodeToKey)
        
        // Is our substation the node "from" or "to" defined on this line ?
        const mode = rline.nodeFromKey === nodeKey ? "from" : "to"

        // HVDC case...
        const hvdcSuffix = mode === "from" ? "_line_in" : "_line_out"

        // Simulation results if available
        const results = level.solvedGrid.value?.[rline.key] ?? (level.solvedGrid.value?.[rline.key+hvdcSuffix])
        const flow = Number(results?.flow_MW?.toFixed(0))
        
        const bblp: BusBarsLineProps = {
            key: rline.key,
            otherNode: mode === "from" ? rline.nodeToKey : rline.nodeFromKey,
            onBus: mode === "from" ? rline.busFrom : rline.busTo,
            inflow: mode === "from" ? -flow : flow,
            loading: Number((Math.abs(results?.flow_MW ?? 0) / (results?.limit ?? 1) * 100).toFixed(0))
        }

        return bblp
    })
    
    const bbp: BusBarsProps = {
        substationKey: nodeKey,
        level: level,
        buses: snode.buses,
        lines: slines ?? []
    }

    return bbp
})

</script>

<template>

    <div 
        id="map-node" 
        class="absolute"
        :class="{'post-hover': isPostHover}"
        :style="{
            '--x': x,
            '--y': y,
            '--ui-scale': uiScale,
        }"
        @mouseleave="triggerPostHover"
    >
        <div 
            class="node-border flex justify-center items-center"
            :class="{
                'generator-border': kind === 'generator',
                'load-border': kind === 'load',
                'substation-border': kind === 'substation'
            }"
        >
            <div 
                class="node-marker flex justify-center items-center"
                :class="{
                    'generator-marker': kind === 'generator',
                    'load-marker': kind === 'load',
                    'substation-marker': kind === 'substation'
                }"
            >
                <span>{{powerString}}</span>
            </div>
        </div>

        <div 
            class="node-tooltip bg-white p-1.5 text-md border absolute flex flex-col"
            :class="{'left': x > 400}"
            @mousedown.stop
        >
            <div class="text-nowrap">{{ capitalize(kind) }} - <span class="font-mono bg-stone-100">{{nodeKey}}</span></div>
            
            <div v-if="powerString" class="text-nowrap">{{ powerModeString }}: <span class="font-bold">{{ powerString }}</span> MW</div>
            
            <div v-if="redispatch" class="text-nowrap flex flex-col">
                Redispatch:
                <div class="flex flex-row items-center gap-2">
                    {{ (redispatchMin ?? 0) * powerSign }}
                    <input class="cursor-pointer" type="range" :min="redispatchMin" :max="redispatchMax" step="10" v-model="powerInner"/>
                    {{ (redispatchMax ?? 0) * powerSign }} MW
                </div>
            </div>

            <div v-if="kind === 'substation' && busBarProps">
                <BusBars v-bind="busBarProps"></BusBars>
            </div>

        </div>

        <!-- Icons -->
        <div class="absolute icons flex items-end">

            <svg v-if="redispatch" class="decorative-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <!-- TODO obtain in a legit way or find alternative -->
                <!--! Font Awesome Pro 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc. -->
                <path xmlns="http://www.w3.org/2000/svg" fill="currentColor" d="M320 224C320 188.7 348.7 160 384 160L416 160C451.3 160 480 188.7 480 224L480 288L576 288C593.7 288 608 302.3 608 320C608 337.7 593.7 352 576 352L480 352L480 416C480 451.3 451.3 480 416 480L384 480C348.7 480 320 451.3 320 416L320 224zM32 320C32 302.3 46.3 288 64 288L272 288L272 352L64 352C46.3 352 32 337.7 32 320z"/>
            </svg>

            <svg v-if="icon === 'wind'" class="decorative-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <!-- TODO obtain in a legit way or find alternative -->
                <!--! Font Awesome Pro 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc. -->
                <path fill="currentColor" d="M380.2 446.8C389.3 461.6 412.2 453.3 409.7 436.1L381.3 244C380.8 240.6 381.4 237.1 383.1 234.1L475.4 63.2C483.7 47.9 465 32.2 451.4 43.1L299.2 163.7C296.5 165.8 293.2 167.1 289.7 167.2L95.6 172.6C78.2 173 73.9 197 90.1 203.4L270.7 274.9C273.9 276.2 276.6 278.4 278.4 281.4L380.2 446.8zM352.4 487.6C347.5 483.4 343.1 478.1 339.3 471.9L288.4 389.2L288.4 527.9L216.4 527.9C203.1 527.9 192.4 538.6 192.4 551.9C192.4 565.2 203.1 575.9 216.4 575.9L424.4 575.9C437.7 575.9 448.4 565.2 448.4 551.9C448.4 538.6 437.7 527.9 424.4 527.9L352.4 527.9L352.4 487.6zM320.5 200C333.8 200 344.5 210.7 344.5 224C344.5 237.3 333.8 248 320.5 248C307.2 248 296.5 237.3 296.5 224C296.5 210.7 307.2 200 320.5 200z"/>
            </svg>

            <svg v-if="icon === 'thermal'" class="decorative-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. -->
                <path d="M256.5 37.6C265.8 29.8 279.5 30.1 288.4 38.5C300.7 50.1 311.7 62.9 322.3 75.9C335.8 92.4 352 114.2 367.6 140.1C372.8 133.3 377.6 127.3 381.8 122.2C382.9 120.9 384 119.5 385.1 118.1C393 108.3 402.8 96 415.9 96C429.3 96 438.7 107.9 446.7 118.1C448 119.8 449.3 121.4 450.6 122.9C460.9 135.3 474.6 153.2 488.3 175.3C515.5 219.2 543.9 281.7 543.9 351.9C543.9 475.6 443.6 575.9 319.9 575.9C196.2 575.9 96 475.7 96 352C96 260.9 137.1 182 176.5 127C196.4 99.3 216.2 77.1 231.1 61.9C239.3 53.5 247.6 45.2 256.6 37.7zM321.7 480C347 480 369.4 473 390.5 459C432.6 429.6 443.9 370.8 418.6 324.6C414.1 315.6 402.6 315 396.1 322.6L370.9 351.9C364.3 359.5 352.4 359.3 346.2 351.4C328.9 329.3 297.1 289 280.9 268.4C275.5 261.5 265.7 260.4 259.4 266.5C241.1 284.3 207.9 323.3 207.9 370.8C207.9 439.4 258.5 480 321.6 480z"/>
            </svg>

            <svg v-if="icon === 'industry'" class="decorative-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <!-- TODO obtain in a legit way or find alternative -->
                <!--! Font Awesome Pro 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc. -->
                <path xmlns="http://www.w3.org/2000/svg" fill="currentColor" d="M0 88C0 57.1 25.1 32 56 32l48 0c30.9 0 56 25.1 56 56l0 84.9 103.8-60.6c32-18.7 72.2 4.4 72.2 41.5l0 27 102.1-65.4C470.1 95 512 117.9 512 155.9L512 416c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 88zm56-8c-4.4 0-8 3.6-8 8l0 328c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-260.1-139.1 89c-7.4 4.7-16.8 5-24.5 .8S288 233.4 288 224.6l0-70.9-139.9 81.6c-7.4 4.3-16.6 4.4-24 .1s-12-12.2-12-20.8L112 88c0-4.4-3.6-8-8-8L56 80z"/>
            </svg>

            <svg v-if="icon === 'town'" class="decorative-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                <!-- TODO obtain in a legit way or find alternative -->
                <!--! Font Awesome Pro 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc. -->
                <path fill="currentColor" d="M272 48l128 0c8.8 0 16 7.2 16 16l0 152c0 13.3 10.7 24 24 24l72 0c8.8 0 16 7.2 16 16l0 192c0 8.8-7.2 16-16 16l-240 0c-8.8 0-16-7.2-16-16l0-384c0-8.8 7.2-16 16-16zM208 448c0 5.5 .7 10.9 2 16L64 464c-8.8 0-16-7.2-16-16l0-288c0-8.8 7.2-16 16-16l144 0 0 304zm0-384l0 32-32 0 0-72c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 72-32 0 0-72C96 10.7 85.3 0 72 0S48 10.7 48 24l0 74c-27.6 7.1-48 32.2-48 62L0 448c0 35.3 28.7 64 64 64l448 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-48 0 0-128c0-35.3-28.7-64-64-64L272 0c-35.3 0-64 28.7-64 64zm96 48l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zM432 288c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM304 208l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zM112 192c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM304 304l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zM112 288c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0z"/>
            </svg>

        </div>
        
        
    </div>

</template>

<style scoped>

#map-node {
    left: calc(var(--x)*1px);
    top: calc(var(--y)*1px);
    z-index: 120;
    cursor: pointer;
}
#map-node:hover {
    z-index: 130;
}
#map-node.post-hover {
    z-index: 129;
}

.node-border {
    width: 32px;
    height: 32px;
    margin-left: -16px;
    margin-top: -16px;
    transform: scale(calc(1/var(--ui-scale)));
    transition: transform .25s;
}
.node-border:hover {
    width: 34px;
    height: 34px;
    margin-left: -17px;
    margin-top: -17px;
}

.node-marker {
    width: 30px;
    height: 30px;
}

.generator-border,
.load-border {
    background-color: black;
    /*box-shadow: 0px 0px 4px grey;*/
}

.generator-marker,
.load-marker {
    font-size: 80%;
    font-weight: bold;
    user-select: none;
}

.generator-marker {
    background-color: hsl(100, 100%, 90%);
}

.load-marker {
    background-color: hsl(0, 100%, 90%);
}

.substation-border {
    background-color: black;
    clip-path: circle();
}
.substation-marker {
    background-color: white;
    clip-path: circle();
}

.node-tooltip {
    display: none;
    z-index: 1500;
    border-radius: 1rem 1rem 1rem 0;
    
    bottom: calc(100% + 12px/var(--ui-scale));
    left: calc(12px/var(--ui-scale));
    right: unset;

    transform-origin: 0% 100%;
    transform: scale(calc(1/var(--ui-scale)));
    transition: transform .25s;
}
#map-node:hover .node-tooltip,
.post-hover .node-tooltip {
    display: block;
}

.node-tooltip.left {
    border-radius: 1rem 1rem 0 1rem;
    
    transform-origin: 100% 100%;
    left: unset;
    right: calc(100% + 12px/var(--ui-scale));
}

.asterisk {
    transform-origin: 0% 100%;
    transform: scale(calc(1/var(--ui-scale)));
    
    bottom: calc(100% + 2px/var(--ui-scale));
    left: calc(18px/var(--ui-scale));
    
    transition: all .25s;
}

.icons {
    transform-origin: 0% 100%;
    transform: scale(calc(1/var(--ui-scale)));
    
    bottom: calc(100% + 2px/var(--ui-scale));
    left: calc(18px/var(--ui-scale));
    
    transition: all .25s;
}

.decorative-icon {

    height: 2rem;
    width: 2rem;
    
    bottom: calc(50%);
    left: calc(50%);
    
    transition: all .25s;
}
</style>