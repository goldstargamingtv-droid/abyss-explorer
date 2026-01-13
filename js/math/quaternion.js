/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - QUATERNION MATHEMATICS                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Quaternion and hypercomplex number systems for 3D fractal rendering          ║
 * ║                                                                                ║
 * ║  Mathematical Foundation:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  Quaternions extend complex numbers to 4 dimensions:                           ║
 * ║    q = w + xi + yj + zk                                                        ║
 * ║                                                                                ║
 * ║  where i, j, k are imaginary units satisfying:                                ║
 * ║    i² = j² = k² = ijk = -1                                                    ║
 * ║    ij = k,  jk = i,  ki = j                                                   ║
 * ║    ji = -k, kj = -i, ik = -j                                                  ║
 * ║                                                                                ║
 * ║  Note: Quaternion multiplication is NOT commutative!                          ║
 * ║    q₁ × q₂ ≠ q₂ × q₁  (in general)                                           ║
 * ║                                                                                ║
 * ║  Applications in Fractals:                                                     ║
 * ║  - Julia sets in 4D (rendered as 3D slices)                                   ║
 * ║  - Mandelbulb (uses spherical coordinates, not true quaternions)              ║
 * ║  - Quaternion Julia sets: q_{n+1} = q_n² + c                                  ║
 * ║                                                                                ║
 * ║  Also includes:                                                                ║
 * ║  - Hypercomplex extensions (bicomplex, tricomplex)                            ║
 * ║  - Dual numbers for automatic differentiation                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex } from './complex.js';
import { BigDecimal } from './arbitrary-precision.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const EPSILON = 1e-15;
const BAILOUT_SQUARED = 4;

// =============================================================================
// QUATERNION CLASS
// =============================================================================

/**
 * Quaternion Number
 * 
 * Represents a quaternion q = w + xi + yj + zk
 * 
 * Convention:
 * - w: scalar (real) part
 * - x, y, z: vector (imaginary) parts
 * 
 * Alternative notation: q = (s, v⃗) where s = w and v⃗ = (x, y, z)
 * 
 * @class Quaternion
 */
export class Quaternion {
    /**
     * Create a quaternion
     * 
     * @param {number} [w=0] - Scalar (real) part
     * @param {number} [x=0] - i coefficient
     * @param {number} [y=0] - j coefficient
     * @param {number} [z=0] - k coefficient
     * 
     * @example
     * const q = new Quaternion(1, 2, 3, 4);  // 1 + 2i + 3j + 4k
     * const pure = new Quaternion(0, 1, 1, 1);  // Pure imaginary
     * const scalar = new Quaternion(5);  // Just the scalar 5
     */
    constructor(w = 0, x = 0, y = 0, z = 0) {
        /** @type {number} Scalar (real) part */
        this.w = w;
        
        /** @type {number} i coefficient */
        this.x = x;
        
        /** @type {number} j coefficient */
        this.y = y;
        
        /** @type {number} k coefficient */
        this.z = z;
    }

    // =========================================================================
    // STATIC CONSTRUCTORS
    // =========================================================================

    /**
     * Create from scalar and vector
     * @param {number} scalar
     * @param {{x: number, y: number, z: number}} vector
     * @returns {Quaternion}
     */
    static fromScalarVector(scalar, vector) {
        return new Quaternion(scalar, vector.x, vector.y, vector.z);
    }

    /**
     * Create from axis-angle rotation
     * 
     * q = cos(θ/2) + sin(θ/2)(axi + ayj + azk)
     * where (ax, ay, az) is the normalized rotation axis
     * 
     * @param {{x: number, y: number, z: number}} axis - Rotation axis (will be normalized)
     * @param {number} angle - Rotation angle in radians
     * @returns {Quaternion}
     */
    static fromAxisAngle(axis, angle) {
        // Normalize axis
        const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
        if (len < EPSILON) {
            return Quaternion.identity();
        }
        
        const ax = axis.x / len;
        const ay = axis.y / len;
        const az = axis.z / len;
        
        const halfAngle = angle / 2;
        const sinHalf = Math.sin(halfAngle);
        const cosHalf = Math.cos(halfAngle);
        
        return new Quaternion(cosHalf, ax * sinHalf, ay * sinHalf, az * sinHalf);
    }

