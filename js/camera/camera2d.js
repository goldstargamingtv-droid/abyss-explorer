/**
 * ============================================================================
 * ABYSS EXPLORER - 2D CAMERA SYSTEM
 * ============================================================================
 * 
 * High-performance 2D camera for fractal navigation with ultra-smooth
 * panning, zooming, and gesture support. Designed for deep zoom exploration
 * with precise floating-point handling.
 * 
 * Navigation Architecture:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  COORDINATE SYSTEMS                                                    │
 * │  ─────────────────                                                     │
 * │                                                                        │
 * │  Screen Space (pixels)     Complex Plane (mathematical)               │
 * │  ┌─────────────────┐       ┌─────────────────┐                        │
 * │  │(0,0)            │       │     Im          │                        │
 * │  │  ┌───────┐      │  ←→   │      ↑          │                        │
 * │  │  │Viewport│     │       │   ───┼───→ Re   │                        │
 * │  │  └───────┘      │       │      │          │                        │
 * │  │         (w,h)   │       │  (center)       │                        │
 * │  └─────────────────┘       └─────────────────┘                        │
 * │                                                                        │
 * │  ZOOM LEVELS                                                           │
 * │  ───────────                                                           │
 * │  zoom = 1     : Full Mandelbrot set visible (~4 units)                │
 * │  zoom = 10    : 10x magnification                                     │
 * │  zoom = 1e15  : Approaching double precision limits                   │
 * │  zoom = 1e50+ : Requires arbitrary precision (BigFloat)               │
 * │                                                                        │
 * │  INTERACTION MODEL                                                     │
 * │  ─────────────────                                                     │
 * │  • Mouse drag  → Pan with inertia                                     │
 * │  • Scroll      → Zoom toward cursor                                   │
 * │  • Pinch       → Touch zoom with two fingers                          │
 * │  • Double-tap  → Zoom in to point                                     │
 * │  • Right-drag  → Box selection zoom                                   │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module camera/camera2d
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default zoom limits */
const DEFAULT_MIN_ZOOM = 0.5;
const DEFAULT_MAX_ZOOM = 1e15; // Double precision practical limit

/** Physics constants */
const INERTIA_DAMPING = 0.92;      // Velocity decay per frame
const INERTIA_THRESHOLD = 0.001;   // Stop threshold
const ZOOM_SMOOTHING = 0.15;       // Zoom interpolation factor
const PAN_SMOOTHING = 0.2;         // Pan interpolation factor

/** Default view bounds (complex plane) */
const DEFAULT_BOUNDS = {
    minX: -3,
    maxX: 2,
    minY: -1.5,
    maxY: 1.5
};

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

const Easing = {
    linear: t => t,
    
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    
    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => {
        if (t === 0 || t === 1) return t;
        if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    
    // Spring-like easing
    easeOutBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    
    easeOutElastic: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    }
};

// ============================================================================
// CAMERA 2D CLASS
// ============================================================================

export class Camera2D {
    /**
     * Create a 2D camera
     * @param {Object} options - Camera options
     */
    constructor(options = {}) {
        // View dimensions
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.aspectRatio = this.width / this.height;
        
        // Camera position (center of view in complex plane)
        this.centerX = options.centerX ?? -0.5;
        this.centerY = options.centerY ?? 0;
        
        // Zoom level (higher = more zoomed in)
        this.zoom = options.zoom ?? 1;
        
        // Target values for smooth interpolation
        this._targetCenterX = this.centerX;
        this._targetCenterY = this.centerY;
        this._targetZoom = this.zoom;
        
        // Zoom limits
        this.minZoom = options.minZoom ?? DEFAULT_MIN_ZOOM;
        this.maxZoom = options.maxZoom ?? DEFAULT_MAX_ZOOM;
        
        // View bounds (optional)
        this.bounds = options.bounds || null;
        
        // Inertia state
        this.velocityX = 0;
        this.velocityY = 0;
        this.inertiaEnabled = options.inertiaEnabled ?? true;
        
        // Interaction state
        this.isDragging = false;
        this.isPinching = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.lastPinchDistance = 0;
        this.lastPinchCenter = { x: 0, y: 0 };
        
        // Animation state
        this.isAnimating = false;
        this.animation = null;
        
        // Smoothing settings
        this.smoothingEnabled = options.smoothingEnabled ?? true;
        this.zoomSmoothingFactor = options.zoomSmoothingFactor ?? ZOOM_SMOOTHING;
        this.panSmoothingFactor = options.panSmoothingFactor ?? PAN_SMOOTHING;
        
        // Callbacks
        this.onChange = options.onChange || null;
        this.onAnimationComplete = options.onAnimationComplete || null;
        
        // DOM element for event binding
        this.element = options.element || null;
        
        // Bind methods
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onDoubleClick = this._onDoubleClick.bind(this);
        
        // Attach events if element provided
        if (this.element) {
            this.attachEvents(this.element);
        }
    }
    
