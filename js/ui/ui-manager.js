/**
 * ============================================================================
 * ABYSS EXPLORER - UI MANAGER
 * ============================================================================
 * 
 * Central coordinator for all UI components. Manages state synchronization,
 * event communication, theming, and keyboard shortcuts.
 * 
 * Architecture:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  UI MANAGER (Event Hub)                                                │
 * │  ┌─────────────────────────────────────────────────────────────────┐  │
 * │  │                                                                 │  │
 * │  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │  │
 * │  │   │ Sidebar │  │ Toolbar │  │ Gallery │  │ Modals  │          │  │
 * │  │   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘          │  │
 * │  │        │            │            │            │                │  │
 * │  │        └────────────┴─────┬──────┴────────────┘                │  │
 * │  │                           │                                    │  │
 * │  │                    ┌──────┴──────┐                             │  │
 * │  │                    │  Event Bus  │                             │  │
 * │  │                    └──────┬──────┘                             │  │
 * │  │                           │                                    │  │
 * │  │        ┌──────────────────┼──────────────────┐                │  │
 * │  │        ▼                  ▼                  ▼                │  │
 * │  │   ┌─────────┐       ┌─────────┐       ┌─────────┐            │  │
 * │  │   │  State  │       │ Camera  │       │ Render  │            │  │
 * │  │   └─────────┘       └─────────┘       └─────────┘            │  │
 * │  │                                                               │  │
 * │  └─────────────────────────────────────────────────────────────────┘  │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module ui/ui-manager
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Theme options */
export const THEME = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
};

/** UI Events */
export const UI_EVENTS = {
    // State changes
    STATE_CHANGE: 'state:change',
    FRACTAL_CHANGE: 'fractal:change',
    PARAMETER_CHANGE: 'parameter:change',
    PALETTE_CHANGE: 'palette:change',
    COLORING_CHANGE: 'coloring:change',
    
    // Camera
    CAMERA_MOVE: 'camera:move',
    CAMERA_ZOOM: 'camera:zoom',
    CAMERA_ANIMATE: 'camera:animate',
    
    // Rendering
    RENDER_START: 'render:start',
    RENDER_PROGRESS: 'render:progress',
    RENDER_COMPLETE: 'render:complete',
    RENDER_ERROR: 'render:error',
    
    // UI
    SIDEBAR_TOGGLE: 'sidebar:toggle',
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',
    THEME_CHANGE: 'theme:change',
    FULLSCREEN_TOGGLE: 'fullscreen:toggle',
    
    // Actions
    RESET_VIEW: 'action:reset',
    RANDOM_EXPLORE: 'action:random',
    EXPORT_IMAGE: 'action:export',
    SHARE: 'action:share',
    
    // Animation
    ANIMATION_PLAY: 'animation:play',
    ANIMATION_PAUSE: 'animation:pause',
    ANIMATION_STOP: 'animation:stop',
    RECORD_START: 'record:start',
    RECORD_STOP: 'record:stop'
};

/** Keyboard shortcuts */
const DEFAULT_SHORTCUTS = {
    'Space': 'action:reset',
    'Escape': 'modal:close',
    'KeyR': 'action:random',
    'KeyF': 'fullscreen:toggle',
    'KeyS': 'sidebar:toggle',
    'KeyE': 'action:export',
    'KeyP': 'animation:toggle',
    'KeyI': 'info:toggle',
    'KeyH': 'help:toggle',
    'Digit1': 'mode:2d',
    'Digit2': 'mode:3d',
    'Equal': 'zoom:in',
    'Minus': 'zoom:out',
    'BracketLeft': 'iterations:decrease',
    'BracketRight': 'iterations:increase',
    'Comma': 'palette:previous',
    'Period': 'palette:next'
};

// ============================================================================
// EVENT EMITTER
// ============================================================================

/**
 * Simple event emitter for UI communication
 */
class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error(`[EventEmitter] Error in ${event} handler:`, e);
                }
            });
        }
    }
    
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        return this.on(event, wrapper);
    }
}

// ============================================================================
// UI MANAGER CLASS
// ============================================================================

