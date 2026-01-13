/**
 * ============================================================================
 * ABYSS EXPLORER - PALETTES MODULE
 * ============================================================================
 * 
 * Central export for the complete palette system. This module provides
 * everything needed to create, edit, animate, and apply color palettes
 * to fractal visualizations.
 * 
 * Module Overview:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  🎨 PALETTE ENGINE                                                     │
 * │     Core palette representation, color interpolation, LUT generation  │
 * │                                                                        │
 * │  ✏️ PALETTE EDITOR                                                     │
 * │     Interactive UI for creating and modifying palettes                │
 * │                                                                        │
 * │  🌈 GRADIENT GENERATOR                                                 │
 * │     Procedural palette generation (harmonic, mathematical, natural)   │
 * │                                                                        │
 * │  📚 PALETTE PRESETS                                                    │
 * │     150+ carefully curated palettes across 12 categories              │
 * │                                                                        │
 * │  🔄 PALETTE CYCLING                                                    │
 * │     Animated color shifting and keyframe-based sequences              │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Quick Start:
 * ```javascript
 * import { 
 *     Palette, 
 *     PaletteEngine,
 *     getPaletteById,
 *     GradientGenerator,
 *     PaletteCycler 
 * } from './palettes/index.js';
 * 
 * // Use a preset palette
 * const palette = getPaletteById('electric-seahorse');
 * 
 * // Create engine and apply palette
 * const engine = new PaletteEngine();
 * engine.setPalette(palette);
 * 
 * // Get color for a value
 * const color = engine.getColor(0.5);
 * 
 * // Generate a procedural palette
 * const generator = new GradientGenerator();
 * const sunset = generator.generateSunset();
 * 
 * // Animate palette cycling
 * const cycler = new PaletteCycler({ palette });
 * cycler.addEffect({ mode: 'rotate', speed: 0.2 });
 * ```
 * 
 * @module palettes
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// PALETTE ENGINE
// ============================================================================

export {
    Palette,
    PaletteEngine,
    ColorStop,
    INTERPOLATION,
    COLOR_SPACE,
    REPEAT_MODE,
    rgbToHsv,
    hsvToRgb,
    rgbToHsl,
    hslToRgb,
    rgbToOklab,
    oklabToRgb,
    parseHex,
    toHex
} from './palette-engine.js';

// ============================================================================
// PALETTE EDITOR
// ============================================================================

export {
    PaletteEditor,
    EDITOR_MODE
} from './palette-editor.js';

// ============================================================================
// GRADIENT GENERATOR
// ============================================================================

export {
    GradientGenerator
} from './gradient-generator.js';

// ============================================================================
// PALETTE PRESETS
// ============================================================================

export {
    PALETTE_PRESETS,
    ALL_PALETTES,
    PALETTE_BY_ID,
    PALETTES_BY_CATEGORY,
    CATEGORIES,
    getPaletteById,
    getPalettesByCategory,
    searchPalettes,
    getRandomPalette,
    getPaletteCount,
    getCategoryNames
} from './palette-presets.js';

// ============================================================================
// PALETTE CYCLING
// ============================================================================

export {
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
} from './palette-cycling.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Palette System',
    version: '1.0.0',
    components: [
        'Palette Engine - Core color palette with gradient interpolation',
        'Palette Editor - Interactive UI for palette creation/editing',
        'Gradient Generator - Procedural palette generation',
        'Palette Presets - 150+ curated palettes',
        'Palette Cycling - Animated color shifting'
    ],
    features: [
        '150+ built-in color palettes',
        'HSV, HSL, RGB, OKLAB color space interpolation',
        'Linear, smooth, cubic, bezier interpolation modes',
        'Clamp, repeat, mirror gradient modes',
        'Gamma, contrast, saturation post-processing',
        'Procedural generation (harmonic, noise, mathematical)',
        'Full undo/redo in editor',
        'Keyframe animation sequences',
        'Multiple cycling modes (rotate, wave, pulse, etc.)',
        '15+ animation presets',
        'High-resolution LUT generation',
        'Import/export JSON format'
    ],
    categories: [
        '🌈 Rainbow & Spectrum (15 palettes)',
        '🔥 Fire & Warmth (15 palettes)',
        '🌊 Ocean & Water (15 palettes)',
        '🌲 Nature & Earth (15 palettes)',
        '🌸 Pastel & Soft (12 palettes)',
        '⚡ Neon & Electric (12 palettes)',
        '🌙 Dark & Mysterious (12 palettes)',
        '💜 Cosmic & Galaxy (12 palettes)',
        '🎭 Classic Fractal (15 palettes)',
        '💎 Metallic & Jewel (12 palettes)',
        '❄️ Ice & Frost (8 palettes)',
        '🌅 Sunset & Twilight (8 palettes)'
    ]
};

// ============================================================================
// CONVENIENCE FACTORIES
// ============================================================================

/**
 * Create a fully configured palette engine with a preset palette
 * @param {string} paletteId - Palette ID from presets
 * @returns {PaletteEngine}
 */
export function createPaletteEngine(paletteId = 'classic-rainbow') {
    const { PaletteEngine } = require('./palette-engine.js');
    const { getPaletteById } = require('./palette-presets.js');
    
    const engine = new PaletteEngine();
    const palette = getPaletteById(paletteId);
    
    if (palette) {
        engine.setPalette(palette.clone());
    }
    
    return engine;
}

/**
 * Create a palette editor attached to DOM elements
 * @param {Object} elements - Map of DOM elements
 * @param {Palette} initialPalette - Initial palette to edit
 * @returns {PaletteEditor}
 */
export function createPaletteEditor(elements, initialPalette = null) {
    const { PaletteEditor } = require('./palette-editor.js');
    const { getRandomPalette } = require('./palette-presets.js');
    
    const editor = new PaletteEditor({
        palette: initialPalette || getRandomPalette()
    });
    
    if (elements) {
        editor.attachToDOM(elements);
    }
    
    return editor;
}

/**
 * Create an animated palette cycler with a preset animation
 * @param {Palette} palette - Source palette
 * @param {string} presetName - Animation preset name
 * @returns {PaletteCycler}
 */
export function createAnimatedPalette(palette, presetName = 'slow-rotate') {
    const { createPresetCycler } = require('./palette-cycling.js');
    return createPresetCycler(presetName, palette);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import PaletteEngineDefault from './palette-engine.js';
import PaletteEditorDefault from './palette-editor.js';
import GradientGeneratorDefault from './gradient-generator.js';
import PalettePresetsDefault from './palette-presets.js';
import PaletteCyclingDefault from './palette-cycling.js';

export default {
    ...PaletteEngineDefault,
    PaletteEditor: PaletteEditorDefault,
    GradientGenerator: GradientGeneratorDefault,
    ...PalettePresetsDefault,
    ...PaletteCyclingDefault,
    MODULE_INFO
};
