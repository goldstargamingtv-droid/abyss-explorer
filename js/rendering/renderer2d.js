/**
 * ============================================================================
 * ABYSS EXPLORER - 2D FRACTAL RENDERER
 * ============================================================================
 * 
 * High-performance 2D fractal renderer using HTML5 Canvas with support for:
 * - Tile-based progressive rendering with worker delegation
 * - Perturbation theory integration for deep zooms (10^300+)
 * - Series approximation for massive speedups
 * - Multi-pass supersampling
 * - OffscreenCanvas for worker-based rendering
 * - Adaptive iteration scaling
 * - Glitch detection and correction
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                         Renderer2D                                   │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
 * │  │  Tile    │  │  Worker  │  │ Perturb  │  │  Color   │            │
 * │  │ Manager  │──│  Pool    │──│  Engine  │──│  System  │            │
 * │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
 * │       │              │             │             │                  │
 * │       └──────────────┴─────────────┴─────────────┘                  │
 * │                          │                                          │
 * │                    ┌─────▼─────┐                                    │
 * │                    │  Canvas   │                                    │
 * │                    │  Output   │                                    │
 * │                    └───────────┘                                    │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * Performance Techniques:
 * - Spiral tile ordering (center-out) for perceived speed
 * - Double buffering to prevent flicker
 * - Typed arrays for iteration data
 * - SIMD-style batched complex arithmetic where possible
 * - Adaptive precision switching (double → arbitrary)
 * - Reference orbit caching
 * 
 * @module rendering/renderer2d
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { Complex } from '../math/complex.js';
import { ArbitraryPrecision } from '../math/arbitrary-precision.js';
import { PerturbationEngine } from '../math/perturbation.js';
import { SeriesApproximation } from '../math/series-approximation.js';
import { TileManager } from './tile-manager.js';
import { Supersampling } from './supersampling.js';
import { GlitchDetector } from './glitch-detection.js';
import { AdaptiveIterations } from './adaptive-iterations.js';

/**
 * Rendering statistics for performance monitoring
 * @typedef {Object} RenderStats
 * @property {number} totalPixels - Total pixels rendered
 * @property {number} tilesCompleted - Number of tiles finished
 * @property {number} tilesTotal - Total tiles to render
 * @property {number} averageIterations - Mean iteration count
 * @property {number} maxIterationsUsed - Highest iteration count hit
 * @property {number} glitchesDetected - Number of glitches found
 * @property {number} glitchesCorrected - Number of glitches fixed
 * @property {number} renderTimeMs - Total render time in milliseconds
 * @property {number} pixelsPerSecond - Rendering throughput
 * @property {string} precisionMode - 'double' | 'perturbation' | 'arbitrary'
 */

/**
 * Render configuration options
 * @typedef {Object} RenderConfig
 * @property {number} width - Canvas width in pixels
 * @property {number} height - Canvas height in pixels
 * @property {number} maxIterations - Maximum iteration count
 * @property {number} escapeRadius - Bailout radius (typically 2-4)
 * @property {boolean} progressive - Enable progressive tile rendering
 * @property {boolean} antialiasing - Enable supersampling
 * @property {number} supersampleLevel - AA level (1, 2, 4)
 * @property {boolean} glitchCorrection - Enable glitch detection
 * @property {boolean} adaptiveIterations - Enable dynamic iteration scaling
 * @property {number} tileSize - Tile dimensions (power of 2)
 * @property {number} workerCount - Number of web workers
 */

/**
 * Viewport definition for fractal space
 * @typedef {Object} Viewport
 * @property {number|ArbitraryPrecision} centerX - Center X coordinate
 * @property {number|ArbitraryPrecision} centerY - Center Y coordinate  
 * @property {number|ArbitraryPrecision} zoom - Zoom level (pixels per unit)
 * @property {number} rotation - Rotation angle in radians
 */

/**
 * Per-pixel render data
 * @typedef {Object} PixelData
 * @property {Float64Array} iterations - Iteration counts (smoothed)
 * @property {Float64Array} distances - Distance estimates
 * @property {Float64Array} orbitX - Final orbit X coordinates
 * @property {Float64Array} orbitY - Final orbit Y coordinates
 * @property {Uint8Array} escaped - Escape flags (1 = escaped, 0 = interior)
 * @property {Float64Array} potential - Continuous potential values
 * @property {Float64Array} angle - Final angle for decomposition coloring
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Threshold zoom level for switching to perturbation theory */
const PERTURBATION_THRESHOLD = 1e13;

