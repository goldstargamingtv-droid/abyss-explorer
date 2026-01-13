/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ABYSS EXPLORER - MANDELBROT SET                             ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Classic Mandelbrot set with ultra-deep zoom support                          ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Mandelbrot set M is defined as:                                          ║
 * ║    M = { c ∈ ℂ : z_n = z_{n-1}² + c does not diverge to ∞ starting from z₀=0}║
 * ║                                                                                ║
 * ║  Iteration:                                                                    ║
 * ║    z₀ = 0                                                                      ║
 * ║    z_{n+1} = z_n² + c                                                         ║
 * ║                                                                                ║
 * ║  Escape condition: |z_n| > 2 (point escapes, not in set)                      ║
 * ║                                                                                ║
 * ║  Properties:                                                                   ║
 * ║  - Connected and locally connected (proven)                                   ║
 * ║  - Contains the main cardioid: r = ½(1 - cos θ)                              ║
 * ║  - Period-2 bulb centered at (-1, 0) with radius ¼                           ║
 * ║  - Self-similar at all scales with infinite complexity                        ║
 * ║                                                                                ║
 * ║  This implementation supports:                                                 ║
 * ║  - Standard double-precision iteration                                        ║
 * ║  - Perturbation theory for deep zooms (10^15+)                               ║
 * ║  - Series approximation for faster deep rendering                             ║
 * ║  - Arbitrary precision fallback                                               ║
 * ║  - Distance estimation for smooth boundaries                                  ║
 * ║  - Interior detection (cardioid/bulb checking)                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, ComplexPool, CONSTANTS } from '../math/complex.js';
import { BigDecimal, BigComplex, PrecisionManager } from '../math/arbitrary-precision.js';
import { ReferenceOrbit, PerturbationIterator, PerturbationEngine } from '../math/perturbation.js';
import { SeriesApproximationEngine, HybridIterator, SeriesCoefficients } from '../math/series-approximation.js';
import { FractalBase, IterationResult, FractalParams } from './fractal-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// MANDELBROT FRACTAL CLASS
// =============================================================================

/**
 * Mandelbrot Set Fractal
 * 
 * Implements the classic z² + c Mandelbrot set with full support for
 * ultra-deep zooms using perturbation theory and series approximation.
 * 
 * @extends FractalBase
 */
export class Mandelbrot extends FractalBase {
    constructor(params = null) {
        super(params);
        
        /** @type {PerturbationEngine|null} */
        this._perturbationEngine = null;
        
        /** @type {SeriesApproximationEngine|null} */
        this._seriesEngine = null;
        
        /** @type {PrecisionManager} */
        this._precisionManager = new PrecisionManager();
        
        /** @type {boolean} Reference orbit is computed */
        this._referenceReady = false;
        
        // Precompute log(2) for smooth coloring
        this._log2 = Math.LN2;
        this._logBailout = Math.log(this.params.bailout);
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'mandelbrot';
    }

    getName() {
        return 'Mandelbrot Set';
    }

    getDescription() {
        return 'The classic Mandelbrot set: z² + c. The most famous fractal, ' +
               'featuring infinite self-similarity and complexity at all scales.';
    }

    getFormula() {
        return 'z_{n+1} = z_n^2 + c';
    }

    getDefaultParams() {
        return {
            maxIterations: 500,
            bailout: 2,
            power: 2,
            smoothColoring: true,
            distanceEstimate: false
        };
    }

    getDefaultView() {
        return {
            centerX: -0.5,
            centerY: 0,
            zoom: 1.5
        };
    }

    supportsPerturbation() {
        return true;
    }

    supportsSeriesApproximation() {
        return true;
    }

    supportsArbitraryPrecision() {
        return true;
    }

    hasInterior() {
        return true;
    }

    // =========================================================================
    // STANDARD DOUBLE-PRECISION ITERATION
    // =========================================================================

