/**
 * ============================================================================
 * ABYSS EXPLORER - PROCEDURAL GENERATOR
 * ============================================================================
 * 
 * Procedural preset generator for creating random but beautiful fractal
 * locations on demand. Uses quality filters to avoid boring areas and
 * focuses on visually interesting regions.
 * 
 * Features:
 * - Random exploration near known interesting regions
 * - Minibrot hunting algorithm
 * - Julia seed generation
 * - Quality scoring to filter boring areas
 * - Deep zoom generation with precision strings
 * - Hybrid fractal variations
 * 
 * Strategies:
 * 1. Boundary exploration - sample along Mandelbrot boundary
 * 2. Minibrot hunting - find minibrots at various depths
 * 3. Spiral diving - follow spirals deeper
 * 4. Random Julia - generate interesting Julia c values
 * 5. Hybrid variation - combine parameters for new forms
 * 
 * @module presets/procedural-generator
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { PRESET_CATEGORY, DIFFICULTY, TAGS } from './preset-loader.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Known interesting regions in the Mandelbrot set */
const INTERESTING_REGIONS = [
    // Seahorse Valley
    { centerX: -0.745, centerY: 0.113, radius: 0.02, name: 'Seahorse Valley', weight: 3 },
    // Elephant Valley
    { centerX: 0.275, centerY: 0.006, radius: 0.02, name: 'Elephant Valley', weight: 2 },
    // Double Spiral
    { centerX: -0.16, centerY: 1.0405, radius: 0.015, name: 'Double Spiral', weight: 2 },
    // Main Spiral
    { centerX: -0.7436438, centerY: 0.1318259, radius: 0.01, name: 'Main Spiral', weight: 3 },
    // Antenna
    { centerX: -1.768778, centerY: 0.001538, radius: 0.01, name: 'Antenna', weight: 2 },
    // Scepter Valley
    { centerX: -0.1011, centerY: 0.9563, radius: 0.01, name: 'Scepter Valley', weight: 1 },
    // Period-3 Bulb
    { centerX: -0.125, centerY: 0.65, radius: 0.1, name: 'Period-3 Bulb', weight: 1 },
    // Cusp
    { centerX: 0.25, centerY: 0, radius: 0.02, name: 'Cusp', weight: 1 },
    // Feigenbaum Point
    { centerX: -1.401155, centerY: 0, radius: 0.01, name: 'Feigenbaum', weight: 1 }
];

/** Quality thresholds */
const QUALITY = {
    MIN_BOUNDARY_ITERATIONS: 10,
    MAX_SOLID_RATIO: 0.95,
    MIN_DETAIL_VARIANCE: 0.05
};

/** Name components for procedural names */
const NAME_PREFIXES = [
    'Cosmic', 'Ethereal', 'Quantum', 'Infinite', 'Abyssal', 'Celestial',
    'Hypnotic', 'Mystic', 'Fractal', 'Spiral', 'Void', 'Neon', 'Crystal',
    'Electric', 'Frozen', 'Burning', 'Golden', 'Silver', 'Twilight', 'Dawn'
];

const NAME_SUFFIXES = [
    'Vortex', 'Spiral', 'Galaxy', 'Nebula', 'Storm', 'Dream', 'Vision',
    'Portal', 'Gateway', 'Abyss', 'Depth', 'Cascade', 'Falls', 'Peak',
    'Valley', 'Canyon', 'Ocean', 'Forest', 'Garden', 'Temple'
];

const NAME_MODIFIERS = [
    'of Infinity', 'of Dreams', 'of Light', 'of Shadows', 'of Time',
    'Beyond', 'Within', 'Eternal', 'Ancient', 'Hidden', 'Lost', 'Secret'
];

// ============================================================================
// RANDOM UTILITIES
// ============================================================================

/**
 * Random number in range
 */
function random(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Random integer in range
 */
function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

/**
 * Weighted random selection
 */
function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
    let rand = Math.random() * totalWeight;
    
    for (const item of items) {
        rand -= item.weight || 1;
        if (rand <= 0) return item;
    }
    
    return items[items.length - 1];
}

/**
 * Generate a random evocative name
 */
