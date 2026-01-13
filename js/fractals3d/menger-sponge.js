/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                     ABYSS EXPLORER - MENGER SPONGE                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  The Menger Sponge - A classic 3D IFS fractal                                 ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Menger sponge is constructed by:                                         ║
 * ║  1. Start with a cube                                                         ║
 * ║  2. Divide into 27 smaller cubes (3×3×3)                                      ║
 * ║  3. Remove the center cube and the 6 face-center cubes (7 total)              ║
 * ║  4. Repeat for each remaining cube                                            ║
 * ║                                                                                ║
 * ║  Properties:                                                                   ║
 * ║  - Hausdorff dimension: log(20)/log(3) ≈ 2.727                                ║
 * ║  - Zero volume but infinite surface area                                      ║
 * ║  - Self-similar at all scales                                                 ║
 * ║                                                                                ║
 * ║  IFS Distance Estimation:                                                      ║
 * ║  ═════════════════════════                                                     ║
 * ║  For efficient DE, we use the iterative method:                               ║
 * ║  1. Map point into fundamental domain [0,1]³                                  ║
 * ║  2. At each level, check if point is in "removed" region                      ║
 * ║  3. Fold/scale into next level                                                ║
 * ║                                                                                ║
 * ║  The DE tracks the scaling factor through iterations.                         ║
 * ║                                                                                ║
 * ║  Variants:                                                                     ║
 * ║  - Jerusalem Cube (different removal pattern)                                 ║
 * ║  - Mosely Snowflake                                                           ║
 * ║  - Hybrid Menger (combined with other fractals)                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// MENGER SPONGE CLASS
// =============================================================================

/**
 * Menger Sponge 3D Fractal
 * 
 * Classic IFS fractal with cube removal pattern.
 * 
 * @extends Fractal3DBase
 */
