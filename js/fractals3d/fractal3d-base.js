/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ABYSS EXPLORER - 3D FRACTAL BASE CLASS                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Abstract base class for all raymarched 3D fractals                           ║
 * ║                                                                                ║
 * ║  Rendering Technique: Sphere Tracing (Raymarching)                            ║
 * ║  ═══════════════════════════════════════════════════                          ║
 * ║  3D fractals are rendered using distance field raymarching:                   ║
 * ║                                                                                ║
 * ║  1. For each pixel, cast a ray from camera through the scene                  ║
 * ║  2. At each step, evaluate the Distance Estimator (DE) function               ║
 * ║  3. March forward by the DE distance (safe step - won't penetrate surface)    ║
 * ║  4. Repeat until DE < ε (hit) or exceeded max distance (miss)                 ║
 * ║  5. Compute normal and lighting at hit point                                  ║
 * ║                                                                                ║
 * ║  Distance Estimator (DE):                                                      ║
 * ║  ═══════════════════════                                                       ║
 * ║  A function DE(p) that returns a lower bound on the distance from point p     ║
 * ║  to the nearest surface. For fractals, this is derived from the iteration:   ║
 * ║                                                                                ║
 * ║    DE ≈ 0.5 × |z| × log|z| / |z'|                                            ║
 * ║                                                                                ║
 * ║  where z is the final iterate and z' is the derivative (running product).    ║
 * ║                                                                                ║
 * ║  Implementation:                                                               ║
 * ║  - Each 3D fractal provides GLSL shader code for the DE function              ║
 * ║  - Shaders run on GPU for real-time rendering                                 ║
 * ║  - CPU fallback for screenshots and precision work                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Quaternion, Bicomplex, Dual } from '../math/quaternion.js';
import { Complex } from '../math/complex.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_ITERATIONS = 15;
const DEFAULT_BAILOUT = 8.0;
const DEFAULT_EPSILON = 0.0001;
const DEFAULT_MAX_STEPS = 256;
const DEFAULT_MAX_DISTANCE = 100.0;

// =============================================================================
// 3D FRACTAL PARAMETERS
// =============================================================================

/**
 * Parameters for 3D fractal rendering
 * 
 * @class Fractal3DParams
 */
