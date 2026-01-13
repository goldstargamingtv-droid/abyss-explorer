/**
 * ============================================================================
 * ABYSS EXPLORER - QUATERNION JULIA SHADER
 * ============================================================================
 * 
 * GLSL shader for quaternion (4D) Julia sets sliced into 3D.
 * Quaternion Julia sets are the natural 4D extension of complex Julia sets.
 * 
 * Mathematical Background:
 * Quaternions: q = w + xi + yj + zk where i² = j² = k² = ijk = -1
 * 
 * Quaternion multiplication:
 * (a + bi + cj + dk)(e + fi + gj + hk) = 
 *   (ae - bf - cg - dh) + 
 *   (af + be + ch - dg)i +
 *   (ag - bh + ce + df)j +
 *   (ah + bg - cf + de)k
 * 
 * Julia iteration: q(n+1) = q(n)² + c
 * 
 * 3D Visualization:
 * We slice the 4D Julia set with a 3D hyperplane at fixed w coordinate,
 * or use the xyz components directly.
 * 
 * References:
 * - "Quaternion Julia Set Ray Tracer" - Keenan Crane
 * - Inigo Quilez - https://iquilezles.org/articles/juliasets3d/
 * - Paul Bourke - Quaternion Julia sets
 * - Hart et al. (1989) - Ray tracing deterministic 3D fractals
 * 
 * @module shaders/julia-quat.glsl
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// QUATERNION JULIA UNIFORMS
// ============================================================================

export const JULIA_QUAT_UNIFORMS = /* glsl */`
// Quaternion Julia specific uniforms
uniform vec4 uQuatC;                // Julia constant c (x,y,z,w)
uniform float uQuatSlice;           // 4th dimension slice position
uniform int uQuatIterations;        // Max iterations
uniform float uQuatBailout;         // Bailout radius
uniform int uQuatPower;             // Power (2, 3, 4...)
uniform bool uQuatBicomplex;        // Use bicomplex numbers instead

// Animation
uniform float uQuatPhase;           // Animation phase for c
uniform bool uQuatAnimateC;         // Animate the c value

// Variations
uniform int uQuatFormula;           // 0=standard, 1=sine, 2=cosine, 3=exp
uniform vec4 uQuatOffset;           // Additional offset per iteration
`;

// ============================================================================
// QUATERNION JULIA DISTANCE ESTIMATOR
// ============================================================================

