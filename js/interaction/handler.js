/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ABYSS EXPLORER - INTERACTION HANDLER                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Unified handler for mouse, touch, and keyboard interactions                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { Logger } from '../utils/logger.js';

/**
 * Interaction Handler
 * 
 * Manages all user input for fractal navigation:
 * - Mouse: drag to pan, wheel to zoom, double-click to zoom in
 * - Touch: drag to pan, pinch to zoom, double-tap to zoom
 * - Keyboard: arrow keys to pan, +/- to zoom, shortcuts
 */
export class InteractionHandler {
    /**
     * Create interaction handler
     * @param {Object} options
     * @param {HTMLElement} options.element - Target element for events
     * @param {Object} options.engine - Render engine
     * @param {Object} options.state - State manager
     * @param {Object} options.events - Event bus
     */
    constructor(options) {
        this.element = options.element;
        this.engine = options.engine;
        this.state = options.state;
        this.events = options.events;
        this.logger = new Logger('Interaction');
        
        // Configuration
        this.config = {
            zoomSpeed: 1.2,
            panSpeed: 1.0,
            doubleClickZoom: 3,
            pinchSensitivity: 1.0,
            keyPanAmount: 50,
            keyZoomFactor: 1.5,
            throttleMs: 16,  // ~60fps
            enableInertia: true,
            inertiaDecay: 0.95
        };
        
        // State
        this.isDragging = false;
        this.isPinching = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.lastTouchDist = 0;
        this.lastTouchCenter = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.lastMoveTime = 0;
        this.animationFrame = null;
        
        // Bound methods for event listeners
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onDblClick = this._onDblClick.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        
        this._init();
    }
    
    /**
     * Initialize event listeners
     * @private
     */
    _init() {
        if (!this.element) {
            this.logger.warn('No element provided for interaction');
            return;
        }
        
        // Mouse events
        this.element.addEventListener('mousedown', this._onMouseDown);
        this.element.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        this.element.addEventListener('wheel', this._onWheel, { passive: false });
        this.element.addEventListener('dblclick', this._onDblClick);
        this.element.addEventListener('contextmenu', this._onContextMenu);
        
        // Touch events
        this.element.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this.element.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this.element.addEventListener('touchend', this._onTouchEnd);
        this.element.addEventListener('touchcancel', this._onTouchEnd);
        
        // Keyboard events
        document.addEventListener('keydown', this._onKeyDown);
        
        this.logger.info('Interaction handler initialized');
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.element) {
            this.element.removeEventListener('mousedown', this._onMouseDown);
            this.element.removeEventListener('mousemove', this._onMouseMove);
            this.element.removeEventListener('wheel', this._onWheel);
            this.element.removeEventListener('dblclick', this._onDblClick);
            this.element.removeEventListener('contextmenu', this._onContextMenu);
            this.element.removeEventListener('touchstart', this._onTouchStart);
            this.element.removeEventListener('touchmove', this._onTouchMove);
            this.element.removeEventListener('touchend', this._onTouchEnd);
            this.element.removeEventListener('touchcancel', this._onTouchEnd);
        }
        document.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('keydown', this._onKeyDown);
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.logger.info('Interaction handler destroyed');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MOUSE EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Handle mouse down
     * @private
     */
    _onMouseDown(e) {
        if (e.button !== 0) return; // Left button only
        
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.velocity = { x: 0, y: 0 };
        this.element.style.cursor = 'grabbing';
        
        this.events?.emit('pan:start', this.lastMousePos);
    }
    
    /**
     * Handle mouse move
     * @private
     */
    _onMouseMove(e) {
        const pos = { x: e.clientX, y: e.clientY };
        
        // Emit mouse position for overlay
        this.events?.emit('mouse:move', this._getCanvasPos(e));
        
        if (!this.isDragging) return;
        
        // Throttle
        const now = performance.now();
        if (now - this.lastMoveTime < this.config.throttleMs) return;
        this.lastMoveTime = now;
        
        const dx = pos.x - this.lastMousePos.x;
        const dy = pos.y - this.lastMousePos.y;
        
        // Track velocity for inertia
        this.velocity = { x: dx, y: dy };
        
        this._pan(dx, dy);
        
        this.lastMousePos = pos;
    }
    
    /**
     * Handle mouse up
     * @private
     */
    _onMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.element.style.cursor = 'crosshair';
        
        this.events?.emit('pan:end');
        
        // Start inertia if enabled
        if (this.config.enableInertia && 
            (Math.abs(this.velocity.x) > 1 || Math.abs(this.velocity.y) > 1)) {
            this._startInertia();
        }
        
