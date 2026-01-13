/**
 * ============================================================================
 * ABYSS EXPLORER - ANIMATION CONTROLLER
 * ============================================================================
 * 
 * Central controller for managing camera animations across both 2D and 3D
 * modes. Handles queuing, sequencing, speed control, looping, and
 * coordination with the rendering pipeline.
 * 
 * Architecture:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  ANIMATION CONTROLLER                                                  │
 * │  ┌─────────────────────────────────────────────────────────────────┐  │
 * │  │                                                                 │  │
 * │  │   Queue        Timeline           Camera                        │  │
 * │  │  ┌─────┐      ┌─────────────┐    ┌─────────┐                   │  │
 * │  │  │ A1  │ ───→ │ ████░░░░░░░ │───→│ Camera  │                   │  │
 * │  │  │ A2  │      │  0%───100%  │    │ 2D / 3D │                   │  │
 * │  │  │ A3  │      └─────────────┘    └─────────┘                   │  │
 * │  │  └─────┘                                                       │  │
 * │  │                                                                 │  │
 * │  │  Controls:                                                      │  │
 * │  │  ▶ Play   ⏸ Pause   ⏹ Stop   ⏪ Prev   ⏩ Next                │  │
 * │  │  ⚡ Speed: 0.25x  0.5x  1x  2x  4x                             │  │
 * │  │  🔁 Loop: None | Single | All                                  │  │
 * │  │                                                                 │  │
 * │  └─────────────────────────────────────────────────────────────────┘  │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module camera/animation-controller
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Animation states */
export const ANIMATION_STATE = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    STOPPED: 'stopped'
};

/** Loop modes */
export const LOOP_MODE = {
    NONE: 'none',
    SINGLE: 'single',
    ALL: 'all',
    PING_PONG: 'ping-pong'
};

/** Default speed presets */
export const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 4, 8];

// ============================================================================
// ANIMATION ITEM CLASS
// ============================================================================

/**
 * Represents a single animation in the queue
 */