function generateName() {
    const prefix = NAME_PREFIXES[randomInt(0, NAME_PREFIXES.length - 1)];
    const suffix = NAME_SUFFIXES[randomInt(0, NAME_SUFFIXES.length - 1)];
    
    if (Math.random() < 0.3) {
        const modifier = NAME_MODIFIERS[randomInt(0, NAME_MODIFIERS.length - 1)];
        return `${prefix} ${suffix} ${modifier}`;
    }
    
    return `${prefix} ${suffix}`;
}

/**
 * Generate unique ID
 */
function generateId(prefix = 'proc') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// MANDELBROT ITERATION TESTER
// ============================================================================

/**
 * Test if a point is in the Mandelbrot set
 * @returns {Object} { inSet, iterations, finalZ }
 */
function testMandelbrot(cr, ci, maxIter = 1000) {
    let zr = 0, zi = 0;
    let iter = 0;
    
    while (iter < maxIter && zr * zr + zi * zi < 4) {
        const zr2 = zr * zr - zi * zi + cr;
        zi = 2 * zr * zi + ci;
        zr = zr2;
        iter++;
    }
    
    return {
        inSet: iter === maxIter,
        iterations: iter,
        finalZ: { r: zr, i: zi }
    };
}

/**
 * Check if a region is interesting (near boundary)
 */
function isInterestingRegion(centerX, centerY, zoom, sampleSize = 16) {
    const width = 4 / zoom;
    const height = width;
    
    let inSetCount = 0;
    let iterationSum = 0;
    let iterationVariance = 0;
    const iterations = [];
    
    for (let i = 0; i < sampleSize; i++) {
        for (let j = 0; j < sampleSize; j++) {
            const x = centerX + (i / sampleSize - 0.5) * width;
            const y = centerY + (j / sampleSize - 0.5) * height;
            
            const result = testMandelbrot(x, y, 500);
            
            if (result.inSet) inSetCount++;
            iterations.push(result.iterations);
            iterationSum += result.iterations;
        }
    }
    
    const total = sampleSize * sampleSize;
    const inSetRatio = inSetCount / total;
    const meanIter = iterationSum / total;
    
    // Calculate variance
    for (const iter of iterations) {
        iterationVariance += (iter - meanIter) ** 2;
    }
    iterationVariance /= total;
    
    // Interesting if:
    // - Not too solid (in set)
    // - Not too empty (escaped quickly)
    // - Has variation in iteration counts
    const isInteresting = 
        inSetRatio < QUALITY.MAX_SOLID_RATIO &&
        inSetRatio > 0.01 &&
        meanIter > QUALITY.MIN_BOUNDARY_ITERATIONS &&
        iterationVariance > QUALITY.MIN_DETAIL_VARIANCE * meanIter;
    
    return {
        isInteresting,
        inSetRatio,
        meanIterations: meanIter,
        variance: iterationVariance,
        score: isInteresting ? (iterationVariance * (1 - Math.abs(inSetRatio - 0.3))) : 0
    };
}

// ============================================================================
// GENERATOR STRATEGIES
// ============================================================================

/**
 * Strategy: Explore near known interesting regions
 */
function generateNearInteresting(options = {}) {
    const region = weightedRandom(INTERESTING_REGIONS);
    
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * region.radius;
    
    const centerX = region.centerX + Math.cos(angle) * dist;
    const centerY = region.centerY + Math.sin(angle) * dist;
    const zoom = Math.pow(10, 2 + Math.random() * 8);
    
    const quality = isInterestingRegion(centerX, centerY, zoom);
    
    if (!quality.isInteresting && !options.forceAccept) {
        // Try again
        return generateNearInteresting(options);
    }
    
    return {
        id: generateId('near'),
        name: `${region.name} - ${generateName()}`,
        description: `Discovered near ${region.name} at depth ${Math.log10(zoom).toFixed(1)}`,
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [region.name.toLowerCase().replace(' ', '-'), TAGS.DEEP_ZOOM, 'procedural'],
        difficulty: zoom > 1e6 ? DIFFICULTY.ADVANCED : DIFFICULTY.INTERMEDIATE,
        location: { centerX, centerY, zoom },
        params: { maxIterations: Math.round(500 + zoom / 1000) },
        palette: 'auto',
        coloring: 'smooth-iteration',
        quality: quality.score
    };
}

/**
 * Strategy: Hunt for minibrots
 */