export class Fractal3DParams {
    constructor(options = {}) {
        // =====================================================================
        // ITERATION PARAMETERS
        // =====================================================================
        
        /** @type {number} Maximum fractal iterations */
        this.maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
        
        /** @type {number} Escape radius */
        this.bailout = options.bailout ?? DEFAULT_BAILOUT;
        
        /** @type {number} Power exponent (for power-based fractals) */
        this.power = options.power ?? 8;
        
        // =====================================================================
        // RAYMARCHING PARAMETERS
        // =====================================================================
        
        /** @type {number} Surface hit threshold */
        this.epsilon = options.epsilon ?? DEFAULT_EPSILON;
        
        /** @type {number} Maximum ray steps */
        this.maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;
        
        /** @type {number} Maximum ray distance */
        this.maxDistance = options.maxDistance ?? DEFAULT_MAX_DISTANCE;
        
        /** @type {number} Step size multiplier (< 1 for safety) */
        this.stepMultiplier = options.stepMultiplier ?? 0.9;
        
        // =====================================================================
        // JULIA MODE
        // =====================================================================
        
        /** @type {boolean} Enable Julia mode */
        this.juliaMode = options.juliaMode ?? false;
        
        /** @type {{x: number, y: number, z: number, w: number}} Julia offset */
        this.juliaOffset = options.juliaOffset ?? { x: 0, y: 0, z: 0, w: 0 };
        
        // =====================================================================
        // TRANSFORM PARAMETERS
        // =====================================================================
        
        /** @type {{x: number, y: number, z: number}} Rotation angles (radians) */
        this.rotation = options.rotation ?? { x: 0, y: 0, z: 0 };
        
        /** @type {number} Global scale */
        this.scale = options.scale ?? 1.0;
        
        /** @type {{x: number, y: number, z: number}} Position offset */
        this.offset = options.offset ?? { x: 0, y: 0, z: 0 };
        
        // =====================================================================
        // FOLD PARAMETERS (for Mandelbox-type fractals)
        // =====================================================================
        
        /** @type {number} Box fold limit */
        this.foldLimit = options.foldLimit ?? 1.0;
        
        /** @type {number} Sphere fold minimum radius */
        this.minRadius = options.minRadius ?? 0.5;
        
        /** @type {number} Sphere fold fixed radius */
        this.fixedRadius = options.fixedRadius ?? 1.0;
        
        /** @type {number} Mandelbox scale factor */
        this.boxScale = options.boxScale ?? 2.0;
        
        // =====================================================================
        // COLORING PARAMETERS
        // =====================================================================
        
        /** @type {string} Coloring mode ('iteration', 'orbit', 'normal', 'ao') */
        this.colorMode = options.colorMode ?? 'iteration';
        
        /** @type {number} Color cycle frequency */
        this.colorFrequency = options.colorFrequency ?? 1.0;
        
        /** @type {number} Color offset */
        this.colorOffset = options.colorOffset ?? 0.0;
        
        /** @type {number} Orbit trap influence */
        this.orbitStrength = options.orbitStrength ?? 0.5;
        
        // =====================================================================
        // LIGHTING PARAMETERS
        // =====================================================================
        
        /** @type {{x: number, y: number, z: number}} Light direction */
        this.lightDirection = options.lightDirection ?? { x: 0.577, y: 0.577, z: -0.577 };
        
        /** @type {number} Ambient occlusion strength */
        this.aoStrength = options.aoStrength ?? 0.5;
        
        /** @type {number} Shadow softness */
        this.shadowSoftness = options.shadowSoftness ?? 8.0;
        
        /** @type {boolean} Enable soft shadows */
        this.enableShadows = options.enableShadows ?? true;
        
        /** @type {number} Specular highlight strength */
        this.specularStrength = options.specularStrength ?? 0.5;
        
        /** @type {number} Specular shininess */
        this.shininess = options.shininess ?? 32.0;
        
        // =====================================================================
        // QUALITY PARAMETERS
        // =====================================================================
        
        /** @type {number} Anti-aliasing samples (1, 2, or 4) */
        this.aaSamples = options.aaSamples ?? 1;
        
        /** @type {number} Detail level multiplier */
        this.detailLevel = options.detailLevel ?? 1.0;
        
        /** @type {boolean} Enable glow effect */
        this.enableGlow = options.enableGlow ?? false;
        
        /** @type {number} Glow intensity */
        this.glowIntensity = options.glowIntensity ?? 1.0;
        
        // =====================================================================
        // EXTRA PARAMETERS (fractal-specific)
        // =====================================================================
        
        /** @type {Object} Additional fractal-specific parameters */
        this.extra = options.extra ?? {};
    }

    /**
     * Clone parameters
     * @returns {Fractal3DParams}
     */
    clone() {
        return new Fractal3DParams({
            maxIterations: this.maxIterations,
            bailout: this.bailout,
            power: this.power,
            epsilon: this.epsilon,
            maxSteps: this.maxSteps,
            maxDistance: this.maxDistance,
            stepMultiplier: this.stepMultiplier,
            juliaMode: this.juliaMode,
            juliaOffset: { ...this.juliaOffset },
            rotation: { ...this.rotation },
            scale: this.scale,
            offset: { ...this.offset },
            foldLimit: this.foldLimit,
            minRadius: this.minRadius,
            fixedRadius: this.fixedRadius,
            boxScale: this.boxScale,
            colorMode: this.colorMode,
            colorFrequency: this.colorFrequency,
            colorOffset: this.colorOffset,
            orbitStrength: this.orbitStrength,
            lightDirection: { ...this.lightDirection },
            aoStrength: this.aoStrength,
            shadowSoftness: this.shadowSoftness,
            enableShadows: this.enableShadows,
            specularStrength: this.specularStrength,
            shininess: this.shininess,
            aaSamples: this.aaSamples,
            detailLevel: this.detailLevel,
            enableGlow: this.enableGlow,
            glowIntensity: this.glowIntensity,
            extra: { ...this.extra }
        });
    }

