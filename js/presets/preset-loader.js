/**
 * ============================================================================
 * ABYSS EXPLORER - PRESET LOADER
 * ============================================================================
 * 
 * Central preset loading and management system. Handles loading, caching,
 * favorites, search/filtering, and integration with gallery/preset-browser.
 * 
 * Features:
 * - Lazy loading of preset collections
 * - Search by name, description, tags
 * - Filter by category, depth, difficulty
 * - Favorites management (localStorage)
 * - Recently viewed tracking
 * - Random preset selection
 * - Preset validation
 * 
 * @module presets/preset-loader
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Preset categories */
export const PRESET_CATEGORY = {
    MANDELBROT: 'mandelbrot',
    JULIA: 'julia',
    BURNING_SHIP: 'burning-ship',
    NEWTON: 'newton',
    TRICORN: 'tricorn',
    PHOENIX: 'phoenix',
    MANDELBULB: 'mandelbulb',
    MANDELBOX: 'mandelbox',
    JULIA_3D: 'julia-3d',
    KLEINIAN: 'kleinian',
    IFS: 'ifs',
    CUSTOM: 'custom'
};

/** Difficulty levels based on zoom depth */
export const DIFFICULTY = {
    BEGINNER: 'beginner',      // zoom < 1e6
    INTERMEDIATE: 'intermediate', // zoom 1e6 - 1e20
    ADVANCED: 'advanced',      // zoom 1e20 - 1e100
    EXPERT: 'expert',          // zoom 1e100 - 1e300
    LEGENDARY: 'legendary'     // zoom > 1e300
};

/** Tag categories */
export const TAGS = {
    // Visual
    SPIRAL: 'spiral',
    SYMMETRIC: 'symmetric',
    CHAOTIC: 'chaotic',
    TENTACLES: 'tentacles',
    MINIBROT: 'minibrot',
    JULIA_ISLAND: 'julia-island',
    
    // Regions
    SEAHORSE: 'seahorse-valley',
    ELEPHANT: 'elephant-valley',
    ANTENNA: 'antenna',
    CUSP: 'cusp',
    PERIOD_DOUBLING: 'period-doubling',
    
    // Aesthetic
    PSYCHEDELIC: 'psychedelic',
    ORGANIC: 'organic',
    GEOMETRIC: 'geometric',
    COSMIC: 'cosmic',
    DARK: 'dark',
    COLORFUL: 'colorful',
    
    // Technical
    DEEP_ZOOM: 'deep-zoom',
    ULTRA_DEEP: 'ultra-deep',
    PERTURBATION_REQUIRED: 'perturbation',
    ARBITRARY_PRECISION: 'arbitrary-precision'
};

// ============================================================================
// PRESET SCHEMA
// ============================================================================

/**
 * Preset object schema
 * @typedef {Object} Preset
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} description - Description
 * @property {string} category - Category (mandelbrot, julia, etc.)
 * @property {string[]} tags - Tags for filtering
 * @property {string} difficulty - Difficulty level
 * @property {Object} location - Camera/location data
 * @property {Object} params - Fractal parameters
 * @property {Object} coloring - Suggested coloring
 * @property {Object} palette - Suggested palette
 * @property {string} credit - Original discovery credit
 * @property {string} thumbnail - Thumbnail data or URL
 */

// ============================================================================
// PRESET LOADER CLASS
// ============================================================================

export class PresetLoader {
    /**
     * Create preset loader
     * @param {Object} options - Configuration
     */
    constructor(options = {}) {
        // Collections
        this.collections = new Map();
        this.loadedCollections = new Set();
        
        // Unified index
        this.allPresets = [];
        this.presetsById = new Map();
        
        // User data
        this.favorites = new Set();
        this.recentlyViewed = [];
        this.maxRecent = options.maxRecent || 50;
        
        // Search index
        this.searchIndex = null;
        
        // Callbacks
        this.onLoad = options.onLoad || null;
        this.onError = options.onError || null;
        
        // Load user data
        this._loadUserData();
    }
    
