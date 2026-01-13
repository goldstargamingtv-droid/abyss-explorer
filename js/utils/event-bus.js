/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                      ABYSS EXPLORER - EVENT BUS                               ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Centralized pub/sub event system for decoupled communication                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { Logger } from './logger.js';

/**
 * Event Bus - Publish/Subscribe pattern implementation
 * 
 * Allows different parts of the application to communicate without
 * direct references to each other.
 * 
 * @example
 * const events = new EventBus();
 * 
 * // Subscribe to an event
 * events.on('fractal:changed', (data) => {
 *     console.log('Fractal changed to:', data.type);
 * });
 * 
 * // Emit an event
 * events.emit('fractal:changed', { type: 'mandelbrot' });
 */
export class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this.listeners = new Map();
        
        /** @type {Map<string, Set<Function>>} */
        this.onceListeners = new Map();
        
        /** @type {Logger} */
        this.logger = new Logger('EventBus');
        
        /** @type {boolean} */
        this.debug = false;
    }

    /**
     * Subscribe to an event
     * 
     * @param {string} event - Event name (supports wildcards with *)
     * @param {Function} callback - Function to call when event fires
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        if (this.debug) {
            this.logger.debug(`Subscribed to: ${event}`);
        }

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event (fires only once)
     * 
     * @param {string} event - Event name
     * @param {Function} callback - Function to call when event fires
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        if (!this.onceListeners.has(event)) {
            this.onceListeners.set(event, new Set());
        }
        this.onceListeners.get(event).add(callback);

        return () => {
            const listeners = this.onceListeners.get(event);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }

    /**
     * Unsubscribe from an event
     * 
     * @param {string} event - Event name
     * @param {Function} callback - Function to remove
     */
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.delete(callback);
            if (listeners.size === 0) {
                this.listeners.delete(event);
            }
        }

        const onceListeners = this.onceListeners.get(event);
        if (onceListeners) {
            onceListeners.delete(callback);
            if (onceListeners.size === 0) {
                this.onceListeners.delete(event);
            }
        }

        if (this.debug) {
            this.logger.debug(`Unsubscribed from: ${event}`);
        }
    }

    /**
     * Emit an event
     * 
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     */
    emit(event, data) {
        if (this.debug) {
            this.logger.debug(`Emitting: ${event}`, data);
        }

        // Regular listeners
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.logger.error(`Error in listener for ${event}:`, error);
                }
            });
        }

        // Once listeners
        const onceListeners = this.onceListeners.get(event);
        if (onceListeners) {
            onceListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.logger.error(`Error in once listener for ${event}:`, error);
                }
            });
            this.onceListeners.delete(event);
        }

        // Wildcard listeners
        this.listeners.forEach((callbacks, pattern) => {
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                if (regex.test(event)) {
                    callbacks.forEach(callback => {
                        try {
                            callback(data, event);
                        } catch (error) {
                            this.logger.error(`Error in wildcard listener for ${event}:`, error);
                        }
                    });
                }
            }
        });
    }

    /**
     * Emit an event asynchronously
     * 
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     * @returns {Promise<void>}
     */
    async emitAsync(event, data) {
        return new Promise(resolve => {
            setTimeout(() => {
                this.emit(event, data);
                resolve();
            }, 0);
        });
    }

    /**
     * Remove all listeners for an event (or all events)
     * 
     * @param {string} [event] - Event name, or omit to clear all
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
            this.onceListeners.delete(event);
        } else {
            this.listeners.clear();
            this.onceListeners.clear();
        }
    }

    /**
     * Get count of listeners for an event
     * 
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        const regular = this.listeners.get(event)?.size || 0;
        const once = this.onceListeners.get(event)?.size || 0;
        return regular + once;
    }

    /**
     * Get all registered event names
     * 
     * @returns {string[]} Array of event names
     */
    eventNames() {
        const names = new Set([
            ...this.listeners.keys(),
            ...this.onceListeners.keys()
        ]);
        return [...names];
    }

    /**
     * Enable or disable debug logging
     * 
     * @param {boolean} enabled - Whether to enable debug logging
     */
    setDebug(enabled) {
        this.debug = enabled;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMON EVENT NAMES
// ═══════════════════════════════════════════════════════════════════════════

export const EVENTS = {
    // State events
    STATE_CHANGED: 'state:changed',
    STATE_RESET: 'state:reset',
    
    // Fractal events
    FRACTAL_CHANGED: 'fractal:changed',
    FRACTAL_PARAMS_CHANGED: 'fractal:params:changed',
    
    // Render events
    RENDER_START: 'render:start',
    RENDER_PROGRESS: 'render:progress',
    RENDER_COMPLETE: 'render:complete',
    RENDER_CANCEL: 'render:cancel',
    RENDER_ERROR: 'render:error',
    
    // Navigation events
    ZOOM_START: 'zoom:start',
    ZOOM_END: 'zoom:end',
    PAN_START: 'pan:start',
    PAN_END: 'pan:end',
    
    // UI events
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',
    PANEL_OPEN: 'panel:open',
    PANEL_CLOSE: 'panel:close',
    SIDEBAR_TOGGLE: 'sidebar:toggle',
    
    // Mode events
    MODE_CHANGED: 'mode:changed',
    
    // Color events
    PALETTE_CHANGED: 'palette:changed',
    COLORING_CHANGED: 'coloring:changed',
    
    // History events
    HISTORY_PUSH: 'history:push',
    HISTORY_UNDO: 'history:undo',
    HISTORY_REDO: 'history:redo',
    
    // Bookmark events
    BOOKMARK_ADDED: 'bookmark:added',
    BOOKMARK_REMOVED: 'bookmark:removed',
    BOOKMARK_LOADED: 'bookmark:loaded',
    
    // Export events
    EXPORT_START: 'export:start',
    EXPORT_PROGRESS: 'export:progress',
    EXPORT_COMPLETE: 'export:complete',
    EXPORT_ERROR: 'export:error',
    
    // Error events
    ERROR: 'error',
    WARNING: 'warning'
};

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

// Create and export a singleton instance
const eventBus = new EventBus();

export default EventBus;
export { eventBus };
