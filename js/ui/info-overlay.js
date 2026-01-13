/**
 * ============================================================================
 * ABYSS EXPLORER - INFO OVERLAY
 * ============================================================================
 * 
 * On-canvas overlay displaying current location coordinates, zoom depth,
 * iteration statistics, and math explanations for the current fractal.
 * 
 * @module ui/info-overlay
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// FRACTAL INFO DATABASE
// ============================================================================

const FRACTAL_INFO = {
    'mandelbrot': {
        name: 'Mandelbrot Set',
        formula: 'z_{n+1} = z_n² + c',
        description: 'Points where the iteration remains bounded',
        discoveredBy: 'Benoît Mandelbrot, 1980',
        mathExplanation: 'For each point c in the complex plane, iterate z = z² + c starting from z = 0. If |z| stays < 2 forever, c is in the set.'
    },
    'julia': {
        name: 'Julia Set',
        formula: 'z_{n+1} = z_n² + c',
        description: 'Boundary of points with bounded orbits for fixed c',
        discoveredBy: 'Gaston Julia, 1918',
        mathExplanation: 'Similar to Mandelbrot, but c is fixed and z₀ varies across the plane. Connected Julia sets occur when c is in the Mandelbrot set.'
    },
    'burning-ship': {
        name: 'Burning Ship',
        formula: 'z_{n+1} = (|Re(z_n)| + i|Im(z_n)|)² + c',
        description: 'Variant using absolute values',
        discoveredBy: 'Michael Michelitsch & Otto Rössler, 1992',
        mathExplanation: 'Takes absolute values of real and imaginary parts before squaring, creating asymmetric ship-like structures.'
    },
    'tricorn': {
        name: 'Tricorn (Mandelbar)',
        formula: 'z_{n+1} = z̄_n² + c',
        description: 'Uses complex conjugate',
        discoveredBy: 'W.D. Crowe, 1989',
        mathExplanation: 'Complex conjugate (z̄) flips the imaginary part sign, creating three-fold symmetric structures.'
    },
    'newton': {
        name: 'Newton Fractal',
        formula: 'z_{n+1} = z_n - f(z_n)/f\'(z_n)',
        description: 'Newton\'s method basins of attraction',
        discoveredBy: 'Arthur Cayley, 1879',
        mathExplanation: 'Applies Newton\'s root-finding method. Colors show which root each starting point converges to.'
    },
    'mandelbulb': {
        name: 'Mandelbulb',
        formula: 'v_{n+1} = v_n^p + c (3D polar)',
        description: '3D analog of Mandelbrot set',
        discoveredBy: 'Daniel White & Paul Nylander, 2009',
        mathExplanation: 'Uses spherical coordinates: r^n·(sin(nθ)cos(nφ), sin(nθ)sin(nφ), cos(nθ)) + c'
    }
};

// ============================================================================
// INFO OVERLAY CLASS
// ============================================================================

export class InfoOverlay {
    /**
     * Create info overlay
     * @param {Object} options - Options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.container = options.container || null;
        
        // State
        this.visible = options.visible ?? true;
        this.expanded = false;
        this.position = options.position || 'bottom-left';
        
        // Current data
        this.data = {
            fractal: 'mandelbrot',
            centerX: -0.5,
            centerY: 0,
            zoom: 1,
            iterations: 0,
            maxIterations: 1000,
            renderTime: 0,
            pixelSize: 0
        };
        
        // Elements
        this.element = null;
        
        // Build
        if (this.container) {
            this._build();
        }
    }
    
    /**
     * Set UI manager reference
     */
    setManager(manager) {
        this.manager = manager;
        this._setupEvents();
    }
    
    // ========================================================================
    // BUILD
    // ========================================================================
    
    /**
     * Build info overlay DOM
     * @private
     */
    _build() {
        this.element = document.createElement('div');
        this.element.className = `info-overlay position-${this.position}`;
        this.element.setAttribute('role', 'status');
        this.element.setAttribute('aria-label', 'Fractal information');
        
        this.element.innerHTML = `
            <div class="info-compact">
                <button class="info-toggle" aria-label="Toggle info panel" aria-expanded="false">
                    <span class="toggle-icon">ℹ</span>
                </button>
                
                <div class="info-quick">
                    <span class="info-zoom" title="Zoom level">
                        <span class="label">Zoom:</span>
                        <span class="value zoom-value">1×</span>
                    </span>
                    <span class="info-coord" title="Center coordinates">
                        <span class="coord-value">-0.5, 0i</span>
                    </span>
                </div>
            </div>
            
            <div class="info-expanded">
                <header class="info-header">
                    <h3 class="fractal-name">Mandelbrot Set</h3>
                    <button class="info-close" aria-label="Close">×</button>
                </header>
                
                <div class="info-section info-location">
                    <h4>Location</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Center X (Real):</span>
                            <span class="value center-x">-0.5</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Center Y (Imag):</span>
                            <span class="value center-y">0</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Zoom:</span>
                            <span class="value zoom-level">1×</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Magnification:</span>
                            <span class="value magnification">10⁰</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Pixel Size:</span>
                            <span class="value pixel-size">4e-3</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section info-render">
                    <h4>Rendering</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Max Iterations:</span>
                            <span class="value max-iter">1000</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Avg Iterations:</span>
                            <span class="value avg-iter">--</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Render Time:</span>
                            <span class="value render-time">-- ms</span>
                        </div>
                        <div class="info-item">
                            <span class="label">In Set %:</span>
                            <span class="value in-set">--%</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section info-math">
                    <h4>Mathematics</h4>
                    <div class="math-formula">
                        <code class="formula">z_{n+1} = z_n² + c</code>
                    </div>
                    <p class="math-desc">
                        Points where the iteration remains bounded
                    </p>
                    <button class="btn btn-small btn-secondary learn-more">
                        Learn More
                    </button>
                </div>
                
                <div class="info-section info-actions">
                    <button class="btn btn-small btn-secondary copy-location" title="Copy coordinates">
                        📋 Copy Location
                    </button>
                    <button class="btn btn-small btn-secondary share-location" title="Share link">
                        🔗 Share
                    </button>
                </div>
            </div>
        `;
        
        // Setup events
        this._setupOverlayEvents();
        
        // Initial visibility
        this._updateVisibility();
        
        // Add to container
        this.container.appendChild(this.element);
    }
    
    /**
     * Setup overlay event handlers
     * @private
     */
    _setupOverlayEvents() {
        // Toggle expand
        this.element.querySelector('.info-toggle').addEventListener('click', () => {
            this.toggleExpanded();
        });
        
        this.element.querySelector('.info-close').addEventListener('click', () => {
            this.setExpanded(false);
        });
        
        // Copy location
        this.element.querySelector('.copy-location').addEventListener('click', () => {
            this._copyLocation();
        });
        
        // Share
        this.element.querySelector('.share-location').addEventListener('click', () => {
            this._shareLocation();
        });
        
        // Learn more
        this.element.querySelector('.learn-more').addEventListener('click', () => {
            this._showMathDetails();
        });
    }
    
    /**
     * Setup manager events
     * @private
     */
    _setupEvents() {
        if (!this.manager) return;
        
        this.manager.on('info:toggle', (visible) => {
            this.setVisible(visible);
        });
        
        this.manager.on('camera:move', (state) => {
            this.updateLocation(state);
        });
        
        this.manager.on('render:complete', (stats) => {
            this.updateRenderStats(stats);
        });
        
        this.manager.on('fractal:change', (type) => {
            this.setFractal(type);
        });
    }
    
    // ========================================================================
    // VISIBILITY
    // ========================================================================
    
    /**
     * Set visibility
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.visible = visible;
        this._updateVisibility();
    }
    
    /**
     * Toggle visibility
     */
    toggleVisible() {
        this.setVisible(!this.visible);
    }
    
    /**
     * Set expanded state
     * @param {boolean} expanded
     */
    setExpanded(expanded) {
        this.expanded = expanded;
        this.element.classList.toggle('expanded', expanded);
        this.element.querySelector('.info-toggle').setAttribute('aria-expanded', expanded);
    }
    
    /**
     * Toggle expanded state
     */
    toggleExpanded() {
        this.setExpanded(!this.expanded);
    }
    
    /**
     * Update visibility state
     * @private
     */
    _updateVisibility() {
        this.element.classList.toggle('hidden', !this.visible);
    }
    
    // ========================================================================
    // DATA UPDATES
    // ========================================================================
    
    /**
     * Update location data
     * @param {Object} state - Camera state
     */
    updateLocation(state) {
        if (state.centerX !== undefined) this.data.centerX = state.centerX;
        if (state.centerY !== undefined) this.data.centerY = state.centerY;
        if (state.zoom !== undefined) this.data.zoom = state.zoom;
        if (state.pixelSize !== undefined) this.data.pixelSize = state.pixelSize;
        
        this._updateDisplay();
    }
    
    /**
     * Update render statistics
     * @param {Object} stats - Render stats
     */
    updateRenderStats(stats) {
        if (stats.iterations !== undefined) this.data.iterations = stats.iterations;
        if (stats.maxIterations !== undefined) this.data.maxIterations = stats.maxIterations;
        if (stats.renderTime !== undefined) this.data.renderTime = stats.renderTime;
        if (stats.avgIterations !== undefined) this.data.avgIterations = stats.avgIterations;
        if (stats.inSetPercent !== undefined) this.data.inSetPercent = stats.inSetPercent;
        
        this._updateDisplay();
    }
    
    /**
     * Set current fractal type
     * @param {string} type
     */
    setFractal(type) {
        this.data.fractal = type;
        this._updateFractalInfo();
    }
    
    /**
     * Update display elements
     * @private
     */
    _updateDisplay() {
        // Compact display
        this.element.querySelector('.zoom-value').textContent = 
            this._formatZoom(this.data.zoom);
        this.element.querySelector('.coord-value').textContent = 
            this._formatCoordShort(this.data.centerX, this.data.centerY);
        
        // Expanded display
        this.element.querySelector('.center-x').textContent = 
            this._formatNumber(this.data.centerX);
        this.element.querySelector('.center-y').textContent = 
            this._formatNumber(this.data.centerY);
        this.element.querySelector('.zoom-level').textContent = 
            this._formatZoom(this.data.zoom);
        this.element.querySelector('.magnification').textContent = 
            this._formatMagnification(this.data.zoom);
        this.element.querySelector('.pixel-size').textContent = 
            this._formatScientific(this.data.pixelSize || 4 / this.data.zoom / 800);
        
        // Render stats
        this.element.querySelector('.max-iter').textContent = 
            this.data.maxIterations.toLocaleString();
        this.element.querySelector('.avg-iter').textContent = 
            this.data.avgIterations !== undefined ? 
                Math.round(this.data.avgIterations).toLocaleString() : '--';
        this.element.querySelector('.render-time').textContent = 
            this.data.renderTime !== undefined ? 
                `${Math.round(this.data.renderTime)} ms` : '-- ms';
        this.element.querySelector('.in-set').textContent = 
            this.data.inSetPercent !== undefined ? 
                `${this.data.inSetPercent.toFixed(1)}%` : '--%';
    }
    
    /**
     * Update fractal info section
     * @private
     */
    _updateFractalInfo() {
        const info = FRACTAL_INFO[this.data.fractal] || {
            name: this.data.fractal,
            formula: 'z_{n+1} = f(z_n)',
            description: 'Custom fractal'
        };
        
        this.element.querySelector('.fractal-name').textContent = info.name;
        this.element.querySelector('.formula').textContent = info.formula;
        this.element.querySelector('.math-desc').textContent = info.description;
    }
    
    // ========================================================================
    // FORMATTING
    // ========================================================================
    
    /**
     * Format zoom level
     * @private
     */
    _formatZoom(zoom) {
        if (zoom >= 1e9) {
            return `${(zoom / 1e9).toFixed(1)}B×`;
        } else if (zoom >= 1e6) {
            return `${(zoom / 1e6).toFixed(1)}M×`;
        } else if (zoom >= 1e3) {
            return `${(zoom / 1e3).toFixed(1)}K×`;
        } else {
            return `${zoom.toFixed(1)}×`;
        }
    }
    
    /**
     * Format magnification as power of 10
     * @private
     */
    _formatMagnification(zoom) {
        const exp = Math.floor(Math.log10(zoom));
        return `10^${exp}`;
    }
    
    /**
     * Format coordinate short
     * @private
     */
    _formatCoordShort(x, y) {
        const xStr = x >= 0 ? x.toFixed(4) : x.toFixed(3);
        const yStr = Math.abs(y).toFixed(4);
        const sign = y >= 0 ? '+' : '-';
        return `${xStr} ${sign} ${yStr}i`;
    }
    
    /**
     * Format number with appropriate precision
     * @private
     */
    _formatNumber(n) {
        if (Math.abs(n) < 1e-10) return '0';
        if (Math.abs(n) < 1e-4) return n.toExponential(6);
        if (Math.abs(n) > 1e4) return n.toExponential(6);
        return n.toPrecision(10);
    }
    
    /**
     * Format as scientific notation
     * @private
     */
    _formatScientific(n) {
        if (n === 0 || n === undefined) return '0';
        return n.toExponential(2);
    }
    
    // ========================================================================
    // ACTIONS
    // ========================================================================
    
    /**
     * Copy location to clipboard
     * @private
     */
    async _copyLocation() {
        const text = `Center: ${this.data.centerX}, ${this.data.centerY}i\nZoom: ${this.data.zoom}×`;
        
        try {
            await navigator.clipboard.writeText(text);
            this.manager?.emit('notification', {
                message: 'Location copied to clipboard',
                type: 'success'
            });
        } catch (e) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            this.manager?.emit('notification', {
                message: 'Location copied',
                type: 'success'
            });
        }
    }
    
    /**
     * Share location URL
     * @private
     */
    _shareLocation() {
        const params = new URLSearchParams({
            x: this.data.centerX,
            y: this.data.centerY,
            z: this.data.zoom,
            f: this.data.fractal
        });
        
        const url = `${window.location.origin}${window.location.pathname}?${params}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Abyss Explorer Location',
                text: `Check out this fractal location!`,
                url
            });
        } else {
            navigator.clipboard.writeText(url);
            this.manager?.emit('notification', {
                message: 'Link copied to clipboard',
                type: 'success'
            });
        }
    }
    
    /**
     * Show math details modal
     * @private
     */
    _showMathDetails() {
        const info = FRACTAL_INFO[this.data.fractal];
        if (!info) return;
        
        this.manager?.openModal('help', {
            title: info.name,
            content: `
                <h3>Formula</h3>
                <code class="formula-display">${info.formula}</code>
                
                <h3>Description</h3>
                <p>${info.mathExplanation || info.description}</p>
                
                <h3>History</h3>
                <p>Discovered by: ${info.discoveredBy || 'Unknown'}</p>
            `
        });
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Get current data
     * @returns {Object}
     */
    getData() {
        return { ...this.data };
    }
    
    /**
     * Set position
     * @param {string} position - bottom-left, bottom-right, top-left, top-right
     */
    setPosition(position) {
        this.element.classList.remove(`position-${this.position}`);
        this.position = position;
        this.element.classList.add(`position-${this.position}`);
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { FRACTAL_INFO };
export default InfoOverlay;
