import type { GeneratorGridNodeInput, GridAction, GridError, InputGridConfig, LoadGridNodeInput, PSTGridLineInput, RegularGridLineInput, SolverGridConfig, SolverGridLine, SolverGridNode, SubstationGridNodeInput } from "./types";

export function applyActions(inputConfig: InputGridConfig): InputGridConfig | GridError {
    
    const newConfig = {...inputConfig}
    
    inputConfig.actions.forEach((action: GridAction) => {
        
        if (action.kind == "redispatch") {
            
            newConfig.nodes.generators = inputConfig.nodes.generators.map((node) => {
                if (action.nodeKey === node.key) {
                    return {...node, generation: action.power}
                }
                return node
            })

            newConfig.nodes.loads = inputConfig.nodes.loads.map((node) => {
                if (action.nodeKey === node.key) {
                    return {...node, load: action.power}
                }
                return node
            })
        }
        
    
    })
    return newConfig
} 

export function prepareGrid(inputConfig: InputGridConfig): SolverGridConfig {
    
    const allInputLines = [...inputConfig.lines.regular, ...inputConfig.lines.pst]

    // Check which substation buses will actually be needed
    const connectedBuses: Set<string> = new Set()
    allInputLines.forEach((line) => {
        connectedBuses.add(nodeFullKey(line.nodeFromKey, line.busFrom))
        connectedBuses.add(nodeFullKey(line.nodeToKey, line.busTo))
    })
    
    // Convert nodes
    const solverNodes: SolverGridNode[] = []
    
    const generatorInputNodesLookup: {[key: string]: GeneratorGridNodeInput | undefined } = {}
    const loadInputNodesLookup: {[key: string]: LoadGridNodeInput | undefined } = {}
    const powerNodesLookup: {[key: string]: SolverGridNode["id"]} = {}

    inputConfig.nodes.generators.forEach((node: GeneratorGridNodeInput) => {    
        generatorInputNodesLookup[node.key] = node
    })
    inputConfig.nodes.loads.forEach((node: LoadGridNodeInput) => {    
        loadInputNodesLookup[node.key] = node
    })

    /*
    // Apply redispatch
    inputConfig.actions.forEach((action: GridAction) => {
        
        if (action.kind !== "redispatch") return

        const inputNode: GeneratorGridNodeInput | LoadGridNodeInput | undefined = generatorInputNodesLookup[action.nodeKey] ?? loadInputNodesLookup[action.nodeKey]
        if (inputNode === undefined) {
            console.error("Redispatch action : cannot find node with key", action.nodeKey)
            return
        }

        if (!inputNode.allowRedispatch) {
            console.error("Redispatch action : node not redispatchable")
            return
        }
        if (!inputNode.redispatchMin) {
            console.error("Redispatch action : redispatchMin not defined")
            return
        }
        if (!inputNode.redispatchMax) {
            console.error("Redispatch action : redispatchMax not defined")
            return
        }
        if (action.power < inputNode.redispatchMin) {
            console.error("Redispatch action : value below redispatchMin")
            return
        }
        if (action.power > inputNode.redispatchMax) {
            console.error("Redispatch action : value above redispatchMax")
            return
        }

        // All good
        if (inputNode.kind === "generator") {
            inputNode.generation = action.power
        } else if (inputNode.kind === "load") {
            inputNode.load = action.power
        } // TODO FIX...
    })
    */

    // Generator nodes
    inputConfig.nodes.generators.forEach((node: GeneratorGridNodeInput) => {
        const id = solverNodes.length
        const fullKey = nodeFullKey(node.key)
        solverNodes.push({
            ...node,
            kind: "generator",
            id: id,
            fullKey: fullKey,
            power: node.generation
        })
        powerNodesLookup[fullKey] = id
    })

    // Load nodes
    inputConfig.nodes.loads.forEach((node: LoadGridNodeInput) => {

        loadInputNodesLookup[node.key] = node

        const id = solverNodes.length
        const fullKey = nodeFullKey(node.key)
        solverNodes.push({
            ...node,
            kind: "load",
            id: id,
            fullKey: fullKey,
            power: -node.load
        })
        powerNodesLookup[fullKey] = id
    })

    // Split substation nodes with buses
    inputConfig.nodes.substations.forEach((node: SubstationGridNodeInput) => {
        
        for (let bus = 1; bus <= node.buses; bus++) {
            if (connectedBuses.has(nodeFullKey(node.key, bus))) {
                solverNodes.push({
                    ...node,
                    kind: "substation",
                    id: solverNodes.length,
                    power: 0,
                    fullKey: nodeFullKey(node.key, bus)
                })
            }
        }
    })

    // Adapt lines
    const solverLines: SolverGridLine[] = []
    allInputLines.forEach((line: RegularGridLineInput | PSTGridLineInput) =>{

        // Sanity checks
        const nodesFrom = solverNodes.filter((node) => node.fullKey === nodeFullKey(line.nodeFromKey, line.busFrom))
        if (nodesFrom.length === 0) {
            console.error(`Cannot find nodeFromKey ${line.nodeFromKey}, bus ${line.busFrom}`)
        }
        if (nodesFrom.length > 1) {
            console.error(`Multiple matches for nodeFromKey ${line.nodeFromKey}, bus ${line.busFrom}`)
        }
        const nodesTo = solverNodes.filter((node) => node.fullKey === nodeFullKey(line.nodeToKey, line.busTo))
        if (nodesTo.length === 0) {
            console.error(`Cannot find nodeFromKey ${line.nodeToKey}, bus ${line.busTo}`)
        }
        if (nodesTo.length > 1) {
            console.error(`Multiple matches for nodeFromKey ${line.nodeToKey}, bus ${line.busTo}`)
        }

        const nodeFrom = nodesFrom[0]
        const nodeTo = nodesTo[0]

        solverLines.push({
            ...line,
            nodeFromId: nodeFrom.id,
            nodeToId: nodeTo.id,
            phaseDeg: line.phaseDeg ?? 0,
            shiftMin: line.shiftMin ?? 0, // Not actually needed by solver
            shiftMax: line.shiftMax ?? 0, // Not actually needed by solver
        })

    })

    return {
        nodes: solverNodes,
        lines: solverLines
    }
}

function nodeFullKey(nodeKey: string, bus?: number): string { return ! bus ? nodeKey : `${nodeKey}_bus${bus}`}