    // ========================================================================
    // COLLECTION LOADING
    // ========================================================================
    
    /**
     * Register a preset collection
     * @param {string} name - Collection name
     * @param {Function|Promise|Array} loader - Loader function or data
     */
    registerCollection(name, loader) {
        this.collections.set(name, {
            loader,
            loaded: false,
            presets: []
        });
    }
    
    /**
     * Load a specific collection
     * @param {string} name - Collection name
     * @returns {Promise<Array>}
     */
    async loadCollection(name) {
        const collection = this.collections.get(name);
        if (!collection) {
            throw new Error(`Collection not found: ${name}`);
        }
        
        if (collection.loaded) {
            return collection.presets;
        }
        
        try {
            let presets;
            
            if (typeof collection.loader === 'function') {
                presets = await collection.loader();
            } else if (collection.loader instanceof Promise) {
                presets = await collection.loader;
            } else if (Array.isArray(collection.loader)) {
                presets = collection.loader;
            } else {
                throw new Error('Invalid loader type');
            }
            
            // Validate and process presets
            presets = presets.map(p => this._validatePreset(p, name));
            
            // Add to collection
            collection.presets = presets;
            collection.loaded = true;
            this.loadedCollections.add(name);
            
            // Add to unified index
            this._addToIndex(presets);
            
            if (this.onLoad) {
                this.onLoad({ collection: name, count: presets.length });
            }
            
            return presets;
            
        } catch (error) {
            if (this.onError) this.onError(error);
            throw error;
        }
    }
    
    /**
     * Load all registered collections
     * @returns {Promise<number>} Total preset count
     */
    async loadAll() {
        const promises = [];
        
        for (const name of this.collections.keys()) {
            if (!this.loadedCollections.has(name)) {
                promises.push(this.loadCollection(name));
            }
        }
        
        await Promise.all(promises);
        return this.allPresets.length;
    }
    
