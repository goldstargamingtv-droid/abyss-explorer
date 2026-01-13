# GLSL Shader Reference

> *"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes."*
> — Marcel Proust

This document provides a complete reference for the GLSL shaders used in Abyss Explorer's 3D fractal rendering system. It covers distance estimators, lighting models, and post-processing effects.

## Table of Contents

1. [Shader Architecture](#shader-architecture)
2. [Distance Estimators](#distance-estimators)
3. [Ray Marching](#ray-marching)
4. [Lighting Models](#lighting-models)
5. [Ambient Occlusion](#ambient-occlusion)
6. [Shadow Techniques](#shadow-techniques)
7. [Post-Processing](#post-processing)
8. [Uniform Reference](#uniform-reference)
9. [Mathematical Notes](#mathematical-notes)
10. [Performance Tips](#performance-tips)
11. [References & Credits](#references--credits)

---

## Shader Architecture

### Overview

Abyss Explorer uses a multi-pass rendering pipeline:

```
Pass 1: Ray March → Distance + Normal + Iteration
Pass 2: Lighting → Color + Shadows + AO
Pass 3: Post-Process → Final Image
```

### Vertex Shader (Common)

```glsl
#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
```

### Fragment Shader Structure

```glsl
#version 300 es
precision highp float;

// Uniforms
uniform vec3 u_cameraPos;
uniform vec3 u_cameraTarget;
uniform float u_fov;
uniform float u_time;
uniform vec2 u_resolution;

// Varyings
in vec2 v_uv;
out vec4 fragColor;

// Distance estimator (varies by fractal)
float DE(vec3 p);

// Main ray marcher
void main() {
    vec3 ro = u_cameraPos;
    vec3 rd = calculateRayDirection(v_uv);
    
    float t = rayMarch(ro, rd);
    
    if (t < MAX_DIST) {
        vec3 p = ro + rd * t;
        vec3 n = calcNormal(p);
        vec3 col = shade(p, n, rd);
        fragColor = vec4(col, 1.0);
    } else {
        fragColor = vec4(backgroundColor, 1.0);
    }
}
```

---

## Distance Estimators

### Mandelbulb

The Mandelbulb is a 3D analog of the Mandelbrot set using spherical coordinates.

**Mathematical Definition**:

For a point $(x, y, z)$ with spherical coordinates $(r, \theta, \phi)$:

$$r = \sqrt{x^2 + y^2 + z^2}$$
$$\theta = \arctan(y/x)$$  
$$\phi = \arccos(z/r)$$

The iteration is:
$$(x', y', z') = r^n(\sin(n\phi)\cos(n\theta), \sin(n\phi)\sin(n\theta), \cos(n\phi)) + (x_0, y_0, z_0)$$

**GLSL Implementation**:

```glsl
uniform float u_power;       // Typically 8
uniform int u_maxIterations; // 10-20 for realtime
uniform float u_bailout;     // 2.0

float DE_Mandelbulb(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    
    for (int i = 0; i < u_maxIterations; i++) {
        r = length(z);
        if (r > u_bailout) break;
        
        // Convert to spherical coordinates
        float theta = acos(z.z / r);
        float phi = atan(z.y, z.x);
        
        // Scale derivative
        dr = pow(r, u_power - 1.0) * u_power * dr + 1.0;
        
        // Calculate new position
        float zr = pow(r, u_power);
        theta = theta * u_power;
        phi = phi * u_power;
        
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(theta) * sin(phi),
            cos(theta)
        );
        z += pos;
    }
    
    return 0.5 * log(r) * r / dr;
}
```

**Uniforms**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `u_power` | float | 8.0 | Bulb power exponent |
| `u_maxIterations` | int | 15 | Iteration limit |
| `u_bailout` | float | 2.0 | Escape radius |

**Visual Notes**: Power 8 gives the classic "bulb" shape. Lower powers create smoother forms; higher powers add more detail and "horns".

---

### Mandelbox

The Mandelbox is a box-folding fractal discovered by Tom Lowe (2010).

**Algorithm**:
1. **Box fold**: Reflect each component into [-1, 1]
2. **Sphere fold**: If $r < r_{min}$, scale by $(r_{fixed}/r_{min})^2$; if $r < r_{fixed}$, scale by $(r_{fixed}/r)^2$
3. **Scale and translate**: $z = s \cdot z + c$

**GLSL Implementation**:

```glsl
uniform float u_scale;       // -1.5 to 3.0 (classic: 2.0 or -1.5)
uniform float u_foldingLimit; // Box folding limit (1.0)
uniform float u_minRadius;   // 0.5
uniform float u_fixedRadius; // 1.0

void boxFold(inout vec3 z) {
    z = clamp(z, -u_foldingLimit, u_foldingLimit) * 2.0 - z;
}

void sphereFold(inout vec3 z, inout float dz) {
    float r2 = dot(z, z);
    float mr2 = u_minRadius * u_minRadius;
    float fr2 = u_fixedRadius * u_fixedRadius;
    
    if (r2 < mr2) {
        float temp = fr2 / mr2;
        z *= temp;
        dz *= temp;
    } else if (r2 < fr2) {
        float temp = fr2 / r2;
        z *= temp;
        dz *= temp;
    }
}

float DE_Mandelbox(vec3 pos) {
    vec3 z = pos;
    float dz = 1.0;
    
    for (int i = 0; i < u_maxIterations; i++) {
        boxFold(z);
        sphereFold(z, dz);
        
        z = u_scale * z + pos;
        dz = abs(u_scale) * dz + 1.0;
    }
    
    return length(z) / dz;
}
```

**Uniforms**:
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `u_scale` | float | -1.5 | Main scale factor |
| `u_foldingLimit` | float | 1.0 | Box fold boundary |
| `u_minRadius` | float | 0.5 | Inner sphere radius |
| `u_fixedRadius` | float | 1.0 | Outer sphere radius |

**Visual Notes**: Scale = -1.5 creates the "classic" spiky Mandelbox. Scale = 2.0 creates a more solid, boxy appearance.

---

### Menger Sponge

The Menger sponge is a self-similar 3D fractal with Hausdorff dimension ≈ 2.727.

**GLSL Implementation**:

```glsl
uniform int u_iterations;  // 4-6 for good detail

float DE_Menger(vec3 p) {
    float d = sdBox(p, vec3(1.0));
    float s = 1.0;
    
    for (int i = 0; i < u_iterations; i++) {
        // Fold into positive octant and center
        vec3 a = mod(p * s, 2.0) - 1.0;
        s *= 3.0;
        
        // Create cross-shaped hole pattern
        vec3 r = abs(1.0 - 3.0 * abs(a));
        
        float da = max(r.x, r.y);
        float db = max(r.y, r.z);
        float dc = max(r.z, r.x);
        float c = (min(da, min(db, dc)) - 1.0) / s;
        
        d = max(d, c);
    }
    
    return d;
}

// Helper: Signed distance to box
float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}
```

---

### Sierpinski Tetrahedron

**GLSL Implementation**:

```glsl
uniform int u_iterations;
uniform float u_scale;  // 2.0

float DE_Sierpinski(vec3 z) {
    // Vertices of tetrahedron
    vec3 a1 = vec3( 1.0,  1.0,  1.0);
    vec3 a2 = vec3(-1.0, -1.0,  1.0);
    vec3 a3 = vec3( 1.0, -1.0, -1.0);
    vec3 a4 = vec3(-1.0,  1.0, -1.0);
    
    vec3 c;
    int n = 0;
    float dist, d;
    
    for (int i = 0; i < u_iterations; i++) {
        c = a1; dist = length(z - a1);
        
        d = length(z - a2); if (d < dist) { c = a2; dist = d; }
        d = length(z - a3); if (d < dist) { c = a3; dist = d; }
        d = length(z - a4); if (d < dist) { c = a4; dist = d; }
        
        z = u_scale * z - c * (u_scale - 1.0);
        n++;
    }
    
    return length(z) * pow(u_scale, float(-n));
}
```

---

### Julia Quaternion

4D Julia set projected into 3D via quaternion mathematics.

**GLSL Implementation**:

```glsl
uniform vec4 u_juliaC;  // The c parameter in 4D

// Quaternion multiplication
vec4 qMul(vec4 a, vec4 b) {
    return vec4(
        a.x*b.x - a.y*b.y - a.z*b.z - a.w*b.w,
        a.x*b.y + a.y*b.x + a.z*b.w - a.w*b.z,
        a.x*b.z - a.y*b.w + a.z*b.x + a.w*b.y,
        a.x*b.w + a.y*b.z - a.z*b.y + a.w*b.x
    );
}

// Quaternion square
vec4 qSqr(vec4 q) {
    return vec4(
        q.x*q.x - q.y*q.y - q.z*q.z - q.w*q.w,
        2.0*q.x*q.y,
        2.0*q.x*q.z,
        2.0*q.x*q.w
    );
}

float DE_JuliaQuat(vec3 p) {
    vec4 z = vec4(p, 0.0);
    vec4 dz = vec4(1.0, 0.0, 0.0, 0.0);
    
    for (int i = 0; i < u_maxIterations; i++) {
        dz = 2.0 * qMul(z, dz);
        z = qSqr(z) + u_juliaC;
        
        if (dot(z, z) > u_bailout * u_bailout) break;
    }
    
    float r = length(z);
    return 0.5 * r * log(r) / length(dz);
}
```

---

### Kleinian Group Limit Sets

Based on Möbius transformations and Kleinian groups.

**GLSL Implementation**:

```glsl
uniform vec3 u_kleinParams;  // Controls group generators

float DE_Kleinian(vec3 p) {
    float k = 0.0;
    float scale = 1.0;
    
    for (int i = 0; i < u_maxIterations; i++) {
        // Sphere inversion
        float r2 = dot(p, p);
        if (r2 < 0.25) {
            p /= 0.25;
            scale /= 0.25;
        } else if (r2 < 1.0) {
            p /= r2;
            scale /= r2;
        }
        
        // Box folding with Klein parameters
        p = 2.0 * clamp(p, -u_kleinParams, u_kleinParams) - p;
        
        k = max(k, dot(p, p));
    }
    
    return (length(p) - 0.5) / scale;
}
```

---

## Ray Marching

### Sphere Tracing

The core ray marching algorithm:

```glsl
uniform float u_maxDist;     // 100.0
uniform float u_epsilon;     // 0.0001
uniform int u_maxSteps;      // 256

float rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    
    for (int i = 0; i < u_maxSteps; i++) {
        vec3 p = ro + rd * t;
        float d = DE(p);
        
        if (d < u_epsilon) return t;
        if (t > u_maxDist) break;
        
        t += d;
    }
    
    return u_maxDist;
}
```

### Adaptive Step Size

Improve performance with adaptive stepping:

```glsl
float rayMarchAdaptive(vec3 ro, vec3 rd) {
    float t = 0.0;
    float prevD = 1e10;
    
    for (int i = 0; i < u_maxSteps; i++) {
        vec3 p = ro + rd * t;
        float d = DE(p);
        
        // Reduce step near surface
        float step = d * 0.8;
        
        // Over-relaxation far from surface
        if (d > prevD) {
            step = d * 1.2;
        }
        
        if (d < u_epsilon * t) return t;
        if (t > u_maxDist) break;
        
        t += step;
        prevD = d;
    }
    
    return u_maxDist;
}
```

### Normal Calculation

```glsl
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(u_epsilon, 0.0);
    return normalize(vec3(
        DE(p + e.xyy) - DE(p - e.xyy),
        DE(p + e.yxy) - DE(p - e.yxy),
        DE(p + e.yyx) - DE(p - e.yyx)
    ));
}

// Tetrahedron technique (fewer samples)
vec3 calcNormalTet(vec3 p) {
    vec2 k = vec2(1, -1);
    return normalize(
        k.xyy * DE(p + k.xyy * u_epsilon) +
        k.yyx * DE(p + k.yyx * u_epsilon) +
        k.yxy * DE(p + k.yxy * u_epsilon) +
        k.xxx * DE(p + k.xxx * u_epsilon)
    );
}
```

---

## Lighting Models

### Phong Lighting

```glsl
uniform vec3 u_lightDir;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform float u_specularPower;

vec3 phongLighting(vec3 p, vec3 n, vec3 rd, vec3 baseColor) {
    // Diffuse
    float diff = max(dot(n, u_lightDir), 0.0);
    
    // Specular
    vec3 ref = reflect(-u_lightDir, n);
    float spec = pow(max(dot(ref, -rd), 0.0), u_specularPower);
    
    // Combine
    vec3 col = baseColor * (u_ambientColor + u_lightColor * diff);
    col += u_lightColor * spec * 0.5;
    
    return col;
}
```

### Three-Point Lighting

```glsl
uniform vec3 u_keyLight;
uniform vec3 u_fillLight;
uniform vec3 u_backLight;

vec3 threePointLighting(vec3 n, vec3 baseColor) {
    float key = max(dot(n, u_keyLight), 0.0);
    float fill = max(dot(n, u_fillLight), 0.0) * 0.4;
    float back = max(dot(n, u_backLight), 0.0) * 0.2;
    
    return baseColor * (0.1 + key + fill + back);
}
```

### Fresnel Effect

```glsl
vec3 fresnel(vec3 n, vec3 rd, vec3 baseColor) {
    float fres = pow(1.0 - abs(dot(n, rd)), 3.0);
    return mix(baseColor, vec3(1.0), fres * 0.3);
}
```

---

## Ambient Occlusion

### Basic AO

```glsl
uniform float u_aoStrength;  // 0.5
uniform float u_aoRadius;    // 0.5

float calcAO(vec3 p, vec3 n) {
    float ao = 0.0;
    float scale = 1.0;
    
    for (int i = 1; i <= 5; i++) {
        float dist = u_aoRadius * float(i) / 5.0;
        float d = DE(p + n * dist);
        ao += (dist - d) * scale;
        scale *= 0.5;
    }
    
    return clamp(1.0 - u_aoStrength * ao, 0.0, 1.0);
}
```

### Fast AO (Single Sample)

```glsl
float fastAO(vec3 p, vec3 n) {
    float d = DE(p + n * u_aoRadius);
    return clamp(d / u_aoRadius, 0.0, 1.0);
}
```

---

## Shadow Techniques

### Soft Shadows

```glsl
uniform float u_shadowSharpness;  // 8.0

float softShadow(vec3 ro, vec3 rd, float mint, float maxt) {
    float res = 1.0;
    float t = mint;
    
    for (int i = 0; i < 64; i++) {
        float d = DE(ro + rd * t);
        
        if (d < 0.001) return 0.0;
        
        res = min(res, u_shadowSharpness * d / t);
        t += d;
        
        if (t > maxt) break;
    }
    
    return clamp(res, 0.0, 1.0);
}
```

---

## Post-Processing

### Fog

```glsl
vec3 applyFog(vec3 col, float dist, vec3 fogColor) {
    float fog = 1.0 - exp(-dist * 0.01);
    return mix(col, fogColor, fog);
}
```

### Glow

```glsl
vec3 applyGlow(vec3 col, float minDist, vec3 glowColor) {
    float glow = exp(-minDist * 10.0);
    return col + glowColor * glow * 0.5;
}
```

### Tone Mapping (ACES)

```glsl
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}
```

### Gamma Correction

```glsl
vec3 gammaCorrect(vec3 col) {
    return pow(col, vec3(1.0/2.2));
}
```

---

## Uniform Reference

### Complete Uniform List

| Category | Name | Type | Description |
|----------|------|------|-------------|
| **Camera** | `u_cameraPos` | vec3 | Camera position |
| | `u_cameraTarget` | vec3 | Look-at target |
| | `u_fov` | float | Field of view (radians) |
| | `u_near` | float | Near clip plane |
| | `u_far` | float | Far clip plane |
| **Fractal** | `u_power` | float | Bulb power |
| | `u_scale` | float | Mandelbox scale |
| | `u_maxIterations` | int | Max fractal iterations |
| | `u_bailout` | float | Escape radius |
| | `u_juliaC` | vec4 | Julia c parameter |
| **Raymarch** | `u_maxSteps` | int | Max ray steps |
| | `u_maxDist` | float | Max ray distance |
| | `u_epsilon` | float | Surface threshold |
| **Lighting** | `u_lightDir` | vec3 | Light direction |
| | `u_lightColor` | vec3 | Light color |
| | `u_ambientColor` | vec3 | Ambient color |
| | `u_specularPower` | float | Specular exponent |
| **AO** | `u_aoStrength` | float | AO intensity |
| | `u_aoRadius` | float | AO sample radius |
| **Shadow** | `u_shadowSharpness` | float | Shadow softness |
| **Color** | `u_baseColor` | vec3 | Base surface color |
| | `u_glowColor` | vec3 | Glow effect color |
| | `u_fogColor` | vec3 | Distance fog color |
| **Time** | `u_time` | float | Animation time |
| **Display** | `u_resolution` | vec2 | Viewport size |

---

## Mathematical Notes

### Distance Estimator Theory

The distance estimator for polynomial iteration:

$$d(p) = \frac{|z_n| \log|z_n|}{|z'_n|}$$

where $z'_n$ is the derivative computed via:

$$z'_{n+1} = p \cdot z_n^{p-1} \cdot z'_n + 1$$

### Why 0.5× Factor?

The theoretical DE gives the exact distance. In practice, we multiply by 0.5 (or less) because:
1. Numerical errors accumulate
2. Ray overshooting causes artifacts
3. Conservative stepping improves stability

### Lipschitz Continuity

A valid DE must satisfy:
$$|DE(a) - DE(b)| \leq |a - b|$$

This ensures rays don't "jump through" thin structures.

---

## Performance Tips

1. **Reduce iterations** for preview/navigation
2. **Use LOD** based on screen distance
3. **Early termination** in loops when possible
4. **Compute-heavy** operations outside loops
5. **Texture lookups** for precomputed values
6. **Lower precision** where acceptable (`mediump`)

---

## References & Credits

### Primary Sources

- **Inigo Quilez** - Distance functions, ray marching techniques
  - [iquilezles.org/articles/](https://iquilezles.org/articles/)
  
- **Syntopia** (Mikael Hvidtfeldt Christensen) - Fragmentarium, DE formulas
  - [blog.hvidtfeldts.net](http://blog.hvidtfeldts.net/)
  
- **Knighty** - Mandelbox, Kleinian formulas
  - Fractal Forums contributions

### Additional References

- **Tom Lowe** - Original Mandelbox discovery (2010)
- **Paul Nylander** - Mandelbulb popularization
- **Daniel White & Paul Nylander** - Mandelbulb formula refinement
- **Hart, Sandin, Kauffman** - "Ray Tracing Deterministic 3-D Fractals" (1989)

### Fractal Forums

Community resource for fractal mathematics and shader techniques:
- [fractalforums.org](https://fractalforums.org/)

---

*This document is part of the Abyss Explorer project. For implementation, see `js/shaders/` directory.*
