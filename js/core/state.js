/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                       ABYSS EXPLORER - STATE MANAGEMENT                       ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Centralized state management with history tracking for undo/redo             ║
 * ║                                                                                ║
 * ║  Responsibilities:                                                             ║
 * ║  - Maintain all application state in a single source of truth                 ║
 * ║  - Track history for undo/redo operations                                     ║
 * ║  - Emit events on state changes                                               ║
 * ║  - Persist state to storage                                                   ║
 * ║  - Serialize/deserialize state for URL sharing                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Config } from '../config.js';
import { Logger } from '../utils/logger.js';
import { deepClone, deepEqual } from '../utils/helpers.js';

// =============================================================================
// STATE CLASS
// =============================================================================

/**
 * Centralized State Management
 * 
 * Implements a simple but powerful state management system with:
 * - Immutable state updates
 * - History tracking for undo/redo
 * - Event emission on changes
 * - Automatic persistence
 * 
 * @class State
 */
export class State {
    /**
     * Create state manager
     * 
     * @param {EventBus} events - Event bus for notifications
     * @param {StorageManager} storage - Storage manager for persistence
     */
    constructor(events, storage) {
        /** @type {EventBus} */
        this.events = events;
        
        /** @type {StorageManager} */
        this.storage = storage;
        
        /** @type {Logger} */
        this.logger = new Logger('State');

        // =================================================================
        // Current State
        // =================================================================
        
        /** @type {Object} Current application state */
        this._state = this._createInitialState();

        // =================================================================
        // History
        // =================================================================
        
        /** @type {Object[]} History stack for undo */
        this._history = [];
        
        /** @type {Object[]} Redo stack */
        this._redoStack = [];
        
        /** @type {number} Maximum history entries */
        this._maxHistory = Config.history.maxSteps;

        // =================================================================
        // Flags
        // =================================================================
        
        /** @type {boolean} Whether state is being batch-updated */
        this._batching = false;
        
        /** @type {Object|null} Pending batch changes */
        this._batchChanges = null;
        
        /** @type {boolean} Whether to skip history for current change */
        this._skipHistory = false;
        
        /** @type {number} Auto-save timeout ID */
        this._autoSaveTimeout = null;
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Create initial state object
     * @private
     * @returns {Object}
     */
    _createInitialState() {
        return {
            // Fractal configuration
            fractal: {
                type: Config.fractal.defaultType,
                power: 2,
                juliaMode: false,
                juliaC: { x: -0.7, y: 0.27015 },
                customFormula: null
            },

            // View state
            view: {
                centerX: Config.fractal.defaultCenter.x,
                centerY: Config.fractal.defaultCenter.y,
                zoom: Config.fractal.defaultZoom,
                rotation: 0
            },

            // 3D view state
            view3D: {
                cameraPosition: { x: 0, y: 0, z: 3 },
                cameraTarget: { x: 0, y: 0, z: 0 },
                cameraUp: { x: 0, y: 1, z: 0 }
            },

            // Rendering settings
            rendering: {
                maxIterations: Config.rendering.maxIterations,
                bailout: Config.rendering.bailout,
                precisionMode: Config.rendering.precisionMode,
                smoothColoring: Config.rendering.smoothColoring,
                antialiasing: Config.rendering.antialiasing
            },

            // Coloring settings
            coloring: {
                algorithm: Config.coloring.defaultAlgorithm,
                palette: Config.coloring.defaultPalette,
                paletteOffset: 0,
                paletteRepeat: 1,
                cycleSpeed: 0,
                interiorColor: { ...Config.coloring.interiorColor }
            },

            // Custom palette (array of color stops)
            customPalette: null,

            // 3D rendering settings
            rendering3D: {
                power: 8, // Mandelbulb power
                scale: 2, // Mandelbox scale
                maxSteps: Config.rendering3D.maxSteps,
                shadows: Config.rendering3D.shadows,
                ao: Config.rendering3D.ambientOcclusion,
                glow: Config.rendering3D.glow,
                lightDirection: { ...Config.rendering3D.lightDirection }
            },

            // Animation state
            animation: {
                playing: false,
                keyframes: [],
                currentFrame: 0,
                duration: 10,
                easing: 'easeInOut',
                loop: false
            },

            // Bookmarks
            bookmarks: [],

            // UI state (not persisted to URL)
            ui: {
                selectedTool: 'pan',
                showingOrbit: false,
                orbitPoint: null
            }
        };
    }

    /**
     * Initialize state manager
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        this.logger.info('Initializing state manager...');

        // Load persisted state
        await this._loadFromStorage();

        // Set up auto-save
        if (Config.history.autoSaveInterval > 0) {
            this._startAutoSave();
        }

        this.logger.info('State manager initialized');
    }

    // =========================================================================
    // GETTERS
    // =========================================================================

    /**
     * Get current state (immutable copy)
     * @returns {Object}
     */
    get() {
        return deepClone(this._state);
    }

    /**
     * Get a specific state value by path
     * 
     * @param {string} path - Dot-notation path (e.g., 'view.centerX')
     * @returns {*}
     */
    getValue(path) {
        const parts = path.split('.');
        let value = this._state;
        
        for (const part of parts) {
            if (value === undefined || value === null) return undefined;
            value = value[part];
        }
        
        // Return clone for objects
        if (typeof value === 'object' && value !== null) {
            return deepClone(value);
        }
        return value;
    }

    /**
     * Get current fractal type
     * @returns {string}
     */
    getFractalType() {
        return this._state.fractal.type;
    }

    /**
     * Get current view
     * @returns {Object}
     */
    getView() {
        return deepClone(this._state.view);
    }

    /**
     * Get current iterations
     * @returns {number}
     */
    getIterations() {
        return this._state.rendering.maxIterations;
    }

    /**
     * Get current palette
     * @returns {string|Object}
     */
    getPalette() {
        return this._state.coloring.palette;
    }

    /**
     * Get custom palette if set
     * @returns {Object[]|null}
     */
    getCustomPalette() {
        return this._state.customPalette ? deepClone(this._state.customPalette) : null;
    }

    /**
     * Get all bookmarks
     * @returns {Object[]}
     */
    getBookmarks() {
        return deepClone(this._state.bookmarks);
    }

    // =========================================================================
    // SETTERS
    // =========================================================================

    /**
     * Set state values
     * 
     * Merges provided values into current state, emits change event,
     * and optionally records in history.
     * 
     * @param {Object} changes - Object with values to change
     * @param {Object} [options] - Options
     * @param {boolean} [options.silent=false] - Don't emit events
     * @param {boolean} [options.skipHistory=false] - Don't record in history
     * @returns {boolean} Whether state actually changed
     */
    set(changes, options = {}) {
        const { silent = false, skipHistory = false } = options;

        if (this._batching) {
            // Merge into batch changes
            this._batchChanges = deepMerge(this._batchChanges || {}, changes);
            return true;
        }

        // Check if anything actually changed
        const previousState = deepClone(this._state);
        const newState = deepMerge(this._state, changes);
        
        if (deepEqual(previousState, newState)) {
            return false;
        }

        // Record in history (before applying change)
        if (!skipHistory && !this._skipHistory) {
            this._pushHistory(previousState);
        }

        // Apply changes
        this._state = newState;

        // Emit change event
        if (!silent) {
            this._emitChange(changes, previousState);
        }

        // Schedule auto-save
        this._scheduleAutoSave();

        return true;
    }

    /**
     * Set fractal type
     * @param {string} type
     */
    setFractal(type) {
        const fractalConfig = Config.getFractalConfig(type, '2d') ||
                              Config.getFractalConfig(type, '3d');
        
        if (!fractalConfig) {
            this.logger.warn(`Unknown fractal type: ${type}`);
            return;
        }

        this.set({
            fractal: {
                ...this._state.fractal,
                type
            },
            view: {
                ...this._state.view,
                centerX: fractalConfig.defaultCenter.x,
                centerY: fractalConfig.defaultCenter.y,
                zoom: fractalConfig.defaultZoom
            },
            rendering: {
                ...this._state.rendering,
                maxIterations: fractalConfig.defaultIterations || this._state.rendering.maxIterations,
                bailout: fractalConfig.defaultBailout || this._state.rendering.bailout
            }
        });
    }

    /**
     * Set view parameters
     * @param {Object} view
     * @param {number} [view.centerX]
     * @param {number} [view.centerY]
     * @param {number} [view.zoom]
     * @param {number} [view.rotation]
     */
    setView(view) {
        this.set({
            view: {
                ...this._state.view,
                ...view
            }
        });
    }

    /**
     * Set iteration count
     * @param {number} iterations
     */
    setIterations(iterations) {
        this.set({
            rendering: {
                ...this._state.rendering,
                maxIterations: Math.max(10, Math.round(iterations))
            }
        });
    }

    /**
     * Adjust iterations by factor
     * @param {number} factor - Multiplier
     */
    adjustIterations(factor) {
        const newIterations = Math.round(this._state.rendering.maxIterations * factor);
        this.setIterations(newIterations);
    }

    /**
     * Set palette
     * @param {string} palette - Palette name or 'custom'
     */
    setPalette(palette) {
        this.set({
            coloring: {
                ...this._state.coloring,
                palette
            }
        });
    }

    /**
     * Set custom palette
     * @param {Object[]} stops - Array of color stops
     */
    setCustomPalette(stops) {
        this.set({
            customPalette: stops,
            coloring: {
                ...this._state.coloring,
                palette: 'custom'
            }
        });
    }

    /**
     * Set Julia constant
     * @param {number} x - Real part
     * @param {number} y - Imaginary part
     */
    setJuliaC(x, y) {
        this.set({
            fractal: {
                ...this._state.fractal,
                juliaC: { x, y }
            }
        });
    }

    /**
     * Toggle Julia mode
     * @param {boolean} [enabled]
     */
    toggleJulia(enabled) {
        this.set({
            fractal: {
                ...this._state.fractal,
                juliaMode: enabled ?? !this._state.fractal.juliaMode
            }
        });
    }

    // =========================================================================
    // BATCH UPDATES
    // =========================================================================

    /**
     * Begin batch update
     * 
     * Changes made during batch are combined and applied once on commit.
     */
    beginBatch() {
        this._batching = true;
        this._batchChanges = {};
    }

    /**
     * Commit batch update
     * 
     * @param {Object} [options] - Options to pass to set()
     */
    commitBatch(options = {}) {
        if (!this._batching) return;

        this._batching = false;
        const changes = this._batchChanges;
        this._batchChanges = null;

        if (changes && Object.keys(changes).length > 0) {
            this.set(changes, options);
        }
    }

    /**
     * Cancel batch update
     */
    cancelBatch() {
        this._batching = false;
        this._batchChanges = null;
    }

    // =========================================================================
    // HISTORY (UNDO/REDO)
    // =========================================================================

    /**
     * Push state to history
     * @private
     * @param {Object} state
     */
    _pushHistory(state) {
        // Clear redo stack on new action
        this._redoStack = [];

        // Add to history
        this._history.push({
            state: deepClone(state),
            timestamp: Date.now()
        });

        // Trim history if needed
        while (this._history.length > this._maxHistory) {
            this._history.shift();
        }
    }

    /**
     * Undo last change
     * @returns {boolean} Whether undo was performed
     */
    undo() {
        if (this._history.length === 0) {
            this.logger.debug('Nothing to undo');
            return false;
        }

        // Save current state for redo
        this._redoStack.push({
            state: deepClone(this._state),
            timestamp: Date.now()
        });

        // Restore previous state
        const entry = this._history.pop();
        this._skipHistory = true;
        this._state = entry.state;
        this._emitChange({}, null, 'undo');
        this._skipHistory = false;

        this.logger.debug(`Undo performed (${this._history.length} remaining)`);
        return true;
    }

    /**
     * Redo last undone change
     * @returns {boolean} Whether redo was performed
     */
    redo() {
        if (this._redoStack.length === 0) {
            this.logger.debug('Nothing to redo');
            return false;
        }

        // Save current state for undo
        this._history.push({
            state: deepClone(this._state),
            timestamp: Date.now()
        });

        // Restore redo state
        const entry = this._redoStack.pop();
        this._skipHistory = true;
        this._state = entry.state;
        this._emitChange({}, null, 'redo');
        this._skipHistory = false;

        this.logger.debug(`Redo performed (${this._redoStack.length} remaining)`);
        return true;
    }

    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this._history.length > 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this._redoStack.length > 0;
    }

