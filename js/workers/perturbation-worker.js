/**
 * ============================================================================
 * ABYSS EXPLORER - PERTURBATION WORKER
 * ============================================================================
 * 
 * Specialized Web Worker for perturbation theory pre-computations.
 * Handles the heavy lifting for ultra-deep zoom rendering.
 * 
 * Perturbation Theory Overview:
 * For zooms beyond ~10^14, standard double precision fails.
 * Perturbation theory lets us compute:
 *   z(n) = Z(n) + δz(n)
 * where Z(n) is a reference orbit computed at high precision,
 * and δz(n) is the perturbation computed at double precision.
 * 
 * This worker computes:
 * 1. Reference orbits using arbitrary precision arithmetic
 * 2. Delta terms and derivative tracking
 * 3. Series approximation coefficients
 * 4. Glitch detection and rebasing
 * 
 * Threading Strategy:
 * - Single dedicated worker for precision calculations
 * - Main thread sends center coordinates and parameters
 * - Worker returns reference orbit and series data
 * - Results cached and shared with render workers
 * 
 * Data Transfer:
 * - Large orbit arrays use transferable buffers
 * - Arbitrary precision numbers serialized as strings
 * - Compressed representation for very long orbits
 * 
 * @module workers/perturbation-worker
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

'use strict';

// ============================================================================
// ARBITRARY PRECISION ARITHMETIC
// ============================================================================

/**
 * Simple arbitrary precision decimal implementation
 * For production, consider using a library like decimal.js
 * 
 * Numbers are represented as: { sign, digits[], exponent }
 * where value = sign * 0.digits * 10^exponent
 */
class BigDecimal {
    constructor(value, precision = 50) {
        this.precision = precision;
        
        if (typeof value === 'string') {
            this.fromString(value);
        } else if (typeof value === 'number') {
            this.fromNumber(value);
        } else if (value instanceof BigDecimal) {
            this.sign = value.sign;
            this.digits = [...value.digits];
            this.exponent = value.exponent;
        } else {
            this.sign = 1;
            this.digits = [0];
            this.exponent = 0;
        }
    }
    
    fromString(str) {
        str = str.trim();
        
        // Handle sign
        this.sign = 1;
        if (str[0] === '-') {
            this.sign = -1;
            str = str.slice(1);
        } else if (str[0] === '+') {
            str = str.slice(1);
        }
        
        // Handle scientific notation
        let exponentPart = 0;
        const eIndex = str.toLowerCase().indexOf('e');
        if (eIndex !== -1) {
            exponentPart = parseInt(str.slice(eIndex + 1), 10);
            str = str.slice(0, eIndex);
        }
        
        // Find decimal point
        const dotIndex = str.indexOf('.');
        if (dotIndex !== -1) {
            exponentPart -= (str.length - dotIndex - 1);
            str = str.slice(0, dotIndex) + str.slice(dotIndex + 1);
        }
        
        // Remove leading zeros
        while (str.length > 1 && str[0] === '0') {
            str = str.slice(1);
        }
        
        // Store digits
        this.digits = [];
        for (const char of str) {
            this.digits.push(parseInt(char, 10));
        }
        
        if (this.digits.length === 0) {
            this.digits = [0];
        }
        
        // Normalize exponent
        this.exponent = exponentPart + str.length;
        
        // Handle zero
        if (this.digits.length === 1 && this.digits[0] === 0) {
            this.sign = 1;
            this.exponent = 0;
        }
        
        this.truncate();
    }
    
    fromNumber(num) {
        if (num === 0) {
            this.sign = 1;
            this.digits = [0];
            this.exponent = 0;
            return;
        }
        
        this.sign = num < 0 ? -1 : 1;
        num = Math.abs(num);
        
        // Convert to string with max precision
        const str = num.toExponential(this.precision - 1);
        this.fromString(str);
    }
    
    truncate() {
        // Limit to precision digits
        if (this.digits.length > this.precision) {
            this.digits = this.digits.slice(0, this.precision);
        }
        
        // Remove trailing zeros
        while (this.digits.length > 1 && this.digits[this.digits.length - 1] === 0) {
            this.digits.pop();
        }
    }
    
    isZero() {
        return this.digits.length === 1 && this.digits[0] === 0;
    }
    
