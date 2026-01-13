/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║              ABYSS EXPLORER - SERIES APPROXIMATION TECHNIQUES                 ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Taylor/Power series approximation for accelerated deep zoom rendering        ║
 * ║                                                                                ║
 * ║  Mathematical Foundation:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  At extreme deep zooms, even perturbation theory requires many iterations.    ║
 * ║  Series approximation "skips" early iterations by approximating the orbit     ║
 * ║  as a Taylor series in the initial perturbation δc.                           ║
 * ║                                                                                ║
 * ║  Core Idea:                                                                    ║
 * ║  ══════════                                                                    ║
 * ║  For small |δc|, we can write:                                                ║
 * ║                                                                                ║
 * ║    δ_n = Σ_{k=1}^{K} A_{n,k} · δc^k + O(δc^{K+1})                             ║
 * ║                                                                                ║
 * ║  where A_{n,k} are coefficient arrays computed from the reference orbit.      ║
 * ║                                                                                ║
 * ║  First-order (K=1): δ_n ≈ A_n · δc                                            ║
 * ║  Second-order: δ_n ≈ A_n · δc + B_n · δc²                                     ║
 * ║                                                                                ║
 * ║  Key Insight:                                                                  ║
 * ║  ═════════════                                                                 ║
 * ║  The coefficients satisfy recurrence relations derived from:                  ║
 * ║    δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc                                           ║
 * ║                                                                                ║
 * ║  Skipping Iterations:                                                          ║
 * ║  ═══════════════════                                                           ║
 * ║  If we can determine the iteration N where the series approximation           ║
 * ║  becomes invalid, we can jump directly to iteration N without computing       ║
 * ║  iterations 0 to N-1. This is called "series skipping".                       ║
 * ║                                                                                ║
 * ║  References:                                                                   ║
 * ║  - K.I. Martin: "Series approximation for Mandelbrot"                         ║
 * ║  - Kalles Fraktaler implementation                                            ║
 * ║  - Claude Heiland-Allen's SA implementation                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, ComplexPool } from './complex.js';
import { BigDecimal, BigComplex } from './arbitrary-precision.js';
import { ReferenceOrbit } from './perturbation.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Series approximation configuration
 */
const SAConfig = {
    /** Maximum series order (number of terms) */
    maxOrder: 64,
    
    /** Default series order */
    defaultOrder: 16,
    
    /** Tolerance for coefficient significance */
    coefficientTolerance: 1e-30,
    
    /** Error tolerance for validity check */
    errorTolerance: 1e-6,
    
    /** Minimum skip iterations to make SA worthwhile */
    minSkipIterations: 10
};

// =============================================================================
// SERIES COEFFICIENTS CLASS
// =============================================================================

/**
 * Series Coefficients Storage
 * 
 * Stores the Taylor series coefficients A_{n,k} for approximating
 * perturbation δ_n as a polynomial in δc.
 * 
 * For order K, we have:
 *   δ_n ≈ A_{n,1}·δc + A_{n,2}·δc² + ... + A_{n,K}·δc^K
 * 
 * Note: A_{n,0} = 0 always since δ_n = 0 when δc = 0
 * 
 * @class SeriesCoefficients
 */
export class SeriesCoefficients {
    /**
     * Create coefficient storage
     * 
     * @param {number} order - Maximum series order
     */
    constructor(order = SAConfig.defaultOrder) {
        /** @type {number} Series order */
        this.order = order;
        
        /**
         * Coefficients A[n][k] where A[n][k] = A_{n,k}
         * A_{n,k} is the coefficient of δc^k at iteration n
         * @type {Complex[][]}
         */
        this.A = [];
        
        /** @type {number} Number of iterations computed */
        this.length = 0;
        
        /** @type {boolean} */
        this.computed = false;
    }

