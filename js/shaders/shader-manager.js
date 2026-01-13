/**
 * ============================================================================
 * ABYSS EXPLORER - SHADER MANAGER
 * ============================================================================
 * 
 * Shader compilation, management, and hot-swapping system for 3D fractals.
 * Handles GLSL string loading, uniform management, error checking, and
 * integration with the Three.js-based renderer.
 * 
 * Features:
 * - Shader compilation with error reporting
 * - Uniform management (camera, parameters, lighting)
 * - Hot-swap capability for live editing
 * - Shader caching and optimization
 * - Precompiled shader library
 * 
 * References:
 * - Three.js ShaderMaterial documentation
 * - Inigo Quilez's shader tutorials (iquilezles.org)
 * - Syntopia's distance estimator formulas
 * 
 * @module shaders/shader-manager
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// COMMON GLSL CODE
// ============================================================================

/**
 * Common GLSL header with precision and constants
 */
export const GLSL_HEADER = /* glsl */`
precision highp float;
precision highp int;

#define PI 3.14159265359
#define TAU 6.28318530718
#define E 2.71828182846
#define PHI 1.61803398875
#define SQRT2 1.41421356237
#define SQRT3 1.73205080757

#define MAX_STEPS 256
#define MAX_DIST 100.0
#define MIN_DIST 0.0001
#define NORMAL_EPS 0.0001

// Quality levels
#define QUALITY_LOW 0
#define QUALITY_MEDIUM 1
#define QUALITY_HIGH 2
#define QUALITY_ULTRA 3
`;

/**
 * Common uniforms for all fractal shaders
 */
export const COMMON_UNIFORMS = /* glsl */`
// Camera uniforms
uniform vec3 uCameraPos;
uniform vec3 uCameraTarget;
uniform vec3 uCameraUp;
uniform float uFov;
uniform float uAspect;
uniform float uNear;
uniform float uFar;

// Time and resolution
uniform float uTime;
uniform vec2 uResolution;

// Fractal parameters
uniform int uMaxIterations;
uniform float uBailout;
uniform float uPower;
uniform vec4 uJuliaC;
uniform bool uJuliaMode;

// Rendering quality
uniform int uQuality;
uniform float uEpsilon;
uniform int uMaxSteps;

// Lighting
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;
uniform float uShininess;
uniform bool uShadowsEnabled;
uniform float uShadowSoftness;

// Colors
uniform vec3 uBackgroundColor;
uniform vec3 uGlowColor;
uniform float uGlowIntensity;

// Effects
uniform bool uAOEnabled;
uniform float uAOIntensity;
uniform int uAOSteps;
uniform bool uFogEnabled;
uniform float uFogDensity;
uniform vec3 uFogColor;
`;

/**
 * Common GLSL utility functions
 */
export const GLSL_UTILS = /* glsl */`
// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Rotate 2D point
 */
mat2 rot2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

/**
 * Rodrigues rotation formula for 3D
 */
vec3 rotateAxis(vec3 p, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return p * c + cross(axis, p) * s + axis * dot(axis, p) * (1.0 - c);
}

/**
 * Safe normalize (avoids division by zero)
 */
vec3 safeNormalize(vec3 v) {
    float len = length(v);
    return len > 0.0 ? v / len : vec3(0.0, 1.0, 0.0);
}

/**
 * Polynomial smooth minimum
 * Reference: Inigo Quilez - https://iquilezles.org/articles/smin/
 */
float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
}

/**
 * Smooth maximum
 */
float smax(float a, float b, float k) {
    return -smin(-a, -b, k);
}

/**
 * Box signed distance function
 */
float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

/**
 * Sphere signed distance function
 */
float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

/**
 * Torus signed distance function
 */
float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

/**
 * Infinite cylinder
 */
float sdCylinder(vec3 p, vec2 h) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - h;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

/**
 * Hash function for pseudo-random numbers
 */
float hash(float n) {
    return fract(sin(n) * 43758.5453123);
}

/**
 * 3D hash
 */
float hash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

/**
 * Value noise
 */
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = i.x + i.y * 157.0 + 113.0 * i.z;
    return mix(
        mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y),
        f.z
    );
}

/**
 * Fractal Brownian Motion
 */
float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    return value;
}

/**
 * Orbit trap coloring helper
 */
vec3 orbitTrapColor(vec3 trapped, float minDist) {
    return trapped / (1.0 + minDist * minDist);
}

/**
 * Linear interpolation for colors
 */
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(TAU * (c * t + d));
}
`;