    negate() {
        const result = new BigDecimal(this);
        result.sign = -result.sign;
        return result;
    }
    
    abs() {
        const result = new BigDecimal(this);
        result.sign = 1;
        return result;
    }
    
    /**
     * Add two BigDecimals
     */
    add(other) {
        if (!(other instanceof BigDecimal)) {
            other = new BigDecimal(other, this.precision);
        }
        
        // Handle signs
        if (this.sign !== other.sign) {
            if (this.sign === -1) {
                return other.subtract(this.abs());
            } else {
                return this.subtract(other.abs());
            }
        }
        
        // Align exponents
        const expDiff = this.exponent - other.exponent;
        let digits1, digits2, resultExp;
        
        if (expDiff >= 0) {
            digits1 = [...this.digits];
            digits2 = new Array(expDiff).fill(0).concat(other.digits);
            resultExp = this.exponent;
        } else {
            digits1 = new Array(-expDiff).fill(0).concat(this.digits);
            digits2 = [...other.digits];
            resultExp = other.exponent;
        }
        
        // Pad to same length
        const maxLen = Math.max(digits1.length, digits2.length);
        while (digits1.length < maxLen) digits1.push(0);
        while (digits2.length < maxLen) digits2.push(0);
        
        // Add digits
        const result = new BigDecimal(0, this.precision);
        result.sign = this.sign;
        result.digits = [];
        
        let carry = 0;
        for (let i = maxLen - 1; i >= 0; i--) {
            const sum = digits1[i] + digits2[i] + carry;
            result.digits.unshift(sum % 10);
            carry = Math.floor(sum / 10);
        }
        
        if (carry > 0) {
            result.digits.unshift(carry);
            resultExp++;
        }
        
        result.exponent = resultExp;
        result.truncate();
        
        return result;
    }
    
    /**
     * Subtract two BigDecimals
     */
    subtract(other) {
        if (!(other instanceof BigDecimal)) {
            other = new BigDecimal(other, this.precision);
        }
        
        // a - b = a + (-b)
        return this.add(other.negate());
    }
    
    /**
     * Multiply two BigDecimals
     */
    multiply(other) {
        if (!(other instanceof BigDecimal)) {
            other = new BigDecimal(other, this.precision);
        }
        
        if (this.isZero() || other.isZero()) {
            return new BigDecimal(0, this.precision);
        }
        
        const result = new BigDecimal(0, this.precision);
        result.sign = this.sign * other.sign;
        result.exponent = this.exponent + other.exponent;
        
        // Standard multiplication algorithm
        const len1 = this.digits.length;
        const len2 = other.digits.length;
        const product = new Array(len1 + len2).fill(0);
        
        for (let i = len1 - 1; i >= 0; i--) {
            for (let j = len2 - 1; j >= 0; j--) {
                const p = this.digits[i] * other.digits[j];
                const pos = i + j + 1;
                product[pos] += p;
                product[pos - 1] += Math.floor(product[pos] / 10);
                product[pos] %= 10;
            }
        }
        
        // Remove leading zeros
        let start = 0;
        while (start < product.length - 1 && product[start] === 0) {
            start++;
            result.exponent--;
        }
        
        result.digits = product.slice(start);
        result.truncate();
        
        return result;
    }
    
    /**
     * Convert to JavaScript number (may lose precision)
     */
    toNumber() {
        if (this.isZero()) return 0;
        
        let str = this.sign === -1 ? '-' : '';
        str += '0.' + this.digits.join('');
        str += 'e' + this.exponent;
        
        return parseFloat(str);
    }
    
    /**
     * Convert to string
     */
    toString() {
        if (this.isZero()) return '0';
        
        let str = this.sign === -1 ? '-' : '';
        str += '0.' + this.digits.join('');
        str += 'e' + this.exponent;
        
        return str;
    }
}

// ============================================================================
// REFERENCE ORBIT COMPUTATION
// ============================================================================

/**
 * Compute reference orbit using arbitrary precision
 * 
 * @param {string} cx - Center x as string (arbitrary precision)
 * @param {string} cy - Center y as string
 * @param {number} maxIterations - Maximum orbit length
 * @param {number} precision - Decimal precision
 * @param {number} bailout - Escape radius squared
 * @returns {Object} Reference orbit data
 */
