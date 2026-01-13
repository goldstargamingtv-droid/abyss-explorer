/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ABYSS EXPLORER - FRACTAL BASE CLASS                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Abstract base class defining the interface for all 2D fractal types          ║
 * ║                                                                                ║
 * ║  Design Philosophy:                                                            ║
 * ║  ═══════════════════                                                           ║
 * ║  Each fractal type is a class that extends FractalBase and implements:        ║
 * ║  - iterate(z, c, maxIter): Core iteration logic returning escape data         ║
 * ║  - getDefaultParams(): Default parameter values                               ║
 * ║  - getName()/getId(): Display name and unique identifier                      ║
 * ║                                                                                ║
 * ║  Optional advanced features (override if supported):                          ║
 * ║  - supportsPerturbation(): Whether perturbation theory is available           ║
 * ║  - supportsSeriesApproximation(): Whether series skipping is available        ║
 * ║  - computeReferenceOrbit(): High-precision reference for perturbation         ║
 * ║  - iteratePerturbation(): Delta iteration for perturbation theory             ║
 * ║                                                                                ║
 * ║  The base class provides:                                                      ║
 * ║  - Common parameter handling (maxIterations, bailout, power)                  ║
 * ║  - Smooth iteration count calculation for continuous coloring                 ║
 * ║  - Orbit trap support and distance estimation                                 ║
 * ║  - Precision mode switching (double → arbitrary)                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, ComplexPool, CONSTANTS } from '../math/complex.js';
import { BigComplex, PrecisionManager } from '../math/arbitrary-precision.js';
import { ReferenceOrbit, PerturbationIterator } from '../math/perturbation.js';
import { SeriesApproximationEngine, HybridIterator } from '../math/series-approximation.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// ITERATION RESULT CLASS
// =============================================================================

/**
 * Result of a fractal iteration
 * 
 * Contains all data needed for coloring and analysis.
 * 
 * @class IterationResult
 */
export class IterationResult {
    constructor() {
        /** @type {number} Integer iteration count */
        this.iterations = 0;
        
        /** @type {number} Smooth iteration count (for continuous coloring) */
        this.smooth = 0;
        
        /** @type {boolean} Whether point escaped */
        this.escaped = true;
        
        /** @type {Complex} Final z value */
        this.finalZ = new Complex(0, 0);
        
        /** @type {number} Final |z|² */
        this.finalMagnitude2 = 0;
        
        /** @type {number} Distance estimate (for distance coloring) */
        this.distance = 0;
        
        /** @type {number} Minimum orbit distance (for orbit traps) */
        this.orbitTrapDistance = Infinity;
        
        /** @type {Complex} Closest orbit point (for orbit traps) */
        this.orbitTrapPoint = null;
        
        /** @type {number} Derivative magnitude (for distance estimation) */
        this.derivative = 0;
        
        /** @type {number} Average stripe value (for stripe average coloring) */
        this.stripeAverage = 0;
        
        /** @type {number} Curvature estimate */
        this.curvature = 0;
        
        /** @type {number} Angle of final z (for angle coloring) */
        this.angle = 0;
        
        /** @type {boolean} Whether this was computed via perturbation */
        this.perturbationUsed = false;
        
        /** @type {number} Iterations skipped via series approximation */
        this.skippedIterations = 0;
        
        /** @type {boolean} Whether a glitch was detected */
        this.glitched = false;
        
        /** @type {number} Root index (for Newton fractals) */
        this.rootIndex = -1;
    }

    /**
     * Reset to default values (for reuse)
     * @returns {IterationResult} this
     */
    reset() {
        this.iterations = 0;
        this.smooth = 0;
        this.escaped = true;
        this.finalZ.set(0, 0);
        this.finalMagnitude2 = 0;
        this.distance = 0;
        this.orbitTrapDistance = Infinity;
        this.orbitTrapPoint = null;
        this.derivative = 0;
        this.stripeAverage = 0;
        this.curvature = 0;
        this.angle = 0;
        this.perturbationUsed = false;
        this.skippedIterations = 0;
        this.glitched = false;
        this.rootIndex = -1;
        return this;
    }