    /**
     * Get history length
     * @returns {{undo: number, redo: number}}
     */
    getHistoryLength() {
        return {
            undo: this._history.length,
            redo: this._redoStack.length
        };
    }

    /**
     * Clear history
     */
    clearHistory() {
        this._history = [];
        this._redoStack = [];
        this.logger.info('History cleared');
    }

    // =========================================================================
    // BOOKMARKS
    // =========================================================================

    /**
     * Add current view as bookmark
     * @param {string} [name] - Bookmark name
     * @returns {Object} The created bookmark
     */
    addBookmark(name) {
        const bookmark = {
            id: `bm_${Date.now()}`,
            name: name || `Bookmark ${this._state.bookmarks.length + 1}`,
            fractal: deepClone(this._state.fractal),
            view: deepClone(this._state.view),
            coloring: deepClone(this._state.coloring),
            rendering: {
                maxIterations: this._state.rendering.maxIterations
            },
            timestamp: Date.now(),
            thumbnail: null // Populated by UI
        };

        this.set({
            bookmarks: [...this._state.bookmarks, bookmark]
        }, { skipHistory: true });

        this.events.emit('bookmark:added', { bookmark });
        return bookmark;
    }

    /**
     * Remove a bookmark
     * @param {string} id - Bookmark ID
     */
    removeBookmark(id) {
        const bookmarks = this._state.bookmarks.filter(b => b.id !== id);
        
        this.set({ bookmarks }, { skipHistory: true });
        this.events.emit('bookmark:removed', { id });
    }