    /**
     * Convert to uniform object for shaders
     * @returns {Object}
     */
    toUniforms() {
        return {
            u_maxIterations: this.maxIterations,
            u_bailout: this.bailout,
            u_power: this.power,
            u_epsilon: this.epsilon,
            u_maxSteps: this.maxSteps,
            u_maxDistance: this.maxDistance,
            u_stepMultiplier: this.stepMultiplier,
            u_juliaMode: this.juliaMode ? 1.0 : 0.0,
            u_juliaOffset: [this.juliaOffset.x, this.juliaOffset.y, this.juliaOffset.z, this.juliaOffset.w],
            u_rotation: [this.rotation.x, this.rotation.y, this.rotation.z],
            u_scale: this.scale,
            u_offset: [this.offset.x, this.offset.y, this.offset.z],
            u_foldLimit: this.foldLimit,
            u_minRadius: this.minRadius,
            u_fixedRadius: this.fixedRadius,
            u_boxScale: this.boxScale,
            u_colorFrequency: this.colorFrequency,
            u_colorOffset: this.colorOffset,
            u_orbitStrength: this.orbitStrength,
            u_lightDirection: [this.lightDirection.x, this.lightDirection.y, this.lightDirection.z],
            u_aoStrength: this.aoStrength,
            u_shadowSoftness: this.shadowSoftness,
            u_enableShadows: this.enableShadows ? 1.0 : 0.0,
            u_specularStrength: this.specularStrength,
            u_shininess: this.shininess,
            u_enableGlow: this.enableGlow ? 1.0 : 0.0,
            u_glowIntensity: this.glowIntensity
        };
    }
}

// =============================================================================
// 3D FRACTAL BASE CLASS
// =============================================================================

/**
 * Abstract Base Class for 3D Raymarched Fractals
 * 
 * All 3D fractal types extend this class and implement:
 * - getDistanceEstimator(): Returns GLSL code for the DE function
 * - evaluateDE(p): CPU evaluation of distance at point p
 * - getDefaultParams(): Default parameter values
 * 
 * @abstract
 * @class Fractal3DBase
 */
export class Fractal3DBase {
    /**
     * Create 3D fractal instance
     * @param {Fractal3DParams} [params]
     */
    constructor(params = null) {
        /** @type {Fractal3DParams} */
        this.params = params || new Fractal3DParams(this.getDefaultParams());
        
        /** @type {Logger} */
        this.logger = new Logger(this.getName());
        
        /** @type {string|null} Cached shader code */
        this._shaderCache = null;
        
        /** @type {boolean} Shader needs recompilation */
        this._shaderDirty = true;
    }

    // =========================================================================
    // ABSTRACT METHODS (must be implemented by subclasses)
    // =========================================================================

    /**
     * Get unique identifier
     * @abstract
     * @returns {string}
     */
    getId() {
        throw new Error('getId() must be implemented');
    }

    /**
     * Get display name
     * @abstract
     * @returns {string}
     */
    getName() {
        throw new Error('getName() must be implemented');
    }

    /**
     * Get description
     * @returns {string}
     */
    getDescription() {
        return '';
    }

    /**
     * Get default parameters
     * @returns {Object}
     */
    getDefaultParams() {
        return {
            maxIterations: 15,
            bailout: 8.0,
            power: 8
        };
    }

    /**
     * Get GLSL distance estimator function
     * 
     * Must return GLSL code that defines:
     *   float DE(vec3 p) { ... }
     * 
     * @abstract
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        throw new Error('getDistanceEstimator() must be implemented');
    }

    /**
     * Evaluate distance estimation at a point (CPU version)
     * 
     * @abstract
     * @param {{x: number, y: number, z: number}} p - Point to evaluate
     * @returns {number} Distance estimate
     */
    evaluateDE(p) {
        throw new Error('evaluateDE() must be implemented');
    }

