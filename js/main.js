/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                         ABYSS EXPLORER - MAIN ENTRY POINT                     ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Application bootstrap, initialization, and global event coordination         ║
 * ║                                                                                ║
 * ║  Responsibilities:                                                             ║
 * ║  - Initialize all core systems on DOM ready                                   ║
 * ║  - Set up global event listeners                                              ║
 * ║  - Handle mode switching (2D/3D)                                              ║
 * ║  - Manage theme toggling                                                      ║
 * ║  - Parse and apply URL state                                                  ║
 * ║  - Coordinate between Engine, State, and UI managers                          ║
 * ║  - Handle errors gracefully with user feedback                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Config } from './config.js';
import { Engine } from './core/engine.js';
import { State } from './core/state.js';
import { PerformanceMonitor } from './core/performance.js';
import { WorkerManager } from './core/webworker-manager.js';

// UI Managers (to be implemented)
import { UIManager } from './ui/ui-manager.js';
import { SidebarManager } from './ui/sidebar.js';
import { ModalManager } from './ui/modals.js';
import { ToastManager } from './ui/toast.js';
import { HUDManager } from './ui/hud.js';

// Utilities
import { URLStateManager } from './utils/url-state.js';
import { StorageManager } from './utils/storage.js';
import { EventBus } from './utils/event-bus.js';
import { Logger } from './utils/logger.js';

// =============================================================================
// APPLICATION CLASS
// =============================================================================

/**
 * Main Application Controller
 * 
 * Singleton class that bootstraps and coordinates all application systems.
 * Acts as the central hub connecting rendering engine, state management,
 * UI components, and user interactions.
 * 
 * @class App
 */
class App {
    /**
     * Singleton instance
     * @type {App|null}
     * @private
     */
    static #instance = null;

    /**
     * Get the singleton App instance
     * @returns {App}
     */
    static getInstance() {
        if (!App.#instance) {
            App.#instance = new App();
        }
        return App.#instance;
    }

