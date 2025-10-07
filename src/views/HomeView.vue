<script setup lang="ts">
import MapContainer from '@/components/map/MapContainerOld.vue';
import MapLine from '@/components/map/MapLine.vue';
import MapNode from '@/components/map/MapNode.vue';

const mapNodes: {x: number, y: number}[] = []
for (let index = 0; index < 4; index++) {
    mapNodes.push({
        x: Math.random() *80 +10,
        y: Math.random() *80 +10,
    })
}

</script>

<template>
    
    <div class="size-full bg-white rounded-4xl p-8 shadow-xl flex flex-col ">
        Hjelm
        <MapContainer :inner-height="100">
            <MapNode
                v-for="mapNode, index in mapNodes"
                :key="index" 
                :x="mapNode.x" 
                :y="mapNode.y" 
            />
            
            <MapLine
                :start-x="10"
                :start-y="10"
                :end-x="30"
                :end-y="20"
            />

            <MapLine
                :start-x="10"
                :start-y="40"
                :end-x="30"
                :end-y="30"
            />

            <MapLine
                :start-x="60"
                :start-y="10"
                :end-x="60"
                :end-y="40"
            />

            <MapLine
                :start-x="10"
                :start-y="60"
                :end-x="30"
                :end-y="60"
            />
        </MapContainer>
    </div>
    
</template>