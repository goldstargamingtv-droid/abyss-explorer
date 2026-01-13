/**
 * ============================================================================
 * ABYSS EXPLORER - KLEINIAN GROUP SHADER
 * ============================================================================
 * 
 * GLSL shader for Kleinian group limit sets and related fractals.
 * Implements inversive geometry transformations that create intricate
 * foam-like structures.
 * 
 * Mathematical Background:
 * Kleinian groups are discrete subgroups of PSL(2,C), acting on the
 * Riemann sphere via Möbius transformations. The limit set is the set
 * of accumulation points of orbits.
 * 
 * Key Operations:
 * 1. Sphere inversion: reflects points through a sphere
 * 2. Möbius transformation: (az + b)/(cz + d) extended to 3D
 * 3. Folding: repeated inversions through multiple spheres
 * 
 * References:
 * - Knighty (fractalforums.com) - Kleinian group implementations
 * - Jos Leys - Kleinian group visualizations
 * - "Indra's Pearls" - Mumford, Series, Wright
 * - Syntopia - Distance estimation for Kleinians
 * 
 * @module shaders/kleinian.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// KLEINIAN UNIFORMS
// ============================================================================

export const KLEINIAN_UNIFORMS = /* glsl */`
// Kleinian group specific uniforms
uniform vec3 uKleinBox;             // Box size for folding (x, y, z)
uniform vec3 uKleinOffset;          // Translation offset
uniform float uKleinMinR;           // Minimum radius (sphere inversion)
uniform float uKleinScale;          // Overall scale
uniform int uKleinIterations;       // Max iterations
uniform int uKleinType;             // Type: 0=standard, 1=apollonian, 2=foam

// Coloring
uniform int uKleinColorMode;        // 0=iteration, 1=orbit trap, 2=distance
uniform vec3 uKleinColorA;          // Palette color A
uniform vec3 uKleinColorB;          // Palette color B

// Advanced parameters
uniform float uKleinCSize;          // C-size parameter
uniform float uKleinSize;           // Size parameter
uniform vec3 uKleinFold;            // Folding parameters
uniform bool uKleinDoubleFold;      // Enable double folding
`;

// ============================================================================
// KLEINIAN DISTANCE ESTIMATOR
// ============================================================================

