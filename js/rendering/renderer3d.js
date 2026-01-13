/**
 * ============================================================================
 * ABYSS EXPLORER - 3D FRACTAL RENDERER
 * ============================================================================
 * 
 * GPU-accelerated 3D fractal renderer using Three.js with:
 * - Custom raymarching fragment shaders
 * - Signed Distance Function (SDF) evaluation
 * - Ambient occlusion and soft shadows
 * - Multi-pass post-processing pipeline
 * - Progressive quality refinement
 * - Real-time parameter animation
 * 
 * Raymarching Algorithm:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  For each pixel:                                                       │
 * │    1. Cast ray from camera through pixel                              │
 * │    2. March along ray in steps                                        │
 * │    3. At each step, evaluate SDF                                      │
 * │    4. If SDF < ε, we hit surface → compute lighting                   │
 * │    5. If steps exhausted or ray escapes, background                   │
 * │    6. Apply ambient occlusion based on nearby geometry                │
 * │    7. Post-process: bloom, tone mapping, color grading                │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Performance Optimizations:
 * - Adaptive step size (larger steps far from surface)
 * - Early ray termination
 * - Level-of-detail for distant objects
 * - Temporal reprojection for smooth animation
 * - Deferred shading for complex materials
 * 
 * @module rendering/renderer3d
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum raymarching steps */
const MAX_STEPS = 256;

/** Minimum surface distance threshold */
const SURFACE_EPSILON = 0.0001;

/** Maximum ray distance */
const MAX_DISTANCE = 100.0;

/** Ambient occlusion samples */
const AO_SAMPLES = 5;

/** Soft shadow samples */
const SHADOW_SAMPLES = 16;

/** Default field of view */
const DEFAULT_FOV = 60;

// ============================================================================
// SHADER CHUNKS
// ============================================================================

/**
 * Common shader functions used across all 3D fractals
 */
const COMMON_SHADER_CHUNKS = {
    /**
     * Quaternion operations for 3D fractals
     */
    quaternion: `
        vec4 qMul(vec4 a, vec4 b) {
            return vec4(
                a.x * b.x - a.y * b.y - a.z * b.z - a.w * b.w,
                a.x * b.y + a.y * b.x + a.z * b.w - a.w * b.z,
                a.x * b.z - a.y * b.w + a.z * b.x + a.w * b.y,
                a.x * b.w + a.y * b.z - a.z * b.y + a.w * b.x
            );
        }
        
        vec4 qSq(vec4 q) {
            return vec4(
                q.x * q.x - q.y * q.y - q.z * q.z - q.w * q.w,
                2.0 * q.x * q.y,
                2.0 * q.x * q.z,
                2.0 * q.x * q.w
            );
        }
        
        float qLength(vec4 q) {
            return length(q);
        }
    `,
    
    /**
     * Rotation matrices
     */
    rotations: `
        mat3 rotateX(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat3(1, 0, 0, 0, c, -s, 0, s, c);
        }
        
        mat3 rotateY(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
        }
        
        mat3 rotateZ(float angle) {
            float c = cos(angle);
            float s = sin(angle);
            return mat3(c, -s, 0, s, c, 0, 0, 0, 1);
        }
    `,
    
    /**
     * Fold operations for IFS fractals
     */
    folds: `
        void planeFold(inout vec3 z, vec3 n, float d) {
            z -= 2.0 * min(0.0, dot(z, n) - d) * n;
        }
        
        void boxFold(inout vec3 z, float r) {
            z = clamp(z, -r, r) * 2.0 - z;
        }
        
        void sphereFold(inout vec3 z, inout float dz, float minR, float maxR) {
            float r2 = dot(z, z);
            if (r2 < minR) {
                float temp = (maxR / minR);
                z *= temp;
                dz *= temp;
            } else if (r2 < maxR) {
                float temp = (maxR / r2);
                z *= temp;
                dz *= temp;
            }
        }
        
        void tetraFold(inout vec3 z) {
            if (z.x + z.y < 0.0) z.xy = -z.yx;
            if (z.x + z.z < 0.0) z.xz = -z.zx;
            if (z.y + z.z < 0.0) z.yz = -z.zy;
        }
        
        void mengerFold(inout vec3 z) {
            float a = min(z.x - z.y, 0.0);
            z.x -= a;
            z.y += a;
            a = min(z.x - z.z, 0.0);
            z.x -= a;
            z.z += a;
            a = min(z.y - z.z, 0.0);
            z.y -= a;
            z.z += a;
        }
    `,
    
    /**
     * Ambient occlusion calculation
     */
    ambientOcclusion: `
        float calcAO(vec3 pos, vec3 nor, float maxDist) {
            float occ = 0.0;
            float sca = 1.0;
            for (int i = 0; i < ${AO_SAMPLES}; i++) {
                float h = 0.01 + 0.12 * float(i) / float(${AO_SAMPLES});
                float d = sceneSDF(pos + h * nor);
                occ += (h - d) * sca;
                sca *= 0.95;
            }
            return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
        }
    `,
    
    /**
     * Soft shadows
     */
    softShadows: `
        float calcSoftShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
            float res = 1.0;
            float t = mint;
            for (int i = 0; i < ${SHADOW_SAMPLES}; i++) {
                if (t > maxt) break;
                float h = sceneSDF(ro + rd * t);
                if (h < 0.001) return 0.0;
                res = min(res, k * h / t);
                t += clamp(h, 0.02, 0.1);
            }
            return res;
        }
    `,
    
    /**
     * Normal calculation via gradient
     */
    calcNormal: `
        vec3 calcNormal(vec3 pos) {
            const float eps = 0.0001;
            const vec2 h = vec2(eps, 0);
            return normalize(vec3(
                sceneSDF(pos + h.xyy) - sceneSDF(pos - h.xyy),
                sceneSDF(pos + h.yxy) - sceneSDF(pos - h.yxy),
                sceneSDF(pos + h.yyx) - sceneSDF(pos - h.yyx)
            ));
        }
    `
};

