/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - KLEINIAN FRACTALS                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Kleinian group limit sets - hyperbolic geometry fractals                     ║
 * ║                                                                                ║
 * ║  Mathematical Foundation:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  Kleinian groups are discrete subgroups of PSL(2,C), the group of             ║
 * ║  Möbius transformations on the Riemann sphere:                                ║
 * ║                                                                                ║
 * ║    f(z) = (az + b) / (cz + d)  where ad - bc = 1                             ║
 * ║                                                                                ║
 * ║  The limit set Λ(G) is the set of accumulation points of orbits.             ║
 * ║                                                                                ║
 * ║  In 3D, we work with the upper half-space model H³ where:                     ║
 * ║  - Points are (x, y, z) with z > 0                                            ║
 * ║  - Geodesics are vertical lines and semicircles                               ║
 * ║  - Isometries extend the Möbius transformations                               ║
 * ║                                                                                ║
 * ║  Distance Estimation:                                                          ║
 * ║  ════════════════════                                                          ║
 * ║  For Kleinian fractals, we use inversion-based IFS:                           ║
 * ║  1. Apply box/sphere inversions to fold space                                 ║
 * ║  2. Track the derivative through inversions                                   ║
 * ║  3. DE ≈ (distance to fundamental domain) / derivative                        ║
 * ║                                                                                ║
 * ║  The "Knighty" formula (by Knighty from fractalforums):                       ║
 * ║  Uses Möbius-like folds to create intricate limit set structures.             ║
 * ║                                                                                ║
 * ║  Variants:                                                                     ║
 * ║  - Apollonian gasket (circle packing limit set)                               ║
 * ║  - Schottky groups (non-overlapping circle inversion)                         ║
 * ║  - Quasi-Fuchsian (deformations of Fuchsian groups)                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// KLEINIAN CLASS
// =============================================================================

/**
 * Kleinian Group Fractals
 * 
 * Limit sets of Kleinian groups rendered via inversion IFS.
 * 
 * @extends Fractal3DBase
 */
export class Kleinian extends Fractal3DBase {
    constructor(params = null) {
        super(params);
        
        // Kleinian-specific parameters
        if (!this.params.extra.boxSize) {
            this.params.extra.boxSize = { x: 0.5513, y: 0.6, z: 0.8 };
        }
        if (!this.params.extra.kleinianFactor) {
            this.params.extra.kleinianFactor = 1.0;
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'kleinian';
    }

    getName() {
        return 'Kleinian';
    }

    getDescription() {
        return 'Kleinian group limit sets: fractal boundaries of hyperbolic tilings. ' +
               'Uses Möbius-like inversions in 3D.';
    }

    getFormula() {
        return '\\text{Inversion IFS with M\\"obius folds}';
    }

    getDefaultParams() {
        return {
            maxIterations: 20,
            bailout: 100.0,
            epsilon: 0.0001,
            maxSteps: 256,
            maxDistance: 100.0,
            stepMultiplier: 0.9
        };
    }

    getDefaultCamera() {
        return {
            position: { x: 0, y: 2, z: 0 },
            target: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 0, z: 1 }
        };
    }

    getBoundingBox() {
        return {
            min: { x: -2, y: -1, z: -2 },
            max: { x: 2, y: 3, z: 2 }
        };
    }