    /**
     * Load a bookmark
     * @param {string} id - Bookmark ID
     */
    loadBookmark(id) {
        const bookmark = this._state.bookmarks.find(b => b.id === id);
        if (!bookmark) {
            this.logger.warn(`Bookmark not found: ${id}`);
            return;
        }

        this.set({
            fractal: deepClone(bookmark.fractal),
            view: deepClone(bookmark.view),
            coloring: deepClone(bookmark.coloring),
            rendering: {
                ...this._state.rendering,
                maxIterations: bookmark.rendering.maxIterations
            }
        });

        this.events.emit('bookmark:loaded', { bookmark });
    }

    // =========================================================================
    // PERSISTENCE
    // =========================================================================

    /**
     * Load state from storage
     * @private
     * @async
     */
    async _loadFromStorage() {
        try {
            const saved = await this.storage.get('state');
            if (saved) {
                // Merge saved state with defaults (defaults fill missing keys)
                const initial = this._createInitialState();
                this._state = deepMerge(initial, saved);
                this.logger.info('Loaded state from storage');
            }
        } catch (error) {
            this.logger.warn('Failed to load state from storage', error);
        }
    }

    /**
     * Save state to storage
     */
    saveToStorage() {
        try {
            // Save state (excluding UI state)
            const toSave = deepClone(this._state);
            delete toSave.ui;
            
            this.storage.set('state', toSave);
            this.logger.debug('State saved to storage');
        } catch (error) {
            this.logger.error('Failed to save state to storage', error);
        }
    }

