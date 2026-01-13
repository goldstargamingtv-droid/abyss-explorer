/**
 * ============================================================================
 * ABYSS EXPLORER - SUPERSAMPLING
 * ============================================================================
 * 
 * Progressive anti-aliasing via supersampling with support for:
 * - 2x2, 4x4, and adaptive supersampling
 * - Multi-pass rendering with progressive refinement
 * - Edge-aware adaptive sampling (more samples at edges)
 * - Jittered sampling for better quality
 * - Memory-efficient streaming approach
 * 
 * Supersampling Patterns:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  2x2 Grid                  4x4 Grid                   Rotated Grid    │
 * │  ┌─────┬─────┐            ┌──┬──┬──┬──┐             ┌───────────┐     │
 * │  │  x  │  x  │            │x │x │x │x │             │  ◇     ◇  │     │
 * │  ├─────┼─────┤            ├──┼──┼──┼──┤             │     ◇     │     │
 * │  │  x  │  x  │            │x │x │x │x │             │  ◇     ◇  │     │
 * │  └─────┴─────┘            ├──┼──┼──┼──┤             └───────────┘     │
 * │                           │x │x │x │x │                               │
 * │                           ├──┼──┼──┼──┤                               │
 * │                           │x │x │x │x │                               │
 * │                           └──┴──┴──┴──┘                               │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Adaptive Strategy:
 * 1. Render at 1x (initial pass)
 * 2. Detect edges using Sobel or iteration difference
 * 3. Apply 2x2 supersampling to edge pixels
 * 4. For remaining artifacts, apply 4x4
 * 5. Blend results with weighted averaging
 * 
 * @module rendering/supersampling
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Supersampling levels */
const SS_LEVEL = {
    NONE: 1,
    X2: 2,
    X4: 4,
    X8: 8,
    ADAPTIVE: -1
};

/** Sampling patterns */
const SS_PATTERN = {
    GRID: 'grid',
    ROTATED_GRID: 'rotated-grid',
    JITTERED: 'jittered',
    POISSON: 'poisson',
    QUINCUNX: 'quincunx'
};

/** Edge detection threshold for adaptive sampling */
const EDGE_THRESHOLD = 0.5;

/** Iteration difference threshold for edge detection */
const ITER_DIFF_THRESHOLD = 10;

// ============================================================================
// SAMPLE PATTERNS
// ============================================================================

/**
 * Pre-computed sample patterns for various supersampling levels
 * All patterns are normalized to [0, 1] range relative to pixel center
 */
