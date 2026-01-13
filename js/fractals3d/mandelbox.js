/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                         ABYSS EXPLORER - MANDELBOX                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  The Mandelbox - A box-folding 3D fractal                                     ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Mandelbox uses two folding operations:                                   ║
 * ║                                                                                ║
 * ║  1. BOX FOLD:                                                                 ║
 * ║     For each component x:                                                     ║
 * ║       if x > foldLimit:  x = 2*foldLimit - x                                  ║
 * ║       if x < -foldLimit: x = -2*foldLimit - x                                 ║
 * ║                                                                                ║
 * ║     This folds space back on itself at the fold limit.                        ║
 * ║                                                                                ║
 * ║  2. SPHERE FOLD:                                                              ║
 * ║     r² = x² + y² + z²                                                         ║
 * ║     if r < minRadius:                                                         ║
 * ║       x *= fixedRadius²/minRadius²  (scale up)                                ║
 * ║     else if r < fixedRadius:                                                  ║
 * ║       x *= fixedRadius²/r²  (scale to fixed radius)                           ║
 * ║                                                                                ║
 * ║     This creates spherical inversions at two radii.                           ║
 * ║                                                                                ║
 * ║  Iteration:                                                                    ║
 * ║    z = boxFold(z)                                                             ║
 * ║    z = sphereFold(z)                                                          ║
 * ║    z = scale * z + c                                                          ║
 * ║                                                                                ║
 * ║  Distance Estimator:                                                           ║
 * ║  ════════════════════                                                          ║
 * ║  Track the derivative ds through the folds:                                   ║
 * ║    ds *= |fold factor|                                                        ║
 * ║                                                                                ║
 * ║  Final DE:                                                                     ║
 * ║    DE = (length(z) - bailout) / abs(ds)                                       ║
 * ║                                                                                ║
 * ║  Parameters:                                                                   ║
 * ║  - scale: Main scaling factor (typically -1.5 to 3)                           ║
 * ║  - foldLimit: Box fold boundary (typically 1)                                 ║
 * ║  - minRadius: Inner sphere fold radius (typically 0.5)                        ║
 * ║  - fixedRadius: Outer sphere fold radius (typically 1)                        ║
 * ║                                                                                ║
 * ║  History:                                                                      ║
 * ║  Discovered by Tom Lowe (tglad) in 2010. The scale=-1.5 gives the classic    ║
 * ║  "Amazing Surface" appearance.                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// MANDELBOX CLASS
// =============================================================================

/**
 * Mandelbox 3D Fractal
 * 
 * Uses box folding and sphere folding to create infinite detail.
 * 
 * @extends Fractal3DBase
 */