    /**
     * Clone this result
     * @returns {IterationResult}
     */
    clone() {
        const copy = new IterationResult();
        copy.iterations = this.iterations;
        copy.smooth = this.smooth;
        copy.escaped = this.escaped;
        copy.finalZ = this.finalZ.clone();
        copy.finalMagnitude2 = this.finalMagnitude2;
        copy.distance = this.distance;
        copy.orbitTrapDistance = this.orbitTrapDistance;
        copy.orbitTrapPoint = this.orbitTrapPoint?.clone() || null;
        copy.derivative = this.derivative;
        copy.stripeAverage = this.stripeAverage;
        copy.curvature = this.curvature;
        copy.angle = this.angle;
        copy.perturbationUsed = this.perturbationUsed;
        copy.skippedIterations = this.skippedIterations;
        copy.glitched = this.glitched;
        copy.rootIndex = this.rootIndex;
        return copy;
    }
}

// =============================================================================
// ITERATION RESULT POOL
// =============================================================================

/**
 * Object pool for IterationResult to reduce GC pressure
 */
export class IterationResultPool {
    constructor(initialSize = 100) {
        this._pool = [];
        for (let i = 0; i < initialSize; i++) {
            this._pool.push(new IterationResult());
        }
    }

    acquire() {
        return this._pool.length > 0 
            ? this._pool.pop().reset() 
            : new IterationResult();
    }

    release(result) {
        this._pool.push(result);
    }
}

// =============================================================================
// FRACTAL PARAMETERS CLASS
// =============================================================================

/**
 * Parameters for fractal iteration
 * 
 * @class FractalParams
 */
export class FractalParams {
    constructor(options = {}) {
        /** @type {number} Maximum iterations */
        this.maxIterations = options.maxIterations ?? 500;
        
        /** @type {number} Escape radius */
        this.bailout = options.bailout ?? 2;
        
        /** @type {number} Bailout squared (cached) */
        this.bailoutSquared = this.bailout * this.bailout;
        
        /** @type {number} Power exponent (for z^n + c) */
        this.power = options.power ?? 2;
        
        /** @type {boolean} Enable smooth coloring */
        this.smoothColoring = options.smoothColoring ?? true;
        
        /** @type {boolean} Compute distance estimate */
        this.distanceEstimate = options.distanceEstimate ?? false;
        
        /** @type {boolean} Enable orbit trap */
        this.orbitTrap = options.orbitTrap ?? false;
        
        /** @type {string} Orbit trap type ('point', 'line', 'cross', 'circle') */
        this.orbitTrapType = options.orbitTrapType ?? 'point';
        
        /** @type {Complex} Orbit trap center */
        this.orbitTrapCenter = options.orbitTrapCenter ?? new Complex(0, 0);
        
        /** @type {number} Orbit trap size */
        this.orbitTrapSize = options.orbitTrapSize ?? 0.5;
        
        /** @type {boolean} Compute stripe average */
        this.stripeAverage = options.stripeAverage ?? false;
        
        /** @type {number} Stripe density */
        this.stripeDensity = options.stripeDensity ?? 1;
        
        /** @type {boolean} Interior detection mode */
        this.interiorChecking = options.interiorChecking ?? false;
        
        /** @type {'double'|'arbitrary'|'perturbation'} Precision mode */
        this.precisionMode = options.precisionMode ?? 'double';
        
        /** @type {number} Arbitrary precision digits */
        this.precision = options.precision ?? 50;
        
        /** @type {Complex} Julia seed (for Julia sets) */
        this.juliaC = options.juliaC ?? null;
        
        /** @type {boolean} Julia mode enabled */
        this.juliaMode = options.juliaMode ?? false;
        
        // Additional parameters for specific fractals
        /** @type {Object} Extra parameters */
        this.extra = options.extra ?? {};
    }

    /**
     * Clone parameters
     * @returns {FractalParams}
     */
    clone() {
        const copy = new FractalParams({
            maxIterations: this.maxIterations,
            bailout: this.bailout,
            power: this.power,
            smoothColoring: this.smoothColoring,
            distanceEstimate: this.distanceEstimate,
            orbitTrap: this.orbitTrap,
            orbitTrapType: this.orbitTrapType,
            orbitTrapCenter: this.orbitTrapCenter?.clone(),
            orbitTrapSize: this.orbitTrapSize,
            stripeAverage: this.stripeAverage,
            stripeDensity: this.stripeDensity,
            interiorChecking: this.interiorChecking,
            precisionMode: this.precisionMode,
            precision: this.precision,
            juliaC: this.juliaC?.clone(),
            juliaMode: this.juliaMode,
            extra: { ...this.extra }
        });
        return copy;
    }

