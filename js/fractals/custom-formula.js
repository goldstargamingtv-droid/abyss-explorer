/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ABYSS EXPLORER - CUSTOM FORMULA FRACTAL                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Dynamic fractal from user-defined formulas                                   ║
 * ║                                                                                ║
 * ║  Architecture:                                                                 ║
 * ║  ═════════════                                                                 ║
 * ║  This module wraps the FormulaParser to create fractals from arbitrary        ║
 * ║  user-provided formulas. The workflow is:                                     ║
 * ║                                                                                ║
 * ║  1. User enters formula string (e.g., "z^3 + sin(c)")                         ║
 * ║  2. FormulaParser validates and compiles to executable function               ║
 * ║  3. CustomFormula uses compiled function for iteration                        ║
 * ║  4. Results cached for repeated evaluations                                   ║
 * ║                                                                                ║
 * ║  Supported Variables:                                                          ║
 * ║  - z: Current iterate (complex)                                               ║
 * ║  - c: Parameter c (complex) - usually the pixel coordinate                    ║
 * ║  - p / pixel: Same as c (alias)                                               ║
 * ║  - n: Current iteration number (integer)                                      ║
 * ║  - i: Imaginary unit                                                          ║
 * ║                                                                                ║
 * ║  Supported Functions:                                                          ║
 * ║  - Basic: sin, cos, tan, exp, log, sqrt, abs, conj                           ║
 * ║  - Inverse trig: asin, acos, atan                                            ║
 * ║  - Hyperbolic: sinh, cosh, tanh                                              ║
 * ║  - Complex: real, imag, arg, norm                                            ║
 * ║                                                                                ║
 * ║  Security:                                                                     ║
 * ║  - All formulas are parsed and compiled (no eval())                          ║
 * ║  - Whitelist of allowed functions                                            ║
 * ║  - Sandboxed execution context                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex, CONSTANTS } from '../math/complex.js';
import { FormulaParser, PredefinedFormulas } from '../math/formula-parser.js';
import { FractalBase, IterationResult, FractalParams } from './fractal-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// EXAMPLE FORMULAS
// =============================================================================

/**
 * Library of interesting custom formulas
 */
export const ExampleFormulas = {
    // Mandelbrot variants
    mandelbrot: {
        formula: 'z^2 + c',
        name: 'Mandelbrot',
        description: 'Classic Mandelbrot set'
    },
    cubic: {
        formula: 'z^3 + c',
        name: 'Cubic Mandelbrot',
        description: 'Third power Mandelbrot'
    },
    quartic: {
        formula: 'z^4 + c',
        name: 'Quartic Mandelbrot',
        description: 'Fourth power Mandelbrot'
    },
    quintic: {
        formula: 'z^5 + c',
        name: 'Quintic Mandelbrot',
        description: 'Fifth power Mandelbrot'
    },
    
    // Trigonometric
    sine: {
        formula: 'sin(z) + c',
        name: 'Sine',
        description: 'Sine function fractal'
    },
    cosine: {
        formula: 'cos(z) + c',
        name: 'Cosine',
        description: 'Cosine function fractal'
    },
    tangent: {
        formula: 'tan(z) + c',
        name: 'Tangent',
        description: 'Tangent function fractal'
    },
    
    // Exponential
    exponential: {
        formula: 'exp(z) + c',
        name: 'Exponential',
        description: 'Exponential map fractal'
    },
    expSin: {
        formula: 'exp(sin(z)) + c',
        name: 'Exp-Sin',
        description: 'Exponential of sine'
    },
    
    // Hyperbolic
    sinh: {
        formula: 'sinh(z) + c',
        name: 'Sinh',
        description: 'Hyperbolic sine fractal'
    },
    cosh: {
        formula: 'cosh(z) + c',
        name: 'Cosh',
        description: 'Hyperbolic cosine fractal'
    },
    
    // Combinations
    sinCos: {
        formula: 'sin(z) * cos(c) + c',
        name: 'Sin-Cos',
        description: 'Sin-Cos combination'
    },
    expZ2: {
        formula: 'exp(z^2) + c',
        name: 'Exp(z²)',
        description: 'Exponential of z squared'
    },
    
    // Rational
    rational1: {
        formula: 'z - (z^3 - 1) / (3 * z^2) + c',
        name: 'Nova',
        description: 'Newton-Nova hybrid'
    },
    rational2: {
        formula: 'z^2 / (1 + z^2) + c',
        name: 'Rational',
        description: 'Rational function fractal'
    },
    
    // Exotic
    collatz: {
        formula: '(2 + 7*z - (2 + 5*z) * cos(pi * z)) / 4',
        name: 'Collatz',
        description: 'Collatz conjecture inspired'
    },
    zExp: {
        formula: 'z^z + c',
        name: 'z^z',
        description: 'Self-exponential'
    },
    logistic: {
        formula: 'c * z * (1 - z)',
        name: 'Logistic',
        description: 'Logistic map in complex plane'
    },
    
    // Mixed operations
    biomorph: {
        formula: 'z^3 + exp(z) + c',
        name: 'Biomorph',
        description: 'Biomorphic shapes'
    },
    strange: {
        formula: 'z^2 + c / z',
        name: 'Strange',
        description: 'Strange attractor-like'
    }
};

