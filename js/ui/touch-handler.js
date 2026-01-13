/**
 * ============================================================================
 * ABYSS EXPLORER - TOUCH HANDLER
 * ============================================================================
 * 
 * Enhanced touch gesture support for mobile devices including pinch zoom,
 * multi-finger pan, double-tap, and long-press gestures.
 * 
 * Gestures:
 * - Single finger drag: Pan
 * - Two finger pinch: Zoom
 * - Two finger drag: Pan (alternative)
 * - Double tap: Zoom in at point
 * - Long press: Context menu
 * - Three finger tap: Reset view
 * 
 * @module ui/touch-handler
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { UI_EVENTS } from './ui-manager.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const DOUBLE_TAP_DELAY = 300;
const LONG_PRESS_DELAY = 500;
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 0.5;
const PINCH_THRESHOLD = 10;
const PAN_THRESHOLD = 5;

// ============================================================================
// TOUCH STATE
// ============================================================================

/**
 * Track individual touch point
 */
class TouchPoint {
    constructor(touch) {
        this.id = touch.identifier;
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.currentX = touch.clientX;
        this.currentY = touch.clientY;
        this.prevX = touch.clientX;
        this.prevY = touch.clientY;
        this.startTime = Date.now();
        this.velocityX = 0;
        this.velocityY = 0;
    }
    
    update(touch) {
        const now = Date.now();
        const dt = now - this.startTime;
        
        this.prevX = this.currentX;
        this.prevY = this.currentY;
        this.currentX = touch.clientX;
        this.currentY = touch.clientY;
        
        if (dt > 0) {
            this.velocityX = (this.currentX - this.prevX) / dt * 1000;
            this.velocityY = (this.currentY - this.prevY) / dt * 1000;
        }
    }
    
    get deltaX() { return this.currentX - this.startX; }
    get deltaY() { return this.currentY - this.startY; }
    get distance() { return Math.sqrt(this.deltaX ** 2 + this.deltaY ** 2); }
}

// ============================================================================
// TOUCH HANDLER CLASS
// ============================================================================

export class TouchHandler {
    /**
     * Create touch handler
     * @param {Object} options - Options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.target = options.target || null;
        
        // Callbacks
        this.onPan = options.onPan || null;
        this.onZoom = options.onZoom || null;
        this.onDoubleTap = options.onDoubleTap || null;
        this.onLongPress = options.onLongPress || null;
        this.onSwipe = options.onSwipe || null;
        
        // State
        this.touches = new Map();
        this.gesture = null;
        this.lastTapTime = 0;
        this.lastTapPosition = { x: 0, y: 0 };
        this.longPressTimer = null;
        this.isGestureActive = false;
        
        // Pinch state
        this.initialPinchDistance = 0;
        this.initialPinchCenter = { x: 0, y: 0 };
        this.currentPinchScale = 1;
        
        // Pan state
        this.panStartX = 0;
        this.panStartY = 0;
        
        // Performance
        this.rafId = null;
        this.pendingUpdate = null;
        
        // Bind methods
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchCancel = this._onTouchCancel.bind(this);
        
        // Attach
        if (this.target) {
            this.attach(this.target);
        }
    }
    
    /**
     * Set UI manager reference
     */
    setManager(manager) {
        this.manager = manager;
    }
    
    // ========================================================================
    // ATTACH/DETACH
    // ========================================================================
    