function generateMinibrotHunt(options = {}) {
    const depth = options.depth || Math.pow(10, 5 + Math.random() * 10);
    
    // Start from known minibrot locations
    const seeds = [
        { x: -1.7687783, y: 0.0015385 },
        { x: -0.16007, y: 1.04052 },
        { x: -1.9854, y: 0 },
        { x: -0.74543, y: 0.11301 }
    ];
    
    const seed = seeds[randomInt(0, seeds.length - 1)];
    
    // Add small offset based on depth
    const offset = 1 / depth * (10 + Math.random() * 90);
    const angle = Math.random() * Math.PI * 2;
    
    const centerX = seed.x + Math.cos(angle) * offset;
    const centerY = seed.y + Math.sin(angle) * offset;
    
    // Check for minibrot characteristics
    const quality = isInterestingRegion(centerX, centerY, depth);
    
    return {
        id: generateId('mini'),
        name: `Mini-${generateName()}`,
        description: `Minibrot exploration at depth ${Math.log10(depth).toFixed(1)}`,
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.MINIBROT, TAGS.DEEP_ZOOM, 'procedural'],
        difficulty: depth > 1e10 ? DIFFICULTY.EXPERT : DIFFICULTY.ADVANCED,
        location: { centerX, centerY, zoom: depth },
        params: { maxIterations: Math.round(2000 + depth / 10000) },
        palette: 'minibrot-auto',
        coloring: 'smooth-iteration',
        quality: quality.score
    };
}

/**
 * Strategy: Generate spiral dives
 */
function generateSpiralDive(options = {}) {
    const spiralCenters = [
        { x: -0.7436438870371587, y: 0.1318259042053119 },
        { x: -0.16007, y: 1.04052 },
        { x: -0.749, y: 0.1 }
    ];
    
    const center = spiralCenters[randomInt(0, spiralCenters.length - 1)];
    const depth = Math.pow(10, 4 + Math.random() * 10);
    
    // Spiral inward
    const spiralAngle = Math.random() * Math.PI * 20;
    const spiralRadius = 0.0001 / Math.log10(depth);
    
    const centerX = center.x + Math.cos(spiralAngle) * spiralRadius;
    const centerY = center.y + Math.sin(spiralAngle) * spiralRadius;
    
    return {
        id: generateId('spiral'),
        name: `Spiral ${generateName()}`,
        description: `Spiral dive to depth ${Math.log10(depth).toFixed(1)}`,
        category: PRESET_CATEGORY.MANDELBROT,
        tags: [TAGS.SPIRAL, TAGS.DEEP_ZOOM, 'procedural'],
        difficulty: depth > 1e8 ? DIFFICULTY.EXPERT : DIFFICULTY.ADVANCED,
        location: { centerX, centerY, zoom: depth },
        params: { maxIterations: Math.round(1500 + depth / 5000) },
        palette: 'spiral-auto',
        coloring: 'smooth-iteration'
    };
}

/**
 * Strategy: Generate interesting Julia c values
 */
function generateRandomJulia(options = {}) {
    const strategies = [
        // Near Mandelbrot boundary
        () => {
            const t = Math.random() * Math.PI * 2;
            const r = 0.25 * (1 - Math.cos(t)) + (Math.random() - 0.5) * 0.1;
            return {
                re: r * Math.cos(t) - 0.75,
                im: r * Math.sin(t)
            };
        },
        // Near known interesting points
        () => {
            const points = [
                { re: -0.75, im: 0 },
                { re: -0.123, im: 0.745 },
                { re: -0.4, im: 0.6 },
                { re: 0.285, im: 0.01 },
                { re: -0.8, im: 0.156 }
            ];
            const p = points[randomInt(0, points.length - 1)];
            return {
                re: p.re + (Math.random() - 0.5) * 0.1,
                im: p.im + (Math.random() - 0.5) * 0.1
            };
        },
        // Random in interesting range
        () => ({
            re: random(-1.5, 0.5),
            im: random(-1.2, 1.2)
        })
    ];
    
    const c = strategies[randomInt(0, strategies.length - 1)]();
    
    // Test if Julia is connected (c in Mandelbrot)
    const inMandelbrot = testMandelbrot(c.re, c.im, 500).inSet;
    
    return {
        id: generateId('julia'),
        name: `Julia ${generateName()}`,
        description: `Julia set at c = ${c.re.toFixed(4)} + ${c.im.toFixed(4)}i (${inMandelbrot ? 'connected' : 'dust'})`,
        category: PRESET_CATEGORY.JULIA,
        tags: ['julia', inMandelbrot ? TAGS.SYMMETRIC : TAGS.CHAOTIC, 'procedural'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: 0, centerY: 0, zoom: 1 },
        params: { juliaReal: c.re, juliaImag: c.im, maxIterations: 500 },
        palette: 'julia-auto',
        coloring: 'smooth-iteration'
    };
}