export class AnimationItem {
    constructor(options = {}) {
        this.id = options.id || `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = options.name || 'Unnamed Animation';
        
        // Animation type
        this.type = options.type || 'camera'; // camera, palette, parameter
        
        // Target state
        this.target = options.target || {};
        
        // Timing
        this.duration = options.duration || 1000;
        this.delay = options.delay || 0;
        
        // Easing
        this.easing = options.easing || 'easeInOutCubic';
        
        // Callbacks
        this.onStart = options.onStart || null;
        this.onUpdate = options.onUpdate || null;
        this.onComplete = options.onComplete || null;
        
        // State
        this.progress = 0;
        this.started = false;
        this.completed = false;
    }
    
    reset() {
        this.progress = 0;
        this.started = false;
        this.completed = false;
    }
    
    clone() {
        return new AnimationItem({
            name: this.name,
            type: this.type,
            target: JSON.parse(JSON.stringify(this.target)),
            duration: this.duration,
            delay: this.delay,
            easing: this.easing
        });
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            target: this.target,
            duration: this.duration,
            delay: this.delay,
            easing: this.easing
        };
    }
    
    static fromJSON(json) {
        return new AnimationItem(json);
    }
}

// ============================================================================
// ANIMATION SEQUENCE CLASS
// ============================================================================

/**
 * A sequence of animations that play in order
 */
export class AnimationSequence {
    constructor(options = {}) {
        this.id = options.id || `seq_${Date.now()}`;
        this.name = options.name || 'Unnamed Sequence';
        this.items = [];
        
        // Metadata
        this.description = options.description || '';
        this.author = options.author || '';
        this.created = options.created || Date.now();
        
        // Add initial items
        if (options.items) {
            for (const item of options.items) {
                this.add(item instanceof AnimationItem ? item : new AnimationItem(item));
            }
        }
    }
    
    /**
     * Add animation to sequence
     * @param {AnimationItem} item - Animation item
     */
    add(item) {
        this.items.push(item);
        return this;
    }
    
    /**
     * Remove animation by index
     * @param {number} index - Index to remove
     */
    remove(index) {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
        }
        return this;
    }
    
    /**
     * Move animation in sequence
     * @param {number} fromIndex - Source index
     * @param {number} toIndex - Destination index
     */
    move(fromIndex, toIndex) {
        if (fromIndex >= 0 && fromIndex < this.items.length &&
            toIndex >= 0 && toIndex < this.items.length) {
            const item = this.items.splice(fromIndex, 1)[0];
            this.items.splice(toIndex, 0, item);
        }
        return this;
    }
    
    /**
     * Get total duration
     * @returns {number} Total duration in ms
     */
    getTotalDuration() {
        return this.items.reduce((sum, item) => sum + item.duration + item.delay, 0);
    }
    
    /**
     * Reset all items
     */
    reset() {
        for (const item of this.items) {
            item.reset();
        }
    }
    
    /**
     * Clone sequence
     */
    clone() {
        const cloned = new AnimationSequence({
            name: `${this.name} (Copy)`,
            description: this.description
        });
        
        for (const item of this.items) {
            cloned.add(item.clone());
        }
        
        return cloned;
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            author: this.author,
            created: this.created,
            items: this.items.map(item => item.toJSON())
        };
    }
    
    static fromJSON(json) {
        return new AnimationSequence({
            ...json,
            items: json.items.map(item => AnimationItem.fromJSON(item))
        });
    }
}

// ============================================================================
// ANIMATION CONTROLLER CLASS
// ============================================================================

/**
 * Central animation controller
 */
export class AnimationController {
    constructor(options = {}) {
        // Cameras
        this.camera2d = options.camera2d || null;
        this.camera3d = options.camera3d || null;
        
        // Current mode
        this.is3D = options.is3D ?? false;
        
        // Animation queue
        this.queue = [];
        this.currentIndex = 0;
        
        // Current sequence
        this.sequence = null;
        
        // Playback state
        this.state = ANIMATION_STATE.IDLE;
        this.speed = 1;
        this.loopMode = LOOP_MODE.NONE;
        this.direction = 1; // 1 = forward, -1 = backward
        
        // Timeline
        this.currentTime = 0;
        this.totalDuration = 0;
        
        // Animation frame tracking
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        
        // Callbacks
        this.onStateChange = options.onStateChange || null;
        this.onProgress = options.onProgress || null;
        this.onItemStart = options.onItemStart || null;
        this.onItemComplete = options.onItemComplete || null;
        this.onSequenceComplete = options.onSequenceComplete || null;
        
        // Bind methods
        this._animate = this._animate.bind(this);
    }
    
    // ========================================================================
    // CAMERA MANAGEMENT
    // ========================================================================
    
    /**
     * Set 2D camera
     * @param {Camera2D} camera - 2D camera instance
     */
    setCamera2D(camera) {
        this.camera2d = camera;
    }
    
    /**
     * Set 3D camera
     * @param {Camera3D} camera - 3D camera instance
     */
    setCamera3D(camera) {
        this.camera3d = camera;
    }
    
    /**
     * Get active camera
     * @returns {Camera2D|Camera3D}
     */
    getActiveCamera() {
        return this.is3D ? this.camera3d : this.camera2d;
    }
    
    /**
     * Set camera mode
     * @param {boolean} is3D - Whether to use 3D camera
     */
    set3DMode(is3D) {
        this.is3D = is3D;
    }
    
    // ========================================================================
    // QUEUE MANAGEMENT
    // ========================================================================
    
    /**
     * Add animation to queue
     * @param {AnimationItem|Object} animation - Animation to add
     */
    enqueue(animation) {
        if (!(animation instanceof AnimationItem)) {
            animation = new AnimationItem(animation);
        }
        
        this.queue.push(animation);
        this._updateTotalDuration();
        
        return animation;
    }
    
    /**
     * Add multiple animations
     * @param {Array} animations - Animations to add
     */
    enqueueAll(animations) {
        for (const anim of animations) {
            this.enqueue(anim);
        }
    }
    
    /**
     * Clear the queue
     */
    clearQueue() {
        this.stop();
        this.queue = [];
        this.currentIndex = 0;
        this._updateTotalDuration();
    }
    
    /**
     * Load a sequence
     * @param {AnimationSequence} sequence - Sequence to load
     */
    loadSequence(sequence) {
        this.clearQueue();
        this.sequence = sequence;
        this.queue = sequence.items.map(item => item.clone());
        this._updateTotalDuration();
    }
    
    /**
     * Update total duration
     * @private
     */
    _updateTotalDuration() {
        this.totalDuration = this.queue.reduce((sum, item) => sum + item.duration + item.delay, 0);
    }
    
    // ========================================================================
    // PLAYBACK CONTROL
    // ========================================================================
    
    /**
     * Play animations
     */
    play() {
        if (this.queue.length === 0) return;
        
        if (this.state === ANIMATION_STATE.IDLE || this.state === ANIMATION_STATE.STOPPED) {
            this.currentIndex = this.direction > 0 ? 0 : this.queue.length - 1;
            this.currentTime = 0;
            this._resetQueue();
        }
        
        this.state = ANIMATION_STATE.PLAYING;
        this.lastFrameTime = performance.now();
        
        this._notifyStateChange();
        this._startAnimationLoop();
    }
    
    /**
     * Pause animations
     */
    pause() {
        if (this.state === ANIMATION_STATE.PLAYING) {
            this.state = ANIMATION_STATE.PAUSED;
            this._stopAnimationLoop();
            this._notifyStateChange();
        }
    }
    
    /**
     * Resume from pause
     */
    resume() {
        if (this.state === ANIMATION_STATE.PAUSED) {
            this.state = ANIMATION_STATE.PLAYING;
            this.lastFrameTime = performance.now();
            this._startAnimationLoop();
            this._notifyStateChange();
        }
    }
    
    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (this.state === ANIMATION_STATE.PLAYING) {
            this.pause();
        } else {
            this.state === ANIMATION_STATE.PAUSED ? this.resume() : this.play();
        }
    }
    
    /**
     * Stop animations
     */
    stop() {
        this.state = ANIMATION_STATE.STOPPED;
        this._stopAnimationLoop();
        this.currentIndex = 0;
        this.currentTime = 0;
        this._resetQueue();
        this._notifyStateChange();
    }
    
    /**
     * Skip to next animation
     */
    next() {
        if (this.currentIndex < this.queue.length - 1) {
            this._completeCurrentAnimation();
            this.currentIndex++;
            this._startCurrentAnimation();
        } else if (this.loopMode === LOOP_MODE.ALL) {
            this.currentIndex = 0;
            this._resetQueue();
            this._startCurrentAnimation();
        }
    }
    
    /**
     * Go to previous animation
     */
    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this._resetCurrentAnimation();
            this._startCurrentAnimation();
        }
    }
    
    /**
     * Seek to time position
     * @param {number} time - Time in ms
     */
    seek(time) {
        this.currentTime = Math.max(0, Math.min(this.totalDuration, time));
        
        // Find the animation at this time
        let elapsed = 0;
        for (let i = 0; i < this.queue.length; i++) {
            const item = this.queue[i];
            const itemStart = elapsed;
            const itemEnd = elapsed + item.duration + item.delay;
            
            if (this.currentTime >= itemStart && this.currentTime < itemEnd) {
                this.currentIndex = i;
                const localTime = this.currentTime - itemStart;
                item.progress = Math.max(0, (localTime - item.delay) / item.duration);
                
                // Apply animation state
                this._applyAnimationState(item, item.progress);
                break;
            }
            
            elapsed = itemEnd;
        }
        
        if (this.onProgress) {
            this.onProgress(this.currentTime, this.totalDuration, this.currentIndex);
        }
    }
    
    /**
     * Seek to percentage
     * @param {number} percent - Percentage (0-1)
     */
    seekPercent(percent) {
        this.seek(percent * this.totalDuration);
    }
    
    /**
     * Set playback speed
     * @param {number} speed - Speed multiplier
     */
    setSpeed(speed) {
        this.speed = Math.max(0.1, Math.min(10, speed));
    }
    
    /**
     * Set loop mode
     * @param {string} mode - Loop mode
     */
    setLoopMode(mode) {
        this.loopMode = mode;
    }
    
    /**
     * Set playback direction
     * @param {number} direction - 1 for forward, -1 for backward
     */
    setDirection(direction) {
        this.direction = direction > 0 ? 1 : -1;
    }
    
    // ========================================================================
    // ANIMATION LOOP
    // ========================================================================
    
    /**
     * Start animation frame loop
     * @private
     */
    _startAnimationLoop() {
        if (this.animationFrameId) return;
        this.animationFrameId = requestAnimationFrame(this._animate);
    }
    
    /**
     * Stop animation frame loop
     * @private
     */
    _stopAnimationLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Animation frame callback
     * @private
     */
    _animate(timestamp) {
        if (this.state !== ANIMATION_STATE.PLAYING) return;
        
        const deltaTime = (timestamp - this.lastFrameTime) * this.speed * this.direction;
        this.lastFrameTime = timestamp;
        
        this._updateAnimation(deltaTime);
        
        this.animationFrameId = requestAnimationFrame(this._animate);
    }
    
    /**
     * Update animation state
     * @private
     */
    _updateAnimation(deltaTime) {
        if (this.queue.length === 0 || this.currentIndex >= this.queue.length) {
            this._handleSequenceEnd();
            return;
        }
        
        const item = this.queue[this.currentIndex];
        
        // Handle delay
        if (!item.started) {
            item.delay -= Math.abs(deltaTime);
            if (item.delay <= 0) {
                item.started = true;
                if (item.onStart) item.onStart(item);
                if (this.onItemStart) this.onItemStart(item, this.currentIndex);
            }
            return;
        }
        
        // Update progress
        const progressDelta = Math.abs(deltaTime) / item.duration;
        item.progress += this.direction > 0 ? progressDelta : -progressDelta;
        item.progress = Math.max(0, Math.min(1, item.progress));
        
        // Apply animation
        this._applyAnimationState(item, item.progress);
        
        if (item.onUpdate) item.onUpdate(item, item.progress);
        
        // Update current time
        this.currentTime = this._calculateCurrentTime();
        
        if (this.onProgress) {
            this.onProgress(this.currentTime, this.totalDuration, this.currentIndex);
        }
        
        // Check if complete
        if ((this.direction > 0 && item.progress >= 1) || (this.direction < 0 && item.progress <= 0)) {
            this._completeCurrentAnimation();
            this._moveToNextAnimation();
        }
    }
    
    /**
     * Apply animation state to camera
     * @private
     */
    _applyAnimationState(item, progress) {
        const camera = this.getActiveCamera();
        if (!camera) return;
        
        const easedProgress = this._applyEasing(progress, item.easing);
        
        if (item.type === 'camera') {
            if (this.is3D) {
                // 3D camera animation handled by Camera3D
                // Just trigger the camera's animation system
            } else {
                // 2D camera - interpolate manually if needed
                if (item.target.centerX !== undefined && item.startState) {
                    const t = easedProgress;
                    const startLogZoom = Math.log(item.startState.zoom);
                    const endLogZoom = Math.log(item.target.zoom || item.startState.zoom);
                    
                    camera.centerX = item.startState.centerX + (item.target.centerX - item.startState.centerX) * t;
                    camera.centerY = item.startState.centerY + ((item.target.centerY ?? item.startState.centerY) - item.startState.centerY) * t;
                    camera.zoom = Math.exp(startLogZoom + (endLogZoom - startLogZoom) * t);
                    
                    camera._targetCenterX = camera.centerX;
                    camera._targetCenterY = camera.centerY;
                    camera._targetZoom = camera.zoom;
                }
            }
        }
    }
    
    /**
     * Apply easing function
     * @private
     */
    _applyEasing(t, easing) {
        const easings = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
            easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeInOutExpo: t => {
                if (t === 0 || t === 1) return t;
                if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
                return (2 - Math.pow(2, -20 * t + 10)) / 2;
            }
        };
        
        return (easings[easing] || easings.easeInOutCubic)(t);
    }
    
    /**
     * Calculate current time position
     * @private
     */
    _calculateCurrentTime() {
        let time = 0;
        for (let i = 0; i < this.currentIndex; i++) {
            time += this.queue[i].duration + Math.max(0, this.queue[i].delay);
        }
        
        const current = this.queue[this.currentIndex];
        if (current) {
            time += Math.max(0, current.delay) + current.progress * current.duration;
        }
        
        return time;
    }
    
    /**
     * Complete current animation
     * @private
     */
    _completeCurrentAnimation() {
        const item = this.queue[this.currentIndex];
        if (item && !item.completed) {
            item.completed = true;
            if (item.onComplete) item.onComplete(item);
            if (this.onItemComplete) this.onItemComplete(item, this.currentIndex);
        }
    }
    
    /**
     * Move to next animation
     * @private
     */
    _moveToNextAnimation() {
        if (this.direction > 0) {
            this.currentIndex++;
            if (this.currentIndex >= this.queue.length) {
                this._handleSequenceEnd();
            } else {
                this._startCurrentAnimation();
            }
        } else {
            this.currentIndex--;
            if (this.currentIndex < 0) {
                this._handleSequenceEnd();
            } else {
                this._startCurrentAnimation();
            }
        }
    }
    
    /**
     * Start current animation
     * @private
     */
    _startCurrentAnimation() {
        const item = this.queue[this.currentIndex];
        if (!item) return;
        
        // Store start state for interpolation
        const camera = this.getActiveCamera();
        if (camera && item.type === 'camera') {
            item.startState = this.is3D ? camera.toJSON() : {
                centerX: camera.centerX,
                centerY: camera.centerY,
                zoom: camera.zoom
            };
        }
    }
    
    /**
     * Reset current animation
     * @private
     */
    _resetCurrentAnimation() {
        const item = this.queue[this.currentIndex];
        if (item) {
            item.reset();
        }
    }
    
    /**
     * Reset entire queue
     * @private
     */
    _resetQueue() {
        for (const item of this.queue) {
            item.reset();
        }
    }
    
    /**
     * Handle sequence end
     * @private
     */
    _handleSequenceEnd() {
        switch (this.loopMode) {
            case LOOP_MODE.ALL:
                this.currentIndex = this.direction > 0 ? 0 : this.queue.length - 1;
                this._resetQueue();
                this._startCurrentAnimation();
                break;
                
            case LOOP_MODE.PING_PONG:
                this.direction *= -1;
                this.currentIndex = this.direction > 0 ? 0 : this.queue.length - 1;
                this._resetQueue();
                this._startCurrentAnimation();
                break;
                
            case LOOP_MODE.SINGLE:
                this._resetQueue();
                this.currentIndex = 0;
                this._startCurrentAnimation();
                break;
                
            default:
                this.state = ANIMATION_STATE.STOPPED;
                this._stopAnimationLoop();
                if (this.onSequenceComplete) this.onSequenceComplete();
        }
        
        this._notifyStateChange();
    }
    
    // ========================================================================
    // NOTIFICATIONS
    // ========================================================================
    
    _notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.state, {
                currentIndex: this.currentIndex,
                totalItems: this.queue.length,
                currentTime: this.currentTime,
                totalDuration: this.totalDuration,
                speed: this.speed,
                loopMode: this.loopMode
            });
        }
    }
    
    // ========================================================================
    // QUICK ANIMATIONS
    // ========================================================================
    
    /**
     * Quick animate camera to position (convenience method)
     * @param {Object} target - Target state
     * @param {number} duration - Duration in ms
     * @param {string} easing - Easing function
     * @returns {Promise}
     */
    async animateCameraTo(target, duration = 1000, easing = 'easeInOutCubic') {
        const camera = this.getActiveCamera();
        if (!camera) return;
        
        if (this.is3D) {
            return camera.animateTo(target, duration, easing);
        } else {
            return camera.animateTo(
                target.centerX ?? target.x,
                target.centerY ?? target.y,
                target.zoom,
                duration,
                easing
            );
        }
    }
    
    // ========================================================================
    // STATE
    // ========================================================================
    
    /**
     * Get current state
     * @returns {Object}
     */
    getState() {
        return {
            state: this.state,
            currentIndex: this.currentIndex,
            totalItems: this.queue.length,
            currentTime: this.currentTime,
            totalDuration: this.totalDuration,
            speed: this.speed,
            loopMode: this.loopMode,
            direction: this.direction,
            progress: this.totalDuration > 0 ? this.currentTime / this.totalDuration : 0
        };
    }
    
    /**
     * Check if playing
     * @returns {boolean}
     */
    isPlaying() {
        return this.state === ANIMATION_STATE.PLAYING;
    }
    
    /**
     * Check if paused
     * @returns {boolean}
     */
    isPaused() {
        return this.state === ANIMATION_STATE.PAUSED;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AnimationController;
