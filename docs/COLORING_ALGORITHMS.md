# Coloring Algorithms Reference

> *"Color is the keyboard, the eyes are the harmonies, the soul is the piano with many strings."*
> — Wassily Kandinsky

This document provides a complete reference for all coloring algorithms implemented in Abyss Explorer. Each algorithm transforms raw iteration data into visually stunning images.

## Table of Contents

1. [Coloring Fundamentals](#coloring-fundamentals)
2. [Escape-Based Coloring](#escape-based-coloring)
3. [Orbit Analysis Methods](#orbit-analysis-methods)
4. [Geometric Methods](#geometric-methods)
5. [Statistical Methods](#statistical-methods)
6. [Hybrid Methods](#hybrid-methods)
7. [Interior Coloring](#interior-coloring)
8. [Post-Processing](#post-processing)
9. [Color Mapping](#color-mapping)
10. [Algorithm Gallery](#algorithm-gallery)

---

## Coloring Fundamentals

### The Coloring Pipeline

```
Iteration Data → Coloring Algorithm → Scalar Value → Color Palette → RGB Color
```

Each coloring algorithm produces a scalar value (typically 0-1 or iteration-based), which is then mapped through a color palette.

### Input Data Available

| Data | Description | Range |
|------|-------------|-------|
| `n` | Escape iteration | 0 to maxIterations |
| `z_n` | Final complex value | Complex number |
| `orbit` | All orbit values | Array of complex |
| `c` | Pixel coordinate | Complex number |
| `escaped` | Did the point escape? | Boolean |

### Output Requirements

- **Continuous**: Avoid banding/discontinuities
- **Consistent**: Same parameters produce same results
- **Bounded**: Produce values in a predictable range

---

## Escape-Based Coloring

### 1. Simple Iteration Count

**Formula**: $\text{color} = n$

**Visual**: Sharp bands of color, one per iteration level.

**Use Case**: Quick previews, artistic effect.

```javascript
function simpleIterationCount(n, z, maxIter) {
    return n / maxIter;
}
```

### 2. Smooth Iteration (Normalized)

**Formula**: 
$$\nu = n + 1 - \frac{\log(\log|z_n|)}{\log 2}$$

**Visual**: Smooth gradients without visible bands. The standard for high-quality rendering.

**Mathematical Basis**: Interpolates between integer iterations based on how far past bailout the point escaped.

```javascript
function smoothIteration(n, z, bailout) {
    const logZn = Math.log(z.re * z.re + z.im * z.im) / 2;
    const nu = n + 1 - Math.log(logZn) / Math.log(2);
    return nu;
}
```

### 3. Normalized with Power

**Formula**: 
$$\nu = n + 1 - \frac{\log(\log|z_n|)}{\log p}$$

For fractals using $z^p + c$.

**Visual**: Same smooth appearance, correct for higher powers.

### 4. Binary Decomposition

**Formula**: $\text{color} = \text{sign}(\text{Im}(z_n))$

**Visual**: Stark black/white pattern based on which half-plane the final value lands in. Creates zebra-stripe effects.

```javascript
function binaryDecomposition(z) {
    return z.im > 0 ? 1 : 0;
}
```

### 5. Level Sets (Equipotentials)

**Formula**: $\text{color} = \lfloor\nu\rfloor \mod k$

**Visual**: Discrete bands following equipotential lines, like topographic contours.

---

## Orbit Analysis Methods

### 6. Orbit Trap - Point

**Formula**: $d_{min} = \min_i |z_i|$

**Visual**: Radial "stalk" patterns emanating from the origin. Points whose orbits pass near zero appear bright.

```javascript
function pointTrap(orbit) {
    let minDist = Infinity;
    for (const z of orbit) {
        const dist = Math.sqrt(z.re * z.re + z.im * z.im);
        minDist = Math.min(minDist, dist);
    }
    return minDist;
}
```

### 7. Orbit Trap - Line (Real Axis)

**Formula**: $d_{min} = \min_i |\text{Im}(z_i)|$

**Visual**: Horizontal "stalks" along the real axis. Creates dramatic horizontal striations.

### 8. Orbit Trap - Line (Imaginary Axis)

**Formula**: $d_{min} = \min_i |\text{Re}(z_i)|$

**Visual**: Vertical "stalks" along the imaginary axis.

### 9. Orbit Trap - Cross

**Formula**: $d_{min} = \min_i \min(|\text{Re}(z_i)|, |\text{Im}(z_i)|)$

**Visual**: Combined vertical and horizontal stalks forming a cross pattern.

```javascript
function crossTrap(orbit) {
    let minDist = Infinity;
    for (const z of orbit) {
        const dist = Math.min(Math.abs(z.re), Math.abs(z.im));
        minDist = Math.min(minDist, dist);
    }
    return minDist;
}
```

### 10. Orbit Trap - Circle

**Formula**: $d_{min} = \min_i ||z_i| - r|$

**Visual**: Ring patterns at radius $r$. Creates concentric ring effects.

### 11. Orbit Trap - Square

**Formula**: $d_{min} = \min_i \max(|x_i| - s, |y_i| - s)$

**Visual**: Box-shaped patterns.

### 12. Orbit Trap - Golden Spiral

**Formula**: 
$$r(\theta) = a \cdot e^{b\theta}$$
$$d_{min} = \min_i |z_i - r(\arg(z_i))|$$

**Visual**: Logarithmic spiral patterns, mathematically natural.

### 13. Orbit Trap - Flower

**Formula**: 
$$r(\theta) = r_0 + a\sin(k\theta)$$

**Visual**: Petal-like patterns with $k$-fold symmetry.

### 14. Orbit Trap - Grid

**Formula**: $d_{min} = \min_i \min(\text{frac}(x_i), \text{frac}(y_i))$

**Visual**: Grid overlay effect, tessellated appearance.

### 15. Orbit Trap - Pickover Stalks

**Formula**: Uses multiple trap types simultaneously, weighted.

**Visual**: Complex stalks with multiple origins, named after Clifford Pickover.

### 16. First Trap (Iteration-Weighted)

**Formula**: Return $n$ of first iteration where $d_n < \epsilon$.

**Visual**: Similar to orbit traps but with iteration-based coloring where trap is triggered.

### 17. Average Orbit Distance

**Formula**: $\bar{d} = \frac{1}{N}\sum_{i=1}^{N} |z_i|$

**Visual**: Smooth gradients based on average orbit magnitude.

---

## Geometric Methods

### 18. Triangle Inequality Average (TIA)

**Formula**:
$$\text{tia}_n = \frac{|z_{n+1}| - ||z_n|^2 - |c||}{|z_n|^2 + |c| - ||z_n|^2 - |c||}$$
$$\text{TIA} = \frac{1}{N}\sum_n \text{tia}_n$$

**Visual**: Highlights geometric structure of orbits. Creates fabric-like textures with intricate detail.

```javascript
function triangleInequalityAverage(orbit, c) {
    const cMag = complexMag(c);
    let sum = 0;
    let count = 0;
    
    for (let i = 1; i < orbit.length - 1; i++) {
        const zMag = complexMag(orbit[i]);
        const zNextMag = complexMag(orbit[i + 1]);
        
        const lower = Math.abs(zMag * zMag - cMag);
        const upper = zMag * zMag + cMag;
        
        if (upper > lower + 1e-10) {
            sum += (zNextMag - lower) / (upper - lower);
            count++;
        }
    }
    
    return count > 0 ? sum / count : 0;
}
```

### 19. Stripe Average

**Formula**:
$$s_n = \sin(\text{density} \cdot \arg(z_n))$$
$$\text{SA} = \frac{1}{N}\sum_n s_n$$

**Visual**: Zebra-stripe patterns following orbit rotation. Reveals angular structure.

### 20. Curvature Estimation

**Formula**: Measures orbit curvature using discrete approximation.

**Visual**: Highlights areas of high dynamical activity with sharp turns in the orbit.

### 21. Angle Decomposition

**Formula**: $\theta_n = \arg(z_n) \mod 2\pi$

**Visual**: Color based on final argument. Creates radial color wheels.

### 22. Distance Estimation

**Formula**:
$$d(c) \approx \frac{|z_n| \log|z_n|}{|z'_n|}$$

**Visual**: Approximates distance to fractal boundary. Useful for anti-aliasing and glow effects.

### 23. Boundary Detection

**Formula**: $\text{boundary} = |d(c)| < \epsilon$

**Visual**: Highlights the fractal boundary with a bright line.

### 24. Normal Mapping

**Formula**: Compute surface normal from height field (iteration as height).

**Visual**: 3D shaded appearance with directional lighting.

---

## Statistical Methods

### 25. Histogram Equalization

**Formula**: Map iteration values through cumulative distribution function.

**Visual**: Maximizes contrast, uses full color range regardless of iteration distribution.

**Implementation**: 
1. Render pass 1: Collect iteration histogram
2. Compute CDF
3. Render pass 2: Map iterations through CDF

```javascript
function histogramEqualization(iterations, histogram, cdf) {
    const index = Math.floor(iterations);
    return cdf[index];
}
```

### 26. Standard Deviation

**Formula**: $\sigma = \sqrt{\frac{1}{N}\sum_n (|z_n| - \bar{|z|})^2}$

**Visual**: Highlights areas of high orbit variability.

### 27. Lyapunov Exponent

**Formula**: 
$$\lambda = \lim_{N\to\infty} \frac{1}{N}\sum_{n=0}^{N-1} \log|f'(z_n)|$$

For $z^2 + c$: $\lambda = \frac{1}{N}\sum_n \log|2z_n|$

**Visual**: Measures chaos/stability. Creates distinctive banding.

---

## Hybrid Methods

### 28. Smooth + Stripe

**Formula**: $\text{color} = \alpha \cdot \nu + \beta \cdot \text{SA}$

**Visual**: Combines smooth gradients with stripe texture.

### 29. Smooth + Triangle

**Formula**: $\text{color} = \alpha \cdot \nu + \beta \cdot \text{TIA}$

**Visual**: Smooth iteration with triangle inequality detail.

### 30. Multi-Layer

**Formula**: Combine multiple algorithms with different weights per zoom level.

**Visual**: Maintains detail at all zoom levels.

### 31. Adaptive Mixing

**Formula**: Blend based on local fractal properties.

**Visual**: Different algorithms for interior, exterior, and boundary.

---

## Interior Coloring

For points that don't escape (inside the Mandelbrot set):

### 32. Period Detection

**Formula**: Find the period of the attracting cycle.

**Visual**: Color by period length. Creates rainbow-like interior.

### 33. Atom Domain

**Formula**: Identify which "atom" (periodic component) the point belongs to.

**Visual**: Maps interior structure, revealing period domains.

### 34. Internal Angle

**Formula**: For periodic points, compute rotation angle of cycle.

**Visual**: Angular gradient within each bulb.

### 35. Interior Distance

**Formula**: Distance from interior point to the boundary.

**Visual**: Gradient from center to edge of set.

### 36. Solid Interior

**Formula**: $\text{color} = \text{constant}$

**Visual**: Simple black interior (classic look).

---

## Post-Processing

### 37. Gamma Correction

**Formula**: $\text{color}' = \text{color}^{1/\gamma}$

**Visual**: Adjusts overall brightness curve.

### 38. Contrast Enhancement

**Formula**: $\text{color}' = \frac{\text{color} - 0.5}{1 + \text{contrast}} + 0.5$

### 39. Edge Enhancement (Unsharp Mask)

**Formula**: $\text{color}' = \text{color} + \alpha(\text{color} - \text{blur}(\text{color}))$

**Visual**: Sharpens fractal edges.

### 40. Ambient Occlusion (2D)

**Formula**: Darken based on surrounding iteration values.

**Visual**: Fake 3D depth effect.

### 41. Fog/Atmospheric

**Formula**: Blend toward fog color based on distance from center.

**Visual**: Depth cue, fades distant details.

### 42. Bloom/Glow

**Formula**: Add blurred highlight to bright areas.

**Visual**: Glowing effect around bright regions.

---

## Color Mapping

### 43. Linear Palette

**Formula**: $\text{RGB} = \text{palette}[\lfloor\text{value} \cdot \text{length}\rfloor]$

**Visual**: Direct mapping, may show discontinuities.

### 44. Smooth Palette (Linear Interpolation)

**Formula**: Interpolate between palette entries.

**Visual**: Smooth color transitions.

### 45. Cubic Interpolation (Catmull-Rom)

**Formula**: Use Catmull-Rom spline through palette points.

**Visual**: Very smooth, no corner artifacts.

### 46. HSV Interpolation

**Formula**: Interpolate in HSV space, convert to RGB.

**Visual**: More natural color transitions for rainbow palettes.

### 47. LAB Interpolation

**Formula**: Interpolate in perceptually uniform LAB space.

**Visual**: Perceptually smooth transitions, best for accuracy.

### 48. Palette Cycling

**Formula**: $\text{index}' = (\text{index} + \text{time} \cdot \text{speed}) \mod \text{length}$

**Visual**: Animated color flow through the image.

### 49. Multi-Palette

**Formula**: Different palettes for different iteration ranges.

**Visual**: Highlight specific depth ranges.

### 50. Procedural Palette

**Formula**: Generate colors mathematically:
$$R = \sin(a \cdot t + \phi_R)$$
$$G = \sin(b \cdot t + \phi_G)$$
$$B = \sin(c \cdot t + \phi_B)$$

**Visual**: Infinite variety of smooth palettes.

---

## Algorithm Gallery

### Visual Comparison

| Algorithm | Best For | Performance | Complexity |
|-----------|----------|-------------|------------|
| Smooth Iteration | General use | Fast | Low |
| Triangle Inequality | Detail/texture | Medium | Medium |
| Stripe Average | Angular patterns | Medium | Low |
| Distance Estimation | Anti-aliasing | Slow | High |
| Histogram | Maximum contrast | Two-pass | Medium |
| Orbit Traps | Artistic effects | Medium | Low |
| Curvature | Dynamic regions | Slow | High |

### Recommended Combinations

**For Beginners**:
- Smooth Iteration + Smooth Palette

**For Detail**:
- Smooth + Triangle Inequality (50/50 blend)

**For Art**:
- Orbit Traps + Custom Palette + Post-processing

**For Mathematics**:
- Distance Estimation + Period Coloring (interior)

**For Animation**:
- Smooth Iteration + Palette Cycling

---

## Implementation Tips

### Performance Optimization

1. **Precompute** palette lookups
2. **Cache** expensive operations (log, sqrt)
3. **SIMD** for orbit analysis
4. **GPU** for post-processing

### Quality Tips

1. **Supersample** for smooth results
2. **Use large bailout** for accurate smooth iteration
3. **Combine methods** for rich detail
4. **Test at multiple zooms** to ensure consistency

### Debugging

```javascript
// Visualize raw values before palette mapping
function debugColor(value) {
    return {
        r: value * 255,
        g: value * 255,
        b: value * 255
    };
}
```

---

## References

1. **Peitgen, H.-O. et al.** (1986). *The Beauty of Fractals*. Springer.

2. **Linas Vepstas** (1997). "Renormalizing the Mandelbrot Escape". linas.org.

3. **Pickover, C.A.** (1990). *Computers, Pattern, Chaos, and Beauty*. St. Martin's Press.

4. **Munafo, R.** "Mu-Ency: Coloring Methods". mrob.com.

5. **Fractint** documentation. Classic coloring algorithm reference.

6. **Ultra Fractal** formula database. Modern algorithm collection.

---

*This document is part of the Abyss Explorer project. For implementation, see `js/coloring/` directory.*
