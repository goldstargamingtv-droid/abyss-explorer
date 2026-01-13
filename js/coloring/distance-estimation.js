/**
 * ============================================================================
 * ABYSS EXPLORER - DISTANCE ESTIMATION COLORING
 * ============================================================================
 * 
 * Distance estimation coloring algorithms for creating boundary glows,
 * outlines, and interior/exterior shading effects.
 * 
 * Distance Estimation Theory:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  The distance estimate gives the approximate Euclidean distance       │
 * │  from a point c to the Mandelbrot set boundary.                       │
 * │                                                                        │
 * │  For external points:                                                  │
 * │                    |zₙ| · log|zₙ|                                      │
 * │    d(c) ≈ ─────────────────────────                                    │
 * │                     |z'ₙ|                                              │
 * │                                                                        │
 * │  where z'ₙ is the derivative: ∂zₙ/∂c                                  │
 * │                                                                        │
 * │  The derivative follows the recurrence:                                │
 * │    z'₀ = 0                                                             │
 * │    z'ₙ₊₁ = 2·zₙ·z'ₙ + 1                                               │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Applications:
 * - Boundary glow effects (closer = brighter)
 * - Outline rendering (sharp edge detection)
 * - Interior/exterior distinction
 * - Anti-aliased rendering guidance
 * - Level set visualization
 * 
 * @module coloring/distance-estimation
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Small epsilon for avoiding division by zero */
const EPSILON = 1e-10;

/** Default overflow threshold */
const OVERFLOW_THRESHOLD = 1e100;

// ============================================================================
// DISTANCE ESTIMATION ALGORITHMS
// ============================================================================

/**
 * Basic distance estimation coloring
 * 
 * Uses pre-computed distance values from the renderer,
 * or computes them from final orbit values.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function distanceEstimation(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Use pre-computed distance if available
    let distance = pixelData.distances?.[index];
    
    if (distance === undefined || distance === 0) {
        // Estimate from final values (less accurate)
        const zx = pixelData.orbitX[index];
        const zy = pixelData.orbitY[index];
        const zMag = Math.sqrt(zx * zx + zy * zy);
        distance = zMag * Math.log(zMag) / (pixelData.iterations[index] + 1);
    }
    
    // Apply transformations
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    const logScale = params.logScale !== false;
    const invert = params.invert || false;
    
    let value = distance;
    
    if (logScale && value > 0) {
        value = -Math.log(value);
    }
    
    value = (value + offset) * scale;
    
    if (invert) {
        value = 1 - Math.min(1, Math.max(0, value));
    }
    
    return {
        value: Math.max(0, value),
        interior: false
    };
}

/**
 * Normalized distance estimation
 * 
 * Normalizes distance values to [0, 1] range based on
 * screen pixel size for consistent appearance across zoom levels.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Rendering context with zoom info
 * @returns {Object} { value, interior }
 */