export const KLEINIAN_DE = /* glsl */`
/**
 * ============================================================================
 * KLEINIAN GROUP DISTANCE ESTIMATOR
 * ============================================================================
 * 
 * Kleinian fractals are created through repeated inversive transformations.
 * 
 * The basic recipe:
 * 1. Fold space into a fundamental domain using box/plane folds
 * 2. Apply sphere inversion
 * 3. Repeat
 * 
 * The distance estimator tracks the scaling through inversions:
 * DE = (length(z) - radius) / scale
 * 
 * Knighty's formula for the limit set distance:
 * The final distance estimate includes contributions from all
 * the inversions performed during iteration.
 */

${KLEINIAN_UNIFORMS}

/**
 * Inversion through a sphere centered at origin
 * z' = z / |z|² = z / dot(z,z)
 * Returns (inverted point, scale factor)
 */
vec4 sphereInversion(vec3 z, float radius) {
    float r2 = dot(z, z);
    float rad2 = radius * radius;
    
    if (r2 < rad2) {
        float factor = rad2 / r2;
        return vec4(z * factor, factor);
    }
    
    return vec4(z, 1.0);
}

/**
 * Box folding for Kleinian domain
 * Folds space into the box [-size, size]³
 */
vec3 boxFold(vec3 z, vec3 size) {
    return clamp(z, -size, size) * 2.0 - z;
}

/**
 * Plane fold (reflect if below plane)
 */
vec3 planeFold(vec3 z, vec3 n, float d) {
    float dist = dot(z, n) - d;
    if (dist < 0.0) {
        z -= 2.0 * dist * n;
    }
    return z;
}

/**
 * Standard Kleinian group iteration
 * Based on Knighty's implementation
 */
vec4 kleinianStandard(vec3 pos, vec3 box, float minR, int maxIter) {
    vec3 z = pos;
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 200; i++) {
        if (i >= maxIter) break;
        
        // Track orbit
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Box fold
        z = boxFold(z, box);
        
        // Sphere inversion
        float r2 = dot(z, z);
        float minR2 = minR * minR;
        
        if (r2 < minR2) {
            float factor = minR2 / r2;
            z *= factor;
            dr *= factor;
        }
        
        // Translation
        z += uKleinOffset;
        
        // Scale
        z *= uKleinScale;
        dr *= abs(uKleinScale);
        
        iterations = i + 1;
        
        if (d > 1000.0) break;
    }
    
    // Distance estimate
    float de = (length(z) - 0.5) / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, length(z));
}

/**
 * Apollonian Gasket in 3D
 * Creates foam-like structures from sphere packing
 * 
 * The Apollonian gasket is built from tangent spheres:
 * - Start with 4 mutually tangent spheres
 * - For each triple of spheres, add the unique sphere tangent to all three
 * - Repeat ad infinitum
 */
vec4 apollonianGasket(vec3 pos, int maxIter) {
    vec3 z = pos;
    float dr = 1.0;
    float minDist = 1e10;
    
    // Apollonian parameters
    float s = 1.5;  // Sphere radius factor
    
    int iterations = 0;
    
    for (int i = 0; i < 200; i++) {
        if (i >= maxIter) break;
        
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Fold into positive octant
        z = abs(z);
        
        // Fold against plane x = y
        if (z.x < z.y) z.xy = z.yx;
        
        // Fold against plane y = z  
        if (z.y < z.z) z.yz = z.zy;
        
        // Fold against plane x = y again
        if (z.x < z.y) z.xy = z.yx;
        
        // Sphere inversion
        float r2 = dot(z, z);
        float k = max(s / r2, 1.0);
        z *= k;
        dr *= k;
        
        // Translate
        z.x -= 2.0;
        z.y -= 2.0;
        
        iterations = i + 1;
        
        if (d > 1000.0) break;
    }
    
    float de = (length(z) - 1.0) / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, length(z));
}

/**
 * Knighty's Kleinian formula
 * More general than standard, allows various foam-like structures
 */
vec4 kleinianKnighty(vec3 pos, vec3 CSize, float Size, int maxIter) {
    vec3 z = pos;
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 200; i++) {
        if (i >= maxIter) break;
        
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Folding
        z = 2.0 * clamp(z, -CSize, CSize) - z;
        
        // Sphere inversion
        float r2 = dot(z, z);
        float k = max(Size / r2, 1.0);
        z *= k;
        dr *= k;
        
        iterations = i + 1;
        
        if (d > 1e10) break;
    }
    
    float de = 0.5 * abs(z.y) / dr;
    
    return vec4(de, float(iterations) / float(maxIter), minDist, length(z));
}

/**
 * Pseudo-Kleinian with plane reflections
 * Creates nice foam-like structures
 */
vec4 pseudoKleinian(vec3 pos, int maxIter) {
    vec3 z = pos;
    float dr = 1.0;
    float minDist = 1e10;
    
    // Parameters
    vec3 CSize = vec3(0.92436, 0.90756, 0.92436);
    float Size = 1.0;
    vec3 C = vec3(0.0, 0.0, 0.0);
    vec3 Offset = vec3(0.0, 0.0, -0.9);
    
    int iterations = 0;
    
    for (int i = 0; i < 200; i++) {
        if (i >= maxIter) break;
        
        float d = length(z);
        if (d < minDist) minDist = d;
        
        // Box fold
        z = 2.0 * clamp(z, -CSize, CSize) - z;
        
        // Sphere fold
        float r2 = dot(z, z);
        float k = max(Size / r2, 1.0);
        z *= k;
        dr *= k;
        
        z += Offset;
        
        iterations = i + 1;
        
        if (d > 1e10) break;
    }
    
    float rxy = length(z.xy);
    float de = max(rxy - 0.32, abs(rxy * z.z) / length(z)) / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, length(z));
}

/**
 * Main distance estimator function
 */
vec4 map(vec3 pos) {
    if (uKleinType == 1) {
        // Apollonian gasket
        return apollonianGasket(pos, uKleinIterations);
    } else if (uKleinType == 2) {
        // Pseudo-Kleinian foam
        return pseudoKleinian(pos, uKleinIterations);
    } else if (uKleinCSize.x > 0.0) {
        // Knighty's formula
        return kleinianKnighty(pos, vec3(uKleinCSize), uKleinSize, uKleinIterations);
    } else {
        // Standard Kleinian
        return kleinianStandard(pos, uKleinBox, uKleinMinR, uKleinIterations);
    }
}
`;

// ============================================================================
// COMPLETE SHADER
// ============================================================================

