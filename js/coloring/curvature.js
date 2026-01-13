/**
 * ============================================================================
 * ABYSS EXPLORER - CURVATURE COLORING
 * ============================================================================
 * 
 * Curvature-based coloring algorithms that analyze the geometric properties
 * of the orbit path to create unique visual effects.
 * 
 * Curvature Concept:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  Curvature measures how sharply a curve bends at each point.          │
 * │                                                                        │
 * │  For a parametric curve (x(t), y(t)):                                 │
 * │                                                                        │
 * │            |x'y'' - y'x''|                                             │
 * │    κ = ─────────────────────                                           │
 * │          (x'² + y'²)^(3/2)                                             │
 * │                                                                        │
 * │  For fractal orbits, we approximate this by looking at                │
 * │  consecutive orbit points as a discrete curve.                         │
 * │                                                                        │
 * │  High curvature → tight turns in the orbit → distinct colors          │
 * │  Low curvature → smooth paths → uniform colors                         │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Applications:
 * - Edge enhancement (high curvature near boundaries)
 * - Orbit dynamics visualization
 * - Spiral pattern detection
 * - Chaos quantification
 * 
 * @module coloring/curvature
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Small epsilon to avoid division by zero */
const EPSILON = 1e-10;

/** Maximum curvature value for normalization */
const MAX_CURVATURE = 100;

// ============================================================================
// CURVATURE ALGORITHMS
// ============================================================================

/**
 * Basic Curvature Estimation
 * 
 * Estimates curvature from orbit points using discrete approximation.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function curvatureEstimate(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (orbitHistory && orbitHistory.length >= 3) {
        return computeFullCurvature(orbitHistory, params);
    }
    
    // Fallback to angle-based approximation
    return approximateCurvature(pixelData, index, params);
}

/**
 * Compute full curvature from orbit history
 * @private
 */