    /**
     * Create the application instance
     * @private - Use App.getInstance() instead
     */
    constructor() {
        if (App.#instance) {
            throw new Error('App is a singleton. Use App.getInstance()');
        }

        // =================================================================
        // Core Systems (initialized in init())
        // =================================================================
        
        /** @type {Engine|null} Main rendering engine */
        this.engine = null;
        
        /** @type {State|null} Centralized state management */
        this.state = null;
        
        /** @type {PerformanceMonitor|null} Performance tracking */
        this.performance = null;
        
        /** @type {WorkerManager|null} Web Worker pool */
        this.workers = null;

        // =================================================================
        // UI Managers
        // =================================================================
        
        /** @type {UIManager|null} Main UI coordinator */
        this.ui = null;
        
        /** @type {SidebarManager|null} Sidebar controls */
        this.sidebar = null;
        
        /** @type {ModalManager|null} Modal dialogs */
        this.modals = null;
        
        /** @type {ToastManager|null} Toast notifications */
        this.toasts = null;
        
        /** @type {HUDManager|null} HUD overlays */
        this.hud = null;

        // =================================================================
        // Utilities
        // =================================================================
        
        /** @type {URLStateManager|null} URL state sync */
        this.urlState = null;
        
        /** @type {StorageManager|null} Local storage manager */
        this.storage = null;
        
        /** @type {EventBus} Global event bus */
        this.events = new EventBus();
        
        /** @type {Logger} Application logger */
        this.logger = new Logger('App');

        // =================================================================
        // Application State
        // =================================================================
        
        /** @type {boolean} Whether app is fully initialized */
        this.initialized = false;
        
        /** @type {boolean} Whether app is currently rendering */
        this.rendering = false;
        
        /** @type {'2d'|'3d'} Current rendering mode */
        this.mode = '2d';
        
        /** @type {'dark'|'light'|'midnight'|'forest'} Current theme */
        this.theme = 'dark';
        
        /** @type {AbortController|null} For cancelling ongoing operations */
        this.abortController = null;

        // =================================================================
        // DOM Element References
        // =================================================================
        
        /** @type {Object} Cached DOM element references */
        this.elements = {
            app: null,
            canvasContainer: null,
            canvas2d: null,
            canvas3d: null,
            canvasOverlay: null,
            header: null,
            sidebar: null,
            loadingScreen: null,
            loadingProgress: null,
            loadingStatus: null
        };

        // Bind methods that are used as event handlers
        this._onResize = this._onResize.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onHashChange = this._onHashChange.bind(this);
        this._onVisibilityChange = this._onVisibilityChange.bind(this);
        this._onBeforeUnload = this._onBeforeUnload.bind(this);
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Initialize the application
     * 
     * This is the main entry point called after DOM is ready.
     * Sets up all systems in the correct order with proper error handling.
     * 
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        const startTime = performance.now();
        this.logger.info('Initializing Abyss Explorer...');

        try {
            // Phase 1: Cache DOM elements
            this._updateLoadingStatus('Caching DOM elements...');
            this._cacheElements();
            this._updateLoadingProgress(5);

            // Phase 2: Check browser capabilities
            this._updateLoadingStatus('Checking capabilities...');
            await this._checkCapabilities();
            this._updateLoadingProgress(10);

            // Phase 3: Initialize storage
            this._updateLoadingStatus('Loading saved data...');
            this.storage = new StorageManager();
            await this.storage.init();
            this._updateLoadingProgress(15);

            // Phase 4: Load configuration
            this._updateLoadingStatus('Loading configuration...');
            await this._loadConfiguration();
            this._updateLoadingProgress(20);

            // Phase 5: Initialize Web Workers
            this._updateLoadingStatus('Starting workers...');
            this.workers = new WorkerManager(Config.performance.workerCount);
            await this.workers.init();
            this._updateLoadingProgress(30);

            // Phase 6: Initialize state management
            this._updateLoadingStatus('Initializing state...');
            this.state = new State(this.events, this.storage);
            await this.state.init();
            this._updateLoadingProgress(40);

            // Phase 7: Initialize performance monitor
            this._updateLoadingStatus('Setting up monitoring...');
            this.performance = new PerformanceMonitor(this.events);
            this._updateLoadingProgress(45);

            // Phase 8: Initialize rendering engine
            this._updateLoadingStatus('Initializing render engine...');
            this.engine = new Engine({
                canvas2d: this.elements.canvas2d,
                canvas3d: this.elements.canvas3d,
                canvasOverlay: this.elements.canvasOverlay,
                state: this.state,
                workers: this.workers,
                performance: this.performance,
                events: this.events
            });
            await this.engine.init();
            this._updateLoadingProgress(60);

            // Phase 9: Initialize UI managers
            this._updateLoadingStatus('Building UI...');
            await this._initializeUI();
            this._updateLoadingProgress(80);

            // Phase 10: Set up event listeners
            this._updateLoadingStatus('Setting up events...');
            this._setupEventListeners();
            this._updateLoadingProgress(85);

            // Phase 11: Load URL state or defaults
            this._updateLoadingStatus('Loading view state...');
            this.urlState = new URLStateManager(this.state);
            await this._loadInitialState();
            this._updateLoadingProgress(90);

            // Phase 12: Apply theme
            this._updateLoadingStatus('Applying theme...');
            this._applyTheme(this.theme);
            this._updateLoadingProgress(95);

            // Phase 13: Initial render
            this._updateLoadingStatus('Rendering fractal...');
            await this.engine.render();
            this._updateLoadingProgress(100);

            // Mark as initialized
            this.initialized = true;

            // Hide loading screen with animation
            await this._hideLoadingScreen();

            // Calculate and log initialization time
            const elapsed = performance.now() - startTime;
            this.logger.info(`Initialization complete in ${elapsed.toFixed(0)}ms`);

            // Emit ready event
            this.events.emit('app:ready', { initTime: elapsed });

            // Log welcome message to console
            this._logWelcome();

        } catch (error) {
            this._handleInitError(error);
        }
    }

    /**
     * Cache DOM element references for quick access
     * @private
     */
    _cacheElements() {
        this.elements = {
            app: document.querySelector('.app-container'),
            canvasContainer: document.querySelector('.canvas-container'),
            canvas2d: document.getElementById('fractal-canvas-2d'),
            canvas3d: document.getElementById('fractal-canvas-3d'),
            canvasOverlay: document.getElementById('overlay-canvas'),
            header: document.querySelector('.header'),
            sidebar: document.querySelector('.sidebar'),
            loadingScreen: document.getElementById('loading-screen'),
            loadingProgress: document.querySelector('.loading-progress-bar'),
            loadingStatus: document.querySelector('.loading-status')
        };

        // Validate critical elements exist
        const critical = ['app', 'canvasContainer', 'canvas2d'];
        for (const key of critical) {
            if (!this.elements[key]) {
                throw new Error(`Critical element missing: ${key}`);
            }
        }
    }

