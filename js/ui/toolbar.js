/**
 * ============================================================================
 * ABYSS EXPLORER - TOOLBAR
 * ============================================================================
 * 
 * Top toolbar with essential controls for mode switching, view reset,
 * exploration, recording, and fullscreen. Includes search for presets.
 * 
 * Layout:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ ☰ │ ABYSS │ 2D│3D │ 🔄 │ 🎲 │ ⏺ │ 🔍 Search...        │ ℹ │ ⛶ │ ❓ │ │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module ui/toolbar
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { UI_EVENTS } from './ui-manager.js';

// ============================================================================
// TOOLBAR CLASS
// ============================================================================

export class Toolbar {
    /**
     * Create toolbar
     * @param {Object} options - Toolbar options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.container = options.container || null;
        
        // State
        this.is3DMode = false;
        this.isRecording = false;
        this.isFullscreen = false;
        this.searchOpen = false;
        
        // Elements
        this.element = null;
        this.searchInput = null;
        this.searchResults = null;
        
        // Search data
        this.searchItems = this._buildSearchIndex();
        
        // Build
        if (this.container) {
            this._build();
        }
    }
    
    /**
     * Set UI manager reference
     * @param {UIManager} manager
     */
    setManager(manager) {
        this.manager = manager;
        this._setupEvents();
    }
    
    // ========================================================================
    // BUILD
    // ========================================================================
    
    /**
     * Build toolbar DOM
     * @private
     */
    _build() {
        this.element = document.createElement('header');
        this.element.className = 'toolbar';
        this.element.setAttribute('role', 'toolbar');
        this.element.setAttribute('aria-label', 'Main toolbar');
        
        this.element.innerHTML = `
            <div class="toolbar-left">
                <button class="toolbar-btn menu-toggle" 
                        aria-label="Toggle menu" 
                        data-action="menu">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" 
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                
                <span class="toolbar-brand">
                    <span class="brand-icon">🌀</span>
                    <span class="brand-text">Abyss</span>
                </span>
                
                <div class="toolbar-divider"></div>
                
                <div class="mode-switch" role="group" aria-label="View mode">
                    <button class="mode-btn active" data-mode="2d" 
                            aria-pressed="true" title="2D View (1)">
                        2D
                    </button>
                    <button class="mode-btn" data-mode="3d" 
                            aria-pressed="false" title="3D View (2)">
                        3D
                    </button>
                </div>
            </div>
            
            <div class="toolbar-center">
                <button class="toolbar-btn" data-action="reset" 
                        title="Reset View (Space)">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M3 12a9 9 0 1 0 9-9M3 3v6h6" 
                              stroke="currentColor" fill="none" 
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span class="btn-label">Reset</span>
                </button>
                
                <button class="toolbar-btn" data-action="random" 
                        title="Random Explore (R)">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path d="M19.5 8.5L21 7l-2-2m-5 0h5a2 2 0 0 1 2 2v3M3 17l1.5-1.5M3 7l2 2m0 8l-2 2M8 3v5l-2-2M16 21v-5l2 2" 
                              stroke="currentColor" fill="none" 
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <span class="btn-label">Explore</span>
                </button>
                
                <div class="toolbar-divider"></div>
                
                <button class="toolbar-btn record-btn" data-action="record" 
                        title="Record Animation">
                    <span class="record-dot"></span>
                    <span class="btn-label">Record</span>
                </button>
                
                <div class="toolbar-divider"></div>
                
                <div class="search-container">
                    <button class="toolbar-btn search-toggle" 
                            data-action="search" title="Search (/)">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <circle cx="11" cy="11" r="7" stroke="currentColor" 
                                    fill="none" stroke-width="2"/>
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" 
                                  stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                    
                    <div class="search-input-wrapper">
                        <input type="text" class="search-input" 
                               placeholder="Search presets, formulas..."
                               aria-label="Search">
                        <button class="search-close" aria-label="Close search">×</button>
                    </div>
                    
                    <div class="search-results" role="listbox" aria-label="Search results">
                    </div>
                </div>
            </div>
            
            <div class="toolbar-right">
                <button class="toolbar-btn" data-action="gallery" 
                        title="Gallery (G)">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <rect x="3" y="3" width="7" height="7" rx="1" 
                              stroke="currentColor" fill="none" stroke-width="2"/>
                        <rect x="14" y="3" width="7" height="7" rx="1" 
                              stroke="currentColor" fill="none" stroke-width="2"/>
                        <rect x="3" y="14" width="7" height="7" rx="1" 
                              stroke="currentColor" fill="none" stroke-width="2"/>
                        <rect x="14" y="14" width="7" height="7" rx="1" 
                              stroke="currentColor" fill="none" stroke-width="2"/>
                    </svg>
                </button>
                
                <button class="toolbar-btn" data-action="info" 
                        title="Info Overlay (I)">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" 
                                fill="none" stroke-width="2"/>
                        <path d="M12 16v-4M12 8h.01" stroke="currentColor" 
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                
                <button class="toolbar-btn" data-action="fullscreen" 
                        title="Fullscreen (F)">
                    <svg viewBox="0 0 24 24" width="18" height="18" class="fullscreen-enter">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" 
                              stroke="currentColor" fill="none" 
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <svg viewBox="0 0 24 24" width="18" height="18" class="fullscreen-exit" style="display:none">
                        <path d="M8 3v4a1 1 0 0 1-1 1H3m18 0h-4a1 1 0 0 1-1-1V3m0 18v-4a1 1 0 0 1 1-1h4M3 16h4a1 1 0 0 1 1 1v4" 
                              stroke="currentColor" fill="none" 
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                
                <button class="toolbar-btn" data-action="help" 
                        title="Help (H)">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" 
                                fill="none" stroke-width="2"/>
                        <path d="M9 9a3 3 0 1 1 3 3v2M12 17h.01" 
                              stroke="currentColor" fill="none" 
                              stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                
                <button class="toolbar-btn theme-toggle" data-action="theme" 
                        title="Toggle Theme">
                    <svg viewBox="0 0 24 24" width="18" height="18" class="theme-dark">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" 
                              stroke="currentColor" fill="none" stroke-width="2"/>
                    </svg>
                    <svg viewBox="0 0 24 24" width="18" height="18" class="theme-light" style="display:none">
                        <circle cx="12" cy="12" r="5" stroke="currentColor" 
                                fill="none" stroke-width="2"/>
                        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" 
                              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
        
        // Get references
        this.searchInput = this.element.querySelector('.search-input');
        this.searchResults = this.element.querySelector('.search-results');
        
        // Setup events
        this._setupToolbarEvents();
        
        // Add to container
        this.container.appendChild(this.element);
    }
    
    /**
     * Setup toolbar event handlers
     * @private
     */
    _setupToolbarEvents() {
        // Button clicks
        this.element.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this._handleAction(action);
            });
        });
        
        // Mode switch
        this.element.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMode(btn.dataset.mode === '3d');
            });
        });
        
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this._handleSearch(e.target.value);
        });
        
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this._focusSearchResult(1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this._focusSearchResult(-1);
            } else if (e.key === 'Enter') {
                this._selectFocusedResult();
            }
        });
        
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value) {
                this._showSearchResults();
            }
        });
        
        // Search close
        this.element.querySelector('.search-close').addEventListener('click', () => {
            this.closeSearch();
        });
        
        // Click outside search to close
        document.addEventListener('click', (e) => {
            if (this.searchOpen && !e.target.closest('.search-container')) {
                this.closeSearch();
            }
        });
        
        // Keyboard shortcut for search
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.openSearch();
            }
        });
    }
    
    /**
     * Handle toolbar action
     * @private
     */
    _handleAction(action) {
        switch (action) {
            case 'menu':
                this.manager?.toggleSidebar();
                break;
            case 'reset':
                this.manager?.resetView();
                break;
            case 'random':
                this.manager?.randomExplore();
                break;
            case 'record':
                this.toggleRecording();
                break;
            case 'search':
                this.toggleSearch();
                break;
            case 'gallery':
                this.manager?.openModal('gallery');
                break;
            case 'info':
                this.manager?.toggleInfoOverlay();
                break;
            case 'fullscreen':
                this.manager?.toggleFullscreen();
                break;
            case 'help':
                this.manager?.openModal('help');
                break;
            case 'theme':
                this.toggleTheme();
                break;
        }
    }
    
    // ========================================================================
    // MODE SWITCH
    // ========================================================================
    
    /**
     * Set 2D/3D mode
     * @param {boolean} is3D - Whether to use 3D mode
     */
    setMode(is3D) {
        this.is3DMode = is3D;
        
        this.element.querySelectorAll('.mode-btn').forEach(btn => {
            const isActive = (btn.dataset.mode === '3d') === is3D;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });
        
        this.manager?.setMode(is3D);
    }
    
    // ========================================================================
    // RECORDING
    // ========================================================================
    
    /**
     * Toggle recording state
     */
    toggleRecording() {
        this.isRecording = !this.isRecording;
        
        const btn = this.element.querySelector('[data-action="record"]');
        btn.classList.toggle('recording', this.isRecording);
        
        if (this.isRecording) {
            this.manager?.startRecording();
        } else {
            this.manager?.stopRecording();
        }
    }
    
    // ========================================================================
    // SEARCH
    // ========================================================================
    
    /**
     * Build search index
     * @private
     */
    _buildSearchIndex() {
        return [
            // Fractals
            { type: 'fractal', id: 'mandelbrot', name: 'Mandelbrot Set', keywords: ['classic', 'z²+c'] },
            { type: 'fractal', id: 'julia', name: 'Julia Set', keywords: ['connected', 'complex'] },
            { type: 'fractal', id: 'burning-ship', name: 'Burning Ship', keywords: ['absolute', 'abs'] },
            { type: 'fractal', id: 'tricorn', name: 'Tricorn', keywords: ['mandelbar', 'conjugate'] },
            { type: 'fractal', id: 'phoenix', name: 'Phoenix Fractal', keywords: ['memory'] },
            { type: 'fractal', id: 'newton', name: 'Newton Fractal', keywords: ['root', 'polynomial'] },
            { type: 'fractal', id: 'mandelbulb', name: 'Mandelbulb', keywords: ['3d', 'power'] },
            { type: 'fractal', id: 'mandelbox', name: 'Mandelbox', keywords: ['3d', 'fold'] },
            
            // Locations
            { type: 'location', id: 'seahorse', name: 'Seahorse Valley', keywords: ['spiral', 'classic'] },
            { type: 'location', id: 'elephant', name: 'Elephant Valley', keywords: ['trunk', 'classic'] },
            { type: 'location', id: 'lightning', name: 'Lightning', keywords: ['bolt', 'tendrils'] },
            { type: 'location', id: 'double-spiral', name: 'Double Spiral', keywords: ['two', 'helix'] },
            
            // Coloring
            { type: 'coloring', id: 'smooth', name: 'Smooth Iteration', keywords: ['continuous', 'gradient'] },
            { type: 'coloring', id: 'orbit-trap', name: 'Orbit Trap', keywords: ['distance', 'shape'] },
            { type: 'coloring', id: 'distance', name: 'Distance Estimation', keywords: ['boundary', 'glow'] },
            
            // Palettes
            { type: 'palette', id: 'rainbow', name: 'Rainbow', keywords: ['spectrum', 'color'] },
            { type: 'palette', id: 'fire', name: 'Fire', keywords: ['flame', 'hot', 'warm'] },
            { type: 'palette', id: 'ocean', name: 'Ocean', keywords: ['water', 'blue', 'sea'] },
            { type: 'palette', id: 'cosmic', name: 'Cosmic', keywords: ['space', 'galaxy', 'purple'] }
        ];
    }
    
    /**
     * Open search
     */
    openSearch() {
        this.searchOpen = true;
        this.element.querySelector('.search-container').classList.add('open');
        this.searchInput.focus();
    }
    
    /**
     * Close search
     */
    closeSearch() {
        this.searchOpen = false;
        this.element.querySelector('.search-container').classList.remove('open');
        this.searchInput.value = '';
        this.searchResults.innerHTML = '';
        this.searchResults.classList.remove('visible');
    }
    
    /**
     * Toggle search
     */
    toggleSearch() {
        if (this.searchOpen) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }
    
    /**
     * Handle search input
     * @private
     */
    _handleSearch(query) {
        if (!query.trim()) {
            this.searchResults.innerHTML = '';
            this.searchResults.classList.remove('visible');
            return;
        }
        
        const results = this._searchItems(query.toLowerCase());
        this._renderSearchResults(results);
    }
    
    /**
     * Search items
     * @private
     */
    _searchItems(query) {
        return this.searchItems.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(query);
            const keywordMatch = item.keywords.some(k => k.includes(query));
            return nameMatch || keywordMatch;
        }).slice(0, 8);
    }
    
    /**
     * Render search results
     * @private
     */
    _renderSearchResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-empty">No results found</div>
            `;
            this._showSearchResults();
            return;
        }
        
        const typeIcons = {
            fractal: '🌀',
            location: '📍',
            coloring: '🎨',
            palette: '🌈'
        };
        
        this.searchResults.innerHTML = results.map((item, i) => `
            <div class="search-result" 
                 role="option" 
                 tabindex="-1"
                 data-type="${item.type}" 
                 data-id="${item.id}"
                 ${i === 0 ? 'data-focused="true"' : ''}>
                <span class="result-icon">${typeIcons[item.type] || '•'}</span>
                <span class="result-name">${item.name}</span>
                <span class="result-type">${item.type}</span>
            </div>
        `).join('');
        
        // Add click handlers
        this.searchResults.querySelectorAll('.search-result').forEach(el => {
            el.addEventListener('click', () => {
                this._selectResult(el.dataset.type, el.dataset.id);
            });
        });
        
        this._showSearchResults();
    }
    
    /**
     * Show search results dropdown
     * @private
     */
    _showSearchResults() {
        this.searchResults.classList.add('visible');
    }
    
    /**
     * Focus search result
     * @private
     */
    _focusSearchResult(direction) {
        const results = Array.from(this.searchResults.querySelectorAll('.search-result'));
        if (results.length === 0) return;
        
        const current = this.searchResults.querySelector('[data-focused="true"]');
        let index = current ? results.indexOf(current) : -1;
        
        index += direction;
        if (index < 0) index = results.length - 1;
        if (index >= results.length) index = 0;
        
        results.forEach(r => r.removeAttribute('data-focused'));
        results[index].setAttribute('data-focused', 'true');
        results[index].scrollIntoView({ block: 'nearest' });
    }
    
    /**
     * Select focused result
     * @private
     */
    _selectFocusedResult() {
        const focused = this.searchResults.querySelector('[data-focused="true"]');
        if (focused) {
            this._selectResult(focused.dataset.type, focused.dataset.id);
        }
    }
    
    /**
     * Select a search result
     * @private
     */
    _selectResult(type, id) {
        this.closeSearch();
        
        switch (type) {
            case 'fractal':
                this.manager?.setFractal(id);
                break;
            case 'location':
                this.manager?.emit('location:goto', id);
                break;
            case 'coloring':
                this.manager?.emit(UI_EVENTS.COLORING_CHANGE, id);
                break;
            case 'palette':
                this.manager?.emit(UI_EVENTS.PALETTE_CHANGE, { id });
                break;
        }
    }
    
    // ========================================================================
    // THEME
    // ========================================================================
    
    /**
     * Toggle theme
     */
    toggleTheme() {
        const current = this.manager?.getActiveTheme() || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        this.manager?.setTheme(next);
        this._updateThemeIcon(next);
    }
    
    /**
     * Update theme icon
     * @private
     */
    _updateThemeIcon(theme) {
        const darkIcon = this.element.querySelector('.theme-dark');
        const lightIcon = this.element.querySelector('.theme-light');
        
        if (darkIcon && lightIcon) {
            darkIcon.style.display = theme === 'dark' ? 'block' : 'none';
            lightIcon.style.display = theme === 'light' ? 'block' : 'none';
        }
    }
    
    // ========================================================================
    // FULLSCREEN
    // ========================================================================
    
    /**
     * Update fullscreen icon
     * @param {boolean} isFullscreen
     */
    updateFullscreenIcon(isFullscreen) {
        this.isFullscreen = isFullscreen;
        
        const enterIcon = this.element.querySelector('.fullscreen-enter');
        const exitIcon = this.element.querySelector('.fullscreen-exit');
        
        if (enterIcon && exitIcon) {
            enterIcon.style.display = isFullscreen ? 'none' : 'block';
            exitIcon.style.display = isFullscreen ? 'block' : 'none';
        }
    }
    
    // ========================================================================
    // EVENTS
    // ========================================================================
    
    /**
     * Setup manager events
     * @private
     */
    _setupEvents() {
        if (!this.manager) return;
        
        this.manager.on(UI_EVENTS.FULLSCREEN_TOGGLE, (isFullscreen) => {
            this.updateFullscreenIcon(isFullscreen);
        });
        
        this.manager.on(UI_EVENTS.THEME_CHANGE, (theme) => {
            this._updateThemeIcon(theme);
        });
        
        this.manager.on('mode:change', (is3D) => {
            this.is3DMode = is3D;
            this.element.querySelectorAll('.mode-btn').forEach(btn => {
                const isActive = (btn.dataset.mode === '3d') === is3D;
                btn.classList.toggle('active', isActive);
            });
        });
    }
    
    /**
     * Add search item
     * @param {Object} item - Search item
     */
    addSearchItem(item) {
        this.searchItems.push(item);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Toolbar;
