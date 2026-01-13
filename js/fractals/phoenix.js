/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                      ABYSS EXPLORER - PHOENIX FRACTAL                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Phoenix fractal - Mandelbrot variant with history dependence                 ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Phoenix fractal introduces a term depending on the previous iterate:     ║
 * ║                                                                                ║
 * ║    z₀ = c (or pixel for Julia mode)                                           ║
 * ║    z_{-1} = 0                                                                  ║
 * ║    z_{n+1} = z_n² + Re(c) + Im(c)·z_{n-1}                                     ║
 * ║                                                                                ║
 * ║  Alternative formulation (more general):                                       ║
 * ║    z_{n+1} = z_n² + c + p·z_{n-1}                                             ║
 * ║                                                                                ║
 * ║  where p is a complex "phoenix parameter"                                     ║
 * ║                                                                                ║
 * ║  History:                                                                      ║
 * ║  Discovered by Shigehiro Ushiki in 1988. Named "Phoenix" because the          ║
 * ║  images often resemble a bird rising from flames.                             ║
 * ║                                                                                ║
 * ║  Properties:                                                                   ║
 * ║  - Has memory: current value depends on TWO previous values                   ║
 * ║  - Creates distinctive feather-like patterns                                  ║
 * ║  - The parameter p controls the "memory strength"                             ║
 * ║  - When p = 0, reduces to standard Mandelbrot                                 ║
 * ║                                                                                ║
 * ║  Variants:                                                                     ║
 * ║  - Standard Phoenix: p is real                                                ║
 * ║  - Complex Phoenix: p is complex                                              ║
 * ║  - Phoenix Julia: fixed c, varying starting point                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, CONSTANTS } from '../math/complex.js';
import { BigDecimal, BigComplex } from '../math/arbitrary-precision.js';
import { FractalBase, IterationResult, FractalParams } from './fractal-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// PHOENIX PRESETS
// =============================================================================

/**
 * Preset Phoenix parameters that produce interesting results
 */
export const PhoenixPresets = {
    /** Classic Phoenix from Ushiki's original paper */
    classic: { c: new Complex(0.5667, 0), p: new Complex(-0.5, 0) },
    
    /** Feather-like patterns */
    feather: { c: new Complex(0.56667, 0), p: new Complex(-0.5, 0) },
    
    /** Symmetric bird shape */
    bird: { c: new Complex(0.35, 0), p: new Complex(-0.5, 0) },
    
    /** Spiral patterns */
    spiral: { c: new Complex(0.269, 0), p: new Complex(0.0065, 0) },
    
    /** Complex parameter */
    complex: { c: new Complex(-0.4, 0.1), p: new Complex(0.25, -0.25) },
    
    /** Dragon-like */
    dragon: { c: new Complex(0.5, 0.05), p: new Complex(-0.6, 0) },
    
    /** Island chains */
    islands: { c: new Complex(0.544, 0), p: new Complex(-0.48, 0) },
    
    /** Near-Mandelbrot (small p) */
    nearMandelbrot: { c: new Complex(-0.5, 0), p: new Complex(-0.1, 0) },
    
    /** Strong memory */
    strongMemory: { c: new Complex(0.3, 0), p: new Complex(-0.8, 0) },
    
    /** Seahorse valley analog */
    seahorse: { c: new Complex(0.5, 0.1), p: new Complex(-0.45, 0.1) }
};

// =============================================================================
// PHOENIX FRACTAL CLASS
// =============================================================================

/**
 * Phoenix Fractal
 * 
 * Implements the Phoenix fractal with history dependence.
 * 
 * @extends FractalBase
 */
export class Phoenix extends FractalBase {
    constructor(params = null) {
        super(params);
        
        /** @type {Complex} Phoenix parameter p */
        this.phoenixP = new Complex(-0.5, 0);
        
        /** @type {Complex} Parameter c (for Julia mode or Mandelbrot additive) */
        this.phoenixC = new Complex(0.5667, 0);
        
        /** @type {boolean} Use original Ushiki formulation */
        this.ushikiMode = true;
        
        /** @type {boolean} Julia mode (fixed c, varying start) */
        this.juliaMode = false;
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'phoenix';
    }

    getName() {
        return 'Phoenix Fractal';
    }

    getDescription() {
        return 'Phoenix fractal: z² + c + p·z_{n-1}. Features history dependence ' +
               'creating distinctive feather and bird-like patterns.';
    }

    getFormula() {
        return 'z_{n+1} = z_n^2 + c + p \\cdot z_{n-1}';
    }

