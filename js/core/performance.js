/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                     ABYSS EXPLORER - PERFORMANCE MONITOR                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  FPS tracking, performance metrics, and adaptive quality management           ║
 * ║                                                                                ║
 * ║  Responsibilities:                                                             ║
 * ║  - Track frame times and calculate FPS                                        ║
 * ║  - Monitor render times and memory usage                                      ║
 * ║  - Provide adaptive quality recommendations                                   ║
 * ║  - Generate iteration budgets based on performance                            ║
 * ║  - Manage stats overlay display                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Config } from '../config.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// PERFORMANCE MONITOR CLASS
// =============================================================================

/**
 * Performance Monitoring System
 * 
 * Tracks application performance and provides recommendations
 * for adaptive quality adjustments.
 * 
 * @class PerformanceMonitor
 */
export class PerformanceMonitor {
    /**
     * Create performance monitor
     * 
     * @param {EventBus} events - Event bus for notifications
     */
    constructor(events) {
        /** @type {EventBus} */
        this.events = events;
        
        /** @type {Logger} */
        this.logger = new Logger('Performance');

        // =================================================================
        // Frame Timing
        // =================================================================
        
        /** @type {number} Last frame timestamp */
        this._lastFrameTime = 0;
        
        /** @type {number} Current frame start time */
        this._frameStart = 0;
        
        /** @type {number[]} Recent frame times (ms) */
        this._frameTimes = [];
        
        /** @type {number} Maximum frames to track */
        this._maxFrameSamples = Config.performance.fpsAverageFrames;

        // =================================================================
        // Render Timing
        // =================================================================
        
        /** @type {number[]} Recent render times */
        this._renderTimes = [];
        
        /** @type {number} Maximum render samples */
        this._maxRenderSamples = 10;
        
        /** @type {number} Current render start time */
        this._renderStart = 0;

        // =================================================================
        // Statistics
        // =================================================================
        
        /** @type {Object} Current performance statistics */
        this._stats = {
            fps: 0,
            frameTime: 0,
            frameTimeSmoothed: 0,
            renderTime: 0,
            renderTimeAvg: 0,
            memoryUsed: 0,
            memoryLimit: 0,
            gpuMemory: 0,
            iterationsPerSecond: 0,
            pixelsPerSecond: 0,
            tilesPerSecond: 0
        };

        // =================================================================
        // Adaptive Quality
        // =================================================================
        
        /** @type {number} Current quality level (0-1) */
        this._qualityLevel = 1.0;
        
        /** @type {number} Target FPS */
        this._targetFPS = Config.performance.targetFPS;
        
        /** @type {number} Minimum acceptable FPS */
        this._minFPS = Config.performance.minFPS;
        
        /** @type {number} Quality adjustment cooldown */
        this._qualityAdjustCooldown = 0;

        // =================================================================
        // Iteration Budget
        // =================================================================
        
        /** @type {number} Current iteration budget */
        this._iterationBudget = Config.rendering.maxIterations;
        
        /** @type {number} Budget calculation timestamp */
        this._budgetTimestamp = 0;

        // =================================================================
        // State
        // =================================================================
        
        /** @type {boolean} Whether monitoring is active */
        this._active = true;
        
        /** @type {boolean} Whether monitoring is paused */
        this._paused = false;
        
        /** @type {number|null} Update interval ID */
        this._updateInterval = null;

        // Bind methods
        this._onVisibilityChange = this._onVisibilityChange.bind(this);

        // Set up visibility change listener
        document.addEventListener('visibilitychange', this._onVisibilityChange);

        // Start update loop
        this._startUpdateLoop();
    }

    // =========================================================================
    // FRAME TIMING
    // =========================================================================

    /**
     * Mark the beginning of a frame
     * 
     * Call at the start of each render loop iteration.
     */
    beginFrame() {
        this._frameStart = performance.now();
    }

