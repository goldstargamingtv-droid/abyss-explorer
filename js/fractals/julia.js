/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                     ABYSS EXPLORER - JULIA SETS                               ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Julia sets for z² + c with fixed c parameter                                 ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  For a fixed complex number c, the Julia set J_c is defined as the           ║
 * ║  boundary of the set of points z₀ for which the iteration z² + c             ║
 * ║  remains bounded.                                                              ║
 * ║                                                                                ║
 * ║  Iteration:                                                                    ║
 * ║    z₀ = point (the starting point varies)                                     ║
 * ║    z_{n+1} = z_n² + c  (c is fixed)                                           ║
 * ║                                                                                ║
 * ║  Relationship to Mandelbrot:                                                   ║
 * ║  - Each point c in the Mandelbrot set corresponds to a connected Julia set   ║
 * ║  - Points outside Mandelbrot give totally disconnected Julia sets ("dust")   ║
 * ║  - The Mandelbrot set is the "index" of all Julia sets                        ║
 * ║                                                                                ║
 * ║  Famous Julia Sets:                                                            ║
 * ║  - c = -0.4 + 0.6i      (Douady rabbit)                                       ║
 * ║  - c = -0.835 - 0.2321i (Complex structure)                                   ║
 * ║  - c = -0.8 + 0.156i    (Dendrite)                                            ║
 * ║  - c = 0.285 + 0.01i    (Near period-2 bulb)                                  ║
 * ║  - c = -0.7269 + 0.1889i (Siegel disk)                                        ║
 * ║  - c = -1               (Basilica - period 2)                                 ║
 * ║  - c = i                (Dendrite)                                            ║
 * ║                                                                                ║
 * ║  This implementation supports:                                                 ║
 * ║  - Standard double-precision iteration                                        ║
 * ║  - Dynamic c parameter selection                                              ║
 * ║  - Perturbation theory (reference orbit at z=0)                              ║
 * ║  - Arbitrary precision for deep zooms                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, CONSTANTS } from '../math/complex.js';
import { BigDecimal, BigComplex, PrecisionManager } from '../math/arbitrary-precision.js';
import { ReferenceOrbit, PerturbationIterator } from '../math/perturbation.js';
import { FractalBase, IterationResult, FractalParams } from './fractal-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// FAMOUS JULIA SEEDS
// =============================================================================

/**
 * Collection of famous and beautiful Julia set parameters
 */
export const JuliaSeeds = {
    // Classic shapes
    douadyRabbit: new Complex(-0.123, 0.745),
    dendrite: new Complex(0, 1),
    basilica: new Complex(-1, 0),
    siegel: new Complex(-0.390541, -0.586788),
    sanMarco: new Complex(-0.75, 0),
    
    // Spirals
    spiral1: new Complex(0.285, 0.01),
    spiral2: new Complex(-0.835, -0.2321),
    spiral3: new Complex(-0.8, 0.156),
    
    // Near main cardioid
    nearCardioid1: new Complex(-0.4, 0.6),
    nearCardioid2: new Complex(-0.391, -0.587),
    
    // Complex structures
    complex1: new Complex(-0.7269, 0.1889),
    complex2: new Complex(0.355, 0.355),
    complex3: new Complex(-0.54, 0.54),
    
    // Snowflakes
    snowflake: new Complex(-0.1, 0.651),
    
    // Whiskers
    whiskers: new Complex(-0.481762, -0.531657),
    
    // Galaxy
    galaxy: new Complex(-0.74543, 0.11301),
    
    // Electric
    electric: new Complex(-0.22, -0.75),
    
    // Starfish
    starfish: new Complex(-0.55, 0.64),
    
    // Dragon
    dragon: new Complex(-0.8, 0.156)
};

// =============================================================================
// JULIA SET CLASS
// =============================================================================

/**
 * Julia Set Fractal
 * 
 * Implements Julia sets z² + c with fixed c parameter.
 * 
 * @extends FractalBase
 */
export class Julia extends FractalBase {
    /**
     * Create Julia set
     * @param {FractalParams} [params]
     * @param {Complex} [juliaC] - The c parameter
     */
    constructor(params = null, juliaC = null) {
        super(params);
        
        // Set Julia c parameter
        if (juliaC) {
            this.params.juliaC = juliaC;
        } else if (!this.params.juliaC) {
            this.params.juliaC = JuliaSeeds.douadyRabbit.clone();
        }
        this.params.juliaMode = true;
        
        /** @type {ReferenceOrbit|null} */
        this._referenceOrbit = null;
        
        /** @type {PerturbationIterator|null} */
        this._perturbationIterator = null;
        
        /** @type {BigComplex|null} */
        this._juliaC_HP = null;
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'julia';
    }

    getName() {
        return 'Julia Set';
    }

