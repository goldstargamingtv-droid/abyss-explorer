/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - FRACTAL REGISTRY                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Central registry for all fractal types                                       ║
 * ║                                                                                ║
 * ║  Purpose:                                                                      ║
 * ║  ═════════                                                                     ║
 * ║  - Maps fractal IDs to their classes                                          ║
 * ║  - Provides factory function for creating instances                           ║
 * ║  - Stores metadata (descriptions, thumbnails, default views)                  ║
 * ║  - Enables dynamic fractal selection in UI                                    ║
 * ║                                                                                ║
 * ║  Usage:                                                                        ║
 * ║  ═══════                                                                       ║
 * ║  // Get list of available fractals                                            ║
 * ║  const types = FractalRegistry.getTypes();                                    ║
 * ║                                                                                ║
 * ║  // Create fractal instance                                                    ║
 * ║  const mandelbrot = FractalRegistry.create('mandelbrot');                     ║
 * ║                                                                                ║
 * ║  // Get metadata                                                               ║
 * ║  const info = FractalRegistry.getMetadata('julia');                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { FractalBase, FractalParams } from './fractal-base.js';
import Mandelbrot from './mandelbrot.js';
import Julia, { JuliaSeeds } from './julia.js';
import BurningShip, { BurningShipVariant } from './burning-ship.js';
import Tricorn from './tricorn.js';
import Newton, { PolynomialType } from './newton.js';
import Phoenix, { PhoenixPresets } from './phoenix.js';
import CustomFormula, { ExampleFormulas } from './custom-formula.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// FRACTAL METADATA
// =============================================================================

/**
 * Metadata for each fractal type
 * Includes display information, thumbnails, and default views
 */
const FractalMetadata = {
    mandelbrot: {
        id: 'mandelbrot',
        name: 'Mandelbrot Set',
        category: 'Classic',
        description: 'The classic Mandelbrot set: z² + c. The most famous fractal, featuring infinite self-similarity.',
        formula: 'z_{n+1} = z_n² + c',
        thumbnail: {
            centerX: -0.5,
            centerY: 0,
            zoom: 1.5
        },
        interestingLocations: [
            { name: 'Full View', x: -0.5, y: 0, zoom: 1.5 },
            { name: 'Seahorse Valley', x: -0.75, y: 0.1, zoom: 20 },
            { name: 'Elephant Valley', x: 0.275, y: 0, zoom: 20 },
            { name: 'Double Spiral', x: -0.7436447860, y: 0.1318252536, zoom: 1e10 },
            { name: 'Mini Mandelbrot', x: -1.768778833, y: 0.001738996, zoom: 1e6 },
            { name: 'Julia Island', x: -1.985424253, y: 0, zoom: 1e8 }
        ],
        supportsPerturbation: true,
        supportsSeriesApproximation: true,
        hasInterior: true,
        tags: ['escape-time', 'classic', 'deep-zoom']
    },
    
    julia: {
        id: 'julia',
        name: 'Julia Set',
        category: 'Classic',
        description: 'Julia sets for z² + c. Each point in the Mandelbrot set corresponds to a unique Julia set.',
        formula: 'z_{n+1} = z_n² + c (c fixed)',
        thumbnail: {
            centerX: 0,
            centerY: 0,
            zoom: 1.5
        },
        interestingLocations: [
            { name: 'Douady Rabbit', x: 0, y: 0, zoom: 1.5, juliaC: { re: -0.123, im: 0.745 } },
            { name: 'Dendrite', x: 0, y: 0, zoom: 1.5, juliaC: { re: 0, im: 1 } },
            { name: 'San Marco', x: 0, y: 0, zoom: 1.5, juliaC: { re: -0.75, im: 0 } },
            { name: 'Siegel Disk', x: 0, y: 0, zoom: 1.5, juliaC: { re: -0.390541, im: -0.586788 } },
            { name: 'Spiral', x: 0, y: 0, zoom: 1.5, juliaC: { re: 0.285, im: 0.01 } }
        ],
        presets: Object.keys(JuliaSeeds),
        supportsPerturbation: true,
        supportsSeriesApproximation: false,
        hasInterior: true,
        tags: ['escape-time', 'classic', 'parameterized']
    },
    
    'burning-ship': {
        id: 'burning-ship',
        name: 'Burning Ship',
        category: 'Variant',
        description: 'The Burning Ship fractal: (|Re(z)| + i|Im(z)|)² + c. Features ship-like structures.',
        formula: 'z_{n+1} = (|Re(z_n)| + i|Im(z_n)|)² + c',
        thumbnail: {
            centerX: -0.5,
            centerY: -0.5,
            zoom: 1.5
        },
        interestingLocations: [
            { name: 'Full View', x: -0.5, y: -0.5, zoom: 1.5 },
            { name: 'Main Ship', x: -1.762, y: -0.028, zoom: 100 },
            { name: 'Spire', x: -1.861, y: 0, zoom: 1000 },
            { name: 'Fleet', x: -1.941, y: -0.015, zoom: 500 }
        ],
        variants: Object.values(BurningShipVariant),
        supportsPerturbation: true,
        supportsSeriesApproximation: false,
        hasInterior: true,
        tags: ['escape-time', 'abs-variant', 'asymmetric']
    },
    
    tricorn: {
        id: 'tricorn',
        name: 'Tricorn (Mandelbar)',
        category: 'Variant',
        description: 'The Tricorn fractal: conj(z)² + c. Features three-fold symmetry.',
        formula: 'z_{n+1} = \\overline{z_n}² + c',
        thumbnail: {
            centerX: -0.3,
            centerY: 0,
            zoom: 1.5
        },
        interestingLocations: [
            { name: 'Full View', x: -0.3, y: 0, zoom: 1.5 },
            { name: 'Main Tricorn', x: 0.25, y: 0, zoom: 3 },
            { name: 'Horn Detail', x: -0.1, y: 0.9, zoom: 20 }
        ],
        supportsPerturbation: true,
        supportsSeriesApproximation: false,
        hasInterior: true,
        tags: ['escape-time', 'conjugate', 'symmetric']
    },
    
    newton: {
        id: 'newton',
        name: 'Newton Fractal',
        category: 'Convergent',
        description: "Newton's method fractal for polynomial roots. Colors show basin of attraction.",
        formula: 'z_{n+1} = z_n - f(z_n)/f\'(z_n)',
        thumbnail: {
            centerX: 0,
            centerY: 0,
            zoom: 2
        },
        interestingLocations: [
            { name: 'Cubic Roots', x: 0, y: 0, zoom: 2 },
            { name: 'Boundary Detail', x: 0.4, y: 0.2, zoom: 50 },
            { name: 'Central Region', x: 0, y: 0, zoom: 10 }
        ],
        polynomials: Object.values(PolynomialType),
        supportsPerturbation: false,
        supportsSeriesApproximation: false,
        hasInterior: true,
        coloringType: 'root-based',
        tags: ['convergent', 'root-finding', 'basin']
    },
    
    phoenix: {
        id: 'phoenix',
        name: 'Phoenix Fractal',
        category: 'Extended',
        description: 'Phoenix fractal with history dependence: z² + c + p·z_{n-1}.',
        formula: 'z_{n+1} = z_n² + c + p·z_{n-1}',
        thumbnail: {
            centerX: 0,
            centerY: 0,
            zoom: 1.5
        },
        interestingLocations: [
            { name: 'Classic Phoenix', x: 0, y: 0, zoom: 1.5 },
            { name: 'Feather Detail', x: 0.2, y: 0.3, zoom: 10 }
        ],
        presets: Object.keys(PhoenixPresets),
        supportsPerturbation: false,
        supportsSeriesApproximation: false,
        hasInterior: true,
        tags: ['escape-time', 'history', 'feather']
    },
    
    custom: {
        id: 'custom',
        name: 'Custom Formula',
        category: 'Custom',
        description: 'User-defined iteration formula. Enter any complex function.',
        formula: 'z_{n+1} = f(z_n, c)',
        thumbnail: {
            centerX: 0,
            centerY: 0,
            zoom: 2
        },
        interestingLocations: [],
        examples: Object.keys(ExampleFormulas),
        supportsPerturbation: false,
        supportsSeriesApproximation: false,
        hasInterior: true,
        tags: ['custom', 'formula', 'user-defined']
    }
};