    /**
     * Mark the end of a frame
     * 
     * Call at the end of each render loop iteration.
     * Calculates frame time and updates FPS.
     */
    endFrame() {
        const now = performance.now();
        const frameTime = now - this._frameStart;

        // Record frame time
        this._frameTimes.push(frameTime);
        if (this._frameTimes.length > this._maxFrameSamples) {
            this._frameTimes.shift();
        }

        // Calculate instantaneous FPS
        const instantFPS = frameTime > 0 ? 1000 / frameTime : 0;

        // Calculate smoothed FPS
        const avgFrameTime = this._calculateAverage(this._frameTimes);
        const smoothedFPS = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

        // Update stats
        this._stats.frameTime = frameTime;
        this._stats.frameTimeSmoothed = avgFrameTime;
        this._stats.fps = Config.performance.smoothFrameTime ? smoothedFPS : instantFPS;

        // Update last frame time
        this._lastFrameTime = now;

        // Check for quality adjustment
        if (Config.performance.adaptiveQuality) {
            this._updateAdaptiveQuality();
        }
    }

    // =========================================================================
    // RENDER TIMING
    // =========================================================================

    /**
     * Mark the start of a render operation
     */
    beginRender() {
        this._renderStart = performance.now();
    }

    /**
     * Mark the end of a render operation
     * 
     * @param {Object} [stats] - Additional render statistics
     * @param {number} [stats.iterations] - Total iterations computed
     * @param {number} [stats.pixels] - Total pixels rendered
     * @param {number} [stats.tiles] - Number of tiles rendered
     */
    endRender(stats = {}) {
        const renderTime = performance.now() - this._renderStart;

        // Record render time
        this._renderTimes.push(renderTime);
        if (this._renderTimes.length > this._maxRenderSamples) {
            this._renderTimes.shift();
        }

        // Update stats
        this._stats.renderTime = renderTime;
        this._stats.renderTimeAvg = this._calculateAverage(this._renderTimes);

        // Calculate throughput
        if (stats.iterations && renderTime > 0) {
            this._stats.iterationsPerSecond = (stats.iterations / renderTime) * 1000;
        }

        if (stats.pixels && renderTime > 0) {
            this._stats.pixelsPerSecond = (stats.pixels / renderTime) * 1000;
        }

        if (stats.tiles && renderTime > 0) {
            this._stats.tilesPerSecond = (stats.tiles / renderTime) * 1000;
        }

        // Emit event
        this.events.emit('performance:render', {
            time: renderTime,
            stats: this._stats
        });
    }

    // =========================================================================
    // ADAPTIVE QUALITY
    // =========================================================================

    /**
     * Update adaptive quality based on current performance
     * @private
     */
    _updateAdaptiveQuality() {
        // Cooldown to prevent rapid changes
        if (this._qualityAdjustCooldown > 0) {
            this._qualityAdjustCooldown--;
            return;
        }

        const fps = this._stats.fps;
        const prevQuality = this._qualityLevel;

        if (fps < this._minFPS) {
            // Performance critical - reduce quality
            this._qualityLevel = Math.max(0.25, this._qualityLevel - 0.1);
            this._qualityAdjustCooldown = 30; // Wait 30 frames
        } else if (fps < this._targetFPS * 0.9) {
            // Below target - slightly reduce quality
            this._qualityLevel = Math.max(0.5, this._qualityLevel - 0.05);
            this._qualityAdjustCooldown = 15;
        } else if (fps > this._targetFPS * 1.2 && this._qualityLevel < 1.0) {
            // Above target - can increase quality
            this._qualityLevel = Math.min(1.0, this._qualityLevel + 0.05);
            this._qualityAdjustCooldown = 30;
        }

        // Emit event if quality changed
        if (prevQuality !== this._qualityLevel) {
            this.logger.debug(`Quality adjusted: ${(this._qualityLevel * 100).toFixed(0)}%`);
            this.events.emit('performance:qualityChanged', {
                quality: this._qualityLevel,
                reason: fps < this._targetFPS ? 'low-fps' : 'high-fps'
            });
        }
    }

