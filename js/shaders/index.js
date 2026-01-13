/**
 * ============================================================================
 * ABYSS EXPLORER - SHADERS MODULE INDEX
 * ============================================================================
 * 
 * Central module for all GPU shaders used in 3D fractal rendering.
 * Provides GLSL source code as string constants for use with Three.js
 * ShaderMaterial and raw WebGL programs.
 * 
 * Shader Categories:
 * - Distance Estimators: Mandelbulb, Mandelbox, Kleinian, Julia, Menger, IFS
 * - Lighting: Phong, PBR, soft shadows, multiple lights
 * - Effects: Ambient occlusion, post-processing (bloom, DOF, tone mapping)
 * 
 * Usage with Three.js:
 * ```javascript
 * import { getMandelbulbShader, createMandelbulbUniforms } from './shaders';
 * 
 * const { vertex, fragment } = getMandelbulbShader();
 * const uniforms = createMandelbulbUniforms({ power: 8 });
 * 
 * const material = new THREE.ShaderMaterial({
 *     vertexShader: vertex,
 *     fragmentShader: fragment,
 *     uniforms: uniforms
 * });
 * ```
 * 
 * @module shaders
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

// Shader Manager
import ShaderManager, {
    getShaderManager,
    GLSL_HEADER,
    COMMON_UNIFORMS,
    GLSL_UTILS,
    RAYMARCHING_CORE,
    VERTEX_SHADER,
    FULLSCREEN_VERTEX
} from './shader-manager.js';

// Fractal Distance Estimators
import mandelbulbShader, {
    MANDELBULB_UNIFORMS,
    MANDELBULB_DE,
    MANDELBULB_FRAGMENT,
    MANDELBULB_COSINE,
    MANDELBULB_CUBIC,
    createMandelbulbUniforms,
    getMandelbulbShader
} from './mandelbulb.glsl.js';

import mandelboxShader, {
    MANDELBOX_UNIFORMS,
    MANDELBOX_DE,
    MANDELBOX_FRAGMENT,
    MANDELBOX_SPHERICAL,
    createMandelboxUniforms,
    getMandelboxShader
} from './mandelbox.glsl.js';

import kleinianShader, {
    KLEINIAN_UNIFORMS,
    KLEINIAN_DE,
    KLEINIAN_FRAGMENT,
    createKleinianUniforms,
    getKleinianShader
} from './kleinian.glsl.js';

import juliaQuatShader, {
    JULIA_QUAT_UNIFORMS,
    JULIA_QUAT_DE,
    JULIA_QUAT_FRAGMENT,
    createJuliaQuatUniforms,
    getJuliaQuatShader,
    INTERESTING_C_VALUES
} from './julia-quat.glsl.js';

import mengerShader, {
    MENGER_UNIFORMS,
    MENGER_DE,
    MENGER_FRAGMENT,
    createMengerUniforms,
    getMengerShader
} from './menger.glsl.js';

import ifsShader, {
    IFS_UNIFORMS,
    IFS_DE,
    IFS_FRAGMENT,
    createIFSUniforms,
    getIFSShader
} from './ifs.glsl.js';

// Lighting
import lightingShader, {
    LIGHTING_UNIFORMS,
    createLightingUniforms,
    getLightingShader,
    LIGHTING_MODELS
} from './lighting.glsl.js';

// Ambient Occlusion
import aoShader, {
    AO_UNIFORMS,
    createAOUniforms,
    getAOShader,
    AO_METHODS,
    generateSSAONoise
} from './ambient-occlusion.glsl.js';

// Post-Processing
import postShader, {
    POST_UNIFORMS,
    createPostUniforms,
    getPostShader,
    TONEMAP_MODES
} from './post-processing.glsl.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Shaders',
    version: '1.0.0',
    description: 'GPU-accelerated shaders for 3D fractal rendering',
    shaders: {
        fractalDE: [
            'mandelbulb',
            'mandelbox',
            'kleinian',
            'julia-quaternion',
            'menger',
            'ifs'
        ],
        lighting: [
            'phong',
            'pbr',
            'soft-shadows',
            'multiple-lights'
        ],
        effects: [
            'ambient-occlusion',
            'ssao',
            'volumetric-ao'
        ],
        postProcessing: [
            'bloom',
            'tone-mapping',
            'color-grading',
            'depth-of-field',
            'vignette',
            'film-grain'
        ]
    },
    features: [
        'Analytic distance estimation',
        'Soft shadows with penumbra',
        'PBR-based lighting',
        'ACES/Reinhard tone mapping',
        'Screen-space ambient occlusion',
        'Depth of field with bokeh',
        'Film grain and vignette'
    ]
};

// ============================================================================
// SHADER REGISTRY
// ============================================================================

/**
 * Registry of all available shaders
 */
