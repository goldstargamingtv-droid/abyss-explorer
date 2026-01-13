/**
 * ============================================================================
 * ABYSS EXPLORER - HISTOGRAM EQUALIZATION COLORING
 * ============================================================================
 * 
 * Histogram-based coloring algorithms that ensure optimal use of the
 * color palette by equalizing the distribution of iteration values.
 * 
 * The Problem:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  In many fractal images, iterations are NOT uniformly distributed:    │
 * │                                                                        │
 * │  Raw iteration histogram:                                             │
 * │    █████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (clustered)       │
 * │    ▲                                                                  │
 * │    Most pixels have low iterations                                    │
 * │                                                                        │
 * │  After equalization:                                                  │
 * │    ████████████████████████████████████████████████  (spread out)    │
 * │                                                                        │
 * │  Result: Better use of color palette, more visual detail              │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Algorithms:
 * 1. Standard histogram equalization
 * 2. Adaptive/local histogram equalization (CLAHE)
 * 3. Percentile-based stretching
 * 4. Logarithmic histogram equalization
 * 5. Multi-channel equalization
 * 
 * Two-Pass Process:
 * Pass 1: Collect histogram of all iteration values
 * Pass 2: Apply cumulative distribution function (CDF) mapping
 * 
 * @module coloring/histogram
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default number of histogram bins */
const DEFAULT_BINS = 256;

/** Maximum bins for high-precision histograms */
const MAX_BINS = 65536;

// ============================================================================
// HISTOGRAM COLLECTION
// ============================================================================

/**
 * Collect iteration histogram from pixel data
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} pixelCount - Total number of pixels
 * @param {Object} options - Collection options
 * @returns {Object} Histogram data
 */
export function collectHistogram(pixelData, pixelCount, options = {}) {
    const bins = options.bins || DEFAULT_BINS;
    const smoothed = options.smoothed !== false;
    
    // Find min/max iterations for escaped points
    let minIter = Infinity;
    let maxIter = -Infinity;
    let escapedCount = 0;
    
    for (let i = 0; i < pixelCount; i++) {
        if (pixelData.escaped[i]) {
            const iter = smoothed 
                ? pixelData.iterations[i] 
                : Math.floor(pixelData.iterations[i]);
            
            minIter = Math.min(minIter, iter);
            maxIter = Math.max(maxIter, iter);
            escapedCount++;
        }
    }
    
    if (escapedCount === 0 || minIter === maxIter) {
        return {
            bins: new Uint32Array(bins),
            minIter: 0,
            maxIter: 1,
            range: 1,
            escapedCount: 0,
            cdf: new Float32Array(bins)
        };
    }
    
    const range = maxIter - minIter;
    const histogram = new Uint32Array(bins);
    
    // Collect histogram
    for (let i = 0; i < pixelCount; i++) {
        if (pixelData.escaped[i]) {
            const iter = pixelData.iterations[i];
            const normalizedIter = (iter - minIter) / range;
            const binIndex = Math.min(bins - 1, Math.floor(normalizedIter * bins));
            histogram[binIndex]++;
        }
    }
    
    // Compute CDF (cumulative distribution function)
    const cdf = new Float32Array(bins);
    let cumulative = 0;
    
    for (let i = 0; i < bins; i++) {
        cumulative += histogram[i];
        cdf[i] = cumulative / escapedCount;
    }
    
    return {
        bins: histogram,
        minIter,
        maxIter,
        range,
        escapedCount,
        cdf
    };
}

/**
 * Collect logarithmic histogram (better for deep zooms)
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} pixelCount - Total number of pixels
 * @param {Object} options - Collection options
 * @returns {Object} Histogram data
 */