/**
 * Strategy: Generate random 3D preset
 */
function generateRandom3D(options = {}) {
    const types = ['mandelbulb', 'mandelbox', 'julia3d'];
    const type = types[randomInt(0, types.length - 1)];
    
    let preset;
    
    switch (type) {
        case 'mandelbulb':
            const power = randomInt(2, 20);
            const theta = Math.random() * Math.PI * 2;
            const phi = 0.2 + Math.random() * 0.6;
            const dist = 2 + Math.random() * 2;
            
            preset = {
                id: generateId('bulb3d'),
                name: `Mandelbulb ${generateName()}`,
                description: `Power ${power} Mandelbulb exploration`,
                category: PRESET_CATEGORY.MANDELBULB,
                tags: [`power-${power}`, TAGS.SYMMETRIC, 'procedural'],
                difficulty: DIFFICULTY.INTERMEDIATE,
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
                palette: '3d-auto'
            };
            break;
            
        case 'mandelbox':
            const scale = random(-3, 3);
            preset = {
                id: generateId('box3d'),
                name: `Mandelbox ${generateName()}`,
                description: `Scale ${scale.toFixed(2)} Mandelbox`,
                category: PRESET_CATEGORY.MANDELBOX,
                tags: ['mandelbox', TAGS.GEOMETRIC, 'procedural'],
                difficulty: DIFFICULTY.INTERMEDIATE,
                location: {
                    camera: { x: random(4, 8), y: random(2, 5), z: random(4, 8) },
                    target: { x: 0, y: 0, z: 0 }
                },
                params: { scale, foldingLimit: 1, minRadius: 0.5, maxIterations: 15 },
                lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
                palette: '3d-auto'
            };
            break;
            
        case 'julia3d':
            const juliaC = {
                x: random(-0.5, 0.5),
                y: random(-0.5, 0.5),
                z: random(-0.5, 0.5),
                w: random(-0.5, 0.5)
            };
            
            preset = {
                id: generateId('julia3d'),
                name: `3D Julia ${generateName()}`,
                description: `Quaternion Julia exploration`,
                category: PRESET_CATEGORY.JULIA_3D,
                tags: ['quaternion', TAGS.ORGANIC, 'procedural'],
                difficulty: DIFFICULTY.INTERMEDIATE,
                location: {
                    camera: { x: random(2, 3), y: random(1, 2), z: random(2, 3) },
                    target: { x: 0, y: 0, z: 0 }
                },
                params: { juliaC, sliceW: 0, maxIterations: 10 },
                lighting: { ambient: 0.2, diffuse: 0.8, specular: 0.5 },
                palette: '3d-auto'
            };
            break;
    }
    
    return preset;
}

// ============================================================================
// MAIN GENERATOR CLASS
// ============================================================================

export class ProceduralGenerator {
    /**
     * Create procedural generator
     * @param {Object} options
     */
    constructor(options = {}) {
        this.maxAttempts = options.maxAttempts || 10;
        this.qualityThreshold = options.qualityThreshold || 0.1;
    }
    
    /**
     * Generate a random preset
     * @param {string} strategy - Generation strategy
     * @param {Object} options - Strategy options
     * @returns {Object} Generated preset
     */
    generate(strategy = 'auto', options = {}) {
        switch (strategy) {
            case 'near-interesting':
                return generateNearInteresting(options);
            case 'minibrot':
                return generateMinibrotHunt(options);
            case 'spiral':
                return generateSpiralDive(options);
            case 'julia':
                return generateRandomJulia(options);
            case '3d':
                return generateRandom3D(options);
            case 'auto':
            default:
                // Randomly select strategy
                const strategies = [
                    { fn: generateNearInteresting, weight: 3 },
                    { fn: generateMinibrotHunt, weight: 2 },
                    { fn: generateSpiralDive, weight: 2 },
                    { fn: generateRandomJulia, weight: 2 },
                    { fn: generateRandom3D, weight: 1 }
                ];
                const selected = weightedRandom(strategies);
                return selected.fn(options);
        }
    }
    
