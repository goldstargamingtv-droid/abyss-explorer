/**
 * ============================================================================
 * ABYSS EXPLORER - MENGER SPONGE SHADER
 * ============================================================================
 * 
 * GLSL shader for the Menger Sponge and related IFS fractals.
 * The Menger Sponge is a 3D fractal constructed by repeatedly removing
 * cubic sections, resulting in infinite surface area and zero volume.
 * 
 * Construction:
 * 1. Start with a cube
 * 2. Divide into 27 smaller cubes (3×3×3 grid)
 * 3. Remove the center cube and 6 face-center cubes (7 total)
 * 4. Repeat for each remaining cube
 * 
 * The fractal dimension is log(20)/log(3) ≈ 2.727
 * 
 * Distance Estimation:
 * The DE is computed using the IFS folding technique:
 * - Fold into fundamental domain using abs() and modulo
 * - Track scale factor through iterations
 * - DE = (distance to unit cube) / scale
 * 
 * References:
 * - Karl Menger (1926) - Original description
 * - Knighty (fractalforums.com) - IFS distance estimation
 * - Inigo Quilez - https://iquilezles.org/articles/menger/
 * 
 * @module shaders/menger.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// MENGER UNIFORMS
// ============================================================================

export const MENGER_UNIFORMS = /* glsl */`
// Menger Sponge specific uniforms
uniform int uMengerIterations;      // Iteration depth (3-6 typical)
uniform float uMengerScale;         // Scale factor per iteration (3.0 for classic)
uniform vec3 uMengerOffset;         // Offset for variations
uniform int uMengerVariant;         // 0=classic, 1=jerusalem, 2=cross, 3=custom
uniform float uMengerCrossSize;     // Size of cross cutout (classic = 1/3)
uniform bool uMengerSmooth;         // Smooth vs sharp edges
uniform float uMengerSmoothness;    // Smoothness factor

// Animation
uniform float uMengerRotation;      // Per-iteration rotation angle
uniform vec3 uMengerRotAxis;        // Rotation axis

// Coloring
uniform int uMengerColorMode;       // 0=iteration, 1=position, 2=normal
`;

// ============================================================================
// MENGER SPONGE DISTANCE ESTIMATOR
// ============================================================================

