/**
 * ============================================================================
 * ABYSS EXPLORER - MANDELBULB SHADER
 * ============================================================================
 * 
 * GLSL distance estimator for the Mandelbulb fractal.
 * Supports powers 2-20+, Julia mode, and hybrid variations.
 * 
 * The Mandelbulb Formula:
 * The Mandelbulb uses a spherical coordinate transformation where:
 *   r = |z|
 *   θ = arccos(z_y / r)
 *   φ = atan2(z_z, z_x)
 *   
 * Then: z' = r^n * (sin(n*θ)*cos(n*φ), cos(n*θ), sin(n*θ)*sin(n*φ)) + c
 * 
 * Distance Estimator:
 * DE ≈ 0.5 * r * ln(r) / dr
 * where dr is the running derivative magnitude
 * 
 * References:
 * - Daniel White & Paul Nylander (2009) - Original Mandelbulb discovery
 * - Inigo Quilez - https://iquilezles.org/articles/mandelbulb/
 * - Syntopia (Mikael Christensen) - Distance estimation techniques
 * 
 * @module shaders/mandelbulb.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// MANDELBULB UNIFORMS
// ============================================================================

export const MANDELBULB_UNIFORMS = /* glsl */`
// Mandelbulb specific uniforms
uniform float uBulbPower;           // Power (default 8)
uniform int uBulbIterations;        // Max iterations (default 10)
uniform float uBulbBailout;         // Bailout radius (default 2)
uniform bool uBulbJuliaMode;        // Julia mode toggle
uniform vec3 uBulbJuliaC;           // Julia constant (when in Julia mode)
uniform float uBulbPhase;           // Animation phase
uniform bool uBulbAnalyticDE;       // Use analytic vs logarithmic DE
uniform int uBulbColorMode;         // Coloring mode (0=iteration, 1=orbit, 2=normal)

// Hybrid parameters
uniform bool uBulbHybrid;           // Enable hybrid mode
uniform float uBulbHybridPower2;    // Second power for hybrid
uniform int uBulbHybridSwitch;      // Iteration to switch powers
`;

// ============================================================================
// MANDELBULB DISTANCE ESTIMATOR - STANDARD POWER 8
// ============================================================================