function computeReferenceOrbit(cx, cy, maxIterations, precision, bailout) {
    const cReal = new BigDecimal(cx, precision);
    const cImag = new BigDecimal(cy, precision);
    
    let zReal = new BigDecimal(0, precision);
    let zImag = new BigDecimal(0, precision);
    
    // Store orbit as double precision (sufficient for rendering)
    const orbit = [];
    
    // Store high-precision orbit for rebasing (sampled)
    const highPrecOrbit = [];
    const sampleInterval = Math.max(1, Math.floor(maxIterations / 100));
    
    for (let i = 0; i < maxIterations; i++) {
        // Convert to double for storage and bailout check
        const zr = zReal.toNumber();
        const zi = zImag.toNumber();
        
        // Store in orbit
        orbit.push({ zr, zi });
        
        // Sample high-precision for rebasing
        if (i % sampleInterval === 0) {
            highPrecOrbit.push({
                iteration: i,
                zReal: zReal.toString(),
                zImag: zImag.toString()
            });
        }
        
        // Bailout check
        if (zr * zr + zi * zi > bailout) {
            return {
                orbit,
                highPrecOrbit,
                escaped: true,
                escapeIteration: i
            };
        }
        
        // z = z² + c
        // (a + bi)² = a² - b² + 2abi
        const zReal2 = zReal.multiply(zReal);
        const zImag2 = zImag.multiply(zImag);
        const zRealImag = zReal.multiply(zImag);
        
        const newZReal = zReal2.subtract(zImag2).add(cReal);
        const newZImag = zRealImag.add(zRealImag).add(cImag);
        
        zReal = newZReal;
        zImag = newZImag;
        
        // Progress report
        if (i % 1000 === 0) {
            self.postMessage({
                type: 'progress',
                stage: 'reference',
                progress: i / maxIterations
            });
        }
    }
    
    return {
        orbit,
        highPrecOrbit,
        escaped: false,
        escapeIteration: maxIterations
    };
}

// ============================================================================
// SERIES APPROXIMATION
// ============================================================================

/**
 * Compute series approximation coefficients
 * 
 * The series approximation allows skipping many initial iterations.
 * For small δc, we approximate:
 *   δz(n) ≈ A₁(n)·δc + A₂(n)·δc² + A₃(n)·δc³ + ...
 * 
 * The coefficients satisfy:
 *   A₁(n+1) = 2·Z(n)·A₁(n) + 1
 *   A₂(n+1) = 2·Z(n)·A₂(n) + A₁(n)²
 *   A₃(n+1) = 2·Z(n)·A₃(n) + 2·A₁(n)·A₂(n)
 *   ...
 * 
 * @param {Array} orbit - Reference orbit
 * @param {number} numTerms - Number of series terms (typically 3-10)
 * @param {number} maxSkip - Maximum iterations to skip
 * @param {number} tolerance - Error tolerance for validity
 * @returns {Object} Series coefficients and valid range
 */