export class MengerSponge extends Fractal3DBase {
    constructor(params = null) {
        super(params);
        
        // Set variant
        if (!this.params.extra.variant) {
            this.params.extra.variant = 'standard';
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'menger-sponge';
    }

    getName() {
        return 'Menger Sponge';
    }

    getDescription() {
        return 'The Menger Sponge: a 3D fractal created by recursively removing ' +
               'cube centers. Has zero volume but infinite surface area.';
    }

    getFormula() {
        return '\\text{Recursive cube removal}';
    }

    getDefaultParams() {
        return {
            maxIterations: 8,  // Menger needs fewer iterations
            bailout: 10.0,
            epsilon: 0.0001,
            maxSteps: 256,
            maxDistance: 50.0,
            stepMultiplier: 0.95
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
            min: { x: -1, y: -1, z: -1 },
            max: { x: 1, y: 1, z: 1 }
        };
    }

    getExtraParams() {
        return [
            {
                name: 'variant',
                type: 'select',
                default: 'standard',
                options: ['standard', 'jerusalem', 'cross', 'hybrid'],
                description: 'Menger variant'
            },
            {
                name: 'cubeSize',
                type: 'number',
                default: 1.0,
                min: 0.1,
                max: 2.0,
                description: 'Base cube size'
            },
            {
                name: 'crossWidth',
                type: 'number',
                default: 0.5,
                min: 0.1,
                max: 0.9,
                description: 'Cross hole width (for standard)'
            }
        ];
    }

    supportsJulia() {
        return false; // Menger doesn't have a Julia mode
    }

    // =========================================================================
    // DISTANCE ESTIMATOR (GLSL)
    // =========================================================================

    /**
     * Get GLSL distance estimator for Menger Sponge
     * 
     * Uses the cross-DE technique from Inigo Quilez.
     * 
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        return `
// =========================================================================
// MENGER SPONGE DISTANCE ESTIMATOR
// =========================================================================

/**
 * Box distance (signed distance to an axis-aligned box)
 */
float sdBox(vec3 p, vec3 b) {
    vec3 d = abs(p) - b;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

/**
 * Cross distance (used for Menger removal pattern)
 * 
 * The cross is the union of:
 * - Infinite beam along X
 * - Infinite beam along Y  
 * - Infinite beam along Z
 */
float sdCross(vec3 p, float w) {
    float dX = max(abs(p.y), abs(p.z));  // Distance to X beam
    float dY = max(abs(p.x), abs(p.z));  // Distance to Y beam
    float dZ = max(abs(p.x), abs(p.y));  // Distance to Z beam
    return min(min(dX, dY), dZ) - w;
}

/**
 * Menger Sponge Distance Estimator
 * 
 * Uses iterative IFS approach:
 * 1. Start with unit cube
 * 2. At each level, check cross removal
 * 3. Fold into next octant and scale
 */
float DE(vec3 p) {
    float d = sdBox(p, vec3(1.0));
    float s = 1.0;
    
    float crossWidth = 1.0 / 3.0;  // Standard Menger cross width
    
    for (int i = 0; i < 20; i++) {
        if (i >= u_maxIterations) break;
        
        // Map to positive octant (symmetry)
        vec3 a = mod(p * s, 2.0) - 1.0;
        
        // Scale factor for this level
        s *= 3.0;
        
        // Compute distance to cross removal
        vec3 r = abs(1.0 - 3.0 * abs(a));
        
        // Cross distance at this level
        float c = sdCross(r, 1.0) / s;
        
        // Accumulate distance (intersection)
        d = max(d, c);
    }
    
    return d;
}
`;
    }

    /**
     * Alternative: Exact IFS Menger
     * @returns {string}
     */
    getExactDE() {
        return `
/**
 * Exact Menger Sponge using proper IFS iteration
 */
float DE(vec3 p) {
    vec3 z = p;
    float scale = 1.0;
    
    float d = sdBox(z, vec3(1.0));
    
    for (int i = 0; i < 20; i++) {
        if (i >= u_maxIterations) break;
        
        // Fold into [0, 1]³
        z = abs(z);
        
        // Sort coordinates (largest first)
        if (z.x < z.y) z.xy = z.yx;
        if (z.x < z.z) z.xz = z.zx;
        if (z.y < z.z) z.yz = z.zy;
        
        // Scale and translate
        z = z * 3.0 - 2.0;
        
        // Fold back if past center
        if (z.z < -1.0) z.z += 2.0;
        
        scale *= 3.0;
        
        // Distance to infinite cross at this level
        float crossD = min(
            min(
                max(abs(z.x), abs(z.y)),
                max(abs(z.y), abs(z.z))
            ),
            max(abs(z.x), abs(z.z))
        ) / scale;
        
        d = max(d, crossD - 1.0/scale);
    }
    
    return d;
}
`;
    }

    // =========================================================================
    // COLOR FUNCTION
    // =========================================================================

    getColorFunction() {
        return `
/**
 * Menger Sponge coloring based on position and iteration depth
 */
vec3 getColor(vec3 p, vec3 n, int steps) {
    // Use position for base color
    vec3 col = abs(p);
    
    // Normalize
    col = col / (col + 1.0);
    
    // Add normal-based variation
    vec3 normCol = n * 0.5 + 0.5;
    col = mix(col, normCol, 0.3);
    
    // Apply color controls
    float t = (col.x + col.y + col.z) / 3.0;
    t = t * u_colorFrequency + u_colorOffset;
    
    // Palette
    vec3 finalCol;
    finalCol.r = 0.5 + 0.4 * cos(TAU * (t + 0.0));
    finalCol.g = 0.5 + 0.4 * cos(TAU * (t + 0.33));
    finalCol.b = 0.5 + 0.4 * cos(TAU * (t + 0.67));
    
    return mix(col, finalCol, 0.5);
}
`;
    }

    // =========================================================================
    // CPU DISTANCE ESTIMATOR
    // =========================================================================

    /**
     * CPU evaluation of Menger Sponge distance
     * 
     * @param {{x: number, y: number, z: number}} pos
     * @returns {number}
     */
    evaluateDE(pos) {
        const maxIter = this.params.maxIterations;
        
        // Initial box distance
        const bx = Math.abs(pos.x) - 1;
        const by = Math.abs(pos.y) - 1;
        const bz = Math.abs(pos.z) - 1;
        let d = Math.min(Math.max(bx, Math.max(by, bz)), 0) +
                Math.sqrt(Math.max(0, bx) ** 2 + Math.max(0, by) ** 2 + Math.max(0, bz) ** 2);
        
        let s = 1.0;
        
        for (let i = 0; i < maxIter; i++) {
            // Map to [0, 2] then center at [-1, 1]
            const ax = ((pos.x * s % 2) + 2) % 2 - 1;
            const ay = ((pos.y * s % 2) + 2) % 2 - 1;
            const az = ((pos.z * s % 2) + 2) % 2 - 1;
            
            s *= 3;
            
            // Distance to cross
            const rx = Math.abs(1 - 3 * Math.abs(ax));
            const ry = Math.abs(1 - 3 * Math.abs(ay));
            const rz = Math.abs(1 - 3 * Math.abs(az));
            
            const crossD = (Math.min(Math.max(rx, ry), Math.min(Math.max(ry, rz), Math.max(rx, rz))) - 1) / s;
            
            d = Math.max(d, crossD);
        }
        
        return d;
    }

    // =========================================================================
    // VARIANTS
    // =========================================================================

    /**
     * Get Jerusalem Cube variant DE
     * @returns {string}
     */
    getJerusalemCubeDE() {
        return `
/**
 * Jerusalem Cube - different removal pattern
 */
float DE(vec3 p) {
    float d = sdBox(p, vec3(1.0));
    float s = 1.0;
    
    for (int i = 0; i < 20; i++) {
        if (i >= u_maxIterations) break;
        
        vec3 a = mod(p * s, 2.0) - 1.0;
        s *= 3.0;
        
        // Jerusalem pattern: remove only face centers, not edge centers
        vec3 r = abs(1.0 - 3.0 * abs(a));
        
        float dFace = min(min(
            max(r.x, r.y) - 1.0,
            max(r.y, r.z) - 1.0),
            max(r.x, r.z) - 1.0) / s;
        
        d = max(d, dFace);
    }
    
    return d;
}
`;
    }

    /**
     * Get hybrid Menger-Mandelbulb DE
     * @returns {string}
     */
    getHybridDE() {
        return `
/**
 * Hybrid Menger-Mandelbulb
 */
float DE(vec3 p) {
    // Alternate between Menger and Mandelbulb-like operations
    vec3 z = p;
    float dr = 1.0;
    float power = u_power;
    
    for (int i = 0; i < 20; i++) {
        if (i >= u_maxIterations) break;
        
        if (i % 2 == 0) {
            // Menger-style fold
            z = abs(z);
            if (z.x < z.y) z.xy = z.yx;
            if (z.x < z.z) z.xz = z.zx;
            if (z.y < z.z) z.yz = z.zy;
            z = z * 3.0 - 2.0;
            if (z.z < -1.0) z.z += 2.0;
            dr *= 3.0;
        } else {
            // Spherical power
            float r = length(z);
            if (r > u_bailout) break;
            
            float theta = acos(clamp(z.z / r, -1.0, 1.0));
            float phi = atan(z.y, z.x);
            
            dr = pow(r, power - 1.0) * power * dr + 1.0;
            
            float zr = pow(r, power);
            z = zr * vec3(
                sin(theta * power) * cos(phi * power),
                sin(theta * power) * sin(phi * power),
                cos(theta * power)
            );
        }
    }
    
    float r = length(z);
    return 0.5 * log(r) * r / dr;
}
`;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default MengerSponge;