    // =========================================================================
    // COMMON METHODS
    // =========================================================================

    /**
     * Get default camera position
     * @returns {{position: {x, y, z}, target: {x, y, z}, up: {x, y, z}}}
     */
    getDefaultCamera() {
        return {
            position: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        };
    }

    /**
     * Get bounding box for the fractal
     * @returns {{min: {x, y, z}, max: {x, y, z}}}
     */
    getBoundingBox() {
        return {
            min: { x: -2, y: -2, z: -2 },
            max: { x: 2, y: 2, z: 2 }
        };
    }

    /**
     * Get available extra parameters
     * @returns {Array<{name: string, type: string, default: any, min?: number, max?: number, description: string}>}
     */
    getExtraParams() {
        return [];
    }

    /**
     * Check if this fractal supports Julia mode
     * @returns {boolean}
     */
    supportsJulia() {
        return true;
    }

    /**
     * Get formula description (for display)
     * @returns {string}
     */
    getFormula() {
        return 'DE(p)';
    }

    // =========================================================================
    // SHADER GENERATION
    // =========================================================================

    /**
     * Get complete fragment shader code
     * 
     * Combines:
     * - Common raymarching code
     * - Fractal-specific DE function
     * - Lighting and coloring
     * 
     * @returns {string}
     */
    getFragmentShader() {
        if (!this._shaderDirty && this._shaderCache) {
            return this._shaderCache;
        }

        const deFunction = this.getDistanceEstimator();
        const colorFunction = this.getColorFunction();
        
        this._shaderCache = `
precision highp float;

// =========================================================================
// UNIFORMS
// =========================================================================

uniform vec2 u_resolution;
uniform float u_time;
uniform mat4 u_cameraMatrix;
uniform vec3 u_cameraPosition;

// Fractal parameters
uniform int u_maxIterations;
uniform float u_bailout;
uniform float u_power;
uniform float u_epsilon;
uniform int u_maxSteps;
uniform float u_maxDistance;
uniform float u_stepMultiplier;

// Julia mode
uniform float u_juliaMode;
uniform vec4 u_juliaOffset;

// Transforms
uniform vec3 u_rotation;
uniform float u_scale;
uniform vec3 u_offset;

// Folds (Mandelbox)
uniform float u_foldLimit;
uniform float u_minRadius;
uniform float u_fixedRadius;
uniform float u_boxScale;

// Coloring
uniform float u_colorFrequency;
uniform float u_colorOffset;
uniform float u_orbitStrength;

// Lighting
uniform vec3 u_lightDirection;
uniform float u_aoStrength;
uniform float u_shadowSoftness;
uniform float u_enableShadows;
uniform float u_specularStrength;
uniform float u_shininess;
uniform float u_enableGlow;
uniform float u_glowIntensity;

// =========================================================================
// CONSTANTS
// =========================================================================

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

mat3 rotateZ(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

vec3 rotate(vec3 p, vec3 angles) {
    return rotateZ(angles.z) * rotateY(angles.y) * rotateX(angles.x) * p;
}

// =========================================================================
// DISTANCE ESTIMATOR (fractal-specific)
// =========================================================================

${deFunction}

// =========================================================================
// COLOR FUNCTION
// =========================================================================

${colorFunction}

// =========================================================================
// NORMAL ESTIMATION
// =========================================================================

vec3 calcNormal(vec3 p) {
    vec2 e = vec2(u_epsilon, 0.0);
    return normalize(vec3(
        DE(p + e.xyy) - DE(p - e.xyy),
        DE(p + e.yxy) - DE(p - e.yxy),
        DE(p + e.yyx) - DE(p - e.yyx)
    ));
}

// =========================================================================
// AMBIENT OCCLUSION
// =========================================================================

float calcAO(vec3 p, vec3 n) {
    float ao = 0.0;
    float scale = 1.0;
    
    for (int i = 0; i < 5; i++) {
        float dist = 0.01 + 0.12 * float(i);
        float d = DE(p + n * dist);
        ao += (dist - d) * scale;
        scale *= 0.75;
    }
    
    return clamp(1.0 - ao * u_aoStrength, 0.0, 1.0);
}

// =========================================================================
// SOFT SHADOWS
// =========================================================================

float calcShadow(vec3 ro, vec3 rd, float mint, float maxt) {
    if (u_enableShadows < 0.5) return 1.0;
    
    float res = 1.0;
    float t = mint;
    
    for (int i = 0; i < 64; i++) {
        if (t > maxt) break;
        
        float h = DE(ro + rd * t);
        
        if (h < u_epsilon * 0.1) return 0.0;
        
        res = min(res, u_shadowSoftness * h / t);
        t += clamp(h, 0.01, 0.2);
    }
    
    return clamp(res, 0.0, 1.0);
}

// =========================================================================
// RAYMARCHING
// =========================================================================

struct RayResult {
    bool hit;
    float t;
    int steps;
    float minDist;
    vec3 pos;
};

RayResult raymarch(vec3 ro, vec3 rd) {
    RayResult result;
    result.hit = false;
    result.t = 0.0;
    result.steps = 0;
    result.minDist = u_maxDistance;
    result.pos = ro;
    
    for (int i = 0; i < 512; i++) {
        if (i >= u_maxSteps) break;
        
        vec3 p = ro + rd * result.t;
        float d = DE(p);
        
        result.minDist = min(result.minDist, d);
        
        if (d < u_epsilon) {
            result.hit = true;
            result.pos = p;
            break;
        }
        
        if (result.t > u_maxDistance) break;
        
        result.t += d * u_stepMultiplier;
        result.steps = i;
    }
    
    return result;
}

// =========================================================================
// MAIN RENDERING
// =========================================================================

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    
    // Camera ray
    vec3 ro = u_cameraPosition;
    vec3 rd = normalize(vec3(uv, -1.5));
    rd = (u_cameraMatrix * vec4(rd, 0.0)).xyz;
    
    // Raymarch
    RayResult result = raymarch(ro, rd);
    
    vec3 col = vec3(0.0);
    
    if (result.hit) {
        vec3 p = result.pos;
        vec3 n = calcNormal(p);
        
        // Get base color
        col = getColor(p, n, result.steps);
        
        // Lighting
        vec3 lightDir = normalize(u_lightDirection);
        float diff = max(dot(n, lightDir), 0.0);
        float ao = calcAO(p, n);
        float shadow = calcShadow(p + n * u_epsilon * 2.0, lightDir, 0.01, 5.0);
        
        // Specular
        vec3 viewDir = normalize(ro - p);
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(n, halfDir), 0.0), u_shininess) * u_specularStrength;
        
        // Combine
        vec3 ambient = vec3(0.1) * ao;
        vec3 diffuse = col * diff * shadow;
        vec3 specular = vec3(1.0) * spec * shadow;
        
        col = ambient + diffuse + specular;
        
        // Fog
        float fog = exp(-result.t * 0.1);
        col = mix(vec3(0.0), col, fog);
    } else {
        // Background
        col = vec3(0.02, 0.02, 0.05);
        
        // Glow effect
        if (u_enableGlow > 0.5) {
            float glow = 1.0 / (1.0 + result.minDist * result.minDist * 100.0);
            col += vec3(0.3, 0.4, 0.6) * glow * u_glowIntensity;
        }
    }
    
    // Gamma correction
    col = pow(col, vec3(0.4545));
    
    gl_FragColor = vec4(col, 1.0);
}
`;

        this._shaderDirty = false;
        return this._shaderCache;
    }

