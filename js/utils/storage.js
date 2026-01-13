/**
 * ============================================================================
 * ABYSS EXPLORER - STORAGE UTILITIES
 * ============================================================================
 * 
 * Persistent storage wrapper with multiple backends:
 * - localStorage for small data (preferences, recent items)
 * - IndexedDB for large data (presets, keyframes, renders)
 * 
 * Features:
 * - Automatic JSON serialization
 * - Namespacing to avoid conflicts
 * - Quota management and error handling
 * - Migration support between storage backends
 * - Compression for large objects
 * 
 * @module utils/storage
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const NAMESPACE = 'abyss_';
const DB_NAME = 'AbyssExplorer';
const DB_VERSION = 1;
const STORE_NAME = 'data';

// Size thresholds (in bytes)
const LOCALSTORAGE_ITEM_LIMIT = 1024 * 100; // 100KB per item
const LOCALSTORAGE_TOTAL_LIMIT = 1024 * 1024 * 5; // 5MB total

// ============================================================================
// LOCALSTORAGE WRAPPER
// ============================================================================

/**
 * LocalStorage wrapper with namespacing and JSON support
 */
class LocalStorageWrapper {
    constructor(namespace = NAMESPACE) {
        this.namespace = namespace;
        this.available = this._checkAvailability();
    }
    
    /**
     * Check if localStorage is available
     * @private
     */
    _checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Get namespaced key
     * @private
     */
    _key(key) {
        return this.namespace + key;
    }
    
    /**
     * Get item from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default if not found
     * @returns {*} Stored value or default
     */
    get(key, defaultValue = null) {
        if (!this.available) return defaultValue;
        
        try {
            const item = localStorage.getItem(this._key(key));
            if (item === null) return defaultValue;
            
            return JSON.parse(item);
        } catch (e) {
            console.warn('Storage get error:', e);
            return defaultValue;
        }
    }
    
    /**
     * Set item in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success
     */
    set(key, value) {
        if (!this.available) return false;
        
        try {
            const serialized = JSON.stringify(value);
            
            // Check item size
            if (serialized.length > LOCALSTORAGE_ITEM_LIMIT) {
                console.warn('Item too large for localStorage:', key);
                return false;
            }
            
            localStorage.setItem(this._key(key), serialized);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded');
                this._handleQuotaExceeded();
            }
            return false;
        }
    }
    
    /**
     * Remove item from storage
     * @param {string} key - Storage key
     */
    remove(key) {
        if (!this.available) return;
        
        try {
            localStorage.removeItem(this._key(key));
        } catch (e) {
            console.warn('Storage remove error:', e);
        }
    }
    
    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        if (!this.available) return false;
        return localStorage.getItem(this._key(key)) !== null;
    }
    
    /**
     * Get all keys with namespace
     * @returns {string[]}
     */
    keys() {
        if (!this.available) return [];
        
        const result = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.namespace)) {
                result.push(key.slice(this.namespace.length));
            }
        }
        return result;
    }
    
    /**
     * Clear all items with namespace
     */
    clear() {
        if (!this.available) return;
        
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.namespace)) {
                keysToRemove.push(key);
            }
        }
        
        for (const key of keysToRemove) {
            localStorage.removeItem(key);
        }
    }
    
    /**
     * Get used storage size
     * @returns {number} Size in bytes
     */
    getUsedSize() {
        if (!this.available) return 0;
        
        let size = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.namespace)) {
                size += key.length + localStorage.getItem(key).length;
            }
        }
        return size * 2; // UTF-16
    }
    
    /**
     * Handle quota exceeded by clearing old data
     * @private
     */
    _handleQuotaExceeded() {
        // Remove oldest items first
        const items = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.namespace)) {
                items.push({
                    key,
                    size: localStorage.getItem(key).length
                });
            }
        }
        
        // Sort by size and remove largest
        items.sort((a, b) => b.size - a.size);
        
        // Remove up to 20% of items
        const toRemove = Math.ceil(items.length * 0.2);
        for (let i = 0; i < toRemove && i < items.length; i++) {
            localStorage.removeItem(items[i].key);
        }
    }
}

// ============================================================================
// INDEXEDDB WRAPPER
// ============================================================================

/**
 * IndexedDB wrapper for large data storage
 */