    /**
     * Standard Mandelbrot iteration
     * 
     * The iteration z_{n+1} = z_n² + c is computed as:
     *   re_{n+1} = re_n² - im_n² + c_re
     *   im_{n+1} = 2·re_n·im_n + c_im
     * 
     * @param {Complex} z0 - Starting point (usually 0)
     * @param {Complex} c - The c parameter
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        // Check if in main cardioid or period-2 bulb (optimization)
        if (params.interiorChecking && this._isInMainBulb(c)) {
            result.iterations = maxIter;
            result.escaped = false;
            result.smooth = maxIter;
            return result;
        }
        
        // Initialize
        let zRe = z0.re;
        let zIm = z0.im;
        const cRe = c.re;
        const cIm = c.im;
        
        // For distance estimation
        let dzRe = 1;  // dz/dc starts at 1
        let dzIm = 0;
        const computeDE = params.distanceEstimate;
        
        // For orbit trap
        let minTrapDist = Infinity;
        let trapPoint = null;
        const computeTrap = params.orbitTrap;
        
        // For stripe average
        let stripeSum = 0;
        const computeStripe = params.stripeAverage;
        const stripeDensity = params.stripeDensity;
        
        let n = 0;
        let mag2 = zRe * zRe + zIm * zIm;
        
        // Main iteration loop
        while (n < maxIter && mag2 <= bailout2) {
            // Compute distance estimate derivative: dz' = 2·z·dz' + 1
            if (computeDE) {
                const newDzRe = 2 * (zRe * dzRe - zIm * dzIm) + 1;
                const newDzIm = 2 * (zRe * dzIm + zIm * dzRe);
                dzRe = newDzRe;
                dzIm = newDzIm;
            }
            
            // Orbit trap check
            if (computeTrap) {
                const trapDist = this.calculateOrbitTrapDistance(
                    new Complex(zRe, zIm),
                    params.orbitTrapType,
                    params.orbitTrapCenter,
                    params.orbitTrapSize
                );
                if (trapDist < minTrapDist) {
                    minTrapDist = trapDist;
                    trapPoint = new Complex(zRe, zIm);
                }
            }
            
            // Stripe average
            if (computeStripe) {
                const angle = Math.atan2(zIm, zRe);
                stripeSum += 0.5 * Math.sin(stripeDensity * angle) + 0.5;
            }
            
            /**
             * Core iteration: z = z² + c
             * 
             * z² = (re + im·i)² = re² - im² + 2·re·im·i
             */
            const zRe2 = zRe * zRe;
            const zIm2 = zIm * zIm;
            const newZIm = 2 * zRe * zIm + cIm;
            const newZRe = zRe2 - zIm2 + cRe;
            
            zRe = newZRe;
            zIm = newZIm;
            mag2 = zRe * zRe + zIm * zIm;
            