const SAMPLE_PATTERNS = {
    /**
     * 2x2 grid pattern
     * Standard box filter with 4 samples
     */
    grid2x2: [
        { x: -0.25, y: -0.25, weight: 0.25 },
        { x:  0.25, y: -0.25, weight: 0.25 },
        { x: -0.25, y:  0.25, weight: 0.25 },
        { x:  0.25, y:  0.25, weight: 0.25 }
    ],
    
    /**
     * 4x4 grid pattern
     * 16 samples for high-quality AA
     */
    grid4x4: (() => {
        const samples = [];
        const step = 0.5 / 2;
        const weight = 1 / 16;
        
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                samples.push({
                    x: -0.375 + x * 0.25,
                    y: -0.375 + y * 0.25,
                    weight
                });
            }
        }
        return samples;
    })(),
    
    /**
     * Rotated grid pattern (RGSS)
     * Better quality than standard grid at same sample count
     * Samples are rotated 26.6° for optimal coverage
     */
    rotatedGrid4: [
        { x: -0.125, y: -0.375, weight: 0.25 },
        { x:  0.375, y: -0.125, weight: 0.25 },
        { x: -0.375, y:  0.125, weight: 0.25 },
        { x:  0.125, y:  0.375, weight: 0.25 }
    ],
    
    /**
     * 8x rotated grid (8xRGSS)
     */
    rotatedGrid8: [
        { x: -0.0625, y: -0.4375, weight: 0.125 },
        { x:  0.0625, y: -0.1875, weight: 0.125 },
        { x: -0.1875, y: -0.0625, weight: 0.125 },
        { x:  0.4375, y: -0.0625, weight: 0.125 },
        { x: -0.4375, y:  0.0625, weight: 0.125 },
        { x:  0.1875, y:  0.0625, weight: 0.125 },
        { x: -0.0625, y:  0.1875, weight: 0.125 },
        { x:  0.0625, y:  0.4375, weight: 0.125 }
    ],
    
    /**
     * Quincunx pattern (5 samples)
     * Center + 4 corners with center weighted more heavily
     */
    quincunx: [
        { x:  0,    y:  0,    weight: 0.5 },
        { x: -0.5,  y: -0.5,  weight: 0.125 },
        { x:  0.5,  y: -0.5,  weight: 0.125 },
        { x: -0.5,  y:  0.5,  weight: 0.125 },
        { x:  0.5,  y:  0.5,  weight: 0.125 }
    ],
    
    /**
     * Poisson disk distribution (16 samples)
     * Pseudo-random but with minimum distance guarantees
     */
    poisson16: [
        { x: -0.34, y: -0.42, weight: 0.0625 },
        { x:  0.28, y: -0.38, weight: 0.0625 },
        { x: -0.12, y: -0.28, weight: 0.0625 },
        { x:  0.44, y: -0.12, weight: 0.0625 },
        { x: -0.42, y: -0.08, weight: 0.0625 },
        { x:  0.08, y: -0.04, weight: 0.0625 },
        { x: -0.24, y:  0.14, weight: 0.0625 },
        { x:  0.36, y:  0.22, weight: 0.0625 },
        { x: -0.46, y:  0.26, weight: 0.0625 },
        { x:  0.04, y:  0.32, weight: 0.0625 },
        { x: -0.16, y:  0.44, weight: 0.0625 },
        { x:  0.26, y:  0.46, weight: 0.0625 },
        { x: -0.38, y: -0.26, weight: 0.0625 },
        { x:  0.14, y: -0.18, weight: 0.0625 },
        { x: -0.04, y:  0.08, weight: 0.0625 },
        { x:  0.46, y:  0.42, weight: 0.0625 }
    ]
};

// ============================================================================
// SUPERSAMPLING CLASS
// ============================================================================

export class Supersampling {
    /**
     * Create a new supersampling processor
     * @param {Object} renderer - Parent renderer reference
     */
    constructor(renderer) {
        this.renderer = renderer;
        
        // Configuration
        this.level = SS_LEVEL.X2;
        this.pattern = SS_PATTERN.ROTATED_GRID;
        this.adaptiveEnabled = false;
        this.adaptiveThreshold = EDGE_THRESHOLD;
        
        // Accumulators for multi-pass rendering
        this.accumulatorR = null;
        this.accumulatorG = null;
        this.accumulatorB = null;
        this.sampleCount = null;
        
        // Edge mask for adaptive sampling
        this.edgeMask = null;
        
        // Statistics
        this.stats = {
            totalSamples: 0,
            adaptiveSamples: 0,
            renderPasses: 0,
            processingTime: 0
        };
    }
    
    /**
     * Apply supersampling to the rendered image
     * @param {number} level - Supersampling level (2, 4, 8, or -1 for adaptive)
     * @param {string} pattern - Sampling pattern to use
     * @returns {Promise<void>}
     */
    async apply(level = SS_LEVEL.X2, pattern = SS_PATTERN.ROTATED_GRID) {
        this.level = level;
        this.pattern = pattern;
        
        const startTime = performance.now();
        
        console.log(`[Supersampling] Applying ${level === -1 ? 'adaptive' : level + 'x'} ` +
                    `supersampling with ${pattern} pattern`);
        
        const config = this.renderer.config;
        const pixelCount = config.width * config.height;
        
        // Initialize accumulators
        this._initializeAccumulators(pixelCount);
        
        if (level === SS_LEVEL.ADAPTIVE) {
            await this._applyAdaptive();
        } else {
            await this._applyFixed(level, pattern);
        }
        
        // Finalize and write back to pixel data
        this._finalizeAndApply();
        
        this.stats.processingTime = performance.now() - startTime;
        console.log(`[Supersampling] Complete: ${this.stats.totalSamples} samples, ` +
                    `${this.stats.processingTime.toFixed(1)}ms`);
    }
    
