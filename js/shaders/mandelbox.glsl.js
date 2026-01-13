/**
 * ============================================================================
 * ABYSS EXPLORER - MANDELBOX SHADER
 * ============================================================================
 * 
 * GLSL distance estimator for the Mandelbox fractal.
 * Implements box folding, sphere folding, and various parameter variations.
 * 
 * The Mandelbox Formula:
 * The Mandelbox uses a combination of:
 * 1. Box folding: if |x| > 1, x = 2*sign(x) - x (reflects into [-1,1])
 * 2. Sphere folding: 
 *    - if r < minRadius: scale by (fixedRadius/minRadius)²
 *    - if r < fixedRadius: scale by (fixedRadius/r)²
 * 3. Scale and translate: z = scale * z + c
 * 
 * Distance Estimator:
 * DE = |z| / |dz/dc|
 * The derivative is tracked through the folds and scaling.
 * 
 * References:
 * - Tom Lowe (2010) - Original Mandelbox discovery
 * - Knighty (fractalforums.com) - Distance estimation improvements
 * - Syntopia - Box fold optimizations
 * - Inigo Quilez - https://iquilezles.org/articles/mandelbox/
 * 
 * @module shaders/mandelbox.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// MANDELBOX UNIFORMS
// ============================================================================

export const MANDELBOX_UNIFORMS = /* glsl */`
// Mandelbox specific uniforms
uniform float uBoxScale;            // Scale factor (commonly -1.5 to 3)
uniform float uBoxFoldingLimit;     // Box fold limit (default 1.0)
uniform float uBoxMinRadius;        // Minimum radius for sphere fold (default 0.5)
uniform float uBoxFixedRadius;      // Fixed radius for sphere fold (default 1.0)
uniform int uBoxIterations;         // Max iterations (default 15)
uniform bool uBoxJuliaMode;         // Julia mode toggle
uniform vec3 uBoxJuliaC;            // Julia constant
uniform float uBoxRotationAngle;    // Per-iteration rotation angle
uniform vec3 uBoxRotationAxis;      // Rotation axis
uniform int uBoxColorMode;          // Coloring mode

// Variation parameters
uniform bool uBoxSphericalFold;     // Enable sphere folding
uniform bool uBoxConditionalFold;   // Conditional vs unconditional box fold
uniform float uBoxOffsetX;          // Offset for variations
uniform float uBoxOffsetY;
uniform float uBoxOffsetZ;
`;

// ============================================================================
// MANDELBOX DISTANCE ESTIMATOR
// ============================================================================

