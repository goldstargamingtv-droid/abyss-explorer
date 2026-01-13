/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ABYSS EXPLORER - BURNING SHIP FRACTAL                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  The Burning Ship fractal and variants                                        ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Burning Ship is defined by taking absolute values before squaring:       ║
 * ║                                                                                ║
 * ║    z₀ = 0                                                                      ║
 * ║    z_{n+1} = (|Re(z_n)| + i|Im(z_n)|)² + c                                    ║
 * ║                                                                                ║
 * ║  Expanded:                                                                     ║
 * ║    re_{n+1} = |re_n|² - |im_n|² + c_re                                        ║
 * ║    im_{n+1} = 2|re_n||im_n| + c_im                                            ║
 * ║                                                                                ║
 * ║  Properties:                                                                   ║
 * ║  - Asymmetric (due to absolute values)                                        ║
 * ║  - Contains ship-like structures, hence the name                              ║
 * ║  - The main "ship" is at approximately (-1.76, 0)                             ║
 * ║  - Shows interesting "spire" formations                                       ║
 * ║                                                                                ║
 * ║  Variants:                                                                     ║
 * ║  - Standard: (|re| + i|im|)² + c                                              ║
 * ║  - Bird of Prey: different abs arrangement                                    ║
 * ║  - Celtic: yet another variant                                                ║
 * ║                                                                                ║
 * ║  Perturbation Note:                                                            ║
 * ║  The absolute value operation makes perturbation theory more complex          ║
 * ║  because the derivative is discontinuous at zero crossings.                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, CONSTANTS } from '../math/complex.js';
import { BigDecimal, BigComplex } from '../math/arbitrary-precision.js';
import { ReferenceOrbit, PerturbationIterator } from '../math/perturbation.js';
import { FractalBase, IterationResult, FractalParams } from './fractal-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// BURNING SHIP VARIANTS
// =============================================================================

/**
 * Variant types for Burning Ship family
 */
export const BurningShipVariant = {
    /** Standard: (|re| + i|im|)² + c */
    STANDARD: 'standard',
    
    /** Partial: (|re| + i·im)² + c */
    PARTIAL_RE: 'partial_re',
    
    /** Partial: (re + i|im|)² + c */
    PARTIAL_IM: 'partial_im',
    
    /** Buffalo: variation with different structure */
    BUFFALO: 'buffalo',
    
    /** Celtic: another abs variation */
    CELTIC: 'celtic'
};

// =============================================================================
// BURNING SHIP CLASS
// =============================================================================

/**
 * Burning Ship Fractal
 * 
 * Implements the Burning Ship and related variants.
 * 
 * @extends FractalBase
 */
export class BurningShip extends FractalBase {
    constructor(params = null) {
        super(params);
        
        /** @type {string} Current variant */
        this.variant = BurningShipVariant.STANDARD;
        
        /** @type {ReferenceOrbit|null} */
        this._referenceOrbit = null;
        
        /** @type {BigComplex|null} */
        this._referenceCenter = null;
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'burning-ship';
    }

    getName() {
        return 'Burning Ship';
    }

    getDescription() {
        return 'The Burning Ship fractal: (|Re(z)| + i|Im(z)|)² + c. ' +
               'Features distinctive ship-like structures and spires.';
    }

    getFormula() {
        return 'z_{n+1} = (|\\text{Re}(z_n)| + i|\\text{Im}(z_n)|)^2 + c';
    }

    getDefaultParams() {
        return {
            maxIterations: 500,
            bailout: 2,
            power: 2,
            smoothColoring: true
        };
    }

    getDefaultView() {
        return {
            centerX: -0.5,
            centerY: -0.5,
            zoom: 1.5
        };
    }

    getExtraParams() {
        return [
            {
                name: 'variant',
                type: 'select',
                default: 'standard',
                options: Object.values(BurningShipVariant),
                description: 'Burning Ship variant'
            }
        ];
    }

    supportsPerturbation() {
        return true; // With caveats
    }

    supportsSeriesApproximation() {
        return false; // Too complex due to abs()
    }

    supportsArbitraryPrecision() {
        return true;
    }

    hasInterior() {
        return true;
    }

    // =========================================================================
    // VARIANT SELECTION
    // =========================================================================

    /**
     * Set the variant type
     * @param {string} variant
     */
    setVariant(variant) {
        this.variant = variant;
        this._referenceOrbit = null; // Invalidate cache
    }

    /**
     * Get available variants
     * @returns {string[]}
     */
    getVariants() {
        return Object.values(BurningShipVariant);
    }