/**
 * Ray marching core
 */
export const RAYMARCHING_CORE = /* glsl */`
// ============================================================================
// RAY MARCHING CORE
// ============================================================================

/**
 * Calculate ray direction for current pixel
 */
vec3 calcRayDir(vec2 uv, vec3 ro, vec3 ta, vec3 up, float fov) {
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, up));
    vec3 vv = normalize(cross(uu, ww));
    
    float fovScale = tan(fov * 0.5);
    return normalize(uv.x * uu * fovScale * uAspect + uv.y * vv * fovScale + ww);
}

/**
 * Ray march the scene
 * @param ro Ray origin
 * @param rd Ray direction
 * @returns vec4(distance, iterations, trap1, trap2)
 */
vec4 rayMarch(vec3 ro, vec3 rd) {
    float t = 0.0;
    float minDist = MAX_DIST;
    float trap1 = 0.0;
    float trap2 = 0.0;
    
    int steps = uQuality == QUALITY_ULTRA ? 512 : 
                (uQuality == QUALITY_HIGH ? 384 : 
                (uQuality == QUALITY_MEDIUM ? 256 : 128));
    
    float eps = uQuality == QUALITY_ULTRA ? 0.00001 :
                (uQuality == QUALITY_HIGH ? 0.0001 :
                (uQuality == QUALITY_MEDIUM ? 0.0005 : 0.001));
    
    for (int i = 0; i < 512; i++) {
        if (i >= steps) break;
        
        vec3 p = ro + rd * t;
        
        vec4 res = map(p);
        float d = res.x;
        
        // Update orbit traps
        if (d < minDist) {
            minDist = d;
            trap1 = res.y;
            trap2 = res.z;
        }
        
        // Hit surface
        if (d < eps * t) {
            return vec4(t, float(i), trap1, trap2);
        }
        
        // Too far or behind
        if (t > MAX_DIST) break;
        
        // Step forward with adaptive stepping
        t += d * 0.9; // Slight understep for stability
    }
    
    return vec4(-1.0, float(steps), trap1, trap2);
}

/**
 * Calculate surface normal using central differences
 */
vec3 calcNormal(vec3 p) {
    float eps = NORMAL_EPS;
    vec2 e = vec2(eps, 0.0);
    
    return normalize(vec3(
        map(p + e.xyy).x - map(p - e.xyy).x,
        map(p + e.yxy).x - map(p - e.yxy).x,
        map(p + e.yyx).x - map(p - e.yyx).x
    ));
}

/**
 * Calculate normal using tetrahedron technique (more accurate)
 * Reference: Inigo Quilez
 */
vec3 calcNormalTet(vec3 p) {
    float eps = NORMAL_EPS;
    const vec2 k = vec2(1.0, -1.0);
    
    return normalize(
        k.xyy * map(p + k.xyy * eps).x +
        k.yyx * map(p + k.yyx * eps).x +
        k.yxy * map(p + k.yxy * eps).x +
        k.xxx * map(p + k.xxx * eps).x
    );
}
`;

// ============================================================================
// VERTEX SHADER
// ============================================================================

export const VERTEX_SHADER = /* glsl */`
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Full-screen quad vertex shader
 */
export const FULLSCREEN_VERTEX = /* glsl */`
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// ============================================================================
// SHADER MANAGER CLASS
// ============================================================================

/**
 * Manages shader compilation, caching, and uniform updates
 */
export class ShaderManager {
    /**
     * Create shader manager
     * @param {Object} renderer - Three.js renderer
     */
    constructor(renderer) {
        this.renderer = renderer;
        this.gl = renderer?.getContext();
        
        // Shader cache
        this.shaderCache = new Map();
        this.programCache = new Map();
        
        // Uniform buffers
        this.uniforms = this._createDefaultUniforms();
        
        // Error log
        this.errors = [];
        
        // Registered shader sources
        this.shaderSources = new Map();
    }
    