    /**
     * Initialize accumulator buffers
     * @private
     */
    _initializeAccumulators(pixelCount) {
        this.accumulatorR = new Float32Array(pixelCount);
        this.accumulatorG = new Float32Array(pixelCount);
        this.accumulatorB = new Float32Array(pixelCount);
        this.sampleCount = new Float32Array(pixelCount);
        
        // Initialize with existing pixel data (pass 1)
        const imageData = this.renderer.imageData;
        for (let i = 0; i < pixelCount; i++) {
            const idx = i * 4;
            this.accumulatorR[i] = imageData.data[idx] / 255;
            this.accumulatorG[i] = imageData.data[idx + 1] / 255;
            this.accumulatorB[i] = imageData.data[idx + 2] / 255;
            this.sampleCount[i] = 1;
        }
        
        this.stats.totalSamples = pixelCount;
        this.stats.renderPasses = 1;
    }
    
    /**
     * Apply fixed-level supersampling
     * @private
     */
    async _applyFixed(level, pattern) {
        const samples = this._getSamplePattern(level, pattern);
        const config = this.renderer.config;
        const { width, height } = config;
        
        // Skip center sample (already rendered)
        const subSamples = samples.filter(s => s.x !== 0 || s.y !== 0);
        
        for (const sample of subSamples) {
            // Render at sub-pixel offset
            await this._renderSubPixelPass(sample.x, sample.y, sample.weight);
            this.stats.renderPasses++;
            
            // Yield to event loop for responsiveness
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    /**
     * Apply adaptive supersampling
     * @private
     */
    async _applyAdaptive() {
        const config = this.renderer.config;
        const { width, height } = config;
        
        // Step 1: Detect edges
        this._detectEdges();
        
        // Step 2: Apply 2x2 supersampling to edge pixels
        const samples2x = SAMPLE_PATTERNS.rotatedGrid4;
        
        let adaptivePixels = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (this.edgeMask[idx]) {
                    // Apply extra samples
                    for (const sample of samples2x) {
                        if (sample.x !== 0 || sample.y !== 0) {
                            await this._renderSinglePixel(x, y, sample.x, sample.y, sample.weight);
                        }
                    }
                    adaptivePixels++;
                }
            }
            
            // Progress update every 50 rows
            if (y % 50 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        this.stats.adaptiveSamples = adaptivePixels * 4;
        this.stats.totalSamples += this.stats.adaptiveSamples;
        
        console.log(`[Supersampling] Adaptive: ${adaptivePixels} edge pixels sampled`);
    }
    
    /**
     * Detect edges in the current render for adaptive sampling
     * @private
     */
    _detectEdges() {
        const config = this.renderer.config;
        const { width, height } = config;
        const pixelData = this.renderer.pixelData;
        
        this.edgeMask = new Uint8Array(width * height);
        
        // Use iteration count differences for edge detection
        // This is more robust than color-based detection for fractals
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const iter = pixelData.iterations[idx];
                
                // Check neighbors
                const iterTop = pixelData.iterations[(y - 1) * width + x];
                const iterBot = pixelData.iterations[(y + 1) * width + x];
                const iterLeft = pixelData.iterations[y * width + (x - 1)];
                const iterRight = pixelData.iterations[y * width + (x + 1)];
                
                // Calculate max difference
                const maxDiff = Math.max(
                    Math.abs(iter - iterTop),
                    Math.abs(iter - iterBot),
                    Math.abs(iter - iterLeft),
                    Math.abs(iter - iterRight)
                );
                
                // Also check diagonal neighbors for better coverage
                const iterTL = pixelData.iterations[(y - 1) * width + (x - 1)];
                const iterTR = pixelData.iterations[(y - 1) * width + (x + 1)];
                const iterBL = pixelData.iterations[(y + 1) * width + (x - 1)];
                const iterBR = pixelData.iterations[(y + 1) * width + (x + 1)];
                
                const maxDiagDiff = Math.max(
                    Math.abs(iter - iterTL),
                    Math.abs(iter - iterTR),
                    Math.abs(iter - iterBL),
                    Math.abs(iter - iterBR)
                );
                
                // Check escaped status differences
                const escaped = pixelData.escaped[idx];
                const hasEscapeDiff = (
                    escaped !== pixelData.escaped[(y - 1) * width + x] ||
                    escaped !== pixelData.escaped[(y + 1) * width + x] ||
                    escaped !== pixelData.escaped[y * width + (x - 1)] ||
                    escaped !== pixelData.escaped[y * width + (x + 1)]
                );
                
                // Mark as edge if threshold exceeded
                if (maxDiff > ITER_DIFF_THRESHOLD || 
                    maxDiagDiff > ITER_DIFF_THRESHOLD * 1.41 ||
                    hasEscapeDiff) {
                    this.edgeMask[idx] = 1;
                }
            }
        }
    }
    
