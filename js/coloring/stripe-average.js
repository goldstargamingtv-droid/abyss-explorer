/**
 * ============================================================================
 * ABYSS EXPLORER - STRIPE AVERAGE COLORING
 * ============================================================================
 * 
 * Stripe Average Density (SAD) coloring algorithms create periodic banding
 * patterns based on the argument (angle) of orbit points.
 * 
 * The Concept:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  For each iteration, compute: sin(n × arg(z))                         │
 * │                                                                        │
 * │  where:                                                                │
 * │    n = stripe frequency                                                │
 * │    arg(z) = atan2(Im(z), Re(z)) = angle of z                          │
 * │                                                                        │
 * │  The average of these values creates smooth stripe patterns           │
 * │  that follow the orbit dynamics.                                      │
 * │                                                                        │
 * │  Stripe Average = (1/N) × Σ sin(n × arg(zᵢ))                          │
 * │                                                                        │
 * │  Visual Effect: Creates concentric stripes that wrap around           │
 * │  the fractal in psychedelic wave patterns.                            │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * References:
 * - Jussi Härkönen, "On Smooth Fractal Coloring Techniques"
 * - Stripe Average concept from Ultra Fractal documentation
 * 
 * @module coloring/stripe-average
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Two PI */
const TWO_PI = 2 * Math.PI;

/** Default stripe frequency */
const DEFAULT_FREQUENCY = 10;

// ============================================================================
// STRIPE AVERAGE ALGORITHMS
// ============================================================================

/**
 * Basic Stripe Average Density
 * 
 * Computes the average of sin(n × arg(z)) across iterations.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function stripeAverage(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (orbitHistory && orbitHistory.length > 0) {
        return computeFullStripeAverage(orbitHistory, params);
    }
    
    // Fallback to single-point approximation
    return approximateStripeAverage(pixelData, index, params);
}

/**
 * Compute full stripe average from orbit history
 * @private
 */
function computeFullStripeAverage(orbitHistory, params) {
    const frequency = params.frequency || DEFAULT_FREQUENCY;
    let sum = 0;
    let count = 0;
    
    for (const z of orbitHistory) {
        const angle = Math.atan2(z.y, z.x);
        sum += Math.sin(frequency * angle);
        count++;
    }
    
    // Normalize to [0, 1]
    const average = count > 0 ? (sum / count + 1) / 2 : 0.5;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (average + offset) * scale,
        interior: false
    };
}

/**
 * Approximate stripe average from final orbit value
 * @private
 */
function approximateStripeAverage(pixelData, index, params) {
    const zx = pixelData.orbitX[index];
    const zy = pixelData.orbitY[index];
    const iter = pixelData.iterations[index];
    
    const frequency = params.frequency || DEFAULT_FREQUENCY;
    const angle = Math.atan2(zy, zx);
    
    // Single point value
    const stripe = Math.sin(frequency * angle);
    
    // Blend with iteration for smoother result
    const iterNorm = (iter % 256) / 256;
    const blendFactor = params.iterationBlend || 0.3;
    
    const value = ((stripe + 1) / 2) * (1 - blendFactor) + iterNorm * blendFactor;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Cosine Stripe Average
 * 
 * Uses cosine instead of sine for shifted phase.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function cosineStripeAverage(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    const frequency = params.frequency || DEFAULT_FREQUENCY;
    
    let sum = 0;
    let count = 0;
    
    if (orbitHistory && orbitHistory.length > 0) {
        for (const z of orbitHistory) {
            const angle = Math.atan2(z.y, z.x);
            sum += Math.cos(frequency * angle);
            count++;
        }
    } else {
        const zx = pixelData.orbitX[index];
        const zy = pixelData.orbitY[index];
        const angle = Math.atan2(zy, zx);
        sum = Math.cos(frequency * angle);
        count = 1;
    }
    
    const average = count > 0 ? (sum / count + 1) / 2 : 0.5;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (average + offset) * scale,
        interior: false
    };
}

