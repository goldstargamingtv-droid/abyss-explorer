/**
 * ============================================================================
 * ABYSS EXPLORER - KEYFRAME ANIMATION SYSTEM
 * ============================================================================
 * 
 * Full-featured keyframe system for recording and playing back camera paths.
 * Create epic zoom journeys, save and share paths, with professional-grade
 * interpolation and timing controls.
 * 
 * Features:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  RECORDING                                                             │
 * │  ─────────                                                             │
 * │  ● Manual keyframe insertion                                           │
 * │  ● Auto-record at intervals                                           │
 * │  ● Capture on interaction                                             │
 * │                                                                        │
 * │  KEYFRAME TIMELINE                                                     │
 * │  ──────────────────                                                    │
 * │  t=0      t=2s     t=5s     t=8s     t=10s                            │
 * │  ┌─┐      ┌─┐      ┌─┐      ┌─┐      ┌─┐                              │
 * │  │◆│──────│◆│──────│◆│──────│◆│──────│◆│                              │
 * │  └─┘      └─┘      └─┘      └─┘      └─┘                              │
 * │  Zoom:1   Zoom:10  Zoom:100 Zoom:1k  Zoom:10k                         │
 * │                                                                        │
 * │  INTERPOLATION                                                         │
 * │  ─────────────                                                         │
 * │  • Linear, Cubic, Bezier                                              │
 * │  • Logarithmic zoom (essential for deep zooms!)                       │
 * │  • Quaternion slerp for 3D rotation                                   │
 * │                                                                        │
 * │  PRESETS                                                               │
 * │  ───────                                                               │
 * │  ★ Classic Mandelbrot spiral dive                                     │
 * │  ★ Seahorse valley journey                                            │
 * │  ★ Mini-brot discovery                                                │
 * │  ★ Mandelbulb fly-through                                             │
 * │  ★ Menger sponge exploration                                          │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module camera/keyframe-system
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { AnimationItem, AnimationSequence } from './animation-controller.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Keyframe interpolation modes */
export const INTERPOLATION = {
    LINEAR: 'linear',
    SMOOTH: 'smooth',       // Cubic ease
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    BEZIER: 'bezier',
    STEP: 'step',
    HOLD: 'hold'            // No interpolation
};

/** Recording modes */
export const RECORD_MODE = {
    MANUAL: 'manual',
    AUTO: 'auto',
    INTERACTION: 'interaction'
};

// ============================================================================
// KEYFRAME CLASS
// ============================================================================

/**
 * A single keyframe in an animation path
 */