    // ========================================================================
    // COORDINATE CONVERSION
    // ========================================================================
    
    /**
     * Get the size of the view in complex plane units
     * @returns {Object} { width, height }
     */
    getViewSize() {
        // Base view size is 4 units wide at zoom=1
        const baseSize = 4;
        const viewWidth = baseSize / this.zoom;
        const viewHeight = viewWidth / this.aspectRatio;
        return { width: viewWidth, height: viewHeight };
    }
    
    /**
     * Get view bounds in complex plane
     * @returns {Object} { minX, maxX, minY, maxY }
     */
    getViewBounds() {
        const size = this.getViewSize();
        return {
            minX: this.centerX - size.width / 2,
            maxX: this.centerX + size.width / 2,
            minY: this.centerY - size.height / 2,
            maxY: this.centerY + size.height / 2
        };
    }
    
    /**
     * Convert screen coordinates to complex plane
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} { x, y } in complex plane
     */
    screenToComplex(screenX, screenY) {
        const size = this.getViewSize();
        const x = this.centerX + (screenX / this.width - 0.5) * size.width;
        const y = this.centerY - (screenY / this.height - 0.5) * size.height;
        return { x, y };
    }
    
    /**
     * Convert complex plane to screen coordinates
     * @param {number} complexX - Complex plane X
     * @param {number} complexY - Complex plane Y
     * @returns {Object} { x, y } in screen pixels
     */
    complexToScreen(complexX, complexY) {
        const size = this.getViewSize();
        const x = ((complexX - this.centerX) / size.width + 0.5) * this.width;
        const y = (-(complexY - this.centerY) / size.height + 0.5) * this.height;
        return { x, y };
    }
    
    /**
     * Get pixel size in complex plane units
     * @returns {number} Size of one pixel
     */
    getPixelSize() {
        return this.getViewSize().width / this.width;
    }
    
    // ========================================================================
    // CAMERA MANIPULATION
    // ========================================================================
    
    /**
     * Set camera center
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {boolean} immediate - Skip smoothing
     */
    setCenter(x, y, immediate = false) {
        if (immediate || !this.smoothingEnabled) {
            this.centerX = x;
            this.centerY = y;
            this._targetCenterX = x;
            this._targetCenterY = y;
        } else {
            this._targetCenterX = x;
            this._targetCenterY = y;
        }
        this._clampToBounds();
        this._notifyChange();
    }
    
    /**
     * Set zoom level
     * @param {number} zoom - Zoom level
     * @param {boolean} immediate - Skip smoothing
     */
    setZoom(zoom, immediate = false) {
        zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
        
        if (immediate || !this.smoothingEnabled) {
            this.zoom = zoom;
            this._targetZoom = zoom;
        } else {
            this._targetZoom = zoom;
        }
        this._notifyChange();
    }
    
    /**
     * Pan camera by delta
     * @param {number} dx - Delta X in complex units
     * @param {number} dy - Delta Y in complex units
     */
    pan(dx, dy) {
        this._targetCenterX += dx;
        this._targetCenterY += dy;
        this._clampToBounds();
        this._notifyChange();
    }
    
    /**
     * Pan camera by screen pixels
     * @param {number} screenDx - Delta X in pixels
     * @param {number} screenDy - Delta Y in pixels
     */
    panByScreen(screenDx, screenDy) {
        const size = this.getViewSize();
        const dx = -screenDx / this.width * size.width;
        const dy = screenDy / this.height * size.height;
        this.pan(dx, dy);
    }
    