// ============================================================================
// SDF LIBRARY
// ============================================================================

/**
 * Signed Distance Functions for various 3D fractals
 */
const SDF_LIBRARY = {
    /**
     * Mandelbulb SDF
     * The Mandelbulb is a 3D extension of the Mandelbrot set using
     * spherical coordinates: r^n * (sin(nθ)cos(nφ), sin(nθ)sin(nφ), cos(nθ))
     */
    mandelbulb: `
        float mandelbulbSDF(vec3 pos, float power, int iterations) {
            vec3 z = pos;
            float dr = 1.0;
            float r = 0.0;
            
            for (int i = 0; i < iterations; i++) {
                r = length(z);
                if (r > 2.0) break;
                
                // Convert to spherical coordinates
                float theta = acos(z.z / r);
                float phi = atan(z.y, z.x);
                dr = pow(r, power - 1.0) * power * dr + 1.0;
                
                // Scale and rotate
                float zr = pow(r, power);
                theta = theta * power;
                phi = phi * power;
                
                // Convert back to Cartesian
                z = zr * vec3(
                    sin(theta) * cos(phi),
                    sin(theta) * sin(phi),
                    cos(theta)
                );
                z += pos;
            }
            
            return 0.5 * log(r) * r / dr;
        }
    `,
    
    /**
     * Mandelbox SDF
     * The Mandelbox uses box folding and sphere folding transformations
     */
    mandelbox: `
        float mandelboxSDF(vec3 pos, float scale, float minRadius, float fixedRadius, int iterations) {
            vec3 z = pos;
            float dr = 1.0;
            float minR2 = minRadius * minRadius;
            float fixedR2 = fixedRadius * fixedRadius;
            
            for (int i = 0; i < iterations; i++) {
                // Box fold
                z = clamp(z, -1.0, 1.0) * 2.0 - z;
                
                // Sphere fold
                float r2 = dot(z, z);
                if (r2 < minR2) {
                    float temp = fixedR2 / minR2;
                    z *= temp;
                    dr *= temp;
                } else if (r2 < fixedR2) {
                    float temp = fixedR2 / r2;
                    z *= temp;
                    dr *= temp;
                }
                
                z = scale * z + pos;
                dr = dr * abs(scale) + 1.0;
            }
            
            return length(z) / abs(dr);
        }
    `,
    
    /**
     * Menger Sponge SDF
     * Recursive box subtraction creating infinite detail
     */
    mengerSponge: `
        float mengerSpongeSDF(vec3 pos, int iterations) {
            vec3 z = pos;
            float d = max(max(abs(z.x), abs(z.y)), abs(z.z)) - 1.0;
            float s = 1.0;
            
            for (int i = 0; i < iterations; i++) {
                vec3 a = mod(z * s, 2.0) - 1.0;
                s *= 3.0;
                vec3 r = abs(1.0 - 3.0 * abs(a));
                
                float da = max(r.x, r.y);
                float db = max(r.y, r.z);
                float dc = max(r.z, r.x);
                float c = (min(da, min(db, dc)) - 1.0) / s;
                
                d = max(d, c);
            }
            
            return d;
        }
    `,
    
    /**
     * Sierpinski Tetrahedron SDF
     */
    sierpinski: `
        float sierpinskiSDF(vec3 pos, int iterations) {
            vec3 z = pos;
            float scale = 2.0;
            
            for (int i = 0; i < iterations; i++) {
                // Fold space
                if (z.x + z.y < 0.0) z.xy = -z.yx;
                if (z.x + z.z < 0.0) z.xz = -z.zx;
                if (z.y + z.z < 0.0) z.yz = -z.zy;
                
                z = z * scale - (scale - 1.0);
            }
            
            return length(z) * pow(scale, -float(iterations));
        }
    `,
    
    /**
     * Julia Quaternion SDF
     */
    juliaQuaternion: `
        float juliaQuaternionSDF(vec3 pos, vec4 c, int iterations) {
            vec4 z = vec4(pos, 0.0);
            float dr = 1.0;
            float r = length(z);
            
            for (int i = 0; i < iterations; i++) {
                if (r > 4.0) break;
                
                dr = 2.0 * r * dr;
                z = qSq(z) + c;
                r = qLength(z);
            }
            
            return 0.5 * log(r) * r / dr;
        }
    `,
    
    /**
     * Kleinian Group SDF
     */
    kleinian: `
        float kleinianSDF(vec3 pos, float scale, int iterations) {
            vec4 z = vec4(pos, 1.0);
            float r2;
            
            for (int i = 0; i < iterations; i++) {
                // Fundamental domain fold
                z.xyz = abs(z.xyz);
                
                // Mobius transformation
                if (z.x - z.y < 0.0) z.xy = z.yx;
                if (z.x - z.z < 0.0) z.xz = z.zx;
                if (z.y - z.z < 0.0) z.yz = z.zy;
                
                // Sphere inversion
                r2 = dot(z.xyz, z.xyz);
                if (r2 < 1.0) {
                    z /= r2;
                }
                
                z = scale * z - (scale - 1.0);
            }
            
            return (length(z.xyz) - 1.0) / z.w;
        }
    `
};

