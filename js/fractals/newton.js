/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - NEWTON FRACTALS                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Newton-Raphson method fractals for polynomial roots                          ║
 * ║                                                                                ║
 * ║  Mathematical Foundation:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  Newton's method for finding roots of f(z) = 0:                               ║
 * ║                                                                                ║
 * ║    z_{n+1} = z_n - f(z_n) / f'(z_n)                                           ║
 * ║                                                                                ║
 * ║  For polynomial f(z) = z^p - 1 (finding pth roots of unity):                  ║
 * ║    f'(z) = p·z^{p-1}                                                          ║
 * ║    z_{n+1} = z_n - (z_n^p - 1) / (p·z_n^{p-1})                                ║
 * ║            = z_n - z_n/p + 1/(p·z_n^{p-1})                                    ║
 * ║            = ((p-1)·z_n + z_n^{1-p}) / p                                      ║
 * ║            = ((p-1)·z_n^p + 1) / (p·z_n^{p-1})                                ║
 * ║                                                                                ║
 * ║  Simplified for z³ - 1:                                                       ║
 * ║    z_{n+1} = (2·z_n³ + 1) / (3·z_n²)                                          ║
 * ║            = 2·z_n/3 + 1/(3·z_n²)                                             ║
 * ║                                                                                ║
 * ║  Properties:                                                                   ║
 * ║  - Converges to one of the p roots (pth roots of unity)                       ║
 * ║  - Root at e^{2πik/p} for k = 0, 1, ..., p-1                                  ║
 * ║  - Boundaries between basins of attraction are fractal                        ║
 * ║  - Julia set is the boundary of all basins                                    ║
 * ║                                                                                ║
 * ║  Relaxed Newton (Generalized):                                                 ║
 * ║    z_{n+1} = z_n - a·f(z_n)/f'(z_n)                                           ║
 * ║  where a is the relaxation parameter (a=1 is standard Newton)                 ║
 * ║                                                                                ║
 * ║  Nova Fractal (Newton + c):                                                    ║
 * ║    z_{n+1} = z_n - f(z_n)/f'(z_n) + c                                         ║
 * ║  This adds a Mandelbrot-like parameter                                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, CONSTANTS } from '../math/complex.js';
import { FractalBase, IterationResult, FractalParams } from './fractal-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// POLYNOMIAL TYPES
// =============================================================================

/**
 * Predefined polynomial types
 */
export const PolynomialType = {
    /** z³ - 1 = 0 (3 roots at 120° apart) */
    CUBIC: 'cubic',
    
    /** z⁴ - 1 = 0 (4 roots at 90° apart) */
    QUARTIC: 'quartic',
    
    /** z⁵ - 1 = 0 (5 roots) */
    QUINTIC: 'quintic',
    
    /** z⁶ - 1 = 0 (6 roots) */
    SEXTIC: 'sextic',
    
    /** z^n - 1 = 0 (custom n) */
    UNITY: 'unity',
    
    /** z³ - 2z + 2 = 0 (3 roots, not on unit circle) */
    CUSTOM1: 'custom1',
    
    /** z⁴ - z = 0 (4 roots including 0) */
    CUSTOM2: 'custom2'
};

// =============================================================================
// NEWTON FRACTAL CLASS
// =============================================================================

/**
 * Newton Fractal
 * 
 * Implements Newton's method for finding polynomial roots,
 * colored by which root each starting point converges to.
 * 
 * @extends FractalBase
 */
export class Newton extends FractalBase {
    constructor(params = null) {
        super(params);
        
        /** @type {string} Polynomial type */
        this.polynomialType = PolynomialType.CUBIC;
        
        /** @type {number} Degree for z^n - 1 */
        this.degree = 3;
        
        /** @type {Complex} Relaxation parameter (default 1 = standard Newton) */
        this.relaxation = new Complex(1, 0);
        
        /** @type {Complex} Nova c parameter */
        this.novaC = new Complex(0, 0);
        
        /** @type {boolean} Enable Nova mode */
        this.novaMode = false;
        
        /** @type {number} Convergence tolerance */
        this.tolerance = 1e-6;
        
        /** @type {Complex[]} Precomputed roots */
        this._roots = this._computeRoots();
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'newton';
    }

    getName() {
        return 'Newton Fractal';
    }

    getDescription() {
        return "Newton's method fractal for finding polynomial roots. " +
               'Each color represents a different root basin of attraction.';
    }

    getFormula() {
        return 'z_{n+1} = z_n - \\frac{f(z_n)}{f\'(z_n)}';
    }

    getDefaultParams() {
        return {
            maxIterations: 100,
            bailout: 1000, // Large bailout (for divergence)
            smoothColoring: true,
            tolerance: 1e-6
        };
    }

