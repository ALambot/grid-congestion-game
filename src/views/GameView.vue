<script setup lang="ts">
import MapNode from '@/components/map/MapNode.vue'
import MapLine from '@/components/map/MapLine.vue'
import MapContainer from '@/components/MapContainer.vue'
import type { BaseGridNodeInput, GridLineWithResult } from '@/models/types'
import { computed, onMounted, ref, shallowRef, watch, type Ref, type ShallowRef } from 'vue'

import { useRoute } from 'vue-router'

import { createLevel, loadLevel, type InstantiatedLevel, type Level } from '@/levels/types'

const route = useRoute()
const targetLevel = computed(() => `${route.params.section}/${route.params.levelId}`)

// ShallowRef to avoid auto ref unwrapping of computedGrid, solvedGrid, ... which causes TS to no longer agree with correct unwrapping
const level: ShallowRef<InstantiatedLevel|undefined> = shallowRef(undefined)
const loadedLevel: Ref<Level|undefined> = ref(undefined)

const uiScale: Ref<number> = ref(1)

const nodeLookup: Ref<Record<string, BaseGridNodeInput>> = computed(() => {

    const nlo: Record<string, BaseGridNodeInput> = {}

    const allNodes = [
        ...level.value?.inputGridConfig.nodes.generators ?? [], 
        ...level.value?.inputGridConfig.nodes.loads ?? [], 
        ...level.value?.inputGridConfig.nodes.substations ?? []
    ]
    allNodes.forEach((node) => {nlo[node.key] = node})

    return nlo
})

const maxLoading: Ref<number|undefined> = computed(() => {
    if (!level.value?.solvedGrid.value) return undefined
    return Math.max( ...(Object.values(level.value.solvedGrid.value).map((lr: GridLineWithResult) => {
        return Math.round(Math.abs(lr.flow_MW)/lr.limit * 100)
    })))
})

// TODO Move to utils
function capitalize(word: string) {
    return word.charAt(0).toLocaleUpperCase() + word.slice(1)
}

async function reloadLevel() {
    // Reset level, otherwise stuff is not reactively reset properly
    level.value = undefined
    uiScale.value = 1
    // Init again
    const loadedLevel_ = (await loadLevel(targetLevel.value)) as Level
    uiScale.value = loadedLevel_.startingZoom ?? 1
    const createdLevel: InstantiatedLevel = createLevel(loadedLevel_.gridConfig)
    level.value = createdLevel
    loadedLevel.value = loadedLevel_
}

watch(targetLevel, () => {
    reloadLevel()
})

onMounted(() => {
    reloadLevel()
})

</script>

<template>

<Transition name="fade">
<div v-if="level" id="game-container" class="size-full flex flex-row items-center justify-center gap-2">

    <div class="grow-1 size-full flex items-center justify-center">
        <div 
            class="size-full map-container-container outline rounded-2xl overflow-hidden grow-1" 
            :style="{
                '--canvas-width': loadedLevel?.canvasWidth ?? 800,
                '--canvas-height': loadedLevel?.canvasHeight ?? 800
            }"
        >

            <MapContainer
                v-model:scale="uiScale"
                class="backdrop-blur"
                :min-scale="loadedLevel?.minScale ?? 1"
                :max-scale="loadedLevel?.maxScale ?? 5"
            >

                <template #overlay>
                    <div class="size-full p-2 flex flex-col-reverse">

                        <div class="flex flex-row gap-2 items-end">

                            <div class="flex-none flex flex-col size-fit justify-start p-2 border bg-white rounded-xl pointer-events-auto">
                            
                                <span v-if="level?.solvedGrid.value">Max loading: <span class="font-bold">{{ maxLoading ?? "-" }}</span> %</span>

                            </div>

                            <div v-if="level?.gridBalance.value" class="shrink w-full h-fit p-2 rounded-xl disclaimer-unbalanced flex items-center justify-center">
                                GRID OUT-OF-BALANCE
                            </div>

                            </div>
                        
                    </div>
                </template>

                <div 
                    v-if="level?.computedGrid.value" 
                    class="map-container-canvas bg-green-50"
                    :style="{
                        '--canvas-width': loadedLevel?.canvasWidth ?? 800,
                        '--canvas-height': loadedLevel?.canvasHeight ?? 800
                    }"
                >

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
                        :icon="node.icon"
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
                        :icon="node.icon"
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
                        :icon="node.icon"
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
                        :level="level"
                    />

                    <!-- HVDC Lines -->
                    <MapLine
                        v-for="line, index in level.computedGrid.value.lines.hvdc" :key="index"
                        line-type="hvdc"
                        :line-key="line.key"
                        :start-x="nodeLookup[line.nodeFromKey].x"
                        :start-y="nodeLookup[line.nodeFromKey].y"
                        :end-x="nodeLookup[line.nodeToKey].x"
                        :end-y="nodeLookup[line.nodeToKey].y"
                        :flow="line.setFlow"
                        :ui-scale="uiScale"
                        :hvdc-flow-min="line.flowMin"
                        :hvdc-flow-max="line.flowMax"
                        :level="level"
                    />

                </div>
            
            </MapContainer>

        </div>
    </div>

    <div v-if="level?.computedGrid.value" class="h-full bg-white outline w-[250px] rounded-2xl p-4 overflow-auto flex flex-col gap-2 grow-0">

        <span class="text-xl">Grid actions</span>
        <div 
            v-for="action, index in level.computedGrid.value.actions.concat(level.additionalGridActions.value)"
            :key="index"
            >
                <div 
                    class="rounded flex flex-col border p-2"
                    :class="{
                        'bg-amber-100 border-amber-800': action.kind === 'redispatch',
                        'bg-green-100 border-green-800': action.kind === 'buschange',
                        'bg-blue-100 border-blue-800': action.kind === 'hvdc',
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
</Transition>

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

/** Transition fade */
.fade-enter-active,
.fade-leave-active {
  transition: all .5s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

pre {
    overflow: auto;
    border: 1px solid black;
}

.disclaimer-unbalanced {
    background: repeating-linear-gradient(45deg, hsla(0, 100%, 50%, 0.3) 0px, hsla(0, 100%, 50%, 0.3) 20px,  #ffffff00 20px, #ffffff00 40px);
    border: 2px hsla(0, 100%, 50%) solid;
    color: white;
    font-weight: 700;
    font-size: 1.2rem;
    text-shadow: 0 0 1px black, 0 0 2px black, 0 0 3px black, 0 0 4px black;
    box-shadow: inset 0px 0px 10px 0px hsla(0, 0%, 0%, 0.5);
}

.map-container-container {
    max-width: calc(var(--canvas-width) * 1px);
    max-height: calc(var(--canvas-height) * 1px);
}

.map-container-canvas {
    width: calc(var(--canvas-width) * 1px);
    height: calc(var(--canvas-height) * 1px);
}

</style>