// =============================================================================
// FRACTAL REGISTRY CLASS
// =============================================================================

/**
 * Fractal Registry
 * 
 * Central registry for all fractal types. Provides factory methods
 * and metadata access.
 * 
 * @class FractalRegistry
 */
class FractalRegistry {
    constructor() {
        /** @type {Map<string, typeof FractalBase>} */
        this._classes = new Map();
        
        /** @type {Map<string, FractalBase>} */
        this._instances = new Map();
        
        /** @type {Logger} */
        this.logger = new Logger('FractalRegistry');
        
        // Register built-in fractals
        this._registerBuiltins();
    }

    /**
     * Register built-in fractal types
     * @private
     */
    _registerBuiltins() {
        this.register('mandelbrot', Mandelbrot);
        this.register('julia', Julia);
        this.register('burning-ship', BurningShip);
        this.register('tricorn', Tricorn);
        this.register('newton', Newton);
        this.register('phoenix', Phoenix);
        this.register('custom', CustomFormula);
        
        this.logger.info(`Registered ${this._classes.size} fractal types`);
    }

    /**
     * Register a fractal type
     * 
     * @param {string} id - Unique identifier
     * @param {typeof FractalBase} fractalClass - Fractal class constructor
     * @param {Object} [metadata] - Optional metadata override
     */
    register(id, fractalClass, metadata = null) {
        this._classes.set(id, fractalClass);
        
        if (metadata) {
            FractalMetadata[id] = { ...FractalMetadata[id], ...metadata };
        }
    }

    /**
     * Unregister a fractal type
     * @param {string} id
     */
    unregister(id) {
        this._classes.delete(id);
        this._instances.delete(id);
    }

