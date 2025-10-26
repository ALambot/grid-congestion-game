import type { GeneratorGridNodeInput, GridAction, InputGridConfig, LoadGridNodeInput, RegularGridLineInput, SubstationGridNodeInput } from "@/models/types"
import type { Level } from "./types"

const generators: GeneratorGridNodeInput[] = [
    { key: "gen1", generation: 90, x: 100, y: 200, allowRedispatch: true, redispatchMin: 50, redispatchMax: 120 },
    { key: "gen2", generation: 90, x: 200, y: 100 },
    { key: "gen3", generation: 10, x: 500, y: 200, allowRedispatch: true, redispatchMin: 10, redispatchMax: 50 },
    { key: "gen4", generation: 10, x: 100, y: 400 },
]

const loads: LoadGridNodeInput[] = [
    { key: "load1", load: 170, x: 700, y: 600, allowRedispatch: true, redispatchMin: 100, redispatchMax: 250 },
    { key: "load2", load: 10, x: 600, y: 700 },
    { key: "load3", load: 10, x: 600, y: 300 },
    { key: "load4", load: 10, x: 100, y: 500 },
]

const substations: SubstationGridNodeInput[] = [
    { key: "sub1", buses: 1, x: 250, y: 250 },
    { key: "sub2", buses: 1, x: 300, y: 500 },
    { key: "sub3", buses: 1, x: 500, y: 300 },
    { key: "sub4", buses: 1, x: 550, y: 550 },
]

const lines: RegularGridLineInput[] = [
    { key: "line1", nodeFromKey: "gen1", busFrom: 0, nodeToKey: "sub1", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "line2", nodeFromKey: "gen2", busFrom: 0, nodeToKey: "sub1", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "line3", nodeFromKey: "sub2", busFrom: 1, nodeToKey: "sub1", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "line4", nodeFromKey: "sub3", busFrom: 1, nodeToKey: "sub1", busTo: 1, reactance: 0.2, limit: 100 },
    { key: "line5", nodeFromKey: "sub2", busFrom: 1, nodeToKey: "sub3", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "line6", nodeFromKey: "sub2", busFrom: 1, nodeToKey: "sub4", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "line7", nodeFromKey: "sub3", busFrom: 1, nodeToKey: "sub4", busTo: 1, reactance: 0.1, limit: 100 },
    { key: "line8", nodeFromKey: "sub4", busFrom: 1, nodeToKey: "load1", busTo: 0, reactance: 0.1, limit: 200 },
    { key: "line9", nodeFromKey: "sub4", busFrom: 1, nodeToKey: "load2", busTo: 0, reactance: 0.1, limit: 50 },
    { key: "line10", nodeFromKey: "sub3", busFrom: 1, nodeToKey: "gen3", busTo: 0, reactance: 0.1, limit: 50 },
    { key: "line11", nodeFromKey: "sub3", busFrom: 1, nodeToKey: "load3", busTo: 0, reactance: 0.1, limit: 20 },
    { key: "line12", nodeFromKey: "gen4", busFrom: 0, nodeToKey: "load4", busTo: 0, reactance: 0.1, limit: 15 },
]

const actions: GridAction[] = [
    { kind: "redispatch", nodeKey: "gen1", power: 80 },
    { kind: "redispatch", nodeKey: "load1", power: 160 }
]

const config: InputGridConfig = {
    nodes: {
        generators: generators,
        loads: loads,
        substations: substations
    },
    lines: {
        regular: lines,
        pst: []
    },
    actions: actions
}

const level: Level = {
    gridConfig: config
}
export default level