    /**
     * Get current quality level
     * @returns {number} Quality level between 0 and 1
     */
    getQualityLevel() {
        return this._qualityLevel;
    }

    /**
     * Force a specific quality level
     * @param {number} level - Quality level (0-1)
     */
    setQualityLevel(level) {
        this._qualityLevel = Math.max(0, Math.min(1, level));
        this._qualityAdjustCooldown = 60; // Prevent auto-adjustment
    }

    /**
     * Get quality-adjusted value
     * 
     * Returns a value scaled by current quality level.
     * 
     * @param {number} baseValue - Base value at 100% quality
     * @param {number} [minValue] - Minimum value
     * @returns {number}
     */
    getQualityAdjusted(baseValue, minValue = 0) {
        return Math.max(minValue, Math.round(baseValue * this._qualityLevel));
    }

    // =========================================================================
    // ITERATION BUDGET
    // =========================================================================

    /**
     * Calculate iteration budget for a render operation
     * 
     * Returns recommended max iterations based on available time budget.
     * 
     * @param {number} targetTime - Target render time in ms
     * @param {number} pixelCount - Number of pixels to render
     * @returns {number} Recommended max iterations
     */
    calculateIterationBudget(targetTime, pixelCount) {
        // Use historical iterations per second if available
        if (this._stats.iterationsPerSecond > 0) {
            const availableIterations = this._stats.iterationsPerSecond * (targetTime / 1000);
            const iterationsPerPixel = availableIterations / pixelCount;
            
            // Clamp to reasonable range
            const budget = Math.round(Math.max(50, Math.min(10000, iterationsPerPixel)));
            this._iterationBudget = budget;
            return budget;
        }

        // Fallback to configured max
        return Config.rendering.maxIterations;
    }

    /**
     * Get current iteration budget
     * @returns {number}
     */
    getIterationBudget() {
        return this._iterationBudget;
    }

    // =========================================================================
    // MEMORY MONITORING
    // =========================================================================

    /**
     * Update memory statistics
     * @private
     */
    _updateMemoryStats() {
        // JavaScript heap memory (if available)
        if (performance.memory) {
            this._stats.memoryUsed = performance.memory.usedJSHeapSize;
            this._stats.memoryLimit = performance.memory.jsHeapSizeLimit;
        }

        // GPU memory estimate (rough)
        // This is approximate and based on known allocations
        // A proper implementation would query WebGL extensions
    }

    /**
     * Get memory usage as percentage
     * @returns {number}
     */
    getMemoryUsagePercent() {
        if (this._stats.memoryLimit > 0) {
            return (this._stats.memoryUsed / this._stats.memoryLimit) * 100;
        }
        return 0;
    }

    /**
     * Check if memory is critical
     * @returns {boolean}
     */
    isMemoryCritical() {
        return this.getMemoryUsagePercent() > 90;
    }

    // =========================================================================
    // STATISTICS
    // =========================================================================

    /**
     * Get all current statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this._stats, qualityLevel: this._qualityLevel };
    }

    /**
     * Get formatted stats for display
     * @returns {Object}
     */
    getFormattedStats() {
        const stats = this._stats;
        
        return {
            fps: `${stats.fps.toFixed(1)} FPS`,
            frameTime: `${stats.frameTimeSmoothed.toFixed(1)} ms`,
            renderTime: `${stats.renderTime.toFixed(0)} ms`,
            quality: `${(this._qualityLevel * 100).toFixed(0)}%`,
            memory: stats.memoryLimit > 0 
                ? `${this._formatBytes(stats.memoryUsed)} / ${this._formatBytes(stats.memoryLimit)}`
                : 'N/A',
            iterationsPerSec: this._formatNumber(stats.iterationsPerSecond),
            pixelsPerSec: this._formatNumber(stats.pixelsPerSecond)
        };
    }