    /**
     * Validate and normalize preset
     * @private
     */
    _validatePreset(preset, collectionName) {
        // Generate ID if missing
        if (!preset.id) {
            preset.id = `${collectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Ensure required fields
        preset.name = preset.name || 'Unnamed Preset';
        preset.description = preset.description || '';
        preset.category = preset.category || collectionName;
        preset.tags = preset.tags || [];
        preset.difficulty = preset.difficulty || this._calculateDifficulty(preset);
        
        return preset;
    }
    
    /**
     * Calculate difficulty from zoom level
     * @private
     */
    _calculateDifficulty(preset) {
        const zoom = preset.location?.zoom || preset.zoom || 1;
        
        // Handle string zoom (for extreme depths)
        let zoomMagnitude;
        if (typeof zoom === 'string') {
            const match = zoom.match(/e\+?(\d+)/i);
            zoomMagnitude = match ? parseInt(match[1]) : 0;
        } else {
            zoomMagnitude = Math.log10(zoom);
        }
        
        if (zoomMagnitude < 6) return DIFFICULTY.BEGINNER;
        if (zoomMagnitude < 20) return DIFFICULTY.INTERMEDIATE;
        if (zoomMagnitude < 100) return DIFFICULTY.ADVANCED;
        if (zoomMagnitude < 300) return DIFFICULTY.EXPERT;
        return DIFFICULTY.LEGENDARY;
    }
    
    /**
     * Add presets to search index
     * @private
     */
    _addToIndex(presets) {
        for (const preset of presets) {
            this.allPresets.push(preset);
            this.presetsById.set(preset.id, preset);
        }
        
        // Invalidate search index
        this.searchIndex = null;
    }
    
    // ========================================================================
    // RETRIEVAL
    // ========================================================================
    
    /**
     * Get preset by ID
     * @param {string} id
     * @returns {Preset|null}
     */
    getById(id) {
        return this.presetsById.get(id) || null;
    }
    
    /**
     * Get presets by category
     * @param {string} category
     * @returns {Preset[]}
     */
    getByCategory(category) {
        return this.allPresets.filter(p => p.category === category);
    }
    
    /**
     * Get presets by tag
     * @param {string} tag
     * @returns {Preset[]}
     */
    getByTag(tag) {
        return this.allPresets.filter(p => p.tags.includes(tag));
    }
    
    /**
     * Get presets by difficulty
     * @param {string} difficulty
     * @returns {Preset[]}
     */
    getByDifficulty(difficulty) {
        return this.allPresets.filter(p => p.difficulty === difficulty);
    }
    
    /**
     * Get random preset
     * @param {Object} filters - Optional filters
     * @returns {Preset}
     */
    getRandom(filters = {}) {
        let candidates = this.allPresets;
        
        if (filters.category) {
            candidates = candidates.filter(p => p.category === filters.category);
        }
        if (filters.difficulty) {
            candidates = candidates.filter(p => p.difficulty === filters.difficulty);
        }
        if (filters.tag) {
            candidates = candidates.filter(p => p.tags.includes(filters.tag));
        }
        
        if (candidates.length === 0) return null;
        
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    /**
     * Get all presets
     * @returns {Preset[]}
     */
    getAll() {
        return [...this.allPresets];
    }
    
    /**
     * Get preset count
     * @returns {number}
     */
    get count() {
        return this.allPresets.length;
    }
    
    // ========================================================================
    // SEARCH
    // ========================================================================
    
    /**
     * Search presets
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Preset[]}
     */
    search(query, options = {}) {
        if (!query || query.trim() === '') {
            return options.limit ? this.allPresets.slice(0, options.limit) : this.allPresets;
        }
        
        const queryLower = query.toLowerCase();
        const terms = queryLower.split(/\s+/);
        
        // Score each preset
        const scored = this.allPresets.map(preset => {
            let score = 0;
            
            // Name match (highest weight)
            const nameLower = preset.name.toLowerCase();
            if (nameLower === queryLower) {
                score += 100;
            } else if (nameLower.includes(queryLower)) {
                score += 50;
            } else {
                for (const term of terms) {
                    if (nameLower.includes(term)) score += 10;
                }
            }
            
            // Description match
            const descLower = (preset.description || '').toLowerCase();
            for (const term of terms) {
                if (descLower.includes(term)) score += 5;
            }
            
            // Tag match
            for (const tag of preset.tags) {
                if (tag.toLowerCase().includes(queryLower)) score += 20;
                for (const term of terms) {
                    if (tag.toLowerCase().includes(term)) score += 8;
                }
            }
            
            // Category match
            if (preset.category.toLowerCase().includes(queryLower)) {
                score += 15;
            }
            
            return { preset, score };
        });
        
        // Filter and sort
        let results = scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.preset);
        
        // Apply filters
        if (options.category) {
            results = results.filter(p => p.category === options.category);
        }
        if (options.difficulty) {
            results = results.filter(p => p.difficulty === options.difficulty);
        }
        if (options.tags && options.tags.length > 0) {
            results = results.filter(p => 
                options.tags.some(t => p.tags.includes(t))
            );
        }
        
        // Apply limit
        if (options.limit) {
            results = results.slice(0, options.limit);
        }
        
        return results;
    }
    
    /**
     * Get search suggestions
     * @param {string} query
     * @param {number} limit
     * @returns {string[]}
     */
    getSuggestions(query, limit = 10) {
        if (!query) return [];
        
        const queryLower = query.toLowerCase();
        const suggestions = new Set();
        
        // Collect matching names
        for (const preset of this.allPresets) {
            if (preset.name.toLowerCase().includes(queryLower)) {
                suggestions.add(preset.name);
            }
            if (suggestions.size >= limit) break;
        }
        
        // Add matching tags
        for (const preset of this.allPresets) {
            for (const tag of preset.tags) {
                if (tag.toLowerCase().includes(queryLower)) {
                    suggestions.add(tag);
                }
            }
            if (suggestions.size >= limit * 2) break;
        }
        
        return Array.from(suggestions).slice(0, limit);
    }
    
    // ========================================================================
    // FAVORITES
    // ========================================================================
    
    /**
     * Add to favorites
     * @param {string} id
     */
    addFavorite(id) {
        this.favorites.add(id);
        this._saveUserData();
    }
    
    /**
     * Remove from favorites
     * @param {string} id
     */
    removeFavorite(id) {
        this.favorites.delete(id);
        this._saveUserData();
    }
    
    /**
     * Toggle favorite status
     * @param {string} id
     * @returns {boolean} New favorite status
     */
    toggleFavorite(id) {
        if (this.favorites.has(id)) {
            this.favorites.delete(id);
        } else {
            this.favorites.add(id);
        }
        this._saveUserData();
        return this.favorites.has(id);
    }
    
    /**
     * Check if preset is favorite
     * @param {string} id
     * @returns {boolean}
     */
    isFavorite(id) {
        return this.favorites.has(id);
    }
    
    /**
     * Get all favorites
     * @returns {Preset[]}
     */
    getFavorites() {
        return Array.from(this.favorites)
            .map(id => this.presetsById.get(id))
            .filter(Boolean);
    }
    
    // ========================================================================
    // RECENTLY VIEWED
    // ========================================================================
    
    /**
     * Mark preset as viewed
     * @param {string} id
     */
    markViewed(id) {
        // Remove if already in list
        this.recentlyViewed = this.recentlyViewed.filter(r => r.id !== id);
        
        // Add to front
        this.recentlyViewed.unshift({
            id,
            timestamp: Date.now()
        });
        
        // Trim to max
        if (this.recentlyViewed.length > this.maxRecent) {
            this.recentlyViewed = this.recentlyViewed.slice(0, this.maxRecent);
        }
        
        this._saveUserData();
    }
    
    /**
     * Get recently viewed presets
     * @param {number} limit
     * @returns {Preset[]}
     */
    getRecentlyViewed(limit = 20) {
        return this.recentlyViewed
            .slice(0, limit)
            .map(r => this.presetsById.get(r.id))
            .filter(Boolean);
    }
    
    // ========================================================================
    // USER DATA PERSISTENCE
    // ========================================================================
    
    /**
     * Load user data from localStorage
     * @private
     */
    _loadUserData() {
        try {
            const data = localStorage.getItem('abyss-preset-user-data');
            if (data) {
                const parsed = JSON.parse(data);
                this.favorites = new Set(parsed.favorites || []);
                this.recentlyViewed = parsed.recentlyViewed || [];
            }
        } catch (e) {
            console.warn('Failed to load preset user data:', e);
        }
    }
    
    /**
     * Save user data to localStorage
     * @private
     */
    _saveUserData() {
        try {
            const data = {
                favorites: Array.from(this.favorites),
                recentlyViewed: this.recentlyViewed
            };
            localStorage.setItem('abyss-preset-user-data', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save preset user data:', e);
        }
    }
    
    // ========================================================================
    // STATISTICS
    // ========================================================================
    
    /**
     * Get statistics about loaded presets
     * @returns {Object}
     */
    getStats() {
        const stats = {
            total: this.allPresets.length,
            collections: this.loadedCollections.size,
            byCategory: {},
            byDifficulty: {},
            byTag: {},
            favorites: this.favorites.size,
            recentlyViewed: this.recentlyViewed.length
        };
        
        for (const preset of this.allPresets) {
            // Category
            stats.byCategory[preset.category] = 
                (stats.byCategory[preset.category] || 0) + 1;
            
            // Difficulty
            stats.byDifficulty[preset.difficulty] = 
                (stats.byDifficulty[preset.difficulty] || 0) + 1;
            
            // Tags
            for (const tag of preset.tags) {
                stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
            }
        }
        
        return stats;
    }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

export const presetLoader = new PresetLoader();

// ============================================================================
// EXPORTS
// ============================================================================

export { PRESET_CATEGORY, DIFFICULTY, TAGS };
export default PresetLoader;