export const MANDELBULB_DE = /* glsl */`
/**
 * ============================================================================
 * MANDELBULB DISTANCE ESTIMATOR
 * ============================================================================
 * 
 * The classic Mandelbulb formula using triplex algebra in spherical coordinates.
 * This implementation is optimized for power 8 (the "true" Mandelbulb).
 * 
 * Mathematical derivation:
 * 
 * Given a point z = (x, y, z), convert to spherical:
 *   r = sqrt(x² + y² + z²)
 *   θ = arccos(y/r)        [polar angle from y-axis]
 *   φ = atan2(z, x)        [azimuthal angle in xz-plane]
 * 
 * Apply the power transformation:
 *   r' = r^n
 *   θ' = n*θ
 *   φ' = n*φ
 * 
 * Convert back to Cartesian:
 *   x' = r' * sin(θ') * cos(φ')
 *   y' = r' * cos(θ')
 *   z' = r' * sin(θ') * sin(φ')
 * 
 * Then add c (the original point in Mandelbrot mode, or a constant in Julia mode).
 * 
 * Distance estimation using logarithmic derivative:
 *   DE ≈ 0.5 * r * log(r) / |dr/dc|
 * 
 * where |dr/dc| is tracked by multiplying by n*r^(n-1) each iteration.
 */

${MANDELBULB_UNIFORMS}

/**
 * Core Mandelbulb iteration with power parameter
 */
vec4 mandelbulbIterate(vec3 pos, float power, int maxIter, float bailout) {
    vec3 z = pos;
    vec3 c = uBulbJuliaMode ? uBulbJuliaC : pos;
    
    float dr = 1.0;  // Running derivative
    float r = length(z);
    
    // Orbit trap values
    float minDist = 1e10;
    float avgDist = 0.0;
    vec3 trapped = vec3(0.0);
    
    int iterations = 0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= maxIter) break;
        
        r = length(z);
        
        // Bailout check
        if (r > bailout) break;
        
        // Track orbit traps
        float d = length(z);
        if (d < minDist) {
            minDist = d;
            trapped = z;
        }
        avgDist += d;
        
        // Convert to spherical coordinates
        // Note: We use y as the "up" axis
        float theta = acos(clamp(z.y / r, -1.0, 1.0));
        float phi = atan(z.z, z.x);
        
        // Update derivative magnitude
        // dr' = n * r^(n-1) * dr + 1
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        
        // Apply power in spherical coordinates
        float rPow = pow(r, power);
        float newTheta = theta * power;
        float newPhi = phi * power;
        
        // Convert back to Cartesian
        float sinTheta = sin(newTheta);
        z = rPow * vec3(
            sinTheta * cos(newPhi),
            cos(newTheta),
            sinTheta * sin(newPhi)
        );
        
        // Add c
        z += c;
        
        iterations = i + 1;
    }
    
    // Calculate distance estimate
    r = length(z);
    
    // Logarithmic distance estimate: DE = 0.5 * r * log(r) / dr
    float de = 0.5 * log(r) * r / dr;
    
    // Return (distance, iterations normalized, trap1, trap2)
    return vec4(
        de,
        float(iterations) / float(maxIter),
        minDist,
        avgDist / float(max(iterations, 1))
    );
}

/**
 * Optimized Power 8 Mandelbulb (most common)
 * Uses explicit trig identities for speed
 */
vec4 mandelbulbPower8(vec3 pos, int maxIter, float bailout) {
    vec3 z = pos;
    vec3 c = uBulbJuliaMode ? uBulbJuliaC : pos;
    
    float dr = 1.0;
    float r = 0.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= maxIter) break;
        
        r = length(z);
        if (r > bailout) break;
        
        // Track minimum distance for coloring
        if (r < minDist) minDist = r;
        
        // Optimized spherical coordinates for power 8
        float theta = acos(z.y / r);
        float phi = atan(z.z, z.x);
        
        // Power 8: r^8, 8*theta, 8*phi
        dr = 8.0 * pow(r, 7.0) * dr + 1.0;
        
        float zr = pow(r, 8.0);
        float theta8 = theta * 8.0;
        float phi8 = phi * 8.0;
        
        float sinTheta = sin(theta8);
        z = zr * vec3(
            sinTheta * cos(phi8),
            cos(theta8),
            sinTheta * sin(phi8)
        ) + c;
        
        iterations = i + 1;
    }
    
    float de = 0.5 * log(r) * r / dr;
    
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}

/**
 * Hybrid Mandelbulb - alternates between two powers
 * Creates unique organic structures
 */
vec4 mandelbulbHybrid(vec3 pos, float power1, float power2, int switchIter, int maxIter, float bailout) {
    vec3 z = pos;
    vec3 c = uBulbJuliaMode ? uBulbJuliaC : pos;
    
    float dr = 1.0;
    float r = 0.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= maxIter) break;
        
        r = length(z);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        // Choose power based on iteration
        float power = (i < switchIter) ? power1 : power2;
        
        float theta = acos(clamp(z.y / r, -1.0, 1.0));
        float phi = atan(z.z, z.x);
        
        dr = power * pow(r, power - 1.0) * dr + 1.0;
        
        float zr = pow(r, power);
        float newTheta = theta * power;
        float newPhi = phi * power;
        
        float sinTheta = sin(newTheta);
        z = zr * vec3(
            sinTheta * cos(newPhi),
            cos(newTheta),
            sinTheta * sin(newPhi)
        ) + c;
        
        iterations = i + 1;
    }
    
    float de = 0.5 * log(r) * r / dr;
    
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}

/**
 * Animated Mandelbulb with time-varying parameters
 */
vec4 mandelbulbAnimated(vec3 pos, float power, float phase, int maxIter, float bailout) {
    vec3 z = pos;
    vec3 c = uBulbJuliaMode ? uBulbJuliaC : pos;
    
    float dr = 1.0;
    float r = 0.0;
    float minDist = 1e10;
    
    // Animate power slightly
    float animPower = power + 0.5 * sin(phase);
    
    int iterations = 0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= maxIter) break;
        
        r = length(z);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        float theta = acos(clamp(z.y / r, -1.0, 1.0));
        float phi = atan(z.z, z.x);
        
        // Add animated phase offset
        phi += phase * 0.1;
        
        dr = animPower * pow(r, animPower - 1.0) * dr + 1.0;
        
        float zr = pow(r, animPower);
        float newTheta = theta * animPower;
        float newPhi = phi * animPower;
        
        float sinTheta = sin(newTheta);
        z = zr * vec3(
            sinTheta * cos(newPhi),
            cos(newTheta),
            sinTheta * sin(newPhi)
        ) + c;
        
        iterations = i + 1;
    }
    
    float de = 0.5 * log(r) * r / dr;
    
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}

/**
 * Main distance estimator function for ray marcher
 */
vec4 map(vec3 pos) {
    if (uBulbHybrid) {
        return mandelbulbHybrid(pos, uBulbPower, uBulbHybridPower2, uBulbHybridSwitch, uBulbIterations, uBulbBailout);
    } else if (uBulbPhase > 0.0) {
        return mandelbulbAnimated(pos, uBulbPower, uBulbPhase, uBulbIterations, uBulbBailout);
    } else if (abs(uBulbPower - 8.0) < 0.01) {
        // Use optimized power 8 version
        return mandelbulbPower8(pos, uBulbIterations, uBulbBailout);
    } else {
        return mandelbulbIterate(pos, uBulbPower, uBulbIterations, uBulbBailout);
    }
}
`;

