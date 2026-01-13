/**
 * ============================================================================
 * ABYSS EXPLORER - PALETTE CYCLING
 * ============================================================================
 * 
 * Animated palette cycling and shifting system. Creates mesmerizing
 * color animations by smoothly rotating, oscillating, or modulating
 * the color palette over time.
 * 
 * Animation Concepts:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  Palette Cycling Methods:                                              │
 * │                                                                        │
 * │  ┌─────────┐    ┌─────────┐    ┌─────────┐                            │
 * │  │ ROTATE  │    │  WAVE   │    │  PULSE  │                            │
 * │  │  →→→→   │    │  ~~~    │    │  ◯→◎→◯  │                            │
 * │  │ Shift   │    │ Sine    │    │ Expand/ │                            │
 * │  │ colors  │    │ wave    │    │ contract│                            │
 * │  └─────────┘    └─────────┘    └─────────┘                            │
 * │                                                                        │
 * │  Keyframe Animation:                                                   │
 * │    t=0     t=0.5    t=1.0                                             │
 * │    ┌─┐      ┌─┐      ┌─┐                                              │
 * │    │A│  →   │B│  →   │C│  → loop                                      │
 * │    └─┘      └─┘      └─┘                                              │
 * │                                                                        │
 * │  Combined Effects:                                                     │
 * │    - Hue rotation (rainbow shift)                                     │
 * │    - Saturation breathing                                             │
 * │    - Value pulsing                                                    │
 * │    - Position offset (classic cycling)                                │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module palettes/palette-cycling
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { Palette, rgbToHsv, hsvToRgb } from './palette-engine.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Animation modes */
export const CYCLE_MODE = {
    NONE: 'none',
    ROTATE: 'rotate',           // Shift palette position
    WAVE: 'wave',               // Sinusoidal wave
    PULSE: 'pulse',             // Expand/contract
    BOUNCE: 'bounce',           // Ping-pong
    RANDOM: 'random',           // Random jumps
    KEYFRAME: 'keyframe',       // Keyframed sequence
    HUE_ROTATE: 'hue-rotate',   // Rotate hue
    BREATHE: 'breathe',         // Saturation breathing
    FLASH: 'flash',             // Brightness flash
    STROBE: 'strobe',           // High-speed strobe
    DRIFT: 'drift'              // Slow random drift
};

/** Easing functions */
export const EASING = {
    LINEAR: 'linear',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    EASE_IN_QUAD: 'ease-in-quad',
    EASE_OUT_QUAD: 'ease-out-quad',
    EASE_IN_OUT_QUAD: 'ease-in-out-quad',
    EASE_IN_CUBIC: 'ease-in-cubic',
    EASE_OUT_CUBIC: 'ease-out-cubic',
    EASE_IN_OUT_CUBIC: 'ease-in-out-cubic',
    EASE_IN_ELASTIC: 'ease-in-elastic',
    EASE_OUT_ELASTIC: 'ease-out-elastic',
    EASE_OUT_BOUNCE: 'ease-out-bounce'
};

/** Loop modes */
export const LOOP_MODE = {
    ONCE: 'once',
    LOOP: 'loop',
    PING_PONG: 'ping-pong',
    REVERSE: 'reverse'
};

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

const easingFunctions = {
    'linear': t => t,
    'ease-in': t => t * t,
    'ease-out': t => t * (2 - t),
    'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'ease-in-quad': t => t * t,
    'ease-out-quad': t => t * (2 - t),
    'ease-in-out-quad': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'ease-in-cubic': t => t * t * t,
    'ease-out-cubic': t => (--t) * t * t + 1,
    'ease-in-out-cubic': t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    'ease-in-elastic': t => {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    },
    'ease-out-elastic': t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    },
    'ease-out-bounce': t => {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }
};

/**
 * Apply easing function
 * @param {number} t - Time (0-1)
 * @param {string} easing - Easing function name
 * @returns {number} Eased value
 */
function applyEasing(t, easing) {
    const fn = easingFunctions[easing] || easingFunctions.linear;
    return fn(Math.max(0, Math.min(1, t)));
}

// ============================================================================
// KEYFRAME CLASS
// ============================================================================