export const MANDELBOX_DE = /* glsl */`
/**
 * ============================================================================
 * MANDELBOX DISTANCE ESTIMATOR
 * ============================================================================
 * 
 * The Mandelbox is built from two folding operations:
 * 
 * 1. BOX FOLD (per component):
 *    if x > 1: x = 2 - x
 *    if x < -1: x = -2 - x
 *    This folds space outside [-1,1] back into [-1,1]
 * 
 * 2. SPHERE FOLD:
 *    r = length(z)
 *    if r < minRadius: z *= (fixedRadius/minRadius)²
 *    else if r < fixedRadius: z *= (fixedRadius/r)²
 *    This creates a spherical inversion with two radii
 * 
 * The full iteration is:
 *    z = boxFold(z)
 *    z = sphereFold(z)
 *    z = scale * z + c
 * 
 * Distance estimation tracks the scaling factor through all operations.
 */

${MANDELBOX_UNIFORMS}

/**
 * Box fold operation
 * Reflects coordinates outside [-limit, limit] back inside
 */
vec3 boxFold(vec3 z, float limit) {
    return clamp(z, -limit, limit) * 2.0 - z;
}

/**
 * Conditional box fold (original formulation)
 */
vec3 boxFoldConditional(vec3 z, float limit) {
    if (z.x > limit) z.x = 2.0 * limit - z.x;
    else if (z.x < -limit) z.x = -2.0 * limit - z.x;
    
    if (z.y > limit) z.y = 2.0 * limit - z.y;
    else if (z.y < -limit) z.y = -2.0 * limit - z.y;
    
    if (z.z > limit) z.z = 2.0 * limit - z.z;
    else if (z.z < -limit) z.z = -2.0 * limit - z.z;
    
    return z;
}

/**
 * Sphere fold operation
 * Returns (folded position, scale factor for DE)
 * 
 * Math:
 * - r < minRadius: z *= (fixedRadius/minRadius)², factor = (fixedRadius/minRadius)²
 * - r < fixedRadius: z *= (fixedRadius/r)², factor = (fixedRadius/r)²
 * - else: no scaling, factor = 1
 */
vec4 sphereFold(vec3 z, float minRadius, float fixedRadius) {
    float r2 = dot(z, z);
    float minR2 = minRadius * minRadius;
    float fixedR2 = fixedRadius * fixedRadius;
    
    float factor = 1.0;
    
    if (r2 < minR2) {
        // Inside minimum radius - scale by fixed/min ratio squared
        factor = fixedR2 / minR2;
        z *= factor;
    } else if (r2 < fixedR2) {
        // Between min and fixed radius - spherical inversion
        factor = fixedR2 / r2;
        z *= factor;
    }
    
    return vec4(z, factor);
}

/**
 * Rotation matrix around arbitrary axis
 * Using Rodrigues' rotation formula
 */
mat3 rotationMatrix(vec3 axis, float angle) {
    vec3 a = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(
        oc * a.x * a.x + c,        oc * a.x * a.y - a.z * s,  oc * a.z * a.x + a.y * s,
        oc * a.x * a.y + a.z * s,  oc * a.y * a.y + c,        oc * a.y * a.z - a.x * s,
        oc * a.z * a.x - a.y * s,  oc * a.y * a.z + a.x * s,  oc * a.z * a.z + c
    );
}

/**
 * Core Mandelbox iteration
 */
vec4 mandelboxIterate(vec3 pos, float scale, float foldLimit, float minR, float fixedR, int maxIter) {
    vec3 z = pos;
    vec3 c = uBoxJuliaMode ? uBoxJuliaC : pos;
    
    // Optional offset
    vec3 offset = vec3(uBoxOffsetX, uBoxOffsetY, uBoxOffsetZ);
    
    // Rotation matrix (computed once)
    mat3 rotMat = rotationMatrix(uBoxRotationAxis, uBoxRotationAngle);
    
    // Distance estimator scale factor
    float dr = 1.0;
    
    // Orbit trap tracking
    float minDist = 1e10;
    float avgDist = 0.0;
    vec3 trapped = vec3(0.0);
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        // Track orbit traps
        float d = length(z);
        if (d < minDist) {
            minDist = d;
            trapped = z;
        }
        avgDist += d;
        
        // Box fold
        if (uBoxConditionalFold) {
            z = boxFoldConditional(z, foldLimit);
        } else {
            z = boxFold(z, foldLimit);
        }
        
        // Sphere fold
        if (uBoxSphericalFold) {
            vec4 sfResult = sphereFold(z, minR, fixedR);
            z = sfResult.xyz;
            dr *= sfResult.w;
        }
        
        // Optional rotation
        if (uBoxRotationAngle != 0.0) {
            z = rotMat * z;
        }
        
        // Scale and translate
        z = scale * z + c + offset;
        dr = dr * abs(scale) + 1.0;
        
        // Bailout check
        if (d > 1000.0) break;
        
        iterations = i + 1;
    }
    
    // Distance estimation
    float r = length(z);
    float de = r / abs(dr);
    
    return vec4(
        de,
        float(iterations) / float(maxIter),
        minDist,
        avgDist / float(max(iterations, 1))
    );
}

/**
 * Classic Mandelbox with scale -1.5
 * Optimized for the most common configuration
 */
vec4 mandelboxClassic(vec3 pos, int maxIter) {
    vec3 z = pos;
    vec3 c = uBoxJuliaMode ? uBoxJuliaC : pos;
    
    float scale = -1.5;
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Box fold (limit = 1.0)
        z = clamp(z, -1.0, 1.0) * 2.0 - z;
        
        // Sphere fold (minR = 0.5, fixedR = 1.0)
        float r2 = dot(z, z);
        if (r2 < 0.25) {
            z *= 4.0;
            dr *= 4.0;
        } else if (r2 < 1.0) {
            float factor = 1.0 / r2;
            z *= factor;
            dr *= factor;
        }
        
        // Scale and translate
        z = scale * z + c;
        dr = dr * abs(scale) + 1.0;
        
        if (d > 1000.0) break;
        
        iterations = i + 1;
    }
    
    float de = length(z) / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, length(z));
}

/**
 * Mandelbox with positive scale
 * Creates different structure than negative scale
 */
vec4 mandelboxPositive(vec3 pos, float scale, int maxIter) {
    vec3 z = pos;
    vec3 c = uBoxJuliaMode ? uBoxJuliaC : pos;
    
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Box fold
        z = clamp(z, -1.0, 1.0) * 2.0 - z;
        
        // Sphere fold
        float r2 = dot(z, z);
        if (r2 < 0.25) {
            z *= 4.0;
            dr *= 4.0;
        } else if (r2 < 1.0) {
            float factor = 1.0 / r2;
            z *= factor;
            dr *= factor;
        }
        
        // Scale and translate (positive scale)
        z = scale * z + c;
        dr = dr * scale + 1.0;
        
        if (d > 1000.0) break;
        
        iterations = i + 1;
    }
    
    float de = length(z) / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, length(z));
}

/**
 * Amazing Surface variant (by Knighty)
 * Modified Mandelbox with different fold behavior
 */
vec4 amazingSurface(vec3 pos, float scale, int maxIter) {
    vec3 z = pos;
    vec3 c = pos;
    
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Modified box fold (only fold positive)
        z = abs(z);
        z = vec3(
            z.x > 1.0 ? 2.0 - z.x : z.x,
            z.y > 1.0 ? 2.0 - z.y : z.y,
            z.z > 1.0 ? 2.0 - z.z : z.z
        );
        
        // Sphere fold
        float r2 = dot(z, z);
        if (r2 < 0.25) {
            z *= 4.0;
            dr *= 4.0;
        } else if (r2 < 1.0) {
            float factor = 1.0 / r2;
            z *= factor;
            dr *= factor;
        }
        
        z = scale * z + c;
        dr = dr * abs(scale) + 1.0;
        
        if (d > 1000.0) break;
        
        iterations = i + 1;
    }
    
    float de = length(z) / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, length(z));
}

/**
 * Main distance estimator function
 */
vec4 map(vec3 pos) {
    // Use classic for common case, otherwise general iteration
    if (abs(uBoxScale - (-1.5)) < 0.01 && 
        abs(uBoxFoldingLimit - 1.0) < 0.01 && 
        abs(uBoxMinRadius - 0.5) < 0.01 && 
        abs(uBoxFixedRadius - 1.0) < 0.01 &&
        !uBoxJuliaMode &&
        uBoxRotationAngle == 0.0) {
        return mandelboxClassic(pos, uBoxIterations);
    }
    
    return mandelboxIterate(
        pos, 
        uBoxScale, 
        uBoxFoldingLimit, 
        uBoxMinRadius, 
        uBoxFixedRadius, 
        uBoxIterations
    );
}
`;

