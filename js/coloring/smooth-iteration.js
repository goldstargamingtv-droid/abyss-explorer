/**
 * ============================================================================
 * ABYSS EXPLORER - SMOOTH ITERATION COLORING
 * ============================================================================
 * 
 * Classic smooth iteration coloring and its many variations.
 * The foundation of most fractal coloring, this eliminates banding
 * by computing a continuous (smooth) iteration count.
 * 
 * Mathematical Foundation:
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * BASIC SMOOTH ITERATION (Normalized Iteration Count):
 * 
 * For the Mandelbrot set, after n iterations when |z| > bailout:
 * 
 *   μ = n + 1 - log(log|z|) / log(2)
 * 
 * This formula comes from the potential function:
 *   Φ(z) = lim(n→∞) log|zₙ| / 2ⁿ
 * 
 * For general power p (z^p + c):
 *   μ = n + 1 - log(log|z|) / log(p)
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * VARIATIONS:
 * 
 * 1. CONTINUOUS POTENTIAL:
 *    μ = n - log₂(log|z| / log(bailout))
 *    Smoother near bailout boundary
 * 
 * 2. FRACTIONAL ESCAPE:
 *    Uses the ratio of how far past bailout
 *    μ = n + 1 - (log|z| - log(bailout)) / (log|z_prev| - log(bailout))
 * 
 * 3. BINARY DECOMPOSITION:
 *    Uses the sign of imaginary part
 *    Adds 0.5 if Im(z) > 0
 * 
 * 4. EXPONENTIAL SMOOTHING:
 *    μ = n + exp(-|z|² / bailout²)
 *    Gives softer transitions
 * 
 * 5. DERIVATIVE-BASED:
 *    Incorporates |dz/dc| for slope coloring
 * 
 * References:
 * - Peitgen, H.-O., & Richter, P. H. (1986). The Beauty of Fractals
 * - Linas Vepstas' algorithm: http://linas.org/art-gallery/escape/escape.html
 * 
 * @module coloring/smooth-iteration
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Log of 2, precomputed */
const LOG2 = Math.log(2);

/** Log of 10, precomputed */
const LOG10 = Math.log(10);

/** Euler's number */
const E = Math.E;

// ============================================================================
// SMOOTH ITERATION ALGORITHMS
// ============================================================================

/**
 * Basic smooth iteration (normalized iteration count)
 * 
 * Formula: μ = n + 1 - log(log|z|) / log(2)
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Smooth iteration value (0-1 normalized)
 */
export function smoothIteration(ctx, params = {}) {
    const {
        power = 2,          // Exponent of the fractal formula
        cycleScale = 1,     // Scale factor for cycling
        cycleOffset = 0,    // Offset for cycling
        normalize = true    // Normalize to 0-1 range
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, maxIterations } = ctx;
    
    // Calculate |z|² and |z|
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Avoid log(0) and log(negative)
    if (zMag <= 1) {
        return normalize ? iterations / maxIterations : iterations;
    }
    
    // Smooth iteration formula
    // μ = n + 1 - log(log|z|) / log(power)
    const logPower = Math.log(power);
    const smoothValue = iterations + 1 - Math.log(Math.log(zMag)) / logPower;
    
    // Apply cycling
    let result = smoothValue * cycleScale + cycleOffset;
    
    // Normalize to 0-1 range
    if (normalize) {
        result = (result % 256) / 256;
        if (result < 0) result += 1;
    }
    
    return result;
}

/**
 * Continuous potential coloring
 * 
 * Formula: μ = n - log₂(log|z| / log(bailout))
 * 
 * This variation is smoother near the bailout boundary
 * because it accounts for the bailout radius.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Continuous potential value
 */