export const SHADER_REGISTRY = {
    // Distance estimators
    mandelbulb: {
        name: 'Mandelbulb',
        getShader: getMandelbulbShader,
        createUniforms: createMandelbulbUniforms,
        distanceEstimator: MANDELBULB_DE
    },
    mandelbox: {
        name: 'Mandelbox',
        getShader: getMandelboxShader,
        createUniforms: createMandelboxUniforms,
        distanceEstimator: MANDELBOX_DE
    },
    kleinian: {
        name: 'Kleinian',
        getShader: getKleinianShader,
        createUniforms: createKleinianUniforms,
        distanceEstimator: KLEINIAN_DE
    },
    juliaQuat: {
        name: 'Quaternion Julia',
        getShader: getJuliaQuatShader,
        createUniforms: createJuliaQuatUniforms,
        distanceEstimator: JULIA_QUAT_DE
    },
    menger: {
        name: 'Menger Sponge',
        getShader: getMengerShader,
        createUniforms: createMengerUniforms,
        distanceEstimator: MENGER_DE
    },
    ifs: {
        name: 'IFS Fractals',
        getShader: getIFSShader,
        createUniforms: createIFSUniforms,
        distanceEstimator: IFS_DE
    }
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get shader by name
 * @param {string} name - Shader name
 * @returns {Object} { vertex, fragment } or null
 */
export function getShader(name) {
    const entry = SHADER_REGISTRY[name];
    if (!entry) {
        console.error(`Shader not found: ${name}`);
        return null;
    }
    return entry.getShader();
}

/**
 * Get uniforms for shader
 * @param {string} name - Shader name
 * @param {Object} options - Uniform options
 * @returns {Object} Uniforms object
 */
export function getUniforms(name, options = {}) {
    const entry = SHADER_REGISTRY[name];
    if (!entry) {
        console.error(`Shader not found: ${name}`);
        return {};
    }
    return entry.createUniforms(options);
}

/**
 * Get distance estimator GLSL code
 * @param {string} name - Fractal name
 * @returns {string} GLSL code
 */
export function getDistanceEstimator(name) {
    const entry = SHADER_REGISTRY[name];
    return entry ? entry.distanceEstimator : null;
}

/**
 * Build complete fragment shader with all effects
 * @param {string} fractalDE - Distance estimator GLSL
 * @param {Object} options - Effect options
 * @returns {string} Complete fragment shader
 */
export function buildCompleteShader(fractalDE, options = {}) {
    const {
        lighting = true,
        ao = true,
        shadows = true,
        fog = true,
        glow = true,
        quality = 'high'
    } = options;
    
    const shaderManager = getShaderManager();
    return shaderManager.buildFragmentShader(fractalDE, {
        lighting,
        ao,
        shadows,
        fog,
        glow
    });
}

/**
 * Get all available shader names
 * @returns {string[]}
 */
export function getAvailableShaders() {
    return Object.keys(SHADER_REGISTRY);
}

/**
 * Get post-processing pipeline
 * @param {Object} options - Post-processing options
 * @returns {Object} Shader sources for each pass
 */
export function getPostProcessingPipeline(options = {}) {
    const shaders = getPostShader();
    return {
        vertex: shaders.vertex,
        fragment: shaders.fragment,
        bloomExtract: shaders.bloomExtract,
        bloomBlur: shaders.bloomBlur
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Shader Manager
export { ShaderManager, getShaderManager };

// Common GLSL
export {
    GLSL_HEADER,
    COMMON_UNIFORMS,
    GLSL_UTILS,
    RAYMARCHING_CORE,
    VERTEX_SHADER,
    FULLSCREEN_VERTEX
};

// Mandelbulb
export {
    MANDELBULB_UNIFORMS,
    MANDELBULB_DE,
    MANDELBULB_FRAGMENT,
    MANDELBULB_COSINE,
    MANDELBULB_CUBIC,
    createMandelbulbUniforms,
    getMandelbulbShader
};

// Mandelbox
export {
    MANDELBOX_UNIFORMS,
    MANDELBOX_DE,
    MANDELBOX_FRAGMENT,
    MANDELBOX_SPHERICAL,
    createMandelboxUniforms,
    getMandelboxShader
};

// Kleinian
export {
    KLEINIAN_UNIFORMS,
    KLEINIAN_DE,
    KLEINIAN_FRAGMENT,
    createKleinianUniforms,
    getKleinianShader
};

// Quaternion Julia
export {
    JULIA_QUAT_UNIFORMS,
    JULIA_QUAT_DE,
    JULIA_QUAT_FRAGMENT,
    createJuliaQuatUniforms,
    getJuliaQuatShader,
    INTERESTING_C_VALUES
};

// Menger
export {
    MENGER_UNIFORMS,
    MENGER_DE,
    MENGER_FRAGMENT,
    createMengerUniforms,
    getMengerShader
};

// IFS
export {
    IFS_UNIFORMS,
    IFS_DE,
    IFS_FRAGMENT,
    createIFSUniforms,
    getIFSShader
};

// Lighting
export {
    LIGHTING_UNIFORMS,
    createLightingUniforms,
    getLightingShader,
    LIGHTING_MODELS
};

// Ambient Occlusion
export {
    AO_UNIFORMS,
    createAOUniforms,
    getAOShader,
    AO_METHODS,
    generateSSAONoise
};

// Post-Processing
export {
    POST_UNIFORMS,
    createPostUniforms,
    getPostShader,
    TONEMAP_MODES
};

// Shader objects
export {
    mandelbulbShader,
    mandelboxShader,
    kleinianShader,
    juliaQuatShader,
    mengerShader,
    ifsShader,
    lightingShader,
    aoShader,
    postShader
};

// Default export
export default {
    MODULE_INFO,
    SHADER_REGISTRY,
    
    // Manager
    ShaderManager,
    getShaderManager,
    
    // Convenience
    getShader,
    getUniforms,
    getDistanceEstimator,
    buildCompleteShader,
    getAvailableShaders,
    getPostProcessingPipeline,
    
    // Common GLSL
    GLSL_HEADER,
    COMMON_UNIFORMS,
    GLSL_UTILS,
    RAYMARCHING_CORE,
    VERTEX_SHADER,
    FULLSCREEN_VERTEX,
    
    // Fractal shaders
    mandelbulb: mandelbulbShader,
    mandelbox: mandelboxShader,
    kleinian: kleinianShader,
    juliaQuat: juliaQuatShader,
    menger: mengerShader,
    ifs: ifsShader,
    
    // Effects
    lighting: lightingShader,
    ao: aoShader,
    post: postShader
};