    /**
     * Compute series coefficients from reference orbit
     * 
     * Recurrence relations:
     * ══════════════════════
     * From δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
     * 
     * Expanding δ_n = Σ A_{n,k}·δc^k and δ_{n+1} = Σ A_{n+1,k}·δc^k:
     * 
     * For k=1: A_{n+1,1} = 2·Z_n·A_{n,1} + 1
     * For k≥2: A_{n+1,k} = 2·Z_n·A_{n,k} + Σ_{j=1}^{k-1} A_{n,j}·A_{n,k-j}
     * 
     * Initial conditions: A_{0,k} = 0 for all k (since δ_0 = 0)
     * 
     * @param {ReferenceOrbit} reference
     */
    compute(reference) {
        const startTime = performance.now();
        this.A = [];
        
        // Initialize A_0 = [0, 0, 0, ...]
        const initial = new Array(this.order + 1).fill(null).map(() => new Complex(0, 0));
        this.A.push(initial);
        
        // Compute coefficients for each iteration
        for (let n = 0; n < reference.length - 1; n++) {
            const twoZ = reference.getTwoZ(n);
            const prevA = this.A[n];
            const nextA = new Array(this.order + 1);
            
            // A_{n+1,0} = 0 always
            nextA[0] = new Complex(0, 0);
            
            // A_{n+1,1} = 2·Z_n·A_{n,1} + 1
            nextA[1] = twoZ.mul(prevA[1]).add(new Complex(1, 0));
            
            // Higher order terms: A_{n+1,k} = 2·Z_n·A_{n,k} + convolution
            for (let k = 2; k <= this.order; k++) {
                // Start with 2·Z_n·A_{n,k}
                let coeff = twoZ.mul(prevA[k] || new Complex(0, 0));
                
                // Add convolution term: Σ_{j=1}^{k-1} A_{n,j}·A_{n,k-j}
                for (let j = 1; j < k; j++) {
                    const aj = prevA[j] || new Complex(0, 0);
                    const akj = prevA[k - j] || new Complex(0, 0);
                    coeff = coeff.add(aj.mul(akj));
                }
                
                nextA[k] = coeff;
            }
            
            this.A.push(nextA);
        }
        
        this.length = this.A.length;
        this.computed = true;
        
        const elapsed = performance.now() - startTime;
        // Logger would go here
    }

    /**
     * Get coefficient A_{n,k}
     * 
     * @param {number} n - Iteration
     * @param {number} k - Power of δc
     * @returns {Complex}
     */
    get(n, k) {
        if (n >= this.length || k > this.order) {
            return new Complex(0, 0);
        }
        return this.A[n][k] || new Complex(0, 0);
    }

    /**
     * Evaluate series at iteration n for given δc
     * 
     *   δ_n ≈ Σ_{k=1}^{order} A_{n,k} · δc^k
     * 
     * Uses Horner's method for efficiency.
     * 
     * @param {number} n - Iteration number
     * @param {Complex} deltaC - Initial perturbation
     * @returns {Complex} Approximated δ_n
     */
    evaluate(n, deltaC) {
        if (n >= this.length) {
            return null;
        }
        
        // Horner's method: a_K·x^K + ... + a_1·x = x(a_1 + x(a_2 + ... x(a_{K-1} + x·a_K)))
        // Work from highest order down
        let result = this.get(n, this.order).clone();
        
        for (let k = this.order - 1; k >= 1; k--) {
            result = result.mul(deltaC).add(this.get(n, k));
        }
        
        result = result.mul(deltaC);
        
        return result;
    }

    /**
     * Estimate error at iteration n for given |δc|
     * 
     * Error is dominated by the first neglected term: A_{n,K+1}·δc^{K+1}
     * Since we don't have A_{n,K+1}, estimate as |A_{n,K}·δc^K| · |δc|
     * 
     * @param {number} n
     * @param {number} deltaCMag - |δc|
     * @returns {number}
     */
    estimateError(n, deltaCMag) {
        const lastCoeff = this.get(n, this.order);
        return lastCoeff.magnitude * Math.pow(deltaCMag, this.order + 1);
    }
}

// =============================================================================
// SERIES APPROXIMATION ENGINE
// =============================================================================

/**
 * Series Approximation Engine
 * 
 * Uses Taylor series to skip iterations in perturbation theory.
 * Dramatically accelerates rendering at extreme deep zooms.
 * 
 * Workflow:
 * 1. Compute reference orbit (high precision)
 * 2. Compute series coefficients A_{n,k}
 * 3. For each pixel:
 *    a. Determine skip iteration N where series is valid
 *    b. Evaluate δ_N directly using series
 *    c. Continue with perturbation from iteration N
 * 
 * @class SeriesApproximationEngine
 */