    /**
     * Check browser capabilities and warn about missing features
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _checkCapabilities() {
        const capabilities = {
            webgl2: false,
            webgl: false,
            workers: false,
            bigint: false,
            sharedArrayBuffer: false,
            offscreenCanvas: false,
            wasm: false
        };

        // Check WebGL2 support
        try {
            const testCanvas = document.createElement('canvas');
            capabilities.webgl2 = !!testCanvas.getContext('webgl2');
            capabilities.webgl = capabilities.webgl2 || !!testCanvas.getContext('webgl');
        } catch (e) {
            this.logger.warn('WebGL detection failed', e);
        }

        // Check Web Workers
        capabilities.workers = typeof Worker !== 'undefined';

        // Check BigInt (for deep zoom)
        capabilities.bigint = typeof BigInt !== 'undefined';

        // Check SharedArrayBuffer (for multi-threading)
        capabilities.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

        // Check OffscreenCanvas (for worker rendering)
        capabilities.offscreenCanvas = typeof OffscreenCanvas !== 'undefined';

        // Check WebAssembly
        capabilities.wasm = typeof WebAssembly !== 'undefined';

        // Store capabilities
        Config.capabilities = capabilities;

        // Log capabilities
        this.logger.info('Browser capabilities:', capabilities);

        // Warn about critical missing features
        if (!capabilities.webgl) {
            this.toasts?.warning(
                'WebGL not supported',
                '3D mode and GPU acceleration will be unavailable.'
            );
        }

        if (!capabilities.workers) {
            throw new Error('Web Workers are required but not supported in this browser.');
        }

        if (!capabilities.bigint) {
            this.logger.warn('BigInt not supported - deep zoom precision limited');
        }
    }

    /**
     * Load configuration from storage or use defaults
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _loadConfiguration() {
        try {
            const savedConfig = await this.storage.get('config');
            if (savedConfig) {
                // Merge saved config with defaults (defaults take precedence for new options)
                Object.assign(Config, { ...Config, ...savedConfig });
                this.logger.info('Loaded saved configuration');
            }
        } catch (error) {
            this.logger.warn('Failed to load saved config, using defaults', error);
        }

        // Apply configuration
        this.mode = Config.ui.defaultMode;
        this.theme = Config.ui.defaultTheme;
    }

    /**
     * Initialize all UI manager instances
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _initializeUI() {
        // Create toast manager first (needed for error messages)
        this.toasts = new ToastManager();

        // Create other UI managers
        this.ui = new UIManager(this);
        this.sidebar = new SidebarManager(this);
        this.modals = new ModalManager(this);
        this.hud = new HUDManager(this);

        // Initialize all managers
        await Promise.all([
            this.ui.init(),
            this.sidebar.init(),
            this.modals.init(),
            this.hud.init()
        ]);
    }

    /**
     * Load initial state from URL hash or defaults
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _loadInitialState() {
        // Try to parse URL hash
        if (window.location.hash) {
            try {
                const success = await this.urlState.loadFromHash();
                if (success) {
                    this.logger.info('Loaded state from URL');
                    return;
                }
            } catch (error) {
                this.logger.warn('Failed to parse URL state', error);
            }
        }

        // Load default state
        this.state.setFractal(Config.fractal.defaultType);
        this.state.setView({
            centerX: Config.fractal.defaultCenter.x,
            centerY: Config.fractal.defaultCenter.y,
            zoom: Config.fractal.defaultZoom
        });
    }

    // =========================================================================
    // EVENT LISTENERS
    // =========================================================================

    /**
     * Set up all global event listeners
     * @private
     */
    _setupEventListeners() {
        // Window events
        window.addEventListener('resize', this._onResize, { passive: true });
        window.addEventListener('hashchange', this._onHashChange);
        window.addEventListener('beforeunload', this._onBeforeUnload);
        document.addEventListener('visibilitychange', this._onVisibilityChange);

        // Keyboard events
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);

