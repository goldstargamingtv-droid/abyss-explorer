/**
 * ============================================================================
 * ABYSS EXPLORER - HISTORY MODULE INDEX
 * ============================================================================
 * 
 * Undo/redo history system for navigation and state changes.
 * 
 * @module history
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS
// ============================================================================

import historyManager, {
    HistoryManager,
    HistoryEntry,
    getHistoryManager,
    resetHistoryManager
} from './history-manager.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer History',
    version: '1.0.0',
    description: 'Undo/redo system for state management',
    features: [
        'Configurable history depth',
        'Debounced state changes',
        'Transaction support for grouped changes',
        'Selective property tracking',
        'Event callbacks for UI integration'
    ]
};

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Setup keyboard shortcuts for undo/redo
 * @param {HistoryManager} manager - History manager instance
 * @param {Function} onStateRestore - Callback when state is restored
 * @returns {Function} Cleanup function
 */
export function setupKeyboardShortcuts(manager, onStateRestore) {
    const handleKeydown = (event) => {
        // Check for Ctrl/Cmd + Z (Undo)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            const state = manager.undo();
            if (state && onStateRestore) {
                onStateRestore(state, 'undo');
            }
            return;
        }
        
        // Check for Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y (Redo)
        if ((event.ctrlKey || event.metaKey) && 
            ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
            event.preventDefault();
            const state = manager.redo();
            if (state && onStateRestore) {
                onStateRestore(state, 'redo');
            }
            return;
        }
    };
    
    document.addEventListener('keydown', handleKeydown);
    
    return () => {
        document.removeEventListener('keydown', handleKeydown);
    };
}

/**
 * Create a history-aware state wrapper
 * @param {Object} initialState - Initial state object
 * @param {Object} options - History manager options
 * @returns {Object} State wrapper with undo/redo
 */
export function createHistoryState(initialState, options = {}) {
    const manager = new HistoryManager(options);
    manager.initialize(initialState);
    
    let currentState = { ...initialState };
    const listeners = new Set();
    
    return {
        /**
         * Get current state
         */
        getState() {
            return { ...currentState };
        },
        
        /**
         * Update state with history tracking
         */
        setState(updates, description = '') {
            currentState = { ...currentState, ...updates };
            manager.push(currentState, description);
            this._notify();
        },
        
        /**
         * Undo last change
         */
        undo() {
            const state = manager.undo();
            if (state) {
                currentState = state;
                this._notify();
            }
            return state;
        },
        
        /**
         * Redo last undone change
         */
        redo() {
            const state = manager.redo();
            if (state) {
                currentState = state;
                this._notify();
            }
            return state;
        },
        
        /**
         * Check if can undo
         */
        canUndo() {
            return manager.canUndo();
        },
        
        /**
         * Check if can redo
         */
        canRedo() {
            return manager.canRedo();
        },
        
        /**
         * Begin a transaction
         */
        beginTransaction(description) {
            manager.beginTransaction(description);
        },
        
        /**
         * End a transaction
         */
        endTransaction() {
            manager.endTransaction();
        },
        
        /**
         * Cancel a transaction
         */
        cancelTransaction() {
            manager.cancelTransaction();
            currentState = manager.getCurrentState();
            this._notify();
        },
        
        /**
         * Subscribe to state changes
         */
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        
        /**
         * Get history stats
         */
        getHistoryStats() {
            return manager.getStats();
        },
        
        /**
         * Get the underlying manager
         */
        getManager() {
            return manager;
        },
        
        /**
         * Notify listeners
         * @private
         */
        _notify() {
            for (const listener of listeners) {
                listener(currentState);
            }
        }
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    HistoryManager,
    HistoryEntry,
    getHistoryManager,
    resetHistoryManager,
    historyManager
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    MODULE_INFO,
    HistoryManager,
    HistoryEntry,
    getHistoryManager,
    resetHistoryManager,
    setupKeyboardShortcuts,
    createHistoryState
};