/**
 * Weighted Stripe Average
 * 
 * Weights later iterations more heavily for different visual effect.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function weightedStripeAverage(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    if (!orbitHistory || orbitHistory.length === 0) {
        return approximateStripeAverage(pixelData, index, params);
    }
    
    const frequency = params.frequency || DEFAULT_FREQUENCY;
    const weightPower = params.weightPower || 1;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < orbitHistory.length; i++) {
        const z = orbitHistory[i];
        const angle = Math.atan2(z.y, z.x);
        const stripe = Math.sin(frequency * angle);
        
        const weight = Math.pow((i + 1) / orbitHistory.length, weightPower);
        weightedSum += stripe * weight;
        totalWeight += weight;
    }
    
    const average = totalWeight > 0 ? (weightedSum / totalWeight + 1) / 2 : 0.5;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (average + offset) * scale,
        interior: false
    };
}

/**
 * Multi-frequency Stripe Average
 * 
 * Combines multiple stripe frequencies for complex patterns.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function multiFrequencyStripe(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const frequencies = params.frequencies || [5, 10, 20];
    const weights = params.weights || frequencies.map(() => 1);
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    let totalValue = 0;
    let totalWeight = 0;
    
    for (let f = 0; f < frequencies.length; f++) {
        const freq = frequencies[f];
        const weight = weights[f] || 1;
        
        let sum = 0;
        let count = 0;
        
        if (orbitHistory && orbitHistory.length > 0) {
            for (const z of orbitHistory) {
                const angle = Math.atan2(z.y, z.x);
                sum += Math.sin(freq * angle);
                count++;
            }
        } else {
            const zx = pixelData.orbitX[index];
            const zy = pixelData.orbitY[index];
            const angle = Math.atan2(zy, zx);
            sum = Math.sin(freq * angle);
            count = 1;
        }
        
        const average = count > 0 ? (sum / count + 1) / 2 : 0.5;
        totalValue += average * weight;
        totalWeight += weight;
    }
    
    const value = totalWeight > 0 ? totalValue / totalWeight : 0.5;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Magnitude-modulated Stripe Average
 * 
 * Modulates stripe by orbit magnitude for depth effect.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function magnitudeModulatedStripe(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    const frequency = params.frequency || DEFAULT_FREQUENCY;
    const magnitudeWeight = params.magnitudeWeight || 0.5;
    
    let sum = 0;
    let count = 0;
    
    if (orbitHistory && orbitHistory.length > 0) {
        for (const z of orbitHistory) {
            const mag = Math.sqrt(z.x * z.x + z.y * z.y);
            const angle = Math.atan2(z.y, z.x);
            
            // Modulate by magnitude
            const stripe = Math.sin(frequency * angle);
            const modulated = stripe * (1 + magnitudeWeight * Math.log(mag + 1));
            
            sum += modulated;
            count++;
        }
    } else {
        const zx = pixelData.orbitX[index];
        const zy = pixelData.orbitY[index];
        const mag = Math.sqrt(zx * zx + zy * zy);
        const angle = Math.atan2(zy, zx);
        
        const stripe = Math.sin(frequency * angle);
        sum = stripe * (1 + magnitudeWeight * Math.log(mag + 1));
        count = 1;
    }
    
    // Normalize to [0, 1]
    const average = count > 0 ? sum / count : 0;
    const normalized = (average / (1 + magnitudeWeight * 3) + 1) / 2;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: Math.max(0, Math.min(1, (normalized + offset) * scale)),
        interior: false
    };
}

/**
 * Radial Stripe Average
 * 
 * Creates radial stripe patterns based on distance from origin.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function radialStripeAverage(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    const frequency = params.frequency || DEFAULT_FREQUENCY;
    
    let sum = 0;
    let count = 0;
    
    if (orbitHistory && orbitHistory.length > 0) {
        for (const z of orbitHistory) {
            const mag = Math.sqrt(z.x * z.x + z.y * z.y);
            sum += Math.sin(frequency * Math.log(mag + 1));
            count++;
        }
    } else {
        const zx = pixelData.orbitX[index];
        const zy = pixelData.orbitY[index];
        const mag = Math.sqrt(zx * zx + zy * zy);
        sum = Math.sin(frequency * Math.log(mag + 1));
        count = 1;
    }
    
    const average = count > 0 ? (sum / count + 1) / 2 : 0.5;
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (average + offset) * scale,
        interior: false
    };
}

/**
 * Combined Angular-Radial Stripe
 * 
 * Combines angular and radial stripe patterns.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function combinedStripe(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const angularFreq = params.angularFrequency || DEFAULT_FREQUENCY;
    const radialFreq = params.radialFrequency || 5;
    const angularWeight = params.angularWeight || 0.5;
    
    const orbitHistory = pixelData.orbitHistory?.[index];
    
    let angularSum = 0, radialSum = 0;
    let count = 0;
    
    if (orbitHistory && orbitHistory.length > 0) {
        for (const z of orbitHistory) {
            const mag = Math.sqrt(z.x * z.x + z.y * z.y);
            const angle = Math.atan2(z.y, z.x);
            
            angularSum += Math.sin(angularFreq * angle);
            radialSum += Math.sin(radialFreq * Math.log(mag + 1));
            count++;
        }
    } else {
        const zx = pixelData.orbitX[index];
        const zy = pixelData.orbitY[index];
        const mag = Math.sqrt(zx * zx + zy * zy);
        const angle = Math.atan2(zy, zx);
        
        angularSum = Math.sin(angularFreq * angle);
        radialSum = Math.sin(radialFreq * Math.log(mag + 1));
        count = 1;
    }
    
    const angular = count > 0 ? (angularSum / count + 1) / 2 : 0.5;
    const radial = count > 0 ? (radialSum / count + 1) / 2 : 0.5;
    
    const value = angular * angularWeight + radial * (1 - angularWeight);
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Smooth Stripe Bands
 * 
 * Creates discrete stripe bands with smooth transitions.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function smoothStripeBands(pixelData, index, params = {}) {
    const baseResult = stripeAverage(pixelData, index, {
        ...params,
        scale: 1,
        offset: 0
    });
    
    if (baseResult.interior) {
        return baseResult;
    }
    
    const bands = params.bands || 8;
    const smoothness = params.smoothness || 0.5;
    
    // Create bands
    const bandValue = baseResult.value * bands;
    const bandIndex = Math.floor(bandValue);
    const bandFrac = bandValue - bandIndex;
    
    // Smooth transition between bands
    let value;
    if (smoothness > 0) {
        // Smoothstep-like transition
        const t = bandFrac;
        const smooth = t * t * (3 - 2 * t);
        value = (bandIndex + smooth * smoothness + bandFrac * (1 - smoothness)) / bands;
    } else {
        value = bandIndex / bands;
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Iteration-Stripe Hybrid
 * 
 * Combines smooth iteration with stripe average.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @returns {Object} { value, interior }
 */
