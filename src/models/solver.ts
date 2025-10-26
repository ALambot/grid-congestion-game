import { prepareGrid } from "./preparation";
import type { InputGridConfig, GridLineWithResult, SolverGridNode, SolverGridConfig, SolverGridLine } from "./types"

/** Union-find, to detect and split disconnected parts of the grid into subgrids, because the solver only works on fully connected grids */
export function splitSubGrids(grid: SolverGridConfig): SolverGridConfig[] {

    // Prepare roots
    const roots: number[] = []
    grid.nodes.forEach((node: SolverGridNode, index) => {
        // Sanity check
        if (node.id !== index) {
            console.error('"node.id !== index" in splitSubGrids')
        }
        roots.push(index)
    })

    // Iterate over lines to link roots
    grid.lines.forEach((line: SolverGridLine) => {
        const id1 = line.nodeFromId
        const id2 = line.nodeToId

        // Find graphs roots
        let anchor1 = roots[id1]
        while (roots[anchor1] !== anchor1) {
            anchor1 = roots[anchor1]
        }
        let anchor2 = roots[id2]
        while (roots[anchor2] !== anchor2) {
            anchor2 = roots[anchor2]
        }

        const anchorMin = Math.min(anchor1, anchor2)
        const anchorMax = Math.max(anchor1, anchor2)

        // Assign (new) anchorMin to target nodes and their anchors
        roots[line.nodeFromId] = anchorMin
        roots[line.nodeToId] = anchorMin
        roots[anchorMax] = anchorMin
    })

    // Second pass to find true roots
    roots.forEach((root, index) => {
        roots[index] = roots[root]
    })

    // Splitting into subgrids
    // We'll need node id remapping
    const nodeIdRemap: {[oldId: number]: number} = {}
    // First the nodes
    const subgrids: {[anchor: number]: SolverGridConfig} = {}
    grid.nodes.forEach((node: SolverGridNode, index) => {
        
        const anchor = roots[index]
        
        // Ensure target subgrid is initialized
        if (subgrids[anchor] === undefined) {
            subgrids[anchor] = {nodes:[], lines: []}
        }

        // Determine new node id and register in remap
        const newId = subgrids[anchor].nodes.length
        nodeIdRemap[node.id] = newId

        subgrids[anchor].nodes.push({
            ...node,
            id: newId
        })
    })
    // Then the lines
    grid.lines.forEach((line: SolverGridLine) => {

        // Since (active) lines cannot be in two grids, we can just look at one node
        const anchor = roots[line.nodeFromId]

        subgrids[anchor].lines.push({
            ...line,
            nodeFromId: nodeIdRemap[line.nodeFromId],
            nodeToId: nodeIdRemap[line.nodeToId],
        })
    })

    return Object.values(subgrids)

}

/** Prepare the grid, split into subgrids if needed, run a simulation for each, collect results*/
export function runSimulations(inputGridConfig: InputGridConfig): { [key: string]: GridLineWithResult } | undefined {
    
    // Prepare
    const solverGridConfig: SolverGridConfig = prepareGrid(inputGridConfig)
    
    let results: { [key: string]: GridLineWithResult } = {}
    
    // Split
    splitSubGrids(solverGridConfig).forEach((solverGrid: SolverGridConfig) => {
        
        // Run simulation
        const partialResults = runSimulation(solverGrid)
        
        // Collect results
        if (partialResults !== undefined) {
            results = {
                ...results,
                ...partialResults
            }
        }
    })

    return results

}

