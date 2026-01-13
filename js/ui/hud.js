/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                       ABYSS EXPLORER - HUD MANAGER                            ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Manages the heads-up display showing coordinates, zoom, and performance      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { Logger } from '../utils/logger.js';

/**
 * HUD Manager - Updates coordinate and performance displays
 */
export class HUDManager {
    /**
     * Create HUD manager
     * @param {Object} options
     * @param {Object} options.state - State manager
     * @param {Object} options.events - Event bus
     */
    constructor(options = {}) {
        this.state = options.state;
        this.events = options.events;
        this.logger = new Logger('HUD');
        
        // Element references
        this.elements = {
            coordReal: null,
            coordImag: null,
            coordZoom: null,
            coordZoomExp: null,
            coordIter: null,
            mouseReal: null,
            mouseImag: null,
            renderTime: null,
            fps: null,
            memoryUsage: null
        };
        
        // Update throttling
        this.lastUpdate = 0;
        this.updateInterval = 50; // ms
        
        this._init();
    }
    
    /**
     * Initialize HUD
     * @private
     */
    _init() {
        // Find elements
        this.elements = {
            coordReal: document.getElementById('coord-real') || document.getElementById('center-real'),
            coordImag: document.getElementById('coord-imag') || document.getElementById('center-imag'),
            coordZoom: document.getElementById('coord-zoom') || document.getElementById('zoom-level'),
            coordZoomExp: document.getElementById('coord-zoom-exp') || document.getElementById('zoom-exponent'),
            coordIter: document.getElementById('coord-iter') || document.getElementById('max-iterations-value'),
            mouseReal: document.getElementById('mouse-real'),
            mouseImag: document.getElementById('mouse-imag'),
            renderTime: document.getElementById('render-time') || document.getElementById('info-render-time'),
            fps: document.getElementById('fps'),
            memoryUsage: document.getElementById('memory-usage')
        };
        
        // Subscribe to events
        if (this.events) {
            this.events.on('fractal:params:changed', () => this.update());
            this.events.on('render:complete', (data) => this.updatePerformance(data));
            this.events.on('mouse:move', (pos) => this.updateMousePosition(pos));
            this.events.on('state:changed', () => this.update());
        }
        
        this.logger.info('HUD manager initialized');
    }
    
    /**
     * Update all HUD elements
     */
    update() {
        // Throttle updates
        const now = performance.now();
        if (now - this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = now;
        
        const fractal = this.state?.get?.('fractal') || {
            centerX: -0.5,
            centerY: 0,
            zoom: 1,
            maxIterations: 500
        };
        
        // Center coordinates
        if (this.elements.coordReal) {
            this.elements.coordReal.textContent = this._formatCoord(fractal.centerX);
        }
        if (this.elements.coordImag) {
            this.elements.coordImag.textContent = this._formatCoord(fractal.centerY);
        }
        
        // Zoom
        if (this.elements.coordZoom) {
            this.elements.coordZoom.textContent = this._formatZoom(fractal.zoom);
        }
        if (this.elements.coordZoomExp) {
            const exp = Math.log10(fractal.zoom);
            this.elements.coordZoomExp.textContent = exp.toFixed(2);
        }
        
        // Iterations
        if (this.elements.coordIter) {
            this.elements.coordIter.textContent = fractal.maxIterations || 500;
        }
    }
    
    /**
     * Update mouse position display
     * @param {{x: number, y: number}} pos - Canvas position
     */
    updateMousePosition(pos) {
        const fractal = this.state?.get?.('fractal') || { centerX: -0.5, centerY: 0, zoom: 1 };
        const canvas = document.getElementById('fractal-canvas-2d');
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const scale = 4 / fractal.zoom;
        const aspectRatio = rect.width / rect.height;
        
        const re = fractal.centerX + (pos.x / rect.width - 0.5) * scale * aspectRatio;
        const im = fractal.centerY + (pos.y / rect.height - 0.5) * scale;
        
        if (this.elements.mouseReal) {
            this.elements.mouseReal.textContent = this._formatCoord(re);
        }
        if (this.elements.mouseImag) {
            this.elements.mouseImag.textContent = this._formatCoord(im);
        }
    }
    
    /**
     * Update performance display
     * @param {Object} data - Performance data
     */
    updatePerformance(data = {}) {
        if (this.elements.renderTime && data.renderTime !== undefined) {
            this.elements.renderTime.textContent = `${data.renderTime.toFixed(1)}ms`;
        }
        
        if (this.elements.fps && data.fps !== undefined) {
            this.elements.fps.textContent = `${Math.round(data.fps)} FPS`;
        }
        
        if (this.elements.memoryUsage && performance.memory) {
            const used = performance.memory.usedJSHeapSize / 1048576;
            this.elements.memoryUsage.textContent = `${used.toFixed(1)} MB`;
        }
    }
    
    /**
     * Format coordinate for display
     * @private
     */
    _formatCoord(value) {
        if (typeof value !== 'number' || isNaN(value)) return '0';
        
        const absVal = Math.abs(value);
        if (absVal < 0.000001 && absVal > 0) {
            return value.toExponential(6);
        }
        return value.toFixed(12);
    }
    
    /**
     * Format zoom for display
     * @private
     */
    _formatZoom(zoom) {
        if (typeof zoom !== 'number' || isNaN(zoom)) return '1x';
        
        const exp = Math.log10(zoom);
        if (exp >= 3) {
            return `10^${exp.toFixed(1)}`;
        }
        return `${zoom.toFixed(2)}x`;
    }
    
    /**
     * Show/hide specific HUD elements
     * @param {string} element - Element name
     * @param {boolean} visible - Visibility
     */
    setVisible(element, visible) {
        const el = this.elements[element];
        if (el?.parentElement) {
            el.parentElement.style.display = visible ? '' : 'none';
        }
    }
}

export default HUDManager;
