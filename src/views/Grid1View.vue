<script setup lang="ts">
import MapNode from '@/components/map/MapNode.vue'
import MapLine from '@/components/map/MapLine.vue'
import MapContainer from '@/components/MapContainer.vue'
import type { BaseGridNodeInput, GridLineWithResult } from '@/models/types'
import { runSimulation } from '@/models/solver'
import { computed, ref, type Ref } from 'vue'

import dummyLevel from '@/levels/dummy1'
import type { Level } from '@/levels/types'

const level: Level = dummyLevel

const nodeLookup: Record<string, BaseGridNodeInput> = {}
const allNodes = [...level.gridConfig.nodes.generators, ...level.gridConfig.nodes.loads, ...level.gridConfig.nodes.substations]
allNodes.forEach((node) => {nodeLookup[node.key] = node})

const simulationResult: Ref<{[key: string]: GridLineWithResult}|undefined> = ref(undefined)

const maxLoading: Ref<number|undefined> = computed(() => {
    if (!simulationResult.value) return undefined
    return Math.max( ...(Object.values(simulationResult.value).map((lr: GridLineWithResult) => {
        return Math.round(Math.abs(lr.flow_MW)/lr.limit * 100)
    })))
})

function run(){
    simulationResult.value = runSimulation(level.gridConfig)
}

const uiScale: Ref<number> = ref(1)

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
                    <div class="flex flex-col w-fit justify-start p-2 border bg-white rounded-xl pointer-events-auto">
                        
                        <button class="bg-blue-700 text-white py-1 px-2 rounded cursor-pointer" @click="run()">Run simulation</button>
                        <span v-if="simulationResult">Max loading: <span class="font-bold">{{ maxLoading }}</span> %</span>

                    </div>
                </div>
            </template>

            <div class="size-[800px] bg-green-50">

                <MapNode
                    v-for="node, index in level.gridConfig.nodes.generators" :key="index"
                    :node-key="node.key"
                    :x="node.x"
                    :y="node.y"
                    kind="generator"
                    :power="node.generation"
                    :ui-scale="uiScale"
                    :asterisk="node.allowRedispatch"
                />

                <MapNode
                    v-for="node, index in level.gridConfig.nodes.loads" :key="index"
                    :node-key="node.key"
                    :x="node.x"
                    :y="node.y"
                    kind="load"
                    :power="-node.load"
                    :ui-scale="uiScale"
                    :asterisk="node.allowRedispatch"
                />

                <MapNode
                    v-for="node, index in level.gridConfig.nodes.substations" :key="index"
                    :node-key="node.key"
                    :x="node.x"
                    :y="node.y"
                    kind="substation"
                    :ui-scale="uiScale"
                />

                <MapLine
                    v-for="line, index in level.gridConfig.lines.regular" :key="index"
                    :line-key="line.key"
                    :start-x="nodeLookup[line.nodeFromKey].x"
                    :start-y="nodeLookup[line.nodeFromKey].y"
                    :end-x="nodeLookup[line.nodeToKey].x"
                    :end-y="nodeLookup[line.nodeToKey].y"
                    :capacity="line.limit"
                    :flow="simulationResult?.[line.key].flow_MW"
                    :reactance="line.reactance"
                    :ui-scale="uiScale"
                />

            </div>
        
        </MapContainer>

    </div>

    <div class="h-full bg-white outline w-[30%] rounded-2xl p-4">
        Actions

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

</style>