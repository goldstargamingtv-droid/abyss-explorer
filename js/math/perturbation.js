/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║              ABYSS EXPLORER - PERTURBATION THEORY IMPLEMENTATION              ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Ultra-deep fractal zoom using perturbation theory and rebasing               ║
 * ║                                                                                ║
 * ║  Mathematical Background:                                                      ║
 * ║  ═══════════════════════                                                       ║
 * ║  Standard fractal iteration requires computing z² + c at every pixel.         ║
 * ║  At deep zooms (>10^15), we need hundreds of digits of precision.             ║
 * ║  Computing every pixel in arbitrary precision is prohibitively slow.          ║
 * ║                                                                                ║
 * ║  Perturbation theory exploits the fact that nearby pixels follow similar      ║
 * ║  trajectories. We compute ONE reference orbit in high precision, then         ║
 * ║  compute other pixels as small perturbations (deltas) from this orbit.        ║
 * ║                                                                                ║
 * ║  Core Theory:                                                                  ║
 * ║  ══════════════                                                                ║
 * ║  Let Z_n be the high-precision reference orbit at point C.                    ║
 * ║  For nearby point c = C + δc, the orbit is z_n = Z_n + δ_n                    ║
 * ║                                                                                ║
 * ║  From the iteration z_{n+1} = z_n² + c:                                       ║
 * ║    z_{n+1} = (Z_n + δ_n)² + (C + δc)                                          ║
 * ║            = Z_n² + 2·Z_n·δ_n + δ_n² + C + δc                                 ║
 * ║            = (Z_n² + C) + 2·Z_n·δ_n + δ_n² + δc                               ║
 * ║            = Z_{n+1} + 2·Z_n·δ_n + δ_n² + δc                                  ║
 * ║                                                                                ║
 * ║  Therefore: δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc                                   ║
 * ║                                                                                ║
 * ║  This recurrence uses only double-precision arithmetic for δ!                 ║
 * ║                                                                                ║
 * ║  Glitch Handling:                                                              ║
 * ║  ════════════════                                                              ║
 * ║  When |δ_n| becomes comparable to |Z_n|, precision is lost ("glitch").        ║
 * ║  Detection: |δ_n| > ε·|Z_n| for small ε (typically 1e-4)                      ║
 * ║  Correction: Rebase to a new reference point or use series approximation      ║
 * ║                                                                                ║
 * ║  References:                                                                   ║
 * ║  - K.I. Martin (2013): "Superfractals" - original perturbation theory         ║
 * ║  - Claude Heiland-Allen: "Perturbation techniques" on mathr.co.uk             ║
 * ║  - Kalles Fraktaler source code                                               ║
 * ║  - Pauldelbrot's writings on fractalforums.org                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, ComplexPool } from './complex.js';
import { BigDecimal, BigComplex, PrecisionManager } from './arbitrary-precision.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Perturbation configuration
 */
const PerturbationConfig = {
    /** Glitch tolerance: δ/Z ratio threshold */
    glitchTolerance: 1e-4,
    
    /** Minimum reference orbit length before recomputing */
    minReferenceLength: 100,
    
    /** Maximum reference orbit length */
    maxReferenceLength: 100000,
    
    /** Rebasing threshold (relative delta size) */
    rebaseThreshold: 1e-3,
    
    /** Enable automatic rebasing */
    autoRebase: true,
    
    /** Series approximation order */
    seriesOrder: 16,
    
    /** Use bilinear approximation for delta */
    bilinearApprox: true
};

// =============================================================================
// REFERENCE ORBIT CLASS
// =============================================================================

/**
 * High-Precision Reference Orbit
 * 
 * Stores the reference orbit Z_n computed at a center point C.
 * This orbit is computed once in arbitrary precision and reused
 * for all pixels in the view.
 * 
 * @class ReferenceOrbit
 */