    /**
     * Format bytes to human-readable string
     * @private
     * @param {number} bytes
     * @returns {string}
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    }

    /**
     * Format large number
     * @private
     * @param {number} num
     * @returns {string}
     */
    _formatNumber(num) {
        if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
        return num.toFixed(0);
    }

    // =========================================================================
    // BENCHMARKING
    // =========================================================================

    /**
     * Run a benchmark
     * 
     * @param {Function} fn - Function to benchmark
     * @param {number} [iterations=100] - Number of iterations
     * @returns {Object} Benchmark results
     */
    async benchmark(fn, iterations = 100) {
        const times = [];
        
        // Warmup
        for (let i = 0; i < 5; i++) {
            await fn();
        }

        // Benchmark
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            times.push(performance.now() - start);
        }

        // Calculate statistics
        const sorted = [...times].sort((a, b) => a - b);
        
        return {
            iterations,
            total: times.reduce((a, b) => a + b, 0),
            mean: this._calculateAverage(times),
            median: sorted[Math.floor(sorted.length / 2)],
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }

    /**
     * Create a timer for profiling
     * @param {string} name - Timer name
     * @returns {Object} Timer object with end() method
     */
    createTimer(name) {
        const start = performance.now();
        
        return {
            end: () => {
                const duration = performance.now() - start;
                this.logger.debug(`[Timer] ${name}: ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }

    // =========================================================================
    // UPDATE LOOP
    // =========================================================================

    /**
     * Start the stats update loop
     * @private
     */
    _startUpdateLoop() {
        // Update memory stats periodically
        this._updateInterval = setInterval(() => {
            if (!this._paused) {
                this._updateMemoryStats();
                this.events.emit('performance:update', this._stats);
            }
        }, 1000);
    }

    /**
     * Stop the stats update loop
     * @private
     */
    _stopUpdateLoop() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
            this._updateInterval = null;
        }
    }

    // =========================================================================
    // UTILITY
    // =========================================================================

    /**
     * Calculate average of array
     * @private
     * @param {number[]} arr
     * @returns {number}
     */
    _calculateAverage(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    // =========================================================================
    // LIFECYCLE
    // =========================================================================

    /**
     * Handle visibility change
     * @private
     */
    _onVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }

    /**
     * Pause monitoring
     */
    pause() {
        this._paused = true;
    }

    /**
     * Resume monitoring
     */
    resume() {
        this._paused = false;
        this._lastFrameTime = performance.now();
        
        // Clear stale frame times
        this._frameTimes = [];
    }

    /**
     * Reset all statistics
     */
    reset() {
        this._frameTimes = [];
        this._renderTimes = [];
        this._qualityLevel = 1.0;
        this._qualityAdjustCooldown = 0;
        
        this._stats = {
            fps: 0,
            frameTime: 0,
            frameTimeSmoothed: 0,
            renderTime: 0,
            renderTimeAvg: 0,
            memoryUsed: 0,
            memoryLimit: 0,
            gpuMemory: 0,
            iterationsPerSecond: 0,
            pixelsPerSecond: 0,
            tilesPerSecond: 0
        };
    }

    /**
     * Dispose of performance monitor
     */
    dispose() {
        this._stopUpdateLoop();
        document.removeEventListener('visibilitychange', this._onVisibilityChange);
        this.logger.info('Performance monitor disposed');
    }
}

// =============================================================================
// PROFILER DECORATOR
// =============================================================================

/**
 * Create a profiled version of a function
 * 
 * @param {Function} fn - Function to profile
 * @param {string} name - Profile name
 * @param {PerformanceMonitor} monitor - Performance monitor instance
 * @returns {Function}
 */
export function profileFunction(fn, name, monitor) {
    return async function(...args) {
        const timer = monitor.createTimer(name);
        try {
            return await fn.apply(this, args);
        } finally {
            timer.end();
        }
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default PerformanceMonitor;
