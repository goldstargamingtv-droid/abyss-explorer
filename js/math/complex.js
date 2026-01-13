/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - COMPLEX NUMBER MATHEMATICS                ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  High-performance complex number class with comprehensive operations          ║
 * ║                                                                                ║
 * ║  Mathematical Foundation:                                                      ║
 * ║  A complex number z is represented as z = a + bi where:                       ║
 * ║    • a = Re(z) is the real part                                               ║
 * ║    • b = Im(z) is the imaginary part                                          ║
 * ║    • i is the imaginary unit where i² = -1                                    ║
 * ║                                                                                ║
 * ║  The complex plane maps (Re, Im) to (x, y) Cartesian coordinates.             ║
 * ║  Polar form: z = r·e^(iθ) where r = |z| (modulus) and θ = arg(z)             ║
 * ║                                                                                ║
 * ║  This implementation provides:                                                 ║
 * ║  - Mutable and immutable operation variants                                   ║
 * ║  - High-precision mode via arbitrary precision adapter                        ║
 * ║  - Optimized hot paths for fractal iteration                                  ║
 * ║  - Complete transcendental function support                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Mathematical constants
 * @constant
 */
const CONSTANTS = {
    /** π (pi) - ratio of circumference to diameter */
    PI: Math.PI,
    
    /** τ (tau) = 2π - full circle in radians */
    TAU: 2 * Math.PI,
    
    /** e - Euler's number, base of natural logarithm */
    E: Math.E,
    
    /** ln(2) - natural log of 2 */
    LN2: Math.LN2,
    
    /** ln(10) - natural log of 10 */
    LN10: Math.LN10,
    
    /** Machine epsilon for double precision */
    EPSILON: Number.EPSILON,
    
    /** Default tolerance for comparisons */
    TOLERANCE: 1e-15,
    
    /** Bailout radius squared for escape-time algorithms */
    BAILOUT_SQUARED: 4,
    
    /** Large bailout for smooth coloring (2^16)² */
    LARGE_BAILOUT_SQUARED: 4294967296
};

// =============================================================================
// COMPLEX NUMBER CLASS
// =============================================================================

/**
 * High-Performance Complex Number
 * 
 * Represents a complex number z = re + im·i with full arithmetic support.
 * Designed for high-frequency fractal iteration with minimal allocations.
 * 
 * Design Decisions:
 * - Uses public fields for fastest possible access (no getter overhead)
 * - Provides both mutating (in-place) and non-mutating operations
 * - Pool-friendly: supports reset() for object reuse
 * - Inline-able: simple operations avoid function call overhead
 * 
 * @class Complex
 */
export class Complex {
    /**
     * Create a complex number
     * 
     * @param {number} [re=0] - Real part
     * @param {number} [im=0] - Imaginary part
     * 
     * @example
     * const z = new Complex(3, 4);  // 3 + 4i
     * const w = new Complex(2);     // 2 + 0i (real number)
     * const origin = new Complex(); // 0 + 0i
     */
    constructor(re = 0, im = 0) {
        /** @type {number} Real part Re(z) */
        this.re = re;
        
        /** @type {number} Imaginary part Im(z) */
        this.im = im;
    }

    // =========================================================================
    // STATIC CONSTRUCTORS
    // =========================================================================

    /**
     * Create complex number from polar coordinates
     * 
     * Uses Euler's formula: z = r·e^(iθ) = r(cos θ + i sin θ)
     * 
     * @param {number} r - Modulus (magnitude)
     * @param {number} theta - Argument (angle in radians)
     * @returns {Complex}
     * 
     * @example
     * Complex.fromPolar(1, Math.PI/2)  // 0 + 1i (unit imaginary)
     * Complex.fromPolar(2, Math.PI)    // -2 + 0i
     */
    static fromPolar(r, theta) {
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }

    /**
     * Create complex number from array [re, im]
     * @param {number[]} arr
     * @returns {Complex}
     */
    static fromArray(arr) {
        return new Complex(arr[0] || 0, arr[1] || 0);
    }

