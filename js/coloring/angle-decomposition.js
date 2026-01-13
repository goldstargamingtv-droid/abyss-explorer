/**
 * ============================================================================
 * ABYSS EXPLORER - ANGLE DECOMPOSITION COLORING
 * ============================================================================
 * 
 * Angle-based and decomposition coloring algorithms that use the argument
 * (phase) of complex numbers to create radial patterns and angular effects.
 * 
 * Decomposition Concept:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  Binary Decomposition:                                                 │
 * │    Color based on sign of Im(z) at escape                             │
 * │    Creates distinctive striped patterns                                │
 * │                                                                        │
 * │  Angular Decomposition:                                                │
 * │    Divide the complex plane into N angular sectors                    │
 * │    Color based on which sector z lands in                             │
 * │                                                                        │
 * │            ╱│╲                                                         │
 * │          ╱  │  ╲    N=8 sectors                                        │
 * │        ╱    │    ╲  Each colored differently                          │
 * │      ────────────────                                                  │
 * │        ╲    │    ╱                                                     │
 * │          ╲  │  ╱                                                       │
 * │            ╲│╱                                                         │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module coloring/angle-decomposition
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Two PI */
const TWO_PI = 2 * Math.PI;

/** PI */
const PI = Math.PI;

// ============================================================================
// ANGLE/DECOMPOSITION ALGORITHMS
// ============================================================================

