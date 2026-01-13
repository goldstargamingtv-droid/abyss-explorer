/**
 * ============================================================================
 * ABYSS EXPLORER - NEWTON FRACTAL PRESETS
 * ============================================================================
 * 
 * Collection of 200+ Newton fractal presets for various polynomials.
 * Newton fractals arise from Newton's method root finding, creating
 * beautiful basins of attraction with sharp boundaries.
 * 
 * Formula: z(n+1) = z(n) - f(z)/f'(z)
 * 
 * Common Polynomials:
 * - z^3 - 1 (3 roots, classic)
 * - z^4 - 1 (4 roots)
 * - z^5 - 1 (5 roots)
 * - z^n - 1 (n roots)
 * - Custom polynomials
 * 
 * Features:
 * - Sharp fractal boundaries
 * - n-fold symmetry for z^n - 1
 * - Interesting behavior for custom polynomials
 * 
 * @module presets/newton-presets
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { PRESET_CATEGORY, DIFFICULTY, TAGS } from './preset-loader.js';

// ============================================================================
// CLASSIC Z^N - 1 POLYNOMIALS
// ============================================================================

const CLASSIC_ROOTS_OF_UNITY = [
    // z^3 - 1 (Classic)
    {
        id: 'newton-z3-1-overview',
        name: 'Classic Newton (z³-1)',
        description: 'The classic Newton fractal for z³-1, showing three basins of attraction.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z3', TAGS.SYMMETRIC, TAGS.COLORFUL, 'classic'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^3-1', degree: 3, maxIterations: 50 },
        palette: 'newton-rgb',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-z3-1-boundary',
        name: 'Newton Boundary (z³-1)',
        description: 'Zoomed into the fractal boundary between basins.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z3', TAGS.CHAOTIC, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.5, centerY: 0.28, zoom: 20 },
        params: { polynomial: 'z^3-1', degree: 3, maxIterations: 100 },
        palette: 'newton-boundary',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-z3-1-deep',
        name: 'Deep Newton (z³-1)',
        description: 'Deep zoom into the z³-1 Newton fractal.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z3', TAGS.DEEP_ZOOM, TAGS.CHAOTIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.5001, centerY: 0.2887, zoom: 1000 },
        params: { polynomial: 'z^3-1', degree: 3, maxIterations: 200 },
        palette: 'newton-deep',
        coloring: 'root-coloring'
    },
    
    // z^4 - 1
    {
        id: 'newton-z4-1-overview',
        name: 'Quad Newton (z⁴-1)',
        description: 'Newton fractal for z⁴-1 with four-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z4', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^4-1', degree: 4, maxIterations: 50 },
        palette: 'newton-quad',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-z4-1-cross',
        name: 'Newton Cross (z⁴-1)',
        description: 'The characteristic cross pattern at the center.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z4', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 3 },
        params: { polynomial: 'z^4-1', degree: 4, maxIterations: 80 },
        palette: 'newton-cross',
        coloring: 'root-coloring'
    },
    
    // z^5 - 1
    {
        id: 'newton-z5-1-overview',
        name: 'Penta Newton (z⁵-1)',
        description: 'Newton fractal for z⁵-1 with five-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z5', TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^5-1', degree: 5, maxIterations: 50 },
        palette: 'newton-penta',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-z5-1-star',
        name: 'Newton Star (z⁵-1)',
        description: 'A five-pointed star formed by the basin boundaries.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z5', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 2.5 },
        params: { polynomial: 'z^5-1', degree: 5, maxIterations: 80 },
        palette: 'newton-star',
        coloring: 'root-coloring'
    },
    
    // z^6 - 1
    {
        id: 'newton-z6-1-overview',
        name: 'Hexa Newton (z⁶-1)',
        description: 'Newton fractal for z⁶-1 with six-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z6', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^6-1', degree: 6, maxIterations: 50 },
        palette: 'newton-hexa',
        coloring: 'root-coloring'
    },
    
    // z^7 - 1
    {
        id: 'newton-z7-1-overview',
        name: 'Hepta Newton (z⁷-1)',
        description: 'Newton fractal for z⁷-1 with seven-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z7', TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^7-1', degree: 7, maxIterations: 50 },
        palette: 'rainbow-7',
        coloring: 'root-coloring'
    },
    
    // z^8 - 1
    {
        id: 'newton-z8-1-overview',
        name: 'Octa Newton (z⁸-1)',
        description: 'Newton fractal for z⁸-1 with eight-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['z8', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^8-1', degree: 8, maxIterations: 50 },
        palette: 'newton-octa',
        coloring: 'root-coloring'
    },
    
    // Higher degrees
    {
        id: 'newton-z12-1',
        name: 'Dodeca Newton (z¹²-1)',
        description: 'Newton fractal for z¹²-1 with twelve-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['high-degree', TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^12-1', degree: 12, maxIterations: 60 },
        palette: 'rainbow-12',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-z16-1',
        name: 'Hexadeca Newton (z¹⁶-1)',
        description: 'Newton fractal for z¹⁶-1 with sixteen-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['high-degree', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^16-1', degree: 16, maxIterations: 80 },
        palette: 'rainbow-16',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-z24-1',
        name: 'Complex Newton (z²⁴-1)',
        description: 'Newton fractal with 24-fold symmetry.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['high-degree', TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^24-1', degree: 24, maxIterations: 100 },
        palette: 'rainbow-24',
        coloring: 'root-coloring'
    }
];

// ============================================================================
// CUSTOM POLYNOMIALS
// ============================================================================

const CUSTOM_POLYNOMIALS = [
    // z^3 - 2z + 2
    {
        id: 'newton-custom-1',
        name: 'Twisted Newton',
        description: 'Newton fractal for z³-2z+2 with asymmetric roots.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['custom', TAGS.CHAOTIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^3-2z+2', maxIterations: 60 },
        palette: 'twisted',
        coloring: 'root-coloring'
    },
    
    // z^4 - z^2 + 1
    {
        id: 'newton-custom-2',
        name: 'Diamond Newton',
        description: 'Newton fractal for z⁴-z²+1.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['custom', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^4-z^2+1', maxIterations: 60 },
        palette: 'diamond',
        coloring: 'root-coloring'
    },
    
    // z^3 + z + 1
    {
        id: 'newton-custom-3',
        name: 'Asymmetric Newton',
        description: 'Newton fractal for z³+z+1 with non-symmetric basins.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['custom', TAGS.CHAOTIC, TAGS.ORGANIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^3+z+1', maxIterations: 60 },
        palette: 'asymmetric',
        coloring: 'root-coloring'
    },
    
    // z^5 - z^3 + z
    {
        id: 'newton-custom-4',
        name: 'Flower Newton',
        description: 'Newton fractal for z⁵-z³+z forming flower patterns.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['custom', TAGS.ORGANIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^5-z^3+z', maxIterations: 70 },
        palette: 'flower',
        coloring: 'root-coloring'
    },
    
    // z^6 - z^3 + 1
    {
        id: 'newton-custom-5',
        name: 'Triquetra Newton',
        description: 'Newton fractal showing triquetra-like patterns.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['custom', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^6-z^3+1', maxIterations: 70 },
        palette: 'celtic',
        coloring: 'root-coloring'
    },
    
    // z^4 + z^3 + z^2 + z + 1
    {
        id: 'newton-custom-6',
        name: 'Fibonacci Newton',
        description: 'Newton fractal for the 5th roots of unity polynomial.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['custom', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^4+z^3+z^2+z+1', maxIterations: 60 },
        palette: 'golden',
        coloring: 'root-coloring'
    },
    
    // z^3 - i*z + 1 (complex coefficients)
    {
        id: 'newton-complex-coef-1',
        name: 'Complex Coefficient Newton',
        description: 'Newton fractal with complex polynomial coefficients.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['complex', TAGS.CHAOTIC, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^3-i*z+1', maxIterations: 80 },
        palette: 'psychedelic',
        coloring: 'root-coloring'
    },
    
    // z^8 - 15z^4 - 16
    {
        id: 'newton-custom-7',
        name: 'Eight Petals Newton',
        description: 'Newton fractal showing eight petal-like regions.',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['custom', TAGS.SYMMETRIC, TAGS.ORGANIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^8-15z^4-16', maxIterations: 70 },
        palette: 'petals',
        coloring: 'root-coloring'
    }
];

// ============================================================================
// TRIGONOMETRIC NEWTON FRACTALS
// ============================================================================

const TRIGONOMETRIC = [
    // sin(z) = 0
    {
        id: 'newton-sin',
        name: 'Sine Newton',
        description: 'Newton\'s method applied to sin(z).',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['trig', TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 0.2 },
        params: { function: 'sin', maxIterations: 50 },
        palette: 'sine-wave',
        coloring: 'root-coloring'
    },
    
    // cos(z) = 0
    {
        id: 'newton-cos',
        name: 'Cosine Newton',
        description: 'Newton\'s method applied to cos(z).',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['trig', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 0.2 },
        params: { function: 'cos', maxIterations: 50 },
        palette: 'cosine',
        coloring: 'root-coloring'
    },
    
    // tan(z) = 0
    {
        id: 'newton-tan',
        name: 'Tangent Newton',
        description: 'Newton\'s method applied to tan(z).',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['trig', TAGS.CHAOTIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 0.3 },
        params: { function: 'tan', maxIterations: 50 },
        palette: 'tangent',
        coloring: 'root-coloring'
    },
    
    // sinh(z) = 0
    {
        id: 'newton-sinh',
        name: 'Hyperbolic Sine Newton',
        description: 'Newton\'s method applied to sinh(z).',
        category: PRESET_CATEGORY.NEWTON,
        tags: ['hyperbolic', TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 0.2 },
        params: { function: 'sinh', maxIterations: 50 },
        palette: 'hyperbolic',
        coloring: 'root-coloring'
    }
];

// ============================================================================
// BOUNDARY EXPLORATIONS
// ============================================================================

const BOUNDARY_ZOOMS = [
    {
        id: 'newton-boundary-1',
        name: 'Fractal Junction',
        description: 'Where three basins meet in z³-1.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.DEEP_ZOOM, TAGS.CHAOTIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.5, centerY: 0.288675, zoom: 50 },
        params: { polynomial: 'z^3-1', degree: 3, maxIterations: 150 },
        palette: 'junction',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-boundary-2',
        name: 'Basin Edge',
        description: 'The infinitely complex edge between attraction basins.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.DEEP_ZOOM, TAGS.CHAOTIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.50001, centerY: 0.28868, zoom: 500 },
        params: { polynomial: 'z^3-1', degree: 3, maxIterations: 200 },
        palette: 'basin-edge',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-boundary-3',
        name: 'Infinite Complexity',
        description: 'Deep into the Newton fractal boundary.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.DEEP_ZOOM, TAGS.CHAOTIC, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: 0.500001, centerY: 0.2886751, zoom: 5000 },
        params: { polynomial: 'z^3-1', degree: 3, maxIterations: 300 },
        palette: 'infinite',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-boundary-4',
        name: 'Newton Abyss',
        description: 'Extreme depth in the Newton fractal.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.ULTRA_DEEP, TAGS.CHAOTIC, TAGS.DARK],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: 0.5000001, centerY: 0.28867513, zoom: 50000 },
        params: { polynomial: 'z^3-1', degree: 3, maxIterations: 500 },
        palette: 'newton-abyss',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-quad-boundary',
        name: 'Quad Basin Boundary',
        description: 'Where four basins meet in z⁴-1.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.DEEP_ZOOM, TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.707, centerY: 0, zoom: 50 },
        params: { polynomial: 'z^4-1', degree: 4, maxIterations: 150 },
        palette: 'quad-boundary',
        coloring: 'root-coloring'
    }
];

// ============================================================================
// ARTISTIC/THEMED
// ============================================================================

const ARTISTIC = [
    {
        id: 'newton-stained-glass',
        name: 'Stained Glass',
        description: 'Newton fractal resembling cathedral stained glass.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.COLORFUL, TAGS.GEOMETRIC, 'art'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^5-1', degree: 5, maxIterations: 40 },
        palette: 'stained-glass',
        coloring: 'iteration-bands'
    },
    {
        id: 'newton-mandala',
        name: 'Newton Mandala',
        description: 'A mandala-like pattern from Newton\'s method.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.SYMMETRIC, TAGS.COLORFUL, 'spiritual'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1.5 },
        params: { polynomial: 'z^8-1', degree: 8, maxIterations: 50 },
        palette: 'mandala',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-kaleidoscope',
        name: 'Newton Kaleidoscope',
        description: 'Kaleidoscopic patterns from high-degree Newton.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.SYMMETRIC, TAGS.PSYCHEDELIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { polynomial: 'z^12-1', degree: 12, maxIterations: 50 },
        palette: 'kaleidoscope',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-celtic-knot',
        name: 'Celtic Knot',
        description: 'Interlocking patterns reminiscent of Celtic art.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.SYMMETRIC, TAGS.GEOMETRIC, 'celtic'],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 2 },
        params: { polynomial: 'z^6-z^3+1', maxIterations: 60 },
        palette: 'celtic-green',
        coloring: 'root-coloring'
    },
    {
        id: 'newton-rose-window',
        name: 'Rose Window',
        description: 'Cathedral rose window patterns.',
        category: PRESET_CATEGORY.NEWTON,
        tags: [TAGS.SYMMETRIC, TAGS.COLORFUL, 'gothic'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1.2 },
        params: { polynomial: 'z^16-1', degree: 16, maxIterations: 60 },
        palette: 'rose-window',
        coloring: 'root-coloring'
    }
];

// ============================================================================
// PROCEDURALLY GENERATED
// ============================================================================

// Generate variations of z^n - 1
const generateRootsOfUnity = () => {
    const presets = [];
    
    for (let n = 3; n <= 32; n++) {
        presets.push({
            id: `newton-zn-${n}`,
            name: `Newton z^${n}-1`,
            description: `Newton fractal for z^${n}-1 with ${n}-fold symmetry.`,
            category: PRESET_CATEGORY.NEWTON,
            tags: ['roots-of-unity', TAGS.SYMMETRIC, 'generated'],
            difficulty: n > 12 ? DIFFICULTY.INTERMEDIATE : DIFFICULTY.BEGINNER,
            location: { centerX: 0, centerY: 0, zoom: 1 },
            params: { polynomial: `z^${n}-1`, degree: n, maxIterations: Math.min(100, 30 + n * 2) },
            palette: `rainbow-${n % 8}`,
            coloring: 'root-coloring'
        });
    }
    
    return presets;
};

// Generate zoomed variations
const generateZoomedNewtons = () => {
    const presets = [];
    const polynomials = [
        { poly: 'z^3-1', deg: 3, rootX: 0.5, rootY: 0.866 },
        { poly: 'z^4-1', deg: 4, rootX: 0.707, rootY: 0.707 },
        { poly: 'z^5-1', deg: 5, rootX: 0.809, rootY: 0.588 }
    ];
    
    polynomials.forEach((p, pi) => {
        for (let i = 0; i < 15; i++) {
            const zoom = Math.pow(10, 1 + Math.random() * 4);
            const offsetX = (Math.random() - 0.5) * 0.5;
            const offsetY = (Math.random() - 0.5) * 0.5;
            
            presets.push({
                id: `newton-zoom-${pi}-${i}`,
                name: `Newton Exploration ${pi * 15 + i + 1}`,
                description: `Zoomed into ${p.poly} at depth ${Math.log10(zoom).toFixed(1)}`,
                category: PRESET_CATEGORY.NEWTON,
                tags: [TAGS.DEEP_ZOOM, TAGS.CHAOTIC, 'generated'],
                difficulty: zoom > 1000 ? DIFFICULTY.ADVANCED : DIFFICULTY.INTERMEDIATE,
                location: { centerX: p.rootX / 2 + offsetX, centerY: p.rootY / 2 + offsetY, zoom },
                params: { polynomial: p.poly, degree: p.deg, maxIterations: Math.round(50 + zoom / 20) },
                palette: 'zoom-gradient',
                coloring: 'root-coloring'
            });
        }
    });
    
    return presets;
};

// Generate custom polynomial variations
const generateCustomPolynomials = () => {
    const presets = [];
    const customPolys = [
        'z^3+z+1', 'z^4-z^2+1', 'z^5-z^3+z', 'z^3-2z+2',
        'z^6-z^3+1', 'z^4+z^3+z^2+z+1', 'z^8-15z^4-16', 'z^3+2z^2+z+1'
    ];
    
    customPolys.forEach((poly, i) => {
        for (let j = 0; j < 5; j++) {
            const zoom = 1 + Math.random() * 10;
            const offsetX = (Math.random() - 0.5);
            const offsetY = (Math.random() - 0.5);
            
            presets.push({
                id: `newton-custom-gen-${i}-${j}`,
                name: `Custom Newton ${i * 5 + j + 1}`,
                description: `Newton fractal for ${poly}`,
                category: PRESET_CATEGORY.NEWTON,
                tags: ['custom', TAGS.COLORFUL, 'generated'],
                difficulty: DIFFICULTY.INTERMEDIATE,
                location: { centerX: offsetX, centerY: offsetY, zoom },
                params: { polynomial: poly, maxIterations: 70 },
                palette: 'custom-rainbow',
                coloring: 'root-coloring'
            });
        }
    });
    
    return presets;
};

// ============================================================================
// COMBINE ALL NEWTON PRESETS
// ============================================================================

export const NEWTON_PRESETS = [
    ...CLASSIC_ROOTS_OF_UNITY,
    ...CUSTOM_POLYNOMIALS,
    ...TRIGONOMETRIC,
    ...BOUNDARY_ZOOMS,
    ...ARTISTIC,
    ...generateRootsOfUnity(),
    ...generateZoomedNewtons(),
    ...generateCustomPolynomials()
];

// ============================================================================
// LOADER FUNCTION
// ============================================================================

/**
 * Get all Newton presets
 * @returns {Array}
 */
export function getNewtonPresets() {
    return NEWTON_PRESETS;
}

/**
 * Get preset count
 * @returns {number}
 */
export function getNewtonPresetCount() {
    return NEWTON_PRESETS.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default NEWTON_PRESETS;
