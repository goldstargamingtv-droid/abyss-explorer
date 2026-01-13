/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - IFS FRACTALS FRAMEWORK                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  General Iterated Function System framework for 3D fractals                   ║
 * ║                                                                                ║
 * ║  Mathematical Foundation:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  An Iterated Function System (IFS) is a set of contractive maps:             ║
 * ║    F = { f₁, f₂, ..., f_n }                                                  ║
 * ║                                                                                ║
 * ║  Each map is typically an affine transformation:                              ║
 * ║    f_i(x) = A_i · x + b_i                                                     ║
 * ║                                                                                ║
 * ║  where A_i is a matrix and b_i is a translation vector.                       ║
 * ║                                                                                ║
 * ║  The attractor A is the unique compact set satisfying:                        ║
 * ║    A = ⋃ f_i(A)                                                               ║
 * ║                                                                                ║
 * ║  Distance Estimation for IFS:                                                  ║
 * ║  ════════════════════════════                                                  ║
 * ║  For DE rendering, we use the "escape time" approach:                         ║
 * ║  1. Apply inverse transformations to unfold space                             ║
 * ║  2. Check if point is in fundamental domain                                   ║
 * ║  3. Track scaling through transformations                                     ║
 * ║                                                                                ║
 * ║  This module provides:                                                         ║
 * ║  - Generic IFS framework with custom transforms                               ║
 * ║  - Predefined fractals (Cantor dust, Koch 3D, etc.)                          ║
 * ║  - Support for fold-based and matrix-based IFS                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// IFS TRANSFORM TYPES
// =============================================================================

/**
 * IFS transform definition
 */
export class IFSTransform {
    constructor(options = {}) {
        /** @type {number[]} 3x3 rotation/scale matrix (row-major) */
        this.matrix = options.matrix || [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ];
        
        /** @type {{x: number, y: number, z: number}} Translation */
        this.translation = options.translation || { x: 0, y: 0, z: 0 };
        
        /** @type {number} Uniform scale factor */
        this.scale = options.scale ?? 1.0;
        
        /** @type {number} Probability weight (for random IFS) */
        this.weight = options.weight ?? 1.0;
    }

    /**
     * Apply transform to a point
     * @param {{x: number, y: number, z: number}} p
     * @returns {{x: number, y: number, z: number}}
     */
    apply(p) {
        const m = this.matrix;
        const s = this.scale;
        const t = this.translation;
        
        return {
            x: (m[0] * p.x + m[1] * p.y + m[2] * p.z) * s + t.x,
            y: (m[3] * p.x + m[4] * p.y + m[5] * p.z) * s + t.y,
            z: (m[6] * p.x + m[7] * p.y + m[8] * p.z) * s + t.z
        };
    }

    /**
     * Convert to GLSL code
     * @param {number} index
     * @returns {string}
     */
    toGLSL(index) {
        const m = this.matrix;
        const t = this.translation;
        const s = this.scale;
        
        return `
    // Transform ${index}
    mat3 m${index} = mat3(
        ${m[0].toFixed(6)}, ${m[1].toFixed(6)}, ${m[2].toFixed(6)},
        ${m[3].toFixed(6)}, ${m[4].toFixed(6)}, ${m[5].toFixed(6)},
        ${m[6].toFixed(6)}, ${m[7].toFixed(6)}, ${m[8].toFixed(6)}
    );
    vec3 t${index} = vec3(${t.x.toFixed(6)}, ${t.y.toFixed(6)}, ${t.z.toFixed(6)});
    float s${index} = ${s.toFixed(6)};
`;
    }
}

// =============================================================================
// PREDEFINED IFS SYSTEMS
// =============================================================================

/**
 * Predefined IFS systems
 */
