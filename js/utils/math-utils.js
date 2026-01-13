/**
 * ============================================================================
 * ABYSS EXPLORER - MATH UTILITIES
 * ============================================================================
 * 
 * Extended math functions for fractal calculations.
 * Includes arbitrary precision helpers, complex number operations,
 * matrix operations, and floating-point safeguards.
 * 
 * @module utils/math-utils
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const PI = Math.PI;
export const TAU = Math.PI * 2;
export const E = Math.E;
export const PHI = (1 + Math.sqrt(5)) / 2;  // Golden ratio
export const SQRT2 = Math.SQRT2;
export const SQRT3 = Math.sqrt(3);
export const LN2 = Math.LN2;
export const LN10 = Math.LN10;
export const LOG2E = Math.LOG2E;
export const LOG10E = Math.LOG10E;

// Epsilon values for floating-point comparisons
export const EPSILON = Number.EPSILON;
export const FLOAT_EPSILON = 1e-7;
export const DOUBLE_EPSILON = 1e-15;

// ============================================================================
// BASIC MATH OPERATIONS
// ============================================================================

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Inverse lerp
 */
export function inverseLerp(a, b, value) {
    if (a === b) return 0;
    return (value - a) / (b - a);
}

/**
 * Remap value from one range to another
 */
export function remap(value, fromMin, fromMax, toMin, toMax) {
    const t = inverseLerp(fromMin, fromMax, value);
    return lerp(toMin, toMax, t);
}

/**
 * Smoothstep interpolation
 */
export function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/**
 * Smoother smoothstep (quintic)
 */
export function smootherstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Modulo that always returns positive
 */
export function mod(n, m) {
    return ((n % m) + m) % m;
}

/**
 * Fraction part of number
 */
export function fract(x) {
    return x - Math.floor(x);
}

/**
 * Sign function (-1, 0, or 1)
 */
export function sign(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
}

/**
 * Step function (0 if x < edge, else 1)
 */
export function step(edge, x) {
    return x < edge ? 0 : 1;
}

// ============================================================================
// POWER AND LOGARITHM FUNCTIONS
// ============================================================================

/**
 * Safe logarithm (returns -Infinity for non-positive)
 */
export function safeLog(x, base = Math.E) {
    if (x <= 0) return -Infinity;
    return Math.log(x) / Math.log(base);
}

/**
 * Integer log2 using bit operations
 */
export function log2Int(n) {
    if (n <= 0) return -Infinity;
    return 31 - Math.clz32(n);
}

/**
 * Fast approximate log2
 */
export function log2Fast(x) {
    if (x <= 0) return -Infinity;
    
    const buf = new ArrayBuffer(8);
    const f64 = new Float64Array(buf);
    const i32 = new Int32Array(buf);
    
    f64[0] = x;
    
    // Extract exponent from IEEE 754 double
    const exp = ((i32[1] >>> 20) & 0x7FF) - 1023;
    
    // Approximate log2 of mantissa
    i32[1] = (i32[1] & 0x000FFFFF) | 0x3FF00000;
    const m = f64[0];
    const logM = (m - 1) * (2.0 - 0.5 * (m - 1));
    
    return exp + logM;
}

/**
 * Safe power function
 */
export function safePow(base, exp) {
    if (base === 0 && exp <= 0) return NaN;
    return Math.pow(base, exp);
}

/**
 * Integer power (faster for small integer exponents)
 */
export function intPow(base, exp) {
    if (exp < 0) return 1 / intPow(base, -exp);
    if (exp === 0) return 1;
    if (exp === 1) return base;
    
    let result = 1;
    while (exp > 0) {
        if (exp & 1) result *= base;
        exp >>= 1;
        base *= base;
    }
    return result;
}

// ============================================================================
// COMPLEX NUMBER OPERATIONS
// ============================================================================

/**
 * Complex number class for fractal calculations
 */
export class Complex {
    constructor(re = 0, im = 0) {
        this.re = re;
        this.im = im;
    }
    
    static fromPolar(r, theta) {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }
    
    clone() {
        return new Complex(this.re, this.im);
    }
    
    // Magnitude squared (faster than magnitude)
    abs2() {
        return this.re * this.re + this.im * this.im;
    }
    
    // Magnitude
    abs() {
        return Math.sqrt(this.abs2());
    }
    
    // Argument (angle)
    arg() {
        return Math.atan2(this.im, this.re);
    }
    
    // Conjugate
    conj() {
        return new Complex(this.re, -this.im);
    }
    
    // Addition
    add(other) {
        if (typeof other === 'number') {
            return new Complex(this.re + other, this.im);
        }
        return new Complex(this.re + other.re, this.im + other.im);
    }
    