    getDefaultView() {
        return {
            centerX: 0,
            centerY: 0,
            zoom: 2
        };
    }

    getExtraParams() {
        return [
            {
                name: 'polynomialType',
                type: 'select',
                default: 'cubic',
                options: Object.values(PolynomialType),
                description: 'Polynomial to find roots of'
            },
            {
                name: 'degree',
                type: 'number',
                default: 3,
                min: 2,
                max: 20,
                description: 'Degree for z^n - 1 polynomial'
            },
            {
                name: 'relaxation_re',
                type: 'number',
                default: 1,
                min: 0,
                max: 2,
                description: 'Relaxation parameter (real part)'
            },
            {
                name: 'relaxation_im',
                type: 'number',
                default: 0,
                min: -1,
                max: 1,
                description: 'Relaxation parameter (imaginary part)'
            },
            {
                name: 'novaMode',
                type: 'boolean',
                default: false,
                description: 'Enable Nova mode (adds c parameter)'
            },
            {
                name: 'tolerance',
                type: 'number',
                default: 1e-6,
                min: 1e-12,
                max: 1e-3,
                description: 'Convergence tolerance'
            }
        ];
    }

    supportsPerturbation() {
        return false; // Newton doesn't use perturbation
    }

    supportsSeriesApproximation() {
        return false;
    }

    supportsArbitraryPrecision() {
        return false; // Could be added but not priority
    }

    hasInterior() {
        return true; // Converging regions
    }

    // =========================================================================
    // ROOT COMPUTATION
    // =========================================================================

    /**
     * Compute roots for current polynomial
     * @private
     * @returns {Complex[]}
     */
    _computeRoots() {
        const roots = [];
        
        switch (this.polynomialType) {
            case PolynomialType.CUBIC:
                // z³ - 1 = 0: roots at e^{2πik/3} for k = 0, 1, 2
                for (let k = 0; k < 3; k++) {
                    const angle = (2 * Math.PI * k) / 3;
                    roots.push(new Complex(Math.cos(angle), Math.sin(angle)));
                }
                break;
                
            case PolynomialType.QUARTIC:
                // z⁴ - 1 = 0: roots at ±1, ±i
                for (let k = 0; k < 4; k++) {
                    const angle = (2 * Math.PI * k) / 4;
                    roots.push(new Complex(Math.cos(angle), Math.sin(angle)));
                }
                break;
                
            case PolynomialType.QUINTIC:
                for (let k = 0; k < 5; k++) {
                    const angle = (2 * Math.PI * k) / 5;
                    roots.push(new Complex(Math.cos(angle), Math.sin(angle)));
                }
                break;
                
            case PolynomialType.SEXTIC:
                for (let k = 0; k < 6; k++) {
                    const angle = (2 * Math.PI * k) / 6;
                    roots.push(new Complex(Math.cos(angle), Math.sin(angle)));
                }
                break;
                
            case PolynomialType.UNITY:
                for (let k = 0; k < this.degree; k++) {
                    const angle = (2 * Math.PI * k) / this.degree;
                    roots.push(new Complex(Math.cos(angle), Math.sin(angle)));
                }
                break;
                
            case PolynomialType.CUSTOM1:
                // z³ - 2z + 2 = 0 (approximate roots)
                roots.push(new Complex(-1.7693, 0));
                roots.push(new Complex(0.8846, 0.5897));
                roots.push(new Complex(0.8846, -0.5897));
                break;
                
            case PolynomialType.CUSTOM2:
                // z⁴ - z = 0 => z(z³ - 1) = 0
                roots.push(new Complex(0, 0));
                for (let k = 0; k < 3; k++) {
                    const angle = (2 * Math.PI * k) / 3;
                    roots.push(new Complex(Math.cos(angle), Math.sin(angle)));
                }
                break;
                
            default:
                // Default to cubic
                for (let k = 0; k < 3; k++) {
                    const angle = (2 * Math.PI * k) / 3;
                    roots.push(new Complex(Math.cos(angle), Math.sin(angle)));
                }
        }
        
        return roots;
    }

    /**
     * Set polynomial type and recompute roots
     * @param {string} type
     */
    setPolynomialType(type) {
        this.polynomialType = type;
        this._roots = this._computeRoots();
    }

    /**
     * Set degree for unity polynomial
     * @param {number} n
     */
    setDegree(n) {
        this.degree = Math.max(2, Math.round(n));
        if (this.polynomialType === PolynomialType.UNITY) {
            this._roots = this._computeRoots();
        }
    }

    /**
     * Set relaxation parameter
     * @param {number} re
     * @param {number} [im=0]
     */
    setRelaxation(re, im = 0) {
        this.relaxation = new Complex(re, im);
    }