    /**
     * Render a full sub-pixel pass at the given offset
     * @private
     */
    async _renderSubPixelPass(offsetX, offsetY, weight) {
        const config = this.renderer.config;
        const { width, height } = config;
        
        // Compute all pixels at this sub-pixel offset
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                await this._renderSinglePixel(x, y, offsetX, offsetY, weight);
            }
            
            // Yield periodically
            if (y % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
    }
    
    /**
     * Render a single pixel at a sub-pixel offset and accumulate
     * @private
     */
    async _renderSinglePixel(px, py, offsetX, offsetY, weight) {
        const config = this.renderer.config;
        const { width, maxIterations, escapeRadiusSq } = config;
        
        const idx = py * width + px;
        
        // Calculate sub-pixel fractal coordinates
        const subPixelX = px + offsetX;
        const subPixelY = py + offsetY;
        const coord = this.renderer._pixelToFractal(subPixelX, subPixelY);
        
        // Compute the fractal at this sub-pixel location
        const result = this.renderer._computePixel(
            coord.x, coord.y, maxIterations, escapeRadiusSq
        );
        
        // Get color for this result
        const color = this._getColorForResult(result);
        
        // Accumulate
        this.accumulatorR[idx] += color.r * weight;
        this.accumulatorG[idx] += color.g * weight;
        this.accumulatorB[idx] += color.b * weight;
        this.sampleCount[idx] += weight;
        
        this.stats.totalSamples++;
    }
    
    /**
     * Get color for a computed result
     * @private
     */
    _getColorForResult(result) {
        if (!result.escaped) {
            return { r: 0, g: 0, b: 0 };
        }
        
        // Use the renderer's color LUT if available
        if (this.renderer.colorLUT) {
            const lutIdx = (Math.floor(result.iterations) % 256) * 4;
            return {
                r: this.renderer.colorLUT[lutIdx] / 255,
                g: this.renderer.colorLUT[lutIdx + 1] / 255,
                b: this.renderer.colorLUT[lutIdx + 2] / 255
            };
        }
        
        // Default HSL-based coloring
        const hue = (result.iterations * 3.5) % 360;
        return this._hslToRgb(hue / 360, 0.8, 0.5);
    }
    
