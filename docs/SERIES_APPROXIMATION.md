# Series Approximation for Fractal Rendering

> *"The infinite series is the true mother of all analysis."*
> — Leonhard Euler

Series approximation is an optimization technique that dramatically accelerates perturbation-based fractal rendering by skipping early iterations entirely. This document provides a complete mathematical treatment.

## Table of Contents

1. [Overview](#overview)
2. [Mathematical Foundation](#mathematical-foundation)
3. [Coefficient Derivation](#coefficient-derivation)
4. [Convergence Analysis](#convergence-analysis)
5. [Adaptive Order Selection](#adaptive-order-selection)
6. [The Epsilon Cross Method](#the-epsilon-cross-method)
7. [Error Bounds](#error-bounds)
8. [Implementation](#implementation)
9. [Performance Analysis](#performance-analysis)
10. [Advanced Techniques](#advanced-techniques)
11. [References](#references)

---

## Overview

### The Problem

In perturbation-based rendering, every pixel requires iterating:

$$\delta_{n+1} = 2Z_n\delta_n + \delta_n^2 + \delta c$$

from $n = 0$ to escape or max iterations. For a 4K image (8 million pixels) at 10,000 iterations, this is 80 billion operations per frame.

### The Solution

Series approximation precomputes coefficients such that:

$$\delta_n \approx A_n \delta c + B_n (\delta c)^2 + C_n (\delta c)^3 + \ldots$$

This allows **direct evaluation** of $\delta_n$ without iterating, skipping potentially thousands of iterations per pixel.

### Performance Impact

| Without SA | With SA (skip 500) | Speedup |
|------------|-------------------|---------|
| 10,000 iterations | 9,500 iterations | 1.05× |
| 10,000 iterations | 5,000 iterations | 2× |
| 10,000 iterations | 1,000 iterations | 10× |

At deep zooms with high iteration counts, series approximation can provide **10-100× speedup**.

---

## Mathematical Foundation

### Taylor Series Expansion

We seek to express $\delta_n$ as a power series in $\delta c$:

$$\delta_n = \sum_{k=1}^{\infty} A_n^{(k)} (\delta c)^k$$

where $A_n^{(k)}$ are complex coefficients depending only on the reference orbit.

### Notation

For clarity, we use:
- $A_n$ for the first-order coefficient $A_n^{(1)}$
- $B_n$ for the second-order coefficient $A_n^{(2)}$
- $C_n$ for the third-order coefficient $A_n^{(3)}$
- And so on: $D_n, E_n, F_n, \ldots$

So:

$$\delta_n = A_n \cdot \delta c + B_n \cdot (\delta c)^2 + C_n \cdot (\delta c)^3 + D_n \cdot (\delta c)^4 + \ldots$$

### Initial Conditions

Since $\delta_0 = 0$ and $\delta_1 = \delta c$:

$$A_0 = 0, \quad A_1 = 1$$
$$B_0 = 0, \quad B_1 = 0$$
$$C_0 = 0, \quad C_1 = 0$$

---

## Coefficient Derivation

### Recurrence Relations

Starting from the perturbation formula:

$$\delta_{n+1} = 2Z_n\delta_n + \delta_n^2 + \delta c$$

We substitute the series expansion and match coefficients of equal powers of $\delta c$.

### First-Order (Linear) Term: $A_n$

Collecting terms with $(\delta c)^1$:

$$A_{n+1} \cdot \delta c = 2Z_n \cdot A_n \cdot \delta c + \delta c$$

Therefore:

$$\boxed{A_{n+1} = 2Z_n A_n + 1}$$

### Second-Order Term: $B_n$

Collecting terms with $(\delta c)^2$:

$$B_{n+1} \cdot (\delta c)^2 = 2Z_n \cdot B_n \cdot (\delta c)^2 + (A_n \cdot \delta c)^2$$

Therefore:

$$\boxed{B_{n+1} = 2Z_n B_n + A_n^2}$$

### Third-Order Term: $C_n$

Collecting terms with $(\delta c)^3$:

The $\delta_n^2$ term contributes $2 A_n B_n (\delta c)^3$:

$$C_{n+1} \cdot (\delta c)^3 = 2Z_n \cdot C_n \cdot (\delta c)^3 + 2 A_n B_n \cdot (\delta c)^3$$

Therefore:

$$\boxed{C_{n+1} = 2Z_n C_n + 2A_n B_n}$$

### Fourth-Order Term: $D_n$

$$D_{n+1} = 2Z_n D_n + 2A_n C_n + B_n^2$$

### General Pattern

For order $k \geq 2$:

$$X_{n+1}^{(k)} = 2Z_n X_n^{(k)} + \sum_{j=1}^{k-1} X_n^{(j)} X_n^{(k-j)}$$

This is the **convolution** of lower-order coefficients.

### Complete Recurrence Table

| Order | Coefficient | Recurrence |
|-------|-------------|------------|
| 1 | $A_n$ | $A_{n+1} = 2Z_n A_n + 1$ |
| 2 | $B_n$ | $B_{n+1} = 2Z_n B_n + A_n^2$ |
| 3 | $C_n$ | $C_{n+1} = 2Z_n C_n + 2A_n B_n$ |
| 4 | $D_n$ | $D_{n+1} = 2Z_n D_n + 2A_n C_n + B_n^2$ |
| 5 | $E_n$ | $E_{n+1} = 2Z_n E_n + 2A_n D_n + 2B_n C_n$ |
| 6 | $F_n$ | $F_{n+1} = 2Z_n F_n + 2A_n E_n + 2B_n D_n + C_n^2$ |

---

## Convergence Analysis

### Series Validity

The series approximation is valid when the truncation error is small compared to the true value. This fails when:

1. $|\delta c|$ is too large (series diverges)
2. The orbit passes near zero (coefficients explode)
3. Iteration count exceeds stability threshold

### Radius of Convergence

The effective radius of convergence at iteration $n$ is approximately:

$$R_n \approx \frac{1}{\max_k |A_n^{(k)}|^{1/k}}$$

For practical use, we estimate:

$$R_n \approx \min\left(\frac{|A_n|}{|B_n|}, \sqrt{\frac{|B_n|}{|C_n|}}, \ldots\right)$$

### Coefficient Growth

Typically, $|A_n|$ grows exponentially:

$$|A_n| \sim \prod_{k=0}^{n-1} |2Z_k| \approx 2^n \prod_{k=0}^{n-1} |Z_k|$$

When $Z_k$ is bounded (orbit stays bounded), $|A_n|$ grows roughly as $2^n$.

---

## Adaptive Order Selection

### Choosing the Optimal Order

Higher-order approximations allow skipping more iterations but require:
- More coefficient computations
- More storage
- More evaluation time per pixel

The optimal order balances these tradeoffs.

### Heuristic Selection

A practical heuristic:

```javascript
function selectOrder(refOrbitLength, pixelDensity) {
    // pixelDensity = pixels per unit in complex plane
    
    if (pixelDensity < 1e6) return 4;   // Low zoom
    if (pixelDensity < 1e10) return 6;  // Medium zoom
    if (pixelDensity < 1e15) return 8;  // High zoom
    return 12;                           // Ultra-deep zoom
}
```

### Diminishing Returns

Beyond order 8-12, additional terms provide minimal benefit because:
- The truncation error becomes dominated by floating-point errors
- Coefficient evaluation cost exceeds iteration savings

---

## The Epsilon Cross Method

### Overview

The epsilon cross method determines the maximum safe skip depth by monitoring when successive approximation orders disagree by more than a tolerance $\epsilon$.

### Algorithm

```javascript
function findSkipDepth(coeffs, deltac, epsilon = 1e-6) {
    const maxDepth = coeffs.A.length - 1;
    
    for (let n = 1; n < maxDepth; n++) {
        // Evaluate series at order k and k+1
        const delta_k = evaluateSeries(coeffs, deltac, n, order - 1);
        const delta_k1 = evaluateSeries(coeffs, deltac, n, order);
        
        // Check relative difference
        const diff = complexMag(complexSub(delta_k, delta_k1));
        const mag = complexMag(delta_k1);
        
        if (diff > epsilon * mag) {
            return n - 1;  // Series no longer reliable
        }
    }
    
    return maxDepth - 1;
}
```

### Visual Interpretation

The "epsilon cross" is where the error curve crosses the tolerance threshold:

```
Error
  |
  |     ___----
  |  __/
  | /
  |/___________*_______ epsilon
  |            |
  +------------n--------> Iteration
           skip depth
```

---

## Error Bounds

### Truncation Error

For an order-$k$ approximation, the truncation error is:

$$E_n^{(k)} = \delta_n - \sum_{j=1}^{k} A_n^{(j)} (\delta c)^j = \sum_{j=k+1}^{\infty} A_n^{(j)} (\delta c)^j$$

### Bound Estimation

The error is bounded by:

$$|E_n^{(k)}| \leq |A_n^{(k+1)}| |\delta c|^{k+1} \cdot \frac{1}{1 - |\delta c| / R_n}$$

For $|\delta c| \ll R_n$:

$$|E_n^{(k)}| \approx |A_n^{(k+1)}| |\delta c|^{k+1}$$

### Practical Error Control

We skip to depth $n$ only if:

$$|A_n^{(k+1)}| |\delta c|^{k+1} < \epsilon \cdot |A_n^{(1)}| |\delta c|$$

Simplifying:

$$|A_n^{(k+1)}| |\delta c|^k < \epsilon \cdot |A_n^{(1)}|$$

---

## Implementation

### Complete Series Approximation Class

```javascript
class SeriesApproximation {
    constructor(maxOrder = 8) {
        this.maxOrder = maxOrder;
        this.coefficients = null;
    }
    
    /**
     * Compute coefficients from reference orbit
     */
    computeCoefficients(refOrbit) {
        const n = refOrbit.length;
        const order = this.maxOrder;
        
        // Initialize coefficient arrays
        const coeffs = [];
        for (let k = 0; k < order; k++) {
            coeffs[k] = new Array(n);
            coeffs[k][0] = { re: 0, im: 0 };
        }
        
        // Iterate to compute coefficients
        for (let i = 0; i < n - 1; i++) {
            const Z = refOrbit[i];
            const twoZ = { re: 2 * Z.re, im: 2 * Z.im };
            
            // First order: A_{n+1} = 2*Z_n*A_n + 1
            coeffs[0][i + 1] = complexAdd(
                complexMul(twoZ, coeffs[0][i]),
                { re: 1, im: 0 }
            );
            
            // Higher orders: X_{n+1} = 2*Z_n*X_n + convolution
            for (let k = 1; k < order; k++) {
                let conv = { re: 0, im: 0 };
                
                for (let j = 0; j < k; j++) {
                    conv = complexAdd(conv,
                        complexMul(coeffs[j][i], coeffs[k - 1 - j][i])
                    );
                }
                
                coeffs[k][i + 1] = complexAdd(
                    complexMul(twoZ, coeffs[k][i]),
                    conv
                );
            }
        }
        
        this.coefficients = coeffs;
        return coeffs;
    }
    
    /**
     * Find maximum safe skip depth for a given delta c
     */
    findSkipDepth(deltac, tolerance = 1e-6) {
        const coeffs = this.coefficients;
        const maxN = coeffs[0].length - 1;
        const dcMag = Math.sqrt(deltac.re * deltac.re + deltac.im * deltac.im);
        
        // Compute powers of deltac magnitude
        const dcPowers = [1];
        for (let k = 1; k <= this.maxOrder; k++) {
            dcPowers[k] = dcPowers[k - 1] * dcMag;
        }
        
        for (let n = 1; n < maxN; n++) {
            // Estimate error at this depth
            const lastCoeff = coeffs[this.maxOrder - 1][n];
            const lastCoeffMag = Math.sqrt(
                lastCoeff.re * lastCoeff.re + lastCoeff.im * lastCoeff.im
            );
            
            const firstCoeff = coeffs[0][n];
            const firstCoeffMag = Math.sqrt(
                firstCoeff.re * firstCoeff.re + firstCoeff.im * firstCoeff.im
            );
            
            // Error estimate: |A^(k)|*|dc|^k vs |A^(1)|*|dc|
            const errorEstimate = lastCoeffMag * dcPowers[this.maxOrder - 1];
            const valueEstimate = firstCoeffMag * dcMag;
            
            if (errorEstimate > tolerance * valueEstimate) {
                return Math.max(0, n - 1);
            }
            
            // Also check if coefficients are exploding (near zero in orbit)
            if (firstCoeffMag > 1e100) {
                return Math.max(0, n - 1);
            }
        }
        
        return maxN - 1;
    }
    
    /**
     * Evaluate series at given depth for given delta c
     */
    evaluate(n, deltac) {
        const coeffs = this.coefficients;
        
        // δ = A*dc + B*dc² + C*dc³ + ...
        let delta = { re: 0, im: 0 };
        let dcPower = { re: deltac.re, im: deltac.im };
        
        for (let k = 0; k < this.maxOrder; k++) {
            delta = complexAdd(delta, complexMul(coeffs[k][n], dcPower));
            dcPower = complexMul(dcPower, deltac);
        }
        
        return delta;
    }
}
```

### Usage Example

```javascript
// Setup
const series = new SeriesApproximation(8);
series.computeCoefficients(refOrbit);

// Per-pixel rendering
function renderPixel(deltac) {
    // Find how many iterations to skip
    const skipDepth = series.findSkipDepth(deltac);
    
    // Evaluate delta at skip depth
    let delta = series.evaluate(skipDepth, deltac);
    let n = skipDepth;
    
    // Continue with standard perturbation iteration
    while (n < maxIterations) {
        // ... perturbation step ...
        n++;
    }
    
    return n;
}
```

---

## Performance Analysis

### Complexity Comparison

| Method | Time per Pixel | Notes |
|--------|---------------|-------|
| Naive | $O(N)$ | N iterations |
| Perturbation | $O(N)$ | Same iterations, faster per-iteration |
| Series + Perturb | $O(N - S + k)$ | Skip S iterations, k is series order |

### Skip Depth Statistics

For typical deep zooms:

| Zoom Depth | Typical Max Iterations | Typical Skip Depth | Savings |
|------------|----------------------|-------------------|---------|
| $10^{15}$ | 5,000 | 2,000 | 40% |
| $10^{30}$ | 20,000 | 12,000 | 60% |
| $10^{50}$ | 50,000 | 35,000 | 70% |
| $10^{100}$ | 100,000 | 80,000 | 80% |

### Memory Requirements

| Order | Coefficients per Iteration | Memory for 100K iterations |
|-------|---------------------------|---------------------------|
| 4 | 4 × 16 bytes = 64 bytes | 6.4 MB |
| 8 | 8 × 16 bytes = 128 bytes | 12.8 MB |
| 12 | 12 × 16 bytes = 192 bytes | 19.2 MB |

---

## Advanced Techniques

### Bivariate Series

For Julia sets, we can expand in both $z_0$ and $c$:

$$\delta_n(z_0, c) = \sum_{j,k} A_n^{(j,k)} z_0^j c^k$$

This provides even more flexibility but requires significantly more coefficients.

### Automatic Differentiation

Use automatic differentiation to compute arbitrary-order coefficients:

```javascript
class DualNumber {
    constructor(value, derivatives = [1]) {
        this.value = value;
        this.derivatives = derivatives;
    }
    
    multiply(other) {
        // Leibniz rule for products
        // (fg)' = f'g + fg'
        // (fg)'' = f''g + 2f'g' + fg''
        // etc.
    }
}
```

### Interval Arithmetic

Use interval arithmetic to get guaranteed error bounds:

```javascript
function evaluateWithBounds(coeffs, deltac, n) {
    // Return [delta_lower, delta_upper]
    // Guaranteed to contain true value
}
```

---

## References

1. **K.I. Martin** (2013). "Superfractalthing Maths". Original series approximation derivation.

2. **Pauldelbrot** (2014). "Perturbation and Series Approximation". Fractal Forums. Comprehensive treatment.

3. **Kalles Fraktaler 2** Documentation. Practical implementation notes.

4. **Botond Kósa** (2019). "Optimizing Series Approximation for Real-Time Rendering". Performance analysis.

5. **Claude Heiland-Allen**. "et" renderer source code. Reference implementation.

---

## Appendix: Worked Example

### Setup

Reference orbit at $c_0 = -0.75 + 0.1i$:

| $n$ | $Z_n$ |
|-----|-------|
| 0 | $0$ |
| 1 | $-0.75 + 0.1i$ |
| 2 | $-0.1875 - 0.05i$ |
| 3 | $-0.7225 + 0.11875i$ |
| ... | ... |

### Coefficient Computation

**First order ($A_n$):**

$A_0 = 0$

$A_1 = 2Z_0 \cdot A_0 + 1 = 1$

$A_2 = 2Z_1 \cdot A_1 + 1 = 2(-0.75 + 0.1i) + 1 = -0.5 + 0.2i$

$A_3 = 2Z_2 \cdot A_2 + 1 = 2(-0.1875 - 0.05i)(-0.5 + 0.2i) + 1 = \ldots$

**Second order ($B_n$):**

$B_0 = 0$

$B_1 = 2Z_0 \cdot B_0 + A_0^2 = 0$

$B_2 = 2Z_1 \cdot B_1 + A_1^2 = 0 + 1 = 1$

$B_3 = 2Z_2 \cdot B_2 + A_2^2 = \ldots$

### Evaluation

For $\delta c = 10^{-6} + 2 \times 10^{-6}i$:

$$\delta_3 \approx A_3 \cdot \delta c + B_3 \cdot (\delta c)^2 + \ldots$$

If $|A_3| \approx 10$ and $|\delta c| = 2.2 \times 10^{-6}$:

$$|\delta_3| \approx 10 \cdot 2.2 \times 10^{-6} = 2.2 \times 10^{-5}$$

The second-order correction:
$$|B_3| \cdot |\delta c|^2 \approx 10 \cdot 5 \times 10^{-12} = 5 \times 10^{-11}$$

This is negligible, confirming the first-order approximation is sufficient at iteration 3.

---

*This document is part of the Abyss Explorer project. For implementation, see `js/math/series-approximation.js`.*