    /**
     * Update bailout (recalculates squared)
     * @param {number} value
     */
    setBailout(value) {
        this.bailout = value;
        this.bailoutSquared = value * value;
    }
}

// =============================================================================
// FRACTAL BASE CLASS
// =============================================================================

/**
 * Abstract Base Class for 2D Fractals
 * 
 * All fractal types extend this class and implement the core methods.
 * 
 * @abstract
 * @class FractalBase
 */
export class FractalBase {
    /**
     * Create fractal instance
     * @param {FractalParams} [params]
     */
    constructor(params = null) {
        /** @type {FractalParams} */
        this.params = params || new FractalParams(this.getDefaultParams());
        
        /** @type {Logger} */
        this.logger = new Logger(this.getName());
        
        /** @type {ComplexPool} */
        this.complexPool = new ComplexPool(100);
        
        /** @type {IterationResultPool} */
        this.resultPool = new IterationResultPool(100);
        
        // Perturbation support (lazy initialized)
        /** @type {ReferenceOrbit|null} */
        this._referenceOrbit = null;
        
        /** @type {PerturbationIterator|null} */
        this._perturbationIterator = null;
        
        /** @type {HybridIterator|null} */
        this._hybridIterator = null;
        
        /** @type {BigComplex|null} */
        this._referenceCenter = null;
    }

    // =========================================================================
    // ABSTRACT METHODS (must be implemented by subclasses)
    // =========================================================================

    /**
     * Get unique identifier for this fractal type
     * @abstract
     * @returns {string}
     */
    getId() {
        throw new Error('getId() must be implemented');
    }

    /**
     * Get display name
     * @abstract
     * @returns {string}
     */
    getName() {
        throw new Error('getName() must be implemented');
    }

    /**
     * Get description
     * @returns {string}
     */
    getDescription() {
        return '';
    }

    /**
     * Get default parameters
     * @returns {Object}
     */
    getDefaultParams() {
        return {
            maxIterations: 500,
            bailout: 2,
            power: 2
        };
    }

    /**
     * Get default view (center and zoom)
     * @returns {{centerX: number, centerY: number, zoom: number}}
     */
    getDefaultView() {
        return {
            centerX: -0.5,
            centerY: 0,
            zoom: 1
        };
    }

    /**
     * Get the iteration formula as LaTeX string
     * @returns {string}
     */
    getFormula() {
        return 'z_{n+1} = f(z_n, c)';
    }

    /**
     * Core iteration function
     * 
     * Iterates the fractal formula starting from z0 with parameter c.
     * 
     * @abstract
     * @param {Complex} z0 - Starting point
     * @param {Complex} c - Parameter c
     * @param {FractalParams} params - Iteration parameters
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        throw new Error('iterate() must be implemented');
    }

    // =========================================================================
    // CAPABILITY QUERIES
    // =========================================================================

    /**
     * Whether this fractal supports perturbation theory
     * @returns {boolean}
     */
    supportsPerturbation() {
        return false;
    }

    /**
     * Whether this fractal supports series approximation
     * @returns {boolean}
     */
    supportsSeriesApproximation() {
        return false;
    }

    /**
     * Whether this fractal supports arbitrary precision
     * @returns {boolean}
     */
    supportsArbitraryPrecision() {
        return false;
    }

    /**
     * Whether this fractal has interior (non-escaping) points
     * @returns {boolean}
     */
    hasInterior() {
        return true;
    }

    /**
     * Get available extra parameters
     * @returns {Array<{name: string, type: string, default: any, min?: number, max?: number, description: string}>}
     */
    getExtraParams() {
        return [];
    }

    // =========================================================================
    // SMOOTH ITERATION CALCULATION
    // =========================================================================

    /**
     * Calculate smooth iteration count
     * 
     * For escape-time fractals, the smooth iteration formula is:
     *   n_smooth = n + 1 - log₂(log₂|z_n|)
     * 
     * This gives a continuous value instead of discrete integers,
     * enabling smooth gradient coloring.
     * 
     * For power p fractals (z^p + c):
     *   n_smooth = n + 1 - log_p(log|z_n| / log(bailout))
     * 
     * @param {number} iterations - Integer iteration count
     * @param {Complex} finalZ - Final z value
     * @param {number} [power=2] - Iteration power
     * @param {number} [bailout=2] - Escape radius
     * @returns {number} Smooth iteration count
     */
    calculateSmoothIterations(iterations, finalZ, power = 2, bailout = 2) {
        if (iterations === 0) return 0;
        
        const mag2 = finalZ.magnitudeSquared;
        if (mag2 <= bailout * bailout) {
            // Didn't escape - return iteration count
            return iterations;
        }
        
        // Smooth formula: n + 1 - log_p(log|z|/log(bailout))
        const logMag = Math.log(mag2) / 2; // log|z|
        const logBailout = Math.log(bailout);
        const logRatio = Math.log(logMag / logBailout);
        const logPower = Math.log(power);
        
        return iterations + 1 - logRatio / logPower;
    }