    /**
     * Parse complex number from string
     * 
     * Supported formats:
     * - "3+4i", "3-4i"
     * - "3 + 4i", "3 - 4i"
     * - "3", "-4i", "i", "-i"
     * 
     * @param {string} str
     * @returns {Complex}
     */
    static parse(str) {
        str = str.replace(/\s/g, '').toLowerCase();
        
        // Pure imaginary
        if (str === 'i') return new Complex(0, 1);
        if (str === '-i') return new Complex(0, -1);
        
        // Try to match a+bi or a-bi
        const match = str.match(/^([+-]?[\d.]+)?([+-]?[\d.]*i)?$/);
        if (!match) {
            throw new Error(`Cannot parse complex number: ${str}`);
        }
        
        let re = 0, im = 0;
        
        if (match[1]) {
            re = parseFloat(match[1]);
        }
        
        if (match[2]) {
            const imStr = match[2].replace('i', '');
            if (imStr === '' || imStr === '+') im = 1;
            else if (imStr === '-') im = -1;
            else im = parseFloat(imStr);
        }
        
        return new Complex(re, im);
    }

    /**
     * Create a copy of a complex number
     * @param {Complex} z
     * @returns {Complex}
     */
    static copy(z) {
        return new Complex(z.re, z.im);
    }

    /**
     * Zero complex number
     * @returns {Complex}
     */
    static zero() {
        return new Complex(0, 0);
    }

    /**
     * One (multiplicative identity)
     * @returns {Complex}
     */
    static one() {
        return new Complex(1, 0);
    }

    /**
     * Imaginary unit i
     * @returns {Complex}
     */
    static i() {
        return new Complex(0, 1);
    }

    // =========================================================================
    // PROPERTIES (Computed)
    // =========================================================================

    /**
     * Modulus (magnitude) |z| = √(re² + im²)
     * 
     * Also called absolute value. Represents distance from origin.
     * 
     * @returns {number}
     */
    get magnitude() {
        return Math.sqrt(this.re * this.re + this.im * this.im);
    }

    /**
     * Alias for magnitude
     * @returns {number}
     */
    get abs() {
        return this.magnitude;
    }

    /**
     * Modulus squared |z|² = re² + im²
     * 
     * More efficient than magnitude when you only need comparison.
     * Used extensively in escape-time algorithms.
     * 
     * @returns {number}
     */
    get magnitudeSquared() {
        return this.re * this.re + this.im * this.im;
    }

    /**
     * Alias for magnitudeSquared
     * @returns {number}
     */
    get abs2() {
        return this.magnitudeSquared;
    }

    /**
     * Argument (phase angle) arg(z) = atan2(im, re)
     * 
     * Returns angle θ in radians, range (-π, π].
     * Follows the standard mathematical convention.
     * 
     * @returns {number}
     */
    get argument() {
        return Math.atan2(this.im, this.re);
    }

    /**
     * Alias for argument
     * @returns {number}
     */
    get arg() {
        return this.argument;
    }

    /**
     * Alias for argument
     * @returns {number}
     */
    get phase() {
        return this.argument;
    }

    /**
     * Check if this is a real number (imaginary part is zero)
     * @returns {boolean}
     */
    get isReal() {
        return Math.abs(this.im) < CONSTANTS.TOLERANCE;
    }

    /**
     * Check if this is pure imaginary (real part is zero)
     * @returns {boolean}
     */
    get isImaginary() {
        return Math.abs(this.re) < CONSTANTS.TOLERANCE;
    }

    /**
     * Check if this is zero
     * @returns {boolean}
     */
    get isZero() {
        return Math.abs(this.re) < CONSTANTS.TOLERANCE && 
               Math.abs(this.im) < CONSTANTS.TOLERANCE;
    }

    /**
     * Check if this is finite (not NaN or Infinity)
     * @returns {boolean}
     */
    get isFinite() {
        return Number.isFinite(this.re) && Number.isFinite(this.im);
    }

    /**
     * Check if this is NaN
     * @returns {boolean}
     */
    get isNaN() {
        return Number.isNaN(this.re) || Number.isNaN(this.im);
    }

    // =========================================================================
    // BASIC OPERATIONS (Non-mutating - return new Complex)
    // =========================================================================

