/**
 * ============================================================================
 * ABYSS EXPLORER - ADAPTIVE ITERATIONS
 * ============================================================================
 * 
 * Dynamic iteration count adjustment system that optimizes performance
 * while maintaining visual quality at any zoom level.
 * 
 * The Challenge:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Zoom Level     │ Required Iterations │ Why                           │
 * │─────────────────┼─────────────────────┼───────────────────────────────│
 * │  1x (overview)  │     100-500         │ Low detail needed             │
 * │  10^3           │     500-2000        │ More detail visible           │
 * │  10^6           │     2000-5000       │ Spirals require more iters    │
 * │  10^9           │     5000-20000      │ Deep minibrots emerge         │
 * │  10^12+         │     20000-100000+   │ Extreme detail                │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Strategies:
 * 1. ZOOM-BASED: Iterations scale with log(zoom)
 * 2. COMPLEXITY-BASED: More iterations near set boundary
 * 3. PERFORMANCE-BASED: Adjust based on frame rate targets
 * 4. PERIODICITY-AWARE: Detect cycles to skip unnecessary iterations
 * 5. HYBRID: Combine multiple strategies
 * 
 * Periodicity Checking:
 * Many interior points eventually cycle. Detecting this early
 * allows skipping remaining iterations, providing massive speedups
 * (often 10-100x for interior regions).
 * 
 * @module rendering/adaptive-iterations
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Iteration scaling strategies */
const SCALING_STRATEGY = {
    LINEAR: 'linear',
    LOGARITHMIC: 'logarithmic',
    EXPONENTIAL: 'exponential',
    SQRT: 'sqrt',
    CUSTOM: 'custom'
};

/** Presets for different use cases */
const PRESETS = {
    FAST: {
        name: 'Fast',
        baseIterations: 100,
        maxIterations: 5000,
        scalingStrategy: SCALING_STRATEGY.SQRT,
        scalingFactor: 50,
        periodicityCheck: true,
        periodicityInterval: 20
    },
    BALANCED: {
        name: 'Balanced',
        baseIterations: 200,
        maxIterations: 20000,
        scalingStrategy: SCALING_STRATEGY.LOGARITHMIC,
        scalingFactor: 100,
        periodicityCheck: true,
        periodicityInterval: 25
    },
    QUALITY: {
        name: 'Quality',
        baseIterations: 500,
        maxIterations: 100000,
        scalingStrategy: SCALING_STRATEGY.LOGARITHMIC,
        scalingFactor: 150,
        periodicityCheck: true,
        periodicityInterval: 30
    },
    EXTREME: {
        name: 'Extreme',
        baseIterations: 1000,
        maxIterations: 1000000,
        scalingStrategy: SCALING_STRATEGY.EXPONENTIAL,
        scalingFactor: 200,
        periodicityCheck: true,
        periodicityInterval: 50
    }
};

/** Zoom level breakpoints for reference */
const ZOOM_BREAKPOINTS = {
    OVERVIEW: 1,
    LOW: 1e3,
    MEDIUM: 1e6,
    HIGH: 1e9,
    DEEP: 1e12,
    EXTREME: 1e15,
    ULTRA: 1e20
};

// ============================================================================
// ADAPTIVE ITERATIONS CLASS
// ============================================================================

export class AdaptiveIterations {
    /**
     * Create adaptive iterations controller
     * @param {Object} renderer - Parent renderer reference (optional)
     */
    constructor(renderer = null) {
        this.renderer = renderer;
        
        // Current configuration
        this.config = { ...PRESETS.BALANCED };
        
        // Performance tracking for adaptive adjustment
        this.performanceHistory = [];
        this.targetFPS = 30;
        this.performanceWindow = 10;  // Number of frames to average
        
        // Complexity map for region-based adjustment
        this.complexityMap = null;
        this.complexityMapSize = 32;  // Resolution of complexity sampling
        
        // Statistics
        this.stats = {
            currentIterations: 0,
            calculatedIterations: 0,
            periodicitySkips: 0,
            complexityBoosts: 0,
            performanceAdjustments: 0
        };
        
        // Cache for iteration calculations
        this.cache = {
            lastZoom: 0,
            lastIterations: 0,
            valid: false
        };
    }
    
    /**
     * Apply a preset configuration
     * @param {string} presetName - Name of preset (FAST, BALANCED, QUALITY, EXTREME)
     */
    applyPreset(presetName) {
        const preset = PRESETS[presetName.toUpperCase()];
        if (preset) {
            this.config = { ...preset };
            this.cache.valid = false;
            console.log(`[AdaptiveIterations] Applied preset: ${preset.name}`);
        }
    }
    
    /**
     * Update configuration
     * @param {Object} config - Configuration overrides
     */
    updateConfig(config) {
        Object.assign(this.config, config);
        this.cache.valid = false;
    }
    
