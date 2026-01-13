/**
 * ============================================================================
 * ABYSS EXPLORER - 3D CAMERA SYSTEM
 * ============================================================================
 * 
 * High-performance 3D camera for fractal exploration with orbit controls,
 * fly-through mode, and smooth cinematic animations. Compatible with
 * Three.js-style rendering pipelines.
 * 
 * Camera Modes:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  ORBIT MODE (Default)                                                  │
 * │  ────────────────────                                                  │
 * │        Y                                                               │
 * │        ↑     Camera orbits around target                              │
 * │        │  ╭──────╮                                                     │
 * │        │ ╱        ╲                                                    │
 * │    ────┼──[Target]──→ X                                               │
 * │       ╱│╲        ╱                                                    │
 * │      ╱ │ ╰──────╯                                                     │
 * │     Z  │   Camera position on sphere                                  │
 * │                                                                        │
 * │  FLY MODE                                                              │
 * │  ────────                                                              │
 * │    ┌────────┐                                                          │
 * │    │   ↑    │  Free-flying first-person camera                        │
 * │    │ ← ● → │  WASD/Arrow keys for movement                           │
 * │    │   ↓    │  Mouse for looking around                               │
 * │    └────────┘                                                          │
 * │                                                                        │
 * │  CONTROLS                                                              │
 * │  ────────                                                              │
 * │  Left drag   : Orbit/Look around                                      │
 * │  Right drag  : Pan                                                    │
 * │  Scroll      : Dolly (zoom in/out)                                    │
 * │  Middle drag : Dolly                                                  │
 * │  Shift+drag  : Roll (in fly mode)                                     │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module camera/camera3d
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/** Camera modes */
export const CAMERA_MODE = {
    ORBIT: 'orbit',
    FLY: 'fly',
    FIRST_PERSON: 'first-person'
};

/** Default settings */
const DEFAULTS = {
    distance: 5,
    minDistance: 0.1,
    maxDistance: 1000,
    rotateSpeed: 0.005,
    panSpeed: 0.01,
    dollySpeed: 0.1,
    flySpeed: 0.1,
    damping: 0.1,
    autoRotateSpeed: 0.5,  // degrees per second
    verticalAngleMin: -Math.PI / 2 + 0.01,
    verticalAngleMax: Math.PI / 2 - 0.01
};

// ============================================================================
// VECTOR3 HELPER
// ============================================================================

/**
 * Simple 3D vector class (to avoid Three.js dependency for core logic)
 */
class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    
    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    
    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }
    
    clone() {
        return new Vec3(this.x, this.y, this.z);
    }
    
    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    
    multiplyScalar(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    
    normalize() {
        const len = this.length();
        if (len > 0) {
            this.multiplyScalar(1 / len);
        }
        return this;
    }
    
    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }
    
    cross(v) {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
    
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        const dz = this.z - v.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        this.z += (v.z - this.z) * t;
        return this;
    }
    
    applyQuaternion(q) {
        const x = this.x, y = this.y, z = this.z;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
        
        // Calculate quat * vector
        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = -qx * x - qy * y - qz * z;
        
        // Calculate result * inverse quat
        this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        
        return this;
    }
    
    toArray() {
        return [this.x, this.y, this.z];
    }
    
    fromArray(arr) {
        this.x = arr[0];
        this.y = arr[1];
        this.z = arr[2];
        return this;
    }
}

// ============================================================================
// QUATERNION HELPER
// ============================================================================

class Quat {
    constructor(x = 0, y = 0, z = 0, w = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }
    
    copy(q) {
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        this.w = q.w;
        return this;
    }
    
    clone() {
        return new Quat(this.x, this.y, this.z, this.w);
    }
    
    setFromEuler(x, y, z, order = 'YXZ') {
        const c1 = Math.cos(x / 2);
        const c2 = Math.cos(y / 2);
        const c3 = Math.cos(z / 2);
        const s1 = Math.sin(x / 2);
        const s2 = Math.sin(y / 2);
        const s3 = Math.sin(z / 2);
        
        if (order === 'YXZ') {
            this.x = s1 * c2 * c3 + c1 * s2 * s3;
            this.y = c1 * s2 * c3 - s1 * c2 * s3;
            this.z = c1 * c2 * s3 - s1 * s2 * c3;
            this.w = c1 * c2 * c3 + s1 * s2 * s3;
        }
        
        return this;
    }
    