    /**
     * Create default uniforms
     * @private
     */
    _createDefaultUniforms() {
        return {
            // Camera
            uCameraPos: { value: new Float32Array([0, 0, 3]) },
            uCameraTarget: { value: new Float32Array([0, 0, 0]) },
            uCameraUp: { value: new Float32Array([0, 1, 0]) },
            uFov: { value: Math.PI / 3 },
            uAspect: { value: 1.0 },
            uNear: { value: 0.01 },
            uFar: { value: 100.0 },
            
            // Time and resolution
            uTime: { value: 0.0 },
            uResolution: { value: new Float32Array([1920, 1080]) },
            
            // Fractal parameters
            uMaxIterations: { value: 10 },
            uBailout: { value: 2.0 },
            uPower: { value: 8.0 },
            uJuliaC: { value: new Float32Array([0, 0, 0, 0]) },
            uJuliaMode: { value: false },
            
            // Rendering quality
            uQuality: { value: 1 },
            uEpsilon: { value: 0.0001 },
            uMaxSteps: { value: 256 },
            
            // Lighting
            uLightDir: { value: new Float32Array([1, 1, 1]) },
            uLightColor: { value: new Float32Array([1, 1, 1]) },
            uAmbient: { value: 0.2 },
            uDiffuse: { value: 0.8 },
            uSpecular: { value: 0.5 },
            uShininess: { value: 32.0 },
            uShadowsEnabled: { value: true },
            uShadowSoftness: { value: 16.0 },
            
            // Colors
            uBackgroundColor: { value: new Float32Array([0.05, 0.05, 0.1]) },
            uGlowColor: { value: new Float32Array([1, 0.5, 0.2]) },
            uGlowIntensity: { value: 0.5 },
            
            // Effects
            uAOEnabled: { value: true },
            uAOIntensity: { value: 0.5 },
            uAOSteps: { value: 5 },
            uFogEnabled: { value: true },
            uFogDensity: { value: 0.1 },
            uFogColor: { value: new Float32Array([0.1, 0.1, 0.15]) }
        };
    }
    
    /**
     * Register a shader source
     * @param {string} name - Shader name
     * @param {Object} source - { vertex, fragment } GLSL strings
     */
    registerShader(name, source) {
        this.shaderSources.set(name, source);
    }
    
    /**
     * Compile shader from source
     * @param {string} source - GLSL source code
     * @param {number} type - gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     * @returns {WebGLShader|null}
     */
    compileShader(source, type) {
        if (!this.gl) return null;
        
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const error = this.gl.getShaderInfoLog(shader);
            this.errors.push({
                type: type === this.gl.VERTEX_SHADER ? 'vertex' : 'fragment',
                error,
                source
            });
            console.error('Shader compilation error:', error);
            this.gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    /**
     * Create shader program
     * @param {string} vertexSource - Vertex shader GLSL
     * @param {string} fragmentSource - Fragment shader GLSL
     * @returns {WebGLProgram|null}
     */
    createProgram(vertexSource, fragmentSource) {
        if (!this.gl) return null;
        
        const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) return null;
        
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            const error = this.gl.getProgramInfoLog(program);
            this.errors.push({ type: 'link', error });
            console.error('Program linking error:', error);
            return null;
        }
        
        // Clean up individual shaders
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
        
        return program;
    }
    
    /**
     * Get or create cached program
     * @param {string} name - Shader name
     * @returns {WebGLProgram|null}
     */
    getProgram(name) {
        if (this.programCache.has(name)) {
            return this.programCache.get(name);
        }
        
        const source = this.shaderSources.get(name);
        if (!source) {
            console.error(`Shader not found: ${name}`);
            return null;
        }
        
        const program = this.createProgram(source.vertex, source.fragment);
        if (program) {
            this.programCache.set(name, program);
        }
        
        return program;
    }
    
    /**
     * Build complete fragment shader
     * @param {string} distanceEstimator - DE function GLSL
     * @param {Object} options - Shader options
     * @returns {string} Complete fragment shader
     */
    buildFragmentShader(distanceEstimator, options = {}) {
        const {
            lighting = true,
            ao = true,
            shadows = true,
            fog = true,
            glow = true
        } = options;
        
        return /* glsl */`
${GLSL_HEADER}
${COMMON_UNIFORMS}
${GLSL_UTILS}

varying vec2 vUv;

// Distance estimator function (fractal-specific)
${distanceEstimator}

${RAYMARCHING_CORE}

// ============================================================================
// LIGHTING AND EFFECTS
// ============================================================================

${lighting ? `
/**
 * Calculate soft shadows
 * Reference: Inigo Quilez - https://iquilezles.org/articles/rmshadows/
 */
float calcSoftShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    float t = mint;
    
    for (int i = 0; i < 64; i++) {
        if (t > maxt) break;
        
        float h = map(ro + rd * t).x;
        res = min(res, k * h / t);
        
        if (res < 0.001) break;
        
        t += clamp(h, 0.01, 0.2);
    }
    
    return clamp(res, 0.0, 1.0);
}

