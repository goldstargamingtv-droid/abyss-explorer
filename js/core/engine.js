/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                         ABYSS EXPLORER - RENDER ENGINE                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Main rendering coordinator for 2D and 3D fractal visualization               ║
 * ║                                                                                ║
 * ║  Responsibilities:                                                             ║
 * ║  - Orchestrate 2D/3D rendering mode switching                                 ║
 * ║  - Manage render loop and frame timing                                        ║
 * ║  - Coordinate with Web Workers for parallel computation                       ║
 * ║  - Handle progressive/tiled rendering                                         ║
 * ║  - Process user interactions (pan, zoom, camera)                              ║
 * ║  - Manage render queue and cancellation                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Config } from '../config.js';
import { Logger } from '../utils/logger.js';

// Renderers (to be implemented)
import { Renderer2D } from '../rendering/renderer2d.js';
import { Renderer3D } from '../rendering/renderer3d.js';
import { OverlayRenderer } from '../rendering/overlay.js';

// Camera controllers
import { Camera2D } from '../camera/camera2d.js';
import { Camera3D } from '../camera/camera3d.js';

// Interaction handlers
import { InteractionHandler } from '../interaction/handler.js';

// =============================================================================
// ENGINE CLASS
// =============================================================================

/**
 * Main Rendering Engine
 * 
 * Coordinates all rendering operations, managing the render loop,
 * worker delegation, and switching between 2D and 3D modes.
 * 
 * @class Engine
 */
export class Engine {
    /**
     * Create the rendering engine
     * 
     * @param {Object} options - Engine configuration
     * @param {HTMLCanvasElement} options.canvas2d - 2D rendering canvas
     * @param {HTMLCanvasElement} options.canvas3d - 3D rendering canvas (WebGL)
     * @param {HTMLCanvasElement} options.canvasOverlay - Overlay canvas for UI
     * @param {State} options.state - State management instance
     * @param {WorkerManager} options.workers - Web Worker pool
     * @param {PerformanceMonitor} options.performance - Performance monitor
     * @param {EventBus} options.events - Event bus for communication
     */
    constructor(options) {
        // =================================================================
        // Dependencies
        // =================================================================
        
        /** @type {State} */
        this.state = options.state;
        
        /** @type {WorkerManager} */
        this.workers = options.workers;
        
        /** @type {PerformanceMonitor} */
        this.performance = options.performance;
        
        /** @type {EventBus} */
        this.events = options.events;
        
        /** @type {Logger} */
        this.logger = new Logger('Engine');

        // =================================================================
        // Canvas Elements
        // =================================================================
        
        /** @type {HTMLCanvasElement} */
        this.canvas2d = options.canvas2d;
        
        /** @type {HTMLCanvasElement} */
        this.canvas3d = options.canvas3d;
        
        /** @type {HTMLCanvasElement} */
        this.canvasOverlay = options.canvasOverlay;

        // =================================================================
        // Rendering Contexts
        // =================================================================
        
        /** @type {CanvasRenderingContext2D|null} */
        this.ctx2d = null;
        
        /** @type {WebGL2RenderingContext|WebGLRenderingContext|null} */
        this.gl = null;
        
        /** @type {CanvasRenderingContext2D|null} */
        this.ctxOverlay = null;

        // =================================================================
        // Renderers
        // =================================================================
        
        /** @type {Renderer2D|null} */
        this.renderer2d = null;
        
        /** @type {Renderer3D|null} */
        this.renderer3d = null;
        
        /** @type {OverlayRenderer|null} */
        this.overlay = null;

        // =================================================================
        // Cameras
        // =================================================================
        
        /** @type {Camera2D|null} */
        this.camera2d = null;
        
        /** @type {Camera3D|null} */
        this.camera3d = null;

        // =================================================================
        // Interaction
        // =================================================================
        
        /** @type {InteractionHandler|null} */
        this.interaction = null;

        // =================================================================
        // Engine State
        // =================================================================
        
        /** @type {'2d'|'3d'} Current rendering mode */
        this.mode = '2d';
        
        /** @type {boolean} Whether engine is initialized */
        this.initialized = false;
        
        /** @type {boolean} Whether currently rendering */
        this.rendering = false;
        
        /** @type {boolean} Whether engine is paused */
        this.paused = false;
        
        /** @type {number|null} Current animation frame ID */
        this.animationFrameId = null;
        
        /** @type {AbortController|null} For cancelling renders */
        this.abortController = null;

        // =================================================================
        // Render Queue
        // =================================================================
        
        /** @type {Object|null} Pending render request */
        this.pendingRender = null;
        
        /** @type {number|null} Render debounce timeout */
        this.renderDebounceTimeout = null;
        
        /** @type {number} Last render timestamp */
        this.lastRenderTime = 0;

        // =================================================================
        // Dimensions
        // =================================================================
        
        /** @type {number} Canvas width */
        this.width = 0;
        
        /** @type {number} Canvas height */
        this.height = 0;
        
        /** @type {number} Device pixel ratio */
        this.dpr = 1;

        // =================================================================
        // Render Statistics
        // =================================================================
        
        /** @type {Object} Current render statistics */
        this.stats = {
            renderTime: 0,
            tileCount: 0,
            tilesRendered: 0,
            iterations: 0,
            pixelsComputed: 0,
            progressivePass: 0
        };

        // Bind methods for event handlers
        this._onStateChange = this._onStateChange.bind(this);
        this._renderLoop = this._renderLoop.bind(this);
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Initialize the rendering engine
     * 
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        this.logger.info('Initializing rendering engine...');

        try {
            // Initialize canvas contexts
            this._initContexts();

            // Set up dimensions
            this.resize();

            // Initialize cameras
            this._initCameras();

            // Initialize renderers
            await this._initRenderers();

            // Initialize overlay
            this._initOverlay();

            // Initialize interaction handler
            this._initInteraction();

            // Subscribe to state changes
            this.events.on('state:changed', this._onStateChange);

            // Set initial mode
            this.setMode(Config.ui.defaultMode);

            this.initialized = true;
            this.logger.info('Engine initialized successfully');

        } catch (error) {
            this.logger.error('Engine initialization failed', error);
            throw error;
        }
    }