export const JULIA_QUAT_DE = /* glsl */`
/**
 * ============================================================================
 * QUATERNION JULIA DISTANCE ESTIMATOR
 * ============================================================================
 * 
 * Quaternion arithmetic for Julia set iteration.
 * 
 * For quaternion q = (x, y, z, w):
 * q² = (x² - y² - z² - w², 2xy, 2xz, 2xw)
 * 
 * Note: This uses the convention where x is the "real" part.
 * Some implementations use w as real.
 * 
 * Distance estimation uses:
 * DE ≈ 0.5 * |q| * log(|q|) / |q'|
 * 
 * where q' is the running derivative magnitude.
 */

${JULIA_QUAT_UNIFORMS}

/**
 * Quaternion multiplication
 * q1 * q2 where q = (x, y, z, w) = x + yi + zj + wk
 */
vec4 quatMult(vec4 q1, vec4 q2) {
    return vec4(
        q1.x * q2.x - q1.y * q2.y - q1.z * q2.z - q1.w * q2.w,
        q1.x * q2.y + q1.y * q2.x + q1.z * q2.w - q1.w * q2.z,
        q1.x * q2.z - q1.y * q2.w + q1.z * q2.x + q1.w * q2.y,
        q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x
    );
}

/**
 * Quaternion square: q² = q * q
 * Optimized version without full multiplication
 */
vec4 quatSquare(vec4 q) {
    return vec4(
        q.x * q.x - q.y * q.y - q.z * q.z - q.w * q.w,
        2.0 * q.x * q.y,
        2.0 * q.x * q.z,
        2.0 * q.x * q.w
    );
}

/**
 * Quaternion cube: q³
 */
vec4 quatCube(vec4 q) {
    vec4 q2 = quatSquare(q);
    return quatMult(q2, q);
}

/**
 * Quaternion to the fourth power: q⁴
 */
vec4 quatPow4(vec4 q) {
    vec4 q2 = quatSquare(q);
    return quatSquare(q2);
}

/**
 * General quaternion power using repeated multiplication
 */
vec4 quatPow(vec4 q, int n) {
    vec4 result = vec4(1.0, 0.0, 0.0, 0.0); // Identity
    
    for (int i = 0; i < 20; i++) {
        if (i >= n) break;
        result = quatMult(result, q);
    }
    
    return result;
}

/**
 * Quaternion length (4D Euclidean norm)
 */
float quatLength(vec4 q) {
    return length(q);
}

/**
 * Quaternion sine (for sin(q) Julia sets)
 * sin(q) ≈ sin(x)*cosh(|v|) + (v/|v|)*cos(x)*sinh(|v|)
 * where q = x + v (v is vector part)
 */
vec4 quatSin(vec4 q) {
    vec3 v = q.yzw;
    float vLen = length(v);
    
    if (vLen < 0.0001) {
        return vec4(sin(q.x), 0.0, 0.0, 0.0);
    }
    
    vec3 vNorm = v / vLen;
    float sinX = sin(q.x);
    float cosX = cos(q.x);
    float sinhV = sinh(vLen);
    float coshV = cosh(vLen);
    
    return vec4(
        sinX * coshV,
        vNorm * cosX * sinhV
    );
}

/**
 * Quaternion cosine
 */
vec4 quatCos(vec4 q) {
    vec3 v = q.yzw;
    float vLen = length(v);
    
    if (vLen < 0.0001) {
        return vec4(cos(q.x), 0.0, 0.0, 0.0);
    }
    
    vec3 vNorm = v / vLen;
    float sinX = sin(q.x);
    float cosX = cos(q.x);
    float sinhV = sinh(vLen);
    float coshV = cosh(vLen);
    
    return vec4(
        cosX * coshV,
        -vNorm * sinX * sinhV
    );
}

/**
 * Quaternion exponential
 * exp(q) = exp(x) * (cos(|v|) + (v/|v|)*sin(|v|))
 */
vec4 quatExp(vec4 q) {
    vec3 v = q.yzw;
    float vLen = length(v);
    float expX = exp(q.x);
    
    if (vLen < 0.0001) {
        return vec4(expX, 0.0, 0.0, 0.0);
    }
    
    vec3 vNorm = v / vLen;
    
    return vec4(
        expX * cos(vLen),
        expX * sin(vLen) * vNorm
    );
}

/**
 * Standard quaternion Julia iteration: q → q² + c
 * Returns (distance estimate, iteration fraction, trap1, trap2)
 */
vec4 juliaQuatStandard(vec3 pos, vec4 c, int maxIter, float bailout) {
    // Create quaternion from 3D position
    vec4 q = vec4(pos, uQuatSlice);
    
    // Running derivative magnitude
    float dr = 1.0;
    
    // Orbit trap tracking
    float minDist = 1e10;
    float avgDist = 0.0;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float r = quatLength(q);
        
        // Bailout
        if (r > bailout) break;
        
        // Track orbit
        if (r < minDist) minDist = r;
        avgDist += r;
        
        // Derivative: d(q²)/dq = 2q, so dr *= 2*|q|
        dr = 2.0 * r * dr;
        
        // q = q² + c
        q = quatSquare(q) + c;
        
        iterations = i + 1;
    }
    
    float r = quatLength(q);
    
    // Distance estimate: DE = 0.5 * |q| * log(|q|) / |dq/dc|
    float de = 0.5 * r * log(r) / dr;
    
    return vec4(
        de,
        float(iterations) / float(maxIter),
        minDist,
        avgDist / float(max(iterations, 1))
    );
}

/**
 * Higher power quaternion Julia: q → q^n + c
 */
vec4 juliaQuatPower(vec3 pos, vec4 c, int power, int maxIter, float bailout) {
    vec4 q = vec4(pos, uQuatSlice);
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float r = quatLength(q);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        // Derivative: d(q^n)/dq = n*q^(n-1), so dr *= n*|q|^(n-1)
        dr = float(power) * pow(r, float(power - 1)) * dr;
        
        // q = q^n + c
        if (power == 2) {
            q = quatSquare(q) + c;
        } else if (power == 3) {
            q = quatCube(q) + c;
        } else if (power == 4) {
            q = quatPow4(q) + c;
        } else {
            q = quatPow(q, power) + c;
        }
        
        iterations = i + 1;
    }
    
    float r = quatLength(q);
    float de = 0.5 * r * log(r) / dr;
    
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}

/**
 * Sine quaternion Julia: q → sin(q) + c
 * Creates smooth, organic structures
 */
vec4 juliaQuatSine(vec3 pos, vec4 c, int maxIter, float bailout) {
    vec4 q = vec4(pos, uQuatSlice);
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float r = quatLength(q);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        // Approximate derivative for sin
        vec4 qCos = quatCos(q);
        dr = quatLength(qCos) * dr + 1.0;
        
        q = quatSin(q) + c;
        
        iterations = i + 1;
    }
    
    float r = quatLength(q);
    float de = r / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}

/**
 * Cosine quaternion Julia: q → cos(q) * c
 */
vec4 juliaQuatCosine(vec3 pos, vec4 c, int maxIter, float bailout) {
    vec4 q = vec4(pos, uQuatSlice);
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float r = quatLength(q);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        vec4 qSin = quatSin(q);
        dr = quatLength(qSin) * dr + 1.0;
        
        q = quatMult(quatCos(q), c);
        
        iterations = i + 1;
    }
    
    float r = quatLength(q);
    float de = r / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}

/**
 * Exponential quaternion Julia: q → exp(q) + c
 */
vec4 juliaQuatExp(vec3 pos, vec4 c, int maxIter, float bailout) {
    vec4 q = vec4(pos, uQuatSlice);
    float dr = 1.0;
    float minDist = 1e10;
    
    int iterations = 0;
    
    for (int i = 0; i < 100; i++) {
        if (i >= maxIter) break;
        
        float r = quatLength(q);
        if (r > bailout) break;
        
        if (r < minDist) minDist = r;
        
        // d(exp(q))/dq = exp(q)
        vec4 qExp = quatExp(q);
        dr = quatLength(qExp) * dr + 1.0;
        
        q = qExp + c;
        
        iterations = i + 1;
    }
    
    float r = quatLength(q);
    float de = r / abs(dr);
    
    return vec4(de, float(iterations) / float(maxIter), minDist, r);
}

/**
 * Animated c value for morphing Julia sets
 */
vec4 getAnimatedC() {
    if (!uQuatAnimateC || uQuatPhase == 0.0) {
        return uQuatC;
    }
    
    // Orbit around the interesting region
    float t = uQuatPhase;
    return vec4(
        uQuatC.x + 0.1 * sin(t * 1.1),
        uQuatC.y + 0.1 * cos(t * 0.9),
        uQuatC.z + 0.05 * sin(t * 1.3),
        uQuatC.w + 0.05 * cos(t * 0.7)
    );
}

/**
 * Main distance estimator function
 */
vec4 map(vec3 pos) {
    vec4 c = getAnimatedC();
    
    // Add optional per-iteration offset
    c += uQuatOffset;
    
    // Select formula
    if (uQuatFormula == 1) {
        return juliaQuatSine(pos, c, uQuatIterations, uQuatBailout);
    } else if (uQuatFormula == 2) {
        return juliaQuatCosine(pos, c, uQuatIterations, uQuatBailout);
    } else if (uQuatFormula == 3) {
        return juliaQuatExp(pos, c, uQuatIterations, uQuatBailout);
    } else if (uQuatPower != 2) {
        return juliaQuatPower(pos, c, uQuatPower, uQuatIterations, uQuatBailout);
    } else {
        return juliaQuatStandard(pos, c, uQuatIterations, uQuatBailout);
    }
}
`;

