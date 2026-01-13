/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - QUATERNION JULIA                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Quaternion-based Julia sets in 3D                                            ║
 * ║                                                                                ║
 * ║  Mathematical Foundation:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  Quaternions are 4D hypercomplex numbers: q = w + xi + yj + zk               ║
 * ║  where i² = j² = k² = ijk = -1                                               ║
 * ║                                                                                ║
 * ║  The quaternion Julia set is the boundary of:                                 ║
 * ║    J_c = { q ∈ ℍ : q_n = q_{n-1}² + c remains bounded }                       ║
 * ║                                                                                ║
 * ║  To visualize in 3D, we take a 3D slice of the 4D set:                       ║
 * ║    q = (x, y, z, w_fixed) or q = (x, y, z_fixed, w)                          ║
 * ║                                                                                ║
 * ║  Quaternion Squaring:                                                          ║
 * ║  ════════════════════                                                          ║
 * ║  q² = (w + xi + yj + zk)²                                                     ║
 * ║     = (w² - x² - y² - z²) + 2wx·i + 2wy·j + 2wz·k                            ║
 * ║                                                                                ║
 * ║  In vector form: q² = (w² - |v|², 2wv)                                        ║
 * ║  where v = (x, y, z) is the vector part.                                      ║
 * ║                                                                                ║
 * ║  Distance Estimator:                                                           ║
 * ║  ════════════════════                                                          ║
 * ║  Similar to 2D Mandelbrot, using the derivative:                              ║
 * ║    q'_{n+1} = 2·q_n·q'_n (quaternion multiplication)                          ║
 * ║    DE = |q_n|·log|q_n| / |q'_n|                                               ║
 * ║                                                                                ║
 * ║  Variants:                                                                     ║
 * ║  - Cubic: q³ + c (more complex shapes)                                        ║
 * ║  - Bicomplex: commutative 4D version                                          ║
 * ║  - Hypercomplex: different multiplication rules                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import { Quaternion, QuaternionJulia as QJulia } from '../math/quaternion.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// QUATERNION JULIA PRESETS
// =============================================================================

/**
 * Interesting Julia constants for quaternion Julia sets
 */
export const QuaternionJuliaPresets = {
    // Classic shapes
    classic1: { w: -0.2, x: 0.8, y: 0.0, z: 0.0, name: 'Classic 1' },
    classic2: { w: -0.4, x: 0.6, y: 0.0, z: 0.0, name: 'Classic 2' },
    
    // Spirals
    spiral1: { w: -0.125, x: 0.744, y: 0.0, z: 0.0, name: 'Spiral 1' },
    spiral2: { w: 0.0, x: 0.9, y: 0.0, z: 0.0, name: 'Spiral 2' },
    
    // Complex structures
    complex1: { w: -0.291, x: -0.399, y: 0.339, z: 0.437, name: 'Complex 1' },
    complex2: { w: -0.213, x: 0.0, y: -0.6, z: 0.0, name: 'Complex 2' },
    
    // Organic
    organic1: { w: -0.08, x: 0.0, y: -0.83, z: -0.025, name: 'Organic 1' },
    organic2: { w: -0.125, x: -0.256, y: 0.847, z: 0.0895, name: 'Organic 2' },
    
    // Dendrites
    dendrite1: { w: 0.185, x: 0.0, y: 0.0, z: 0.0, name: 'Dendrite 1' },
    dendrite2: { w: -0.1, x: 0.1, y: 0.8, z: 0.0, name: 'Dendrite 2' },
    
    // Symmetric
    symmetric1: { w: -0.5, x: 0.5, y: 0.5, z: 0.0, name: 'Symmetric 1' },
    symmetric2: { w: 0.0, x: 0.707, y: 0.707, z: 0.0, name: 'Symmetric 2' }
};

// =============================================================================
// QUATERNION JULIA CLASS
// =============================================================================

/**
 * Quaternion Julia 3D Fractal
 * 
 * 3D slices of 4D quaternion Julia sets.
 * 
 * @extends Fractal3DBase
 */
export class JuliaQuaternion extends Fractal3DBase {
    constructor(params = null) {
        super(params);
        
        // Initialize Julia constant
        if (!this.params.juliaOffset.w) {
            const preset = QuaternionJuliaPresets.classic1;
            this.params.juliaOffset = {
                x: preset.x,
                y: preset.y,
                z: preset.z,
                w: preset.w
            };
        }
        
        // Set default slice dimension
        if (!this.params.extra.sliceW) {
            this.params.extra.sliceW = 0;
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'julia-quaternion';
    }

    getName() {
        return 'Quaternion Julia';
    }

    getDescription() {
        return 'Julia sets in quaternion (4D) space, visualized as 3D slices. ' +
               'Uses non-commutative quaternion multiplication.';
    }

    getFormula() {
        return 'q_{n+1} = q_n^2 + c \\quad (q \\in \\mathbb{H})';
    }

    getDefaultParams() {
        return {
            maxIterations: 12,
            bailout: 4.0,
            epsilon: 0.0005,
            maxSteps: 200,
            maxDistance: 50.0,
            stepMultiplier: 0.8,
            juliaMode: true,  // Always Julia mode
            juliaOffset: { x: 0.8, y: 0, z: 0, w: -0.2 }
        };
    }

    getDefaultCamera() {
        return {
            position: { x: 0, y: 0, z: 2.5 },
            target: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 1, z: 0 }
        };
    }