    // =========================================================================
    // STANDARD ITERATION
    // =========================================================================

    /**
     * Standard Burning Ship iteration
     * 
     * The iteration applies absolute value to both components:
     *   temp_re = |z_re|
     *   temp_im = |z_im|
     *   z_{n+1} = (temp_re + i·temp_im)² + c
     *           = (temp_re² - temp_im²) + 2·temp_re·temp_im·i + c
     * 
     * @param {Complex} z0
     * @param {Complex} c
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        switch (this.variant) {
            case BurningShipVariant.PARTIAL_RE:
                return this._iteratePartialRe(z0, c, params);
            case BurningShipVariant.PARTIAL_IM:
                return this._iteratePartialIm(z0, c, params);
            case BurningShipVariant.BUFFALO:
                return this._iterateBuffalo(z0, c, params);
            case BurningShipVariant.CELTIC:
                return this._iterateCeltic(z0, c, params);
            default:
                return this._iterateStandard(z0, c, params);
        }
    }

    /**
     * Standard Burning Ship: (|re| + i|im|)² + c
     * @private
     */
    _iterateStandard(z0, c, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let zRe = z0.re;
        let zIm = z0.im;
        const cRe = c.re;
        const cIm = c.im;
        
        // For derivative (distance estimation)
        let dzRe = 1;
        let dzIm = 0;
        const computeDE = params.distanceEstimate;
        
        // For orbit trap
        let minTrapDist = Infinity;
        const computeTrap = params.orbitTrap;
        
        let n = 0;
        let mag2 = zRe * zRe + zIm * zIm;
        
        while (n < maxIter && mag2 <= bailout2) {
            // Take absolute values
            const absRe = Math.abs(zRe);
            const absIm = Math.abs(zIm);
            
            // Derivative for distance estimation
            // Note: derivative is discontinuous at sign changes
            if (computeDE) {
                const signRe = zRe >= 0 ? 1 : -1;
                const signIm = zIm >= 0 ? 1 : -1;
                const newDzRe = 2 * (absRe * dzRe * signRe - absIm * dzIm * signIm);
                const newDzIm = 2 * (absRe * dzIm * signRe + absIm * dzRe * signIm);
                dzRe = newDzRe;
                dzIm = newDzIm;
            }
            
            // Orbit trap
            if (computeTrap) {
                const trapDist = this.calculateOrbitTrapDistance(
                    new Complex(zRe, zIm),
                    params.orbitTrapType,
                    params.orbitTrapCenter,
                    params.orbitTrapSize
                );
                if (trapDist < minTrapDist) {
                    minTrapDist = trapDist;
                }
            }
            
            /**
             * Burning Ship iteration:
             * z = (|re| + i|im|)² + c
             *   = |re|² - |im|² + 2|re||im|i + c
             */
            const newZRe = absRe * absRe - absIm * absIm + cRe;
            const newZIm = 2 * absRe * absIm + cIm;
            
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
        }
        
        result.angle = Math.atan2(zIm, zRe);
        
        return result;
    }