// ============================================================================
// COMPLETE SHADER
// ============================================================================

export const JULIA_QUAT_FRAGMENT = /* glsl */`
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

// Julia uniforms
uniform vec4 uQuatC;
uniform float uQuatSlice;
uniform int uQuatIterations;
uniform float uQuatBailout;
uniform int uQuatPower;
uniform float uQuatPhase;
uniform bool uQuatAnimateC;
uniform int uQuatFormula;
uniform vec4 uQuatOffset;
uniform bool uQuatBicomplex;

// Lighting
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;
uniform bool uShadowsEnabled;
uniform int uQuality;

${JULIA_QUAT_DE}

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
        
        vec3 baseCol = palette(res.y * 0.5 + res.z * 0.3);
        
        vec3 lightDir = normalize(uLightDir);
        float diff = max(dot(nor, lightDir), 0.0);
        
        vec3 halfDir = normalize(lightDir - rd);
        float spec = pow(max(dot(nor, halfDir), 0.0), uShininess);
        
        float shadow = uShadowsEnabled ? calcShadow(pos + nor * 0.002, lightDir) : 1.0;
        float ao = calcAO(pos, nor);
        
        col = baseCol * (uAmbient + diff * uDiffuse * shadow) * ao;
        col += uSpecular * spec * shadow * uLightColor;
        
        float fog = exp(-res.x * 0.1);
        col = mix(vec3(0.05, 0.05, 0.1), col, fog);
    } else {
        col = vec3(0.02, 0.02, 0.05);
        col += vec3(0.3, 0.1, 0.05) * pow(max(1.0 - length(uv), 0.0), 3.0);
    }
    
    col = pow(col, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(col, 1.0);
}
`;