    getBoundingBox() {
        return {
            min: { x: -1.5, y: -1.5, z: -1.5 },
            max: { x: 1.5, y: 1.5, z: 1.5 }
        };
    }

    getExtraParams() {
        return [
            {
                name: 'juliaW',
                type: 'number',
                default: -0.2,
                min: -1,
                max: 1,
                description: 'Julia c: w component'
            },
            {
                name: 'juliaX',
                type: 'number',
                default: 0.8,
                min: -1,
                max: 1,
                description: 'Julia c: x component'
            },
            {
                name: 'juliaY',
                type: 'number',
                default: 0,
                min: -1,
                max: 1,
                description: 'Julia c: y component'
            },
            {
                name: 'juliaZ',
                type: 'number',
                default: 0,
                min: -1,
                max: 1,
                description: 'Julia c: z component'
            },
            {
                name: 'sliceW',
                type: 'number',
                default: 0,
                min: -1,
                max: 1,
                description: 'W coordinate for 3D slice'
            },
            {
                name: 'power',
                type: 'number',
                default: 2,
                min: 2,
                max: 8,
                description: 'Power for q^n + c'
            },
            {
                name: 'variant',
                type: 'select',
                default: 'quaternion',
                options: ['quaternion', 'bicomplex', 'hypercomplex'],
                description: 'Multiplication type'
            }
        ];
    }

    supportsJulia() {
        return true; // Always Julia
    }

    /**
     * Set Julia constant from preset
     * @param {string} presetName
     */
    setPreset(presetName) {
        if (presetName in QuaternionJuliaPresets) {
            const preset = QuaternionJuliaPresets[presetName];
            this.params.juliaOffset = {
                x: preset.x,
                y: preset.y,
                z: preset.z,
                w: preset.w
            };
            this.invalidateShader();
        }
    }

    /**
     * Get available presets
     * @returns {string[]}
     */
    getPresets() {
        return Object.keys(QuaternionJuliaPresets);
    }

    // =========================================================================
    // DISTANCE ESTIMATOR (GLSL)
    // =========================================================================

    /**
     * Get GLSL distance estimator for Quaternion Julia
     * 
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        return `
// =========================================================================
// QUATERNION JULIA DISTANCE ESTIMATOR
// =========================================================================

/**
 * Quaternion multiplication
 * 
 * (a + bi + cj + dk)(e + fi + gj + hk) =
 *   (ae - bf - cg - dh) +
 *   (af + be + ch - dg)i +
 *   (ag - bh + ce + df)j +
 *   (ah + bg - cf + de)k
 */
vec4 qMul(vec4 a, vec4 b) {
    return vec4(
        a.x * b.x - a.y * b.y - a.z * b.z - a.w * b.w,
        a.x * b.y + a.y * b.x + a.z * b.w - a.w * b.z,
        a.x * b.z - a.y * b.w + a.z * b.x + a.w * b.y,
        a.x * b.w + a.y * b.z - a.z * b.y + a.w * b.x
    );
}

/**
 * Quaternion squaring (optimized)
 * 
 * q² = (w² - |v|²) + 2wv
 * where v = (x, y, z)
 */
vec4 qSquare(vec4 q) {
    return vec4(
        q.x * q.x - q.y * q.y - q.z * q.z - q.w * q.w,
        2.0 * q.x * q.y,
        2.0 * q.x * q.z,
        2.0 * q.x * q.w
    );
}

/**
 * Quaternion length squared
 */
float qLengthSq(vec4 q) {
    return dot(q, q);
}

/**
 * Quaternion Julia Distance Estimator
 * 
 * For the iteration q_{n+1} = q_n² + c:
 * - Track running derivative dq
 * - DE = |q| * log|q| / |dq|
 */
float DE(vec3 pos) {
    // Create quaternion from 3D position (w from slice parameter or 0)
    float sliceW = 0.0;  // Could be uniform
    vec4 q = vec4(pos, sliceW);
    
    // Julia constant
    vec4 c = u_juliaOffset;
    
    // Running derivative (starts at 1)
    vec4 dq = vec4(1.0, 0.0, 0.0, 0.0);
    
    float r2 = 0.0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        r2 = qLengthSq(q);
        
        // Escape check
        if (r2 > u_bailout * u_bailout) break;
        
        /**
         * Derivative update:
         * For f(q) = q² + c, f'(q) = 2q
         * So dq_{n+1} = 2 * q_n * dq_n (quaternion product)
         */
        dq = 2.0 * qMul(q, dq);
        
        // Main iteration: q = q² + c
        q = qSquare(q) + c;
    }
    
    float r = sqrt(r2);
    float dr = length(dq);
    
    // Distance estimate
    if (dr == 0.0) return 0.0;
    return 0.5 * log(r) * r / dr;
}
`;
    }

    /**
     * Get bicomplex variant DE (commutative 4D)
     * @returns {string}
     */
    getBicomplexDE() {
        return `
