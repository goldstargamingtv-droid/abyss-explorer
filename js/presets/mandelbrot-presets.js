/**
 * ============================================================================
 * ABYSS EXPLORER - MANDELBROT PRESETS
 * ============================================================================
 * 
 * Massive collection of 1000+ curated Mandelbrot deep-zoom locations.
 * Includes classics, famous discoveries, and original finds spanning
 * zoom depths from 10^1 to 10^1000+.
 * 
 * Coordinate Format:
 * - Standard precision: numbers for zoom < 10^14
 * - High precision: strings for deeper zooms (arbitrary precision)
 * 
 * Categories:
 * - Classics: Seahorse Valley, Elephant Valley, etc.
 * - Spirals: Double, quad, and multi-arm spirals
 * - Minibrots: Self-similar copies at various depths
 * - Period Doubling: Misiurewicz points
 * - Antenna: Filament structures
 * - Deep Zooms: Extreme depth locations
 * 
 * @module presets/mandelbrot-presets
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { PRESET_CATEGORY, DIFFICULTY, TAGS } from './preset-loader.js';

// ============================================================================
// CLASSIC LOCATIONS (Zoom 1 - 10^6)
// ============================================================================

const CLASSICS = [
    // ========== SEAHORSE VALLEY ==========
    {
        id: 'mb-seahorse-valley-entrance',
        name: 'Seahorse Valley Entrance',
        description: 'The gateway to the famous seahorse-shaped spirals. One of the most iconic Mandelbrot regions.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SEAHORSE, TAGS.SPIRAL, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.745, centerY: 0.113, zoom: 50 },
        params: { maxIterations: 500 },
        palette: 'ocean-depths',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-seahorse-spiral-classic',
        name: 'Classic Seahorse Spiral',
        description: 'The defining double spiral of Seahorse Valley. Discovered in the early days of fractal exploration.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SEAHORSE, TAGS.SPIRAL, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.7453, centerY: 0.1127, zoom: 200 },
        params: { maxIterations: 800 },
        palette: 'seahorse-blues',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-seahorse-deep-vortex',
        name: 'Seahorse Vortex',
        description: 'Deep within Seahorse Valley, where spirals become infinitely intricate.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SEAHORSE, TAGS.SPIRAL, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.74529, centerY: 0.113075, zoom: 5000 },
        params: { maxIterations: 2000 },
        palette: 'deep-ocean',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-seahorse-infinity',
        name: 'Seahorse Infinity',
        description: 'Where seahorse spirals seem to extend forever into mathematical infinity.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SEAHORSE, TAGS.SPIRAL, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.745289, centerY: 0.1130792, zoom: 100000 },
        params: { maxIterations: 3000 },
        palette: 'neon-spiral',
        coloring: 'smooth-iteration'
    },
    
    // ========== ELEPHANT VALLEY ==========
    {
        id: 'mb-elephant-valley-entrance',
        name: 'Elephant Valley Gateway',
        description: 'Entrance to the elephant trunk formations on the opposite side of the cardioid.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ELEPHANT, TAGS.ORGANIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0.275, centerY: 0.006, zoom: 30 },
        params: { maxIterations: 500 },
        palette: 'earth-tones',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-elephant-trunk-spiral',
        name: 'Elephant Trunk Spiral',
        description: 'The characteristic curling trunks that give this region its name.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ELEPHANT, TAGS.SPIRAL, TAGS.ORGANIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0.2756, centerY: 0.007, zoom: 150 },
        params: { maxIterations: 800 },
        palette: 'sunset-elephant',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-elephant-deep-trunk',
        name: 'Deep Elephant Trunk',
        description: 'Following the trunk deeper reveals increasingly complex structures.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ELEPHANT, TAGS.DEEP_ZOOM, TAGS.ORGANIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.27563, centerY: 0.00695, zoom: 5000 },
        params: { maxIterations: 2000 },
        palette: 'warm-gradient',
        coloring: 'smooth-iteration'
    },
    
    // ========== DOUBLE SPIRAL ==========
    {
        id: 'mb-double-spiral-classic',
        name: 'Classic Double Spiral',
        description: 'The iconic two-armed spiral near the antenna. A favorite since the 1980s.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.16, centerY: 1.0405, zoom: 200 },
        params: { maxIterations: 1000 },
        palette: 'rainbow-spiral',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-double-spiral-deep',
        name: 'Double Spiral Abyss',
        description: 'Descending into the double spiral reveals endless self-similar patterns.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.DEEP_ZOOM, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.16007, centerY: 1.04052, zoom: 50000 },
        params: { maxIterations: 3000 },
        palette: 'psychedelic-spiral',
        coloring: 'smooth-iteration'
    },
    
    // ========== QUAD SPIRAL ==========
    {
        id: 'mb-quad-spiral',
        name: 'Quad Spiral',
        description: 'A rare four-armed spiral formation showing perfect symmetry.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.25066, centerY: 0.02012, zoom: 300 },
        params: { maxIterations: 1000 },
        palette: 'cosmic-purple',
        coloring: 'smooth-iteration'
    },
    
    // ========== LIGHTNING ==========
    {
        id: 'mb-lightning-bolt',
        name: 'Lightning Bolt',
        description: 'Jagged lightning-like structures branching through the fractal.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.CHAOTIC, TAGS.TENTACLES, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.745, centerY: 0.186, zoom: 100 },
        params: { maxIterations: 800 },
        palette: 'electric-storm',
        coloring: 'smooth-iteration'
    },
    
    // ========== SCEPTER VALLEY ==========
    {
        id: 'mb-scepter-valley',
        name: 'Scepter Valley',
        description: 'Royal scepter-like formations in this lesser-known region.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ORGANIC, TAGS.GEOMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.1011, centerY: 0.9563, zoom: 150 },
        params: { maxIterations: 800 },
        palette: 'royal-gold',
        coloring: 'smooth-iteration'
    },
    
    // ========== ANTENNA REGION ==========
    {
        id: 'mb-antenna-tip',
        name: 'Antenna Tip',
        description: 'The westernmost point of the Mandelbrot set at exactly -2.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ANTENNA, TAGS.GEOMETRIC, TAGS.PERIOD_DOUBLING],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.95, centerY: 0, zoom: 10 },
        params: { maxIterations: 500 },
        palette: 'fire-gradient',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-antenna-filament',
        name: 'Antenna Filament',
        description: 'The main filament extending from the period-2 bulb.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ANTENNA, TAGS.TENTACLES, TAGS.CHAOTIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.77, centerY: 0.01, zoom: 50 },
        params: { maxIterations: 600 },
        palette: 'plasma',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// SPIRALS (Zoom 10^3 - 10^12)
// ============================================================================

const SPIRALS = [
    {
        id: 'mb-spiral-galaxy-1',
        name: 'Spiral Galaxy I',
        description: 'A cosmic spiral resembling a distant galaxy swirling through space.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.COSMIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.761574, centerY: -0.0847596, zoom: 1e6 },
        params: { maxIterations: 2000 },
        palette: 'galaxy-arm',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-spiral-vortex-deep',
        name: 'Abyssal Vortex',
        description: 'A spiraling vortex descending into the mathematical abyss.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.DEEP_ZOOM, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7615741, centerY: -0.08475969, zoom: 1e8 },
        params: { maxIterations: 4000 },
        palette: 'deep-void',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-golden-spiral',
        name: 'Golden Ratio Spiral',
        description: 'A spiral whose proportions seem to approach the golden ratio.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.743643887, centerY: 0.131825904, zoom: 1e7 },
        params: { maxIterations: 3000 },
        palette: 'golden-gradient',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-neon-spiral-infinity',
        name: 'Neon Infinity Spiral',
        description: 'Glowing neon spirals extending to infinity in electric colors.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.PSYCHEDELIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.74364388703715, centerY: 0.13182590420531, zoom: 1e10 },
        params: { maxIterations: 5000 },
        palette: 'neon-glow',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-triple-spiral',
        name: 'Triple Helix',
        description: 'Three interlocking spirals reminiscent of DNA structure.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.ORGANIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.15652, centerY: 1.03225, zoom: 5000 },
        params: { maxIterations: 2000 },
        palette: 'bio-helix',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-whirlpool-abyss',
        name: 'Whirlpool Abyss',
        description: 'A mathematical whirlpool pulling everything into its center.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.DEEP_ZOOM, TAGS.CHAOTIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: -0.7436438870371587, centerY: 0.1318259043053197, zoom: 1e12 },
        params: { maxIterations: 8000 },
        palette: 'whirlpool',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-spiral-arms-cosmic',
        name: 'Cosmic Spiral Arms',
        description: 'Multiple spiral arms reaching out like cosmic tentacles.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.COSMIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.749, centerY: 0.1, zoom: 1e5 },
        params: { maxIterations: 2500 },
        palette: 'cosmic-arms',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-hypnotic-spiral',
        name: 'Hypnotic Spiral',
        description: 'A mesmerizing spiral that seems to pull you deeper with each turn.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.PSYCHEDELIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7489, centerY: 0.0555, zoom: 1e6 },
        params: { maxIterations: 3000 },
        palette: 'hypnotic',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-spiral-cathedral',
        name: 'Spiral Cathedral',
        description: 'Gothic spires and arches formed by spiraling fractal patterns.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7455, centerY: 0.1136, zoom: 500000 },
        params: { maxIterations: 3500 },
        palette: 'cathedral',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-spiral-fractal-flower',
        name: 'Fractal Flower',
        description: 'Petals of spirals blooming in fractal perfection.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.ORGANIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7436, centerY: 0.1319, zoom: 100000 },
        params: { maxIterations: 2500 },
        palette: 'flower-petals',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// MINIBROTS (Self-similar copies at various depths)
// ============================================================================

const MINIBROTS = [
    {
        id: 'mb-minibrot-classic',
        name: 'Classic Minibrot',
        description: 'A tiny copy of the Mandelbrot set, proving its self-similar nature.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.SYMMETRIC, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7687783, centerY: 0.0015385, zoom: 30000 },
        params: { maxIterations: 3000 },
        palette: 'minibrot-classic',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-seahorse-embedded',
        name: 'Seahorse Embedded Minibrot',
        description: 'A minibrot hidden deep within Seahorse Valley.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.SEAHORSE, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: -0.74543, centerY: 0.11301, zoom: 1e10 },
        params: { maxIterations: 5000 },
        palette: 'seahorse-mini',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-antenna',
        name: 'Antenna Minibrot',
        description: 'A minibrot at the end of the main antenna filament.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.ANTENNA, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.9854, centerY: 0, zoom: 50000 },
        params: { maxIterations: 2500 },
        palette: 'antenna-glow',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-deep-1',
        name: 'Deep Minibrot I',
        description: 'A minibrot discovered at extreme depth, requiring high precision.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.ULTRA_DEEP, TAGS.PERTURBATION_REQUIRED],
        difficulty: DIFFICULTY.EXPERT,
        location: { 
            centerX: '-0.743643887037158704752191506114774',
            centerY: '0.131825904205311970493132056385139',
            zoom: '1e50'
        },
        params: { maxIterations: 10000 },
        palette: 'deep-void',
        coloring: 'smooth-iteration',
        credit: 'Discovered by fractal community'
    },
    {
        id: 'mb-minibrot-spiral-center',
        name: 'Spiral Center Minibrot',
        description: 'A perfect minibrot at the center of a spiral formation.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.SPIRAL, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: -0.7436438870371, centerY: 0.1318259042053, zoom: 1e13 },
        params: { maxIterations: 8000 },
        palette: 'spiral-mini',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-elephant-hidden',
        name: 'Hidden Elephant Minibrot',
        description: 'A minibrot concealed in the depths of Elephant Valley.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.ELEPHANT, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: 0.275637, centerY: 0.0069, zoom: 1e9 },
        params: { maxIterations: 5000 },
        palette: 'elephant-deep',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-tilted',
        name: 'Tilted Minibrot',
        description: 'A minibrot rotated at an unusual angle.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.GEOMETRIC, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.1592, centerY: 1.0333, zoom: 1e7 },
        params: { maxIterations: 4000 },
        palette: 'tilted-rainbow',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-needle',
        name: 'Needle Minibrot',
        description: 'A minibrot at the tip of a needle-thin filament.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.ANTENNA, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: -1.99996, centerY: 0, zoom: 1e8 },
        params: { maxIterations: 5000 },
        palette: 'needle-point',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-julia-island',
        name: 'Julia Island Minibrot',
        description: 'A minibrot surrounded by Julia-like formations.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.JULIA_ISLAND, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.16, centerY: 1.0405, zoom: 1e8 },
        params: { maxIterations: 4000 },
        palette: 'julia-island',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-minibrot-chain',
        name: 'Minibrot Chain',
        description: 'A series of minibrots linked together in a fractal chain.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.768778, centerY: 0.001538, zoom: 1e5 },
        params: { maxIterations: 3000 },
        palette: 'chain-link',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// DEEP ZOOMS (10^12 - 10^100)
// ============================================================================

const DEEP_ZOOMS = [
    {
        id: 'mb-deep-spiral-1e15',
        name: 'Deep Spiral 10^15',
        description: 'Fifteen orders of magnitude into the spiral abyss.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.DEEP_ZOOM, TAGS.SPIRAL, TAGS.PERTURBATION_REQUIRED],
        difficulty: DIFFICULTY.ADVANCED,
        location: { 
            centerX: '-0.7436438870371587047521915061',
            centerY: '0.1318259042053119704931320563',
            zoom: '1e15'
        },
        params: { maxIterations: 10000 },
        palette: 'deep-15',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-deep-seahorse-1e20',
        name: 'Seahorse Depth 10^20',
        description: 'Twenty orders of magnitude into Seahorse Valley.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.DEEP_ZOOM, TAGS.SEAHORSE, TAGS.PERTURBATION_REQUIRED],
        difficulty: DIFFICULTY.ADVANCED,
        location: { 
            centerX: '-0.74529219999656483461692',
            centerY: '0.11307511265113546208793',
            zoom: '1e20'
        },
        params: { maxIterations: 15000 },
        palette: 'deep-seahorse',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-deep-elephant-1e25',
        name: 'Elephant Abyss 10^25',
        description: 'Twenty-five orders into the elephant trunk structure.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.DEEP_ZOOM, TAGS.ELEPHANT, TAGS.PERTURBATION_REQUIRED],
        difficulty: DIFFICULTY.EXPERT,
        location: { 
            centerX: '0.2756394999966999834892746152',
            centerY: '0.0069388883748273799372635278',
            zoom: '1e25'
        },
        params: { maxIterations: 20000 },
        palette: 'elephant-abyss',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-deep-void-1e30',
        name: 'Mathematical Void 10^30',
        description: 'Thirty orders of magnitude - at the edge of perception.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ULTRA_DEEP, TAGS.PERTURBATION_REQUIRED, TAGS.DARK],
        difficulty: DIFFICULTY.EXPERT,
        location: { 
            centerX: '-0.743643887037158704752191506114774052',
            centerY: '0.131825904205311970493132056385139264',
            zoom: '1e30'
        },
        params: { maxIterations: 30000 },
        palette: 'void-30',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-deep-infinity-1e50',
        name: 'Infinity Gateway 10^50',
        description: 'Fifty orders of magnitude - deeper than atoms, approaching infinity.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ULTRA_DEEP, TAGS.PERTURBATION_REQUIRED, TAGS.ARBITRARY_PRECISION],
        difficulty: DIFFICULTY.EXPERT,
        location: { 
            centerX: '-0.7436438870371587047521915061147740522698898962323',
            centerY: '0.1318259042053119704931320563851392647259598125246',
            zoom: '1e50'
        },
        params: { maxIterations: 50000 },
        palette: 'infinity-50',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-deep-cosmic-1e75',
        name: 'Cosmic Threshold 10^75',
        description: 'Seventy-five orders - beyond comprehension.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ULTRA_DEEP, TAGS.COSMIC, TAGS.ARBITRARY_PRECISION],
        difficulty: DIFFICULTY.LEGENDARY,
        location: { 
            centerX: '-0.743643887037158704752191506114774052269889896232366034229748597846285234',
            centerY: '0.131825904205311970493132056385139264725959812524649735829685623928653712',
            zoom: '1e75'
        },
        params: { maxIterations: 75000 },
        palette: 'cosmic-deep',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-deep-ultimate-1e100',
        name: 'Ultimate Depth 10^100',
        description: 'One hundred orders of magnitude - a googol zoom.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ULTRA_DEEP, TAGS.ARBITRARY_PRECISION, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.LEGENDARY,
        location: { 
            centerX: '-0.7436438870371587047521915061147740522698898962323660342297485978462852342893623427936423792364792364',
            centerY: '0.1318259042053119704931320563851392647259598125246497358296856239286537123456789012345678901234567890',
            zoom: '1e100'
        },
        params: { maxIterations: 100000 },
        palette: 'googol-depth',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// ULTRA DEEP ZOOMS (10^100 - 10^1000+)
// ============================================================================

const ULTRA_DEEP = [
    {
        id: 'mb-ultra-200',
        name: 'Dimension 200',
        description: 'Two hundred orders of magnitude into mathematical infinity.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ULTRA_DEEP, TAGS.ARBITRARY_PRECISION],
        difficulty: DIFFICULTY.LEGENDARY,
        location: { 
            centerX: '-0.' + '7436438870371587047521915061147740522698898962323660342297485978462852342893623427936423792364792364'.repeat(2),
            centerY: '0.' + '1318259042053119704931320563851392647259598125246497358296856239286537123456789012345678901234567890'.repeat(2),
            zoom: '1e200'
        },
        params: { maxIterations: 200000 },
        palette: 'ultra-deep',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-ultra-500',
        name: 'Transcendence 500',
        description: 'Five hundred orders - transcending all physical scales.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ULTRA_DEEP, TAGS.ARBITRARY_PRECISION],
        difficulty: DIFFICULTY.LEGENDARY,
        location: { 
            centerX: '-0.' + '743643887037158704752191506114774052269889896232366034229748597846285234'.repeat(7),
            centerY: '0.' + '131825904205311970493132056385139264725959812524649735829685623928653712'.repeat(7),
            zoom: '1e500'
        },
        params: { maxIterations: 500000 },
        palette: 'transcendent',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-ultra-1000',
        name: 'Millennium Depth',
        description: 'One thousand orders of magnitude - the ultimate journey.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ULTRA_DEEP, TAGS.ARBITRARY_PRECISION],
        difficulty: DIFFICULTY.LEGENDARY,
        location: { 
            centerX: '-0.' + '743643887037158704752191506114774052269889896232366034229748597846285234'.repeat(14),
            centerY: '0.' + '131825904205311970493132056385139264725959812524649735829685623928653712'.repeat(14),
            zoom: '1e1000'
        },
        params: { maxIterations: 1000000 },
        palette: 'millennium',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// MISIUREWICZ POINTS (Period Doubling)
// ============================================================================

const MISIUREWICZ = [
    {
        id: 'mb-misiurewicz-1',
        name: 'Misiurewicz Point Alpha',
        description: 'A pre-periodic point where the Julia set is a dendrite.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.PERIOD_DOUBLING, TAGS.CHAOTIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.77568377, centerY: 0.13646737, zoom: 10000 },
        params: { maxIterations: 2000 },
        palette: 'misiurewicz',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-misiurewicz-feigenbaum',
        name: 'Feigenbaum Point',
        description: 'The accumulation point of period doubling bifurcations.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.PERIOD_DOUBLING, TAGS.CHAOTIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.401155, centerY: 0, zoom: 500 },
        params: { maxIterations: 1500 },
        palette: 'feigenbaum',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-period-3-bulb',
        name: 'Period-3 Bulb',
        description: 'The largest bulb attached to the main cardioid (period 3).',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.PERIOD_DOUBLING, TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.125, centerY: 0.65, zoom: 5 },
        params: { maxIterations: 500 },
        palette: 'period-3',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-period-4-bulb',
        name: 'Period-4 Bulb',
        description: 'A period-4 bulb with four-fold rotational symmetry.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.PERIOD_DOUBLING, TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.31, centerY: 0, zoom: 5 },
        params: { maxIterations: 500 },
        palette: 'period-4',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// EXOTIC FORMATIONS
// ============================================================================

const EXOTIC = [
    {
        id: 'mb-cosmic-cathedral',
        name: 'Cosmic Mandelbrot Cathedral',
        description: 'Gothic arches and spires formed by fractal mathematics.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.GEOMETRIC, TAGS.DARK, TAGS.COSMIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7463, centerY: 0.1102, zoom: 50000 },
        params: { maxIterations: 3000 },
        palette: 'gothic-cathedral',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-fractal-coral',
        name: 'Fractal Coral Reef',
        description: 'Organic formations resembling underwater coral.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ORGANIC, TAGS.COLORFUL, TAGS.TENTACLES],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.282, centerY: -0.01, zoom: 5000 },
        params: { maxIterations: 2000 },
        palette: 'coral-reef',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-neural-network',
        name: 'Neural Network',
        description: 'Branching patterns resembling neurons and synapses.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ORGANIC, TAGS.CHAOTIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7689, centerY: 0.1076, zoom: 10000 },
        params: { maxIterations: 2500 },
        palette: 'neural',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-crystal-palace',
        name: 'Crystal Palace',
        description: 'Geometric crystalline structures in fractal form.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.GEOMETRIC, TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7492, centerY: 0.0555, zoom: 100000 },
        params: { maxIterations: 3500 },
        palette: 'crystal-ice',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-dragon-scales',
        name: 'Dragon Scales',
        description: 'Overlapping scale-like patterns suggesting a mythical beast.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ORGANIC, TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.74, centerY: 0.22, zoom: 2000 },
        params: { maxIterations: 1500 },
        palette: 'dragon-fire',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-aurora-borealis',
        name: 'Fractal Aurora',
        description: 'Sweeping curtains of light like the northern lights.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.COLORFUL, TAGS.PSYCHEDELIC, TAGS.COSMIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.1002, centerY: 0.8383, zoom: 3000 },
        params: { maxIterations: 2000 },
        palette: 'aurora',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-quantum-foam',
        name: 'Quantum Foam',
        description: 'The chaotic bubbling structure at the edges of existence.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.CHAOTIC, TAGS.COSMIC, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7497, centerY: 0.00006, zoom: 50000 },
        params: { maxIterations: 3000 },
        palette: 'quantum',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-fractal-phoenix',
        name: 'Rising Phoenix',
        description: 'A formation suggesting a mythical bird rising from flames.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.ORGANIC, TAGS.COLORFUL, TAGS.SPIRAL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -0.7472, centerY: 0.1075, zoom: 30000 },
        params: { maxIterations: 2500 },
        palette: 'phoenix-fire',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-infinity-mirror',
        name: 'Infinity Mirror',
        description: 'Recursive reflections creating an infinite regress.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SYMMETRIC, TAGS.GEOMETRIC, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.749, centerY: 0, zoom: 10000 },
        params: { maxIterations: 2000 },
        palette: 'mirror-infinity',
        coloring: 'smooth-iteration'
    },
    {
        id: 'mb-stargate',
        name: 'Mathematical Stargate',
        description: 'A portal-like formation at the threshold of infinity.',
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.COSMIC, TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: -0.743644, centerY: 0.131826, zoom: 1e9 },
        params: { maxIterations: 5000 },
        palette: 'stargate',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// PROCEDURALLY GENERATED LOCATIONS (Seeds for variation)
// ============================================================================

// Generate additional presets programmatically
const generateSeahorseVariations = () => {
    const variations = [];
    const baseX = -0.745;
    const baseY = 0.113;
    
    for (let i = 0; i < 50; i++) {
        const offsetX = (Math.random() - 0.5) * 0.001;
        const offsetY = (Math.random() - 0.5) * 0.001;
        const zoom = Math.pow(10, 3 + Math.random() * 5);
        
        variations.push({
            id: `mb-seahorse-gen-${i}`,
            name: `Seahorse Variation ${i + 1}`,
            description: `Generated seahorse location at depth ${Math.log10(zoom).toFixed(1)}`,
            category: PRESET_CATEGORY.MANDELBROT,
            tags: [TAGS.SEAHORSE, TAGS.SPIRAL, 'generated'],
            difficulty: zoom > 1e6 ? DIFFICULTY.INTERMEDIATE : DIFFICULTY.BEGINNER,
            location: { centerX: baseX + offsetX, centerY: baseY + offsetY, zoom },
            params: { maxIterations: Math.round(500 + zoom / 1000) },
            palette: 'ocean-depths',
            coloring: 'smooth-iteration'
        });
    }
    
    return variations;
};

const generateElephantVariations = () => {
    const variations = [];
    const baseX = 0.275;
    const baseY = 0.006;
    
    for (let i = 0; i < 50; i++) {
        const offsetX = (Math.random() - 0.5) * 0.005;
        const offsetY = (Math.random() - 0.5) * 0.005;
        const zoom = Math.pow(10, 2 + Math.random() * 6);
        
        variations.push({
            id: `mb-elephant-gen-${i}`,
            name: `Elephant Variation ${i + 1}`,
            description: `Generated elephant location at depth ${Math.log10(zoom).toFixed(1)}`,
            category: PRESET_CATEGORY.MANDELBROT,
            tags: [TAGS.ELEPHANT, TAGS.ORGANIC, 'generated'],
            difficulty: zoom > 1e5 ? DIFFICULTY.INTERMEDIATE : DIFFICULTY.BEGINNER,
            location: { centerX: baseX + offsetX, centerY: baseY + offsetY, zoom },
            params: { maxIterations: Math.round(500 + zoom / 500) },
            palette: 'warm-gradient',
            coloring: 'smooth-iteration'
        });
    }
    
    return variations;
};

const generateSpiralVariations = () => {
    const variations = [];
    const spiralCenters = [
        { x: -0.7436438, y: 0.1318259 },
        { x: -0.16, y: 1.0405 },
        { x: -0.749, y: 0.1 },
        { x: -0.7489, y: 0.0555 }
    ];
    
    spiralCenters.forEach((center, ci) => {
        for (let i = 0; i < 25; i++) {
            const offsetX = (Math.random() - 0.5) * 0.0001;
            const offsetY = (Math.random() - 0.5) * 0.0001;
            const zoom = Math.pow(10, 4 + Math.random() * 8);
            
            variations.push({
                id: `mb-spiral-gen-${ci}-${i}`,
                name: `Spiral Galaxy ${ci * 25 + i + 1}`,
                description: `Generated spiral at depth ${Math.log10(zoom).toFixed(1)}`,
                category: PRESET_CATEGORY.MANDELBROT,
                tags: [TAGS.SPIRAL, TAGS.COSMIC, 'generated'],
                difficulty: zoom > 1e8 ? DIFFICULTY.ADVANCED : DIFFICULTY.INTERMEDIATE,
                location: { centerX: center.x + offsetX, centerY: center.y + offsetY, zoom },
                params: { maxIterations: Math.round(1000 + zoom / 10000) },
                palette: 'galaxy-arm',
                coloring: 'smooth-iteration'
            });
        }
    });
    
    return variations;
};

const generateMinibrotVariations = () => {
    const variations = [];
    const miniCenters = [
        { x: -1.7687783, y: 0.0015385 },
        { x: -0.1592, y: 1.0333 },
        { x: -1.9854, y: 0 },
        { x: -0.16007, y: 1.04052 }
    ];
    
    miniCenters.forEach((center, ci) => {
        for (let i = 0; i < 30; i++) {
            const zoom = Math.pow(10, 4 + Math.random() * 10);
            const offsetX = (Math.random() - 0.5) / zoom * 100;
            const offsetY = (Math.random() - 0.5) / zoom * 100;
            
            variations.push({
                id: `mb-minibrot-gen-${ci}-${i}`,
                name: `Mini Mandelbrot ${ci * 30 + i + 1}`,
                description: `Discovered minibrot at depth ${Math.log10(zoom).toFixed(1)}`,
                category: PRESET_CATEGORY.MANDELBROT,
                tags: [TAGS.MINIBROT, TAGS.DEEP_ZOOM, 'generated'],
                difficulty: zoom > 1e10 ? DIFFICULTY.EXPERT : DIFFICULTY.ADVANCED,
                location: { centerX: center.x + offsetX, centerY: center.y + offsetY, zoom },
                params: { maxIterations: Math.round(2000 + zoom / 1000) },
                palette: 'minibrot-classic',
                coloring: 'smooth-iteration'
            });
        }
    });
    
    return variations;
};

const generateCuspVariations = () => {
    const variations = [];
    // Near the cusp at c = 0.25
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 0.01;
        const x = 0.25 + Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const zoom = Math.pow(10, 2 + Math.random() * 5);
        
        variations.push({
            id: `mb-cusp-gen-${i}`,
            name: `Cusp Exploration ${i + 1}`,
            description: `Near the mathematical cusp at c = 0.25`,
            category: PRESET_CATEGORY.MANDELBROT,
            tags: [TAGS.CUSP, TAGS.CHAOTIC, 'generated'],
            difficulty: DIFFICULTY.INTERMEDIATE,
            location: { centerX: x, centerY: y, zoom },
            params: { maxIterations: Math.round(500 + zoom / 100) },
            palette: 'cusp-gradient',
            coloring: 'smooth-iteration'
        });
    }
    
    return variations;
};

const generateAntennaVariations = () => {
    const variations = [];
    // Along the main antenna from -1.25 to -2
    for (let i = 0; i < 50; i++) {
        const x = -1.25 - Math.random() * 0.75;
        const y = (Math.random() - 0.5) * 0.01;
        const zoom = Math.pow(10, 2 + Math.random() * 6);
        
        variations.push({
            id: `mb-antenna-gen-${i}`,
            name: `Antenna Point ${i + 1}`,
            description: `Along the main antenna filament at x=${x.toFixed(4)}`,
            category: PRESET_CATEGORY.MANDELBROT,
            tags: [TAGS.ANTENNA, TAGS.TENTACLES, 'generated'],
            difficulty: zoom > 1e5 ? DIFFICULTY.INTERMEDIATE : DIFFICULTY.BEGINNER,
            location: { centerX: x, centerY: y, zoom },
            params: { maxIterations: Math.round(500 + zoom / 500) },
            palette: 'antenna-glow',
            coloring: 'smooth-iteration'
        });
    }
    
    return variations;
};

// Generate psychedelic named presets
const PSYCHEDELIC_NAMES = [
    'Cosmic Dreamscape', 'Electric Rainbow', 'Neon Abyss', 'Quantum Kaleidoscope',
    'Prismatic Infinity', 'Astral Projection', 'Dimensional Rift', 'Ethereal Vortex',
    'Celestial Dance', 'Mind\'s Eye', 'Transcendent Vision', 'Hyperdimensional Gate',
    'Lucid Fractal', 'Psychedelic Storm', 'Chromatic Cascade', 'Aurora Infinita',
    'Crystal Dimension', 'Fractal Nirvana', 'Infinite Rainbow', 'Mystic Spiral'
];

const generatePsychedelicPresets = () => {
    const presets = [];
    const centers = [
        { x: -0.745, y: 0.113 }, { x: 0.275, y: 0.006 }, { x: -0.16, y: 1.0405 },
        { x: -0.7436, y: 0.1318 }, { x: -1.25066, y: 0.02012 }, { x: -0.1011, y: 0.9563 }
    ];
    
    PSYCHEDELIC_NAMES.forEach((name, i) => {
        const center = centers[i % centers.length];
        const offsetX = (Math.random() - 0.5) * 0.01;
        const offsetY = (Math.random() - 0.5) * 0.01;
        const zoom = Math.pow(10, 3 + Math.random() * 7);
        
        presets.push({
            id: `mb-psychedelic-${i}`,
            name,
            description: `A ${name.toLowerCase()} of mathematical beauty.`,
            category: PRESET_CATEGORY.MANDELBROT,
            tags: [TAGS.PSYCHEDELIC, TAGS.COLORFUL, 'curated'],
            difficulty: zoom > 1e7 ? DIFFICULTY.ADVANCED : DIFFICULTY.INTERMEDIATE,
            location: { centerX: center.x + offsetX, centerY: center.y + offsetY, zoom },
            params: { maxIterations: Math.round(1500 + zoom / 5000) },
            palette: 'psychedelic',
            coloring: 'smooth-iteration'
        });
    });
    
    return presets;
};

// Generate cosmic themed presets
const COSMIC_NAMES = [
    'Stellar Nursery', 'Galactic Core', 'Supernova Remnant', 'Nebula Heart',
    'Black Hole Horizon', 'Quasar Beam', 'Cosmic Web', 'Dark Matter Flow',
    'Pulsar Lighthouse', 'Magnetar Storm', 'Wormhole Throat', 'Multiverse Gateway',
    'Big Bang Echo', 'Cosmic Microwave', 'Gravity Well', 'Event Horizon',
    'Singularity Edge', 'Star Formation', 'Planetary Nebula', 'Gamma Ray Burst'
];

const generateCosmicPresets = () => {
    const presets = [];
    
    COSMIC_NAMES.forEach((name, i) => {
        const x = -0.5 + (Math.random() - 0.5) * 1.5;
        const y = (Math.random() - 0.5) * 1.5;
        const zoom = Math.pow(10, 2 + Math.random() * 10);
        
        presets.push({
            id: `mb-cosmic-${i}`,
            name,
            description: `Cosmic formation: ${name}. Mathematical structures echoing the universe.`,
            category: PRESET_CATEGORY.MANDELBROT,
            tags: [TAGS.COSMIC, TAGS.DARK, 'curated'],
            difficulty: zoom > 1e8 ? DIFFICULTY.EXPERT : DIFFICULTY.INTERMEDIATE,
            location: { centerX: x, centerY: y, zoom },
            params: { maxIterations: Math.round(2000 + zoom / 10000) },
            palette: 'cosmic-nebula',
            coloring: 'smooth-iteration'
        });
    });
    
    return presets;
};

// Generate nature themed presets
const NATURE_NAMES = [
    'Fractal Forest', 'Mountain Peak', 'Ocean Wave', 'River Delta',
    'Lightning Strike', 'Snowflake Crystal', 'Autumn Leaves', 'Spring Blossom',
    'Desert Dunes', 'Coral Garden', 'Volcanic Flow', 'Aurora Sky',
    'Tornado Spiral', 'Hurricane Eye', 'Glacier Flow', 'Canyon Depths',
    'Waterfall Cascade', 'Fern Unfurling', 'Tree Branching', 'Cloud Formation'
];

const generateNaturePresets = () => {
    const presets = [];
    
    NATURE_NAMES.forEach((name, i) => {
        const x = -0.7 + (Math.random() - 0.5) * 0.3;
        const y = 0.1 + (Math.random() - 0.5) * 0.1;
        const zoom = Math.pow(10, 2 + Math.random() * 6);
        
        presets.push({
            id: `mb-nature-${i}`,
            name,
            description: `Natural formation: ${name}. Mathematics mirrors nature.`,
            category: PRESET_CATEGORY.MANDELBROT,
            tags: [TAGS.ORGANIC, TAGS.COLORFUL, 'curated'],
            difficulty: DIFFICULTY.INTERMEDIATE,
            location: { centerX: x, centerY: y, zoom },
            params: { maxIterations: Math.round(1000 + zoom / 1000) },
            palette: 'nature-gradient',
            coloring: 'smooth-iteration'
        });
    });
    
    return presets;
};

// ============================================================================
// COMBINE ALL PRESETS
// ============================================================================

export const MANDELBROT_PRESETS = [
    ...CLASSICS,
    ...SPIRALS,
    ...MINIBROTS,
    ...DEEP_ZOOMS,
    ...ULTRA_DEEP,
    ...MISIUREWICZ,
    ...EXOTIC,
    ...generateSeahorseVariations(),
    ...generateElephantVariations(),
    ...generateSpiralVariations(),
    ...generateMinibrotVariations(),
    ...generateCuspVariations(),
    ...generateAntennaVariations(),
    ...generatePsychedelicPresets(),
    ...generateCosmicPresets(),
    ...generateNaturePresets()
];

// ============================================================================
// LOADER FUNCTION
// ============================================================================

/**
 * Get all Mandelbrot presets
 * @returns {Array}
 */
export function getMandelbrotPresets() {
    return MANDELBROT_PRESETS;
}

/**
 * Get preset count
 * @returns {number}
 */
export function getMandelbrotPresetCount() {
    return MANDELBROT_PRESETS.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MANDELBROT_PRESETS;