export const KLEINIAN_FRAGMENT = /* glsl */`
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

// Kleinian uniforms
uniform vec3 uKleinBox;
uniform vec3 uKleinOffset;
uniform float uKleinMinR;
uniform float uKleinScale;
uniform int uKleinIterations;
uniform int uKleinType;
uniform int uKleinColorMode;
uniform vec3 uKleinColorA;
uniform vec3 uKleinColorB;
uniform vec3 uKleinCSize;
uniform float uKleinSize;

// Lighting
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;
uniform bool uShadowsEnabled;
uniform int uQuality;

${KLEINIAN_DE}

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
        
        t += res.x * 0.8;
    }
    
    return vec4(-1.0);
}

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.0002, 0.0);
    return normalize(vec3(
        map(p + e.xyy).x - map(p - e.xyy).x,
        map(p + e.yxy).x - map(p - e.yxy).x,
        map(p + e.yyx).x - map(p - e.yyx).x
    ));
}

float calcShadow(vec3 ro, vec3 rd) {
    float res = 1.0;
    float t = 0.02;
    
    for (int i = 0; i < 48; i++) {
        float h = map(ro + rd * t).x;
        res = min(res, 12.0 * h / t);
        if (res < 0.001 || t > 8.0) break;
        t += clamp(h, 0.02, 0.25);
    }
    
    return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0;
    float sca = 1.0;
    
    for (int i = 0; i < 5; i++) {
        float h = 0.02 + 0.1 * float(i) / 4.0;
        float d = map(pos + h * nor).x;
        occ += (h - d) * sca;
        sca *= 0.9;
    }
    
    return clamp(1.0 - 2.0 * occ, 0.0, 1.0);
}

vec3 palette(float t) {
    vec3 a = uKleinColorA;
    vec3 b = uKleinColorB;
    return mix(a, b, t);
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
        
        vec3 baseCol = palette(res.y);
        
        vec3 lightDir = normalize(uLightDir);
        float diff = max(dot(nor, lightDir), 0.0);
        
        vec3 halfDir = normalize(lightDir - rd);
        float spec = pow(max(dot(nor, halfDir), 0.0), uShininess);
        
        float shadow = uShadowsEnabled ? calcShadow(pos + nor * 0.003, lightDir) : 1.0;
        float ao = calcAO(pos, nor);
        
        col = baseCol * (uAmbient + diff * uDiffuse * shadow) * ao;
        col += uSpecular * spec * shadow * uLightColor;
        
        float fog = exp(-res.x * 0.08);
        col = mix(vec3(0.03, 0.03, 0.05), col, fog);
    } else {
        col = vec3(0.02, 0.02, 0.04);
    }
    
    col = pow(col, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(col, 1.0);
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create Kleinian shader uniforms
 */
export function createKleinianUniforms(options = {}) {
    return {
        // Camera
        uCameraPos: { value: options.cameraPos || [0, 0, 5] },
        uCameraTarget: { value: options.cameraTarget || [0, 0, 0] },
        uFov: { value: options.fov || Math.PI / 3 },
        uAspect: { value: options.aspect || 1 },
        uTime: { value: 0 },
        uResolution: { value: options.resolution || [1920, 1080] },
        
        // Kleinian specific
        uKleinBox: { value: options.box || [0.5, 0.5, 0.5] },
        uKleinOffset: { value: options.offset || [0, 0, 0] },
        uKleinMinR: { value: options.minR || 0.5 },
        uKleinScale: { value: options.scale || 1.0 },
        uKleinIterations: { value: options.iterations || 50 },
        uKleinType: { value: options.type || 0 },
        uKleinColorMode: { value: options.colorMode || 0 },
        uKleinColorA: { value: options.colorA || [0.5, 0.7, 1.0] },
        uKleinColorB: { value: options.colorB || [1.0, 0.5, 0.3] },
        uKleinCSize: { value: options.cSize || [0.92436, 0.90756, 0.92436] },
        uKleinSize: { value: options.size || 1.0 },
        
        // Lighting
        uLightDir: { value: options.lightDir || [1, 1, 1] },
        uLightColor: { value: options.lightColor || [1, 1, 1] },
        uAmbient: { value: options.ambient || 0.25 },
        uDiffuse: { value: options.diffuse || 0.75 },
        uSpecular: { value: options.specular || 0.4 },
        uShininess: { value: options.shininess || 24 },
        uShadowsEnabled: { value: options.shadows !== false },
        uQuality: { value: options.quality || 1 }
    };
}

/**
 * Get Kleinian shader source
 */
export function getKleinianShader() {
    return {
        vertex: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: KLEINIAN_FRAGMENT
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: KLEINIAN_UNIFORMS,
    distanceEstimator: KLEINIAN_DE,
    fragment: KLEINIAN_FRAGMENT,
    createUniforms: createKleinianUniforms,
    getShader: getKleinianShader
};
