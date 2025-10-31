<script setup lang="ts">
import MapNode from '@/components/map/MapNode.vue'
import MapLine from '@/components/map/MapLine.vue'
import MapContainer from '@/components/MapContainer.vue'
import type { BaseGridNodeInput, GridLineWithResult } from '@/models/types'
import { computed, ref, type Ref } from 'vue'

import dummyLevel from '@/levels/dummy1'
import { createLevel } from '@/levels/types'

const level = createLevel(dummyLevel.gridConfig)

const nodeLookup: Record<string, BaseGridNodeInput> = {}
const allNodes = [...level.inputGridConfig.nodes.generators, ...level.inputGridConfig.nodes.loads, ...level.inputGridConfig.nodes.substations]
allNodes.forEach((node) => {nodeLookup[node.key] = node})


const maxLoading: Ref<number|undefined> = computed(() => {
    if (!level.solvedGrid.value) return undefined
    return Math.max( ...(Object.values(level.solvedGrid.value).map((lr: GridLineWithResult) => {
        return Math.round(Math.abs(lr.flow_MW)/lr.limit * 100)
    })))
})

const uiScale: Ref<number> = ref(1)

function capitalize(word: string) {
    return word.charAt(0).toLocaleUpperCase() + word.slice(1)
}

</script>

<template>

<div class="size-full flex flex-row items-start justify-center gap-5">

    <div class="size-[800px] outline rounded-2xl overflow-hidden">

        <MapContainer
            v-model:scale="uiScale"
            :min-scale="1"
            :max-scale="5"
        >

            <template #overlay>
                <div class="size-full p-2 flex flex-col-reverse">

                    <div class="flex flex-row gap-2 items-end">

                        <div class="flex-none flex flex-col size-fit justify-start p-2 border bg-white rounded-xl pointer-events-auto">
                        
                            <span v-if="level.solvedGrid">Max loading: <span class="font-bold">{{ maxLoading ?? "-" }}</span> %</span>

                        </div>

                        <div v-if="level.gridBalance.value" class="shrink w-full h-fit p-2 rounded-xl disclaimer-unbalanced flex items-center justify-center">
                            GRID OUT-OF-BALANCE {{ level.gridBalance.value > 0 ? "+" : "" }} {{ level.gridBalance }} MW
                        </div>

                        </div>
                    
                </div>
            </template>

            <div v-if="level.computedGrid.value" class="size-[800px] bg-green-50">

                <!-- Generators -->
                <MapNode
                    v-for="node, index in level.computedGrid.value.nodes.generators" :key="index"
                    :node-key="node.key"
                    :x="node.x"
                    :y="node.y"
                    kind="generator"
                    :power="node.generation"
                    :ui-scale="uiScale"
                    :redispatch="node.allowRedispatch"
                    :redispatch-min="node.redispatchMin"
                    :redispatch-max="node.redispatchMax"
                    :level="level"
                />

                <!-- Loads -->
                <MapNode
                    v-for="node, index in level.computedGrid.value.nodes.loads" :key="index"
                    :node-key="node.key"
                    :x="node.x"
                    :y="node.y"
                    kind="load"
                    :power="-node.load"
                    :ui-scale="uiScale"
                    :redispatch="node.allowRedispatch"
                    :redispatch-min="node.redispatchMin"
                    :redispatch-max="node.redispatchMax"
                    :level="level"
                />

                <!-- Substations -->
                <MapNode
                    v-for="node, index in level.computedGrid.value.nodes.substations" :key="index"
                    :node-key="node.key"
                    :x="node.x"
                    :y="node.y"
                    kind="substation"
                    :ui-scale="uiScale"
                    :level="level"
                />

                <!-- Lines -->
                <MapLine
                    v-for="line, index in level.computedGrid.value.lines.regular" :key="index"
                    :line-key="line.key"
                    :start-x="nodeLookup[line.nodeFromKey].x"
                    :start-y="nodeLookup[line.nodeFromKey].y"
                    :end-x="nodeLookup[line.nodeToKey].x"
                    :end-y="nodeLookup[line.nodeToKey].y"
                    :capacity="line.limit"
                    :flow="level.solvedGrid.value?.[line.key]?.flow_MW"
                    :reactance="line.reactance"
                    :ui-scale="uiScale"
                />

            </div>
        
        </MapContainer>

    </div>

    <div v-if="level.computedGrid.value" class="h-full bg-white outline w-[30%] rounded-2xl p-4 overflow-auto flex flex-col gap-2">

        <span class="text-xl">Grid actions</span>
        <div 
            v-for="action, index in level.computedGrid.value.actions.concat(level.additionalGridActions.value)"
            :key="index"
            >
                <div 
                    class="rounded flex flex-col border p-2"
                    :class="{
                        'bg-amber-100 border-amber-800': action.kind === 'redispatch',
                        'bg-blue-100 border-blue-800': action.kind === 'buschange'
                    }"
                >
                    <span class="font-bold">{{ capitalize(action.kind) }}</span>
                    <span 
                        v-for="actionDetails, index in Object.entries(action).filter((det) => det[0] !== 'kind')"
                        :key="index"
                    >
                        {{ capitalize(actionDetails[0]) }}: <span class="font-mono bg-gray-100">{{ actionDetails[1] }}</span>
                    </span>
                </div>

        </div>

    </div>

</div>

</template>

<style scoped>

.pattern {
    --s: 100px; /* control the size*/
    --c1: #b2b2b2;
    --c2: #ffffff;
    --c3: #d9d9d9;
    
    --_g: var(--c3) 0 120deg,#0000 0;
    background:
        conic-gradient(from -60deg at 50% calc(100%/3),var(--_g)),
        conic-gradient(from 120deg at 50% calc(200%/3),var(--_g)),
        conic-gradient(from  60deg at calc(200%/3),var(--c3) 60deg,var(--c2) 0 120deg,#0000 0),
        conic-gradient(from 180deg at calc(100%/3),var(--c1) 60deg,var(--_g)),
        linear-gradient(90deg,var(--c1)   calc(100%/6),var(--c2) 0 50%,
                            var(--c1) 0 calc(500%/6),var(--c2) 0);
    background-size: calc(1.732*var(--s)) var(--s);
}

pre {
    overflow: auto;
    border: 1px solid black;
}

.disclaimer-unbalanced {
    background: repeating-linear-gradient(45deg, hsla(0, 100%, 50%, 0.5) 0px, hsla(0, 100%, 50%, 0.5) 20px,  #ffffff00 20px, #ffffff00 40px);
    border: 2px hsla(0, 100%, 50%) solid;
    color: white;
    font-weight: 900;
    font-size: 1.5rem;
    -webkit-text-stroke: 1px black;
    text-shadow: 0 0 10px white, 0 0 2px black, 0 0 2px black, 0 0 2px black;
    box-shadow: inset 0px 0px 10px 0px hsla(0, 0%, 0%, 0.5);
}

</style>