    /**
     * Initialize canvas rendering contexts
     * @private
     */
    _initContexts() {
        // 2D context
        this.ctx2d = this.canvas2d.getContext('2d', {
            alpha: false,
            desynchronized: true // Reduce latency
        });

        if (!this.ctx2d) {
            throw new Error('Failed to get 2D canvas context');
        }

        // Overlay context
        this.ctxOverlay = this.canvasOverlay.getContext('2d', {
            alpha: true
        });

        // WebGL context for 3D
        if (Config.capabilities.webgl2) {
            this.gl = this.canvas3d.getContext('webgl2', {
                alpha: false,
                antialias: false,
                preserveDrawingBuffer: true,
                powerPreference: 'high-performance'
            });
            this.logger.info('Using WebGL2 context');
        } else if (Config.capabilities.webgl) {
            this.gl = this.canvas3d.getContext('webgl', {
                alpha: false,
                antialias: false,
                preserveDrawingBuffer: true
            });
            this.logger.info('Using WebGL1 context');
        }

        if (!this.gl) {
            this.logger.warn('WebGL not available, 3D mode disabled');
            Config.features.mode3D = false;
        }
    }

    /**
     * Initialize camera controllers
     * @private
     */
    _initCameras() {
        // 2D camera
        this.camera2d = new Camera2D({
            width: this.width,
            height: this.height,
            state: this.state,
            events: this.events
        });

        // 3D camera (only if WebGL available)
        if (this.gl) {
            this.camera3d = new Camera3D({
                width: this.width,
                height: this.height,
                state: this.state,
                events: this.events,
                fov: Config.rendering3D.fov
            });
        }
    }

    /**
     * Initialize renderers
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _initRenderers() {
        // 2D renderer
        this.renderer2d = new Renderer2D({
            canvas: this.canvas2d,
            ctx: this.ctx2d,
            state: this.state,
            workers: this.workers,
            camera: this.camera2d,
            events: this.events
        });
        await this.renderer2d.init();

        // 3D renderer (only if WebGL available)
        if (this.gl) {
            this.renderer3d = new Renderer3D({
                canvas: this.canvas3d,
                gl: this.gl,
                state: this.state,
                camera: this.camera3d,
                events: this.events
            });
            await this.renderer3d.init();
        }
    }

    /**
     * Initialize overlay renderer
     * @private
     */
    _initOverlay() {
        this.overlay = new OverlayRenderer({
            canvas: this.canvasOverlay,
            ctx: this.ctxOverlay,
            state: this.state,
            events: this.events
        });
    }