// ============================================================================
// ALTERNATIVE MANDELBULB FORMULAS
// ============================================================================

/**
 * Cosine variant Mandelbulb
 * Uses different coordinate mapping
 */
export const MANDELBULB_COSINE = /* glsl */`
/**
 * Cosine Mandelbulb Variant
 * Uses: φ = atan2(z.y, z.x), θ = acos(z.z / r)
 * Creates different spiral structures
 */
vec4 mandelbulbCosine(vec3 pos, float power, int maxIter, float bailout) {
    vec3 z = pos;
    vec3 c = pos;
    
    float dr = 1.0;
    float r = 0.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= maxIter) break;
        
        r = length(z);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        // Different coordinate mapping
        float phi = atan(z.y, z.x);
        float theta = acos(clamp(z.z / r, -1.0, 1.0));
        
        dr = power * pow(r, power - 1.0) * dr + 1.0;
        
        float zr = pow(r, power);
        float newPhi = phi * power;
        float newTheta = theta * power;
        
        float sinTheta = sin(newTheta);
        z = zr * vec3(
            sinTheta * cos(newPhi),
            sinTheta * sin(newPhi),
            cos(newTheta)
        ) + c;
        
        iterations = i + 1;
    }
    
    float de = 0.5 * log(r) * r / dr;
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}
`;

/**
 * Cubic Mandelbulb variant
 */
export const MANDELBULB_CUBIC = /* glsl */`
/**
 * Cubic Mandelbulb
 * Uses explicit cubic formula without trig
 * Faster but only works for power 3
 */
vec4 mandelbulbCubic(vec3 pos, int maxIter, float bailout) {
    vec3 z = pos;
    vec3 c = pos;
    
    float dr = 1.0;
    float r = 0.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= maxIter) break;
        
        r = length(z);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        // Explicit cubic formula
        // z^3 in triplex: (x^3 - 3xy^2 - 3xz^2, 3x^2y - y^3 - 3yz^2, 3x^2z + 3y^2z - z^3)
        float x2 = z.x * z.x;
        float y2 = z.y * z.y;
        float z2 = z.z * z.z;
        
        dr = 3.0 * r * r * dr + 1.0;
        
        z = vec3(
            z.x * (x2 - 3.0 * y2 - 3.0 * z2),
            z.y * (3.0 * x2 - y2 - 3.0 * z2),
            z.z * (3.0 * x2 + 3.0 * y2 - z2)
        ) + c;
        
        iterations = i + 1;
    }
    
    float de = 0.5 * log(r) * r / dr;
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}
`;

// ============================================================================
// COMPLETE SHADER
// ============================================================================