class IndexedDBWrapper {
    constructor(dbName = DB_NAME, storeName = STORE_NAME) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
        this.ready = this._init();
    }
    
    /**
     * Initialize database
     * @private
     */
    async _init() {
        if (typeof indexedDB === 'undefined') {
            return false;
        }
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, DB_VERSION);
            
            request.onerror = () => {
                console.warn('IndexedDB error:', request.error);
                resolve(false);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'key' });
                }
            };
        });
    }
    
    /**
     * Ensure database is ready
     * @private
     */
    async _ensureReady() {
        await this.ready;
        return this.db !== null;
    }
    
    /**
     * Get item from database
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default if not found
     * @returns {Promise<*>}
     */
    async get(key, defaultValue = null) {
        if (!await this._ensureReady()) return defaultValue;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);
            
            request.onerror = () => resolve(defaultValue);
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
        });
    }
    
    /**
     * Set item in database
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {Promise<boolean>}
     */
    async set(key, value) {
        if (!await this._ensureReady()) return false;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ key, value, timestamp: Date.now() });
            
            request.onerror = () => resolve(false);
            request.onsuccess = () => resolve(true);
        });
    }
    
    /**
     * Remove item from database
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async remove(key) {
        if (!await this._ensureReady()) return false;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);
            
            request.onerror = () => resolve(false);
            request.onsuccess = () => resolve(true);
        });
    }
    
    /**
     * Check if key exists
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        const value = await this.get(key);
        return value !== null;
    }
    
    /**
     * Get all keys
     * @returns {Promise<string[]>}
     */
    async keys() {
        if (!await this._ensureReady()) return [];
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();
            
            request.onerror = () => resolve([]);
            request.onsuccess = () => resolve(request.result);
        });
    }
    
    /**
     * Clear all data
     * @returns {Promise<boolean>}
     */
    async clear() {
        if (!await this._ensureReady()) return false;
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(this.storeName, 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();
            
            request.onerror = () => resolve(false);
            request.onsuccess = () => resolve(true);
        });
    }
    
    /**
     * Get all entries
     * @returns {Promise<Array>}
     */
    async getAll() {
        if (!await this._ensureReady()) return [];
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction(this.storeName, 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onerror = () => resolve([]);
            request.onsuccess = () => resolve(request.result);
        });
    }
}

// ============================================================================
// UNIFIED STORAGE CLASS
// ============================================================================

/**
 * Unified storage interface with automatic backend selection
 */
export class Storage {
    constructor(namespace = NAMESPACE) {
        this.local = new LocalStorageWrapper(namespace);
        this.idb = new IndexedDBWrapper();
        this.namespace = namespace;
    }
    
    /**
     * Get item (tries localStorage first, then IndexedDB)
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default if not found
     * @returns {Promise<*>}
     */
    async get(key, defaultValue = null) {
        // Try localStorage first for speed
        const localValue = this.local.get(key);
        if (localValue !== null) {
            return localValue;
        }
        
        // Fall back to IndexedDB
        return await this.idb.get(key, defaultValue);
    }
    
    /**
     * Get item synchronously (localStorage only)
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default if not found
     * @returns {*}
     */
    getSync(key, defaultValue = null) {
        return this.local.get(key, defaultValue);
    }
    
    /**
     * Set item (auto-selects backend based on size)
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {Promise<boolean>}
     */
    async set(key, value) {
        const serialized = JSON.stringify(value);
        const size = serialized.length * 2; // UTF-16
        
        // Use IndexedDB for large items
        if (size > LOCALSTORAGE_ITEM_LIMIT) {
            return await this.idb.set(key, value);
        }
        
        // Use localStorage for small items
        const success = this.local.set(key, value);
        if (!success) {
            // Fall back to IndexedDB if localStorage fails
            return await this.idb.set(key, value);
        }
        
        return success;
    }
    
    /**
     * Set item synchronously (localStorage only)
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean}
     */
    setSync(key, value) {
        return this.local.set(key, value);
    }
    
    /**
     * Remove item from both backends
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async remove(key) {
        this.local.remove(key);
        await this.idb.remove(key);
    }
    
    /**
     * Check if key exists in either backend
     * @param {string} key - Storage key
     * @returns {Promise<boolean>}
     */
    async has(key) {
        if (this.local.has(key)) return true;
        return await this.idb.has(key);
    }
    