/**
 * Represents a keyframe in an animation sequence
 */
export class Keyframe {
    /**
     * Create a keyframe
     * @param {number} time - Time position (0-1)
     * @param {Object} properties - Properties at this keyframe
     * @param {string} easing - Easing to next keyframe
     */
    constructor(time, properties, easing = EASING.LINEAR) {
        this.time = time;
        this.properties = { ...properties };
        this.easing = easing;
    }
    
    clone() {
        return new Keyframe(this.time, { ...this.properties }, this.easing);
    }
}

// ============================================================================
// CYCLE EFFECT CLASS
// ============================================================================

/**
 * Represents a single cycling effect
 */
export class CycleEffect {
    /**
     * Create a cycle effect
     * @param {Object} options - Effect options
     */
    constructor(options = {}) {
        this.mode = options.mode || CYCLE_MODE.ROTATE;
        this.speed = options.speed ?? 1;           // Cycles per second
        this.amplitude = options.amplitude ?? 1;   // Effect strength (0-1)
        this.phase = options.phase ?? 0;           // Phase offset
        this.enabled = options.enabled ?? true;
        
        // For keyframe mode
        this.keyframes = options.keyframes || [];
        this.loopMode = options.loopMode || LOOP_MODE.LOOP;
        
        // Target property
        this.property = options.property || 'offset'; // offset, hue, saturation, value, contrast
        
        // Additional parameters
        this.waveform = options.waveform || 'sine'; // sine, triangle, square, sawtooth
        this.frequency = options.frequency ?? 1;     // For wave effects
    }
    
    /**
     * Get effect value at time
     * @param {number} time - Time in seconds
     * @returns {number} Effect value
     */
    getValue(time) {
        if (!this.enabled) return 0;
        
        const cycleTime = (time * this.speed + this.phase) % 1;
        
        switch (this.mode) {
            case CYCLE_MODE.ROTATE:
                return this._getRotateValue(cycleTime);
            case CYCLE_MODE.WAVE:
                return this._getWaveValue(cycleTime);
            case CYCLE_MODE.PULSE:
                return this._getPulseValue(cycleTime);
            case CYCLE_MODE.BOUNCE:
                return this._getBounceValue(cycleTime);
            case CYCLE_MODE.KEYFRAME:
                return this._getKeyframeValue(cycleTime);
            case CYCLE_MODE.BREATHE:
                return this._getBreatheValue(cycleTime);
            case CYCLE_MODE.FLASH:
                return this._getFlashValue(cycleTime);
            case CYCLE_MODE.STROBE:
                return this._getStrobeValue(cycleTime);
            case CYCLE_MODE.DRIFT:
                return this._getDriftValue(time);
            default:
                return cycleTime * this.amplitude;
        }
    }
    
    _getRotateValue(t) {
        return t * this.amplitude;
    }
    
    _getWaveValue(t) {
        let value;
        switch (this.waveform) {
            case 'sine':
                value = Math.sin(t * Math.PI * 2 * this.frequency);
                break;
            case 'triangle':
                value = 1 - Math.abs((t * 2 * this.frequency) % 2 - 1) * 2;
                break;
            case 'square':
                value = Math.sin(t * Math.PI * 2 * this.frequency) >= 0 ? 1 : -1;
                break;
            case 'sawtooth':
                value = (t * this.frequency % 1) * 2 - 1;
                break;
            default:
                value = Math.sin(t * Math.PI * 2 * this.frequency);
        }
        return value * this.amplitude * 0.5 + 0.5;
    }
    
    _getPulseValue(t) {
        const wave = Math.sin(t * Math.PI * 2);
        return (wave * 0.5 + 0.5) * this.amplitude;
    }
    
    _getBounceValue(t) {
        const bounce = Math.abs(Math.sin(t * Math.PI));
        return bounce * this.amplitude;
    }
    
    _getBreatheValue(t) {
        // Slow breathing effect
        const breath = (Math.sin(t * Math.PI * 2) + 1) / 2;
        return breath * this.amplitude;
    }
    