    /**
     * Attach to element
     * @param {HTMLElement} element
     */
    attach(element) {
        this.target = element;
        
        // Prevent default touch behaviors
        element.style.touchAction = 'none';
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        
        // Add event listeners with passive: false for preventDefault
        element.addEventListener('touchstart', this._onTouchStart, { passive: false });
        element.addEventListener('touchmove', this._onTouchMove, { passive: false });
        element.addEventListener('touchend', this._onTouchEnd, { passive: false });
        element.addEventListener('touchcancel', this._onTouchCancel, { passive: false });
        
        // Prevent context menu on long press (we handle it ourselves)
        element.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Detach from element
     */
    detach() {
        if (!this.target) return;
        
        this.target.removeEventListener('touchstart', this._onTouchStart);
        this.target.removeEventListener('touchmove', this._onTouchMove);
        this.target.removeEventListener('touchend', this._onTouchEnd);
        this.target.removeEventListener('touchcancel', this._onTouchCancel);
        
        this.target = null;
    }
    
    // ========================================================================
    // TOUCH EVENTS
    // ========================================================================
    
    /**
     * Handle touch start
     * @private
     */
    _onTouchStart(e) {
        e.preventDefault();
        
        // Update touch points
        for (const touch of e.changedTouches) {
            this.touches.set(touch.identifier, new TouchPoint(touch));
        }
        
        const touchCount = this.touches.size;
        
        // Detect gesture type
        if (touchCount === 1) {
            this._startSingleTouch(e);
        } else if (touchCount === 2) {
            this._startPinch(e);
        } else if (touchCount === 3) {
            // Three finger tap - reset view
            this._handleThreeFingerTap();
        }
    }
    
    /**
     * Handle touch move
     * @private
     */
    _onTouchMove(e) {
        e.preventDefault();
        
        // Update touch points
        for (const touch of e.changedTouches) {
            const point = this.touches.get(touch.identifier);
            if (point) point.update(touch);
        }
        
        // Clear long press timer on move
        if (this.longPressTimer) {
            const point = this.touches.values().next().value;
            if (point && point.distance > PAN_THRESHOLD) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }
        
        // Handle based on gesture type
        if (this.touches.size === 1) {
            this._handlePan();
        } else if (this.touches.size === 2) {
            this._handlePinch();
        }
    }
    
    /**
     * Handle touch end
     * @private
     */
    _onTouchEnd(e) {
        e.preventDefault();
        
        // Process ended touches
        for (const touch of e.changedTouches) {
            const point = this.touches.get(touch.identifier);
            
            if (point) {
                // Check for tap
                if (point.distance < PAN_THRESHOLD && Date.now() - point.startTime < 300) {
                    this._handleTap(point);
                }
                
                // Check for swipe
                if (this.touches.size === 1) {
                    this._checkSwipe(point);
                }
                
                this.touches.delete(touch.identifier);
            }
        }
        
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Reset gesture state
        if (this.touches.size === 0) {
            this._endGesture();
        } else if (this.touches.size === 1 && this.gesture === 'pinch') {
            // Transition from pinch to pan
            this.gesture = 'pan';
            const point = this.touches.values().next().value;
            this.panStartX = point.currentX;
            this.panStartY = point.currentY;
        }
    }
    
    /**
     * Handle touch cancel
     * @private
     */
    _onTouchCancel(e) {
        // Clear all touches
        for (const touch of e.changedTouches) {
            this.touches.delete(touch.identifier);
        }
        
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        this._endGesture();
    }
    
    // ========================================================================
    // GESTURE HANDLERS
    // ========================================================================
    
    /**
     * Start single touch (pan or potential tap)
     * @private
     */
    _startSingleTouch(e) {
        const touch = e.changedTouches[0];
        this.gesture = 'potential-tap';
        
        this.panStartX = touch.clientX;
        this.panStartY = touch.clientY;
        
        // Start long press timer
        this.longPressTimer = setTimeout(() => {
            this._handleLongPress(touch);
        }, LONG_PRESS_DELAY);
    }
    
    /**
     * Start pinch gesture
     * @private
     */
    _startPinch(e) {
        this.gesture = 'pinch';
        
        // Clear long press timer
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // Calculate initial pinch state
        const [touch1, touch2] = Array.from(this.touches.values());
        
        this.initialPinchDistance = this._getDistance(touch1, touch2);
        this.initialPinchCenter = this._getCenter(touch1, touch2);
        this.currentPinchScale = 1;
        
        this.isGestureActive = true;
    }
    
    /**
     * Handle pan gesture
     * @private
     */
    _handlePan() {
        const point = this.touches.values().next().value;
        if (!point) return;
        
        // Check if this is now a pan (not a tap)
        if (point.distance > PAN_THRESHOLD) {
            this.gesture = 'pan';
        }
        
        if (this.gesture !== 'pan') return;
        
        const deltaX = point.currentX - point.prevX;
        const deltaY = point.currentY - point.prevY;
        
        // Throttle updates using RAF
        this._scheduleUpdate(() => {
            if (this.onPan) {
                this.onPan(deltaX, deltaY, point);
            }
            
            this.manager?.emit('touch:pan', {
                deltaX,
                deltaY,
                x: point.currentX,
                y: point.currentY,
                velocityX: point.velocityX,
                velocityY: point.velocityY
            });
        });
    }
    
    /**
     * Handle pinch gesture
     * @private
     */
    _handlePinch() {
        if (this.touches.size !== 2) return;
        
        const [touch1, touch2] = Array.from(this.touches.values());
        
        const currentDistance = this._getDistance(touch1, touch2);
        const currentCenter = this._getCenter(touch1, touch2);
        
        // Calculate scale
        const scale = currentDistance / this.initialPinchDistance;
        const deltaScale = scale / this.currentPinchScale;
        this.currentPinchScale = scale;
        
        // Calculate pan (center movement)
        const panX = currentCenter.x - this.initialPinchCenter.x;
        const panY = currentCenter.y - this.initialPinchCenter.y;
        
        // Update initial center for incremental pan
        this.initialPinchCenter = currentCenter;
        
        // Throttle updates
        this._scheduleUpdate(() => {
            if (this.onZoom) {
                this.onZoom(deltaScale, currentCenter.x, currentCenter.y);
            }
            
            this.manager?.emit('touch:pinch', {
                scale: deltaScale,
                totalScale: scale,
                centerX: currentCenter.x,
                centerY: currentCenter.y,
                panX,
                panY
            });
        });
    }
    
    /**
     * Handle tap
     * @private
     */
    _handleTap(point) {
        const now = Date.now();
        const timeSinceLastTap = now - this.lastTapTime;
        const distanceFromLastTap = Math.sqrt(
            (point.currentX - this.lastTapPosition.x) ** 2 +
            (point.currentY - this.lastTapPosition.y) ** 2
        );
        
        // Check for double tap
        if (timeSinceLastTap < DOUBLE_TAP_DELAY && distanceFromLastTap < 50) {
            this._handleDoubleTap(point);
            this.lastTapTime = 0;
        } else {
            this.lastTapTime = now;
            this.lastTapPosition = { x: point.currentX, y: point.currentY };
            
            // Single tap
            this.manager?.emit('touch:tap', {
                x: point.currentX,
                y: point.currentY
            });
        }
    }
    
    /**
     * Handle double tap
     * @private
     */
    _handleDoubleTap(point) {
        if (this.onDoubleTap) {
            this.onDoubleTap(point.currentX, point.currentY);
        }
        
        this.manager?.emit('touch:doubletap', {
            x: point.currentX,
            y: point.currentY
        });
        
        // Default behavior: zoom in at point
        this.manager?.emit(UI_EVENTS.CAMERA_ANIMATE, {
            centerX: null, // Will be calculated from screen coords
            centerY: null,
            zoomMultiplier: 2,
            screenX: point.currentX,
            screenY: point.currentY,
            duration: 500
        });
    }
    
    /**
     * Handle long press
     * @private
     */
    _handleLongPress(touch) {
        this.longPressTimer = null;
        this.gesture = 'longpress';
        
        // Vibrate if supported
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        if (this.onLongPress) {
            this.onLongPress(touch.clientX, touch.clientY);
        }
        
        this.manager?.emit('touch:longpress', {
            x: touch.clientX,
            y: touch.clientY
        });
        
        // Open context menu
        this.manager?.emit('contextmenu:open', {
            x: touch.clientX,
            y: touch.clientY
        });
    }
    
    /**
     * Handle three finger tap
     * @private
     */
    _handleThreeFingerTap() {
        this.manager?.emit('touch:threefinger');
        this.manager?.resetView();
    }
    
    /**
     * Check for swipe gesture
     * @private
     */
    _checkSwipe(point) {
        const velocity = Math.sqrt(point.velocityX ** 2 + point.velocityY ** 2);
        
        if (point.distance > SWIPE_THRESHOLD && velocity > SWIPE_VELOCITY) {
            const angle = Math.atan2(point.deltaY, point.deltaX);
            let direction;
            
            if (angle > -Math.PI / 4 && angle <= Math.PI / 4) {
                direction = 'right';
            } else if (angle > Math.PI / 4 && angle <= 3 * Math.PI / 4) {
                direction = 'down';
            } else if (angle > -3 * Math.PI / 4 && angle <= -Math.PI / 4) {
                direction = 'up';
            } else {
                direction = 'left';
            }
            
            if (this.onSwipe) {
                this.onSwipe(direction, velocity);
            }
            
            this.manager?.emit('touch:swipe', {
                direction,
                velocity,
                deltaX: point.deltaX,
                deltaY: point.deltaY
            });
        }
    }
    
    /**
     * End gesture
     * @private
     */
    _endGesture() {
        this.gesture = null;
        this.isGestureActive = false;
        this.currentPinchScale = 1;
        
        // Cancel any pending updates
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        this.manager?.emit('touch:end');
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    /**
     * Get distance between two touch points
     * @private
     */
    _getDistance(touch1, touch2) {
        const dx = touch2.currentX - touch1.currentX;
        const dy = touch2.currentY - touch1.currentY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Get center point between two touches
     * @private
     */
    _getCenter(touch1, touch2) {
        return {
            x: (touch1.currentX + touch2.currentX) / 2,
            y: (touch1.currentY + touch2.currentY) / 2
        };
    }
    
    /**
     * Schedule update using RAF
     * @private
     */
    _scheduleUpdate(callback) {
        if (this.rafId) {
            this.pendingUpdate = callback;
            return;
        }
        
        this.rafId = requestAnimationFrame(() => {
            callback();
            this.rafId = null;
            
            if (this.pendingUpdate) {
                const pending = this.pendingUpdate;
                this.pendingUpdate = null;
                this._scheduleUpdate(pending);
            }
        });
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Check if a gesture is currently active
     * @returns {boolean}
     */
    isActive() {
        return this.isGestureActive || this.touches.size > 0;
    }
    
    /**
     * Get current gesture type
     * @returns {string|null}
     */
    getGesture() {
        return this.gesture;
    }
    
    /**
     * Get touch count
     * @returns {number}
     */
    getTouchCount() {
        return this.touches.size;
    }
    
    /**
     * Enable touch handling
     */
    enable() {
        if (this.target) {
            this.attach(this.target);
        }
    }
    
    /**
     * Disable touch handling
     */
    disable() {
        this.detach();
        this.touches.clear();
        this._endGesture();
    }
    
    /**
     * Destroy handler
     */
    destroy() {
        this.disable();
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { TouchPoint };
export default TouchHandler;