// =============================================================================
// CUSTOM FORMULA FRACTAL CLASS
// =============================================================================

/**
 * Custom Formula Fractal
 * 
 * Creates fractals from user-defined iteration formulas.
 * 
 * @extends FractalBase
 */
export class CustomFormula extends FractalBase {
    constructor(params = null) {
        super(params);
        
        /** @type {FormulaParser} */
        this.parser = new FormulaParser();
        
        /** @type {string} Current formula string */
        this._formulaString = 'z^2 + c';
        
        /** @type {Function|null} Compiled iteration function */
        this._compiledFormula = null;
        
        /** @type {boolean} Whether formula is valid */
        this._isValid = false;
        
        /** @type {string|null} Error message if invalid */
        this._errorMessage = null;
        
        /** @type {Map<string, Function>} Formula cache */
        this._formulaCache = new Map();
        
        /** @type {Logger} */
        this.logger = new Logger('CustomFormula');
        
        // Compile default formula
        this.setFormula(this._formulaString);
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'custom';
    }

    getName() {
        return 'Custom Formula';
    }

    getDescription() {
        return 'User-defined iteration formula. Enter any complex function ' +
               'using z, c, and standard mathematical operations.';
    }

    getFormula() {
        return this._formulaString.replace(/\*/g, '\\cdot ');
    }