export class ReferenceOrbit {
    /**
     * Create a reference orbit
     * 
     * @param {Object} options
     * @param {BigComplex} options.center - Center point C in high precision
     * @param {number} options.maxIterations - Maximum iterations
     * @param {number} options.bailout - Escape radius
     * @param {number} options.precision - Working precision
     */
    constructor(options) {
        /** @type {BigComplex} Center point C */
        this.center = options.center;
        
        /** @type {number} Maximum iterations */
        this.maxIterations = options.maxIterations;
        
        /** @type {number} Bailout radius squared */
        this.bailoutSquared = options.bailout * options.bailout;
        
        /** @type {number} Precision */
        this.precision = options.precision;
        
        /** @type {Logger} */
        this.logger = new Logger('ReferenceOrbit');
        
        // =================================================================
        // Orbit Storage
        // =================================================================
        
        /**
         * Reference orbit values Z_n as double precision
         * For perturbation: δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
         * Only the low-precision part is needed for the 2·Z_n·δ_n term
         * @type {Complex[]}
         */
        this.orbit = [];
        
        /**
         * High-precision orbit (if needed for rebasing)
         * @type {BigComplex[]}
         */
        this.orbitHP = [];
        
        /**
         * Precomputed 2·Z_n values for faster iteration
         * @type {Complex[]}
         */
        this.twoZ = [];
        
        /**
         * |Z_n|² values for glitch detection
         * @type {number[]}
         */
        this.zMag2 = [];
        
        /** @type {number} Actual orbit length (may escape early) */
        this.length = 0;
        
        /** @type {boolean} Whether reference escaped */
        this.escaped = false;
        
        /** @type {number} Escape iteration (if escaped) */
        this.escapeIteration = -1;
        
        /** @type {boolean} Whether orbit is computed */
        this.computed = false;
    }

    /**
     * Compute the reference orbit
     * 
     * Iterates Z_{n+1} = Z_n² + C in high precision
     * and stores double-precision approximations.
     * 
     * @returns {ReferenceOrbit} this (for chaining)
     */
    compute() {
        this.logger.info(`Computing reference orbit (max ${this.maxIterations} iterations)...`);
        const startTime = performance.now();
        
        // Initialize
        this.orbit = [];
        this.orbitHP = [];
        this.twoZ = [];
        this.zMag2 = [];
        this.length = 0;
        this.escaped = false;
        this.escapeIteration = -1;
        
        // High-precision iteration
        let Z = BigComplex.zero(this.precision);
        const two = new BigDecimal(2, this.precision);
        const bailoutHP = new BigDecimal(this.bailoutSquared, this.precision);
        
        for (let n = 0; n < this.maxIterations; n++) {
            // Store current Z in both precisions
            const zLP = new Complex(Z.re.toNumber(), Z.im.toNumber());
            this.orbit.push(zLP);
            this.orbitHP.push(Z.clone());
            
            // Store 2·Z for perturbation iteration
            const twoZLP = new Complex(zLP.re * 2, zLP.im * 2);
            this.twoZ.push(twoZLP);
            
            // Store |Z|² for glitch detection
            const mag2 = zLP.re * zLP.re + zLP.im * zLP.im;
            this.zMag2.push(mag2);
            
            this.length++;
            
            // Check escape
            if (Z.escaped(bailoutHP)) {
                this.escaped = true;
                this.escapeIteration = n;
                break;
            }
            
            // Iterate: Z_{n+1} = Z_n² + C
            Z = Z.square().add(this.center);
        }
        
        this.computed = true;
        const elapsed = performance.now() - startTime;
        this.logger.info(`Reference orbit computed: ${this.length} iterations in ${elapsed.toFixed(1)}ms`);
        
        return this;
    }

    /**
     * Get reference value at iteration n
     * @param {number} n
     * @returns {Complex}
     */
    getZ(n) {
        if (n >= this.length) return null;
        return this.orbit[n];
    }

    /**
     * Get 2·Z_n at iteration n
     * @param {number} n
     * @returns {Complex}
     */
    getTwoZ(n) {
        if (n >= this.length) return null;
        return this.twoZ[n];
    }