    /**
     * Start auto-save timer
     * @private
     */
    _startAutoSave() {
        if (this._autoSaveTimeout) {
            clearTimeout(this._autoSaveTimeout);
        }

        this._autoSaveTimeout = setInterval(() => {
            this.saveToStorage();
        }, Config.history.autoSaveInterval);
    }

    /**
     * Schedule auto-save
     * @private
     */
    _scheduleAutoSave() {
        // Debounced save is handled by auto-save interval
        // This could trigger immediate save for important changes
    }

    // =========================================================================
    // SERIALIZATION
    // =========================================================================

    /**
     * Serialize state for URL sharing
     * @returns {Object}
     */
    serialize() {
        return {
            f: this._state.fractal.type,
            x: this._state.view.centerX,
            y: this._state.view.centerY,
            z: this._state.view.zoom,
            i: this._state.rendering.maxIterations,
            p: this._state.coloring.palette,
            jm: this._state.fractal.juliaMode ? 1 : 0,
            jx: this._state.fractal.juliaC.x,
            jy: this._state.fractal.juliaC.y
        };
    }

    /**
     * Deserialize state from URL data
     * @param {Object} data
     */
    deserialize(data) {
        const changes = {};

        if (data.f) {
            changes.fractal = {
                ...this._state.fractal,
                type: data.f
            };
        }

        if (data.x !== undefined || data.y !== undefined || data.z !== undefined) {
            changes.view = {
                ...this._state.view,
                centerX: data.x ?? this._state.view.centerX,
                centerY: data.y ?? this._state.view.centerY,
                zoom: data.z ?? this._state.view.zoom
            };
        }

        if (data.i !== undefined) {
            changes.rendering = {
                ...this._state.rendering,
                maxIterations: parseInt(data.i) || this._state.rendering.maxIterations
            };
        }

        if (data.p) {
            changes.coloring = {
                ...this._state.coloring,
                palette: data.p
            };
        }

        if (data.jm !== undefined) {
            changes.fractal = {
                ...changes.fractal,
                ...this._state.fractal,
                juliaMode: data.jm === 1 || data.jm === '1' || data.jm === true,
                juliaC: {
                    x: data.jx ?? this._state.fractal.juliaC.x,
                    y: data.jy ?? this._state.fractal.juliaC.y
                }
            };
        }

        if (Object.keys(changes).length > 0) {
            this.set(changes, { skipHistory: true });
        }
    }