    /**
     * Zoom toward a point
     * @param {number} factor - Zoom factor (>1 zooms in)
     * @param {number} screenX - Screen X to zoom toward
     * @param {number} screenY - Screen Y to zoom toward
     */
    zoomToward(factor, screenX, screenY) {
        // Get point in complex plane before zoom
        const beforeZoom = this.screenToComplex(screenX, screenY);
        
        // Apply zoom
        const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this._targetZoom * factor));
        this._targetZoom = newZoom;
        
        // Calculate where the point would be after zoom
        const tempZoom = this.zoom;
        this.zoom = newZoom;
        const afterZoom = this.screenToComplex(screenX, screenY);
        this.zoom = tempZoom;
        
        // Adjust center to keep point under cursor
        this._targetCenterX += beforeZoom.x - afterZoom.x;
        this._targetCenterY += beforeZoom.y - afterZoom.y;
        
        this._clampToBounds();
        this._notifyChange();
    }
    
    /**
     * Reset to default view
     * @param {boolean} animate - Whether to animate
     */
    reset(animate = true) {
        if (animate) {
            this.animateTo(-0.5, 0, 1, 1000);
        } else {
            this.setCenter(-0.5, 0, true);
            this.setZoom(1, true);
        }
    }
    
    /**
     * Fit view to show specific bounds
     * @param {Object} bounds - { minX, maxX, minY, maxY }
     * @param {number} padding - Padding factor (1.1 = 10% padding)
     * @param {boolean} animate - Whether to animate
     */
    fitToBounds(bounds, padding = 1.1, animate = true) {
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        const boundsWidth = (bounds.maxX - bounds.minX) * padding;
        const boundsHeight = (bounds.maxY - bounds.minY) * padding;
        
        // Calculate zoom to fit
        const zoomX = 4 / boundsWidth;
        const zoomY = 4 / this.aspectRatio / boundsHeight;
        const zoom = Math.min(zoomX, zoomY);
        
        if (animate) {
            this.animateTo(centerX, centerY, zoom, 500);
        } else {
            this.setCenter(centerX, centerY, true);
            this.setZoom(zoom, true);
        }
    }
    
    // ========================================================================
    // ANIMATION
    // ========================================================================
    
    /**
     * Animate camera to position
     * @param {number} x - Target center X
     * @param {number} y - Target center Y
     * @param {number} zoom - Target zoom
     * @param {number} duration - Animation duration in ms
     * @param {string|Function} easing - Easing function name or function
     * @returns {Promise} Resolves when animation completes
     */
    animateTo(x, y, zoom, duration = 1000, easing = 'easeInOutCubic') {
        return new Promise((resolve) => {
            // Cancel any existing animation
            if (this.animation) {
                this.animation.cancelled = true;
            }
            
            const easingFn = typeof easing === 'function' ? easing : Easing[easing] || Easing.easeInOutCubic;
            
            const startX = this.centerX;
            const startY = this.centerY;
            const startZoom = this.zoom;
            const startTime = performance.now();
            
            // Use logarithmic interpolation for zoom
            const startLogZoom = Math.log(startZoom);
            const endLogZoom = Math.log(Math.max(this.minZoom, Math.min(this.maxZoom, zoom)));
            
            this.animation = {
                startX,
                startY,
                startLogZoom,
                endX: x,
                endY: y,
                endLogZoom,
                startTime,
                duration,
                easingFn,
                cancelled: false,
                resolve
            };
            
            this.isAnimating = true;
        });
    }
    
    /**
     * Stop current animation
     */
    stopAnimation() {
        if (this.animation) {
            this.animation.cancelled = true;
            this.animation = null;
        }
        this.isAnimating = false;
    }
    
    /**
     * Queue an animation after current one
     * @param {number} x - Target center X
     * @param {number} y - Target center Y
     * @param {number} zoom - Target zoom
     * @param {number} duration - Animation duration in ms
     * @param {string} easing - Easing function name
     * @returns {Promise}
     */
    async queueAnimation(x, y, zoom, duration = 1000, easing = 'easeInOutCubic') {
        // Wait for current animation to complete
        if (this.animation && !this.animation.cancelled) {
            await new Promise(resolve => {
                const check = () => {
                    if (!this.animation || this.animation.cancelled) {
                        resolve();
                    } else {
                        requestAnimationFrame(check);
                    }
                };
                check();
            });
        }
        
        return this.animateTo(x, y, zoom, duration, easing);
    }
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    /**
     * Update camera state (call every frame)
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime = 16.67) {
        let changed = false;
        
        // Update animation
        if (this.animation && !this.animation.cancelled) {
            const now = performance.now();
            const elapsed = now - this.animation.startTime;
            const progress = Math.min(1, elapsed / this.animation.duration);
            const t = this.animation.easingFn(progress);
            
            this.centerX = this.animation.startX + (this.animation.endX - this.animation.startX) * t;
            this.centerY = this.animation.startY + (this.animation.endY - this.animation.startY) * t;
            
            // Logarithmic zoom interpolation for smooth deep zooms
            const logZoom = this.animation.startLogZoom + (this.animation.endLogZoom - this.animation.startLogZoom) * t;
            this.zoom = Math.exp(logZoom);
            
            this._targetCenterX = this.centerX;
            this._targetCenterY = this.centerY;
            this._targetZoom = this.zoom;
            
            changed = true;
            
            if (progress >= 1) {
                this.isAnimating = false;
                const resolve = this.animation.resolve;
                this.animation = null;
                
                if (resolve) resolve();
                if (this.onAnimationComplete) {
                    this.onAnimationComplete();
                }
            }
        }
        // Apply inertia when not dragging
        else if (!this.isDragging && this.inertiaEnabled) {
            if (Math.abs(this.velocityX) > INERTIA_THRESHOLD || Math.abs(this.velocityY) > INERTIA_THRESHOLD) {
                this._targetCenterX += this.velocityX;
                this._targetCenterY += this.velocityY;
                
                this.velocityX *= INERTIA_DAMPING;
                this.velocityY *= INERTIA_DAMPING;
                
                changed = true;
            }
        }
        
        // Smooth interpolation toward targets
        if (this.smoothingEnabled && !this.animation) {
            const dx = this._targetCenterX - this.centerX;
            const dy = this._targetCenterY - this.centerY;
            const dz = this._targetZoom - this.zoom;
            
            if (Math.abs(dx) > 1e-15 || Math.abs(dy) > 1e-15) {
                this.centerX += dx * this.panSmoothingFactor;
                this.centerY += dy * this.panSmoothingFactor;
                changed = true;
            }
            
            if (Math.abs(dz) > 1e-10) {
                this.zoom += dz * this.zoomSmoothingFactor;
                changed = true;
            }
        }
        
        if (changed) {
            this._notifyChange();
        }
        
        return changed;
    }
    
    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    
    /**
     * Attach event listeners to element
     * @param {HTMLElement} element - DOM element
     */
    attachEvents(element) {
        this.element = element;
        
        element.addEventListener('mousedown', this._onMouseDown);
        element.addEventListener('mousemove', this._onMouseMove);
        element.addEventListener('mouseup', this._onMouseUp);
        element.addEventListener('mouseleave', this._onMouseUp);
        element.addEventListener('wheel', this._onWheel, { passive: false });
        element.addEventListener('dblclick', this._onDoubleClick);
        
        // Touch events
        element.addEventListener('touchstart', this._onTouchStart, { passive: false });
        element.addEventListener('touchmove', this._onTouchMove, { passive: false });
        element.addEventListener('touchend', this._onTouchEnd);
        element.addEventListener('touchcancel', this._onTouchEnd);
        
        // Prevent context menu on right-click
        element.addEventListener('contextmenu', e => e.preventDefault());
    }
    
    /**
     * Remove event listeners
     */
    detachEvents() {
        if (!this.element) return;
        
        this.element.removeEventListener('mousedown', this._onMouseDown);
        this.element.removeEventListener('mousemove', this._onMouseMove);
        this.element.removeEventListener('mouseup', this._onMouseUp);
        this.element.removeEventListener('mouseleave', this._onMouseUp);
        this.element.removeEventListener('wheel', this._onWheel);
        this.element.removeEventListener('dblclick', this._onDoubleClick);
        this.element.removeEventListener('touchstart', this._onTouchStart);
        this.element.removeEventListener('touchmove', this._onTouchMove);
        this.element.removeEventListener('touchend', this._onTouchEnd);
        this.element.removeEventListener('touchcancel', this._onTouchEnd);
    }
    
    _onMouseDown(e) {
        if (e.button === 0) { // Left button
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.velocityX = 0;
            this.velocityY = 0;
            this.stopAnimation();
        }
    }
    
    _onMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            
            // Calculate velocity for inertia
            const size = this.getViewSize();
            this.velocityX = -dx / this.width * size.width;
            this.velocityY = dy / this.height * size.height;
            
            this.panByScreen(dx, dy);
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }
    
    _onMouseUp(e) {
        this.isDragging = false;
    }
    
    _onWheel(e) {
        e.preventDefault();
        
        // Calculate zoom factor from wheel delta
        const delta = -e.deltaY;
        const factor = Math.pow(1.001, delta);
        
        // Get cursor position relative to element
        const rect = this.element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.zoomToward(factor, x, y);
    }
    
    _onDoubleClick(e) {
        const rect = this.element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Zoom in 2x at click point
        const target = this.screenToComplex(x, y);
        this.animateTo(target.x, target.y, this.zoom * 2, 500, 'easeOutCubic');
    }
    
    _onTouchStart(e) {
        e.preventDefault();
        
        if (e.touches.length === 1) {
            // Single touch - pan
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
            this.velocityX = 0;
            this.velocityY = 0;
            this.stopAnimation();
        } else if (e.touches.length === 2) {
            // Two touches - pinch zoom
            this.isDragging = false;
            this.isPinching = true;
            this.lastPinchDistance = this._getPinchDistance(e.touches);
            this.lastPinchCenter = this._getPinchCenter(e.touches);
        }
    }
    
    _onTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.isDragging) {
            const dx = e.touches[0].clientX - this.lastMouseX;
            const dy = e.touches[0].clientY - this.lastMouseY;
            
            const size = this.getViewSize();
            this.velocityX = -dx / this.width * size.width;
            this.velocityY = dy / this.height * size.height;
            
            this.panByScreen(dx, dy);
            
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2 && this.isPinching) {
            const distance = this._getPinchDistance(e.touches);
            const center = this._getPinchCenter(e.touches);
            
            // Zoom based on pinch distance change
            const factor = distance / this.lastPinchDistance;
            
            // Get element-relative center
            const rect = this.element.getBoundingClientRect();
            const x = center.x - rect.left;
            const y = center.y - rect.top;
            
            this.zoomToward(factor, x, y);
            
            // Pan based on pinch center movement
            const dx = center.x - this.lastPinchCenter.x;
            const dy = center.y - this.lastPinchCenter.y;
            this.panByScreen(dx, dy);
            
            this.lastPinchDistance = distance;
            this.lastPinchCenter = center;
        }
    }
    
    _onTouchEnd(e) {
        if (e.touches.length === 0) {
            this.isDragging = false;
            this.isPinching = false;
        } else if (e.touches.length === 1) {
            this.isPinching = false;
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }
    
    _getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    _getPinchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }
    
    // ========================================================================
    // PRIVATE METHODS
    // ========================================================================
    
    /**
     * Clamp camera to bounds
     * @private
     */
    _clampToBounds() {
        if (!this.bounds) return;
        
        const view = this.getViewSize();
        const halfWidth = view.width / 2;
        const halfHeight = view.height / 2;
        
        // Clamp center so view stays within bounds
        this._targetCenterX = Math.max(this.bounds.minX + halfWidth, 
            Math.min(this.bounds.maxX - halfWidth, this._targetCenterX));
        this._targetCenterY = Math.max(this.bounds.minY + halfHeight,
            Math.min(this.bounds.maxY - halfHeight, this._targetCenterY));
    }
    
    /**
     * Notify change callback
     * @private
     */
    _notifyChange() {
        if (this.onChange) {
            this.onChange({
                centerX: this.centerX,
                centerY: this.centerY,
                zoom: this.zoom,
                bounds: this.getViewBounds(),
                pixelSize: this.getPixelSize()
            });
        }
    }
    
    // ========================================================================
    // RESIZE
    // ========================================================================
    
    /**
     * Handle viewport resize
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.aspectRatio = width / height;
        this._notifyChange();
    }
    
    // ========================================================================
    // SERIALIZATION
    // ========================================================================
    
    /**
     * Get camera state as object
     * @returns {Object}
     */
    toJSON() {
        return {
            centerX: this.centerX,
            centerY: this.centerY,
            zoom: this.zoom,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * Restore camera state from object
     * @param {Object} state - Camera state
     * @param {boolean} animate - Whether to animate to state
     */
    fromJSON(state, animate = false) {
        if (animate) {
            this.animateTo(state.centerX, state.centerY, state.zoom, 1000);
        } else {
            this.setCenter(state.centerX, state.centerY, true);
            this.setZoom(state.zoom, true);
        }
        
        if (state.width && state.height) {
            this.resize(state.width, state.height);
        }
    }
    
    /**
     * Clone this camera
     * @returns {Camera2D}
     */
    clone() {
        return new Camera2D({
            width: this.width,
            height: this.height,
            centerX: this.centerX,
            centerY: this.centerY,
            zoom: this.zoom,
            minZoom: this.minZoom,
            maxZoom: this.maxZoom,
            bounds: this.bounds ? { ...this.bounds } : null,
            inertiaEnabled: this.inertiaEnabled,
            smoothingEnabled: this.smoothingEnabled
        });
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Easing };
export default Camera2D;
