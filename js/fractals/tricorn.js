/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ABYSS EXPLORER - TRICORN (MANDELBAR)                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  The Tricorn fractal, also known as Mandelbar                                 ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Tricorn is defined using the complex conjugate:                          ║
 * ║                                                                                ║
 * ║    z₀ = 0                                                                      ║
 * ║    z_{n+1} = conj(z_n)² + c                                                   ║
 * ║            = (re_n - im_n·i)² + c                                             ║
 * ║            = (re_n² - im_n²) - 2·re_n·im_n·i + c                              ║
 * ║                                                                                ║
 * ║  Note the minus sign in the imaginary part (vs plus in Mandelbrot).          ║
 * ║                                                                                ║
 * ║  Properties:                                                                   ║
 * ║  - Has 3-fold symmetry (hence "tricorn")                                      ║
 * ║  - The main body resembles a three-lobed shape                                ║
 * ║  - Also called "Mandelbar" because bar(z) = conjugate(z)                      ║
 * ║  - Contains interesting "seahorse valley" analogs                             ║
 * ║                                                                                ║
 * ║  Relationship to Anti-holomorphic Maps:                                       ║
 * ║  f(z) = z̄² + c is anti-holomorphic (involves complex conjugation)            ║
 * ║  This breaks the conformal (angle-preserving) property of Mandelbrot          ║
 * ║                                                                                ║
 * ║  Multicorn Generalization:                                                     ║
 * ║  z_{n+1} = conj(z_n)^p + c gives "multicorns" with p-fold symmetry           ║
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
// TRICORN CLASS
// =============================================================================

/**
 * Tricorn (Mandelbar) Fractal
 * 
 * Implements the Tricorn: z = conj(z)² + c
 * 
 * @extends FractalBase
 */
export class Tricorn extends FractalBase {
    constructor(params = null) {
        super(params);
        
        /** @type {number} Power for multicorn generalization */
        this.power = 2;
        
        /** @type {ReferenceOrbit|null} */
        this._referenceOrbit = null;
        
        /** @type {BigComplex|null} */
        this._referenceCenter = null;
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'tricorn';
    }

    getName() {
        return 'Tricorn (Mandelbar)';
    }

    getDescription() {
        return 'The Tricorn fractal: conj(z)² + c. Also known as Mandelbar. ' +
               'Features distinctive three-fold symmetry and horn-like structures.';
    }

