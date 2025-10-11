<script setup lang="ts">
import { computed, type Ref } from 'vue';


export interface MapNodeProps {
    x: number,
    y: number,
    kind: "generator" | "load" | "substation",
    nodeKey: string,
    name?: string,
    power?: number,
    uiScale: number,
    asterisk?: boolean
}

const {
    x,
    y,
    power=0,
    uiScale
} = defineProps<MapNodeProps>()

const powerString: Ref<string> = computed(() => {
    if (!power) return ""
    const sign = (power ?? 0) > 0 ? "+" : ""
    return `${sign}${power}`
})

const powerModeString: Ref<string> = computed(() => {
    if (!power) return ""
    return (power ?? 0) > 0 ? "Generation" : "Load"
})

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

</script>

<template>

    <div 
        id="map-node" 
        class="absolute"
        :style="{
            '--x': x,
            '--y': y,
            '--ui-scale': uiScale
        }"
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
        >
            <div class="text-nowrap">{{ capitalize(kind) }} - <span class="font-mono bg-stone-100">{{nodeKey}}</span></div>
            <div v-if="powerString" class="text-nowrap">{{ powerModeString }}: <span class="font-bold">{{ powerString }}</span> MW</div>
        </div>

        <div v-if="asterisk" class="absolute asterisk text-3xl">
            *
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
#map-node:hover .node-tooltip {
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
    
    bottom: calc(100% - 4px/var(--ui-scale));
    left: calc(11px/var(--ui-scale));
    
    transition: all .25s;
}
</style>