    /**
     * Get roots
     * @returns {Complex[]}
     */
    getRoots() {
        return this._roots;
    }

    // =========================================================================
    // POLYNOMIAL EVALUATION
    // =========================================================================

    /**
     * Evaluate f(z) for current polynomial
     * @private
     * @param {Complex} z
     * @returns {Complex}
     */
    _evalF(z) {
        switch (this.polynomialType) {
            case PolynomialType.CUBIC:
                // z³ - 1
                return z.cube().sub(new Complex(1, 0));
                
            case PolynomialType.QUARTIC:
                // z⁴ - 1
                return z.pow(4).sub(new Complex(1, 0));
                
            case PolynomialType.QUINTIC:
                return z.pow(5).sub(new Complex(1, 0));
                
            case PolynomialType.SEXTIC:
                return z.pow(6).sub(new Complex(1, 0));
                
            case PolynomialType.UNITY:
                return z.pow(this.degree).sub(new Complex(1, 0));
                
            case PolynomialType.CUSTOM1:
                // z³ - 2z + 2
                return z.cube().sub(z.scale(2)).add(new Complex(2, 0));
                
            case PolynomialType.CUSTOM2:
                // z⁴ - z
                return z.pow(4).sub(z);
                
            default:
                return z.cube().sub(new Complex(1, 0));
        }
    }

    /**
     * Evaluate f'(z) for current polynomial
     * @private
     * @param {Complex} z
     * @returns {Complex}
     */
    _evalFPrime(z) {
        switch (this.polynomialType) {
            case PolynomialType.CUBIC:
                // 3z²
                return z.square().scale(3);
                
            case PolynomialType.QUARTIC:
                // 4z³
                return z.cube().scale(4);
                
            case PolynomialType.QUINTIC:
                return z.pow(4).scale(5);
                
            case PolynomialType.SEXTIC:
                return z.pow(5).scale(6);
                
            case PolynomialType.UNITY:
                return z.pow(this.degree - 1).scale(this.degree);
                
            case PolynomialType.CUSTOM1:
                // 3z² - 2
                return z.square().scale(3).sub(new Complex(2, 0));
                
            case PolynomialType.CUSTOM2:
                // 4z³ - 1
                return z.cube().scale(4).sub(new Complex(1, 0));
                
            default:
                return z.square().scale(3);
        }
    }

    // =========================================================================
    // NEWTON ITERATION
    // =========================================================================