export class UIManager extends EventEmitter {
    /**
     * Create UI Manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        super();
        
        // Core references
        this.state = options.state || null;
        this.camera2d = options.camera2d || null;
        this.camera3d = options.camera3d || null;
        this.renderer = options.renderer || null;
        this.paletteEngine = options.paletteEngine || null;
        
        // UI Components (registered later)
        this.components = new Map();
        
        // Theme
        this.theme = options.theme || THEME.DARK;
        this._systemTheme = this._detectSystemTheme();
        
        // Keyboard shortcuts
        this.shortcuts = { ...DEFAULT_SHORTCUTS, ...options.shortcuts };
        this.shortcutsEnabled = true;
        
        // UI State
        this.uiState = {
            sidebarOpen: !this._isMobile(),
            sidebarTab: 'fractal',
            currentModal: null,
            modalStack: [],
            isFullscreen: false,
            is3DMode: false,
            infoOverlayVisible: true,
            isRecording: false
        };
        
        // Media query for responsive
        this.mobileQuery = window.matchMedia('(max-width: 768px)');
        this.prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Bind methods
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleResize = this._handleResize.bind(this);
        this._handleSystemThemeChange = this._handleSystemThemeChange.bind(this);
        this._handleFullscreenChange = this._handleFullscreenChange.bind(this);
        
        // Initialize
        this._setupEventListeners();
        this._applyTheme();
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    /**
     * Initialize UI Manager
     */
    init() {
        // Apply initial theme
        this._applyTheme();
        
        // Set initial UI state based on screen size
        this.uiState.sidebarOpen = !this._isMobile();
        
        // Emit initial state
        this.emit(UI_EVENTS.STATE_CHANGE, this.getUIState());
        
        console.log('[UIManager] Initialized');
    }
    
    /**
     * Register a UI component
     * @param {string} name - Component name
     * @param {Object} component - Component instance
     */
    register(name, component) {
        this.components.set(name, component);
        
        // Link component to manager
        if (component.setManager) {
            component.setManager(this);
        }
        
        console.log(`[UIManager] Registered component: ${name}`);
    }
    
    /**
     * Get a registered component
     * @param {string} name - Component name
     * @returns {Object}
     */
    getComponent(name) {
        return this.components.get(name);
    }
    
    // ========================================================================
    // EVENT SETUP
    // ========================================================================
    
    /**
     * Setup global event listeners
     * @private
     */
    _setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', this._handleKeyDown);
        
        // Window resize
        window.addEventListener('resize', this._handleResize);
        
        // System theme changes
        this.prefersColorScheme.addEventListener('change', this._handleSystemThemeChange);
        
        // Fullscreen changes
        document.addEventListener('fullscreenchange', this._handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this._handleFullscreenChange);
        
