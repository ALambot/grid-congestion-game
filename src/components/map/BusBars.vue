<script setup lang="ts">
import { ref, computed } from 'vue'


/*
export interface BusBarsProps {
    buses?: number,
    lines?: any[]
}

const {
    buses,
    lines
} = defineProps<BusBarsProps>()
*/

const buses = 3
const lines = ref([
    { key: "line1", otherNode: "gen1", inflow: +10, loading: 40, onBus: 1 },
    { key: "line2", otherNode: "gen2", inflow: +20, loading: 80, onBus: 2 },
    { key: "line3", otherNode: "load1", inflow: -20, loading: 80, onBus: 2 },
    { key: "line4", otherNode: "load2", inflow: -10, loading: 40, onBus: 1 },
])
const connections = computed(() => {
    return lines.value.map((line, lindex) => {
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


</script>

<template>

    <div 
        class="border w-full rounded p-2"
        :style="{
            '--buses': buses+1,
            '--lines': lines.length+1,
        }"
    >

        Substation / BusBar UI Component test

        <div 
            class="bus-bars-grid"
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
                class="bus-bars-grid-cell flex flex-col" 
                :style="{'--row': 1, '--col': idx+2}"
            >
                <span>{{ line.key }}</span>
                <span>{{ line.inflow }} MW</span>
                <span>{{ line.loading }} %</span>
            </div>

            <!-- Bus+Line connections -->
            <div
                v-for="connection, index in connections" :key="index"
                class="bus-bars-grid-cell connection flex items-center justify-center"
                :style="{'--row': connection.row, '--col': connection.col}"
            >
                <div v-if="connection.active" class="connection-orb bg-black"></div>
            </div>

            <!-- Bus bars -->
            <div
                v-for="bus, idx in buses" :key="idx"
                :style="{'--row': bus+1}"
                class="bus-bar-container col-start-2 -col-end-1 flex items-center justify-center"
            >
                <div class="size-full bus-bar"></div>
            </div>

            <!-- Line bars -->
            <div
                v-for="line, idx in lines" :key="idx"
                :style="{'--col': idx+2}"
                class="line-bar-container row-start-2 -row-end-1 flex items-center justify-center"
            >
                <div class="h-full line-bar"></div>
            </div>

        </div>

    </div>

</template>

<style scoped>

.bus-bars-grid {
    display: grid;
    background: hsl(120, 100%, 95%);
    grid-template-columns: repeat(var(--lines), 1fr);
    grid-template-rows: 120px repeat(calc(var(--buses) - 1), 1fr);
}

.bus-bars-grid-cell {
    grid-column: var(--col);
    grid-row: var(--row);
    padding: .5rem;
}

.bus-bars-grid-cell.connection:hover {
    background: red;
}

.connection-orb {
    width: 16px;
    height: 16px;
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

.line-bar-container {
    grid-column: var(--col);
}

.line-bar {
    background: black;
    border-left: 3px white solid;
    border-right: 3px white solid;
    width: 8px;
}

</style>