    getFormula() {
        return 'z_{n+1} = \\overline{z_n}^2 + c';
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
            centerX: -0.3,
            centerY: 0,
            zoom: 1.5
        };
    }

    getExtraParams() {
        return [
            {
                name: 'power',
                type: 'number',
                default: 2,
                min: 2,
                max: 10,
                description: 'Power for multicorn (p-fold symmetry)'
            }
        ];
    }

    supportsPerturbation() {
        return true;
    }

    supportsSeriesApproximation() {
        return false; // Conjugate makes it complex
    }

    supportsArbitraryPrecision() {
        return true;
    }

    hasInterior() {
        return true;
    }

    // =========================================================================
    // POWER SETTING
    // =========================================================================

    /**
     * Set the power for multicorn
     * @param {number} p
     */
    setPower(p) {
        this.power = Math.max(2, Math.round(p));
        this.params.power = this.power;
        this._referenceOrbit = null;
    }

    // =========================================================================
    // STANDARD ITERATION
    // =========================================================================

    /**
     * Standard Tricorn iteration
     * 
     * The iteration z = conj(z)² + c is computed as:
     *   conj(z) = re - im·i
     *   conj(z)² = (re - im·i)² = (re² - im²) - 2·re·im·i
     *   z_{n+1} = (re² - im²) + c_re + (−2·re·im + c_im)·i
     * 
     * @param {Complex} z0
     * @param {Complex} c
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        if (this.power !== 2) {
            return this._iterateMulticorn(z0, c, params);
        }
        
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let zRe = z0.re;
        let zIm = z0.im;
        const cRe = c.re;
        const cIm = c.im;
        
        // For derivative (distance estimation)
        // d(conj(z)²)/dz = 2·conj(z)·d(conj(z))/dz = 2·conj(z)·(-conj(dz/dz)) = -2·conj(z)
        // This is more complex for tricorn
        let dzRe = 1;
        let dzIm = 0;
        const computeDE = params.distanceEstimate;
        
        // For orbit trap
        let minTrapDist = Infinity;
        const computeTrap = params.orbitTrap;
        
        // For stripe average
        let stripeSum = 0;
        const computeStripe = params.stripeAverage;
        const stripeDensity = params.stripeDensity;
        
        let n = 0;
        let mag2 = zRe * zRe + zIm * zIm;
        
        while (n < maxIter && mag2 <= bailout2) {
            // Derivative for Tricorn
            // f(z) = conj(z)² + c is anti-holomorphic
            // Using |f'| approximation
            if (computeDE) {
                const newDzRe = 2 * (zRe * dzRe + zIm * dzIm);
                const newDzIm = 2 * (-zRe * dzIm + zIm * dzRe);
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
            
            // Stripe average
            if (computeStripe) {
                const angle = Math.atan2(zIm, zRe);
                stripeSum += 0.5 * Math.sin(stripeDensity * angle) + 0.5;
            }
            
            /**
             * Tricorn iteration:
             * z = conj(z)² + c = (re - im·i)² + c
             *   = re² - 2·re·im·i + im²·i² + c
             *   = re² - im² - 2·re·im·i + c
             *   = (re² - im² + c_re) + (-2·re·im + c_im)·i
             * 
             * Note: imaginary part has MINUS sign (vs plus in Mandelbrot)
             */
            const re2 = zRe * zRe;
            const im2 = zIm * zIm;
            const newZRe = re2 - im2 + cRe;
            const newZIm = -2 * zRe * zIm + cIm;  // Note: negative!
            
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
        
        // Stripe average
        if (computeStripe && n > 0) {
            result.stripeAverage = stripeSum / n;
        }
        
        result.angle = Math.atan2(zIm, zRe);
        
        return result;
    }

    /**
     * Multicorn iteration for power > 2
     * 
     * z_{n+1} = conj(z_n)^p + c
     * 
     * @private
     */
    _iterateMulticorn(z0, c, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        const power = this.power;
        
        let z = z0.clone();
        let n = 0;
        
        while (n < maxIter) {
            const mag2 = z.magnitudeSquared;
            if (mag2 > bailout2) {
                result.escaped = true;
                break;
            }
            
            // z = conj(z)^power + c
            const conjZ = z.conj();
            z = conjZ.pow(power).add(c);
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
    // PERTURBATION FOR TRICORN
    // =========================================================================

    /**
     * Initialize perturbation
     */
    initializePerturbation(centerX, centerY, precision = 50) {
        this._referenceCenter = new BigComplex(centerX, centerY, precision);
    }

    /**
     * Compute reference orbit for Tricorn
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
        
        this._computeTricornReference();
        
        return this._referenceOrbit;
    }

    /**
     * Compute Tricorn reference orbit
     * @private
     */
    _computeTricornReference() {
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
        
        for (let n = 0; n < maxIter; n++) {
            const zLP = new Complex(Z.re.toNumber(), Z.im.toNumber());
            ref.orbit.push(zLP);
            ref.orbitHP.push(Z.clone());
            
            // For Tricorn, we need 2·conj(Z) not 2·Z
            // twoConjZ = 2·(re - im·i) = 2re - 2im·i
            ref.twoZ.push(new Complex(2 * zLP.re, -2 * zLP.im));
            ref.zMag2.push(zLP.magnitudeSquared);
            
            ref.length++;
            
            if (Z.magnitudeSquared().gt(bailoutHP)) {
                ref.escaped = true;
                ref.escapeIteration = n;
                break;
            }
            
            // Tricorn: Z = conj(Z)² + C
            const conjZ = Z.conj();
            Z = conjZ.square().add(C);
        }
        
        ref.computed = true;
    }

    /**
     * Iterate using Tricorn perturbation
     * 
     * For Tricorn: z = conj(z)² + c
     * Let z = Z + δ, c = C + δc
     * 
     * conj(z) = conj(Z) + conj(δ)
     * conj(z)² = conj(Z)² + 2·conj(Z)·conj(δ) + conj(δ)²
     * 
     * z_{n+1} = conj(Z)² + C + 2·conj(Z_n)·conj(δ_n) + conj(δ_n)² + δc
     *         = Z_{n+1} + 2·conj(Z_n)·conj(δ_n) + conj(δ_n)² + δc
     * 
     * So: δ_{n+1} = 2·conj(Z_n)·conj(δ_n) + conj(δ_n)² + δc
     *             = conj(2·Z_n·δ_n + δ_n²) + δc
     */
    iteratePerturbation(deltaC, params = this.params) {
        if (!this._referenceOrbit?.computed) {
            this.computeReferenceOrbit();
        }
        
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        const ref = this._referenceOrbit;
        
        let delta = new Complex(0, 0);
        let n = 0;
        
        while (n < maxIter && n < ref.length) {
            const Z = ref.getZ(n);
            const twoConjZ = ref.getTwoZ(n); // This is 2·conj(Z)
            
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
            
            // Glitch detection
            const deltaMag2 = delta.magnitudeSquared;
            const zMag2 = ref.getZMag2(n);
            
            if (zMag2 > 0 && deltaMag2 > 1e-8 * zMag2) {
                result.glitched = true;
                // Fall back to standard
                const c = new Complex(
                    this._referenceCenter.re.toNumber() + deltaC.re,
                    this._referenceCenter.im.toNumber() + deltaC.im
                );
                return this.iterate(new Complex(0, 0), c, params);
            }
            
            /**
             * Tricorn perturbation:
             * δ_{n+1} = 2·conj(Z_n)·conj(δ_n) + conj(δ_n)² + δc
             * 
             * Let δ_n = a + bi, conj(δ_n) = a - bi
             * Let conj(Z_n) = x - yi (from twoConjZ/2)
             * 
             * 2·conj(Z_n)·conj(δ_n) = 2(x-yi)(a-bi) = 2(xa - xbi - yai + ybi²)
             *                       = 2(xa - yb) + 2(-xb - ya)i
             *                       = 2(xa - yb) - 2(xb + ya)i
             * 
             * conj(δ_n)² = (a-bi)² = a² - 2abi + b²i² = (a² - b²) - 2abi
             * 
             * δ_{n+1} = (2(xa - yb) + a² - b² + δc_re) + (-2(xb + ya) - 2ab + δc_im)i
             */
            const a = delta.re;
            const b = delta.im;
            const x = twoConjZ.re / 2;  // conj(Z).re = Z.re
            const y = -twoConjZ.im / 2; // conj(Z).im = -Z.im
            
            const twoConjZConjDelta_re = 2 * (x * a - (-y) * (-b));  // 2(xa - yb) where y from conj
            const twoConjZConjDelta_im = 2 * (x * (-b) + (-y) * a);  // 2(-xb - ya)
            
            const conjDeltaSq_re = a * a - b * b;
            const conjDeltaSq_im = -2 * a * b;
            
            delta.re = twoConjZConjDelta_re + conjDeltaSq_re + deltaC.re;
            delta.im = twoConjZConjDelta_im + conjDeltaSq_im + deltaC.im;
            
            n++;
        }
        
        result.iterations = n;
        result.perturbationUsed = true;
        
        if (!result.escaped) {
            const Z = ref.getZ(Math.min(n, ref.length - 1));
            if (Z) {
                result.finalZ.set(Z.re + delta.re, Z.im + delta.im);
                result.finalMagnitude2 = result.finalZ.magnitudeSquared;
            }
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
            
            // z = conj(z)² + c
            const conjZ = z.conj();
            z = conjZ.square().add(c);
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
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Tricorn;