    getDefaultParams() {
        return {
            maxIterations: 500,
            bailout: 2,
            power: 2,
            smoothColoring: true,
            formula: 'z^2 + c'
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
                name: 'formula',
                type: 'string',
                default: 'z^2 + c',
                description: 'Iteration formula (use z, c, n, i)'
            }
        ];
    }

    supportsPerturbation() {
        return false; // Custom formulas don't support perturbation
    }

    supportsSeriesApproximation() {
        return false;
    }

    supportsArbitraryPrecision() {
        return false; // Could be added but complex
    }

    hasInterior() {
        return true;
    }

    // =========================================================================
    // FORMULA MANAGEMENT
    // =========================================================================

    /**
     * Set the iteration formula
     * 
     * @param {string} formula - Formula string (e.g., "z^3 + sin(c)")
     * @returns {{success: boolean, error?: string}}
     */
    setFormula(formula) {
        this._formulaString = formula;
        
        // Check cache first
        if (this._formulaCache.has(formula)) {
            this._compiledFormula = this._formulaCache.get(formula);
            this._isValid = true;
            this._errorMessage = null;
            return { success: true };
        }
        
        // Validate and compile
        const validation = this.parser.validate(formula);
        
        if (!validation.valid) {
            this._isValid = false;
            this._errorMessage = validation.error;
            this._compiledFormula = null;
            this.logger.error(`Invalid formula: ${validation.error}`);
            return { success: false, error: validation.error };
        }
        
        try {
            this._compiledFormula = this.parser.compile(formula);
            this._isValid = true;
            this._errorMessage = null;
            
            // Cache the compiled formula
            this._formulaCache.set(formula, this._compiledFormula);
            
            this.logger.info(`Compiled formula: ${formula}`);
            return { success: true };
        } catch (error) {
            this._isValid = false;
            this._errorMessage = error.message;
            this._compiledFormula = null;
            this.logger.error(`Compilation error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current formula string
     * @returns {string}
     */
    getFormulaString() {
        return this._formulaString;
    }

    /**
     * Check if current formula is valid
     * @returns {boolean}
     */
    isValid() {
        return this._isValid;
    }

    /**
     * Get error message (if formula is invalid)
     * @returns {string|null}
     */
    getErrorMessage() {
        return this._errorMessage;
    }

    /**
     * Get variables used by current formula
     * @returns {Set<string>}
     */
    getUsedVariables() {
        if (!this._isValid) return new Set();
        return this.parser.getDependencies(this._formulaString);
    }

    /**
     * Set formula from example library
     * @param {string} exampleName
     * @returns {{success: boolean, error?: string}}
     */
    setExample(exampleName) {
        if (exampleName in ExampleFormulas) {
            return this.setFormula(ExampleFormulas[exampleName].formula);
        }
        return { success: false, error: `Unknown example: ${exampleName}` };
    }

    /**
     * Get available examples
     * @returns {Object}
     */
    getExamples() {
        return ExampleFormulas;
    }

    /**
     * Clear formula cache
     */
    clearCache() {
        this._formulaCache.clear();
        this.parser.clearCache();
    }

    // =========================================================================
    // ITERATION
    // =========================================================================

    /**
     * Iterate using custom formula
     * 
     * Evaluates z_{n+1} = f(z_n, c, p, n) using the compiled formula.
     * 
     * @param {Complex} z0 - Starting z (usually 0 or c)
     * @param {Complex} c - Parameter c (usually the pixel coordinate)
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterate(z0, c, params = this.params) {
        const result = new IterationResult();
        
        if (!this._isValid || !this._compiledFormula) {
            result.iterations = 0;
            result.escaped = false;
            result.smooth = 0;
            return result;
        }
        
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        // Determine if formula uses z or starts from c
        const usedVars = this.getUsedVariables();
        const usesZ = usedVars.has('z');
        
        // Initialize z
        let z = usesZ ? z0.clone() : c.clone();
        
        // For orbit trap
        let minTrapDist = Infinity;
        const computeTrap = params.orbitTrap;
        
        // For stripe average
        let stripeSum = 0;
        const computeStripe = params.stripeAverage;
        const stripeDensity = params.stripeDensity;
        
        let n = 0;
        let mag2 = z.magnitudeSquared;
        let prevZ = new Complex(0, 0);
        
        try {
            while (n < maxIter && mag2 <= bailout2 && Number.isFinite(mag2)) {
                // Orbit trap
                if (computeTrap) {
                    const trapDist = this.calculateOrbitTrapDistance(
                        z,
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
                    const angle = Math.atan2(z.im, z.re);
                    stripeSum += 0.5 * Math.sin(stripeDensity * angle) + 0.5;
                }
                
                // Evaluate formula: z_{n+1} = f(z, c, p, n)
                const newZ = this._compiledFormula(z, c, c, n);
                
                // Check for invalid results
                if (!newZ || newZ.isNaN || !newZ.isFinite) {
                    break;
                }
                
                prevZ = z;
                z = newZ;
                mag2 = z.magnitudeSquared;
                n++;
            }
        } catch (error) {
            this.logger.warn(`Iteration error at n=${n}: ${error.message}`);
        }
        
        // Build result
        result.iterations = n;
        result.finalZ = z;
        result.finalMagnitude2 = mag2;
        result.escaped = mag2 > bailout2;
        
        // Smooth coloring (estimate power from formula)
        if (result.escaped && params.smoothColoring && Number.isFinite(mag2)) {
            const power = this._estimatePower();
            result.smooth = this.calculateSmoothIterations(n, z, power, params.bailout);
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
        
        result.angle = Math.atan2(z.im, z.re);
        
        return result;
    }

    /**
     * Estimate the dominant power in the formula
     * Used for smooth coloring calculation
     * @private
     * @returns {number}
     */
    _estimatePower() {
        // Simple heuristic: look for z^n pattern
        const match = this._formulaString.match(/z\^(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
        
        // Check for z² (z^2)
        if (this._formulaString.includes('z^2') || this._formulaString.includes('z*z')) {
            return 2;
        }
        
        // Check for z³
        if (this._formulaString.includes('z^3')) {
            return 3;
        }
        
        // Default to 2
        return 2;
    }

    // =========================================================================
    // JULIA MODE
    // =========================================================================

    /**
     * Iterate in Julia mode (fixed c, varying z0)
     * 
     * @param {Complex} z0 - Starting point (the pixel)
     * @param {Complex} juliaC - Fixed Julia parameter
     * @param {FractalParams} params
     * @returns {IterationResult}
     */
    iterateJulia(z0, juliaC, params = this.params) {
        const result = new IterationResult();
        
        if (!this._isValid || !this._compiledFormula) {
            return result;
        }
        
        const maxIter = params.maxIterations;
        const bailout2 = params.bailoutSquared;
        
        let z = z0.clone();
        const c = juliaC;
        let n = 0;
        let mag2 = z.magnitudeSquared;
        
        try {
            while (n < maxIter && mag2 <= bailout2 && Number.isFinite(mag2)) {
                const newZ = this._compiledFormula(z, c, c, n);
                
                if (!newZ || newZ.isNaN || !newZ.isFinite) {
                    break;
                }
                
                z = newZ;
                mag2 = z.magnitudeSquared;
                n++;
            }
        } catch (error) {
            this.logger.warn(`Julia iteration error: ${error.message}`);
        }
        
        result.iterations = n;
        result.finalZ = z;
        result.finalMagnitude2 = mag2;
        result.escaped = mag2 > bailout2;
        
        if (result.escaped && params.smoothColoring && Number.isFinite(mag2)) {
            const power = this._estimatePower();
            result.smooth = this.calculateSmoothIterations(n, z, power, params.bailout);
        } else {
            result.smooth = n;
        }
        
        return result;
    }

    // =========================================================================
    // FORMULA ANALYSIS
    // =========================================================================

    /**
     * Analyze formula to determine properties
     * @returns {Object}
     */
    analyzeFormula() {
        return {
            formula: this._formulaString,
            valid: this._isValid,
            error: this._errorMessage,
            usedVariables: Array.from(this.getUsedVariables()),
            estimatedPower: this._estimatePower(),
            hasTrigFunctions: /sin|cos|tan|sinh|cosh|tanh/.test(this._formulaString),
            hasExpLog: /exp|log/.test(this._formulaString),
            hasComplexOps: /conj|real|imag|abs|arg/.test(this._formulaString),
            hasDivision: this._formulaString.includes('/')
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { ExampleFormulas };
export default CustomFormula;