    /**
     * Alternative smooth formula using normalized iteration
     * 
     * n_smooth = n + 1 - log₂(log₂|z_n|) / log₂(log₂(bailout^power))
     * 
     * This normalizes based on bailout and power.
     * 
     * @param {number} iterations
     * @param {number} mag2 - |z|² final value
     * @param {number} [power=2]
     * @returns {number}
     */
    calculateNormalizedSmooth(iterations, mag2, power = 2) {
        if (mag2 <= 4) return iterations;
        
        // Use large bailout for better smoothing
        const logZn = Math.log(mag2) / 2;
        const nu = Math.log(logZn / Math.LN2) / Math.log(power);
        
        return iterations + 1 - nu;
    }

    // =========================================================================
    // DISTANCE ESTIMATION
    // =========================================================================

    /**
     * Calculate distance estimate for the Mandelbrot set
     * 
     * The distance estimate formula uses the derivative of the orbit:
     *   d = |z| · log|z| / |z'|
     * 
     * where z' is the derivative dz/dc computed alongside the orbit.
     * 
     * @param {Complex} z - Final z
     * @param {Complex} dz - Final derivative
     * @returns {number} Estimated distance to boundary
     */
    calculateDistanceEstimate(z, dz) {
        const mag = z.magnitude;
        const dzMag = dz.magnitude;
        
        if (dzMag === 0) return 0;
        
        return (mag * Math.log(mag)) / dzMag;
    }

    // =========================================================================
    // ORBIT TRAP HELPERS
    // =========================================================================

    /**
     * Calculate orbit trap distance
     * 
     * @param {Complex} z - Current z
     * @param {string} trapType - Trap type
     * @param {Complex} trapCenter - Trap center
     * @param {number} trapSize - Trap size
     * @returns {number} Distance to trap
     */
    calculateOrbitTrapDistance(z, trapType, trapCenter, trapSize) {
        switch (trapType) {
            case 'point':
                // Distance to a point
                return z.sub(trapCenter).magnitude;
                
            case 'line':
                // Distance to horizontal line at trapCenter.im
                return Math.abs(z.im - trapCenter.im);
                
            case 'cross':
                // Distance to cross (horizontal + vertical lines)
                return Math.min(
                    Math.abs(z.re - trapCenter.re),
                    Math.abs(z.im - trapCenter.im)
                );
                
            case 'circle':
                // Distance to circle of radius trapSize
                return Math.abs(z.sub(trapCenter).magnitude - trapSize);
                
            case 'square':
                // Distance to square
                const dx = Math.abs(z.re - trapCenter.re) - trapSize;
                const dy = Math.abs(z.im - trapCenter.im) - trapSize;
                return Math.max(dx, dy);
                
            case 'ring':
                // Distance to ring (annulus)
                const r = z.sub(trapCenter).magnitude;
                return Math.abs(r - trapSize);
                
            default:
                return z.sub(trapCenter).magnitude;
        }
    }

    // =========================================================================
    // PERTURBATION METHODS (override in subclasses that support it)
    // =========================================================================

    /**
     * Initialize perturbation with reference point
     * 
     * @param {string} centerX - Center X as decimal string
     * @param {string} centerY - Center Y as decimal string
     * @param {number} precision - Working precision
     */
    initializePerturbation(centerX, centerY, precision) {
        throw new Error('initializePerturbation() not supported');
    }

    /**
     * Compute reference orbit for perturbation
     * @returns {ReferenceOrbit}
     */
    computeReferenceOrbit() {
        throw new Error('computeReferenceOrbit() not supported');
    }

