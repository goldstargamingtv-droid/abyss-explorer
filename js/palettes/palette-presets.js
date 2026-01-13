/**
 * ============================================================================
 * ABYSS EXPLORER - PALETTE PRESETS
 * ============================================================================
 * 
 * A massive library of 150+ carefully curated color palettes for fractal
 * visualization. Each palette is crafted to bring out the mathematical
 * beauty of fractal structures.
 * 
 * Palette Categories:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  🌈 RAINBOW & SPECTRUM    - Full spectrum and cycling palettes        │
 * │  🔥 FIRE & WARMTH         - Reds, oranges, yellows                   │
 * │  🌊 OCEAN & WATER         - Blues, teals, aquas                      │
 * │  🌲 NATURE & EARTH        - Greens, browns, natural tones            │
 * │  🌸 PASTEL & SOFT         - Gentle, dreamy colors                    │
 * │  ⚡ NEON & ELECTRIC       - Vibrant, high-saturation                 │
 * │  🌙 DARK & MYSTERIOUS     - Deep, moody palettes                     │
 * │  ❄️ ICE & FROST           - Cool whites, blues                       │
 * │  🌅 SUNSET & TWILIGHT     - Warm atmospheric gradients               │
 * │  💜 COSMIC & GALAXY       - Space-inspired themes                    │
 * │  🎭 CLASSIC FRACTAL       - Traditional fractal favorites            │
 * │  ⬛ MONOCHROMATIC         - Single-hue variations                    │
 * │  🎨 ARTISTIC              - Creative, expressive schemes             │
 * │  💎 METALLIC & JEWEL      - Precious metal and gem colors            │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Many palettes are inspired by the fractal art community (Ultra Fractal,
 * Kalles Fraktaler, XaoS) and classic mathematical visualizations.
 * 
 * @module palettes/palette-presets
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { Palette, INTERPOLATION, COLOR_SPACE, REPEAT_MODE } from './palette-engine.js';

// ============================================================================
// PALETTE DEFINITIONS
// ============================================================================

/**
 * Raw palette data - will be converted to Palette objects
 * Format: { name, author, category, tags, colors: [hex array], interpolation?, colorSpace? }
 */
