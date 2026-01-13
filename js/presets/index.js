/**
 * ============================================================================
 * ABYSS EXPLORER - PRESETS MODULE INDEX
 * ============================================================================
 * 
 * Central module for all preset collections. Provides unified access to
 * thousands of curated fractal locations across 2D and 3D fractals.
 * 
 * Collections:
 * - Mandelbrot: 1000+ deep zoom locations
 * - Julia: 500+ Julia set presets
 * - Burning Ship: 300+ nautical themed locations
 * - Newton: 200+ polynomial variations
 * - 3D: 300+ Mandelbulb, Mandelbox, Julia 3D presets
 * - Procedural: Infinite generated locations
 * 
 * Total: 2500+ curated presets + procedural generation
 * 
 * @module presets
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { 
    PresetLoader, 
    presetLoader,
    PRESET_CATEGORY,
    DIFFICULTY,
    TAGS
} from './preset-loader.js';

import { 
    MANDELBROT_PRESETS, 
    getMandelbrotPresets,
    getMandelbrotPresetCount 
} from './mandelbrot-presets.js';

import { 
    JULIA_PRESETS, 
    getJuliaPresets,
    getJuliaPresetCount 
} from './julia-presets.js';

import { 
    BURNING_SHIP_PRESETS, 
    getBurningShipPresets,
    getBurningShipPresetCount 
} from './burning-ship-presets.js';

import { 
    NEWTON_PRESETS, 
    getNewtonPresets,
    getNewtonPresetCount 
} from './newton-presets.js';

import { 
    PRESETS_3D, 
    get3DPresets,
    get3DPresetCount 
} from './3d-presets.js';

import {
    ProceduralGenerator,
    proceduralGenerator,
    generateRandom,
    generateRandomBatch,
    generateZoomTour,
    INTERESTING_REGIONS,
    generateName,
    generateId,
    testMandelbrot,
    isInterestingRegion
} from './procedural-generator.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Presets',
    version: '1.0.0',
    description: 'Massive curated collection of fractal presets',
    collections: {
        mandelbrot: {
            name: 'Mandelbrot Deep Zooms',
            count: getMandelbrotPresetCount(),
            description: '1000+ locations from classics to 10^1000 depths'
        },
        julia: {
            name: 'Julia Sets',
            count: getJuliaPresetCount(),
            description: '500+ Julia sets across various c values and powers'
        },
        burningShip: {
            name: 'Burning Ship',
            count: getBurningShipPresetCount(),
            description: '300+ nautical and alien landscape locations'
        },
        newton: {
            name: 'Newton Fractals',
            count: getNewtonPresetCount(),
            description: '200+ polynomial root-finding visualizations'
        },
        threeD: {
            name: '3D Fractals',
            count: get3DPresetCount(),
            description: '300+ Mandelbulb, Mandelbox, and quaternion presets'
        },
        procedural: {
            name: 'Procedural Generator',
            count: 'Infinite',
            description: 'On-demand beautiful location generation'
        }
    },
    features: [
        'Curated classic locations',
        'Deep zoom presets to 10^1000+',
        'Procedural generation with quality filters',
        'Search and filtering',
        'Favorites management',
        'Recently viewed tracking',
        'Tour generation',
        'Variation generation'
    ]
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize all preset collections
 * @returns {Promise<Object>} Initialization result
 */
export async function initializePresets() {
    // Register all collections
    presetLoader.registerCollection('mandelbrot', MANDELBROT_PRESETS);
    presetLoader.registerCollection('julia', JULIA_PRESETS);
    presetLoader.registerCollection('burning-ship', BURNING_SHIP_PRESETS);
    presetLoader.registerCollection('newton', NEWTON_PRESETS);
    presetLoader.registerCollection('3d', PRESETS_3D);
    
    // Load all collections
    const totalCount = await presetLoader.loadAll();
    
    return {
        success: true,
        totalPresets: totalCount,
        collections: presetLoader.loadedCollections.size,
        stats: presetLoader.getStats()
    };
}

/**
 * Quick initialization (synchronous)
 */
