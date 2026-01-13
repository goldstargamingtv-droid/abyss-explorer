/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    ABYSS EXPLORER - OVERLAY RENDERER                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Renders UI overlays on canvas: crosshair, coordinates, minimap, guides       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { Logger } from '../utils/logger.js';

/**
 * Overlay Renderer
 * 
 * Handles drawing of UI elements on top of the fractal canvas:
 * - Crosshair/cursor
 * - Coordinate display
 * - Zoom box selection
 * - Minimap
 * - Grid/guides
 * - Selection rectangles
 */
export class OverlayRenderer {
    /**
     * Create overlay renderer
     * @param {Object} options
     * @param {HTMLCanvasElement} options.canvas - Overlay canvas
     * @param {CanvasRenderingContext2D} options.ctx - Canvas context
     * @param {Object} options.state - State manager
     * @param {Object} options.events - Event bus
     */
    constructor(options) {
        this.canvas = options.canvas;
        this.ctx = options.ctx || options.canvas?.getContext('2d');
        this.state = options.state;
        this.events = options.events;
        this.logger = new Logger('Overlay');
        
        // Overlay settings
        this.settings = {
            showCrosshair: true,
            showCoordinates: true,
            showMinimap: true,
            showGrid: false,
            showAxes: false,
            crosshairColor: 'rgba(255, 255, 255, 0.5)',
            selectionColor: 'rgba(100, 149, 237, 0.3)',
            selectionBorderColor: 'rgba(100, 149, 237, 0.8)',
            gridColor: 'rgba(255, 255, 255, 0.1)',
            axesColor: 'rgba(255, 100, 100, 0.5)',
            fontSize: 12,
            fontFamily: 'monospace'
        };
        
        // Current state
        this.mousePos = { x: 0, y: 0 };
        this.selection = null;
        this.minimapBounds = { x: 10, y: 10, width: 150, height: 100 };
        
        this._init();
    }
    
    /**
     * Initialize overlay
     * @private
     */
    _init() {
        if (!this.canvas || !this.ctx) {
            this.logger.warn('No overlay canvas provided');
            return;
        }
        
        // Subscribe to events
        if (this.events) {
            this.events.on('mouse:move', (pos) => this.updateMousePos(pos));
            this.events.on('selection:start', (pos) => this.startSelection(pos));
            this.events.on('selection:update', (pos) => this.updateSelection(pos));
            this.events.on('selection:end', () => this.endSelection());
            this.events.on('overlay:settings', (settings) => this.updateSettings(settings));
        }
        
        this.logger.info('Overlay renderer initialized');
    }
    
    /**
     * Clear the overlay canvas
     */
    clear() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    /**
     * Render all overlay elements
     */
    render() {
        if (!this.ctx) return;
        
        this.clear();
        
        if (this.settings.showGrid) {
            this.drawGrid();
        }
        
        if (this.settings.showAxes) {
            this.drawAxes();
        }
        
        if (this.selection) {
            this.drawSelection();
        }
        
        if (this.settings.showCrosshair) {
            this.drawCrosshair();
        }
        
        if (this.settings.showMinimap) {
            this.drawMinimap();
        }
        
        if (this.settings.showCoordinates) {
            this.drawCoordinates();
        }
    }
    
    /**
     * Draw crosshair at mouse position
     */
    drawCrosshair() {
        const { ctx, mousePos, canvas, settings } = this;
        if (!mousePos) return;
        
        ctx.strokeStyle = settings.crosshairColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(mousePos.x, 0);
        ctx.lineTo(mousePos.x, canvas.height);
        ctx.stroke();
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, mousePos.y);
        ctx.lineTo(canvas.width, mousePos.y);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
    