    /**
     * Get |Z_n|² at iteration n
     * @param {number} n
     * @returns {number}
     */
    getZMag2(n) {
        if (n >= this.length) return Infinity;
        return this.zMag2[n];
    }

    /**
     * Get high-precision Z at iteration n
     * @param {number} n
     * @returns {BigComplex}
     */
    getZHP(n) {
        if (n >= this.orbitHP.length) return null;
        return this.orbitHP[n];
    }

    /**
     * Check if reference is still valid at iteration n
     * @param {number} n
     * @returns {boolean}
     */
    isValidAt(n) {
        return n < this.length;
    }

    /**
     * Clear orbit data to free memory
     */
    clear() {
        this.orbit = [];
        this.orbitHP = [];
        this.twoZ = [];
        this.zMag2 = [];
        this.length = 0;
        this.computed = false;
    }
}

// =============================================================================
// PERTURBATION ITERATOR CLASS
// =============================================================================

/**
 * Perturbation Theory Iterator
 * 
 * Computes fractal iterations using perturbation from a reference orbit.
 * 
 * The key recurrence:
 *   δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
 * 
 * where:
 *   - Z_n is the reference orbit value (from ReferenceOrbit)
 *   - δ_n is the current perturbation (small complex number)
 *   - δc is the initial perturbation (pixel offset from center)
 * 
 * @class PerturbationIterator
 */
export class PerturbationIterator {
    /**
     * Create perturbation iterator
     * 
     * @param {ReferenceOrbit} reference - Reference orbit
     * @param {number} bailout - Escape radius
     */
    constructor(reference, bailout = 2) {
        /** @type {ReferenceOrbit} */
        this.reference = reference;
        
        /** @type {number} */
        this.bailout = bailout;
        
        /** @type {number} */
        this.bailoutSquared = bailout * bailout;
        
        /** @type {number} Glitch detection tolerance */
        this.glitchTolerance = PerturbationConfig.glitchTolerance;
        
        /** @type {boolean} Enable rebasing on glitch */
        this.enableRebasing = PerturbationConfig.autoRebase;
        
        /** @type {ComplexPool} Object pool for allocations */
        this.pool = new ComplexPool(100);
        
        // Statistics
        this.stats = {
            glitchCount: 0,
            rebaseCount: 0,
            totalIterations: 0
        };
    }

