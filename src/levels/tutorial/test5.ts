import type { GeneratorGridNodeInput, GridAction, HVDCGridLineInput, InputGridConfig, LoadGridNodeInput, RegularGridLineInput, SubstationGridNodeInput } from "@/models/types"
import type { Level } from "@/levels/types"

const generators: GeneratorGridNodeInput[] = [
    { key: "w-wind-1", icon: "wind", generation: 25, x: 200, y: 100 },
    { key: "w-wind-2", icon: "wind", generation: 35, x: 180, y: 190 },
    { key: "nsl-coal-1", icon: "thermal", generation: 120, x: 420, y: 440 },
]

const loads: LoadGridNodeInput[] = [
    { key: "e-town-1", icon: "town", load: 60, x: 1400, y: 250 },
    { key: "n-town-1", icon: "town", load: 60, x: 550, y: 80 },
    { key: "s-town-1", icon: "town", load: 60, x: 650, y: 800 },
]

const substations: SubstationGridNodeInput[] = [
    { key: "ewl-sub-1", buses: 3, x: 300, y: 200 },
    { key: "ewl-sub-2", buses: 3, x: 500, y: 210 },
    { key: "ewl-sub-3", buses: 3, x: 700, y: 200 },
    { key: "ewl-sub-4", buses: 3, x: 900, y: 190 },
    { key: "ewl-sub-5", buses: 3, x: 1100, y: 200 },
    { key: "ewl-sub-6", buses: 3, x: 1300, y: 220 },
    
    { key: "nsl-sub-1", buses: 3, x: 420, y: 100 },
    { key: "nsl-sub-2", buses: 3, x: 550, y: 400 },
    { key: "nsl-sub-3", buses: 3, x: 620, y: 600 },
    { key: "nsl-sub-3-bis", buses: 3, x: 670, y: 550 },
    { key: "nsl-sub-4", buses: 3, x: 750, y: 770 },

    { key: "cen-sub-1", buses: 3, x: 1050, y: 450 },
    { key: "cen-sub-2", buses: 3, x: 1200, y: 550 },
    { key: "cen-sub-3", buses: 3, x: 1150, y: 720 },
    { key: "cen-sub-4", buses: 3, x: 870, y: 620 },
]

const lines: RegularGridLineInput[] = [
    
    { key: "ewl-1", nodeFromKey: "ewl-sub-1", busFrom: 1, nodeToKey: "ewl-sub-2", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "ewl-2", nodeFromKey: "ewl-sub-2", busFrom: 1, nodeToKey: "ewl-sub-3", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "ewl-3", nodeFromKey: "ewl-sub-3", busFrom: 1, nodeToKey: "ewl-sub-4", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "ewl-4", nodeFromKey: "ewl-sub-4", busFrom: 1, nodeToKey: "ewl-sub-5", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "ewl-5", nodeFromKey: "ewl-sub-5", busFrom: 1, nodeToKey: "ewl-sub-6", busTo: 1, reactance: 0.1, limit: 100 },

    { key: "nsl-1", nodeFromKey: "nsl-sub-1", busFrom: 1, nodeToKey: "ewl-sub-2", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "nsl-2", nodeFromKey: "ewl-sub-2", busFrom: 1, nodeToKey: "nsl-sub-2", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "nsl-3", nodeFromKey: "nsl-sub-2", busFrom: 1, nodeToKey: "nsl-sub-3", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "nsl-4", nodeFromKey: "nsl-sub-3", busFrom: 1, nodeToKey: "nsl-sub-4", busTo: 1, reactance: 0.1, limit: 100 },

    { key: "nsl-3-b-1", nodeFromKey: "nsl-sub-2", busFrom: 1, nodeToKey: "nsl-sub-3-bis", busTo: 1, reactance: 0.1, limit: 50 },
    { key: "nsl-3-b-2", nodeFromKey: "nsl-sub-3-bis", busFrom: 1, nodeToKey: "cen-sub-4", busTo: 1, reactance: 0.1, limit: 50 },

    { key: "cenl-1", nodeFromKey: "cen-sub-1", busFrom: 1, nodeToKey: "cen-sub-2", busTo: 1, reactance: 0.1, limit: 60 },
    { key: "cenl-2", nodeFromKey: "cen-sub-2", busFrom: 1, nodeToKey: "cen-sub-3", busTo: 1, reactance: 0.1, limit: 60 },
    { key: "cenl-3", nodeFromKey: "cen-sub-3", busFrom: 1, nodeToKey: "cen-sub-4", busTo: 1, reactance: 0.1, limit: 60 },
    { key: "cenl-4", nodeFromKey: "cen-sub-4", busFrom: 1, nodeToKey: "cen-sub-1", busTo: 1, reactance: 0.1, limit: 60 },

    { key: "cenl-n", nodeFromKey: "cen-sub-1", busFrom: 1, nodeToKey: "ewl-sub-5", busTo: 1, reactance: 0.1, limit: 60 },

    { key: "w-wind-1-l", nodeFromKey: "w-wind-1", busFrom: 0, nodeToKey: "ewl-sub-1", busTo: 1, reactance: 0.1, limit: 50 },
    { key: "w-wind-2-l", nodeFromKey: "w-wind-2", busFrom: 0, nodeToKey: "ewl-sub-1", busTo: 1, reactance: 0.1, limit: 50 },
    { key: "nsl-coal-1-l", nodeFromKey: "nsl-coal-1", busFrom: 0, nodeToKey: "nsl-sub-2", busTo: 1, reactance: 0.1, limit: 150 },

    { key: "e-town-1-l", nodeFromKey: "e-town-1", busFrom: 0, nodeToKey: "ewl-sub-6", busTo: 1, reactance: 0.1, limit: 80 },
    { key: "n-town-1-l", nodeFromKey: "n-town-1", busFrom: 0, nodeToKey: "nsl-sub-1", busTo: 1, reactance: 0.1, limit: 80 },
    { key: "s-town-1-l", nodeFromKey: "s-town-1", busFrom: 0, nodeToKey: "nsl-sub-4", busTo: 1, reactance: 0.1, limit: 80 },
]

const hvdc: HVDCGridLineInput[] = [
    { key: "cenl-n", nodeFromKey: "nsl-sub-3", busFrom: 1, nodeToKey: "cen-sub-4", busTo: 1, setFlow: 10, flowMin: -100, flowMax: 100 },
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
    gridConfig: config,
    startingZoom: 1,
    minScale: 1,
    maxScale: 5,
    canvasHeight: 900,
    canvasWidth: 1600
}
export default level