    // =========================================================================
    // EVENTS
    // =========================================================================

    /**
     * Emit state change event
     * @private
     * @param {Object} changes
     * @param {Object|null} previousState
     * @param {string} [action='update']
     */
    _emitChange(changes, previousState, action = 'update') {
        // Determine what requires re-render
        const requiresRender = this._changesRequireRender(changes);

        this.events.emit('state:changed', {
            state: this.get(),
            changes,
            previousState,
            action,
            requiresRender
        });
    }

    /**
     * Check if changes require re-render
     * @private
     * @param {Object} changes
     * @returns {boolean}
     */
    _changesRequireRender(changes) {
        const renderKeys = ['fractal', 'view', 'rendering', 'coloring', 'customPalette', 'rendering3D'];
        return renderKeys.some(key => changes[key] !== undefined);
    }

    // =========================================================================
    // CLEANUP
    // =========================================================================

    /**
     * Dispose of state manager
     */
    dispose() {
        if (this._autoSaveTimeout) {
            clearInterval(this._autoSaveTimeout);
        }

        // Final save
        this.saveToStorage();

        this.logger.info('State manager disposed');
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Deep merge objects
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
function deepMerge(target, source) {
    const output = deepClone(target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = deepClone(source[key]);
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    
    return output;
}

/**
 * Check if value is a plain object
 * @param {*} item
 * @returns {boolean}
 */
function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

// =============================================================================
// EXPORTS
// =============================================================================

export default State;