export class Mandelbox extends Fractal3DBase {
    constructor(params = null) {
        super(params);
        
        // Set Mandelbox-specific defaults
        if (this.params.boxScale === undefined || this.params.boxScale === 2.0) {
            this.params.boxScale = -1.5; // Classic Mandelbox
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'mandelbox';
    }

    getName() {
        return 'Mandelbox';
    }

    getDescription() {
        return 'The Mandelbox: combines box folding and sphere folding. ' +
               'Scale -1.5 gives the classic "Amazing Surface" appearance.';
    }

    getFormula() {
        return 'z = s \\cdot \\text{sphereFold}(\\text{boxFold}(z)) + c';
    }

    getDefaultParams() {
        return {
            maxIterations: 15,
            bailout: 100.0,
            epsilon: 0.0001,
            maxSteps: 256,
            maxDistance: 100.0,
            stepMultiplier: 0.75, // More conservative for complex geometry
            boxScale: -1.5,
            foldLimit: 1.0,
            minRadius: 0.5,
            fixedRadius: 1.0
        };
    }

    getDefaultCamera() {
        return {
            position: { x: 0, y: 0, z: 4 },
            target: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        };
    }

    getBoundingBox() {
        return {
            min: { x: -3, y: -3, z: -3 },
            max: { x: 3, y: 3, z: 3 }
        };
    }

    getExtraParams() {
        return [
            {
                name: 'boxScale',
                type: 'number',
                default: -1.5,
                min: -3,
                max: 3,
                description: 'Main scale factor (-1.5 is classic)'
            },
            {
                name: 'foldLimit',
                type: 'number',
                default: 1.0,
                min: 0.1,
                max: 2.0,
                description: 'Box fold limit'
            },
            {
                name: 'minRadius',
                type: 'number',
                default: 0.5,
                min: 0.01,
                max: 1.0,
                description: 'Inner sphere fold radius'
            },
            {
                name: 'fixedRadius',
                type: 'number',
                default: 1.0,
                min: 0.1,
                max: 2.0,
                description: 'Outer sphere fold radius'
            },
            {
                name: 'rotations',
                type: 'vector3',
                default: { x: 0, y: 0, z: 0 },
                description: 'Per-iteration rotation angles'
            }
        ];
    }

    supportsJulia() {
        return true;
    }

    // =========================================================================
    // DISTANCE ESTIMATOR (GLSL)
    // =========================================================================

    /**
     * Get GLSL distance estimator for Mandelbox
     * 
     * Based on tglad's original formula with improvements from
     * Syntopia/Fragmentarium.
     * 
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        return `
// =========================================================================
// MANDELBOX DISTANCE ESTIMATOR
// =========================================================================

/**
 * Box fold operation
 * 
 * Folds each component at ±foldLimit:
 *   if x > L:  x = 2L - x
 *   if x < -L: x = -2L - x
 */
vec3 boxFold(vec3 z, float foldLimit) {
    return clamp(z, -foldLimit, foldLimit) * 2.0 - z;
}

/**
 * Sphere fold operation
 * 
 * Applies spherical inversion at two radii:
 * - Inside minRadius: scale by (fixedRadius/minRadius)²
 * - Between radii: scale by (fixedRadius/r)²
 * - Outside fixedRadius: no change
 */
void sphereFold(inout vec3 z, inout float dz, float minRadius2, float fixedRadius2) {
    float r2 = dot(z, z);
    
    if (r2 < minRadius2) {
        // Inner sphere: scale to fixed radius
        float factor = fixedRadius2 / minRadius2;
        z *= factor;
        dz *= factor;
    } else if (r2 < fixedRadius2) {
        // Between spheres: scale to fixed radius
        float factor = fixedRadius2 / r2;
        z *= factor;
        dz *= factor;
    }
    // Outside fixed radius: no change
}

/**
 * Mandelbox Distance Estimator
 * 
 * Iteration:
 *   z = scale * sphereFold(boxFold(z)) + c
 * 
 * Distance estimate uses running derivative tracking through folds.
 */
float DE(vec3 pos) {
    vec3 z = pos;
    float dz = 1.0;
    
    float scale = u_boxScale;
    float foldLimit = u_foldLimit;
    float minRadius2 = u_minRadius * u_minRadius;
    float fixedRadius2 = u_fixedRadius * u_fixedRadius;
    
    // Julia mode uses fixed offset
    vec3 c = u_juliaMode > 0.5 ? u_juliaOffset.xyz : pos;
    
    // Per-iteration rotation (if enabled)
    mat3 rot = mat3(1.0);
    if (length(u_rotation) > 0.001) {
        rot = rotateX(u_rotation.x) * rotateY(u_rotation.y) * rotateZ(u_rotation.z);
    }
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        // Box fold
        z = boxFold(z, foldLimit);
        
        // Sphere fold
        sphereFold(z, dz, minRadius2, fixedRadius2);
        
        // Scale and translate
        z = scale * z + c;
        dz = dz * abs(scale) + 1.0;
        
        // Optional per-iteration rotation
        z = rot * z;
        
        // Escape check
        if (dot(z, z) > u_bailout * u_bailout) break;
    }
    
    /**
     * Distance estimate formula:
     * 
     * DE = (|z| - offset) / |dz|
     * 
     * The offset accounts for the final position relative to the set.
     * The derivative dz accumulates the scaling through all folds.
     */
    return (length(z) - 0.5) / abs(dz);
}
`;
    }

    // =========================================================================
    // COLOR FUNCTION
    // =========================================================================

    getColorFunction() {
        return `
/**
 * Mandelbox coloring based on fold counts and orbit traps
 */
vec3 getColor(vec3 p, vec3 n, int steps) {
    vec3 z = p;
    float dz = 1.0;
    
    float scale = u_boxScale;
    float foldLimit = u_foldLimit;
    float minRadius2 = u_minRadius * u_minRadius;
    float fixedRadius2 = u_fixedRadius * u_fixedRadius;
    
    vec3 c = u_juliaMode > 0.5 ? u_juliaOffset.xyz : p;
    
    // Track coloring data
    float boxFolds = 0.0;
    float sphereFolds = 0.0;
    vec3 orbitTrap = vec3(1e10);
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        // Box fold with counting
        vec3 oldZ = z;
        z = clamp(z, -foldLimit, foldLimit) * 2.0 - z;
        boxFolds += length(z - oldZ);
        
        // Sphere fold with counting
        float r2 = dot(z, z);
        if (r2 < minRadius2) {
            float factor = fixedRadius2 / minRadius2;
            z *= factor;
            dz *= factor;
            sphereFolds += 1.0;
        } else if (r2 < fixedRadius2) {
            float factor = fixedRadius2 / r2;
            z *= factor;
            dz *= factor;
            sphereFolds += 0.5;
        }
        
        z = scale * z + c;
        dz = dz * abs(scale) + 1.0;
        
        // Orbit trap
        orbitTrap = min(orbitTrap, abs(z));
        
        if (dot(z, z) > u_bailout * u_bailout) break;
    }
    