        // Prevent context menu on canvas (we have our own)
        this.elements.canvasContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Global wheel event for zoom (with passive: false to allow preventDefault)
        this.elements.canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.engine?.handleWheel(e);
        }, { passive: false });

        // State change listeners
        this.events.on('state:changed', (data) => {
            this._onStateChange(data);
        });

        // Render events
        this.events.on('render:start', () => {
            this.rendering = true;
            this.elements.canvasContainer.classList.add('rendering');
        });

        this.events.on('render:complete', () => {
            this.rendering = false;
            this.elements.canvasContainer.classList.remove('rendering');
        });

        // Error events
        this.events.on('error', (error) => {
            this._handleRuntimeError(error);
        });
    }

    /**
     * Handle window resize
     * @private
     * @param {Event} _event - Resize event (unused)
     */
    _onResize(_event) {
        // Debounce resize handling
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }

        this._resizeTimeout = setTimeout(() => {
            this.engine?.resize();
            this.hud?.updateLayout();
            this.events.emit('app:resize', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 100);
    }

    /**
     * Handle keydown events
     * @private
     * @param {KeyboardEvent} event
     */
    _onKeyDown(event) {
        // Ignore if typing in an input
        if (this._isInputFocused()) return;

        // Check for modal escape
        if (event.key === 'Escape') {
            if (this.modals?.hasOpenModal()) {
                this.modals.closeTopModal();
                return;
            }
        }

        // Emit keyboard event for other handlers
        this.events.emit('keyboard:down', {
            key: event.key,
            code: event.code,
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            alt: event.altKey,
            meta: event.metaKey
        });

        // Handle global shortcuts
        this._handleGlobalShortcut(event);
    }

    /**
     * Handle keyup events
     * @private
     * @param {KeyboardEvent} event
     */
    _onKeyUp(event) {
        if (this._isInputFocused()) return;

        this.events.emit('keyboard:up', {
            key: event.key,
            code: event.code
        });
    }

    /**
     * Handle URL hash changes
     * @private
     */
    _onHashChange() {
        if (this.urlState) {
            this.urlState.loadFromHash();
        }
    }

    /**
     * Handle page visibility changes
     * @private
     */
    _onVisibilityChange() {
        if (document.hidden) {
            // Pause rendering when tab is hidden
            this.engine?.pause();
            this.performance?.pause();
        } else {
            // Resume when visible
            this.engine?.resume();
            this.performance?.resume();
        }
    }

    /**
     * Handle before unload (save state)
     * @private
     * @param {BeforeUnloadEvent} _event
     */
    _onBeforeUnload(_event) {
        // Save current state
        try {
            this.state?.saveToStorage();
            this.storage?.set('config', Config.serialize());
        } catch (error) {
            this.logger.error('Failed to save state on unload', error);
        }
    }

    /**
     * Handle state changes
     * @private
     * @param {Object} data - Changed state data
     */
    _onStateChange(data) {
        // Update URL if configured
        if (Config.ui.syncUrlState) {
            this.urlState?.updateHash();
        }

        // Update UI
        this.ui?.updateFromState(data);

        // Re-render if needed
        if (data.requiresRender) {
            this.engine?.render();
        }
    }

    /**
     * Check if an input element is focused
     * @private
     * @returns {boolean}
     */
    _isInputFocused() {
        const active = document.activeElement;
        return active && (
            active.tagName === 'INPUT' ||
            active.tagName === 'TEXTAREA' ||
            active.tagName === 'SELECT' ||
            active.isContentEditable
        );
    }

    /**
     * Handle global keyboard shortcuts
     * @private
     * @param {KeyboardEvent} event
     */
    _handleGlobalShortcut(event) {
        const { key, ctrlKey, shiftKey, altKey, metaKey } = event;
        const cmd = ctrlKey || metaKey;

        // Undo: Ctrl+Z
        if (cmd && !shiftKey && key === 'z') {
            event.preventDefault();
            this.state?.undo();
            return;
        }

        // Redo: Ctrl+Shift+Z or Ctrl+Y
        if ((cmd && shiftKey && key === 'z') || (cmd && key === 'y')) {
            event.preventDefault();
            this.state?.redo();
            return;
        }

        // Reset view: R
        if (key === 'r' && !cmd) {
            event.preventDefault();
            this.engine?.resetView();
            return;
        }

        // Toggle fullscreen: F
        if (key === 'f' && !cmd) {
            event.preventDefault();
            this.toggleFullscreen();
            return;
        }

        // Toggle sidebar: B
        if (key === 'b' && !cmd) {
            event.preventDefault();
            this.toggleSidebar();
            return;
        }

        // Toggle mode (2D/3D): M
        if (key === 'm' && !cmd) {
            event.preventDefault();
            this.toggleMode();
            return;
        }

        // Screenshot: S
        if (key === 's' && !cmd) {
            event.preventDefault();
            this.takeScreenshot();
            return;
        }

        // Save (export): Ctrl+S
        if (cmd && key === 's') {
            event.preventDefault();
            this.modals?.open('export');
            return;
        }

        // Help: ? or H
        if (key === '?' || (key === 'h' && !cmd)) {
            event.preventDefault();
            this.modals?.open('help');
            return;
        }

        // Increase iterations: ]
        if (key === ']') {
            event.preventDefault();
            this.state?.adjustIterations(1.5);
            return;
        }

        // Decrease iterations: [
        if (key === '[') {
            event.preventDefault();
            this.state?.adjustIterations(0.67);
            return;
        }

        // Zoom in: + or =
        if (key === '+' || key === '=') {
            event.preventDefault();
            this.engine?.zoom(1.5);
            return;
        }

        // Zoom out: -
        if (key === '-') {
            event.preventDefault();
            this.engine?.zoom(0.67);
            return;
        }

        // Arrow keys for panning
        const panAmount = shiftKey ? 0.5 : 0.1;
        if (key === 'ArrowUp') {
            event.preventDefault();
            this.engine?.pan(0, -panAmount);
        } else if (key === 'ArrowDown') {
            event.preventDefault();
            this.engine?.pan(0, panAmount);
        } else if (key === 'ArrowLeft') {
            event.preventDefault();
            this.engine?.pan(-panAmount, 0);
        } else if (key === 'ArrowRight') {
            event.preventDefault();
            this.engine?.pan(panAmount, 0);
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Switch between 2D and 3D rendering modes
     * @param {string} [mode] - Target mode ('2d' or '3d'), toggles if not specified
     */
    toggleMode(mode) {
        if (mode && mode !== '2d' && mode !== '3d') {
            this.logger.warn(`Invalid mode: ${mode}`);
            return;
        }

        const newMode = mode || (this.mode === '2d' ? '3d' : '2d');

        // Check 3D capability
        if (newMode === '3d' && !Config.capabilities.webgl) {
            this.toasts?.error('3D mode unavailable', 'WebGL is not supported in this browser.');
            return;
        }

        this.mode = newMode;
        this.engine?.setMode(newMode);
        this.ui?.updateModeUI(newMode);
        this.events.emit('mode:changed', { mode: newMode });

        this.logger.info(`Switched to ${newMode.toUpperCase()} mode`);
    }

    /**
     * Toggle sidebar visibility
     * @param {boolean} [visible] - Force visibility state
     */
    toggleSidebar(visible) {
        const shouldShow = visible ?? this.elements.app.classList.contains('sidebar-collapsed');

        if (shouldShow) {
            this.elements.app.classList.remove('sidebar-collapsed');
        } else {
            this.elements.app.classList.add('sidebar-collapsed');
        }

        // Trigger resize after animation
        setTimeout(() => {
            this.engine?.resize();
        }, 350);

        this.events.emit('sidebar:toggled', { visible: shouldShow });
    }

    /**
     * Toggle theme
     * @param {string} [theme] - Target theme or toggle to next
     */
    toggleTheme(theme) {
        const themes = ['dark', 'light', 'midnight', 'forest'];
        
        if (theme) {
            if (!themes.includes(theme)) {
                this.logger.warn(`Invalid theme: ${theme}`);
                return;
            }
            this.theme = theme;
        } else {
            // Cycle to next theme
            const currentIndex = themes.indexOf(this.theme);
            this.theme = themes[(currentIndex + 1) % themes.length];
        }

        this._applyTheme(this.theme);
        this.events.emit('theme:changed', { theme: this.theme });
    }

    /**
     * Toggle fullscreen mode
     */
    async toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            this.logger.error('Fullscreen toggle failed', error);
        }
    }

    /**
     * Take a screenshot of current view
     * @param {boolean} [download=true] - Whether to trigger download
     * @returns {Promise<Blob>}
     */
    async takeScreenshot(download = true) {
        try {
            const blob = await this.engine?.screenshot();
            
            if (download && blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `abyss-${this.state?.getFractalType()}-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.toasts?.success('Screenshot saved');
            }
            
            return blob;
        } catch (error) {
            this.logger.error('Screenshot failed', error);
            this.toasts?.error('Screenshot failed', error.message);
        }
    }

    /**
     * Cancel ongoing render operation
     */
    cancelRender() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.engine?.cancelRender();
    }

    // =========================================================================
    // THEME MANAGEMENT
    // =========================================================================

    /**
     * Apply theme to document
     * @private
     * @param {string} theme
     */
    _applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        const themeColors = {
            dark: '#0a0a0f',
            light: '#ffffff',
            midnight: '#0f172a',
            forest: '#0a120a'
        };
        
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }
        metaTheme.content = themeColors[theme] || themeColors.dark;
    }

    // =========================================================================
    // LOADING SCREEN
    // =========================================================================

    /**
     * Update loading screen progress
     * @private
     * @param {number} percent - Progress percentage (0-100)
     */
    _updateLoadingProgress(percent) {
        if (this.elements.loadingProgress) {
            this.elements.loadingProgress.style.width = `${percent}%`;
        }
    }

    /**
     * Update loading screen status text
     * @private
     * @param {string} status
     */
    _updateLoadingStatus(status) {
        if (this.elements.loadingStatus) {
            this.elements.loadingStatus.textContent = status;
        }
    }

    /**
     * Hide loading screen with animation
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async _hideLoadingScreen() {
        return new Promise((resolve) => {
            const screen = this.elements.loadingScreen;
            if (!screen) {
                resolve();
                return;
            }

            screen.classList.add('hidden');
            
            // Wait for CSS transition
            setTimeout(() => {
                screen.remove();
                resolve();
            }, 500);
        });
    }

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    /**
     * Handle initialization errors
     * @private
     * @param {Error} error
     */
    _handleInitError(error) {
        this.logger.error('Initialization failed', error);

        // Update loading screen to show error
        this._updateLoadingStatus(`Error: ${error.message}`);
        
        if (this.elements.loadingProgress) {
            this.elements.loadingProgress.style.backgroundColor = 'var(--error)';
        }

        // Show error in a visible way
        const errorDiv = document.createElement('div');
        errorDiv.className = 'init-error';
        errorDiv.innerHTML = `
            <h2>Failed to Initialize</h2>
            <p>${error.message}</p>
            <p>Please check the console for details and try refreshing the page.</p>
            <button onclick="location.reload()">Refresh Page</button>
        `;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-elevated, #1e1e2a);
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            color: var(--text-primary, #e4e4e7);
            max-width: 400px;
            z-index: 10000;
        `;
        document.body.appendChild(errorDiv);

        // Emit error event
        this.events.emit('app:error', { error, phase: 'init' });
    }

    /**
     * Handle runtime errors
     * @private
     * @param {Error} error
     */
    _handleRuntimeError(error) {
        this.logger.error('Runtime error', error);
        
        this.toasts?.error(
            'An error occurred',
            error.message || 'Please check the console for details.'
        );
    }

    // =========================================================================
    // DEBUG & INFO
    // =========================================================================

    /**
     * Log welcome message to console
     * @private
     */
    _logWelcome() {
        console.log(
            '%c🌀 Abyss Explorer',
            'font-size: 24px; font-weight: bold; color: #6366f1;'
        );
        console.log(
            '%cAdvanced Fractal Visualization Engine',
            'font-size: 14px; color: #a1a1aa;'
        );
        console.log(
            '%cVersion ' + Config.version,
            'font-size: 12px; color: #71717a;'
        );
        console.log('');
        console.log(
            '%cKeyboard shortcuts: Press ? for help',
            'font-size: 12px; color: #71717a;'
        );
        console.log(
            '%cDebug mode: window.app exposes the application instance',
            'font-size: 12px; color: #71717a;'
        );
    }

    /**
     * Get debug information
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            version: Config.version,
            mode: this.mode,
            theme: this.theme,
            initialized: this.initialized,
            rendering: this.rendering,
            state: this.state?.serialize(),
            performance: this.performance?.getStats(),
            capabilities: Config.capabilities,
            workers: this.workers?.getStatus()
        };
    }
}

// =============================================================================
// APPLICATION BOOTSTRAP
// =============================================================================

/**
 * Initialize application when DOM is ready
 */
function bootstrap() {
    // Create and expose app instance
    const app = App.getInstance();
    
    // Expose to window for debugging
    window.app = app;
    window.App = App;

    // Initialize
    app.init().catch((error) => {
        console.error('Bootstrap failed:', error);
    });
}

// Wait for DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    // DOM already loaded
    bootstrap();
}

// =============================================================================
// GLOBAL ERROR HANDLERS
// =============================================================================

/**
 * Catch unhandled errors
 */
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    
    const app = App.getInstance();
    if (app.initialized) {
        app.events.emit('error', event.error);
    }
});

/**
 * Catch unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    
    const app = App.getInstance();
    if (app.initialized) {
        app.events.emit('error', event.reason);
    }
});

// =============================================================================
// EXPORTS
// =============================================================================

export { App, bootstrap };
export default App;
