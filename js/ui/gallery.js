/**
 * ============================================================================
 * ABYSS EXPLORER - GALLERY
 * ============================================================================
 * 
 * Thumbnail gallery browser for quick access to famous fractal locations.
 * Features grid/carousel views with lazy-loaded thumbnails.
 * 
 * @module ui/gallery
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { UI_EVENTS } from './ui-manager.js';

// ============================================================================
// GALLERY LOCATIONS
// ============================================================================

export const GALLERY_LOCATIONS = [
    // Mandelbrot Classics
    {
        id: 'seahorse-valley',
        name: 'Seahorse Valley',
        fractal: 'mandelbrot',
        centerX: -0.745,
        centerY: 0.113,
        zoom: 200,
        description: 'Classic spiraling seahorse shapes',
        category: 'classic',
        thumbnail: null
    },
    {
        id: 'elephant-valley',
        name: 'Elephant Valley',
        fractal: 'mandelbrot',
        centerX: 0.275,
        centerY: 0.006,
        zoom: 150,
        description: 'Elephant trunk-like structures',
        category: 'classic',
        thumbnail: null
    },
    {
        id: 'double-spiral',
        name: 'Double Spiral',
        fractal: 'mandelbrot',
        centerX: -0.16,
        centerY: 1.0405,
        zoom: 300,
        description: 'Two intertwined spirals',
        category: 'classic',
        thumbnail: null
    },
    {
        id: 'quad-spiral',
        name: 'Quad Spiral',
        fractal: 'mandelbrot',
        centerX: -1.25066,
        centerY: 0.02012,
        zoom: 400,
        description: 'Four-fold spiral symmetry',
        category: 'classic',
        thumbnail: null
    },
    {
        id: 'lightning',
        name: 'Lightning',
        fractal: 'mandelbrot',
        centerX: -0.745,
        centerY: 0.186,
        zoom: 150,
        description: 'Lightning bolt patterns',
        category: 'classic',
        thumbnail: null
    },
    
    // Deep Zooms
    {
        id: 'deep-spiral',
        name: 'Deep Spiral',
        fractal: 'mandelbrot',
        centerX: -0.761574364,
        centerY: -0.0847597769,
        zoom: 1e10,
        description: 'Journey into infinite spirals',
        category: 'deep',
        thumbnail: null
    },
    {
        id: 'mini-mandelbrot',
        name: 'Mini Mandelbrot',
        fractal: 'mandelbrot',
        centerX: -1.7687783,
        centerY: 0.0015385,
        zoom: 50000,
        description: 'A hidden mini Mandelbrot set',
        category: 'deep',
        thumbnail: null
    },
    {
        id: 'needle-point',
        name: 'Needle Point',
        fractal: 'mandelbrot',
        centerX: -0.743643887037158704752191506114774,
        centerY: 0.131825904205311970493132056385139,
        zoom: 1e12,
        description: 'Ultra-deep needle structure',
        category: 'deep',
        thumbnail: null
    },
    
    // Julia Sets
    {
        id: 'julia-rabbit',
        name: 'Douady Rabbit',
        fractal: 'julia',
        centerX: 0,
        centerY: 0,
        zoom: 1.5,
        juliaC: { r: -0.123, i: 0.745 },
        description: 'The famous Douady rabbit',
        category: 'julia',
        thumbnail: null
    },
    {
        id: 'julia-dendrite',
        name: 'Julia Dendrite',
        fractal: 'julia',
        centerX: 0,
        centerY: 0,
        zoom: 1.5,
        juliaC: { r: 0, i: 1 },
        description: 'Branching dendrite pattern',
        category: 'julia',
        thumbnail: null
    },
    {
        id: 'julia-siegel',
        name: 'Siegel Disk',
        fractal: 'julia',
        centerX: 0,
        centerY: 0,
        zoom: 2,
        juliaC: { r: -0.391, i: -0.587 },
        description: 'Julia set with Siegel disk',
        category: 'julia',
        thumbnail: null
    },
    
    // Other Fractals
    {
        id: 'burning-ship-main',
        name: 'Burning Ship',
        fractal: 'burning-ship',
        centerX: -0.5,
        centerY: -0.5,
        zoom: 1,
        description: 'The iconic burning ship',
        category: 'other',
        thumbnail: null
    },
    {
        id: 'tricorn-main',
        name: 'Tricorn',
        fractal: 'tricorn',
        centerX: -0.3,
        centerY: 0,
        zoom: 1,
        description: 'The three-cornered Mandelbar',
        category: 'other',
        thumbnail: null
    },
    
    // 3D Fractals
    {
        id: 'mandelbulb-8',
        name: 'Mandelbulb Power 8',
        fractal: 'mandelbulb',
        position: [0, 0, 3],
        target: [0, 0, 0],
        power: 8,
        description: 'Classic Mandelbulb with power 8',
        category: '3d',
        thumbnail: null
    },
    {
        id: 'mandelbox-scale2',
        name: 'Mandelbox Scale 2',
        fractal: 'mandelbox',
        position: [3, 2, 3],
        target: [0, 0, 0],
        scale: 2,
        description: 'Mandelbox with scale factor 2',
        category: '3d',
        thumbnail: null
    }
];

// ============================================================================
// GALLERY CLASS
// ============================================================================

export class Gallery {
    /**
     * Create gallery
     * @param {Object} options - Gallery options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.container = options.container || null;
        
        // State
        this.view = options.view || 'grid'; // 'grid' or 'carousel'
        this.category = 'all';
        this.locations = [...GALLERY_LOCATIONS];
        this.selectedIndex = 0;
        
        // Thumbnail generation
        this.thumbnailSize = options.thumbnailSize || 150;
        this.thumbnailCache = new Map();
        this.generateThumbnail = options.generateThumbnail || null;
        
        // Lazy loading observer
        this.observer = null;
        
        // Elements
        this.element = null;
        this.gridElement = null;
        
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
     * Build gallery DOM
     * @private
     */
    _build() {
        this.element = document.createElement('div');
        this.element.className = 'gallery';
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Location Gallery');
        
        this.element.innerHTML = `
            <header class="gallery-header">
                <h2 class="gallery-title">Gallery</h2>
                
                <div class="gallery-filters">
                    <select class="gallery-category" aria-label="Filter by category">
                        <option value="all">All Locations</option>
                        <option value="classic">Classic</option>
                        <option value="deep">Deep Zooms</option>
                        <option value="julia">Julia Sets</option>
                        <option value="other">Other 2D</option>
                        <option value="3d">3D Fractals</option>
                        <option value="favorites">★ Favorites</option>
                    </select>
                    
                    <div class="gallery-view-toggle" role="group" aria-label="View mode">
                        <button class="view-btn active" data-view="grid" title="Grid view">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <rect x="3" y="3" width="7" height="7" fill="currentColor"/>
                                <rect x="14" y="3" width="7" height="7" fill="currentColor"/>
                                <rect x="3" y="14" width="7" height="7" fill="currentColor"/>
                                <rect x="14" y="14" width="7" height="7" fill="currentColor"/>
                            </svg>
                        </button>
                        <button class="view-btn" data-view="carousel" title="Carousel view">
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <rect x="7" y="4" width="10" height="16" rx="1" fill="currentColor"/>
                                <rect x="2" y="6" width="4" height="12" rx="1" fill="currentColor" opacity="0.5"/>
                                <rect x="18" y="6" width="4" height="12" rx="1" fill="currentColor" opacity="0.5"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>
            
            <div class="gallery-content">
                <div class="gallery-grid" role="listbox" aria-label="Fractal locations">
                </div>
                
                <div class="gallery-carousel" style="display: none;">
                    <button class="carousel-nav prev" aria-label="Previous">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M15 18l-6-6 6-6" stroke="currentColor" fill="none" stroke-width="2"/>
                        </svg>
                    </button>
                    <div class="carousel-track"></div>
                    <button class="carousel-nav next" aria-label="Next">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" fill="none" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <footer class="gallery-footer">
                <span class="gallery-count"></span>
                <button class="btn btn-secondary add-current">
                    + Add Current View
                </button>
            </footer>
        `;
        
        // Get references
        this.gridElement = this.element.querySelector('.gallery-grid');
        this.carouselTrack = this.element.querySelector('.carousel-track');
        
        // Setup events
        this._setupEvents();
        
        // Setup lazy loading
        this._setupLazyLoading();
        
        // Initial render
        this._renderLocations();
        
        // Add to container
        this.container.appendChild(this.element);
    }
    
    /**
     * Setup event handlers
     * @private
     */
    _setupEvents() {
        // Category filter
        this.element.querySelector('.gallery-category').addEventListener('change', (e) => {
            this.setCategory(e.target.value);
        });
        
        // View toggle
        this.element.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setView(btn.dataset.view);
            });
        });
        
        // Carousel navigation
        this.element.querySelector('.carousel-nav.prev').addEventListener('click', () => {
            this.navigate(-1);
        });
        this.element.querySelector('.carousel-nav.next').addEventListener('click', () => {
            this.navigate(1);
        });
        
        // Add current view
        this.element.querySelector('.add-current').addEventListener('click', () => {
            this._addCurrentView();
        });
        
        // Keyboard navigation
        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.navigate(-1);
            if (e.key === 'ArrowRight') this.navigate(1);
            if (e.key === 'Enter') this._goToSelected();
        });
    }
    
    /**
     * Setup lazy loading observer
     * @private
     */
    _setupLazyLoading() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const locationId = card.dataset.id;
                    this._loadThumbnail(locationId, card);
                    this.observer.unobserve(card);
                }
            });
        }, {
            rootMargin: '100px'
        });
    }
    
    // ========================================================================
    // RENDERING
    // ========================================================================
    
    /**
     * Render locations
     * @private
     */
    _renderLocations() {
        const filtered = this._getFilteredLocations();
        
        // Update count
        this.element.querySelector('.gallery-count').textContent = 
            `${filtered.length} locations`;
        
        // Render based on view
        if (this.view === 'grid') {
            this._renderGrid(filtered);
        } else {
            this._renderCarousel(filtered);
        }
    }
    
    /**
     * Render grid view
     * @private
     */
    _renderGrid(locations) {
        this.gridElement.style.display = 'grid';
        this.element.querySelector('.gallery-carousel').style.display = 'none';
        
        this.gridElement.innerHTML = locations.map((loc, i) => `
            <div class="gallery-card ${i === this.selectedIndex ? 'selected' : ''}"
                 role="option"
                 aria-selected="${i === this.selectedIndex}"
                 data-id="${loc.id}"
                 data-index="${i}"
                 tabindex="0">
                <div class="card-thumbnail">
                    <div class="thumbnail-placeholder">
                        <span class="loading-spinner"></span>
                    </div>
                </div>
                <div class="card-info">
                    <h3 class="card-title">${loc.name}</h3>
                    <p class="card-desc">${loc.description}</p>
                    <span class="card-category">${loc.category}</span>
                </div>
                <button class="card-favorite" 
                        aria-label="Add to favorites"
                        data-id="${loc.id}">
                    ${this._isFavorite(loc.id) ? '★' : '☆'}
                </button>
            </div>
        `).join('');
        
        // Setup card events
        this.gridElement.querySelectorAll('.gallery-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-favorite')) {
                    this._selectAndGo(card.dataset.id);
                }
            });
            
            // Observe for lazy loading
            this.observer.observe(card);
        });
        
        // Favorite buttons
        this.gridElement.querySelectorAll('.card-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleFavorite(btn.dataset.id);
            });
        });
    }
    
    /**
     * Render carousel view
     * @private
     */
    _renderCarousel(locations) {
        this.gridElement.style.display = 'none';
        this.element.querySelector('.gallery-carousel').style.display = 'flex';
        
        this.carouselTrack.innerHTML = locations.map((loc, i) => `
            <div class="carousel-slide ${i === this.selectedIndex ? 'active' : ''}"
                 data-id="${loc.id}"
                 data-index="${i}">
                <div class="slide-thumbnail">
                    <div class="thumbnail-placeholder">
                        <span class="loading-spinner"></span>
                    </div>
                </div>
                <div class="slide-info">
                    <h3>${loc.name}</h3>
                    <p>${loc.description}</p>
                </div>
            </div>
        `).join('');
        
        // Setup slide events
        this.carouselTrack.querySelectorAll('.carousel-slide').forEach(slide => {
            slide.addEventListener('click', () => {
                this._selectAndGo(slide.dataset.id);
            });
            
            this.observer.observe(slide);
        });
        
        // Scroll to selected
        this._scrollToSelected();
    }
    
    /**
     * Load thumbnail for a location
     * @private
     */
    async _loadThumbnail(locationId, cardElement) {
        // Check cache
        if (this.thumbnailCache.has(locationId)) {
            this._setThumbnail(cardElement, this.thumbnailCache.get(locationId));
            return;
        }
        
        const location = this.locations.find(l => l.id === locationId);
        if (!location) return;
        
        // Generate thumbnail if callback provided
        if (this.generateThumbnail) {
            try {
                const thumbnail = await this.generateThumbnail(location, this.thumbnailSize);
                this.thumbnailCache.set(locationId, thumbnail);
                this._setThumbnail(cardElement, thumbnail);
            } catch (e) {
                this._setThumbnailError(cardElement);
            }
        } else {
            // Use placeholder gradient
            const placeholder = this._generatePlaceholderGradient(location);
            this._setThumbnail(cardElement, placeholder);
        }
    }
    
    /**
     * Set thumbnail image
     * @private
     */
    _setThumbnail(cardElement, src) {
        const container = cardElement.querySelector('.card-thumbnail, .slide-thumbnail');
        if (!container) return;
        
        if (src.startsWith('linear-gradient') || src.startsWith('radial-gradient')) {
            container.innerHTML = `<div class="thumbnail-gradient" style="background: ${src}"></div>`;
        } else {
            container.innerHTML = `<img src="${src}" alt="" loading="lazy">`;
        }
    }
    
    /**
     * Set thumbnail error state
     * @private
     */
    _setThumbnailError(cardElement) {
        const container = cardElement.querySelector('.card-thumbnail, .slide-thumbnail');
        if (container) {
            container.innerHTML = `<div class="thumbnail-error">⚠️</div>`;
        }
    }
    
    /**
     * Generate placeholder gradient based on location
     * @private
     */
    _generatePlaceholderGradient(location) {
        // Create unique gradient based on coordinates
        const hue = Math.abs((location.centerX || 0) * 180 + (location.centerY || 0) * 180) % 360;
        const saturation = 60 + (Math.abs(location.zoom || 1) % 40);
        
        return `radial-gradient(circle at 30% 30%, 
            hsl(${hue}, ${saturation}%, 50%), 
            hsl(${(hue + 60) % 360}, ${saturation}%, 20%))`;
    }
    
    // ========================================================================
    // NAVIGATION
    // ========================================================================
    
    /**
     * Navigate carousel
     * @param {number} direction - -1 or 1
     */
    navigate(direction) {
        const filtered = this._getFilteredLocations();
        this.selectedIndex += direction;
        
        if (this.selectedIndex < 0) this.selectedIndex = filtered.length - 1;
        if (this.selectedIndex >= filtered.length) this.selectedIndex = 0;
        
        this._updateSelection();
        
        if (this.view === 'carousel') {
            this._scrollToSelected();
        }
    }
    
    /**
     * Update selection UI
     * @private
     */
    _updateSelection() {
        // Grid
        this.gridElement.querySelectorAll('.gallery-card').forEach((card, i) => {
            const isSelected = i === this.selectedIndex;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-selected', isSelected);
        });
        
        // Carousel
        this.carouselTrack.querySelectorAll('.carousel-slide').forEach((slide, i) => {
            slide.classList.toggle('active', i === this.selectedIndex);
        });
    }
    
    /**
     * Scroll carousel to selected slide
     * @private
     */
    _scrollToSelected() {
        const slide = this.carouselTrack.children[this.selectedIndex];
        if (slide) {
            slide.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }
    
    /**
     * Select location and navigate to it
     * @private
     */
    _selectAndGo(locationId) {
        const location = this.locations.find(l => l.id === locationId);
        if (!location) return;
        
        this.selectedIndex = this._getFilteredLocations().findIndex(l => l.id === locationId);
        this._updateSelection();
        
        this._goToLocation(location);
    }
    
    /**
     * Go to selected location
     * @private
     */
    _goToSelected() {
        const filtered = this._getFilteredLocations();
        const location = filtered[this.selectedIndex];
        if (location) {
            this._goToLocation(location);
        }
    }
    
    /**
     * Navigate to a location
     * @private
     */
    _goToLocation(location) {
        // Close gallery modal if open
        this.manager?.closeModal();
        
        // Set fractal type
        if (location.fractal) {
            this.manager?.setFractal(location.fractal);
        }
        
        // Set Julia parameters if present
        if (location.juliaC) {
            this.manager?.setParameter('juliaReal', location.juliaC.r);
            this.manager?.setParameter('juliaImag', location.juliaC.i);
        }
        
        // Set power if present
        if (location.power) {
            this.manager?.setParameter('power', location.power);
        }
        
        // Navigate camera
        if (location.position) {
            // 3D location
            this.manager?.emit('camera3d:goto', location);
        } else {
            // 2D location
            this.manager?.emit(UI_EVENTS.CAMERA_ANIMATE, {
                centerX: location.centerX,
                centerY: location.centerY,
                zoom: location.zoom,
                duration: 2000
            });
        }
    }
    
    // ========================================================================
    // FILTERING
    // ========================================================================
    
    /**
     * Set category filter
     * @param {string} category
     */
    setCategory(category) {
        this.category = category;
        this.selectedIndex = 0;
        this._renderLocations();
    }
    
    /**
     * Get filtered locations
     * @private
     */
    _getFilteredLocations() {
        if (this.category === 'all') {
            return this.locations;
        }
        
        if (this.category === 'favorites') {
            const favorites = this._getFavorites();
            return this.locations.filter(l => favorites.includes(l.id));
        }
        
        return this.locations.filter(l => l.category === this.category);
    }
    
    // ========================================================================
    // VIEW MODE
    // ========================================================================
    
    /**
     * Set view mode
     * @param {string} view - 'grid' or 'carousel'
     */
    setView(view) {
        this.view = view;
        
        this.element.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        this._renderLocations();
    }
    
    // ========================================================================
    // FAVORITES
    // ========================================================================
    
    /**
     * Get favorites from storage
     * @private
     */
    _getFavorites() {
        try {
            return JSON.parse(localStorage.getItem('abyss-favorites') || '[]');
        } catch {
            return [];
        }
    }
    
    /**
     * Check if location is favorite
     * @private
     */
    _isFavorite(id) {
        return this._getFavorites().includes(id);
    }
    
    /**
     * Toggle favorite status
     * @private
     */
    _toggleFavorite(id) {
        const favorites = this._getFavorites();
        const index = favorites.indexOf(id);
        
        if (index >= 0) {
            favorites.splice(index, 1);
        } else {
            favorites.push(id);
        }
        
        try {
            localStorage.setItem('abyss-favorites', JSON.stringify(favorites));
        } catch {}
        
        // Update UI
        const btn = this.element.querySelector(`.card-favorite[data-id="${id}"]`);
        if (btn) {
            btn.textContent = this._isFavorite(id) ? '★' : '☆';
        }
        
        // Re-render if showing favorites
        if (this.category === 'favorites') {
            this._renderLocations();
        }
    }
    
    // ========================================================================
    // ADD LOCATION
    // ========================================================================
    
    /**
     * Add current camera view as new location
     * @private
     */
    _addCurrentView() {
        // Get current camera state
        const camera = this.manager?.camera2d;
        if (!camera) return;
        
        const location = {
            id: `custom_${Date.now()}`,
            name: `My Location ${this.locations.filter(l => l.id.startsWith('custom')).length + 1}`,
            fractal: 'mandelbrot', // Should get from state
            centerX: camera.centerX,
            centerY: camera.centerY,
            zoom: camera.zoom,
            description: 'Custom saved location',
            category: 'favorites',
            thumbnail: null
        };
        
        this.locations.push(location);
        
        // Save to storage
        this._saveCustomLocations();
        
        // Auto-favorite
        const favorites = this._getFavorites();
        favorites.push(location.id);
        try {
            localStorage.setItem('abyss-favorites', JSON.stringify(favorites));
        } catch {}
        
        // Re-render
        this._renderLocations();
        
        // Notify
        this.manager?.emit('notification', {
            message: 'Location saved!',
            type: 'success'
        });
    }
    
    /**
     * Save custom locations to storage
     * @private
     */
    _saveCustomLocations() {
        const custom = this.locations.filter(l => l.id.startsWith('custom'));
        try {
            localStorage.setItem('abyss-custom-locations', JSON.stringify(custom));
        } catch {}
    }
    
    /**
     * Load custom locations from storage
     */
    loadCustomLocations() {
        try {
            const custom = JSON.parse(localStorage.getItem('abyss-custom-locations') || '[]');
            this.locations.push(...custom);
        } catch {}
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Open gallery (convenience)
     */
    open() {
        this.manager?.openModal('gallery');
    }
    
    /**
     * Get element for modal
     * @returns {HTMLElement}
     */
    getElement() {
        return this.element;
    }
    
    /**
     * Set thumbnail generator
     * @param {Function} generator
     */
    setThumbnailGenerator(generator) {
        this.generateThumbnail = generator;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { GALLERY_LOCATIONS };
export default Gallery;