    /**
     * Create from Euler angles (ZYX convention)
     * 
     * @param {number} roll - Rotation around X axis
     * @param {number} pitch - Rotation around Y axis
     * @param {number} yaw - Rotation around Z axis
     * @returns {Quaternion}
     */
    static fromEuler(roll, pitch, yaw) {
        const cr = Math.cos(roll / 2);
        const sr = Math.sin(roll / 2);
        const cp = Math.cos(pitch / 2);
        const sp = Math.sin(pitch / 2);
        const cy = Math.cos(yaw / 2);
        const sy = Math.sin(yaw / 2);
        
        return new Quaternion(
            cr * cp * cy + sr * sp * sy,
            sr * cp * cy - cr * sp * sy,
            cr * sp * cy + sr * cp * sy,
            cr * cp * sy - sr * sp * cy
        );
    }

    /**
     * Create from two complex numbers
     * 
     * q = z1 + z2·j where z1, z2 are complex numbers
     * 
     * @param {Complex} z1 - First complex number (w + xi)
     * @param {Complex} z2 - Second complex number (y + zi scaled by j)
     * @returns {Quaternion}
     */
    static fromComplex(z1, z2 = new Complex(0, 0)) {
        return new Quaternion(z1.re, z1.im, z2.re, z2.im);
    }

    /**
     * Create from array [w, x, y, z]
     * @param {number[]} arr
     * @returns {Quaternion}
     */
    static fromArray(arr) {
        return new Quaternion(arr[0] || 0, arr[1] || 0, arr[2] || 0, arr[3] || 0);
    }

    /**
     * Identity quaternion (1 + 0i + 0j + 0k)
     * @returns {Quaternion}
     */
    static identity() {
        return new Quaternion(1, 0, 0, 0);
    }

    /**
     * Zero quaternion
     * @returns {Quaternion}
     */
    static zero() {
        return new Quaternion(0, 0, 0, 0);
    }

    /**
     * Pure imaginary i
     * @returns {Quaternion}
     */
    static i() {
        return new Quaternion(0, 1, 0, 0);
    }

    /**
     * Pure imaginary j
     * @returns {Quaternion}
     */
    static j() {
        return new Quaternion(0, 0, 1, 0);
    }

    /**
     * Pure imaginary k
     * @returns {Quaternion}
     */
    static k() {
        return new Quaternion(0, 0, 0, 1);
    }

    // =========================================================================
    // PROPERTIES
    // =========================================================================

    /**
     * Get the scalar (real) part
     * @returns {number}
     */
    get scalar() {
        return this.w;
    }