export const MANDELBULB_FRAGMENT = /* glsl */`
precision highp float;

#define PI 3.14159265359
#define MAX_STEPS 256
#define MAX_DIST 100.0
#define MIN_DIST 0.0001

varying vec2 vUv;

// Common uniforms
uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;
uniform float uFov;
uniform float uAspect;
uniform float uTime;
uniform vec2 uResolution;

// Mandelbulb uniforms
uniform float uBulbPower;
uniform int uBulbIterations;
uniform float uBulbBailout;
uniform bool uBulbJuliaMode;
uniform vec3 uBulbJuliaC;
uniform float uBulbPhase;
uniform bool uBulbHybrid;
uniform float uBulbHybridPower2;
uniform int uBulbHybridSwitch;

// Lighting uniforms
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;
uniform bool uShadowsEnabled;

// Quality
uniform int uQuality;

${MANDELBULB_DE}

// Ray direction calculation
vec3 getRayDir(vec2 uv, vec3 ro, vec3 ta) {
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = normalize(cross(uu, ww));
    float fovScale = tan(uFov * 0.5);
    return normalize(uv.x * uu * fovScale * uAspect + uv.y * vv * fovScale + ww);
}

// Ray march
vec4 rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    float trap1 = 0.0, trap2 = 0.0;
    
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        vec4 res = map(p);
        
        if (res.x < MIN_DIST * t) {
            return vec4(t, res.y, res.z, res.w);
        }
        
        if (t > MAX_DIST) break;
        
        trap1 = res.z;
        trap2 = res.w;
        t += res.x * 0.9;
    }
    
    return vec4(-1.0, 0.0, trap1, trap2);
}

// Calculate normal
vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.0001, 0.0);
    return normalize(vec3(
        map(p + e.xyy).x - map(p - e.xyy).x,
        map(p + e.yxy).x - map(p - e.yxy).x,
        map(p + e.yyx).x - map(p - e.yyx).x
    ));
}

// Soft shadows
float calcShadow(vec3 ro, vec3 rd) {
    float res = 1.0;
    float t = 0.01;
    
    for (int i = 0; i < 64; i++) {
        float h = map(ro + rd * t).x;
        res = min(res, 16.0 * h / t);
        if (res < 0.001 || t > 10.0) break;
        t += clamp(h, 0.01, 0.2);
    }
    
    return clamp(res, 0.0, 1.0);
}

// Ambient occlusion
float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0;
    float sca = 1.0;
    
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.12 * float(i) / 4.0;
        float d = map(pos + h * nor).x;
        occ += (h - d) * sca;
        sca *= 0.95;
    }
    
    return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}

// Palette function for coloring
vec3 palette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 0.7, 0.4);
    vec3 d = vec3(0.0, 0.15, 0.2);
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    
    vec3 ro = uCameraPos;
    vec3 ta = uCameraTarget;
    vec3 rd = getRayDir(uv, ro, ta);
    
    vec4 res = rayMarch(ro, rd);
    
    vec3 col;
    
    if (res.x > 0.0) {
        vec3 pos = ro + rd * res.x;
        vec3 nor = calcNormal(pos);
        
        // Base color from iteration/trap data
        vec3 baseCol = palette(res.y * 0.5 + res.z * 0.3);
        
        // Lighting
        vec3 lightDir = normalize(uLightDir);
        float diff = max(dot(nor, lightDir), 0.0);
        
        vec3 halfDir = normalize(lightDir - rd);
        float spec = pow(max(dot(nor, halfDir), 0.0), uShininess);
        
        // Shadow
        float shadow = uShadowsEnabled ? calcShadow(pos + nor * 0.002, lightDir) : 1.0;
        
        // AO
        float ao = calcAO(pos, nor);
        
        col = baseCol * (uAmbient + diff * uDiffuse * shadow) * ao;
        col += uSpecular * spec * shadow * uLightColor;
        
        // Fog
        float fog = exp(-res.x * 0.1);
        col = mix(vec3(0.05, 0.05, 0.1), col, fog);
    } else {
        // Background with glow
        col = vec3(0.02, 0.02, 0.05);
        col += vec3(0.3, 0.1, 0.05) * pow(max(1.0 - length(uv), 0.0), 3.0);
    }
    
    // Gamma correction
    col = pow(col, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(col, 1.0);
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create Mandelbulb shader material uniforms
 * @param {Object} options - Shader options
 * @returns {Object} Three.js uniform object
 */
export function createMandelbulbUniforms(options = {}) {
    return {
        // Camera
        uCameraPos: { value: options.cameraPos || [0, 0, 3] },
        uCameraTarget: { value: options.cameraTarget || [0, 0, 0] },
        uFov: { value: options.fov || Math.PI / 3 },
        uAspect: { value: options.aspect || 1 },
        uTime: { value: 0 },
        uResolution: { value: options.resolution || [1920, 1080] },
        
        // Mandelbulb specific
        uBulbPower: { value: options.power || 8 },
        uBulbIterations: { value: options.iterations || 10 },
        uBulbBailout: { value: options.bailout || 2 },
        uBulbJuliaMode: { value: options.juliaMode || false },
        uBulbJuliaC: { value: options.juliaC || [0, 0, 0] },
        uBulbPhase: { value: options.phase || 0 },
        uBulbHybrid: { value: options.hybrid || false },
        uBulbHybridPower2: { value: options.hybridPower2 || 4 },
        uBulbHybridSwitch: { value: options.hybridSwitch || 3 },
        
        // Lighting
        uLightDir: { value: options.lightDir || [1, 1, 1] },
        uLightColor: { value: options.lightColor || [1, 1, 1] },
        uAmbient: { value: options.ambient || 0.2 },
        uDiffuse: { value: options.diffuse || 0.8 },
        uSpecular: { value: options.specular || 0.5 },
        uShininess: { value: options.shininess || 32 },
        uShadowsEnabled: { value: options.shadows !== false },
        
        // Quality
        uQuality: { value: options.quality || 1 }
    };
}

/**
 * Get complete Mandelbulb shader source
 * @returns {Object} { vertex, fragment }
 */
export function getMandelbulbShader() {
    return {
        vertex: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: MANDELBULB_FRAGMENT
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: MANDELBULB_UNIFORMS,
    distanceEstimator: MANDELBULB_DE,
    fragment: MANDELBULB_FRAGMENT,
    variants: {
        cosine: MANDELBULB_COSINE,
        cubic: MANDELBULB_CUBIC
    },
    createUniforms: createMandelbulbUniforms,
    getShader: getMandelbulbShader
};