/**
 * Calculate ambient occlusion
 */
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

/**
 * Apply Phong lighting model
 */
vec3 applyLighting(vec3 pos, vec3 nor, vec3 rd, vec3 col) {
    vec3 lightDir = normalize(uLightDir);
    
    // Ambient
    vec3 ambient = uAmbient * col;
    
    // Diffuse
    float diff = max(dot(nor, lightDir), 0.0);
    vec3 diffuse = uDiffuse * diff * col * uLightColor;
    
    // Specular (Blinn-Phong)
    vec3 halfDir = normalize(lightDir - rd);
    float spec = pow(max(dot(nor, halfDir), 0.0), uShininess);
    vec3 specular = uSpecular * spec * uLightColor;
    
    vec3 result = ambient + diffuse + specular;
    
    ${shadows ? `
    // Soft shadows
    if (uShadowsEnabled) {
        float shadow = calcSoftShadow(pos + nor * 0.002, lightDir, 0.01, 10.0, uShadowSoftness);
        result = ambient + (diffuse + specular) * shadow;
    }
    ` : ''}
    
    ${ao ? `
    // Ambient occlusion
    if (uAOEnabled) {
        float ao = calcAO(pos, nor);
        result *= mix(1.0, ao, uAOIntensity);
    }
    ` : ''}
    
    return result;
}
` : ''}

${fog ? `
/**
 * Apply exponential fog
 */
vec3 applyFog(vec3 col, float dist) {
    if (!uFogEnabled) return col;
    
    float fogAmount = 1.0 - exp(-dist * uFogDensity);
    return mix(col, uFogColor, fogAmount);
}
` : ''}

${glow ? `
/**
 * Apply glow effect based on ray march iterations
 */
