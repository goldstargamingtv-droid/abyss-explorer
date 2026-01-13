/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                        ABYSS EXPLORER - MANDELBULB                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  The Mandelbulb - 3D extension of the Mandelbrot set                          ║
 * ║                                                                                ║
 * ║  Mathematical Definition:                                                      ║
 * ║  ════════════════════════                                                      ║
 * ║  The Mandelbulb uses spherical coordinates to define a "power" operation      ║
 * ║  in 3D. Unlike quaternions, this creates a true 3D fractal structure.        ║
 * ║                                                                                ║
 * ║  Spherical Power Formula:                                                      ║
 * ║  ─────────────────────────                                                     ║
 * ║  Given a 3D point (x, y, z), convert to spherical:                            ║
 * ║    r = √(x² + y² + z²)                                                        ║
 * ║    θ = arctan(y/x)           (azimuthal angle)                                ║
 * ║    φ = arccos(z/r)           (polar angle)                                    ║
 * ║                                                                                ║
 * ║  Power operation (z^n):                                                        ║
 * ║    r' = r^n                                                                    ║
 * ║    θ' = n × θ                                                                  ║
 * ║    φ' = n × φ                                                                  ║
 * ║                                                                                ║
 * ║  Convert back to Cartesian:                                                    ║
 * ║    x' = r' × sin(φ') × cos(θ')                                                ║
 * ║    y' = r' × sin(φ') × sin(θ')                                                ║
 * ║    z' = r' × cos(φ')                                                          ║
 * ║                                                                                ║
 * ║  Iteration:                                                                    ║
 * ║    z_{n+1} = z_n^power + c                                                    ║
 * ║  where c = initial point (Mandelbrot mode) or fixed (Julia mode)             ║
 * ║                                                                                ║
 * ║  Distance Estimator:                                                           ║
 * ║  ════════════════════                                                          ║
 * ║  Using the running derivative dr:                                              ║
 * ║    dr_{n+1} = power × r^{power-1} × dr_n + 1                                  ║
 * ║                                                                                ║
 * ║  Distance estimate:                                                            ║
 * ║    DE = 0.5 × log(r) × r / dr                                                 ║
 * ║                                                                                ║
 * ║  History:                                                                      ║
 * ║  Discovered by Daniel White and Paul Nylander (2009).                         ║
 * ║  The "true" 3D Mandelbrot after many failed attempts with quaternions.        ║
 * ║  Power 8 is the classic "bulb" shape; power 2 is more like a sphere.          ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import { Quaternion } from '../math/quaternion.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// MANDELBULB CLASS
// =============================================================================

/**
 * Mandelbulb 3D Fractal
 * 
 * The classic 3D extension of the Mandelbrot set using spherical coordinates.
 * 
 * @extends Fractal3DBase
 */
export class Mandelbulb extends Fractal3DBase {
    constructor(params = null) {
        super(params);
        
        // Mandelbulb-specific parameters
        if (!this.params.extra.variant) {
            this.params.extra.variant = 'standard';
        }
    }

    // =========================================================================
    // INTERFACE IMPLEMENTATION
    // =========================================================================

    getId() {
        return 'mandelbulb';
    }

    getName() {
        return 'Mandelbulb';
    }

    getDescription() {
        return 'The Mandelbulb: a 3D extension of the Mandelbrot set using spherical ' +
               'coordinate power. Power 8 gives the classic bulb shape.';
    }

    getFormula() {
        return 'z_{n+1} = z_n^{power} + c \\quad (\\text{spherical coords})';
    }

    getDefaultParams() {
        return {
            maxIterations: 15,
            bailout: 2.0,
            power: 8,
            epsilon: 0.0001,
            maxSteps: 256,
            maxDistance: 50.0,
            stepMultiplier: 0.9
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
                name: 'power',
                type: 'number',
                default: 8,
                min: 2,
                max: 20,
                description: 'Power exponent (8 is classic)'
            },
            {
                name: 'variant',
                type: 'select',
                default: 'standard',
                options: ['standard', 'cosine', 'cubic', 'quadratic'],
                description: 'Mandelbulb variant'
            },
            {
                name: 'phaseShift',
                type: 'number',
                default: 0,
                min: 0,
                max: 6.28,
                description: 'Phase shift for angle multiplication'
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
     * Get GLSL distance estimator for Mandelbulb
     * 
     * Based on Inigo Quilez's implementation and the original
     * White/Nylander formula.
     * 
     * @returns {string} GLSL code
     */
    getDistanceEstimator() {
        return `
// =========================================================================
// MANDELBULB DISTANCE ESTIMATOR
// =========================================================================

/**
 * Spherical power operation
 * 
 * Converts Cartesian to spherical, multiplies angles by power,
 * raises radius to power, converts back.
 */
vec3 sphericalPower(vec3 p, float power, float phaseShift) {
    // Convert to spherical coordinates
    float r = length(p);
    
    if (r < 0.0001) return vec3(0.0);
    
    // Polar angle (from z-axis)
    float phi = acos(clamp(p.z / r, -1.0, 1.0));
    
    // Azimuthal angle (in x-y plane)
    float theta = atan(p.y, p.x) + phaseShift;
    
    // Apply power
    float rPow = pow(r, power);
    float phiPow = phi * power;
    float thetaPow = theta * power;
    
    // Convert back to Cartesian
    float sinPhi = sin(phiPow);
    return rPow * vec3(
        sinPhi * cos(thetaPow),
        sinPhi * sin(thetaPow),
        cos(phiPow)
    );
}

/**
 * Mandelbulb Distance Estimator
 * 
 * Uses running derivative for accurate distance estimation.
 * 
 * DE = 0.5 * log(r) * r / dr
 * 
 * where dr is the derivative of the orbit with respect to initial position.
 */
float DE(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    
    float power = u_power;
    float phaseShift = 0.0;  // Could be a uniform
    
    // Julia mode uses fixed c
    vec3 c = u_juliaMode > 0.5 ? u_juliaOffset.xyz : pos;
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        r = length(z);
        
        // Escape check
        if (r > u_bailout) break;
        
        /**
         * Derivative calculation:
         * 
         * For z_{n+1} = z_n^p + c, the derivative is:
         * dr_{n+1} = p * |z_n|^{p-1} * dr_n + 1
         * 
         * This tracks how fast the orbit grows.
         */
        float theta = acos(clamp(z.z / r, -1.0, 1.0));
        float phi = atan(z.y, z.x) + phaseShift;
        
        // Update derivative
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        
        // Spherical power: z = z^power + c
        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;
        
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(theta) * sin(phi),
            cos(theta)
        );
        z += c;
    }
    
    /**
     * Distance estimate formula:
     * 
     * DE = 0.5 * r * log(r) / dr
     * 
     * This gives an underestimate of the true distance to the surface,
     * which is safe for raymarching (won't overstep).
     */
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
 * Mandelbulb coloring based on orbit trap and iteration count
 */
vec3 getColor(vec3 p, vec3 n, int steps) {
    vec3 z = p;
    float r = 0.0;
    float orbitTrap = 1e10;
    
    float power = u_power;
    vec3 c = u_juliaMode > 0.5 ? u_juliaOffset.xyz : p;
    
    // Re-iterate to collect coloring data
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        r = length(z);
        if (r > u_bailout) break;
        
        // Orbit trap: distance to origin
        orbitTrap = min(orbitTrap, length(z));
        
        // Spherical power
        float theta = acos(clamp(z.z / r, -1.0, 1.0));
        float phi = atan(z.y, z.x);
        
        float zr = pow(r, power);
        theta *= power;
        phi *= power;
        
        z = zr * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
        z += c;
    }
    
    // Base color from iteration/orbit
    float t = float(steps) / float(u_maxIterations);
    t = mix(t, orbitTrap * 0.5, u_orbitStrength);
    t = t * u_colorFrequency + u_colorOffset;
    
    // Palette
    vec3 col;
    col.r = 0.5 + 0.5 * cos(TAU * (t + 0.0));
    col.g = 0.5 + 0.5 * cos(TAU * (t + 0.33));
    col.b = 0.5 + 0.5 * cos(TAU * (t + 0.67));
    
    // Mix with normal-based shading
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
     * CPU evaluation of Mandelbulb distance
     * 
     * @param {{x: number, y: number, z: number}} pos
     * @returns {number}
     */
    evaluateDE(pos) {
        const power = this.params.power;
        const bailout = this.params.bailout;
        const maxIter = this.params.maxIterations;
        const juliaMode = this.params.juliaMode;
        const juliaOffset = this.params.juliaOffset;
        
        let zx = pos.x;
        let zy = pos.y;
        let zz = pos.z;
        let dr = 1.0;
        let r = 0.0;
        
        const cx = juliaMode ? juliaOffset.x : pos.x;
        const cy = juliaMode ? juliaOffset.y : pos.y;
        const cz = juliaMode ? juliaOffset.z : pos.z;
        
        for (let i = 0; i < maxIter; i++) {
            r = Math.sqrt(zx * zx + zy * zy + zz * zz);
            
            if (r > bailout) break;
            
            // Convert to spherical
            const theta = Math.acos(Math.min(1, Math.max(-1, zz / r)));
            const phi = Math.atan2(zy, zx);
            
            // Update derivative
            dr = Math.pow(r, power - 1) * power * dr + 1;
            
            // Spherical power
            const zr = Math.pow(r, power);
            const newTheta = theta * power;
            const newPhi = phi * power;
            
            const sinTheta = Math.sin(newTheta);
            zx = zr * sinTheta * Math.cos(newPhi) + cx;
            zy = zr * sinTheta * Math.sin(newPhi) + cy;
            zz = zr * Math.cos(newTheta) + cz;
        }
        
        return 0.5 * Math.log(r) * r / dr;
    }

    // =========================================================================
    // VARIANTS
    // =========================================================================

    /**
     * Get distance estimator for specific variant
     * @param {string} variant
     * @returns {string}
     */
    getVariantDE(variant) {
        switch (variant) {
            case 'cosine':
                return this._getCosineVariantDE();
            case 'cubic':
                return this._getCubicVariantDE();
            case 'quadratic':
                return this._getQuadraticVariantDE();
            default:
                return this.getDistanceEstimator();
        }
    }

    /**
     * Cosine variant (different angle interpretation)
     * @private
     */
    _getCosineVariantDE() {
        return `
float DE(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r;
    
    vec3 c = u_juliaMode > 0.5 ? u_juliaOffset.xyz : pos;
    float power = u_power;
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        r = length(z);
        if (r > u_bailout) break;
        
        // Cosine variant uses asin instead of acos
        float theta = asin(z.z / r);
        float phi = atan(z.y, z.x);
        
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        
        float zr = pow(r, power);
        theta *= power;
        phi *= power;
        
        // Different reconstruction
        z = zr * vec3(
            cos(theta) * cos(phi),
            cos(theta) * sin(phi),
            sin(theta)
        );
        z += c;
    }
    
    return 0.5 * log(r) * r / dr;
}
`;
    }

    /**
     * Cubic Mandelbulb (power 3 optimized)
     * @private
     */
    _getCubicVariantDE() {
        return `
float DE(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r;
    
    vec3 c = u_juliaMode > 0.5 ? u_juliaOffset.xyz : pos;
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        r = length(z);
        if (r > u_bailout) break;
        
        // Optimized for power 3
        float r2 = r * r;
        float r4 = r2 * r2;
        
        dr = 3.0 * r2 * dr + 1.0;
        
        // Cubic formula
        float x2 = z.x * z.x;
        float y2 = z.y * z.y;
        float z2 = z.z * z.z;
        
        float newX = z.x * (x2 - 3.0 * y2);
        float newY = z.y * (3.0 * x2 - y2);
        float newZ = z.z * (z2 - 3.0 * (x2 + y2)) + 3.0 * z.z * r2;
        
        z = vec3(newX, newY, newZ) + c;
    }
    
    return 0.5 * log(r) * r / dr;
}
`;
    }

    /**
     * Quadratic Mandelbulb (power 2)
     * @private
     */
    _getQuadraticVariantDE() {
        return `
float DE(vec3 pos) {
    vec3 z = pos;
    float dr = 1.0;
    float r;
    
    vec3 c = u_juliaMode > 0.5 ? u_juliaOffset.xyz : pos;
    
    for (int i = 0; i < 50; i++) {
        if (i >= u_maxIterations) break;
        
        r = length(z);
        if (r > u_bailout) break;
        
        // Power 2 spherical (triplex squaring)
        float r2 = dot(z, z);
        float r4 = r2 * r2;
        
        dr = 2.0 * r * dr + 1.0;
        
        // Squaring in spherical coordinates
        float theta = 2.0 * acos(clamp(z.z / r, -1.0, 1.0));
        float phi = 2.0 * atan(z.y, z.x);
        float zr = r * r;
        
        z = zr * vec3(
            sin(theta) * cos(phi),
            sin(theta) * sin(phi),
            cos(theta)
        );
        z += c;
    }
    
    return 0.5 * log(r) * r / dr;
}
`;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Mandelbulb;