export function normalizedDistance(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    
    // Get pixel size in fractal space
    const pixelSize = context.pixelSize || (1 / (context.zoom || 200));
    
    // Normalize distance by pixel size
    const normalized = distance / pixelSize;
    
    // Apply smooth falloff
    const falloff = params.falloff || 2;
    const value = 1 - Math.exp(-normalized / falloff);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Boundary glow effect
 * 
 * Creates a glowing effect near the set boundary,
 * with brightness inversely proportional to distance.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function boundaryGlow(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    
    // Glow parameters
    const intensity = params.intensity || 1;
    const falloff = params.falloff || 1;
    const threshold = params.threshold || 0.1;
    
    // Compute glow
    let glow;
    if (distance < threshold) {
        glow = intensity * Math.pow(1 - distance / threshold, falloff);
    } else {
        glow = 0;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (glow + offset) * scale,
        interior: false
    };
}

/**
 * Outline detection
 * 
 * Creates sharp outlines at the boundary using
 * distance thresholding.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function outlineDetection(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    
    // Outline parameters
    const threshold = params.threshold || 0.01;
    const sharpness = params.sharpness || 10;
    
    // Sharp outline using sigmoid
    const outline = 1 / (1 + Math.exp(-sharpness * (threshold - distance)));
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (outline + offset) * scale,
        interior: false
    };
}

/**
 * Level sets visualization
 * 
 * Creates contour lines at regular distance intervals,
 * similar to topographic maps.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function levelSets(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    
    // Level set parameters
    const spacing = params.spacing || 0.1;
    const lineWidth = params.lineWidth || 0.3;
    
    // Apply log scale for better distribution
    if (params.logScale !== false && distance > 0) {
        distance = -Math.log(distance);
    }
    
    // Create contour lines
    const phase = (distance / spacing) % 1;
    const contour = Math.abs(phase - 0.5) < lineWidth / 2 ? 1 : 0;
    
    // Optional smooth transition
    let value;
    if (params.smooth) {
        value = 1 - 2 * Math.abs(phase - 0.5);
    } else {
        value = contour;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Interior distance estimation
 * 
 * Estimates distance from interior points to the boundary,
 * used for coloring points inside the set.
 * 
 * Note: This requires special interior distance calculation
 * during rendering (not always available).
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function interiorDistance(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (escaped) {
        // Exterior point - return 0 or fall back to exterior distance
        if (params.includeExterior) {
            return distanceEstimation(pixelData, index, params);
        }
        return { value: 0, interior: false };
    }
    
    // For interior points, use distance estimate or iteration-based approximation
    let distance = pixelData.distances?.[index];
    
    if (!distance || distance === 0) {
        // Estimate from final orbit position
        const zx = pixelData.orbitX[index];
        const zy = pixelData.orbitY[index];
        const zMag = Math.sqrt(zx * zx + zy * zy);
        
        // Interior points oscillate near an attractor
        // Distance can be estimated from attractor distance
        distance = zMag;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    const logScale = params.logScale || false;
    
    let value = distance;
    
    if (logScale && value > 0) {
        value = Math.log(value + 1);
    }
    
    return {
        value: (value + offset) * scale,
        interior: true
    };
}

/**
 * Gradient-based distance coloring
 * 
 * Uses the gradient (derivative) magnitude for
 * detail-aware coloring.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function gradientMagnitude(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Estimate gradient from neighboring pixels
    const width = params.width || 800;
    const x = index % width;
    const y = Math.floor(index / width);
    
    // Get neighboring distances
    const dist = pixelData.distances?.[index] || 0;
    const distLeft = x > 0 ? (pixelData.distances?.[index - 1] || 0) : dist;
    const distRight = x < width - 1 ? (pixelData.distances?.[index + 1] || 0) : dist;
    const distUp = y > 0 ? (pixelData.distances?.[index - width] || 0) : dist;
    const distDown = (pixelData.distances?.[index + width] || 0) || dist;
    
    // Compute gradient
    const gradX = (distRight - distLeft) / 2;
    const gradY = (distDown - distUp) / 2;
    const gradMag = Math.sqrt(gradX * gradX + gradY * gradY);
    
    const scale = params.scale || 100;
    const offset = params.offset || 0;
    
    return {
        value: (gradMag + offset) * scale,
        interior: false
    };
}

/**
 * Combined interior/exterior distance coloring
 * 
 * Provides continuous coloring across the boundary.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function combinedDistance(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    let distance = pixelData.distances?.[index] || 0;
    
    if (!escaped) {
        // Interior - use negative distance or orbit-based estimate
        const zx = pixelData.orbitX[index];
        const zy = pixelData.orbitY[index];
        distance = -Math.sqrt(zx * zx + zy * zy);
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    // Map to [0, 1] with boundary at 0.5
    const mapped = 0.5 + 0.5 * Math.tanh(distance * scale);
    
    return {
        value: (mapped + offset),
        interior: !escaped
    };
}

/**
 * Exponential distance glow
 * 
 * Creates smooth exponential falloff from boundary.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function exponentialGlow(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: params.interiorValue || 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    
    const decay = params.decay || 10;
    const intensity = params.intensity || 1;
    
    const glow = intensity * Math.exp(-decay * distance);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (glow + offset) * scale,
        interior: false
    };
}

/**
 * Power-law distance coloring
 * 
 * Uses power-law falloff for adjustable contrast.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function powerLawDistance(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    
    const power = params.power || 0.5;
    const base = params.base || 1;
    
    let value;
    if (distance > 0) {
        value = base * Math.pow(distance, power);
    } else {
        value = 0;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Distance bands
 * 
 * Creates discrete bands based on distance,
 * similar to iteration bands but smoother.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function distanceBands(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    
    const bandCount = params.bandCount || 10;
    const logScale = params.logScale !== false;
    
    if (logScale && distance > 0) {
        distance = -Math.log(distance);
    }
    
    // Create bands
    const band = Math.floor(distance * bandCount) / bandCount;
    
    // Optional smooth interpolation within band
    let value;
    if (params.smooth) {
        const bandFrac = (distance * bandCount) % 1;
        value = band + bandFrac / bandCount;
    } else {
        value = band;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Distance-iteration hybrid
 * 
 * Combines distance estimation with iteration count
 * for richer coloring.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function distanceIterationHybrid(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    let distance = pixelData.distances?.[index] || 0;
    const iter = pixelData.iterations[index];
    
    const distWeight = params.distanceWeight || 0.5;
    const iterWeight = 1 - distWeight;
    
    // Normalize distance to similar scale as iterations
    const logDist = distance > 0 ? -Math.log(distance) : 0;
    const normalizedDist = logDist / 10; // Adjust scale
    
    const hybrid = distWeight * normalizedDist + iterWeight * iter;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (hybrid + offset) * scale,
        interior: false
    };
}

// ============================================================================
// ALGORITHM COLLECTION
// ============================================================================

export const DISTANCE_ALGORITHMS = {
    'distance-estimation': {
        fn: distanceEstimation,
        name: 'Distance Estimation',
        description: 'Basic distance to boundary coloring',
        params: {
            scale: { type: 'number', default: 1, min: 0.01, max: 100 },
            offset: { type: 'number', default: 0, min: -10, max: 10 },
            logScale: { type: 'boolean', default: true },
            invert: { type: 'boolean', default: false }
        }
    },
    'normalized-distance': {
        fn: normalizedDistance,
        name: 'Normalized Distance',
        description: 'Zoom-independent distance coloring',
        params: {
            falloff: { type: 'number', default: 2, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.01, max: 100 },
            offset: { type: 'number', default: 0, min: -10, max: 10 }
        }
    },
    'boundary-glow': {
        fn: boundaryGlow,
        name: 'Boundary Glow',
        description: 'Glowing effect near the boundary',
        params: {
            intensity: { type: 'number', default: 1, min: 0, max: 5 },
            falloff: { type: 'number', default: 1, min: 0.1, max: 5 },
            threshold: { type: 'number', default: 0.1, min: 0.001, max: 1 },
            scale: { type: 'number', default: 1, min: 0.01, max: 100 }
        }
    },
    'outline-detection': {
        fn: outlineDetection,
        name: 'Outline Detection',
        description: 'Sharp boundary outlines',
        params: {
            threshold: { type: 'number', default: 0.01, min: 0.0001, max: 0.5 },
            sharpness: { type: 'number', default: 10, min: 1, max: 100 },
            scale: { type: 'number', default: 1, min: 0.01, max: 100 }
        }
    },
    'level-sets': {
        fn: levelSets,
        name: 'Level Sets',
        description: 'Topographic contour lines',
        params: {
            spacing: { type: 'number', default: 0.1, min: 0.01, max: 1 },
            lineWidth: { type: 'number', default: 0.3, min: 0.05, max: 0.5 },
            smooth: { type: 'boolean', default: false },
            logScale: { type: 'boolean', default: true }
        }
    },
    'interior-distance': {
        fn: interiorDistance,
        name: 'Interior Distance',
        description: 'Distance coloring for interior points',
        params: {
            scale: { type: 'number', default: 1, min: 0.01, max: 100 },
            offset: { type: 'number', default: 0, min: -10, max: 10 },
            logScale: { type: 'boolean', default: false },
            includeExterior: { type: 'boolean', default: false }
        }
    },
    'gradient-magnitude': {
        fn: gradientMagnitude,
        name: 'Gradient Magnitude',
        description: 'Edge detection via gradient',
        params: {
            scale: { type: 'number', default: 100, min: 1, max: 1000 },
            offset: { type: 'number', default: 0, min: -10, max: 10 }
        }
    },
    'combined-distance': {
        fn: combinedDistance,
        name: 'Combined Distance',
        description: 'Interior and exterior continuous',
        params: {
            scale: { type: 'number', default: 1, min: 0.01, max: 100 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'exponential-glow': {
        fn: exponentialGlow,
        name: 'Exponential Glow',
        description: 'Smooth exponential falloff',
        params: {
            decay: { type: 'number', default: 10, min: 0.1, max: 100 },
            intensity: { type: 'number', default: 1, min: 0, max: 5 },
            interiorValue: { type: 'number', default: 0, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.01, max: 100 }
        }
    },
    'power-law-distance': {
        fn: powerLawDistance,
        name: 'Power Law Distance',
        description: 'Adjustable contrast power-law',
        params: {
            power: { type: 'number', default: 0.5, min: 0.1, max: 3 },
            base: { type: 'number', default: 1, min: 0.1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.01, max: 100 }
        }
    },
    'distance-bands': {
        fn: distanceBands,
        name: 'Distance Bands',
        description: 'Discrete distance-based bands',
        params: {
            bandCount: { type: 'number', default: 10, min: 2, max: 100 },
            logScale: { type: 'boolean', default: true },
            smooth: { type: 'boolean', default: false },
            scale: { type: 'number', default: 1, min: 0.01, max: 100 }
        }
    },
    'distance-iteration-hybrid': {
        fn: distanceIterationHybrid,
        name: 'Distance-Iteration Hybrid',
        description: 'Combined distance and iteration',
        params: {
            distanceWeight: { type: 'number', default: 0.5, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.01, max: 100 },
            offset: { type: 'number', default: 0, min: -100, max: 100 }
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    distanceEstimation,
    normalizedDistance,
    boundaryGlow,
    outlineDetection,
    levelSets,
    interiorDistance,
    gradientMagnitude,
    combinedDistance,
    exponentialGlow,
    powerLawDistance,
    distanceBands,
    distanceIterationHybrid,
    DISTANCE_ALGORITHMS
};