    // Subtraction
    sub(other) {
        if (typeof other === 'number') {
            return new Complex(this.re - other, this.im);
        }
        return new Complex(this.re - other.re, this.im - other.im);
    }
    
    // Multiplication
    mul(other) {
        if (typeof other === 'number') {
            return new Complex(this.re * other, this.im * other);
        }
        return new Complex(
            this.re * other.re - this.im * other.im,
            this.re * other.im + this.im * other.re
        );
    }
    
    // Division
    div(other) {
        if (typeof other === 'number') {
            return new Complex(this.re / other, this.im / other);
        }
        const denom = other.abs2();
        return new Complex(
            (this.re * other.re + this.im * other.im) / denom,
            (this.im * other.re - this.re * other.im) / denom
        );
    }
    
    // Square
    square() {
        return new Complex(
            this.re * this.re - this.im * this.im,
            2 * this.re * this.im
        );
    }
    
    // Cube
    cube() {
        const r2 = this.re * this.re;
        const i2 = this.im * this.im;
        return new Complex(
            this.re * (r2 - 3 * i2),
            this.im * (3 * r2 - i2)
        );
    }
    
    // Power (integer)
    pow(n) {
        if (n === 0) return new Complex(1, 0);
        if (n === 1) return this.clone();
        if (n === 2) return this.square();
        if (n === 3) return this.cube();
        
        // Use polar form for higher powers
        const r = this.abs();
        const theta = this.arg();
        return Complex.fromPolar(Math.pow(r, n), theta * n);
    }
    
    // Exponential
    exp() {
        const er = Math.exp(this.re);
        return new Complex(er * Math.cos(this.im), er * Math.sin(this.im));
    }
    
    // Natural logarithm
    log() {
        return new Complex(Math.log(this.abs()), this.arg());
    }
    
    // Sine
    sin() {
        return new Complex(
            Math.sin(this.re) * Math.cosh(this.im),
            Math.cos(this.re) * Math.sinh(this.im)
        );
    }
    
    // Cosine
    cos() {
        return new Complex(
            Math.cos(this.re) * Math.cosh(this.im),
            -Math.sin(this.re) * Math.sinh(this.im)
        );
    }
    
    // Square root
    sqrt() {
        const r = this.abs();
        const theta = this.arg();
        return Complex.fromPolar(Math.sqrt(r), theta / 2);
    }
    
    toString() {
        if (this.im >= 0) {
            return `${this.re} + ${this.im}i`;
        }
        return `${this.re} - ${-this.im}i`;
    }
}

// ============================================================================
// MATRIX OPERATIONS (3x3 and 4x4 for 3D)
// ============================================================================

/**
 * Create 4x4 identity matrix
 */
export function mat4Identity() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

/**
 * Multiply two 4x4 matrices
 */
export function mat4Multiply(a, b) {
    const result = new Float32Array(16);
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += a[i * 4 + k] * b[k * 4 + j];
            }
            result[i * 4 + j] = sum;
        }
    }
    
    return result;
}

/**
 * Create 4x4 translation matrix
 */
export function mat4Translate(x, y, z) {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ]);
}

/**
 * Create 4x4 scale matrix
 */
export function mat4Scale(x, y, z) {
    return new Float32Array([
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    ]);
}

/**
 * Create 4x4 rotation matrix around X axis
 */
export function mat4RotateX(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    return new Float32Array([
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
    ]);
}

/**
 * Create 4x4 rotation matrix around Y axis
 */
export function mat4RotateY(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    return new Float32Array([
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
    ]);
}

/**
 * Create 4x4 rotation matrix around Z axis
 */
export function mat4RotateZ(angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    
    return new Float32Array([
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

/**
 * Create perspective projection matrix
 */
export function mat4Perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
    ]);
}

/**
 * Create look-at view matrix
 */
export function mat4LookAt(eye, target, up) {
    const zAxis = vec3Normalize(vec3Sub(eye, target));
    const xAxis = vec3Normalize(vec3Cross(up, zAxis));
    const yAxis = vec3Cross(zAxis, xAxis);
    
    return new Float32Array([
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -vec3Dot(xAxis, eye), -vec3Dot(yAxis, eye), -vec3Dot(zAxis, eye), 1
    ]);
}

// ============================================================================
// VECTOR OPERATIONS (3D)
// ============================================================================

/**
 * Vector addition
 */
export function vec3Add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/**
 * Vector subtraction
 */
export function vec3Sub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/**
 * Vector scale
 */
export function vec3Scale(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
}

/**
 * Vector dot product
 */
