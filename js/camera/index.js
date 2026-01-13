/**
 * ============================================================================
 * ABYSS EXPLORER - CAMERA MODULE
 * ============================================================================
 * 
 * Central export for the complete camera and animation system.
 * Provides ultra-smooth navigation for both 2D fractal exploration
 * and 3D fly-through experiences.
 * 
 * Module Overview:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  📷 CAMERA 2D                                                          │
 * │     Pan, zoom, inertia, gestures for 2D fractal navigation            │
 * │                                                                        │
 * │  🎥 CAMERA 3D                                                          │
 * │     Orbit/fly controls for 3D fractal exploration                     │
 * │                                                                        │
 * │  🎬 ANIMATION CONTROLLER                                               │
 * │     Queue management, playback controls, speed/loop settings          │
 * │                                                                        │
 * │  ⏱️ KEYFRAME SYSTEM                                                    │
 * │     Record, edit, play camera paths with preset animations            │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Quick Start:
 * ```javascript
 * import { Camera2D, KeyframeSystem, getPresetPath } from './camera/index.js';
 * 
 * // Create 2D camera
 * const camera = new Camera2D({
 *     element: canvas,
 *     onChange: (state) => render(state)
 * });
 * 
 * // Play a preset animation
 * const keyframes = new KeyframeSystem({ camera2d: camera });
 * keyframes.loadPath('seahorse-valley');
 * keyframes.play();
 * ```
 * 
 * @module camera
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CAMERA 2D
// ============================================================================

export { 
    Camera2D, 
    Easing 
} from './camera2d.js';

// ============================================================================
// CAMERA 3D
// ============================================================================

export { 
    Camera3D, 
    Vec3, 
    Quat, 
    CAMERA_MODE 
} from './camera3d.js';

// ============================================================================
// ANIMATION CONTROLLER
// ============================================================================

export {
    AnimationController,
    AnimationItem,
    AnimationSequence,
    ANIMATION_STATE,
    LOOP_MODE,
    SPEED_PRESETS
} from './animation-controller.js';

// ============================================================================
// KEYFRAME SYSTEM
// ============================================================================

export {
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
} from './keyframe-system.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Camera System',
    version: '1.0.0',
    components: [
        'Camera2D - 2D fractal navigation with pan/zoom/gestures',
        'Camera3D - 3D orbit/fly controls for volumetric fractals',
        'AnimationController - Central animation queue and playback',
        'KeyframeSystem - Record and playback camera paths'
    ],
    features: [
        // 2D Camera
        'Mouse drag panning with inertia',
        'Scroll wheel zoom toward cursor',
        'Pinch-to-zoom touch gesture support',
        'Double-click/tap to zoom in',
        'Smooth easing animations',
        'Logarithmic zoom interpolation for deep zooms',
        'View bounds clamping',
        'Coordinate conversion (screen ↔ complex plane)',
        
        // 3D Camera
        'Orbit mode with spherical coordinates',
        'Fly mode with WASD/arrow key controls',
        'Auto-rotation option',
        'Smooth damping on all movements',
        'View and projection matrix generation',
        'Quaternion-based orientation',
        
        // Animation
        'Animation queuing and sequencing',
        'Multiple loop modes (none, single, all, ping-pong)',
        'Variable playback speed (0.25x - 8x)',
        'Pause/resume/seek controls',
        'Progress callbacks',
        
        // Keyframes
        'Manual and auto-record modes',
        'Multiple interpolation types (linear, smooth, bezier)',
        'Save/load paths as JSON',
        '10+ preset animation paths',
        'Thumbnail generation for keyframes'
    ],
    presetPaths: [
        'mandelbrot-overview - Gentle tour of the full set',
        'seahorse-valley - Famous deep dive location',
        'elephant-valley - Another classic exploration',
        'spiral-deep-dive - Infinite spiral descent',
        'mini-mandelbrot-hunt - Find hidden mini-brots',
        'julia-tour - Julia set parameter space',
        'burning-ship-voyage - Burning Ship exploration',
        'mandelbulb-orbit - 3D orbit around Mandelbulb',
        'mandelbulb-dive - Fly into Mandelbulb surface',
        'menger-exploration - Menger Sponge fly-through'
    ]
};

// ============================================================================
// CONVENIENCE FACTORIES
// ============================================================================

/**
 * Create a fully configured 2D camera system
 * @param {HTMLElement} element - DOM element for events
 * @param {Object} options - Camera options
 * @returns {Camera2D}
 */
export function create2DCamera(element, options = {}) {
    const { Camera2D } = require('./camera2d.js');
    
    return new Camera2D({
        element,
        width: element.clientWidth,
        height: element.clientHeight,
        centerX: -0.5,
        centerY: 0,
        zoom: 1,
        inertiaEnabled: true,
        smoothingEnabled: true,
        ...options
    });
}

/**
 * Create a fully configured 3D camera system
 * @param {HTMLElement} element - DOM element for events
 * @param {Object} options - Camera options
 * @returns {Camera3D}
 */
export function create3DCamera(element, options = {}) {
    const { Camera3D, CAMERA_MODE } = require('./camera3d.js');
    
    return new Camera3D({
        element,
        width: element.clientWidth,
        height: element.clientHeight,
        mode: CAMERA_MODE.ORBIT,
        distance: 5,
        autoRotate: false,
        enableDamping: true,
        ...options
    });
}

/**
 * Create a keyframe system with cameras attached
 * @param {Camera2D} camera2d - 2D camera
 * @param {Camera3D} camera3d - 3D camera (optional)
 * @param {boolean} is3D - Whether to use 3D mode
 * @returns {KeyframeSystem}
 */
export function createKeyframeSystem(camera2d, camera3d = null, is3D = false) {
    const { KeyframeSystem } = require('./keyframe-system.js');
    
    return new KeyframeSystem({
        camera2d,
        camera3d,
        is3D
    });
}

/**
 * Create an animation controller with cameras
 * @param {Camera2D} camera2d - 2D camera
 * @param {Camera3D} camera3d - 3D camera (optional)
 * @returns {AnimationController}
 */
export function createAnimationController(camera2d, camera3d = null) {
    const { AnimationController } = require('./animation-controller.js');
    
    return new AnimationController({
        camera2d,
        camera3d,
        is3D: !!camera3d
    });
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import Camera2DDefault from './camera2d.js';
import Camera3DDefault from './camera3d.js';
import AnimationControllerDefault from './animation-controller.js';
import KeyframeSystemDefault from './keyframe-system.js';

export default {
    Camera2D: Camera2DDefault,
    Camera3D: Camera3DDefault,
    AnimationController: AnimationControllerDefault,
    ...KeyframeSystemDefault,
    MODULE_INFO,
    create2DCamera,
    create3DCamera,
    createKeyframeSystem,
    createAnimationController
};