export const PredefinedIFS = {
    /**
     * 3D Cantor Dust (8 corner copies)
     */
    cantorDust: {
        name: 'Cantor Dust 3D',
        transforms: [
            new IFSTransform({ scale: 0.5, translation: { x: -0.5, y: -0.5, z: -0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0.5, y: -0.5, z: -0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: -0.5, y: 0.5, z: -0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0.5, y: 0.5, z: -0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: -0.5, y: -0.5, z: 0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0.5, y: -0.5, z: 0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: -0.5, y: 0.5, z: 0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0.5, y: 0.5, z: 0.5 } })
        ]
    },

    /**
     * 3D Koch-like (octahedral growth)
     */
    koch3D: {
        name: 'Koch 3D',
        transforms: [
            new IFSTransform({ scale: 0.333, translation: { x: 0, y: 0, z: 0.666 } }),
            new IFSTransform({ scale: 0.333, translation: { x: 0.577, y: 0, z: 0.333 } }),
            new IFSTransform({ scale: 0.333, translation: { x: -0.288, y: 0.5, z: 0.333 } }),
            new IFSTransform({ scale: 0.333, translation: { x: -0.288, y: -0.5, z: 0.333 } }),
            new IFSTransform({ scale: 0.333, translation: { x: 0, y: 0, z: 0 } })
        ]
    },

    /**
     * Fern-like 3D structure
     */
    fern3D: {
        name: 'Fern 3D',
        transforms: [
            // Stem
            new IFSTransform({
                scale: 0.85,
                matrix: [
                    0.85, 0.04, 0,
                    -0.04, 0.85, 0,
                    0, 0, 0.85
                ],
                translation: { x: 0, y: 0.16, z: 0 }
            }),
            // Left leaflet
            new IFSTransform({
                scale: 0.31,
                matrix: [
                    0.2, -0.26, 0,
                    0.23, 0.22, 0,
                    0, 0, 0.3
                ],
                translation: { x: 0, y: 0.16, z: 0 }
            }),
            // Right leaflet
            new IFSTransform({
                scale: 0.31,
                matrix: [
                    -0.15, 0.28, 0,
                    0.26, 0.24, 0,
                    0, 0, 0.3
                ],
                translation: { x: 0, y: 0.44, z: 0 }
            }),
            // Base
            new IFSTransform({
                scale: 0.02,
                matrix: [
                    0, 0, 0,
                    0, 0.16, 0,
                    0, 0, 0.02
                ],
                translation: { x: 0, y: 0, z: 0 }
            })
        ]
    },

    /**
     * Vicsek fractal (3D cross)
     */
    vicsek3D: {
        name: 'Vicsek 3D',
        transforms: [
            new IFSTransform({ scale: 0.333, translation: { x: 0, y: 0, z: 0 } }),
            new IFSTransform({ scale: 0.333, translation: { x: 0.666, y: 0, z: 0 } }),
            new IFSTransform({ scale: 0.333, translation: { x: -0.666, y: 0, z: 0 } }),
            new IFSTransform({ scale: 0.333, translation: { x: 0, y: 0.666, z: 0 } }),
            new IFSTransform({ scale: 0.333, translation: { x: 0, y: -0.666, z: 0 } }),
            new IFSTransform({ scale: 0.333, translation: { x: 0, y: 0, z: 0.666 } }),
            new IFSTransform({ scale: 0.333, translation: { x: 0, y: 0, z: -0.666 } })
        ]
    },

    /**
     * Octahedron flake (3D Sierpinski variant)
     */
    octaFlake: {
        name: 'Octahedron Flake',
        transforms: [
            new IFSTransform({ scale: 0.5, translation: { x: 0.5, y: 0, z: 0 } }),
            new IFSTransform({ scale: 0.5, translation: { x: -0.5, y: 0, z: 0 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0, y: 0.5, z: 0 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0, y: -0.5, z: 0 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0, y: 0, z: 0.5 } }),
            new IFSTransform({ scale: 0.5, translation: { x: 0, y: 0, z: -0.5 } })
        ]
    }
};

// =============================================================================
// IFS FRACTALS CLASS
// =============================================================================

/**
 * IFS Fractals
 * 
 * General framework for IFS-based 3D fractals.
 * 
 * @extends Fractal3DBase
 */
export class IFSFractals extends Fractal3DBase {
    constructor(params = null) {
        super(params);
        
        /** @type {IFSTransform[]} Current transforms */
        this._transforms = [];
        
        /** @type {string} Current IFS name */
        this._currentIFS = 'cantorDust';
        
        // Load default IFS
        this.setIFS('cantorDust');
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'ifs-fractals';
    }

    getName() {
        return 'IFS Fractals';
    }

    getDescription() {
        return 'General Iterated Function System fractals. Choose from predefined ' +
               'systems or create custom transforms.';
    }