        // Save to history
        this.events?.emit('history:push');
    }
    
    /**
     * Handle mouse wheel
     * @private
     */
    _onWheel(e) {
        e.preventDefault();
        
        const factor = e.deltaY > 0 ? 1 / this.config.zoomSpeed : this.config.zoomSpeed;
        const pos = this._getCanvasPos(e);
        
        this._zoom(factor, pos.x, pos.y);
        
        // Debounced history save
        clearTimeout(this._wheelHistoryTimeout);
        this._wheelHistoryTimeout = setTimeout(() => {
            this.events?.emit('history:push');
        }, 300);
    }
    
    /**
     * Handle double click
     * @private
     */
    _onDblClick(e) {
        const pos = this._getCanvasPos(e);
        this._zoom(this.config.doubleClickZoom, pos.x, pos.y);
        this.events?.emit('history:push');
    }
    
    /**
     * Handle context menu (right click)
     * @private
     */
    _onContextMenu(e) {
        // Could open custom context menu
        // For now, prevent default
        e.preventDefault();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Handle touch start
     * @private
     */
    _onTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // Single touch - pan
            this.isDragging = true;
            this.lastMousePos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            this.velocity = { x: 0, y: 0 };
            this.events?.emit('pan:start', this.lastMousePos);
            
        } else if (e.touches.length === 2) {
            // Two fingers - pinch zoom
            this.isDragging = false;
            this.isPinching = true;
            this.lastTouchDist = this._getTouchDistance(e.touches);
            this.lastTouchCenter = this._getTouchCenter(e.touches);
            this.events?.emit('zoom:start', this.lastTouchCenter);
        }
    }
    
    /**
     * Handle touch move
     * @private
     */
    _onTouchMove(e) {
        e.preventDefault();
        
        // Throttle
        const now = performance.now();
        if (now - this.lastMoveTime < this.config.throttleMs) return;
        this.lastMoveTime = now;
        
        if (e.touches.length === 1 && this.isDragging) {
            // Pan
            const pos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            
            const dx = pos.x - this.lastMousePos.x;
            const dy = pos.y - this.lastMousePos.y;
            
            this.velocity = { x: dx, y: dy };
            this._pan(dx, dy);
            
            this.lastMousePos = pos;
            
        } else if (e.touches.length === 2 && this.isPinching) {
            // Pinch zoom
            const dist = this._getTouchDistance(e.touches);
            const center = this._getTouchCenter(e.touches);
            
            if (this.lastTouchDist > 0) {
                const factor = Math.pow(dist / this.lastTouchDist, this.config.pinchSensitivity);
                const canvasPos = this._screenToCanvas(center.x, center.y);
                this._zoom(factor, canvasPos.x, canvasPos.y);
            }
            
            this.lastTouchDist = dist;
            this.lastTouchCenter = center;
        }
    }
    
    /**
     * Handle touch end
     * @private
     */
    _onTouchEnd(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.events?.emit('pan:end');
            
            // Inertia
            if (this.config.enableInertia && 
                (Math.abs(this.velocity.x) > 1 || Math.abs(this.velocity.y) > 1)) {
                this._startInertia();
            }
        }
        
        if (this.isPinching) {
            this.isPinching = false;
            this.lastTouchDist = 0;
            this.events?.emit('zoom:end');
        }
        
        // Save to history
        this.events?.emit('history:push');
    }
    
    /**
     * Get distance between two touches
     * @private
     */
    _getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.hypot(dx, dy);
    }
    
    /**
     * Get center point between two touches
     * @private
     */
    _getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // KEYBOARD EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Handle key down
     * @private
     */
    _onKeyDown(e) {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        const key = e.key.toLowerCase();
        const { keyPanAmount, keyZoomFactor } = this.config;
        
        switch (key) {
            // Pan
            case 'arrowup':
            case 'w':
                e.preventDefault();
                this._pan(0, keyPanAmount);
                break;
            case 'arrowdown':
            case 's':
                e.preventDefault();
                this._pan(0, -keyPanAmount);
                break;
            case 'arrowleft':
            case 'a':
                e.preventDefault();
                this._pan(keyPanAmount, 0);
                break;
            case 'arrowright':
            case 'd':
                e.preventDefault();
                this._pan(-keyPanAmount, 0);
                break;
                
            // Zoom
            case '+':
            case '=':
                this._zoom(keyZoomFactor);
                break;
            case '-':
            case '_':
                this._zoom(1 / keyZoomFactor);
                break;
                
            // Reset
            case 'r':
            case ' ':
                e.preventDefault();
                this.events?.emit('view:reset');
                break;
            case 'home':
                e.preventDefault();
                this.events?.emit('view:reset');
                break;
                
            // Undo/Redo
            case 'z':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.events?.emit('history:redo');
                    } else {
                        this.events?.emit('history:undo');
                    }
                }
                break;
            case 'y':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.events?.emit('history:redo');
                }
                break;
                
            // Screenshot
            case 'p':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.events?.emit('screenshot');
                }
                break;
                
            // Fullscreen
            case 'f':
                if (!e.ctrlKey && !e.metaKey) {
                    this.events?.emit('fullscreen:toggle');
                }
                break;
                
            // Help
            case '?':
            case 'h':
                if (!e.ctrlKey && !e.metaKey) {
                    this.events?.emit('help:toggle');
                }
                break;
                
            // Escape
            case 'escape':
                this.events?.emit('escape');
                break;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // CORE ACTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Pan the view
     * @private
     * @param {number} dx - Pixel delta X
     * @param {number} dy - Pixel delta Y
     */
    _pan(dx, dy) {
        if (!this.state) return;
        
        const fractal = this.state.get?.('fractal') || {};
        const canvas = this.element;
        const rect = canvas.getBoundingClientRect();
        
        const zoom = fractal.zoom || 1;
        const scale = 4 / zoom;
        const aspectRatio = rect.width / rect.height;
        
        const newCenterX = (fractal.centerX || -0.5) - (dx / rect.width) * scale * aspectRatio;
        const newCenterY = (fractal.centerY || 0) + (dy / rect.height) * scale;
        
        this.state.set?.('fractal', {
            ...fractal,
            centerX: newCenterX,
            centerY: newCenterY
        });
        
        this.events?.emit('fractal:params:changed', { centerX: newCenterX, centerY: newCenterY });
        this.engine?.render?.();
    }
    
    /**
     * Zoom the view
     * @private
     * @param {number} factor - Zoom factor (>1 = zoom in)
     * @param {number} [screenX] - Screen X to zoom toward
     * @param {number} [screenY] - Screen Y to zoom toward
     */
    _zoom(factor, screenX = null, screenY = null) {
        if (!this.state) return;
        
        const fractal = this.state.get?.('fractal') || {};
        const canvas = this.element;
        const rect = canvas.getBoundingClientRect();
        
        let centerX = fractal.centerX || -0.5;
        let centerY = fractal.centerY || 0;
        const zoom = fractal.zoom || 1;
        
        const scale = 4 / zoom;
        const aspectRatio = rect.width / rect.height;
        
        // Zoom toward point if provided
        if (screenX !== null && screenY !== null) {
            const nx = screenX / rect.width;
            const ny = screenY / rect.height;
            
            const fractalX = centerX + (nx - 0.5) * scale * aspectRatio;
            const fractalY = centerY + (ny - 0.5) * scale;
            
            centerX = fractalX + (centerX - fractalX) / factor;
            centerY = fractalY + (centerY - fractalY) / factor;
        }
        
        const newZoom = zoom * factor;
        
        this.state.set?.('fractal', {
            ...fractal,
            centerX,
            centerY,
            zoom: newZoom
        });
        
        this.events?.emit('fractal:params:changed', { centerX, centerY, zoom: newZoom });
        this.engine?.render?.();
    }
    
    /**
     * Start inertia animation
     * @private
     */
    _startInertia() {
        const decay = this.config.inertiaDecay;
        
        const animate = () => {
            if (Math.abs(this.velocity.x) < 0.5 && Math.abs(this.velocity.y) < 0.5) {
                this.velocity = { x: 0, y: 0 };
                return;
            }
            
            this._pan(this.velocity.x, this.velocity.y);
            
            this.velocity.x *= decay;
            this.velocity.y *= decay;
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * Get canvas-relative position from mouse event
     * @private
     */
    _getCanvasPos(e) {
        const rect = this.element.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    /**
     * Convert screen coordinates to canvas coordinates
     * @private
     */
    _screenToCanvas(screenX, screenY) {
        const rect = this.element.getBoundingClientRect();
        return {
            x: screenX - rect.left,
            y: screenY - rect.top
        };
    }
    
    /**
     * Update configuration
     * @param {Object} config
     */
    setConfig(config) {
        Object.assign(this.config, config);
    }
}

export default InteractionHandler;