    /**
     * Get vertex shader code
     * @returns {string}
     */
    getVertexShader() {
        return `
precision highp float;

attribute vec3 position;

void main() {
    gl_Position = vec4(position, 1.0);
}
`;
    }

    /**
     * Get color function GLSL code
     * Override in subclasses for custom coloring
     * @returns {string}
     */
    getColorFunction() {
        return `
vec3 getColor(vec3 p, vec3 n, int steps) {
    // Default iteration-based coloring
    float t = float(steps) / float(u_maxIterations);
    t = t * u_colorFrequency + u_colorOffset;
    
    // Rainbow palette
    vec3 col;
    col.r = 0.5 + 0.5 * cos(TAU * (t + 0.0));
    col.g = 0.5 + 0.5 * cos(TAU * (t + 0.33));
    col.b = 0.5 + 0.5 * cos(TAU * (t + 0.67));
    
    return col;
}
`;
    }

    /**
     * Mark shader as needing recompilation
     */
    invalidateShader() {
        this._shaderDirty = true;
    }

    // =========================================================================
    // PARAMETER MANAGEMENT
    // =========================================================================

    /**
     * Update parameters
     * @param {Object} newParams
     */
    setParams(newParams) {
        Object.assign(this.params, newParams);
        this.invalidateShader();
    }