export function collectLogHistogram(pixelData, pixelCount, options = {}) {
    const bins = options.bins || DEFAULT_BINS;
    
    let minIter = Infinity;
    let maxIter = -Infinity;
    let escapedCount = 0;
    
    // First pass: find range
    for (let i = 0; i < pixelCount; i++) {
        if (pixelData.escaped[i]) {
            const iter = Math.log(pixelData.iterations[i] + 1);
            minIter = Math.min(minIter, iter);
            maxIter = Math.max(maxIter, iter);
            escapedCount++;
        }
    }
    
    if (escapedCount === 0 || minIter === maxIter) {
        return {
            bins: new Uint32Array(bins),
            minIter: 0,
            maxIter: 1,
            range: 1,
            escapedCount: 0,
            cdf: new Float32Array(bins),
            isLog: true
        };
    }
    
    const range = maxIter - minIter;
    const histogram = new Uint32Array(bins);
    
    // Second pass: collect histogram
    for (let i = 0; i < pixelCount; i++) {
        if (pixelData.escaped[i]) {
            const iter = Math.log(pixelData.iterations[i] + 1);
            const normalizedIter = (iter - minIter) / range;
            const binIndex = Math.min(bins - 1, Math.floor(normalizedIter * bins));
            histogram[binIndex]++;
        }
    }
    
    // Compute CDF
    const cdf = new Float32Array(bins);
    let cumulative = 0;
    
    for (let i = 0; i < bins; i++) {
        cumulative += histogram[i];
        cdf[i] = cumulative / escapedCount;
    }
    
    return {
        bins: histogram,
        minIter,
        maxIter,
        range,
        escapedCount,
        cdf,
        isLog: true
    };
}

// ============================================================================
// HISTOGRAM EQUALIZATION ALGORITHMS
// ============================================================================

