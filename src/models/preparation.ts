import type { GeneratorGridNodeInput, HVDCGridLineInput, InputGridConfig, LoadGridNodeInput, PSTGridLineInput, RegularGridLineInput, SolverGridConfig, SolverGridLine, SolverGridNode, SubstationGridNodeInput } from "./types";

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

    // HVDC unwrapping
    // We create a ghost node and a ghost line at each extremity of the HVDC line
    const hvdcGhostLines: RegularGridLineInput[] = []
    inputConfig.lines.hvdc?.forEach((hvdc: HVDCGridLineInput) => {
        
        connectedBuses.add(nodeFullKey(hvdc.nodeFromKey, hvdc.busFrom))
        connectedBuses.add(nodeFullKey(hvdc.nodeToKey, hvdc.busTo))

        const reverse = hvdc.setFlow < 0

        const key_node_in = hvdc.key+"_node_in"
        const key_node_out = hvdc.key+"_node_out"
        const key_line_in = hvdc.key+"_line_in"
        const key_line_out = hvdc.key+"_line_out"

        solverNodes.push({
            id: solverNodes.length,
            key: key_node_in,
            fullKey: key_node_in,
            power: -hvdc.setFlow,
            kind: !reverse ? "load" : "generator",
            x: 0, // Don't care
            y: 0 // Don't care
        })

        hvdcGhostLines.push({
            reactance: 1,
            limit: 1000000,
            key: key_line_in,
            nodeFromKey: hvdc.nodeFromKey,
            busFrom: hvdc.busFrom,
            nodeToKey: key_node_in,
            busTo: 0
        })

        solverNodes.push({
            id: solverNodes.length,
            key: key_node_out,
            fullKey: key_node_out,
            power: hvdc.setFlow,
            kind: !reverse ? "generator" : "load",
            x: 0, // Don't care
            y: 0 // Don't care
        })

        hvdcGhostLines.push({
            reactance: 1,
            limit: 1000000,
            key: key_line_out,
            nodeFromKey: key_node_out,
            busFrom: 0,
            nodeToKey: hvdc.nodeToKey,
            busTo: hvdc.busTo,
        })

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
    allInputLines.concat(hvdcGhostLines).forEach((line: RegularGridLineInput | PSTGridLineInput) =>{

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