    setFromAxisAngle(axis, angle) {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        
        this.x = axis.x * s;
        this.y = axis.y * s;
        this.z = axis.z * s;
        this.w = Math.cos(halfAngle);
        
        return this;
    }
    
    multiply(q) {
        return this.multiplyQuaternions(this, q);
    }
    
    multiplyQuaternions(a, b) {
        const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
        const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;
        
        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
        
        return this;
    }
    
    normalize() {
        let l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
        if (l === 0) {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
        } else {
            l = 1 / l;
            this.x *= l;
            this.y *= l;
            this.z *= l;
            this.w *= l;
        }
        return this;
    }
    
    slerp(q, t) {
        if (t === 0) return this;
        if (t === 1) return this.copy(q);
        
        let cosHalfTheta = this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z;
        
        if (cosHalfTheta < 0) {
            this.w = -q.w;
            this.x = -q.x;
            this.y = -q.y;
            this.z = -q.z;
            cosHalfTheta = -cosHalfTheta;
        } else {
            this.copy(q);
        }
        
        if (cosHalfTheta >= 1.0) {
            return this;
        }
        
        const halfTheta = Math.acos(cosHalfTheta);
        const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);
        
        if (Math.abs(sinHalfTheta) < 0.001) {
            this.w = 0.5 * (this.w + q.w);
            this.x = 0.5 * (this.x + q.x);
            this.y = 0.5 * (this.y + q.y);
            this.z = 0.5 * (this.z + q.z);
            return this;
        }
        
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
        const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
        
        this.w = (this.w * ratioA + q.w * ratioB);
        this.x = (this.x * ratioA + q.x * ratioB);
        this.y = (this.y * ratioA + q.y * ratioB);
        this.z = (this.z * ratioA + q.z * ratioB);
        
        return this;
    }
}

// ============================================================================
// CAMERA 3D CLASS
// ============================================================================

export class Camera3D {
    /**
     * Create a 3D camera
     * @param {Object} options - Camera options
     */
    constructor(options = {}) {
        // Camera mode
        this.mode = options.mode || CAMERA_MODE.ORBIT;
        
        // Camera position and orientation
        this.position = new Vec3(
            options.positionX ?? 0,
            options.positionY ?? 0,
            options.positionZ ?? DEFAULTS.distance
        );
        
        // Target for orbit mode
        this.target = new Vec3(
            options.targetX ?? 0,
            options.targetY ?? 0,
            options.targetZ ?? 0
        );
        
        // Orientation quaternion (for fly mode)
        this.quaternion = new Quat();
        
        // Spherical coordinates for orbit mode
        this.spherical = {
            radius: options.distance ?? DEFAULTS.distance,
            theta: options.theta ?? 0,      // Horizontal angle
            phi: options.phi ?? HALF_PI     // Vertical angle (0 = top, PI = bottom)
        };
        
        // Update position from spherical if in orbit mode
        if (this.mode === CAMERA_MODE.ORBIT) {
            this._updatePositionFromSpherical();
        }
        
        // Target values for smooth interpolation
        this._targetPosition = this.position.clone();
        this._targetQuaternion = this.quaternion.clone();
        this._targetSpherical = { ...this.spherical };
        
        // Distance limits
        this.minDistance = options.minDistance ?? DEFAULTS.minDistance;
        this.maxDistance = options.maxDistance ?? DEFAULTS.maxDistance;
        
        // Angle limits
        this.minPhi = options.minPhi ?? DEFAULTS.verticalAngleMin + HALF_PI;
        this.maxPhi = options.maxPhi ?? DEFAULTS.verticalAngleMax + HALF_PI;
        
        // Speed settings
        this.rotateSpeed = options.rotateSpeed ?? DEFAULTS.rotateSpeed;
        this.panSpeed = options.panSpeed ?? DEFAULTS.panSpeed;
        this.dollySpeed = options.dollySpeed ?? DEFAULTS.dollySpeed;
        this.flySpeed = options.flySpeed ?? DEFAULTS.flySpeed;
        
        // Damping
        this.damping = options.damping ?? DEFAULTS.damping;
        this.enableDamping = options.enableDamping ?? true;
        
        // Auto-rotation
        this.autoRotate = options.autoRotate ?? false;
        this.autoRotateSpeed = options.autoRotateSpeed ?? DEFAULTS.autoRotateSpeed;
        
        // Velocity for fly mode
        this.velocity = new Vec3();
        
        // Interaction state
        this.isDragging = false;
        this.isRightDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Keyboard state
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            sprint: false
        };
        