            n++;
        }
        
        // Build result
        result.iterations = n;
        result.finalZ.set(zRe, zIm);
        result.finalMagnitude2 = mag2;
        result.escaped = mag2 > bailout2;
        
        // Smooth coloring
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        // Distance estimate
        if (computeDE && result.escaped) {
            const dzMag = Math.sqrt(dzRe * dzRe + dzIm * dzIm);
            result.derivative = dzMag;
            if (dzMag > 0) {
                const zMag = Math.sqrt(mag2);
                result.distance = (zMag * Math.log(zMag)) / dzMag;
            }
        }
        
        // Orbit trap
        if (computeTrap) {
            result.orbitTrapDistance = minTrapDist;
            result.orbitTrapPoint = trapPoint;
        }
        
        // Stripe average (normalized)
        if (computeStripe && n > 0) {
            result.stripeAverage = stripeSum / n;
        }
        
        // Final angle
        result.angle = Math.atan2(zIm, zRe);
        
        return result;
    }

    // =========================================================================
    // INTERIOR DETECTION
    // =========================================================================

    /**
     * Check if point is in main cardioid or period-2 bulb
     * 
     * Main cardioid equation:
     *   The cardioid is parametrized as c = ½e^(iθ)(1 - ½e^(iθ))
     *   Point is inside if: |c - ¼| < ½(1 - cos(arg(c - ¼)))
     * 
     * Alternative check using q:
     *   q = (c_re - ¼)² + c_im²
     *   Inside cardioid if: q(q + (c_re - ¼)) < ¼c_im²
     * 
     * Period-2 bulb:
     *   Center (-1, 0), radius ¼
     *   Inside if: (c_re + 1)² + c_im² < 1/16
     * 
     * @private
     * @param {Complex} c
     * @returns {boolean}
     */
    _isInMainBulb(c) {
        const cRe = c.re;
        const cIm = c.im;
        
        // Period-2 bulb check (faster, so check first)
        const p2Re = cRe + 1;
        if (p2Re * p2Re + cIm * cIm < 0.0625) {
            return true;
        }
        
        // Main cardioid check
        const q = (cRe - 0.25) * (cRe - 0.25) + cIm * cIm;
        if (q * (q + (cRe - 0.25)) < 0.25 * cIm * cIm) {
            return true;
        }
        
        return false;
    }

    // =========================================================================
    // PERTURBATION THEORY IMPLEMENTATION
    // =========================================================================

    /**
     * Initialize perturbation with reference point
     * 
     * @param {string} centerX - Center X as decimal string
     * @param {string} centerY - Center Y as decimal string
     * @param {number} precision - Working precision (decimal digits)
     */
    initializePerturbation(centerX, centerY, precision = 50) {
        this.logger.info(`Initializing perturbation at (${centerX.substring(0, 20)}..., ${centerY.substring(0, 20)}...) with precision ${precision}`);
        
        // Create high-precision center
        this._referenceCenter = new BigComplex(centerX, centerY, precision);
        
        // Create perturbation engine
        this._perturbationEngine = new PerturbationEngine({
            maxIterations: this.params.maxIterations,
            bailout: this.params.bailout,
            precision
        });
        
        this._perturbationEngine.setView(centerX, centerY, 1);
        this._referenceReady = false;
    }

    /**
     * Compute reference orbit for perturbation
     * 
     * The reference orbit Z_n is computed at the center point C
     * using high-precision arithmetic.
     * 
     * @returns {ReferenceOrbit}
     */
    computeReferenceOrbit() {
        if (!this._perturbationEngine) {
            throw new Error('Perturbation not initialized');
        }
        
        const reference = this._perturbationEngine.computeReference();
        
        // Initialize series approximation if supported
        this._seriesEngine = new SeriesApproximationEngine({ order: 16 });
        this._seriesEngine.initialize(reference);
        
        // Create hybrid iterator
        this._hybridIterator = new HybridIterator(reference, 16, this.params.bailout);
        
        this._referenceReady = true;
        
        return reference;
    }

    /**
     * Iterate using perturbation theory
     * 
     * For a point c = C + δc, we compute δ_n where z_n = Z_n + δ_n
     * 
     * The recurrence is:
     *   δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
     * 
     * @param {Complex} deltaC - Offset from reference center
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iteratePerturbation(deltaC, params = this.params) {
        if (!this._referenceReady) {
            this.computeReferenceOrbit();
        }
        
        const result = new IterationResult();
        const pertResult = this._perturbationEngine.iteratePixel(deltaC.re, deltaC.im);
        
        result.iterations = pertResult.iterations;
        result.escaped = pertResult.escaped;
        result.smooth = pertResult.smooth;
        result.finalZ = pertResult.finalZ;
        result.finalMagnitude2 = pertResult.finalZ.magnitudeSquared;
        result.perturbationUsed = true;
        result.glitched = pertResult.glitched || false;
        
        return result;
    }

    /**
     * Iterate using hybrid (series + perturbation)
     * 
     * Uses series approximation to skip early iterations,
     * then continues with perturbation.
     * 
     * @param {Complex} deltaC
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateHybrid(deltaC, params = this.params) {
        if (!this._referenceReady) {
            this.computeReferenceOrbit();
        }
        
        const result = new IterationResult();
        const hybridResult = this._hybridIterator.iterate(deltaC, params.maxIterations);
        
        result.iterations = hybridResult.iterations;
        result.escaped = hybridResult.escaped;
        result.smooth = hybridResult.smooth;
        result.finalZ = hybridResult.finalZ;
        result.finalMagnitude2 = hybridResult.finalZ.magnitudeSquared;
        result.perturbationUsed = true;
        result.skippedIterations = hybridResult.skipped || 0;
        result.glitched = hybridResult.rebased || false;
        
        return result;
    }

    // =========================================================================
    // ARBITRARY PRECISION ITERATION
    // =========================================================================

    /**
     * Iterate using arbitrary precision
     * 
     * Used when perturbation theory cannot be applied (e.g., at center)
     * or for verification.
     * 
     * @param {BigComplex} z0
     * @param {BigComplex} c
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateArbitrary(z0, c, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout = new BigDecimal(params.bailoutSquared, c.precision);
        
        let z = z0.clone();
        let n = 0;
        
        while (n < maxIter) {
            const mag2 = z.magnitudeSquared();
            
            if (mag2.gt(bailout)) {
                result.escaped = true;
                break;
            }
            
            // z = z² + c
            z = z.square().add(c);
            n++;
        }
        
        result.iterations = n;
        result.escaped = n < maxIter;
        
        // Convert to double for final values
        const zDouble = z.toComplex();
        result.finalZ.set(zDouble.re, zDouble.im);
        result.finalMagnitude2 = result.finalZ.magnitudeSquared;
        
        // Smooth coloring
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    // =========================================================================
    // MULTIBROT VARIANT (z^n + c)
    // =========================================================================

    /**
     * Multibrot iteration for power != 2
     * 
     * z_{n+1} = z_n^p + c
     * 
     * Uses de Moivre's formula for integer powers:
     *   z^p = r^p · e^(ipθ) = r^p(cos(pθ) + i·sin(pθ))
     * 
     * @param {Complex} z0
     * @param {Complex} c
     * @param {number} power
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateMultibrot(z0, c, power, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let z = z0.clone();
        let n = 0;
        
        while (n < maxIter) {
            const mag2 = z.magnitudeSquared;
            
            if (mag2 > bailout2) {
                result.escaped = true;
                break;
            }
            
            // z = z^power + c
            z = z.pow(power).add(c);
            n++;
        }
        
        result.iterations = n;
        result.finalZ = z;
        result.finalMagnitude2 = z.magnitudeSquared;
        result.escaped = n < maxIter;
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, z, power, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    // =========================================================================
    // DEEP ZOOM UTILITIES
    // =========================================================================

    /**
     * Get recommended precision for zoom level
     * 
     * @param {number} zoom - Zoom level
     * @returns {number} Recommended precision in decimal digits
     */
    getRecommendedPrecision(zoom) {
        // Rule of thumb: need log10(zoom) + 20 digits
        return Math.max(50, Math.ceil(Math.log10(zoom)) + 20);
    }

    /**
     * Check if perturbation is recommended at this zoom
     * 
     * @param {number} zoom
     * @returns {boolean}
     */
    shouldUsePerturbation(zoom) {
        // Switch to perturbation around 10^13 zoom
        return zoom > 1e13;
    }

    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return {
            referenceReady: this._referenceReady,
            perturbationStats: this._perturbationEngine?.getStats() || null,
            seriesStats: this._seriesEngine?.getStats() || null,
            hybridStats: this._hybridIterator?.getStats() || null
        };
    }

    /**
     * Clean up resources
     */
    dispose() {
        super.dispose();
        this._perturbationEngine?.clear();
        this._seriesEngine = null;
        this._hybridIterator = null;
        this._referenceReady = false;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Mandelbrot;