    /**
     * Create a new fractal instance
     * 
     * @param {string} id - Fractal type ID
     * @param {FractalParams} [params] - Optional parameters
     * @returns {FractalBase|null}
     */
    create(id, params = null) {
        const FractalClass = this._classes.get(id);
        
        if (!FractalClass) {
            this.logger.error(`Unknown fractal type: ${id}`);
            return null;
        }
        
        try {
            return new FractalClass(params);
        } catch (error) {
            this.logger.error(`Failed to create ${id}: ${error.message}`);
            return null;
        }
    }

    /**
     * Get or create a singleton instance
     * 
     * @param {string} id
     * @returns {FractalBase|null}
     */
    getInstance(id) {
        if (!this._instances.has(id)) {
            const instance = this.create(id);
            if (instance) {
                this._instances.set(id, instance);
            }
        }
        return this._instances.get(id) || null;
    }

    /**
     * Check if a fractal type is registered
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        return this._classes.has(id);
    }

    /**
     * Get list of all registered fractal IDs
     * @returns {string[]}
     */
    getTypes() {
        return Array.from(this._classes.keys());
    }

    /**
     * Get list of fractals by category
     * @param {string} category
     * @returns {string[]}
     */
    getByCategory(category) {
        return this.getTypes().filter(id => {
            const meta = FractalMetadata[id];
            return meta && meta.category === category;
        });
    }

    /**
     * Get all categories
     * @returns {string[]}
     */
    getCategories() {
        const categories = new Set();
        for (const id of this.getTypes()) {
            const meta = FractalMetadata[id];
            if (meta?.category) {
                categories.add(meta.category);
            }
        }
        return Array.from(categories);
    }

    /**
     * Get fractals by tag
     * @param {string} tag
     * @returns {string[]}
     */
    getByTag(tag) {
        return this.getTypes().filter(id => {
            const meta = FractalMetadata[id];
            return meta?.tags?.includes(tag);
        });
    }

    /**
     * Get metadata for a fractal type
     * 
     * @param {string} id
     * @returns {Object|null}
     */
    getMetadata(id) {
        return FractalMetadata[id] || null;
    }

    /**
     * Get all metadata
     * @returns {Object}
     */
    getAllMetadata() {
        return { ...FractalMetadata };
    }

    /**
     * Get fractal display info for UI
     * 
     * @param {string} id
     * @returns {Object|null}
     */
    getDisplayInfo(id) {
        const meta = FractalMetadata[id];
        if (!meta) return null;
        
        return {
            id: meta.id,
            name: meta.name,
            category: meta.category,
            description: meta.description,
            formula: meta.formula,
            tags: meta.tags || []
        };
    }

    /**
     * Get all display info for UI
     * @returns {Object[]}
     */
    getAllDisplayInfo() {
        return this.getTypes().map(id => this.getDisplayInfo(id)).filter(Boolean);
    }

    /**
     * Get interesting locations for a fractal
     * @param {string} id
     * @returns {Array}
     */
    getInterestingLocations(id) {
        const meta = FractalMetadata[id];
        return meta?.interestingLocations || [];
    }

    /**
     * Get thumbnail view settings
     * @param {string} id
     * @returns {Object|null}
     */
    getThumbnailView(id) {
        const meta = FractalMetadata[id];
        return meta?.thumbnail || null;
    }

    /**
     * Check if fractal supports perturbation
     * @param {string} id
     * @returns {boolean}
     */
    supportsPerturbation(id) {
        const meta = FractalMetadata[id];
        return meta?.supportsPerturbation || false;
    }

    /**
     * Check if fractal supports series approximation
     * @param {string} id
     * @returns {boolean}
     */
    supportsSeriesApproximation(id) {
        const meta = FractalMetadata[id];
        return meta?.supportsSeriesApproximation || false;
    }

    /**
     * Get fractals suitable for deep zoom
     * @returns {string[]}
     */
    getDeepZoomCapable() {
        return this.getTypes().filter(id => this.supportsPerturbation(id));
    }

    /**
     * Search fractals by name or description
     * @param {string} query
     * @returns {string[]}
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.getTypes().filter(id => {
            const meta = FractalMetadata[id];
            if (!meta) return false;
            
            return (
                meta.name.toLowerCase().includes(lowerQuery) ||
                meta.description.toLowerCase().includes(lowerQuery) ||
                meta.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        });
    }

    /**
     * Get recommended fractal for first-time users
     * @returns {string}
     */
    getDefault() {
        return 'mandelbrot';
    }

    /**
     * Clear all singleton instances
     */
    clearInstances() {
        for (const instance of this._instances.values()) {
            instance.dispose?.();
        }
        this._instances.clear();
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.clearInstances();
        this._classes.clear();
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global fractal registry instance
 */
const registry = new FractalRegistry();

// =============================================================================
// EXPORTS
// =============================================================================

export {
    FractalRegistry,
    FractalMetadata,
    registry as default
};

// Also export individual fractal classes for direct import
export {
    FractalBase,
    FractalParams,
    Mandelbrot,
    Julia,
    BurningShip,
    Tricorn,
    Newton,
    Phoenix,
    CustomFormula,
    JuliaSeeds,
    BurningShipVariant,
    PolynomialType,
    PhoenixPresets,
    ExampleFormulas
};