export function vec3Dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Vector cross product
 */
export function vec3Cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

/**
 * Vector length
 */
export function vec3Length(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/**
 * Normalize vector
 */
export function vec3Normalize(v) {
    const len = vec3Length(v);
    if (len === 0) return [0, 0, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Linear interpolation for vectors
 */
export function vec3Lerp(a, b, t) {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
    ];
}

// ============================================================================
// FLOATING-POINT SAFEGUARDS
// ============================================================================

/**
 * Check if two floats are approximately equal
 */
export function approxEqual(a, b, epsilon = FLOAT_EPSILON) {
    return Math.abs(a - b) <= epsilon * Math.max(1, Math.abs(a), Math.abs(b));
}

/**
 * Check if float is approximately zero
 */
export function isZero(x, epsilon = FLOAT_EPSILON) {
    return Math.abs(x) <= epsilon;
}

/**
 * Check if value is finite and not NaN
 */
export function isValidNumber(x) {
    return typeof x === 'number' && isFinite(x);
}

/**
 * Sanitize number (replace NaN/Infinity with default)
 */
export function sanitize(x, defaultValue = 0) {
    return isValidNumber(x) ? x : defaultValue;
}

/**
 * Prevent denormalized numbers (can cause slowdowns)
 */
export function flushDenormals(x) {
    return Math.abs(x) < Number.MIN_VALUE ? 0 : x;
}

/**
 * Round to avoid floating-point errors
 */
export function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

// ============================================================================
// ARBITRARY PRECISION HELPERS
// ============================================================================

/**
 * Parse arbitrary precision string to number (loses precision)
 */
export function parseArbitraryPrecision(str) {
    if (typeof str === 'number') return str;
    return parseFloat(str);
}

/**
 * Format number as arbitrary precision string
 */
export function formatArbitraryPrecision(num, precision = 50) {
    if (typeof num === 'string') return num;
    
    // For very small or very large numbers, use exponential
    if (Math.abs(num) !== 0 && (Math.abs(num) < 1e-10 || Math.abs(num) > 1e10)) {
        return num.toExponential(precision - 1);
    }
    
    return num.toPrecision(precision);
}

/**
 * Add two arbitrary precision strings (using BigInt for integers)
 */
export function addStrings(a, b) {
    // Simple implementation - for full arbitrary precision use big.js
    return String(parseFloat(a) + parseFloat(b));
}

/**
 * Multiply two arbitrary precision strings
 */
export function multiplyStrings(a, b) {
    return String(parseFloat(a) * parseFloat(b));
}

// ============================================================================
// RANDOM NUMBER GENERATION
// ============================================================================

/**
 * Seeded random number generator (Mulberry32)
 */
export function createSeededRandom(seed) {
    return function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Random float in range [min, max)
 */
export function randomFloat(min = 0, max = 1, rng = Math.random) {
    return min + rng() * (max - min);
}

/**
 * Random integer in range [min, max]
 */
export function randomInt(min, max, rng = Math.random) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Gaussian (normal) random using Box-Muller transform
 */
export function randomGaussian(mean = 0, stdDev = 1, rng = Math.random) {
    let u, v, s;
    do {
        u = rng() * 2 - 1;
        v = rng() * 2 - 1;
        s = u * u + v * v;
    } while (s >= 1 || s === 0);
    
    const mul = Math.sqrt(-2.0 * Math.log(s) / s);
    return mean + stdDev * u * mul;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Constants
    PI, TAU, E, PHI, SQRT2, SQRT3, LN2, LN10, LOG2E, LOG10E,
    EPSILON, FLOAT_EPSILON, DOUBLE_EPSILON,
    
    // Basic math
    clamp, lerp, inverseLerp, remap, smoothstep, smootherstep,
    mod, fract, sign, step,
    
    // Power/log
    safeLog, log2Int, log2Fast, safePow, intPow,
    
    // Complex
    Complex,
    
    // Matrix
    mat4Identity, mat4Multiply, mat4Translate, mat4Scale,
    mat4RotateX, mat4RotateY, mat4RotateZ,
    mat4Perspective, mat4LookAt,
    
    // Vector
    vec3Add, vec3Sub, vec3Scale, vec3Dot, vec3Cross,
    vec3Length, vec3Normalize, vec3Lerp,
    
    // Float safety
    approxEqual, isZero, isValidNumber, sanitize, flushDenormals, roundTo,
    
    // Arbitrary precision
    parseArbitraryPrecision, formatArbitraryPrecision,
    addStrings, multiplyStrings,
    
    // Random
    createSeededRandom, randomFloat, randomInt, randomGaussian
};
