/**
 * ============================================================================
 * ABYSS EXPLORER - PRESET BROWSER
 * ============================================================================
 * 
 * Dedicated modal/panel for browsing and managing presets.
 * Features search, categories, favorites, and user-saved presets.
 * 
 * @module ui/preset-browser
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { UI_EVENTS } from './ui-manager.js';

// ============================================================================
// PRESET TYPES
// ============================================================================

export const PRESET_TYPES = {
    FRACTAL: 'fractal',
    LOCATION: 'location',
    PALETTE: 'palette',
    COLORING: 'coloring',
    ANIMATION: 'animation'
};

// ============================================================================
// BUILT-IN PRESETS
// ============================================================================

const BUILTIN_PRESETS = [
    // Fractal presets
    {
        id: 'mandelbrot-default',
        type: PRESET_TYPES.FRACTAL,
        name: 'Mandelbrot Classic',
        category: 'fractal',
        fractal: 'mandelbrot',
        params: { power: 2, maxIterations: 1000 }
    },
    {
        id: 'mandelbrot-cubic',
        type: PRESET_TYPES.FRACTAL,
        name: 'Cubic Mandelbrot',
        category: 'fractal',
        fractal: 'mandelbrot',
        params: { power: 3, maxIterations: 500 }
    },
    {
        id: 'julia-classic',
        type: PRESET_TYPES.FRACTAL,
        name: 'Julia Classic',
        category: 'fractal',
        fractal: 'julia',
        params: { juliaReal: -0.7, juliaImag: 0.27015 }
    },
    {
        id: 'burning-ship-default',
        type: PRESET_TYPES.FRACTAL,
        name: 'Burning Ship',
        category: 'fractal',
        fractal: 'burning-ship',
        params: {}
    },
    
    // Location presets
    {
        id: 'loc-seahorse',
        type: PRESET_TYPES.LOCATION,
        name: 'Seahorse Valley',
        category: 'location',
        camera: { centerX: -0.745, centerY: 0.113, zoom: 200 }
    },
    {
        id: 'loc-elephant',
        type: PRESET_TYPES.LOCATION,
        name: 'Elephant Valley',
        category: 'location',
        camera: { centerX: 0.275, centerY: 0.006, zoom: 150 }
    },
    {
        id: 'loc-spiral',
        type: PRESET_TYPES.LOCATION,
        name: 'Deep Spiral',
        category: 'location',
        camera: { centerX: -0.761574, centerY: -0.0847596, zoom: 1e6 }
    },
    
    // Palette presets
    {
        id: 'pal-rainbow',
        type: PRESET_TYPES.PALETTE,
        name: 'Rainbow Spectrum',
        category: 'palette',
        palette: 'rainbow-spectrum'
    },
    {
        id: 'pal-fire',
        type: PRESET_TYPES.PALETTE,
        name: 'Inferno',
        category: 'palette',
        palette: 'inferno'
    },
    {
        id: 'pal-ocean',
        type: PRESET_TYPES.PALETTE,
        name: 'Deep Ocean',
        category: 'palette',
        palette: 'deep-ocean'
    },
    {
        id: 'pal-cosmic',
        type: PRESET_TYPES.PALETTE,
        name: 'Cosmic Purple',
        category: 'palette',
        palette: 'cosmic-nebula'
    },
    
    // Coloring presets
    {
        id: 'color-smooth',
        type: PRESET_TYPES.COLORING,
        name: 'Smooth Iteration',
        category: 'coloring',
        coloring: 'smooth-iteration',
        coloringParams: {}
    },
    {
        id: 'color-orbit',
        type: PRESET_TYPES.COLORING,
        name: 'Orbit Trap',
        category: 'coloring',
        coloring: 'orbit-trap',
        coloringParams: { trapType: 'cross' }
    },
    {
        id: 'color-distance',
        type: PRESET_TYPES.COLORING,
        name: 'Distance Estimation',
        category: 'coloring',
        coloring: 'distance-estimation',
        coloringParams: {}
    },
    
    // Animation presets
    {
        id: 'anim-zoom-in',
        type: PRESET_TYPES.ANIMATION,
        name: 'Smooth Zoom In',
        category: 'animation',
        animation: { type: 'zoom', target: 100, duration: 5000 }
    },
    {
        id: 'anim-seahorse-dive',
        type: PRESET_TYPES.ANIMATION,
        name: 'Seahorse Valley Dive',
        category: 'animation',
        animationPath: 'seahorse-valley'
    }
];

// ============================================================================
// PRESET BROWSER CLASS
// ============================================================================

export class PresetBrowser {
    /**
     * Create preset browser
     * @param {Object} options - Options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.container = options.container || null;
        
        // State
        this.presets = [...BUILTIN_PRESETS];
        this.userPresets = [];
        this.favorites = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.selectedPreset = null;
        
        // Elements
        this.element = null;
        this.listElement = null;
        this.previewElement = null;
        
        // Load user data
        this._loadUserData();
        
        // Build if container provided
        if (this.container) {
            this._build();
        }
    }
    
    /**
     * Set UI manager reference
     */
    setManager(manager) {
        this.manager = manager;
    }
    
    // ========================================================================
    // BUILD
    // ========================================================================
    
    /**
     * Build preset browser DOM
     * @private
     */
    _build() {
        this.element = document.createElement('div');
        this.element.className = 'preset-browser';
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-label', 'Preset Browser');
        
        this.element.innerHTML = `
            <div class="preset-browser-layout">
                <aside class="preset-sidebar">
                    <div class="preset-search">
                        <input type="text" 
                               placeholder="Search presets..." 
                               aria-label="Search presets"
                               class="preset-search-input">
                        <svg viewBox="0 0 24 24" width="16" height="16" class="search-icon">
                            <circle cx="11" cy="11" r="7" stroke="currentColor" fill="none" stroke-width="2"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </div>
                    
                    <nav class="preset-categories" aria-label="Categories">
                        <button class="category-btn active" data-category="all">
                            <span class="cat-icon">📁</span> All Presets
                        </button>
                        <button class="category-btn" data-category="favorites">
                            <span class="cat-icon">⭐</span> Favorites
                        </button>
                        <button class="category-btn" data-category="recent">
                            <span class="cat-icon">🕐</span> Recent
                        </button>
                        
                        <div class="category-divider"></div>
                        
                        <button class="category-btn" data-category="fractal">
                            <span class="cat-icon">🌀</span> Fractals
                        </button>
                        <button class="category-btn" data-category="location">
                            <span class="cat-icon">📍</span> Locations
                        </button>
                        <button class="category-btn" data-category="palette">
                            <span class="cat-icon">🌈</span> Palettes
                        </button>
                        <button class="category-btn" data-category="coloring">
                            <span class="cat-icon">🎨</span> Coloring
                        </button>
                        <button class="category-btn" data-category="animation">
                            <span class="cat-icon">🎬</span> Animations
                        </button>
                        
                        <div class="category-divider"></div>
                        
                        <button class="category-btn" data-category="user">
                            <span class="cat-icon">👤</span> My Presets
                        </button>
                    </nav>
                </aside>
                
                <main class="preset-main">
                    <header class="preset-header">
                        <h3 class="preset-title">All Presets</h3>
                        <span class="preset-count">0 presets</span>
                    </header>
                    
                    <div class="preset-list" role="listbox" aria-label="Preset list">
                    </div>
                </main>
                
                <aside class="preset-preview">
                    <div class="preview-placeholder">
                        <span>Select a preset to preview</span>
                    </div>
                    <div class="preview-content" style="display: none;">
                        <div class="preview-thumbnail"></div>
                        <div class="preview-info">
                            <h3 class="preview-name"></h3>
                            <p class="preview-desc"></p>
                            <div class="preview-meta"></div>
                        </div>
                        <div class="preview-actions">
                            <button class="btn btn-primary apply-preset">Apply</button>
                            <button class="btn btn-secondary favorite-preset">⭐ Favorite</button>
                        </div>
                    </div>
                </aside>
            </div>
            
            <footer class="preset-browser-footer">
                <button class="btn btn-secondary create-preset">
                    + Save Current as Preset
                </button>
                <button class="btn btn-secondary import-preset">
                    Import Preset
                </button>
            </footer>
        `;
        
        // Get references
        this.listElement = this.element.querySelector('.preset-list');
        this.previewElement = this.element.querySelector('.preset-preview');
        
        // Setup events
        this._setupEvents();
        
        // Initial render
        this._renderPresets();
        
        // Add to container
        this.container.appendChild(this.element);
    }
    
    /**
     * Setup event handlers
     * @private
     */
    _setupEvents() {
        // Search
        const searchInput = this.element.querySelector('.preset-search-input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this._renderPresets();
        });
        
        // Categories
        this.element.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.category;
                
                this.element.querySelectorAll('.category-btn').forEach(b => 
                    b.classList.toggle('active', b === btn));
                
                this._updateTitle();
                this._renderPresets();
            });
        });
        
        // Apply button
        this.element.querySelector('.apply-preset').addEventListener('click', () => {
            if (this.selectedPreset) {
                this.applyPreset(this.selectedPreset);
            }
        });
        
        // Favorite button
        this.element.querySelector('.favorite-preset').addEventListener('click', () => {
            if (this.selectedPreset) {
                this.toggleFavorite(this.selectedPreset.id);
            }
        });
        
        // Create preset
        this.element.querySelector('.create-preset').addEventListener('click', () => {
            this._createPresetFromCurrent();
        });
        
        // Import preset
        this.element.querySelector('.import-preset').addEventListener('click', () => {
            this._importPreset();
        });
    }
    
    // ========================================================================
    // RENDERING
    // ========================================================================
    
    /**
     * Render preset list
     * @private
     */
    _renderPresets() {
        const filtered = this._getFilteredPresets();
        
        // Update count
        this.element.querySelector('.preset-count').textContent = 
            `${filtered.length} preset${filtered.length !== 1 ? 's' : ''}`;
        
        if (filtered.length === 0) {
            this.listElement.innerHTML = `
                <div class="preset-empty">
                    <p>No presets found</p>
                    ${this.searchQuery ? `<p>Try a different search term</p>` : ''}
                </div>
            `;
            return;
        }
        
        this.listElement.innerHTML = filtered.map(preset => `
            <div class="preset-item ${preset.id === this.selectedPreset?.id ? 'selected' : ''}"
                 role="option"
                 aria-selected="${preset.id === this.selectedPreset?.id}"
                 data-id="${preset.id}">
                <div class="preset-item-icon">
                    ${this._getPresetIcon(preset.type)}
                </div>
                <div class="preset-item-info">
                    <span class="preset-item-name">${preset.name}</span>
                    <span class="preset-item-type">${preset.type}</span>
                </div>
                ${this.favorites.includes(preset.id) ? '<span class="preset-item-star">⭐</span>' : ''}
            </div>
        `).join('');
        
        // Setup item events
        this.listElement.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => {
                this._selectPreset(item.dataset.id);
            });
            
            item.addEventListener('dblclick', () => {
                this._selectPreset(item.dataset.id);
                this.applyPreset(this.selectedPreset);
            });
        });
    }
    
    /**
     * Get preset icon
     * @private
     */
    _getPresetIcon(type) {
        const icons = {
            [PRESET_TYPES.FRACTAL]: '🌀',
            [PRESET_TYPES.LOCATION]: '📍',
            [PRESET_TYPES.PALETTE]: '🌈',
            [PRESET_TYPES.COLORING]: '🎨',
            [PRESET_TYPES.ANIMATION]: '🎬'
        };
        return icons[type] || '📄';
    }
    
    /**
     * Update title based on filter
     * @private
     */
    _updateTitle() {
        const titles = {
            all: 'All Presets',
            favorites: 'Favorites',
            recent: 'Recent',
            fractal: 'Fractal Presets',
            location: 'Location Presets',
            palette: 'Palette Presets',
            coloring: 'Coloring Presets',
            animation: 'Animation Presets',
            user: 'My Presets'
        };
        this.element.querySelector('.preset-title').textContent = 
            titles[this.currentFilter] || 'Presets';
    }
    
    /**
     * Select a preset
     * @private
     */
    _selectPreset(id) {
        const preset = this._findPreset(id);
        if (!preset) return;
        
        this.selectedPreset = preset;
        
        // Update list selection
        this.listElement.querySelectorAll('.preset-item').forEach(item => {
            const isSelected = item.dataset.id === id;
            item.classList.toggle('selected', isSelected);
            item.setAttribute('aria-selected', isSelected);
        });
        
        // Show preview
        this._showPreview(preset);
        
        // Add to recent
        this._addToRecent(id);
    }
    
    /**
     * Show preset preview
     * @private
     */
    _showPreview(preset) {
        const placeholder = this.previewElement.querySelector('.preview-placeholder');
        const content = this.previewElement.querySelector('.preview-content');
        
        placeholder.style.display = 'none';
        content.style.display = 'block';
        
        // Update preview content
        content.querySelector('.preview-name').textContent = preset.name;
        content.querySelector('.preview-desc').textContent = 
            preset.description || `A ${preset.type} preset`;
        
        // Meta info
        const meta = [];
        if (preset.type) meta.push(`Type: ${preset.type}`);
        if (preset.fractal) meta.push(`Fractal: ${preset.fractal}`);
        if (preset.params?.maxIterations) meta.push(`Iterations: ${preset.params.maxIterations}`);
        content.querySelector('.preview-meta').textContent = meta.join(' • ');
        
        // Favorite button
        const favBtn = content.querySelector('.favorite-preset');
        favBtn.textContent = this.favorites.includes(preset.id) ? '★ Unfavorite' : '☆ Favorite';
        
        // Thumbnail
        const thumbnail = content.querySelector('.preview-thumbnail');
        thumbnail.style.background = this._generatePreviewGradient(preset);
    }
    
    /**
     * Generate preview gradient
     * @private
     */
    _generatePreviewGradient(preset) {
        const hue = Math.abs(preset.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360;
        return `linear-gradient(135deg, hsl(${hue}, 60%, 30%), hsl(${(hue + 60) % 360}, 60%, 50%))`;
    }
    
    // ========================================================================
    // FILTERING
    // ========================================================================
    
    /**
     * Get filtered presets
     * @private
     */
    _getFilteredPresets() {
        let result = [...this.presets, ...this.userPresets];
        
        // Filter by category
        switch (this.currentFilter) {
            case 'favorites':
                result = result.filter(p => this.favorites.includes(p.id));
                break;
            case 'recent':
                const recent = this._getRecent();
                result = recent.map(id => this._findPreset(id)).filter(Boolean);
                break;
            case 'user':
                result = this.userPresets;
                break;
            case 'all':
                break;
            default:
                result = result.filter(p => p.type === this.currentFilter || p.category === this.currentFilter);
        }
        
        // Search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.type?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
            );
        }
        
        return result;
    }
    
    /**
     * Find preset by ID
     * @private
     */
    _findPreset(id) {
        return this.presets.find(p => p.id === id) || 
               this.userPresets.find(p => p.id === id);
    }
    
    // ========================================================================
    // APPLY PRESET
    // ========================================================================
    
    /**
     * Apply a preset
     * @param {Object} preset
     */
    applyPreset(preset) {
        if (!preset) return;
        
        switch (preset.type) {
            case PRESET_TYPES.FRACTAL:
                if (preset.fractal) {
                    this.manager?.setFractal(preset.fractal);
                }
                if (preset.params) {
                    Object.entries(preset.params).forEach(([key, value]) => {
                        this.manager?.setParameter(key, value);
                    });
                }
                break;
                
            case PRESET_TYPES.LOCATION:
                if (preset.camera) {
                    this.manager?.emit(UI_EVENTS.CAMERA_ANIMATE, {
                        ...preset.camera,
                        duration: 1500
                    });
                }
                break;
                
            case PRESET_TYPES.PALETTE:
                this.manager?.emit(UI_EVENTS.PALETTE_CHANGE, { id: preset.palette });
                break;
                
            case PRESET_TYPES.COLORING:
                this.manager?.emit(UI_EVENTS.COLORING_CHANGE, preset.coloring);
                if (preset.coloringParams) {
                    Object.entries(preset.coloringParams).forEach(([key, value]) => {
                        this.manager?.setParameter(key, value);
                    });
                }
                break;
                
            case PRESET_TYPES.ANIMATION:
                if (preset.animationPath) {
                    this.manager?.emit('animation:load-preset', preset.animationPath);
                }
                break;
        }
        
        // Close browser
        this.manager?.closeModal();
        
        // Notify
        this.manager?.emit('notification', {
            message: `Applied: ${preset.name}`,
            type: 'success'
        });
    }
    
    // ========================================================================
    // USER DATA
    // ========================================================================
    
    /**
     * Load user data from storage
     * @private
     */
    _loadUserData() {
        try {
            this.userPresets = JSON.parse(localStorage.getItem('abyss-user-presets') || '[]');
            this.favorites = JSON.parse(localStorage.getItem('abyss-preset-favorites') || '[]');
        } catch {}
    }
    
    /**
     * Save user presets
     * @private
     */
    _saveUserPresets() {
        try {
            localStorage.setItem('abyss-user-presets', JSON.stringify(this.userPresets));
        } catch {}
    }
    
    /**
     * Save favorites
     * @private
     */
    _saveFavorites() {
        try {
            localStorage.setItem('abyss-preset-favorites', JSON.stringify(this.favorites));
        } catch {}
    }
    
    /**
     * Toggle favorite status
     * @param {string} id
     */
    toggleFavorite(id) {
        const index = this.favorites.indexOf(id);
        if (index >= 0) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(id);
        }
        this._saveFavorites();
        
        // Update UI
        if (this.selectedPreset?.id === id) {
            const favBtn = this.previewElement.querySelector('.favorite-preset');
            favBtn.textContent = this.favorites.includes(id) ? '★ Unfavorite' : '☆ Favorite';
        }
        
        this._renderPresets();
    }
    
    /**
     * Get recent presets
     * @private
     */
    _getRecent() {
        try {
            return JSON.parse(localStorage.getItem('abyss-recent-presets') || '[]');
        } catch {
            return [];
        }
    }
    
    /**
     * Add to recent
     * @private
     */
    _addToRecent(id) {
        let recent = this._getRecent();
        recent = recent.filter(r => r !== id);
        recent.unshift(id);
        recent = recent.slice(0, 20); // Keep last 20
        
        try {
            localStorage.setItem('abyss-recent-presets', JSON.stringify(recent));
        } catch {}
    }
    
    // ========================================================================
    // CREATE/IMPORT
    // ========================================================================
    
    /**
     * Create preset from current state
     * @private
     */
    _createPresetFromCurrent() {
        const name = prompt('Preset name:', 'My Preset');
        if (!name) return;
        
        // Get current state from manager
        const camera = this.manager?.camera2d;
        
        const preset = {
            id: `user_${Date.now()}`,
            type: PRESET_TYPES.LOCATION, // Default to location
            name,
            description: 'User created preset',
            category: 'user',
            camera: camera ? {
                centerX: camera.centerX,
                centerY: camera.centerY,
                zoom: camera.zoom
            } : null,
            created: Date.now()
        };
        
        this.userPresets.push(preset);
        this._saveUserPresets();
        this._renderPresets();
        
        this.manager?.emit('notification', {
            message: 'Preset saved!',
            type: 'success'
        });
    }
    
    /**
     * Import preset from JSON
     * @private
     */
    _importPreset() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const preset = JSON.parse(text);
                
                // Validate
                if (!preset.name || !preset.type) {
                    throw new Error('Invalid preset format');
                }
                
                preset.id = `imported_${Date.now()}`;
                this.userPresets.push(preset);
                this._saveUserPresets();
                this._renderPresets();
                
                this.manager?.emit('notification', {
                    message: `Imported: ${preset.name}`,
                    type: 'success'
                });
            } catch (err) {
                this.manager?.emit('notification', {
                    message: 'Failed to import preset',
                    type: 'error'
                });
            }
        };
        
        input.click();
    }
    
    /**
     * Export preset to JSON
     * @param {Object} preset
     */
    exportPreset(preset) {
        const json = JSON.stringify(preset, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Delete user preset
     * @param {string} id
     */
    deletePreset(id) {
        const index = this.userPresets.findIndex(p => p.id === id);
        if (index >= 0) {
            this.userPresets.splice(index, 1);
            this._saveUserPresets();
            this._renderPresets();
        }
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Get element for modal
     * @returns {HTMLElement}
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Add a preset
     * @param {Object} preset
     */
    addPreset(preset) {
        if (preset.id?.startsWith('user')) {
            this.userPresets.push(preset);
            this._saveUserPresets();
        } else {
            this.presets.push(preset);
        }
        this._renderPresets();
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { PRESET_TYPES, BUILTIN_PRESETS };
export default PresetBrowser;