    getDescription() {
        return 'Julia sets for z² + c. Each point in the Mandelbrot set corresponds ' +
               'to a unique Julia set. Explore the infinite variety by changing c.';
    }

    getFormula() {
        return 'z_{n+1} = z_n^2 + c \\quad (c \\text{ fixed})';
    }

    getDefaultParams() {
        return {
            maxIterations: 500,
            bailout: 2,
            power: 2,
            smoothColoring: true,
            juliaC: JuliaSeeds.douadyRabbit.clone(),
            juliaMode: true
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
                name: 'juliaC_re',
                type: 'number',
                default: -0.123,
                min: -2,
                max: 2,
                description: 'Real part of c parameter'
            },
            {
                name: 'juliaC_im',
                type: 'number',
                default: 0.745,
                min: -2,
                max: 2,
                description: 'Imaginary part of c parameter'
            }
        ];
    }

    supportsPerturbation() {
        return true;
    }

    supportsSeriesApproximation() {
        return false; // Julia series approx is more complex
    }

    supportsArbitraryPrecision() {
        return true;
    }

    hasInterior() {
        return true;
    }

    // =========================================================================
    // JULIA C PARAMETER MANAGEMENT
    // =========================================================================

    /**
     * Set the Julia c parameter
     * @param {Complex|number} re
     * @param {number} [im]
     */
    setJuliaC(re, im) {
        if (re instanceof Complex) {
            this.params.juliaC = re.clone();
        } else {
            this.params.juliaC = new Complex(re, im || 0);
        }
        
        // Invalidate perturbation cache
        this._referenceOrbit = null;
        this._perturbationIterator = null;
    }

    /**
     * Get current Julia c parameter
     * @returns {Complex}
     */
    getJuliaC() {
        return this.params.juliaC;
    }

    /**
     * Set Julia c from a preset name
     * @param {string} presetName
     */
    setPreset(presetName) {
        if (presetName in JuliaSeeds) {
            this.setJuliaC(JuliaSeeds[presetName]);
        }
    }

    /**
     * Get list of available presets
     * @returns {string[]}
     */
    getPresets() {
        return Object.keys(JuliaSeeds);
    }

    // =========================================================================
    // STANDARD DOUBLE-PRECISION ITERATION
    // =========================================================================

    /**
     * Standard Julia iteration
     * 
     * Unlike Mandelbrot where z₀ = 0 and c varies,
     * in Julia z₀ = point and c is fixed.
     * 
     * @param {Complex} z0 - Starting point (the pixel location)
     * @param {Complex} c - The fixed c parameter
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        // Use Julia c if in Julia mode
        const juliaC = params.juliaC || c;
        const cRe = juliaC.re;
        const cIm = juliaC.im;
        
        // Initialize z with the point
        let zRe = z0.re;
        let zIm = z0.im;
        
        // For distance estimation
        let dzRe = 1;
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
            // Distance estimate derivative: dz' = 2·z·dz'
            if (computeDE) {
                const newDzRe = 2 * (zRe * dzRe - zIm * dzIm);
                const newDzIm = 2 * (zRe * dzIm + zIm * dzRe);
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
                    trapPoint = new Complex(zRe, zIm);
                }
            }
            
            // Stripe average
            if (computeStripe) {
                const angle = Math.atan2(zIm, zRe);
                stripeSum += 0.5 * Math.sin(stripeDensity * angle) + 0.5;
            }
            
            // Core iteration: z = z² + c
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
        
        // Stripe average
        if (computeStripe && n > 0) {
            result.stripeAverage = stripeSum / n;
        }
        
        result.angle = Math.atan2(zIm, zRe);
        
        return result;
    }

    // =========================================================================
    // PERTURBATION THEORY FOR JULIA
    // =========================================================================

    /**
     * Initialize perturbation for Julia set
     * 
     * For Julia sets, the reference orbit starts at z₀ = center point
     * rather than z₀ = 0 (as in Mandelbrot).
     * 
     * @param {string} centerX - View center X
     * @param {string} centerY - View center Y
     * @param {number} precision
     */
    initializePerturbation(centerX, centerY, precision = 50) {
        this.logger.info('Initializing Julia perturbation');
        
        // Create high-precision center (starting z)
        this._referenceCenter = new BigComplex(centerX, centerY, precision);
        
        // High-precision c
        this._juliaC_HP = new BigComplex(
            this.params.juliaC.re.toString(),
            this.params.juliaC.im.toString(),
            precision
        );
    }

    /**
     * Compute reference orbit for Julia perturbation
     * 
     * For Julia, the reference orbit is:
     *   Z₀ = view center
     *   Z_{n+1} = Z_n² + c
     * 
     * @returns {ReferenceOrbit}
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
        
        // Custom computation for Julia (uses fixed c)
        this._computeJuliaReference();
        
        // Create perturbation iterator
        this._perturbationIterator = new PerturbationIterator(
            this._referenceOrbit,
            this.params.bailout
        );
        
        return this._referenceOrbit;
    }

    /**
     * Compute Julia reference orbit (custom version)
     * @private
     */
    _computeJuliaReference() {
        const ref = this._referenceOrbit;
        const c = this._juliaC_HP;
        const maxIter = ref.maxIterations;
        const bailoutHP = new BigDecimal(ref.bailoutSquared, c.precision);
        
        // Start at view center
        let Z = ref.center.clone();
        
        ref.orbit = [];
        ref.orbitHP = [];
        ref.twoZ = [];
        ref.zMag2 = [];
        ref.length = 0;
        ref.escaped = false;
        
        for (let n = 0; n < maxIter; n++) {
            // Store current Z
            const zLP = new Complex(Z.re.toNumber(), Z.im.toNumber());
            ref.orbit.push(zLP);
            ref.orbitHP.push(Z.clone());
            ref.twoZ.push(new Complex(zLP.re * 2, zLP.im * 2));
            ref.zMag2.push(zLP.magnitudeSquared);
            ref.length++;
            
            if (Z.escaped(bailoutHP)) {
                ref.escaped = true;
                ref.escapeIteration = n;
                break;
            }
            
            // Z = Z² + c (fixed c for Julia)
            Z = Z.square().add(c);
        }
        
        ref.computed = true;
    }

    /**
     * Iterate using Julia perturbation
     * 
     * For Julia perturbation:
     *   δ_{n+1} = 2·Z_n·δ_n + δ_n² + 0
     * 
     * Note: No δc term because c is fixed!
     * 
     * @param {Complex} deltaZ0 - Offset from reference center (starting point offset)
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iteratePerturbation(deltaZ0, params = this.params) {
        if (!this._referenceOrbit?.computed) {
            this.computeReferenceOrbit();
        }
        
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        const ref = this._referenceOrbit;
        
        let delta = deltaZ0.clone();
        let n = 0;
        
        while (n < maxIter && n < ref.length) {
            const Z = ref.getZ(n);
            const twoZ = ref.getTwoZ(n);
            
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
                // Glitch - fall back to standard iteration
                return this._fallbackIterate(new Complex(zRe, zIm), n, params);
            }
            
            // Perturbation: δ_{n+1} = 2·Z_n·δ_n + δ_n²
            // (no δc term for Julia)
            const twoZDeltaRe = twoZ.re * delta.re - twoZ.im * delta.im;
            const twoZDeltaIm = twoZ.re * delta.im + twoZ.im * delta.re;
            const deltaSqRe = delta.re * delta.re - delta.im * delta.im;
            const deltaSqIm = 2 * delta.re * delta.im;
            
            delta.re = twoZDeltaRe + deltaSqRe;
            delta.im = twoZDeltaIm + deltaSqIm;
            
            n++;
        }
        
        result.iterations = n;
        result.perturbationUsed = true;
        
        if (!result.escaped) {
            const Z = ref.getZ(n - 1) || new Complex(0, 0);
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

    /**
     * Fallback to standard iteration from current position
     * @private
     */
    _fallbackIterate(z, startN, params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        const c = params.juliaC;
        
        let zRe = z.re;
        let zIm = z.im;
        let n = startN;
        
        while (n < maxIter) {
            const mag2 = zRe * zRe + zIm * zIm;
            if (mag2 > bailout2) {
                result.escaped = true;
                break;
            }
            
            const newZRe = zRe * zRe - zIm * zIm + c.re;
            const newZIm = 2 * zRe * zIm + c.im;
            zRe = newZRe;
            zIm = newZIm;
            n++;
        }
        
        result.iterations = n;
        result.finalZ.set(zRe, zIm);
        result.finalMagnitude2 = result.finalZ.magnitudeSquared;
        result.glitched = true;
        
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
        
        // Use fixed Julia c
        const juliaC = this._juliaC_HP || new BigComplex(
            params.juliaC.re.toString(),
            params.juliaC.im.toString(),
            z0.precision
        );
        
        const bailout = new BigDecimal(params.bailoutSquared, z0.precision);
        
        let z = z0.clone();
        let n = 0;
        
        while (n < maxIter) {
            if (z.magnitudeSquared().gt(bailout)) {
                result.escaped = true;
                break;
            }
            
            z = z.square().add(juliaC);
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

    // =========================================================================
    // CLEAN UP
    // =========================================================================

    dispose() {
        super.dispose();
        this._referenceOrbit = null;
        this._perturbationIterator = null;
        this._juliaC_HP = null;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { JuliaSeeds };
export default Julia;
