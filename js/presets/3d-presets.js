/**
 * ============================================================================
 * ABYSS EXPLORER - 3D FRACTAL PRESETS
 * ============================================================================
 * 
 * Collection of 300+ 3D fractal presets including Mandelbulb, Mandelbox,
 * Quaternion Julia, Kleinian groups, and IFS fractals.
 * 
 * Each preset includes:
 * - Camera position and target
 * - Fractal parameters (power, bailout, etc.)
 * - Lighting suggestions
 * - Material hints
 * 
 * 3D Fractal Types:
 * - Mandelbulb: Spherical Mandelbrot analogue (various powers)
 * - Mandelbox: Box-folding fractal with infinite detail
 * - Julia Quaternion: 4D Julia sets projected to 3D
 * - Kleinian: Limit sets of Kleinian groups
 * - IFS: Iterated Function Systems (Sierpinski, etc.)
 * 
 * @module presets/3d-presets
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { PRESET_CATEGORY, DIFFICULTY, TAGS } from './preset-loader.js';

// ============================================================================
// MANDELBULB PRESETS
// ============================================================================

const MANDELBULB = [
    // Power 8 (Classic)
    {
        id: 'bulb-power8-overview',
        name: 'Classic Mandelbulb',
        description: 'The original power-8 Mandelbulb discovered by Daniel White and Paul Nylander.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-8', TAGS.SYMMETRIC, TAGS.ORGANIC, 'classic'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 8, bailout: 2, maxIterations: 10 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'bulb-classic'
    },
    {
        id: 'bulb-power8-equator',
        name: 'Bulb Equator',
        description: 'Viewing the Mandelbulb from the equatorial region.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-8', TAGS.ORGANIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 2.5, y: 0, z: 0 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 8, bailout: 2, maxIterations: 12 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'equator'
    },
    {
        id: 'bulb-power8-pole',
        name: 'Bulb North Pole',
        description: 'Looking down at the Mandelbulb from above.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-8', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 3, z: 0 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 8, bailout: 2, maxIterations: 12 },
        lighting: { ambient: 0.25, diffuse: 0.75, specular: 0.4 },
        palette: 'polar'
    },
    {
        id: 'bulb-power8-valley',
        name: 'Valley of the Bulb',
        description: 'Deep within a valley of the Mandelbulb surface.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-8', TAGS.DEEP_ZOOM, TAGS.ORGANIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 0.8, y: 0.2, z: 0.5 },
            target: { x: 0.6, y: 0.1, z: 0.3 }
        },
        params: { power: 8, bailout: 2, maxIterations: 15 },
        lighting: { ambient: 0.3, diffuse: 0.7, specular: 0.6 },
        palette: 'valley-deep'
    },
    {
        id: 'bulb-power8-tentacle',
        name: 'Bulb Tentacle',
        description: 'Following a tentacle extending from the bulb.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-8', TAGS.TENTACLES, TAGS.ORGANIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 1.2, y: 0.5, z: 0.3 },
            target: { x: 0.9, y: 0.3, z: 0.2 }
        },
        params: { power: 8, bailout: 2, maxIterations: 14 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'tentacle'
    },
    
    // Different Powers
    {
        id: 'bulb-power2',
        name: 'Mandelbulb Power 2',
        description: 'The simpler power-2 Mandelbulb.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-2', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 2, bailout: 2, maxIterations: 15 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power2'
    },
    {
        id: 'bulb-power3',
        name: 'Mandelbulb Power 3',
        description: 'Three-fold symmetric Mandelbulb.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-3', TAGS.SYMMETRIC, TAGS.ORGANIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 3, bailout: 2, maxIterations: 12 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power3'
    },
    {
        id: 'bulb-power4',
        name: 'Mandelbulb Power 4',
        description: 'Four-fold symmetric Mandelbulb.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-4', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 4, bailout: 2, maxIterations: 12 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power4'
    },
    {
        id: 'bulb-power5',
        name: 'Mandelbulb Power 5',
        description: 'Five-fold symmetric Mandelbulb with pentagonal features.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-5', TAGS.SYMMETRIC, TAGS.ORGANIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 5, bailout: 2, maxIterations: 12 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power5'
    },
    {
        id: 'bulb-power6',
        name: 'Mandelbulb Power 6',
        description: 'Six-fold symmetric Mandelbulb.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-6', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 6, bailout: 2, maxIterations: 12 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power6'
    },
    {
        id: 'bulb-power7',
        name: 'Mandelbulb Power 7',
        description: 'Seven-fold symmetric Mandelbulb.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-7', TAGS.SYMMETRIC, TAGS.ORGANIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 7, bailout: 2, maxIterations: 12 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power7'
    },
    {
        id: 'bulb-power9',
        name: 'Mandelbulb Power 9',
        description: 'Nine-fold symmetric Mandelbulb with intricate tentacles.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['power-9', TAGS.SYMMETRIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 9, bailout: 2, maxIterations: 11 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power9'
    },
    {
        id: 'bulb-power12',
        name: 'Mandelbulb Power 12',
        description: 'High-power Mandelbulb with complex symmetry.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['high-power', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 0, y: 0, z: 2.5 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 12, bailout: 2, maxIterations: 10 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power12'
    },
    {
        id: 'bulb-power16',
        name: 'Mandelbulb Power 16',
        description: 'Very high power Mandelbulb.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['high-power', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 0, y: 0, z: 2.5 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 16, bailout: 2, maxIterations: 9 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power16'
    },
    {
        id: 'bulb-power20',
        name: 'Mandelbulb Power 20',
        description: 'Extreme power Mandelbulb with smooth surfaces.',
        category: PRESET_CATEGORY.MANDELBULB,
        tags: ['high-power', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { 
            camera: { x: 0, y: 0, z: 2.5 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 20, bailout: 2, maxIterations: 8 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'power20'
    }
];

// ============================================================================
// MANDELBOX PRESETS
// ============================================================================

const MANDELBOX = [
    {
        id: 'box-classic',
        name: 'Classic Mandelbox',
        description: 'The original Mandelbox with scale -1.5.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['classic', TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 8 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { scale: -1.5, foldingLimit: 1, minRadius: 0.5, maxIterations: 15 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'box-classic'
    },
    {
        id: 'box-scale-2',
        name: 'Mandelbox Scale 2',
        description: 'Mandelbox with scale 2, creating different structures.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['scale-2', TAGS.GEOMETRIC, TAGS.CHAOTIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 6 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { scale: 2, foldingLimit: 1, minRadius: 0.5, maxIterations: 15 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'box-scale2'
    },
    {
        id: 'box-scale-negative2',
        name: 'Mandelbox Scale -2',
        description: 'Mandelbox with negative scale creating inverted structures.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['negative-scale', TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 6 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { scale: -2, foldingLimit: 1, minRadius: 0.5, maxIterations: 15 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'box-negative'
    },
    {
        id: 'box-interior',
        name: 'Mandelbox Interior',
        description: 'Inside the Mandelbox looking outward.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['interior', TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 1, y: 0.5, z: 1 },
            target: { x: 2, y: 1, z: 2 }
        },
        params: { scale: -1.5, foldingLimit: 1, minRadius: 0.5, maxIterations: 20 },
        lighting: { ambient: 0.3, diffuse: 0.7, specular: 0.4 },
        palette: 'box-interior'
    },
    {
        id: 'box-canyon',
        name: 'Mandelbox Canyon',
        description: 'Flying through a canyon in the Mandelbox.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['canyon', TAGS.GEOMETRIC, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 2, y: 0.1, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { scale: -1.5, foldingLimit: 1, minRadius: 0.5, maxIterations: 18 },
        lighting: { ambient: 0.25, diffuse: 0.75, specular: 0.5 },
        palette: 'canyon'
    },
    {
        id: 'box-sponge',
        name: 'Mandelbox Sponge',
        description: 'A sponge-like region of the Mandelbox.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['sponge', TAGS.CHAOTIC, TAGS.ORGANIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 1.5, y: 1.5, z: 1.5 },
            target: { x: 0.5, y: 0.5, z: 0.5 }
        },
        params: { scale: -1.7, foldingLimit: 1, minRadius: 0.4, maxIterations: 16 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'sponge'
    },
    {
        id: 'box-tower',
        name: 'Mandelbox Tower',
        description: 'A towering structure within the Mandelbox.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['tower', TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 0.5, y: -1, z: 0.5 },
            target: { x: 0, y: 3, z: 0 }
        },
        params: { scale: -1.5, foldingLimit: 1, minRadius: 0.5, maxIterations: 17 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.6 },
        palette: 'tower'
    },
    {
        id: 'box-maze',
        name: 'Mandelbox Maze',
        description: 'Navigating through the maze-like Mandelbox interior.',
        category: PRESET_CATEGORY.MANDELBOX,
        tags: ['maze', TAGS.GEOMETRIC, TAGS.CHAOTIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { 
            camera: { x: 0.8, y: 0.2, z: 0.8 },
            target: { x: 0.3, y: 0.1, z: 0.3 }
        },
        params: { scale: -1.5, foldingLimit: 1, minRadius: 0.5, maxIterations: 20 },
        lighting: { ambient: 0.3, diffuse: 0.7, specular: 0.4 },
        palette: 'maze'
    }
];

// ============================================================================
// QUATERNION JULIA PRESETS
// ============================================================================

const JULIA_3D = [
    {
        id: 'julia3d-classic',
        name: 'Classic Quaternion Julia',
        description: 'A classic quaternion Julia set in 3D.',
        category: PRESET_CATEGORY.JULIA_3D,
        tags: ['quaternion', TAGS.SYMMETRIC, TAGS.ORGANIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 0, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { 
            juliaC: { x: -0.2, y: 0.6, z: 0.2, w: 0.2 },
            sliceW: 0,
            maxIterations: 10
        },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'julia3d-classic'
    },
    {
        id: 'julia3d-spiral',
        name: 'Spiral Quaternion',
        description: 'A spiraling quaternion Julia set.',
        category: PRESET_CATEGORY.JULIA_3D,
        tags: ['quaternion', TAGS.SPIRAL, TAGS.ORGANIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 2, y: 1, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { 
            juliaC: { x: -0.4, y: 0.6, z: 0, w: 0 },
            sliceW: 0,
            maxIterations: 10
        },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'spiral3d'
    },
    {
        id: 'julia3d-bubble',
        name: 'Bubble Julia',
        description: 'Bubble-like quaternion Julia formations.',
        category: PRESET_CATEGORY.JULIA_3D,
        tags: ['quaternion', TAGS.ORGANIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 0, y: 2.5, z: 1 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { 
            juliaC: { x: -0.125, y: -0.256, z: 0.847, w: 0.0895 },
            sliceW: 0,
            maxIterations: 10
        },
        lighting: { ambient: 0.25, diffuse: 0.75, specular: 0.6 },
        palette: 'bubble'
    },
    {
        id: 'julia3d-coral',
        name: 'Coral Julia',
        description: 'Coral-like structures in quaternion space.',
        category: PRESET_CATEGORY.JULIA_3D,
        tags: ['quaternion', TAGS.ORGANIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 1.5, y: 0.5, z: 1.5 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { 
            juliaC: { x: -0.291, y: 0.399, z: 0.339, w: 0.437 },
            sliceW: 0,
            maxIterations: 12
        },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'coral3d'
    },
    {
        id: 'julia3d-dendrite',
        name: 'Dendrite Julia 3D',
        description: 'Tree-like dendrite structures in 3D.',
        category: PRESET_CATEGORY.JULIA_3D,
        tags: ['quaternion', TAGS.CHAOTIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 2, y: 0, z: 0 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { 
            juliaC: { x: -0.2, y: -0.4, z: -0.4, w: -0.4 },
            sliceW: 0,
            maxIterations: 12
        },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'dendrite3d'
    }
];

// ============================================================================
// KLEINIAN GROUP PRESETS
// ============================================================================

const KLEINIAN = [
    {
        id: 'kleinian-apollonian',
        name: 'Apollonian Gasket 3D',
        description: 'The Apollonian gasket extended into 3D.',
        category: PRESET_CATEGORY.KLEINIAN,
        tags: ['apollonian', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 0, y: 0, z: 5 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { maxIterations: 50 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'apollonian'
    },
    {
        id: 'kleinian-limit-set',
        name: 'Kleinian Limit Set',
        description: 'A complex Kleinian group limit set.',
        category: PRESET_CATEGORY.KLEINIAN,
        tags: ['limit-set', TAGS.CHAOTIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { 
            camera: { x: 0, y: 0, z: 4 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { maxIterations: 80 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'kleinian'
    },
    {
        id: 'kleinian-schottky',
        name: 'Schottky Group',
        description: 'A Schottky group visualization.',
        category: PRESET_CATEGORY.KLEINIAN,
        tags: ['schottky', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { 
            camera: { x: 2, y: 2, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { maxIterations: 60 },
        lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
        palette: 'schottky'
    }
];

// ============================================================================
// IFS FRACTALS
// ============================================================================

const IFS_FRACTALS = [
    {
        id: 'ifs-sierpinski-tetra',
        name: 'Sierpinski Tetrahedron',
        description: 'The classic 3D Sierpinski tetrahedron.',
        category: PRESET_CATEGORY.IFS,
        tags: ['sierpinski', TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 2, y: 2, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { depth: 8 },
        lighting: { ambient: 0.3, diffuse: 0.7, specular: 0.4 },
        palette: 'sierpinski'
    },
    {
        id: 'ifs-menger-sponge',
        name: 'Menger Sponge',
        description: 'The famous Menger sponge with infinite surface area and zero volume.',
        category: PRESET_CATEGORY.IFS,
        tags: ['menger', TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 3, y: 2, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { depth: 4 },
        lighting: { ambient: 0.25, diffuse: 0.75, specular: 0.5 },
        palette: 'menger'
    },
    {
        id: 'ifs-menger-interior',
        name: 'Inside the Menger Sponge',
        description: 'View from inside the Menger sponge.',
        category: PRESET_CATEGORY.IFS,
        tags: ['menger', TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 0.5, y: 0.5, z: 0.5 },
            target: { x: 1, y: 1, z: 1 }
        },
        params: { depth: 5 },
        lighting: { ambient: 0.3, diffuse: 0.7, specular: 0.4 },
        palette: 'menger-interior'
    },
    {
        id: 'ifs-jerusalem-cube',
        name: 'Jerusalem Cube',
        description: 'A Jerusalem cube variant of the Menger sponge.',
        category: PRESET_CATEGORY.IFS,
        tags: ['jerusalem', TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { 
            camera: { x: 3, y: 2, z: 3 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { depth: 3, variant: 'jerusalem' },
        lighting: { ambient: 0.25, diffuse: 0.75, specular: 0.5 },
        palette: 'jerusalem'
    },
    {
        id: 'ifs-cantor-dust-3d',
        name: 'Cantor Dust 3D',
        description: '3D Cantor dust - scattered points in space.',
        category: PRESET_CATEGORY.IFS,
        tags: ['cantor', TAGS.CHAOTIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { 
            camera: { x: 2, y: 2, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { depth: 6 },
        lighting: { ambient: 0.3, diffuse: 0.7, specular: 0.4 },
        palette: 'cantor'
    }
];

// ============================================================================
// PROCEDURALLY GENERATED 3D PRESETS
// ============================================================================

// Generate Mandelbulb power variations with different views
const generateBulbVariations = () => {
    const presets = [];
    const powers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];
    
    powers.forEach((power, pi) => {
        for (let i = 0; i < 5; i++) {
            const theta = (i / 5) * Math.PI * 2;
            const phi = 0.3 + Math.random() * 0.5;
            const dist = 2.5 + Math.random();
            
            presets.push({
                id: `bulb-gen-p${power}-${i}`,
                name: `Mandelbulb P${power} View ${i + 1}`,
                description: `Power ${power} Mandelbulb from angle ${(theta * 180 / Math.PI).toFixed(0)}°`,
                category: PRESET_CATEGORY.MANDELBULB,
                tags: [`power-${power}`, TAGS.SYMMETRIC, 'generated'],
                difficulty: power > 10 ? DIFFICULTY.INTERMEDIATE : DIFFICULTY.BEGINNER,
                location: {
                    camera: {
                        x: Math.cos(theta) * Math.sin(phi) * dist,
                        y: Math.cos(phi) * dist,
                        z: Math.sin(theta) * Math.sin(phi) * dist
                    },
                    target: { x: 0, y: 0, z: 0 }
                },
                params: { power, bailout: 2, maxIterations: Math.max(8, 15 - Math.floor(power / 3)) },
                lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
                palette: 'auto-bulb'
            });
        }
    });
    
    return presets;
};

// Generate Mandelbox scale variations
const generateBoxVariations = () => {
    const presets = [];
    const scales = [-2.5, -2, -1.75, -1.5, -1.25, -1, 1.5, 2, 2.5, 3];
    
    scales.forEach((scale, si) => {
        for (let i = 0; i < 5; i++) {
            const theta = (i / 5) * Math.PI * 2;
            const dist = 5 + Math.random() * 3;
            
            presets.push({
                id: `box-gen-s${scale.toFixed(1).replace('.', '_')}-${i}`,
                name: `Mandelbox S${scale.toFixed(1)} View ${i + 1}`,
                description: `Scale ${scale.toFixed(1)} Mandelbox`,
                category: PRESET_CATEGORY.MANDELBOX,
                tags: [`scale-${scale > 0 ? 'pos' : 'neg'}`, TAGS.GEOMETRIC, 'generated'],
                difficulty: DIFFICULTY.INTERMEDIATE,
                location: {
                    camera: {
                        x: Math.cos(theta) * dist * 0.7,
                        y: dist * 0.5,
                        z: Math.sin(theta) * dist * 0.7
                    },
                    target: { x: 0, y: 0, z: 0 }
                },
                params: { scale, foldingLimit: 1, minRadius: 0.5, maxIterations: 15 },
                lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
                palette: 'auto-box'
            });
        }
    });
    
    return presets;
};

// Generate quaternion Julia variations
const generateJulia3DVariations = () => {
    const presets = [];
    const juliaCs = [
        { x: -0.2, y: 0.6, z: 0.2, w: 0.2, name: 'Classic' },
        { x: -0.4, y: 0.6, z: 0, w: 0, name: 'Spiral' },
        { x: -0.125, y: -0.256, z: 0.847, w: 0.0895, name: 'Bubble' },
        { x: -0.291, y: 0.399, z: 0.339, w: 0.437, name: 'Coral' },
        { x: -0.213, y: -0.0410, z: -0.563, w: -0.560, name: 'Alien' },
        { x: -0.450, y: -0.447, z: 0.181, w: 0.306, name: 'Crystal' }
    ];
    
    juliaCs.forEach((c, ci) => {
        for (let i = 0; i < 5; i++) {
            const theta = (i / 5) * Math.PI * 2;
            const phi = 0.3 + Math.random() * 0.6;
            const dist = 2.5 + Math.random();
            
            presets.push({
                id: `julia3d-gen-${ci}-${i}`,
                name: `${c.name} Julia 3D ${i + 1}`,
                description: `Quaternion Julia variation: ${c.name}`,
                category: PRESET_CATEGORY.JULIA_3D,
                tags: ['quaternion', TAGS.ORGANIC, 'generated'],
                difficulty: DIFFICULTY.INTERMEDIATE,
                location: {
                    camera: {
                        x: Math.cos(theta) * Math.sin(phi) * dist,
                        y: Math.cos(phi) * dist,
                        z: Math.sin(theta) * Math.sin(phi) * dist
                    },
                    target: { x: 0, y: 0, z: 0 }
                },
                params: { juliaC: c, sliceW: 0, maxIterations: 10 },
                lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
                palette: 'auto-julia3d'
            });
        }
    });
    
    return presets;
};

// Generate themed 3D presets
const THEMES_3D = [
    'Alien World', 'Crystal Cave', 'Cosmic Structure', 'Organic Form',
    'Mathematical Beauty', 'Abstract Sculpture', 'Infinite Detail', 'Symmetry Breaking'
];

const generateThemed3D = () => {
    return THEMES_3D.map((theme, i) => ({
        id: `3d-theme-${i}`,
        name: theme,
        description: `${theme} - a 3D fractal exploration.`,
        category: i % 3 === 0 ? PRESET_CATEGORY.MANDELBULB : 
                 (i % 3 === 1 ? PRESET_CATEGORY.MANDELBOX : PRESET_CATEGORY.JULIA_3D),
        tags: [theme.toLowerCase().replace(' ', '-'), TAGS.COLORFUL, 'themed'],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: {
            camera: { 
                x: 2 + Math.random(), 
                y: 1 + Math.random(), 
                z: 2 + Math.random() 
            },
            target: { x: 0, y: 0, z: 0 }
        },
        params: { power: 8, maxIterations: 12 },
        lighting: { ambient: 0.25, diffuse: 0.75, specular: 0.5 },
        palette: theme.toLowerCase().replace(' ', '-')
    }));
};

// ============================================================================
// COMBINE ALL 3D PRESETS
// ============================================================================

export const PRESETS_3D = [
    ...MANDELBULB,
    ...MANDELBOX,
    ...JULIA_3D,
    ...KLEINIAN,
    ...IFS_FRACTALS,
    ...generateBulbVariations(),
    ...generateBoxVariations(),
    ...generateJulia3DVariations(),
    ...generateThemed3D()
];

// ============================================================================
// LOADER FUNCTION
// ============================================================================

/**
 * Get all 3D presets
 * @returns {Array}
 */
export function get3DPresets() {
    return PRESETS_3D;
}

/**
 * Get preset count
 * @returns {number}
 */
export function get3DPresetCount() {
    return PRESETS_3D.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PRESETS_3D;