    getFormula() {
        return 'A = \\bigcup_{i} f_i(A)';
    }

    getDefaultParams() {
        return {
            maxIterations: 10,
            bailout: 10.0,
            epsilon: 0.0001,
            maxSteps: 200,
            maxDistance: 50.0,
            stepMultiplier: 0.9
        };
    }

    getDefaultCamera() {
        return {
            position: { x: 2, y: 2, z: 2 },
            target: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        };
    }

    getBoundingBox() {
        return {
            min: { x: -2, y: -2, z: -2 },
            max: { x: 2, y: 2, z: 2 }
        };
    }

    getExtraParams() {
        return [
            {
                name: 'ifsType',
                type: 'select',
                default: 'cantorDust',
                options: Object.keys(PredefinedIFS),
                description: 'Predefined IFS type'
            },
            {
                name: 'baseShape',
                type: 'select',
                default: 'sphere',
                options: ['sphere', 'box', 'octahedron'],
                description: 'Base shape for distance'
            }
        ];
    }

    supportsJulia() {
        return false;
    }

    // =========================================================================
    // IFS MANAGEMENT
    // =========================================================================

    /**
     * Set IFS from predefined list
     * @param {string} name
     */
    setIFS(name) {
        if (name in PredefinedIFS) {
            this._currentIFS = name;
            this._transforms = PredefinedIFS[name].transforms;
            this.invalidateShader();
        }
    }

    /**
     * Set custom transforms
     * @param {IFSTransform[]} transforms
     */
    setTransforms(transforms) {
        this._transforms = transforms;
        this._currentIFS = 'custom';
        this.invalidateShader();
    }

    /**
     * Get current transforms
     * @returns {IFSTransform[]}
     */
    getTransforms() {
        return this._transforms;
    }

    /**
     * Get available IFS systems
     * @returns {Object}
     */
    getAvailableIFS() {
        return PredefinedIFS;
    }

    // =========================================================================
    // DISTANCE ESTIMATOR (GLSL)
    // =========================================================================

    /**
     * Get GLSL distance estimator for IFS
     * 
     * Uses fold-based approach for efficiency.
     * 
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        // Generate fold code based on current IFS
        return this._generateDE();
    }

    /**
     * Generate DE code for current transforms
     * @private
     * @returns {string}
     */
    _generateDE() {
        // For simplicity, use a generic fold-based approach
        // that works for many IFS types
        
        return `
// =========================================================================
// IFS DISTANCE ESTIMATOR
// =========================================================================

/**
 * Distance to base shape
 */
float sdBase(vec3 p) {
    // Sphere
    return length(p) - 1.0;
}

/**
 * IFS Distance Estimator using inverse iteration
 * 
 * For each level:
 * 1. Find which transform brings us closest to origin
 * 2. Apply inverse transform
 * 3. Track scaling
 */
float DE(vec3 p) {
    float scale = 1.0;
    vec3 z = p;
    
    // IFS parameters (could be generated or uniforms)
    float ifsScale = 0.5;
    int numTransforms = 8;  // For Cantor dust
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_maxIterations) break;
        
        // Find nearest corner (for Cantor-like IFS)
        vec3 nearest = sign(z) * 0.5;
        
        // Apply inverse: z = (z - translation) / scale
        z = (z - nearest) / ifsScale;
        scale /= ifsScale;
        
        // Escape check
        if (length(z) > u_bailout) break;
    }
    
    // Distance to base shape, scaled back
    return sdBase(z) / scale;
}
`;
    }

    /**
     * Generate Cantor dust DE
     * @returns {string}
     */
    getCantorDustDE() {
        return `
float DE(vec3 p) {
    float scale = 1.0;
    vec3 z = p;
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_maxIterations) break;
        
        // Fold to positive octant
        z = abs(z);
        
        // Find nearest corner
        if (z.x > 0.5) z.x -= 1.0;
        if (z.y > 0.5) z.y -= 1.0;
        if (z.z > 0.5) z.z -= 1.0;
        
        z *= 2.0;
        scale *= 2.0;
    }
    
    // Distance to unit cube
    vec3 d = abs(z) - vec3(1.0);
    float boxD = min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
    
    return boxD / scale;
}
`;
    }