/**
 * Standard histogram equalization
 * 
 * Maps iteration values through the CDF to achieve
 * uniform distribution of color values.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function histogramEqualization(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Get or compute histogram
    let histogram = context.histogram;
    if (!histogram) {
        histogram = collectHistogram(pixelData, context.width * context.height, {
            bins: params.bins || DEFAULT_BINS
        });
        context.histogram = histogram;
    }
    
    const iter = pixelData.iterations[index];
    const { minIter, range, cdf } = histogram;
    const bins = cdf.length;
    
    // Map through CDF
    const normalizedIter = (iter - minIter) / range;
    const binIndex = Math.min(bins - 1, Math.max(0, Math.floor(normalizedIter * bins)));
    
    let value = cdf[binIndex];
    
    // Apply transformations
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    const invert = params.invert || false;
    
    value = (value + offset) * scale;
    
    if (invert) {
        value = 1 - value;
    }
    
    return {
        value: Math.max(0, Math.min(1, value)),
        interior: false
    };
}

/**
 * Logarithmic histogram equalization
 * 
 * Better for images with high dynamic range in iterations.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function logHistogramEqualization(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Get or compute log histogram
    let histogram = context.logHistogram;
    if (!histogram) {
        histogram = collectLogHistogram(pixelData, context.width * context.height, {
            bins: params.bins || DEFAULT_BINS
        });
        context.logHistogram = histogram;
    }
    
    const iter = Math.log(pixelData.iterations[index] + 1);
    const { minIter, range, cdf } = histogram;
    const bins = cdf.length;
    
    const normalizedIter = (iter - minIter) / range;
    const binIndex = Math.min(bins - 1, Math.max(0, Math.floor(normalizedIter * bins)));
    
    let value = cdf[binIndex];
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Percentile-based stretching
 * 
 * Stretches iteration values between specified percentiles
 * to clip outliers and improve contrast.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function percentileStretch(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Get or compute histogram
    let histogram = context.histogram;
    if (!histogram) {
        histogram = collectHistogram(pixelData, context.width * context.height);
        context.histogram = histogram;
    }
    
    // Find percentile values
    const lowPercentile = params.lowPercentile || 0.02;
    const highPercentile = params.highPercentile || 0.98;
    
    const { cdf, minIter, range } = histogram;
    const bins = cdf.length;
    
    // Find bin indices for percentiles
    let lowBin = 0, highBin = bins - 1;
    
    for (let i = 0; i < bins; i++) {
        if (cdf[i] >= lowPercentile) {
            lowBin = i;
            break;
        }
    }
    
    for (let i = bins - 1; i >= 0; i--) {
        if (cdf[i] <= highPercentile) {
            highBin = i;
            break;
        }
    }
    
    // Map iteration through percentile range
    const iter = pixelData.iterations[index];
    const normalizedIter = (iter - minIter) / range;
    const binIndex = Math.floor(normalizedIter * bins);
    
    let value;
    if (binIndex <= lowBin) {
        value = 0;
    } else if (binIndex >= highBin) {
        value = 1;
    } else {
        value = (binIndex - lowBin) / (highBin - lowBin);
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (value + offset) * scale,
        interior: false
    };
}

/**
 * Adaptive histogram equalization (simplified CLAHE)
 * 
 * Performs local histogram equalization in regions
 * for enhanced local contrast.
 * 
 * Note: This is a simplified version that uses global
 * histogram with local blending.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function adaptiveEqualization(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const width = context.width || 800;
    const height = context.height || 600;
    const x = index % width;
    const y = Math.floor(index / width);
    
    // Get global histogram equalized value
    const globalResult = histogramEqualization(pixelData, index, params, context);
    
    // Get local statistics
    const windowSize = params.windowSize || 32;
    const clipLimit = params.clipLimit || 2.0;
    
    let localSum = 0;
    let localCount = 0;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let dy = -halfWindow; dy <= halfWindow; dy++) {
        for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const ni = ny * width + nx;
                if (pixelData.escaped[ni]) {
                    localSum += pixelData.iterations[ni];
                    localCount++;
                }
            }
        }
    }
    
    if (localCount === 0) {
        return globalResult;
    }
    
    const localMean = localSum / localCount;
    const currentIter = pixelData.iterations[index];
    
    // Blend global and local contrast
    const blendFactor = params.blendFactor || 0.5;
    const localNorm = currentIter / (localMean + 1);
    const localValue = Math.min(1, localNorm / clipLimit);
    
    const value = globalResult.value * (1 - blendFactor) + localValue * blendFactor;
    
    return {
        value: Math.max(0, Math.min(1, value)),
        interior: false
    };
}

/**
 * Gamma-corrected histogram equalization
 * 
 * Applies gamma correction after equalization for
 * perceptually uniform output.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function gammaEqualization(pixelData, index, params = {}, context = {}) {
    const result = histogramEqualization(pixelData, index, params, context);
    
    if (result.interior) {
        return result;
    }
    
    const gamma = params.gamma || 2.2;
    const value = Math.pow(result.value, 1 / gamma);
    
    return {
        value,
        interior: false
    };
}

/**
 * Multi-pass histogram equalization
 * 
 * Applies equalization multiple times for more
 * aggressive normalization.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function multiPassEqualization(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    const passes = params.passes || 2;
    const strength = params.strength || 0.5;
    
    // First pass: standard equalization
    let result = histogramEqualization(pixelData, index, { ...params, scale: 1, offset: 0 }, context);
    
    // Additional passes blend with previous
    for (let pass = 1; pass < passes; pass++) {
        const prevValue = result.value;
        
        // Simulate re-equalization by applying power function
        const newValue = Math.pow(prevValue, 1 / (1 + strength));
        
        result.value = prevValue * (1 - strength / passes) + newValue * (strength / passes);
    }
    
    const scale = params.scale || 1;
    const offset = params.offset || 0;
    
    return {
        value: (result.value + offset) * scale,
        interior: false
    };
}

/**
 * Weighted histogram equalization
 * 
 * Uses distance or other auxiliary data to weight
 * the histogram contribution.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function weightedEqualization(pixelData, index, params = {}, context = {}) {
    const escaped = pixelData.escaped[index];
    
    if (!escaped) {
        return { value: 0, interior: true };
    }
    
    // Get base equalized value
    const baseResult = histogramEqualization(pixelData, index, params, context);
    
    // Apply distance-based weighting
    const distance = pixelData.distances?.[index] || 0;
    const distanceWeight = params.distanceWeight || 0.3;
    
    // Near-boundary points get boosted
    const distanceFactor = 1 + distanceWeight * Math.exp(-distance * 10);
    
    const value = Math.min(1, baseResult.value * distanceFactor);
    
    return {
        value,
        interior: false
    };
}

/**
 * Sigmoid histogram mapping
 * 
 * Applies S-curve (sigmoid) to equalized values
 * for enhanced midtone contrast.
 * 
 * @param {Object} pixelData - Pixel data from renderer
 * @param {number} index - Pixel index
 * @param {Object} params - Algorithm parameters
 * @param {Object} context - Context with histogram data
 * @returns {Object} { value, interior }
 */
