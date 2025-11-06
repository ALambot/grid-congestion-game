<script setup lang="ts">
import { computed, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'

const leftMenuCollapsed: Ref<boolean> = ref(false)

function setLeftMenuCollapsed(newVal: boolean) {
  leftMenuCollapsed.value = newVal
}

const route = useRoute()
const currentSection = computed(() => route.params.section)
const currentlevel = computed(() => route.params.levelId)

const levelModules = import.meta.glob('@/levels/*/*.ts')
const levelEntries: { section: string, name: string, sectionC: string, nameC: string, path: string}[] = Object.keys(levelModules).map((path) => {

  const matched = path.match(/\/src\/levels\/([^/]+)\/([^/]+)(?=\.ts$)/)
  
  return { 
    path: path,
    section: matched?.[1] ?? "...",
    name: matched?.[2] ?? "...",
    sectionC: capitalize(matched?.[1] ?? "..."),
    nameC: capitalize(matched?.[2] ?? "...")
  }
})

// TODO Move to utils
function capitalize(word: string) {
    return word.charAt(0).toLocaleUpperCase() + word.slice(1)
}

</script>

<template>

  <div id="bg-main" class="size-full flex flex-col gap-2">
    
    <div class="size-full flex">

      <!-- Left menu -->
      <div v-if="!leftMenuCollapsed" class="h-full shrink-0 basis-70 bg-[hsla(100,100%,25%,100%)] flex flex-col p-4 gap-2">

        <!-- Title and collapse-->
        <div class="flex items-center justify-center gap-2 text-white fill-white">

          <span class="font-bold text-lg self-center">grid-congestion-game</span>

          <div class="grow-1"></div>
          
          <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
          <svg 
            class="size-8 cursor-pointer"
            @click="setLeftMenuCollapsed(true)"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 640 640"
          >
            <path d="M576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320zM335 199C344.4 189.6 359.6 189.6 368.9 199C378.2 208.4 378.3 223.6 368.9 232.9L281.9 319.9L368.9 406.9C378.3 416.3 378.3 431.5 368.9 440.8C359.5 450.1 344.3 450.2 335 440.8L231 337C221.6 327.6 221.6 312.4 231 303.1L335 199z"/>
          </svg>
        
        </div>
        
        <span class="text-white">A small "game" about solving energy grid congestions</span>

        <!-- Middle section-->

        <div class="grow-1 flex flex-col gap-1 overflow-auto border-white border-y p-1">
          <RouterLink
            v-for="levelEntry, index in levelEntries"
            :key="index"
            class="text-white border border-transparent hover:border-white rounded cursor-pointer p-1"
            :class="{ 'border-white bg-linear-to-r from-transparent from-50% to-[hsla(0,0%,100%,30%)]': levelEntry.section === currentSection && levelEntry.name === currentlevel }"
            :to="{ name: 'level', params: {section: levelEntry.section, levelId: levelEntry.name} }"
          >
            <span>{{ levelEntry.sectionC }} / {{ levelEntry.nameC }}</span>
          </RouterLink>
        </div>
        
        <!-- Icons -->
        <span class="self-center text-white fill-white flex justify-center gap-2">

          <a class="size-10" href="https://github.com/ALambot/grid-congestion-game">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
              <path d="M237.9 461.4C237.9 463.4 235.6 465 232.7 465C229.4 465.3 227.1 463.7 227.1 461.4C227.1 459.4 229.4 457.8 232.3 457.8C235.3 457.5 237.9 459.1 237.9 461.4zM206.8 456.9C206.1 458.9 208.1 461.2 211.1 461.8C213.7 462.8 216.7 461.8 217.3 459.8C217.9 457.8 216 455.5 213 454.6C210.4 453.9 207.5 454.9 206.8 456.9zM251 455.2C248.1 455.9 246.1 457.8 246.4 460.1C246.7 462.1 249.3 463.4 252.3 462.7C255.2 462 257.2 460.1 256.9 458.1C256.6 456.2 253.9 454.9 251 455.2zM316.8 72C178.1 72 72 177.3 72 316C72 426.9 141.8 521.8 241.5 555.2C254.3 557.5 258.8 549.6 258.8 543.1C258.8 536.9 258.5 502.7 258.5 481.7C258.5 481.7 188.5 496.7 173.8 451.9C173.8 451.9 162.4 422.8 146 415.3C146 415.3 123.1 399.6 147.6 399.9C147.6 399.9 172.5 401.9 186.2 425.7C208.1 464.3 244.8 453.2 259.1 446.6C261.4 430.6 267.9 419.5 275.1 412.9C219.2 406.7 162.8 398.6 162.8 302.4C162.8 274.9 170.4 261.1 186.4 243.5C183.8 237 175.3 210.2 189 175.6C209.9 169.1 258 202.6 258 202.6C278 197 299.5 194.1 320.8 194.1C342.1 194.1 363.6 197 383.6 202.6C383.6 202.6 431.7 169 452.6 175.6C466.3 210.3 457.8 237 455.2 243.5C471.2 261.2 481 275 481 302.4C481 398.9 422.1 406.6 366.2 412.9C375.4 420.8 383.2 435.8 383.2 459.3C383.2 493 382.9 534.7 382.9 542.9C382.9 549.4 387.5 557.3 400.2 555C500.2 521.8 568 426.9 568 316C568 177.3 455.5 72 316.8 72zM169.2 416.9C167.9 417.9 168.2 420.2 169.9 422.1C171.5 423.7 173.8 424.4 175.1 423.1C176.4 422.1 176.1 419.8 174.4 417.9C172.8 416.3 170.5 415.6 169.2 416.9zM158.4 408.8C157.7 410.1 158.7 411.7 160.7 412.7C162.3 413.7 164.3 413.4 165 412C165.7 410.7 164.7 409.1 162.7 408.1C160.7 407.5 159.1 407.8 158.4 408.8zM190.8 444.4C189.2 445.7 189.8 448.7 192.1 450.6C194.4 452.9 197.3 453.2 198.6 451.6C199.9 450.3 199.3 447.3 197.3 445.4C195.1 443.1 192.1 442.8 190.8 444.4zM179.4 429.7C177.8 430.7 177.8 433.3 179.4 435.6C181 437.9 183.7 438.9 185 437.9C186.6 436.6 186.6 434 185 431.7C183.6 429.4 181 428.4 179.4 429.7z"/>
            </svg>
          </a>
          
        </span>
        
        <!-- Copyright -->
        <span class="self-center grow-0 text-white text-xs px-2 py-1">© 2025 A.Lambot. All rights reserved.</span>

      </div>

      <div 
        v-if="leftMenuCollapsed" 
        class="h-full shrink-0 basis-12 bg-[hsla(100,100%,25%,100%)] flex flex-col p-2 fill-white cursor-pointer"
        @click="setLeftMenuCollapsed(false)"
      >
        <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
          <path d="M64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320zM305 441C295.6 450.4 280.4 450.4 271.1 441C261.8 431.6 261.7 416.4 271.1 407.1L358.1 320.1L271.1 233.1C261.7 223.7 261.7 208.5 271.1 199.2C280.5 189.9 295.7 189.8 305 199.2L409 303C418.4 312.4 418.4 327.6 409 336.9L305 441z"/>
        </svg>
      </div>

      <!-- Main content -->
      <div class="size-full p-2 overflow-auto">
        <RouterView></RouterView>
      </div>

    </div>

  </div>

  
</template>

<style scoped>

/* https://css-pattern.com/ */
#bg-main {
  --s: 100px; /* control the size*/

  --c1: hsl(100, 25%, 80%);
  --c2: hsl(100, 25%, 90%);
  --c3: hsl(100, 25%, 100%);
  
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