export function initializePresetsSync() {
    presetLoader.registerCollection('mandelbrot', MANDELBROT_PRESETS);
    presetLoader.registerCollection('julia', JULIA_PRESETS);
    presetLoader.registerCollection('burning-ship', BURNING_SHIP_PRESETS);
    presetLoader.registerCollection('newton', NEWTON_PRESETS);
    presetLoader.registerCollection('3d', PRESETS_3D);
    
    // Load synchronously since data is already available
    presetLoader.loadCollection('mandelbrot');
    presetLoader.loadCollection('julia');
    presetLoader.loadCollection('burning-ship');
    presetLoader.loadCollection('newton');
    presetLoader.loadCollection('3d');
    
    return presetLoader.count;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Get a random preset from any collection
 * @param {Object} filters - Optional filters
 * @returns {Object} Random preset
 */
export function getRandomPreset(filters = {}) {
    // 20% chance of procedural generation
    if (Math.random() < 0.2 && !filters.category) {
        return generateRandom();
    }
    return presetLoader.getRandom(filters);
}

/**
 * Search all presets
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} Matching presets
 */
export function searchPresets(query, options = {}) {
    return presetLoader.search(query, options);
}

/**
 * Get preset by ID
 * @param {string} id - Preset ID
 * @returns {Object|null} Preset or null
 */
export function getPresetById(id) {
    return presetLoader.getById(id);
}

/**
 * Get presets by category
 * @param {string} category - Category name
 * @returns {Array} Presets in category
 */
export function getPresetsByCategory(category) {
    return presetLoader.getByCategory(category);
}

/**
 * Get presets by difficulty
 * @param {string} difficulty - Difficulty level
 * @returns {Array} Presets at difficulty
 */
export function getPresetsByDifficulty(difficulty) {
    return presetLoader.getByDifficulty(difficulty);
}

/**
 * Get presets by tag
 * @param {string} tag - Tag name
 * @returns {Array} Tagged presets
 */
export function getPresetsByTag(tag) {
    return presetLoader.getByTag(tag);
}

/**
 * Get all presets
 * @returns {Array} All presets
 */
export function getAllPresets() {
    return presetLoader.getAll();
}

/**
 * Get total preset count
 * @returns {number} Total count
 */
export function getTotalPresetCount() {
    return presetLoader.count;
}

/**
 * Get favorites
 * @returns {Array} Favorite presets
 */
export function getFavorites() {
    return presetLoader.getFavorites();
}

/**
 * Toggle favorite
 * @param {string} id - Preset ID
 * @returns {boolean} New favorite status
 */
export function toggleFavorite(id) {
    return presetLoader.toggleFavorite(id);
}

/**
 * Get recently viewed
 * @param {number} limit - Max results
 * @returns {Array} Recent presets
 */
export function getRecentlyViewed(limit = 20) {
    return presetLoader.getRecentlyViewed(limit);
}

/**
 * Mark preset as viewed
 * @param {string} id - Preset ID
 */
export function markViewed(id) {
    presetLoader.markViewed(id);
}

/**
 * Get statistics
 * @returns {Object} Preset statistics
 */
export function getPresetStats() {
    return presetLoader.getStats();
}

// ============================================================================
// FEATURED PRESETS
// ============================================================================

/**
 * Get featured presets (hand-picked highlights)
 * @param {number} count - Number of presets
 * @returns {Array} Featured presets
 */
export function getFeaturedPresets(count = 10) {
    const featuredIds = [
        'mb-seahorse-valley-entrance',
        'mb-double-spiral-classic',
        'mb-minibrot-classic',
        'julia-san-marco',
        'julia-douady-rabbit',
        'bs-main-anchor',
        'newton-z3-1-overview',
        'bulb-power8-overview',
        'box-classic',
        'ifs-menger-sponge'
    ];
    
    const featured = featuredIds
        .map(id => presetLoader.getById(id))
        .filter(Boolean)
        .slice(0, count);
    
    // Fill with random if needed
    while (featured.length < count) {
        featured.push(getRandomPreset());
    }
    
    return featured;
}

/**
 * Get presets of the day (deterministic based on date)
 * @param {number} count - Number of presets
 * @returns {Array} Daily presets
 */
export function getPresetsOfTheDay(count = 5) {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + 
                 (today.getMonth() + 1) * 100 + 
                 today.getDate();
    
    // Simple seeded random
    const seededRandom = (s) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };
    
    const allPresets = presetLoader.getAll();
    const daily = [];
    
    for (let i = 0; i < count; i++) {
        const index = Math.floor(seededRandom(seed + i) * allPresets.length);
        if (allPresets[index] && !daily.includes(allPresets[index])) {
            daily.push(allPresets[index]);
        }
    }
    
    return daily;
}