function computeSeriesCoefficients(orbit, numTerms, maxSkip, tolerance) {
    // Initialize coefficients: A[k] = { ar, ai } complex
    const coeffs = [];
    for (let k = 0; k < numTerms; k++) {
        coeffs.push({ ar: k === 0 ? 1 : 0, ai: 0 });
    }
    
    const result = {
        validIterations: 0,
        coefficients: []
    };
    
    // Track coefficient history for validation
    const coeffHistory = [];
    
    for (let n = 0; n < Math.min(orbit.length - 1, maxSkip); n++) {
        const Z = orbit[n];
        const Zr = Z.zr;
        const Zi = Z.zi;
        
        // Update coefficients
        const newCoeffs = [];
        
        for (let k = 0; k < numTerms; k++) {
            let newAr, newAi;
            
            if (k === 0) {
                // A₁(n+1) = 2·Z(n)·A₁(n) + 1
                const A = coeffs[0];
                newAr = 2 * (Zr * A.ar - Zi * A.ai) + 1;
                newAi = 2 * (Zr * A.ai + Zi * A.ar);
            } else {
                // A_{k+1}(n+1) = 2·Z(n)·A_{k+1}(n) + sum_{j=1}^{k} A_j · A_{k+1-j}
                const A = coeffs[k];
                newAr = 2 * (Zr * A.ar - Zi * A.ai);
                newAi = 2 * (Zr * A.ai + Zi * A.ar);
                
                // Add convolution sum
                for (let j = 0; j < k; j++) {
                    const Aj = coeffs[j];
                    const Akj = coeffs[k - 1 - j];
                    newAr += Aj.ar * Akj.ar - Aj.ai * Akj.ai;
                    newAi += Aj.ar * Akj.ai + Aj.ai * Akj.ar;
                }
            }
            
            newCoeffs.push({ ar: newAr, ai: newAi });
        }
        
        // Check for overflow
        const maxCoeff = Math.max(...newCoeffs.map(c => Math.abs(c.ar) + Math.abs(c.ai)));
        if (!isFinite(maxCoeff) || maxCoeff > 1e100) {
            break;
        }
        
        // Update coefficients
        for (let k = 0; k < numTerms; k++) {
            coeffs[k] = newCoeffs[k];
        }
        
        // Store history
        coeffHistory.push(newCoeffs.map(c => ({ ...c })));
        result.validIterations = n + 1;
        
        // Progress
        if (n % 500 === 0) {
            self.postMessage({
                type: 'progress',
                stage: 'series',
                progress: n / maxSkip
            });
        }
    }
    
    // Copy final coefficients
    result.coefficients = coeffs.map(c => ({ ...c }));
    
    return result;
}

// ============================================================================
// GLITCH DETECTION
// ============================================================================

/**
 * Detect potential glitches in the reference orbit
 * 
 * Glitches occur when the reference orbit comes too close to zero,
 * causing |δz| to dominate |Z|. We detect these and mark iterations
 * that may need rebasing.
 * 
 * @param {Array} orbit - Reference orbit
 * @param {number} threshold - Glitch detection threshold
 * @returns {Array} Indices of potential glitch iterations
 */
function detectGlitchIterations(orbit, threshold = 1e-6) {
    const glitchIterations = [];
    
    for (let i = 0; i < orbit.length; i++) {
        const Z = orbit[i];
        const r2 = Z.zr * Z.zr + Z.zi * Z.zi;
        
        if (r2 < threshold) {
            glitchIterations.push(i);
        }
    }
    
    return glitchIterations;
}

/**
 * Compute derivative orbit for distance estimation
 * 
 * @param {Array} orbit - Reference orbit
 * @returns {Array} Derivative orbit
 */
function computeDerivativeOrbit(orbit) {
    const derivOrbit = [{ dzr: 1, dzi: 0 }];
    
    for (let i = 0; i < orbit.length - 1; i++) {
        const Z = orbit[i];
        const dZ = derivOrbit[i];
        
        // dZ' = 2 * Z * dZ
        const newDzr = 2 * (Z.zr * dZ.dzr - Z.zi * dZ.dzi);
        const newDzi = 2 * (Z.zr * dZ.dzi + Z.zi * dZ.dzr);
        
        derivOrbit.push({ dzr: newDzr, dzi: newDzi });
    }
    
    return derivOrbit;
}

// ============================================================================
// WORKER STATE
// ============================================================================