    /**
     * Initialize interaction handler
     * @private
     */
    _initInteraction() {
        this.interaction = new InteractionHandler({
            element: this.canvas2d.parentElement,
            engine: this,
            state: this.state,
            events: this.events
        });
    }

    // =========================================================================
    // RENDERING
    // =========================================================================

    /**
     * Request a render
     * 
     * Debounces rapid requests and manages render queue.
     * 
     * @param {Object} [options] - Render options
     * @param {boolean} [options.immediate=false] - Skip debounce
     * @param {boolean} [options.progressive=true] - Use progressive rendering
     * @param {boolean} [options.highQuality=false] - Force high quality
     * @returns {Promise<void>}
     */
    async render(options = {}) {
        const {
            immediate = false,
            progressive = Config.rendering.progressiveRendering,
            highQuality = false
        } = options;

        // Store pending render
        this.pendingRender = { progressive, highQuality };

        // Immediate render
        if (immediate) {
            return this._executeRender();
        }

        // Debounced render
        if (this.renderDebounceTimeout) {
            clearTimeout(this.renderDebounceTimeout);
        }

        return new Promise((resolve) => {
            this.renderDebounceTimeout = setTimeout(async () => {
                await this._executeRender();
                resolve();
            }, Config.performance.renderDebounce);
        });
    }

    /**
     * Execute the actual render
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _executeRender() {
        if (this.paused || !this.initialized) return;
        if (!this.pendingRender) return;

        const options = this.pendingRender;
        this.pendingRender = null;

        // Cancel any ongoing render
        this.cancelRender();

        // Create new abort controller
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        // Mark as rendering
        this.rendering = true;
        this.events.emit('render:start');

        const startTime = performance.now();

        try {
            // Get current renderer based on mode
            const renderer = this.mode === '3d' ? this.renderer3d : this.renderer2d;
            
            if (!renderer) {
                throw new Error(`Renderer not available for mode: ${this.mode}`);
            }

            // Execute render
            await renderer.render({
                ...options,
                signal,
                onProgress: (progress) => {
                    this.stats.progressivePass = progress.pass;
                    this.stats.tilesRendered = progress.tilesRendered;
                    this.events.emit('render:progress', progress);
                }
            });

            // Update statistics
            this.stats.renderTime = performance.now() - startTime;
            this.lastRenderTime = Date.now();

            // Update overlay
            this.overlay?.render();

            this.events.emit('render:complete', {
                time: this.stats.renderTime,
                mode: this.mode
            });

            this.logger.debug(`Render complete in ${this.stats.renderTime.toFixed(1)}ms`);

        } catch (error) {
            if (error.name === 'AbortError') {
                this.logger.debug('Render cancelled');
                this.events.emit('render:cancelled');
            } else {
                this.logger.error('Render failed', error);
                this.events.emit('render:error', { error });
            }
        } finally {
            this.rendering = false;
            this.abortController = null;
        }
    }

    /**
     * Cancel ongoing render
     */
    cancelRender() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // Cancel worker tasks
        this.workers?.cancelAll();

