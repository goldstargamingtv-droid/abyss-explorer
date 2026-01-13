/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - 3D FRACTAL REGISTRY                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Central registry for all 3D raymarched fractals                              ║
 * ║                                                                                ║
 * ║  Purpose:                                                                      ║
 * ║  ═════════                                                                     ║
 * ║  - Maps fractal IDs to their classes                                          ║
 * ║  - Provides factory function for creating instances                           ║
 * ║  - Stores metadata (descriptions, camera positions, thumbnails)               ║
 * ║  - Enables dynamic fractal selection in UI                                    ║
 * ║  - Manages shader compilation and caching                                     ║
 * ║                                                                                ║
 * ║  Usage:                                                                        ║
 * ║  ═══════                                                                       ║
 * ║  // Get list of available 3D fractals                                         ║
 * ║  const types = Fractal3DRegistry.getTypes();                                  ║
 * ║                                                                                ║
 * ║  // Create fractal instance                                                    ║
 * ║  const mandelbulb = Fractal3DRegistry.create('mandelbulb');                   ║
 * ║                                                                                ║
 * ║  // Get shader code                                                            ║
 * ║  const shader = mandelbulb.getFragmentShader();                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Fractal3DBase, Fractal3DParams } from './fractal3d-base.js';
import Mandelbulb from './mandelbulb.js';
import Mandelbox from './mandelbox.js';
import MengerSponge from './menger-sponge.js';
import Sierpinski from './sierpinski.js';
import JuliaQuaternion, { QuaternionJuliaPresets } from './julia-quaternion.js';
import Kleinian from './kleinian.js';
import IFSFractals, { PredefinedIFS } from './ifs-fractals.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// 3D FRACTAL METADATA
// =============================================================================

/**
 * Metadata for each 3D fractal type
 */