    /**
     * Iterate a single pixel using perturbation
     * 
     * @param {Complex} deltaC - Offset from reference center (δc)
     * @param {number} maxIterations - Maximum iterations
     * @returns {{iterations: number, escaped: boolean, finalZ: Complex, smooth: number}}
     */
    iterate(deltaC, maxIterations) {
        /**
         * Perturbation iteration algorithm:
         * 
         * Given: δc (offset from center)
         * Initial: δ_0 = δc (since z_0 = c = C + δc, and Z_0 = C, so δ_0 = δc)
         * 
         * Actually for Mandelbrot with z_0 = 0:
         * z_0 = 0, Z_0 = 0, so δ_0 = 0
         * z_1 = c = C + δc, Z_1 = C, so δ_1 = δc
         * 
         * Recurrence: δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
         */
        
        let delta = new Complex(0, 0);  // δ_0 = 0
        let n = 0;
        let escaped = false;
        let glitched = false;
        let finalZ = new Complex(0, 0);
        
        // Precompute |δc|² for relative glitch detection
        const deltaCMag2 = deltaC.re * deltaC.re + deltaC.im * deltaC.im;
        
        while (n < maxIterations && n < this.reference.length) {
            // Get reference values
            const Z = this.reference.getZ(n);
            const twoZ = this.reference.getTwoZ(n);
            const zMag2 = this.reference.getZMag2(n);
            
            // Compute full z = Z + δ
            const zRe = Z.re + delta.re;
            const zIm = Z.im + delta.im;
            const zMag2Full = zRe * zRe + zIm * zIm;
            
            // Check escape
            if (zMag2Full > this.bailoutSquared) {
                escaped = true;
                finalZ.set(zRe, zIm);
                break;
            }
            
            // Glitch detection
            // A glitch occurs when |δ| becomes comparable to |Z|
            const deltaMag2 = delta.re * delta.re + delta.im * delta.im;
            
            if (zMag2 > 0 && deltaMag2 > this.glitchTolerance * this.glitchTolerance * zMag2) {
                this.stats.glitchCount++;
                
                if (this.enableRebasing) {
                    // Rebase: start fresh from current position
                    const result = this._rebase(zRe, zIm, deltaC, n, maxIterations);
                    return result;
                } else {
                    // Mark as glitch (will show artifact)
                    glitched = true;
                }
            }
            
            /**
             * Perturbation iteration:
             * δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
             * 
             * Expanded:
             * Let δ_n = a + bi, Z_n = x + yi, δc = p + qi
             * 
             * 2·Z_n·δ_n = 2(x + yi)(a + bi)
             *           = 2(xa - yb) + 2(xb + ya)i
             * 
             * δ_n² = (a + bi)² = (a² - b²) + 2abi
             * 
             * δ_{n+1} = (2xa - 2yb + a² - b² + p) + (2xb + 2ya + 2ab + q)i
             */
            
            const twoZDeltaRe = twoZ.re * delta.re - twoZ.im * delta.im;
            const twoZDeltaIm = twoZ.re * delta.im + twoZ.im * delta.re;
            
            const deltaSqRe = delta.re * delta.re - delta.im * delta.im;
            const deltaSqIm = 2 * delta.re * delta.im;
            
            delta.re = twoZDeltaRe + deltaSqRe + deltaC.re;
            delta.im = twoZDeltaIm + deltaSqIm + deltaC.im;
            
            n++;
            this.stats.totalIterations++;
        }
        
        // Compute smooth iteration count for coloring
        let smooth = n;
        if (escaped) {
            // Smooth iteration count formula:
            // n + 1 - log₂(log₂|z|)
            const logZMag = Math.log(finalZ.re * finalZ.re + finalZ.im * finalZ.im) / 2;
            const logLog = Math.log(logZMag) / Math.LN2;
            smooth = n + 1 - logLog / Math.LN2;
        }
        
        return {
            iterations: n,
            escaped,
            glitched,
            finalZ,
            smooth,
            delta
        };
    }

    /**
     * Rebase when glitch detected
     * 
     * When |δ| grows too large relative to |Z|, we lose precision.
     * Solution: compute new reference from current position.
     * 
     * @private
     * @param {number} zRe - Current z real part
     * @param {number} zIm - Current z imaginary part
     * @param {Complex} deltaC - Original δc
     * @param {number} startN - Current iteration
     * @param {number} maxIterations - Max iterations
     * @returns {Object} Iteration result
     */
    _rebase(zRe, zIm, deltaC, startN, maxIterations) {
        this.stats.rebaseCount++;
        
        // Continue iteration from current z without perturbation
        let z = new Complex(zRe, zIm);
        const c = new Complex(
            this.reference.center.re.toNumber() + deltaC.re,
            this.reference.center.im.toNumber() + deltaC.im
        );
        
        let n = startN;
        let escaped = false;
        
        while (n < maxIterations) {
            // Standard iteration
            const zMag2 = z.re * z.re + z.im * z.im;
            
            if (zMag2 > this.bailoutSquared) {
                escaped = true;
                break;
            }
            
            // z = z² + c
            const newRe = z.re * z.re - z.im * z.im + c.re;
            const newIm = 2 * z.re * z.im + c.im;
            z.re = newRe;
            z.im = newIm;
            
            n++;
        }
        
        let smooth = n;
        if (escaped) {
            const logZMag = Math.log(z.re * z.re + z.im * z.im) / 2;
            const logLog = Math.log(logZMag) / Math.LN2;
            smooth = n + 1 - logLog / Math.LN2;
        }
        
        return {
            iterations: n,
            escaped,
            glitched: false,
            finalZ: z,
            smooth,
            rebased: true
        };
    }

    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            glitchCount: 0,
            rebaseCount: 0,
            totalIterations: 0
        };
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
// BILINEAR APPROXIMATION
// =============================================================================