    getExtraParams() {
        return [
            {
                name: 'boxSizeX',
                type: 'number',
                default: 0.5513,
                min: 0.1,
                max: 1.0,
                description: 'Box fold size X'
            },
            {
                name: 'boxSizeY',
                type: 'number',
                default: 0.6,
                min: 0.1,
                max: 1.0,
                description: 'Box fold size Y'
            },
            {
                name: 'boxSizeZ',
                type: 'number',
                default: 0.8,
                min: 0.1,
                max: 2.0,
                description: 'Box fold size Z'
            },
            {
                name: 'kleinianFactor',
                type: 'number',
                default: 1.0,
                min: 0.1,
                max: 2.0,
                description: 'Kleinian deformation factor'
            },
            {
                name: 'sphereRadius',
                type: 'number',
                default: 1.0,
                min: 0.1,
                max: 2.0,
                description: 'Inversion sphere radius'
            },
            {
                name: 'variant',
                type: 'select',
                default: 'knighty',
                options: ['knighty', 'apollonian', 'schottky'],
                description: 'Kleinian variant'
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
     * Get GLSL distance estimator for Kleinian
     * 
     * Based on Knighty's formula from fractalforums.
     * 
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        return `
// =========================================================================
// KLEINIAN DISTANCE ESTIMATOR
// =========================================================================

// Box fold size (can be uniforms)
const vec3 box_size = vec3(0.5513, 0.6, 0.8);

// Kleinian parameters
const float KleinR = 1.94;
const float KleinI = 0.03;

/**
 * Wrap function - folds into fundamental domain
 */
vec3 wrap(vec3 p, vec3 a, vec3 b) {
    return p - b * floor((p - a) / b);
}

/**
 * Sphere inversion
 * 
 * Inverts point through sphere of radius r centered at c:
 *   p' = c + r² * (p - c) / |p - c|²
 */
vec3 sphereInverse(vec3 p, vec3 c, float r) {
    vec3 d = p - c;
    float r2 = dot(d, d);
    return c + d * (r * r / r2);
}

/**
 * Kleinian Distance Estimator (Knighty formula)
 * 
 * Uses a combination of:
 * 1. Box wrapping (periodic tiling)
 * 2. Sphere inversion (Möbius-like)
 * 3. Min distance tracking
 */
float DE(vec3 p) {
    vec3 ap = p + vec3(1.0);
    
    float scale = 1.0;
    float dist = 10000.0;
    
    float kleinR = KleinR;
    float kleinI = KleinI;
    
    for (int i = 0; i < 40; i++) {
        if (i >= u_maxIterations) break;
        
        // Wrap to fundamental domain
        ap = wrap(ap, -box_size, 2.0 * box_size);
        
        /**
         * Kleinian transformation:
         * This is a simplified version of Möbius inversion
         * that creates the limit set structure.
         */
        
        // Sphere fold 1
        float r2 = dot(ap, ap);
        float k = max(kleinR / r2, 1.0);
        
        ap *= k;
        scale *= k;
        
        // Rotation/shear (Möbius-like)
        ap.x = kleinR * ap.x - kleinI;
        ap.y = kleinR * ap.y;
        
        // Track minimum distance
        dist = min(dist, length(ap) / scale);
    }
    
    // Final distance
    return dist * 0.5;
}
`;
    }

    /**
     * Get Apollonian gasket variant DE
     * @returns {string}
     */
    getApollonianDE() {
        return `
/**
 * Apollonian Gasket (3D sphere packing limit set)
 * 
 * Uses 4 mutually tangent spheres and their inversions.
 */
float DE(vec3 p) {
    // Four sphere centers (tetrahedral arrangement)
    vec3 c1 = vec3( 0.0,  0.0,  1.0);
    vec3 c2 = vec3( 0.943, 0.0, -0.333);
    vec3 c3 = vec3(-0.471,  0.816, -0.333);
    vec3 c4 = vec3(-0.471, -0.816, -0.333);
    
    float r = 1.0;  // Sphere radius
    float scale = 1.0;
    vec3 z = p;
    
    for (int i = 0; i < 40; i++) {
        if (i >= u_maxIterations) break;
        
        // Find which sphere we're closest to
        float d1 = length(z - c1) - r;
        float d2 = length(z - c2) - r;
        float d3 = length(z - c3) - r;
        float d4 = length(z - c4) - r;
        
        float minD = min(min(d1, d2), min(d3, d4));
        
        // Invert through nearest sphere
        vec3 c;
        if (minD == d1) c = c1;
        else if (minD == d2) c = c2;
        else if (minD == d3) c = c3;
        else c = c4;
        
        vec3 d = z - c;
        float r2 = dot(d, d);
        float invScale = r * r / r2;
        z = c + d * invScale;
        scale *= invScale;
        
        if (r2 > u_bailout) break;
    }
    
    return (length(z) - r) / scale;
}
`;
    }

    /**
     * Get Schottky group variant DE
     * @returns {string}
     */
    getSchottkyDE() {
        return `
/**
 * Schottky Group Limit Set
 * 
 * Two pairs of non-intersecting circles, with inversions.
 */
float DE(vec3 p) {
    // Two pairs of circles (in xz plane, varied by y)
    vec2 c1 = vec2(-1.5, 0.0);
    vec2 c2 = vec2( 1.5, 0.0);
    float r1 = 0.9;
    float r2 = 0.9;
    
    float scale = 1.0;
    vec3 z = p;
    
    for (int i = 0; i < 40; i++) {
        if (i >= u_maxIterations) break;
        
        // Project to xz plane for circle inversions
        vec2 zxz = vec2(z.x, z.z);
        
        // Check both circles
        float d1 = length(zxz - c1) - r1;
        float d2 = length(zxz - c2) - r2;
        
        // Invert through nearest
        vec2 c;
        float r;
        if (d1 < d2) { c = c1; r = r1; }
        else { c = c2; r = r2; }
        
        vec2 d = zxz - c;
        float len2 = dot(d, d);
        
        if (len2 < r * r) {
            float invScale = r * r / len2;
            z.x = c.x + d.x * invScale;
            z.z = c.y + d.y * invScale;
            scale *= invScale;
        }
        
        // Y axis fold
        z.y = abs(z.y) - 0.5;
        
        if (length(z) > u_bailout) break;
    }
    
    return length(z) / scale * 0.1;
}
`;
    }

    // =========================================================================
    // COLOR FUNCTION
    // =========================================================================

    getColorFunction() {
        return `
/**
 * Kleinian coloring based on orbit and fold count
 */
vec3 getColor(vec3 p, vec3 n, int steps) {
    vec3 ap = p + vec3(1.0);
    
    float foldCount = 0.0;
    vec3 orbitColor = vec3(0.0);
    
    float kleinR = KleinR;
    float kleinI = KleinI;
    
    for (int i = 0; i < 40; i++) {
        if (i >= u_maxIterations) break;
        
        vec3 oldAp = ap;
        ap = wrap(ap, -box_size, 2.0 * box_size);
        
        if (length(ap - oldAp) > 0.01) foldCount += 1.0;
        
        float r2 = dot(ap, ap);
        float k = max(kleinR / r2, 1.0);
        ap *= k;
        
        ap.x = kleinR * ap.x - kleinI;
        ap.y = kleinR * ap.y;
        
        orbitColor += abs(ap) * 0.01;
    }
    
    // Color from folds and orbit
    float t = foldCount * 0.05 * u_colorFrequency + u_colorOffset;
    
    vec3 col;
    col.r = 0.5 + 0.5 * cos(TAU * (t + 0.0));
    col.g = 0.5 + 0.5 * cos(TAU * (t + 0.33));
    col.b = 0.5 + 0.5 * cos(TAU * (t + 0.67));
    
    // Mix with orbit color
    orbitColor = orbitColor / (orbitColor + 1.0);
    col = mix(col, orbitColor, u_orbitStrength * 0.5);
    
    return col;
}
`;
    }

    // =========================================================================
    // CPU DISTANCE ESTIMATOR
    // =========================================================================

    /**
     * CPU evaluation of Kleinian distance
     * 
     * @param {{x: number, y: number, z: number}} pos
     * @returns {number}
     */
    evaluateDE(pos) {
        const maxIter = this.params.maxIterations;
        const boxSize = this.params.extra.boxSize || { x: 0.5513, y: 0.6, z: 0.8 };
        
        const kleinR = 1.94;
        const kleinI = 0.03;
        
        let ax = pos.x + 1;
        let ay = pos.y + 1;
        let az = pos.z + 1;
        
        let scale = 1;
        let dist = 10000;
        
        for (let i = 0; i < maxIter; i++) {
            // Wrap
            ax = ax - 2 * boxSize.x * Math.floor((ax + boxSize.x) / (2 * boxSize.x));
            ay = ay - 2 * boxSize.y * Math.floor((ay + boxSize.y) / (2 * boxSize.y));
            az = az - 2 * boxSize.z * Math.floor((az + boxSize.z) / (2 * boxSize.z));
            
            // Sphere fold
            const r2 = ax * ax + ay * ay + az * az;
            const k = Math.max(kleinR / r2, 1);
            
            ax *= k;
            ay *= k;
            az *= k;
            scale *= k;
            
            // Kleinian transform
            ax = kleinR * ax - kleinI;
            ay = kleinR * ay;
            
            // Track distance
            dist = Math.min(dist, Math.sqrt(ax * ax + ay * ay + az * az) / scale);
        }
        
        return dist * 0.5;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Kleinian;