    /**
     * Generate Koch 3D DE
     * @returns {string}
     */
    getKoch3DDE() {
        return `
float DE(vec3 p) {
    float scale = 1.0;
    vec3 z = p;
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_maxIterations) break;
        
        // Absolute fold
        z = abs(z);
        
        // Rotate to align
        if (z.x < z.y) z.xy = z.yx;
        if (z.x < z.z) z.xz = z.zx;
        if (z.y < z.z) z.yz = z.zy;
        
        // Scale and translate
        z = z * 3.0 - vec3(2.0, 2.0, 0.0);
        
        // Conditional fold
        if (z.z < -1.0) z.z += 2.0;
        
        scale *= 3.0;
    }
    
    return (length(z) - 1.0) / scale;
}
`;
    }

    /**
     * Generate Vicsek 3D DE
     * @returns {string}
     */
    getVicsek3DDE() {
        return `
float DE(vec3 p) {
    float scale = 1.0;
    vec3 z = p;
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_maxIterations) break;
        
        // Fold to find nearest axis
        z = abs(z);
        
        // Move toward axis if not on center cross
        float maxCoord = max(z.x, max(z.y, z.z));
        
        if (maxCoord > 0.333) {
            // Find which axis and fold
            if (z.x == maxCoord) z.x = z.x * 3.0 - 2.0;
            else if (z.y == maxCoord) z.y = z.y * 3.0 - 2.0;
            else z.z = z.z * 3.0 - 2.0;
        } else {
            z *= 3.0;
        }
        
        scale *= 3.0;
    }
    
    // Distance to cross
    float d = min(min(
        max(abs(z.y), abs(z.z)),
        max(abs(z.x), abs(z.z))),
        max(abs(z.x), abs(z.y))) - 1.0;
    
    return d / scale;
}
`;
    }

    // =========================================================================
    // COLOR FUNCTION
    // =========================================================================

    getColorFunction() {
        return `
/**
 * IFS coloring based on position and iteration
 */
vec3 getColor(vec3 p, vec3 n, int steps) {
    // Position-based base color
    vec3 col = abs(normalize(p));
    
    // Iteration variation
    float t = float(steps) / float(u_maxIterations);
    t = t * u_colorFrequency + u_colorOffset;
    
    vec3 palette;
    palette.r = 0.5 + 0.5 * cos(TAU * (t + 0.0));
    palette.g = 0.5 + 0.5 * cos(TAU * (t + 0.33));
    palette.b = 0.5 + 0.5 * cos(TAU * (t + 0.67));
    
    col = mix(col, palette, 0.6);
    
    // Normal shading
    vec3 normCol = n * 0.5 + 0.5;
    col = mix(col, normCol, 0.2);
    
    return col;
}
`;
    }

    // =========================================================================
    // CPU DISTANCE ESTIMATOR
    // =========================================================================

    /**
     * CPU evaluation of IFS distance
     * 
     * @param {{x: number, y: number, z: number}} pos
     * @returns {number}
     */
    evaluateDE(pos) {
        const maxIter = this.params.maxIterations;
        
        let zx = pos.x;
        let zy = pos.y;
        let zz = pos.z;
        let scale = 1.0;
        
        // Generic Cantor-like evaluation
        for (let i = 0; i < maxIter; i++) {
            // Fold to positive octant
            zx = Math.abs(zx);
            zy = Math.abs(zy);
            zz = Math.abs(zz);
            
            // Find nearest corner and invert
            if (zx > 0.5) zx -= 1;
            if (zy > 0.5) zy -= 1;
            if (zz > 0.5) zz -= 1;
            
            zx *= 2;
            zy *= 2;
            zz *= 2;
            scale *= 2;
        }
        
        // Distance to unit cube
        const dx = Math.abs(zx) - 1;
        const dy = Math.abs(zy) - 1;
        const dz = Math.abs(zz) - 1;
        
        const outside = Math.sqrt(
            Math.max(0, dx) ** 2 +
            Math.max(0, dy) ** 2 +
            Math.max(0, dz) ** 2
        );
        const inside = Math.min(Math.max(dx, dy, dz), 0);
        
        return (outside + inside) / scale;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { IFSTransform, PredefinedIFS };
export default IFSFractals;