    /**
     * Get the vector (imaginary) part as object
     * @returns {{x: number, y: number, z: number}}
     */
    get vector() {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * Norm (magnitude) |q| = √(w² + x² + y² + z²)
     * @returns {number}
     */
    get norm() {
        return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
    }

    /**
     * Alias for norm
     * @returns {number}
     */
    get magnitude() {
        return this.norm;
    }

    /**
     * Norm squared |q|²
     * @returns {number}
     */
    get normSquared() {
        return this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
    }

    /**
     * Check if this is a unit quaternion (|q| ≈ 1)
     * @returns {boolean}
     */
    get isUnit() {
        return Math.abs(this.normSquared - 1) < EPSILON;
    }

    /**
     * Check if this is pure imaginary (scalar part ≈ 0)
     * @returns {boolean}
     */
    get isPure() {
        return Math.abs(this.w) < EPSILON;
    }

    /**
     * Check if this is a scalar (vector part ≈ 0)
     * @returns {boolean}
     */
    get isScalar() {
        return Math.abs(this.x) < EPSILON && 
               Math.abs(this.y) < EPSILON && 
               Math.abs(this.z) < EPSILON;
    }

    /**
     * Check if this is zero
     * @returns {boolean}
     */
    get isZero() {
        return this.normSquared < EPSILON * EPSILON;
    }

    // =========================================================================
    // BASIC OPERATIONS
    // =========================================================================

    /**
     * Add two quaternions: q1 + q2
     * 
     * Addition is component-wise:
     * (w1 + w2) + (x1 + x2)i + (y1 + y2)j + (z1 + z2)k
     * 
     * @param {Quaternion} q
     * @returns {Quaternion}
     */
    add(q) {
        return new Quaternion(
            this.w + q.w,
            this.x + q.x,
            this.y + q.y,
            this.z + q.z
        );
    }

    /**
     * Subtract: q1 - q2
     * @param {Quaternion} q
     * @returns {Quaternion}
     */
    sub(q) {
        return new Quaternion(
            this.w - q.w,
            this.x - q.x,
            this.y - q.y,
            this.z - q.z
        );
    }

    /**
     * Multiply quaternions: q1 × q2
     * 
     * The Hamilton product (non-commutative!):
     * 
     * Let q1 = (a, b, c, d) and q2 = (e, f, g, h)
     * 
     * q1 × q2 = (ae - bf - cg - dh,
     *            af + be + ch - dg,
     *            ag - bh + ce + df,
     *            ah + bg - cf + de)
     * 
     * Or in scalar-vector form:
     * (s1, v1) × (s2, v2) = (s1·s2 - v1·v2, s1·v2 + s2·v1 + v1×v2)
     * 
     * @param {Quaternion} q
     * @returns {Quaternion}
     */
    mul(q) {
        const a = this.w, b = this.x, c = this.y, d = this.z;
        const e = q.w, f = q.x, g = q.y, h = q.z;
        
        return new Quaternion(
            a * e - b * f - c * g - d * h,  // w
            a * f + b * e + c * h - d * g,  // x
            a * g - b * h + c * e + d * f,  // y
            a * h + b * g - c * f + d * e   // z
        );
    }

    /**
     * Multiply by scalar
     * @param {number} s
     * @returns {Quaternion}
     */
    scale(s) {
        return new Quaternion(this.w * s, this.x * s, this.y * s, this.z * s);
    }

    /**
     * Divide by scalar
     * @param {number} s
     * @returns {Quaternion}
     */
    divScalar(s) {
        return new Quaternion(this.w / s, this.x / s, this.y / s, this.z / s);
    }

    /**
     * Quaternion division: q1 / q2 = q1 × q2⁻¹
     * @param {Quaternion} q
     * @returns {Quaternion}
     */
    div(q) {
        return this.mul(q.inverse());
    }

    /**
     * Negate: -q
     * @returns {Quaternion}
     */
    neg() {
        return new Quaternion(-this.w, -this.x, -this.y, -this.z);
    }

    /**
     * Conjugate: q* = w - xi - yj - zk
     * 
     * Property: q × q* = |q|² (scalar)
     * 
     * @returns {Quaternion}
     */
    conj() {
        return new Quaternion(this.w, -this.x, -this.y, -this.z);
    }

    /**
     * Alias for conjugate
     * @returns {Quaternion}
     */
    conjugate() {
        return this.conj();
    }

    /**
     * Inverse (reciprocal): q⁻¹ = q* / |q|²
     * 
     * Property: q × q⁻¹ = q⁻¹ × q = 1
     * 
     * @returns {Quaternion}
     */
    inverse() {
        const n2 = this.normSquared;
        if (n2 < EPSILON * EPSILON) {
            throw new Error('Cannot invert zero quaternion');
        }
        return new Quaternion(
            this.w / n2,
            -this.x / n2,
            -this.y / n2,
            -this.z / n2
        );
    }

    /**
     * Normalize to unit quaternion
     * @returns {Quaternion}
     */
    normalize() {
        const n = this.norm;
        if (n < EPSILON) {
            return Quaternion.identity();
        }
        return this.divScalar(n);
    }

    /**
     * Square: q² = q × q
     * 
     * Expanded:
     * q² = (w² - x² - y² - z²) + 2w(xi + yj + zk)
     *    = (w² - |v|²) + 2wv
     * 
     * @returns {Quaternion}
     */
    square() {
        const w2 = this.w * this.w;
        const v2 = this.x * this.x + this.y * this.y + this.z * this.z;
        const twoW = 2 * this.w;
        
        return new Quaternion(
            w2 - v2,
            twoW * this.x,
            twoW * this.y,
            twoW * this.z
        );
    }

    // =========================================================================
    // POWER AND EXPONENTIAL FUNCTIONS
    // =========================================================================

    /**
     * Quaternion exponential: e^q
     * 
     * For q = (s, v⃗) where v⃗ = (x, y, z):
     * 
     * e^q = e^s × (cos|v| + (v̂)sin|v|)
     * 
     * where v̂ = v/|v| is the unit vector direction
     * 
     * @returns {Quaternion}
     */
    exp() {
        const vNorm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        const expW = Math.exp(this.w);
        
        if (vNorm < EPSILON) {
            // Pure scalar
            return new Quaternion(expW, 0, 0, 0);
        }
        
        const sinV = Math.sin(vNorm);
        const cosV = Math.cos(vNorm);
        const coeff = expW * sinV / vNorm;
        
        return new Quaternion(
            expW * cosV,
            coeff * this.x,
            coeff * this.y,
            coeff * this.z
        );
    }

    /**
     * Quaternion logarithm: ln(q)
     * 
     * For q = (s, v⃗):
     * 
     * ln(q) = ln|q| + (v̂)·arccos(s/|q|)
     * 
     * @returns {Quaternion}
     */
    log() {
        const qNorm = this.norm;
        
        if (qNorm < EPSILON) {
            throw new Error('Cannot take logarithm of zero quaternion');
        }
        
        const vNorm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        
        if (vNorm < EPSILON) {
            // Pure scalar (positive or negative)
            if (this.w > 0) {
                return new Quaternion(Math.log(this.w), 0, 0, 0);
            } else {
                // Negative real: ln(-a) = ln(a) + πi (choose i direction)
                return new Quaternion(Math.log(-this.w), Math.PI, 0, 0);
            }
        }
        
        const theta = Math.acos(this.w / qNorm);
        const coeff = theta / vNorm;
        
        return new Quaternion(
            Math.log(qNorm),
            coeff * this.x,
            coeff * this.y,
            coeff * this.z
        );
    }

    /**
     * Quaternion power: q^n for real n
     * 
     * q^n = e^(n·ln(q))
     * 
     * For integer n, uses faster repeated multiplication.
     * 
     * @param {number} n - Exponent (real number)
     * @returns {Quaternion}
     */
    pow(n) {
        // Special cases
        if (n === 0) return Quaternion.identity();
        if (n === 1) return this.clone();
        if (n === 2) return this.square();
        if (n === -1) return this.inverse();
        
        // Integer powers: use repeated squaring
        if (Number.isInteger(n) && n > 0 && n < 32) {
            return this._integerPow(n);
        }
        
        // General case: q^n = exp(n * ln(q))
        if (this.isZero) {
            return n > 0 ? Quaternion.zero() : Quaternion.identity();
        }
        
        return this.log().scale(n).exp();
    }

    /**
     * Integer power using binary exponentiation
     * @private
     * @param {number} n
     * @returns {Quaternion}
     */
    _integerPow(n) {
        let result = Quaternion.identity();
        let base = this.clone();
        
        while (n > 0) {
            if (n & 1) {
                result = result.mul(base);
            }
            base = base.square();
            n >>= 1;
        }
        
        return result;
    }

    /**
     * Quaternion power with quaternion exponent: q^p
     * 
     * q^p = e^(p·ln(q))
     * 
     * Note: This is generally multi-valued; we return principal value.
     * 
     * @param {Quaternion} p
     * @returns {Quaternion}
     */
    qpow(p) {
        if (this.isZero) {
            return Quaternion.zero();
        }
        return p.mul(this.log()).exp();
    }

    /**
     * Square root
     * 
     * For unit quaternion q = (cos θ, sin θ · v̂):
     * √q = (cos(θ/2), sin(θ/2) · v̂)
     * 
     * @returns {Quaternion}
     */
    sqrt() {
        return this.pow(0.5);
    }

    // =========================================================================
    // TRIGONOMETRIC FUNCTIONS
    // =========================================================================

    /**
     * Quaternion sine: sin(q)
     * 
     * sin(q) = sin(w)cosh|v| + cos(w)sinh|v|·v̂
     * 
     * @returns {Quaternion}
     */
    sin() {
        const vNorm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        
        if (vNorm < EPSILON) {
            return new Quaternion(Math.sin(this.w), 0, 0, 0);
        }
        
        const sinW = Math.sin(this.w);
        const cosW = Math.cos(this.w);
        const sinhV = Math.sinh(vNorm);
        const coshV = Math.cosh(vNorm);
        const coeff = cosW * sinhV / vNorm;
        
        return new Quaternion(
            sinW * coshV,
            coeff * this.x,
            coeff * this.y,
            coeff * this.z
        );
    }

    /**
     * Quaternion cosine: cos(q)
     * 
     * cos(q) = cos(w)cosh|v| - sin(w)sinh|v|·v̂
     * 
     * @returns {Quaternion}
     */
    cos() {
        const vNorm = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        
        if (vNorm < EPSILON) {
            return new Quaternion(Math.cos(this.w), 0, 0, 0);
        }
        
        const sinW = Math.sin(this.w);
        const cosW = Math.cos(this.w);
        const sinhV = Math.sinh(vNorm);
        const coshV = Math.cosh(vNorm);
        const coeff = -sinW * sinhV / vNorm;
        
        return new Quaternion(
            cosW * coshV,
            coeff * this.x,
            coeff * this.y,
            coeff * this.z
        );
    }

    /**
     * Quaternion tangent: tan(q) = sin(q)/cos(q)
     * @returns {Quaternion}
     */
    tan() {
        return this.sin().div(this.cos());
    }

    // =========================================================================
    // HYPERBOLIC FUNCTIONS
    // =========================================================================

    /**
     * Quaternion hyperbolic sine: sinh(q) = (e^q - e^(-q))/2
     * @returns {Quaternion}
     */
    sinh() {
        return this.exp().sub(this.neg().exp()).scale(0.5);
    }

    /**
     * Quaternion hyperbolic cosine: cosh(q) = (e^q + e^(-q))/2
     * @returns {Quaternion}
     */
    cosh() {
        return this.exp().add(this.neg().exp()).scale(0.5);
    }

    /**
     * Quaternion hyperbolic tangent
     * @returns {Quaternion}
     */
    tanh() {
        return this.sinh().div(this.cosh());
    }

    // =========================================================================
    // IN-PLACE OPERATIONS (Mutating)
    // =========================================================================

    /**
     * Set components
     * @param {number} w
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Quaternion} this
     */
    set(w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    /**
     * Copy from another quaternion
     * @param {Quaternion} q
     * @returns {Quaternion} this
     */
    copyFrom(q) {
        this.w = q.w;
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        return this;
    }

    /**
     * Add in place
     * @param {Quaternion} q
     * @returns {Quaternion} this
     */
    addMut(q) {
        this.w += q.w;
        this.x += q.x;
        this.y += q.y;
        this.z += q.z;
        return this;
    }

    /**
     * Multiply in place
     * @param {Quaternion} q
     * @returns {Quaternion} this
     */
    mulMut(q) {
        const a = this.w, b = this.x, c = this.y, d = this.z;
        const e = q.w, f = q.x, g = q.y, h = q.z;
        
        this.w = a * e - b * f - c * g - d * h;
        this.x = a * f + b * e + c * h - d * g;
        this.y = a * g - b * h + c * e + d * f;
        this.z = a * h + b * g - c * f + d * e;
        
        return this;
    }

    /**
     * Square in place
     * @returns {Quaternion} this
     */
    squareMut() {
        const w2 = this.w * this.w;
        const v2 = this.x * this.x + this.y * this.y + this.z * this.z;
        const twoW = 2 * this.w;
        
        this.x = twoW * this.x;
        this.y = twoW * this.y;
        this.z = twoW * this.z;
        this.w = w2 - v2;
        
        return this;
    }

    /**
     * Scale in place
     * @param {number} s
     * @returns {Quaternion} this
     */
    scaleMut(s) {
        this.w *= s;
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    /**
     * Normalize in place
     * @returns {Quaternion} this
     */
    normalizeMut() {
        const n = this.norm;
        if (n > EPSILON) {
            this.w /= n;
            this.x /= n;
            this.y /= n;
            this.z /= n;
        }
        return this;
    }

    /**
     * Conjugate in place
     * @returns {Quaternion} this
     */
    conjMut() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    // =========================================================================
    // ROTATION OPERATIONS
    // =========================================================================

    /**
     * Rotate a vector by this quaternion
     * 
     * For unit quaternion q, rotates vector v by:
     *   v' = q × v × q*
     * 
     * where v is treated as pure quaternion (0, v)
     * 
     * @param {{x: number, y: number, z: number}} v
     * @returns {{x: number, y: number, z: number}}
     */
    rotateVector(v) {
        // Optimized rotation formula
        // v' = v + 2w(q × v) + 2(q × (q × v))
        // where q here is the vector part (x, y, z)
        
        const qv = { x: this.x, y: this.y, z: this.z };
        
        // First cross product: t = 2 * (qv × v)
        const t = {
            x: 2 * (qv.y * v.z - qv.z * v.y),
            y: 2 * (qv.z * v.x - qv.x * v.z),
            z: 2 * (qv.x * v.y - qv.y * v.x)
        };
        
        // Second cross product: qv × t
        const qt = {
            x: qv.y * t.z - qv.z * t.y,
            y: qv.z * t.x - qv.x * t.z,
            z: qv.x * t.y - qv.y * t.x
        };
        
        return {
            x: v.x + this.w * t.x + qt.x,
            y: v.y + this.w * t.y + qt.y,
            z: v.z + this.w * t.z + qt.z
        };
    }

    /**
     * Convert to rotation matrix (3x3)
     * 
     * @returns {number[]} 9-element array in row-major order
     */
    toRotationMatrix() {
        const w2 = this.w * this.w;
        const x2 = this.x * this.x;
        const y2 = this.y * this.y;
        const z2 = this.z * this.z;
        
        const wx = this.w * this.x;
        const wy = this.w * this.y;
        const wz = this.w * this.z;
        const xy = this.x * this.y;
        const xz = this.x * this.z;
        const yz = this.y * this.z;
        
        return [
            w2 + x2 - y2 - z2,  2 * (xy - wz),      2 * (xz + wy),
            2 * (xy + wz),      w2 - x2 + y2 - z2,  2 * (yz - wx),
            2 * (xz - wy),      2 * (yz + wx),      w2 - x2 - y2 + z2
        ];
    }

    /**
     * Convert to Euler angles (ZYX convention)
     * @returns {{roll: number, pitch: number, yaw: number}}
     */
    toEuler() {
        // Roll (x-axis rotation)
        const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
        const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
        const roll = Math.atan2(sinr_cosp, cosr_cosp);
        
        // Pitch (y-axis rotation)
        const sinp = 2 * (this.w * this.y - this.z * this.x);
        let pitch;
        if (Math.abs(sinp) >= 1) {
            pitch = Math.sign(sinp) * Math.PI / 2; // Use 90 degrees if out of range
        } else {
            pitch = Math.asin(sinp);
        }
        
        // Yaw (z-axis rotation)
        const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
        const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
        const yaw = Math.atan2(siny_cosp, cosy_cosp);
        
        return { roll, pitch, yaw };
    }

    // =========================================================================
    // INTERPOLATION
    // =========================================================================

    /**
     * Spherical linear interpolation (SLERP)
     * 
     * Interpolates between two unit quaternions along the shortest arc
     * on the 4D unit sphere.
     * 
     * @param {Quaternion} q2 - Target quaternion
     * @param {number} t - Interpolation parameter [0, 1]
     * @returns {Quaternion}
     */
    slerp(q2, t) {
        // Compute dot product
        let dot = this.w * q2.w + this.x * q2.x + this.y * q2.y + this.z * q2.z;
        
        // If dot < 0, negate one to take shorter path
        let q2Adj = q2;
        if (dot < 0) {
            dot = -dot;
            q2Adj = q2.neg();
        }
        
        // If very close, use linear interpolation
        if (dot > 0.9995) {
            return new Quaternion(
                this.w + t * (q2Adj.w - this.w),
                this.x + t * (q2Adj.x - this.x),
                this.y + t * (q2Adj.y - this.y),
                this.z + t * (q2Adj.z - this.z)
            ).normalize();
        }
        
        const theta = Math.acos(dot);
        const sinTheta = Math.sin(theta);
        const scale1 = Math.sin((1 - t) * theta) / sinTheta;
        const scale2 = Math.sin(t * theta) / sinTheta;
        
        return new Quaternion(
            scale1 * this.w + scale2 * q2Adj.w,
            scale1 * this.x + scale2 * q2Adj.x,
            scale1 * this.y + scale2 * q2Adj.y,
            scale1 * this.z + scale2 * q2Adj.z
        );
    }

    /**
     * Linear interpolation (LERP)
     * @param {Quaternion} q2
     * @param {number} t
     * @returns {Quaternion}
     */
    lerp(q2, t) {
        return new Quaternion(
            this.w + t * (q2.w - this.w),
            this.x + t * (q2.x - this.x),
            this.y + t * (q2.y - this.y),
            this.z + t * (q2.z - this.z)
        );
    }

    // =========================================================================
    // ESCAPE TEST (for fractals)
    // =========================================================================

    /**
     * Check if magnitude squared exceeds threshold
     * Used in fractal iteration for escape detection.
     * 
     * @param {number} [threshold=BAILOUT_SQUARED]
     * @returns {boolean}
     */
    escaped(threshold = BAILOUT_SQUARED) {
        return this.normSquared > threshold;
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Clone this quaternion
     * @returns {Quaternion}
     */
    clone() {
        return new Quaternion(this.w, this.x, this.y, this.z);
    }

    /**
     * Check equality with tolerance
     * @param {Quaternion} q
     * @param {number} [tolerance=EPSILON]
     * @returns {boolean}
     */
    equals(q, tolerance = EPSILON) {
        return Math.abs(this.w - q.w) < tolerance &&
               Math.abs(this.x - q.x) < tolerance &&
               Math.abs(this.y - q.y) < tolerance &&
               Math.abs(this.z - q.z) < tolerance;
    }

    /**
     * Convert to array [w, x, y, z]
     * @returns {number[]}
     */
    toArray() {
        return [this.w, this.x, this.y, this.z];
    }

    /**
     * Convert to string
     * @param {number} [precision=4]
     * @returns {string}
     */
    toString(precision = 4) {
        const w = this.w.toFixed(precision);
        const x = Math.abs(this.x).toFixed(precision);
        const y = Math.abs(this.y).toFixed(precision);
        const z = Math.abs(this.z).toFixed(precision);
        
        const sx = this.x >= 0 ? '+' : '-';
        const sy = this.y >= 0 ? '+' : '-';
        const sz = this.z >= 0 ? '+' : '-';
        
        return `${w} ${sx} ${x}i ${sy} ${y}j ${sz} ${z}k`;
    }

    /**
     * Convert to Complex pair (z1, z2) where q = z1 + z2·j
     * @returns {{z1: Complex, z2: Complex}}
     */
    toComplexPair() {
        return {
            z1: new Complex(this.w, this.x),
            z2: new Complex(this.y, this.z)
        };
    }
}

// =============================================================================
// QUATERNION JULIA SET ITERATOR
// =============================================================================

/**
 * Quaternion Julia Set Iterator
 * 
 * Iterates the recurrence q_{n+1} = q_n² + c for quaternion Julia sets.
 * 
 * @class QuaternionJulia
 */
export class QuaternionJulia {
    /**
     * Create iterator
     * @param {Quaternion} c - Julia constant
     * @param {number} [maxIterations=100]
     * @param {number} [bailout=2]
     */
    constructor(c, maxIterations = 100, bailout = 2) {
        /** @type {Quaternion} */
        this.c = c;
        
        /** @type {number} */
        this.maxIterations = maxIterations;
        
        /** @type {number} */
        this.bailoutSquared = bailout * bailout;
    }

    /**
     * Iterate a point
     * 
     * @param {Quaternion} q0 - Starting point
     * @returns {{iterations: number, escaped: boolean, final: Quaternion}}
     */
    iterate(q0) {
        let q = q0.clone();
        let n = 0;
        
        while (n < this.maxIterations) {
            if (q.normSquared > this.bailoutSquared) {
                return { iterations: n, escaped: true, final: q };
            }
            
            q = q.square().add(this.c);
            n++;
        }
        
        return { iterations: n, escaped: false, final: q };
    }

    /**
     * Check if point is in the set (interior)
     * @param {Quaternion} q0
     * @returns {boolean}
     */
    isInSet(q0) {
        return !this.iterate(q0).escaped;
    }
}

// =============================================================================
// BICOMPLEX NUMBERS
// =============================================================================

/**
 * Bicomplex Number
 * 
 * A bicomplex number is z = z1 + z2·j where z1, z2 are complex numbers
 * and j² = -1 but j commutes with i.
 * 
 * Unlike quaternions, bicomplex multiplication IS commutative.
 * 
 * Bicomplex numbers are isomorphic to C × C via:
 *   z = z1 + z2·j ↔ (z1 + i·z2, z1 - i·z2)
 * 
 * This is useful for "mandelbrot in 4D" rendering.
 * 
 * @class Bicomplex
 */
export class Bicomplex {
    /**
     * Create bicomplex number
     * @param {Complex} z1
     * @param {Complex} z2
     */
    constructor(z1 = new Complex(0, 0), z2 = new Complex(0, 0)) {
        /** @type {Complex} */
        this.z1 = z1 instanceof Complex ? z1 : new Complex(z1, 0);
        
        /** @type {Complex} */
        this.z2 = z2 instanceof Complex ? z2 : new Complex(z2, 0);
    }

    /**
     * Create from four real components: (a + bi) + (c + di)j
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {Bicomplex}
     */
    static fromComponents(a, b, c, d) {
        return new Bicomplex(new Complex(a, b), new Complex(c, d));
    }

    /**
     * Add bicomplex numbers
     * @param {Bicomplex} w
     * @returns {Bicomplex}
     */
    add(w) {
        return new Bicomplex(this.z1.add(w.z1), this.z2.add(w.z2));
    }

    /**
     * Subtract
     * @param {Bicomplex} w
     * @returns {Bicomplex}
     */
    sub(w) {
        return new Bicomplex(this.z1.sub(w.z1), this.z2.sub(w.z2));
    }

    /**
     * Multiply bicomplex numbers
     * 
     * (z1 + z2·j)(w1 + w2·j) = (z1·w1 - z2·w2) + (z1·w2 + z2·w1)·j
     * 
     * Note: This is commutative!
     * 
     * @param {Bicomplex} w
     * @returns {Bicomplex}
     */
    mul(w) {
        return new Bicomplex(
            this.z1.mul(w.z1).sub(this.z2.mul(w.z2)),
            this.z1.mul(w.z2).add(this.z2.mul(w.z1))
        );
    }

    /**
     * Square
     * @returns {Bicomplex}
     */
    square() {
        // (z1 + z2·j)² = (z1² - z2²) + 2·z1·z2·j
        return new Bicomplex(
            this.z1.square().sub(this.z2.square()),
            this.z1.mul(this.z2).scale(2)
        );
    }

    /**
     * Norm squared
     * @returns {number}
     */
    get normSquared() {
        return this.z1.magnitudeSquared + this.z2.magnitudeSquared;
    }

    /**
     * Check escape
     * @param {number} threshold
     * @returns {boolean}
     */
    escaped(threshold = BAILOUT_SQUARED) {
        return this.normSquared > threshold;
    }

    /**
     * Clone
     * @returns {Bicomplex}
     */
    clone() {
        return new Bicomplex(this.z1.clone(), this.z2.clone());
    }

    /**
     * Convert to quaternion (same structure, different algebra)
     * @returns {Quaternion}
     */
    toQuaternion() {
        return new Quaternion(this.z1.re, this.z1.im, this.z2.re, this.z2.im);
    }
}

// =============================================================================
// DUAL NUMBERS (for automatic differentiation)
// =============================================================================

/**
 * Dual Number
 * 
 * A dual number is d = a + bε where ε² = 0 (nilpotent).
 * 
 * Key property: f(a + bε) = f(a) + f'(a)·bε
 * 
 * This enables automatic differentiation: compute f and f' simultaneously!
 * 
 * Useful for distance estimation in 3D fractals.
 * 
 * @class Dual
 */
export class Dual {
    /**
     * Create dual number
     * @param {number} real - Real part
     * @param {number} dual - Dual part (coefficient of ε)
     */
    constructor(real = 0, dual = 0) {
        /** @type {number} */
        this.real = real;
        
        /** @type {number} */
        this.dual = dual;
    }

    /**
     * Create variable for differentiation
     * @param {number} x - Value
     * @returns {Dual} x + 1·ε (derivative of x w.r.t. x is 1)
     */
    static variable(x) {
        return new Dual(x, 1);
    }

    /**
     * Create constant
     * @param {number} c
     * @returns {Dual}
     */
    static constant(c) {
        return new Dual(c, 0);
    }

    /**
     * Add
     * @param {Dual} d
     * @returns {Dual}
     */
    add(d) {
        return new Dual(this.real + d.real, this.dual + d.dual);
    }

    /**
     * Subtract
     * @param {Dual} d
     * @returns {Dual}
     */
    sub(d) {
        return new Dual(this.real - d.real, this.dual - d.dual);
    }

    /**
     * Multiply
     * (a + bε)(c + dε) = ac + (ad + bc)ε  (since ε² = 0)
     * @param {Dual} d
     * @returns {Dual}
     */
    mul(d) {
        return new Dual(
            this.real * d.real,
            this.real * d.dual + this.dual * d.real
        );
    }

    /**
     * Divide
     * @param {Dual} d
     * @returns {Dual}
     */
    div(d) {
        const inv = 1 / d.real;
        return new Dual(
            this.real * inv,
            (this.dual * d.real - this.real * d.dual) * inv * inv
        );
    }

    /**
     * Square
     * @returns {Dual}
     */
    square() {
        return new Dual(this.real * this.real, 2 * this.real * this.dual);
    }

    /**
     * Power
     * @param {number} n
     * @returns {Dual}
     */
    pow(n) {
        const rn = Math.pow(this.real, n);
        return new Dual(rn, n * Math.pow(this.real, n - 1) * this.dual);
    }

    /**
     * Square root
     * @returns {Dual}
     */
    sqrt() {
        const sr = Math.sqrt(this.real);
        return new Dual(sr, this.dual / (2 * sr));
    }

    /**
     * Exponential
     * @returns {Dual}
     */
    exp() {
        const er = Math.exp(this.real);
        return new Dual(er, er * this.dual);
    }

    /**
     * Natural logarithm
     * @returns {Dual}
     */
    log() {
        return new Dual(Math.log(this.real), this.dual / this.real);
    }

    /**
     * Sine
     * @returns {Dual}
     */
    sin() {
        return new Dual(Math.sin(this.real), Math.cos(this.real) * this.dual);
    }

    /**
     * Cosine
     * @returns {Dual}
     */
    cos() {
        return new Dual(Math.cos(this.real), -Math.sin(this.real) * this.dual);
    }

    /**
     * Get the derivative (dual part)
     * @returns {number}
     */
    get derivative() {
        return this.dual;
    }

    /**
     * Get the value (real part)
     * @returns {number}
     */
    get value() {
        return this.real;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { EPSILON, BAILOUT_SQUARED };
export default Quaternion;
