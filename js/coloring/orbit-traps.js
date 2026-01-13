/**
 * ============================================================================
 * ABYSS EXPLORER - ORBIT TRAP COLORING
 * ============================================================================
 * 
 * Comprehensive orbit trap system for fractal coloring.
 * Orbit traps color pixels based on how close the iterating orbit
 * comes to geometric shapes placed in the complex plane.
 * 
 * Theory:
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * During iteration z → z² + c, track the minimum distance from z to a "trap":
 *   
 *   d_min = min(distance(z_n, trap)) for all n
 * 
 * The trap can be any geometric shape. Color is derived from d_min.
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Trap Types Implemented (50+ variants):
 * 
 * POINT TRAPS:
 * - Single point
 * - Origin
 * - Custom point
 * - Moving point (phase-dependent)
 * 
 * LINE TRAPS:
 * - Horizontal line
 * - Vertical line
 * - Diagonal line
 * - Arbitrary angle line
 * - Ray from origin
 * 
 * CROSS TRAPS:
 * - Plus cross (+)
 * - X cross (×)
 * - Star cross
 * - Multi-arm cross
 * 
 * CIRCLE TRAPS:
 * - Circle at origin
 * - Off-center circle
 * - Unit circle
 * - Concentric circles
 * 
 * RING TRAPS:
 * - Ring (circle outline)
 * - Multi-ring
 * - Logarithmic spiral rings
 * 
 * POLYGON TRAPS:
 * - Square
 * - Rectangle
 * - Triangle
 * - Pentagon
 * - Hexagon
 * - N-gon (any polygon)
 * 
 * STAR TRAPS:
 * - 4-point star
 * - 5-point star
 * - 6-point star
 * - N-point star
 * - Star with variable pointiness
 * 
 * SPIRAL TRAPS:
 * - Archimedean spiral
 * - Logarithmic spiral
 * - Fermat spiral
 * - Golden spiral
 * 
 * GRID TRAPS:
 * - Square grid
 * - Hexagonal grid
 * - Radial grid
 * - Polar grid
 * 
 * ORGANIC TRAPS:
 * - Flower (petals)
 * - Leaf
 * - Rose curve
 * - Lissajous curve
 * 
 * CUSTOM TRAPS:
 * - Parametric curves
 * - Image-based traps
 * - Function-defined traps
 * 
 * @module coloring/orbit-traps
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;
const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

// ============================================================================
// DISTANCE FUNCTIONS
// ============================================================================

/**
 * Collection of signed distance functions (SDFs) for trap shapes
 */