        // Mobile breakpoint
        this.mobileQuery.addEventListener('change', (e) => {
            if (e.matches && this.uiState.sidebarOpen) {
                this.toggleSidebar(false);
            }
        });
    }
    
    /**
     * Handle keyboard shortcuts
     * @private
     */
    _handleKeyDown(e) {
        if (!this.shortcutsEnabled) return;
        
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Build key combo string
        let key = e.code;
        if (e.ctrlKey || e.metaKey) key = 'Ctrl+' + key;
        if (e.altKey) key = 'Alt+' + key;
        if (e.shiftKey) key = 'Shift+' + key;
        
        // Check for shortcut
        const action = this.shortcuts[key] || this.shortcuts[e.code];
        
        if (action) {
            e.preventDefault();
            this._executeShortcut(action);
        }
    }
    
    /**
     * Execute a keyboard shortcut action
     * @private
     */
    _executeShortcut(action) {
        const [category, command] = action.split(':');
        
        switch (action) {
            case 'action:reset':
                this.resetView();
                break;
            case 'action:random':
                this.randomExplore();
                break;
            case 'action:export':
                this.emit(UI_EVENTS.EXPORT_IMAGE);
                break;
            case 'modal:close':
                this.closeModal();
                break;
            case 'sidebar:toggle':
                this.toggleSidebar();
                break;
            case 'fullscreen:toggle':
                this.toggleFullscreen();
                break;
            case 'info:toggle':
                this.toggleInfoOverlay();
                break;
            case 'help:toggle':
                this.openModal('help');
                break;
            case 'animation:toggle':
                this.toggleAnimation();
                break;
            case 'mode:2d':
                this.setMode(false);
                break;
            case 'mode:3d':
                this.setMode(true);
                break;
            case 'zoom:in':
                this.zoomIn();
                break;
            case 'zoom:out':
                this.zoomOut();
                break;
            case 'iterations:increase':
                this.adjustIterations(100);
                break;
            case 'iterations:decrease':
                this.adjustIterations(-100);
                break;
            case 'palette:next':
                this.cyclePalette(1);
                break;
            case 'palette:previous':
                this.cyclePalette(-1);
                break;
            default:
                this.emit(action);
        }
    }
    
    /**
     * Handle window resize
     * @private
     */
    _handleResize() {
        this.emit('resize', {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile: this._isMobile()
        });
    }
    
    /**
     * Handle fullscreen change
     * @private
     */
    _handleFullscreenChange() {
        this.uiState.isFullscreen = !!document.fullscreenElement;
        this.emit(UI_EVENTS.FULLSCREEN_TOGGLE, this.uiState.isFullscreen);
    }
    
    /**
     * Handle system theme change
     * @private
     */
    _handleSystemThemeChange(e) {
        this._systemTheme = e.matches ? THEME.DARK : THEME.LIGHT;
        if (this.theme === THEME.AUTO) {
            this._applyTheme();
        }
    }
    
    // ========================================================================
    // THEME MANAGEMENT
    // ========================================================================
    
    /**
     * Set theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        this.theme = theme;
        this._applyTheme();
        this.emit(UI_EVENTS.THEME_CHANGE, this.getActiveTheme());
        
        // Save preference
        try {
            localStorage.setItem('abyss-theme', theme);
        } catch (e) {}
    }
    
    /**
     * Get active theme (resolves 'auto')
     * @returns {string}
     */
    getActiveTheme() {
        if (this.theme === THEME.AUTO) {
            return this._systemTheme;
        }
        return this.theme;
    }
    
    /**
     * Detect system theme preference
     * @private
     */
    _detectSystemTheme() {
        return this.prefersColorScheme?.matches ? THEME.DARK : THEME.LIGHT;
    }
    
    /**
     * Apply current theme to DOM
     * @private
     */
    _applyTheme() {
        const activeTheme = this.getActiveTheme();
        document.documentElement.setAttribute('data-theme', activeTheme);
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${activeTheme}`);
    }
    
    // ========================================================================
    // UI STATE MANAGEMENT
    // ========================================================================
    
    /**
     * Get current UI state
     * @returns {Object}
     */
    getUIState() {
        return { ...this.uiState };
    }
    
    /**
     * Update UI state
     * @param {Object} updates - State updates
     */
    updateUIState(updates) {
        Object.assign(this.uiState, updates);
        this.emit(UI_EVENTS.STATE_CHANGE, this.getUIState());
    }
    
    /**
     * Check if on mobile device
     * @private
     */
    _isMobile() {
        return window.innerWidth <= 768 || 
               ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    }
    
    // ========================================================================
    // SIDEBAR
    // ========================================================================
    
    /**
     * Toggle sidebar
     * @param {boolean} open - Force open/close
     */
    toggleSidebar(open = null) {
        this.uiState.sidebarOpen = open !== null ? open : !this.uiState.sidebarOpen;
        this.emit(UI_EVENTS.SIDEBAR_TOGGLE, this.uiState.sidebarOpen);
    }
    
    /**
     * Set sidebar tab
     * @param {string} tab - Tab name
     */
    setSidebarTab(tab) {
        this.uiState.sidebarTab = tab;
        this.emit('sidebar:tab', tab);
    }
    
    // ========================================================================
    // MODAL MANAGEMENT
    // ========================================================================
    
    /**
     * Open a modal
     * @param {string} modalId - Modal identifier
     * @param {Object} data - Modal data
     */
    openModal(modalId, data = {}) {
        // Stack current modal if exists
        if (this.uiState.currentModal) {
            this.uiState.modalStack.push(this.uiState.currentModal);
        }
        
        this.uiState.currentModal = modalId;
        this.emit(UI_EVENTS.MODAL_OPEN, { id: modalId, data });
    }
    
    /**
     * Close current modal
     */
    closeModal() {
        if (!this.uiState.currentModal) return;
        
        const closedModal = this.uiState.currentModal;
        
        // Pop from stack if available
        if (this.uiState.modalStack.length > 0) {
            this.uiState.currentModal = this.uiState.modalStack.pop();
        } else {
            this.uiState.currentModal = null;
        }
        
        this.emit(UI_EVENTS.MODAL_CLOSE, { id: closedModal });
    }
    
    /**
     * Close all modals
     */
    closeAllModals() {
        this.uiState.modalStack = [];
        this.uiState.currentModal = null;
        this.emit(UI_EVENTS.MODAL_CLOSE, { id: null, all: true });
    }
    
    // ========================================================================
    // VIEW CONTROLS
    // ========================================================================
    
    /**
     * Reset view to default
     */
    resetView() {
        const camera = this.uiState.is3DMode ? this.camera3d : this.camera2d;
        if (camera) {
            camera.reset(true);
        }
        this.emit(UI_EVENTS.RESET_VIEW);
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        if (this.camera2d && !this.uiState.is3DMode) {
            this.camera2d.setZoom(this.camera2d.zoom * 1.5);
        }
        this.emit(UI_EVENTS.CAMERA_ZOOM, { direction: 'in' });
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        if (this.camera2d && !this.uiState.is3DMode) {
            this.camera2d.setZoom(this.camera2d.zoom / 1.5);
        }
        this.emit(UI_EVENTS.CAMERA_ZOOM, { direction: 'out' });
    }
    
    /**
     * Random explore - jump to random interesting location
     */
    randomExplore() {
        if (this.uiState.is3DMode) {
            // 3D random rotation
            if (this.camera3d) {
                this.camera3d.animateTo({
                    theta: Math.random() * Math.PI * 2,
                    phi: Math.PI * 0.3 + Math.random() * Math.PI * 0.4
                }, 1000);
            }
        } else {
            // 2D random location
            const locations = [
                { x: -0.7453, y: 0.1127, zoom: 500, name: 'Seahorse Valley' },
                { x: -0.761574, y: -0.0847596, zoom: 1000, name: 'Spiral' },
                { x: 0.275, y: 0.006, zoom: 200, name: 'Elephant Valley' },
                { x: -1.768778, y: 0.001538, zoom: 5000, name: 'Mini-Mandelbrot' },
                { x: -0.16, y: 1.0405, zoom: 300, name: 'Double Spiral' },
                { x: -1.25066, y: 0.02012, zoom: 400, name: 'Quad Spiral' },
                { x: -0.745, y: 0.186, zoom: 150, name: 'Lightning' }
            ];
            
            const loc = locations[Math.floor(Math.random() * locations.length)];
            
            if (this.camera2d) {
                this.camera2d.animateTo(loc.x, loc.y, loc.zoom, 2000, 'easeInOutCubic');
            }
        }
        
        this.emit(UI_EVENTS.RANDOM_EXPLORE);
    }
    
    /**
     * Set 2D/3D mode
     * @param {boolean} is3D - Whether to use 3D mode
     */
    setMode(is3D) {
        this.uiState.is3DMode = is3D;
        this.emit('mode:change', is3D);
    }
    
    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen().catch(e => {
                console.warn('[UIManager] Fullscreen request failed:', e);
            });
        }
    }
    
    /**
     * Toggle info overlay
     */
    toggleInfoOverlay() {
        this.uiState.infoOverlayVisible = !this.uiState.infoOverlayVisible;
        this.emit('info:toggle', this.uiState.infoOverlayVisible);
    }
    
    // ========================================================================
    // PARAMETERS
    // ========================================================================
    
    /**
     * Set fractal type
     * @param {string} type - Fractal type
     */
    setFractal(type) {
        if (this.state) {
            this.state.setFractalType(type);
        }
        this.emit(UI_EVENTS.FRACTAL_CHANGE, type);
    }
    
    /**
     * Update parameter
     * @param {string} name - Parameter name
     * @param {any} value - Parameter value
     */
    setParameter(name, value) {
        if (this.state) {
            this.state.setParameter(name, value);
        }
        this.emit(UI_EVENTS.PARAMETER_CHANGE, { name, value });
    }
    
    /**
     * Adjust iterations
     * @param {number} delta - Amount to adjust
     */
    adjustIterations(delta) {
        if (this.state) {
            const current = this.state.getParameter('maxIterations') || 1000;
            this.state.setParameter('maxIterations', Math.max(100, current + delta));
        }
        this.emit(UI_EVENTS.PARAMETER_CHANGE, { name: 'iterations', delta });
    }
    
    /**
     * Cycle through palettes
     * @param {number} direction - 1 or -1
     */
    cyclePalette(direction) {
        this.emit(UI_EVENTS.PALETTE_CHANGE, { cycle: direction });
    }
    
    // ========================================================================
    // ANIMATION
    // ========================================================================
    
    /**
     * Toggle animation playback
     */
    toggleAnimation() {
        this.emit(this.uiState.isRecording ? UI_EVENTS.ANIMATION_PAUSE : UI_EVENTS.ANIMATION_PLAY);
    }
    
    /**
     * Start recording
     */
    startRecording() {
        this.uiState.isRecording = true;
        this.emit(UI_EVENTS.RECORD_START);
    }
    
    /**
     * Stop recording
     */
    stopRecording() {
        this.uiState.isRecording = false;
        this.emit(UI_EVENTS.RECORD_STOP);
    }
    
    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    /**
     * Destroy UI manager and cleanup
     */
    destroy() {
        document.removeEventListener('keydown', this._handleKeyDown);
        window.removeEventListener('resize', this._handleResize);
        this.prefersColorScheme?.removeEventListener('change', this._handleSystemThemeChange);
        document.removeEventListener('fullscreenchange', this._handleFullscreenChange);
        
        this.listeners.clear();
        this.components.clear();
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { EventEmitter };
export default UIManager;