    /**
     * Get current parameters
     * @returns {Fractal3DParams}
     */
    getParams() {
        return this.params;
    }

    /**
     * Reset to defaults
     */
    reset() {
        this.params = new Fractal3DParams(this.getDefaultParams());
        this.invalidateShader();
    }

    /**
     * Get uniform values for shaders
     * @returns {Object}
     */
    getUniforms() {
        return this.params.toUniforms();
    }

    // =========================================================================
    // CPU RAYMARCHING (for screenshots, etc.)
    // =========================================================================

    /**
     * CPU raymarch a single ray
     * 
     * @param {{x, y, z}} ro - Ray origin
     * @param {{x, y, z}} rd - Ray direction
     * @returns {{hit: boolean, t: number, steps: number, pos: {x, y, z}}}
     */
    raymarchCPU(ro, rd) {
        let t = 0;
        const maxSteps = this.params.maxSteps;
        const maxDist = this.params.maxDistance;
        const epsilon = this.params.epsilon;
        
        for (let i = 0; i < maxSteps; i++) {
            const p = {
                x: ro.x + rd.x * t,
                y: ro.y + rd.y * t,
                z: ro.z + rd.z * t
            };
            
            const d = this.evaluateDE(p);
            
            if (d < epsilon) {
                return { hit: true, t, steps: i, pos: p };
            }
            
            if (t > maxDist) break;
            
            t += d * this.params.stepMultiplier;
        }
        
        return { hit: false, t, steps: maxSteps, pos: null };
    }

    /**
     * Estimate normal at a point (CPU)
     * 
     * @param {{x, y, z}} p
     * @returns {{x, y, z}}
     */
    estimateNormalCPU(p) {
        const e = this.params.epsilon;
        
        const dx = this.evaluateDE({ x: p.x + e, y: p.y, z: p.z }) -
                   this.evaluateDE({ x: p.x - e, y: p.y, z: p.z });
        const dy = this.evaluateDE({ x: p.x, y: p.y + e, z: p.z }) -
                   this.evaluateDE({ x: p.x, y: p.y - e, z: p.z });
        const dz = this.evaluateDE({ x: p.x, y: p.y, z: p.z + e }) -
                   this.evaluateDE({ x: p.x, y: p.y, z: p.z - e });
        
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        return {
            x: dx / len,
            y: dy / len,
            z: dz / len
        };
    }

    // =========================================================================
    // METADATA
    // =========================================================================

    /**
     * Get metadata for this fractal
     * @returns {Object}
     */
    getMetadata() {
        return {
            id: this.getId(),
            name: this.getName(),
            description: this.getDescription(),
            formula: this.getFormula(),
            defaultParams: this.getDefaultParams(),
            defaultCamera: this.getDefaultCamera(),
            boundingBox: this.getBoundingBox(),
            supportsJulia: this.supportsJulia(),
            extraParams: this.getExtraParams()
        };
    }

    /**
     * Dispose resources
     */
    dispose() {
        this._shaderCache = null;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
    Fractal3DParams,
    Fractal3DBase,
    DEFAULT_MAX_ITERATIONS,
    DEFAULT_BAILOUT,
    DEFAULT_EPSILON,
    DEFAULT_MAX_STEPS,
    DEFAULT_MAX_DISTANCE
};

export default Fractal3DBase;
