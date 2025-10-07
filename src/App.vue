<script setup lang="ts"></script>

<template>
  <div id="bg-main" class="size-full p-8">
    
    <RouterView></RouterView>

  </div>
</template>

<style scoped>

#bg-main {
  --s: 70px; /* control the size*/
  
  --c1: #b9b9b9;
  --c2: #dcdcdc;
  --c3: #fafafa;

  --c1: #DDDDDD;
  --c2: #EEEEEE;
  --c3: #FFFFFF;
  
  background:
    conic-gradient(from 75deg,var(--c1)   15deg ,var(--c2) 0 30deg ,#0000 0 180deg,
                              var(--c2) 0 195deg,var(--c1) 0 210deg,#0000 0) 
       calc(var(--s)/2) calc(.5*var(--s)/tan(30deg)),
    conic-gradient(var(--c1)   30deg ,var(--c3) 0 75deg ,var(--c1) 0 90deg, var(--c2) 0 105deg,
                   var(--c3) 0 150deg,var(--c2) 0 180deg,var(--c3) 0 210deg,var(--c1) 0 256deg,
                   var(--c2) 0 270deg,var(--c1) 0 286deg,var(--c2) 0 331deg,var(--c3) 0);
  background-size: var(--s) calc(var(--s)/tan(30deg));
}


</style>
