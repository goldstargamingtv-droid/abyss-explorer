/**
 * ============================================================================
 * ABYSS EXPLORER - TRIANGLE INEQUALITY AVERAGE COLORING
 * ============================================================================
 * 
 * Triangle Inequality Average (TIA) coloring algorithms provide smooth
 * iteration coloring without using logarithms, based on the triangle
 * inequality property of complex numbers.
 * 
 * The Triangle Inequality:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  For complex numbers: |a + b| ≤ |a| + |b| (triangle inequality)       │
 * │                                                                        │
 * │  Applied to fractal iteration zₙ₊₁ = zₙ² + c:                         │
 * │                                                                        │
 * │    lower bound: ||zₙ|² - |c|| ≤ |zₙ₊₁|                                │
 * │    upper bound: |zₙ₊₁| ≤ |zₙ|² + |c|                                  │
 * │                                                                        │
 * │  The Triangle Inequality Average is:                                   │
 * │                                                                        │
 * │              |zₙ₊₁| - |lower|                                          │
 * │    tia_n = ─────────────────────                                       │
 * │             |upper| - |lower|                                          │
 * │                                                                        │
 * │  This gives a value in [0, 1] for each iteration, which when          │
 * │  averaged provides smooth coloring.                                    │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Advantages over log-based smoothing:
 * - Works for any power iteration (not just z² + c)
 * - No issues with very small |z| values
 * - Produces different, often more interesting patterns
 * - Better phase/angle information preservation
 * 
 * @module coloring/triangle-inequality
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Small epsilon for avoiding division by zero */
const EPSILON = 1e-10;

// ============================================================================
// TRIANGLE INEQUALITY ALGORITHMS
// ============================================================================

/**
 * Basic Triangle Inequality Average
 * 
 * Computes the running average of triangle inequality ratios
 * across all iterations.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function triangleInequalityAverage(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // If orbit history is available, compute full TIA
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (orbitHistory && orbitHistory.length >= 2) {
        return computeFullTIA(orbitHistory, params);
    }
    
    // Fall back to approximation using final values
    return approximateTIA(pixelData, index, params);
}

/**
 * Compute full TIA from orbit history
 * @private
 */
function computeFullTIA(orbitHistory, params) {
    const cMag = params.cMag || 1; // |c| - typically set from render params
    let sum = 0;
    let count = 0;
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const zPrev = orbitHistory[i - 1];
        const zCurr = orbitHistory[i];
        
        const zPrevMag = Math.sqrt(zPrev.x * zPrev.x + zPrev.y * zPrev.y);
        const zCurrMag = Math.sqrt(zCurr.x * zCurr.x + zCurr.y * zCurr.y);
        
        // For z² + c:
        // lower = ||z|² - |c||
        // upper = |z|² + |c|
        const zPrevMagSq = zPrevMag * zPrevMag;
        const lower = Math.abs(zPrevMagSq - cMag);
        const upper = zPrevMagSq + cMag;
        
        const range = upper - lower;
        if (range > EPSILON) {
            const tia = (zCurrMag - lower) / range;
            sum += Math.max(0, Math.min(1, tia));
            count++;
        }
    }
    
    const average = count > 0 ? sum / count : 0;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (average + offset) * scale,
        interior: false
    };
}

/**
 * Approximate TIA from final orbit values
 * @private
 */
function approximateTIA(pixelData, index, params) {
    const iter = pixelData.iterations[index];
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    
    const zMag = Math.sqrt(zx * zx + zy * zy);
    
    // Estimate cMag from bailout behavior
    const cMag = params.cMag || 0.5;
    
    // Single-point TIA approximation
    const zMagSq = zMag * zMag;
    const lower = Math.abs(zMagSq - cMag);
    const upper = zMagSq + cMag;
    
    const range = upper - lower;
    let tia = 0;
    
    if (range > EPSILON) {
        tia = (zMag - lower) / range;
        tia = Math.max(0, Math.min(1, tia));
    }
    
    // Blend with normalized iteration for smoother result
    const iterNorm = (iter % 256) / 256;
    const blendFactor = params.iterationBlend || 0.5;
    
    const value = tia * (1 - blendFactor) + iterNorm * blendFactor;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Weighted Triangle Inequality Average
 * 
 * Weights later iterations more heavily for different visual effect.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function weightedTIA(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 2) {
        return approximateTIA(pixelData, index, params);
    }
    
    const cMag = params.cMag || 1;
    const weightPower = params.weightPower || 1; // Higher = weight later iterations more
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const zPrev = orbitHistory[i - 1];
        const zCurr = orbitHistory[i];
        
        const zPrevMag = Math.sqrt(zPrev.x * zPrev.x + zPrev.y * zPrev.y);
        const zCurrMag = Math.sqrt(zCurr.x * zCurr.x + zCurr.y * zCurr.y);
        
        const zPrevMagSq = zPrevMag * zPrevMag;
        const lower = Math.abs(zPrevMagSq - cMag);
        const upper = zPrevMagSq + cMag;
        
        const range = upper - lower;
        if (range > EPSILON) {
            const tia = (zCurrMag - lower) / range;
            const weight = Math.pow(i / orbitHistory.length, weightPower);
            
            weightedSum += Math.max(0, Math.min(1, tia)) * weight;
            totalWeight += weight;
        }
    }
    
    const average = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (average + offset) * scale,
        interior: false
    };
}