const PALETTE_DATA = [

    // ========================================================================
    // 🌈 RAINBOW & SPECTRUM (15 palettes)
    // ========================================================================
    
    {
        name: 'Classic Rainbow',
        category: 'rainbow',
        tags: ['spectrum', 'vibrant', 'classic'],
        colors: ['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#8000ff']
    },
    {
        name: 'Soft Rainbow',
        category: 'rainbow',
        tags: ['spectrum', 'pastel', 'gentle'],
        colors: ['#ffb3b3', '#ffd9b3', '#ffffb3', '#b3ffb3', '#b3ffff', '#b3b3ff', '#e6b3ff']
    },
    {
        name: 'Electric Spectrum',
        category: 'rainbow',
        tags: ['neon', 'vibrant', 'electric'],
        colors: ['#ff0066', '#ff6600', '#ccff00', '#00ff66', '#00ffcc', '#0066ff', '#cc00ff']
    },
    {
        name: 'Prismatic Light',
        category: 'rainbow',
        tags: ['spectrum', 'light', 'crystal'],
        colors: ['#ff4d6d', '#ff8c42', '#fff275', '#6bff6b', '#42d6ff', '#4d79ff', '#b84dff']
    },
    {
        name: 'Double Rainbow',
        category: 'rainbow',
        tags: ['spectrum', 'double', 'cycling'],
        colors: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000']
    },
    {
        name: 'Chromatic Aberration',
        category: 'rainbow',
        tags: ['glitch', 'rgb', 'digital'],
        colors: ['#ff0040', '#ff0080', '#ff00ff', '#8000ff', '#0040ff', '#00ffff', '#00ff80']
    },
    {
        name: 'RGB Cycle',
        category: 'rainbow',
        tags: ['digital', 'rgb', 'primary'],
        colors: ['#ff0000', '#ff7f00', '#ffff00', '#7fff00', '#00ff00', '#00ff7f', '#00ffff', '#007fff', '#0000ff', '#7f00ff', '#ff00ff', '#ff007f']
    },
    {
        name: 'Neon Signs',
        category: 'rainbow',
        tags: ['neon', 'night', 'urban'],
        colors: ['#ff1493', '#00ff00', '#ff4500', '#00ffff', '#ff00ff', '#ffff00']
    },
    {
        name: 'Holographic',
        category: 'rainbow',
        tags: ['iridescent', 'metallic', 'shimmer'],
        colors: ['#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea', '#ff9aa2']
    },
    {
        name: 'Oil Slick',
        category: 'rainbow',
        tags: ['iridescent', 'dark', 'shimmer'],
        colors: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#ff9a3c', '#1a1a2e']
    },
    {
        name: 'Soap Bubble',
        category: 'rainbow',
        tags: ['iridescent', 'delicate', 'transparent'],
        colors: ['#f8e1f4', '#e0c3fc', '#a9def9', '#d0f4de', '#fcf6bd', '#ffd6e0', '#f8e1f4']
    },
    {
        name: 'Pride Flag',
        category: 'rainbow',
        tags: ['pride', 'bold', 'stripe'],
        colors: ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787']
    },
    {
        name: 'Candy Shop',
        category: 'rainbow',
        tags: ['sweet', 'bright', 'playful'],
        colors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#1dd1a1', '#5f27cd']
    },
    {
        name: 'Spectrum Fade',
        category: 'rainbow',
        tags: ['gradient', 'smooth', 'full'],
        colors: ['#ff0000', '#ff4000', '#ff8000', '#ffc000', '#ffff00', '#c0ff00', '#80ff00', '#40ff00', '#00ff00', '#00ff40', '#00ff80', '#00ffc0', '#00ffff', '#00c0ff', '#0080ff', '#0040ff', '#0000ff', '#4000ff', '#8000ff', '#c000ff', '#ff00ff', '#ff00c0', '#ff0080', '#ff0040']
    },
    {
        name: 'Visible Light',
        category: 'rainbow',
        tags: ['physics', 'spectrum', 'science'],
        colors: ['#380036', '#610061', '#0000ff', '#00ff00', '#ffff00', '#ff7f00', '#ff0000', '#700000']
    },

    // ========================================================================
    // 🔥 FIRE & WARMTH (15 palettes)
    // ========================================================================
    
    {
        name: 'Inferno',
        category: 'fire',
        tags: ['hot', 'intense', 'volcanic'],
        colors: ['#000000', '#1a0000', '#4d0000', '#800000', '#b30000', '#e60000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00', '#ffffff']
    },
    {
        name: 'Ember Glow',
        category: 'fire',
        tags: ['warm', 'cozy', 'ember'],
        colors: ['#1a0a00', '#331400', '#4d1f00', '#662900', '#803300', '#994d00', '#b36600', '#cc8000', '#e69900', '#ffb300']
    },
    {
        name: 'Solar Flare',
        category: 'fire',
        tags: ['sun', 'plasma', 'intense'],
        colors: ['#000000', '#330000', '#660000', '#990000', '#cc3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff66', '#ffffff']
    },
    {
        name: 'Volcanic Lava',
        category: 'fire',
        tags: ['lava', 'molten', 'volcanic'],
        colors: ['#0d0000', '#1a0500', '#330a00', '#4d1000', '#801a00', '#b32400', '#e62e00', '#ff4500', '#ff6b35', '#ff9566']
    },
    {
        name: 'Neon Fire',
        category: 'fire',
        tags: ['neon', 'hot', 'electric'],
        colors: ['#000000', '#330011', '#660022', '#990033', '#cc0044', '#ff0055', '#ff3366', '#ff6688', '#ff99aa', '#ffccdd']
    },
    {
        name: 'Autumn Blaze',
        category: 'fire',
        tags: ['autumn', 'fall', 'warm'],
        colors: ['#2d1b00', '#5c3d00', '#8b5a00', '#ba7700', '#e89400', '#ff9f1a', '#ffb347', '#ffc774', '#ffdba1', '#ffefd5']
    },
    {
        name: 'Phoenix Rising',
        category: 'fire',
        tags: ['mythical', 'rebirth', 'majestic'],
        colors: ['#0a0000', '#1f0000', '#3d0000', '#5c0000', '#7a0000', '#990000', '#b81500', '#d62a00', '#f44000', '#ff7700', '#ffaa00', '#ffdd00', '#ffff55']
    },
    {
        name: 'Campfire',
        category: 'fire',
        tags: ['cozy', 'night', 'warm'],
        colors: ['#0d0d0d', '#1a0f00', '#331f00', '#4d2f00', '#663f00', '#804f00', '#996600', '#b37700', '#cc8800', '#e69900', '#ffaa00', '#ffbb33']
    },
    {
        name: 'Sunset Orange',
        category: 'fire',
        tags: ['sunset', 'warm', 'orange'],
        colors: ['#1a0a05', '#331408', '#4d1f0a', '#66290d', '#80330f', '#993d12', '#b34714', '#cc5117', '#e65b19', '#ff6b35']
    },
    {
        name: 'Molten Gold',
        category: 'fire',
        tags: ['gold', 'metallic', 'rich'],
        colors: ['#1a1000', '#332000', '#4d3000', '#664000', '#805000', '#996600', '#b37700', '#cc8800', '#e6a800', '#ffc800', '#ffd700', '#ffe44d']
    },
    {
        name: 'Crimson Tide',
        category: 'fire',
        tags: ['red', 'deep', 'intense'],
        colors: ['#0d0000', '#1a0000', '#330000', '#4d0000', '#660000', '#800000', '#990000', '#b30000', '#cc0000', '#e60000']
    },
    {
        name: 'Dragon Breath',
        category: 'fire',
        tags: ['mythical', 'intense', 'powerful'],
        colors: ['#000000', '#0d0000', '#1a0500', '#330f00', '#4d1a00', '#662600', '#803300', '#994000', '#b34d00', '#cc5a00', '#e66700', '#ff7400', '#ff9126']
    },
    {
        name: 'Magma Flow',
        category: 'fire',
        tags: ['lava', 'flowing', 'hot'],
        colors: ['#000000', '#1a0000', '#330500', '#4d0a00', '#661000', '#801500', '#991a00', '#b32000', '#cc2600', '#e62b00', '#ff3100', '#ff5500', '#ff7700', '#ff9900']
    },
    {
        name: 'Desert Heat',
        category: 'fire',
        tags: ['desert', 'sand', 'warm'],
        colors: ['#3d2200', '#5c3600', '#7a4a00', '#995e00', '#b87200', '#d68600', '#f49a00', '#ffae1a', '#ffc247', '#ffd674', '#ffeaa1']
    },
    {
        name: 'Chili Pepper',
        category: 'fire',
        tags: ['spicy', 'bold', 'red'],
        colors: ['#1a0000', '#330000', '#4d0000', '#660500', '#800a00', '#991000', '#b31500', '#cc1a00', '#e62000', '#ff2500']
    },

    // ========================================================================
    // 🌊 OCEAN & WATER (15 palettes)
    // ========================================================================
    
    {
        name: 'Deep Ocean',
        category: 'ocean',
        tags: ['deep', 'mysterious', 'dark'],
        colors: ['#000510', '#001020', '#002040', '#003060', '#004080', '#0050a0', '#0060c0', '#0080d0', '#00a0e0', '#00c0f0']
    },
    {
        name: 'Tropical Lagoon',
        category: 'ocean',
        tags: ['tropical', 'clear', 'paradise'],
        colors: ['#004d4d', '#006666', '#008080', '#009999', '#00b3b3', '#00cccc', '#00e6e6', '#33ffff', '#66ffff', '#99ffff']
    },
    {
        name: 'Electric Seahorse',
        category: 'ocean',
        tags: ['electric', 'vibrant', 'neon', 'classic'],
        colors: ['#000033', '#000066', '#000099', '#0000cc', '#0033ff', '#0066ff', '#0099ff', '#00ccff', '#00ffff', '#33ffff', '#66ffff', '#99ffff', '#ccffff']
    },
    {
        name: 'Coral Reef',
        category: 'ocean',
        tags: ['coral', 'colorful', 'tropical'],
        colors: ['#003366', '#006699', '#0099cc', '#00cccc', '#33cc99', '#66cc66', '#99cc33', '#cccc00', '#ff9966', '#ff6699', '#ff3399']
    },
    {
        name: 'Abyssal Zone',
        category: 'ocean',
        tags: ['deep', 'dark', 'mysterious'],
        colors: ['#000005', '#00000a', '#000010', '#000020', '#000030', '#000040', '#001050', '#002060', '#003080', '#0050a0']
    },
    {
        name: 'Bioluminescence',
        category: 'ocean',
        tags: ['glow', 'deep sea', 'ethereal'],
        colors: ['#000010', '#000820', '#001030', '#002040', '#003366', '#004488', '#0066aa', '#0088cc', '#00aaee', '#00ccff', '#33ddff', '#66eeff', '#99ffff']
    },
    {
        name: 'Tidal Wave',
        category: 'ocean',
        tags: ['wave', 'power', 'dynamic'],
        colors: ['#001a33', '#00264d', '#003366', '#004080', '#004d99', '#0059b3', '#0066cc', '#0073e6', '#0080ff', '#1a8cff', '#3399ff', '#4da6ff', '#66b3ff', '#80c0ff', '#99ccff']
    },
    {
        name: 'Mediterranean',
        category: 'ocean',
        tags: ['coastal', 'warm', 'blue'],
        colors: ['#1a3d5c', '#265073', '#336699', '#407fbf', '#4d99cc', '#5cb3d9', '#73c2e0', '#8cd1e6', '#a6e0ec', '#c0f0f3']
    },
    {
        name: 'Arctic Waters',
        category: 'ocean',
        tags: ['cold', 'ice', 'pale'],
        colors: ['#e6f3ff', '#cce6ff', '#b3d9ff', '#99ccff', '#80c0ff', '#66b3ff', '#4da6ff', '#3399ff', '#1a8cff', '#0080ff']
    },
    {
        name: 'Seafoam',
        category: 'ocean',
        tags: ['foam', 'light', 'fresh'],
        colors: ['#2d5a5a', '#3d7373', '#4d8c8c', '#5ca6a6', '#6bbfbf', '#7ad9d9', '#8af2f2', '#9afafa', '#aafcfc', '#c0fefe']
    },
    {
        name: 'Moonlit Sea',
        category: 'ocean',
        tags: ['night', 'moonlight', 'silver'],
        colors: ['#0a0f1a', '#141e33', '#1e2d4d', '#283c66', '#324b80', '#3c5a99', '#4669b3', '#5078cc', '#5a87e6', '#7099f0']
    },
    {
        name: 'Whale Song',
        category: 'ocean',
        tags: ['deep', 'peaceful', 'serene'],
        colors: ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012', '#9b2226']
    },
    {
        name: 'Mermaid Scales',
        category: 'ocean',
        tags: ['fantasy', 'shimmer', 'iridescent'],
        colors: ['#003333', '#004d4d', '#006666', '#008080', '#009999', '#00b3b3', '#33cccc', '#66e6e6', '#99ffff', '#b3ffff', '#ccffff']
    },
    {
        name: 'Storm at Sea',
        category: 'ocean',
        tags: ['storm', 'dramatic', 'dark'],
        colors: ['#0a0f14', '#141e28', '#1e2d3c', '#283c50', '#324b64', '#3c5a78', '#46698c', '#5078a0', '#5a87b4', '#6496c8']
    },
    {
        name: 'Caribbean Dream',
        category: 'ocean',
        tags: ['tropical', 'vacation', 'clear'],
        colors: ['#006994', '#0088a8', '#00a7bc', '#00c6d0', '#28e5e4', '#50fff8', '#78fffc', '#a0ffff', '#c8ffff', '#f0ffff']
    },

    // ========================================================================
    // 🌲 NATURE & EARTH (15 palettes)
    // ========================================================================
    
    {
        name: 'Emerald Forest',
        category: 'nature',
        tags: ['forest', 'green', 'lush'],
        colors: ['#0d1a0d', '#1a331a', '#264d26', '#336633', '#408040', '#4d994d', '#5ab35a', '#66cc66', '#73e673', '#80ff80']
    },
    {
        name: 'Autumn Leaves',
        category: 'nature',
        tags: ['autumn', 'fall', 'warm'],
        colors: ['#1a0d00', '#331a00', '#4d2600', '#663300', '#804000', '#994d00', '#b35900', '#cc6600', '#e67300', '#ff8000', '#ff9933', '#ffb366']
    },
    {
        name: 'Spring Meadow',
        category: 'nature',
        tags: ['spring', 'fresh', 'flowers'],
        colors: ['#1a4d1a', '#2d662d', '#408040', '#539953', '#66b366', '#79cc79', '#8ce68c', '#9fff9f', '#b3ffb3', '#c6ffc6', '#d9ffd9']
    },
    {
        name: 'Mountain Earth',
        category: 'nature',
        tags: ['earth', 'mountain', 'stone'],
        colors: ['#1a1510', '#332a20', '#4d3f30', '#665440', '#806950', '#997e60', '#b39370', '#cca880', '#e6bd90', '#ffd2a0']
    },
    {
        name: 'Moss & Stone',
        category: 'nature',
        tags: ['moss', 'stone', 'texture'],
        colors: ['#2d2d2d', '#3d4030', '#4d5333', '#5d6636', '#6d7939', '#7d8c3c', '#8d9f3f', '#9db242', '#adc545', '#bdd848']
    },
    {
        name: 'Desert Sage',
        category: 'nature',
        tags: ['desert', 'sage', 'dusty'],
        colors: ['#4a4238', '#5c544a', '#6e665c', '#80786e', '#928a80', '#a49c92', '#b6aea4', '#c8c0b6', '#dad2c8', '#ece4da']
    },
    {
        name: 'Rainforest',
        category: 'nature',
        tags: ['tropical', 'lush', 'verdant'],
        colors: ['#041a00', '#0d3300', '#164d00', '#206600', '#298000', '#339900', '#3db300', '#47cc00', '#50e600', '#5aff00', '#73ff33']
    },
    {
        name: 'Midnight Garden',
        category: 'nature',
        tags: ['night', 'garden', 'mystery'],
        colors: ['#0a0f0a', '#141e14', '#1e2d1e', '#283c28', '#324b32', '#3c5a3c', '#466946', '#507850', '#5a875a', '#649664']
    },
    {
        name: 'Bamboo Grove',
        category: 'nature',
        tags: ['bamboo', 'asian', 'zen'],
        colors: ['#1a2610', '#2d4020', '#405a30', '#537340', '#668d50', '#79a660', '#8cc070', '#9fd980', '#b2f390', '#c6ffaa']
    },
    {
        name: 'Terracotta',
        category: 'nature',
        tags: ['clay', 'warm', 'earthy'],
        colors: ['#2d1a10', '#4d2d1a', '#6d4024', '#8d532e', '#ad6638', '#cd7942', '#e08c5a', '#e89f72', '#f0b28a', '#f8c5a2']
    },
    {
        name: 'Ocean Kelp',
        category: 'nature',
        tags: ['kelp', 'seaweed', 'green'],
        colors: ['#0d1a10', '#1a3320', '#264d30', '#336640', '#408050', '#4d9960', '#5ab370', '#66cc80', '#73e690', '#80ffa0']
    },
    {
        name: 'Wildflower',
        category: 'nature',
        tags: ['flowers', 'colorful', 'meadow'],
        colors: ['#663399', '#9966cc', '#cc99ff', '#ffccff', '#ff99cc', '#ff6699', '#ff9966', '#ffcc66', '#ffff99', '#ccff99', '#99ff99']
    },
    {
        name: 'Pine Forest',
        category: 'nature',
        tags: ['pine', 'evergreen', 'deep'],
        colors: ['#0a1a0d', '#142d1a', '#1e4027', '#285334', '#326641', '#3c794e', '#468c5b', '#509f68', '#5ab275', '#64c582']
    },
    {
        name: 'River Stone',
        category: 'nature',
        tags: ['stone', 'river', 'smooth'],
        colors: ['#363636', '#454545', '#545454', '#636363', '#727272', '#818181', '#909090', '#9f9f9f', '#aeaeae', '#bdbdbd']
    },
    {
        name: 'Cherry Blossom',
        category: 'nature',
        tags: ['sakura', 'spring', 'pink'],
        colors: ['#1a0d10', '#331a20', '#4d2730', '#663440', '#804150', '#994e60', '#b35b70', '#cc6880', '#e67590', '#ff82a0', '#ff9fb8', '#ffbcd0']
    },

    // ========================================================================
    // 🌸 PASTEL & SOFT (12 palettes)
    // ========================================================================
    
    {
        name: 'Pastel Dream',
        category: 'pastel',
        tags: ['soft', 'dreamy', 'gentle'],
        colors: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e0baff']
    },
    {
        name: 'Cotton Candy',
        category: 'pastel',
        tags: ['sweet', 'pink', 'blue'],
        colors: ['#ffb6c1', '#ffc0cb', '#ffd1dc', '#fde1e7', '#e8d5e5', '#d4c4e3', '#c0d4e1', '#b8e4ef']
    },
    {
        name: 'Baby Nursery',
        category: 'pastel',
        tags: ['baby', 'soft', 'gentle'],
        colors: ['#fce4d6', '#fceae1', '#fcf0ec', '#e8f4fc', '#d4e8fc', '#c0dcfc', '#b0d4fc', '#a0ccfc']
    },
    {
        name: 'Watercolor Wash',
        category: 'pastel',
        tags: ['watercolor', 'artistic', 'soft'],
        colors: ['#f0e6fa', '#e6f0fa', '#e6faf0', '#faf0e6', '#fae6f0', '#f0fae6']
    },
    {
        name: 'Lavender Fields',
        category: 'pastel',
        tags: ['lavender', 'purple', 'calm'],
        colors: ['#e6e6fa', '#d8d8f6', '#cacaf2', '#bcbcee', '#aeaeea', '#a0a0e6', '#9292e2', '#8484de']
    },
    {
        name: 'Mint Ice Cream',
        category: 'pastel',
        tags: ['mint', 'fresh', 'cool'],
        colors: ['#e8fdf5', '#d1fbeb', '#baf9e1', '#a3f7d7', '#8cf5cd', '#75f3c3', '#5ef1b9', '#47efaf']
    },
    {
        name: 'Peach Sorbet',
        category: 'pastel',
        tags: ['peach', 'warm', 'sweet'],
        colors: ['#fff5ee', '#ffe4d4', '#ffd3ba', '#ffc2a0', '#ffb186', '#ffa06c', '#ff8f52', '#ff7e38']
    },
    {
        name: 'Morning Mist',
        category: 'pastel',
        tags: ['mist', 'soft', 'ethereal'],
        colors: ['#f8f8ff', '#f0f0f8', '#e8e8f0', '#e0e0e8', '#d8d8e0', '#d0d0d8', '#c8c8d0', '#c0c0c8']
    },
    {
        name: 'Rose Garden',
        category: 'pastel',
        tags: ['rose', 'romantic', 'soft'],
        colors: ['#fff0f5', '#ffe4ec', '#ffd8e3', '#ffccda', '#ffc0d1', '#ffb4c8', '#ffa8bf', '#ff9cb6']
    },
    {
        name: 'Seashell',
        category: 'pastel',
        tags: ['beach', 'shell', 'delicate'],
        colors: ['#fff5ee', '#ffe8dc', '#ffdaca', '#ffcdb8', '#ffbfa6', '#ffb294', '#ffa482', '#ff9770']
    },
    {
        name: 'Easter Eggs',
        category: 'pastel',
        tags: ['easter', 'spring', 'colorful'],
        colors: ['#ffb5ba', '#ffe5b5', '#f5ffb5', '#b5ffba', '#b5e5ff', '#e5b5ff', '#ffb5e5']
    },
    {
        name: 'Macaron',
        category: 'pastel',
        tags: ['french', 'sweet', 'elegant'],
        colors: ['#f7cac9', '#f7ddc9', '#f7efc9', '#ddf7c9', '#c9f7dd', '#c9f7ef', '#c9ddf7', '#ddc9f7', '#efc9f7']
    },

    // ========================================================================
    // ⚡ NEON & ELECTRIC (12 palettes)
    // ========================================================================
    
    {
        name: 'Cyberpunk',
        category: 'neon',
        tags: ['cyber', 'futuristic', 'dark'],
        colors: ['#0d0d0d', '#1a0033', '#330066', '#4d0099', '#6600cc', '#8000ff', '#9933ff', '#b366ff', '#cc99ff', '#e6ccff']
    },
    {
        name: 'Tokyo Nights',
        category: 'neon',
        tags: ['tokyo', 'urban', 'night'],
        colors: ['#0a0a0a', '#1a0a1a', '#2a0a2a', '#ff00ff', '#ff33ff', '#ff66ff', '#00ffff', '#33ffff', '#66ffff']
    },
    {
        name: 'Arcade',
        category: 'neon',
        tags: ['retro', 'gaming', 'bright'],
        colors: ['#000000', '#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0080ff', '#8000ff', '#ff00ff']
    },
    {
        name: 'Synthwave',
        category: 'neon',
        tags: ['80s', 'retro', 'wave'],
        colors: ['#0d0221', '#1b0442', '#350880', '#7d00ff', '#c200ff', '#ff00c8', '#ff2d87', '#ff5a46', '#ff9e00']
    },
    {
        name: 'Electric Dreams',
        category: 'neon',
        tags: ['electric', 'vivid', 'intense'],
        colors: ['#000000', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ff0000', '#ffff00', '#ffffff']
    },
    {
        name: 'Laser Show',
        category: 'neon',
        tags: ['laser', 'concert', 'beams'],
        colors: ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#00ffff', '#ffff00', '#ff8000']
    },
    {
        name: 'Blacklight',
        category: 'neon',
        tags: ['uv', 'glow', 'party'],
        colors: ['#0a000a', '#1a001a', '#2a003a', '#3a005a', '#6000a0', '#8020c0', '#a040e0', '#c060ff', '#e080ff', '#ffa0ff']
    },
    {
        name: 'Vaporwave',
        category: 'neon',
        tags: ['aesthetic', 'retro', '90s'],
        colors: ['#01cdfe', '#05ffa1', '#b967ff', '#fffb96', '#ff71ce']
    },
    {
        name: 'Neon Genesis',
        category: 'neon',
        tags: ['anime', 'intense', 'dramatic'],
        colors: ['#000000', '#1a001a', '#330033', '#4d004d', '#800080', '#b300b3', '#e600e6', '#ff1aff', '#ff4dff', '#ff80ff']
    },
    {
        name: 'Digital Rain',
        category: 'neon',
        tags: ['matrix', 'code', 'green'],
        colors: ['#000000', '#001a00', '#003300', '#004d00', '#006600', '#008000', '#009900', '#00b300', '#00cc00', '#00ff00']
    },
    {
        name: 'Rave Party',
        category: 'neon',
        tags: ['party', 'rave', 'bright'],
        colors: ['#ff00ff', '#ff0080', '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff']
    },
    {
        name: 'Plasma',
        category: 'neon',
        tags: ['plasma', 'science', 'glow'],
        colors: ['#000020', '#000040', '#200060', '#400080', '#6000a0', '#8020c0', '#a040e0', '#c060ff', '#e080ff', '#ffa0ff', '#ffc0ff']
    },

    // ========================================================================
    // 🌙 DARK & MYSTERIOUS (12 palettes)
    // ========================================================================
    
    {
        name: 'Void',
        category: 'dark',
        tags: ['void', 'empty', 'deep'],
        colors: ['#000000', '#050508', '#0a0a10', '#0f0f18', '#141420', '#191928', '#1e1e30', '#232338', '#282840', '#2d2d48']
    },
    {
        name: 'Gothic Rose',
        category: 'dark',
        tags: ['gothic', 'romantic', 'dark'],
        colors: ['#0a0000', '#1a0005', '#2a000a', '#3a0010', '#4a0015', '#5a001a', '#6a0020', '#7a0025', '#8a002a', '#9a0030', '#aa0035']
    },
    {
        name: 'Midnight',
        category: 'dark',
        tags: ['night', 'deep', 'blue'],
        colors: ['#000005', '#00000a', '#000010', '#000015', '#00001a', '#000020', '#000025', '#00002a', '#000030', '#000035']
    },
    {
        name: 'Shadow Realm',
        category: 'dark',
        tags: ['shadow', 'realm', 'mystical'],
        colors: ['#050505', '#0a0a0a', '#0f0f0f', '#141414', '#191919', '#1e1e1e', '#232323', '#282828', '#2d2d2d', '#323232']
    },
    {
        name: 'Dark Matter',
        category: 'dark',
        tags: ['space', 'matter', 'physics'],
        colors: ['#000000', '#020204', '#040408', '#06060c', '#080810', '#0a0a14', '#0c0c18', '#0e0e1c', '#101020', '#121224']
    },
    {
        name: 'Obsidian',
        category: 'dark',
        tags: ['obsidian', 'volcanic', 'glass'],
        colors: ['#0a0a0a', '#121215', '#1a1a20', '#22222b', '#2a2a36', '#323241', '#3a3a4c', '#424257', '#4a4a62', '#52526d']
    },
    {
        name: 'Black Hole',
        category: 'dark',
        tags: ['space', 'gravity', 'intense'],
        colors: ['#000000', '#020102', '#040204', '#060306', '#080408', '#0a050a', '#0c060c', '#0e070e', '#100810', '#120912']
    },
    {
        name: 'Raven',
        category: 'dark',
        tags: ['bird', 'black', 'iridescent'],
        colors: ['#0a0a0a', '#0f0f12', '#14141a', '#191922', '#1e1e2a', '#232332', '#28283a', '#2d2d42', '#32324a', '#373752']
    },
    {
        name: 'Deep Purple',
        category: 'dark',
        tags: ['purple', 'royal', 'deep'],
        colors: ['#0a000a', '#140014', '#1e001e', '#280028', '#320032', '#3c003c', '#460046', '#500050', '#5a005a', '#640064']
    },
    {
        name: 'Starless Night',
        category: 'dark',
        tags: ['night', 'empty', 'dark'],
        colors: ['#000000', '#000002', '#000004', '#000006', '#000008', '#00000a', '#00000c', '#00000e', '#000010', '#000012']
    },
    {
        name: 'Demon Core',
        category: 'dark',
        tags: ['demon', 'intense', 'red'],
        colors: ['#000000', '#0a0000', '#140000', '#1e0000', '#280000', '#320000', '#3c0000', '#460000', '#500000', '#5a0000', '#640000']
    },
    {
        name: 'Onyx',
        category: 'dark',
        tags: ['gemstone', 'black', 'elegant'],
        colors: ['#0a0a0a', '#0d0d0d', '#101010', '#131313', '#161616', '#191919', '#1c1c1c', '#1f1f1f', '#222222', '#252525']
    },

    // ========================================================================
    // 💜 COSMIC & GALAXY (12 palettes)
    // ========================================================================
    
    {
        name: 'Nebula',
        category: 'cosmic',
        tags: ['nebula', 'space', 'colorful'],
        colors: ['#0a0010', '#1a0030', '#2a0050', '#400080', '#6000a0', '#8000c0', '#a000e0', '#c020ff', '#e040ff', '#ff60ff', '#ff80ff', '#ffa0ff']
    },
    {
        name: 'Galaxy Core',
        category: 'cosmic',
        tags: ['galaxy', 'center', 'intense'],
        colors: ['#000000', '#0a0010', '#140020', '#1e0030', '#280040', '#320050', '#3c0060', '#460070', '#500080', '#5a0090', '#6400a0', '#7800c0', '#8c00e0', '#a000ff']
    },
    {
        name: 'Northern Lights',
        category: 'cosmic',
        tags: ['aurora', 'arctic', 'dancing'],
        colors: ['#000510', '#001020', '#002040', '#004060', '#006080', '#0080a0', '#00a0c0', '#00c0e0', '#20e0c0', '#40ffa0', '#60ff80', '#80ff60']
    },
    {
        name: 'Cosmic Dust',
        category: 'cosmic',
        tags: ['dust', 'particles', 'ethereal'],
        colors: ['#0a0a14', '#14141e', '#1e1e28', '#282832', '#32323c', '#3c3c46', '#464650', '#50505a', '#5a5a64', '#64646e', '#6e6e78', '#787882']
    },
    {
        name: 'Supernova',
        category: 'cosmic',
        tags: ['explosion', 'star', 'intense'],
        colors: ['#000000', '#1a0000', '#330000', '#4d0000', '#660000', '#800000', '#990000', '#b30000', '#cc3300', '#e66600', '#ff9900', '#ffcc00', '#ffff00', '#ffffff']
    },
    {
        name: 'Event Horizon',
        category: 'cosmic',
        tags: ['black hole', 'boundary', 'physics'],
        colors: ['#000000', '#050005', '#0a000a', '#0f000f', '#140014', '#190019', '#1e001e', '#ff4000', '#ff8000', '#ffc000', '#ffff00', '#ffffff']
    },
    {
        name: 'Stardust',
        category: 'cosmic',
        tags: ['stars', 'dust', 'magical'],
        colors: ['#0a0a14', '#14142d', '#1e1e46', '#28285f', '#323278', '#3c3c91', '#4646aa', '#5050c3', '#5a5adc', '#6464f5', '#8080ff', '#a0a0ff', '#c0c0ff']
    },
    {
        name: 'Pulsar',
        category: 'cosmic',
        tags: ['pulsar', 'beacon', 'rotating'],
        colors: ['#000005', '#00000a', '#000010', '#000020', '#000040', '#000080', '#0000c0', '#0000ff', '#4040ff', '#8080ff', '#c0c0ff', '#ffffff']
    },
    {
        name: 'Quasar',
        category: 'cosmic',
        tags: ['quasar', 'distant', 'bright'],
        colors: ['#000000', '#0a0005', '#14000a', '#1e0010', '#280015', '#32001a', '#3c0020', '#460025', '#50002a', '#5a0030', '#c00060', '#ff0090', '#ff40c0', '#ff80f0', '#ffffff']
    },
    {
        name: 'Milky Way',
        category: 'cosmic',
        tags: ['galaxy', 'home', 'spiral'],
        colors: ['#000005', '#05050f', '#0a0a19', '#0f0f23', '#14142d', '#191937', '#1e1e41', '#23234b', '#282855', '#2d2d5f', '#323269', '#373773', '#3c3c7d']
    },
    {
        name: 'Solar Wind',
        category: 'cosmic',
        tags: ['sun', 'wind', 'particles'],
        colors: ['#000000', '#1a0a00', '#331400', '#4d1e00', '#662800', '#803200', '#993c00', '#b34600', '#cc5000', '#e65a00', '#ff6400', '#ff8c40', '#ffb480']
    },
    {
        name: 'Interstellar',
        category: 'cosmic',
        tags: ['space', 'travel', 'vast'],
        colors: ['#000000', '#000005', '#00000a', '#050010', '#0a0020', '#100030', '#150040', '#1a0050', '#200060', '#250070', '#2a0080', '#300090', '#3500a0']
    },

    // ========================================================================
    // 🎭 CLASSIC FRACTAL (15 palettes)
    // ========================================================================
    
    {
        name: 'Ultra Fractal Classic',
        category: 'classic',
        tags: ['uf', 'classic', 'traditional'],
        colors: ['#000764', '#206bcb', '#edffff', '#ffaa00', '#000764']
    },
    {
        name: 'Mandelbrot Original',
        category: 'classic',
        tags: ['mandelbrot', 'original', 'historic'],
        colors: ['#000000', '#000080', '#0000ff', '#00ffff', '#ffffff', '#ffff00', '#ff8000', '#ff0000', '#800000', '#000000']
    },
    {
        name: 'Blue Ice',
        category: 'classic',
        tags: ['ice', 'cold', 'classic'],
        colors: ['#000020', '#000040', '#000060', '#000080', '#0000a0', '#0000c0', '#0000e0', '#0000ff', '#4040ff', '#8080ff', '#c0c0ff', '#ffffff']
    },
    {
        name: 'Kalles Fraktaler',
        category: 'classic',
        tags: ['kf', 'software', 'deep zoom'],
        colors: ['#000000', '#1a0533', '#330a66', '#4d1099', '#6615cc', '#801aff', '#9933ff', '#b34dff', '#cc66ff', '#e680ff', '#ff99ff', '#ffb3ff', '#ffccff']
    },
    {
        name: 'XaoS Default',
        category: 'classic',
        tags: ['xaos', 'software', 'realtime'],
        colors: ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff']
    },
    {
        name: 'Fractint Fire',
        category: 'classic',
        tags: ['fractint', 'classic', 'fire'],
        colors: ['#000000', '#1a0000', '#330000', '#4d0000', '#660000', '#800000', '#990000', '#b30000', '#cc0000', '#e60000', '#ff0000', '#ff3300', '#ff6600', '#ff9900', '#ffcc00', '#ffff00']
    },
    {
        name: 'Electric Blue',
        category: 'classic',
        tags: ['electric', 'blue', 'vivid'],
        colors: ['#000000', '#000033', '#000066', '#000099', '#0000cc', '#0000ff', '#3333ff', '#6666ff', '#9999ff', '#ccccff', '#ffffff']
    },
    {
        name: 'Copper',
        category: 'classic',
        tags: ['copper', 'metallic', 'warm'],
        colors: ['#1a0f00', '#331e00', '#4d2d00', '#663c00', '#804b00', '#995a00', '#b36900', '#cc7800', '#e68700', '#ff9600', '#ffa519', '#ffb432', '#ffc34b']
    },
    {
        name: 'Violet Dreams',
        category: 'classic',
        tags: ['violet', 'purple', 'dream'],
        colors: ['#0a000a', '#1a001a', '#2a002a', '#3a003a', '#4a004a', '#5a005a', '#6a006a', '#7a007a', '#8a008a', '#9a009a', '#aa00aa', '#ba00ba', '#ca00ca', '#da00da', '#ea00ea', '#fa00fa']
    },
    {
        name: 'Green Machine',
        category: 'classic',
        tags: ['green', 'matrix', 'digital'],
        colors: ['#000000', '#001a00', '#003300', '#004d00', '#006600', '#008000', '#009900', '#00b300', '#00cc00', '#00e600', '#00ff00', '#33ff33', '#66ff66', '#99ff99']
    },
    {
        name: 'Twilight Zone',
        category: 'classic',
        tags: ['twilight', 'mysterious', 'transition'],
        colors: ['#0a0a1a', '#14142d', '#1e1e40', '#282853', '#323266', '#3c3c79', '#46468c', '#50509f', '#5a5ab2', '#6464c5', '#6e6ed8', '#7878eb', '#8282fe']
    },
    {
        name: 'Psychedelic',
        category: 'classic',
        tags: ['psychedelic', '60s', 'trippy'],
        colors: ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080']
    },
    {
        name: 'Smooth Interior',
        category: 'classic',
        tags: ['interior', 'smooth', 'dark'],
        colors: ['#000000', '#0a0005', '#14000a', '#1e0010', '#280015', '#32001a', '#3c0020', '#460025', '#50002a', '#5a0030']
    },
    {
        name: 'Distance Glow',
        category: 'classic',
        tags: ['distance', 'glow', 'boundary'],
        colors: ['#000000', '#001a1a', '#003333', '#004d4d', '#006666', '#008080', '#009999', '#00b3b3', '#00cccc', '#00e6e6', '#00ffff', '#33ffff', '#66ffff', '#99ffff', '#ccffff', '#ffffff']
    },
    {
        name: 'Iteration Bands',
        category: 'classic',
        tags: ['iteration', 'bands', 'stripes'],
        colors: ['#000000', '#330000', '#000033', '#003300', '#333300', '#330033', '#003333', '#333333', '#660000', '#000066', '#006600', '#666600', '#660066', '#006666', '#666666', '#990000']
    },

    // ========================================================================
    // 💎 METALLIC & JEWEL (12 palettes)
    // ========================================================================
    
    {
        name: 'Gold',
        category: 'metallic',
        tags: ['gold', 'precious', 'rich'],
        colors: ['#1a1000', '#332000', '#4d3000', '#664000', '#805000', '#996000', '#b37000', '#cc8000', '#e69000', '#ffa000', '#ffb020', '#ffc040', '#ffd060']
    },
    {
        name: 'Silver',
        category: 'metallic',
        tags: ['silver', 'metallic', 'cool'],
        colors: ['#404040', '#505050', '#606060', '#707070', '#808080', '#909090', '#a0a0a0', '#b0b0b0', '#c0c0c0', '#d0d0d0', '#e0e0e0', '#f0f0f0']
    },
    {
        name: 'Bronze',
        category: 'metallic',
        tags: ['bronze', 'antique', 'warm'],
        colors: ['#1a0f00', '#2d1a00', '#402600', '#533200', '#663e00', '#7a4a00', '#8d5600', '#a06200', '#b36e00', '#c67a00', '#d98600', '#ec9200']
    },
    {
        name: 'Rose Gold',
        category: 'metallic',
        tags: ['rose', 'gold', 'elegant'],
        colors: ['#3d2020', '#5c3030', '#7a4040', '#995050', '#b86060', '#d77070', '#f68080', '#ff9090', '#ffa0a0', '#ffb0b0', '#ffc0c0', '#ffd0d0']
    },
    {
        name: 'Ruby',
        category: 'metallic',
        tags: ['ruby', 'red', 'gemstone'],
        colors: ['#1a0000', '#330000', '#4d0000', '#660000', '#800000', '#990000', '#b30000', '#cc0000', '#e60000', '#ff0000', '#ff1a1a', '#ff3333', '#ff4d4d', '#ff6666']
    },
    {
        name: 'Emerald',
        category: 'metallic',
        tags: ['emerald', 'green', 'gemstone'],
        colors: ['#001a00', '#003300', '#004d00', '#006600', '#008000', '#009900', '#00b300', '#00cc00', '#00e600', '#00ff00', '#1aff1a', '#33ff33', '#4dff4d', '#66ff66']
    },
    {
        name: 'Sapphire',
        category: 'metallic',
        tags: ['sapphire', 'blue', 'gemstone'],
        colors: ['#00001a', '#000033', '#00004d', '#000066', '#000080', '#000099', '#0000b3', '#0000cc', '#0000e6', '#0000ff', '#1a1aff', '#3333ff', '#4d4dff', '#6666ff']
    },
    {
        name: 'Amethyst',
        category: 'metallic',
        tags: ['amethyst', 'purple', 'gemstone'],
        colors: ['#0a000a', '#1a001a', '#2a002a', '#3a003a', '#4a004a', '#5a005a', '#6a006a', '#7a007a', '#8a008a', '#9a009a', '#aa00aa', '#ba00ba', '#ca00ca']
    },
    {
        name: 'Topaz',
        category: 'metallic',
        tags: ['topaz', 'orange', 'gemstone'],
        colors: ['#1a0d00', '#331a00', '#4d2600', '#663300', '#804000', '#994d00', '#b35900', '#cc6600', '#e67300', '#ff8000', '#ff8c1a', '#ff9933', '#ffa64d']
    },
    {
        name: 'Diamond',
        category: 'metallic',
        tags: ['diamond', 'clear', 'sparkle'],
        colors: ['#d0d0d0', '#d8d8e0', '#e0e0f0', '#e8e8ff', '#f0f0ff', '#f8f8ff', '#ffffff', '#f8f8ff', '#f0f0ff', '#e8e8ff', '#e0e0f0', '#d8d8e0']
    },
    {
        name: 'Copper Patina',
        category: 'metallic',
        tags: ['copper', 'patina', 'aged'],
        colors: ['#1a3020', '#2d4030', '#405040', '#536050', '#667060', '#7a8070', '#8d9080', '#a0a090', '#b3b0a0', '#c6c0b0', '#00a080', '#00c0a0', '#00e0c0']
    },
    {
        name: 'Platinum',
        category: 'metallic',
        tags: ['platinum', 'precious', 'cool'],
        colors: ['#606068', '#707078', '#808088', '#909098', '#a0a0a8', '#b0b0b8', '#c0c0c8', '#d0d0d8', '#e0e0e8', '#f0f0f8']
    },

    // ========================================================================
    // ❄️ ICE & FROST (8 palettes)
    // ========================================================================
    
    {
        name: 'Arctic Ice',
        category: 'ice',
        tags: ['arctic', 'cold', 'blue'],
        colors: ['#e0f0ff', '#c0e0ff', '#a0d0ff', '#80c0ff', '#60b0ff', '#40a0ff', '#2090ff', '#0080ff', '#0070e0', '#0060c0', '#0050a0', '#004080']
    },
    {
        name: 'Frost Crystal',
        category: 'ice',
        tags: ['frost', 'crystal', 'delicate'],
        colors: ['#ffffff', '#f0f8ff', '#e0f0ff', '#d0e8ff', '#c0e0ff', '#b0d8ff', '#a0d0ff', '#90c8ff', '#80c0ff', '#70b8ff', '#60b0ff']
    },
    {
        name: 'Frozen Lake',
        category: 'ice',
        tags: ['frozen', 'lake', 'deep'],
        colors: ['#001020', '#002040', '#003060', '#004080', '#0050a0', '#0060c0', '#0080d0', '#00a0e0', '#00c0f0', '#40d0ff', '#80e0ff', '#c0f0ff']
    },
    {
        name: 'Winter Wonderland',
        category: 'ice',
        tags: ['winter', 'snow', 'magical'],
        colors: ['#e8f4fc', '#d0e8f8', '#b8dcf4', '#a0d0f0', '#88c4ec', '#70b8e8', '#58ace4', '#40a0e0', '#2894dc', '#1088d8']
    },
    {
        name: 'Glacier',
        category: 'ice',
        tags: ['glacier', 'massive', 'blue'],
        colors: ['#e0f8ff', '#c0f0ff', '#a0e8ff', '#80e0ff', '#60d8ff', '#40d0ff', '#20c8ff', '#00c0ff', '#00b0f0', '#00a0e0', '#0090d0', '#0080c0']
    },
    {
        name: 'Permafrost',
        category: 'ice',
        tags: ['permafrost', 'tundra', 'cold'],
        colors: ['#2a3a4a', '#3a4a5a', '#4a5a6a', '#5a6a7a', '#6a7a8a', '#7a8a9a', '#8a9aaa', '#9aaaba', '#aabaca', '#bacada', '#caeafa', '#dafaff']
    },
    {
        name: 'Ice Cave',
        category: 'ice',
        tags: ['cave', 'blue', 'mysterious'],
        colors: ['#0a1020', '#142030', '#1e3040', '#284050', '#325060', '#3c6070', '#467080', '#508090', '#5a90a0', '#64a0b0', '#6eb0c0', '#78c0d0']
    },
    {
        name: 'Snowflake',
        category: 'ice',
        tags: ['snowflake', 'delicate', 'white'],
        colors: ['#e8e8f0', '#f0f0f8', '#f8f8ff', '#ffffff', '#f8f8ff', '#f0f0f8', '#e8e8f0', '#e0e0e8', '#d8d8e0', '#d0d0d8']
    },

    // ========================================================================
    // 🌅 SUNSET & TWILIGHT (8 palettes)
    // ========================================================================
    
    {
        name: 'Golden Hour',
        category: 'sunset',
        tags: ['golden', 'warm', 'photography'],
        colors: ['#1a0500', '#331000', '#4d1a00', '#662500', '#803000', '#993a00', '#b34500', '#cc5000', '#e65a00', '#ff6500', '#ff8020', '#ff9a40', '#ffb560', '#ffd080']
    },
    {
        name: 'Sunset Beach',
        category: 'sunset',
        tags: ['beach', 'tropical', 'warm'],
        colors: ['#1a1030', '#2a1540', '#3a1a50', '#4d1f60', '#602470', '#802080', '#a01a80', '#c01070', '#e00060', '#ff0050', '#ff3060', '#ff6080', '#ff90a0', '#ffc0c0']
    },
    {
        name: 'Desert Dusk',
        category: 'sunset',
        tags: ['desert', 'dusk', 'warm'],
        colors: ['#1a1020', '#2d1830', '#402040', '#532850', '#663060', '#7a3870', '#8d4080', '#a04890', '#b350a0', '#c658b0', '#d960c0', '#ec68d0']
    },
    {
        name: 'Twilight Sky',
        category: 'sunset',
        tags: ['twilight', 'sky', 'gradient'],
        colors: ['#000510', '#001020', '#002040', '#003060', '#104080', '#2050a0', '#4060c0', '#6080d0', '#80a0e0', '#a0c0f0', '#c0e0ff', '#e0f0ff']
    },
    {
        name: 'Tropical Sunset',
        category: 'sunset',
        tags: ['tropical', 'vivid', 'warm'],
        colors: ['#0a0520', '#1a0a40', '#2a1060', '#3a1580', '#4d1aa0', '#6020c0', '#8030d0', '#a040e0', '#c050f0', '#e060ff', '#ff70ff', '#ff90ff']
    },
    {
        name: 'Afterglow',
        category: 'sunset',
        tags: ['afterglow', 'soft', 'warm'],
        colors: ['#1a1020', '#2d1a30', '#402440', '#532e50', '#663860', '#7a4270', '#8d4c80', '#a05690', '#b360a0', '#c66ab0', '#d974c0', '#ec7ed0']
    },
    {
        name: 'Purple Dusk',
        category: 'sunset',
        tags: ['purple', 'dusk', 'mysterious'],
        colors: ['#0a0510', '#140a20', '#1e1030', '#281540', '#321a50', '#3c2060', '#462570', '#502a80', '#5a3090', '#6435a0', '#6e3ab0', '#783fc0']
    },
    {
        name: 'Sunrise',
        category: 'sunset',
        tags: ['sunrise', 'morning', 'hope'],
        colors: ['#0a0510', '#140a18', '#1e1020', '#331828', '#4d2030', '#662838', '#803040', '#993848', '#b34050', '#cc4858', '#e65060', '#ff5868', '#ff7888', '#ff98a8', '#ffb8c8', '#ffd8e8']
    }
];

// ============================================================================
// PALETTE CREATION
// ============================================================================

/**
 * Convert raw palette data to Palette objects
 * @param {Object} data - Raw palette data
 * @returns {Palette}
 */
function createPaletteFromData(data) {
    return new Palette({
        id: data.name.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        author: data.author || 'Abyss Explorer',
        category: data.category,
        tags: data.tags || [],
        colors: data.colors,
        interpolation: data.interpolation || INTERPOLATION.SMOOTH,
        colorSpace: data.colorSpace || COLOR_SPACE.RGB,
        repeatMode: data.repeatMode || REPEAT_MODE.REPEAT
    });
}

// ============================================================================
// PALETTE PRESETS OBJECT
// ============================================================================

/**
 * All palette presets organized by category
 */
export const PALETTE_PRESETS = {};

/**
 * Flat array of all palettes
 */
export const ALL_PALETTES = [];

/**
 * Palette lookup by ID
 */
export const PALETTE_BY_ID = {};

/**
 * Palette lookup by category
 */
export const PALETTES_BY_CATEGORY = {};

// Initialize palettes
PALETTE_DATA.forEach(data => {
    const palette = createPaletteFromData(data);
    
    ALL_PALETTES.push(palette);
    PALETTE_BY_ID[palette.id] = palette;
    
    if (!PALETTES_BY_CATEGORY[palette.category]) {
        PALETTES_BY_CATEGORY[palette.category] = [];
    }
    PALETTES_BY_CATEGORY[palette.category].push(palette);
});

// ============================================================================
// CATEGORY INFO
// ============================================================================

export const CATEGORIES = {
    rainbow: { name: 'Rainbow & Spectrum', icon: '🌈', description: 'Full spectrum and cycling palettes' },
    fire: { name: 'Fire & Warmth', icon: '🔥', description: 'Reds, oranges, yellows' },
    ocean: { name: 'Ocean & Water', icon: '🌊', description: 'Blues, teals, aquas' },
    nature: { name: 'Nature & Earth', icon: '🌲', description: 'Greens, browns, natural tones' },
    pastel: { name: 'Pastel & Soft', icon: '🌸', description: 'Gentle, dreamy colors' },
    neon: { name: 'Neon & Electric', icon: '⚡', description: 'Vibrant, high-saturation' },
    dark: { name: 'Dark & Mysterious', icon: '🌙', description: 'Deep, moody palettes' },
    cosmic: { name: 'Cosmic & Galaxy', icon: '💜', description: 'Space-inspired themes' },
    classic: { name: 'Classic Fractal', icon: '🎭', description: 'Traditional fractal favorites' },
    metallic: { name: 'Metallic & Jewel', icon: '💎', description: 'Precious metal and gem colors' },
    ice: { name: 'Ice & Frost', icon: '❄️', description: 'Cool whites, blues' },
    sunset: { name: 'Sunset & Twilight', icon: '🌅', description: 'Warm atmospheric gradients' }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get palette by ID
 * @param {string} id - Palette ID
 * @returns {Palette|null}
 */
export function getPaletteById(id) {
    return PALETTE_BY_ID[id] || null;
}

/**
 * Get palettes by category
 * @param {string} category - Category name
 * @returns {Palette[]}
 */
export function getPalettesByCategory(category) {
    return PALETTES_BY_CATEGORY[category] || [];
}

/**
 * Search palettes by name or tags
 * @param {string} query - Search query
 * @returns {Palette[]}
 */
export function searchPalettes(query) {
    const lowerQuery = query.toLowerCase();
    return ALL_PALETTES.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Get random palette
 * @param {string} category - Optional category filter
 * @returns {Palette}
 */
export function getRandomPalette(category = null) {
    const palettes = category ? PALETTES_BY_CATEGORY[category] : ALL_PALETTES;
    const index = Math.floor(Math.random() * palettes.length);
    return palettes[index].clone();
}

/**
 * Get palette count
 * @returns {number}
 */
export function getPaletteCount() {
    return ALL_PALETTES.length;
}

/**
 * Get all category names
 * @returns {string[]}
 */
export function getCategoryNames() {
    return Object.keys(CATEGORIES);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
};