export function sigmoidEqualization(pixelData, index, params = {}, context = {}) {
    const result = histogramEqualization(pixelData, index, params, context);
    
    if (result.interior) {
        return result;
    }
    
    const contrast = params.contrast || 5;
    const midpoint = params.midpoint || 0.5;
    
    // Sigmoid function: 1 / (1 + exp(-contrast * (x - midpoint)))
    const x = result.value;
    const sigmoid = 1 / (1 + Math.exp(-contrast * (x - midpoint)));
    
    // Normalize to [0, 1]
    const low = 1 / (1 + Math.exp(-contrast * (0 - midpoint)));
    const high = 1 / (1 + Math.exp(-contrast * (1 - midpoint)));
    const value = (sigmoid - low) / (high - low);
    
    return {
        value,
        interior: false
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Pre-compute histogram for a render
 * Should be called once before coloring
 * 
 * @param {Object} pixelData - Pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Object} options - Options
 * @returns {Object} Context with histogram data
 */
export function precomputeHistogram(pixelData, width, height, options = {}) {
    const context = {
        width,
        height
    };
    
    context.histogram = collectHistogram(pixelData, width * height, options);
    
    if (options.computeLog) {
        context.logHistogram = collectLogHistogram(pixelData, width * height, options);
    }
    
    return context;
}

// ============================================================================
// ALGORITHM COLLECTION
// ============================================================================

export const HISTOGRAM_ALGORITHMS = {
    'histogram-equalization': {
        fn: histogramEqualization,
        name: 'Histogram Equalization',
        description: 'Standard histogram equalization for uniform distribution',
        params: {
            bins: { type: 'number', default: 256, min: 16, max: 65536 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 },
            invert: { type: 'boolean', default: false }
        },
        requiresPrecompute: true
    },
    'log-histogram': {
        fn: logHistogramEqualization,
        name: 'Logarithmic Histogram',
        description: 'Log-scale equalization for high dynamic range',
        params: {
            bins: { type: 'number', default: 256, min: 16, max: 65536 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        },
        requiresPrecompute: true
    },
    'percentile-stretch': {
        fn: percentileStretch,
        name: 'Percentile Stretch',
        description: 'Stretch with outlier clipping',
        params: {
            lowPercentile: { type: 'number', default: 0.02, min: 0, max: 0.5 },
            highPercentile: { type: 'number', default: 0.98, min: 0.5, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 },
            offset: { type: 'number', default: 0, min: -1, max: 1 }
        },
        requiresPrecompute: true
    },
    'adaptive-equalization': {
        fn: adaptiveEqualization,
        name: 'Adaptive Equalization',
        description: 'Local contrast enhancement (CLAHE-like)',
        params: {
            windowSize: { type: 'number', default: 32, min: 8, max: 128 },
            clipLimit: { type: 'number', default: 2.0, min: 0.5, max: 10 },
            blendFactor: { type: 'number', default: 0.5, min: 0, max: 1 }
        },
        requiresPrecompute: true
    },
    'gamma-equalization': {
        fn: gammaEqualization,
        name: 'Gamma Equalization',
        description: 'Perceptually uniform equalization',
        params: {
            gamma: { type: 'number', default: 2.2, min: 0.5, max: 4 },
            bins: { type: 'number', default: 256, min: 16, max: 65536 }
        },
        requiresPrecompute: true
    },
    'multi-pass-equalization': {
        fn: multiPassEqualization,
        name: 'Multi-Pass Equalization',
        description: 'Aggressive multi-pass normalization',
        params: {
            passes: { type: 'number', default: 2, min: 1, max: 5 },
            strength: { type: 'number', default: 0.5, min: 0, max: 1 },
            scale: { type: 'number', default: 1, min: 0.1, max: 10 }
        },
        requiresPrecompute: true
    },
    'weighted-equalization': {
        fn: weightedEqualization,
        name: 'Weighted Equalization',
        description: 'Distance-weighted equalization',
        params: {
            distanceWeight: { type: 'number', default: 0.3, min: 0, max: 1 },
            bins: { type: 'number', default: 256, min: 16, max: 65536 }
        },
        requiresPrecompute: true
    },
    'sigmoid-equalization': {
        fn: sigmoidEqualization,
        name: 'Sigmoid Equalization',
        description: 'S-curve contrast enhancement',
        params: {
            contrast: { type: 'number', default: 5, min: 1, max: 20 },
            midpoint: { type: 'number', default: 0.5, min: 0, max: 1 },
            bins: { type: 'number', default: 256, min: 16, max: 65536 }
        },
        requiresPrecompute: true
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    collectHistogram,
    collectLogHistogram,
    precomputeHistogram,
    histogramEqualization,
    logHistogramEqualization,
    percentileStretch,
    adaptiveEqualization,
    gammaEqualization,
    multiPassEqualization,
    weightedEqualization,
    sigmoidEqualization,
    HISTOGRAM_ALGORITHMS
};
