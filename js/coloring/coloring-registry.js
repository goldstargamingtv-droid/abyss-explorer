/**
 * ============================================================================
 * ABYSS EXPLORER - COLORING REGISTRY
 * ============================================================================
 * 
 * Central registry mapping all coloring algorithm names to their functions
 * and metadata. This provides a unified interface for the coloring engine
 * to discover and use available algorithms.
 * 
 * Registry Structure:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  Algorithm ID → {                                                      │
 * │      fn: Function,          // The coloring function                  │
 * │      name: String,          // Display name                           │
 * │      category: String,      // Category for grouping                  │
 * │      description: String,   // Human-readable description             │
 * │      params: Object,        // Parameter definitions                  │
 * │      compatibility: Array,  // Compatible fractal types               │
 * │      requiresOrbitHistory: Boolean,  // Needs full orbit?             │
 * │      requiresPrecompute: Boolean,    // Needs preprocessing?          │
 * │  }                                                                     │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module coloring/coloring-registry
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// Import all algorithm collections
import { SMOOTH_ALGORITHMS } from './smooth-iteration.js';
import { ORBIT_TRAP_ALGORITHMS } from './orbit-traps.js';
import { DISTANCE_ALGORITHMS } from './distance-estimation.js';
import { HISTOGRAM_ALGORITHMS } from './histogram.js';
import { TRIANGLE_INEQUALITY_ALGORITHMS } from './triangle-inequality.js';
import { STRIPE_ALGORITHMS } from './stripe-average.js';
import { CURVATURE_ALGORITHMS } from './curvature.js';
import { ANGLE_ALGORITHMS } from './angle-decomposition.js';

// ============================================================================
// CATEGORIES
// ============================================================================

export const ALGORITHM_CATEGORIES = {
    SMOOTH: {
        id: 'smooth',
        name: 'Smooth Iteration',
        description: 'Classic smooth iteration and continuous potential coloring'
    },
    ORBIT_TRAP: {
        id: 'orbit-trap',
        name: 'Orbit Traps',
        description: 'Distance to geometric shapes during iteration'
    },
    DISTANCE: {
        id: 'distance',
        name: 'Distance Estimation',
        description: 'Boundary glow and distance-based coloring'
    },
    HISTOGRAM: {
        id: 'histogram',
        name: 'Histogram',
        description: 'Histogram equalization for optimal contrast'
    },
    TRIANGLE_INEQUALITY: {
        id: 'triangle-inequality',
        name: 'Triangle Inequality',
        description: 'TIA-based smoothing without logarithms'
    },
    STRIPE: {
        id: 'stripe',
        name: 'Stripe Average',
        description: 'Periodic stripe patterns from orbit angles'
    },
    CURVATURE: {
        id: 'curvature',
        name: 'Curvature',
        description: 'Orbit curvature and surface geometry'
    },
    ANGLE: {
        id: 'angle',
        name: 'Angle/Decomposition',
        description: 'Angular sectors and decomposition patterns'
    },
    HYBRID: {
        id: 'hybrid',
        name: 'Hybrid',
        description: 'Combined algorithms and custom blends'
    }
};

// ============================================================================
// COLORING REGISTRY CLASS
// ============================================================================

export class ColoringRegistry {
    constructor() {
        // Registry storage
        this.algorithms = new Map();
        this.categories = new Map();
        
        // Initialize categories
        for (const [key, category] of Object.entries(ALGORITHM_CATEGORIES)) {
            this.categories.set(category.id, {
                ...category,
                algorithms: []
            });
        }
        
        // Register all built-in algorithms
        this._registerBuiltins();
    }
    
    /**
     * Register all built-in algorithms
     * @private
     */
    _registerBuiltins() {
        // Smooth iteration algorithms
        this._registerCategory(SMOOTH_ALGORITHMS, 'smooth');
        
        // Orbit trap algorithms
        this._registerCategory(ORBIT_TRAP_ALGORITHMS, 'orbit-trap', {
            requiresOrbitHistory: true
        });
        
        // Distance estimation algorithms
        this._registerCategory(DISTANCE_ALGORITHMS, 'distance');
        
        // Histogram algorithms
        this._registerCategory(HISTOGRAM_ALGORITHMS, 'histogram', {
            requiresPrecompute: true
        });
        
        // Triangle inequality algorithms
        this._registerCategory(TRIANGLE_INEQUALITY_ALGORITHMS, 'triangle-inequality', {
            requiresOrbitHistory: true
        });
        
        // Stripe average algorithms
        this._registerCategory(STRIPE_ALGORITHMS, 'stripe', {
            requiresOrbitHistory: true
        });
        
        // Curvature algorithms
        this._registerCategory(CURVATURE_ALGORITHMS, 'curvature', {
            requiresOrbitHistory: true
        });
        
        // Angle decomposition algorithms
        this._registerCategory(ANGLE_ALGORITHMS, 'angle');
        
        console.log(`[ColoringRegistry] Registered ${this.algorithms.size} algorithms`);
    }
    
    /**
     * Register a category of algorithms
     * @private
     */
    _registerCategory(algorithms, categoryId, defaults = {}) {
        for (const [id, algo] of Object.entries(algorithms)) {
            this.register(id, {
                ...algo,
                category: categoryId,
                ...defaults
            });
        }
    }
    
    /**
     * Register a single algorithm
     * @param {string} id - Unique algorithm ID
     * @param {Object} definition - Algorithm definition
     */
    register(id, definition) {
        const entry = {
            id,
            fn: definition.fn,
            name: definition.name || id,
            category: definition.category || 'hybrid',
            description: definition.description || '',
            params: definition.params || {},
            compatibility: definition.compatibility || ['all'],
            requiresOrbitHistory: definition.requiresOrbitHistory || false,
            requiresPrecompute: definition.requiresPrecompute || false,
            tags: definition.tags || []
        };
        
        this.algorithms.set(id, entry);
        
        // Add to category
        const category = this.categories.get(entry.category);
        if (category) {
            category.algorithms.push(id);
        }
    }
    
    /**
     * Unregister an algorithm
     * @param {string} id - Algorithm ID to remove
     */
    unregister(id) {
        const algo = this.algorithms.get(id);
        if (algo) {
            // Remove from category
            const category = this.categories.get(algo.category);
            if (category) {
                const index = category.algorithms.indexOf(id);
                if (index !== -1) {
                    category.algorithms.splice(index, 1);
                }
            }
            
            this.algorithms.delete(id);
        }
    }
    
    /**
     * Get an algorithm by ID
     * @param {string} id - Algorithm ID
     * @returns {Object|null} Algorithm definition or null
     */
    get(id) {
        return this.algorithms.get(id) || null;
    }
    
    /**
     * Get the algorithm function by ID
     * @param {string} id - Algorithm ID
     * @returns {Function|null} Algorithm function or null
     */
    getAlgorithm(id) {
        const algo = this.algorithms.get(id);
        return algo ? algo.fn : null;
    }
    
    /**
     * Check if an algorithm exists
     * @param {string} id - Algorithm ID
     * @returns {boolean}
     */
    has(id) {
        return this.algorithms.has(id);
    }
    
    /**
     * Get all algorithms
     * @returns {Array} Array of algorithm entries
     */
    getAll() {
        return Array.from(this.algorithms.values());
    }
    
    /**
     * Get all algorithm IDs
     * @returns {Array<string>}
     */
    getAllIds() {
        return Array.from(this.algorithms.keys());
    }
    
    /**
     * Get algorithms by category
     * @param {string} categoryId - Category ID
     * @returns {Array} Array of algorithm entries
     */
    getByCategory(categoryId) {
        return this.getAll().filter(algo => algo.category === categoryId);
    }
    
    /**
     * Get algorithm IDs by category
     * @param {string} categoryId - Category ID
     * @returns {Array<string>}
     */
    getIdsByCategory(categoryId) {
        const category = this.categories.get(categoryId);
        return category ? [...category.algorithms] : [];
    }
    
    /**
     * Get all categories
     * @returns {Array} Array of category entries
     */
    getCategories() {
        return Array.from(this.categories.values());
    }
    
    /**
     * Get algorithms compatible with a fractal type
     * @param {string} fractalType - Fractal type (e.g., 'mandelbrot', 'julia')
     * @returns {Array} Compatible algorithms
     */
    getCompatible(fractalType) {
        return this.getAll().filter(algo => 
            algo.compatibility.includes('all') || 
            algo.compatibility.includes(fractalType)
        );
    }
    
    /**
     * Get algorithms that require orbit history
     * @returns {Array}
     */
    getOrbitHistoryRequired() {
        return this.getAll().filter(algo => algo.requiresOrbitHistory);
    }
    
    /**
     * Get algorithms that require precomputation
     * @returns {Array}
     */
    getPrecomputeRequired() {
        return this.getAll().filter(algo => algo.requiresPrecompute);
    }
    
    /**
     * Search algorithms by name or description
     * @param {string} query - Search query
     * @returns {Array} Matching algorithms
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAll().filter(algo =>
            algo.name.toLowerCase().includes(lowerQuery) ||
            algo.description.toLowerCase().includes(lowerQuery) ||
            algo.id.toLowerCase().includes(lowerQuery) ||
            algo.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }
    
    /**
     * Get parameter definitions for an algorithm
     * @param {string} id - Algorithm ID
     * @returns {Object|null} Parameter definitions
     */
    getParams(id) {
        const algo = this.algorithms.get(id);
        return algo ? algo.params : null;
    }
    
    /**
     * Create default parameters for an algorithm
     * @param {string} id - Algorithm ID
     * @returns {Object} Default parameter values
     */
    createDefaultParams(id) {
        const params = this.getParams(id);
        if (!params) return {};
        
        const defaults = {};
        for (const [key, def] of Object.entries(params)) {
            defaults[key] = def.default;
        }
        return defaults;
    }
    
    /**
     * Validate parameters for an algorithm
     * @param {string} id - Algorithm ID
     * @param {Object} params - Parameters to validate
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    validateParams(id, params) {
        const definitions = this.getParams(id);
        if (!definitions) {
            return { valid: true, errors: [] };
        }
        
        const errors = [];
        
        for (const [key, def] of Object.entries(definitions)) {
            const value = params[key];
            
            if (value === undefined) continue;
            
            if (def.type === 'number') {
                if (typeof value !== 'number' || isNaN(value)) {
                    errors.push(`${key}: must be a number`);
                } else {
                    if (def.min !== undefined && value < def.min) {
                        errors.push(`${key}: must be >= ${def.min}`);
                    }
                    if (def.max !== undefined && value > def.max) {
                        errors.push(`${key}: must be <= ${def.max}`);
                    }
                }
            } else if (def.type === 'boolean') {
                if (typeof value !== 'boolean') {
                    errors.push(`${key}: must be a boolean`);
                }
            } else if (def.type === 'select') {
                if (!def.options.includes(value)) {
                    errors.push(`${key}: must be one of ${def.options.join(', ')}`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Export registry as JSON
     * @returns {Object} Serializable registry data
     */
    toJSON() {
        const algorithms = {};
        for (const [id, algo] of this.algorithms) {
            algorithms[id] = {
                id: algo.id,
                name: algo.name,
                category: algo.category,
                description: algo.description,
                params: algo.params,
                compatibility: algo.compatibility,
                requiresOrbitHistory: algo.requiresOrbitHistory,
                requiresPrecompute: algo.requiresPrecompute
            };
        }
        
        return {
            algorithms,
            categories: Array.from(this.categories.values())
        };
    }
    
    /**
     * Get statistics about the registry
     * @returns {Object}
     */
    getStats() {
        const stats = {
            totalAlgorithms: this.algorithms.size,
            byCategory: {},
            requiresOrbitHistory: 0,
            requiresPrecompute: 0
        };
        
        for (const [catId, category] of this.categories) {
            stats.byCategory[catId] = category.algorithms.length;
        }
        
        for (const algo of this.algorithms.values()) {
            if (algo.requiresOrbitHistory) stats.requiresOrbitHistory++;
            if (algo.requiresPrecompute) stats.requiresPrecompute++;
        }
        
        return stats;
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/** Global registry instance */
let globalRegistry = null;

/**
 * Get the global coloring registry instance
 * @returns {ColoringRegistry}
 */
export function getColoringRegistry() {
    if (!globalRegistry) {
        globalRegistry = new ColoringRegistry();
    }
    return globalRegistry;
}

/**
 * Create a new registry instance
 * @returns {ColoringRegistry}
 */
export function createColoringRegistry() {
    return new ColoringRegistry();
}

// ============================================================================
// ALGORITHM LIST
// ============================================================================

/**
 * Get a flat list of all algorithm IDs for quick reference
 * @returns {string[]}
 */
export function getAllAlgorithmIds() {
    return getColoringRegistry().getAllIds();
}

/**
 * Get algorithm count
 * @returns {number}
 */
export function getAlgorithmCount() {
    return getColoringRegistry().algorithms.size;
}

// ============================================================================
// PRESETS
// ============================================================================

/**
 * Predefined algorithm combinations for common use cases
 */
export const COLORING_PRESETS = {
    classic: {
        name: 'Classic',
        description: 'Traditional smooth iteration coloring',
        layers: [
            { algorithm: 'smooth-iteration', opacity: 1 }
        ]
    },
    
    psychedelic: {
        name: 'Psychedelic',
        description: 'Vibrant multi-layered effect',
        layers: [
            { algorithm: 'smooth-iteration', opacity: 0.7 },
            { algorithm: 'stripe-average', opacity: 0.3, blendMode: 'overlay' }
        ]
    },
    
    orbitTrap: {
        name: 'Orbit Trap',
        description: 'Classic orbit trap coloring',
        layers: [
            { algorithm: 'circle-trap', opacity: 1 }
        ]
    },
    
    distance: {
        name: 'Distance Glow',
        description: 'Boundary glow effect',
        layers: [
            { algorithm: 'smooth-iteration', opacity: 0.5 },
            { algorithm: 'boundary-glow', opacity: 0.5, blendMode: 'screen' }
        ]
    },
    
    decomposition: {
        name: 'Binary Decomposition',
        description: 'Classic binary decomposition',
        layers: [
            { algorithm: 'smooth-iteration', opacity: 0.6 },
            { algorithm: 'binary-decomposition', opacity: 0.4, blendMode: 'multiply' }
        ]
    },
    
    histogram: {
        name: 'Histogram Equalized',
        description: 'Optimal contrast distribution',
        layers: [
            { algorithm: 'histogram-equalization', opacity: 1 }
        ]
    },
    
    tia: {
        name: 'Triangle Inequality',
        description: 'TIA-based smooth coloring',
        layers: [
            { algorithm: 'triangle-inequality-average', opacity: 1 }
        ]
    },
    
    artistic: {
        name: 'Artistic',
        description: 'Complex multi-algorithm blend',
        layers: [
            { algorithm: 'continuous-potential', opacity: 0.4 },
            { algorithm: 'flower-trap', opacity: 0.3, blendMode: 'overlay' },
            { algorithm: 'angular-stripes', opacity: 0.3, blendMode: 'soft-light' }
        ]
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ColoringRegistry;