    /**
     * Generate multiple presets
     * @param {number} count - Number of presets
     * @param {Object} options - Options
     * @returns {Array} Array of presets
     */
    generateBatch(count = 10, options = {}) {
        const presets = [];
        const strategy = options.strategy || 'auto';
        
        for (let i = 0; i < count; i++) {
            const preset = this.generate(strategy, options);
            presets.push(preset);
        }
        
        // Sort by quality if available
        presets.sort((a, b) => (b.quality || 0) - (a.quality || 0));
        
        return presets;
    }
    
    /**
     * Generate a "tour" - a sequence of connected presets
     * @param {number} stops - Number of stops
     * @param {Object} start - Starting location
     * @returns {Array} Tour presets
     */
    generateTour(stops = 5, start = null) {
        const tour = [];
        
        let current = start || {
            centerX: -0.5,
            centerY: 0,
            zoom: 1
        };
        
        for (let i = 0; i < stops; i++) {
            // Each stop zooms deeper and moves slightly
            const zoomFactor = 10 + Math.random() * 90;
            const moveAngle = Math.random() * Math.PI * 2;
            const moveDist = 1 / (current.zoom * zoomFactor) * 0.1;
            
            current = {
                centerX: current.centerX + Math.cos(moveAngle) * moveDist,
                centerY: current.centerY + Math.sin(moveAngle) * moveDist,
                zoom: current.zoom * zoomFactor
            };
            
            tour.push({
                id: generateId('tour'),
                name: `Tour Stop ${i + 1}: ${generateName()}`,
                description: `Journey to depth ${Math.log10(current.zoom).toFixed(1)}`,
                category: PRESET_CATEGORY.MANDELBROT,
                tags: ['tour', TAGS.DEEP_ZOOM, 'procedural'],
                difficulty: current.zoom > 1e10 ? DIFFICULTY.EXPERT : 
                           current.zoom > 1e5 ? DIFFICULTY.ADVANCED : DIFFICULTY.INTERMEDIATE,
                location: { ...current },
                params: { maxIterations: Math.round(500 + current.zoom / 1000) },
                palette: 'tour-gradient',
                coloring: 'smooth-iteration',
                tourIndex: i
            });
        }
        
        return tour;
    }
    
    /**
     * Generate variations of an existing preset
     * @param {Object} basePreset - Base preset to vary
     * @param {number} count - Number of variations
     * @returns {Array} Variation presets
     */
    generateVariations(basePreset, count = 5) {
        const variations = [];
        const { location } = basePreset;
        
        for (let i = 0; i < count; i++) {
            const zoomFactor = 0.5 + Math.random() * 2;
            const offset = 1 / (location.zoom * zoomFactor) * 0.1;
            const angle = Math.random() * Math.PI * 2;
            
            variations.push({
                ...basePreset,
                id: generateId('var'),
                name: `${basePreset.name} Variation ${i + 1}`,
                description: `Variation of ${basePreset.name}`,
                tags: [...(basePreset.tags || []), 'variation'],
                location: {
                    centerX: location.centerX + Math.cos(angle) * offset,
                    centerY: location.centerY + Math.sin(angle) * offset,
                    zoom: location.zoom * zoomFactor
                }
            });
        }
        
        return variations;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const proceduralGenerator = new ProceduralGenerator();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick generate a random preset
 */
export function generateRandom() {
    return proceduralGenerator.generate();
}

/**
 * Generate a batch of random presets
 */
export function generateRandomBatch(count = 10) {
    return proceduralGenerator.generateBatch(count);
}

/**
 * Generate a zoom tour
 */
export function generateZoomTour(stops = 5) {
    return proceduralGenerator.generateTour(stops);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { 
    INTERESTING_REGIONS, 
    generateName, 
    generateId,
    testMandelbrot,
    isInterestingRegion
};
export default ProceduralGenerator;
