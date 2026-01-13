/**
 * ============================================================================
 * ABYSS EXPLORER - GLITCH DETECTION
 * ============================================================================
 * 
 * Advanced glitch detection and correction for deep fractal zooms.
 * At extreme zoom levels (10^13+), numerical precision issues cause visual
 * artifacts that must be detected and corrected.
 * 
 * Types of Glitches:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  1. REFERENCE ORBIT GLITCHES                                          │
 * │     When delta scaling causes loss of precision                       │
 * │     Detected by: sudden iteration count discontinuities               │
 * │                                                                       │
 * │  2. PERTURBATION UNDERFLOW                                            │
 * │     When delta becomes smaller than machine epsilon                   │
 * │     Detected by: |δn| approaching 0 unexpectedly                      │
 * │                                                                       │
 * │  3. SERIES APPROXIMATION ERRORS                                       │
 * │     When SA coefficients diverge from actual orbit                    │
 * │     Detected by: accumulated error exceeding threshold                │
 * │                                                                       │
 * │  4. BAILOUT ARTIFACTS                                                 │
 * │     Premature escape due to accumulated numerical errors              │
 * │     Detected by: isolated escaped pixels in interior regions          │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Detection Methods:
 * - Reference orbit comparison (delta monitoring)
 * - Statistical analysis of iteration counts
 * - Edge coherence checking
 * - Neighboring pixel consistency validation
 * 
 * Correction Strategies:
 * - Rebasing to new reference orbit
 * - Higher precision recalculation
 * - Increased iteration count
 * - Bilinear interpolation for isolated pixels
 * 
 * @module rendering/glitch-detection
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Glitch types */
const GLITCH_TYPE = {
    REFERENCE_ORBIT: 'reference-orbit',
    PERTURBATION_UNDERFLOW: 'perturbation-underflow',
    SERIES_APPROXIMATION: 'series-approximation',
    BAILOUT_ARTIFACT: 'bailout-artifact',
    UNKNOWN: 'unknown'
};

/** Detection thresholds */
const THRESHOLDS = {
    // Maximum iteration difference between neighboring pixels before flagging
    ITERATION_DISCONTINUITY: 50,
    
    // Minimum delta magnitude (below this = underflow)
    DELTA_UNDERFLOW: 1e-300,
    
    // Maximum acceptable series approximation error
    SA_ERROR_MAX: 0.001,
    
    // Minimum cluster size to consider as a glitch region
    MIN_CLUSTER_SIZE: 4,
    
    // Maximum isolated pixel cluster to auto-correct
    MAX_ISOLATED_SIZE: 16,
    
    // Statistical outlier threshold (standard deviations)
    OUTLIER_SIGMA: 3.0
};

/** Correction strategies */
const CORRECTION_STRATEGY = {
    REBASE: 'rebase',           // Use new reference orbit
    HIGH_PRECISION: 'high-precision',  // Recalculate with more precision
    INTERPOLATE: 'interpolate', // Interpolate from neighbors
    INCREASE_ITER: 'increase-iterations'  // More iterations
};

// ============================================================================
// GLITCH REGION CLASS
// ============================================================================

/**
 * Represents a detected glitch region
 */
class GlitchRegion {
    /**
     * Create a glitch region
     * @param {string} type - Type of glitch
     * @param {Array<{x: number, y: number}>} pixels - Affected pixels
     */
    constructor(type, pixels) {
        this.type = type;
        this.pixels = pixels;
        this.boundingBox = this._calculateBounds();
        this.center = this._calculateCenter();
        this.severity = 0;
        this.correctionStrategy = null;
        this.corrected = false;
    }
    