    _getFlashValue(t) {
        // Quick flash at regular intervals
        const flashPoint = 0.1;
        if (t < flashPoint) {
            return (1 - t / flashPoint) * this.amplitude;
        }
        return 0;
    }
    
    _getStrobeValue(t) {
        // High frequency strobe
        const freq = this.frequency * 10;
        return (Math.sin(t * Math.PI * 2 * freq) > 0 ? 1 : 0) * this.amplitude;
    }
    
    _getDriftValue(time) {
        // Slow perlin-like drift
        const x = time * 0.1;
        const drift = 
            Math.sin(x * 1.1) * 0.5 +
            Math.sin(x * 2.3) * 0.25 +
            Math.sin(x * 4.7) * 0.125;
        return (drift + 1) / 2 * this.amplitude;
    }
    
    _getKeyframeValue(t) {
        if (this.keyframes.length === 0) return 0;
        if (this.keyframes.length === 1) return this.keyframes[0].properties.value || 0;
        
        // Apply loop mode
        let adjustedT = t;
        switch (this.loopMode) {
            case LOOP_MODE.PING_PONG:
                adjustedT = t < 0.5 ? t * 2 : (1 - t) * 2;
                break;
            case LOOP_MODE.REVERSE:
                adjustedT = 1 - t;
                break;
        }
        
        // Find surrounding keyframes
        let prev = this.keyframes[0];
        let next = this.keyframes[this.keyframes.length - 1];
        
        for (let i = 0; i < this.keyframes.length - 1; i++) {
            if (adjustedT >= this.keyframes[i].time && adjustedT < this.keyframes[i + 1].time) {
                prev = this.keyframes[i];
                next = this.keyframes[i + 1];
                break;
            }
        }
        
        // Interpolate
        const range = next.time - prev.time;
        const localT = range > 0 ? (adjustedT - prev.time) / range : 0;
        const easedT = applyEasing(localT, prev.easing);
        
        const prevValue = prev.properties.value ?? 0;
        const nextValue = next.properties.value ?? 0;
        
        return prevValue + (nextValue - prevValue) * easedT;
    }
    
    clone() {
        return new CycleEffect({
            mode: this.mode,
            speed: this.speed,
            amplitude: this.amplitude,
            phase: this.phase,
            enabled: this.enabled,
            keyframes: this.keyframes.map(k => k.clone()),
            loopMode: this.loopMode,
            property: this.property,
            waveform: this.waveform,
            frequency: this.frequency
        });
    }
}

// ============================================================================
// PALETTE CYCLER CLASS
// ============================================================================

/**
 * Main palette cycling controller
 */
export class PaletteCycler {
    /**
     * Create a palette cycler
     * @param {Object} options - Cycler options
     */
    constructor(options = {}) {
        // Source palette
        this.sourcePalette = options.palette || null;
        
        // Active effects
        this.effects = [];
        
        // Global settings
        this.enabled = options.enabled ?? true;
        this.globalSpeed = options.globalSpeed ?? 1;
        this.paused = false;
        
        // Animation state
        this.time = 0;
        this.lastUpdate = performance.now();
        
        // Cached modified palette
        this._cachedPalette = null;
        this._cacheTime = -1;
        this._cacheDirty = true;
        
        // Callbacks
        this.onUpdate = options.onUpdate || null;
    }
    
    /**
     * Set source palette
     * @param {Palette} palette - Source palette
     */
    setPalette(palette) {
        this.sourcePalette = palette;
        this._cacheDirty = true;
    }
    
    /**
     * Add a cycling effect
     * @param {CycleEffect|Object} effect - Effect to add
     * @returns {CycleEffect} Added effect
     */
    addEffect(effect) {
        if (!(effect instanceof CycleEffect)) {
            effect = new CycleEffect(effect);
        }
        this.effects.push(effect);
        this._cacheDirty = true;
        return effect;
    }
    
    /**
     * Remove an effect
     * @param {number|CycleEffect} effect - Effect index or instance
     */
    removeEffect(effect) {
        const index = typeof effect === 'number' ? effect : this.effects.indexOf(effect);
        if (index >= 0 && index < this.effects.length) {
            this.effects.splice(index, 1);
            this._cacheDirty = true;
        }
    }
    