function computeFullCurvature(orbitHistory, params) {
    let totalCurvature = 0;
    let maxCurvature = 0;
    let count = 0;
    
    // Need at least 3 points to compute curvature
    for (let i = 1; i < orbitHistory.length - 1; i++) {
        const p0 = orbitHistory[i - 1];
        const p1 = orbitHistory[i];
        const p2 = orbitHistory[i + 1];
        
        // Discrete curvature using Menger curvature formula
        // κ = 4 * Area(triangle) / (|a| * |b| * |c|)
        // where a, b, c are the sides of the triangle
        
        const ax = p1.x - p0.x, ay = p1.y - p0.y;
        const bx = p2.x - p1.x, by = p2.y - p1.y;
        const cx = p2.x - p0.x, cy = p2.y - p0.y;
        
        const aMag = Math.sqrt(ax * ax + ay * ay);
        const bMag = Math.sqrt(bx * bx + by * by);
        const cMag = Math.sqrt(cx * cx + cy * cy);
        
        // Area using cross product
        const area = Math.abs(ax * by - ay * bx) / 2;
        
        const denominator = aMag * bMag * cMag;
        
        if (denominator > EPSILON) {
            const curvature = (4 * area) / denominator;
            totalCurvature += curvature;
            maxCurvature = Math.max(maxCurvature, curvature);
            count++;
        }
    }
    
    // Select output based on mode
    const mode = params.mode || 'average';
    let value;
    
    switch (mode) {
        case 'average':
            value = count > 0 ? totalCurvature / count : 0;
            break;
        case 'maximum':
            value = maxCurvature;
            break;
        case 'total':
            value = totalCurvature;
            break;
        default:
            value = count > 0 ? totalCurvature / count : 0;
    }
    
    // Normalize
    value = Math.min(1, value / (params.normalization || MAX_CURVATURE));
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Approximate curvature from final orbit values
 * @private
 */
function approximateCurvature(pixelData, index, params) {
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    const iter = pixelData.iterations[index];
    
    // Approximate curvature using angle change rate
    // This is a rough estimate based on final z
    const angle = Math.atan2(zy, zx);
    const mag = Math.sqrt(zx * zx + zy * zy);
    
    // Use iteration count and magnitude to estimate dynamics
    const approxCurvature = Math.abs(Math.sin(angle * iter * 0.1)) / (mag + 1);
    
    const value = Math.min(1, approxCurvature * 10);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Gaussian Curvature
 * 
 * Treats the iteration count surface as a 2D manifold and
 * estimates Gaussian curvature.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with width/height
 * @returns {Object} { value, interior }
 */
export function gaussianCurvature(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const width = context.width || 800;
    const height = context.height || 600;
    const x = index % width;
    const y = Math.floor(index / width);
    
    // Need neighbors for Gaussian curvature
    if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) {
        return { value: 0.5, interior: false };
    }
    
    // Get iteration values for 3x3 neighborhood
    const getIter = (dx, dy) => {
        const ni = (y + dy) * width + (x + dx);
        return pixelData.escaped[ni] ? pixelData.iterations[ni] : 0;
    };
    
    const f00 = getIter(-1, -1), f10 = getIter(0, -1), f20 = getIter(1, -1);
    const f01 = getIter(-1, 0),  f11 = getIter(0, 0),  f21 = getIter(1, 0);
    const f02 = getIter(-1, 1),  f12 = getIter(0, 1),  f22 = getIter(1, 1);
    
    // Compute partial derivatives
    const fx = (f21 - f01) / 2;
    const fy = (f12 - f10) / 2;
    const fxx = f21 - 2 * f11 + f01;
    const fyy = f12 - 2 * f11 + f10;
    const fxy = (f22 - f20 - f02 + f00) / 4;
    
    // Gaussian curvature of the surface z = f(x,y)
    // K = (fxx * fyy - fxy²) / (1 + fx² + fy²)²
    const denom = Math.pow(1 + fx * fx + fy * fy, 2);
    const K = (fxx * fyy - fxy * fxy) / (denom + EPSILON);
    
    // Map to [0, 1] using sigmoid
    const normalized = 1 / (1 + Math.exp(-K * (params.sensitivity || 0.01)));
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Mean Curvature
 * 
 * Computes mean curvature of the iteration surface.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with width/height
 * @returns {Object} { value, interior }
 */
export function meanCurvature(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const width = context.width || 800;
    const height = context.height || 600;
    const x = index % width;
    const y = Math.floor(index / width);
    
    if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) {
        return { value: 0.5, interior: false };
    }
    
    const getIter = (dx, dy) => {
        const ni = (y + dy) * width + (x + dx);
        return pixelData.escaped[ni] ? pixelData.iterations[ni] : 0;
    };
    
    const f01 = getIter(-1, 0), f11 = getIter(0, 0), f21 = getIter(1, 0);
    const f10 = getIter(0, -1), f12 = getIter(0, 1);
    
    // Compute partial derivatives
    const fx = (f21 - f01) / 2;
    const fy = (f12 - f10) / 2;
    const fxx = f21 - 2 * f11 + f01;
    const fyy = f12 - 2 * f11 + f10;
    
    // Mean curvature: H = (fxx(1+fy²) + fyy(1+fx²)) / (2(1+fx²+fy²)^(3/2))
    const fxSq = fx * fx;
    const fySq = fy * fy;
    const denom = 2 * Math.pow(1 + fxSq + fySq, 1.5);
    const H = (fxx * (1 + fySq) + fyy * (1 + fxSq)) / (denom + EPSILON);
    
    // Normalize
    const normalized = (Math.tanh(H * (params.sensitivity || 0.1)) + 1) / 2;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Angular Velocity
 * 
 * Measures the rate of angular change in the orbit.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function angularVelocity(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 2) {
        return approximateCurvature(pixelData, index, params);
    }
    
    let totalAngularChange = 0;
    let count = 0;
    
    for (let i = 1; i < orbitHistory.length; i++) {
        const prev = orbitHistory[i - 1];
        const curr = orbitHistory[i];
        
        const prevAngle = Math.atan2(prev.y, prev.x);
        const currAngle = Math.atan2(curr.y, curr.x);
        
        // Angular change (handling wraparound)
        let delta = currAngle - prevAngle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        
        totalAngularChange += Math.abs(delta);
        count++;
    }
    
    const avgAngularVelocity = count > 0 ? totalAngularChange / count : 0;
    
    // Normalize to [0, 1]
    const normalized = Math.min(1, avgAngularVelocity / Math.PI);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Orbit Acceleration
 * 
 * Measures acceleration (second derivative) of the orbit.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function orbitAcceleration(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 3) {
        return approximateCurvature(pixelData, index, params);
    }
    
    let totalAccel = 0;
    let count = 0;
    
    for (let i = 2; i < orbitHistory.length; i++) {
        const p0 = orbitHistory[i - 2];
        const p1 = orbitHistory[i - 1];
        const p2 = orbitHistory[i];
        
        // First derivatives (velocity)
        const v1x = p1.x - p0.x, v1y = p1.y - p0.y;
        const v2x = p2.x - p1.x, v2y = p2.y - p1.y;
        
        // Second derivative (acceleration)
        const ax = v2x - v1x;
        const ay = v2y - v1y;
        const accelMag = Math.sqrt(ax * ax + ay * ay);
        
        totalAccel += accelMag;
        count++;
    }
    
    const avgAccel = count > 0 ? totalAccel / count : 0;
    
    // Normalize using logarithm for large range
    const normalized = Math.min(1, Math.log(avgAccel + 1) / 5);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Torsion (for 3D-like effect)
 * 
 * Simulates torsion by analyzing consecutive curvature changes.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function torsionEstimate(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length < 4) {
        return approximateCurvature(pixelData, index, params);
    }
    
    // Compute curvature at each point and track changes
    const curvatures = [];
    
    for (let i = 1; i < orbitHistory.length - 1; i++) {
        const p0 = orbitHistory[i - 1];
        const p1 = orbitHistory[i];
        const p2 = orbitHistory[i + 1];
        
        const ax = p1.x - p0.x, ay = p1.y - p0.y;
        const bx = p2.x - p1.x, by = p2.y - p1.y;
        const cx = p2.x - p0.x, cy = p2.y - p0.y;
        
        const aMag = Math.sqrt(ax * ax + ay * ay);
        const bMag = Math.sqrt(bx * bx + by * by);
        const cMag = Math.sqrt(cx * cx + cy * cy);
        const area = Math.abs(ax * by - ay * bx) / 2;
        const denom = aMag * bMag * cMag;
        
        if (denom > EPSILON) {
            curvatures.push((4 * area) / denom);
        }
    }
    
    // Torsion is the rate of change of curvature direction
    let totalTorsion = 0;
    for (let i = 1; i < curvatures.length; i++) {
        totalTorsion += Math.abs(curvatures[i] - curvatures[i - 1]);
    }
    
    const avgTorsion = curvatures.length > 1 ? totalTorsion / (curvatures.length - 1) : 0;
    const normalized = Math.min(1, avgTorsion / (params.normalization || 10));
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (normalized + offset) * scale,
        interior: false
    };
}

