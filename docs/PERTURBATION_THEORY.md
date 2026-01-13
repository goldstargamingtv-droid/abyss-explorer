# Perturbation Theory for Ultra-Deep Zooms

> *"The art of doing mathematics consists in finding that special case which contains all the germs of generality."*
> — David Hilbert

This document provides a rigorous explanation of perturbation theory as applied to fractal rendering, enabling zooms beyond 10^300 while maintaining real-time performance.

## Table of Contents

1. [The Deep Zoom Problem](#the-deep-zoom-problem)
2. [Perturbation Theory Basics](#perturbation-theory-basics)
3. [Reference Orbit Calculation](#reference-orbit-calculation)
4. [Delta Iteration](#delta-iteration)
5. [Series Approximation Hybrid](#series-approximation-hybrid)
6. [Glitch Detection](#glitch-detection)
7. [Glitch Correction](#glitch-correction)
8. [Implementation Guide](#implementation-guide)
9. [Performance Optimization](#performance-optimization)
10. [Mathematical Proofs](#mathematical-proofs)
11. [References](#references)

---

## The Deep Zoom Problem

### Floating-Point Limitations

Standard IEEE 754 double-precision floating-point numbers provide approximately 15-17 significant decimal digits. When zooming into a fractal, the view width eventually becomes smaller than this precision limit.

**Example**: At zoom level $10^{15}$, pixel differences of $10^{-15}$ cannot be represented in doubles.

| Zoom Level | View Width | Precision Required | Feasible with Doubles? |
|------------|------------|-------------------|----------------------|
| $10^{3}$ | $4 \times 10^{-3}$ | 4 digits | ✓ |
| $10^{10}$ | $4 \times 10^{-10}$ | 11 digits | ✓ |
| $10^{15}$ | $4 \times 10^{-15}$ | 16 digits | Marginal |
| $10^{20}$ | $4 \times 10^{-20}$ | 21 digits | ✗ |
| $10^{100}$ | $4 \times 10^{-100}$ | 101 digits | ✗ |

### Naive Arbitrary Precision

Using arbitrary-precision arithmetic (like BigDecimal) solves the precision problem but is computationally expensive:

- Each multiplication requires $O(n \log n)$ operations for $n$-digit numbers
- Typical frame: 1920×1080 = 2 million pixels
- 1000 iterations per pixel = 2 billion multiplications
- At $10^{100}$ zoom, this becomes impractical

**Perturbation theory reduces this to a single arbitrary-precision calculation per frame.**

---

## Perturbation Theory Basics

### Core Insight

The key insight is that nearby pixels have nearly identical orbits. Instead of computing each pixel independently, we:

1. Compute one **reference orbit** at full precision
2. Express other pixels as **perturbations** (small deltas) from this reference
3. Iterate the **delta values** using standard double precision

### Mathematical Foundation

Let $c_0$ be the reference point and $c = c_0 + \delta c$ be a nearby pixel. Define:

$$Z_n = \text{reference orbit at } c_0$$
$$z_n = \text{orbit at } c$$
$$\delta_n = z_n - Z_n \text{ (the perturbation)}$$

For the Mandelbrot iteration $z_{n+1} = z_n^2 + c$:

$$z_{n+1} = z_n^2 + c$$
$$Z_{n+1} = Z_n^2 + c_0$$

Subtracting:

$$z_{n+1} - Z_{n+1} = z_n^2 - Z_n^2 + (c - c_0)$$
$$\delta_{n+1} = (z_n + Z_n)(z_n - Z_n) + \delta c$$
$$\delta_{n+1} = (z_n + Z_n)\delta_n + \delta c$$

Since $z_n = Z_n + \delta_n$:

$$\delta_{n+1} = (2Z_n + \delta_n)\delta_n + \delta c$$

### The Perturbation Formula

$$\boxed{\delta_{n+1} = 2Z_n \delta_n + \delta_n^2 + \delta c}$$

This is the fundamental perturbation iteration for the Mandelbrot set.

**Why this works**: 
- $Z_n$ is computed once at arbitrary precision
- $\delta_n$ remains small (on the order of pixel spacing)
- Double-precision arithmetic is sufficient for $\delta_n$

---

## Reference Orbit Calculation

### Choosing the Reference Point

The reference point $c_0$ should be:

1. **Central**: Near the center of the view (often the exact center)
2. **Slowly escaping or non-escaping**: Longer orbits provide more iterations of valid data

### Arbitrary-Precision Iteration

```javascript
function computeReferenceOrbit(c0, maxIterations, precision) {
    // Use arbitrary-precision library (e.g., BigNumber.js, decimal.js)
    const Big = require('big.js');
    Big.DP = precision;  // Set decimal places
    
    let Zre = new Big(0);
    let Zim = new Big(0);
    
    const orbit = [];  // Store as doubles for perturbation
    
    for (let n = 0; n <= maxIterations; n++) {
        // Store current Z (convert to double)
        orbit.push({
            re: Zre.toNumber(),
            im: Zim.toNumber(),
            mag2: Zre.times(Zre).plus(Zim.times(Zim)).toNumber()
        });
        
        // Check escape (with large bailout for better accuracy)
        if (orbit[n].mag2 > 1e32) {
            break;
        }
        
        // Z = Z² + c0 (arbitrary precision)
        const ZreNew = Zre.times(Zre).minus(Zim.times(Zim)).plus(c0.re);
        const ZimNew = Zre.times(Zim).times(2).plus(c0.im);
        Zre = ZreNew;
        Zim = ZimNew;
    }
    
    return orbit;
}
```

### Storing the Reference Orbit

The reference orbit values are stored as standard doubles. Even though they were computed with arbitrary precision, their magnitudes are typically in a range representable by doubles.

**Important**: The *coordinates* $c_0$ require arbitrary precision, but the *orbit values* $Z_n$ are stored as doubles.

---

## Delta Iteration

### Standard Perturbation Iteration

Given the reference orbit $\{Z_n\}$ and initial delta $\delta_0 = \delta c$:

```javascript
function perturbationIteration(refOrbit, deltac, maxIterations, bailout) {
    let delta = { re: deltac.re, im: deltac.im };
    
    for (let n = 0; n < Math.min(refOrbit.length - 1, maxIterations); n++) {
        const Z = refOrbit[n];
        
        // δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
        // Full formula: δ_{n+1} = (2·Z_n + δ_n)·δ_n + δc
        
        const twoZ_re = 2 * Z.re;
        const twoZ_im = 2 * Z.im;
        
        // (2Z + δ) · δ
        const temp_re = (twoZ_re + delta.re) * delta.re - (twoZ_im + delta.im) * delta.im;
        const temp_im = (twoZ_re + delta.re) * delta.im + (twoZ_im + delta.im) * delta.re;
        
        delta.re = temp_re + deltac.re;
        delta.im = temp_im + deltac.im;
        
        // Check escape: |z|² = |Z + δ|² > bailout²
        const z_re = Z.re + delta.re;
        const z_im = Z.im + delta.im;
        const mag2 = z_re * z_re + z_im * z_im;
        
        if (mag2 > bailout * bailout) {
            // Smooth iteration calculation
            const logMag = Math.log(mag2) / 2;
            const nu = n + 1 - Math.log(logMag) / Math.log(2);
            return nu;
        }
    }
    
    return maxIterations;  // Didn't escape
}
```

### Optimized Form

The perturbation formula can be rewritten for efficiency:

$$\delta_{n+1} = 2Z_n\delta_n + \delta_n^2 + \delta c$$

In component form:

$$\delta_{n+1}^{re} = 2Z_n^{re}\delta_n^{re} - 2Z_n^{im}\delta_n^{im} + (\delta_n^{re})^2 - (\delta_n^{im})^2 + \delta c^{re}$$

$$\delta_{n+1}^{im} = 2Z_n^{re}\delta_n^{im} + 2Z_n^{im}\delta_n^{re} + 2\delta_n^{re}\delta_n^{im} + \delta c^{im}$$

---

## Series Approximation Hybrid

### Motivation

Pure perturbation still requires iterating each pixel individually. Series approximation skips many early iterations by approximating $\delta_n$ as a polynomial in $\delta c$.

### Taylor Series Expansion

We expand $\delta_n$ as a power series in $\delta c$:

$$\delta_n = A_n \cdot \delta c + B_n \cdot (\delta c)^2 + C_n \cdot (\delta c)^3 + \ldots$$

where $A_n, B_n, C_n$ are complex coefficients.

### Coefficient Recurrence

From the perturbation formula $\delta_{n+1} = 2Z_n\delta_n + \delta_n^2 + \delta c$, we derive:

**First-order term ($A_n$)**:
$$A_{n+1} = 2Z_n A_n + 1, \quad A_0 = 0$$

**Second-order term ($B_n$)**:
$$B_{n+1} = 2Z_n B_n + A_n^2, \quad B_0 = 0$$

**Third-order term ($C_n$)**:
$$C_{n+1} = 2Z_n C_n + 2A_n B_n, \quad C_0 = 0$$

**General pattern**:
$$X_{n+1} = 2Z_n X_n + \text{(lower order terms)}$$

### Skipping Iterations

Once we have coefficients $A_k, B_k, C_k, \ldots$, we can approximate $\delta_k$ directly:

$$\delta_k \approx A_k \cdot \delta c + B_k \cdot (\delta c)^2 + C_k \cdot (\delta c)^3$$

This allows skipping the first $k$ iterations entirely.

### Determining Skip Depth

We skip iterations while the approximation error is acceptably small. The error bound is approximately:

$$\text{Error} \lesssim |D_k| \cdot |\delta c|^{order+1}$$

where $D_k$ is the next coefficient. We skip until:

$$|\text{Error}| > \epsilon \cdot |\delta_k|$$

for some tolerance $\epsilon$ (typically $10^{-6}$).

### Implementation

```javascript
function seriesApproximation(refOrbit, deltac, maxOrder = 8) {
    const order = maxOrder;
    
    // Coefficient arrays (complex)
    const A = [{ re: 0, im: 0 }];  // First order
    const B = [{ re: 0, im: 0 }];  // Second order
    const C = [{ re: 0, im: 0 }];  // Third order
    // ... higher orders
    
    // Iterate coefficients
    for (let n = 0; n < refOrbit.length - 1; n++) {
        const Z = refOrbit[n];
        
        // A_{n+1} = 2·Z_n·A_n + 1
        A[n + 1] = complexAdd(complexMul2Z(Z, A[n]), { re: 1, im: 0 });
        
        // B_{n+1} = 2·Z_n·B_n + A_n²
        B[n + 1] = complexAdd(complexMul2Z(Z, B[n]), complexSqr(A[n]));
        
        // C_{n+1} = 2·Z_n·C_n + 2·A_n·B_n
        C[n + 1] = complexAdd(complexMul2Z(Z, C[n]), 
                             complexMul(complexMulScalar(A[n], 2), B[n]));
        
        // Check for series validity (coefficients not exploding)
        // and determine safe skip depth
    }
    
    return { A, B, C, validDepth: computeValidDepth(A, B, C, deltac) };
}

function evaluateSeries(A, B, C, deltac, n) {
    // δ_n ≈ A_n·δc + B_n·δc² + C_n·δc³
    const dc2 = complexSqr(deltac);
    const dc3 = complexMul(dc2, deltac);
    
    let delta = complexMul(A[n], deltac);
    delta = complexAdd(delta, complexMul(B[n], dc2));
    delta = complexAdd(delta, complexMul(C[n], dc3));
    
    return delta;
}
```

---

## Glitch Detection

### What Are Glitches?

Glitches occur when the reference orbit diverges significantly from the true orbit at a pixel. This happens when:

1. The reference escapes too early
2. The pixel's orbit passes close to zero (causing relative error amplification)
3. Numerical precision is lost

### Visual Appearance

Glitches appear as:
- Incorrect coloring (usually darker than expected)
- Sharp discontinuities
- Missing detail in regions that should have structure

### Detection Methods

**Method 1: Relative Size Criterion**

A glitch occurs when $|\delta_n|$ becomes comparable to $|Z_n|$:

$$\frac{|\delta_n|}{|Z_n|} > \text{threshold}$$

Typical threshold: 0.001 to 0.01

**Method 2: Absolute Tolerance**

$$|Z_n| < \epsilon$$

where $\epsilon$ is very small (e.g., $10^{-6}$). When $Z_n$ is near zero, small errors in $\delta_n$ become large relative errors.

**Method 3: Derivative Monitoring**

Track the derivative of $\delta_n$ with respect to $\delta c$. Rapid growth indicates instability.

### Implementation

```javascript
function detectGlitch(Z, delta, glitchTolerance = 0.001) {
    const Zmag2 = Z.re * Z.re + Z.im * Z.im;
    const deltaMag2 = delta.re * delta.re + delta.im * delta.im;
    
    // Method 1: Relative size
    if (deltaMag2 > glitchTolerance * glitchTolerance * Zmag2) {
        return true;
    }
    
    // Method 2: Reference near zero
    if (Zmag2 < 1e-12) {
        return true;
    }
    
    return false;
}
```

---

## Glitch Correction

### Rebasing Strategy

When a glitch is detected, we "rebase" to a new reference orbit starting from the glitched pixel. This requires:

1. Storing the glitched pixel location
2. Computing a new reference orbit from that location
3. Re-rendering affected regions

### Multi-Reference Approach

For complex images with many glitch regions:

1. Render with primary reference
2. Detect all glitch pixels
3. Cluster glitch pixels
4. Compute secondary references at cluster centers
5. Re-render glitch regions with appropriate references

### Bailout Reduction

An alternative approach reduces the glitch window by using a very large bailout for the reference orbit. This keeps the reference valid longer but requires more precision.

### Implementation

```javascript
class GlitchCorrector {
    constructor(maxReferences = 10) {
        this.references = [];
        this.maxReferences = maxReferences;
    }
    
    addReference(refOrbit, region) {
        this.references.push({ orbit: refOrbit, region });
    }
    
    findBestReference(pixelC) {
        // Find reference whose c0 is closest to pixelC
        let best = this.references[0];
        let bestDist = Infinity;
        
        for (const ref of this.references) {
            const dist = complexMag2(complexSub(pixelC, ref.c0));
            if (dist < bestDist) {
                bestDist = dist;
                best = ref;
            }
        }
        
        return best;
    }
    
    correctGlitches(glitchPixels) {
        // Cluster glitch pixels
        const clusters = this.clusterPixels(glitchPixels);
        
        // Compute new reference for each cluster
        for (const cluster of clusters) {
            const center = this.clusterCenter(cluster);
            const newRef = this.computeReference(center);
            this.addReference(newRef, cluster.bounds);
        }
    }
}
```

---

## Implementation Guide

### Complete Perturbation Renderer

```javascript
class PerturbationRenderer {
    constructor(precision = 50) {
        this.precision = precision;
        this.refOrbit = null;
        this.seriesCoeffs = null;
    }
    
    setCenter(centerRe, centerIm) {
        // Store center as arbitrary precision strings
        this.centerRe = centerRe;
        this.centerIm = centerIm;
        
        // Compute reference orbit
        this.refOrbit = this.computeReferenceOrbit();
        
        // Compute series approximation coefficients
        this.seriesCoeffs = this.computeSeriesCoefficients();
    }
    
    renderPixel(pixelX, pixelY, viewWidth, viewHeight, zoom) {
        // Compute δc (pixel offset from center)
        const deltac = {
            re: (pixelX - viewWidth / 2) / zoom,
            im: (pixelY - viewHeight / 2) / zoom
        };
        
        // Use series approximation to skip early iterations
        const skipDepth = this.findSkipDepth(deltac);
        let delta = this.evaluateSeries(skipDepth, deltac);
        let n = skipDepth;
        
        // Continue with perturbation iteration
        while (n < this.refOrbit.length - 1 && n < this.maxIterations) {
            const Z = this.refOrbit[n];
            
            // Check for glitch
            if (this.detectGlitch(Z, delta)) {
                return this.handleGlitch(pixelX, pixelY, n);
            }
            
            // Perturbation step
            delta = this.perturbStep(Z, delta, deltac);
            n++;
            
            // Check escape
            const z_re = Z.re + delta.re;
            const z_im = Z.im + delta.im;
            const mag2 = z_re * z_re + z_im * z_im;
            
            if (mag2 > this.bailout * this.bailout) {
                return this.smoothIteration(n, mag2);
            }
        }
        
        return this.maxIterations;
    }
    
    perturbStep(Z, delta, deltac) {
        // δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
        const twoZ_re = 2 * Z.re;
        const twoZ_im = 2 * Z.im;
        
        const new_re = twoZ_re * delta.re - twoZ_im * delta.im 
                     + delta.re * delta.re - delta.im * delta.im 
                     + deltac.re;
        
        const new_im = twoZ_re * delta.im + twoZ_im * delta.re 
                     + 2 * delta.re * delta.im 
                     + deltac.im;
        
        return { re: new_re, im: new_im };
    }
}
```

---

## Performance Optimization

### SIMD Vectorization

Process multiple pixels simultaneously using SIMD instructions:

```javascript
// WebAssembly SIMD example (conceptual)
function perturbStep4Pixels(Z, deltas, deltacs) {
    // Process 4 pixels in parallel using v128 operations
    const twoZ = f64x2.splat(2 * Z.re, 2 * Z.im);
    // ...
}
```

### GPU Parallelization

Perturbation is highly parallelizable:

```glsl
// GLSL fragment shader (simplified)
uniform sampler2D refOrbitTexture;
uniform vec2 deltac;

void main() {
    vec2 delta = deltac;
    
    for (int n = 0; n < maxIterations; n++) {
        vec4 Z = texelFetch(refOrbitTexture, ivec2(n, 0), 0);
        
        // Perturbation step
        vec2 twoZ = 2.0 * Z.xy;
        delta = vec2(
            dot(twoZ + delta, vec2(delta.x, -delta.y)) + deltac.x,
            dot(twoZ + delta, delta.yx) + deltac.y
        );
        
        // Check escape...
    }
}
```

### Memory Optimization

- Store reference orbit in texture for GPU access
- Use float32 for orbit storage when possible
- Compress coefficient storage for series approximation

---

## Mathematical Proofs

### Proof: Perturbation Formula Derivation

**Theorem**: For $z_{n+1} = z_n^2 + c$ and $Z_{n+1} = Z_n^2 + c_0$, if $\delta_n = z_n - Z_n$ and $\delta c = c - c_0$, then:

$$\delta_{n+1} = 2Z_n\delta_n + \delta_n^2 + \delta c$$

**Proof**:

Starting from the iterations:
$$z_{n+1} = z_n^2 + c$$
$$Z_{n+1} = Z_n^2 + c_0$$

Subtracting:
$$z_{n+1} - Z_{n+1} = z_n^2 - Z_n^2 + c - c_0$$
$$\delta_{n+1} = z_n^2 - Z_n^2 + \delta c$$

Using the difference of squares:
$$z_n^2 - Z_n^2 = (z_n - Z_n)(z_n + Z_n) = \delta_n(z_n + Z_n)$$

Since $z_n = Z_n + \delta_n$:
$$\delta_n(z_n + Z_n) = \delta_n(Z_n + \delta_n + Z_n) = \delta_n(2Z_n + \delta_n) = 2Z_n\delta_n + \delta_n^2$$

Therefore:
$$\delta_{n+1} = 2Z_n\delta_n + \delta_n^2 + \delta c \quad \blacksquare$$

### Proof: Series Coefficient Recurrence

**Theorem**: If $\delta_n = \sum_{k=1}^{\infty} A_n^{(k)} (\delta c)^k$, then $A_n^{(1)}$ satisfies:

$$A_{n+1}^{(1)} = 2Z_n A_n^{(1)} + 1, \quad A_0^{(1)} = 0$$

**Proof**:

From the perturbation formula:
$$\delta_{n+1} = 2Z_n\delta_n + \delta_n^2 + \delta c$$

Substituting the series expansion and collecting first-order terms in $\delta c$:
$$A_{n+1}^{(1)} \delta c = 2Z_n A_n^{(1)} \delta c + \delta c$$

Dividing by $\delta c$:
$$A_{n+1}^{(1)} = 2Z_n A_n^{(1)} + 1$$

Initially, $\delta_0 = \delta c$, so $A_0^{(1)} = 1$... wait, let me reconsider.

Actually, $\delta_0 = 0$ typically (since $z_0 = Z_0 = 0$), so we need $\delta_1 = \delta c$, giving $A_1^{(1)} = 1$, $A_0^{(1)} = 0$. $\blacksquare$

---

## References

### Original Papers

1. **K.I. Martin** (2013). "Superfractalthing - Arbitrary Precision Mandelbrot Set Rendering in JavaScript". Describes the first practical implementation of perturbation theory for web-based fractal rendering.

2. **Pauldelbrot** (2014). "Perturbation and Series Approximation". Fractal Forums. Detailed mathematical derivations and optimizations.

3. **Claude Heiland-Allen** (2013-2020). "Kalles Fraktaler" documentation. Extensive practical notes on implementation.

### Implementation References

4. **Zhuoran** (2021). "GPU Perturbation Theory". Implementation notes for CUDA/OpenGL.

5. **Botond Kósa** (2019). "Series Approximation Methods for Ultra-Deep Zooms". Detailed analysis of convergence and error bounds.

### Historical Context

6. **Peitgen, H.-O. et al.** (1988). *The Science of Fractal Images*. Early arbitrary precision rendering techniques.

---

## Appendix: Complex Arithmetic Helpers

```javascript
function complexAdd(a, b) {
    return { re: a.re + b.re, im: a.im + b.im };
}

function complexSub(a, b) {
    return { re: a.re - b.re, im: a.im - b.im };
}

function complexMul(a, b) {
    return {
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re
    };
}

function complexSqr(a) {
    return {
        re: a.re * a.re - a.im * a.im,
        im: 2 * a.re * a.im
    };
}

function complexMul2Z(Z, a) {
    // 2·Z·a
    return {
        re: 2 * (Z.re * a.re - Z.im * a.im),
        im: 2 * (Z.re * a.im + Z.im * a.re)
    };
}

function complexMag2(a) {
    return a.re * a.re + a.im * a.im;
}
```

---

*This document is part of the Abyss Explorer project. For implementation details, see `js/math/perturbation.js` and `js/math/series-approximation.js`.*