    /**
     * Partial Real variant: (|re| + i·im)² + c
     * @private
     */
    _iteratePartialRe(z0, c, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let zRe = z0.re;
        let zIm = z0.im;
        const cRe = c.re;
        const cIm = c.im;
        
        let n = 0;
        let mag2 = zRe * zRe + zIm * zIm;
        
        while (n < maxIter && mag2 <= bailout2) {
            const absRe = Math.abs(zRe);
            // Only abs on real part
            const newZRe = absRe * absRe - zIm * zIm + cRe;
            const newZIm = 2 * absRe * zIm + cIm;
            
            zRe = newZRe;
            zIm = newZIm;
            mag2 = zRe * zRe + zIm * zIm;
            n++;
        }
        
        result.iterations = n;
        result.finalZ.set(zRe, zIm);
        result.finalMagnitude2 = mag2;
        result.escaped = mag2 > bailout2;
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    /**
     * Partial Imaginary variant: (re + i|im|)² + c
     * @private
     */
    _iteratePartialIm(z0, c, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let zRe = z0.re;
        let zIm = z0.im;
        const cRe = c.re;
        const cIm = c.im;
        
        let n = 0;
        let mag2 = zRe * zRe + zIm * zIm;
        
        while (n < maxIter && mag2 <= bailout2) {
            const absIm = Math.abs(zIm);
            // Only abs on imaginary part
            const newZRe = zRe * zRe - absIm * absIm + cRe;
            const newZIm = 2 * zRe * absIm + cIm;
            
            zRe = newZRe;
            zIm = newZIm;
            mag2 = zRe * zRe + zIm * zIm;
            n++;
        }
        
        result.iterations = n;
        result.finalZ.set(zRe, zIm);
        result.finalMagnitude2 = mag2;
        result.escaped = mag2 > bailout2;
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    /**
     * Buffalo fractal: |z|² + c with component flipping
     * @private
     */
    _iterateBuffalo(z0, c, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let zRe = z0.re;
        let zIm = z0.im;
        const cRe = c.re;
        const cIm = c.im;
        
        let n = 0;
        let mag2 = zRe * zRe + zIm * zIm;
        
        while (n < maxIter && mag2 <= bailout2) {
            const absRe = Math.abs(zRe);
            const absIm = Math.abs(zIm);
            
            // Buffalo uses slightly different formula
            const newZRe = absRe * absRe - absIm * absIm - cRe;
            const newZIm = -2 * absRe * absIm + cIm;
            
            zRe = newZRe;
            zIm = newZIm;
            mag2 = zRe * zRe + zIm * zIm;
            n++;
        }
        
        result.iterations = n;
        result.finalZ.set(zRe, zIm);
        result.finalMagnitude2 = mag2;
        result.escaped = mag2 > bailout2;
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    /**
     * Celtic variant: |re²-im²| + 2|re||im|i + c
     * @private
     */
    _iterateCeltic(z0, c, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let zRe = z0.re;
        let zIm = z0.im;
        const cRe = c.re;
        const cIm = c.im;
        
        let n = 0;
        let mag2 = zRe * zRe + zIm * zIm;
        
        while (n < maxIter && mag2 <= bailout2) {
            const re2 = zRe * zRe;
            const im2 = zIm * zIm;
            
            // Celtic takes abs of the real part result
            const newZRe = Math.abs(re2 - im2) + cRe;
            const newZIm = 2 * zRe * zIm + cIm;
            
            zRe = newZRe;
            zIm = newZIm;
            mag2 = zRe * zRe + zIm * zIm;
            n++;
        }
        
        result.iterations = n;
        result.finalZ.set(zRe, zIm);
        result.finalMagnitude2 = mag2;
        result.escaped = mag2 > bailout2;
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    // =========================================================================
    // PERTURBATION (with caveats)
    // =========================================================================

    /**
     * Initialize perturbation for Burning Ship
     * 
     * Note: Perturbation for Burning Ship is more complex because
     * the absolute value function is not differentiable at zero.
     * This can cause more glitches near zero crossings.
     */
    initializePerturbation(centerX, centerY, precision = 50) {
        this._referenceCenter = new BigComplex(centerX, centerY, precision);
    }

    /**
     * Compute reference orbit for Burning Ship
     */
    computeReferenceOrbit() {
        if (!this._referenceCenter) {
            throw new Error('Perturbation not initialized');
        }
        
        this._referenceOrbit = new ReferenceOrbit({
            center: this._referenceCenter,
            maxIterations: this.params.maxIterations,
            bailout: this.params.bailout,
            precision: this._referenceCenter.precision
        });
        
        // Custom computation with abs
        this._computeBurningShipReference();
        
        return this._referenceOrbit;
    }

    /**
     * Compute Burning Ship reference orbit
     * @private
     */
    _computeBurningShipReference() {
        const ref = this._referenceOrbit;
        const C = ref.center;
        const maxIter = ref.maxIterations;
        const bailoutHP = new BigDecimal(ref.bailoutSquared, C.precision);
        
        let Z = BigComplex.zero(C.precision);
        
        ref.orbit = [];
        ref.orbitHP = [];
        ref.twoZ = [];
        ref.zMag2 = [];
        ref.length = 0;
        ref.escaped = false;
        
        // Also store signs for perturbation
        this._referenceSigns = [];
        
        for (let n = 0; n < maxIter; n++) {
            const zLP = new Complex(Z.re.toNumber(), Z.im.toNumber());
            ref.orbit.push(zLP);
            ref.orbitHP.push(Z.clone());
            
            // Store abs(2Z) for perturbation
            const absRe = Math.abs(zLP.re);
            const absIm = Math.abs(zLP.im);
            ref.twoZ.push(new Complex(2 * absRe, 2 * absIm));
            ref.zMag2.push(zLP.magnitudeSquared);
            
            // Store signs for perturbation correction
            this._referenceSigns.push({
                reSign: zLP.re >= 0 ? 1 : -1,
                imSign: zLP.im >= 0 ? 1 : -1
            });
            
            ref.length++;
            
            if (Z.magnitudeSquared().gt(bailoutHP)) {
                ref.escaped = true;
                ref.escapeIteration = n;
                break;
            }
            
            // Burning Ship iteration: z = (|re| + i|im|)² + c
            const absZ = new BigComplex(Z.re.abs(), Z.im.abs(), C.precision);
            Z = absZ.square().add(C);
        }
        
        ref.computed = true;
    }

    /**
     * Iterate using Burning Ship perturbation
     * 
     * This is approximate due to the discontinuity of abs().
     * More glitches are expected compared to standard Mandelbrot.
     */
    iteratePerturbation(deltaC, params = this.params) {
        if (!this._referenceOrbit?.computed) {
            this.computeReferenceOrbit();
        }
        
        // For Burning Ship, perturbation is more complex
        // Fall back to standard iteration for now with large delta
        // A proper implementation would track sign changes
        
        if (deltaC.magnitude > 1e-10) {
            // Direct iteration for larger deltas
            const c = new Complex(
                this._referenceCenter.re.toNumber() + deltaC.re,
                this._referenceCenter.im.toNumber() + deltaC.im
            );
            return this.iterate(new Complex(0, 0), c, params);
        }
        
        // Try perturbation for very small deltas
        return this._perturbationIterate(deltaC, params);
    }

    /**
     * Actual perturbation iteration (experimental)
     * @private
     */
    _perturbationIterate(deltaC, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        const ref = this._referenceOrbit;
        
        let delta = deltaC.clone();
        let n = 0;
        
        while (n < maxIter && n < ref.length) {
            const Z = ref.getZ(n);
            const signs = this._referenceSigns[n];
            
            // Full z = Z + δ
            const zRe = Z.re + delta.re;
            const zIm = Z.im + delta.im;
            const mag2 = zRe * zRe + zIm * zIm;
            
            if (mag2 > bailout2) {
                result.escaped = true;
                result.finalZ.set(zRe, zIm);
                result.finalMagnitude2 = mag2;
                break;
            }
            
            // Check for sign mismatch (glitch condition)
            const newReSign = zRe >= 0 ? 1 : -1;
            const newImSign = zIm >= 0 ? 1 : -1;
            
            if (newReSign !== signs.reSign || newImSign !== signs.imSign) {
                // Sign mismatch - fall back to standard
                return this.iterate(new Complex(0, 0), 
                    new Complex(
                        this._referenceCenter.re.toNumber() + deltaC.re,
                        this._referenceCenter.im.toNumber() + deltaC.im
                    ), 
                    params);
            }
            
            // Approximate perturbation for Burning Ship
            // This is a simplification and may not be accurate
            const twoAbsZ = ref.getTwoZ(n);
            const twoZDeltaRe = twoAbsZ.re * delta.re * signs.reSign;
            const twoZDeltaIm = twoAbsZ.im * delta.im * signs.imSign;
            
            // This is approximate - proper BS perturbation is more complex
            delta.re = twoZDeltaRe - 2 * Math.abs(Z.im) * delta.im * signs.imSign + deltaC.re;
            delta.im = twoAbsZ.re * delta.im * signs.reSign + twoAbsZ.im * delta.re * signs.reSign + deltaC.im;
            
            n++;
        }
        
        result.iterations = n;
        result.perturbationUsed = true;
        
        if (!result.escaped) {
            const Z = ref.getZ(Math.min(n, ref.length - 1));
            result.finalZ.set(Z.re + delta.re, Z.im + delta.im);
            result.finalMagnitude2 = result.finalZ.magnitudeSquared;
        }
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    // =========================================================================
    // ARBITRARY PRECISION
    // =========================================================================

    iterateArbitrary(z0, c, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout = new BigDecimal(params.bailoutSquared, c.precision);
        
        let z = z0.clone();
        let n = 0;
        
        while (n < maxIter) {
            if (z.magnitudeSquared().gt(bailout)) {
                result.escaped = true;
                break;
            }
            
            // z = (|re| + i|im|)² + c
            const absZ = new BigComplex(z.re.abs(), z.im.abs(), c.precision);
            z = absZ.square().add(c);
            n++;
        }
        
        result.iterations = n;
        const zDouble = z.toComplex();
        result.finalZ.set(zDouble.re, zDouble.im);
        result.finalMagnitude2 = result.finalZ.magnitudeSquared;
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, result.finalZ, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    dispose() {
        super.dispose();
        this._referenceOrbit = null;
        this._referenceSigns = null;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { BurningShipVariant };
export default BurningShip;
