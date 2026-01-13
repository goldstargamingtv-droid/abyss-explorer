/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - SIERPINSKI FRACTALS                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Sierpinski tetrahedron and related IFS fractals                              ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Sierpinski tetrahedron (3D Sierpinski gasket) is constructed by:        ║
 * ║  1. Start with a tetrahedron                                                  ║
 * ║  2. Connect midpoints of edges to form 4 smaller tetrahedra                   ║
 * ║  3. Remove the central octahedron                                             ║
 * ║  4. Repeat for each smaller tetrahedron                                       ║
 * ║                                                                                ║
 * ║  IFS Representation:                                                           ║
 * ║  ════════════════════                                                          ║
 * ║  The Sierpinski tetrahedron is the attractor of an IFS with 4 maps:          ║
 * ║    T_i(x) = (x + v_i) / 2                                                     ║
 * ║  where v_i are the 4 vertices of the base tetrahedron.                       ║
 * ║                                                                                ║
 * ║  Tetrahedron Vertices (regular, centered at origin):                          ║
 * ║    v0 = (1, 1, 1) / √3                                                        ║
 * ║    v1 = (1, -1, -1) / √3                                                      ║
 * ║    v2 = (-1, 1, -1) / √3                                                      ║
 * ║    v3 = (-1, -1, 1) / √3                                                      ║
 * ║                                                                                ║
 * ║  Properties:                                                                   ║
 * ║  - Hausdorff dimension: log(4)/log(2) = 2                                     ║
 * ║  - Zero volume, non-zero 2D Hausdorff measure                                ║
 * ║                                                                                ║
 * ║  Variants:                                                                     ║
 * ║  - Sierpinski pyramid (based on square pyramid)                               ║
 * ║  - Sierpinski octahedron                                                      ║
 * ║  - Menger-Sierpinski hybrid                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// SIERPINSKI CLASS
// =============================================================================

/**
 * Sierpinski 3D Fractals
 * 
 * Tetrahedron, pyramid, and related IFS fractals.
 * 
 * @extends Fractal3DBase
 */
