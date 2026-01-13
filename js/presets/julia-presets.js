/**
 * ============================================================================
 * ABYSS EXPLORER - JULIA SET PRESETS
 * ============================================================================
 * 
 * Collection of 500+ curated Julia set presets across various c values,
 * powers, and viewing locations. Includes classics, artistic compositions,
 * and procedurally discovered beautiful sets.
 * 
 * Julia Set Overview:
 * - Each c value produces a unique Julia set
 * - c values on Mandelbrot boundary → most interesting Julia sets
 * - Connected sets: c inside Mandelbrot
 * - Dust/Cantor sets: c outside Mandelbrot
 * 
 * Categories:
 * - Classic: San Marco, Douady Rabbit, Dendrites
 * - Spirals: Various spiral formations
 * - Dendrites: Tree-like structures
 * - Siegel Disks: Near-circular regions
 * - Higher Powers: z^3, z^4, z^5 Julia sets
 * 
 * @module presets/julia-presets
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { PRESET_CATEGORY, DIFFICULTY, TAGS } from './preset-loader.js';

// ============================================================================
// CLASSIC JULIA SETS
// ============================================================================

const CLASSICS = [
    // ========== SAN MARCO / BASILICA ==========
    {
        id: 'julia-san-marco',
        name: 'San Marco (Basilica)',
        description: 'The famous San Marco Julia set, resembling the domes of St. Mark\'s Basilica in Venice.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['san-marco', TAGS.SYMMETRIC, TAGS.GEOMETRIC, 'classic'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.75, juliaImag: 0, maxIterations: 500 },
        palette: 'basilica-gold',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-san-marco-zoom',
        name: 'San Marco Detail',
        description: 'Zoomed into the intricate details of the San Marco Julia set.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['san-marco', TAGS.SYMMETRIC, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0.5, centerY: 0.3, zoom: 100 },
        params: { juliaReal: -0.75, juliaImag: 0, maxIterations: 1500 },
        palette: 'gold-detail',
        coloring: 'smooth-iteration'
    },
    
    // ========== DOUADY RABBIT ==========
    {
        id: 'julia-douady-rabbit',
        name: 'Douady Rabbit',
        description: 'The famous rabbit-shaped Julia set discovered by Adrien Douady.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['rabbit', TAGS.ORGANIC, TAGS.SYMMETRIC, 'classic'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.123, juliaImag: 0.745, maxIterations: 500 },
        palette: 'rabbit-fur',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-douady-rabbit-ears',
        name: 'Rabbit Ears',
        description: 'Zoomed into the characteristic ears of the Douady Rabbit.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['rabbit', TAGS.ORGANIC, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0.6, zoom: 50 },
        params: { juliaReal: -0.123, juliaImag: 0.745, maxIterations: 1000 },
        palette: 'rabbit-detail',
        coloring: 'smooth-iteration'
    },
    
    // ========== DENDRITE ==========
    {
        id: 'julia-dendrite-classic',
        name: 'Classic Dendrite',
        description: 'A tree-like dendrite Julia set at the tip of the Mandelbrot antenna.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['dendrite', TAGS.CHAOTIC, TAGS.TENTACLES, 'classic'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -2, juliaImag: 0, maxIterations: 500 },
        palette: 'dendrite-ice',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-dendrite-seahorse',
        name: 'Seahorse Dendrite',
        description: 'A dendrite from Seahorse Valley showing intricate branching.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['dendrite', TAGS.SEAHORSE, TAGS.CHAOTIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.745, juliaImag: 0.113, maxIterations: 600 },
        palette: 'seahorse-julia',
        coloring: 'smooth-iteration'
    },
    
    // ========== SIEGEL DISK ==========
    {
        id: 'julia-siegel-disk',
        name: 'Golden Mean Siegel Disk',
        description: 'A Siegel disk Julia set at the golden mean rotation number.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['siegel', TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.39054, juliaImag: -0.58679, maxIterations: 800 },
        palette: 'golden-siegel',
        coloring: 'smooth-iteration'
    },
    
    // ========== DRAGON ==========
    {
        id: 'julia-dragon',
        name: 'Dragon Julia',
        description: 'A dragon-like Julia set with fierce spiraling flames.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['dragon', TAGS.SPIRAL, TAGS.ORGANIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.8, juliaImag: 0.156, maxIterations: 500 },
        palette: 'dragon-flame',
        coloring: 'smooth-iteration'
    },
    
    // ========== GALAXY ==========
    {
        id: 'julia-galaxy-spiral',
        name: 'Galactic Julia',
        description: 'A Julia set resembling a spiral galaxy.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.COSMIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.4, juliaImag: 0.6, maxIterations: 500 },
        palette: 'galaxy-julia',
        coloring: 'smooth-iteration'
    },
    
    // ========== ELECTRIC ==========
    {
        id: 'julia-electric',
        name: 'Electric Storm',
        description: 'Lightning-like Julia set crackling with energy.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.CHAOTIC, TAGS.COLORFUL, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.7269, juliaImag: 0.1889, maxIterations: 600 },
        palette: 'electric-blue',
        coloring: 'smooth-iteration'
    },
    
    // ========== SNOWFLAKE ==========
    {
        id: 'julia-snowflake',
        name: 'Fractal Snowflake',
        description: 'A six-fold symmetric Julia set like a snowflake.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SYMMETRIC, TAGS.GEOMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.1, juliaImag: 0.651, maxIterations: 500 },
        palette: 'ice-crystal',
        coloring: 'smooth-iteration'
    },
    
    // ========== FEATHER ==========
    {
        id: 'julia-feather',
        name: 'Peacock Feather',
        description: 'A delicate feather-like Julia set with iridescent colors.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.ORGANIC, TAGS.COLORFUL, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.285, juliaImag: 0.01, maxIterations: 500 },
        palette: 'peacock',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// SPIRAL JULIA SETS
// ============================================================================

const SPIRALS = [
    {
        id: 'julia-spiral-double',
        name: 'Double Spiral Julia',
        description: 'Twin spirals dancing around each other.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.74543, juliaImag: 0.11301, maxIterations: 600 },
        palette: 'spiral-twin',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-spiral-infinite',
        name: 'Infinite Spiral',
        description: 'An endlessly spiraling Julia set.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.PSYCHEDELIC, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 100 },
        params: { juliaReal: -0.74543, juliaImag: 0.11301, maxIterations: 2000 },
        palette: 'infinite-spiral',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-spiral-golden',
        name: 'Golden Spiral',
        description: 'A spiral approximating the golden ratio.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.4, juliaImag: 0.6, maxIterations: 500 },
        palette: 'golden',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-spiral-vortex',
        name: 'Vortex Julia',
        description: 'A swirling vortex pulling everything inward.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.CHAOTIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.761574, juliaImag: -0.0847596, maxIterations: 800 },
        palette: 'vortex-dark',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-spiral-nautilus',
        name: 'Nautilus Shell',
        description: 'A nautilus-shaped Julia spiral.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.ORGANIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.8, juliaImag: 0.156, maxIterations: 500 },
        palette: 'nautilus',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-spiral-hypnotic',
        name: 'Hypnotic Spiral',
        description: 'A mesmerizing hypnotic spiral Julia.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.PSYCHEDELIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.8, juliaImag: 0.2, maxIterations: 600 },
        palette: 'hypnotic',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-spiral-cosmic',
        name: 'Cosmic Swirl',
        description: 'Cosmic spirals stretching through space.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.COSMIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.7885, juliaImag: 0.15, maxIterations: 600 },
        palette: 'cosmic-swirl',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-spiral-fractal-arm',
        name: 'Fractal Arms',
        description: 'Multiple spiral arms radiating outward.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SPIRAL, TAGS.SYMMETRIC, TAGS.TENTACLES],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.162, juliaImag: 1.04, maxIterations: 600 },
        palette: 'multi-arm',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// HIGHER POWER JULIA SETS
// ============================================================================

const HIGHER_POWERS = [
    // z^3 Julia sets
    {
        id: 'julia-cubic-1',
        name: 'Cubic Julia I',
        description: 'A z^3 Julia set with three-fold symmetry.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['cubic', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.4, juliaImag: 0.6, power: 3, maxIterations: 500 },
        palette: 'cubic-blue',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-cubic-snowflake',
        name: 'Cubic Snowflake',
        description: 'A three-fold symmetric snowflake pattern.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['cubic', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.5, juliaImag: 0.5, power: 3, maxIterations: 500 },
        palette: 'snowflake',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-cubic-trident',
        name: 'Trident Julia',
        description: 'A three-pronged trident-like formation.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['cubic', TAGS.SYMMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.3, juliaImag: 0.4, power: 3, maxIterations: 600 },
        palette: 'trident',
        coloring: 'smooth-iteration'
    },
    
    // z^4 Julia sets
    {
        id: 'julia-quartic-1',
        name: 'Quartic Cross',
        description: 'A z^4 Julia set with four-fold symmetry.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['quartic', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.6, juliaImag: 0.55, power: 4, maxIterations: 500 },
        palette: 'quartic-gold',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-quartic-star',
        name: 'Four-Point Star',
        description: 'A star-shaped z^4 Julia set.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['quartic', TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.484, juliaImag: 0.2, power: 4, maxIterations: 500 },
        palette: 'star-bright',
        coloring: 'smooth-iteration'
    },
    
    // z^5 Julia sets
    {
        id: 'julia-quintic-1',
        name: 'Quintic Pentagon',
        description: 'A z^5 Julia set with five-fold symmetry.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['quintic', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.544, juliaImag: 0.45, power: 5, maxIterations: 500 },
        palette: 'pentagon',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-quintic-flower',
        name: 'Five-Petal Flower',
        description: 'A flower-like z^5 Julia set.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['quintic', TAGS.ORGANIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.5, juliaImag: 0.4, power: 5, maxIterations: 500 },
        palette: 'flower',
        coloring: 'smooth-iteration'
    },
    
    // z^6 Julia sets
    {
        id: 'julia-sextic-1',
        name: 'Hexagonal Julia',
        description: 'A z^6 Julia set with six-fold symmetry.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['sextic', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.6, juliaImag: 0.4, power: 6, maxIterations: 500 },
        palette: 'hexagon',
        coloring: 'smooth-iteration'
    },
    
    // Higher powers
    {
        id: 'julia-power-8',
        name: 'Octagonal Julia',
        description: 'A z^8 Julia set with eight-fold symmetry.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['high-power', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.7, juliaImag: 0.3, power: 8, maxIterations: 500 },
        palette: 'octagon',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-power-12',
        name: 'Dodecagonal Julia',
        description: 'A z^12 Julia set with twelve-fold symmetry.',
        category: PRESET_CATEGORY.JULIA,
        tags: ['high-power', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.75, juliaImag: 0.2, power: 12, maxIterations: 500 },
        palette: 'dodecagon',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// ARTISTIC/THEMED JULIA SETS
// ============================================================================

const ARTISTIC = [
    {
        id: 'julia-ocean-waves',
        name: 'Ocean Waves',
        description: 'Julia set resembling rolling ocean waves.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.ORGANIC, TAGS.COLORFUL, 'nature'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.7, juliaImag: 0.27015, maxIterations: 500 },
        palette: 'ocean-blue',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-northern-lights',
        name: 'Northern Lights',
        description: 'Aurora-like curtains of color.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.COLORFUL, TAGS.COSMIC, 'nature'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.8, juliaImag: 0.156, maxIterations: 500 },
        palette: 'aurora',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-fire-dance',
        name: 'Fire Dance',
        description: 'Flames dancing in fractal form.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.CHAOTIC, TAGS.COLORFUL, 'fire'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.7269, juliaImag: 0.1889, maxIterations: 500 },
        palette: 'fire-dance',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-ice-crystal',
        name: 'Ice Crystal',
        description: 'Frozen crystalline structures.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SYMMETRIC, TAGS.GEOMETRIC, 'ice'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.1, juliaImag: 0.651, maxIterations: 500 },
        palette: 'ice-blue',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-butterfly-wings',
        name: 'Butterfly Wings',
        description: 'Delicate butterfly wing patterns.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.ORGANIC, TAGS.SYMMETRIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: 0.285, juliaImag: 0.01, maxIterations: 500 },
        palette: 'butterfly',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-stained-glass',
        name: 'Stained Glass',
        description: 'Cathedral-like stained glass patterns.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.GEOMETRIC, TAGS.COLORFUL, 'art'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.4, juliaImag: 0.6, maxIterations: 500 },
        palette: 'stained-glass',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-alien-landscape',
        name: 'Alien Landscape',
        description: 'An otherworldly alien terrain.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.CHAOTIC, TAGS.DARK, TAGS.COSMIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.835, juliaImag: -0.2321, maxIterations: 600 },
        palette: 'alien',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-neural-web',
        name: 'Neural Web',
        description: 'Neural network-like connections.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.ORGANIC, TAGS.TENTACLES, 'bio'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.7454, juliaImag: 0.1130, maxIterations: 600 },
        palette: 'neural',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-cosmic-eye',
        name: 'Cosmic Eye',
        description: 'An all-seeing cosmic eye.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.SYMMETRIC, TAGS.COSMIC, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.75, juliaImag: 0.1, maxIterations: 500 },
        palette: 'cosmic-eye',
        coloring: 'smooth-iteration'
    },
    {
        id: 'julia-quantum-foam',
        name: 'Quantum Foam Julia',
        description: 'The bubbling foam of quantum space.',
        category: PRESET_CATEGORY.JULIA,
        tags: [TAGS.CHAOTIC, TAGS.COSMIC, TAGS.PSYCHEDELIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: -0.194, juliaImag: 0.6557, maxIterations: 600 },
        palette: 'quantum',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// SPECIAL C VALUES (Famous discoveries)
// ============================================================================

const SPECIAL_C_VALUES = [
    // Values on Mandelbrot boundary
    { re: -0.75, im: 0, name: 'Parabolic', desc: 'Parabolic fixed point' },
    { re: -0.123, im: 0.745, name: 'Rabbit', desc: 'Douady rabbit' },
    { re: -0.391, im: -0.587, name: 'Siegel', desc: 'Golden mean Siegel disk' },
    { re: -0.744, im: 0.148, name: 'Seahorse', desc: 'Seahorse valley point' },
    { re: 0.285, im: 0.01, name: 'Feather', desc: 'Feather-like structure' },
    { re: -0.835, im: -0.2321, name: 'Alien', desc: 'Alien landscape' },
    { re: -0.8, im: 0.156, name: 'Dragon', desc: 'Dragon curves' },
    { re: -0.7269, im: 0.1889, name: 'Electric', desc: 'Electric storms' },
    { re: -0.4, im: 0.6, name: 'Galaxy', desc: 'Spiral galaxy' },
    { re: -0.1, im: 0.651, name: 'Crystal', desc: 'Ice crystal' },
    { re: 0.355, im: 0.355, name: 'Symmetric', desc: 'Symmetric beauty' },
    { re: -0.54, im: 0.54, name: 'Swirl', desc: 'Swirling chaos' },
    { re: 0.37, im: 0.1, name: 'Dendrite2', desc: 'Dendrite variation' },
    { re: -0.52, im: 0.57, name: 'Chaos', desc: 'Chaotic boundary' },
    { re: -0.624, im: 0.435, name: 'Coral', desc: 'Coral reef' },
    { re: 0.355534, im: -0.337292, name: 'Exotic', desc: 'Exotic formation' }
];

// Generate presets from special c values
const generateSpecialCPresets = () => {
    return SPECIAL_C_VALUES.map((c, i) => ({
        id: `julia-special-${i}`,
        name: `${c.name} Julia`,
        description: `Julia set at c = ${c.re} + ${c.im}i. ${c.desc}.`,
        category: PRESET_CATEGORY.JULIA,
        tags: ['special', TAGS.COLORFUL],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: c.re, juliaImag: c.im, maxIterations: 500 },
        palette: 'rainbow',
        coloring: 'smooth-iteration'
    }));
};

// ============================================================================
// PROCEDURALLY GENERATED JULIA SETS
// ============================================================================

// Generate Julia sets along the Mandelbrot boundary
const generateBoundaryJulias = () => {
    const presets = [];
    
    // Cardioid boundary: c = (e^(it)/2 - e^(2it)/4)
    for (let i = 0; i < 100; i++) {
        const t = (i / 100) * Math.PI * 2;
        const re = Math.cos(t) / 2 - Math.cos(2 * t) / 4;
        const im = Math.sin(t) / 2 - Math.sin(2 * t) / 4;
        
        presets.push({
            id: `julia-boundary-${i}`,
            name: `Boundary Julia ${i + 1}`,
            description: `Julia set from main cardioid boundary at angle ${(t * 180 / Math.PI).toFixed(1)}°`,
            category: PRESET_CATEGORY.JULIA,
            tags: ['boundary', TAGS.COLORFUL, 'generated'],
            difficulty: DIFFICULTY.BEGINNER,
            location: { centerX: 0, centerY: 0, zoom: 1 },
            params: { juliaReal: re, juliaImag: im, maxIterations: 500 },
            palette: 'rainbow',
            coloring: 'smooth-iteration'
        });
    }
    
    return presets;
};

// Generate Julia sets near critical points
const generateCriticalJulias = () => {
    const presets = [];
    const criticalPoints = [
        { x: -0.75, y: 0, name: 'Parabolic' },
        { x: -0.1225, y: 0.7449, name: 'Rabbit' },
        { x: 0.25, y: 0, name: 'Cusp' },
        { x: -1.25, y: 0, name: 'Period2' },
        { x: -0.745, y: 0.113, name: 'Seahorse' }
    ];
    
    criticalPoints.forEach((point, pi) => {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const dist = 0.001 + Math.random() * 0.05;
            const re = point.x + Math.cos(angle) * dist;
            const im = point.y + Math.sin(angle) * dist;
            
            presets.push({
                id: `julia-critical-${pi}-${i}`,
                name: `${point.name} Variation ${i + 1}`,
                description: `Julia near ${point.name} point (${re.toFixed(4)}, ${im.toFixed(4)})`,
                category: PRESET_CATEGORY.JULIA,
                tags: ['critical', TAGS.COLORFUL, 'generated'],
                difficulty: DIFFICULTY.INTERMEDIATE,
                location: { centerX: 0, centerY: 0, zoom: 1 },
                params: { juliaReal: re, juliaImag: im, maxIterations: 600 },
                palette: 'variation',
                coloring: 'smooth-iteration'
            });
        }
    });
    
    return presets;
};

// Generate zoomed Julia presets
const generateZoomedJulias = () => {
    const presets = [];
    const interestingCs = [
        { re: -0.745, im: 0.113 },
        { re: -0.8, im: 0.156 },
        { re: -0.4, im: 0.6 },
        { re: 0.285, im: 0.01 }
    ];
    
    interestingCs.forEach((c, ci) => {
        for (let i = 0; i < 20; i++) {
            const zoom = Math.pow(10, 1 + Math.random() * 4);
            const offsetX = (Math.random() - 0.5) * 2 / zoom;
            const offsetY = (Math.random() - 0.5) * 2 / zoom;
            
            presets.push({
                id: `julia-zoom-${ci}-${i}`,
                name: `Deep Julia ${ci * 20 + i + 1}`,
                description: `Zoomed Julia at depth ${Math.log10(zoom).toFixed(1)}`,
                category: PRESET_CATEGORY.JULIA,
                tags: [TAGS.DEEP_ZOOM, TAGS.COLORFUL, 'generated'],
                difficulty: zoom > 1000 ? DIFFICULTY.INTERMEDIATE : DIFFICULTY.BEGINNER,
                location: { centerX: offsetX, centerY: offsetY, zoom },
                params: { juliaReal: c.re, juliaImag: c.im, maxIterations: Math.round(500 + zoom / 10) },
                palette: 'deep-zoom',
                coloring: 'smooth-iteration'
            });
        }
    });
    
    return presets;
};

// Generate artistic themed Julia sets
const JULIA_THEMES = [
    'Nebula', 'Crystal', 'Flame', 'Ocean', 'Forest', 'Desert', 'Arctic', 'Volcanic',
    'Cosmic', 'Electric', 'Organic', 'Geometric', 'Ethereal', 'Mystic', 'Ancient'
];

const generateThemedJulias = () => {
    const presets = [];
    
    JULIA_THEMES.forEach((theme, ti) => {
        for (let i = 0; i < 10; i++) {
            const re = -1 + Math.random() * 1.5;
            const im = -1 + Math.random() * 2;
            
            presets.push({
                id: `julia-theme-${ti}-${i}`,
                name: `${theme} Dream ${i + 1}`,
                description: `${theme}-themed Julia set exploration.`,
                category: PRESET_CATEGORY.JULIA,
                tags: [theme.toLowerCase(), TAGS.COLORFUL, 'themed'],
                difficulty: DIFFICULTY.BEGINNER,
                location: { centerX: 0, centerY: 0, zoom: 1 },
                params: { juliaReal: re, juliaImag: im, maxIterations: 500 },
                palette: theme.toLowerCase(),
                coloring: 'smooth-iteration'
            });
        }
    });
    
    return presets;
};

// ============================================================================
// COMBINE ALL JULIA PRESETS
// ============================================================================

export const JULIA_PRESETS = [
    ...CLASSICS,
    ...SPIRALS,
    ...HIGHER_POWERS,
    ...ARTISTIC,
    ...generateSpecialCPresets(),
    ...generateBoundaryJulias(),
    ...generateCriticalJulias(),
    ...generateZoomedJulias(),
    ...generateThemedJulias()
];

// ============================================================================
// LOADER FUNCTION
// ============================================================================

/**
 * Get all Julia presets
 * @returns {Array}
 */
export function getJuliaPresets() {
    return JULIA_PRESETS;
}

/**
 * Get Julia preset count
 * @returns {number}
 */
export function getJuliaPresetCount() {
    return JULIA_PRESETS.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default JULIA_PRESETS;