/** Semi vibe-coded, especially the maths */
export function runSimulation(solverGridConfig: SolverGridConfig): { [key: string]: GridLineWithResult } | undefined {

    const sBase = 100 // MVA
    const slackIndex = 0

    const nodesMW: number[] = solverGridConfig.nodes.map((node: SolverGridNode) => node.power)

    // No auto-balance, raise error if gen and load are not balanced
    const netPower = nodesMW.reduce((acc, cur) => acc += cur, 0)
    if ( netPower !== 0 ){
        console.warn(`Grid is not balanced, net power is ${netPower} MW`)
        return undefined
    }
    const nodesMWBalanced = nodesMW

    /*
    // Auto-balance slack: enforce sum(P) = 0 by adjusting slack injection
    const sumNonSlack = nodesMW.reduce((acc, p, i) => i === slackIndex ? acc : acc + p, 0);
    const slackInjection = -sumNonSlack; // MW
    const nodesMWBalanced = nodesMW.slice();
    if (nodesMWBalanced[slackIndex] !== undefined) nodesMWBalanced[slackIndex] = slackInjection;
    else { pushMsg('Slack index out of range', 'bad'); return; }
    */

    // Convert to per-unit on S_base
    const Ppu = nodesMWBalanced.map(p => p / sBase);

    // Build B matrix from p.u. reactances
    const n = Ppu.length;
    const s = Array(n).fill(0); // constant term from PSTs (p.u. radians * b)

    const B = Array.from({ length: n }, () => Array(n).fill(0));
    for (const line of solverGridConfig.lines) {
        
        const { nodeFromId, nodeToId, reactance, phaseDeg } = line
        if (reactance <= 0) { 
            //pushMsg(`Line (${from}-${to}) has non-positive reactance`, 'bad'); return; 
        }
        const b = 1 / reactance; // p.u.
        B[nodeFromId][nodeToId] -= b; 
        B[nodeToId][nodeFromId] -= b;
        B[nodeFromId][nodeFromId] += b; 
        B[nodeToId][nodeToId] += b;

        // handle optional phase shift: accept phase_deg or phase (radians)
        let phi = 0;
        if (phaseDeg) {
            phi = deg2rad(phaseDeg)
        }

        // contribution to s: (we used flow = (θ_from - θ_to - φ) / X)
        // Expand b*(θ_from - θ_to - φ) so the -b*phi is a constant in node eq.
        // Summing into s so B*θ = P + s  => s[from] -= b*phi; s[to] += b*phi
        if (phi !== 0) {
            s[nodeFromId] += b * phi;
            s[nodeToId]   -= b * phi;
        }
    }

    // Reduce system (remove slack row/col)
    const mask = [...Array(n).keys()].filter(i => i !== slackIndex);
    const Bred: number[][] = mask.map(i => mask.map(j => B[i][j]));
    // RHS includes Ppu + s (both in p.u.)
    const Pred: number[] = mask.map(i => Ppu[i] + s[i]);

    // Solve Bred * thetaRed = Pred
    let thetaRed;
    try { 
        thetaRed = solveLinearSystem(Bred, Pred); 
    }
    catch (e) { 
        console.error('Solver error: ' + (e as Error).message); 
        return undefined
    }

    // Reconstruct full angle vector (radians). Slack angle = 0 by definition.
    const theta = Array(n).fill(0);
    for (let k = 0; k < mask.length; k++) theta[mask[k]] = thetaRed[k];

    // Compute flows in p.u. and MW, and overload flags vs MW limits
    const flows = [];
    for (const line of solverGridConfig.lines) {
        
        const phi = deg2rad(line.phaseDeg ?? 0)
        const dth = theta[line.nodeFromId] - theta[line.nodeToId]
        const Fpu = (dth - phi) / line.reactance   // IMPORTANT: subtract phi
        const Fmw = Fpu * sBase
        flows.push({ 
            ...line, 
            dTheta: dth, 
            phi, 
            flow_pu: Fpu, 
            flow_MW: Fmw, 
            overloaded: Math.abs(Fmw) > line.limit 
        })
    }

    // Diagnostics
    //const sumMW = nodesMWBalanced.reduce((a,b) => a + b, 0);
    //const maxAbsTheta = Math.max(...theta.map(Math.abs));
    //const maxAbsDtheta = flows.length ? Math.max(...flows.map(f => Math.abs(f.dTheta))) : 0;

    // Angle sanity: DC model typically has |θ| ~ a few degrees (say < ~0.3 rad) and |Δθ| across a line often < ~0.2 rad in normal ops
    //const angleTag = maxAbsTheta < 0.5 ? 'ok' : (maxAbsTheta < 1.5 ? 'warn' : 'bad');
    //const dAngleTag = maxAbsDtheta < 0.3 ? 'ok' : (maxAbsDtheta < 1.0 ? 'warn' : 'bad');

    // Render tables
    //renderDiagnostics({ sBase, slackIndex, slackInjection, powerBalanceMW: sumMW, maxAbsTheta, maxAbsDtheta, n }, angleTag, dAngleTag);
    //renderAngles(theta);
    //renderFlows(flows);

    // Helpful hints
    //if (angleTag !== 'ok') {
    //    pushMsg('Angles look large. Common causes: (1) Using MW without converting to per‑unit, (2) Reactances too small, (3) Islands/disconnected graph. This page now converts MW→p.u. automatically and compares flows vs MW limits.', angleTag);
    //}

    const mappedFlows: { [key: string]: GridLineWithResult } = {}
    flows.forEach((flow: GridLineWithResult) => { mappedFlows[flow.key] = flow})

    return mappedFlows
}

/** Vibe-coded */
function solveLinearSystem(A: number[][], b: number[]) {
    
    const n = A.length;
    if (n === 0) return [];
    
    // Copy to augmented matrix
    const M = A.map((row, i) => row.concat([b[i]]));
    
    for (let i = 0; i < n; i++) {
        
        // Partial pivoting
        let maxR = i;
        for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[maxR][i])) maxR = r;
        if (Math.abs(M[maxR][i]) < 1e-12) throw new Error('Singular matrix (islanded network or slack not connected)');
        if (maxR !== i) [M[i], M[maxR]] = [M[maxR], M[i]];
        
        // Normalize pivot row
        const piv = M[i][i];
        for (let j = i; j <= n; j++) M[i][j] /= piv;
        
        // Eliminate other rows
        for (let r = 0; r < n; r++) if (r !== i) {
            const f = M[r][i];
            if (f !== 0) for (let j = i; j <= n; j++) M[r][j] -= f * M[i][j];
        }
    }
    // Read solution
    return M.map(row => row[n]);
}

// Utils
//function rad2deg(x: number){ return x * 180. / Math.PI }
function deg2rad(x: number){ return x * Math.PI / 180. }
