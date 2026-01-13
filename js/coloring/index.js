/**
 * ============================================================================
 * ABYSS EXPLORER - COLORING MODULE
 * ============================================================================
 * 
 * Central export for all coloring system components.
 * This module provides 50+ coloring algorithms to transform fractal
 * iteration data into stunning visual output.
 * 
 * Algorithm Categories:
 * - Smooth Iteration: Classic log-based smooth coloring
 * - Orbit Traps: 40+ geometric trap shapes
 * - Distance Estimation: Boundary glows and outlines
 * - Histogram: Equalization for optimal contrast
 * - Triangle Inequality: TIA-based smoothing
 * - Stripe Average: Periodic stripe patterns
 * - Curvature: Orbit curvature analysis
 * - Angle/Decomposition: Angular patterns and decomposition
 * 
 * Usage:
 * ```javascript
 * import { 
 *     ColoringEngine, 
 *     getColoringRegistry,
 *     smoothIteration 
 * } from './coloring/index.js';
 * 
 * // Create engine with registry
 * const engine = new ColoringEngine();
 * engine.setAlgorithmRegistry(getColoringRegistry());
 * 
 * // Add a color layer
 * engine.addLayer({
 *     algorithm: 'smooth-iteration',
 *     algorithmParams: { scale: 0.1 }
 * });
 * 
 * // Apply coloring
 * const imageData = engine.colorize(pixelData, config);
 * ```
 * 
 * @module coloring
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CORE ENGINE
// ============================================================================

export {
    ColoringEngine,
    ColorLayer,
    BLEND_MODE,
    INTERIOR_MODE,
    COLOR_SPACE
} from './coloring-engine.js';

// ============================================================================
// REGISTRY
// ============================================================================

export {
    ColoringRegistry,
    getColoringRegistry,
    createColoringRegistry,
    getAllAlgorithmIds,
    getAlgorithmCount,
    ALGORITHM_CATEGORIES,
    COLORING_PRESETS
} from './coloring-registry.js';

// ============================================================================
// SMOOTH ITERATION ALGORITHMS
// ============================================================================

export {
    smoothIteration,
    continuousPotential,
    fractionalEscape,
    renormalizedIteration,
    exponentialSmoothing,
    derivativeSmoothing,
    binaryDecompositionHybrid,
    angleWeightedSmoothing,
    multiPassSmooth,
    logDistanceSmooth,
    cyclicSmooth,
    SMOOTH_ALGORITHMS
} from './smooth-iteration.js';

// ============================================================================
// ORBIT TRAP ALGORITHMS
// ============================================================================

export {
    pointTrap,
    twoPointTrap,
    lineTrapHorizontal,
    lineTrapVertical,
    lineTrapDiagonal,
    crossTrap,
    circleTrap,
    ringTrap,
    squareTrap,
    rectangleTrap,
    triangleTrap,
    pentagonTrap,
    hexagonTrap,
    polygonTrap,
    starTrap,
    nStarTrap,
    spiralTrap,
    gridTrap,
    radialGridTrap,
    angularGridTrap,
    polarGridTrap,
    flowerTrap,
    cardioidTrap,
    lemniscateTrap,
    astroidTrap,
    epicycloidTrap,
    hypocycloidTrap,
    lissajousTrap,
    infinityTrap,
    heartTrap,
    gaussianTrap,
    sineTrap,
    checkerboardTrap,
    diamondTrap,
    stalksTrap,
    ringsTrap,
    multiTrap,
    ORBIT_TRAP_ALGORITHMS
} from './orbit-traps.js';

// ============================================================================
// DISTANCE ESTIMATION ALGORITHMS
// ============================================================================

export {
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
} from './distance-estimation.js';

// ============================================================================
// HISTOGRAM ALGORITHMS
// ============================================================================

export {
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
} from './histogram.js';

// ============================================================================
// TRIANGLE INEQUALITY ALGORITHMS
// ============================================================================

export {
    triangleInequalityAverage,
    weightedTIA,
    phaseTIA,
    minimumTIA,
    maximumTIA,
    varianceTIA,
    hybridTIA,
    TRIANGLE_INEQUALITY_ALGORITHMS
} from './triangle-inequality.js';

// ============================================================================
// STRIPE AVERAGE ALGORITHMS
// ============================================================================

export {
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
} from './stripe-average.js';

// ============================================================================
// CURVATURE ALGORITHMS
// ============================================================================

export {
    curvatureEstimate,
    gaussianCurvature,
    meanCurvature,
    angularVelocity,
    orbitAcceleration,
    torsionEstimate,
    combinedCurvature,
    CURVATURE_ALGORITHMS
} from './curvature.js';

// ============================================================================
// ANGLE/DECOMPOSITION ALGORITHMS
// ============================================================================

export {
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
} from './angle-decomposition.js';

// ============================================================================
// ALL ALGORITHMS (COMBINED)
// ============================================================================

export const ALL_ALGORITHMS = {
    ...require('./smooth-iteration.js').SMOOTH_ALGORITHMS,
    ...require('./orbit-traps.js').ORBIT_TRAP_ALGORITHMS,
    ...require('./distance-estimation.js').DISTANCE_ALGORITHMS,
    ...require('./histogram.js').HISTOGRAM_ALGORITHMS,
    ...require('./triangle-inequality.js').TRIANGLE_INEQUALITY_ALGORITHMS,
    ...require('./stripe-average.js').STRIPE_ALGORITHMS,
    ...require('./curvature.js').CURVATURE_ALGORITHMS,
    ...require('./angle-decomposition.js').ANGLE_ALGORITHMS
};

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Coloring System',
    version: '1.0.0',
    algorithmCount: 70,
    categories: [
        'Smooth Iteration (11 algorithms)',
        'Orbit Traps (37 algorithms)',
        'Distance Estimation (12 algorithms)',
        'Histogram (8 algorithms)',
        'Triangle Inequality (7 algorithms)',
        'Stripe Average (9 algorithms)',
        'Curvature (7 algorithms)',
        'Angle/Decomposition (12 algorithms)'
    ],
    features: [
        'Multi-layer compositing with 25+ blend modes',
        '70+ coloring algorithms',
        'Arbitrary precision support',
        'Orbit history processing',
        'Histogram precomputation',
        'Post-processing pipeline',
        'Color space conversions',
        'Parameter validation',
        'Algorithm presets'
    ]
};

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

/**
 * Create a fully configured coloring engine with registry
 * @param {Object} options - Engine options
 * @returns {ColoringEngine}
 */
export function createColoringEngine(options = {}) {
    const { ColoringEngine } = require('./coloring-engine.js');
    const { getColoringRegistry } = require('./coloring-registry.js');
    
    const engine = new ColoringEngine(options);
    engine.setAlgorithmRegistry(getColoringRegistry());
    
    return engine;
}