/**
 * Combined Curvature Analysis
 * 
 * Combines multiple curvature measures for rich visualization.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function combinedCurvature(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Get individual curvature measures
    const curvResult = curvatureEstimate(pixelData, index, { ...params, scale: 1, offset: 0 });
    const angVelResult = angularVelocity(pixelData, index, { ...params, scale: 1, offset: 0 });
    const accelResult = orbitAcceleration(pixelData, index, { ...params, scale: 1, offset: 0 });
    
    // Weights
    const curvWeight = params.curvatureWeight || 0.4;
    const angWeight = params.angularWeight || 0.3;
    const accelWeight = params.accelerationWeight || 0.3;
    
    const totalWeight = curvWeight + angWeight + accelWeight;
    
    const value = (
        curvResult.value * curvWeight +
        angVelResult.value * angWeight +
        accelResult.value * accelWeight
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

export const CURVATURE_ALGORITHMS = {
    'curvature-estimate': {
        fn: curvatureEstimate,
        name: 'Curvature Estimate',
        description: 'Basic orbit curvature estimation',
        params: {
            mode: { type: 'select', default: 'average', options: ['average', 'maximum', 'total'] },
            normalization: { type: 'number', default: 100, min: 1, max: 1000 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'gaussian-curvature': {
        fn: gaussianCurvature,
        name: 'Gaussian Curvature',
        description: 'Surface curvature of iteration landscape',
        params: {
            sensitivity: { type: 'number', default: 0.01, min: 0.001, max: 0.1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'mean-curvature': {
        fn: meanCurvature,
        name: 'Mean Curvature',
        description: 'Mean curvature of iteration surface',
        params: {
            sensitivity: { type: 'number', default: 0.1, min: 0.01, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'angular-velocity': {
        fn: angularVelocity,
        name: 'Angular Velocity',
        description: 'Rate of angular change in orbit',
        params: {
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'orbit-acceleration': {
        fn: orbitAcceleration,
        name: 'Orbit Acceleration',
        description: 'Second derivative of orbit path',
        params: {
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'torsion-estimate': {
        fn: torsionEstimate,
        name: 'Torsion Estimate',
        description: 'Rate of curvature change (3D-like effect)',
        params: {
            normalization: { type: 'number', default: 10, min: 1, max: 100 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'combined-curvature': {
        fn: combinedCurvature,
        name: 'Combined Curvature',
        description: 'Multiple curvature measures combined',
        params: {
            curvatureWeight: { type: 'number', default: 0.4, min: 0, max: 1 },
            angularWeight: { type: 'number', default: 0.3, min: 0, max: 1 },
            accelerationWeight: { type: 'number', default: 0.3, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    curvatureEstimate,
    gaussianCurvature,
    meanCurvature,
    angularVelocity,
    orbitAcceleration,
    torsionEstimate,
    combinedCurvature,
    CURVATURE_ALGORITHMS
};