export class SeriesApproximationEngine {
    /**
     * Create series approximation engine
     * 
     * @param {Object} options
     * @param {number} [options.order=16] - Series order
     * @param {number} [options.errorTolerance=1e-6] - Error tolerance
     */
    constructor(options = {}) {
        /** @type {number} */
        this.order = options.order || SAConfig.defaultOrder;
        
        /** @type {number} */
        this.errorTolerance = options.errorTolerance || SAConfig.errorTolerance;
        
        /** @type {SeriesCoefficients|null} */
        this.coefficients = null;
        
        /** @type {ReferenceOrbit|null} */
        this.reference = null;
        
        /** @type {Logger} */
        this.logger = new Logger('SeriesApproximation');
        
        // Caching for repeated evaluations at same skip point
        this._skipCache = new Map();
        
        // Statistics
        this.stats = {
            totalSkipped: 0,
            averageSkip: 0,
            evaluations: 0
        };
    }

    /**
     * Initialize with reference orbit
     * 
     * @param {ReferenceOrbit} reference
     */
    initialize(reference) {
        this.reference = reference;
        
        // Compute series coefficients
        this.coefficients = new SeriesCoefficients(this.order);
        this.coefficients.compute(reference);
        
        // Clear caches
        this._skipCache.clear();
        this.stats = { totalSkipped: 0, averageSkip: 0, evaluations: 0 };
        
        this.logger.info(`Series approximation initialized: order ${this.order}, ${this.coefficients.length} iterations`);
    }

    /**
     * Find the skip iteration for a given δc
     * 
     * The skip iteration N is the largest iteration where:
     * - The series approximation has acceptable error
     * - The approximated δ_N hasn't escaped
     * 
     * We want to maximize N to skip as many iterations as possible.
     * 
     * @param {Complex} deltaC - Initial perturbation
     * @returns {{skipN: number, deltaAtN: Complex}}
     */
    findSkipPoint(deltaC) {
        const deltaCMag = deltaC.magnitude;
        
        // Binary search for the skip point
        let low = 0;
        let high = this.coefficients.length - 1;
        let bestN = 0;
        let bestDelta = new Complex(0, 0);
        
        // First, find where the series becomes invalid
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            
            // Check validity at mid
            const validity = this._checkValidity(mid, deltaC, deltaCMag);
            
            if (validity.valid) {
                // Series is still valid, try higher
                if (mid > bestN) {
                    bestN = mid;
                    bestDelta = validity.delta;
                }
                low = mid + 1;
            } else {
                // Invalid, try lower
                high = mid - 1;
            }
        }
        
        this.stats.totalSkipped += bestN;
        this.stats.evaluations++;
        this.stats.averageSkip = this.stats.totalSkipped / this.stats.evaluations;
        
        return { skipN: bestN, deltaAtN: bestDelta };
    }

    /**
     * Check if series is valid at iteration n
     * 
     * @private
     * @param {number} n
     * @param {Complex} deltaC
     * @param {number} deltaCMag
     * @returns {{valid: boolean, delta: Complex, error: number}}
     */
    _checkValidity(n, deltaC, deltaCMag) {
        // Evaluate series
        const delta = this.coefficients.evaluate(n, deltaC);
        if (!delta) {
            return { valid: false, delta: null, error: Infinity };
        }
        
        // Check error bound
        const error = this.coefficients.estimateError(n, deltaCMag);
        if (error > this.errorTolerance) {
            return { valid: false, delta, error };
        }
        
        // Check that δ hasn't grown too large relative to reference
        const Z = this.reference.getZ(n);
        const zMag = Z ? Z.magnitude : 0;
        const deltaMag = delta.magnitude;
        
        // If δ is larger than Z, series is unreliable
        if (zMag > 0 && deltaMag > 0.1 * zMag) {
            return { valid: false, delta, error };
        }
        
        // Check combined escape
        const fullZ = Z ? new Complex(Z.re + delta.re, Z.im + delta.im) : delta;
        if (fullZ.magnitudeSquared > 4) {
            // Escaped - still valid but we should stop
            return { valid: true, delta, error, escaped: true };
        }
        
        return { valid: true, delta, error };
    }

    /**
     * Evaluate series and return skip point data for a pixel
     * 
     * @param {Complex} deltaC
     * @returns {{skipN: number, delta: Complex, z: Complex}}
     */
    evaluate(deltaC) {
        const { skipN, deltaAtN } = this.findSkipPoint(deltaC);
        
        // Get reference Z at skip point
        const Z = this.reference.getZ(skipN);
        const z = Z ? new Complex(Z.re + deltaAtN.re, Z.im + deltaAtN.im) : deltaAtN;
        
        return { skipN, delta: deltaAtN, z };
    }

    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }
}

