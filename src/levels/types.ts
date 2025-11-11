import { runSimulations } from "@/models/solver"
import type { GridAction, GridLineWithResult, InputGridConfig } from "@/models/types"
import { computed, ref, type ComputedRef, type Ref } from "vue"

export interface Level {
    gridConfig: InputGridConfig
}

export interface InstantiatedLevel {
    inputGridConfig: InputGridConfig
    computedGrid: ComputedRef<InputGridConfig|undefined>
    gridBalance: Ref<boolean>
    solvedGrid: ComputedRef<{[key: string]: GridLineWithResult}|undefined>
    submitGridAction: (action: GridAction) => void
    additionalGridActions: Ref<GridAction[]>
}

export function createLevel(inputGridConfig: InputGridConfig): InstantiatedLevel {
    
    const additionalGridActions: Ref<GridAction[]> = ref([])

    const computedGrid: ComputedRef<InputGridConfig|undefined> = computed(() => {

        const newConfig = {...inputGridConfig}

        // Actions handling
        const allActions = newConfig.actions.concat(additionalGridActions.value)

        allActions.forEach((action: GridAction) => {
        
            // Redispatch
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

            // Bus reassignment
            if (action.kind == "buschange") {
                // On regular lines
                newConfig.lines.regular = newConfig.lines.regular.map((line) => {
                    if (action.lineKey === line.key) {
                        if (action.substationKey === line.nodeFromKey) {
                            return {...line, busFrom: action.bus}
                        }
                        if (action.substationKey === line.nodeToKey) {
                            return {...line, busTo: action.bus}
                        }
                    }
                    return line
                })

                // On HVDC lines
                newConfig.lines.hvdc = newConfig.lines.hvdc?.map((line) => {
                    if (action.lineKey === line.key) {
                        if (action.substationKey === line.nodeFromKey) {
                            return {...line, busFrom: action.bus}
                        }
                        if (action.substationKey === line.nodeToKey) {
                            return {...line, busTo: action.bus}
                        }
                    }
                    return line
                })
            }

            // HVDC Flow change
            if (action.kind == "hvdc") {

                newConfig.lines.hvdc = newConfig.lines.hvdc?.map((hvdc) => {
                    if (action.hvdcKey === hvdc.key) {
                        return {...hvdc, setFlow: action.flow}
                    }
                    return hvdc
                })
            }
        })

        return newConfig
    })
    
    // Grid or part of grid balanced or not ?
    const gridBalance: Ref<boolean> = ref(false)

    // Simulation results
    const solvedGrid: ComputedRef<{[key: string]: GridLineWithResult}|undefined> = computed(() => {
        if(!computedGrid.value) return undefined
        const { results, unbalanced } = runSimulations(computedGrid.value)
        gridBalance.value = unbalanced
        return results
    })

    function submitGridAction(action: GridAction) {
        // TODO check if action is valid

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

        if (action.kind === "buschange") {

            let found = false

            additionalGridActions.value.forEach((a) => {
                if (
                    !found 
                    && a.kind === "buschange" 
                    && a.substationKey === action.substationKey
                    && a.lineKey === action.lineKey
                ) {
                    a.bus = action.bus
                    found = true
                }
            })

            if (found) return

            additionalGridActions.value.push(action)
        }

        if (action.kind === "hvdc") {

            let found = false

            additionalGridActions.value.forEach((a) => {
                if (!found && a.kind === "hvdc" && a.hvdcKey === action.hvdcKey) {
                    a.flow = action.flow
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

const levelModules = import.meta.glob('@/levels/*/*.ts')

export async function loadLevel(name: string) {
    console.log("Loading level:", name)
    const path = `/src/levels/${name}.ts`
    const mod = await levelModules[path]()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mod as any).default as Level
}