/**
 * Bilinear Approximation for Perturbation
 * 
 * Instead of computing δ_n individually for each pixel,
 * we can approximate δ_n as a bilinear function of the initial δc:
 * 
 *   δ_n ≈ A_n·δc + B_n·δc* + C_n·|δc|²
 * 
 * where δc* is the complex conjugate.
 * 
 * For rectangular grids, this allows computing corner values
 * and interpolating the interior, giving massive speedups.
 * 
 * Reference: Pauldelbrot's bilinear approximation on fractalforums
 * 
 * @class BilinearApproximation
 */
export class BilinearApproximation {
    /**
     * Create bilinear approximation
     * 
     * @param {ReferenceOrbit} reference
     */
    constructor(reference) {
        /** @type {ReferenceOrbit} */
        this.reference = reference;
        
        /**
         * Coefficients A_n for each iteration
         * δ_n ≈ A_n·δc + O(|δc|²)
         * @type {Complex[]}
         */
        this.A = [];
        
        /**
         * Coefficients B_n (for conjugate term)
         * @type {Complex[]}
         */
        this.B = [];
        
        /** @type {boolean} */
        this.computed = false;
    }

    /**
     * Compute bilinear coefficients
     * 
     * For first-order approximation:
     *   A_{n+1} = 2·Z_n·A_n + A_n² (approximately)
     *   A_0 = 1 (since δ_0 = δc initially, but actually δ_1 = δc for Mandelbrot)
     * 
     * The recurrence for A is:
     *   A_{n+1} = 2·Z_n·A_n + 1
     * 
     * This gives δ_n ≈ A_n·δc for small δc
     */
    compute() {
        this.A = [];
        this.B = [];
        
        // Initial condition: A_0 = 0, A_1 = 1
        let A = new Complex(0, 0);
        this.A.push(A.clone());
        
        for (let n = 0; n < this.reference.length - 1; n++) {
            const twoZ = this.reference.getTwoZ(n);
            
            // A_{n+1} = 2·Z_n·A_n + 1
            // For n=0: A_1 = 2·Z_0·A_0 + 1 = 2·0·0 + 1 = 1 ✓
            const newA = twoZ.mul(A).add(new Complex(1, 0));
            A = newA;
            this.A.push(A.clone());
        }
        
        this.computed = true;
    }

    /**
     * Approximate δ_n given δc
     * 
     * @param {number} n - Iteration number
     * @param {Complex} deltaC - Initial perturbation
     * @returns {Complex} Approximated δ_n
     */
    approximate(n, deltaC) {
        if (!this.computed || n >= this.A.length) {
            return null;
        }
        
        // δ_n ≈ A_n · δc
        return this.A[n].mul(deltaC);
    }

    /**
     * Get error bound at iteration n
     * 
     * @param {number} n
     * @param {number} deltaCMag - |δc|
     * @returns {number} Approximate error bound
     */
    getErrorBound(n, deltaCMag) {
        if (!this.computed || n >= this.A.length) {
            return Infinity;
        }
        
        // Error is O(|δc|²), roughly |A_n|·|δc|²
        const aMag = this.A[n].magnitude;
        return aMag * deltaCMag * deltaCMag;
    }

    /**
     * Find iteration where approximation breaks down
     * 
     * @param {Complex} deltaC
     * @param {number} tolerance
     * @returns {number} Last valid iteration
     */
    findValidRange(deltaC, tolerance = 1e-6) {
        const deltaCMag = deltaC.magnitude;
        
        for (let n = 0; n < this.A.length; n++) {
            const error = this.getErrorBound(n, deltaCMag);
            if (error > tolerance) {
                return n;
            }
        }
        
        return this.A.length;
    }
}

// =============================================================================
// PERTURBATION ENGINE
// =============================================================================

/**
 * High-Level Perturbation Engine
 * 
 * Manages reference orbit computation, perturbation iteration,
 * glitch detection/correction, and automatic precision management.
 * 
 * @class PerturbationEngine
 */