export function iterationStripeHybrid(pixelData, index, params = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Get stripe average
    const stripeResult = stripeAverage(pixelData, index, {
        ...params,
        scale: 1,
        offset: 0
    });
    
    // Get normalized iteration
    const iter = pixelData.iterations[index];
    const maxIter = params.maxIterations || 1000;
    const iterNorm = Math.min(1, iter / maxIter);
    
    // Blend
    const stripeWeight = params.stripeWeight || 0.5;
    const value = stripeResult.value * stripeWeight + iterNorm * (1 - stripeWeight);
    
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

export const STRIPE_ALGORITHMS = {
    'stripe-average': {
        fn: stripeAverage,
        name: 'Stripe Average',
        description: 'Basic stripe average density coloring',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100, label: 'Frequency' },
            iterationBlend: { type: 'number', default: 0.3, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'cosine-stripe': {
        fn: cosineStripeAverage,
        name: 'Cosine Stripe',
        description: 'Stripe average with cosine (90° phase shift)',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'weighted-stripe': {
        fn: weightedStripeAverage,
        name: 'Weighted Stripe',
        description: 'Iteration-weighted stripe average',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100 },
            weightPower: { type: 'number', default: 1, min: 0, max: 3 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'multi-frequency-stripe': {
        fn: multiFrequencyStripe,
        name: 'Multi-Frequency Stripe',
        description: 'Combined multiple stripe frequencies',
        params: {
            frequencies: { type: 'array', default: [5, 10, 20] },
            weights: { type: 'array', default: [1, 1, 1] },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'magnitude-stripe': {
        fn: magnitudeModulatedStripe,
        name: 'Magnitude Stripe',
        description: 'Magnitude-modulated stripe patterns',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100 },
            magnitudeWeight: { type: 'number', default: 0.5, min: 0, max: 2 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'radial-stripe': {
        fn: radialStripeAverage,
        name: 'Radial Stripe',
        description: 'Distance-based radial stripes',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        }
    },
    'combined-stripe': {
        fn: combinedStripe,
        name: 'Combined Stripe',
        description: 'Angular + radial stripe combination',
        params: {
            angularFrequency: { type: 'number', default: 10, min: 1, max: 100 },
            radialFrequency: { type: 'number', default: 5, min: 1, max: 50 },
            angularWeight: { type: 'number', default: 0.5, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'smooth-stripe-bands': {
        fn: smoothStripeBands,
        name: 'Smooth Stripe Bands',
        description: 'Discrete stripe bands with smooth edges',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100 },
            bands: { type: 'number', default: 8, min: 2, max: 50 },
            smoothness: { type: 'number', default: 0.5, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'iteration-stripe-hybrid': {
        fn: iterationStripeHybrid,
        name: 'Iteration-Stripe Hybrid',
        description: 'Blend of iteration and stripe coloring',
        params: {
            frequency: { type: 'number', default: 10, min: 1, max: 100 },
            stripeWeight: { type: 'number', default: 0.5, min: 0, max: 1 },
            maxIterations: { type: 'number', default: 1000, min: 100, max: 100000 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    stripeAverage,
    cosineStripeAverage,
    weightedStripeAverage,
    multiFrequencyStripe,
    magnitudeModulatedStripe,
    radialStripeAverage,
    combinedStripe,
    smoothStripeBands,
    iterationStripeHybrid,
    STRIPE_ALGORITHMS
};