    /**
     * Calculate optimal iteration count for a given zoom level
     * @param {number} zoom - Current zoom level
     * @param {Object} options - Additional options
     * @returns {number} Recommended iteration count
     */
    calculate(zoom, options = {}) {
        // Check cache
        if (this.cache.valid && Math.abs(this.cache.lastZoom - zoom) < zoom * 0.01) {
            return this.cache.lastIterations;
        }
        
        const {
            baseIterations,
            maxIterations,
            scalingStrategy,
            scalingFactor
        } = this.config;
        
        // Calculate base iterations from zoom
        let iterations = this._calculateFromZoom(zoom, baseIterations, scalingFactor, scalingStrategy);
        
        // Apply complexity boost if available
        if (options.complexityBoost) {
            iterations *= options.complexityBoost;
            this.stats.complexityBoosts++;
        }
        
        // Apply performance adjustment
        if (options.adaptToPerformance && this.performanceHistory.length >= this.performanceWindow) {
            iterations = this._adjustForPerformance(iterations);
        }
        
        // Clamp to configured range
        iterations = Math.max(baseIterations, Math.min(maxIterations, Math.round(iterations)));
        
        // Update cache
        this.cache.lastZoom = zoom;
        this.cache.lastIterations = iterations;
        this.cache.valid = true;
        
        this.stats.currentIterations = iterations;
        this.stats.calculatedIterations++;
        
        return iterations;
    }
    
    /**
     * Calculate iterations from zoom using specified strategy
     * @private
     */
    _calculateFromZoom(zoom, base, factor, strategy) {
        // Normalize zoom to a reasonable scale
        const logZoom = Math.log10(Math.max(1, zoom));
        
        switch (strategy) {
            case SCALING_STRATEGY.LINEAR:
                // Linear scaling: iter = base + factor * log10(zoom)
                return base + factor * logZoom;
                
            case SCALING_STRATEGY.LOGARITHMIC:
                // Logarithmic scaling: slower growth at extreme depths
                // iter = base + factor * log10(zoom) * log2(log10(zoom) + 2)
                return base + factor * logZoom * Math.log2(logZoom + 2);
                
            case SCALING_STRATEGY.EXPONENTIAL:
                // Exponential scaling: faster growth for extreme quality
                // iter = base * (1.1 ^ log10(zoom))
                return base * Math.pow(1.1, logZoom);
                
            case SCALING_STRATEGY.SQRT:
                // Square root scaling: balanced, not too aggressive
                // iter = base + factor * sqrt(log10(zoom)) * log10(zoom)
                return base + factor * Math.sqrt(logZoom) * logZoom;
                
            case SCALING_STRATEGY.CUSTOM:
                // Custom formula from config
                if (this.config.customFormula) {
                    return this.config.customFormula(zoom, base, factor);
                }
                return base + factor * logZoom;
                
            default:
                return base + factor * logZoom;
        }
    }
    
    /**
     * Adjust iterations based on recent performance
     * @private
     */
    _adjustForPerformance(iterations) {
        const avgFPS = this.performanceHistory.reduce((a, b) => a + b, 0) / 
                       this.performanceHistory.length;
        
        if (avgFPS < this.targetFPS * 0.8) {
            // Below target - reduce iterations
            const reduction = Math.max(0.5, avgFPS / this.targetFPS);
            this.stats.performanceAdjustments++;
            return iterations * reduction;
        } else if (avgFPS > this.targetFPS * 1.5) {
            // Well above target - can increase iterations
            const increase = Math.min(1.5, avgFPS / this.targetFPS);
            this.stats.performanceAdjustments++;
            return iterations * increase;
        }
        
        return iterations;
    }
    
    /**
     * Record frame performance for adaptive adjustment
     * @param {number} fps - Frames per second for last frame
     */
    recordPerformance(fps) {
        this.performanceHistory.push(fps);
        
        // Keep only recent history
        if (this.performanceHistory.length > this.performanceWindow) {
            this.performanceHistory.shift();
        }
    }
    