// ============================================================================
// MANDELBOX VARIATIONS
// ============================================================================

/**
 * Spherical Mandelbox (using spherical coordinates)
 */
export const MANDELBOX_SPHERICAL = /* glsl */`
/**
 * Spherical Mandelbox variant
 * Applies folds in spherical coordinates
 */
vec4 mandelboxSpherical(vec3 pos, float scale, int maxIter) {
    vec3 z = pos;
    vec3 c = pos;
    
    float dr = 1.0;
    float minDist = 1e10;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Convert to spherical
        float r = length(z);
        float theta = acos(clamp(z.y / r, -1.0, 1.0));
        float phi = atan(z.z, z.x);
        
        // Fold in spherical coordinates
        theta = abs(theta);
        if (theta > 1.0) theta = 2.0 - theta;
        phi = mod(phi + PI, 2.0 * PI) - PI;
        if (abs(phi) > 1.0) phi = sign(phi) * (2.0 - abs(phi));
        
        // Convert back
        z = r * vec3(
            sin(theta) * cos(phi),
            cos(theta),
            sin(theta) * sin(phi)
        );
        
        // Sphere fold
        float r2 = dot(z, z);
        if (r2 < 0.25) {
            z *= 4.0;
            dr *= 4.0;
        } else if (r2 < 1.0) {
            z /= r2;
            dr /= r2;
        }
        
        z = scale * z + c;
        dr = dr * abs(scale) + 1.0;
        
        if (d > 1000.0) break;
    }
    
    return vec4(length(z) / abs(dr), 0.0, minDist, length(z));
}
`;

// ============================================================================
// COMPLETE SHADER
// ============================================================================