/**
 * Phase-based TIA
 * 
 * Uses the argument (angle) of z in addition to magnitude
 * for richer coloring.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function phaseTIA(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    const iter = pixelData.iterations[index];
    
    // Compute base TIA
    const baseTIA = triangleInequalityAverage(pixelData, index, params);
    
    // Add phase component
    const angle = Math.atan2(zy, zx);
    const phaseNorm = (angle / (2 * Math.PI) + 0.5); // Normalize to [0, 1]
    
    const phaseWeight = params.phaseWeight || 0.3;
    const phaseFrequency = params.phaseFrequency || 1;
    
    const phaseComponent = Math.sin(phaseNorm * phaseFrequency * 2 * Math.PI) * 0.5 + 0.5;
    
    const value = baseTIA.value * (1 - phaseWeight) + phaseComponent * phaseWeight;
    
    return {
        value: Math.max(0, Math.min(1, value)),
        interior: false
    };
}

/**
 * Minimum TIA
 * 
 * Uses the minimum TIA value across iterations instead of average.
 * Creates sharper boundary effects.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function minimumTIA(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 2) {
        return approximateTIA(pixelData, index, params);
    }
    
    const cMag = params.cMag || 1;
    let minTIA = Infinity;
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const zPrev = orbitHistory[i - 1];
        const zCurr = orbitHistory[i];
        
        const zPrevMag = Math.sqrt(zPrev.x * zPrev.x + zPrev.y * zPrev.y);
        const zCurrMag = Math.sqrt(zCurr.x * zCurr.x + zCurr.y * zCurr.y);
        
        const zPrevMagSq = zPrevMag * zPrevMag;
        const lower = Math.abs(zPrevMagSq - cMag);
        const upper = zPrevMagSq + cMag;
        
        const range = upper - lower;
        if (range > EPSILON) {
            const tia = (zCurrMag - lower) / range;
            minTIA = Math.min(minTIA, Math.max(0, Math.min(1, tia)));
        }
    }
    
    if (minTIA === Infinity) minTIA = 0;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (minTIA + offset) * scale,
        interior: false
    };
}

/**
 * Maximum TIA
 * 
 * Uses the maximum TIA value across iterations.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function maximumTIA(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 2) {
        return approximateTIA(pixelData, index, params);
    }
    
    const cMag = params.cMag || 1;
    let maxTIA = -Infinity;
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const zPrev = orbitHistory[i - 1];
        const zCurr = orbitHistory[i];
        
        const zPrevMag = Math.sqrt(zPrev.x * zPrev.x + zPrev.y * zPrev.y);
        const zCurrMag = Math.sqrt(zCurr.x * zCurr.x + zCurr.y * zCurr.y);
        
        const zPrevMagSq = zPrevMag * zPrevMag;
        const lower = Math.abs(zPrevMagSq - cMag);
        const upper = zPrevMagSq + cMag;
        
        const range = upper - lower;
        if (range > EPSILON) {
            const tia = (zCurrMag - lower) / range;
            maxTIA = Math.max(maxTIA, Math.max(0, Math.min(1, tia)));
        }
    }
    
    if (maxTIA === -Infinity) maxTIA = 0;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (maxTIA + offset) * scale,
        interior: false
    };
}

/**
 * Variance TIA
 * 
 * Uses the variance of TIA values for texture effects.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function varianceTIA(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 2) {
        return approximateTIA(pixelData, index, params);
    }
    
    const cMag = params.cMag || 1;
    const values = [];
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const zPrev = orbitHistory[i - 1];
        const zCurr = orbitHistory[i];
        
        const zPrevMag = Math.sqrt(zPrev.x * zPrev.x + zPrev.y * zPrev.y);
        const zCurrMag = Math.sqrt(zCurr.x * zCurr.x + zCurr.y * zCurr.y);
        
        const zPrevMagSq = zPrevMag * zPrevMag;
        const lower = Math.abs(zPrevMagSq - cMag);
        const upper = zPrevMagSq + cMag;
        
        const range = upper - lower;
        if (range > EPSILON) {
            const tia = (zCurrMag - lower) / range;
            values.push(Math.max(0, Math.min(1, tia)));
        }
    }
    
    if (values.length === 0) {
        return { value: 0, interior: false };
    }
    
    // Compute variance
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    
    // Normalize variance (typical range 0-0.25 for [0,1] values)
    const normalizedVariance = Math.min(1, variance * 4);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalizedVariance + offset) * scale,
        interior: false
    };
}

/**
 * Hybrid TIA
 * 
 * Combines multiple TIA statistics for rich coloring.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function hybridTIA(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Get all TIA variants
    const avgResult = triangleInequalityAverage(pixelData, index, { ...params, scale: 1, offset: 0 });
    const minResult = minimumTIA(pixelData, index, { ...params, scale: 1, offset: 0 });
    const varResult = varianceTIA(pixelData, index, { ...params, scale: 1, offset: 0 });
    
    // Weights for each component
    const avgWeight = params.averageWeight || 0.5;
    const minWeight = params.minimumWeight || 0.3;
    const varWeight = params.varianceWeight || 0.2;
    
    const totalWeight = avgWeight + minWeight + varWeight;
    
    const value = (
        avgResult.value * avgWeight +
        minResult.value * minWeight +
        varResult.value * varWeight
    ) / totalWeight;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

// ============================================================================
// ALGORITHM COLLECTION
// ============================================================================

export const TRIANGLE_INEQUALITY_ALGORITHMS = {
    'triangle-inequality-average': {
        fn: triangleInequalityAverage,
        name: 'Triangle Inequality Average',
        description: 'Smooth coloring using triangle inequality property',
        params: {
            cMag: { type: 'number', default: 1, min: 0.1, max: 10, label: '|c| magnitude' },
            iterationBlend: { type: 'number', default: 0.5, min: 0, max: 1, label: 'Iteration blend' },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'weighted-tia': {
        fn: weightedTIA,
        name: 'Weighted TIA',
        description: 'TIA with iteration-based weighting',
        params: {
            cMag: { type: 'number', default: 1, min: 0.1, max: 10 },
            weightPower: { type: 'number', default: 1, min: 0, max: 3 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'phase-tia': {
        fn: phaseTIA,
        name: 'Phase TIA',
        description: 'TIA with angle-based coloring',
        params: {
            cMag: { type: 'number', default: 1, min: 0.1, max: 10 },
            phaseWeight: { type: 'number', default: 0.3, min: 0, max: 1 },
            phaseFrequency: { type: 'number', default: 1, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'minimum-tia': {
        fn: minimumTIA,
        name: 'Minimum TIA',
        description: 'Minimum TIA value for sharp effects',
        params: {
            cMag: { type: 'number', default: 1, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'maximum-tia': {
        fn: maximumTIA,
        name: 'Maximum TIA',
        description: 'Maximum TIA value across orbit',
        params: {
            cMag: { type: 'number', default: 1, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'variance-tia': {
        fn: varianceTIA,
        name: 'Variance TIA',
        description: 'TIA variance for texture effects',
        params: {
            cMag: { type: 'number', default: 1, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'hybrid-tia': {
        fn: hybridTIA,
        name: 'Hybrid TIA',
        description: 'Combined TIA statistics',
        params: {
            cMag: { type: 'number', default: 1, min: 0.1, max: 10 },
            averageWeight: { type: 'number', default: 0.5, min: 0, max: 1 },
            minimumWeight: { type: 'number', default: 0.3, min: 0, max: 1 },
            varianceWeight: { type: 'number', default: 0.2, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    triangleInequalityAverage,
    weightedTIA,
    phaseTIA,
    minimumTIA,
    maximumTIA,
    varianceTIA,
    hybridTIA,
    TRIANGLE_INEQUALITY_ALGORITHMS
};
