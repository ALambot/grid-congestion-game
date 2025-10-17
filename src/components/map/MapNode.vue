<script setup lang="ts">
import type { InstantiatedLevel } from '@/levels/types';
import { computed, ref, watch, type Ref } from 'vue';


export interface MapNodeProps {
    x: number,
    y: number,
    kind: "generator" | "load" | "substation",
    nodeKey: string,
    name?: string,
    power?: number,
    uiScale: number,

    redispatch?: boolean,
    redispatchMin?: number,
    redispatchMax?: number,

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
            :class="{'left': x > 500}"
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
        </div>

        <div v-if="redispatch" class="absolute asterisk text-xl">
            R
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
    box-shadow: 0px 0px 4px grey;
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
</style>