    /**
     * Newton iteration
     * 
     * z_{n+1} = z_n - a · f(z_n) / f'(z_n) [+ c for Nova]
     * 
     * @param {Complex} z0 - Starting point (the pixel location)
     * @param {Complex} c - Parameter c (used only in Nova mode)
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const tolerance2 = this.tolerance * this.tolerance;
        const bailout2 = params.bailoutSquared;
        
        let z = z0.clone();
        let n = 0;
        let converged = false;
        let rootIndex = -1;
        
        // For smooth coloring: track how close we get
        let minDist2 = Infinity;
        
        while (n < maxIter) {
            // Check for convergence to any root
            for (let i = 0; i < this._roots.length; i++) {
                const root = this._roots[i];
                const dx = z.re - root.re;
                const dy = z.im - root.im;
                const dist2 = dx * dx + dy * dy;
                
                if (dist2 < tolerance2) {
                    converged = true;
                    rootIndex = i;
                    
                    // Smooth coloring adjustment
                    const dist = Math.sqrt(dist2);
                    result.smooth = n + Math.log(this.tolerance / dist) / Math.log(2);
                    break;
                }
                
                if (dist2 < minDist2) {
                    minDist2 = dist2;
                    rootIndex = i;
                }
            }
            
            if (converged) break;
            
            // Check for divergence
            const mag2 = z.magnitudeSquared;
            if (mag2 > bailout2) {
                result.escaped = true;
                rootIndex = -1;
                break;
            }
            
            // Newton step: z = z - a * f(z) / f'(z) [+ c]
            const f = this._evalF(z);
            const fPrime = this._evalFPrime(z);
            
            // Avoid division by zero
            if (fPrime.magnitudeSquared < 1e-20) {
                break;
            }
            
            // Newton update
            let delta = f.div(fPrime);
            
            // Apply relaxation
            if (this.relaxation.re !== 1 || this.relaxation.im !== 0) {
                delta = delta.mul(this.relaxation);
            }
            
            z = z.sub(delta);
            
            // Nova mode: add c
            if (this.novaMode) {
                z = z.add(this.novaC.re !== 0 || this.novaC.im !== 0 ? this.novaC : c);
            }
            
            n++;
        }
        
        // Build result
        result.iterations = n;
        result.finalZ = z;
        result.finalMagnitude2 = z.magnitudeSquared;
        result.escaped = !converged && result.escaped;
        result.rootIndex = rootIndex;
        
        // Smooth coloring if not already set
        if (!converged && !result.escaped) {
            result.smooth = n;
        }
        
        // For Newton, we typically color by root index
        // The angle represents which root was found
        if (rootIndex >= 0 && rootIndex < this._roots.length) {
            result.angle = (2 * Math.PI * rootIndex) / this._roots.length;
        } else {
            result.angle = Math.atan2(z.im, z.re);
        }
        
        return result;
    }

    // =========================================================================
    // OPTIMIZED CUBIC ITERATION
    // =========================================================================

    /**
     * Optimized iteration for z³ - 1
     * 
     * z_{n+1} = z_n - (z_n³ - 1) / (3z_n²)
     *         = (2z_n³ + 1) / (3z_n²)
     * 
     * @param {Complex} z0
     * @param {Complex} c
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateCubic(z0, c, params = this.params) {
        const result = new IterationResult();
        const maxIter = params.maxIterations;
        const tolerance2 = this.tolerance * this.tolerance;
        const bailout2 = params.bailoutSquared;
        
        // Roots of z³ - 1
        const roots = [
            new Complex(1, 0),
            new Complex(-0.5, Math.sqrt(3) / 2),
            new Complex(-0.5, -Math.sqrt(3) / 2)
        ];
        
        let zRe = z0.re;
        let zIm = z0.im;
        let n = 0;
        let rootIndex = -1;
        
        while (n < maxIter) {
            // Check convergence to roots
            for (let i = 0; i < 3; i++) {
                const dx = zRe - roots[i].re;
                const dy = zIm - roots[i].im;
                const dist2 = dx * dx + dy * dy;
                
                if (dist2 < tolerance2) {
                    rootIndex = i;
                    result.smooth = n + Math.log(this.tolerance / Math.sqrt(dist2)) / Math.log(3);
                    break;
                }
            }
            
            if (rootIndex >= 0) break;
            
            // Check divergence
            const mag2 = zRe * zRe + zIm * zIm;
            if (mag2 > bailout2 || mag2 < 1e-20) {
                result.escaped = mag2 > bailout2;
                break;
            }
            
            /**
             * Optimized cubic Newton:
             * z' = (2z³ + 1) / (3z²)
             * 
             * Let z = a + bi
             * z² = (a² - b²) + 2abi
             * z³ = z · z² = a(a² - b²) - b(2ab) + i(a(2ab) + b(a² - b²))
             *    = a³ - ab² - 2ab² + i(2a²b + a²b - b³)
             *    = a³ - 3ab² + i(3a²b - b³)
             *    = a(a² - 3b²) + ib(3a² - b²)
             */
            const a = zRe, b = zIm;
            const a2 = a * a, b2 = b * b;
            
            // z²
            const z2Re = a2 - b2;
            const z2Im = 2 * a * b;
            
            // z³
            const z3Re = a * (a2 - 3 * b2);
            const z3Im = b * (3 * a2 - b2);
            
            // 2z³ + 1
            const numRe = 2 * z3Re + 1;
            const numIm = 2 * z3Im;
            
            // 3z²
            const denRe = 3 * z2Re;
            const denIm = 3 * z2Im;
            
            // (2z³ + 1) / (3z²)
            const denMag2 = denRe * denRe + denIm * denIm;
            const newZRe = (numRe * denRe + numIm * denIm) / denMag2;
            const newZIm = (numIm * denRe - numRe * denIm) / denMag2;
            
            // Nova mode
            if (this.novaMode) {
                zRe = newZRe + c.re;
                zIm = newZIm + c.im;
            } else {
                zRe = newZRe;
                zIm = newZIm;
            }
            
            n++;
        }
        
        result.iterations = n;
        result.finalZ.set(zRe, zIm);
        result.finalMagnitude2 = zRe * zRe + zIm * zIm;
        result.rootIndex = rootIndex;
        
        if (rootIndex < 0) {
            result.smooth = n;
        }
        
        if (rootIndex >= 0) {
            result.angle = (2 * Math.PI * rootIndex) / 3;
        }
        
        return result;
    }

    // =========================================================================
    // UTILITY
    // =========================================================================

    /**
     * Get color for a root index
     * @param {number} rootIndex
     * @returns {number} Hue in degrees
     */
    getRootHue(rootIndex) {
        if (rootIndex < 0 || rootIndex >= this._roots.length) {
            return 0;
        }
        return (360 * rootIndex) / this._roots.length;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { PolynomialType };
export default Newton;