    /**
     * Clear all effects
     */
    clearEffects() {
        this.effects = [];
        this._cacheDirty = true;
    }
    
    /**
     * Update animation
     * @param {number} deltaTime - Time since last update (ms)
     */
    update(deltaTime) {
        if (!this.enabled || this.paused) return;
        
        this.time += (deltaTime / 1000) * this.globalSpeed;
        this._cacheDirty = true;
        
        if (this.onUpdate) {
            this.onUpdate(this.getModifiedPalette());
        }
    }
    
    /**
     * Auto-update using requestAnimationFrame timing
     */
    tick() {
        const now = performance.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;
        this.update(deltaTime);
    }
    
    /**
     * Play animation
     */
    play() {
        this.paused = false;
        this.lastUpdate = performance.now();
    }
    
    /**
     * Pause animation
     */
    pause() {
        this.paused = true;
    }
    
    /**
     * Toggle play/pause
     */
    toggle() {
        if (this.paused) {
            this.play();
        } else {
            this.pause();
        }
    }
    
    /**
     * Reset animation to start
     */
    reset() {
        this.time = 0;
        this._cacheDirty = true;
    }
    
    /**
     * Seek to specific time
     * @param {number} time - Time in seconds
     */
    seek(time) {
        this.time = time;
        this._cacheDirty = true;
    }
    
    /**
     * Get the current offset value
     * @returns {number} Palette offset (0-1)
     */
    getOffset() {
        let offset = 0;
        
        for (const effect of this.effects) {
            if (effect.enabled && effect.property === 'offset') {
                offset += effect.getValue(this.time);
            }
        }
        
        return ((offset % 1) + 1) % 1;
    }
    
    /**
     * Get current hue rotation
     * @returns {number} Hue rotation in degrees
     */
    getHueRotation() {
        let hue = 0;
        
        for (const effect of this.effects) {
            if (effect.enabled && effect.property === 'hue') {
                hue += effect.getValue(this.time) * 360;
            }
        }
        
        return hue;
    }
    
    /**
     * Get current saturation modifier
     * @returns {number} Saturation multiplier
     */
    getSaturationModifier() {
        let sat = 1;
        
        for (const effect of this.effects) {
            if (effect.enabled && effect.property === 'saturation') {
                sat *= 0.5 + effect.getValue(this.time);
            }
        }
        
        return sat;
    }
    
    /**
     * Get current value/brightness modifier
     * @returns {number} Value multiplier
     */
    getValueModifier() {
        let val = 1;
        
        for (const effect of this.effects) {
            if (effect.enabled && effect.property === 'value') {
                val *= 0.5 + effect.getValue(this.time);
            }
        }
        
        return val;
    }
    
    /**
     * Get modified palette with all effects applied
     * @returns {Palette} Modified palette
     */
    getModifiedPalette() {
        if (!this.sourcePalette) return null;
        
        if (!this._cacheDirty && this._cachedPalette) {
            return this._cachedPalette;
        }
        
        // Clone source palette
        const modified = this.sourcePalette.clone();
        
        // Apply effects to palette properties
        const hueRotation = this.getHueRotation();
        const satMod = this.getSaturationModifier();
        const valMod = this.getValueModifier();
        
        // Modify stops if needed
        if (hueRotation !== 0 || satMod !== 1 || valMod !== 1) {
            for (const stop of modified.stops) {
                const hsv = rgbToHsv(stop.r, stop.g, stop.b);
                hsv.h = (hsv.h + hueRotation) % 360;
                hsv.s = Math.max(0, Math.min(1, hsv.s * satMod));
                hsv.v = Math.max(0, Math.min(1, hsv.v * valMod));
                
                const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
                stop.r = rgb.r;
                stop.g = rgb.g;
                stop.b = rgb.b;
            }
            modified._invalidateLUT();
        }
        
        this._cachedPalette = modified;
        this._cacheDirty = false;
        
        return modified;
    }
    
