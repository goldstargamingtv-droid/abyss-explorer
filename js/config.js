/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                       ABYSS EXPLORER - CONFIGURATION                          ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Global configuration object with defaults and runtime settings               ║
 * ║                                                                                ║
 * ║  Categories:                                                                   ║
 * ║  - Rendering: iterations, bailout, precision, tile size                       ║
 * ║  - Performance: workers, caching, adaptive quality                            ║
 * ║  - Fractals: default parameters for each fractal type                         ║
 * ║  - Coloring: algorithms, palettes, smoothing                                  ║
 * ║  - UI: sidebar, HUD, tooltips, animations                                     ║
 * ║  - 3D: raymarching, lighting, camera                                          ║
 * ║  - Export: formats, quality presets                                           ║
 * ║  - Feature flags: enable/disable experimental features                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// VERSION INFO
// =============================================================================

const VERSION = '1.0.0';
const BUILD_DATE = '2026-01-13';

// =============================================================================
// CONFIGURATION OBJECT
// =============================================================================

/**
 * Global Configuration
 * 
 * All configuration values are organized by category.
 * Values can be modified at runtime and persisted to storage.
 * 
 * @namespace Config
 */
const Config = {
    // =========================================================================
    // META
    // =========================================================================
    
    /** @type {string} Application version */
    version: VERSION,
    
    /** @type {string} Build date */
    buildDate: BUILD_DATE,
    
    /** @type {Object} Browser capabilities (set at runtime) */
    capabilities: {
        webgl2: false,
        webgl: false,
        workers: false,
        bigint: false,
        sharedArrayBuffer: false,
        offscreenCanvas: false,
        wasm: false
    },

    // =========================================================================
    // RENDERING CONFIGURATION
    // =========================================================================
    
    rendering: {
        /**
         * Maximum iterations for escape-time algorithms
         * Higher = more detail but slower
         * @type {number}
         */
        maxIterations: 500,
        
        /**
         * Minimum iterations (for adaptive rendering)
         * @type {number}
         */
        minIterations: 50,
        
        /**
         * Iteration presets for quick selection
         * @type {number[]}
         */
        iterationPresets: [100, 250, 500, 1000, 2500, 5000, 10000],
        
        /**
         * Bailout radius squared (escape threshold)
         * @type {number}
         */
        bailout: 4.0,
        
        /**
         * Bailout presets
         * @type {number[]}
         */
        bailoutPresets: [4, 16, 100, 1000, 10000],
        
        /**
         * Precision mode for deep zoom
         * 'double' = standard 64-bit floating point
         * 'perturbation' = perturbation theory for deep zoom
         * 'arbitrary' = arbitrary precision (slowest)
         * @type {'double'|'perturbation'|'arbitrary'}
         */
        precisionMode: 'double',
        
        /**
         * Zoom threshold to switch to perturbation theory
         * @type {number}
         */
        perturbationThreshold: 1e13,
        
        /**
         * Tile size for chunked rendering (power of 2)
         * @type {number}
         */
        tileSize: 256,
        
        /**
         * Progressive rendering passes
         * Each pass doubles resolution
         * @type {number}
         */
        progressivePasses: 4,
        
        /**
         * Enable progressive rendering
         * @type {boolean}
         */
        progressiveRendering: true,
        
        /**
         * Enable anti-aliasing (supersampling)
         * @type {boolean}
         */
        antialiasing: true,
        
        /**
         * Supersampling level (1 = off, 2 = 2x2, 4 = 4x4)
         * @type {number}
         */
        supersamplingLevel: 2,
        
        /**
         * Enable smooth iteration coloring
         * @type {boolean}
         */
        smoothColoring: true,
        
        /**
         * Enable distance estimation (for boundary detection)
         * @type {boolean}
         */
        distanceEstimation: true,
        
        /**
         * Interior detection method
         * 'none' = black interior
         * 'period' = color by period
         * 'distance' = distance to boundary
         * @type {'none'|'period'|'distance'}
         */
        interiorMode: 'none',
        
        /**
         * Enable WebGL acceleration
         * @type {boolean}
         */
        useWebGL: true,
        
        /**
         * Use texture-based rendering in WebGL
         * @type {boolean}
         */
        useTextureRendering: true
    },

    // =========================================================================
    // PERFORMANCE CONFIGURATION
    // =========================================================================
    
    performance: {
        /**
         * Number of Web Workers to use
         * 0 = auto-detect based on CPU cores
         * @type {number}
         */
        workerCount: 0,
        
        /**
         * Maximum worker count (cap for auto-detection)
         * @type {number}
         */
        maxWorkers: 16,
        
        /**
         * Enable adaptive quality based on FPS
         * @type {boolean}
         */
        adaptiveQuality: true,
        
        /**
         * Target FPS for adaptive quality
         * @type {number}
         */
        targetFPS: 30,
        
        /**
         * Minimum acceptable FPS before quality reduction
         * @type {number}
         */
        minFPS: 15,
        
        /**
         * Enable tile caching
         * @type {boolean}
         */
        tileCache: true,
        
        /**
         * Maximum cache size in MB
         * @type {number}
         */
        maxCacheSize: 256,
        
        /**
         * Enable GPU acceleration where available
         * @type {boolean}
         */
        useGPU: true,
        
        /**
         * Enable SharedArrayBuffer for better threading
         * @type {boolean}
         */
        useSharedArrayBuffer: true,
        
        /**
         * Debounce time for render requests (ms)
         * @type {number}
         */
        renderDebounce: 16,
        
        /**
         * Maximum render time before showing progress (ms)
         * @type {number}
         */
        progressThreshold: 500,
        
        /**
         * Enable frame time smoothing for FPS display
         * @type {boolean}
         */
        smoothFrameTime: true,
        
        /**
         * Number of frames to average for FPS
         * @type {number}
         */
        fpsAverageFrames: 30
    },

    // =========================================================================
    // FRACTAL CONFIGURATION
    // =========================================================================
    
    fractal: {
        /**
         * Default fractal type on load
         * @type {string}
         */
        defaultType: 'mandelbrot',
        
        /**
         * Default view center coordinates
         * @type {{x: number, y: number}}
         */
        defaultCenter: { x: -0.5, y: 0 },
        
        /**
         * Default zoom level
         * @type {number}
         */
        defaultZoom: 3,
        
        /**
         * Available 2D fractal types with their configurations
         * @type {Object}
         */
        types2D: {
            mandelbrot: {
                name: 'Mandelbrot Set',
                formula: 'z² + c',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: -0.5, y: 0 },
                defaultZoom: 3,
                supportsJulia: true,
                supportsPerturbation: true,
                icon: 'M'
            },
            julia: {
                name: 'Julia Set',
                formula: 'z² + c',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: 0, y: 0 },
                defaultZoom: 3,
                defaultC: { x: -0.7, y: 0.27015 },
                supportsJulia: false,
                supportsPerturbation: false,
                icon: 'J'
            },
            burningShip: {
                name: 'Burning Ship',
                formula: '(|Re(z)| + i|Im(z)|)² + c',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: -0.4, y: -0.5 },
                defaultZoom: 3,
                supportsJulia: true,
                supportsPerturbation: true,
                icon: 'B'
            },
            tricorn: {
                name: 'Tricorn (Mandelbar)',
                formula: 'z̄² + c',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: -0.3, y: 0 },
                defaultZoom: 3,
                supportsJulia: true,
                supportsPerturbation: false,
                icon: 'T'
            },
            multibrot3: {
                name: 'Multibrot (Power 3)',
                formula: 'z³ + c',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: 0, y: 0 },
                defaultZoom: 2.5,
                supportsJulia: true,
                supportsPerturbation: false,
                icon: '3'
            },
            multibrot4: {
                name: 'Multibrot (Power 4)',
                formula: 'z⁴ + c',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: 0, y: 0 },
                defaultZoom: 2,
                supportsJulia: true,
                supportsPerturbation: false,
                icon: '4'
            },
            multibrot5: {
                name: 'Multibrot (Power 5)',
                formula: 'z⁵ + c',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: 0, y: 0 },
                defaultZoom: 2,
                supportsJulia: true,
                supportsPerturbation: false,
                icon: '5'
            },
            phoenix: {
                name: 'Phoenix',
                formula: 'z² + c + p·z(n-1)',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: 0, y: 0 },
                defaultZoom: 3,
                defaultP: { x: 0.5667, y: 0 },
                supportsJulia: false,
                supportsPerturbation: false,
                icon: 'P'
            },
            newton: {
                name: 'Newton (z³-1)',
                formula: 'z - (z³-1)/(3z²)',
                defaultIterations: 100,
                defaultBailout: 0.0001,
                defaultCenter: { x: 0, y: 0 },
                defaultZoom: 3,
                supportsJulia: false,
                supportsPerturbation: false,
                icon: 'N'
            },
            custom: {
                name: 'Custom Formula',
                formula: 'User defined',
                defaultIterations: 500,
                defaultBailout: 4,
                defaultCenter: { x: 0, y: 0 },
                defaultZoom: 3,
                supportsJulia: false,
                supportsPerturbation: false,
                icon: '∑'
            }
        },
        
        /**
         * Available 3D fractal types
         * @type {Object}
         */
        types3D: {
            mandelbulb: {
                name: 'Mandelbulb',
                formula: '(r,θ,φ)ⁿ + c',
                defaultIterations: 15,
                defaultBailout: 2,
                defaultPower: 8,
                defaultCenter: { x: 0, y: 0, z: 0 },
                defaultZoom: 2.5,
                icon: 'MB'
            },
            mandelbox: {
                name: 'Mandelbox',
                formula: 'boxfold + spherefold',
                defaultIterations: 15,
                defaultBailout: 100,
                defaultScale: 2,
                defaultFoldingLimit: 1,
                defaultMinRadius: 0.5,
                defaultCenter: { x: 0, y: 0, z: 0 },
                defaultZoom: 4,
                icon: 'MX'
            },
            juliaQuaternion: {
                name: 'Julia (Quaternion)',
                formula: 'q² + c',
                defaultIterations: 15,
                defaultBailout: 4,
                defaultC: { x: -0.2, y: 0.6, z: 0.2, w: 0.2 },
                defaultCenter: { x: 0, y: 0, z: 0 },
                defaultZoom: 2,
                icon: 'JQ'
            },
            sierpinski: {
                name: 'Sierpinski Tetrahedron',
                formula: 'IFS',
                defaultIterations: 12,
                defaultBailout: 2,
                defaultCenter: { x: 0, y: 0, z: 0 },
                defaultZoom: 2,
                icon: 'ST'
            },
            menger: {
                name: 'Menger Sponge',
                formula: 'IFS',
                defaultIterations: 6,
                defaultBailout: 2,
                defaultCenter: { x: 0, y: 0, z: 0 },
                defaultZoom: 3,
                icon: 'MS'
            }
        }
    },

    // =========================================================================
    // COLORING CONFIGURATION
    // =========================================================================
    
    coloring: {
        /**
         * Default coloring algorithm
         * @type {string}
         */
        defaultAlgorithm: 'escape-time',
        
        /**
         * Available coloring algorithms
         * @type {string[]}
         */
        algorithms: [
            'escape-time',
            'smooth',
            'normalized',
            'distance-estimation',
            'orbit-trap',
            'angle',
            'binary-decomposition',
            'continuous-potential',
            'stripe-average',
            'triangle-inequality',
            'curvature'
        ],
        
        /**
         * Default palette name
         * @type {string}
         */
        defaultPalette: 'classic',
        
        /**
         * Palette cycling speed (0 = off)
         * @type {number}
         */
        cycleSpeed: 0,
        
        /**
         * Palette offset
         * @type {number}
         */
        paletteOffset: 0,
        
        /**
         * Palette repetitions
         * @type {number}
         */
        paletteRepeat: 1,
        
        /**
         * Interpolation mode for palettes
         * @type {'rgb'|'hsl'|'hsv'|'lab'|'oklab'|'oklch'}
         */
        interpolation: 'oklab',
        
        /**
         * Interior color (RGB)
         * @type {{r: number, g: number, b: number}}
         */
        interiorColor: { r: 0, g: 0, b: 0 },
        
        /**
         * Enable histogram coloring equalization
         * @type {boolean}
         */
        histogramEqualization: false
    },

    // =========================================================================
    // UI CONFIGURATION
    // =========================================================================
    
    ui: {
        /**
         * Default rendering mode
         * @type {'2d'|'3d'}
         */
        defaultMode: '2d',
        
        /**
         * Default theme
         * @type {'dark'|'light'|'midnight'|'forest'}
         */
        defaultTheme: 'dark',
        
        /**
         * Show sidebar by default
         * @type {boolean}
         */
        sidebarOpen: true,
        
        /**
         * Default sidebar width
         * @type {number}
         */
        sidebarWidth: 320,
        
        /**
         * Enable animations
         * @type {boolean}
         */
        animations: true,
        
        /**
         * Animation duration multiplier
         * @type {number}
         */
        animationSpeed: 1,
        
        /**
         * Show tooltips
         * @type {boolean}
         */
        showTooltips: true,
        
        /**
         * Tooltip delay (ms)
         * @type {number}
         */
        tooltipDelay: 500,
        
        /**
         * Sync state to URL
         * @type {boolean}
         */
        syncUrlState: true,
        
        /**
         * HUD elements visibility
         * @type {Object}
         */
        hud: {
            coordinates: true,
            minimap: true,
            performanceStats: false,
            histogram: false,
            crosshair: false,
            zoomIndicator: true
        },
        
        /**
         * Coordinate display precision
         * @type {number}
         */
        coordinatePrecision: 15,
        
        /**
         * Coordinate format
         * @type {'decimal'|'scientific'|'auto'}
         */
        coordinateFormat: 'auto',
        
        /**
         * UI scale factor
         * @type {number}
         */
        uiScale: 1
    },

    // =========================================================================
    // INTERACTION CONFIGURATION
    // =========================================================================
    
    interaction: {
        /**
         * Zoom factor per scroll step
         * @type {number}
         */
        zoomFactor: 1.5,
        
        /**
         * Smooth zoom animation
         * @type {boolean}
         */
        smoothZoom: true,
        
        /**
         * Zoom animation duration (ms)
         * @type {number}
         */
        zoomDuration: 300,
        
        /**
         * Pan inertia
         * @type {boolean}
         */
        panInertia: true,
        
        /**
         * Pan inertia friction
         * @type {number}
         */
        panFriction: 0.92,
        
        /**
         * Double-click to zoom
         * @type {boolean}
         */
        doubleClickZoom: true,
        
        /**
         * Double-click zoom factor
         * @type {number}
         */
        doubleClickZoomFactor: 4,
        
        /**
         * Enable touch gestures
         * @type {boolean}
         */
        touchEnabled: true,
        
        /**
         * Pinch zoom sensitivity
         * @type {number}
         */
        pinchSensitivity: 1,
        
        /**
         * Selection box for zoom area
         * @type {boolean}
         */
        selectionZoom: true
    },

    // =========================================================================
    // 3D RENDERING CONFIGURATION
    // =========================================================================
    
    rendering3D: {
        /**
         * Raymarching maximum steps
         * @type {number}
         */
        maxSteps: 256,
        
        /**
         * Raymarching minimum distance
         * @type {number}
         */
        minDistance: 0.0001,
        
        /**
         * Maximum ray distance
         * @type {number}
         */
        maxDistance: 100,
        
        /**
         * Shadow softness
         * @type {number}
         */
        shadowSoftness: 16,
        
        /**
         * Ambient occlusion intensity
         * @type {number}
         */
        aoIntensity: 0.5,
        
        /**
         * Ambient occlusion steps
         * @type {number}
         */
        aoSteps: 5,
        
        /**
         * Enable shadows
         * @type {boolean}
         */
        shadows: true,
        
        /**
         * Enable ambient occlusion
         * @type {boolean}
         */
        ambientOcclusion: true,
        
        /**
         * Enable glow effect
         * @type {boolean}
         */
        glow: true,
        
        /**
         * Glow intensity
         * @type {number}
         */
        glowIntensity: 0.5,
        
        /**
         * Background color (RGB)
         * @type {{r: number, g: number, b: number}}
         */
        backgroundColor: { r: 0.02, g: 0.02, b: 0.05 },
        
        /**
         * Light direction (normalized)
         * @type {{x: number, y: number, z: number}}
         */
        lightDirection: { x: 0.577, y: 0.577, z: -0.577 },
        
        /**
         * Light color (RGB)
         * @type {{r: number, g: number, b: number}}
         */
        lightColor: { r: 1, g: 0.95, b: 0.9 },
        
        /**
         * Ambient light intensity
         * @type {number}
         */
        ambientLight: 0.2,
        
        /**
         * Field of view (degrees)
         * @type {number}
         */
        fov: 60,
        
        /**
         * Camera orbit speed
         * @type {number}
         */
        orbitSpeed: 0.5
    },

    // =========================================================================
    // EXPORT CONFIGURATION
    // =========================================================================
    
    export: {
        /**
         * Default export format
         * @type {'png'|'jpeg'|'webp'}
         */
        defaultFormat: 'png',
        
        /**
         * JPEG quality (0-1)
         * @type {number}
         */
        jpegQuality: 0.92,
        
        /**
         * WebP quality (0-1)
         * @type {number}
         */
        webpQuality: 0.92,
        
        /**
         * Resolution presets
         * @type {Object[]}
         */
        resolutionPresets: [
            { name: '720p', width: 1280, height: 720 },
            { name: '1080p', width: 1920, height: 1080 },
            { name: '1440p', width: 2560, height: 1440 },
            { name: '4K', width: 3840, height: 2160 },
            { name: '8K', width: 7680, height: 4320 }
        ],
        
        /**
         * Supersampling levels for export
         * @type {number[]}
         */
        supersamplingLevels: [1, 2, 4, 8],
        
        /**
         * Include metadata in export
         * @type {boolean}
         */
        includeMetadata: true,
        
        /**
         * Animation frame rate
         * @type {number}
         */
        animationFPS: 30,
        
        /**
         * Animation format
         * @type {'gif'|'webm'|'frames'}
         */
        animationFormat: 'webm'
    },

    // =========================================================================
    // HISTORY CONFIGURATION
    // =========================================================================
    
    history: {
        /**
         * Maximum undo/redo steps
         * @type {number}
         */
        maxSteps: 50,
        
        /**
         * Store thumbnails in history
         * @type {boolean}
         */
        storeThumbnails: true,
        
        /**
         * Thumbnail size
         * @type {number}
         */
        thumbnailSize: 100,
        
        /**
         * Auto-save interval (ms, 0 = disabled)
         * @type {number}
         */
        autoSaveInterval: 30000
    },

    // =========================================================================
    // FEATURE FLAGS
    // =========================================================================
    
    features: {
        /**
         * Enable experimental perturbation theory
         * @type {boolean}
         */
        perturbationTheory: true,
        
        /**
         * Enable series approximation
         * @type {boolean}
         */
        seriesApproximation: true,
        
        /**
         * Enable custom formula editor
         * @type {boolean}
         */
        customFormulas: true,
        
        /**
         * Enable 3D mode
         * @type {boolean}
         */
        mode3D: true,
        
        /**
         * Enable animation system
         * @type {boolean}
         */
        animations: true,
        
        /**
         * Enable palette editor
         * @type {boolean}
         */
        paletteEditor: true,
        
        /**
         * Enable keyboard shortcuts
         * @type {boolean}
         */
        keyboardShortcuts: true,
        
        /**
         * Enable touch gestures
         * @type {boolean}
         */
        touchGestures: true,
        
        /**
         * Enable orbit visualization
         * @type {boolean}
         */
        orbitVisualization: true,
        
        /**
         * Enable WebAssembly acceleration
         * @type {boolean}
         */
        wasmAcceleration: false,
        
        /**
         * Enable developer console
         * @type {boolean}
         */
        developerConsole: true,
        
        /**
         * Enable service worker for offline
         * @type {boolean}
         */
        serviceWorker: true
    },

    // =========================================================================
    // METHODS
    // =========================================================================

    /**
     * Serialize configuration for storage
     * @returns {Object}
     */
    serialize() {
        return {
            rendering: { ...this.rendering },
            performance: { ...this.performance },
            coloring: { ...this.coloring },
            ui: { ...this.ui },
            interaction: { ...this.interaction },
            rendering3D: { ...this.rendering3D },
            export: { ...this.export },
            history: { ...this.history },
            features: { ...this.features }
        };
    },

    /**
     * Load configuration from object
     * @param {Object} data
     */
    deserialize(data) {
        if (!data) return;
        
        const sections = [
            'rendering', 'performance', 'coloring', 'ui',
            'interaction', 'rendering3D', 'export', 'history', 'features'
        ];
        
        for (const section of sections) {
            if (data[section]) {
                Object.assign(this[section], data[section]);
            }
        }
    },

    /**
     * Reset configuration to defaults
     * @param {string} [section] - Specific section to reset, or all if omitted
     */
    reset(section) {
        // This would reset to compiled defaults
        // Implementation depends on how defaults are stored
        console.warn('Config.reset() not fully implemented');
    },

    /**
     * Get fractal type configuration
     * @param {string} type - Fractal type name
     * @param {'2d'|'3d'} mode - Rendering mode
     * @returns {Object|null}
     */
    getFractalConfig(type, mode = '2d') {
        const types = mode === '3d' ? this.fractal.types3D : this.fractal.types2D;
        return types[type] || null;
    },

    /**
     * Get all available fractal types for a mode
     * @param {'2d'|'3d'} mode
     * @returns {string[]}
     */
    getAvailableFractals(mode = '2d') {
        const types = mode === '3d' ? this.fractal.types3D : this.fractal.types2D;
        return Object.keys(types);
    }
};

// =============================================================================
// FREEZE NESTED OBJECTS TO PREVENT ACCIDENTAL MUTATION
// (Comment out during development if needed)
// =============================================================================

// Object.freeze(Config.fractal.types2D);
// Object.freeze(Config.fractal.types3D);

// =============================================================================
// EXPORTS
// =============================================================================

export { Config, VERSION, BUILD_DATE };
export default Config;