    getDefaultParams() {
        return {
            maxIterations: 500,
            bailout: 2,
            power: 2,
            smoothColoring: true,
            phoenixP: { re: -0.5, im: 0 },
            phoenixC: { re: 0.5667, im: 0 }
        };
    }

    getDefaultView() {
        return {
            centerX: 0,
            centerY: 0,
            zoom: 1.5
        };
    }

    getExtraParams() {
        return [
            {
                name: 'phoenixP_re',
                type: 'number',
                default: -0.5,
                min: -2,
                max: 2,
                description: 'Phoenix parameter p (real part)'
            },
            {
                name: 'phoenixP_im',
                type: 'number',
                default: 0,
                min: -2,
                max: 2,
                description: 'Phoenix parameter p (imaginary part)'
            },
            {
                name: 'phoenixC_re',
                type: 'number',
                default: 0.5667,
                min: -2,
                max: 2,
                description: 'Parameter c (real part)'
            },
            {
                name: 'phoenixC_im',
                type: 'number',
                default: 0,
                min: -2,
                max: 2,
                description: 'Parameter c (imaginary part)'
            },
            {
                name: 'ushikiMode',
                type: 'boolean',
                default: true,
                description: 'Use Ushiki original formulation'
            },
            {
                name: 'juliaMode',
                type: 'boolean',
                default: false,
                description: 'Julia mode (fixed c)'
            }
        ];
    }

    supportsPerturbation() {
        return false; // History dependence complicates perturbation
    }

    supportsSeriesApproximation() {
        return false;
    }

    supportsArbitraryPrecision() {
        return true;
    }

    hasInterior() {
        return true;
    }

    // =========================================================================
    // PARAMETER MANAGEMENT
    // =========================================================================

    /**
     * Set Phoenix parameter p
     * @param {number} re
     * @param {number} [im=0]
     */
    setPhoenixP(re, im = 0) {
        if (re instanceof Complex) {
            this.phoenixP = re.clone();
        } else {
            this.phoenixP = new Complex(re, im);
        }
    }

    /**
     * Set parameter c
     * @param {number} re
     * @param {number} [im=0]
     */
    setPhoenixC(re, im = 0) {
        if (re instanceof Complex) {
            this.phoenixC = re.clone();
        } else {
            this.phoenixC = new Complex(re, im);
        }
    }

    /**
     * Apply a preset
     * @param {string} presetName
     */
    setPreset(presetName) {
        if (presetName in PhoenixPresets) {
            const preset = PhoenixPresets[presetName];
            this.phoenixC = preset.c.clone();
            this.phoenixP = preset.p.clone();
        }
    }

    /**
     * Get available presets
     * @returns {string[]}
     */
    getPresets() {
        return Object.keys(PhoenixPresets);
    }

    // =========================================================================
    // STANDARD ITERATION
    // =========================================================================

    /**
     * Phoenix iteration
     * 
     * Ushiki's original formulation:
     *   z_{n+1} = z_n² + Re(c) + Im(c)·z_{n-1}
     * 
     * General formulation:
     *   z_{n+1} = z_n² + c + p·z_{n-1}
     * 
     * @param {Complex} z0 - Starting point (pixel for Mandelbrot mode)
     * @param {Complex} c - Parameter c (pixel for Julia mode)
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        // Determine c and p based on mode
        let cVal, pVal;
        
        if (this.ushikiMode) {
            // Ushiki mode: c is complex, p comes from Im(c)
            if (this.juliaMode) {
                cVal = this.phoenixC.re;
                pVal = new Complex(this.phoenixC.im, 0);
            } else {
                cVal = c.re;
                pVal = new Complex(c.im, 0);
            }
        } else {
            // General mode: separate c and p
            cVal = this.phoenixC;
            pVal = this.phoenixP;
        }
        
        // Initialize
        let zRe, zIm;
        if (this.juliaMode) {
            // Julia mode: start at pixel, c is fixed
            zRe = z0.re;
            zIm = z0.im;
        } else {
            // Mandelbrot mode: start at c (pixel)
            zRe = c.re;
            zIm = c.im;
        }
        
        // Previous z (starts at 0)
        let prevRe = 0;
        let prevIm = 0;
        
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
             * Phoenix iteration:
             * z_{n+1} = z_n² + c + p·z_{n-1}
             * 
             * z² = (re + im·i)² = re² - im² + 2·re·im·i
             * p·prev = (p_re + p_im·i)(prev_re + prev_im·i)
             *        = (p_re·prev_re - p_im·prev_im) + (p_re·prev_im + p_im·prev_re)·i
             */
            const z2Re = zRe * zRe - zIm * zIm;
            const z2Im = 2 * zRe * zIm;
            
            let newZRe, newZIm;
            