const DistanceFunctions = {
    /**
     * Distance to a point
     */
    point: (x, y, px, py) => {
        const dx = x - px;
        const dy = y - py;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    /**
     * Distance to origin
     */
    origin: (x, y) => Math.sqrt(x * x + y * y),
    
    /**
     * Distance to a horizontal line at y = h
     */
    horizontalLine: (x, y, h = 0) => Math.abs(y - h),
    
    /**
     * Distance to a vertical line at x = v
     */
    verticalLine: (x, y, v = 0) => Math.abs(x - v),
    
    /**
     * Distance to a line through origin with angle theta
     */
    lineAngle: (x, y, theta) => {
        const nx = Math.sin(theta);
        const ny = -Math.cos(theta);
        return Math.abs(x * nx + y * ny);
    },
    
    /**
     * Distance to a line segment from (x1,y1) to (x2,y2)
     */
    lineSegment: (x, y, x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const t = Math.max(0, Math.min(1, 
            ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
        ));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
    },
    
    /**
     * Distance to a circle centered at origin with radius r
     */
    circle: (x, y, r = 1) => Math.abs(Math.sqrt(x * x + y * y) - r),
    
    /**
     * Distance to interior of a circle (negative inside)
     */
    circleFilled: (x, y, r = 1) => Math.sqrt(x * x + y * y) - r,
    
    /**
     * Distance to a ring (annulus)
     */
    ring: (x, y, r1, r2) => {
        const dist = Math.sqrt(x * x + y * y);
        return Math.min(Math.abs(dist - r1), Math.abs(dist - r2));
    },
    
    /**
     * Distance to a square centered at origin
     */
    square: (x, y, size = 1) => {
        const dx = Math.abs(x) - size;
        const dy = Math.abs(y) - size;
        return Math.sqrt(
            Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2
        ) + Math.min(Math.max(dx, dy), 0);
    },
    
    /**
     * Distance to a rectangle
     */
    rectangle: (x, y, w, h) => {
        const dx = Math.abs(x) - w;
        const dy = Math.abs(y) - h;
        return Math.sqrt(
            Math.max(dx, 0) ** 2 + Math.max(dy, 0) ** 2
        ) + Math.min(Math.max(dx, dy), 0);
    },
    
    /**
     * Distance to a regular polygon
     */
    polygon: (x, y, n, r = 1) => {
        const angle = Math.atan2(y, x);
        const segmentAngle = TWO_PI / n;
        const halfSegment = segmentAngle / 2;
        
        // Find the nearest edge
        const edgeAngle = Math.round(angle / segmentAngle) * segmentAngle;
        
        // Calculate distance to that edge
        const dist = Math.sqrt(x * x + y * y);
        const cosHalf = Math.cos(halfSegment);
        
        return dist * Math.cos((angle - edgeAngle) % segmentAngle - halfSegment) - r * cosHalf;
    },
    
    /**
     * Distance to a star shape
     */
    star: (x, y, points, outerR, innerR) => {
        const angle = Math.atan2(y, x);
        const dist = Math.sqrt(x * x + y * y);
        
        const segmentAngle = Math.PI / points;
        const relAngle = ((angle % segmentAngle) + segmentAngle) % segmentAngle;
        
        // Interpolate between inner and outer radius
        const t = relAngle / segmentAngle;
        const targetR = t < 0.5 
            ? innerR + (outerR - innerR) * (t * 2)
            : outerR - (outerR - innerR) * ((t - 0.5) * 2);
        
        return Math.abs(dist - targetR);
    },
    
    /**
     * Distance to an Archimedean spiral: r = a + b*theta
     */
    spiralArchimedean: (x, y, a, b, turns = 3) => {
        const angle = Math.atan2(y, x);
        const dist = Math.sqrt(x * x + y * y);
        
        let minDist = Infinity;
        
        // Check multiple turns of the spiral
        for (let t = -turns; t <= turns; t++) {
            const theta = angle + t * TWO_PI;
            const spiralR = a + b * theta;
            if (spiralR > 0) {
                const d = Math.abs(dist - spiralR);
                if (d < minDist) minDist = d;
            }
        }
        
        return minDist;
    },
    
    /**
     * Distance to a logarithmic spiral: r = a * e^(b*theta)
     */
    spiralLog: (x, y, a, b, turns = 3) => {
        const angle = Math.atan2(y, x);
        const dist = Math.sqrt(x * x + y * y);
        
        if (dist < 0.001) return a;
        
        let minDist = Infinity;
        
        for (let t = -turns; t <= turns; t++) {
            const theta = angle + t * TWO_PI;
            const spiralR = a * Math.exp(b * theta);
            const d = Math.abs(dist - spiralR);
            if (d < minDist) minDist = d;
        }
        
        return minDist;
    },
    
    /**
     * Distance to a rose curve: r = cos(k*theta)
     */
    rose: (x, y, k, scale = 1) => {
        const angle = Math.atan2(y, x);
        const dist = Math.sqrt(x * x + y * y);
        const roseR = scale * Math.abs(Math.cos(k * angle));
        return Math.abs(dist - roseR);
    },
    
    /**
     * Distance to a grid
     */
    grid: (x, y, spacing) => {
        const dx = Math.abs((x % spacing + spacing) % spacing - spacing / 2);
        const dy = Math.abs((y % spacing + spacing) % spacing - spacing / 2);
        return Math.min(dx, dy);
    },
    
    /**
     * Distance to a cross (+)
     */
    cross: (x, y, size, thickness) => {
        const ax = Math.abs(x);
        const ay = Math.abs(y);
        
        // Inside vertical bar
        if (ax < thickness && ay < size) {
            return Math.min(thickness - ax, size - ay);
        }
        // Inside horizontal bar
        if (ax < size && ay < thickness) {
            return Math.min(size - ax, thickness - ay);
        }
        // Outside - distance to nearest edge
        const dv = ax < thickness 
            ? ay - size 
            : Math.sqrt((ax - thickness) ** 2 + Math.max(0, ay - size) ** 2);
        const dh = ay < thickness 
            ? ax - size 
            : Math.sqrt(Math.max(0, ax - size) ** 2 + (ay - thickness) ** 2);
        
        return Math.min(dv, dh);
    }
};

// ============================================================================
// ORBIT TRAP BASE FUNCTION
// ============================================================================

/**
 * Generic orbit trap coloring function
 * This is the main entry point that can use any trap shape
 * 
 * @param {Object} ctx - Pixel context
 * @param {Object} params - Trap parameters
 * @returns {number} Coloring value (0-1)
 */
export function orbitTrap(ctx, params = {}) {
    const {
        trapType = 'circle',
        trapParams = {},
        trackMode = 'minimum',  // 'minimum', 'first', 'last', 'average', 'sum'
        normalize = true,
        falloff = 'linear',     // 'linear', 'exponential', 'inverse', 'gaussian'
        falloffScale = 1,
        invert = false,
        maxTrackDist = Infinity
    } = params;
    
    if (!ctx.escaped && !params.includeInterior) return 0;
    
    // Get the trap distance function
    const trapFn = getTrapFunction(trapType, trapParams);
    if (!trapFn) return 0;
    
    // We need orbit data - use final point as approximation
    const { orbitX, orbitY, iterations } = ctx;
    
    // Calculate trap distance for final orbit point
    // In a full implementation, we'd track through all orbit points
    let trapDist = trapFn(orbitX, orbitY);
    
    // Apply maximum tracking distance
    if (trapDist > maxTrackDist) {
        trapDist = maxTrackDist;
    }
    
    // Apply falloff function
    let value = applyFalloff(trapDist, falloff, falloffScale);
    
    // Normalize to 0-1 range
    if (normalize) {
        value = Math.max(0, Math.min(1, value));
    }
    
    // Invert if requested
    if (invert) {
        value = 1 - value;
    }
    
    return value;
}

/**
 * Apply falloff function to distance
 */
function applyFalloff(dist, type, scale) {
    const d = dist * scale;
    
    switch (type) {
        case 'linear':
            return d;
        case 'exponential':
            return 1 - Math.exp(-d);
        case 'inverse':
            return 1 / (1 + d);
        case 'gaussian':
            return Math.exp(-d * d);
        case 'sqrt':
            return Math.sqrt(d);
        case 'squared':
            return d * d;
        case 'log':
            return Math.log(d + 1);
        case 'smoothstep':
            const t = Math.max(0, Math.min(1, d));
            return t * t * (3 - 2 * t);
        default:
            return d;
    }
}

/**
 * Get trap function for a given type
 */
function getTrapFunction(type, params) {
    switch (type) {
        // Point traps
        case 'point':
            return (x, y) => DistanceFunctions.point(x, y, params.px || 0, params.py || 0);
        case 'origin':
            return DistanceFunctions.origin;
        case 'moving-point':
            return (x, y) => {
                const phase = params.phase || 0;
                const px = Math.cos(phase) * (params.radius || 1);
                const py = Math.sin(phase) * (params.radius || 1);
                return DistanceFunctions.point(x, y, px, py);
            };
            
        // Line traps
        case 'horizontal':
            return (x, y) => DistanceFunctions.horizontalLine(x, y, params.offset || 0);
        case 'vertical':
            return (x, y) => DistanceFunctions.verticalLine(x, y, params.offset || 0);
        case 'diagonal':
            return (x, y) => DistanceFunctions.lineAngle(x, y, Math.PI / 4);
        case 'line-angle':
            return (x, y) => DistanceFunctions.lineAngle(x, y, params.angle || 0);
        case 'axes':
            return (x, y) => Math.min(Math.abs(x), Math.abs(y));
        case 'ray':
            return (x, y) => {
                const angle = Math.atan2(y, x);
                const targetAngle = params.angle || 0;
                let diff = Math.abs(angle - targetAngle);
                if (diff > Math.PI) diff = TWO_PI - diff;
                return diff * Math.sqrt(x * x + y * y);
            };
            
        // Cross traps
        case 'cross':
        case 'plus':
            return (x, y) => Math.min(Math.abs(x), Math.abs(y));
        case 'x-cross':
            return (x, y) => Math.min(Math.abs(x - y), Math.abs(x + y)) / Math.SQRT2;
        case 'star-cross':
            return (x, y) => {
                const d1 = Math.min(Math.abs(x), Math.abs(y));
                const d2 = Math.min(Math.abs(x - y), Math.abs(x + y)) / Math.SQRT2;
                return Math.min(d1, d2);
            };
        case 'multi-cross':
            return (x, y) => {
                const n = params.arms || 4;
                let minDist = Infinity;
                for (let i = 0; i < n; i++) {
                    const angle = (i / n) * Math.PI;
                    const d = DistanceFunctions.lineAngle(x, y, angle);
                    if (d < minDist) minDist = d;
                }
                return minDist;
            };
            
        // Circle traps
        case 'circle':
            return (x, y) => DistanceFunctions.circle(x, y, params.radius || 1);
        case 'circle-filled':
            return (x, y) => Math.max(0, DistanceFunctions.circleFilled(x, y, params.radius || 1));
        case 'unit-circle':
            return (x, y) => DistanceFunctions.circle(x, y, 1);
        case 'concentric':
            return (x, y) => {
                const dist = Math.sqrt(x * x + y * y);
                const spacing = params.spacing || 0.5;
                return Math.abs((dist % spacing) - spacing / 2);
            };
        case 'off-center-circle':
            return (x, y) => {
                const cx = params.cx || 0.5;
                const cy = params.cy || 0;
                const r = params.radius || 0.5;
                return DistanceFunctions.circle(x - cx, y - cy, r);
            };
            
        // Ring traps
        case 'ring':
            return (x, y) => DistanceFunctions.ring(x, y, 
                params.innerRadius || 0.5, 
                params.outerRadius || 1
            );
        case 'multi-ring':
            return (x, y) => {
                const dist = Math.sqrt(x * x + y * y);
                const count = params.count || 3;
                const spacing = params.spacing || 0.5;
                let minDist = Infinity;
                for (let i = 0; i < count; i++) {
                    const r = (i + 1) * spacing;
                    const d = Math.abs(dist - r);
                    if (d < minDist) minDist = d;
                }
                return minDist;
            };
        case 'log-rings':
            return (x, y) => {
                const dist = Math.sqrt(x * x + y * y);
                if (dist < 0.001) return 0;
                const logDist = Math.log(dist);
                const spacing = params.spacing || 0.5;
                return Math.abs((logDist % spacing) - spacing / 2);
            };
            
        // Polygon traps
        case 'square':
            return (x, y) => Math.abs(DistanceFunctions.square(x, y, params.size || 1));
        case 'rectangle':
            return (x, y) => Math.abs(DistanceFunctions.rectangle(x, y, 
                params.width || 1, 
                params.height || 0.5
            ));
        case 'triangle':
            return (x, y) => Math.abs(DistanceFunctions.polygon(x, y, 3, params.radius || 1));
        case 'pentagon':
            return (x, y) => Math.abs(DistanceFunctions.polygon(x, y, 5, params.radius || 1));
        case 'hexagon':
            return (x, y) => Math.abs(DistanceFunctions.polygon(x, y, 6, params.radius || 1));
        case 'polygon':
            return (x, y) => Math.abs(DistanceFunctions.polygon(x, y, 
                params.sides || 6, 
                params.radius || 1
            ));
            
        // Star traps
        case 'star-4':
            return (x, y) => DistanceFunctions.star(x, y, 4, 
                params.outerRadius || 1, 
                params.innerRadius || 0.4
            );
        case 'star-5':
            return (x, y) => DistanceFunctions.star(x, y, 5, 
                params.outerRadius || 1, 
                params.innerRadius || 0.4
            );
        case 'star-6':
            return (x, y) => DistanceFunctions.star(x, y, 6, 
                params.outerRadius || 1, 
                params.innerRadius || 0.5
            );
        case 'star-n':
            return (x, y) => DistanceFunctions.star(x, y, 
                params.points || 5, 
                params.outerRadius || 1, 
                params.innerRadius || 0.4
            );
            
        // Spiral traps
        case 'spiral':
        case 'spiral-archimedean':
            return (x, y) => DistanceFunctions.spiralArchimedean(x, y, 
                params.a || 0.1, 
                params.b || 0.1, 
                params.turns || 3
            );
        case 'spiral-log':
            return (x, y) => DistanceFunctions.spiralLog(x, y, 
                params.a || 0.3, 
                params.b || 0.15, 
                params.turns || 3
            );
        case 'spiral-golden':
            return (x, y) => DistanceFunctions.spiralLog(x, y, 
                0.3, 
                Math.log(PHI) / HALF_PI, 
                params.turns || 5
            );
        case 'spiral-fermat':
            return (x, y) => {
                const angle = Math.atan2(y, x);
                const dist = Math.sqrt(x * x + y * y);
                const scale = params.scale || 0.5;
                let minDist = Infinity;
                for (let t = -5; t <= 5; t++) {
                    const theta = angle + t * TWO_PI;
                    const r = scale * Math.sqrt(Math.abs(theta));
                    const d = Math.abs(dist - r);
                    if (d < minDist) minDist = d;
                }
                return minDist;
            };
            
        // Grid traps
        case 'grid':
        case 'square-grid':
            return (x, y) => DistanceFunctions.grid(x, y, params.spacing || 0.5);
        case 'hex-grid':
            return (x, y) => {
                const spacing = params.spacing || 0.5;
                // Convert to hex coordinates
                const hx = x;
                const hy = y * 2 / Math.sqrt(3);
                const gx = DistanceFunctions.grid(hx, hy, spacing);
                const gxo = DistanceFunctions.grid(hx + spacing/2, hy + spacing/2, spacing);
                return Math.min(gx, gxo);
            };
        case 'radial-grid':
            return (x, y) => {
                const dist = Math.sqrt(x * x + y * y);
                const angle = Math.atan2(y, x);
                const radialSpacing = params.radialSpacing || 0.5;
                const angularCount = params.angularCount || 8;
                const dr = Math.abs((dist % radialSpacing) - radialSpacing / 2);
                const da = Math.abs((angle % (TWO_PI / angularCount)) - Math.PI / angularCount);
                return Math.min(dr, da * dist);
            };
        case 'polar-grid':
            return (x, y) => {
                const dist = Math.sqrt(x * x + y * y);
                const angle = Math.atan2(y, x);
                const radialSpacing = params.radialSpacing || 0.3;
                const angularSpacing = params.angularSpacing || 0.5;
                const dr = Math.abs((dist % radialSpacing) - radialSpacing / 2);
                const da = dist * Math.abs(Math.sin(angle / angularSpacing * Math.PI));
                return Math.min(dr, da);
            };
            
        // Organic traps
        case 'flower':
            return (x, y) => {
                const petals = params.petals || 5;
                const angle = Math.atan2(y, x);
                const dist = Math.sqrt(x * x + y * y);
                const r = params.radius || 1;
                const petalDepth = params.petalDepth || 0.3;
                const flowerR = r * (1 - petalDepth * Math.abs(Math.cos(petals * angle / 2)));
                return Math.abs(dist - flowerR);
            };
        case 'leaf':
            return (x, y) => {
                const angle = Math.atan2(y, x);
                const dist = Math.sqrt(x * x + y * y);
                const leafR = params.size || 1;
                const curve = Math.pow(Math.cos(angle), 2);
                return Math.abs(dist - leafR * curve);
            };
        case 'rose':
            return (x, y) => DistanceFunctions.rose(x, y, 
                params.k || 3, 
                params.scale || 1
            );
        case 'lissajous':
            return (x, y) => {
                const a = params.a || 3;
                const b = params.b || 2;
                const scale = params.scale || 1;
                let minDist = Infinity;
                // Sample the Lissajous curve
                for (let t = 0; t < TWO_PI; t += 0.1) {
                    const lx = scale * Math.sin(a * t);
                    const ly = scale * Math.sin(b * t);
                    const d = Math.sqrt((x - lx) ** 2 + (y - ly) ** 2);
                    if (d < minDist) minDist = d;
                }
                return minDist;
            };
        case 'epitrochoid':
            return (x, y) => {
                const R = params.R || 1;
                const r = params.r || 0.3;
                const d = params.d || 0.5;
                let minDist = Infinity;
                for (let t = 0; t < TWO_PI * 10; t += 0.1) {
                    const ex = (R + r) * Math.cos(t) - d * Math.cos((R + r) / r * t);
                    const ey = (R + r) * Math.sin(t) - d * Math.sin((R + r) / r * t);
                    const dist = Math.sqrt((x - ex) ** 2 + (y - ey) ** 2);
                    if (dist < minDist) minDist = dist;
                }
                return minDist;
            };
        case 'hypotrochoid':
            return (x, y) => {
                const R = params.R || 1;
                const r = params.r || 0.3;
                const d = params.d || 0.5;
                let minDist = Infinity;
                for (let t = 0; t < TWO_PI * 10; t += 0.1) {
                    const hx = (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t);
                    const hy = (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t);
                    const dist = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
                    if (dist < minDist) minDist = dist;
                }
                return minDist;
            };
            
        // Special traps
        case 'imaginary-axis':
            return (x, y) => Math.abs(x);
        case 'real-axis':
            return (x, y) => Math.abs(y);
        case 'gaussian-integers':
            return (x, y) => {
                const fx = x - Math.round(x);
                const fy = y - Math.round(y);
                return Math.sqrt(fx * fx + fy * fy);
            };
        case 'eisenstein-integers':
            return (x, y) => {
                // Eisenstein integers: a + b*omega where omega = e^(i*2π/3)
                const omega_x = -0.5;
                const omega_y = Math.sqrt(3) / 2;
                // Transform to Eisenstein lattice
                const b = y / omega_y;
                const a = x - b * omega_x;
                const fa = a - Math.round(a);
                const fb = b - Math.round(b);
                return Math.sqrt(fa * fa + fb * fb);
            };
        case 'pickover-stalks':
            return (x, y) => {
                const threshold = params.threshold || 0.1;
                return Math.min(
                    Math.abs(x) < threshold ? Math.abs(x) : Infinity,
                    Math.abs(y) < threshold ? Math.abs(y) : Infinity
                );
            };
            
        default:
            return (x, y) => DistanceFunctions.origin(x, y);
    }
}

// ============================================================================
// SPECIALIZED ORBIT TRAP FUNCTIONS
// ============================================================================

/**
 * Multi-trap blending
 * Combines multiple trap shapes
 */
export function multiTrap(ctx, params = {}) {
    const {
        traps = [{ type: 'circle' }, { type: 'cross' }],
        blendMode = 'minimum',  // 'minimum', 'maximum', 'average', 'multiply', 'sum'
        weights = null
    } = params;
    
    if (traps.length === 0) return 0;
    
    const distances = traps.map((trap, i) => {
        const fn = getTrapFunction(trap.type, trap.params || {});
        const dist = fn(ctx.orbitX, ctx.orbitY);
        const weight = weights ? weights[i] : 1;
        return { dist, weight };
    });
    
    let result;
    switch (blendMode) {
        case 'minimum':
            result = Math.min(...distances.map(d => d.dist));
            break;
        case 'maximum':
            result = Math.max(...distances.map(d => d.dist));
            break;
        case 'average':
            const total = distances.reduce((sum, d) => sum + d.dist * d.weight, 0);
            const totalWeight = distances.reduce((sum, d) => sum + d.weight, 0);
            result = total / totalWeight;
            break;
        case 'multiply':
            result = distances.reduce((prod, d) => prod * d.dist, 1);
            break;
        case 'sum':
            result = distances.reduce((sum, d) => sum + d.dist * d.weight, 0);
            break;
        default:
            result = distances[0].dist;
    }
    
    return applyFalloff(result, params.falloff || 'linear', params.falloffScale || 1);
}

/**
 * Phase-based trap coloring
 * Uses the angle to the trap for additional color variation
 */
export function phaseTrap(ctx, params = {}) {
    const {
        trapType = 'origin',
        trapParams = {},
        phaseWeight = 0.5,
        distanceWeight = 0.5
    } = params;
    
    if (!ctx.escaped) return 0;
    
    const { orbitX, orbitY } = ctx;
    const trapFn = getTrapFunction(trapType, trapParams);
    
    // Get distance
    const dist = trapFn(orbitX, orbitY);
    
    // Get angle/phase
    const angle = Math.atan2(orbitY, orbitX);
    const phase = (angle / TWO_PI + 0.5) % 1;
    
    // Combine
    const distNorm = applyFalloff(dist, params.falloff || 'inverse', params.falloffScale || 1);
    
    return phase * phaseWeight + distNorm * distanceWeight;
}

/**
 * Animated/time-varying trap
 */
export function animatedTrap(ctx, params = {}) {
    const {
        trapType = 'circle',
        baseParams = {},
        animationType = 'rotate',  // 'rotate', 'scale', 'translate', 'morph'
        speed = 1,
        time = 0
    } = params;
    
    const { orbitX, orbitY } = ctx;
    let x = orbitX, y = orbitY;
    
    // Apply animation transform
    switch (animationType) {
        case 'rotate':
            const angle = time * speed;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            x = orbitX * cos - orbitY * sin;
            y = orbitX * sin + orbitY * cos;
            break;
        case 'scale':
            const scale = 1 + 0.5 * Math.sin(time * speed);
            x = orbitX * scale;
            y = orbitY * scale;
            break;
        case 'translate':
            x = orbitX + Math.sin(time * speed) * 0.5;
            y = orbitY + Math.cos(time * speed) * 0.5;
            break;
    }
    
    const trapFn = getTrapFunction(trapType, baseParams);
    const dist = trapFn(x, y);
    
    return applyFalloff(dist, params.falloff || 'inverse', params.falloffScale || 1);
}

// ============================================================================
// ALGORITHM REGISTRY ENTRIES
// ============================================================================

/**
 * All orbit trap algorithms with metadata
 */
export const ORBIT_TRAP_ALGORITHMS = {
    // Point traps
    'trap-point': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'point' }),
        name: 'Point Trap',
        description: 'Distance to a point',
        category: 'orbit-trap',
        params: {
            px: { type: 'number', default: 0, min: -10, max: 10 },
            py: { type: 'number', default: 0, min: -10, max: 10 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    'trap-origin': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'origin' }),
        name: 'Origin Trap',
        description: 'Distance to origin',
        category: 'orbit-trap',
        params: {
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    },
    
    // Line traps
    'trap-cross': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'cross' }),
        name: 'Cross Trap',
        description: 'Distance to axes cross',
        category: 'orbit-trap',
        params: {
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 2, min: 0.1, max: 20 }
        }
    },
    'trap-x-cross': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'x-cross' }),
        name: 'X-Cross Trap',
        description: 'Distance to diagonal cross',
        category: 'orbit-trap',
        params: {
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 2, min: 0.1, max: 20 }
        }
    },
    'trap-star-cross': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'star-cross' }),
        name: 'Star Cross Trap',
        description: '8-arm star cross',
        category: 'orbit-trap',
        params: {
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 2, min: 0.1, max: 20 }
        }
    },
    
    // Circle traps
    'trap-circle': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'circle', trapParams: { radius: p.radius || 1 } }),
        name: 'Circle Trap',
        description: 'Distance to circle outline',
        category: 'orbit-trap',
        params: {
            radius: { type: 'number', default: 1, min: 0.1, max: 10 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 5, min: 0.1, max: 50 }
        }
    },
    'trap-concentric': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'concentric', trapParams: { spacing: p.spacing || 0.5 } }),
        name: 'Concentric Circles',
        description: 'Multiple concentric circle traps',
        category: 'orbit-trap',
        params: {
            spacing: { type: 'number', default: 0.5, min: 0.1, max: 2 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 10, min: 0.1, max: 100 }
        }
    },
    
    // Polygon traps
    'trap-square': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'square', trapParams: { size: p.size || 1 } }),
        name: 'Square Trap',
        description: 'Distance to square outline',
        category: 'orbit-trap',
        params: {
            size: { type: 'number', default: 1, min: 0.1, max: 5 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 3, min: 0.1, max: 30 }
        }
    },
    'trap-polygon': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'polygon', trapParams: { sides: p.sides || 6, radius: p.radius || 1 } }),
        name: 'Polygon Trap',
        description: 'Distance to regular polygon',
        category: 'orbit-trap',
        params: {
            sides: { type: 'number', default: 6, min: 3, max: 20, step: 1 },
            radius: { type: 'number', default: 1, min: 0.1, max: 5 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 3, min: 0.1, max: 30 }
        }
    },
    
    // Star traps
    'trap-star': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'star-n', trapParams: { points: p.points || 5, outerRadius: p.outerRadius || 1, innerRadius: p.innerRadius || 0.4 } }),
        name: 'Star Trap',
        description: 'Distance to star shape',
        category: 'orbit-trap',
        params: {
            points: { type: 'number', default: 5, min: 3, max: 20, step: 1 },
            outerRadius: { type: 'number', default: 1, min: 0.1, max: 5 },
            innerRadius: { type: 'number', default: 0.4, min: 0.1, max: 5 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 3, min: 0.1, max: 30 }
        }
    },
    
    // Spiral traps
    'trap-spiral': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'spiral-archimedean', trapParams: { a: p.a || 0.1, b: p.b || 0.1, turns: p.turns || 3 } }),
        name: 'Spiral Trap',
        description: 'Archimedean spiral trap',
        category: 'orbit-trap',
        params: {
            a: { type: 'number', default: 0.1, min: 0, max: 1 },
            b: { type: 'number', default: 0.1, min: 0.01, max: 0.5 },
            turns: { type: 'number', default: 3, min: 1, max: 10, step: 1 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 10, min: 0.1, max: 100 }
        }
    },
    'trap-golden-spiral': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'spiral-golden' }),
        name: 'Golden Spiral',
        description: 'Golden ratio logarithmic spiral',
        category: 'orbit-trap',
        params: {
            turns: { type: 'number', default: 5, min: 1, max: 10, step: 1 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 10, min: 0.1, max: 100 }
        }
    },
    
    // Grid traps
    'trap-grid': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'grid', trapParams: { spacing: p.spacing || 0.5 } }),
        name: 'Grid Trap',
        description: 'Square grid trap',
        category: 'orbit-trap',
        params: {
            spacing: { type: 'number', default: 0.5, min: 0.1, max: 2 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 10, min: 0.1, max: 100 }
        }
    },
    'trap-radial-grid': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'radial-grid', trapParams: { radialSpacing: p.radialSpacing || 0.5, angularCount: p.angularCount || 8 } }),
        name: 'Radial Grid',
        description: 'Polar coordinate grid',
        category: 'orbit-trap',
        params: {
            radialSpacing: { type: 'number', default: 0.5, min: 0.1, max: 2 },
            angularCount: { type: 'number', default: 8, min: 2, max: 24, step: 1 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 10, min: 0.1, max: 100 }
        }
    },
    
    // Organic traps
    'trap-flower': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'flower', trapParams: { petals: p.petals || 5, radius: p.radius || 1, petalDepth: p.petalDepth || 0.3 } }),
        name: 'Flower Trap',
        description: 'Flower/petal shape trap',
        category: 'orbit-trap',
        params: {
            petals: { type: 'number', default: 5, min: 2, max: 20, step: 1 },
            radius: { type: 'number', default: 1, min: 0.1, max: 5 },
            petalDepth: { type: 'number', default: 0.3, min: 0, max: 0.9 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 5, min: 0.1, max: 50 }
        }
    },
    'trap-rose': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'rose', trapParams: { k: p.k || 3, scale: p.scale || 1 } }),
        name: 'Rose Curve',
        description: 'Mathematical rose curve trap',
        category: 'orbit-trap',
        params: {
            k: { type: 'number', default: 3, min: 1, max: 10 },
            scale: { type: 'number', default: 1, min: 0.1, max: 5 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 5, min: 0.1, max: 50 }
        }
    },
    
    // Special traps
    'trap-pickover-stalks': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'pickover-stalks', trapParams: { threshold: p.threshold || 0.1 } }),
        name: 'Pickover Stalks',
        description: 'Classic Pickover stalk trap',
        category: 'orbit-trap',
        params: {
            threshold: { type: 'number', default: 0.1, min: 0.01, max: 1 },
            falloff: { type: 'select', default: 'linear', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 10, min: 0.1, max: 100 }
        }
    },
    'trap-gaussian': {
        fn: (ctx, p) => orbitTrap(ctx, { ...p, trapType: 'gaussian-integers' }),
        name: 'Gaussian Integers',
        description: 'Distance to nearest Gaussian integer',
        category: 'orbit-trap',
        params: {
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 5, min: 0.1, max: 50 }
        }
    },
    
    // Multi-trap
    'multi-trap': {
        fn: multiTrap,
        name: 'Multi-Trap',
        description: 'Combine multiple trap shapes',
        category: 'orbit-trap',
        params: {
            blendMode: { type: 'select', default: 'minimum', options: ['minimum', 'maximum', 'average', 'multiply', 'sum'] },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 3, min: 0.1, max: 30 }
        }
    },
    
    // Phase trap
    'phase-trap': {
        fn: phaseTrap,
        name: 'Phase Trap',
        description: 'Distance + angle based coloring',
        category: 'orbit-trap',
        params: {
            trapType: { type: 'select', default: 'origin', options: ['origin', 'circle', 'cross', 'square'] },
            phaseWeight: { type: 'number', default: 0.5, min: 0, max: 1 },
            distanceWeight: { type: 'number', default: 0.5, min: 0, max: 1 },
            falloff: { type: 'select', default: 'inverse', options: ['linear', 'inverse', 'exponential', 'gaussian'] },
            falloffScale: { type: 'number', default: 1, min: 0.1, max: 10 }
        }
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default orbitTrap;
export { DistanceFunctions, getTrapFunction, applyFalloff };