const Fractal3DMetadata = {
    mandelbulb: {
        id: 'mandelbulb',
        name: 'Mandelbulb',
        category: 'Power Fractals',
        description: 'The Mandelbulb: a 3D extension of the Mandelbrot set using spherical coordinate powers. Power 8 creates the classic bulb shape.',
        formula: 'z_{n+1} = z_n^{power} + c (spherical)',
        thumbnail: {
            camera: { x: 0, y: 0, z: 2.5 },
            target: { x: 0, y: 0, z: 0 }
        },
        interestingViews: [
            { name: 'Classic View', camera: { x: 0, y: 0, z: 2.5 }, power: 8 },
            { name: 'Top Down', camera: { x: 0, y: 2.5, z: 0 }, power: 8 },
            { name: 'Power 3', camera: { x: 0, y: 0, z: 3 }, power: 3 },
            { name: 'Power 16', camera: { x: 0, y: 0, z: 2 }, power: 16 },
            { name: 'Detail Zoom', camera: { x: 0.5, y: 0.3, z: 0.8 }, power: 8 }
        ],
        supportsJulia: true,
        gpuIntensive: true,
        recommendedIterations: { min: 8, max: 20, default: 15 },
        tags: ['escape-time', 'spherical', 'classic', 'deep-zoom']
    },

    mandelbox: {
        id: 'mandelbox',
        name: 'Mandelbox',
        category: 'Fold Fractals',
        description: 'The Mandelbox: combines box folding and sphere folding. Scale -1.5 creates the famous "Amazing Surface" appearance.',
        formula: 'z = scale × sphereFold(boxFold(z)) + c',
        thumbnail: {
            camera: { x: 0, y: 0, z: 4 },
            target: { x: 0, y: 0, z: 0 }
        },
        interestingViews: [
            { name: 'Amazing Surface', camera: { x: 0, y: 0, z: 4 }, scale: -1.5 },
            { name: 'Scale 2', camera: { x: 0, y: 0, z: 5 }, scale: 2.0 },
            { name: 'Spiky', camera: { x: 0, y: 0, z: 3 }, scale: -2.0 },
            { name: 'Interior', camera: { x: 0.5, y: 0.5, z: 1 }, scale: -1.5 },
            { name: 'Close Up', camera: { x: 1, y: 0.5, z: 0.5 }, scale: -1.5 }
        ],
        presets: {
            amazingBox: { scale: -1.5, foldLimit: 1.0, minRadius: 0.5, fixedRadius: 1.0 },
            softMandelbox: { scale: 2.0, foldLimit: 1.0, minRadius: 0.25, fixedRadius: 1.0 },
            spikyMandelbox: { scale: -2.0, foldLimit: 0.5, minRadius: 0.1, fixedRadius: 1.0 }
        },
        supportsJulia: true,
        gpuIntensive: true,
        recommendedIterations: { min: 10, max: 25, default: 15 },
        tags: ['fold', 'box-fold', 'sphere-fold', 'amazing-surface']
    },

    'menger-sponge': {
        id: 'menger-sponge',
        name: 'Menger Sponge',
        category: 'IFS Fractals',
        description: 'The Menger Sponge: a classic 3D fractal created by recursive cube removal. Zero volume, infinite surface area.',
        formula: 'Recursive 3×3×3 cube removal',
        thumbnail: {
            camera: { x: 2, y: 2, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        interestingViews: [
            { name: 'Corner View', camera: { x: 2, y: 2, z: 2 } },
            { name: 'Face View', camera: { x: 0, y: 0, z: 3 } },
            { name: 'Edge View', camera: { x: 2, y: 0, z: 2 } },
            { name: 'Interior', camera: { x: 0.5, y: 0.5, z: 0.5 } }
        ],
        variants: ['standard', 'jerusalem', 'cross', 'hybrid'],
        supportsJulia: false,
        gpuIntensive: false,
        recommendedIterations: { min: 4, max: 12, default: 8 },
        tags: ['ifs', 'cube', 'classic', 'self-similar']
    },

    sierpinski: {
        id: 'sierpinski',
        name: 'Sierpinski',
        category: 'IFS Fractals',
        description: 'Sierpinski fractals: tetrahedron, pyramid, and octahedron variants. Classic self-similar structures.',
        formula: 'T_i(x) = (x + v_i) / 2',
        thumbnail: {
            camera: { x: 2, y: 1.5, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        interestingViews: [
            { name: 'Tetrahedron', camera: { x: 2, y: 1.5, z: 2 }, variant: 'tetrahedron' },
            { name: 'Pyramid', camera: { x: 0, y: 2, z: 2 }, variant: 'pyramid' },
            { name: 'Octahedron', camera: { x: 2, y: 2, z: 0 }, variant: 'octahedron' },
            { name: 'Top Down', camera: { x: 0, y: 3, z: 0 }, variant: 'tetrahedron' }
        ],
        variants: ['tetrahedron', 'pyramid', 'octahedron', 'dodecahedron'],
        supportsJulia: false,
        gpuIntensive: false,
        recommendedIterations: { min: 6, max: 15, default: 12 },
        tags: ['ifs', 'tetrahedron', 'classic', 'self-similar']
    },

    'julia-quaternion': {
        id: 'julia-quaternion',
        name: 'Quaternion Julia',
        category: 'Hypercomplex',
        description: 'Julia sets in quaternion (4D) space, visualized as 3D slices. Uses non-commutative quaternion multiplication.',
        formula: 'q_{n+1} = q_n^2 + c (q ∈ ℍ)',
        thumbnail: {
            camera: { x: 0, y: 0, z: 2.5 },
            target: { x: 0, y: 0, z: 0 }
        },
        interestingViews: [
            { name: 'Classic 1', camera: { x: 0, y: 0, z: 2.5 }, preset: 'classic1' },
            { name: 'Spiral', camera: { x: 0, y: 0, z: 2 }, preset: 'spiral1' },
            { name: 'Organic', camera: { x: 0, y: 0, z: 2.5 }, preset: 'organic1' },
            { name: 'Dendrite', camera: { x: 0, y: 0, z: 2 }, preset: 'dendrite1' }
        ],
        presets: Object.keys(QuaternionJuliaPresets),
        supportsJulia: true,
        gpuIntensive: true,
        recommendedIterations: { min: 8, max: 16, default: 12 },
        tags: ['quaternion', 'julia', 'hypercomplex', '4d-slice']
    },

    kleinian: {
        id: 'kleinian',
        name: 'Kleinian',
        category: 'Hyperbolic',
        description: 'Kleinian group limit sets: fractal boundaries of hyperbolic tilings using Möbius-like inversions.',
        formula: 'Inversion IFS with Möbius folds',
        thumbnail: {
            camera: { x: 0, y: 2, z: 0 },
            target: { x: 0, y: 0, z: 0 }
        },
        interestingViews: [
            { name: 'Knighty', camera: { x: 0, y: 2, z: 0 }, variant: 'knighty' },
            { name: 'Apollonian', camera: { x: 0, y: 0, z: 3 }, variant: 'apollonian' },
            { name: 'Schottky', camera: { x: 2, y: 1, z: 2 }, variant: 'schottky' },
            { name: 'Close Up', camera: { x: 0.5, y: 0.5, z: 0.5 }, variant: 'knighty' }
        ],
        variants: ['knighty', 'apollonian', 'schottky'],
        supportsJulia: false,
        gpuIntensive: true,
        recommendedIterations: { min: 10, max: 30, default: 20 },
        tags: ['kleinian', 'hyperbolic', 'mobius', 'limit-set']
    },

    'ifs-fractals': {
        id: 'ifs-fractals',
        name: 'IFS Fractals',
        category: 'IFS Fractals',
        description: 'General Iterated Function System fractals: Cantor dust, Koch 3D, Vicsek, and custom transforms.',
        formula: 'A = ⋃ f_i(A)',
        thumbnail: {
            camera: { x: 2, y: 2, z: 2 },
            target: { x: 0, y: 0, z: 0 }
        },
        interestingViews: [
            { name: 'Cantor Dust', camera: { x: 2, y: 2, z: 2 }, ifs: 'cantorDust' },
            { name: 'Koch 3D', camera: { x: 0, y: 2, z: 2 }, ifs: 'koch3D' },
            { name: 'Vicsek', camera: { x: 2, y: 2, z: 0 }, ifs: 'vicsek3D' },
            { name: 'Octa Flake', camera: { x: 2, y: 1, z: 2 }, ifs: 'octaFlake' }
        ],
        availableIFS: Object.keys(PredefinedIFS),
        supportsJulia: false,
        gpuIntensive: false,
        recommendedIterations: { min: 5, max: 15, default: 10 },
        tags: ['ifs', 'custom', 'affine', 'self-similar']
    }
};

// =============================================================================
// 3D FRACTAL REGISTRY CLASS
// =============================================================================

/**
 * 3D Fractal Registry
 * 
 * Central registry for all 3D raymarched fractals.
 * 
 * @class Fractal3DRegistry
 */
class Fractal3DRegistry {
    constructor() {
        /** @type {Map<string, typeof Fractal3DBase>} */
        this._classes = new Map();
        
        /** @type {Map<string, Fractal3DBase>} */
        this._instances = new Map();
        
        /** @type {Map<string, string>} Shader cache */
        this._shaderCache = new Map();
        
        /** @type {Logger} */
        this.logger = new Logger('Fractal3DRegistry');
        
        // Register built-in fractals
        this._registerBuiltins();
    }

    /**
     * Register built-in 3D fractal types
     * @private
     */
    _registerBuiltins() {
        this.register('mandelbulb', Mandelbulb);
        this.register('mandelbox', Mandelbox);
        this.register('menger-sponge', MengerSponge);
        this.register('sierpinski', Sierpinski);
        this.register('julia-quaternion', JuliaQuaternion);
        this.register('kleinian', Kleinian);
        this.register('ifs-fractals', IFSFractals);
        
        this.logger.info(`Registered ${this._classes.size} 3D fractal types`);
    }

    /**
     * Register a 3D fractal type
     * 
     * @param {string} id - Unique identifier
     * @param {typeof Fractal3DBase} fractalClass - Fractal class constructor
     * @param {Object} [metadata] - Optional metadata override
     */
    register(id, fractalClass, metadata = null) {
        this._classes.set(id, fractalClass);
        
        if (metadata) {
            Fractal3DMetadata[id] = { ...Fractal3DMetadata[id], ...metadata };
        }
    }

    /**
     * Unregister a 3D fractal type
     * @param {string} id
     */
    unregister(id) {
        this._classes.delete(id);
        this._instances.delete(id);
        this._shaderCache.delete(id);
    }

    /**
     * Create a new 3D fractal instance
     * 
     * @param {string} id - Fractal type ID
     * @param {Fractal3DParams} [params] - Optional parameters
     * @returns {Fractal3DBase|null}
     */
    create(id, params = null) {
        const FractalClass = this._classes.get(id);
        
        if (!FractalClass) {
            this.logger.error(`Unknown 3D fractal type: ${id}`);
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
     * @returns {Fractal3DBase|null}
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
     * Check if a 3D fractal type is registered
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        return this._classes.has(id);
    }

    /**
     * Get list of all registered 3D fractal IDs
     * @returns {string[]}
     */
    getTypes() {
        return Array.from(this._classes.keys());
    }

    /**
     * Get list of 3D fractals by category
     * @param {string} category
     * @returns {string[]}
     */
    getByCategory(category) {
        return this.getTypes().filter(id => {
            const meta = Fractal3DMetadata[id];
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
            const meta = Fractal3DMetadata[id];
            if (meta?.category) {
                categories.add(meta.category);
            }
        }
        return Array.from(categories);
    }

    /**
     * Get 3D fractals by tag
     * @param {string} tag
     * @returns {string[]}
     */
    getByTag(tag) {
        return this.getTypes().filter(id => {
            const meta = Fractal3DMetadata[id];
            return meta?.tags?.includes(tag);
        });
    }

    /**
     * Get metadata for a 3D fractal type
     * 
     * @param {string} id
     * @returns {Object|null}
     */
    getMetadata(id) {
        return Fractal3DMetadata[id] || null;
    }

    /**
     * Get all metadata
     * @returns {Object}
     */
    getAllMetadata() {
        return { ...Fractal3DMetadata };
    }

    /**
     * Get fractal display info for UI
     * 
     * @param {string} id
     * @returns {Object|null}
     */
    getDisplayInfo(id) {
        const meta = Fractal3DMetadata[id];
        if (!meta) return null;
        
        return {
            id: meta.id,
            name: meta.name,
            category: meta.category,
            description: meta.description,
            formula: meta.formula,
            tags: meta.tags || [],
            supportsJulia: meta.supportsJulia,
            gpuIntensive: meta.gpuIntensive
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
     * Get interesting views for a 3D fractal
     * @param {string} id
     * @returns {Array}
     */
    getInterestingViews(id) {
        const meta = Fractal3DMetadata[id];
        return meta?.interestingViews || [];
    }

    /**
     * Get thumbnail camera settings
     * @param {string} id
     * @returns {Object|null}
     */
    getThumbnailCamera(id) {
        const meta = Fractal3DMetadata[id];
        return meta?.thumbnail || null;
    }

    /**
     * Get recommended iteration range
     * @param {string} id
     * @returns {{min: number, max: number, default: number}|null}
     */
    getRecommendedIterations(id) {
        const meta = Fractal3DMetadata[id];
        return meta?.recommendedIterations || null;
    }

    /**
     * Check if fractal is GPU intensive
     * @param {string} id
     * @returns {boolean}
     */
    isGPUIntensive(id) {
        const meta = Fractal3DMetadata[id];
        return meta?.gpuIntensive || false;
    }

    /**
     * Get presets for a 3D fractal
     * @param {string} id
     * @returns {Object|string[]|null}
     */
    getPresets(id) {
        const meta = Fractal3DMetadata[id];
        return meta?.presets || null;
    }

    /**
     * Get available variants
     * @param {string} id
     * @returns {string[]|null}
     */
    getVariants(id) {
        const meta = Fractal3DMetadata[id];
        return meta?.variants || null;
    }

    // =========================================================================
    // SHADER MANAGEMENT
    // =========================================================================

    /**
     * Get compiled fragment shader for a 3D fractal
     * @param {string} id
     * @param {boolean} [forceRecompile=false]
     * @returns {string|null}
     */
    getFragmentShader(id, forceRecompile = false) {
        if (!forceRecompile && this._shaderCache.has(id)) {
            return this._shaderCache.get(id);
        }
        
        const instance = this.getInstance(id);
        if (!instance) return null;
        
        const shader = instance.getFragmentShader();
        this._shaderCache.set(id, shader);
        
        return shader;
    }

    /**
     * Get vertex shader (same for all 3D fractals)
     * @returns {string}
     */
    getVertexShader() {
        return `
precision highp float;
attribute vec3 position;
void main() {
    gl_Position = vec4(position, 1.0);
}
`;
    }

    /**
     * Clear shader cache
     */
    clearShaderCache() {
        this._shaderCache.clear();
    }

    // =========================================================================
    // UTILITY METHODS
    // =========================================================================

    /**
     * Get default 3D fractal
     * @returns {string}
     */
    getDefault() {
        return 'mandelbulb';
    }

    /**
     * Get beginner-friendly 3D fractals
     * @returns {string[]}
     */
    getBeginnerFriendly() {
        return ['mandelbulb', 'menger-sponge', 'sierpinski'];
    }

    /**
     * Get fractals supporting Julia mode
     * @returns {string[]}
     */
    getJuliaCapable() {
        return this.getTypes().filter(id => {
            const meta = Fractal3DMetadata[id];
            return meta?.supportsJulia;
        });
    }

    /**
     * Get fractals suitable for real-time rendering
     * @returns {string[]}
     */
    getRealTimeCapable() {
        return this.getTypes().filter(id => {
            const meta = Fractal3DMetadata[id];
            return !meta?.gpuIntensive;
        });
    }

    /**
     * Search 3D fractals by name or description
     * @param {string} query
     * @returns {string[]}
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.getTypes().filter(id => {
            const meta = Fractal3DMetadata[id];
            if (!meta) return false;
            
            return (
                meta.name.toLowerCase().includes(lowerQuery) ||
                meta.description.toLowerCase().includes(lowerQuery) ||
                meta.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );
        });
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
        this.clearShaderCache();
        this._classes.clear();
    }

    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return {
            registeredTypes: this._classes.size,
            cachedInstances: this._instances.size,
            cachedShaders: this._shaderCache.size,
            categories: this.getCategories().length,
            juliaCapable: this.getJuliaCapable().length,
            gpuIntensive: this.getTypes().filter(id => this.isGPUIntensive(id)).length
        };
    }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global 3D fractal registry instance
 */
const registry = new Fractal3DRegistry();

// =============================================================================
// EXPORTS
// =============================================================================

export {
    Fractal3DRegistry,
    Fractal3DMetadata,
    registry as default
};

// Also export individual classes for direct import
export {
    Fractal3DBase,
    Fractal3DParams,
    Mandelbulb,
    Mandelbox,
    MengerSponge,
    Sierpinski,
    JuliaQuaternion,
    Kleinian,
    IFSFractals,
    QuaternionJuliaPresets,
    PredefinedIFS
};