            if (this.ushikiMode) {
                // Ushiki: z² + c_re + c_im·z_{n-1} (p is real = c_im)
                const pReal = typeof pVal === 'number' ? pVal : pVal.re;
                newZRe = z2Re + (typeof cVal === 'number' ? cVal : cVal.re) + pReal * prevRe;
                newZIm = z2Im + pReal * prevIm;
            } else {
                // General: z² + c + p·z_{n-1}
                const pPrevRe = pVal.re * prevRe - pVal.im * prevIm;
                const pPrevIm = pVal.re * prevIm + pVal.im * prevRe;
                
                const cRe = typeof cVal === 'number' ? cVal : cVal.re;
                const cIm = typeof cVal === 'number' ? 0 : cVal.im;
                
                newZRe = z2Re + cRe + pPrevRe;
                newZIm = z2Im + cIm + pPrevIm;
            }
            
            // Update previous z
            prevRe = zRe;
            prevIm = zIm;
            
            // Update current z
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

    // =========================================================================
    // HIGHER-ORDER PHOENIX
    // =========================================================================

    /**
     * Higher-order Phoenix: z^power + c + p·z_{n-1}
     * 
     * @param {Complex} z0
     * @param {Complex} c
     * @param {number} power
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iteratePower(z0, c, power, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let z = this.juliaMode ? z0.clone() : c.clone();
        let prev = new Complex(0, 0);
        
        const cVal = this.juliaMode ? this.phoenixC : c;
        const pVal = this.phoenixP;
        
        let n = 0;
        
        while (n < maxIter) {
            const mag2 = z.magnitudeSquared;
            if (mag2 > bailout2) {
                result.escaped = true;
                break;
            }
            
            // z^power + c + p·prev
            const zPow = z.pow(power);
            const pPrev = pVal.mul(prev);
            const newZ = zPow.add(cVal).add(pPrev);
            
            prev = z;
            z = newZ;
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
    // DUAL PHOENIX (multiple history terms)
    // =========================================================================

    /**
     * Dual Phoenix: z² + c + p₁·z_{n-1} + p₂·z_{n-2}
     * 
     * Has even deeper memory, creating more complex patterns.
     * 
     * @param {Complex} z0
     * @param {Complex} c
     * @param {Complex} p1 - First history coefficient
     * @param {Complex} p2 - Second history coefficient
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateDual(z0, c, p1, p2, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let z = this.juliaMode ? z0.clone() : c.clone();
        let prev1 = new Complex(0, 0);  // z_{n-1}
        let prev2 = new Complex(0, 0);  // z_{n-2}
        
        const cVal = this.juliaMode ? this.phoenixC : c;
        
        let n = 0;
        
        while (n < maxIter) {
            const mag2 = z.magnitudeSquared;
            if (mag2 > bailout2) {
                result.escaped = true;
                break;
            }
            
            // z² + c + p1·z_{n-1} + p2·z_{n-2}
            const z2 = z.square();
            const p1Prev1 = p1.mul(prev1);
            const p2Prev2 = p2.mul(prev2);
            const newZ = z2.add(cVal).add(p1Prev1).add(p2Prev2);
            
            // Shift history
            prev2 = prev1;
            prev1 = z;
            z = newZ;
            
            n++;
        }
        
        result.iterations = n;
        result.finalZ = z;
        result.finalMagnitude2 = z.magnitudeSquared;
        result.escaped = n < maxIter;
        
        if (result.escaped && params.smoothColoring) {
            result.smooth = this.calculateSmoothIterations(n, z, 2, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    // =========================================================================
    // ARBITRARY PRECISION
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
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const precision = z0.precision;
        const bailout = new BigDecimal(params.bailoutSquared, precision);
        
        // Convert parameters to high precision
        const pHP = new BigComplex(
            this.phoenixP.re.toString(),
            this.phoenixP.im.toString(),
            precision
        );
        
        const cHP = this.juliaMode 
            ? new BigComplex(this.phoenixC.re.toString(), this.phoenixC.im.toString(), precision)
            : c;
        
        let z = this.juliaMode ? z0.clone() : c.clone();
        let prev = BigComplex.zero(precision);
        
        let n = 0;
        
        while (n < maxIter) {
            if (z.magnitudeSquared().gt(bailout)) {
                result.escaped = true;
                break;
            }
            
            // z² + c + p·prev
            const z2 = z.square();
            const pPrev = pHP.mul(prev);
            const newZ = z2.add(cHP).add(pPrev);
            
            prev = z;
            z = newZ;
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
}

// =============================================================================
// EXPORTS
// =============================================================================

export { PhoenixPresets };
export default Phoenix;