// ============================================================================
// JAVASCRIPT WRAPPER
// ============================================================================

/**
 * Create quaternion Julia shader uniforms
 */
export function createJuliaQuatUniforms(options = {}) {
    return {
        // Camera
        uCameraPos: { value: options.cameraPos || [0, 0, 3] },
        uCameraTarget: { value: options.cameraTarget || [0, 0, 0] },
        uFov: { value: options.fov || Math.PI / 3 },
        uAspect: { value: options.aspect || 1 },
        uTime: { value: 0 },
        uResolution: { value: options.resolution || [1920, 1080] },
        
        // Julia specific
        uQuatC: { value: options.c || [-0.2, 0.6, 0.2, 0.2] },
        uQuatSlice: { value: options.slice || 0 },
        uQuatIterations: { value: options.iterations || 10 },
        uQuatBailout: { value: options.bailout || 4 },
        uQuatPower: { value: options.power || 2 },
        uQuatPhase: { value: options.phase || 0 },
        uQuatAnimateC: { value: options.animateC || false },
        uQuatFormula: { value: options.formula || 0 },
        uQuatOffset: { value: options.offset || [0, 0, 0, 0] },
        uQuatBicomplex: { value: options.bicomplex || false },
        
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
 * Interesting Julia c values
 */
export const INTERESTING_C_VALUES = [
    { c: [-0.2, 0.6, 0.2, 0.2], name: 'Classic' },
    { c: [-0.291, 0.399, 0.339, 0.437], name: 'Coral' },
    { c: [-0.4, 0.6, 0.0, 0.0], name: 'Spiral' },
    { c: [-0.125, -0.256, 0.847, 0.0895], name: 'Bubble' },
    { c: [-0.213, -0.0410, -0.563, -0.560], name: 'Alien' },
    { c: [-0.450, -0.447, 0.181, 0.306], name: 'Crystal' },
    { c: [-0.08, 0.0, -0.83, -0.025], name: 'Heart' },
    { c: [-0.137, 0.0, -0.75, 0.0], name: 'Dendrite' }
];

/**
 * Get quaternion Julia shader source
 */
export function getJuliaQuatShader() {
    return {
        vertex: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: JULIA_QUAT_FRAGMENT
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    uniforms: JULIA_QUAT_UNIFORMS,
    distanceEstimator: JULIA_QUAT_DE,
    fragment: JULIA_QUAT_FRAGMENT,
    createUniforms: createJuliaQuatUniforms,
    getShader: getJuliaQuatShader,
    interestingCValues: INTERESTING_C_VALUES
};