    /**
     * Draw coordinate display
     */
    drawCoordinates() {
        const { ctx, mousePos, canvas, settings, state } = this;
        if (!mousePos || !state) return;
        
        // Convert mouse position to fractal coordinates
        const fractalPos = this._screenToFractal(mousePos.x, mousePos.y);
        
        const text = `Re: ${fractalPos.re.toFixed(12)}\nIm: ${fractalPos.im.toFixed(12)}`;
        const lines = text.split('\n');
        
        ctx.font = `${settings.fontSize}px ${settings.fontFamily}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'left';
        
        const padding = 10;
        const lineHeight = settings.fontSize + 4;
        const y = canvas.height - padding - (lines.length * lineHeight);
        
        // Background
        const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(padding - 5, y - settings.fontSize, maxWidth + 10, lines.length * lineHeight + 10);
        
        // Text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        lines.forEach((line, i) => {
            ctx.fillText(line, padding, y + i * lineHeight);
        });
    }
    
    /**
     * Draw selection rectangle
     */
    drawSelection() {
        const { ctx, selection, settings } = this;
        if (!selection) return;
        
        const { startX, startY, endX, endY } = selection;
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        
        // Fill
        ctx.fillStyle = settings.selectionColor;
        ctx.fillRect(x, y, width, height);
        
        // Border
        ctx.strokeStyle = settings.selectionBorderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    
    /**
     * Draw grid lines
     */
    drawGrid() {
        const { ctx, canvas, settings } = this;
        
        ctx.strokeStyle = settings.gridColor;
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        
        // Vertical lines
        for (let x = gridSize; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = gridSize; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    /**
     * Draw real/imaginary axes
     */
    drawAxes() {
        const { ctx, canvas, settings, state } = this;
        if (!state) return;
        
        const fractal = state.get?.('fractal') || { centerX: -0.5, centerY: 0, zoom: 1 };
        
        // Convert origin to screen coordinates
        const origin = this._fractalToScreen(0, 0);
        
        if (origin.x >= 0 && origin.x <= canvas.width) {
            // Real axis (vertical line at Re=0)
            ctx.strokeStyle = settings.axesColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(origin.x, 0);
            ctx.lineTo(origin.x, canvas.height);
            ctx.stroke();
        }
        
        if (origin.y >= 0 && origin.y <= canvas.height) {
            // Imaginary axis (horizontal line at Im=0)
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, origin.y);
            ctx.lineTo(canvas.width, origin.y);
            ctx.stroke();
        }
    }
    
    /**
     * Draw minimap
     */
    drawMinimap() {
        const { ctx, minimapBounds, state, settings } = this;
        if (!state) return;
        
        const { x, y, width, height } = minimapBounds;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);
        
        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // Simple Mandelbrot overview
        this._drawMinimapContent(x, y, width, height);
        
        // Current view indicator
        this._drawMinimapViewport(x, y, width, height);
    }
    
    /**
     * Draw minimap content (simple Mandelbrot)
     * @private
     */
    _drawMinimapContent(x, y, width, height) {
        const { ctx } = this;
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                // Map to Mandelbrot coordinates (-2.5 to 1, -1.5 to 1.5)
                const re = -2.5 + (px / width) * 3.5;
                const im = -1.5 + (py / height) * 3;
                
                // Quick iteration
                let zr = 0, zi = 0;
                let iter = 0;
                const maxIter = 20;
                
                while (zr * zr + zi * zi < 4 && iter < maxIter) {
                    const temp = zr * zr - zi * zi + re;
                    zi = 2 * zr * zi + im;
                    zr = temp;
                    iter++;
                }
                
                const idx = (py * width + px) * 4;
                if (iter === maxIter) {
                    data[idx] = 20;
                    data[idx + 1] = 20;
                    data[idx + 2] = 40;
                } else {
                    const c = (iter / maxIter) * 255;
                    data[idx] = c * 0.5;
                    data[idx + 1] = c * 0.3;
                    data[idx + 2] = c;
                }
                data[idx + 3] = 200;
            }
        }
        
        ctx.putImageData(imageData, x, y);
    }
    
    /**
     * Draw current viewport on minimap
     * @private
     */
    _drawMinimapViewport(mx, my, mw, mh) {
        const { ctx, state, canvas } = this;
        if (!state) return;
        
        const fractal = state.get?.('fractal') || { centerX: -0.5, centerY: 0, zoom: 1 };
        const { centerX, centerY, zoom } = fractal;
        
        // Calculate viewport in minimap coordinates
        const scale = 4 / zoom;
        const aspectRatio = canvas.width / canvas.height;
        
        const viewLeft = centerX - scale * aspectRatio / 2;
        const viewRight = centerX + scale * aspectRatio / 2;
        const viewTop = centerY - scale / 2;
        const viewBottom = centerY + scale / 2;
        
        // Convert to minimap pixels
        const mapLeft = mx + ((viewLeft + 2.5) / 3.5) * mw;
        const mapRight = mx + ((viewRight + 2.5) / 3.5) * mw;
        const mapTop = my + ((viewTop + 1.5) / 3) * mh;
        const mapBottom = my + ((viewBottom + 1.5) / 3) * mh;
        
        // Draw viewport rectangle
        ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(mapLeft, mapTop, mapRight - mapLeft, mapBottom - mapTop);
    }
    
    /**
     * Convert screen coordinates to fractal coordinates
     * @private
     */
    _screenToFractal(screenX, screenY) {
        const { canvas, state } = this;
        const fractal = state?.get?.('fractal') || { centerX: -0.5, centerY: 0, zoom: 1 };
        
        const scale = 4 / fractal.zoom;
        const aspectRatio = canvas.width / canvas.height;
        
        return {
            re: fractal.centerX + (screenX / canvas.width - 0.5) * scale * aspectRatio,
            im: fractal.centerY + (screenY / canvas.height - 0.5) * scale
        };
    }
    
    /**
     * Convert fractal coordinates to screen coordinates
     * @private
     */
    _fractalToScreen(re, im) {
        const { canvas, state } = this;
        const fractal = state?.get?.('fractal') || { centerX: -0.5, centerY: 0, zoom: 1 };
        
        const scale = 4 / fractal.zoom;
        const aspectRatio = canvas.width / canvas.height;
        
        return {
            x: ((re - fractal.centerX) / (scale * aspectRatio) + 0.5) * canvas.width,
            y: ((im - fractal.centerY) / scale + 0.5) * canvas.height
        };
    }
    
    /**
     * Update mouse position
     * @param {{x: number, y: number}} pos
     */
    updateMousePos(pos) {
        this.mousePos = pos;
        this.render();
    }
    
    /**
     * Start selection
     * @param {{x: number, y: number}} pos
     */
    startSelection(pos) {
        this.selection = {
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y
        };
    }
    
    /**
     * Update selection
     * @param {{x: number, y: number}} pos
     */
    updateSelection(pos) {
        if (this.selection) {
            this.selection.endX = pos.x;
            this.selection.endY = pos.y;
            this.render();
        }
    }
    
    /**
     * End selection
     */
    endSelection() {
        this.selection = null;
        this.render();
    }
    
    /**
     * Update overlay settings
     * @param {Object} settings
     */
    updateSettings(settings) {
        Object.assign(this.settings, settings);
        this.render();
    }
    
    /**
     * Resize overlay canvas
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        if (this.canvas) {
            this.canvas.width = width;
            this.canvas.height = height;
            this.render();
        }
    }
}

export default OverlayRenderer;