export class Keyframe {
    /**
     * Create a keyframe
     * @param {Object} options - Keyframe options
     */
    constructor(options = {}) {
        this.id = options.id || `kf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.time = options.time ?? 0; // Time in seconds
        
        // 2D camera state
        this.centerX = options.centerX ?? 0;
        this.centerY = options.centerY ?? 0;
        this.zoom = options.zoom ?? 1;
        
        // 3D camera state
        this.position = options.position || null; // [x, y, z]
        this.target = options.target || null;     // [x, y, z]
        this.quaternion = options.quaternion || null;
        this.fov = options.fov ?? 60;
        
        // Interpolation settings
        this.interpolation = options.interpolation || INTERPOLATION.SMOOTH;
        this.bezierHandles = options.bezierHandles || null; // For bezier curves
        
        // Additional properties that can be animated
        this.paletteOffset = options.paletteOffset ?? null;
        this.iterations = options.iterations ?? null;
        
        // Metadata
        this.label = options.label || '';
        this.thumbnail = options.thumbnail || null;
    }
    
    /**
     * Clone keyframe
     * @returns {Keyframe}
     */
    clone() {
        return new Keyframe({
            time: this.time,
            centerX: this.centerX,
            centerY: this.centerY,
            zoom: this.zoom,
            position: this.position ? [...this.position] : null,
            target: this.target ? [...this.target] : null,
            quaternion: this.quaternion ? { ...this.quaternion } : null,
            fov: this.fov,
            interpolation: this.interpolation,
            bezierHandles: this.bezierHandles ? { ...this.bezierHandles } : null,
            paletteOffset: this.paletteOffset,
            iterations: this.iterations,
            label: this.label
        });
    }
    
    /**
     * Export to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            time: this.time,
            centerX: this.centerX,
            centerY: this.centerY,
            zoom: this.zoom,
            position: this.position,
            target: this.target,
            quaternion: this.quaternion,
            fov: this.fov,
            interpolation: this.interpolation,
            bezierHandles: this.bezierHandles,
            paletteOffset: this.paletteOffset,
            iterations: this.iterations,
            label: this.label
        };
    }
    
    /**
     * Create from JSON
     * @param {Object} json - JSON object
     * @returns {Keyframe}
     */
    static fromJSON(json) {
        return new Keyframe(json);
    }
}

// ============================================================================
// KEYFRAME PATH CLASS
// ============================================================================

/**
 * A path of keyframes representing a camera animation
 */
export class KeyframePath {
    /**
     * Create a keyframe path
     * @param {Object} options - Path options
     */
    constructor(options = {}) {
        this.id = options.id || `path_${Date.now()}`;
        this.name = options.name || 'Unnamed Path';
        this.description = options.description || '';
        this.author = options.author || '';
        this.created = options.created || Date.now();
        this.modified = options.modified || Date.now();
        
        // Is this a 3D path?
        this.is3D = options.is3D ?? false;
        
        // Keyframes sorted by time
        this.keyframes = [];
        
        // Fractal context
        this.fractalType = options.fractalType || 'mandelbrot';
        this.fractalParams = options.fractalParams || {};
        
        // Load initial keyframes
        if (options.keyframes) {
            for (const kf of options.keyframes) {
                this.addKeyframe(kf instanceof Keyframe ? kf : new Keyframe(kf));
            }
        }
    }
    
    /**
     * Add a keyframe
     * @param {Keyframe} keyframe - Keyframe to add
     * @returns {Keyframe} Added keyframe
     */
    addKeyframe(keyframe) {
        if (!(keyframe instanceof Keyframe)) {
            keyframe = new Keyframe(keyframe);
        }
        
        this.keyframes.push(keyframe);
        this._sortKeyframes();
        this.modified = Date.now();
        
        return keyframe;
    }
    
    /**
     * Remove keyframe by ID
     * @param {string} id - Keyframe ID
     */
    removeKeyframe(id) {
        const index = this.keyframes.findIndex(kf => kf.id === id);
        if (index >= 0) {
            this.keyframes.splice(index, 1);
            this.modified = Date.now();
        }
    }
    
    /**
     * Update keyframe
     * @param {string} id - Keyframe ID
     * @param {Object} updates - Updates to apply
     */
    updateKeyframe(id, updates) {
        const keyframe = this.keyframes.find(kf => kf.id === id);
        if (keyframe) {
            Object.assign(keyframe, updates);
            this._sortKeyframes();
            this.modified = Date.now();
        }
    }
    
    /**
     * Get keyframe at index
     * @param {number} index - Index
     * @returns {Keyframe}
     */
    getKeyframeAt(index) {
        return this.keyframes[index];
    }
    
    /**
     * Get keyframe by ID
     * @param {string} id - Keyframe ID
     * @returns {Keyframe}
     */
    getKeyframeById(id) {
        return this.keyframes.find(kf => kf.id === id);
    }
    
    /**
     * Get total duration
     * @returns {number} Duration in seconds
     */
    getDuration() {
        if (this.keyframes.length === 0) return 0;
        return this.keyframes[this.keyframes.length - 1].time;
    }
    
    /**
     * Get keyframe count
     * @returns {number}
     */
    getKeyframeCount() {
        return this.keyframes.length;
    }
    
    /**
     * Sort keyframes by time
     * @private
     */
    _sortKeyframes() {
        this.keyframes.sort((a, b) => a.time - b.time);
    }
    
    /**
     * Interpolate camera state at time
     * @param {number} time - Time in seconds
     * @returns {Object} Interpolated state
     */
    interpolate(time) {
        if (this.keyframes.length === 0) {
            return null;
        }
        
        if (this.keyframes.length === 1) {
            return this._keyframeToState(this.keyframes[0]);
        }
        
        // Clamp time
        time = Math.max(0, Math.min(this.getDuration(), time));
        
        // Find surrounding keyframes
        let prevIndex = 0;
        let nextIndex = this.keyframes.length - 1;
        
        for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (time >= this.keyframes[i].time && time < this.keyframes[i + 1].time) {
                prevIndex = i;
                nextIndex = i + 1;
                break;
            }
        }
        
        const prevKf = this.keyframes[prevIndex];
        const nextKf = this.keyframes[nextIndex];
        
        // Calculate local progress
        const segmentDuration = nextKf.time - prevKf.time;
        const localTime = time - prevKf.time;
        const t = segmentDuration > 0 ? localTime / segmentDuration : 0;
        
        // Apply easing
        const easedT = this._applyInterpolation(t, nextKf.interpolation);
        
        // Interpolate state
        return this._interpolateStates(prevKf, nextKf, easedT);
    }
    
    /**
     * Apply interpolation function
     * @private
     */
    _applyInterpolation(t, interpolation) {
        switch (interpolation) {
            case INTERPOLATION.LINEAR:
                return t;
            case INTERPOLATION.SMOOTH:
            case INTERPOLATION.EASE_IN_OUT:
                return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            case INTERPOLATION.EASE_IN:
                return t * t * t;
            case INTERPOLATION.EASE_OUT:
                return (--t) * t * t + 1;
            case INTERPOLATION.STEP:
            case INTERPOLATION.HOLD:
                return 0;
            default:
                return t;
        }
    }
    
    /**
     * Interpolate between two keyframe states
     * @private
     */
    _interpolateStates(prev, next, t) {
        if (this.is3D) {
            return this._interpolate3DStates(prev, next, t);
        } else {
            return this._interpolate2DStates(prev, next, t);
        }
    }
    
    /**
     * Interpolate 2D camera states
     * @private
     */
    _interpolate2DStates(prev, next, t) {
        // Linear interpolation for position
        const centerX = prev.centerX + (next.centerX - prev.centerX) * t;
        const centerY = prev.centerY + (next.centerY - prev.centerY) * t;
        
        // LOGARITHMIC interpolation for zoom (essential for deep zooms!)
        const logPrevZoom = Math.log(prev.zoom);
        const logNextZoom = Math.log(next.zoom);
        const zoom = Math.exp(logPrevZoom + (logNextZoom - logPrevZoom) * t);
        
        // Linear for other properties
        const paletteOffset = prev.paletteOffset !== null && next.paletteOffset !== null
            ? prev.paletteOffset + (next.paletteOffset - prev.paletteOffset) * t
            : null;
        
        const iterations = prev.iterations !== null && next.iterations !== null
            ? Math.round(prev.iterations + (next.iterations - prev.iterations) * t)
            : null;
        
        return {
            centerX,
            centerY,
            zoom,
            paletteOffset,
            iterations
        };
    }
    
    /**
     * Interpolate 3D camera states
     * @private
     */
    _interpolate3DStates(prev, next, t) {
        // Linear position interpolation
        const position = prev.position && next.position ? [
            prev.position[0] + (next.position[0] - prev.position[0]) * t,
            prev.position[1] + (next.position[1] - prev.position[1]) * t,
            prev.position[2] + (next.position[2] - prev.position[2]) * t
        ] : null;
        
        const target = prev.target && next.target ? [
            prev.target[0] + (next.target[0] - prev.target[0]) * t,
            prev.target[1] + (next.target[1] - prev.target[1]) * t,
            prev.target[2] + (next.target[2] - prev.target[2]) * t
        ] : null;
        
        // Quaternion slerp for rotation
        const quaternion = prev.quaternion && next.quaternion
            ? this._slerpQuaternion(prev.quaternion, next.quaternion, t)
            : null;
        
        // Linear FOV interpolation
        const fov = prev.fov + (next.fov - prev.fov) * t;
        
        return {
            position,
            target,
            quaternion,
            fov
        };
    }
    
    /**
     * Spherical linear interpolation for quaternions
     * @private
     */
    _slerpQuaternion(q1, q2, t) {
        let cosHalfTheta = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
        
        // Ensure shortest path
        const q2Final = { ...q2 };
        if (cosHalfTheta < 0) {
            q2Final.x = -q2.x;
            q2Final.y = -q2.y;
            q2Final.z = -q2.z;
            q2Final.w = -q2.w;
            cosHalfTheta = -cosHalfTheta;
        }
        
        if (cosHalfTheta >= 1.0) {
            return { ...q1 };
        }
        
        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
        
        if (Math.abs(sinHalfTheta) < 0.001) {
            return {
                x: 0.5 * (q1.x + q2Final.x),
                y: 0.5 * (q1.y + q2Final.y),
                z: 0.5 * (q1.z + q2Final.z),
                w: 0.5 * (q1.w + q2Final.w)
            };
        }
        
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
        
        return {
            x: q1.x * ratioA + q2Final.x * ratioB,
            y: q1.y * ratioA + q2Final.y * ratioB,
            z: q1.z * ratioA + q2Final.z * ratioB,
            w: q1.w * ratioA + q2Final.w * ratioB
        };
    }
    
    /**
     * Convert keyframe to state object
     * @private
     */
    _keyframeToState(kf) {
        if (this.is3D) {
            return {
                position: kf.position,
                target: kf.target,
                quaternion: kf.quaternion,
                fov: kf.fov
            };
        } else {
            return {
                centerX: kf.centerX,
                centerY: kf.centerY,
                zoom: kf.zoom,
                paletteOffset: kf.paletteOffset,
                iterations: kf.iterations
            };
        }
    }
    
    /**
     * Convert to AnimationSequence for playback
     * @returns {AnimationSequence}
     */
    toAnimationSequence() {
        const sequence = new AnimationSequence({
            name: this.name,
            description: this.description,
            author: this.author
        });
        
        for (let i = 0; i < this.keyframes.length - 1; i++) {
            const from = this.keyframes[i];
            const to = this.keyframes[i + 1];
            const duration = (to.time - from.time) * 1000; // Convert to ms
            
            sequence.add(new AnimationItem({
                name: from.label || `Keyframe ${i} → ${i + 1}`,
                type: 'camera',
                duration,
                easing: this._interpolationToEasing(to.interpolation),
                target: this.is3D ? {
                    position: to.position,
                    target: to.target,
                    quaternion: to.quaternion,
                    fov: to.fov
                } : {
                    centerX: to.centerX,
                    centerY: to.centerY,
                    zoom: to.zoom
                }
            }));
        }
        
        return sequence;
    }
    
    /**
     * Convert interpolation to easing name
     * @private
     */
    _interpolationToEasing(interpolation) {
        const map = {
            [INTERPOLATION.LINEAR]: 'linear',
            [INTERPOLATION.SMOOTH]: 'easeInOutCubic',
            [INTERPOLATION.EASE_IN]: 'easeInCubic',
            [INTERPOLATION.EASE_OUT]: 'easeOutCubic',
            [INTERPOLATION.EASE_IN_OUT]: 'easeInOutCubic',
            [INTERPOLATION.STEP]: 'linear',
            [INTERPOLATION.HOLD]: 'linear'
        };
        return map[interpolation] || 'easeInOutCubic';
    }
    
    /**
     * Clone path
     * @returns {KeyframePath}
     */
    clone() {
        const cloned = new KeyframePath({
            name: `${this.name} (Copy)`,
            description: this.description,
            is3D: this.is3D,
            fractalType: this.fractalType,
            fractalParams: { ...this.fractalParams }
        });
        
        for (const kf of this.keyframes) {
            cloned.addKeyframe(kf.clone());
        }
        
        return cloned;
    }
    
    /**
     * Export to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            author: this.author,
            created: this.created,
            modified: this.modified,
            is3D: this.is3D,
            fractalType: this.fractalType,
            fractalParams: this.fractalParams,
            keyframes: this.keyframes.map(kf => kf.toJSON())
        };
    }
    
    /**
     * Create from JSON
     * @param {Object} json - JSON object
     * @returns {KeyframePath}
     */
    static fromJSON(json) {
        return new KeyframePath({
            ...json,
            keyframes: json.keyframes.map(kf => Keyframe.fromJSON(kf))
        });
    }
}

// ============================================================================
// KEYFRAME RECORDER CLASS
// ============================================================================

/**
 * Records keyframes from camera movements
 */
export class KeyframeRecorder {
    constructor(options = {}) {
        this.camera2d = options.camera2d || null;
        this.camera3d = options.camera3d || null;
        this.is3D = options.is3D ?? false;
        
        this.isRecording = false;
        this.path = null;
        this.startTime = 0;
        
        // Auto-record settings
        this.mode = options.mode || RECORD_MODE.MANUAL;
        this.autoInterval = options.autoInterval || 1000; // ms
        this.autoIntervalId = null;
        
        // Callbacks
        this.onKeyframeAdded = options.onKeyframeAdded || null;
        this.onRecordingStart = options.onRecordingStart || null;
        this.onRecordingStop = options.onRecordingStop || null;
    }
    
    /**
     * Start recording
     * @param {Object} options - Recording options
     */
    startRecording(options = {}) {
        if (this.isRecording) return;
        
        this.path = new KeyframePath({
            name: options.name || `Recording ${new Date().toLocaleString()}`,
            is3D: this.is3D,
            fractalType: options.fractalType || 'mandelbrot'
        });
        
        this.isRecording = true;
        this.startTime = performance.now();
        
        // Add initial keyframe
        this.addKeyframe('Start');
        
        // Start auto-recording if enabled
        if (this.mode === RECORD_MODE.AUTO) {
            this.autoIntervalId = setInterval(() => {
                if (this.isRecording) {
                    this.addKeyframe();
                }
            }, this.autoInterval);
        }
        
        if (this.onRecordingStart) {
            this.onRecordingStart(this.path);
        }
    }
    
    /**
     * Stop recording
     * @returns {KeyframePath} Recorded path
     */
    stopRecording() {
        if (!this.isRecording) return null;
        
        // Add final keyframe
        this.addKeyframe('End');
        
        this.isRecording = false;
        
        // Stop auto-recording
        if (this.autoIntervalId) {
            clearInterval(this.autoIntervalId);
            this.autoIntervalId = null;
        }
        
        const recordedPath = this.path;
        
        if (this.onRecordingStop) {
            this.onRecordingStop(recordedPath);
        }
        
        return recordedPath;
    }
    
    /**
     * Add keyframe at current camera position
     * @param {string} label - Optional label
     * @returns {Keyframe}
     */
    addKeyframe(label = '') {
        if (!this.isRecording && !this.path) return null;
        
        const time = (performance.now() - this.startTime) / 1000;
        const camera = this.is3D ? this.camera3d : this.camera2d;
        
        if (!camera) return null;
        
        let keyframe;
        
        if (this.is3D) {
            const state = camera.toJSON();
            keyframe = new Keyframe({
                time,
                position: state.position,
                target: state.target,
                quaternion: state.quaternion,
                fov: state.fov || 60,
                label
            });
        } else {
            keyframe = new Keyframe({
                time,
                centerX: camera.centerX,
                centerY: camera.centerY,
                zoom: camera.zoom,
                label
            });
        }
        
        this.path.addKeyframe(keyframe);
        
        if (this.onKeyframeAdded) {
            this.onKeyframeAdded(keyframe, this.path);
        }
        
        return keyframe;
    }
    
    /**
     * Set recording mode
     * @param {string} mode - Recording mode
     */
    setMode(mode) {
        this.mode = mode;
    }
    
    /**
     * Set auto-record interval
     * @param {number} interval - Interval in ms
     */
    setAutoInterval(interval) {
        this.autoInterval = interval;
    }
}

// ============================================================================
// PRESET PATHS
// ============================================================================

/**
 * Collection of preset animation paths
 */
export const PRESET_PATHS = {
    // ========================================================================
    // 2D MANDELBROT PRESETS
    // ========================================================================
    
    'mandelbrot-overview': new KeyframePath({
        name: 'Mandelbrot Overview',
        description: 'A gentle overview of the entire Mandelbrot set',
        is3D: false,
        fractalType: 'mandelbrot',
        keyframes: [
            { time: 0, centerX: -0.5, centerY: 0, zoom: 0.8, label: 'Full view' },
            { time: 3, centerX: -1.25, centerY: 0, zoom: 2, label: 'Main cardioid' },
            { time: 6, centerX: -0.12, centerY: 0.75, zoom: 3, label: 'Top antenna' },
            { time: 9, centerX: 0.3, centerY: 0, zoom: 2, label: 'East side' },
            { time: 12, centerX: -0.5, centerY: 0, zoom: 0.8, label: 'Return' }
        ]
    }),
    
    'seahorse-valley': new KeyframePath({
        name: 'Seahorse Valley Deep Dive',
        description: 'Journey into the famous Seahorse Valley',
        is3D: false,
        fractalType: 'mandelbrot',
        keyframes: [
            { time: 0, centerX: -0.5, centerY: 0, zoom: 1, label: 'Start' },
            { time: 2, centerX: -0.75, centerY: 0.1, zoom: 5, label: 'Approach valley' },
            { time: 5, centerX: -0.745, centerY: 0.113, zoom: 50, label: 'Enter seahorse' },
            { time: 8, centerX: -0.7453, centerY: 0.1127, zoom: 500, label: 'Deeper' },
            { time: 12, centerX: -0.74529, centerY: 0.11308, zoom: 5000, label: 'Spiral detail' },
            { time: 16, centerX: -0.745282, centerY: 0.113073, zoom: 50000, label: 'Deep spiral' },
            { time: 20, centerX: -0.7452785, centerY: 0.1130725, zoom: 500000, label: 'Mini-brot' }
        ]
    }),
    
    'elephant-valley': new KeyframePath({
        name: 'Elephant Valley Journey',
        description: 'Explore the Elephant Valley region',
        is3D: false,
        fractalType: 'mandelbrot',
        keyframes: [
            { time: 0, centerX: -0.5, centerY: 0, zoom: 1 },
            { time: 3, centerX: 0.28, centerY: 0.008, zoom: 10 },
            { time: 6, centerX: 0.275, centerY: 0.006, zoom: 100 },
            { time: 10, centerX: 0.2758, centerY: 0.0066, zoom: 1000 },
            { time: 14, centerX: 0.27578, centerY: 0.00657, zoom: 10000 },
            { time: 18, centerX: 0.275781, centerY: 0.006567, zoom: 100000 }
        ]
    }),
    
    'spiral-deep-dive': new KeyframePath({
        name: 'Spiral Deep Dive',
        description: 'Descend into an infinite spiral',
        is3D: false,
        fractalType: 'mandelbrot',
        keyframes: [
            { time: 0, centerX: -0.5, centerY: 0, zoom: 1 },
            { time: 4, centerX: -0.761574, centerY: -0.0847596, zoom: 100 },
            { time: 8, centerX: -0.7615743, centerY: -0.0847598, zoom: 10000 },
            { time: 12, centerX: -0.76157436, centerY: -0.08475978, zoom: 1000000 },
            { time: 16, centerX: -0.761574364, centerY: -0.084759776, zoom: 100000000 },
            { time: 20, centerX: -0.7615743636, centerY: -0.0847597769, zoom: 10000000000 }
        ]
    }),
    
    'mini-mandelbrot-hunt': new KeyframePath({
        name: 'Mini-Mandelbrot Discovery',
        description: 'Find a mini-Mandelbrot set hidden in the boundary',
        is3D: false,
        fractalType: 'mandelbrot',
        keyframes: [
            { time: 0, centerX: -0.5, centerY: 0, zoom: 1 },
            { time: 3, centerX: -1.768, centerY: 0, zoom: 10 },
            { time: 6, centerX: -1.7688, centerY: 0.0015, zoom: 100 },
            { time: 10, centerX: -1.76877, centerY: 0.00153, zoom: 1000 },
            { time: 14, centerX: -1.768778, centerY: 0.001538, zoom: 10000 },
            { time: 18, centerX: -1.7687783, centerY: 0.0015385, zoom: 100000 }
        ]
    }),
    
    // ========================================================================
    // 2D JULIA SET PRESETS
    // ========================================================================
    
    'julia-tour': new KeyframePath({
        name: 'Julia Set Tour',
        description: 'Tour different Julia set parameters',
        is3D: false,
        fractalType: 'julia',
        fractalParams: { cr: -0.7, ci: 0.27015 },
        keyframes: [
            { time: 0, centerX: 0, centerY: 0, zoom: 1 },
            { time: 4, centerX: 0.5, centerY: 0.5, zoom: 3 },
            { time: 8, centerX: -0.5, centerY: 0.5, zoom: 5 },
            { time: 12, centerX: 0, centerY: -0.5, zoom: 3 },
            { time: 16, centerX: 0, centerY: 0, zoom: 1 }
        ]
    }),
    
    // ========================================================================
    // 2D BURNING SHIP PRESET
    // ========================================================================
    
    'burning-ship-voyage': new KeyframePath({
        name: 'Burning Ship Voyage',
        description: 'Explore the Burning Ship fractal',
        is3D: false,
        fractalType: 'burning-ship',
        keyframes: [
            { time: 0, centerX: -0.5, centerY: -0.5, zoom: 1 },
            { time: 4, centerX: -1.755, centerY: -0.035, zoom: 20 },
            { time: 8, centerX: -1.758, centerY: -0.028, zoom: 200 },
            { time: 12, centerX: -1.7577, centerY: -0.0285, zoom: 2000 }
        ]
    }),
    
    // ========================================================================
    // 3D MANDELBULB PRESETS
    // ========================================================================
    
    'mandelbulb-orbit': new KeyframePath({
        name: 'Mandelbulb Orbit',
        description: 'Orbit around a Mandelbulb',
        is3D: true,
        fractalType: 'mandelbulb',
        keyframes: [
            { time: 0, position: [0, 0, 3], target: [0, 0, 0], fov: 60 },
            { time: 4, position: [2.12, 0, 2.12], target: [0, 0, 0], fov: 60 },
            { time: 8, position: [3, 0, 0], target: [0, 0, 0], fov: 60 },
            { time: 12, position: [2.12, 0, -2.12], target: [0, 0, 0], fov: 60 },
            { time: 16, position: [0, 0, -3], target: [0, 0, 0], fov: 60 },
            { time: 20, position: [-2.12, 0, -2.12], target: [0, 0, 0], fov: 60 },
            { time: 24, position: [-3, 0, 0], target: [0, 0, 0], fov: 60 },
            { time: 28, position: [-2.12, 0, 2.12], target: [0, 0, 0], fov: 60 },
            { time: 32, position: [0, 0, 3], target: [0, 0, 0], fov: 60 }
        ]
    }),
    
    'mandelbulb-dive': new KeyframePath({
        name: 'Mandelbulb Deep Dive',
        description: 'Fly into the Mandelbulb surface',
        is3D: true,
        fractalType: 'mandelbulb',
        keyframes: [
            { time: 0, position: [0, 0, 3], target: [0, 0, 0], fov: 60 },
            { time: 4, position: [0.5, 0.5, 2], target: [0.5, 0.5, 0], fov: 50 },
            { time: 8, position: [0.6, 0.6, 1], target: [0.6, 0.6, 0], fov: 40 },
            { time: 12, position: [0.65, 0.65, 0.5], target: [0.65, 0.65, 0], fov: 30 },
            { time: 16, position: [0.67, 0.67, 0.2], target: [0.67, 0.67, 0], fov: 25 }
        ]
    }),
    
    // ========================================================================
    // 3D MENGER SPONGE PRESET
    // ========================================================================
    
    'menger-exploration': new KeyframePath({
        name: 'Menger Sponge Exploration',
        description: 'Fly through a Menger Sponge',
        is3D: true,
        fractalType: 'menger',
        keyframes: [
            { time: 0, position: [3, 1, 3], target: [0, 0, 0], fov: 60 },
            { time: 5, position: [1, 0.5, 1], target: [0, 0, 0], fov: 50 },
            { time: 10, position: [0.2, 0.1, 0.2], target: [0, 0, 0], fov: 60 },
            { time: 15, position: [0.1, 0, 0], target: [0, 0, 0], fov: 80 },
            { time: 20, position: [-0.5, 0, 0], target: [0, 0, 0], fov: 60 }
        ]
    })
};

/**
 * Get preset path by name
 * @param {string} name - Preset name
 * @returns {KeyframePath}
 */
export function getPresetPath(name) {
    return PRESET_PATHS[name]?.clone();
}

/**
 * Get all preset names
 * @returns {string[]}
 */
export function getPresetNames() {
    return Object.keys(PRESET_PATHS);
}

/**
 * Get presets by fractal type
 * @param {string} fractalType - Fractal type
 * @returns {Object}
 */
export function getPresetsByFractalType(fractalType) {
    const result = {};
    for (const [name, path] of Object.entries(PRESET_PATHS)) {
        if (path.fractalType === fractalType) {
            result[name] = path;
        }
    }
    return result;
}

// ============================================================================
// KEYFRAME SYSTEM CLASS
// ============================================================================

/**
 * Main keyframe system manager
 */
export class KeyframeSystem {
    constructor(options = {}) {
        this.camera2d = options.camera2d || null;
        this.camera3d = options.camera3d || null;
        this.is3D = options.is3D ?? false;
        
        // Recorder
        this.recorder = new KeyframeRecorder({
            camera2d: this.camera2d,
            camera3d: this.camera3d,
            is3D: this.is3D
        });
        
        // Current path
        this.currentPath = null;
        
        // Playback state
        this.isPlaying = false;
        this.currentTime = 0;
        this.playbackSpeed = 1;
        this.loop = false;
        
        // Animation frame
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        
        // Callbacks
        this.onPlaybackUpdate = options.onPlaybackUpdate || null;
        this.onPlaybackComplete = options.onPlaybackComplete || null;
        
        // Bind
        this._playbackLoop = this._playbackLoop.bind(this);
    }
    
    // Camera setters
    setCamera2D(camera) {
        this.camera2d = camera;
        this.recorder.camera2d = camera;
    }
    
    setCamera3D(camera) {
        this.camera3d = camera;
        this.recorder.camera3d = camera;
    }
    
    set3DMode(is3D) {
        this.is3D = is3D;
        this.recorder.is3D = is3D;
    }
    
    // Path management
    loadPath(path) {
        if (typeof path === 'string') {
            path = getPresetPath(path);
        }
        this.currentPath = path;
        this.currentTime = 0;
    }
    
    createNewPath(name = 'New Path') {
        this.currentPath = new KeyframePath({
            name,
            is3D: this.is3D
        });
        return this.currentPath;
    }
    
    // Recording
    startRecording(options) {
        this.recorder.startRecording(options);
    }
    
    stopRecording() {
        this.currentPath = this.recorder.stopRecording();
        return this.currentPath;
    }
    
    addKeyframe(label) {
        return this.recorder.addKeyframe(label);
    }
    
    // Playback
    play() {
        if (!this.currentPath || this.currentPath.getKeyframeCount() < 2) return;
        
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this._startPlaybackLoop();
    }
    
    pause() {
        this.isPlaying = false;
        this._stopPlaybackLoop();
    }
    
    stop() {
        this.isPlaying = false;
        this.currentTime = 0;
        this._stopPlaybackLoop();
        this._applyCameraState();
    }
    
    seek(time) {
        this.currentTime = Math.max(0, Math.min(time, this.currentPath?.getDuration() || 0));
        this._applyCameraState();
    }
    
    seekPercent(percent) {
        if (this.currentPath) {
            this.seek(percent * this.currentPath.getDuration());
        }
    }
    
    setSpeed(speed) {
        this.playbackSpeed = Math.max(0.1, Math.min(10, speed));
    }
    
    setLoop(loop) {
        this.loop = loop;
    }
    
    // Playback loop
    _startPlaybackLoop() {
        if (this.animationFrameId) return;
        this.animationFrameId = requestAnimationFrame(this._playbackLoop);
    }
    
    _stopPlaybackLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    _playbackLoop(timestamp) {
        if (!this.isPlaying) return;
        
        const deltaTime = (timestamp - this.lastFrameTime) / 1000 * this.playbackSpeed;
        this.lastFrameTime = timestamp;
        
        this.currentTime += deltaTime;
        
        const duration = this.currentPath.getDuration();
        
        if (this.currentTime >= duration) {
            if (this.loop) {
                this.currentTime = this.currentTime % duration;
            } else {
                this.currentTime = duration;
                this.isPlaying = false;
                if (this.onPlaybackComplete) this.onPlaybackComplete();
            }
        }
        
        this._applyCameraState();
        
        if (this.onPlaybackUpdate) {
            this.onPlaybackUpdate(this.currentTime, duration, this.currentTime / duration);
        }
        
        if (this.isPlaying) {
            this.animationFrameId = requestAnimationFrame(this._playbackLoop);
        }
    }
    
    _applyCameraState() {
        if (!this.currentPath) return;
        
        const state = this.currentPath.interpolate(this.currentTime);
        if (!state) return;
        
        const camera = this.is3D ? this.camera3d : this.camera2d;
        if (!camera) return;
        
        if (this.is3D) {
            // Apply 3D state
            if (state.position) {
                camera.position.set(state.position[0], state.position[1], state.position[2]);
                camera._targetPosition.copy(camera.position);
            }
            if (state.target) {
                camera.target.set(state.target[0], state.target[1], state.target[2]);
            }
        } else {
            // Apply 2D state
            camera.centerX = state.centerX;
            camera.centerY = state.centerY;
            camera.zoom = state.zoom;
            camera._targetCenterX = state.centerX;
            camera._targetCenterY = state.centerY;
            camera._targetZoom = state.zoom;
        }
    }
    
    // Export/Import
    exportPath() {
        return this.currentPath ? JSON.stringify(this.currentPath.toJSON(), null, 2) : null;
    }
    
    importPath(json) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;
            this.currentPath = KeyframePath.fromJSON(data);
            return true;
        } catch (e) {
            console.error('[KeyframeSystem] Import failed:', e);
            return false;
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    KeyframeSystem,
    KeyframePath,
    Keyframe,
    KeyframeRecorder,
    PRESET_PATHS,
    getPresetPath,
    getPresetNames,
    getPresetsByFractalType,
    INTERPOLATION,
    RECORD_MODE
};