export class Sierpinski extends Fractal3DBase {
    constructor(params = null) {
        super(params);
        
        if (!this.params.extra.variant) {
            this.params.extra.variant = 'tetrahedron';
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'sierpinski';
    }

    getName() {
        return 'Sierpinski';
    }

    getDescription() {
        return 'Sierpinski fractals: tetrahedron, pyramid, and octahedron variants. ' +
               'Classic IFS fractals with self-similarity.';
    }

    getFormula() {
        return 'T_i(x) = (x + v_i) / 2';
    }

    getDefaultParams() {
        return {
            maxIterations: 12,
            bailout: 10.0,
            epsilon: 0.0001,
            maxSteps: 200,
            maxDistance: 50.0,
            stepMultiplier: 0.9
        };
    }

    getDefaultCamera() {
        return {
            position: { x: 2, y: 1.5, z: 2 },
            target: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        };
    }

    getBoundingBox() {
        return {
            min: { x: -1.5, y: -1, z: -1.5 },
            max: { x: 1.5, y: 1.5, z: 1.5 }
        };
    }

    getExtraParams() {
        return [
            {
                name: 'variant',
                type: 'select',
                default: 'tetrahedron',
                options: ['tetrahedron', 'pyramid', 'octahedron', 'dodecahedron'],
                description: 'Sierpinski variant'
            },
            {
                name: 'scaleFactor',
                type: 'number',
                default: 2.0,
                min: 1.5,
                max: 3.0,
                description: 'IFS scale factor'
            },
            {
                name: 'offset',
                type: 'number',
                default: 1.0,
                min: 0.5,
                max: 2.0,
                description: 'Vertex offset distance'
            }
        ];
    }

    supportsJulia() {
        return false;
    }

    // =========================================================================
    // DISTANCE ESTIMATOR (GLSL)
    // =========================================================================

    /**
     * Get GLSL distance estimator for Sierpinski Tetrahedron
     * 
     * Uses the fold-and-scale IFS technique.
     * 
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        return `
// =========================================================================
// SIERPINSKI DISTANCE ESTIMATOR
// =========================================================================

/**
 * Tetrahedron vertices (regular tetrahedron centered at origin)
 */
const vec3 v0 = vec3( 1.0,  1.0,  1.0) * 0.577350269;
const vec3 v1 = vec3( 1.0, -1.0, -1.0) * 0.577350269;
const vec3 v2 = vec3(-1.0,  1.0, -1.0) * 0.577350269;
const vec3 v3 = vec3(-1.0, -1.0,  1.0) * 0.577350269;

/**
 * Distance to tetrahedron (signed)
 */
float sdTetrahedron(vec3 p, float size) {
    // Planes defined by tetrahedron faces
    float d = 0.0;
    d = max(d, abs(dot(p, normalize(v0 + v1 + v2)) - size * 0.333));
    d = max(d, abs(dot(p, normalize(v0 + v1 + v3)) - size * 0.333));
    d = max(d, abs(dot(p, normalize(v0 + v2 + v3)) - size * 0.333));
    d = max(d, abs(dot(p, normalize(v1 + v2 + v3)) - size * 0.333));
    return d - size * 0.2;
}

/**
 * Sierpinski Tetrahedron using fold operations
 * 
 * At each iteration:
 * 1. Fold point toward each vertex
 * 2. Scale by 2
 * 3. Translate
 */
float DE(vec3 p) {
    vec3 z = p;
    float scale = 1.0;
    
    // Tetrahedron vertices
    vec3 a1 = vec3( 1.0,  1.0,  1.0);
    vec3 a2 = vec3(-1.0, -1.0,  1.0);
    vec3 a3 = vec3( 1.0, -1.0, -1.0);
    vec3 a4 = vec3(-1.0,  1.0, -1.0);
    
    int n = 0;
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_maxIterations) break;
        
        /**
         * Fold toward nearest vertex
         * 
         * For each pair of vertices, if point is on wrong side of
         * the bisecting plane, reflect it.
         */
        
        // Fold 1: reflect if closer to a2 than a1
        vec3 c = z - a1;
        float d = dot(c, a2 - a1);
        if (d > 0.0) z -= (a2 - a1) * d / dot(a2 - a1, a2 - a1) * 2.0;
        
        // Fold 2: reflect if closer to a3 than a1  
        c = z - a1;
        d = dot(c, a3 - a1);
        if (d > 0.0) z -= (a3 - a1) * d / dot(a3 - a1, a3 - a1) * 2.0;
        
        // Fold 3: reflect if closer to a4 than a1
        c = z - a1;
        d = dot(c, a4 - a1);
        if (d > 0.0) z -= (a4 - a1) * d / dot(a4 - a1, a4 - a1) * 2.0;
        
        // Scale and translate
        z = z * 2.0 - a1;
        scale *= 2.0;
        
        n++;
    }
    
    // Distance to final tetrahedron, scaled back
    return (length(z) - 1.5) / scale;
}
`;
    }

    /**
     * Get pyramid variant DE
     * @returns {string}
     */
    getPyramidDE() {
        return `
/**
 * Sierpinski Pyramid (square base)
 */
float DE(vec3 p) {
    vec3 z = p;
    float scale = 1.0;
    
    // Pyramid vertices (square base + apex)
    vec3 apex = vec3(0.0, 1.0, 0.0);
    vec3 b1 = vec3(-1.0, 0.0, -1.0);
    vec3 b2 = vec3( 1.0, 0.0, -1.0);
    vec3 b3 = vec3( 1.0, 0.0,  1.0);
    vec3 b4 = vec3(-1.0, 0.0,  1.0);
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_maxIterations) break;
        
        // Find nearest vertex
        float d1 = length(z - apex);
        float d2 = length(z - b1);
        float d3 = length(z - b2);
        float d4 = length(z - b3);
        float d5 = length(z - b4);
        
        float minD = min(min(min(d1, d2), min(d3, d4)), d5);
        
        vec3 nearest;
        if (minD == d1) nearest = apex;
        else if (minD == d2) nearest = b1;
        else if (minD == d3) nearest = b2;
        else if (minD == d4) nearest = b3;
        else nearest = b4;
        
        // Scale toward nearest vertex
        z = z * 2.0 - nearest;
        scale *= 2.0;
    }
    
    return (length(z) - 1.0) / scale;
}
`;
    }

    /**
     * Get octahedron variant DE
     * @returns {string}
     */
    getOctahedronDE() {
        return `
