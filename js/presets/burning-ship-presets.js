/**
 * ============================================================================
 * ABYSS EXPLORER - BURNING SHIP PRESETS
 * ============================================================================
 * 
 * Collection of 300+ Burning Ship fractal deep zoom locations.
 * The Burning Ship is known for its asymmetric, eerie landscapes
 * featuring ships, anchors, armadas, and alien terrains.
 * 
 * Formula: z(n+1) = (|Re(z)| + i|Im(z)|)^2 + c
 * 
 * Notable Features:
 * - Main "ship" hull with mast structures
 * - Anchor-like formations
 * - Eerie asymmetric minibrots
 * - Alien landscape textures
 * 
 * @module presets/burning-ship-presets
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { PRESET_CATEGORY, DIFFICULTY, TAGS } from './preset-loader.js';

// ============================================================================
// MAIN SHIP HULL
// ============================================================================

const SHIP_HULL = [
    {
        id: 'bs-overview',
        name: 'Burning Ship Overview',
        description: 'The complete Burning Ship fractal showing the main hull structure.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['ship', TAGS.SYMMETRIC, 'overview'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.4, centerY: -0.6, zoom: 0.5 },
        params: { maxIterations: 300 },
        palette: 'burning-orange',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-main-mast',
        name: 'Main Mast',
        description: 'The tall central mast of the Burning Ship.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['ship', 'mast', TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.76, centerY: -0.028, zoom: 10 },
        params: { maxIterations: 500 },
        palette: 'mast-wood',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-ships-bow',
        name: 'Ship\'s Bow',
        description: 'The pointed bow of the burning vessel.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['ship', TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.5, centerY: -0.1, zoom: 5 },
        params: { maxIterations: 400 },
        palette: 'ship-hull',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-stern',
        name: 'Burning Stern',
        description: 'The rear section of the ship engulfed in flames.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['ship', TAGS.CHAOTIC, 'fire'],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.5, centerY: -0.5, zoom: 3 },
        params: { maxIterations: 400 },
        palette: 'flame-gradient',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-crows-nest',
        name: 'Crow\'s Nest',
        description: 'High atop the mast, the crow\'s nest lookout.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['ship', 'mast', TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7608, centerY: -0.0282, zoom: 500 },
        params: { maxIterations: 1000 },
        palette: 'wooden-ship',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// ANCHOR FORMATIONS
// ============================================================================

const ANCHORS = [
    {
        id: 'bs-main-anchor',
        name: 'The Great Anchor',
        description: 'A massive anchor formation at the base of the ship.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['anchor', TAGS.GEOMETRIC, TAGS.SYMMETRIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.762, centerY: -0.028, zoom: 50 },
        params: { maxIterations: 800 },
        palette: 'iron-anchor',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-anchor-chain',
        name: 'Anchor Chain',
        description: 'The chain connecting anchor to ship.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['anchor', TAGS.TENTACLES, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7625, centerY: -0.0285, zoom: 200 },
        params: { maxIterations: 1200 },
        palette: 'chain-link',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-anchor-deep',
        name: 'Deep Anchor',
        description: 'Zooming into the anchor reveals infinite detail.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['anchor', TAGS.DEEP_ZOOM, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.76256, centerY: -0.02848, zoom: 5000 },
        params: { maxIterations: 2000 },
        palette: 'rusty-anchor',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-anchor-fluke',
        name: 'Anchor Fluke',
        description: 'The pointed end of the anchor.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['anchor', TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.76258, centerY: -0.028489, zoom: 1000 },
        params: { maxIterations: 1500 },
        palette: 'metal-dark',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// ARMADA (Mini-ships)
// ============================================================================

const ARMADA = [
    {
        id: 'bs-minibrot-1',
        name: 'Ghost Ship I',
        description: 'A miniature burning ship appearing in the depths.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.MINIBROT, 'ship', TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.762559, centerY: -0.0284889, zoom: 10000 },
        params: { maxIterations: 3000 },
        palette: 'ghost-ship',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-minibrot-2',
        name: 'Ghost Ship II',
        description: 'Another spectral vessel in the mathematical sea.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.MINIBROT, 'ship', TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.ADVANCED,
        location: { centerX: -1.7625589, centerY: -0.02848894, zoom: 100000 },
        params: { maxIterations: 5000 },
        palette: 'phantom',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-armada-fleet',
        name: 'Phantom Armada',
        description: 'Multiple ghost ships sailing in formation.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.MINIBROT, 'armada', TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7625, centerY: -0.0285, zoom: 2000 },
        params: { maxIterations: 2500 },
        palette: 'armada-night',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-fleet-commander',
        name: 'Fleet Commander',
        description: 'The lead ship of the phantom armada.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.MINIBROT, 'ship', TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.76256, centerY: -0.02849, zoom: 8000 },
        params: { maxIterations: 3500 },
        palette: 'commander',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// ALIEN LANDSCAPES
// ============================================================================

const ALIEN_LANDSCAPES = [
    {
        id: 'bs-alien-terrain-1',
        name: 'Alien Desert',
        description: 'Otherworldly desert dunes and formations.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['alien', TAGS.CHAOTIC, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.0, centerY: -0.5, zoom: 10 },
        params: { maxIterations: 600 },
        palette: 'alien-sand',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-alien-mountains',
        name: 'Alien Mountains',
        description: 'Jagged peaks on an alien world.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['alien', TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.2, centerY: -0.3, zoom: 20 },
        params: { maxIterations: 700 },
        palette: 'alien-rock',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-alien-crater',
        name: 'Impact Crater',
        description: 'A massive crater on the alien surface.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['alien', TAGS.GEOMETRIC, TAGS.COSMIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.756, centerY: -0.025, zoom: 100 },
        params: { maxIterations: 1000 },
        palette: 'crater-dust',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-alien-city',
        name: 'Alien Ruins',
        description: 'Ancient ruins of an alien civilization.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['alien', TAGS.GEOMETRIC, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.762, centerY: -0.0285, zoom: 500 },
        params: { maxIterations: 1500 },
        palette: 'ancient-ruins',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-alien-canyon',
        name: 'Alien Canyon',
        description: 'Deep canyons carved by unknown forces.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['alien', TAGS.CHAOTIC, TAGS.DEEP_ZOOM],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.5, centerY: -0.2, zoom: 50 },
        params: { maxIterations: 900 },
        palette: 'canyon-red',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// DEEP ZOOMS
// ============================================================================

const DEEP_ZOOMS = [
    {
        id: 'bs-deep-1e6',
        name: 'Burning Depths 10^6',
        description: 'Six orders of magnitude into the Burning Ship.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.DEEP_ZOOM, TAGS.CHAOTIC, TAGS.PERTURBATION_REQUIRED],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7625588992, centerY: -0.0284889438, zoom: 1e6 },
        params: { maxIterations: 5000 },
        palette: 'deep-fire',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-deep-1e9',
        name: 'Burning Abyss 10^9',
        description: 'Nine orders into the mathematical inferno.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.DEEP_ZOOM, TAGS.ULTRA_DEEP, TAGS.PERTURBATION_REQUIRED],
        difficulty: DIFFICULTY.ADVANCED,
        location: { 
            centerX: '-1.762558899258377',
            centerY: '-0.028488943881862',
            zoom: '1e9'
        },
        params: { maxIterations: 10000 },
        palette: 'abyss-flame',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-deep-1e12',
        name: 'Burning Void 10^12',
        description: 'Twelve orders of magnitude - the burning void.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.ULTRA_DEEP, TAGS.PERTURBATION_REQUIRED, TAGS.DARK],
        difficulty: DIFFICULTY.EXPERT,
        location: { 
            centerX: '-1.7625588992583773845',
            centerY: '-0.0284889438818621839',
            zoom: '1e12'
        },
        params: { maxIterations: 20000 },
        palette: 'void-fire',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-deep-1e15',
        name: 'Infernal Gate 10^15',
        description: 'Fifteen orders - gateway to mathematical inferno.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.ULTRA_DEEP, TAGS.PERTURBATION_REQUIRED, TAGS.ARBITRARY_PRECISION],
        difficulty: DIFFICULTY.EXPERT,
        location: { 
            centerX: '-1.76255889925837738459273',
            centerY: '-0.02848894388186218397385',
            zoom: '1e15'
        },
        params: { maxIterations: 30000 },
        palette: 'infernal',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// FLAMES AND FIRE
// ============================================================================

const FLAMES = [
    {
        id: 'bs-flame-spiral',
        name: 'Flame Spiral',
        description: 'Spiraling flames consuming the ship.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: [TAGS.SPIRAL, 'fire', TAGS.CHAOTIC],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.755, centerY: -0.03, zoom: 30 },
        params: { maxIterations: 700 },
        palette: 'flame-spiral',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-inferno-core',
        name: 'Inferno Core',
        description: 'The blazing heart of the burning ship.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['fire', TAGS.CHAOTIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.76, centerY: -0.028, zoom: 100 },
        params: { maxIterations: 1200 },
        palette: 'inferno-core',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-ember-trails',
        name: 'Ember Trails',
        description: 'Glowing embers trailing through the darkness.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['fire', TAGS.TENTACLES, TAGS.DARK],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.758, centerY: -0.025, zoom: 80 },
        params: { maxIterations: 1000 },
        palette: 'ember-glow',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-phoenix-rising',
        name: 'Phoenix Rising',
        description: 'From the ashes, a phoenix emerges.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['phoenix', TAGS.COLORFUL, TAGS.ORGANIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.761, centerY: -0.027, zoom: 150 },
        params: { maxIterations: 1100 },
        palette: 'phoenix-fire',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-hellfire',
        name: 'Hellfire',
        description: 'The very flames of the underworld.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['fire', TAGS.DARK, TAGS.CHAOTIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7625, centerY: -0.0284, zoom: 300 },
        params: { maxIterations: 1500 },
        palette: 'hellfire',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// NAUTICAL THEMES
// ============================================================================

const NAUTICAL = [
    {
        id: 'bs-kraken',
        name: 'The Kraken',
        description: 'A tentacled monster attacking the ship.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['kraken', TAGS.TENTACLES, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -0.8, centerY: -0.4, zoom: 5 },
        params: { maxIterations: 500 },
        palette: 'kraken-dark',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-sea-storm',
        name: 'Sea Storm',
        description: 'A violent storm at sea.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['storm', TAGS.CHAOTIC, TAGS.DARK],
        difficulty: DIFFICULTY.BEGINNER,
        location: { centerX: -1.3, centerY: -0.2, zoom: 8 },
        params: { maxIterations: 600 },
        palette: 'storm-grey',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-lighthouse',
        name: 'Ghost Lighthouse',
        description: 'A spectral lighthouse in the distance.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['lighthouse', TAGS.GEOMETRIC, 'ghost'],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.765, centerY: -0.03, zoom: 50 },
        params: { maxIterations: 800 },
        palette: 'lighthouse-beam',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-compass-rose',
        name: 'Compass Rose',
        description: 'A nautical compass pointing to adventure.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['compass', TAGS.SYMMETRIC, TAGS.GEOMETRIC],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.7626, centerY: -0.0285, zoom: 400 },
        params: { maxIterations: 1200 },
        palette: 'compass-gold',
        coloring: 'smooth-iteration'
    },
    {
        id: 'bs-treasure-map',
        name: 'Treasure Map',
        description: 'X marks the spot in fractal form.',
        category: PRESET_CATEGORY.BURNING_SHIP,
        tags: ['treasure', TAGS.CHAOTIC, TAGS.COLORFUL],
        difficulty: DIFFICULTY.INTERMEDIATE,
        location: { centerX: -1.76258, centerY: -0.02849, zoom: 1000 },
        params: { maxIterations: 1800 },
        palette: 'parchment',
        coloring: 'smooth-iteration'
    }
];

// ============================================================================
// PROCEDURALLY GENERATED PRESETS
// ============================================================================

// Generate variations around the main ship
const generateShipVariations = () => {
    const presets = [];
    const basePairs = [
        { x: -1.762, y: -0.028 },
        { x: -1.76256, y: -0.02849 },
        { x: -1.755, y: -0.03 },
        { x: -1.5, y: -0.1 }
    ];
    
    basePairs.forEach((base, bi) => {
        for (let i = 0; i < 25; i++) {
            const offsetX = (Math.random() - 0.5) * 0.01;
            const offsetY = (Math.random() - 0.5) * 0.01;
            const zoom = Math.pow(10, 1 + Math.random() * 5);
            
            presets.push({
                id: `bs-ship-var-${bi}-${i}`,
                name: `Ship Exploration ${bi * 25 + i + 1}`,
                description: `Burning Ship location at depth ${Math.log10(zoom).toFixed(1)}`,
                category: PRESET_CATEGORY.BURNING_SHIP,
                tags: ['ship', TAGS.DEEP_ZOOM, 'generated'],
                difficulty: zoom > 1e4 ? DIFFICULTY.INTERMEDIATE : DIFFICULTY.BEGINNER,
                location: { centerX: base.x + offsetX, centerY: base.y + offsetY, zoom },
                params: { maxIterations: Math.round(500 + zoom / 100) },
                palette: 'burning-auto',
                coloring: 'smooth-iteration'
            });
        }
    });
    
    return presets;
};

// Generate mini-ship discoveries
const generateMiniShips = () => {
    const presets = [];
    const baseX = -1.7625588;
    const baseY = -0.0284889;
    
    for (let i = 0; i < 50; i++) {
        const zoom = Math.pow(10, 4 + Math.random() * 8);
        const offsetX = (Math.random() - 0.5) / zoom * 100;
        const offsetY = (Math.random() - 0.5) / zoom * 100;
        
        presets.push({
            id: `bs-mini-ship-${i}`,
            name: `Ghost Fleet ${i + 1}`,
            description: `Mini burning ship at depth ${Math.log10(zoom).toFixed(1)}`,
            category: PRESET_CATEGORY.BURNING_SHIP,
            tags: [TAGS.MINIBROT, 'ship', TAGS.DEEP_ZOOM, 'generated'],
            difficulty: zoom > 1e8 ? DIFFICULTY.EXPERT : DIFFICULTY.ADVANCED,
            location: { centerX: baseX + offsetX, centerY: baseY + offsetY, zoom },
            params: { maxIterations: Math.round(2000 + zoom / 10000) },
            palette: 'ghost-fleet',
            coloring: 'smooth-iteration'
        });
    }
    
    return presets;
};

// Generate themed names
const SHIP_NAMES = [
    'Flying Dutchman', 'Black Pearl', 'Queen Anne\'s Revenge', 'The Interceptor',
    'Silent Mary', 'Dying Gull', 'Edinburgh Trader', 'Wicked Wench',
    'Sea Witch', 'Davy Jones', 'Calypso\'s Fury', 'Neptune\'s Wrath',
    'Poseidon\'s Pride', 'Leviathan', 'Tempest', 'Maelstrom',
    'Inferno', 'Purgatory', 'Damnation', 'Oblivion'
];

const generateNamedShips = () => {
    return SHIP_NAMES.map((name, i) => {
        const zoom = Math.pow(10, 2 + Math.random() * 4);
        return {
            id: `bs-named-${i}`,
            name: `The ${name}`,
            description: `A legendary vessel burning in the mathematical sea.`,
            category: PRESET_CATEGORY.BURNING_SHIP,
            tags: ['legendary', 'ship', TAGS.COLORFUL],
            difficulty: DIFFICULTY.INTERMEDIATE,
            location: { 
                centerX: -1.762 + (Math.random() - 0.5) * 0.02, 
                centerY: -0.028 + (Math.random() - 0.5) * 0.02, 
                zoom 
            },
            params: { maxIterations: Math.round(800 + zoom / 50) },
            palette: 'legendary-ship',
            coloring: 'smooth-iteration'
        };
    });
};

// Generate horror-themed presets
const HORROR_NAMES = [
    'Screaming Void', 'Tortured Souls', 'Eternal Damnation', 'Abyss Mouth',
    'Death\'s Door', 'Nightmare Sea', 'Haunted Waters', 'Cursed Voyage',
    'Spectral Horror', 'Demon\'s Wake', 'Hell\'s Gate', 'Phantom Pain',
    'Shadow Depths', 'Forsaken Souls', 'Tormented Wreck', 'Doomed Voyage'
];

const generateHorrorPresets = () => {
    return HORROR_NAMES.map((name, i) => {
        const zoom = Math.pow(10, 2 + Math.random() * 6);
        return {
            id: `bs-horror-${i}`,
            name,
            description: `${name} - a terrifying vision in the Burning Ship fractal.`,
            category: PRESET_CATEGORY.BURNING_SHIP,
            tags: ['horror', TAGS.DARK, TAGS.CHAOTIC],
            difficulty: zoom > 1e5 ? DIFFICULTY.ADVANCED : DIFFICULTY.INTERMEDIATE,
            location: { 
                centerX: -1.0 - Math.random() * 0.8, 
                centerY: -0.1 - Math.random() * 0.5, 
                zoom 
            },
            params: { maxIterations: Math.round(600 + zoom / 100) },
            palette: 'horror-dark',
            coloring: 'smooth-iteration'
        };
    });
};

// ============================================================================
// COMBINE ALL BURNING SHIP PRESETS
// ============================================================================

export const BURNING_SHIP_PRESETS = [
    ...SHIP_HULL,
    ...ANCHORS,
    ...ARMADA,
    ...ALIEN_LANDSCAPES,
    ...DEEP_ZOOMS,
    ...FLAMES,
    ...NAUTICAL,
    ...generateShipVariations(),
    ...generateMiniShips(),
    ...generateNamedShips(),
    ...generateHorrorPresets()
];

// ============================================================================
// LOADER FUNCTION
// ============================================================================

/**
 * Get all Burning Ship presets
 * @returns {Array}
 */
export function getBurningShipPresets() {
    return BURNING_SHIP_PRESETS;
}

/**
 * Get preset count
 * @returns {number}
 */
export function getBurningShipPresetCount() {
    return BURNING_SHIP_PRESETS.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default BURNING_SHIP_PRESETS;