        // Cancel renderer
        if (this.mode === '3d') {
            this.renderer3d?.cancel();
        } else {
            this.renderer2d?.cancel();
        }
    }

    /**
     * Start continuous render loop (for 3D/animations)
     * @private
     */
    _startRenderLoop() {
        if (this.animationFrameId) return;

        const loop = (timestamp) => {
            if (this.paused) {
                this.animationFrameId = requestAnimationFrame(loop);
                return;
            }

            // Update performance monitor
            this.performance?.beginFrame();

            // Render frame
            this._renderFrame(timestamp);

            // End frame
            this.performance?.endFrame();

            // Continue loop
            this.animationFrameId = requestAnimationFrame(loop);
        };

        this.animationFrameId = requestAnimationFrame(loop);
    }

    /**
     * Stop render loop
     * @private
     */
    _stopRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Render a single frame (for animations/3D)
     * @private
     * @param {number} timestamp
     */
    _renderFrame(timestamp) {
        if (this.mode === '3d' && this.renderer3d) {
            this.renderer3d.renderFrame(timestamp);
        }
    }

    /**
     * Render loop callback for 3D mode
     * @private
     */
    _renderLoop() {
        if (!this.animationFrameId) return;

        this.performance?.beginFrame();

        if (this.mode === '3d' && this.renderer3d) {
            this.renderer3d.renderFrame();
        }

        this.performance?.endFrame();

        this.animationFrameId = requestAnimationFrame(this._renderLoop);
    }

    // =========================================================================
    // MODE SWITCHING
    // =========================================================================

    /**
     * Set rendering mode
     * 
     * @param {'2d'|'3d'} mode - Target mode
     */
    setMode(mode) {
        if (mode !== '2d' && mode !== '3d') {
            this.logger.warn(`Invalid mode: ${mode}`);
            return;
        }

        if (mode === '3d' && !this.renderer3d) {
            this.logger.warn('3D mode not available');
            return;
        }

        const previousMode = this.mode;
        this.mode = mode;

        // Stop render loop when leaving 3D
        if (previousMode === '3d') {
            this._stopRenderLoop();
        }

        // Update canvas visibility
        this._updateCanvasVisibility();

        // Start render loop for 3D
        if (mode === '3d') {
            this._startRenderLoop();
        }

        // Trigger re-render
        this.render({ immediate: true });

        this.events.emit('engine:modeChanged', { mode, previousMode });
        this.logger.info(`Switched to ${mode.toUpperCase()} mode`);
    }

    /**
     * Update canvas visibility based on mode
     * @private
     */
    _updateCanvasVisibility() {
        if (this.mode === '2d') {
            this.canvas2d.classList.add('active');
            this.canvas3d.classList.remove('active');
        } else {
            this.canvas2d.classList.remove('active');
            this.canvas3d.classList.add('active');
        }
    }

    // =========================================================================
    // NAVIGATION
    // =========================================================================

    /**
     * Get current camera
     * @returns {Camera2D|Camera3D}
     */
    get camera() {
        return this.mode === '3d' ? this.camera3d : this.camera2d;
    }

    /**
     * Zoom in or out
     * 
     * @param {number} factor - Zoom factor (>1 = zoom in, <1 = zoom out)
     * @param {Object} [center] - Zoom center point (screen coordinates)
     * @param {number} center.x
     * @param {number} center.y
     */
    zoom(factor, center) {
        const camera = this.camera;
        
        if (center) {
            camera.zoomAt(factor, center.x, center.y);
        } else {
            camera.zoom(factor);
        }

        this.render();
    }

    /**
     * Pan the view
     * 
     * @param {number} dx - Horizontal pan (in view fraction, -1 to 1)
     * @param {number} dy - Vertical pan (in view fraction, -1 to 1)
     */
    pan(dx, dy) {
        this.camera.pan(dx, dy);
        this.render();
    }

    /**
     * Pan to a specific screen position
     * 
     * @param {number} x - Screen X coordinate
     * @param {number} y - Screen Y coordinate
     */
    panTo(x, y) {
        this.camera.panTo(x, y);
        this.render();
    }

    /**
     * Reset view to default
     */
    resetView() {
        const fractalConfig = Config.getFractalConfig(
            this.state.getFractalType(),
            this.mode
        );

        if (fractalConfig) {
            this.state.setView({
                centerX: fractalConfig.defaultCenter.x,
                centerY: fractalConfig.defaultCenter.y,
                zoom: fractalConfig.defaultZoom
            });
        } else {
            this.state.setView({
                centerX: Config.fractal.defaultCenter.x,
                centerY: Config.fractal.defaultCenter.y,
                zoom: Config.fractal.defaultZoom
            });
        }

        this.render({ immediate: true });
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    /**
     * Handle wheel events (zoom)
     * @param {WheelEvent} event
     */
    handleWheel(event) {
        if (this.paused) return;

        const rect = this.canvas2d.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Calculate zoom factor based on wheel delta
        const delta = -event.deltaY;
        const factor = delta > 0 ? Config.interaction.zoomFactor : 1 / Config.interaction.zoomFactor;

        this.zoom(factor, { x, y });
    }

    /**
     * Handle state changes
     * @private
     * @param {Object} data
     */
    _onStateChange(data) {
        // Re-render if fractal parameters changed
        if (data.requiresRender) {
            this.render();
        }
    }

    // =========================================================================
    // RESIZE
    // =========================================================================

    /**
     * Handle canvas resize
     * 
     * Updates canvas dimensions and triggers re-render.
     */
    resize() {
        const container = this.canvas2d.parentElement;
        if (!container) return;

        // Get container dimensions
        const rect = container.getBoundingClientRect();
        this.width = Math.floor(rect.width);
        this.height = Math.floor(rect.height);

        // Get device pixel ratio
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Resize all canvases
        this._resizeCanvas(this.canvas2d, this.width, this.height, this.dpr);
        this._resizeCanvas(this.canvas3d, this.width, this.height, this.dpr);
        this._resizeCanvas(this.canvasOverlay, this.width, this.height, this.dpr);

        // Update cameras
        this.camera2d?.resize(this.width, this.height);
        this.camera3d?.resize(this.width, this.height);

        // Update renderers
        this.renderer2d?.resize(this.width, this.height, this.dpr);
        this.renderer3d?.resize(this.width, this.height, this.dpr);
        this.overlay?.resize(this.width, this.height);

        this.logger.debug(`Resized to ${this.width}×${this.height} @ ${this.dpr}x`);

        // Trigger re-render
        if (this.initialized) {
            this.render({ immediate: true });
        }

        this.events.emit('engine:resize', {
            width: this.width,
            height: this.height,
            dpr: this.dpr
        });
    }

    /**
     * Resize a canvas element
     * @private
     * @param {HTMLCanvasElement} canvas
     * @param {number} width
     * @param {number} height
     * @param {number} dpr
     */
    _resizeCanvas(canvas, width, height, dpr) {
        if (!canvas) return;

        // Set display size
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Set actual size (accounting for DPR)
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
    }

    // =========================================================================
    // EXPORT
    // =========================================================================

    /**
     * Take a screenshot
     * 
     * @param {Object} [options] - Screenshot options
     * @param {number} [options.width] - Output width
     * @param {number} [options.height] - Output height
     * @param {string} [options.format='png'] - Image format
     * @param {number} [options.quality=0.92] - JPEG/WebP quality
     * @returns {Promise<Blob>}
     */
    async screenshot(options = {}) {
        const {
            width = this.width,
            height = this.height,
            format = 'png',
            quality = 0.92
        } = options;

        const renderer = this.mode === '3d' ? this.renderer3d : this.renderer2d;
        
        if (!renderer) {
            throw new Error('No renderer available');
        }

        return renderer.export({ width, height, format, quality });
    }

    // =========================================================================
    // LIFECYCLE
    // =========================================================================

    /**
     * Pause the engine
     */
    pause() {
        this.paused = true;
        this.cancelRender();
        this.logger.debug('Engine paused');
    }

    /**
     * Resume the engine
     */
    resume() {
        this.paused = false;
        
        // Resume render loop if in 3D mode
        if (this.mode === '3d' && !this.animationFrameId) {
            this._startRenderLoop();
        }
        
        this.logger.debug('Engine resumed');
    }

    /**
     * Dispose of engine resources
     */
    dispose() {
        this.logger.info('Disposing engine...');

        // Stop render loop
        this._stopRenderLoop();

        // Cancel pending renders
        this.cancelRender();

        // Unsubscribe from events
        this.events.off('state:changed', this._onStateChange);

        // Dispose renderers
        this.renderer2d?.dispose();
        this.renderer3d?.dispose();
        this.overlay?.dispose();

        // Dispose cameras
        this.camera2d?.dispose();
        this.camera3d?.dispose();

        // Dispose interaction handler
        this.interaction?.dispose();

        // Clear references
        this.ctx2d = null;
        this.gl = null;
        this.ctxOverlay = null;

        this.initialized = false;
        this.logger.info('Engine disposed');
    }

    // =========================================================================
    // DEBUG
    // =========================================================================

    /**
     * Get engine statistics
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            mode: this.mode,
            rendering: this.rendering,
            paused: this.paused,
            dimensions: {
                width: this.width,
                height: this.height,
                dpr: this.dpr
            }
        };
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default Engine;