export const MANDELBOX_FRAGMENT = /* glsl */`
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

// Mandelbox uniforms
uniform float uBoxScale;
uniform float uBoxFoldingLimit;
uniform float uBoxMinRadius;
uniform float uBoxFixedRadius;
uniform int uBoxIterations;
uniform bool uBoxJuliaMode;
uniform vec3 uBoxJuliaC;
uniform float uBoxRotationAngle;
uniform vec3 uBoxRotationAxis;
uniform bool uBoxSphericalFold;
uniform bool uBoxConditionalFold;
uniform float uBoxOffsetX;
uniform float uBoxOffsetY;
uniform float uBoxOffsetZ;

// Lighting
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;
uniform bool uShadowsEnabled;
uniform int uQuality;

${MANDELBOX_DE}

vec3 getRayDir(vec2 uv, vec3 ro, vec3 ta) {
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = normalize(cross(uu, ww));
    float fovScale = tan(uFov * 0.5);
    return normalize(uv.x * uu * fovScale * uAspect + uv.y * vv * fovScale + ww);
}

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
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(0.8, 0.8, 0.5);
    vec3 d = vec3(0.0, 0.2, 0.5);
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
        
        vec3 baseCol = palette(res.y * 0.5 + res.z * 0.3);
        
        vec3 lightDir = normalize(uLightDir);
        float diff = max(dot(nor, lightDir), 0.0);
        
        vec3 halfDir = normalize(lightDir - rd);
        float spec = pow(max(dot(nor, halfDir), 0.0), uShininess);
        
        float shadow = uShadowsEnabled ? calcShadow(pos + nor * 0.002, lightDir) : 1.0;
        float ao = calcAO(pos, nor);
        
        col = baseCol * (uAmbient + diff * uDiffuse * shadow) * ao;
        col += uSpecular * spec * shadow * uLightColor;
        
        float fog = exp(-res.x * 0.05);
        col = mix(vec3(0.02, 0.03, 0.05), col, fog);
    } else {
        col = vec3(0.02, 0.03, 0.05);
        col += vec3(0.2, 0.15, 0.1) * pow(max(1.0 - length(uv), 0.0), 3.0);
    }
    
    col = pow(col, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(col, 1.0);
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create Mandelbox shader material uniforms
 */
export function createMandelboxUniforms(options = {}) {
    return {
        // Camera
        uCameraPos: { value: options.cameraPos || [0, 0, 8] },
        uCameraTarget: { value: options.cameraTarget || [0, 0, 0] },
        uFov: { value: options.fov || Math.PI / 3 },
        uAspect: { value: options.aspect || 1 },
        uTime: { value: 0 },
        uResolution: { value: options.resolution || [1920, 1080] },
        
        // Mandelbox specific
        uBoxScale: { value: options.scale !== undefined ? options.scale : -1.5 },
        uBoxFoldingLimit: { value: options.foldingLimit || 1.0 },
        uBoxMinRadius: { value: options.minRadius || 0.5 },
        uBoxFixedRadius: { value: options.fixedRadius || 1.0 },
        uBoxIterations: { value: options.iterations || 15 },
        uBoxJuliaMode: { value: options.juliaMode || false },
        uBoxJuliaC: { value: options.juliaC || [0, 0, 0] },
        uBoxRotationAngle: { value: options.rotationAngle || 0 },
        uBoxRotationAxis: { value: options.rotationAxis || [0, 1, 0] },
        uBoxSphericalFold: { value: options.sphericalFold !== false },
        uBoxConditionalFold: { value: options.conditionalFold || false },
        uBoxOffsetX: { value: options.offsetX || 0 },
        uBoxOffsetY: { value: options.offsetY || 0 },
        uBoxOffsetZ: { value: options.offsetZ || 0 },
        
        // Lighting
        uLightDir: { value: options.lightDir || [1, 1, 1] },
        uLightColor: { value: options.lightColor || [1, 1, 1] },
        uAmbient: { value: options.ambient || 0.2 },
        uDiffuse: { value: options.diffuse || 0.8 },
        uSpecular: { value: options.specular || 0.5 },
        uShininess: { value: options.shininess || 32 },
        uShadowsEnabled: { value: options.shadows !== false },
        uQuality: { value: options.quality || 1 }
    };
}

/**
 * Get complete Mandelbox shader source
 */
export function getMandelboxShader() {
    return {
        vertex: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: MANDELBOX_FRAGMENT
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: MANDELBOX_UNIFORMS,
    distanceEstimator: MANDELBOX_DE,
    fragment: MANDELBOX_FRAGMENT,
    variants: {
        spherical: MANDELBOX_SPHERICAL
    },
    createUniforms: createMandelboxUniforms,
    getShader: getMandelboxShader
};