// ============================================================================
// GALLERY HELPERS
// ============================================================================

/**
 * Get presets organized for gallery display
 * @returns {Object} Organized presets
 */
export function getGalleryData() {
    return {
        featured: getFeaturedPresets(6),
        dailyPicks: getPresetsOfTheDay(5),
        categories: {
            mandelbrot: {
                name: 'Mandelbrot Set',
                icon: '🌀',
                presets: getPresetsByCategory(PRESET_CATEGORY.MANDELBROT).slice(0, 20)
            },
            julia: {
                name: 'Julia Sets',
                icon: '🎭',
                presets: getPresetsByCategory(PRESET_CATEGORY.JULIA).slice(0, 20)
            },
            burningShip: {
                name: 'Burning Ship',
                icon: '🚢',
                presets: getPresetsByCategory(PRESET_CATEGORY.BURNING_SHIP).slice(0, 20)
            },
            newton: {
                name: 'Newton Fractals',
                icon: '🔮',
                presets: getPresetsByCategory(PRESET_CATEGORY.NEWTON).slice(0, 20)
            },
            threeD: {
                name: '3D Fractals',
                icon: '🎲',
                presets: [
                    ...getPresetsByCategory(PRESET_CATEGORY.MANDELBULB).slice(0, 10),
                    ...getPresetsByCategory(PRESET_CATEGORY.MANDELBOX).slice(0, 10)
                ]
            }
        },
        byDifficulty: {
            beginner: getPresetsByDifficulty(DIFFICULTY.BEGINNER).slice(0, 15),
            intermediate: getPresetsByDifficulty(DIFFICULTY.INTERMEDIATE).slice(0, 15),
            advanced: getPresetsByDifficulty(DIFFICULTY.ADVANCED).slice(0, 15),
            expert: getPresetsByDifficulty(DIFFICULTY.EXPERT).slice(0, 10),
            legendary: getPresetsByDifficulty(DIFFICULTY.LEGENDARY).slice(0, 5)
        },
        byTag: {
            spirals: getPresetsByTag(TAGS.SPIRAL).slice(0, 15),
            minibrots: getPresetsByTag(TAGS.MINIBROT).slice(0, 15),
            deepZooms: getPresetsByTag(TAGS.DEEP_ZOOM).slice(0, 15),
            psychedelic: getPresetsByTag(TAGS.PSYCHEDELIC).slice(0, 15),
            cosmic: getPresetsByTag(TAGS.COSMIC).slice(0, 15)
        },
        recentlyViewed: getRecentlyViewed(10),
        favorites: getFavorites()
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Classes
export { PresetLoader, ProceduralGenerator };

// Singleton instances
export { presetLoader, proceduralGenerator };

// Constants
export { PRESET_CATEGORY, DIFFICULTY, TAGS, INTERESTING_REGIONS };

// Preset arrays (for direct access)
export { 
    MANDELBROT_PRESETS, 
    JULIA_PRESETS, 
    BURNING_SHIP_PRESETS, 
    NEWTON_PRESETS, 
    PRESETS_3D 
};

// Getters
export {
    getMandelbrotPresets,
    getMandelbrotPresetCount,
    getJuliaPresets,
    getJuliaPresetCount,
    getBurningShipPresets,
    getBurningShipPresetCount,
    getNewtonPresets,
    getNewtonPresetCount,
    get3DPresets,
    get3DPresetCount
};

// Procedural generation
export {
    generateRandom,
    generateRandomBatch,
    generateZoomTour,
    generateName,
    generateId,
    testMandelbrot,
    isInterestingRegion
};

// Default export
export default {
    // Module info
    MODULE_INFO,
    
    // Initialization
    initializePresets,
    initializePresetsSync,
    
    // Core functionality
    presetLoader,
    proceduralGenerator,
    
    // Quick access
    getRandomPreset,
    searchPresets,
    getPresetById,
    getPresetsByCategory,
    getPresetsByDifficulty,
    getPresetsByTag,
    getAllPresets,
    getTotalPresetCount,
    
    // User data
    getFavorites,
    toggleFavorite,
    getRecentlyViewed,
    markViewed,
    
    // Gallery
    getFeaturedPresets,
    getPresetsOfTheDay,
    getGalleryData,
    getPresetStats,
    
    // Procedural
    generateRandom,
    generateRandomBatch,
    generateZoomTour,
    
    // Constants
    PRESET_CATEGORY,
    DIFFICULTY,
    TAGS
};
