// Input nodes
export interface BaseGridNodeInput {
    key: string
    // UI
    name?: string
    x: number
    y: number
    icon?: "wind" | "thermal" | "town" | "industry"
}

export interface GeneratorGridNodeInput extends BaseGridNodeInput {
    generation: number // Positive 
    allowRedispatch?: boolean
    redispatchMin?: number
    redispatchMax?: number
}

export interface LoadGridNodeInput extends BaseGridNodeInput {
    load: number // Positive
    allowRedispatch?: boolean
    redispatchMin?: number
    redispatchMax?: number
}

export interface SubstationGridNodeInput extends BaseGridNodeInput {
    buses: number
}

// Full nodes
export interface GridNode extends BaseGridNodeInput {
    fullKey: string
    kind: "generator" | "load" | "substation"
    power: number // Positive for generators, negative for loads, zero for substations
}

export interface SolverGridNode extends GridNode {
    id: number
}

// Lines
export interface BaseGridLineInput {
    key: string
    name?: string
    
    nodeFromKey: GridNode["key"]
    nodeToKey: GridNode["key"]
    busFrom: number
    busTo: number
}

export interface RegularGridLineInput extends BaseGridLineInput {
    reactance: number
    limit: number
    
    phaseDeg?: number // phase shift in degrees, for "PST lines"
    shiftMin?: number
    shiftMax?: number
}

export interface PSTGridLineInput extends RegularGridLineInput {
    phaseDeg: number // phase shift in degrees, for "PST lines"
    shiftMin: number
    shiftMax: number
}

export interface HVDCGridLineInput extends BaseGridLineInput {
    setFlow: number
    flowMin: number
    flowMax: number
}

export interface SolverGridLine extends RegularGridLineInput {
    nodeFromId: SolverGridNode["id"]
    nodeToId: SolverGridNode["id"]
}

export interface GridLineWithResult extends SolverGridLine {
    dTheta: number
    phi: number
    flow_pu: number
    flow_MW: number
    overloaded: boolean
}



// Actions 

export interface BaseGridAction {
    kind: "redispatch" | "buschange" | "hvdc"
}

export interface RedispatchAction extends BaseGridAction {
    kind: "redispatch"
    nodeKey: string
    power: number
}

export interface BusChangeAction extends BaseGridAction {
    kind: "buschange"
    substationKey: string
    lineKey: string
    bus: number
}

export interface HVDCAction extends BaseGridAction {
    kind: "hvdc"
    hvdcKey: string
    flow: number
}

export type GridAction = RedispatchAction | BusChangeAction | HVDCAction


// Errors
export interface BaseGridError {
    kind: "balance"
}

export interface BalanceError {
    kind: "balance"
    generation: number
    load: number
}

export type GridError = BalanceError

// Configs
export interface InputGridConfig {
    nodes: {
        generators: GeneratorGridNodeInput[]
        loads: LoadGridNodeInput[]
        substations: SubstationGridNodeInput[]   
    }
    lines: {
        regular: RegularGridLineInput[]
        pst: PSTGridLineInput[]
        hvdc?: HVDCGridLineInput[]
    }
    actions: GridAction[]
}

export interface SolverGridConfig {
    nodes: SolverGridNode[]
    lines: SolverGridLine[]
}