export const MENGER_DE = /* glsl */`
/**
 * ============================================================================
 * MENGER SPONGE DISTANCE ESTIMATOR
 * ============================================================================
 * 
 * The Menger Sponge DE uses folding to place all points in the 
 * fundamental domain of the IFS.
 * 
 * Classic Menger construction:
 * - Scale: 3
 * - Remove: center cube + 6 face-center cubes
 * 
 * The DE is computed by:
 * 1. Scale point into [0, 3] range
 * 2. Fold into [0, 1] cube (fundamental domain)
 * 3. Check if point is in removed region
 * 4. Return distance to cross-shaped removed region
 */

${MENGER_UNIFORMS}

/**
 * Signed distance to a box
 */
float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

/**
 * Signed distance to infinite cross
 */
float sdCross(vec3 p, float size) {
    // Cross is union of 3 infinite beams
    float d1 = max(abs(p.x), abs(p.y)); // Z-aligned beam
    float d2 = max(abs(p.y), abs(p.z)); // X-aligned beam
    float d3 = max(abs(p.z), abs(p.x)); // Y-aligned beam
    
    return min(min(d1, d2), d3) - size;
}

/**
 * Smooth minimum for blending
 */
float sminPoly(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

/**
 * Classic Menger Sponge DE
 * Uses iterative folding and scaling
 */
vec4 mengerClassic(vec3 pos, int iterations) {
    vec3 z = pos;
    float scale = 1.0;
    
    // Track for coloring
    float trap = 1e10;
    float iterColor = 0.0;
    
    // Fold into positive octant
    z = abs(z);
    
    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;
        
        // Scale to [0, 3] range, centered
        z = z * 3.0 - 1.0;
        scale *= 3.0;
        
        // Fold back into [0, 1] using abs
        z = abs(z);
        
        // Sort components (puts largest in x)
        if (z.x < z.y) z.xy = z.yx;
        if (z.y < z.z) z.yz = z.zy;
        if (z.x < z.y) z.xy = z.yx;
        
        // Track trap
        float d = length(z);
        if (d < trap) trap = d;
        
        iterColor += 1.0;
    }
    
    // Final fold back to [0, 1]
    z = abs(z - 1.0);
    
    // Distance to unit cube minus cross
    // The removed cross has size 1/3 of the unit cube
    float crossSize = uMengerCrossSize > 0.0 ? uMengerCrossSize : 1.0 / 3.0;
    
    // Distance to box
    float boxDist = sdBox(z - 0.5, vec3(0.5));
    
    // Distance to cross (removed region)
    float crossDist = sdCross(z - 0.5, crossSize * 0.5);
    
    // The Menger surface is the box minus the cross
    // We want distance to: box AND NOT cross
    float de = max(boxDist, -crossDist) / scale;
    
    return vec4(de, iterColor / float(iterations), trap, length(z));
}

/**
 * Alternative Menger using direct cross distance
 * More accurate for the classic shape
 */
vec4 mengerDirect(vec3 pos, int iterations) {
    vec3 p = pos;
    float s = 1.0;
    
    float trap = 1e10;
    
    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;
        
        // Track orbit
        float d = length(p);
        if (d < trap) trap = d;
        
        // Fold into fundamental domain
        p = abs(p);
        if (p.x < p.y) p.xy = p.yx;
        if (p.y < p.z) p.yz = p.zy;
        if (p.x < p.y) p.xy = p.yx;
        
        // Scale
        p = p * 3.0 - 2.0;
        s *= 3.0;
        
        // Conditional fold (only fold back if outside unit cube)
        p.x = max(p.x, -1.0);
        p.y = max(p.y, -1.0);
    }
    
    // Distance to cross in local space
    float de = sdCross(p, 1.0) / s;
    
    return vec4(de, float(iterations), trap, length(p));
}

/**
 * Jerusalem Cube variant
 * Uses plus-sign cutout instead of cross
 */
vec4 jerusalemCube(vec3 pos, int iterations) {
    vec3 z = pos;
    float scale = 1.0;
    float trap = 1e10;
    
    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;
        
        z = abs(z);
        if (z.x < z.y) z.xy = z.yx;
        if (z.y < z.z) z.yz = z.zy;
        if (z.x < z.y) z.xy = z.yx;
        
        float d = length(z);
        if (d < trap) trap = d;
        
        z = z * 3.0 - 2.0;
        scale *= 3.0;
        
        // Jerusalem cube has different fold
        if (z.z < -1.0) z.z += 2.0;
    }
    
    float de = (length(z) - 1.0) / scale;
    
    return vec4(de, float(iterations), trap, length(z));
}

/**
 * Smooth Menger Sponge
 * Uses smooth min/max for organic look
 */
vec4 mengerSmooth(vec3 pos, int iterations, float smoothness) {
    vec3 z = pos;
    float scale = 1.0;
    float trap = 1e10;
    
    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;
        
        // Smooth abs
        z = sqrt(z * z + smoothness);
        
        // Soft sort (approximate)
        vec3 sorted = z;
        float m = max(max(z.x, z.y), z.z);
        if (m == z.x) sorted = z.xyz;
        else if (m == z.y) sorted = z.yxz;
        else sorted = z.zxy;
        z = sorted;
        
        float d = length(z);
        if (d < trap) trap = d;
        
        z = z * 3.0 - 2.0;
        scale *= 3.0;
        
        // Soft clamp
        z = max(z, vec3(-1.0) + smoothness);
    }
    
    float de = sdCross(z, 1.0) / scale;
    
    return vec4(de, float(iterations), trap, length(z));
}

/**
 * Rotating Menger
 * Applies rotation between iterations for twisted effect
 */
mat3 rotationMat(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(
        oc * axis.x * axis.x + c,        oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c,        oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
    );
}

vec4 mengerRotating(vec3 pos, int iterations, float rotAngle, vec3 rotAxis) {
    vec3 z = pos;
    float scale = 1.0;
    float trap = 1e10;
    
    mat3 rot = rotationMat(rotAxis, rotAngle);
    
    for (int i = 0; i < 20; i++) {
        if (i >= iterations) break;
        
        // Apply rotation
        z = rot * z;
        
        z = abs(z);
        if (z.x < z.y) z.xy = z.yx;
        if (z.y < z.z) z.yz = z.zy;
        if (z.x < z.y) z.xy = z.yx;
        
        float d = length(z);
        if (d < trap) trap = d;
        
        z = z * 3.0 - 2.0;
        scale *= 3.0;
    }
    
    float de = sdCross(z, 1.0) / scale;
    
    return vec4(de, float(iterations), trap, length(z));
}

/**
 * Main distance estimator function
 */
vec4 map(vec3 pos) {
    if (uMengerVariant == 1) {
        return jerusalemCube(pos, uMengerIterations);
    } else if (uMengerSmooth) {
        return mengerSmooth(pos, uMengerIterations, uMengerSmoothness);
    } else if (uMengerRotation != 0.0) {
        return mengerRotating(pos, uMengerIterations, uMengerRotation, uMengerRotAxis);
    } else {
        return mengerDirect(pos, uMengerIterations);
    }
}
`;

// ============================================================================
// COMPLETE SHADER
// ============================================================================