// =============================================================================
// ADAPTIVE SERIES ORDER
// =============================================================================

/**
 * Adaptive Series Order Selector
 * 
 * Automatically determines the optimal series order based on:
 * - Zoom level (deeper = higher order)
 * - View size in δc units
 * - Available computation time
 * 
 * @class AdaptiveOrderSelector
 */
export class AdaptiveOrderSelector {
    /**
     * Select optimal series order
     * 
     * @param {number} zoom - Zoom level
     * @param {number} viewSize - View size in fractal coordinates
     * @param {number} maxComputeTime - Maximum time for coefficient computation (ms)
     * @returns {number} Recommended series order
     */
    static select(zoom, viewSize, maxComputeTime = 1000) {
        // Base order scales with log of zoom
        const baseOrder = Math.min(64, Math.max(8, Math.floor(Math.log10(zoom) * 2)));
        
        // Adjust for view size - larger view needs lower order (bigger δc)
        const viewFactor = viewSize > 1e-6 ? 0.8 : 1.0;
        
        // Estimate compute time per order
        // Higher orders take longer to compute
        const estimatedTime = baseOrder * baseOrder * 0.1; // ms per order
        
        let order = Math.floor(baseOrder * viewFactor);
        
        // Cap if compute time would be excessive
        while (order > 4 && order * order * 0.1 > maxComputeTime) {
            order--;
        }
        
        return Math.max(4, Math.min(SAConfig.maxOrder, order));
    }
}

// =============================================================================
// COMBINED PERTURBATION + SERIES ITERATOR
// =============================================================================

/**
 * Hybrid Iterator
 * 
 * Combines series approximation and perturbation theory for
 * maximum efficiency at deep zooms.
 * 
 * Algorithm:
 * 1. Use series approximation to skip to iteration N
 * 2. Continue with perturbation from N
 * 3. Handle glitches via rebasing
 * 
 * @class HybridIterator
 */
export class HybridIterator {
    /**
     * Create hybrid iterator
     * 
     * @param {ReferenceOrbit} reference
     * @param {number} seriesOrder
     * @param {number} bailout
     */
    constructor(reference, seriesOrder = 16, bailout = 2) {
        /** @type {ReferenceOrbit} */
        this.reference = reference;
        
        /** @type {SeriesApproximationEngine} */
        this.series = new SeriesApproximationEngine({ order: seriesOrder });
        this.series.initialize(reference);
        
        /** @type {number} */
        this.bailout = bailout;
        this.bailoutSquared = bailout * bailout;
        
        /** @type {number} */
        this.glitchTolerance = 1e-4;
        
        // Statistics
        this.stats = {
            totalIterations: 0,
            skippedIterations: 0,
            glitches: 0
        };
    }