/**
 * Binary Decomposition
 * 
 * Classic binary decomposition based on sign of imaginary part.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function binaryDecomposition(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zy = pixelData.orbitY[index];
    
    // Binary value based on sign of imaginary part
    const binary = zy > 0 ? 1 : 0;
    
    // Optionally blend with iteration for variation
    const blendIteration = params.blendIteration || false;
    let value = binary;
    
    if (blendIteration) {
        const iter = pixelData.iterations[index];
        const iterNorm = (iter % 256) / 256;
        const blend = params.blendAmount || 0.3;
        value = value * (1 - blend) + iterNorm * blend;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Angular Decomposition
 * 
 * Divides plane into N angular sectors for coloring.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function angularDecomposition(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    const sectors = params.sectors || 8;
    
    // Compute angle
    const angle = Math.atan2(zy, zx);
    
    // Normalize to [0, 1]
    const normalizedAngle = (angle + PI) / TWO_PI;
    
    // Quantize to sectors
    const sectorIndex = Math.floor(normalizedAngle * sectors);
    const value = sectorIndex / sectors;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Continuous Angle
 * 
 * Uses continuous angle value for smooth coloring.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function continuousAngle(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    
    // Use pre-computed angle if available
    let angle = pixelData.angle?.[index];
    if (angle === undefined) {
        angle = Math.atan2(zy, zx);
    }
    
    // Normalize to [0, 1]
    const value = (angle + PI) / TWO_PI;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Radial Waves
 * 
 * Creates concentric circular patterns based on angle.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function radialWaves(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    
    const frequency = params.frequency || 10;
    const phase = params.phase || 0;
    
    // Distance from origin
    const r = Math.sqrt(zx * zx + zy * zy);
    
    // Create waves
    const wave = Math.sin(frequency * Math.log(r + 1) + phase);
    const value = (wave + 1) / 2;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Angular Stripes
 * 
 * Creates radial stripe patterns.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function angularStripes(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    
    const stripes = params.stripes || 8;
    const smooth = params.smooth !== false;
    
    const angle = Math.atan2(zy, zx);
    const normalizedAngle = (angle + PI) / TWO_PI;
    
    let value;
    if (smooth) {
        // Smooth stripes using sine
        value = Math.sin(normalizedAngle * stripes * PI) * 0.5 + 0.5;
    } else {
        // Sharp stripes
        const stripeIndex = Math.floor(normalizedAngle * stripes);
        value = stripeIndex % 2 === 0 ? 0 : 1;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Spiral Pattern
 * 
 * Creates logarithmic spiral patterns.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function spiralPattern(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    
    const arms = params.arms || 5;
    const tightness = params.tightness || 0.5;
    
    const r = Math.sqrt(zx * zx + zy * zy);
    const theta = Math.atan2(zy, zx);
    
    // Logarithmic spiral: theta = a + b*ln(r)
    const spiralAngle = theta - tightness * Math.log(r + 1);
    
    // Create spiral arms
    const normalizedSpiral = (spiralAngle / TWO_PI * arms % 1 + 1) % 1;
    const value = Math.sin(normalizedSpiral * PI) * 0.5 + 0.5;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Iteration + Angle Hybrid
 * 
 * Combines iteration count with angle for rich coloring.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function iterationAngleHybrid(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    const iter = pixelData.iterations[index];
    
    const angleWeight = params.angleWeight || 0.5;
    const angleFrequency = params.angleFrequency || 1;
    
    const angle = Math.atan2(zy, zx);
    const normalizedAngle = (angle + PI) / TWO_PI;
    const angleTerm = Math.sin(normalizedAngle * angleFrequency * TWO_PI) * 0.5 + 0.5;
    
    const iterNorm = (iter % 256) / 256;
    
    const value = angleTerm * angleWeight + iterNorm * (1 - angleWeight);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Phase Accumulation
 * 
 * Accumulates phase changes throughout the orbit.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function phaseAccumulation(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 2) {
        // Fall back to single angle
        return continuousAngle(pixelData, index, params);
    }
    
    let totalPhase = 0;
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const prev = orbitHistory[i - 1];
        const curr = orbitHistory[i];
        
        const prevAngle = Math.atan2(prev.y, prev.x);
        const currAngle = Math.atan2(curr.y, curr.x);
        
        // Phase change (handling wraparound)
        let delta = currAngle - prevAngle;
        if (delta > PI) delta -= TWO_PI;
        if (delta < -PI) delta += TWO_PI;
        
        totalPhase += delta;
    }
    
    // Normalize accumulated phase
    const normalized = (totalPhase / (TWO_PI * orbitHistory.length) + 0.5) % 1;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Winding Number
 * 
 * Computes the winding number of the orbit around the origin.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function windingNumber(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 2) {
        return continuousAngle(pixelData, index, params);
    }
    
    let totalWindings = 0;
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const prev = orbitHistory[i - 1];
        const curr = orbitHistory[i];
        
        const prevAngle = Math.atan2(prev.y, prev.x);
        const currAngle = Math.atan2(curr.y, curr.x);
        
        let delta = currAngle - prevAngle;
        if (delta > PI) delta -= TWO_PI;
        if (delta < -PI) delta += TWO_PI;
        
        totalWindings += delta;
    }
    
    // Convert to number of complete rotations
    const windings = totalWindings / TWO_PI;
    
    // Normalize using modular approach
    const normalized = (windings % (params.maxWindings || 10) + (params.maxWindings || 10)) % 
                       (params.maxWindings || 10) / (params.maxWindings || 10);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Complex Argument Sum
 * 
 * Sums the arguments (angles) of all orbit points.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function argumentSum(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length === 0) {
        return continuousAngle(pixelData, index, params);
    }
    
    let sum = 0;
    
    for (const z of orbitHistory) {
        const angle = Math.atan2(z.y, z.x);
        sum += Math.sin(angle * (params.frequency || 1));
    }
    
    const average = sum / orbitHistory.length;
    const normalized = (average + 1) / 2;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Polar Decomposition
 * 
 * Combines radial and angular decomposition.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function polarDecomposition(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    
    const radialSectors = params.radialSectors || 8;
    const angularSectors = params.angularSectors || 8;
    
    const r = Math.sqrt(zx * zx + zy * zy);
    const theta = Math.atan2(zy, zx);
    
    // Radial index
    const logR = Math.log(r + 1);
    const radialIndex = Math.floor(logR * radialSectors / 3) % radialSectors;
    
    // Angular index
    const normalizedAngle = (theta + PI) / TWO_PI;
    const angularIndex = Math.floor(normalizedAngle * angularSectors);
    
    // Combine indices
    const combined = (radialIndex * angularSectors + angularIndex) % 
                     (radialSectors * angularSectors);
    const value = combined / (radialSectors * angularSectors);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Checkerboard Decomposition
 * 
 * Creates checkerboard pattern based on polar coordinates.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function checkerboardDecomposition(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    
    const radialSize = params.radialSize || 1;
    const angularDivisions = params.angularDivisions || 8;
    
    const r = Math.sqrt(zx * zx + zy * zy);
    const theta = Math.atan2(zy, zx);
    
    const radialIndex = Math.floor(Math.log(r + 1) / radialSize);
    const angularIndex = Math.floor((theta + PI) / TWO_PI * angularDivisions);
    
    // Checkerboard pattern
    const checker = (radialIndex + angularIndex) % 2;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (checker + offset) * scale,
        interior: false
    };
}

// ============================================================================
// ALGORITHM COLLECTION
// ============================================================================

export const ANGLE_ALGORITHMS = {
    'binary-decomposition': {
        fn: binaryDecomposition,
        name: 'Binary Decomposition',
        description: 'Classic binary decomposition by Im(z) sign',
        params: {
            blendIteration: { type: 'boolean', default: false },
            blendAmount: { type: 'number', default: 0.3, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'angular-decomposition': {
        fn: angularDecomposition,
        name: 'Angular Decomposition',
        description: 'Divide plane into angular sectors',
        params: {
            sectors: { type: 'number', default: 8, min: 2, max: 64 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'continuous-angle': {
        fn: continuousAngle,
        name: 'Continuous Angle',
        description: 'Smooth angle-based coloring',
        params: {
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'radial-waves': {
        fn: radialWaves,
        name: 'Radial Waves',
        description: 'Concentric circular wave patterns',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100 },
            phase: { type: 'number', default: 0, min: 0, max: 6.28 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'angular-stripes': {
        fn: angularStripes,
        name: 'Angular Stripes',
        description: 'Radial stripe patterns',
        params: {
            stripes: { type: 'number', default: 8, min: 2, max: 64 },
            smooth: { type: 'boolean', default: true },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'spiral-pattern': {
        fn: spiralPattern,
        name: 'Spiral Pattern',
        description: 'Logarithmic spiral patterns',
        params: {
            arms: { type: 'number', default: 5, min: 1, max: 20 },
            tightness: { type: 'number', default: 0.5, min: 0.1, max: 2 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'iteration-angle-hybrid': {
        fn: iterationAngleHybrid,
        name: 'Iteration-Angle Hybrid',
        description: 'Combined iteration and angle coloring',
        params: {
            angleWeight: { type: 'number', default: 0.5, min: 0, max: 1 },
            angleFrequency: { type: 'number', default: 1, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'phase-accumulation': {
        fn: phaseAccumulation,
        name: 'Phase Accumulation',
        description: 'Accumulated phase changes',
        params: {
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'winding-number': {
        fn: windingNumber,
        name: 'Winding Number',
        description: 'Orbit winding around origin',
        params: {
            maxWindings: { type: 'number', default: 10, min: 1, max: 50 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'argument-sum': {
        fn: argumentSum,
        name: 'Argument Sum',
        description: 'Sum of orbit point angles',
        params: {
            frequency: { type: 'number', default: 1, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'polar-decomposition': {
        fn: polarDecomposition,
        name: 'Polar Decomposition',
        description: 'Combined radial and angular sectors',
        params: {
            radialSectors: { type: 'number', default: 8, min: 2, max: 32 },
            angularSectors: { type: 'number', default: 8, min: 2, max: 32 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'checkerboard-decomposition': {
        fn: checkerboardDecomposition,
        name: 'Checkerboard Decomposition',
        description: 'Polar checkerboard pattern',
        params: {
            radialSize: { type: 'number', default: 1, min: 0.1, max: 5 },
            angularDivisions: { type: 'number', default: 8, min: 2, max: 32 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    binaryDecomposition,
    angularDecomposition,
    continuousAngle,
    radialWaves,
    angularStripes,
    spiralPattern,
    iterationAngleHybrid,
    phaseAccumulation,
    windingNumber,
    argumentSum,
    polarDecomposition,
    checkerboardDecomposition,
    ANGLE_ALGORITHMS
};