export const MENGER_FRAGMENT = /* glsl */`
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

// Menger uniforms
uniform int uMengerIterations;
uniform float uMengerScale;
uniform vec3 uMengerOffset;
uniform int uMengerVariant;
uniform float uMengerCrossSize;
uniform bool uMengerSmooth;
uniform float uMengerSmoothness;
uniform float uMengerRotation;
uniform vec3 uMengerRotAxis;
uniform int uMengerColorMode;

// Lighting
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;
uniform bool uShadowsEnabled;
uniform int uQuality;

${MENGER_DE}

vec3 getRayDir(vec2 uv, vec3 ro, vec3 ta) {
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = normalize(cross(uu, ww));
    float fovScale = tan(uFov * 0.5);
    return normalize(uv.x * uu * fovScale * uAspect + uv.y * vv * fovScale + ww);
}

vec4 rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    
    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * t;
        vec4 res = map(p);
        
        if (res.x < MIN_DIST * t) {
            return vec4(t, res.y, res.z, res.w);
        }
        
        if (t > MAX_DIST) break;
        
        t += res.x * 0.9;
    }
    
    return vec4(-1.0);
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.0001, 0.0);
    return normalize(vec3(
        map(p + e.xyy).x - map(p - e.xyy).x,
        map(p + e.yxy).x - map(p - e.yxy).x,
        map(p + e.yyx).x - map(p - e.yyx).x
    ));
}

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

vec3 palette(float t) {
    return vec3(0.6 + 0.4 * cos(6.28 * (t + 0.0)),
                0.6 + 0.4 * cos(6.28 * (t + 0.33)),
                0.6 + 0.4 * cos(6.28 * (t + 0.67)));
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
        
        // Color based on mode
        vec3 baseCol;
        if (uMengerColorMode == 1) {
            // Position-based coloring
            baseCol = 0.5 + 0.5 * nor;
        } else if (uMengerColorMode == 2) {
            // Normal-based coloring
            baseCol = palette(res.z * 0.5);
        } else {
            // Iteration-based coloring
            baseCol = palette(res.y);
        }
        
        vec3 lightDir = normalize(uLightDir);
        float diff = max(dot(nor, lightDir), 0.0);
        
        vec3 halfDir = normalize(lightDir - rd);
        float spec = pow(max(dot(nor, halfDir), 0.0), uShininess);
        
        float shadow = uShadowsEnabled ? calcShadow(pos + nor * 0.002, lightDir) : 1.0;
        float ao = calcAO(pos, nor);
        
        col = baseCol * (uAmbient + diff * uDiffuse * shadow) * ao;
        col += uSpecular * spec * shadow * uLightColor;
        
        float fog = exp(-res.x * 0.08);
        col = mix(vec3(0.03, 0.03, 0.05), col, fog);
    } else {
        col = vec3(0.02, 0.02, 0.05);
    }
    
    col = pow(col, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(col, 1.0);
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create Menger Sponge shader uniforms
 */
export function createMengerUniforms(options = {}) {
    return {
        // Camera
        uCameraPos: { value: options.cameraPos || [2.5, 2, 2.5] },
        uCameraTarget: { value: options.cameraTarget || [0, 0, 0] },
        uFov: { value: options.fov || Math.PI / 3 },
        uAspect: { value: options.aspect || 1 },
        uTime: { value: 0 },
        uResolution: { value: options.resolution || [1920, 1080] },
        
        // Menger specific
        uMengerIterations: { value: options.iterations || 4 },
        uMengerScale: { value: options.scale || 3.0 },
        uMengerOffset: { value: options.offset || [0, 0, 0] },
        uMengerVariant: { value: options.variant || 0 },
        uMengerCrossSize: { value: options.crossSize || 1/3 },
        uMengerSmooth: { value: options.smooth || false },
        uMengerSmoothness: { value: options.smoothness || 0.01 },
        uMengerRotation: { value: options.rotation || 0 },
        uMengerRotAxis: { value: options.rotAxis || [0, 1, 0] },
        uMengerColorMode: { value: options.colorMode || 0 },
        
        // Lighting
        uLightDir: { value: options.lightDir || [1, 1, 1] },
        uLightColor: { value: options.lightColor || [1, 1, 1] },
        uAmbient: { value: options.ambient || 0.25 },
        uDiffuse: { value: options.diffuse || 0.75 },
        uSpecular: { value: options.specular || 0.4 },
        uShininess: { value: options.shininess || 32 },
        uShadowsEnabled: { value: options.shadows !== false },
        uQuality: { value: options.quality || 1 }
    };
}

/**
 * Get Menger Sponge shader source
 */
export function getMengerShader() {
    return {
        vertex: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: MENGER_FRAGMENT
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: MENGER_UNIFORMS,
    distanceEstimator: MENGER_DE,
    fragment: MENGER_FRAGMENT,
    createUniforms: createMengerUniforms,
    getShader: getMengerShader
};
