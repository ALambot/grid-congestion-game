<script setup lang="ts">
import type { InstantiatedLevel } from '@/levels/types'
import { ref, computed, type Ref } from 'vue'


export interface BusBarsLineProps {
    key: string
    otherNode: string 
    onBus: number
    inflow?: number
    loading?: number
}

export interface BusBarsProps {
    substationKey: string
    buses: number
    lines: BusBarsLineProps[]
    
    level: InstantiatedLevel
}

const {
    substationKey,
    buses,
    lines,
    level
} = defineProps<BusBarsProps>()

const connections = computed(() => {
    return lines.map((line, lindex) => {
        const pb = []
        for (let bindex = 0; bindex < buses; bindex++) {
            pb.push({
                col: lindex+2,
                row: bindex+2,
                active: line.onBus === bindex+1
            })
        }
        return pb
    }).flat()
})

const hoveredRow: Ref<number|undefined> = ref(undefined)
const hoveredCol: Ref<number|undefined> = ref(undefined)

function setHover(row: number, col: number) {
    hoveredRow.value = row
    hoveredCol.value = col
}

function unsetHover(row: number, col: number) {
    if (hoveredRow.value === row && hoveredCol.value === col) {
        hoveredRow.value = undefined
        hoveredCol.value = undefined
    }
}

function setConnection(row: number, col: number) {
    const lineKey = lines[col-2].key
    const bus = row-1

    level.submitGridAction({
        kind: "buschange",
        substationKey: substationKey,
        lineKey: lineKey,
        bus: bus
    })
}

</script>

<template>

    <div 
        class="w-full"
        :style="{
            '--buses': buses+1,
            '--lines': lines.length+1,
        }"
    >

        <div 
            class="bus-bars-grid p-2 rounded-xl"
        >
            <!-- Row headers : Bus numbers -->
            <span 
                v-for="bus, idx in buses" :key="idx" 
                class="bus-bars-grid-cell" 
                :style="{'--row': bus+1, '--col': 1}"
            >
                Bus {{ bus }}
            </span>

            <!-- Col headers : Line info -->
            <div
                v-for="line, idx in lines" :key="idx" 
                class="bus-bars-grid-cell flex flex-col items-center justify-center bg-white m-2 rounded shadow-md" 
                :style="{'--row': 1, '--col': idx+2}"
            >
                <span class="font-mono bg-gray-100">{{ line.key }}</span>

                <span>{{ line.inflow ?? '-' }} <span class="text-xs">MW</span></span>

                <div 
                    class="flex items-center"
                    :class="{'text-red-500 font-bold fill-red-500': (line.loading ?? 0) > 100}"
                >

                    <!-- FontAwesome Down Arrow -->
                    <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                    <svg v-if="(line.inflow ?? 0) > 0" class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path d="M297.4 566.6C309.9 579.1 330.2 579.1 342.7 566.6L502.7 406.6C515.2 394.1 515.2 373.8 502.7 361.3C490.2 348.8 469.9 348.8 457.4 361.3L352 466.7L352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 466.7L182.6 361.3C170.1 348.8 149.8 348.8 137.3 361.3C124.8 373.8 124.8 394.1 137.3 406.6L297.3 566.6z"/>
                    </svg>

                    <!-- FontAwesome Up Arrow -->
                    <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
                    <svg v-if="(line.inflow ?? 0) < 0" class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                        <path d="M342.6 81.4C330.1 68.9 309.8 68.9 297.3 81.4L137.3 241.4C124.8 253.9 124.8 274.2 137.3 286.7C149.8 299.2 170.1 299.2 182.6 286.7L288 181.3L288 552C288 569.7 302.3 584 320 584C337.7 584 352 569.7 352 552L352 181.3L457.4 286.7C469.9 299.2 490.2 299.2 502.7 286.7C515.2 274.2 515.2 253.9 502.7 241.4L342.7 81.4z"/>
                    </svg>

                    <span>{{ line.loading ?? '-' }} <span class="text-xs">%</span></span>
                </div>

            </div>

            <!-- Bus bars -->
            <div
                v-for="bus, idx in buses" :key="idx"
                :style="{'--row': bus+1}"
                class="bus-bar-container col-start-2 -col-end-1 flex items-center justify-center"
            >
                <div 
                    class="w-full bus-bar"
                    :class="{'hovered': hoveredRow === bus+1 }"
                >
                </div>
            </div>

            <!-- Line bars -->
            <div
                v-for="line, idx in lines" :key="idx"
                :style="{'--col': idx+2}"
                class="line-bar-container row-start-2 -row-end-1 flex items-center justify-center"
            >
                <div 
                    class="h-full line-bar"
                    :class="{'hovered': hoveredCol === idx+2 }"
                >
                </div>
            </div>

            <!-- Bus+Line connections -->
            <div
                v-for="connection, index in connections" :key="index"
                class="bus-bars-grid-cell connection !p-0"
                :style="{'--row': connection.row, '--col': connection.col}"
            >
                <div 
                    class="size-full flex items-center justify-center z-5 cursor-pointer" 
                    @mouseover="setHover(connection.row, connection.col)"
                    @mouseleave="unsetHover(connection.row, connection.col)"
                    @click="setConnection(connection.row, connection.col)"
                >
                    <!-- Actually connected -->
                    <div 
                        v-if="connection.active && (hoveredCol !== connection.col || hoveredRow === connection.row)" 
                        class="connection-orb"
                    >
                    </div>
                    
                    <!-- Dimmed if hover on another row same col-->
                     <div 
                        v-if="connection.active && hoveredCol === connection.col && hoveredRow !== connection.row" 
                        class="connection-orb flex items-center justify-center"
                    >
                        <div class="connection-orb-dimmed-inner">

                        </div>
                    </div>

                    <!-- Ghost on hover -->
                    <div 
                        v-if="!connection.active && hoveredCol === connection.col && hoveredRow === connection.row" 
                        class="connection-orb flex items-center justify-center"
                    >
                        <div class="connection-orb-ghost-inner">

                        </div>
                    </div>
                </div>
                
            </div>

        </div>

    </div>

</template>

<style scoped>

.bus-bars-grid {
    display: grid;
    background: hsl(100, 100%, 98%);
    box-shadow: inset 0px .05rem .2rem 0px hsla(0, 0%, 0%, 0.3);
    grid-template-columns: 50px repeat(calc(var(--lines) - 1), 100px);
    grid-template-rows: 100px repeat(calc(var(--buses) - 1), 1fr);
}

.bus-bars-grid-cell {
    grid-column: var(--col);
    grid-row: var(--row);
    padding: .2rem;
}

.connection-orb {
    background: black;
    width: 14px;
    height: 14px;
    clip-path: circle();
}

.connection-orb-dimmed-inner {
    background: hsl(0, 0%, 100%);
    width: 12px;
    height: 12px;
    clip-path: circle();
}

.connection-orb-ghost-inner {
    background: hsl(0, 0%, 0%);
    width: 12px;
    height: 12px;
    clip-path: circle();
}

.bus-bar-container {
    grid-row: var(--row);
}

.bus-bar {
    background: black;
    border-top: 3px white solid;
    border-bottom: 3px white solid;
    height: 8px;
}
.bus-bar.hovered {
    height: 10px;
}

.line-bar-container {
    grid-column: var(--col);
}

.line-bar {
    background: black;
    border-left: 3px white solid;
    border-right: 3px white solid;
    width: 8px;
}
.line-bar.hovered {
    width: 10px;
}

</style>