    // Color from folds and orbit
    float t = (boxFolds * 0.1 + sphereFolds * 0.2) * u_colorFrequency + u_colorOffset;
    
    // Palette based on fold activity
    vec3 col;
    col.r = 0.5 + 0.5 * sin(t * TAU + 0.0);
    col.g = 0.5 + 0.5 * sin(t * TAU + 2.0);
    col.b = 0.5 + 0.5 * sin(t * TAU + 4.0);
    
    // Mix with orbit trap color
    vec3 trapCol = 1.0 - exp(-orbitTrap * 2.0);
    col = mix(col, trapCol, u_orbitStrength);
    
    return col;
}
`;
    }

    // =========================================================================
    // CPU DISTANCE ESTIMATOR
    // =========================================================================

    /**
     * CPU evaluation of Mandelbox distance
     * 
     * @param {{x: number, y: number, z: number}} pos
     * @returns {number}
     */
    evaluateDE(pos) {
        const scale = this.params.boxScale;
        const foldLimit = this.params.foldLimit;
        const minRadius2 = this.params.minRadius * this.params.minRadius;
        const fixedRadius2 = this.params.fixedRadius * this.params.fixedRadius;
        const bailout2 = this.params.bailout * this.params.bailout;
        const maxIter = this.params.maxIterations;
        const juliaMode = this.params.juliaMode;
        const juliaOffset = this.params.juliaOffset;
        
        let zx = pos.x;
        let zy = pos.y;
        let zz = pos.z;
        let dz = 1.0;
        
        const cx = juliaMode ? juliaOffset.x : pos.x;
        const cy = juliaMode ? juliaOffset.y : pos.y;
        const cz = juliaMode ? juliaOffset.z : pos.z;
        
        for (let i = 0; i < maxIter; i++) {
            // Box fold
            zx = Math.max(-foldLimit, Math.min(foldLimit, zx)) * 2 - zx;
            zy = Math.max(-foldLimit, Math.min(foldLimit, zy)) * 2 - zy;
            zz = Math.max(-foldLimit, Math.min(foldLimit, zz)) * 2 - zz;
            
            // Sphere fold
            const r2 = zx * zx + zy * zy + zz * zz;
            
            if (r2 < minRadius2) {
                const factor = fixedRadius2 / minRadius2;
                zx *= factor;
                zy *= factor;
                zz *= factor;
                dz *= factor;
            } else if (r2 < fixedRadius2) {
                const factor = fixedRadius2 / r2;
                zx *= factor;
                zy *= factor;
                zz *= factor;
                dz *= factor;
            }
            
            // Scale and translate
            zx = scale * zx + cx;
            zy = scale * zy + cy;
            zz = scale * zz + cz;
            dz = dz * Math.abs(scale) + 1;
            
            // Escape check
            if (zx * zx + zy * zy + zz * zz > bailout2) break;
        }
        
        const r = Math.sqrt(zx * zx + zy * zy + zz * zz);
        return (r - 0.5) / Math.abs(dz);
    }

    // =========================================================================
    // VARIANTS
    // =========================================================================

    /**
     * Get Amazing Box variant (preset)
     * @returns {Object}
     */
    static getAmazingBoxPreset() {
        return {
            boxScale: -1.5,
            foldLimit: 1.0,
            minRadius: 0.5,
            fixedRadius: 1.0,
            maxIterations: 20
        };
    }

    /**
     * Get Soft Mandelbox preset
     * @returns {Object}
     */
    static getSoftMandelboxPreset() {
        return {
            boxScale: 2.0,
            foldLimit: 1.0,
            minRadius: 0.25,
            fixedRadius: 1.0,
            maxIterations: 15
        };
    }

    /**
     * Get Spiky Mandelbox preset
     * @returns {Object}
     */
    static getSpikyMandelboxPreset() {
        return {
            boxScale: -2.0,
            foldLimit: 0.5,
            minRadius: 0.1,
            fixedRadius: 1.0,
            maxIterations: 25
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Mandelbox;