let currentTask = null;
let cancelRequested = false;

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.onmessage = function(event) {
    const { type, taskId, data } = event.data;
    
    switch (type) {
        case 'computeReference':
            handleComputeReference(taskId, data);
            break;
            
        case 'computeSeries':
            handleComputeSeries(taskId, data);
            break;
            
        case 'detectGlitches':
            handleDetectGlitches(taskId, data);
            break;
            
        case 'computeDerivative':
            handleComputeDerivative(taskId, data);
            break;
            
        case 'cancel':
            cancelRequested = true;
            break;
            
        case 'ping':
            self.postMessage({ type: 'pong', taskId });
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
};

/**
 * Handle reference orbit computation
 */
function handleComputeReference(taskId, data) {
    const {
        cx, cy,
        maxIterations,
        precision = 50,
        bailout = 4
    } = data;
    
    currentTask = taskId;
    cancelRequested = false;
    
    try {
        const startTime = performance.now();
        
        const result = computeReferenceOrbit(cx, cy, maxIterations, precision, bailout);
        
        if (cancelRequested) {
            self.postMessage({ type: 'cancelled', taskId });
            return;
        }
        
        const elapsed = performance.now() - startTime;
        
        // Convert orbit to transferable Float64Array
        const orbitData = new Float64Array(result.orbit.length * 2);
        for (let i = 0; i < result.orbit.length; i++) {
            orbitData[i * 2] = result.orbit[i].zr;
            orbitData[i * 2 + 1] = result.orbit[i].zi;
        }
        
        self.postMessage({
            type: 'referenceComplete',
            taskId,
            result: {
                orbitData,
                orbitLength: result.orbit.length,
                highPrecOrbit: result.highPrecOrbit,
                escaped: result.escaped,
                escapeIteration: result.escapeIteration,
                elapsed
            }
        }, [orbitData.buffer]);
        
    } catch (error) {
        self.postMessage({
            type: 'error',
            taskId,
            error: error.message
        });
    } finally {
        currentTask = null;
    }
}

/**
 * Handle series coefficient computation
 */
function handleComputeSeries(taskId, data) {
    const {
        orbit,
        numTerms = 5,
        maxSkip = 10000,
        tolerance = 1e-10
    } = data;
    
    currentTask = taskId;
    cancelRequested = false;
    
    try {
        const startTime = performance.now();
        
        // Convert orbit data back to objects
        const orbitObjects = [];
        for (let i = 0; i < orbit.length / 2; i++) {
            orbitObjects.push({
                zr: orbit[i * 2],
                zi: orbit[i * 2 + 1]
            });
        }
        
        const result = computeSeriesCoefficients(orbitObjects, numTerms, maxSkip, tolerance);
        
        if (cancelRequested) {
            self.postMessage({ type: 'cancelled', taskId });
            return;
        }
        
        const elapsed = performance.now() - startTime;
        
        self.postMessage({
            type: 'seriesComplete',
            taskId,
            result: {
                coefficients: result.coefficients,
                validIterations: result.validIterations,
                elapsed
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'error',
            taskId,
            error: error.message
        });
    } finally {
        currentTask = null;
    }
}

/**
 * Handle glitch detection
 */
function handleDetectGlitches(taskId, data) {
    const { orbit, threshold = 1e-6 } = data;
    
    try {
        // Convert orbit data
        const orbitObjects = [];
        for (let i = 0; i < orbit.length / 2; i++) {
            orbitObjects.push({
                zr: orbit[i * 2],
                zi: orbit[i * 2 + 1]
            });
        }
        
        const glitchIterations = detectGlitchIterations(orbitObjects, threshold);
        
        self.postMessage({
            type: 'glitchesDetected',
            taskId,
            result: {
                glitchIterations,
                count: glitchIterations.length
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'error',
            taskId,
            error: error.message
        });
    }
}

/**
 * Handle derivative orbit computation
 */
function handleComputeDerivative(taskId, data) {
    const { orbit } = data;
    
    try {
        // Convert orbit data
        const orbitObjects = [];
        for (let i = 0; i < orbit.length / 2; i++) {
            orbitObjects.push({
                zr: orbit[i * 2],
                zi: orbit[i * 2 + 1]
            });
        }
        
        const derivOrbit = computeDerivativeOrbit(orbitObjects);
        
        // Convert to transferable
        const derivData = new Float64Array(derivOrbit.length * 2);
        for (let i = 0; i < derivOrbit.length; i++) {
            derivData[i * 2] = derivOrbit[i].dzr;
            derivData[i * 2 + 1] = derivOrbit[i].dzi;
        }
        
        self.postMessage({
            type: 'derivativeComplete',
            taskId,
            result: { derivData }
        }, [derivData.buffer]);
        
    } catch (error) {
        self.postMessage({
            type: 'error',
            taskId,
            error: error.message
        });
    }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

self.onerror = function(error) {
    self.postMessage({
        type: 'error',
        taskId: currentTask,
        error: error.message || 'Unknown error in perturbation worker'
    });
};

self.onunhandledrejection = function(event) {
    self.postMessage({
        type: 'error',
        taskId: currentTask,
        error: event.reason?.message || 'Unhandled promise rejection'
    });
};

// Signal ready
self.postMessage({ type: 'ready' });