    /**
     * Iterate using perturbation theory
     * 
     * @param {Complex} deltaC - Offset from reference center
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iteratePerturbation(deltaC, params = this.params) {
        throw new Error('iteratePerturbation() not supported');
    }

    /**
     * Iterate using hybrid (series + perturbation)
     * 
     * @param {Complex} deltaC - Offset from reference center
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateHybrid(deltaC, params = this.params) {
        throw new Error('iterateHybrid() not supported');
    }

    // =========================================================================
    // ARBITRARY PRECISION ITERATION
    // =========================================================================

    /**
     * Iterate using arbitrary precision
     * 
     * @param {BigComplex} z0
     * @param {BigComplex} c
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateArbitrary(z0, c, params = this.params) {
        throw new Error('iterateArbitrary() not supported');
    }

    // =========================================================================
    // HIGH-LEVEL ITERATION DISPATCHER
    // =========================================================================

    /**
     * Main iteration entry point - dispatches to appropriate method
     * 
     * @param {Complex|BigComplex} point - Point to iterate
     * @param {Complex|BigComplex} [c] - Parameter c (uses point for Mandelbrot-type)
     * @param {Object} [options]
     * @param {boolean} [options.usePerturbation] - Force perturbation mode
     * @param {Complex} [options.deltaC] - Delta from reference (for perturbation)
     * @returns {IterationResult}
     */
    compute(point, c = null, options = {}) {
        const params = this.params;
        
        // Julia mode uses fixed c
        if (params.juliaMode && params.juliaC) {
            c = params.juliaC;
        } else if (c === null) {
            c = point;
        }
        
        // Dispatch based on precision mode
        if (options.usePerturbation && this.supportsPerturbation() && options.deltaC) {
            // Perturbation mode
            if (this.supportsSeriesApproximation() && this._hybridIterator) {
                return this.iterateHybrid(options.deltaC, params);
            }
            return this.iteratePerturbation(options.deltaC, params);
        }
        
        if (params.precisionMode === 'arbitrary' && this.supportsArbitraryPrecision()) {
            // Arbitrary precision mode
            const z0 = point instanceof BigComplex ? point : new BigComplex(point.re, point.im, params.precision);
            const cBig = c instanceof BigComplex ? c : new BigComplex(c.re, c.im, params.precision);
            return this.iterateArbitrary(z0, cBig, params);
        }
        
        // Standard double precision
        const z0 = point instanceof Complex ? point : new Complex(0, 0);
        const cStd = c instanceof Complex ? c : point;
        return this.iterate(z0, cStd, params);
    }

    // =========================================================================
    // BATCH PROCESSING
    // =========================================================================

    /**
     * Iterate a batch of points
     * 
     * @param {Array<{x: number, y: number}>} points
     * @param {FractalParams} [params]
     * @returns {IterationResult[]}
     */
    iterateBatch(points, params = this.params) {
        return points.map(p => {
            const c = new Complex(p.x, p.y);
            const z0 = params.juliaMode ? c : new Complex(0, 0);
            const cVal = params.juliaMode ? params.juliaC : c;
            return this.iterate(z0, cVal, params);
        });
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Update parameters
     * @param {Object} newParams
     */
    setParams(newParams) {
        Object.assign(this.params, newParams);
        if ('bailout' in newParams) {
            this.params.bailoutSquared = this.params.bailout * this.params.bailout;
        }
    }

    /**
     * Get current parameters
     * @returns {FractalParams}
     */
    getParams() {
        return this.params;
    }

    /**
     * Reset to defaults
     */
    reset() {
        this.params = new FractalParams(this.getDefaultParams());
        this._referenceOrbit = null;
        this._perturbationIterator = null;
        this._hybridIterator = null;
        this._referenceCenter = null;
    }

    /**
     * Clean up resources
     */
    dispose() {
        this._referenceOrbit = null;
        this._perturbationIterator = null;
        this._hybridIterator = null;
        this._referenceCenter = null;
    }

    /**
     * Get metadata for this fractal
     * @returns {Object}
     */
    getMetadata() {
        return {
            id: this.getId(),
            name: this.getName(),
            description: this.getDescription(),
            formula: this.getFormula(),
            defaultParams: this.getDefaultParams(),
            defaultView: this.getDefaultView(),
            supportsPerturbation: this.supportsPerturbation(),
            supportsSeriesApproximation: this.supportsSeriesApproximation(),
            supportsArbitraryPrecision: this.supportsArbitraryPrecision(),
            hasInterior: this.hasInterior(),
            extraParams: this.getExtraParams()
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
    IterationResult,
    IterationResultPool,
    FractalParams,
    FractalBase
};

export default FractalBase;