        // Animation state
        this.isAnimating = false;
        this.animation = null;
        
        // Field of view
        this.fov = options.fov ?? 60;
        this.near = options.near ?? 0.01;
        this.far = options.far ?? 10000;
        
        // Viewport
        this.width = options.width || 800;
        this.height = options.height || 600;
        this.aspect = this.width / this.height;
        
        // Callbacks
        this.onChange = options.onChange || null;
        this.onAnimationComplete = options.onAnimationComplete || null;
        
        // DOM element
        this.element = options.element || null;
        
        // Bind methods
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);
        
        if (this.element) {
            this.attachEvents(this.element);
        }
    }
    
    // ========================================================================
    // ORBIT MODE
    // ========================================================================
    
    /**
     * Update position from spherical coordinates
     * @private
     */
    _updatePositionFromSpherical() {
        const sinPhi = Math.sin(this.spherical.phi);
        const cosPhi = Math.cos(this.spherical.phi);
        const sinTheta = Math.sin(this.spherical.theta);
        const cosTheta = Math.cos(this.spherical.theta);
        
        this.position.x = this.target.x + this.spherical.radius * sinPhi * sinTheta;
        this.position.y = this.target.y + this.spherical.radius * cosPhi;
        this.position.z = this.target.z + this.spherical.radius * sinPhi * cosTheta;
    }
    
    /**
     * Orbit around target
     * @param {number} deltaTheta - Horizontal rotation
     * @param {number} deltaPhi - Vertical rotation
     */
    orbit(deltaTheta, deltaPhi) {
        this._targetSpherical.theta += deltaTheta;
        this._targetSpherical.phi += deltaPhi;
        
        // Clamp phi
        this._targetSpherical.phi = Math.max(
            this.minPhi,
            Math.min(this.maxPhi, this._targetSpherical.phi)
        );
        
        this._notifyChange();
    }
    
    /**
     * Pan camera
     * @param {number} deltaX - Horizontal pan
     * @param {number} deltaY - Vertical pan
     */
    pan(deltaX, deltaY) {
        // Calculate pan vectors
        const offset = this.position.clone().sub(this.target);
        
        // Get camera right vector
        const right = new Vec3();
        right.x = Math.cos(this.spherical.theta);
        right.z = -Math.sin(this.spherical.theta);
        
        // Get camera up vector (world up for simplicity)
        const up = new Vec3(0, 1, 0);
        
        // Apply pan
        const panOffset = right.multiplyScalar(deltaX * this.panSpeed * this.spherical.radius);
        panOffset.add(up.multiplyScalar(deltaY * this.panSpeed * this.spherical.radius));
        
        this.target.add(panOffset);
        this._targetPosition.add(panOffset);
        
        this._notifyChange();
    }
    
    /**
     * Dolly (zoom) in/out
     * @param {number} delta - Dolly amount (positive = closer)
     */
    dolly(delta) {
        const factor = Math.pow(0.95, delta * this.dollySpeed);
        this._targetSpherical.radius = Math.max(
            this.minDistance,
            Math.min(this.maxDistance, this._targetSpherical.radius * factor)
        );
        
        this._notifyChange();
    }
    
    /**
     * Set distance from target
     * @param {number} distance - Distance
     * @param {boolean} immediate - Skip smoothing
     */
    setDistance(distance, immediate = false) {
        distance = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
        
        if (immediate) {
            this.spherical.radius = distance;
            this._targetSpherical.radius = distance;
            this._updatePositionFromSpherical();
        } else {
            this._targetSpherical.radius = distance;
        }
        
        this._notifyChange();
    }
    
    // ========================================================================
    // FLY MODE
    // ========================================================================
    
    /**
     * Set camera mode
     * @param {string} mode - Camera mode
     */
    setMode(mode) {
        this.mode = mode;
        
        if (mode === CAMERA_MODE.ORBIT) {
            // Calculate spherical from current position
            const offset = this.position.clone().sub(this.target);
            this.spherical.radius = offset.length();
            this.spherical.theta = Math.atan2(offset.x, offset.z);
            this.spherical.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / this.spherical.radius)));
            
            this._targetSpherical = { ...this.spherical };
        }
        
        this._notifyChange();
    }
    
    /**
     * Move camera in fly mode
     * @param {number} forward - Forward/backward amount
     * @param {number} right - Left/right amount
     * @param {number} up - Up/down amount
     */
    move(forward, right, up) {
        // Get direction vectors from quaternion
        const fwd = new Vec3(0, 0, -1).applyQuaternion(this.quaternion);
        const rgt = new Vec3(1, 0, 0).applyQuaternion(this.quaternion);
        const upv = new Vec3(0, 1, 0);
        
        const movement = fwd.multiplyScalar(forward * this.flySpeed);
        movement.add(rgt.multiplyScalar(right * this.flySpeed));
        movement.add(upv.multiplyScalar(up * this.flySpeed));
        
        this._targetPosition.add(movement);
        
        this._notifyChange();
    }
    
    /**
     * Rotate camera in fly mode
     * @param {number} yaw - Yaw rotation
     * @param {number} pitch - Pitch rotation
     * @param {number} roll - Roll rotation
     */
    rotate(yaw, pitch, roll = 0) {
        // Create rotation quaternions
        const yawQuat = new Quat().setFromAxisAngle(new Vec3(0, 1, 0), -yaw);
        const pitchQuat = new Quat().setFromAxisAngle(new Vec3(1, 0, 0), -pitch);
        
        // Apply rotations
        this._targetQuaternion.multiply(yawQuat).multiply(pitchQuat).normalize();
        
        this._notifyChange();
    }
    
    /**
     * Look at a point
     * @param {Vec3|Object} point - Target point
     */
    lookAt(point) {
        if (!(point instanceof Vec3)) {
            point = new Vec3(point.x, point.y, point.z);
        }
        
        const direction = point.clone().sub(this.position).normalize();
        
        // Calculate look-at quaternion
        const forward = new Vec3(0, 0, -1);
        const dot = forward.dot(direction);
        
        if (Math.abs(dot + 1) < 0.001) {
            // Opposite direction
            this._targetQuaternion.set(0, 1, 0, 0);
        } else if (Math.abs(dot - 1) < 0.001) {
            // Same direction
            this._targetQuaternion.set(0, 0, 0, 1);
        } else {
            const axis = forward.cross(direction).normalize();
            const angle = Math.acos(dot);
            this._targetQuaternion.setFromAxisAngle(axis, angle);
        }
        
        this._notifyChange();
    }
    
    // ========================================================================
    // ANIMATION
    // ========================================================================
    
    /**
     * Animate camera to target
     * @param {Object} target - Target state { position?, target?, distance?, theta?, phi?, quaternion? }
     * @param {number} duration - Animation duration in ms
     * @param {string} easing - Easing function name
     * @returns {Promise}
     */
    animateTo(target, duration = 1000, easing = 'easeInOutCubic') {
        return new Promise((resolve) => {
            if (this.animation) {
                this.animation.cancelled = true;
            }
            
            const easingFunctions = {
                linear: t => t,
                easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
                easeOutCubic: t => (--t) * t * t + 1,
                easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
                easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
            };
            
            this.animation = {
                startTime: performance.now(),
                duration,
                easingFn: easingFunctions[easing] || easingFunctions.easeInOutCubic,
                cancelled: false,
                resolve,
                
                // Start values
                startPosition: this.position.clone(),
                startTarget: this.target.clone(),
                startSpherical: { ...this.spherical },
                startQuaternion: this.quaternion.clone(),
                
                // End values
                endPosition: target.position ? new Vec3().fromArray(
                    Array.isArray(target.position) ? target.position : [target.position.x, target.position.y, target.position.z]
                ) : null,
                endTarget: target.target ? new Vec3().fromArray(
                    Array.isArray(target.target) ? target.target : [target.target.x, target.target.y, target.target.z]
                ) : null,
                endSpherical: {
                    radius: target.distance ?? target.radius ?? this.spherical.radius,
                    theta: target.theta ?? this.spherical.theta,
                    phi: target.phi ?? this.spherical.phi
                },
                endQuaternion: target.quaternion ? new Quat(
                    target.quaternion.x, target.quaternion.y, target.quaternion.z, target.quaternion.w
                ) : null
            };
            
            this.isAnimating = true;
        });
    }
    
    /**
     * Fly to a point over time
     * @param {Object} point - Target point { x, y, z }
     * @param {number} duration - Duration in ms
     * @returns {Promise}
     */
    flyTo(point, duration = 2000) {
        const distance = this.position.distanceTo(new Vec3(point.x, point.y, point.z));
        const adjustedDuration = Math.max(500, Math.min(5000, duration * (distance / 10)));
        
        return this.animateTo({
            position: point,
            target: { x: point.x, y: point.y, z: point.z - 2 }
        }, adjustedDuration, 'easeInOutCubic');
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
    
    // ========================================================================
    // UPDATE LOOP
    // ========================================================================
    
    /**
     * Update camera (call every frame)
     * @param {number} deltaTime - Time since last update in ms
     */
    update(deltaTime = 16.67) {
        let changed = false;
        const dt = deltaTime / 1000;
        
        // Handle animation
        if (this.animation && !this.animation.cancelled) {
            const elapsed = performance.now() - this.animation.startTime;
            const progress = Math.min(1, elapsed / this.animation.duration);
            const t = this.animation.easingFn(progress);
            
            if (this.mode === CAMERA_MODE.ORBIT) {
                // Interpolate spherical coordinates (with log interpolation for radius)
                const startLogR = Math.log(this.animation.startSpherical.radius);
                const endLogR = Math.log(this.animation.endSpherical.radius);
                
                this.spherical.radius = Math.exp(startLogR + (endLogR - startLogR) * t);
                this.spherical.theta = this.animation.startSpherical.theta + 
                    (this.animation.endSpherical.theta - this.animation.startSpherical.theta) * t;
                this.spherical.phi = this.animation.startSpherical.phi + 
                    (this.animation.endSpherical.phi - this.animation.startSpherical.phi) * t;
                
                // Interpolate target
                if (this.animation.endTarget) {
                    this.target.copy(this.animation.startTarget).lerp(this.animation.endTarget, t);
                }
                
                this._targetSpherical = { ...this.spherical };
                this._updatePositionFromSpherical();
            } else {
                // Fly mode - interpolate position and quaternion
                if (this.animation.endPosition) {
                    this.position.copy(this.animation.startPosition).lerp(this.animation.endPosition, t);
                    this._targetPosition.copy(this.position);
                }
                
                if (this.animation.endQuaternion) {
                    this.quaternion.copy(this.animation.startQuaternion).slerp(this.animation.endQuaternion, t);
                    this._targetQuaternion.copy(this.quaternion);
                }
                
                if (this.animation.endTarget) {
                    this.target.copy(this.animation.startTarget).lerp(this.animation.endTarget, t);
                    this.lookAt(this.target);
                }
            }
            
            changed = true;
            
            if (progress >= 1) {
                this.isAnimating = false;
                const resolve = this.animation.resolve;
                this.animation = null;
                
                if (resolve) resolve();
                if (this.onAnimationComplete) this.onAnimationComplete();
            }
        } else {
            // Auto-rotation
            if (this.autoRotate && this.mode === CAMERA_MODE.ORBIT && !this.isDragging) {
                this._targetSpherical.theta += (this.autoRotateSpeed * Math.PI / 180) * dt;
            }
            
            // Handle keyboard input in fly mode
            if (this.mode === CAMERA_MODE.FLY || this.mode === CAMERA_MODE.FIRST_PERSON) {
                const speed = this.keys.sprint ? this.flySpeed * 3 : this.flySpeed;
                
                if (this.keys.forward) this.move(speed, 0, 0);
                if (this.keys.backward) this.move(-speed, 0, 0);
                if (this.keys.left) this.move(0, -speed, 0);
                if (this.keys.right) this.move(0, speed, 0);
                if (this.keys.up) this.move(0, 0, speed);
                if (this.keys.down) this.move(0, 0, -speed);
            }
            
            // Apply damping
            if (this.enableDamping) {
                if (this.mode === CAMERA_MODE.ORBIT) {
                    const dTheta = this._targetSpherical.theta - this.spherical.theta;
                    const dPhi = this._targetSpherical.phi - this.spherical.phi;
                    const dRadius = this._targetSpherical.radius - this.spherical.radius;
                    
                    if (Math.abs(dTheta) > 0.0001 || Math.abs(dPhi) > 0.0001 || Math.abs(dRadius) > 0.0001) {
                        this.spherical.theta += dTheta * this.damping;
                        this.spherical.phi += dPhi * this.damping;
                        this.spherical.radius += dRadius * this.damping;
                        
                        this._updatePositionFromSpherical();
                        changed = true;
                    }
                } else {
                    // Fly mode damping
                    const dx = this._targetPosition.x - this.position.x;
                    const dy = this._targetPosition.y - this.position.y;
                    const dz = this._targetPosition.z - this.position.z;
                    
                    if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001 || Math.abs(dz) > 0.0001) {
                        this.position.lerp(this._targetPosition, this.damping);
                        changed = true;
                    }
                    
                    // Quaternion slerp
                    this.quaternion.slerp(this._targetQuaternion, this.damping);
                }
            }
        }
        
        if (changed) {
            this._notifyChange();
        }
        
        return changed;
    }
    
    // ========================================================================
    // MATRICES
    // ========================================================================
    
    /**
     * Get view matrix as Float32Array (column-major for WebGL)
     * @returns {Float32Array}
     */
    getViewMatrix() {
        const matrix = new Float32Array(16);
        
        // Calculate forward, right, up vectors
        let forward, right, up;
        
        if (this.mode === CAMERA_MODE.ORBIT) {
            forward = this.target.clone().sub(this.position).normalize();
            right = forward.cross(new Vec3(0, 1, 0)).normalize();
            up = right.cross(forward);
        } else {
            forward = new Vec3(0, 0, -1).applyQuaternion(this.quaternion);
            right = new Vec3(1, 0, 0).applyQuaternion(this.quaternion);
            up = new Vec3(0, 1, 0).applyQuaternion(this.quaternion);
        }
        
        // Build view matrix (column-major)
        matrix[0] = right.x;
        matrix[1] = up.x;
        matrix[2] = -forward.x;
        matrix[3] = 0;
        
        matrix[4] = right.y;
        matrix[5] = up.y;
        matrix[6] = -forward.y;
        matrix[7] = 0;
        
        matrix[8] = right.z;
        matrix[9] = up.z;
        matrix[10] = -forward.z;
        matrix[11] = 0;
        
        matrix[12] = -right.dot(this.position);
        matrix[13] = -up.dot(this.position);
        matrix[14] = forward.dot(this.position);
        matrix[15] = 1;
        
        return matrix;
    }
    
    /**
     * Get projection matrix
     * @returns {Float32Array}
     */
    getProjectionMatrix() {
        const matrix = new Float32Array(16);
        
        const fovRad = this.fov * Math.PI / 180;
        const f = 1 / Math.tan(fovRad / 2);
        const rangeInv = 1 / (this.near - this.far);
        
        matrix[0] = f / this.aspect;
        matrix[5] = f;
        matrix[10] = (this.near + this.far) * rangeInv;
        matrix[11] = -1;
        matrix[14] = 2 * this.near * this.far * rangeInv;
        
        return matrix;
    }
    
    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    
    attachEvents(element) {
        this.element = element;
        
        element.addEventListener('mousedown', this._onMouseDown);
        element.addEventListener('mousemove', this._onMouseMove);
        element.addEventListener('mouseup', this._onMouseUp);
        element.addEventListener('mouseleave', this._onMouseUp);
        element.addEventListener('wheel', this._onWheel, { passive: false });
        element.addEventListener('contextmenu', this._onContextMenu);
        
        // Keyboard events on document
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
    }
    
    detachEvents() {
        if (!this.element) return;
        
        this.element.removeEventListener('mousedown', this._onMouseDown);
        this.element.removeEventListener('mousemove', this._onMouseMove);
        this.element.removeEventListener('mouseup', this._onMouseUp);
        this.element.removeEventListener('mouseleave', this._onMouseUp);
        this.element.removeEventListener('wheel', this._onWheel);
        this.element.removeEventListener('contextmenu', this._onContextMenu);
        
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
    }
    
    _onMouseDown(e) {
        if (e.button === 0) {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.stopAnimation();
        } else if (e.button === 2) {
            this.isRightDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }
    
    _onMouseMove(e) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        
        if (this.isDragging) {
            if (this.mode === CAMERA_MODE.ORBIT) {
                this.orbit(-dx * this.rotateSpeed, -dy * this.rotateSpeed);
            } else {
                this.rotate(dx * this.rotateSpeed, dy * this.rotateSpeed);
            }
        }
        
        if (this.isRightDragging) {
            this.pan(dx, -dy);
        }
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }
    
    _onMouseUp(e) {
        if (e.button === 0) this.isDragging = false;
        if (e.button === 2) this.isRightDragging = false;
    }
    
    _onWheel(e) {
        e.preventDefault();
        this.dolly(-e.deltaY * 0.01);
    }
    
    _onContextMenu(e) {
        e.preventDefault();
    }
    
    _onKeyDown(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = true; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = true; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = true; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = true; break;
            case 'Space': this.keys.up = true; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = true; break;
            case 'ControlLeft': case 'ControlRight': this.keys.down = true; break;
        }
    }
    
    _onKeyUp(e) {
        switch (e.code) {
            case 'KeyW': case 'ArrowUp': this.keys.forward = false; break;
            case 'KeyS': case 'ArrowDown': this.keys.backward = false; break;
            case 'KeyA': case 'ArrowLeft': this.keys.left = false; break;
            case 'KeyD': case 'ArrowRight': this.keys.right = false; break;
            case 'Space': this.keys.up = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = false; break;
            case 'ControlLeft': case 'ControlRight': this.keys.down = false; break;
        }
    }
    
    // ========================================================================
    // UTILITIES
    // ========================================================================
    
    _notifyChange() {
        if (this.onChange) {
            this.onChange(this.toJSON());
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.aspect = width / height;
        this._notifyChange();
    }
    
    reset(animate = true) {
        if (animate) {
            this.animateTo({
                target: { x: 0, y: 0, z: 0 },
                distance: DEFAULTS.distance,
                theta: 0,
                phi: HALF_PI
            }, 1000);
        } else {
            this.target.set(0, 0, 0);
            this.spherical.radius = DEFAULTS.distance;
            this.spherical.theta = 0;
            this.spherical.phi = HALF_PI;
            this._targetSpherical = { ...this.spherical };
            this._updatePositionFromSpherical();
            this._notifyChange();
        }
    }
    
    toJSON() {
        return {
            mode: this.mode,
            position: this.position.toArray(),
            target: this.target.toArray(),
            quaternion: { x: this.quaternion.x, y: this.quaternion.y, z: this.quaternion.z, w: this.quaternion.w },
            spherical: { ...this.spherical },
            fov: this.fov
        };
    }
    
    fromJSON(state, animate = false) {
        if (animate) {
            this.animateTo({
                position: state.position,
                target: state.target,
                quaternion: state.quaternion,
                distance: state.spherical?.radius,
                theta: state.spherical?.theta,
                phi: state.spherical?.phi
            }, 1000);
        } else {
            if (state.mode) this.mode = state.mode;
            if (state.position) this.position.fromArray(state.position);
            if (state.target) this.target.fromArray(state.target);
            if (state.quaternion) {
                this.quaternion.set(state.quaternion.x, state.quaternion.y, state.quaternion.z, state.quaternion.w);
            }
            if (state.spherical) {
                this.spherical = { ...state.spherical };
                this._targetSpherical = { ...this.spherical };
            }
            if (state.fov) this.fov = state.fov;
            
            this._targetPosition.copy(this.position);
            this._targetQuaternion.copy(this.quaternion);
            
            if (this.mode === CAMERA_MODE.ORBIT) {
                this._updatePositionFromSpherical();
            }
            
            this._notifyChange();
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Vec3, Quat, CAMERA_MODE };
export default Camera3D;