    /**
     * Get color at position with cycling applied
     * @param {number} t - Position (0-1)
     * @returns {Object} { r, g, b, a }
     */
    getColor(t) {
        if (!this.sourcePalette) {
            return { r: 0, g: 0, b: 0, a: 1 };
        }
        
        // Apply offset
        const offset = this.getOffset();
        t = ((t + offset) % 1 + 1) % 1;
        
        // Get color from modified palette
        const palette = this.getModifiedPalette();
        return palette.getColor(t);
    }
    
    /**
     * Export cycler configuration
     * @returns {Object} Configuration object
     */
    toJSON() {
        return {
            enabled: this.enabled,
            globalSpeed: this.globalSpeed,
            effects: this.effects.map(e => ({
                mode: e.mode,
                speed: e.speed,
                amplitude: e.amplitude,
                phase: e.phase,
                enabled: e.enabled,
                property: e.property,
                waveform: e.waveform,
                frequency: e.frequency,
                loopMode: e.loopMode,
                keyframes: e.keyframes.map(k => ({
                    time: k.time,
                    properties: k.properties,
                    easing: k.easing
                }))
            }))
        };
    }
    
    /**
     * Import cycler configuration
     * @param {Object} config - Configuration object
     */
    fromJSON(config) {
        this.enabled = config.enabled ?? true;
        this.globalSpeed = config.globalSpeed ?? 1;
        this.effects = (config.effects || []).map(e => {
            const effect = new CycleEffect(e);
            effect.keyframes = (e.keyframes || []).map(k => 
                new Keyframe(k.time, k.properties, k.easing)
            );
            return effect;
        });
        this._cacheDirty = true;
    }
}

// ============================================================================
// PRESET ANIMATIONS
// ============================================================================

/**
 * Predefined cycling presets
 */
export const CYCLE_PRESETS = {
    // Classic cycling
    'slow-rotate': {
        name: 'Slow Rotate',
        description: 'Classic slow palette rotation',
        effects: [
            { mode: CYCLE_MODE.ROTATE, property: 'offset', speed: 0.1, amplitude: 1 }
        ]
    },
    
    'fast-rotate': {
        name: 'Fast Rotate',
        description: 'Rapid palette rotation',
        effects: [
            { mode: CYCLE_MODE.ROTATE, property: 'offset', speed: 1, amplitude: 1 }
        ]
    },
    
    // Wave effects
    'gentle-wave': {
        name: 'Gentle Wave',
        description: 'Soft sinusoidal wave',
        effects: [
            { mode: CYCLE_MODE.WAVE, property: 'offset', speed: 0.2, amplitude: 0.3, waveform: 'sine' }
        ]
    },
    
    'ocean-wave': {
        name: 'Ocean Wave',
        description: 'Multi-frequency wave pattern',
        effects: [
            { mode: CYCLE_MODE.WAVE, property: 'offset', speed: 0.15, amplitude: 0.2, frequency: 1 },
            { mode: CYCLE_MODE.WAVE, property: 'offset', speed: 0.25, amplitude: 0.1, frequency: 2, phase: 0.3 }
        ]
    },
    
    // Breathing effects
    'breathe': {
        name: 'Breathe',
        description: 'Slow breathing saturation',
        effects: [
            { mode: CYCLE_MODE.BREATHE, property: 'saturation', speed: 0.15, amplitude: 0.4 }
        ]
    },
    
    'heartbeat': {
        name: 'Heartbeat',
        description: 'Pulsing brightness',
        effects: [
            { mode: CYCLE_MODE.PULSE, property: 'value', speed: 1.2, amplitude: 0.3 }
        ]
    },
    
    // Rainbow effects
    'rainbow-shift': {
        name: 'Rainbow Shift',
        description: 'Continuous hue rotation',
        effects: [
            { mode: CYCLE_MODE.ROTATE, property: 'hue', speed: 0.1, amplitude: 1 }
        ]
    },
    
    'rainbow-wave': {
        name: 'Rainbow Wave',
        description: 'Oscillating hue shift',
        effects: [
            { mode: CYCLE_MODE.WAVE, property: 'hue', speed: 0.2, amplitude: 0.3, waveform: 'sine' }
        ]
    },
    
    // Complex effects
    'psychedelic': {
        name: 'Psychedelic',
        description: 'Multi-layered trippy effect',
        effects: [
            { mode: CYCLE_MODE.ROTATE, property: 'offset', speed: 0.3, amplitude: 1 },
            { mode: CYCLE_MODE.WAVE, property: 'hue', speed: 0.15, amplitude: 0.2 },
            { mode: CYCLE_MODE.BREATHE, property: 'saturation', speed: 0.1, amplitude: 0.2 }
        ]
    },
    
    'disco': {
        name: 'Disco',
        description: 'Fast flashing party mode',
        effects: [
            { mode: CYCLE_MODE.STROBE, property: 'value', speed: 2, amplitude: 0.5, frequency: 4 },
            { mode: CYCLE_MODE.ROTATE, property: 'hue', speed: 0.5, amplitude: 1 }
        ]
    },
    
    'meditation': {
        name: 'Meditation',
        description: 'Very slow, calming drift',
        effects: [
            { mode: CYCLE_MODE.DRIFT, property: 'offset', speed: 0.05, amplitude: 0.2 },
            { mode: CYCLE_MODE.BREATHE, property: 'saturation', speed: 0.08, amplitude: 0.1 }
        ]
    },
    
    'storm': {
        name: 'Storm',
        description: 'Chaotic energy',
        effects: [
            { mode: CYCLE_MODE.WAVE, property: 'offset', speed: 0.5, amplitude: 0.4, waveform: 'sawtooth' },
            { mode: CYCLE_MODE.FLASH, property: 'value', speed: 2, amplitude: 0.8 }
        ]
    },
    
    // Subtle effects
    'shimmer': {
        name: 'Shimmer',
        description: 'Subtle sparkle effect',
        effects: [
            { mode: CYCLE_MODE.WAVE, property: 'value', speed: 3, amplitude: 0.1, waveform: 'sine', frequency: 3 }
        ]
    },
    
    'glow': {
        name: 'Glow',
        description: 'Soft pulsing glow',
        effects: [
            { mode: CYCLE_MODE.PULSE, property: 'value', speed: 0.3, amplitude: 0.15 }
        ]
    }
};