/**
 * Bicomplex Julia (commutative multiplication)
 * 
 * z = (z1, z2) where z1, z2 are complex
 * z² = (z1² - z2², 2·z1·z2)
 */
float DE(vec3 pos) {
    // z1 = (x, y), z2 = (z, w)
    vec2 z1 = vec2(pos.x, pos.y);
    vec2 z2 = vec2(pos.z, 0.0);
    
    vec2 c1 = vec2(u_juliaOffset.x, u_juliaOffset.y);
    vec2 c2 = vec2(u_juliaOffset.z, u_juliaOffset.w);
    
    float dr = 1.0;
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        float r2 = dot(z1, z1) + dot(z2, z2);
        if (r2 > u_bailout * u_bailout) break;
        
        // Derivative
        dr = 2.0 * sqrt(r2) * dr + 1.0;
        
        // Bicomplex squaring
        vec2 z1Sq = vec2(z1.x * z1.x - z1.y * z1.y, 2.0 * z1.x * z1.y);
        vec2 z2Sq = vec2(z2.x * z2.x - z2.y * z2.y, 2.0 * z2.x * z2.y);
        
        vec2 newZ1 = z1Sq - z2Sq + c1;
        vec2 newZ2 = 2.0 * vec2(z1.x * z2.x - z1.y * z2.y, z1.x * z2.y + z1.y * z2.x) + c2;
        
        z1 = newZ1;
        z2 = newZ2;
    }
    
    float r = sqrt(dot(z1, z1) + dot(z2, z2));
    return 0.5 * log(r) * r / dr;
}
`;
    }

    // =========================================================================
    // COLOR FUNCTION
    // =========================================================================

    getColorFunction() {
        return `
/**
 * Quaternion Julia coloring
 */
vec3 getColor(vec3 p, vec3 n, int steps) {
    float sliceW = 0.0;
    vec4 q = vec4(p, sliceW);
    vec4 c = u_juliaOffset;
    
    float orbitTrap = 1e10;
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        float r2 = dot(q, q);
        if (r2 > u_bailout * u_bailout) break;
        
        orbitTrap = min(orbitTrap, length(q.xyz));
        
        q = qSquare(q) + c;
    }
    
    // Color from iteration and orbit
    float t = float(steps) / float(u_maxIterations);
    t = mix(t, orbitTrap * 0.5, u_orbitStrength);
    t = t * u_colorFrequency + u_colorOffset;
    
    // Smooth palette
    vec3 col;
    col.r = 0.5 + 0.5 * cos(TAU * (t + 0.0));
    col.g = 0.5 + 0.5 * cos(TAU * (t + 0.33));
    col.b = 0.5 + 0.5 * cos(TAU * (t + 0.67));
    
    // Mix with normal
    vec3 normCol = n * 0.5 + 0.5;
    col = mix(col, normCol, 0.15);
    
    return col;
}
`;
    }

    // =========================================================================
    // CPU DISTANCE ESTIMATOR
    // =========================================================================

    /**
     * CPU evaluation of Quaternion Julia distance
     * 
     * @param {{x: number, y: number, z: number}} pos
     * @returns {number}
     */
    evaluateDE(pos) {
        const maxIter = this.params.maxIterations;
        const bailout2 = this.params.bailout * this.params.bailout;
        const c = this.params.juliaOffset;
        const sliceW = this.params.extra.sliceW || 0;
        
        // Initial quaternion
        let qw = sliceW;
        let qx = pos.x;
        let qy = pos.y;
        let qz = pos.z;
        
        // Derivative (starts as identity-like)
        let dw = 1, dx = 0, dy = 0, dz = 0;
        
        for (let i = 0; i < maxIter; i++) {
            const r2 = qw * qw + qx * qx + qy * qy + qz * qz;
            
            if (r2 > bailout2) break;
            
            // Derivative: dq' = 2 * q * dq
            const newDw = 2 * (qw * dw - qx * dx - qy * dy - qz * dz);
            const newDx = 2 * (qw * dx + qx * dw + qy * dz - qz * dy);
            const newDy = 2 * (qw * dy - qx * dz + qy * dw + qz * dx);
            const newDz = 2 * (qw * dz + qx * dy - qy * dx + qz * dw);
            
            dw = newDw;
            dx = newDx;
            dy = newDy;
            dz = newDz;
            
            // q = q² + c
            const newQw = qw * qw - qx * qx - qy * qy - qz * qz + c.w;
            const newQx = 2 * qw * qx + c.x;
            const newQy = 2 * qw * qy + c.y;
            const newQz = 2 * qw * qz + c.z;
            
            qw = newQw;
            qx = newQx;
            qy = newQy;
            qz = newQz;
        }
        
        const r = Math.sqrt(qw * qw + qx * qx + qy * qy + qz * qz);
        const dr = Math.sqrt(dw * dw + dx * dx + dy * dy + dz * dz);
        
        if (dr === 0) return 0;
        return 0.5 * Math.log(r) * r / dr;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { QuaternionJuliaPresets };
export default JuliaQuaternion;