vec3 applyGlow(vec3 col, float iterations, float maxIterations) {
    float glowAmount = iterations / maxIterations;
    glowAmount = pow(glowAmount, 2.0);
    return col + uGlowColor * glowAmount * uGlowIntensity;
}
` : ''}

// ============================================================================
// MAIN RENDER FUNCTION
// ============================================================================

void main() {
    // Normalized coordinates (-1 to 1)
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Camera setup
    vec3 ro = uCameraPos;
    vec3 ta = uCameraTarget;
    vec3 up = uCameraUp;
    
    // Calculate ray direction
    vec3 rd = calcRayDir(uv, ro, ta, up, uFov);
    
    // Ray march
    vec4 res = rayMarch(ro, rd);
    float t = res.x;
    float iterations = res.y;
    
    vec3 col;
    
    if (t > 0.0) {
        // Hit - calculate position and normal
        vec3 pos = ro + rd * t;
        vec3 nor = calcNormal(pos);
        
        // Base color from orbit traps
        vec3 baseCol = palette(
            res.z * 0.5 + res.w * 0.3,
            vec3(0.5), vec3(0.5),
            vec3(1.0, 0.7, 0.4),
            vec3(0.0, 0.15, 0.2)
        );
        
        ${lighting ? `
        // Apply lighting
        col = applyLighting(pos, nor, rd, baseCol);
        ` : `
        col = baseCol;
        `}
        
        ${fog ? `
        // Apply fog
        col = applyFog(col, t);
        ` : ''}
    } else {
        // Miss - background
        col = uBackgroundColor;
        
        ${glow ? `
        // Apply glow from near-misses
        col = applyGlow(col, iterations, float(uMaxSteps));
        ` : ''}
    }
    
    // Gamma correction
    col = pow(col, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(col, 1.0);
}
`;
    }
    
    /**
     * Update uniform value
     * @param {string} name - Uniform name
     * @param {*} value - New value
     */
    setUniform(name, value) {
        if (this.uniforms[name]) {
            this.uniforms[name].value = value;
        }
    }
    
    /**
     * Update multiple uniforms
     * @param {Object} values - { name: value } pairs
     */
    setUniforms(values) {
        for (const [name, value] of Object.entries(values)) {
            this.setUniform(name, value);
        }
    }
    
    /**
     * Update camera uniforms
     * @param {Object} camera - Camera state
     */
    updateCamera(camera) {
        this.setUniforms({
            uCameraPos: camera.position,
            uCameraTarget: camera.target,
            uCameraUp: camera.up || [0, 1, 0],
            uFov: camera.fov || Math.PI / 3,
            uAspect: camera.aspect || 1.0
        });
    }
    
    /**
     * Update fractal parameters
     * @param {Object} params - Fractal parameters
     */
    updateFractalParams(params) {
        if (params.power !== undefined) this.setUniform('uPower', params.power);
        if (params.bailout !== undefined) this.setUniform('uBailout', params.bailout);
        if (params.maxIterations !== undefined) this.setUniform('uMaxIterations', params.maxIterations);
        if (params.juliaC !== undefined) this.setUniform('uJuliaC', params.juliaC);
        if (params.juliaMode !== undefined) this.setUniform('uJuliaMode', params.juliaMode);
    }
    
    /**
     * Update lighting parameters
     * @param {Object} lighting - Lighting parameters
     */
    updateLighting(lighting) {
        if (lighting.direction) this.setUniform('uLightDir', lighting.direction);
        if (lighting.color) this.setUniform('uLightColor', lighting.color);
        if (lighting.ambient !== undefined) this.setUniform('uAmbient', lighting.ambient);
        if (lighting.diffuse !== undefined) this.setUniform('uDiffuse', lighting.diffuse);
        if (lighting.specular !== undefined) this.setUniform('uSpecular', lighting.specular);
        if (lighting.shininess !== undefined) this.setUniform('uShininess', lighting.shininess);
        if (lighting.shadowsEnabled !== undefined) this.setUniform('uShadowsEnabled', lighting.shadowsEnabled);
        if (lighting.shadowSoftness !== undefined) this.setUniform('uShadowSoftness', lighting.shadowSoftness);
    }
    
    /**
     * Update time uniform
     * @param {number} time - Current time
     */
    updateTime(time) {
        this.setUniform('uTime', time);
    }
    
    /**
     * Update resolution uniform
     * @param {number} width
     * @param {number} height
     */
    updateResolution(width, height) {
        this.setUniform('uResolution', [width, height]);
        this.setUniform('uAspect', width / height);
    }
    
    /**
     * Set quality level
     * @param {number} quality - 0=LOW, 1=MEDIUM, 2=HIGH, 3=ULTRA
     */
    setQuality(quality) {
        this.setUniform('uQuality', quality);
        
        // Adjust dependent parameters
        const settings = [
            { epsilon: 0.001, maxSteps: 128 },   // LOW
            { epsilon: 0.0005, maxSteps: 256 },  // MEDIUM
            { epsilon: 0.0001, maxSteps: 384 },  // HIGH
            { epsilon: 0.00001, maxSteps: 512 }  // ULTRA
        ][quality];
        
        this.setUniforms(settings);
    }
    
    /**
     * Get uniforms for Three.js material
     * @returns {Object} Uniforms object
     */
    getThreeUniforms() {
        return { ...this.uniforms };
    }
    
    /**
     * Clear error log
     */
    clearErrors() {
        this.errors = [];
    }
    
    /**
     * Get compilation errors
     * @returns {Array}
     */
    getErrors() {
        return [...this.errors];
    }
    
    /**
     * Dispose of resources
     */
    dispose() {
        if (this.gl) {
            for (const program of this.programCache.values()) {
                this.gl.deleteProgram(program);
            }
        }
        this.programCache.clear();
        this.shaderCache.clear();
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let shaderManagerInstance = null;

/**
 * Get or create shader manager instance
 * @param {Object} renderer - Three.js renderer
 * @returns {ShaderManager}
 */
export function getShaderManager(renderer) {
    if (!shaderManagerInstance || renderer) {
        shaderManagerInstance = new ShaderManager(renderer);
    }
    return shaderManagerInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    GLSL_HEADER,
    COMMON_UNIFORMS,
    GLSL_UTILS,
    RAYMARCHING_CORE,
    VERTEX_SHADER,
    FULLSCREEN_VERTEX
};

export default ShaderManager;