/** Threshold zoom level for arbitrary precision */
const ARBITRARY_PRECISION_THRESHOLD = 1e15;

/** Default escape radius squared */
const DEFAULT_ESCAPE_RADIUS_SQ = 4;

/** Maximum tiles to render per frame to maintain responsiveness */
const MAX_TILES_PER_FRAME = 4;

/** Minimum tile size in pixels */
const MIN_TILE_SIZE = 32;

/** Maximum tile size in pixels */
const MAX_TILE_SIZE = 256;

// ============================================================================
// RENDERER2D CLASS
// ============================================================================

export class Renderer2D {
    /**
     * Create a new 2D fractal renderer
     * @param {HTMLCanvasElement} canvas - Target canvas element
     * @param {RenderConfig} config - Renderer configuration
     */
    constructor(canvas, config = {}) {
        // Canvas setup
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', {
            alpha: false,
            desynchronized: true,  // Reduce latency
            willReadFrequently: false
        });
        
        // Double buffer for flicker-free rendering
        this.bufferCanvas = document.createElement('canvas');
        this.bufferCtx = this.bufferCanvas.getContext('2d', { alpha: false });
        
        // Configuration with defaults
        this.config = {
            width: canvas.width || 800,
            height: canvas.height || 600,
            maxIterations: config.maxIterations || 1000,
            escapeRadius: config.escapeRadius || 2,
            escapeRadiusSq: (config.escapeRadius || 2) ** 2,
            progressive: config.progressive !== false,
            antialiasing: config.antialiasing || false,
            supersampleLevel: config.supersampleLevel || 2,
            glitchCorrection: config.glitchCorrection !== false,
            adaptiveIterations: config.adaptiveIterations !== false,
            tileSize: this._clampTileSize(config.tileSize || 64),
            workerCount: config.workerCount || navigator.hardwareConcurrency || 4
        };
        
        // Update canvas dimensions
        this.resize(this.config.width, this.config.height);
        
        // Current viewport in fractal coordinates
        this.viewport = {
            centerX: -0.5,
            centerY: 0,
            zoom: 200,
            rotation: 0
        };
        
        // Current fractal being rendered
        this.fractal = null;
        
        // Pixel data buffers
        this.pixelData = null;
        this._allocateBuffers();
        
        // Sub-systems
        this.tileManager = new TileManager(this);
        this.supersampling = new Supersampling(this);
        this.glitchDetector = new GlitchDetector(this);
        this.adaptiveIterations = new AdaptiveIterations(this);
        this.perturbationEngine = null;  // Lazy init
        this.seriesApproximation = null; // Lazy init
        
        // Web workers pool
        this.workers = [];
        this.workerQueue = [];
        this.activeWorkers = 0;
        this._initializeWorkers();
        
        // Render state
        this.isRendering = false;
        this.renderAborted = false;
        this.currentRenderPromise = null;
        this.renderStats = this._createEmptyStats();
        
        // Callbacks
        this.onProgress = null;
        this.onComplete = null;
        this.onTileComplete = null;
        
        // Animation frame for progressive rendering
        this.animationFrameId = null;
        
        // Precision mode tracking
        this.precisionMode = 'double';
        
        // Reference orbit for perturbation (cached)
        this.referenceOrbit = null;
        this.referencePoint = null;
        
        // Color lookup table (set by coloring system)
        this.colorLUT = null;
        
        console.log(`[Renderer2D] Initialized: ${this.config.width}x${this.config.height}, ` +
                    `${this.config.workerCount} workers, tile size ${this.config.tileSize}`);
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /**
     * Clamp tile size to valid range (power of 2)
     * @private
     */
    _clampTileSize(size) {
        const clamped = Math.max(MIN_TILE_SIZE, Math.min(MAX_TILE_SIZE, size));
        // Round to nearest power of 2
        return Math.pow(2, Math.round(Math.log2(clamped)));
    }
    
    /**
     * Allocate pixel data buffers
     * @private
     */
    _allocateBuffers() {
        const pixelCount = this.config.width * this.config.height;
        
        this.pixelData = {
            iterations: new Float64Array(pixelCount),
            distances: new Float64Array(pixelCount),
            orbitX: new Float64Array(pixelCount),
            orbitY: new Float64Array(pixelCount),
            escaped: new Uint8Array(pixelCount),
            potential: new Float64Array(pixelCount),
            angle: new Float64Array(pixelCount)
        };
        
        // ImageData for final output
        this.imageData = this.ctx.createImageData(this.config.width, this.config.height);
    }
    
    /**
     * Initialize web worker pool
     * @private
     */
    _initializeWorkers() {
        // Terminate existing workers
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        
        for (let i = 0; i < this.config.workerCount; i++) {
            try {
                const worker = new Worker(
                    new URL('../workers/render-worker.js', import.meta.url),
                    { type: 'module' }
                );
                
                worker.onmessage = (e) => this._handleWorkerMessage(i, e);
                worker.onerror = (e) => this._handleWorkerError(i, e);
                
                this.workers.push({
                    worker,
                    busy: false,
                    currentTask: null
                });
            } catch (err) {
                console.warn(`[Renderer2D] Failed to create worker ${i}:`, err);
            }
        }
        
        console.log(`[Renderer2D] Created ${this.workers.length} workers`);
    }
    
    /**
     * Create empty render statistics object
     * @private
     */
    _createEmptyStats() {
        return {
            totalPixels: 0,
            tilesCompleted: 0,
            tilesTotal: 0,
            averageIterations: 0,
            maxIterationsUsed: 0,
            glitchesDetected: 0,
            glitchesCorrected: 0,
            renderTimeMs: 0,
            pixelsPerSecond: 0,
            precisionMode: 'double'
        };
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Resize the renderer
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.config.width = width;
        this.config.height = height;
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.bufferCanvas.width = width;
        this.bufferCanvas.height = height;
        
        this._allocateBuffers();
        
        console.log(`[Renderer2D] Resized to ${width}x${height}`);
    }
    
    /**
     * Set the fractal to render
     * @param {Object} fractal - Fractal instance from fractal registry
     */
    setFractal(fractal) {
        this.fractal = fractal;
        this.referenceOrbit = null;  // Invalidate cached reference
        console.log(`[Renderer2D] Fractal set: ${fractal?.name || 'unknown'}`);
    }
    
    /**
     * Set the viewport (pan/zoom)
     * @param {Viewport} viewport - New viewport parameters
     */
    setViewport(viewport) {
        const changed = (
            this.viewport.centerX !== viewport.centerX ||
            this.viewport.centerY !== viewport.centerY ||
            this.viewport.zoom !== viewport.zoom ||
            this.viewport.rotation !== viewport.rotation
        );
        
        this.viewport = { ...viewport };
        
        if (changed) {
            this.referenceOrbit = null;  // Invalidate on viewport change
            this._updatePrecisionMode();
        }
    }
    
    /**
     * Update configuration
     * @param {Partial<RenderConfig>} config - Configuration updates
     */
    updateConfig(config) {
        Object.assign(this.config, config);
        
        if (config.escapeRadius !== undefined) {
            this.config.escapeRadiusSq = config.escapeRadius ** 2;
        }
        
        if (config.tileSize !== undefined) {
            this.config.tileSize = this._clampTileSize(config.tileSize);
        }
        
        if (config.workerCount !== undefined) {
            this._initializeWorkers();
        }
        
        if (config.width !== undefined || config.height !== undefined) {
            this.resize(this.config.width, this.config.height);
        }
    }
    
    /**
     * Set the color lookup table
     * @param {Uint8ClampedArray} lut - RGBA color table (256 * 4 bytes)
     */
    setColorLUT(lut) {
        this.colorLUT = lut;
    }
    
    /**
     * Start rendering
     * @returns {Promise<RenderStats>} Resolves when render is complete
     */
    async render() {
        // Abort any existing render
        if (this.isRendering) {
            await this.abort();
        }
        
        this.isRendering = true;
        this.renderAborted = false;
        this.renderStats = this._createEmptyStats();
        this.renderStats.startTime = performance.now();
        
        console.log(`[Renderer2D] Starting render, precision: ${this.precisionMode}`);
        
        try {
            if (this.config.progressive) {
                await this._renderProgressive();
            } else {
                await this._renderDirect();
            }
            
            // Apply supersampling if enabled
            if (this.config.antialiasing && this.config.supersampleLevel > 1) {
                await this.supersampling.apply(this.config.supersampleLevel);
            }
            
            // Final stats
            this.renderStats.renderTimeMs = performance.now() - this.renderStats.startTime;
            this.renderStats.pixelsPerSecond = Math.round(
                this.renderStats.totalPixels / (this.renderStats.renderTimeMs / 1000)
            );
            this.renderStats.precisionMode = this.precisionMode;
            
            // Copy buffer to main canvas
            this._swapBuffers();
            
            if (this.onComplete) {
                this.onComplete(this.renderStats);
            }
            
            console.log(`[Renderer2D] Render complete: ${this.renderStats.renderTimeMs.toFixed(1)}ms, ` +
                        `${(this.renderStats.pixelsPerSecond / 1000000).toFixed(2)} Mpx/s`);
            
            return this.renderStats;
            
        } catch (err) {
            if (err.message !== 'Render aborted') {
                console.error('[Renderer2D] Render error:', err);
                throw err;
            }
        } finally {
            this.isRendering = false;
        }
    }
    
    /**
     * Abort current render
     */
    async abort() {
        if (!this.isRendering) return;
        
        console.log('[Renderer2D] Aborting render');
        this.renderAborted = true;
        
        // Cancel animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear worker tasks
        this.tileManager.cancelAll();
        
        // Wait for workers to finish current tasks
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    /**
     * Get pixel data at a specific coordinate
     * @param {number} x - Pixel X coordinate
     * @param {number} y - Pixel Y coordinate
     * @returns {Object} Pixel information
     */
    getPixelInfo(x, y) {
        const idx = y * this.config.width + x;
        
        if (idx < 0 || idx >= this.pixelData.iterations.length) {
            return null;
        }
        
        // Convert pixel to fractal coordinates
        const fractalCoord = this._pixelToFractal(x, y);
        
        return {
            pixelX: x,
            pixelY: y,
            fractalX: fractalCoord.x,
            fractalY: fractalCoord.y,
            iterations: this.pixelData.iterations[idx],
            escaped: this.pixelData.escaped[idx] === 1,
            distance: this.pixelData.distances[idx],
            orbitX: this.pixelData.orbitX[idx],
            orbitY: this.pixelData.orbitY[idx],
            potential: this.pixelData.potential[idx],
            angle: this.pixelData.angle[idx]
        };
    }
    
    /**
     * Get current render statistics
     * @returns {RenderStats}
     */
    getStats() {
        return { ...this.renderStats };
    }
    
    /**
     * Export pixel data for coloring
     * @returns {PixelData}
     */
    getPixelData() {
        return this.pixelData;
    }
    
    // ========================================================================
    // PRECISION MODE MANAGEMENT
    // ========================================================================
    
    /**
     * Update precision mode based on zoom level
     * @private
     */
    _updatePrecisionMode() {
        const zoom = typeof this.viewport.zoom === 'number' 
            ? this.viewport.zoom 
            : this.viewport.zoom.toNumber();
        
        if (zoom >= ARBITRARY_PRECISION_THRESHOLD) {
            this.precisionMode = 'arbitrary';
        } else if (zoom >= PERTURBATION_THRESHOLD) {
            this.precisionMode = 'perturbation';
        } else {
            this.precisionMode = 'double';
        }
        
        // Initialize perturbation engine if needed
        if (this.precisionMode !== 'double' && !this.perturbationEngine) {
            this.perturbationEngine = new PerturbationEngine();
            this.seriesApproximation = new SeriesApproximation();
        }
    }
    
    // ========================================================================
    // COORDINATE TRANSFORMS
    // ========================================================================
    
    /**
     * Convert pixel coordinates to fractal space
     * @param {number} px - Pixel X
     * @param {number} py - Pixel Y
     * @returns {{x: number, y: number}} Fractal coordinates
     */
    _pixelToFractal(px, py) {
        const { width, height } = this.config;
        const { centerX, centerY, zoom, rotation } = this.viewport;
        
        // Center-relative pixel coordinates
        let dx = (px - width / 2) / zoom;
        let dy = (py - height / 2) / zoom;
        
        // Apply rotation
        if (rotation !== 0) {
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);
            const rdx = dx * cos - dy * sin;
            const rdy = dx * sin + dy * cos;
            dx = rdx;
            dy = rdy;
        }
        
        // Handle arbitrary precision center
        const cx = typeof centerX === 'number' ? centerX : centerX.toNumber();
        const cy = typeof centerY === 'number' ? centerY : centerY.toNumber();
        
        return {
            x: cx + dx,
            y: cy + dy
        };
    }
    
    /**
     * Convert fractal coordinates to pixel space
     * @param {number} fx - Fractal X
     * @param {number} fy - Fractal Y
     * @returns {{x: number, y: number}} Pixel coordinates
     */
    _fractalToPixel(fx, fy) {
        const { width, height } = this.config;
        const { centerX, centerY, zoom, rotation } = this.viewport;
        
        const cx = typeof centerX === 'number' ? centerX : centerX.toNumber();
        const cy = typeof centerY === 'number' ? centerY : centerY.toNumber();
        
        let dx = fx - cx;
        let dy = fy - cy;
        
        // Apply inverse rotation
        if (rotation !== 0) {
            const cos = Math.cos(-rotation);
            const sin = Math.sin(-rotation);
            const rdx = dx * cos - dy * sin;
            const rdy = dx * sin + dy * cos;
            dx = rdx;
            dy = rdy;
        }
        
        return {
            x: dx * zoom + width / 2,
            y: dy * zoom + height / 2
        };
    }
    
    // ========================================================================
    // DIRECT RENDERING (NON-PROGRESSIVE)
    // ========================================================================
    
    /**
     * Render entire image directly (blocking)
     * @private
     */
    async _renderDirect() {
        const { width, height, maxIterations, escapeRadiusSq } = this.config;
        
        // Determine effective max iterations
        let effectiveMaxIter = maxIterations;
        if (this.config.adaptiveIterations) {
            effectiveMaxIter = this.adaptiveIterations.calculate(this.viewport.zoom);
        }
        
        // Setup perturbation if needed
        if (this.precisionMode !== 'double') {
            await this._computeReferenceOrbit(effectiveMaxIter);
        }
        
        // Iterate all pixels
        for (let y = 0; y < height && !this.renderAborted; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                const coord = this._pixelToFractal(x, y);
                
                const result = this._computePixel(coord.x, coord.y, effectiveMaxIter, escapeRadiusSq);
                
                this.pixelData.iterations[idx] = result.iterations;
                this.pixelData.escaped[idx] = result.escaped ? 1 : 0;
                this.pixelData.distances[idx] = result.distance || 0;
                this.pixelData.orbitX[idx] = result.orbitX || 0;
                this.pixelData.orbitY[idx] = result.orbitY || 0;
                this.pixelData.potential[idx] = result.potential || 0;
                this.pixelData.angle[idx] = result.angle || 0;
            }
            
            // Update progress
            this.renderStats.totalPixels = (y + 1) * width;
            
            // Yield to event loop periodically
            if (y % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
                
                if (this.onProgress) {
                    this.onProgress((y + 1) / height);
                }
            }
        }
        
        // Apply colors
        this._applyColors();
    }
    
    // ========================================================================
    // PROGRESSIVE TILE-BASED RENDERING
    // ========================================================================
    
    /**
     * Render using progressive tile-based approach
     * @private
     */
    async _renderProgressive() {
        const tiles = this.tileManager.generateTiles();
        this.renderStats.tilesTotal = tiles.length;
        
        console.log(`[Renderer2D] Progressive render: ${tiles.length} tiles`);
        
        // Determine effective max iterations
        let effectiveMaxIter = this.config.maxIterations;
        if (this.config.adaptiveIterations) {
            effectiveMaxIter = this.adaptiveIterations.calculate(this.viewport.zoom);
        }
        
        // Compute reference orbit for perturbation
        if (this.precisionMode !== 'double') {
            await this._computeReferenceOrbit(effectiveMaxIter);
        }
        
        return new Promise((resolve, reject) => {
            let tileIndex = 0;
            let completedTiles = 0;
            
            const processTiles = () => {
                if (this.renderAborted) {
                    reject(new Error('Render aborted'));
                    return;
                }
                
                // Queue tiles to available workers
                let tilesQueued = 0;
                while (tileIndex < tiles.length && tilesQueued < MAX_TILES_PER_FRAME) {
                    const worker = this._getAvailableWorker();
                    if (!worker) break;
                    
                    const tile = tiles[tileIndex++];
                    this._dispatchTileToWorker(worker, tile, effectiveMaxIter);
                    tilesQueued++;
                }
                
                // Check completion
                if (completedTiles >= tiles.length) {
                    // Run glitch detection
                    if (this.config.glitchCorrection) {
                        this._runGlitchCorrection(effectiveMaxIter).then(() => {
                            this._applyColors();
                            resolve();
                        });
                    } else {
                        this._applyColors();
                        resolve();
                    }
                    return;
                }
                
                // Schedule next frame
                this.animationFrameId = requestAnimationFrame(processTiles);
            };
            
            // Handle worker completion
            this._onTileComplete = (tile, data) => {
                completedTiles++;
                this.renderStats.tilesCompleted = completedTiles;
                this.renderStats.totalPixels += tile.width * tile.height;
                
                // Copy tile data to main buffers
                this._mergeTileData(tile, data);
                
                // Update preview
                this._updateTilePreview(tile);
                
                if (this.onTileComplete) {
                    this.onTileComplete(tile, completedTiles, tiles.length);
                }
                
                if (this.onProgress) {
                    this.onProgress(completedTiles / tiles.length);
                }
            };
            
            // Start processing
            processTiles();
        });
    }
    
    /**
     * Get an available worker from the pool
     * @private
     */
    _getAvailableWorker() {
        for (const w of this.workers) {
            if (!w.busy) {
                return w;
            }
        }
        return null;
    }
    
    /**
     * Dispatch a tile to a worker for rendering
     * @private
     */
    _dispatchTileToWorker(workerInfo, tile, maxIterations) {
        workerInfo.busy = true;
        workerInfo.currentTask = tile;
        
        // Compute tile bounds in fractal space
        const topLeft = this._pixelToFractal(tile.x, tile.y);
        const bottomRight = this._pixelToFractal(tile.x + tile.width, tile.y + tile.height);
        
        const message = {
            type: 'render-tile',
            tile: {
                x: tile.x,
                y: tile.y,
                width: tile.width,
                height: tile.height,
                priority: tile.priority
            },
            viewport: {
                minX: topLeft.x,
                maxX: bottomRight.x,
                minY: topLeft.y,
                maxY: bottomRight.y
            },
            config: {
                maxIterations,
                escapeRadiusSq: this.config.escapeRadiusSq,
                precisionMode: this.precisionMode
            },
            fractal: {
                type: this.fractal?.type || 'mandelbrot',
                params: this.fractal?.getParams?.() || {}
            },
            referenceOrbit: this.precisionMode !== 'double' ? this.referenceOrbit : null
        };
        
        workerInfo.worker.postMessage(message);
    }
    
    /**
     * Handle messages from workers
     * @private
     */
    _handleWorkerMessage(workerId, event) {
        const { type, tile, data, error } = event.data;
        const workerInfo = this.workers[workerId];
        
        if (type === 'tile-complete') {
            workerInfo.busy = false;
            workerInfo.currentTask = null;
            
            if (this._onTileComplete) {
                this._onTileComplete(tile, data);
            }
        } else if (type === 'error') {
            console.error(`[Renderer2D] Worker ${workerId} error:`, error);
            workerInfo.busy = false;
            workerInfo.currentTask = null;
        }
    }
    
    /**
     * Handle worker errors
     * @private
     */
    _handleWorkerError(workerId, error) {
        console.error(`[Renderer2D] Worker ${workerId} crashed:`, error);
        this.workers[workerId].busy = false;
        
        // Attempt to recreate the worker
        try {
            this.workers[workerId].worker.terminate();
            this.workers[workerId].worker = new Worker(
                new URL('../workers/render-worker.js', import.meta.url),
                { type: 'module' }
            );
            this.workers[workerId].worker.onmessage = (e) => this._handleWorkerMessage(workerId, e);
            this.workers[workerId].worker.onerror = (e) => this._handleWorkerError(workerId, e);
        } catch (err) {
            console.error(`[Renderer2D] Failed to recreate worker ${workerId}:`, err);
        }
    }
    
    /**
     * Merge tile data into main pixel buffers
     * @private
     */
    _mergeTileData(tile, data) {
        const { width } = this.config;
        
        for (let ty = 0; ty < tile.height; ty++) {
            const srcOffset = ty * tile.width;
            const dstOffset = (tile.y + ty) * width + tile.x;
            
            for (let tx = 0; tx < tile.width; tx++) {
                const srcIdx = srcOffset + tx;
                const dstIdx = dstOffset + tx;
                
                this.pixelData.iterations[dstIdx] = data.iterations[srcIdx];
                this.pixelData.escaped[dstIdx] = data.escaped[srcIdx];
                this.pixelData.distances[dstIdx] = data.distances[srcIdx];
                this.pixelData.orbitX[dstIdx] = data.orbitX[srcIdx];
                this.pixelData.orbitY[dstIdx] = data.orbitY[srcIdx];
                this.pixelData.potential[dstIdx] = data.potential[srcIdx];
                this.pixelData.angle[dstIdx] = data.angle[srcIdx];
            }
        }
    }
    
    /**
     * Update the preview canvas with a completed tile
     * @private
     */
    _updateTilePreview(tile) {
        // Apply colors to just this tile region
        this._applyColorsToRegion(tile.x, tile.y, tile.width, tile.height);
        
        // Copy the tile region from buffer to main canvas
        this.ctx.putImageData(
            this.bufferCtx.getImageData(tile.x, tile.y, tile.width, tile.height),
            tile.x, tile.y
        );
    }
    
    // ========================================================================
    // PERTURBATION RENDERING
    // ========================================================================
    
    /**
     * Compute reference orbit for perturbation theory
     * @private
     */
    async _computeReferenceOrbit(maxIterations) {
        if (!this.perturbationEngine) {
            this.perturbationEngine = new PerturbationEngine();
        }
        
        // Use viewport center as reference point
        const { centerX, centerY } = this.viewport;
        
        // Check if we can reuse cached reference
        if (this.referenceOrbit && this.referencePoint) {
            const cx = typeof centerX === 'number' ? centerX : centerX.toString();
            const cy = typeof centerY === 'number' ? centerY : centerY.toString();
            const px = typeof this.referencePoint.x === 'number' 
                ? this.referencePoint.x : this.referencePoint.x.toString();
            const py = typeof this.referencePoint.y === 'number' 
                ? this.referencePoint.y : this.referencePoint.y.toString();
            
            if (cx === px && cy === py) {
                console.log('[Renderer2D] Reusing cached reference orbit');
                return;
            }
        }
        
        console.log('[Renderer2D] Computing reference orbit...');
        const startTime = performance.now();
        
        // Compute the reference orbit
        this.referenceOrbit = await this.perturbationEngine.computeReferenceOrbit(
            centerX,
            centerY,
            maxIterations,
            this.config.escapeRadiusSq,
            this.fractal
        );
        
        this.referencePoint = { x: centerX, y: centerY };
        
        // Apply series approximation if available
        if (this.seriesApproximation) {
            this.seriesApproximation.computeCoefficients(this.referenceOrbit);
        }
        
        console.log(`[Renderer2D] Reference orbit computed: ${this.referenceOrbit.length} iterations, ` +
                    `${(performance.now() - startTime).toFixed(1)}ms`);
    }
    
    // ========================================================================
    // SINGLE PIXEL COMPUTATION
    // ========================================================================
    
    /**
     * Compute a single pixel (main thread fallback)
     * @private
     */
    _computePixel(x, y, maxIterations, escapeRadiusSq) {
        // Use fractal's compute method if available
        if (this.fractal?.compute) {
            return this.fractal.compute(x, y, maxIterations, escapeRadiusSq);
        }
        
        // Default Mandelbrot computation
        return this._computeMandelbrot(x, y, maxIterations, escapeRadiusSq);
    }
    
    /**
     * Default Mandelbrot computation with smooth iteration count
     * @private
     */
    _computeMandelbrot(cx, cy, maxIterations, escapeRadiusSq) {
        let zx = 0, zy = 0;
        let zx2 = 0, zy2 = 0;
        let iteration = 0;
        
        // Main iteration loop with periodicity checking
        let period = 0;
        let checkX = 0, checkY = 0;
        const checkInterval = 20;
        
        while (zx2 + zy2 <= escapeRadiusSq && iteration < maxIterations) {
            zy = 2 * zx * zy + cy;
            zx = zx2 - zy2 + cx;
            zx2 = zx * zx;
            zy2 = zy * zy;
            iteration++;
            
            // Periodicity check (orbit detection)
            if (zx === checkX && zy === checkY) {
                // Found a cycle, point is in the set
                return {
                    iterations: maxIterations,
                    escaped: false,
                    orbitX: zx,
                    orbitY: zy,
                    distance: 0,
                    potential: 0,
                    angle: Math.atan2(zy, zx)
                };
            }
            
            period++;
            if (period > checkInterval) {
                period = 0;
                checkX = zx;
                checkY = zy;
            }
        }
        
        const escaped = zx2 + zy2 > escapeRadiusSq;
        
        // Smooth iteration count using potential function
        let smoothIter = iteration;
        let potential = 0;
        
        if (escaped) {
            // Normalized iteration count (Mandelbrot)
            // Uses the formula: n + 1 - log(log|z|)/log(2)
            const logZn = Math.log(zx2 + zy2) / 2;
            const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
            smoothIter = iteration + 1 - nu;
            
            // Continuous potential
            potential = Math.log(Math.sqrt(zx2 + zy2));
        }
        
        // Distance estimation for external points
        // Using the formula: d = |z| * log|z| / |z'|
        // Simplified version without derivative tracking
        const distance = escaped 
            ? Math.sqrt(zx2 + zy2) * Math.log(Math.sqrt(zx2 + zy2)) / (iteration + 1)
            : 0;
        
        return {
            iterations: smoothIter,
            escaped,
            orbitX: zx,
            orbitY: zy,
            distance,
            potential,
            angle: Math.atan2(zy, zx)
        };
    }
    
    // ========================================================================
    // GLITCH CORRECTION
    // ========================================================================
    
    /**
     * Run glitch detection and correction pass
     * @private
     */
    async _runGlitchCorrection(maxIterations) {
        if (!this.glitchDetector) return;
        
        console.log('[Renderer2D] Running glitch detection...');
        
        const glitches = this.glitchDetector.detect(this.pixelData, this.config);
        this.renderStats.glitchesDetected = glitches.length;
        
        if (glitches.length === 0) {
            console.log('[Renderer2D] No glitches detected');
            return;
        }
        
        console.log(`[Renderer2D] Detected ${glitches.length} glitches, correcting...`);
        
        // Re-render glitched regions with higher precision
        for (const glitch of glitches) {
            if (this.renderAborted) break;
            
            const corrected = await this.glitchDetector.correct(
                glitch,
                this.pixelData,
                this.viewport,
                maxIterations * 2,  // Double iterations for correction
                this.config.escapeRadiusSq
            );
            
            if (corrected) {
                this.renderStats.glitchesCorrected++;
            }
        }
        
        console.log(`[Renderer2D] Corrected ${this.renderStats.glitchesCorrected} glitches`);
    }
    
    // ========================================================================
    // COLORING
    // ========================================================================
    
    /**
     * Apply colors to all pixels
     * @private
     */
    _applyColors() {
        this._applyColorsToRegion(0, 0, this.config.width, this.config.height);
    }
    
    /**
     * Apply colors to a specific region
     * @private
     */
    _applyColorsToRegion(startX, startY, regionWidth, regionHeight) {
        const { width, height } = this.config;
        const imageData = this.imageData;
        const data = imageData.data;
        
        for (let y = startY; y < startY + regionHeight && y < height; y++) {
            for (let x = startX; x < startX + regionWidth && x < width; x++) {
                const idx = y * width + x;
                const pixelIdx = idx * 4;
                
                const iter = this.pixelData.iterations[idx];
                const escaped = this.pixelData.escaped[idx];
                
                if (escaped === 0) {
                    // Interior (in set) - black
                    data[pixelIdx] = 0;
                    data[pixelIdx + 1] = 0;
                    data[pixelIdx + 2] = 0;
                    data[pixelIdx + 3] = 255;
                } else if (this.colorLUT) {
                    // Use color lookup table
                    const lutIdx = (Math.floor(iter) % 256) * 4;
                    data[pixelIdx] = this.colorLUT[lutIdx];
                    data[pixelIdx + 1] = this.colorLUT[lutIdx + 1];
                    data[pixelIdx + 2] = this.colorLUT[lutIdx + 2];
                    data[pixelIdx + 3] = 255;
                } else {
                    // Default coloring (HSL based on iteration)
                    const hue = (iter * 3.5) % 360;
                    const rgb = this._hslToRgb(hue / 360, 0.8, 0.5);
                    data[pixelIdx] = rgb.r;
                    data[pixelIdx + 1] = rgb.g;
                    data[pixelIdx + 2] = rgb.b;
                    data[pixelIdx + 3] = 255;
                }
            }
        }
        
        // Put to buffer canvas
        this.bufferCtx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Convert HSL to RGB
     * @private
     */
    _hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    /**
     * Swap buffer to main canvas
     * @private
     */
    _swapBuffers() {
        this.ctx.drawImage(this.bufferCanvas, 0, 0);
    }
    
    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    /**
     * Dispose of all resources
     */
    dispose() {
        this.abort();
        
        // Terminate all workers
        this.workers.forEach(w => w.worker.terminate());
        this.workers = [];
        
        // Clear buffers
        this.pixelData = null;
        this.imageData = null;
        this.referenceOrbit = null;
        
        console.log('[Renderer2D] Disposed');
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Renderer2D;