/**
 * Sierpinski Octahedron
 */
float DE(vec3 p) {
    vec3 z = p;
    float scale = 1.0;
    
    // Octahedron vertices
    vec3 v[6];
    v[0] = vec3( 1.0, 0.0, 0.0);
    v[1] = vec3(-1.0, 0.0, 0.0);
    v[2] = vec3(0.0,  1.0, 0.0);
    v[3] = vec3(0.0, -1.0, 0.0);
    v[4] = vec3(0.0, 0.0,  1.0);
    v[5] = vec3(0.0, 0.0, -1.0);
    
    for (int i = 0; i < 30; i++) {
        if (i >= u_maxIterations) break;
        
        // Fold toward each axis
        z = abs(z);
        
        // Sort to ensure consistent behavior
        if (z.x < z.y) z.xy = z.yx;
        if (z.x < z.z) z.xz = z.zx;
        if (z.y < z.z) z.yz = z.zy;
        
        // Scale and offset
        z = z * 2.0 - vec3(1.0, 1.0, 1.0);
        scale *= 2.0;
    }
    
    // Octahedron distance
    return (dot(abs(z), vec3(1.0)) - 1.0) / scale / sqrt(3.0);
}
`;
    }

    // =========================================================================
    // COLOR FUNCTION
    // =========================================================================

    getColorFunction() {
        return `
/**
 * Sierpinski coloring based on iteration depth and position
 */
vec3 getColor(vec3 p, vec3 n, int steps) {
    // Position-based color
    vec3 col = abs(normalize(p)) * 0.8 + 0.2;
    
    // Iteration-based variation
    float t = float(steps) / float(u_maxIterations);
    t = t * u_colorFrequency + u_colorOffset;
    
    // Palette
    vec3 palette;
    palette.r = 0.5 + 0.5 * cos(TAU * (t + 0.0));
    palette.g = 0.5 + 0.5 * cos(TAU * (t + 0.33));
    palette.b = 0.5 + 0.5 * cos(TAU * (t + 0.67));
    
    col = mix(col, palette, 0.5);
    
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
     * CPU evaluation of Sierpinski tetrahedron distance
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
        
        // Tetrahedron vertices
        const a1 = { x: 1, y: 1, z: 1 };
        const a2 = { x: -1, y: -1, z: 1 };
        const a3 = { x: 1, y: -1, z: -1 };
        const a4 = { x: -1, y: 1, z: -1 };
        
        for (let i = 0; i < maxIter; i++) {
            // Fold toward each vertex pair
            const folds = [
                { from: a1, to: a2 },
                { from: a1, to: a3 },
                { from: a1, to: a4 }
            ];
            
            for (const fold of folds) {
                const dx = fold.to.x - fold.from.x;
                const dy = fold.to.y - fold.from.y;
                const dz = fold.to.z - fold.from.z;
                
                const cx = zx - fold.from.x;
                const cy = zy - fold.from.y;
                const cz = zz - fold.from.z;
                
                const dot1 = cx * dx + cy * dy + cz * dz;
                const dot2 = dx * dx + dy * dy + dz * dz;
                
                if (dot1 > 0) {
                    const factor = 2 * dot1 / dot2;
                    zx -= dx * factor;
                    zy -= dy * factor;
                    zz -= dz * factor;
                }
            }
            
            // Scale and translate
            zx = zx * 2 - a1.x;
            zy = zy * 2 - a1.y;
            zz = zz * 2 - a1.z;
            scale *= 2;
        }
        
        const r = Math.sqrt(zx * zx + zy * zy + zz * zz);
        return (r - 1.5) / scale;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Sierpinski;