    /**
     * Calculate bounding box
     * @private
     */
    _calculateBounds() {
        if (this.pixels.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        for (const p of this.pixels) {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
    }
    
    /**
     * Calculate center point
     * @private
     */
    _calculateCenter() {
        if (this.pixels.length === 0) {
            return { x: 0, y: 0 };
        }
        
        let sumX = 0, sumY = 0;
        for (const p of this.pixels) {
            sumX += p.x;
            sumY += p.y;
        }
        
        return {
            x: sumX / this.pixels.length,
            y: sumY / this.pixels.length
        };
    }
    
    /**
     * Get pixel count
     */
    get size() {
        return this.pixels.length;
    }
}

// ============================================================================
// GLITCH DETECTOR CLASS
// ============================================================================

export class GlitchDetector {
    /**
     * Create a new glitch detector
     * @param {Object} renderer - Parent renderer reference
     */
    constructor(renderer) {
        this.renderer = renderer;
        
        // Configuration
        this.thresholds = { ...THRESHOLDS };
        this.enabled = true;
        
        // Detection state
        this.glitchMap = null;  // Per-pixel glitch flags
        this.glitchRegions = [];
        
        // Statistics
        this.stats = {
            pixelsAnalyzed: 0,
            glitchPixelsDetected: 0,
            regionsDetected: 0,
            regionsCorrected: 0,
            detectionTime: 0,
            correctionTime: 0
        };
    }
    
    /**
     * Detect glitches in the rendered image
     * @param {Object} pixelData - Pixel data from renderer
     * @param {Object} config - Renderer configuration
     * @returns {GlitchRegion[]} Array of detected glitch regions
     */
    detect(pixelData, config) {
        if (!this.enabled) return [];
        
        const startTime = performance.now();
        const { width, height } = config;
        
        // Initialize glitch map
        this.glitchMap = new Uint8Array(width * height);
        this.glitchRegions = [];
        
        // Run detection passes
        this._detectIterationDiscontinuities(pixelData, width, height);
        this._detectIsolatedPixels(pixelData, width, height);
        this._detectStatisticalOutliers(pixelData, width, height);
        
        // Cluster glitch pixels into regions
        this._clusterGlitchPixels(width, height);
        
        // Analyze each region
        for (const region of this.glitchRegions) {
            this._analyzeRegion(region, pixelData, width);
            this._selectCorrectionStrategy(region);
        }
        
        // Filter out very small clusters (likely noise)
        this.glitchRegions = this.glitchRegions.filter(
            r => r.size >= this.thresholds.MIN_CLUSTER_SIZE
        );
        
        // Update stats
        this.stats.pixelsAnalyzed = width * height;
        this.stats.glitchPixelsDetected = this.glitchMap.reduce((a, b) => a + b, 0);
        this.stats.regionsDetected = this.glitchRegions.length;
        this.stats.detectionTime = performance.now() - startTime;
        
        console.log(`[GlitchDetector] Found ${this.glitchRegions.length} regions ` +
                    `(${this.stats.glitchPixelsDetected} pixels) in ${this.stats.detectionTime.toFixed(1)}ms`);
        
        return this.glitchRegions;
    }
    
    /**
     * Detect iteration count discontinuities
     * @private
     */
    _detectIterationDiscontinuities(pixelData, width, height) {
        const threshold = this.thresholds.ITERATION_DISCONTINUITY;
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const iter = pixelData.iterations[idx];
                
                // Skip interior points (very high iteration count)
                if (!pixelData.escaped[idx]) continue;
                
                // Check 4-neighbors
                const neighbors = [
                    pixelData.iterations[(y - 1) * width + x],
                    pixelData.iterations[(y + 1) * width + x],
                    pixelData.iterations[y * width + (x - 1)],
                    pixelData.iterations[y * width + (x + 1)]
                ];
                
                // Check if all neighbors escaped
                const neighborEscaped = [
                    pixelData.escaped[(y - 1) * width + x],
                    pixelData.escaped[(y + 1) * width + x],
                    pixelData.escaped[y * width + (x - 1)],
                    pixelData.escaped[y * width + (x + 1)]
                ];
                
                // Count large discontinuities
                let discontinuities = 0;
                for (let i = 0; i < 4; i++) {
                    if (neighborEscaped[i] && Math.abs(iter - neighbors[i]) > threshold) {
                        discontinuities++;
                    }
                }
                
                // If multiple large discontinuities, flag as glitch
                if (discontinuities >= 3) {
                    this.glitchMap[idx] = 1;
                }
            }
        }
    }
    
