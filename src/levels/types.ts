import { runSimulation } from "@/models/solver"
import type { GridAction, GridLineWithResult, InputGridConfig } from "@/models/types"
import { computed, ref, type Ref } from "vue"

export interface Level {
    gridConfig: InputGridConfig
}

export interface InstantiatedLevel {
    inputGridConfig: InputGridConfig
    computedGrid: Ref<InputGridConfig|undefined>
    gridBalance: Ref<number>
    solvedGrid: Ref<{[key: string]: GridLineWithResult}|undefined>
    submitGridAction: (action: GridAction) => void
    additionalGridActions: Ref<GridAction[]>
}

export function createLevel(inputGridConfig: InputGridConfig): InstantiatedLevel {
    
    const additionalGridActions: Ref<GridAction[]> = ref([])

    const computedGrid: Ref<InputGridConfig|undefined> = computed(() => {

        const newConfig = {...inputGridConfig}

        const allActions = newConfig.actions.concat(additionalGridActions.value)

        allActions.forEach((action: GridAction) => {
        
            if (action.kind == "redispatch") {
                
                newConfig.nodes.generators = newConfig.nodes.generators.map((node) => {
                    if (action.nodeKey === node.key) {
                        return {...node, generation: action.power}
                    }
                    return node
                })

                newConfig.nodes.loads = newConfig.nodes.loads.map((node) => {
                    if (action.nodeKey === node.key) {
                        return {...node, load: action.power}
                    }
                    return node
                })
            }
        })

        return newConfig
    })
    
    // Total generation - load
    const gridBalance: Ref<number> = computed(() => {
        
        let sum = 0
        
        computedGrid.value?.nodes.generators.forEach((node) => {
            sum += node.generation
        })

        computedGrid.value?.nodes.loads.forEach((node) => {
            sum -= node.load
        })

        return sum
    })

    const solvedGrid: Ref<{[key: string]: GridLineWithResult}|undefined> = computed(() => {
        if(!computedGrid.value) return undefined
      return runSimulation(computedGrid.value)
    })

    // compute stuff like grid balance

    function submitGridAction(action: GridAction) {
        // TODO check if action is valid

        // Look for existing action in initial actions
        if (action.kind === "redispatch") {

            let found = false

            additionalGridActions.value.forEach((a) => {
                if (!found && a.kind === "redispatch" && a.nodeKey === action.nodeKey) {
                    a.power = action.power
                    found = true
                }
            })

            if (found) return

            additionalGridActions.value.push(action)

        }
        
        
        
    }

    return {
        inputGridConfig,
        computedGrid,
        gridBalance,
        solvedGrid,
        submitGridAction,
        additionalGridActions
    }
}