export function continuousPotential(ctx, params = {}) {
    const {
        bailout = 2,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    if (zMag <= 1) return iterations / ctx.maxIterations;
    
    const logBailout = Math.log(bailout);
    
    // μ = n - log₂(log|z| / log(bailout))
    const smoothValue = iterations - Math.log(Math.log(zMag) / logBailout) / LOG2;
    
    let result = smoothValue * cycleScale + cycleOffset;
    result = (result % 256) / 256;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Fractional escape time
 * 
 * Uses linear interpolation based on how far past bailout.
 * Requires knowing the previous iteration's magnitude.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Fractional escape value
 */
export function fractionalEscape(ctx, params = {}) {
    const {
        bailout = 2,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, distance } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    const bailoutSq = bailout * bailout;
    
    // Estimate the fractional part
    // If we had the previous z, we'd interpolate
    // Since we don't, use log-based approximation
    const logRatio = Math.log(zMagSq / bailoutSq);
    const fraction = 1 - Math.min(1, Math.max(0, logRatio / Math.log(zMagSq)));
    
    let result = (iterations + fraction) * cycleScale + cycleOffset;
    result = (result % 256) / 256;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Binary decomposition coloring
 * 
 * Adds 0.5 to the iteration count if the imaginary part of z is positive.
 * Creates a "zebra stripe" effect along the boundary.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Binary decomposition value
 */
export function binaryDecomposition(ctx, params = {}) {
    const {
        power = 2,
        cycleScale = 1,
        cycleOffset = 0,
        decompositionAxis = 'imaginary' // 'real', 'imaginary', 'both'
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Base smooth iteration
    let smoothValue = iterations + 1;
    if (zMag > 1) {
        smoothValue -= Math.log(Math.log(zMag)) / Math.log(power);
    }
    
    // Add decomposition offset
    let decomp = 0;
    switch (decompositionAxis) {
        case 'real':
            decomp = orbitX > 0 ? 0.5 : 0;
            break;
        case 'imaginary':
            decomp = orbitY > 0 ? 0.5 : 0;
            break;
        case 'both':
            decomp = ((orbitX > 0) !== (orbitY > 0)) ? 0.5 : 0;
            break;
    }
    
    let result = (smoothValue + decomp) * cycleScale + cycleOffset;
    result = (result % 256) / 256;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Exponential smoothing
 * 
 * Uses exponential decay for softer color transitions.
 * Formula: μ = n + exp(-|z|² / bailout²)
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Exponentially smoothed value
 */
export function exponentialSmoothing(ctx, params = {}) {
    const {
        bailout = 2,
        decayRate = 1,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const bailoutSq = bailout * bailout;
    
    // Exponential smoothing
    const expTerm = Math.exp(-decayRate * zMagSq / bailoutSq);
    const smoothValue = iterations + expTerm;
    
    let result = smoothValue * cycleScale + cycleOffset;
    result = (result % 256) / 256;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Renormalized iteration count
 * 
 * A more mathematically rigorous version that handles
 * arbitrary power and produces values in [0, 1].
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Renormalized value
 */
export function renormalizedIteration(ctx, params = {}) {
    const {
        power = 2,
        bailout = 2
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, maxIterations } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    
    if (zMagSq <= 1) return iterations / maxIterations;
    
    // log(|z|) / 2^n approaches a constant (the potential)
    // We compute a normalized version
    const log_zn = Math.log(zMagSq) / 2;
    const nu = Math.log(log_zn / Math.log(bailout)) / Math.log(power);
    
    // Renormalized count
    const renorm = iterations + 1 - nu;
    
    return (renorm / maxIterations) % 1;
}

/**
 * Ultra-smooth iteration with derivative
 * 
 * Incorporates the derivative |dz/dc| for even smoother
 * coloring that takes into account the local "slope".
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Derivative-enhanced smooth value
 */
export function derivativeSmooth(ctx, params = {}) {
    const {
        power = 2,
        derivativeWeight = 0.5,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, distance } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Base smooth iteration
    let smoothValue = iterations + 1;
    if (zMag > 1) {
        smoothValue -= Math.log(Math.log(zMag)) / Math.log(power);
    }
    
    // Add derivative influence if available
    // Distance estimate is related to |z| * log|z| / |dz|
    if (distance > 0) {
        const deriv = zMag * Math.log(zMag) / distance;
        const derivFactor = Math.log(deriv + 1) / Math.log(iterations + 1);
        smoothValue += derivativeWeight * derivFactor;
    }
    
    let result = smoothValue * cycleScale + cycleOffset;
    result = (result % 256) / 256;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Parabolic smooth iteration
 * 
 * Uses a parabolic adjustment for different visual character.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Parabolically smoothed value
 */
export function parabolicSmooth(ctx, params = {}) {
    const {
        exponent = 0.5, // 0.5 = sqrt (parabola), 2 = squared
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, maxIterations } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Base smooth iteration
    let smoothValue = iterations + 1;
    if (zMag > 1) {
        smoothValue -= Math.log(Math.log(zMag)) / LOG2;
    }
    
    // Normalize to 0-1
    let normalized = smoothValue / maxIterations;
    
    // Apply parabolic transform
    normalized = Math.pow(normalized, exponent);
    
    // Apply cycling
    let result = normalized * cycleScale * 256 + cycleOffset;
    result = (result % 256) / 256;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Sinusoidal smooth iteration
 * 
 * Applies sinusoidal modulation for wavy color patterns.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Sinusoidally modulated value
 */
export function sinusoidalSmooth(ctx, params = {}) {
    const {
        frequency = 1,
        phase = 0,
        amplitude = 0.5,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Base smooth iteration
    let smoothValue = iterations + 1;
    if (zMag > 1) {
        smoothValue -= Math.log(Math.log(zMag)) / LOG2;
    }
    
    // Add sinusoidal modulation
    const sinMod = amplitude * Math.sin(frequency * smoothValue * Math.PI + phase);
    smoothValue += sinMod;
    
    let result = smoothValue * cycleScale + cycleOffset;
    result = (result % 256) / 256;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Tangent smooth iteration
 * 
 * Uses tangent function for sharper transitions.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Tangent-modulated value
 */
export function tangentSmooth(ctx, params = {}) {
    const {
        frequency = 0.5,
        clampRange = 2,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Base smooth iteration
    let smoothValue = iterations + 1;
    if (zMag > 1) {
        smoothValue -= Math.log(Math.log(zMag)) / LOG2;
    }
    
    // Apply tangent (clamped to avoid infinity)
    let tanValue = Math.tan(frequency * smoothValue);
    tanValue = Math.max(-clampRange, Math.min(clampRange, tanValue));
    
    // Normalize tangent to 0-1
    let result = (tanValue / (2 * clampRange) + 0.5);
    result = result * cycleScale + cycleOffset;
    result = result % 1;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Logarithmic bands
 * 
 * Creates bands based on log of iteration count.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Logarithmic band value
 */
export function logBands(ctx, params = {}) {
    const {
        bandCount = 10,
        smoothness = 0.5,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Base smooth iteration
    let smoothValue = iterations + 1;
    if (zMag > 1) {
        smoothValue -= Math.log(Math.log(zMag)) / LOG2;
    }
    
    // Create logarithmic bands
    const logValue = Math.log(smoothValue + 1);
    const band = logValue * bandCount;
    
    // Smooth or sharp bands
    let result;
    if (smoothness >= 1) {
        result = band % 1;
    } else if (smoothness <= 0) {
        result = Math.floor(band) % 2 === 0 ? 0 : 1;
    } else {
        const frac = band % 1;
        result = frac < smoothness ? frac / smoothness : 1;
    }
    
    result = result * cycleScale + cycleOffset;
    result = result % 1;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Biomorphic smooth iteration
 * 
 * Named after Clifford Pickover's "biomorph" rendering,
 * this uses both real and imaginary parts independently.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Biomorphic coloring value
 */
export function biomorphSmooth(ctx, params = {}) {
    const {
        threshold = 10,
        mixRatio = 0.5,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, maxIterations } = ctx;
    
    // Check if either component is small (biomorph condition)
    const realSmall = Math.abs(orbitX) < threshold;
    const imagSmall = Math.abs(orbitY) < threshold;
    
    let result;
    
    if (realSmall || imagSmall) {
        // Use angle-based coloring for biomorph points
        const angle = Math.atan2(orbitY, orbitX) / (2 * Math.PI) + 0.5;
        const iterNorm = iterations / maxIterations;
        result = angle * mixRatio + iterNorm * (1 - mixRatio);
    } else {
        // Standard smooth iteration
        const zMag = Math.sqrt(orbitX * orbitX + orbitY * orbitY);
        result = iterations + 1;
        if (zMag > 1) {
            result -= Math.log(Math.log(zMag)) / LOG2;
        }
        result = (result % 256) / 256;
    }
    
    result = result * cycleScale + cycleOffset;
    result = result % 1;
    if (result < 0) result += 1;
    
    return result;
}

// ============================================================================
// HYBRID VARIATIONS
// ============================================================================

/**
 * Smooth + Distance hybrid
 * 
 * Combines smooth iteration with distance estimation
 * for enhanced boundary definition.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Hybrid coloring value
 */
export function smoothDistanceHybrid(ctx, params = {}) {
    const {
        smoothWeight = 0.7,
        distanceWeight = 0.3,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, distance, maxIterations } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Smooth iteration component
    let smooth = iterations + 1;
    if (zMag > 1) {
        smooth -= Math.log(Math.log(zMag)) / LOG2;
    }
    smooth = (smooth % 256) / 256;
    
    // Distance component (log scale)
    let dist = 0;
    if (distance > 0) {
        dist = Math.log(distance + 1) / 10;
        dist = Math.max(0, Math.min(1, dist));
    }
    
    // Combine
    let result = smooth * smoothWeight + dist * distanceWeight;
    result = result * cycleScale + cycleOffset;
    result = result % 1;
    if (result < 0) result += 1;
    
    return result;
}

/**
 * Smooth + Angle hybrid
 * 
 * Modulates smooth iteration by the angle of final z.
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Algorithm parameters
 * @returns {number} Angle-modulated smooth value
 */
export function smoothAngleHybrid(ctx, params = {}) {
    const {
        angleWeight = 0.3,
        angleFrequency = 1,
        cycleScale = 1,
        cycleOffset = 0
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { iterations, orbitX, orbitY, angle } = ctx;
    const zMagSq = orbitX * orbitX + orbitY * orbitY;
    const zMag = Math.sqrt(zMagSq);
    
    // Smooth iteration
    let smooth = iterations + 1;
    if (zMag > 1) {
        smooth -= Math.log(Math.log(zMag)) / LOG2;
    }
    smooth = (smooth % 256) / 256;
    
    // Angle component
    const angleNorm = (Math.atan2(orbitY, orbitX) / Math.PI + 1) / 2;
    const angleModulation = Math.sin(angleNorm * angleFrequency * Math.PI * 2);
    
    // Combine
    let result = smooth + angleWeight * angleModulation;
    result = result * cycleScale + cycleOffset;
    result = result % 1;
    if (result < 0) result += 1;
    
    return result;
}

// ============================================================================
// ALGORITHM REGISTRY ENTRIES
// ============================================================================

/**
 * All smooth iteration algorithms with metadata
 */
export const SMOOTH_ALGORITHMS = {
    'smooth-iteration': {
        fn: smoothIteration,
        name: 'Smooth Iteration',
        description: 'Classic smooth/continuous iteration count',
        category: 'smooth',
        params: {
            power: { type: 'number', default: 2, min: 1, max: 10, step: 0.1 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 },
            normalize: { type: 'boolean', default: true }
        }
    },
    'continuous-potential': {
        fn: continuousPotential,
        name: 'Continuous Potential',
        description: 'Smooth coloring with bailout compensation',
        category: 'smooth',
        params: {
            bailout: { type: 'number', default: 2, min: 1, max: 1000 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'fractional-escape': {
        fn: fractionalEscape,
        name: 'Fractional Escape',
        description: 'Linear interpolation based escape',
        category: 'smooth',
        params: {
            bailout: { type: 'number', default: 2, min: 1, max: 1000 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'binary-decomposition': {
        fn: binaryDecomposition,
        name: 'Binary Decomposition',
        description: 'Zebra stripes based on z component signs',
        category: 'smooth',
        params: {
            power: { type: 'number', default: 2, min: 1, max: 10 },
            decompositionAxis: { type: 'select', default: 'imaginary', options: ['real', 'imaginary', 'both'] },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'exponential-smooth': {
        fn: exponentialSmoothing,
        name: 'Exponential Smoothing',
        description: 'Soft exponential decay transitions',
        category: 'smooth',
        params: {
            bailout: { type: 'number', default: 2, min: 1, max: 1000 },
            decayRate: { type: 'number', default: 1, min: 0.1, max: 10 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'renormalized': {
        fn: renormalizedIteration,
        name: 'Renormalized',
        description: 'Mathematically rigorous normalization',
        category: 'smooth',
        params: {
            power: { type: 'number', default: 2, min: 1, max: 10 },
            bailout: { type: 'number', default: 2, min: 1, max: 1000 }
        }
    },
    'derivative-smooth': {
        fn: derivativeSmooth,
        name: 'Derivative Smooth',
        description: 'Incorporates derivative for slope coloring',
        category: 'smooth',
        params: {
            power: { type: 'number', default: 2, min: 1, max: 10 },
            derivativeWeight: { type: 'number', default: 0.5, min: 0, max: 2 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'parabolic-smooth': {
        fn: parabolicSmooth,
        name: 'Parabolic Smooth',
        description: 'Power curve adjustment',
        category: 'smooth',
        params: {
            exponent: { type: 'number', default: 0.5, min: 0.1, max: 3 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'sinusoidal-smooth': {
        fn: sinusoidalSmooth,
        name: 'Sinusoidal',
        description: 'Wavy sinusoidal modulation',
        category: 'smooth',
        params: {
            frequency: { type: 'number', default: 1, min: 0.1, max: 20 },
            phase: { type: 'number', default: 0, min: 0, max: Math.PI * 2 },
            amplitude: { type: 'number', default: 0.5, min: 0, max: 2 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'tangent-smooth': {
        fn: tangentSmooth,
        name: 'Tangent',
        description: 'Sharp tangent transitions',
        category: 'smooth',
        params: {
            frequency: { type: 'number', default: 0.5, min: 0.1, max: 5 },
            clampRange: { type: 'number', default: 2, min: 0.5, max: 10 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'log-bands': {
        fn: logBands,
        name: 'Logarithmic Bands',
        description: 'Banding with log scale',
        category: 'smooth',
        params: {
            bandCount: { type: 'number', default: 10, min: 1, max: 100 },
            smoothness: { type: 'number', default: 0.5, min: 0, max: 1 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'biomorph': {
        fn: biomorphSmooth,
        name: 'Biomorph',
        description: 'Pickover biomorph-style coloring',
        category: 'smooth',
        params: {
            threshold: { type: 'number', default: 10, min: 1, max: 100 },
            mixRatio: { type: 'number', default: 0.5, min: 0, max: 1 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'smooth-distance-hybrid': {
        fn: smoothDistanceHybrid,
        name: 'Smooth + Distance',
        description: 'Hybrid smooth iteration with distance estimation',
        category: 'hybrid',
        params: {
            smoothWeight: { type: 'number', default: 0.7, min: 0, max: 1 },
            distanceWeight: { type: 'number', default: 0.3, min: 0, max: 1 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    },
    'smooth-angle-hybrid': {
        fn: smoothAngleHybrid,
        name: 'Smooth + Angle',
        description: 'Smooth iteration with angle modulation',
        category: 'hybrid',
        params: {
            angleWeight: { type: 'number', default: 0.3, min: 0, max: 1 },
            angleFrequency: { type: 'number', default: 1, min: 0.1, max: 10 },
            cycleScale: { type: 'number', default: 1, min: 0.01, max: 100 },
            cycleOffset: { type: 'number', default: 0, min: -1000, max: 1000 }
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default smoothIteration;