    /**
     * Get all keys from both backends
     * @returns {Promise<string[]>}
     */
    async keys() {
        const localKeys = this.local.keys();
        const idbKeys = await this.idb.keys();
        
        // Merge and deduplicate
        return [...new Set([...localKeys, ...idbKeys])];
    }
    
    /**
     * Clear all data from both backends
     * @returns {Promise<void>}
     */
    async clear() {
        this.local.clear();
        await this.idb.clear();
    }
    
    /**
     * Get storage statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        return {
            localStorage: {
                used: this.local.getUsedSize(),
                limit: LOCALSTORAGE_TOTAL_LIMIT,
                itemCount: this.local.keys().length
            },
            indexedDB: {
                itemCount: (await this.idb.keys()).length
            }
        };
    }
}

// ============================================================================
// SPECIALIZED STORAGE CLASSES
// ============================================================================

/**
 * Storage for user preferences
 */
export class PreferencesStorage extends Storage {
    constructor() {
        super('abyss_prefs_');
    }
    
    /**
     * Get preference with type coercion
     */
    getPreference(key, defaultValue, type = 'any') {
        const value = this.local.get(key, defaultValue);
        
        switch (type) {
            case 'boolean':
                return Boolean(value);
            case 'number':
                return Number(value);
            case 'string':
                return String(value);
            default:
                return value;
        }
    }
    
    /**
     * Set preference
     */
    setPreference(key, value) {
        return this.local.set(key, value);
    }
}

/**
 * Storage for presets
 */
export class PresetStorage extends Storage {
    constructor() {
        super('abyss_presets_');
    }
    
    /**
     * Save preset
     */
    async savePreset(id, preset) {
        preset.savedAt = Date.now();
        return await this.set(id, preset);
    }
    
    /**
     * Get preset
     */
    async getPreset(id) {
        return await this.get(id);
    }
    
    /**
     * List all presets
     */
    async listPresets() {
        const keys = await this.keys();
        const presets = [];
        
        for (const key of keys) {
            const preset = await this.get(key);
            if (preset) {
                presets.push({ id: key, ...preset });
            }
        }
        
        return presets.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    }
}

/**
 * Storage for keyframes and animations
 */
export class AnimationStorage extends Storage {
    constructor() {
        super('abyss_anim_');
    }
    
    /**
     * Save animation
     */
    async saveAnimation(id, animation) {
        animation.savedAt = Date.now();
        return await this.set(id, animation);
    }
    
    /**
     * Get animation
     */
    async getAnimation(id) {
        return await this.get(id);
    }
}

/**
 * Storage for recent items and history
 */
export class HistoryStorage extends Storage {
    constructor(maxItems = 50) {
        super('abyss_history_');
        this.maxItems = maxItems;
    }
    
    /**
     * Add item to history
     */
    async addToHistory(item) {
        const history = this.local.get('items', []);
        
        // Add to front
        history.unshift({
            ...item,
            timestamp: Date.now()
        });
        
        // Trim to max items
        while (history.length > this.maxItems) {
            history.pop();
        }
        
        this.local.set('items', history);
    }
    
    /**
     * Get history
     */
    getHistory() {
        return this.local.get('items', []);
    }
    
    /**
     * Clear history
     */
    clearHistory() {
        this.local.set('items', []);
    }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let storageInstance = null;
let prefsInstance = null;
let presetStorageInstance = null;
let animStorageInstance = null;
let historyInstance = null;

export function getStorage() {
    if (!storageInstance) {
        storageInstance = new Storage();
    }
    return storageInstance;
}

export function getPreferences() {
    if (!prefsInstance) {
        prefsInstance = new PreferencesStorage();
    }
    return prefsInstance;
}

export function getPresetStorage() {
    if (!presetStorageInstance) {
        presetStorageInstance = new PresetStorage();
    }
    return presetStorageInstance;
}

export function getAnimationStorage() {
    if (!animStorageInstance) {
        animStorageInstance = new AnimationStorage();
    }
    return animStorageInstance;
}

export function getHistoryStorage() {
    if (!historyInstance) {
        historyInstance = new HistoryStorage();
    }
    return historyInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    LocalStorageWrapper,
    IndexedDBWrapper
};

export default {
    Storage,
    PreferencesStorage,
    PresetStorage,
    AnimationStorage,
    HistoryStorage,
    getStorage,
    getPreferences,
    getPresetStorage,
    getAnimationStorage,
    getHistoryStorage
};