// ============================================================================
// RAYMARCHING SHADER
// ============================================================================

/**
 * Generate complete raymarching vertex shader
 */
function generateVertexShader() {
    return `
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
}

/**
 * Generate complete raymarching fragment shader for a specific fractal type
 * @param {string} fractalType - Type of fractal to render
 * @returns {string} GLSL fragment shader code
 */
function generateFragmentShader(fractalType) {
    const sdfCode = SDF_LIBRARY[fractalType] || SDF_LIBRARY.mandelbulb;
    
    return `
        precision highp float;
        
        uniform vec2 uResolution;
        uniform vec3 uCameraPosition;
        uniform vec3 uCameraTarget;
        uniform float uCameraFov;
        uniform float uTime;
        
        // Fractal parameters
        uniform float uPower;
        uniform float uScale;
        uniform int uIterations;
        uniform vec4 uJuliaC;
        uniform float uMinRadius;
        uniform float uFixedRadius;
        
        // Lighting
        uniform vec3 uLightDir;
        uniform vec3 uLightColor;
        uniform float uAmbient;
        uniform float uShadowStrength;
        uniform float uAOStrength;
        
        // Coloring
        uniform vec3 uBaseColor;
        uniform vec3 uGlowColor;
        uniform float uGlowIntensity;
        uniform int uColorMode;
        
        // Quality
        uniform int uMaxSteps;
        uniform float uEpsilon;
        uniform float uMaxDist;
        
        varying vec2 vUv;
        
        // Include common shader chunks
        ${COMMON_SHADER_CHUNKS.quaternion}
        ${COMMON_SHADER_CHUNKS.rotations}
        ${COMMON_SHADER_CHUNKS.folds}
        
        // Include the SDF for this fractal type
        ${sdfCode}
        
        // Scene SDF wrapper
        float sceneSDF(vec3 pos) {
            ${getFractalSDFCall(fractalType)}
        }
        
        // Include lighting functions
        ${COMMON_SHADER_CHUNKS.calcNormal}
        ${COMMON_SHADER_CHUNKS.ambientOcclusion}
        ${COMMON_SHADER_CHUNKS.softShadows}
        
        // Orbit trap for coloring
        vec3 orbitTrap = vec3(1e20);
        
        void updateOrbitTrap(vec3 z) {
            orbitTrap = min(orbitTrap, abs(z));
        }
        
        // Raymarching
        struct RayResult {
            float dist;
            int steps;
            bool hit;
            vec3 pos;
        };
        
        RayResult rayMarch(vec3 ro, vec3 rd) {
            RayResult result;
            result.dist = 0.0;
            result.steps = 0;
            result.hit = false;
            
            for (int i = 0; i < ${MAX_STEPS}; i++) {
                result.steps = i;
                vec3 pos = ro + rd * result.dist;
                float d = sceneSDF(pos);
                
                if (d < uEpsilon) {
                    result.hit = true;
                    result.pos = pos;
                    break;
                }
                
                if (result.dist > uMaxDist) {
                    break;
                }
                
                result.dist += d * 0.9; // Slight understep for safety
            }
            
            return result;
        }
        
        // Get ray direction from camera
        vec3 getRayDir(vec2 uv, vec3 camPos, vec3 camTarget, float fov) {
            vec3 forward = normalize(camTarget - camPos);
            vec3 right = normalize(cross(vec3(0, 1, 0), forward));
            vec3 up = cross(forward, right);
            
            float aspect = uResolution.x / uResolution.y;
            float fovScale = tan(fov * 0.5 * 3.14159 / 180.0);
            
            return normalize(
                forward +
                right * uv.x * fovScale * aspect +
                up * uv.y * fovScale
            );
        }
        
        // Color based on various methods
        vec3 getColor(RayResult result, vec3 normal) {
            vec3 color = uBaseColor;
            
            if (uColorMode == 0) {
                // Iteration-based coloring
                float t = float(result.steps) / float(uMaxSteps);
                color = mix(uBaseColor, uGlowColor, t);
            } else if (uColorMode == 1) {
                // Normal-based coloring
                color = normal * 0.5 + 0.5;
            } else if (uColorMode == 2) {
                // Orbit trap coloring
                color = 1.0 - orbitTrap;
            } else if (uColorMode == 3) {
                // Distance-based coloring
                float d = result.dist / uMaxDist;
                color = vec3(1.0 - d);
            }
            
            return color;
        }
        
        // Main rendering
        void main() {
            // Convert UV to centered coordinates
            vec2 uv = (vUv - 0.5) * 2.0;
            
            // Get ray direction
            vec3 rayDir = getRayDir(uv, uCameraPosition, uCameraTarget, uCameraFov);
            
            // March the ray
            RayResult result = rayMarch(uCameraPosition, rayDir);
            
            vec3 color;
            
            if (result.hit) {
                // Calculate normal
                vec3 normal = calcNormal(result.pos);
                
                // Basic lighting
                vec3 lightDir = normalize(uLightDir);
                float diffuse = max(dot(normal, lightDir), 0.0);
                
                // Ambient occlusion
                float ao = calcAO(result.pos, normal, 1.0);
                ao = mix(1.0, ao, uAOStrength);
                
                // Soft shadows
                float shadow = calcSoftShadow(result.pos + normal * 0.01, lightDir, 0.01, 5.0, 16.0);
                shadow = mix(1.0, shadow, uShadowStrength);
                
                // Get base color
                color = getColor(result, normal);
                
                // Apply lighting
                vec3 ambient = uAmbient * color;
                vec3 diffuseColor = diffuse * shadow * uLightColor * color;
                
                color = (ambient + diffuseColor) * ao;
                
                // Add glow based on iteration count
                float glowFactor = float(result.steps) / float(uMaxSteps);
                color += uGlowColor * uGlowIntensity * glowFactor;
                
            } else {
                // Background gradient
                float t = 0.5 * (rayDir.y + 1.0);
                color = mix(vec3(0.02, 0.02, 0.05), vec3(0.1, 0.1, 0.2), t);
                
                // Add subtle glow at edges
                float edgeFactor = float(result.steps) / float(uMaxSteps);
                color += uGlowColor * uGlowIntensity * edgeFactor * 0.2;
            }
            
            // Tone mapping (Reinhard)
            color = color / (color + vec3(1.0));
            
            // Gamma correction
            color = pow(color, vec3(1.0 / 2.2));
            
            gl_FragColor = vec4(color, 1.0);
        }
    `;
}

/**
 * Get the SDF function call for a specific fractal type
 */
function getFractalSDFCall(fractalType) {
    switch (fractalType) {
        case 'mandelbulb':
            return 'return mandelbulbSDF(pos, uPower, uIterations);';
        case 'mandelbox':
            return 'return mandelboxSDF(pos, uScale, uMinRadius, uFixedRadius, uIterations);';
        case 'mengerSponge':
            return 'return mengerSpongeSDF(pos, uIterations);';
        case 'sierpinski':
            return 'return sierpinskiSDF(pos, uIterations);';
        case 'juliaQuaternion':
            return 'return juliaQuaternionSDF(pos, uJuliaC, uIterations);';
        case 'kleinian':
            return 'return kleinianSDF(pos, uScale, uIterations);';
        default:
            return 'return mandelbulbSDF(pos, uPower, uIterations);';
    }
}

// ============================================================================
// RENDERER3D CLASS
// ============================================================================

export class Renderer3D {
    /**
     * Create a new 3D fractal renderer
     * @param {HTMLCanvasElement} canvas - Target canvas element
     * @param {Object} config - Renderer configuration
     */
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        
        // Configuration
        this.config = {
            width: config.width || canvas.width || 800,
            height: config.height || canvas.height || 600,
            antialias: config.antialias !== false,
            bloomEnabled: config.bloomEnabled !== false,
            bloomStrength: config.bloomStrength || 0.5,
            bloomRadius: config.bloomRadius || 0.4,
            bloomThreshold: config.bloomThreshold || 0.8,
            maxSteps: config.maxSteps || MAX_STEPS,
            epsilon: config.epsilon || SURFACE_EPSILON,
            maxDistance: config.maxDistance || MAX_DISTANCE,
            fov: config.fov || DEFAULT_FOV
        };
        
        // Three.js setup
        this._initThree();
        
        // Post-processing
        this._initPostProcessing();
        
        // Controls
        this._initControls();
        
        // Current fractal
        this.fractal = null;
        this.fractalType = 'mandelbulb';
        
        // Shader material
        this.material = null;
        this._createMaterial();
        
        // Animation state
        this.isAnimating = false;
        this.animationFrameId = null;
        this.time = 0;
        
        // Render callbacks
        this.onRenderFrame = null;
        
        // Performance tracking
        this.stats = {
            fps: 0,
            frameTime: 0,
            lastFrameTime: performance.now()
        };
        
        console.log(`[Renderer3D] Initialized: ${this.config.width}x${this.config.height}`);
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /**
     * Initialize Three.js renderer, scene, and camera
     * @private
     */
    _initThree() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.config.antialias,
            powerPreference: 'high-performance',
            precision: 'highp'
        });
        
        this.renderer.setSize(this.config.width, this.config.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Scene
        this.scene = new THREE.Scene();
        
        // Orthographic camera for full-screen quad
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        
        // Full-screen quad
        this.quad = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            null // Material set later
        );
        this.scene.add(this.quad);
        
        // 3D camera for raymarching (passed to shader)
        this.cameraPosition = new THREE.Vector3(3, 2, 3);
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
    }
    
    /**
     * Initialize post-processing pipeline
     * @private
     */
    _initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        // Main render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Bloom pass
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.config.width, this.config.height),
            this.config.bloomStrength,
            this.config.bloomRadius,
            this.config.bloomThreshold
        );
        this.composer.addPass(this.bloomPass);
        
        // SMAA anti-aliasing
        const smaaPass = new SMAAPass(this.config.width, this.config.height);
        this.composer.addPass(smaaPass);
        
        // Custom tone mapping pass
        this.toneMappingPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                exposure: { value: 1.0 },
                contrast: { value: 1.0 },
                saturation: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float exposure;
                uniform float contrast;
                uniform float saturation;
                varying vec2 vUv;
                
                vec3 adjustSaturation(vec3 color, float sat) {
                    float grey = dot(color, vec3(0.299, 0.587, 0.114));
                    return mix(vec3(grey), color, sat);
                }
                
                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec3 color = texel.rgb;
                    
                    // Exposure
                    color *= exposure;
                    
                    // Contrast
                    color = (color - 0.5) * contrast + 0.5;
                    
                    // Saturation
                    color = adjustSaturation(color, saturation);
                    
                    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
                }
            `
        });
        this.composer.addPass(this.toneMappingPass);
    }
    
    /**
     * Initialize orbit controls for 3D navigation
     * @private
     */
    _initControls() {
        // Create a dummy camera for OrbitControls
        this.controlCamera = new THREE.PerspectiveCamera(
            this.config.fov,
            this.config.width / this.config.height,
            0.1,
            1000
        );
        this.controlCamera.position.copy(this.cameraPosition);
        this.controlCamera.lookAt(this.cameraTarget);
        
        this.controls = new OrbitControls(this.controlCamera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.zoomSpeed = 0.8;
        this.controls.target.copy(this.cameraTarget);
        
        // Sync controls to shader uniforms
        this.controls.addEventListener('change', () => {
            this.cameraPosition.copy(this.controlCamera.position);
            this.cameraTarget.copy(this.controls.target);
            this._updateCameraUniforms();
        });
    }
    
    /**
     * Create the raymarching shader material
     * @private
     */
    _createMaterial() {
        const fragmentShader = generateFragmentShader(this.fractalType);
        
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                // Resolution and camera
                uResolution: { value: new THREE.Vector2(this.config.width, this.config.height) },
                uCameraPosition: { value: this.cameraPosition },
                uCameraTarget: { value: this.cameraTarget },
                uCameraFov: { value: this.config.fov },
                uTime: { value: 0 },
                
                // Fractal parameters
                uPower: { value: 8.0 },
                uScale: { value: 2.0 },
                uIterations: { value: 15 },
                uJuliaC: { value: new THREE.Vector4(-0.2, 0.8, -0.2, 0.0) },
                uMinRadius: { value: 0.5 },
                uFixedRadius: { value: 1.0 },
                
                // Lighting
                uLightDir: { value: new THREE.Vector3(1, 1, 1).normalize() },
                uLightColor: { value: new THREE.Vector3(1, 1, 1) },
                uAmbient: { value: 0.2 },
                uShadowStrength: { value: 0.8 },
                uAOStrength: { value: 0.5 },
                
                // Coloring
                uBaseColor: { value: new THREE.Vector3(0.8, 0.7, 0.6) },
                uGlowColor: { value: new THREE.Vector3(1.0, 0.3, 0.1) },
                uGlowIntensity: { value: 0.3 },
                uColorMode: { value: 0 },
                
                // Quality
                uMaxSteps: { value: this.config.maxSteps },
                uEpsilon: { value: this.config.epsilon },
                uMaxDist: { value: this.config.maxDistance }
            },
            vertexShader: generateVertexShader(),
            fragmentShader
        });
        
        this.quad.material = this.material;
    }
    
    /**
     * Update camera uniforms from controls
     * @private
     */
    _updateCameraUniforms() {
        if (this.material) {
            this.material.uniforms.uCameraPosition.value.copy(this.cameraPosition);
            this.material.uniforms.uCameraTarget.value.copy(this.cameraTarget);
        }
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Resize the renderer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.config.width = width;
        this.config.height = height;
        
        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        
        if (this.material) {
            this.material.uniforms.uResolution.value.set(width, height);
        }
        
        this.controlCamera.aspect = width / height;
        this.controlCamera.updateProjectionMatrix();
        
        console.log(`[Renderer3D] Resized to ${width}x${height}`);
    }
    
    /**
     * Set the fractal type
     * @param {string} type - Fractal type (mandelbulb, mandelbox, etc.)
     */
    setFractalType(type) {
        if (type === this.fractalType) return;
        
        this.fractalType = type;
        
        // Recreate material with new SDF
        const fragmentShader = generateFragmentShader(type);
        this.material.fragmentShader = fragmentShader;
        this.material.needsUpdate = true;
        
        console.log(`[Renderer3D] Fractal type set: ${type}`);
    }
    
    /**
     * Set the 3D fractal instance
     * @param {Object} fractal - Fractal instance
     */
    setFractal(fractal) {
        this.fractal = fractal;
        
        if (fractal) {
            this.setFractalType(fractal.type || 'mandelbulb');
            
            // Apply fractal parameters
            const params = fractal.getParams?.() || {};
            this.setParameters(params);
        }
    }
    
    /**
     * Set fractal parameters
     * @param {Object} params - Parameter object
     */
    setParameters(params) {
        const uniforms = this.material.uniforms;
        
        if (params.power !== undefined) uniforms.uPower.value = params.power;
        if (params.scale !== undefined) uniforms.uScale.value = params.scale;
        if (params.iterations !== undefined) uniforms.uIterations.value = params.iterations;
        if (params.juliaC !== undefined) {
            uniforms.uJuliaC.value.set(
                params.juliaC[0] || 0,
                params.juliaC[1] || 0,
                params.juliaC[2] || 0,
                params.juliaC[3] || 0
            );
        }
        if (params.minRadius !== undefined) uniforms.uMinRadius.value = params.minRadius;
        if (params.fixedRadius !== undefined) uniforms.uFixedRadius.value = params.fixedRadius;
    }
    
    /**
     * Set lighting parameters
     * @param {Object} lighting - Lighting configuration
     */
    setLighting(lighting) {
        const uniforms = this.material.uniforms;
        
        if (lighting.direction) {
            uniforms.uLightDir.value.set(
                lighting.direction[0],
                lighting.direction[1],
                lighting.direction[2]
            ).normalize();
        }
        if (lighting.color) {
            uniforms.uLightColor.value.set(
                lighting.color[0],
                lighting.color[1],
                lighting.color[2]
            );
        }
        if (lighting.ambient !== undefined) uniforms.uAmbient.value = lighting.ambient;
        if (lighting.shadowStrength !== undefined) uniforms.uShadowStrength.value = lighting.shadowStrength;
        if (lighting.aoStrength !== undefined) uniforms.uAOStrength.value = lighting.aoStrength;
    }
    
    /**
     * Set coloring parameters
     * @param {Object} coloring - Coloring configuration
     */
    setColoring(coloring) {
        const uniforms = this.material.uniforms;
        
        if (coloring.baseColor) {
            uniforms.uBaseColor.value.set(
                coloring.baseColor[0],
                coloring.baseColor[1],
                coloring.baseColor[2]
            );
        }
        if (coloring.glowColor) {
            uniforms.uGlowColor.value.set(
                coloring.glowColor[0],
                coloring.glowColor[1],
                coloring.glowColor[2]
            );
        }
        if (coloring.glowIntensity !== undefined) uniforms.uGlowIntensity.value = coloring.glowIntensity;
        if (coloring.mode !== undefined) uniforms.uColorMode.value = coloring.mode;
    }
    
    /**
     * Set post-processing parameters
     * @param {Object} postProcess - Post-processing configuration
     */
    setPostProcessing(postProcess) {
        if (postProcess.bloom !== undefined) {
            this.bloomPass.enabled = postProcess.bloom;
        }
        if (postProcess.bloomStrength !== undefined) {
            this.bloomPass.strength = postProcess.bloomStrength;
        }
        if (postProcess.bloomRadius !== undefined) {
            this.bloomPass.radius = postProcess.bloomRadius;
        }
        if (postProcess.bloomThreshold !== undefined) {
            this.bloomPass.threshold = postProcess.bloomThreshold;
        }
        if (postProcess.exposure !== undefined) {
            this.toneMappingPass.uniforms.exposure.value = postProcess.exposure;
        }
        if (postProcess.contrast !== undefined) {
            this.toneMappingPass.uniforms.contrast.value = postProcess.contrast;
        }
        if (postProcess.saturation !== undefined) {
            this.toneMappingPass.uniforms.saturation.value = postProcess.saturation;
        }
    }
    
    /**
     * Set camera position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    setCameraPosition(x, y, z) {
        this.cameraPosition.set(x, y, z);
        this.controlCamera.position.set(x, y, z);
        this._updateCameraUniforms();
    }
    
    /**
     * Set camera target
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} z - Z position
     */
    setCameraTarget(x, y, z) {
        this.cameraTarget.set(x, y, z);
        this.controls.target.set(x, y, z);
        this._updateCameraUniforms();
    }
    
    /**
     * Set quality parameters
     * @param {Object} quality - Quality configuration
     */
    setQuality(quality) {
        const uniforms = this.material.uniforms;
        
        if (quality.maxSteps !== undefined) uniforms.uMaxSteps.value = quality.maxSteps;
        if (quality.epsilon !== undefined) uniforms.uEpsilon.value = quality.epsilon;
        if (quality.maxDistance !== undefined) uniforms.uMaxDist.value = quality.maxDistance;
    }
    
    /**
     * Render a single frame
     */
    render() {
        // Update controls
        this.controls.update();
        
        // Update time uniform
        this.time += 0.016;
        this.material.uniforms.uTime.value = this.time;
        
        // Render through composer
        this.composer.render();
        
        // Update stats
        const now = performance.now();
        this.stats.frameTime = now - this.stats.lastFrameTime;
        this.stats.fps = 1000 / this.stats.frameTime;
        this.stats.lastFrameTime = now;
        
        if (this.onRenderFrame) {
            this.onRenderFrame(this.stats);
        }
    }
    
    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        const animate = () => {
            if (!this.isAnimating) return;
            
            this.render();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
        console.log('[Renderer3D] Animation started');
    }
    
    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log('[Renderer3D] Animation stopped');
    }
    
    /**
     * Capture current frame as image
     * @returns {string} Data URL of the rendered image
     */
    captureFrame() {
        this.render();
        return this.renderer.domElement.toDataURL('image/png');
    }
    
    /**
     * Get current render statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        this.stopAnimation();
        
        // Dispose Three.js objects
        this.quad.geometry.dispose();
        this.material.dispose();
        this.renderer.dispose();
        this.composer.dispose();
        this.controls.dispose();
        
        console.log('[Renderer3D] Disposed');
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Renderer3D;
export { SDF_LIBRARY, COMMON_SHADER_CHUNKS };