    /**
     * Iterate a pixel using hybrid approach
     * 
     * @param {Complex} deltaC - Offset from reference center
     * @param {number} maxIterations
     * @returns {Object} Iteration result
     */
    iterate(deltaC, maxIterations) {
        // Phase 1: Series approximation skip
        const { skipN, delta: deltaAtSkip, z: zAtSkip } = this.series.evaluate(deltaC);
        
        this.stats.skippedIterations += skipN;
        
        // Check if already escaped during series evaluation
        if (zAtSkip.magnitudeSquared > this.bailoutSquared) {
            // Find exact escape point in series range
            return this._findEscapeInSeries(deltaC, skipN);
        }
        
        // Phase 2: Perturbation from skip point
        let n = skipN;
        let delta = deltaAtSkip.clone();
        let escaped = false;
        let finalZ = zAtSkip.clone();
        
        while (n < maxIterations && n < this.reference.length) {
            // Get reference values
            const Z = this.reference.getZ(n);
            const twoZ = this.reference.getTwoZ(n);
            
            // Full z = Z + δ
            const zRe = Z.re + delta.re;
            const zIm = Z.im + delta.im;
            const zMag2 = zRe * zRe + zIm * zIm;
            
            // Check escape
            if (zMag2 > this.bailoutSquared) {
                escaped = true;
                finalZ.set(zRe, zIm);
                break;
            }
            
            // Glitch detection
            const deltaMag2 = delta.re * delta.re + delta.im * delta.im;
            const zMag2Ref = this.reference.getZMag2(n);
            
            if (zMag2Ref > 0 && deltaMag2 > this.glitchTolerance * this.glitchTolerance * zMag2Ref) {
                this.stats.glitches++;
                // Simple fallback: continue with standard iteration
                return this._standardIteration(new Complex(zRe, zIm), deltaC, n, maxIterations);
            }
            
            // Perturbation iteration
            const twoZDeltaRe = twoZ.re * delta.re - twoZ.im * delta.im;
            const twoZDeltaIm = twoZ.re * delta.im + twoZ.im * delta.re;
            const deltaSqRe = delta.re * delta.re - delta.im * delta.im;
            const deltaSqIm = 2 * delta.re * delta.im;
            
            delta.re = twoZDeltaRe + deltaSqRe + deltaC.re;
            delta.im = twoZDeltaIm + deltaSqIm + deltaC.im;
            
            n++;
            this.stats.totalIterations++;
        }
        
        // Smooth iteration count
        let smooth = n;
        if (escaped) {
            const logZMag = Math.log(finalZ.re * finalZ.re + finalZ.im * finalZ.im) / 2;
            smooth = n + 1 - Math.log(logZMag) / Math.LN2 / Math.LN2;
        }
        
        return {
            iterations: n,
            escaped,
            smooth,
            finalZ,
            skipped: skipN
        };
    }

    /**
     * Find escape point within series range
     * @private
     */
    _findEscapeInSeries(deltaC, maxN) {
        // Binary search for escape iteration
        let low = 0;
        let high = maxN;
        
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            const delta = this.series.coefficients.evaluate(mid, deltaC);
            const Z = this.reference.getZ(mid);
            const zMag2 = Z 
                ? (Z.re + delta.re) ** 2 + (Z.im + delta.im) ** 2
                : delta.magnitudeSquared;
            
            if (zMag2 > this.bailoutSquared) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        
        const n = low;
        const delta = this.series.coefficients.evaluate(n, deltaC);
        const Z = this.reference.getZ(n);
        const finalZ = Z 
            ? new Complex(Z.re + delta.re, Z.im + delta.im)
            : delta;
        
        const logZMag = Math.log(finalZ.magnitudeSquared) / 2;
        const smooth = n + 1 - Math.log(logZMag) / Math.LN2 / Math.LN2;
        
        return {
            iterations: n,
            escaped: true,
            smooth,
            finalZ,
            skipped: n
        };
    }

    /**
     * Standard iteration fallback (no perturbation)
     * @private
     */
    _standardIteration(z, deltaC, startN, maxIterations) {
        const c = new Complex(
            this.reference.center.re.toNumber() + deltaC.re,
            this.reference.center.im.toNumber() + deltaC.im
        );
        
        let n = startN;
        let escaped = false;
        
        while (n < maxIterations) {
            const zMag2 = z.magnitudeSquared;
            
            if (zMag2 > this.bailoutSquared) {
                escaped = true;
                break;
            }
            
            const newRe = z.re * z.re - z.im * z.im + c.re;
            const newIm = 2 * z.re * z.im + c.im;
            z.re = newRe;
            z.im = newIm;
            
            n++;
        }
        
        let smooth = n;
        if (escaped) {
            const logZMag = Math.log(z.magnitudeSquared) / 2;
            smooth = n + 1 - Math.log(logZMag) / Math.LN2 / Math.LN2;
        }
        
        return {
            iterations: n,
            escaped,
            smooth,
            finalZ: z,
            skipped: startN,
            rebased: true
        };
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            series: this.series.getStats()
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
    SAConfig,
    SeriesCoefficients,
    SeriesApproximationEngine,
    AdaptiveOrderSelector,
    HybridIterator
};

export default SeriesApproximationEngine;