    /**
     * Convert HSL to RGB (0-1 range)
     * @private
     */
    _hslToRgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return { r, g, b };
    }
    
    /**
     * Get the appropriate sample pattern for a level and type
     * @private
     */
    _getSamplePattern(level, pattern) {
        switch (pattern) {
            case SS_PATTERN.ROTATED_GRID:
                if (level <= 4) return SAMPLE_PATTERNS.rotatedGrid4;
                if (level <= 8) return SAMPLE_PATTERNS.rotatedGrid8;
                return SAMPLE_PATTERNS.poisson16;
                
            case SS_PATTERN.QUINCUNX:
                return SAMPLE_PATTERNS.quincunx;
                
            case SS_PATTERN.POISSON:
                return SAMPLE_PATTERNS.poisson16;
                
            case SS_PATTERN.GRID:
            default:
                if (level <= 2) return SAMPLE_PATTERNS.grid2x2;
                return SAMPLE_PATTERNS.grid4x4;
        }
    }
    
    /**
     * Finalize accumulated samples and write to image
     * @private
     */
    _finalizeAndApply() {
        const config = this.renderer.config;
        const pixelCount = config.width * config.height;
        const imageData = this.renderer.imageData;
        
        for (let i = 0; i < pixelCount; i++) {
            const count = this.sampleCount[i];
            const idx = i * 4;
            
            // Normalize by sample count
            const r = this.accumulatorR[i] / count;
            const g = this.accumulatorG[i] / count;
            const b = this.accumulatorB[i] / count;
            
            // Clamp and convert to 8-bit
            imageData.data[idx] = Math.round(Math.max(0, Math.min(1, r)) * 255);
            imageData.data[idx + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
            imageData.data[idx + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
            imageData.data[idx + 3] = 255;
        }
        
        // Write to buffer canvas
        this.renderer.bufferCtx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Generate jittered sample pattern
     * @param {number} count - Number of samples
     * @returns {Array} Array of {x, y, weight} samples
     */
    generateJitteredPattern(count) {
        const samples = [];
        const sqrtCount = Math.ceil(Math.sqrt(count));
        const weight = 1 / count;
        
        for (let i = 0; i < sqrtCount; i++) {
            for (let j = 0; j < sqrtCount && samples.length < count; j++) {
                // Grid position with jitter
                const x = (i + Math.random()) / sqrtCount - 0.5;
                const y = (j + Math.random()) / sqrtCount - 0.5;
                
                samples.push({ x, y, weight });
            }
        }
        
        return samples;
    }
    
    /**
     * Generate Poisson disk distribution
     * @param {number} count - Approximate number of samples
     * @param {number} minDist - Minimum distance between samples
     * @returns {Array} Array of {x, y, weight} samples
     */
    generatePoissonDisk(count, minDist = 0.2) {
        const samples = [];
        const active = [];
        const k = 30; // Attempts per point
        const weight = 1 / count;
        
        // Start with center point
        const first = { x: 0, y: 0 };
        samples.push({ ...first, weight });
        active.push(first);
        
        while (active.length > 0 && samples.length < count) {
            // Pick random active point
            const idx = Math.floor(Math.random() * active.length);
            const point = active[idx];
            
            let found = false;
            for (let i = 0; i < k; i++) {
                // Random point in annulus
                const angle = Math.random() * 2 * Math.PI;
                const dist = minDist + Math.random() * minDist;
                const newX = point.x + dist * Math.cos(angle);
                const newY = point.y + dist * Math.sin(angle);
                
                // Check bounds
                if (newX < -0.5 || newX > 0.5 || newY < -0.5 || newY > 0.5) {
                    continue;
                }
                
                // Check distance to all other samples
                let valid = true;
                for (const sample of samples) {
                    const dx = newX - sample.x;
                    const dy = newY - sample.y;
                    if (dx * dx + dy * dy < minDist * minDist) {
                        valid = false;
                        break;
                    }
                }
                
                if (valid) {
                    const newPoint = { x: newX, y: newY };
                    samples.push({ ...newPoint, weight });
                    active.push(newPoint);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                active.splice(idx, 1);
            }
        }
        
        // Normalize weights
        const totalWeight = samples.length;
        for (const sample of samples) {
            sample.weight = 1 / totalWeight;
        }
        
        return samples;
    }
    
    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Reset state
     */
    reset() {
        this.accumulatorR = null;
        this.accumulatorG = null;
        this.accumulatorB = null;
        this.sampleCount = null;
        this.edgeMask = null;
        
        this.stats = {
            totalSamples: 0,
            adaptiveSamples: 0,
            renderPasses: 0,
            processingTime: 0
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Supersampling;
export { SS_LEVEL, SS_PATTERN, SAMPLE_PATTERNS };