    /**
     * Detect isolated pixels (single pixels surrounded by different values)
     * @private
     */
    _detectIsolatedPixels(pixelData, width, height) {
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const escaped = pixelData.escaped[idx];
                
                // Check 8-neighbors
                let sameCount = 0;
                let diffCount = 0;
                
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nIdx = (y + dy) * width + (x + dx);
                        const nEscaped = pixelData.escaped[nIdx];
                        
                        if (escaped === nEscaped) {
                            sameCount++;
                        } else {
                            diffCount++;
                        }
                    }
                }
                
                // If completely isolated (all neighbors different), flag as glitch
                if (diffCount === 8 || (diffCount >= 7 && escaped)) {
                    this.glitchMap[idx] = 1;
                }
            }
        }
    }
    
    /**
     * Detect statistical outliers using local neighborhood analysis
     * @private
     */
    _detectStatisticalOutliers(pixelData, width, height) {
        const windowSize = 5;
        const halfWindow = Math.floor(windowSize / 2);
        const sigma = this.thresholds.OUTLIER_SIGMA;
        
        for (let y = halfWindow; y < height - halfWindow; y++) {
            for (let x = halfWindow; x < width - halfWindow; x++) {
                const idx = y * width + x;
                
                // Skip already flagged pixels
                if (this.glitchMap[idx]) continue;
                
                // Skip interior points
                if (!pixelData.escaped[idx]) continue;
                
                const centerIter = pixelData.iterations[idx];
                
                // Collect neighborhood values
                const neighborhood = [];
                for (let dy = -halfWindow; dy <= halfWindow; dy++) {
                    for (let dx = -halfWindow; dx <= halfWindow; dx++) {
                        const nIdx = (y + dy) * width + (x + dx);
                        if (pixelData.escaped[nIdx]) {
                            neighborhood.push(pixelData.iterations[nIdx]);
                        }
                    }
                }
                
                if (neighborhood.length < 5) continue;
                
                // Calculate mean and standard deviation
                const mean = neighborhood.reduce((a, b) => a + b, 0) / neighborhood.length;
                const variance = neighborhood.reduce((a, b) => a + (b - mean) ** 2, 0) / neighborhood.length;
                const stdDev = Math.sqrt(variance);
                
                // Check if center pixel is an outlier
                if (stdDev > 0 && Math.abs(centerIter - mean) > sigma * stdDev) {
                    this.glitchMap[idx] = 1;
                }
            }
        }
    }
    
    /**
     * Cluster glitch pixels into connected regions
     * @private
     */
    _clusterGlitchPixels(width, height) {
        const visited = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (this.glitchMap[idx] && !visited[idx]) {
                    // Start new region with flood fill
                    const pixels = this._floodFill(x, y, width, height, visited);
                    
                    if (pixels.length > 0) {
                        this.glitchRegions.push(new GlitchRegion(GLITCH_TYPE.UNKNOWN, pixels));
                    }
                }
            }
        }
    }
    
    /**
     * Flood fill to find connected glitch pixels
     * @private
     */
    _floodFill(startX, startY, width, height, visited) {
        const pixels = [];
        const stack = [{ x: startX, y: startY }];
        
        while (stack.length > 0) {
            const { x, y } = stack.pop();
            const idx = y * width + x;
            
            // Bounds check
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            
            // Already visited or not a glitch
            if (visited[idx] || !this.glitchMap[idx]) continue;
            
            visited[idx] = 1;
            pixels.push({ x, y });
            
            // Add 4-connected neighbors
            stack.push({ x: x - 1, y });
            stack.push({ x: x + 1, y });
            stack.push({ x, y: y - 1 });
            stack.push({ x, y: y + 1 });
        }
        
        return pixels;
    }
    
    /**
     * Analyze a glitch region to determine its type
     * @private
     */
    _analyzeRegion(region, pixelData, width) {
        // Analyze iteration patterns in the region
        const iterations = region.pixels.map(p => 
            pixelData.iterations[p.y * width + p.x]
        );
        
        const escaped = region.pixels.map(p =>
            pixelData.escaped[p.y * width + p.x]
        );
        
        // Calculate statistics
        const escapedCount = escaped.filter(e => e).length;
        const interiorCount = escaped.length - escapedCount;
        const meanIter = iterations.reduce((a, b) => a + b, 0) / iterations.length;
        
        // Determine glitch type based on characteristics
        if (region.size <= this.thresholds.MAX_ISOLATED_SIZE && 
            escapedCount === region.size) {
            // Small cluster of escaped pixels - likely bailout artifact
            region.type = GLITCH_TYPE.BAILOUT_ARTIFACT;
            region.severity = 1;
        } else if (interiorCount > escapedCount * 0.8) {
            // Mostly interior points that shouldn't be there
            region.type = GLITCH_TYPE.PERTURBATION_UNDERFLOW;
            region.severity = 3;
        } else {
            // General reference orbit issue
            region.type = GLITCH_TYPE.REFERENCE_ORBIT;
            region.severity = 2;
        }
    }
    
    /**
     * Select the best correction strategy for a region
     * @private
     */
    _selectCorrectionStrategy(region) {
        switch (region.type) {
            case GLITCH_TYPE.BAILOUT_ARTIFACT:
                // Small artifacts can be interpolated
                if (region.size <= this.thresholds.MAX_ISOLATED_SIZE) {
                    region.correctionStrategy = CORRECTION_STRATEGY.INTERPOLATE;
                } else {
                    region.correctionStrategy = CORRECTION_STRATEGY.INCREASE_ITER;
                }
                break;
                
            case GLITCH_TYPE.PERTURBATION_UNDERFLOW:
                // Need higher precision
                region.correctionStrategy = CORRECTION_STRATEGY.HIGH_PRECISION;
                break;
                
            case GLITCH_TYPE.REFERENCE_ORBIT:
                // Rebase to new reference
                region.correctionStrategy = CORRECTION_STRATEGY.REBASE;
                break;
                
            default:
                // Default to increasing iterations
                region.correctionStrategy = CORRECTION_STRATEGY.INCREASE_ITER;
        }
    }
    
    /**
     * Correct a detected glitch region
     * @param {GlitchRegion} region - Region to correct
     * @param {Object} pixelData - Pixel data
     * @param {Object} viewport - Current viewport
     * @param {number} maxIterations - Maximum iterations
     * @param {number} escapeRadiusSq - Escape radius squared
     * @returns {Promise<boolean>} True if correction successful
     */
    async correct(region, pixelData, viewport, maxIterations, escapeRadiusSq) {
        const startTime = performance.now();
        let success = false;
        
        try {
            switch (region.correctionStrategy) {
                case CORRECTION_STRATEGY.INTERPOLATE:
                    success = this._correctByInterpolation(region, pixelData);
                    break;
                    
                case CORRECTION_STRATEGY.INCREASE_ITER:
                    success = await this._correctByIncreasingIterations(
                        region, pixelData, viewport, maxIterations * 2, escapeRadiusSq
                    );
                    break;
                    
                case CORRECTION_STRATEGY.HIGH_PRECISION:
                    success = await this._correctWithHighPrecision(
                        region, pixelData, viewport, maxIterations, escapeRadiusSq
                    );
                    break;
                    
                case CORRECTION_STRATEGY.REBASE:
                    success = await this._correctByRebasing(
                        region, pixelData, viewport, maxIterations, escapeRadiusSq
                    );
                    break;
            }
            
            if (success) {
                region.corrected = true;
                this.stats.regionsCorrected++;
            }
            
        } catch (err) {
            console.warn(`[GlitchDetector] Correction failed for region:`, err);
        }
        
        this.stats.correctionTime += performance.now() - startTime;
        return success;
    }
    
    /**
     * Correct by interpolating from neighboring pixels
     * @private
     */
    _correctByInterpolation(region, pixelData) {
        const width = this.renderer.config.width;
        
        for (const pixel of region.pixels) {
            const idx = pixel.y * width + pixel.x;
            
            // Collect valid neighbors
            const neighbors = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = pixel.x + dx;
                    const ny = pixel.y + dy;
                    const nIdx = ny * width + nx;
                    
                    // Skip if out of bounds or also a glitch
                    if (nx < 0 || nx >= width || ny < 0 || ny >= this.renderer.config.height) {
                        continue;
                    }
                    if (this.glitchMap[nIdx]) continue;
                    
                    neighbors.push({
                        iterations: pixelData.iterations[nIdx],
                        escaped: pixelData.escaped[nIdx],
                        distance: pixelData.distances[nIdx],
                        potential: pixelData.potential[nIdx]
                    });
                }
            }
            
            if (neighbors.length === 0) continue;
            
            // Average the valid neighbors
            const avgIter = neighbors.reduce((a, n) => a + n.iterations, 0) / neighbors.length;
            const avgDist = neighbors.reduce((a, n) => a + n.distance, 0) / neighbors.length;
            const avgPotential = neighbors.reduce((a, n) => a + n.potential, 0) / neighbors.length;
            
            // Majority vote for escaped status
            const escapedCount = neighbors.filter(n => n.escaped).length;
            const escaped = escapedCount > neighbors.length / 2;
            
            // Apply interpolated values
            pixelData.iterations[idx] = avgIter;
            pixelData.escaped[idx] = escaped ? 1 : 0;
            pixelData.distances[idx] = avgDist;
            pixelData.potential[idx] = avgPotential;
        }
        
        return true;
    }
    
    /**
     * Correct by recalculating with more iterations
     * @private
     */
    async _correctByIncreasingIterations(region, pixelData, viewport, maxIterations, escapeRadiusSq) {
        const width = this.renderer.config.width;
        
        for (const pixel of region.pixels) {
            const idx = pixel.y * width + pixel.x;
            
            // Get fractal coordinates
            const coord = this.renderer._pixelToFractal(pixel.x, pixel.y);
            
            // Recalculate with higher iterations
            const result = this.renderer._computePixel(
                coord.x, coord.y, maxIterations, escapeRadiusSq
            );
            
            // Update pixel data
            pixelData.iterations[idx] = result.iterations;
            pixelData.escaped[idx] = result.escaped ? 1 : 0;
            pixelData.distances[idx] = result.distance || 0;
            pixelData.orbitX[idx] = result.orbitX || 0;
            pixelData.orbitY[idx] = result.orbitY || 0;
            pixelData.potential[idx] = result.potential || 0;
            pixelData.angle[idx] = result.angle || 0;
        }
        
        return true;
    }
    
    /**
     * Correct using higher precision computation
     * @private
     */
    async _correctWithHighPrecision(region, pixelData, viewport, maxIterations, escapeRadiusSq) {
        // For high precision, we'd ideally use the perturbation engine
        // with a local reference orbit centered on the glitch region
        
        // For now, fall back to increased iterations
        // TODO: Implement proper arbitrary precision correction
        return this._correctByIncreasingIterations(
            region, pixelData, viewport, maxIterations * 2, escapeRadiusSq
        );
    }
    
    /**
     * Correct by rebasing to a new reference orbit
     * @private
     */
    async _correctByRebasing(region, pixelData, viewport, maxIterations, escapeRadiusSq) {
        // Calculate a new reference orbit centered on the glitch region
        // This is the proper fix for reference orbit glitches
        
        // For now, use the simpler increased iterations approach
        // TODO: Implement proper rebasing with new reference orbit
        return this._correctByIncreasingIterations(
            region, pixelData, viewport, maxIterations * 2, escapeRadiusSq
        );
    }
    
    /**
     * Get detection statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Set detection thresholds
     * @param {Object} thresholds - Threshold overrides
     */
    setThresholds(thresholds) {
        Object.assign(this.thresholds, thresholds);
    }
    
    /**
     * Enable or disable detection
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Reset detector state
     */
    reset() {
        this.glitchMap = null;
        this.glitchRegions = [];
        this.stats = {
            pixelsAnalyzed: 0,
            glitchPixelsDetected: 0,
            regionsDetected: 0,
            regionsCorrected: 0,
            detectionTime: 0,
            correctionTime: 0
        };
    }
    
    /**
     * Export glitch map for visualization
     * @returns {ImageData|null} Image data with glitch visualization
     */
    exportGlitchMap() {
        if (!this.glitchMap) return null;
        
        const { width, height } = this.renderer.config;
        const imageData = new ImageData(width, height);
        
        for (let i = 0; i < this.glitchMap.length; i++) {
            const idx = i * 4;
            if (this.glitchMap[i]) {
                imageData.data[idx] = 255;     // Red
                imageData.data[idx + 1] = 0;   // Green
                imageData.data[idx + 2] = 0;   // Blue
                imageData.data[idx + 3] = 255; // Alpha
            } else {
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
                imageData.data[idx + 3] = 255;
            }
        }
        
        return imageData;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default GlitchDetector;
export { GlitchRegion, GLITCH_TYPE, CORRECTION_STRATEGY, THRESHOLDS };
