# Fractal Mathematics

> *"Clouds are not spheres, mountains are not cones, coastlines are not circles, and bark is not smooth, nor does lightning travel in a straight line."*
> — Benoit B. Mandelbrot, *The Fractal Geometry of Nature* (1982)

This document provides a comprehensive mathematical foundation for understanding the fractal algorithms implemented in Abyss Explorer. Whether you're a curious beginner or an experienced mathematician, this guide will deepen your appreciation of these infinite structures.

## Table of Contents

1. [The Escape-Time Algorithm](#the-escape-time-algorithm)
2. [The Mandelbrot Set](#the-mandelbrot-set)
3. [Julia Sets](#julia-sets)
4. [Smooth Iteration Count](#smooth-iteration-count)
5. [Distance Estimation](#distance-estimation)
6. [Orbit Traps](#orbit-traps)
7. [Triangle Inequality Average](#triangle-inequality-average)
8. [Stripe Average](#stripe-average)
9. [Curvature Estimation](#curvature-estimation)
10. [Other Fractal Types](#other-fractal-types)
11. [References](#references)

---

## The Escape-Time Algorithm

### Basic Concept

The escape-time algorithm is the foundation of most 2D fractal rendering. It determines whether a point belongs to the fractal set by iterating a function and checking if the values "escape" to infinity.

For a complex number $c$, we iterate:

$$z_{n+1} = f(z_n, c)$$

where $z_0$ is typically 0 (for Mandelbrot-type sets) or $c$ (for Julia sets).

### Escape Criterion

A point is considered to have "escaped" when:

$$|z_n| > B$$

where $B$ is the **bailout radius**, typically 2 for the Mandelbrot set (though larger values are used for smooth coloring).

**Why bailout = 2?** For the Mandelbrot iteration $z_{n+1} = z_n^2 + c$, if $|z_n| > 2$ and $|c| \leq 2$, then:

$$|z_{n+1}| = |z_n^2 + c| \geq |z_n|^2 - |c| > 4 - 2 = 2$$

The sequence will grow without bound once it exceeds 2.

### Iteration Count as Color

The simplest coloring method uses the iteration count $n$ at which the point escaped:

```javascript
function escapeTime(c, maxIterations, bailout) {
    let z = { re: 0, im: 0 };
    
    for (let n = 0; n < maxIterations; n++) {
        // z = z² + c
        const zRe = z.re * z.re - z.im * z.im + c.re;
        const zIm = 2 * z.re * z.im + c.im;
        z.re = zRe;
        z.im = zIm;
        
        // Check escape
        if (z.re * z.re + z.im * z.im > bailout * bailout) {
            return n;  // Escaped at iteration n
        }
    }
    
    return maxIterations;  // Didn't escape (in the set)
}
```

---

## The Mandelbrot Set

### Definition

The Mandelbrot set $\mathcal{M}$ is the set of complex numbers $c$ for which the iteration:

$$z_{n+1} = z_n^2 + c, \quad z_0 = 0$$

remains bounded as $n \to \infty$.

Formally:

$$\mathcal{M} = \{c \in \mathbb{C} : \sup_{n \in \mathbb{N}} |z_n| < \infty\}$$

### Mathematical Properties

**Connectedness**: The Mandelbrot set is connected (proven by Douady and Hubbard, 1982). This means it cannot be separated into disjoint pieces.

**Area**: The exact area is unknown, but estimated at approximately 1.506484 square units.

**Self-Similarity**: The set exhibits approximate self-similarity at various scales. Mini-Mandelbrot copies (minibrots) appear throughout the boundary.

**Cardioid**: The main body is a cardioid defined by:

$$c = \frac{1}{2}e^{i\theta} - \frac{1}{4}e^{2i\theta}$$

**Period-2 Bulb**: The large circular bulb to the left has radius $\frac{1}{4}$ centered at $-1$.

### Period and Bulbs

Each bulb on the Mandelbrot set corresponds to a specific period. A point $c$ has period $p$ if:

$$z_p = z_0 = 0 \text{ (for critical orbit)}$$

The period-$p$ bulbs are attached to the main cardioid at angles:

$$\theta = \frac{2\pi k}{p}$$

for integers $k$ coprime to $p$.

---

## Julia Sets

### Definition

For a fixed complex parameter $c$, the filled Julia set $K_c$ is:

$$K_c = \{z \in \mathbb{C} : \sup_{n \in \mathbb{N}} |z_n| < \infty\}$$

where $z_0 = z$ and $z_{n+1} = z_n^2 + c$.

### Relationship to Mandelbrot Set

There is a deep connection between Mandelbrot and Julia sets:

- If $c \in \mathcal{M}$ (in the Mandelbrot set), then $K_c$ is **connected**
- If $c \notin \mathcal{M}$ (outside the Mandelbrot set), then $K_c$ is a **Cantor dust** (totally disconnected)

This is why the Mandelbrot set is sometimes called the "map" of Julia sets.

### Notable Julia Sets

| Parameter $c$ | Description |
|---------------|-------------|
| $c = 0$ | Unit circle |
| $c = -1$ | Basilica (period-2 Julia) |
| $c = -0.123 + 0.745i$ | Douady rabbit |
| $c = i$ | Dendrite (perfectly branching) |
| $c = -2$ | Segment $[-2, 2]$ on real axis |
| $c = 0.285 + 0.01i$ | Siegel disk |

---

## Smooth Iteration Count

### The Problem with Integer Iterations

Using integer iteration counts produces visible "banding" in rendered images. Each band represents all points that escaped at the same iteration.

### Normalized Iteration Count

To eliminate banding, we use the **normalized iteration count** (also called continuous or smooth iteration):

$$\nu = n + 1 - \frac{\log(\log|z_n|)}{\log 2}$$

where $n$ is the escape iteration and $z_n$ is the final value.

### Derivation

When $|z|$ is large, the iteration $z \mapsto z^2 + c$ behaves approximately as $z \mapsto z^2$. This means:

$$|z_{n+k}| \approx |z_n|^{2^k}$$

Taking logarithms twice:

$$\log\log|z_{n+k}| \approx \log\log|z_n| + k\log 2$$

Solving for the "fractional" iteration:

$$k \approx \frac{\log\log|z_{n+k}| - \log\log|z_n|}{\log 2}$$

### Generalization for Power $p$

For the generalized iteration $z_{n+1} = z_n^p + c$:

$$\nu = n + 1 - \frac{\log(\log|z_n|)}{\log p}$$

### Implementation

```javascript
function smoothIteration(c, maxIterations, bailout = 256) {
    let z = { re: 0, im: 0 };
    
    for (let n = 0; n < maxIterations; n++) {
        const zRe = z.re * z.re - z.im * z.im + c.re;
        const zIm = 2 * z.re * z.im + c.im;
        z.re = zRe;
        z.im = zIm;
        
        const mag2 = z.re * z.re + z.im * z.im;
        if (mag2 > bailout * bailout) {
            // Smooth iteration formula
            const logMag = Math.log(mag2) / 2;  // log|z|
            const nu = n + 1 - Math.log(logMag) / Math.log(2);
            return nu;
        }
    }
    
    return maxIterations;
}
```

---

## Distance Estimation

### Concept

Distance estimation calculates the approximate distance from a point to the boundary of the fractal set. This enables:

- Anti-aliased rendering
- Adaptive step sizing for ray marching
- Glow effects and boundary highlighting

### The Distance Formula

For the Mandelbrot set, the distance from an exterior point $c$ to the boundary is approximated by:

$$d(c) \approx \frac{|z_n| \cdot \log|z_n|}{|z'_n|}$$

where $z'_n = \frac{\partial z_n}{\partial c}$ is the derivative of the orbit with respect to $c$.

### Derivative Iteration

To compute $z'_n$, we iterate alongside the main iteration:

$$z'_{n+1} = 2z_n z'_n + 1, \quad z'_0 = 0$$

This follows from differentiating $z_{n+1} = z_n^2 + c$ with respect to $c$.

### Implementation

```javascript
function distanceEstimate(c, maxIterations, bailout = 1e10) {
    let z = { re: 0, im: 0 };
    let dz = { re: 0, im: 0 };  // Derivative
    
    for (let n = 0; n < maxIterations; n++) {
        // Derivative: dz = 2 * z * dz + 1
        const dzRe = 2 * (z.re * dz.re - z.im * dz.im) + 1;
        const dzIm = 2 * (z.re * dz.im + z.im * dz.re);
        dz.re = dzRe;
        dz.im = dzIm;
        
        // Main iteration: z = z² + c
        const zRe = z.re * z.re - z.im * z.im + c.re;
        const zIm = 2 * z.re * z.im + c.im;
        z.re = zRe;
        z.im = zIm;
        
        const mag2 = z.re * z.re + z.im * z.im;
        if (mag2 > bailout * bailout) {
            const mag = Math.sqrt(mag2);
            const dzMag = Math.sqrt(dz.re * dz.re + dz.im * dz.im);
            
            // Distance estimate
            return mag * Math.log(mag) / dzMag;
        }
    }
    
    return 0;  // Inside the set
}
```

### Interior Distance

For points inside the Mandelbrot set, a different formula is needed based on the attracting cycle. This is more complex and involves finding the period of the cycle.

---

## Orbit Traps

### Concept

Orbit traps color points based on how close their orbit comes to a geometric shape (the "trap"). This creates striking visual effects independent of iteration count.

### Mathematical Framework

For each iteration $z_n$, we compute the distance to a trap $T$:

$$d_n = \text{dist}(z_n, T)$$

The final color is determined by:

- **Minimum distance**: $d_{min} = \min_n d_n$
- **First trap**: $d_{first} = d_k$ where $k$ is the first $n$ with $d_n < \epsilon$
- **Average distance**: $d_{avg} = \frac{1}{N}\sum_n d_n$

### Common Trap Types

**Point Trap** (distance to origin):
$$d_n = |z_n|$$

**Line Trap** (distance to real axis):
$$d_n = |\text{Im}(z_n)|$$

**Circle Trap** (distance to circle of radius $r$):
$$d_n = ||z_n| - r|$$

**Cross Trap** (distance to axes):
$$d_n = \min(|\text{Re}(z_n)|, |\text{Im}(z_n)|)$$

**Grid Trap** (distance to integer grid):
$$d_n = \min(|\text{Re}(z_n) - \lfloor\text{Re}(z_n)\rceil|, |\text{Im}(z_n) - \lfloor\text{Im}(z_n)\rceil|)$$

### Stalks and Rings

**Stalks** appear when using line traps with minimum distance. **Rings** appear with circle traps. The visual effect depends on:

- Trap geometry
- Distance aggregation method
- Color mapping function

---

## Triangle Inequality Average

### Concept

Triangle Inequality Average (TIA) coloring exploits the triangle inequality to create smooth, detailed textures that highlight the geometric structure of orbits.

### The Triangle Inequality

For any complex numbers $a$ and $b$:

$$||a| - |b|| \leq |a + b| \leq |a| + |b|$$

### TIA Formula

At each iteration, we compute:

$$\text{lower}_n = ||z_n| - |c||$$
$$\text{upper}_n = |z_n| + |c|$$

The TIA value is:

$$\text{tia}_n = \frac{|z_{n+1}| - \text{lower}_n}{\text{upper}_n - \text{lower}_n}$$

This normalizes the "deviation" from the triangle inequality bounds to $[0, 1]$.

### Running Average

We accumulate a running average:

$$\text{TIA} = \frac{1}{N}\sum_{n=1}^{N} \text{tia}_n$$

### Implementation

```javascript
function triangleInequalityAverage(c, maxIterations, bailout) {
    let z = { re: c.re, im: c.im };
    const cMag = Math.sqrt(c.re * c.re + c.im * c.im);
    
    let sum = 0;
    let count = 0;
    
    for (let n = 0; n < maxIterations; n++) {
        const zMag = Math.sqrt(z.re * z.re + z.im * z.im);
        
        // Next iteration
        const zRe = z.re * z.re - z.im * z.im + c.re;
        const zIm = 2 * z.re * z.im + c.im;
        z.re = zRe;
        z.im = zIm;
        
        const zNextMag = Math.sqrt(z.re * z.re + z.im * z.im);
        
        if (zNextMag > bailout) break;
        
        // Triangle inequality bounds
        const lower = Math.abs(zMag * zMag - cMag);  // For z² + c
        const upper = zMag * zMag + cMag;
        
        if (upper > lower) {
            sum += (zNextMag - lower) / (upper - lower);
            count++;
        }
    }
    
    return count > 0 ? sum / count : 0;
}
```

---

## Stripe Average

### Concept

Stripe average coloring creates zebra-like stripe patterns based on the argument (angle) of orbit values. It reveals the rotational structure of the iteration.

### Formula

At each iteration, we extract the angular component:

$$\theta_n = \arg(z_n) \mod 2\pi$$

The stripe value is:

$$s_n = \frac{1}{2}\sin(\text{stripeDensity} \cdot \theta_n) + \frac{1}{2}$$

### Running Average

$$\text{SA} = \frac{1}{N}\sum_{n=1}^{N} s_n$$

### Combined with Smooth Iteration

For best results, combine stripe average with smooth iteration:

$$\text{color} = \text{SA} + \nu \cdot \text{factor}$$

where $\nu$ is the smooth iteration count.

### Implementation

```javascript
function stripeAverage(c, maxIterations, bailout, stripeDensity = 1) {
    let z = { re: 0, im: 0 };
    let sum = 0;
    let count = 0;
    
    for (let n = 0; n < maxIterations; n++) {
        const zRe = z.re * z.re - z.im * z.im + c.re;
        const zIm = 2 * z.re * z.im + c.im;
        z.re = zRe;
        z.im = zIm;
        
        const mag2 = z.re * z.re + z.im * z.im;
        
        if (mag2 > bailout * bailout) {
            break;
        }
        
        // Stripe value from angle
        const angle = Math.atan2(z.im, z.re);
        const stripe = 0.5 * Math.sin(stripeDensity * angle) + 0.5;
        
        sum += stripe;
        count++;
    }
    
    return count > 0 ? sum / count : 0;
}
```

---

## Curvature Estimation

### Concept

Curvature estimation measures how sharply the orbit "bends" through the complex plane. It highlights regions of high dynamical activity.

### Mathematical Definition

The curvature $\kappa$ of a curve at a point is:

$$\kappa = \frac{|x'y'' - y'x''|}{(x'^2 + y'^2)^{3/2}}$$

### Discrete Approximation

For a discrete orbit, we approximate curvature using three consecutive points $z_{n-1}, z_n, z_{n+1}$:

$$\kappa_n \approx \frac{2 \cdot \text{Area}(z_{n-1}, z_n, z_{n+1})}{|z_{n-1} - z_n| \cdot |z_n - z_{n+1}| \cdot |z_{n+1} - z_{n-1}|}$$

The area of the triangle is:

$$\text{Area} = \frac{1}{2}|\text{Im}((z_{n-1} - z_n)\overline{(z_{n+1} - z_n)})|$$

### Implementation

```javascript
function curvatureEstimate(c, maxIterations, bailout) {
    let zPrev = { re: 0, im: 0 };
    let z = { re: c.re, im: c.im };
    
    let curvatureSum = 0;
    let count = 0;
    
    for (let n = 0; n < maxIterations; n++) {
        const zRe = z.re * z.re - z.im * z.im + c.re;
        const zIm = 2 * z.re * z.im + c.im;
        const zNext = { re: zRe, im: zIm };
        
        if (n >= 2) {
            // Compute curvature from three points
            const d1 = Math.hypot(z.re - zPrev.re, z.im - zPrev.im);
            const d2 = Math.hypot(zNext.re - z.re, zNext.im - z.im);
            const d3 = Math.hypot(zNext.re - zPrev.re, zNext.im - zPrev.im);
            
            // Triangle area (cross product)
            const area = Math.abs(
                (z.re - zPrev.re) * (zNext.im - z.im) -
                (z.im - zPrev.im) * (zNext.re - z.re)
            ) / 2;
            
            if (d1 > 0 && d2 > 0 && d3 > 0) {
                const curvature = 4 * area / (d1 * d2 * d3);
                curvatureSum += curvature;
                count++;
            }
        }
        
        const mag2 = zNext.re * zNext.re + zNext.im * zNext.im;
        if (mag2 > bailout * bailout) break;
        
        zPrev = z;
        z = zNext;
    }
    
    return count > 0 ? curvatureSum / count : 0;
}
```

---

## Other Fractal Types

### Burning Ship

The Burning Ship fractal uses absolute values before squaring:

$$z_{n+1} = (|\text{Re}(z_n)| + i|\text{Im}(z_n)|)^2 + c$$

This breaks the symmetry and creates a distinctive "ship" shape with "flames" rising from the hull.

### Tricorn (Mandelbar)

The Tricorn uses complex conjugation:

$$z_{n+1} = \overline{z_n}^2 + c$$

This creates a three-cornered figure with interesting symmetry properties.

### Newton Fractal

Newton fractals visualize Newton's method for finding polynomial roots:

$$z_{n+1} = z_n - \frac{p(z_n)}{p'(z_n)}$$

For $p(z) = z^3 - 1$:

$$z_{n+1} = z_n - \frac{z_n^3 - 1}{3z_n^2} = \frac{2z_n^3 + 1}{3z_n^2}$$

Colors indicate which root the iteration converges to.

### Phoenix Fractal

The Phoenix fractal includes a memory term:

$$z_{n+1} = z_n^2 + c + p \cdot z_{n-1}$$

where $p$ is the Phoenix parameter.

### Multibrot Sets

Generalization to higher powers:

$$z_{n+1} = z_n^d + c$$

The set has $(d-1)$-fold rotational symmetry.

---

## References

### Foundational Works

1. **Mandelbrot, B.B.** (1982). *The Fractal Geometry of Nature*. W.H. Freeman and Company.

2. **Douady, A. & Hubbard, J.H.** (1984-1985). "Étude dynamique des polynômes complexes" (Parts I & II). Publications Mathématiques d'Orsay.

3. **Peitgen, H.-O. & Richter, P.H.** (1986). *The Beauty of Fractals*. Springer-Verlag.

### Technical Papers

4. **Milnor, J.** (2006). *Dynamics in One Complex Variable*. Princeton University Press.

5. **Vepstas, L.** (1997). "Renormalizing the Mandelbrot Escape". Available at linas.org.

6. **Munafo, R.** (1996-2024). "Mu-Ency - The Encyclopedia of the Mandelbrot Set". mrob.com.

### Distance Estimation

7. **Douady, A. et al.** (1983). "Distance estimation for complex polynomial Julia sets". 

8. **Hart, J.C., Sandin, D.J., & Kauffman, L.H.** (1989). "Ray Tracing Deterministic 3-D Fractals". *SIGGRAPH Computer Graphics*.

### Coloring Algorithms

9. **Linas, V.** (2000). "Triangle Inequality Average Coloring". Fractint documentation.

10. **García, D.** "Stripe Average Coloring". Fractal Forums.

---

## Glossary

| Term | Definition |
|------|------------|
| **Bailout** | Threshold magnitude beyond which a point is considered escaped |
| **Cardioid** | Heart-shaped main body of the Mandelbrot set |
| **Critical Point** | Point where the derivative vanishes (z=0 for z²+c) |
| **Escape Time** | Number of iterations before a point escapes |
| **Julia Set** | Set of points with bounded orbits for fixed c |
| **Mandelbrot Set** | Set of c values with bounded critical orbit |
| **Minibrot** | Small copy of the full Mandelbrot set |
| **Orbit** | Sequence of values generated by iteration |
| **Period** | Length of a repeating cycle in the orbit |

---

*This document is part of the Abyss Explorer project. For implementation details, see the source code in `js/fractals/` and `js/coloring/`.*