    /**
     * Add two complex numbers: (a + bi) + (c + di) = (a+c) + (b+d)i
     * 
     * @param {Complex|number} w - Complex number or real number to add
     * @returns {Complex} New complex number
     */
    add(w) {
        if (typeof w === 'number') {
            return new Complex(this.re + w, this.im);
        }
        return new Complex(this.re + w.re, this.im + w.im);
    }

    /**
     * Subtract: (a + bi) - (c + di) = (a-c) + (b-d)i
     * 
     * @param {Complex|number} w
     * @returns {Complex}
     */
    sub(w) {
        if (typeof w === 'number') {
            return new Complex(this.re - w, this.im);
        }
        return new Complex(this.re - w.re, this.im - w.im);
    }

    /**
     * Multiply: (a + bi)(c + di) = (ac - bd) + (ad + bc)i
     * 
     * Derivation:
     * (a + bi)(c + di) = ac + adi + bci + bdi²
     *                  = ac + adi + bci - bd    (since i² = -1)
     *                  = (ac - bd) + (ad + bc)i
     * 
     * @param {Complex|number} w
     * @returns {Complex}
     */
    mul(w) {
        if (typeof w === 'number') {
            return new Complex(this.re * w, this.im * w);
        }
        return new Complex(
            this.re * w.re - this.im * w.im,
            this.re * w.im + this.im * w.re
        );
    }

    /**
     * Divide: (a + bi) / (c + di)
     * 
     * Derivation (multiply by conjugate):
     * (a + bi)/(c + di) = (a + bi)(c - di) / ((c + di)(c - di))
     *                   = (a + bi)(c - di) / (c² + d²)
     *                   = ((ac + bd) + (bc - ad)i) / (c² + d²)
     * 
     * @param {Complex|number} w
     * @returns {Complex}
     */
    div(w) {
        if (typeof w === 'number') {
            return new Complex(this.re / w, this.im / w);
        }
        const denom = w.re * w.re + w.im * w.im;
        return new Complex(
            (this.re * w.re + this.im * w.im) / denom,
            (this.im * w.re - this.re * w.im) / denom
        );
    }

    /**
     * Negate: -(a + bi) = -a - bi
     * @returns {Complex}
     */
    neg() {
        return new Complex(-this.re, -this.im);
    }

    /**
     * Complex conjugate: conj(a + bi) = a - bi
     * 
     * Geometrically, reflects across the real axis.
     * Property: z · conj(z) = |z|²
     * 
     * @returns {Complex}
     */
    conj() {
        return new Complex(this.re, -this.im);
    }

    /**
     * Reciprocal (multiplicative inverse): 1/z = conj(z)/|z|²
     * @returns {Complex}
     */
    reciprocal() {
        const denom = this.re * this.re + this.im * this.im;
        return new Complex(this.re / denom, -this.im / denom);
    }

    /**
     * Square: z² = (a + bi)² = (a² - b²) + 2abi
     * 
     * Optimized version avoiding full mul() overhead.
     * Critical for fractal iteration performance.
     * 
     * @returns {Complex}
     */
    square() {
        return new Complex(
            this.re * this.re - this.im * this.im,
            2 * this.re * this.im
        );
    }

    /**
     * Cube: z³ = z² · z
     * 
     * Expanded: (a + bi)³ = (a³ - 3ab²) + (3a²b - b³)i
     * 
     * @returns {Complex}
     */
    cube() {
        const re2 = this.re * this.re;
        const im2 = this.im * this.im;
        return new Complex(
            this.re * (re2 - 3 * im2),
            this.im * (3 * re2 - im2)
        );
    }

    /**
     * Scale by real number
     * @param {number} s - Scale factor
     * @returns {Complex}
     */
    scale(s) {
        return new Complex(this.re * s, this.im * s);
    }

    /**
     * Normalize to unit magnitude
     * @returns {Complex}
     */
    normalize() {
        const mag = this.magnitude;
        if (mag === 0) return new Complex(0, 0);
        return new Complex(this.re / mag, this.im / mag);
    }

    // =========================================================================
    // IN-PLACE OPERATIONS (Mutating - for performance)
    // =========================================================================