export class PerturbationEngine {
    /**
     * Create perturbation engine
     * 
     * @param {Object} options
     * @param {number} [options.maxIterations=1000]
     * @param {number} [options.bailout=2]
     * @param {number} [options.precision=50]
     */
    constructor(options = {}) {
        /** @type {number} */
        this.maxIterations = options.maxIterations || 1000;
        
        /** @type {number} */
        this.bailout = options.bailout || 2;
        
        /** @type {number} */
        this.precision = options.precision || 50;
        
        /** @type {PrecisionManager} */
        this.precisionManager = new PrecisionManager();
        
        /** @type {ReferenceOrbit|null} */
        this.reference = null;
        
        /** @type {PerturbationIterator|null} */
        this.iterator = null;
        
        /** @type {BilinearApproximation|null} */
        this.bilinear = null;
        
        /** @type {Logger} */
        this.logger = new Logger('PerturbationEngine');
        
        // Current view parameters
        this.centerX = '0';
        this.centerY = '0';
        this.zoom = 1;
    }

    /**
     * Set view parameters and prepare for rendering
     * 
     * @param {string} centerX - Center X as decimal string
     * @param {string} centerY - Center Y as decimal string
     * @param {number} zoom - Zoom level
     */
    setView(centerX, centerY, zoom) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.zoom = zoom;
        
        // Update precision based on zoom
        this.precisionManager.updateForZoom(zoom);
        this.precision = this.precisionManager.precision;
        
        // Reference needs recomputation
        this.reference = null;
        this.iterator = null;
        this.bilinear = null;
    }

    /**
     * Compute reference orbit at current center
     * 
     * @returns {ReferenceOrbit}
     */
    computeReference() {
        this.logger.info(`Computing reference at precision ${this.precision}`);
        
        // Create high-precision center
        const center = new BigComplex(
            this.centerX,
            this.centerY,
            this.precision
        );
        
        // Create and compute reference orbit
        this.reference = new ReferenceOrbit({
            center,
            maxIterations: this.maxIterations,
            bailout: this.bailout,
            precision: this.precision
        });
        
        this.reference.compute();
        
        // Create iterator
        this.iterator = new PerturbationIterator(this.reference, this.bailout);
        
        // Compute bilinear approximation
        if (PerturbationConfig.bilinearApprox) {
            this.bilinear = new BilinearApproximation(this.reference);
            this.bilinear.compute();
        }
        
        return this.reference;
    }

    /**
     * Iterate a pixel using perturbation
     * 
     * @param {number} deltaX - X offset from center (in fractal coords)
     * @param {number} deltaY - Y offset from center (in fractal coords)
     * @returns {Object} Iteration result
     */
    iteratePixel(deltaX, deltaY) {
        if (!this.iterator) {
            throw new Error('Reference not computed. Call computeReference() first.');
        }
        
        const deltaC = new Complex(deltaX, deltaY);
        return this.iterator.iterate(deltaC, this.maxIterations);
    }

    /**
     * Batch iterate multiple pixels
     * 
     * @param {Array<{x: number, y: number}>} pixels - Array of delta coordinates
     * @returns {Array} Array of iteration results
     */
    iterateBatch(pixels) {
        return pixels.map(p => this.iteratePixel(p.x, p.y));
    }

    /**
     * Get iteration statistics
     * @returns {Object}
     */
    getStats() {
        return {
            referenceLength: this.reference?.length || 0,
            referenceEscaped: this.reference?.escaped || false,
            iterator: this.iterator?.getStats() || null,
            precision: this.precision,
            zoom: this.zoom
        };
    }

    /**
     * Clear cached data
     */
    clear() {
        this.reference?.clear();
        this.reference = null;
        this.iterator = null;
        this.bilinear = null;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
    PerturbationConfig,
    ReferenceOrbit,
    PerturbationIterator,
    BilinearApproximation,
    PerturbationEngine
};

export default PerturbationEngine;