/**
 * Create a preset cycler
 * @param {string} presetName - Preset name
 * @param {Palette} palette - Source palette
 * @returns {PaletteCycler}
 */
export function createPresetCycler(presetName, palette = null) {
    const preset = CYCLE_PRESETS[presetName];
    if (!preset) {
        console.warn(`[PaletteCycler] Unknown preset: ${presetName}`);
        return new PaletteCycler({ palette });
    }
    
    const cycler = new PaletteCycler({ palette });
    
    for (const effectConfig of preset.effects) {
        cycler.addEffect(effectConfig);
    }
    
    return cycler;
}

/**
 * Get list of preset names
 * @returns {string[]}
 */
export function getPresetNames() {
    return Object.keys(CYCLE_PRESETS);
}

// ============================================================================
// ANIMATION LOOP HELPER
// ============================================================================

/**
 * Animation loop manager for palette cycling
 */
export class CycleAnimator {
    constructor() {
        this.cyclers = new Set();
        this.running = false;
        this.animationId = null;
        this.lastTime = 0;
    }
    
    /**
     * Add a cycler to the animation loop
     * @param {PaletteCycler} cycler
     */
    add(cycler) {
        this.cyclers.add(cycler);
    }
    
    /**
     * Remove a cycler from the animation loop
     * @param {PaletteCycler} cycler
     */
    remove(cycler) {
        this.cyclers.delete(cycler);
    }
    
    /**
     * Start the animation loop
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this._animate();
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Animation frame callback
     * @private
     */
    _animate() {
        if (!this.running) return;
        
        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;
        
        for (const cycler of this.cyclers) {
            cycler.update(deltaTime);
        }
        
        this.animationId = requestAnimationFrame(() => this._animate());
    }
}

// Global animator instance
export const globalAnimator = new CycleAnimator();

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    PaletteCycler,
    CycleEffect,
    Keyframe,
    CycleAnimator,
    globalAnimator,
    CYCLE_MODE,
    EASING,
    LOOP_MODE,
    CYCLE_PRESETS,
    createPresetCycler,
    getPresetNames
};
