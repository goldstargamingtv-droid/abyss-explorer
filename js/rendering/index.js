/**
 * ============================================================================
 * ABYSS EXPLORER - RENDERING MODULE
 * ============================================================================
 * 
 * Central export for all rendering components.
 * 
 * This module provides:
 * - 2D fractal rendering with progressive tile-based updates
 * - 3D fractal rendering with GPU raymarching
 * - Tile management for efficient progressive loading
 * - Supersampling for high-quality anti-aliasing
 * - Glitch detection and correction for deep zooms
 * - Adaptive iteration scaling for performance/quality balance
 * 
 * Usage:
 * ```javascript
 * import { 
 *     Renderer2D, 
 *     Renderer3D, 
 *     TileManager,
 *     Supersampling,
 *     GlitchDetector,
 *     AdaptiveIterations 
 * } from './rendering/index.js';
 * 
 * // Create 2D renderer
 * const renderer = new Renderer2D(canvas, { 
 *     progressive: true,
 *     antialiasing: true 
 * });
 * 
 * // Set fractal and viewport
 * renderer.setFractal(mandelbrot);
 * renderer.setViewport({ centerX: -0.5, centerY: 0, zoom: 200 });
 * 
 * // Render
 * const stats = await renderer.render();
 * ```
 * 
 * @module rendering
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// Core renderers
export { Renderer2D, default as Renderer2DDefault } from './renderer2d.js';
export { Renderer3D, SDF_LIBRARY, COMMON_SHADER_CHUNKS } from './renderer3d.js';

// Tile management
export { TileManager, Tile, TILE_ORDER, TILE_STATE } from './tile-manager.js';

// Anti-aliasing
export { Supersampling, SS_LEVEL, SS_PATTERN, SAMPLE_PATTERNS } from './supersampling.js';

// Glitch handling
export { 
    GlitchDetector, 
    GlitchRegion, 
    GLITCH_TYPE, 
    CORRECTION_STRATEGY,
    THRESHOLDS as GLITCH_THRESHOLDS 
} from './glitch-detection.js';

// Adaptive iterations
export { 
    AdaptiveIterations, 
    SCALING_STRATEGY, 
    PRESETS as ITERATION_PRESETS,
    ZOOM_BREAKPOINTS,
    quickCalculate,
    createPeriodicityState
} from './adaptive-iterations.js';

// ============================================================================
// CONVENIENCE FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a fully configured 2D renderer with all subsystems
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {Object} options - Configuration options
 * @returns {Renderer2D}
 */
export function create2DRenderer(canvas, options = {}) {
    const { Renderer2D } = require('./renderer2d.js');
    
    const defaultOptions = {
        progressive: true,
        antialiasing: true,
        supersampleLevel: 2,
        glitchCorrection: true,
        adaptiveIterations: true,
        tileSize: 64,
        workerCount: navigator.hardwareConcurrency || 4
    };
    
    return new Renderer2D(canvas, { ...defaultOptions, ...options });
}

/**
 * Create a fully configured 3D renderer with post-processing
 * @param {HTMLCanvasElement} canvas - Target canvas
 * @param {Object} options - Configuration options
 * @returns {Renderer3D}
 */
export function create3DRenderer(canvas, options = {}) {
    const { Renderer3D } = require('./renderer3d.js');
    
    const defaultOptions = {
        antialias: true,
        bloomEnabled: true,
        bloomStrength: 0.5,
        maxSteps: 256,
        fov: 60
    };
    
    return new Renderer3D(canvas, { ...defaultOptions, ...options });
}

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Rendering System',
    version: '1.0.0',
    components: [
        'Renderer2D',
        'Renderer3D', 
        'TileManager',
        'Supersampling',
        'GlitchDetector',
        'AdaptiveIterations'
    ],
    features: [
        'Progressive tile-based 2D rendering',
        'GPU-accelerated 3D raymarching',
        'Spiral and Hilbert tile ordering',
        '2x/4x/adaptive supersampling',
        'Automatic glitch detection and correction',
        'Dynamic iteration scaling',
        'Periodicity checking optimization',
        'Multi-threaded worker rendering',
        'Perturbation theory support',
        'Deep zoom support (10^300+)'
    ]
};