    /**
     * Set both components
     * @param {number} re
     * @param {number} im
     * @returns {Complex} this (for chaining)
     */
    set(re, im) {
        this.re = re;
        this.im = im;
        return this;
    }

    /**
     * Copy from another complex number
     * @param {Complex} z
     * @returns {Complex} this
     */
    copyFrom(z) {
        this.re = z.re;
        this.im = z.im;
        return this;
    }

    /**
     * Reset to zero
     * @returns {Complex} this
     */
    reset() {
        this.re = 0;
        this.im = 0;
        return this;
    }

    /**
     * Add in place
     * @param {Complex|number} w
     * @returns {Complex} this
     */
    addMut(w) {
        if (typeof w === 'number') {
            this.re += w;
        } else {
            this.re += w.re;
            this.im += w.im;
        }
        return this;
    }

    /**
     * Subtract in place
     * @param {Complex|number} w
     * @returns {Complex} this
     */
    subMut(w) {
        if (typeof w === 'number') {
            this.re -= w;
        } else {
            this.re -= w.re;
            this.im -= w.im;
        }
        return this;
    }

    /**
     * Multiply in place
     * @param {Complex|number} w
     * @returns {Complex} this
     */
    mulMut(w) {
        if (typeof w === 'number') {
            this.re *= w;
            this.im *= w;
        } else {
            const newRe = this.re * w.re - this.im * w.im;
            const newIm = this.re * w.im + this.im * w.re;
            this.re = newRe;
            this.im = newIm;
        }
        return this;
    }

    /**
     * Square in place: z = z²
     * 
     * This is the hottest path in Mandelbrot iteration.
     * Optimized to minimize operations.
     * 
     * @returns {Complex} this
     */
    squareMut() {
        const newRe = this.re * this.re - this.im * this.im;
        this.im = 2 * this.re * this.im;
        this.re = newRe;
        return this;
    }

    /**
     * Negate in place
     * @returns {Complex} this
     */
    negMut() {
        this.re = -this.re;
        this.im = -this.im;
        return this;
    }

    /**
     * Conjugate in place
     * @returns {Complex} this
     */
    conjMut() {
        this.im = -this.im;
        return this;
    }

    /**
     * Scale in place
     * @param {number} s
     * @returns {Complex} this
     */
    scaleMut(s) {
        this.re *= s;
        this.im *= s;
        return this;
    }

    // =========================================================================
    // POWER FUNCTIONS
    // =========================================================================

    /**
     * Complex power: z^n for real exponent n
     * 
     * Uses de Moivre's formula: z^n = r^n · e^(inθ)
     * where r = |z| and θ = arg(z)
     * 
     * For integer n, this gives exact results.
     * For fractional n, uses principal value.
     * 
     * @param {number} n - Exponent (real number)
     * @returns {Complex}
     */
    pow(n) {
        // Special cases
        if (n === 0) return new Complex(1, 0);
        if (n === 1) return this.clone();
        if (n === 2) return this.square();
        if (n === 3) return this.cube();
        if (n === -1) return this.reciprocal();
        
        // Integer powers can use repeated squaring
        if (Number.isInteger(n) && n > 0) {
            return this._integerPow(n);
        }
        
        // General case: z^n = e^(n·ln(z))
        const r = this.magnitude;
        if (r === 0) return new Complex(0, 0);
        
        const theta = this.argument;
        const newR = Math.pow(r, n);
        const newTheta = n * theta;
        
        return new Complex(
            newR * Math.cos(newTheta),
            newR * Math.sin(newTheta)
        );
    }

    /**
     * Complex power: z^w for complex exponent w
     * 
     * z^w = e^(w·ln(z))
     * 
     * @param {Complex} w - Complex exponent
     * @returns {Complex}
     */
    cpow(w) {
        if (this.isZero) return new Complex(0, 0);
        
        // ln(z) = ln|z| + i·arg(z)
        const lnZ = this.log();
        
        // w · ln(z)
        const product = w.mul(lnZ);
        
        // e^(w·ln(z))
        return product.exp();
    }

