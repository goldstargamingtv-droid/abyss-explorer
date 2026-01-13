/**
 * ============================================================================
 * ABYSS EXPLORER - HISTORY MANAGER
 * ============================================================================
 * 
 * Undo/redo system for navigation history and state changes.
 * Tracks fractal parameters, camera positions, and user actions
 * for seamless back/forward navigation.
 * 
 * Features:
 * - Configurable history depth
 * - State compression for memory efficiency
 * - Grouped actions (batch multiple changes)
 * - Selective property tracking
 * - Event callbacks for UI updates
 * - Keyboard shortcuts support
 * 
 * @module history/history-manager
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_HISTORY = 100;
const DEFAULT_DEBOUNCE_MS = 300;

// ============================================================================
// HISTORY ENTRY
// ============================================================================

/**
 * Represents a single history entry
 */
class HistoryEntry {
    /**
     * @param {Object} state - State snapshot
     * @param {string} description - Human-readable description
     * @param {number} timestamp - When the entry was created
     */
    constructor(state, description = '', timestamp = Date.now()) {
        this.state = state;
        this.description = description;
        this.timestamp = timestamp;
        this.id = `history_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Clone this entry
     */
    clone() {
        return new HistoryEntry(
            JSON.parse(JSON.stringify(this.state)),
            this.description,
            this.timestamp
        );
    }
}

// ============================================================================
// HISTORY MANAGER
// ============================================================================

/**
 * Main history manager class
 * Implements undo/redo stack with memory management
 */
export class HistoryManager {
    /**
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        this.maxHistory = options.maxHistory || DEFAULT_MAX_HISTORY;
        this.debounceMs = options.debounceMs || DEFAULT_DEBOUNCE_MS;
        
        // History stacks
        this.undoStack = [];
        this.redoStack = [];
        
        // Current state (not yet in history)
        this.currentState = null;
        
        // Debounce timer for coalescing rapid changes
        this.debounceTimer = null;
        this.pendingState = null;
        this.pendingDescription = '';
        
        // Transaction support
        this.inTransaction = false;
        this.transactionStartState = null;
        this.transactionDescription = '';
        
        // Callbacks
        this.onStateChange = null;
        this.onHistoryChange = null;
        
        // Properties to track (null = all)
        this.trackedProperties = options.trackedProperties || null;
        
        // Ignore properties (excluded from tracking)
        this.ignoredProperties = options.ignoredProperties || [];
    }
    
    /**
     * Initialize with starting state
     * @param {Object} state - Initial state
     */
    initialize(state) {
        this.currentState = this._filterState(state);
        this.undoStack = [];
        this.redoStack = [];
        this._notifyHistoryChange();
    }
    
    /**
     * Push a new state to history
     * @param {Object} state - New state
     * @param {string} description - Description of the change
     * @param {boolean} immediate - Skip debouncing
     */
    push(state, description = '', immediate = false) {
        const filteredState = this._filterState(state);
        
        // Skip if state hasn't changed
        if (this._statesEqual(this.currentState, filteredState)) {
            return;
        }
        
        if (this.inTransaction) {
            // In transaction - just update current
            this.currentState = filteredState;
            return;
        }
        
        if (immediate || this.debounceMs <= 0) {
            this._commitState(filteredState, description);
        } else {
            // Debounce rapid changes
            this.pendingState = filteredState;
            this.pendingDescription = description;
            
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }
            
            this.debounceTimer = setTimeout(() => {
                this._commitPending();
            }, this.debounceMs);
        }
    }
    
    /**
     * Commit pending state immediately
     * @private
     */
    _commitPending() {
        if (this.pendingState) {
            this._commitState(this.pendingState, this.pendingDescription);
            this.pendingState = null;
            this.pendingDescription = '';
        }
        this.debounceTimer = null;
    }
    
    /**
     * Commit state to history
     * @private
     */
    _commitState(state, description) {
        // Push current state to undo stack
        if (this.currentState !== null) {
            this.undoStack.push(new HistoryEntry(
                this.currentState,
                description || this._generateDescription(this.currentState, state)
            ));
            
            // Trim undo stack if needed
            while (this.undoStack.length > this.maxHistory) {
                this.undoStack.shift();
            }
        }
        
        // Clear redo stack (new branch)
        this.redoStack = [];
        
        // Update current state
        this.currentState = state;
        
        this._notifyHistoryChange();
    }
    
    /**
     * Undo the last action
     * @returns {Object|null} Previous state or null if nothing to undo
     */
    undo() {
        // Commit any pending changes first
        this._commitPending();
        
        if (this.undoStack.length === 0) {
            return null;
        }
        
        // Push current to redo
        this.redoStack.push(new HistoryEntry(this.currentState, 'Redo'));
        
        // Pop from undo
        const entry = this.undoStack.pop();
        this.currentState = entry.state;
        
        this._notifyHistoryChange();
        this._notifyStateChange(this.currentState, 'undo');
        
        return this.currentState;
    }
    
    /**
     * Redo the last undone action
     * @returns {Object|null} Next state or null if nothing to redo
     */
    redo() {
        if (this.redoStack.length === 0) {
            return null;
        }
        
        // Push current to undo
        this.undoStack.push(new HistoryEntry(this.currentState, 'Undo'));
        
        // Pop from redo
        const entry = this.redoStack.pop();
        this.currentState = entry.state;
        
        this._notifyHistoryChange();
        this._notifyStateChange(this.currentState, 'redo');
        
        return this.currentState;
    }
    
    /**
     * Go to a specific history entry
     * @param {string} entryId - Entry ID to go to
     * @returns {Object|null} State at that entry
     */
    goTo(entryId) {
        // Search in undo stack
        const undoIndex = this.undoStack.findIndex(e => e.id === entryId);
        if (undoIndex >= 0) {
            // Move entries after this to redo
            const toRedo = this.undoStack.splice(undoIndex + 1);
            toRedo.push(new HistoryEntry(this.currentState, 'Redo'));
            this.redoStack = [...toRedo.reverse(), ...this.redoStack];
            
            const entry = this.undoStack.pop();
            this.currentState = entry.state;
            
            this._notifyHistoryChange();
            this._notifyStateChange(this.currentState, 'goto');
            
            return this.currentState;
        }
        
        // Search in redo stack
        const redoIndex = this.redoStack.findIndex(e => e.id === entryId);
        if (redoIndex >= 0) {
            // Move entries after this to undo
            const toUndo = this.redoStack.splice(redoIndex + 1);
            toUndo.push(new HistoryEntry(this.currentState, 'Undo'));
            this.undoStack = [...this.undoStack, ...toUndo.reverse()];
            
            const entry = this.redoStack.pop();
            this.currentState = entry.state;
            
            this._notifyHistoryChange();
            this._notifyStateChange(this.currentState, 'goto');
            
            return this.currentState;
        }
        
        return null;
    }
    
    /**
     * Start a transaction (group multiple changes)
     * @param {string} description - Description for the grouped change
     */
    beginTransaction(description = '') {
        this._commitPending();
        
        this.inTransaction = true;
        this.transactionStartState = this.currentState 
            ? JSON.parse(JSON.stringify(this.currentState))
            : null;
        this.transactionDescription = description;
    }
    
    /**
     * End a transaction and commit as single change
     */
    endTransaction() {
        if (!this.inTransaction) return;
        
        this.inTransaction = false;
        
        // Only commit if state actually changed
        if (!this._statesEqual(this.transactionStartState, this.currentState)) {
            // Restore start state temporarily and commit change
            const finalState = this.currentState;
            this.currentState = this.transactionStartState;
            this._commitState(finalState, this.transactionDescription);
        }
        
        this.transactionStartState = null;
        this.transactionDescription = '';
    }
    
    /**
     * Cancel a transaction and restore original state
     */
    cancelTransaction() {
        if (!this.inTransaction) return;
        
        this.inTransaction = false;
        this.currentState = this.transactionStartState;
        this.transactionStartState = null;
        this.transactionDescription = '';
        
        this._notifyStateChange(this.currentState, 'cancel');
    }
    
    /**
     * Check if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
    
    /**
     * Check if redo is available
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    
    /**
     * Get current state
     */
    getCurrentState() {
        return this.currentState;
    }
    
    /**
     * Get undo stack entries
     */
    getUndoHistory() {
        return this.undoStack.map(e => ({
            id: e.id,
            description: e.description,
            timestamp: e.timestamp
        }));
    }
    
    /**
     * Get redo stack entries
     */
    getRedoHistory() {
        return this.redoStack.map(e => ({
            id: e.id,
            description: e.description,
            timestamp: e.timestamp
        }));
    }
    
    /**
     * Get history stats
     */
    getStats() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            maxHistory: this.maxHistory,
            inTransaction: this.inTransaction
        };
    }
    
    /**
     * Clear all history
     */
    clear() {
        this._commitPending();
        this.undoStack = [];
        this.redoStack = [];
        this._notifyHistoryChange();
    }
    
    /**
     * Dispose and clean up
     */
    dispose() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.undoStack = [];
        this.redoStack = [];
        this.currentState = null;
        this.onStateChange = null;
        this.onHistoryChange = null;
    }
    
    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================
    
    /**
     * Filter state to only tracked properties
     * @private
     */
    _filterState(state) {
        if (!state) return null;
        
        const filtered = {};
        
        for (const key in state) {
            // Skip ignored properties
            if (this.ignoredProperties.includes(key)) continue;
            
            // Include if tracked properties is null (track all) or key is in list
            if (this.trackedProperties === null || this.trackedProperties.includes(key)) {
                // Deep clone the value
                filtered[key] = JSON.parse(JSON.stringify(state[key]));
            }
        }
        
        return filtered;
    }
    
    /**
     * Compare two states for equality
     * @private
     */
    _statesEqual(a, b) {
        if (a === b) return true;
        if (a === null || b === null) return false;
        
        return JSON.stringify(a) === JSON.stringify(b);
    }
    
    /**
     * Generate description from state diff
     * @private
     */
    _generateDescription(oldState, newState) {
        if (!oldState || !newState) return 'State change';
        
        const changes = [];
        
        for (const key in newState) {
            if (JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
                changes.push(key);
            }
        }
        
        if (changes.length === 0) return 'No change';
        if (changes.length === 1) return `Changed ${changes[0]}`;
        if (changes.length <= 3) return `Changed ${changes.join(', ')}`;
        return `Changed ${changes.length} properties`;
    }
    
    /**
     * Notify state change callback
     * @private
     */
    _notifyStateChange(state, action) {
        if (this.onStateChange) {
            this.onStateChange(state, action);
        }
    }
    
    /**
     * Notify history change callback
     * @private
     */
    _notifyHistoryChange() {
        if (this.onHistoryChange) {
            this.onHistoryChange(this.getStats());
        }
    }
}

// ============================================================================
// SINGLETON
// ============================================================================

let historyManagerInstance = null;

/**
 * Get or create the global history manager instance
 * @param {Object} options - Configuration options
 * @returns {HistoryManager}
 */
export function getHistoryManager(options = {}) {
    if (!historyManagerInstance) {
        historyManagerInstance = new HistoryManager(options);
    }
    return historyManagerInstance;
}

/**
 * Reset the global history manager
 */
export function resetHistoryManager() {
    if (historyManagerInstance) {
        historyManagerInstance.dispose();
        historyManagerInstance = null;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { HistoryEntry };

export default {
    HistoryManager,
    HistoryEntry,
    getHistoryManager,
    resetHistoryManager
};