    /**
     * Calculate region complexity for adaptive iteration boost
     * @param {Object} pixelData - Pixel data from a sample render
     * @param {number} width - Image width
     * @param {number} height - Image height
     */
    analyzeComplexity(pixelData, width, height) {
        const cellWidth = Math.ceil(width / this.complexityMapSize);
        const cellHeight = Math.ceil(height / this.complexityMapSize);
        
        this.complexityMap = new Float32Array(this.complexityMapSize * this.complexityMapSize);
        
        // For each cell, calculate complexity based on iteration variance
        for (let cy = 0; cy < this.complexityMapSize; cy++) {
            for (let cx = 0; cx < this.complexityMapSize; cx++) {
                const cellIdx = cy * this.complexityMapSize + cx;
                
                // Sample pixels in this cell
                const startX = cx * cellWidth;
                const startY = cy * cellHeight;
                const endX = Math.min(startX + cellWidth, width);
                const endY = Math.min(startY + cellHeight, height);
                
                let sum = 0;
                let sumSq = 0;
                let count = 0;
                let escapedCount = 0;
                
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const idx = y * width + x;
                        const iter = pixelData.iterations[idx];
                        
                        sum += iter;
                        sumSq += iter * iter;
                        count++;
                        
                        if (pixelData.escaped[idx]) {
                            escapedCount++;
                        }
                    }
                }
                
                if (count > 0) {
                    const mean = sum / count;
                    const variance = (sumSq / count) - (mean * mean);
                    const stdDev = Math.sqrt(Math.max(0, variance));
                    
                    // Complexity is higher when:
                    // 1. High iteration variance (detailed area)
                    // 2. Mix of escaped and interior points (boundary)
                    const varianceScore = stdDev / (mean + 1);
                    const boundaryScore = 2 * Math.abs(escapedCount / count - 0.5);
                    
                    // Combine scores (0-1 range normalized to boost factor 1-2)
                    this.complexityMap[cellIdx] = 1 + Math.min(1, varianceScore + boundaryScore);
                } else {
                    this.complexityMap[cellIdx] = 1;
                }
            }
        }
    }
    
    /**
     * Get complexity boost for a specific pixel
     * @param {number} x - Pixel X coordinate
     * @param {number} y - Pixel Y coordinate
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {number} Complexity multiplier (1.0 - 2.0)
     */
    getComplexityBoost(x, y, width, height) {
        if (!this.complexityMap) return 1.0;
        
        const cx = Math.floor((x / width) * this.complexityMapSize);
        const cy = Math.floor((y / height) * this.complexityMapSize);
        
        const cellIdx = cy * this.complexityMapSize + cx;
        return this.complexityMap[cellIdx] || 1.0;
    }
    
    /**
     * Get periodicity checking configuration
     * @returns {Object} Periodicity check settings
     */
    getPeriodicityConfig() {
        return {
            enabled: this.config.periodicityCheck,
            interval: this.config.periodicityInterval
        };
    }
    
    /**
     * Perform periodicity check during iteration
     * This should be called from the fractal computation loop
     * 
     * @param {number} zx - Current Z real component
     * @param {number} zy - Current Z imaginary component
     * @param {number} iteration - Current iteration number
     * @param {Object} state - Periodicity check state
     * @returns {boolean} True if cycle detected (can skip remaining iterations)
     */
    checkPeriodicity(zx, zy, iteration, state) {
        if (!this.config.periodicityCheck) return false;
        
        const interval = this.config.periodicityInterval;
        
        // Initialize state on first call
        if (!state.initialized) {
            state.initialized = true;
            state.checkX = 0;
            state.checkY = 0;
            state.period = 0;
        }
        
        // Check if current point matches saved point
        // Using approximate comparison for floating point
        const epsilon = 1e-12;
        if (Math.abs(zx - state.checkX) < epsilon && 
            Math.abs(zy - state.checkY) < epsilon) {
            // Found a cycle!
            this.stats.periodicitySkips++;
            return true;
        }
        
        // Update saved point periodically
        state.period++;
        if (state.period >= interval) {
            state.period = 0;
            state.checkX = zx;
            state.checkY = zy;
        }
        
        return false;
    }
    
    /**
     * Get recommended iteration count for a specific region
     * Combines zoom-based calculation with complexity analysis
     * 
     * @param {number} zoom - Current zoom level
     * @param {number} x - Region center X (pixels)
     * @param {number} y - Region center Y (pixels)
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {number} Recommended iterations for this region
     */
    calculateForRegion(zoom, x, y, width, height) {
        const baseIterations = this.calculate(zoom);
        const complexityBoost = this.getComplexityBoost(x, y, width, height);
        
        return Math.round(baseIterations * complexityBoost);
    }
    
    /**
     * Estimate iterations needed to fully resolve a minibrot at given zoom
     * Minibrots require approximately log(zoom) * constant iterations
     * 
     * @param {number} zoom - Zoom level
     * @param {number} minibrotSize - Estimated size of minibrot (optional)
     * @returns {number} Estimated iterations needed
     */
    estimateMinibrotIterations(zoom, minibrotSize = null) {
        // Empirical formula based on Mandelbrot set properties
        // A minibrot at zoom Z requires approximately 2 * log2(Z) * period iterations
        // where period is the period of the minibrot
        
        const logZoom = Math.log10(Math.max(1, zoom));
        
        // Base estimate without knowing the period
        // Assume period scales roughly with log(zoom)
        const estimatedPeriod = Math.max(1, logZoom * 2);
        
        // Iterations needed to see full detail
        return Math.round(logZoom * estimatedPeriod * 100);
    }
    
    /**
     * Get iteration recommendations based on current state
     * @returns {Object} Recommendations object
     */
    getRecommendations() {
        const currentZoom = this.renderer?.viewport?.zoom || 1;
        const logZoom = Math.log10(Math.max(1, currentZoom));
        
        return {
            current: this.stats.currentIterations,
            forQuality: this.calculate(currentZoom, { preset: 'QUALITY' }),
            forSpeed: this.calculate(currentZoom, { preset: 'FAST' }),
            minibrot: this.estimateMinibrotIterations(currentZoom),
            zoomCategory: this._categorizeZoom(currentZoom),
            suggestions: this._generateSuggestions(currentZoom)
        };
    }
    
    /**
     * Categorize zoom level
     * @private
     */
    _categorizeZoom(zoom) {
        if (zoom < ZOOM_BREAKPOINTS.LOW) return 'overview';
        if (zoom < ZOOM_BREAKPOINTS.MEDIUM) return 'low';
        if (zoom < ZOOM_BREAKPOINTS.HIGH) return 'medium';
        if (zoom < ZOOM_BREAKPOINTS.DEEP) return 'high';
        if (zoom < ZOOM_BREAKPOINTS.EXTREME) return 'deep';
        if (zoom < ZOOM_BREAKPOINTS.ULTRA) return 'extreme';
        return 'ultra';
    }
    
    /**
     * Generate iteration suggestions based on zoom
     * @private
     */
    _generateSuggestions(zoom) {
        const suggestions = [];
        const category = this._categorizeZoom(zoom);
        
        switch (category) {
            case 'overview':
                suggestions.push('Low iterations sufficient for overview');
                suggestions.push('Consider FAST preset for quick exploration');
                break;
            case 'low':
            case 'medium':
                suggestions.push('BALANCED preset recommended');
                suggestions.push('Enable periodicity checking for interior speedup');
                break;
            case 'high':
            case 'deep':
                suggestions.push('QUALITY preset recommended for detail');
                suggestions.push('Consider using perturbation theory');
                break;
            case 'extreme':
            case 'ultra':
                suggestions.push('EXTREME preset required');
                suggestions.push('Enable arbitrary precision');
                suggestions.push('Glitch detection recommended');
                break;
        }
        
        return suggestions;
    }
    
    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Reset statistics
     */
    resetStats() {
        this.stats = {
            currentIterations: 0,
            calculatedIterations: 0,
            periodicitySkips: 0,
            complexityBoosts: 0,
            performanceAdjustments: 0
        };
    }
    
    /**
     * Export configuration
     * @returns {Object}
     */
    exportConfig() {
        return {
            ...this.config,
            performanceHistory: [...this.performanceHistory],
            targetFPS: this.targetFPS
        };
    }
    
    /**
     * Import configuration
     * @param {Object} config - Configuration to import
     */
    importConfig(config) {
        const { performanceHistory, targetFPS, ...rest } = config;
        
        this.config = { ...this.config, ...rest };
        
        if (performanceHistory) {
            this.performanceHistory = [...performanceHistory];
        }
        if (targetFPS) {
            this.targetFPS = targetFPS;
        }
        
        this.cache.valid = false;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick calculation without instantiating class
 * @param {number} zoom - Zoom level
 * @param {string} preset - Preset name (default: BALANCED)
 * @returns {number} Recommended iterations
 */
export function quickCalculate(zoom, preset = 'BALANCED') {
    const config = PRESETS[preset.toUpperCase()] || PRESETS.BALANCED;
    const logZoom = Math.log10(Math.max(1, zoom));
    
    let iterations;
    switch (config.scalingStrategy) {
        case SCALING_STRATEGY.LOGARITHMIC:
            iterations = config.baseIterations + 
                         config.scalingFactor * logZoom * Math.log2(logZoom + 2);
            break;
        case SCALING_STRATEGY.SQRT:
            iterations = config.baseIterations + 
                         config.scalingFactor * Math.sqrt(logZoom) * logZoom;
            break;
        default:
            iterations = config.baseIterations + config.scalingFactor * logZoom;
    }
    
    return Math.round(Math.max(config.baseIterations, 
                               Math.min(config.maxIterations, iterations)));
}

/**
 * Create periodicity check state object
 * @returns {Object} Fresh periodicity state
 */
export function createPeriodicityState() {
    return {
        initialized: false,
        checkX: 0,
        checkY: 0,
        period: 0
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AdaptiveIterations;
export { SCALING_STRATEGY, PRESETS, ZOOM_BREAKPOINTS };
