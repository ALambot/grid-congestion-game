import type { GeneratorGridNodeInput, GridAction, HVDCGridLineInput, InputGridConfig, LoadGridNodeInput, RegularGridLineInput, SubstationGridNodeInput } from "@/models/types"
import type { Level } from "@/levels/types"

const generators: GeneratorGridNodeInput[] = [
    { key: "gen1", icon: "wind", generation: 50, x: 100, y: 100, },
]

const loads: LoadGridNodeInput[] = [
    { key: "load1", icon: "industry", load: 50, x: 700, y: 700, },
]

const substations: SubstationGridNodeInput[] = [
    { key: "sub1", buses: 3, x: 700, y: 100 },
    { key: "sub2", buses: 3, x: 100, y: 700 },
]

const lines: RegularGridLineInput[] = [
    { key: "line1", nodeFromKey: "gen1", busFrom: 0, nodeToKey: "sub1", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "line2", nodeFromKey: "gen1", busFrom: 0, nodeToKey: "sub2", busTo: 2, reactance: 0.1, limit: 100 },
    { key: "line3", nodeFromKey: "sub1", busFrom: 1, nodeToKey: "load1", busTo: 0, reactance: 0.1, limit: 100 },
    { key: "line4", nodeFromKey: "sub2", busFrom: 2, nodeToKey: "load1", busTo: 0, reactance: 0.1, limit: 100 },
]

const hvdc: HVDCGridLineInput[] = [
    { key: "hvdc1", nodeFromKey: "sub1", busFrom: 1, nodeToKey: "sub2", busTo: 2, setFlow: 10, flowMin: -100, flowMax: 100 },
]


const actions: GridAction[] = [
   
]

const config: InputGridConfig = {
    nodes: {
        generators: generators,
        loads: loads,
        substations: substations
    },
    lines: {
        regular: lines,
        pst: [],
        hvdc: hvdc
    },
    actions: actions
}

const level: Level = {
    gridConfig: config
}
export default level