    /**
     * Integer power using binary exponentiation
     * @private
     * @param {number} n - Positive integer
     * @returns {Complex}
     */
    _integerPow(n) {
        let result = new Complex(1, 0);
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
     * Square root: √z
     * 
     * Principal square root formula:
     * √(a + bi) = √((|z| + a)/2) + i·sign(b)·√((|z| - a)/2)
     * 
     * @returns {Complex}
     */
    sqrt() {
        const r = this.magnitude;
        if (r === 0) return new Complex(0, 0);
        
        const newRe = Math.sqrt((r + this.re) / 2);
        const newIm = Math.sqrt((r - this.re) / 2);
        
        return new Complex(newRe, this.im >= 0 ? newIm : -newIm);
    }

    /**
     * Nth root: z^(1/n)
     * 
     * Returns principal root. For all n roots, use nthRoots().
     * 
     * @param {number} n
     * @returns {Complex}
     */
    nthRoot(n) {
        return this.pow(1 / n);
    }

    /**
     * Get all nth roots of z
     * 
     * By de Moivre: z^(1/n) = r^(1/n) · e^(i(θ + 2πk)/n) for k = 0, 1, ..., n-1
     * 
     * @param {number} n - Number of roots
     * @returns {Complex[]} Array of n complex roots
     */
    nthRoots(n) {
        const r = Math.pow(this.magnitude, 1 / n);
        const theta = this.argument;
        const roots = [];
        
        for (let k = 0; k < n; k++) {
            const angle = (theta + 2 * Math.PI * k) / n;
            roots.push(new Complex(r * Math.cos(angle), r * Math.sin(angle)));
        }
        
        return roots;
    }

    // =========================================================================
    // EXPONENTIAL AND LOGARITHMIC FUNCTIONS
    // =========================================================================

    /**
     * Complex exponential: e^z = e^(a+bi) = e^a(cos b + i sin b)
     * 
     * This is Euler's formula when a = 0: e^(iθ) = cos θ + i sin θ
     * 
     * @returns {Complex}
     */
    exp() {
        const ea = Math.exp(this.re);
        return new Complex(ea * Math.cos(this.im), ea * Math.sin(this.im));
    }

    /**
     * Complex natural logarithm: ln(z) = ln|z| + i·arg(z)
     * 
     * Returns principal value with Im(ln z) ∈ (-π, π].
     * 
     * @returns {Complex}
     */
    log() {
        return new Complex(Math.log(this.magnitude), this.argument);
    }

    /**
     * Alias for log()
     * @returns {Complex}
     */
    ln() {
        return this.log();
    }

    /**
     * Logarithm base 10
     * log₁₀(z) = ln(z) / ln(10)
     * 
     * @returns {Complex}
     */
    log10() {
        return this.log().scale(1 / CONSTANTS.LN10);
    }

    /**
     * Logarithm base 2
     * log₂(z) = ln(z) / ln(2)
     * 
     * @returns {Complex}
     */
    log2() {
        return this.log().scale(1 / CONSTANTS.LN2);
    }

    /**
     * Logarithm with arbitrary base
     * log_b(z) = ln(z) / ln(b)
     * 
     * @param {number|Complex} base
     * @returns {Complex}
     */
    logBase(base) {
        if (typeof base === 'number') {
            return this.log().scale(1 / Math.log(base));
        }
        return this.log().div(base.log());
    }

    // =========================================================================
    // TRIGONOMETRIC FUNCTIONS
    // =========================================================================

    /**
     * Complex sine: sin(z) = (e^(iz) - e^(-iz)) / (2i)
     * 
     * Expanded: sin(a + bi) = sin(a)cosh(b) + i·cos(a)sinh(b)
     * 
     * @returns {Complex}
     */
    sin() {
        return new Complex(
            Math.sin(this.re) * Math.cosh(this.im),
            Math.cos(this.re) * Math.sinh(this.im)
        );
    }

    /**
     * Complex cosine: cos(z) = (e^(iz) + e^(-iz)) / 2
     * 
     * Expanded: cos(a + bi) = cos(a)cosh(b) - i·sin(a)sinh(b)
     * 
     * @returns {Complex}
     */
    cos() {
        return new Complex(
            Math.cos(this.re) * Math.cosh(this.im),
            -Math.sin(this.re) * Math.sinh(this.im)
        );
    }

    /**
     * Complex tangent: tan(z) = sin(z) / cos(z)
     * 
     * @returns {Complex}
     */
    tan() {
        return this.sin().div(this.cos());
    }

    /**
     * Complex cotangent: cot(z) = cos(z) / sin(z)
     * @returns {Complex}
     */
    cot() {
        return this.cos().div(this.sin());
    }

    /**
     * Complex secant: sec(z) = 1 / cos(z)
     * @returns {Complex}
     */
    sec() {
        return this.cos().reciprocal();
    }

    /**
     * Complex cosecant: csc(z) = 1 / sin(z)
     * @returns {Complex}
     */
    csc() {
        return this.sin().reciprocal();
    }

    // =========================================================================
    // INVERSE TRIGONOMETRIC FUNCTIONS
    // =========================================================================

    /**
     * Complex arcsine: asin(z) = -i·ln(iz + √(1 - z²))
     * 
     * @returns {Complex}
     */
    asin() {
        const iz = new Complex(-this.im, this.re); // i·z
        const oneMinusZ2 = new Complex(1, 0).sub(this.square());
        const sqrt = oneMinusZ2.sqrt();
        const sum = iz.add(sqrt);
        const ln = sum.log();
        return new Complex(ln.im, -ln.re); // -i·ln
    }

    /**
     * Complex arccosine: acos(z) = -i·ln(z + i√(1 - z²))
     * 
     * @returns {Complex}
     */
    acos() {
        const oneMinusZ2 = new Complex(1, 0).sub(this.square());
        const sqrt = oneMinusZ2.sqrt();
        const iSqrt = new Complex(-sqrt.im, sqrt.re); // i·sqrt
        const sum = this.add(iSqrt);
        const ln = sum.log();
        return new Complex(ln.im, -ln.re); // -i·ln
    }

    /**
     * Complex arctangent: atan(z) = (i/2)·ln((i+z)/(i-z))
     * 
     * @returns {Complex}
     */
    atan() {
        const i = new Complex(0, 1);
        const num = i.add(this);      // i + z
        const den = i.sub(this);      // i - z
        const ratio = num.div(den);
        const ln = ratio.log();
        return ln.mul(new Complex(0, 0.5)); // (i/2)·ln
    }

    // =========================================================================
    // HYPERBOLIC FUNCTIONS
    // =========================================================================

    /**
     * Complex hyperbolic sine: sinh(z) = (e^z - e^(-z)) / 2
     * 
     * Expanded: sinh(a + bi) = sinh(a)cos(b) + i·cosh(a)sin(b)
     * 
     * @returns {Complex}
     */
    sinh() {
        return new Complex(
            Math.sinh(this.re) * Math.cos(this.im),
            Math.cosh(this.re) * Math.sin(this.im)
        );
    }

    /**
     * Complex hyperbolic cosine: cosh(z) = (e^z + e^(-z)) / 2
     * 
     * Expanded: cosh(a + bi) = cosh(a)cos(b) + i·sinh(a)sin(b)
     * 
     * @returns {Complex}
     */
    cosh() {
        return new Complex(
            Math.cosh(this.re) * Math.cos(this.im),
            Math.sinh(this.re) * Math.sin(this.im)
        );
    }

    /**
     * Complex hyperbolic tangent: tanh(z) = sinh(z) / cosh(z)
     * @returns {Complex}
     */
    tanh() {
        return this.sinh().div(this.cosh());
    }

    /**
     * Complex hyperbolic cotangent
     * @returns {Complex}
     */
    coth() {
        return this.cosh().div(this.sinh());
    }

    /**
     * Complex hyperbolic secant
     * @returns {Complex}
     */
    sech() {
        return this.cosh().reciprocal();
    }

    /**
     * Complex hyperbolic cosecant
     * @returns {Complex}
     */
    csch() {
        return this.sinh().reciprocal();
    }

    // =========================================================================
    // INVERSE HYPERBOLIC FUNCTIONS
    // =========================================================================

    /**
     * Complex inverse hyperbolic sine: asinh(z) = ln(z + √(z² + 1))
     * @returns {Complex}
     */
    asinh() {
        const z2Plus1 = this.square().add(1);
        return this.add(z2Plus1.sqrt()).log();
    }

    /**
     * Complex inverse hyperbolic cosine: acosh(z) = ln(z + √(z² - 1))
     * @returns {Complex}
     */
    acosh() {
        const z2Minus1 = this.square().sub(1);
        return this.add(z2Minus1.sqrt()).log();
    }

    /**
     * Complex inverse hyperbolic tangent: atanh(z) = (1/2)·ln((1+z)/(1-z))
     * @returns {Complex}
     */
    atanh() {
        const num = new Complex(1 + this.re, this.im);
        const den = new Complex(1 - this.re, -this.im);
        return num.div(den).log().scale(0.5);
    }

    // =========================================================================
    // SPECIAL FUNCTIONS
    // =========================================================================

    /**
     * Absolute value components: |Re(z)| + i|Im(z)|
     * Used in Burning Ship fractal
     * @returns {Complex}
     */
    absComponents() {
        return new Complex(Math.abs(this.re), Math.abs(this.im));
    }

    /**
     * Sign function
     * Returns z/|z| if z ≠ 0, else 0
     * @returns {Complex}
     */
    sign() {
        const mag = this.magnitude;
        if (mag === 0) return new Complex(0, 0);
        return new Complex(this.re / mag, this.im / mag);
    }

    /**
     * Floor function applied to real and imaginary parts
     * @returns {Complex}
     */
    floor() {
        return new Complex(Math.floor(this.re), Math.floor(this.im));
    }

    /**
     * Ceiling function
     * @returns {Complex}
     */
    ceil() {
        return new Complex(Math.ceil(this.re), Math.ceil(this.im));
    }

    /**
     * Round to nearest integer
     * @returns {Complex}
     */
    round() {
        return new Complex(Math.round(this.re), Math.round(this.im));
    }

    /**
     * Truncate toward zero
     * @returns {Complex}
     */
    trunc() {
        return new Complex(Math.trunc(this.re), Math.trunc(this.im));
    }

    /**
     * Fractional part
     * @returns {Complex}
     */
    frac() {
        return new Complex(this.re - Math.floor(this.re), this.im - Math.floor(this.im));
    }

    // =========================================================================
    // COMPARISON AND EQUALITY
    // =========================================================================

    /**
     * Check equality with tolerance
     * @param {Complex} w
     * @param {number} [tolerance=CONSTANTS.TOLERANCE]
     * @returns {boolean}
     */
    equals(w, tolerance = CONSTANTS.TOLERANCE) {
        return Math.abs(this.re - w.re) < tolerance &&
               Math.abs(this.im - w.im) < tolerance;
    }

    /**
     * Check if magnitude exceeds threshold (escape test)
     * @param {number} threshold - Typically 2 or 4 for bailout
     * @returns {boolean}
     */
    escaped(threshold = 2) {
        return this.magnitudeSquared > threshold * threshold;
    }

    /**
     * Check if magnitude squared exceeds threshold (optimized escape test)
     * @param {number} thresholdSquared - Typically 4 for bailout
     * @returns {boolean}
     */
    escapedSquared(thresholdSquared = CONSTANTS.BAILOUT_SQUARED) {
        return this.magnitudeSquared > thresholdSquared;
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Create a deep copy
     * @returns {Complex}
     */
    clone() {
        return new Complex(this.re, this.im);
    }

    /**
     * Convert to array [re, im]
     * @returns {number[]}
     */
    toArray() {
        return [this.re, this.im];
    }

    /**
     * Convert to object {re, im}
     * @returns {{re: number, im: number}}
     */
    toObject() {
        return { re: this.re, im: this.im };
    }

    /**
     * Convert to polar coordinates {r, theta}
     * @returns {{r: number, theta: number}}
     */
    toPolar() {
        return { r: this.magnitude, theta: this.argument };
    }

    /**
     * Convert to string representation
     * @param {number} [precision=6] - Decimal places
     * @returns {string}
     */
    toString(precision = 6) {
        const re = this.re.toFixed(precision).replace(/\.?0+$/, '');
        const im = this.im.toFixed(precision).replace(/\.?0+$/, '');
        
        if (Math.abs(this.im) < CONSTANTS.TOLERANCE) {
            return re;
        }
        if (Math.abs(this.re) < CONSTANTS.TOLERANCE) {
            if (Math.abs(this.im - 1) < CONSTANTS.TOLERANCE) return 'i';
            if (Math.abs(this.im + 1) < CONSTANTS.TOLERANCE) return '-i';
            return `${im}i`;
        }
        
        const sign = this.im >= 0 ? '+' : '';
        const imPart = Math.abs(this.im - 1) < CONSTANTS.TOLERANCE ? '' :
                       Math.abs(this.im + 1) < CONSTANTS.TOLERANCE ? '-' : im;
        
        return `${re}${sign}${imPart}i`;
    }

    /**
     * Custom JSON serialization
     * @returns {{re: number, im: number}}
     */
    toJSON() {
        return { re: this.re, im: this.im };
    }
}

// =============================================================================
// OBJECT POOL FOR HIGH-FREQUENCY ALLOCATIONS
// =============================================================================

/**
 * Complex Number Object Pool
 * 
 * Reduces GC pressure during intensive fractal iteration.
 * Pre-allocates complex numbers that can be reused.
 * 
 * @class ComplexPool
 */
export class ComplexPool {
    /**
     * Create a pool
     * @param {number} [initialSize=1000] - Initial pool size
     */
    constructor(initialSize = 1000) {
        /** @type {Complex[]} Available objects */
        this._pool = [];
        
        /** @type {number} Total allocations */
        this._allocations = 0;
        
        /** @type {number} Pool hits */
        this._hits = 0;
        
        // Pre-allocate
        for (let i = 0; i < initialSize; i++) {
            this._pool.push(new Complex(0, 0));
        }
    }

    /**
     * Get a complex number from pool
     * @param {number} [re=0]
     * @param {number} [im=0]
     * @returns {Complex}
     */
    acquire(re = 0, im = 0) {
        this._allocations++;
        
        if (this._pool.length > 0) {
            this._hits++;
            const z = this._pool.pop();
            z.re = re;
            z.im = im;
            return z;
        }
        
        return new Complex(re, im);
    }

    /**
     * Return a complex number to pool
     * @param {Complex} z
     */
    release(z) {
        z.reset();
        this._pool.push(z);
    }

    /**
     * Get pool statistics
     * @returns {{size: number, allocations: number, hitRate: number}}
     */
    getStats() {
        return {
            size: this._pool.length,
            allocations: this._allocations,
            hitRate: this._allocations > 0 ? this._hits / this._allocations : 0
        };
    }

    /**
     * Clear pool
     */
    clear() {
        this._pool = [];
        this._allocations = 0;
        this._hits = 0;
    }
}

// =============================================================================
// STATIC UTILITY FUNCTIONS
// =============================================================================

/**
 * Linear interpolation between two complex numbers
 * @param {Complex} a
 * @param {Complex} b
 * @param {number} t - Interpolation factor [0, 1]
 * @returns {Complex}
 */
export function lerp(a, b, t) {
    return new Complex(
        a.re + (b.re - a.re) * t,
        a.im + (b.im - a.im) * t
    );
}

/**
 * Distance between two complex numbers
 * @param {Complex} a
 * @param {Complex} b
 * @returns {number}
 */
export function distance(a, b) {
    const dx = b.re - a.re;
    const dy = b.im - a.im;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Distance squared between two complex numbers
 * @param {Complex} a
 * @param {Complex} b
 * @returns {number}
 */
export function distanceSquared(a, b) {
    const dx = b.re - a.re;
    const dy = b.im - a.im;
    return dx * dx + dy * dy;
}

/**
 * Dot product of two complex numbers as 2D vectors
 * @param {Complex} a
 * @param {Complex} b
 * @returns {number}
 */
export function dot(a, b) {
    return a.re * b.re + a.im * b.im;
}

/**
 * Cross product (z-component) of two complex numbers as 2D vectors
 * @param {Complex} a
 * @param {Complex} b
 * @returns {number}
 */
export function cross(a, b) {
    return a.re * b.im - a.im * b.re;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { CONSTANTS };
export default Complex;
