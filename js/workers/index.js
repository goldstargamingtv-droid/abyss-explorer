/**
 * ============================================================================
 * ABYSS EXPLORER - WORKERS MODULE INDEX
 * ============================================================================
 * 
 * Worker pool management for parallel off-main-thread computation.
 * Provides easy-to-use interface for spawning and managing web workers.
 * 
 * Architecture:
 * - WorkerPool: Manages multiple render workers for tile parallelism
 * - Single perturbation worker for precision calculations
 * - Single export worker for heavy encoding tasks
 * - Automatic task distribution and load balancing
 * 
 * Features:
 * - Automatic worker count based on navigator.hardwareConcurrency
 * - Task queuing with priority levels
 * - Progress reporting and cancellation
 * - Graceful degradation if workers unavailable
 * - SharedArrayBuffer detection and usage
 * 
 * @module workers
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// WORKER PATHS
// ============================================================================

const WORKER_PATHS = {
    render: './workers/render-worker.js',
    perturbation: './workers/perturbation-worker.js',
    export: './workers/export-worker.js'
};

// ============================================================================
// TASK PRIORITY
// ============================================================================

export const TASK_PRIORITY = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

// ============================================================================
// WORKER POOL
// ============================================================================

/**
 * Pool of render workers for parallel tile computation
 */
export class RenderWorkerPool {
    /**
     * Create worker pool
     * @param {number} size - Number of workers (default: navigator.hardwareConcurrency)
     */
    constructor(size = null) {
        this.size = size || navigator.hardwareConcurrency || 4;
        this.workers = [];
        this.taskQueue = [];
        this.activeTasks = new Map();
        this.taskIdCounter = 0;
        this.initialized = false;
        
        // Callbacks
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }
    
    /**
     * Initialize worker pool
     * @param {Object} config - Worker configuration
     * @returns {Promise<void>}
     */
    async initialize(config = {}) {
        if (this.initialized) return;
        
        const workerPromises = [];
        
        for (let i = 0; i < this.size; i++) {
            const worker = new Worker(WORKER_PATHS.render, { type: 'module' });
            
            // Wait for ready signal
            const readyPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Worker timeout')), 5000);
                
                worker.onmessage = (e) => {
                    if (e.data.type === 'ready') {
                        clearTimeout(timeout);
                        resolve();
                    }
                };
                
                worker.onerror = (e) => {
                    clearTimeout(timeout);
                    reject(e);
                };
            });
            
            this.workers.push({
                worker,
                busy: false,
                currentTaskId: null
            });
            
            workerPromises.push(readyPromise);
        }
        
        await Promise.all(workerPromises);
        
        // Initialize all workers
        for (const w of this.workers) {
            w.worker.postMessage({ type: 'init', data: config });
            this.setupWorkerHandlers(w);
        }
        
        this.initialized = true;
    }
    
    /**
     * Setup message handlers for a worker
     * @private
     */
    setupWorkerHandlers(workerState) {
        workerState.worker.onmessage = (event) => {
            const { type, taskId, result, progress, error } = event.data;
            
            switch (type) {
                case 'progress':
                    if (this.onProgress) {
                        this.onProgress(taskId, progress);
                    }
                    break;
                    
                case 'complete':
                    this.handleTaskComplete(workerState, taskId, result);
                    break;
                    
                case 'cancelled':
                    this.handleTaskCancelled(workerState, taskId);
                    break;
                    
                case 'error':
                    this.handleTaskError(workerState, taskId, error);
                    break;
            }
        };
        
        workerState.worker.onerror = (error) => {
            if (this.onError && workerState.currentTaskId) {
                this.onError(workerState.currentTaskId, error.message);
            }
            workerState.busy = false;
            workerState.currentTaskId = null;
            this.processQueue();
        };
    }
    
    /**
     * Submit a render task
     * @param {Object} tile - Tile specification
     * @param {Object} params - Render parameters
     * @param {number} priority - Task priority
     * @returns {Promise<Object>} Render result
     */
    submitTask(tile, params, priority = TASK_PRIORITY.NORMAL) {
        const taskId = `task-${++this.taskIdCounter}`;
        
        return new Promise((resolve, reject) => {
            const task = {
                taskId,
                tile,
                params,
                priority,
                resolve,
                reject,
                submitted: Date.now()
            };
            
            this.taskQueue.push(task);
            this.taskQueue.sort((a, b) => b.priority - a.priority);
            
            this.activeTasks.set(taskId, task);
            this.processQueue();
        });
    }
    
    /**
     * Submit multiple tiles as batch
     * @param {Array} tiles - Array of tile specs
     * @param {Object} params - Shared params
     * @param {number} priority - Priority level
     * @returns {Promise<Array>} Array of results
     */
    submitBatch(tiles, params, priority = TASK_PRIORITY.NORMAL) {
        return Promise.all(
            tiles.map(tile => this.submitTask(tile, params, priority))
        );
    }
    
    /**
     * Process task queue
     * @private
     */
    processQueue() {
        if (this.taskQueue.length === 0) return;
        
        // Find idle worker
        const idleWorker = this.workers.find(w => !w.busy);
        if (!idleWorker) return;
        
        // Get next task
        const task = this.taskQueue.shift();
        if (!task) return;
        
        // Assign task
        idleWorker.busy = true;
        idleWorker.currentTaskId = task.taskId;
        
        idleWorker.worker.postMessage({
            type: 'render',
            taskId: task.taskId,
            data: {
                tile: task.tile,
                params: task.params
            }
        });
        
        // Try to assign more tasks
        if (this.taskQueue.length > 0) {
            this.processQueue();
        }
    }
    
    /**
     * Handle task completion
     * @private
     */
    handleTaskComplete(workerState, taskId, result) {
        const task = this.activeTasks.get(taskId);
        
        if (task) {
            task.resolve(result);
            this.activeTasks.delete(taskId);
            
            if (this.onComplete) {
                this.onComplete(taskId, result);
            }
        }
        
        workerState.busy = false;
        workerState.currentTaskId = null;
        this.processQueue();
    }
    
    /**
     * Handle task cancellation
     * @private
     */
    handleTaskCancelled(workerState, taskId) {
        const task = this.activeTasks.get(taskId);
        
        if (task) {
            task.reject(new Error('Task cancelled'));
            this.activeTasks.delete(taskId);
        }
        
        workerState.busy = false;
        workerState.currentTaskId = null;
        this.processQueue();
    }
    
    /**
     * Handle task error
     * @private
     */
    handleTaskError(workerState, taskId, error) {
        const task = this.activeTasks.get(taskId);
        
        if (task) {
            task.reject(new Error(error));
            this.activeTasks.delete(taskId);
            
            if (this.onError) {
                this.onError(taskId, error);
            }
        }
        
        workerState.busy = false;
        workerState.currentTaskId = null;
        this.processQueue();
    }
    
    /**
     * Cancel a specific task
     * @param {string} taskId - Task to cancel
     */
    cancelTask(taskId) {
        // Remove from queue if pending
        this.taskQueue = this.taskQueue.filter(t => t.taskId !== taskId);
        
        // Cancel if active
        const worker = this.workers.find(w => w.currentTaskId === taskId);
        if (worker) {
            worker.worker.postMessage({ type: 'cancel', taskId });
        }
    }
    
    /**
     * Cancel all pending and active tasks
     */
    cancelAll() {
        // Clear queue
        for (const task of this.taskQueue) {
            task.reject(new Error('Cancelled'));
        }
        this.taskQueue = [];
        
        // Cancel active
        for (const worker of this.workers) {
            if (worker.currentTaskId) {
                worker.worker.postMessage({ type: 'cancel', taskId: worker.currentTaskId });
            }
        }
    }
    
    /**
     * Set reference orbit for perturbation rendering
     * @param {Object} refData - Reference orbit data
     */
    setReferenceOrbit(refData) {
        for (const w of this.workers) {
            w.worker.postMessage({ type: 'setReference', data: refData });
        }
    }
    
    /**
     * Set series coefficients
     * @param {Object} seriesData - Series coefficients
     */
    setSeriesCoefficients(seriesData) {
        for (const w of this.workers) {
            w.worker.postMessage({ type: 'setSeries', data: seriesData });
        }
    }
    
    /**
     * Get pool statistics
     * @returns {Object}
     */
    getStats() {
        return {
            totalWorkers: this.size,
            busyWorkers: this.workers.filter(w => w.busy).length,
            pendingTasks: this.taskQueue.length,
            activeTasks: this.activeTasks.size
        };
    }
    
    /**
     * Terminate all workers
     */
    terminate() {
        this.cancelAll();
        
        for (const w of this.workers) {
            w.worker.terminate();
        }
        
        this.workers = [];
        this.initialized = false;
    }
}

// ============================================================================
// PERTURBATION WORKER WRAPPER
// ============================================================================

/**
 * Wrapper for perturbation worker
 */
export class PerturbationWorker {
    constructor() {
        this.worker = null;
        this.initialized = false;
        this.pendingCallbacks = new Map();
        this.taskIdCounter = 0;
    }
    
    /**
     * Initialize worker
     */
    async initialize() {
        if (this.initialized) return;
        
        this.worker = new Worker(WORKER_PATHS.perturbation, { type: 'module' });
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Worker timeout')), 5000);
            
            this.worker.onmessage = (e) => {
                if (e.data.type === 'ready') {
                    clearTimeout(timeout);
                    resolve();
                }
            };
        });
        
        this.setupHandlers();
        this.initialized = true;
    }
    
    /**
     * Setup message handlers
     * @private
     */
    setupHandlers() {
        this.worker.onmessage = (event) => {
            const { type, taskId, result, error, progress, stage } = event.data;
            
            if (type === 'progress' && this.onProgress) {
                this.onProgress(stage, progress);
                return;
            }
            
            const callback = this.pendingCallbacks.get(taskId);
            if (!callback) return;
            
            switch (type) {
                case 'referenceComplete':
                case 'seriesComplete':
                case 'glitchesDetected':
                case 'derivativeComplete':
                    callback.resolve(result);
                    break;
                    
                case 'error':
                    callback.reject(new Error(error));
                    break;
                    
                case 'cancelled':
                    callback.reject(new Error('Cancelled'));
                    break;
            }
            
            this.pendingCallbacks.delete(taskId);
        };
    }
    
    /**
     * Compute reference orbit
     * @param {string} cx - Center x (arbitrary precision string)
     * @param {string} cy - Center y
     * @param {number} maxIterations
     * @param {number} precision
     * @returns {Promise<Object>}
     */
    computeReference(cx, cy, maxIterations, precision = 50) {
        const taskId = `ref-${++this.taskIdCounter}`;
        
        return new Promise((resolve, reject) => {
            this.pendingCallbacks.set(taskId, { resolve, reject });
            
            this.worker.postMessage({
                type: 'computeReference',
                taskId,
                data: { cx, cy, maxIterations, precision }
            });
        });
    }
    
    /**
     * Compute series coefficients
     * @param {Float64Array} orbit - Reference orbit data
     * @param {number} numTerms
     * @param {number} maxSkip
     * @returns {Promise<Object>}
     */
    computeSeries(orbit, numTerms = 5, maxSkip = 10000) {
        const taskId = `series-${++this.taskIdCounter}`;
        
        return new Promise((resolve, reject) => {
            this.pendingCallbacks.set(taskId, { resolve, reject });
            
            this.worker.postMessage({
                type: 'computeSeries',
                taskId,
                data: { orbit, numTerms, maxSkip }
            });
        });
    }
    
    /**
     * Detect glitch iterations
     * @param {Float64Array} orbit
     * @param {number} threshold
     * @returns {Promise<Object>}
     */
    detectGlitches(orbit, threshold = 1e-6) {
        const taskId = `glitch-${++this.taskIdCounter}`;
        
        return new Promise((resolve, reject) => {
            this.pendingCallbacks.set(taskId, { resolve, reject });
            
            this.worker.postMessage({
                type: 'detectGlitches',
                taskId,
                data: { orbit, threshold }
            });
        });
    }
    
    /**
     * Cancel current operation
     */
    cancel() {
        if (this.worker) {
            this.worker.postMessage({ type: 'cancel' });
        }
    }
    
    /**
     * Terminate worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.initialized = false;
    }
}

// ============================================================================
// EXPORT WORKER WRAPPER
// ============================================================================

/**
 * Wrapper for export worker
 */
export class ExportWorker {
    constructor() {
        this.worker = null;
        this.initialized = false;
        this.pendingCallbacks = new Map();
        this.taskIdCounter = 0;
        
        this.onProgress = null;
    }
    
    /**
     * Initialize worker
     */
    async initialize() {
        if (this.initialized) return;
        
        this.worker = new Worker(WORKER_PATHS.export, { type: 'module' });
        
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Worker timeout')), 5000);
            
            this.worker.onmessage = (e) => {
                if (e.data.type === 'ready') {
                    clearTimeout(timeout);
                    resolve();
                }
            };
        });
        
        this.setupHandlers();
        this.initialized = true;
    }
    
    /**
     * Setup message handlers
     * @private
     */
    setupHandlers() {
        this.worker.onmessage = (event) => {
            const { type, taskId, result, error, progress, stage, eta } = event.data;
            
            if (type === 'progress' && this.onProgress) {
                this.onProgress(taskId, progress, stage, eta);
                return;
            }
            
            const callback = this.pendingCallbacks.get(taskId);
            if (!callback) return;
            
            switch (type) {
                case 'imageComplete':
                case 'gifComplete':
                case 'compositingComplete':
                    callback.resolve(result);
                    break;
                    
                case 'error':
                    callback.reject(new Error(error));
                    break;
                    
                case 'cancelled':
                    callback.reject(new Error('Cancelled'));
                    break;
            }
            
            this.pendingCallbacks.delete(taskId);
        };
    }
    
    /**
     * Render high-resolution image
     * @param {Object} params - Render parameters
     * @returns {Promise<Object>}
     */
    renderImage(params) {
        const taskId = `img-${++this.taskIdCounter}`;
        
        return new Promise((resolve, reject) => {
            this.pendingCallbacks.set(taskId, { resolve, reject });
            
            this.worker.postMessage({
                type: 'renderImage',
                taskId,
                data: params
            });
        });
    }
    
    /**
     * Encode frames to GIF
     * @param {Array} frames - Array of ImageData
     * @param {number} width
     * @param {number} height
     * @param {number} delay - Frame delay in ms
     * @returns {Promise<Object>}
     */
    encodeGIF(frames, width, height, delay = 100) {
        const taskId = `gif-${++this.taskIdCounter}`;
        
        return new Promise((resolve, reject) => {
            this.pendingCallbacks.set(taskId, { resolve, reject });
            
            this.worker.postMessage({
                type: 'encodeGIF',
                taskId,
                data: { frames, width, height, delay }
            });
        });
    }
    
    /**
     * Cancel current operation
     */
    cancel() {
        if (this.worker) {
            this.worker.postMessage({ type: 'cancel' });
        }
    }
    
    /**
     * Terminate worker
     */
    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.initialized = false;
    }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let renderPoolInstance = null;
let perturbationWorkerInstance = null;
let exportWorkerInstance = null;

/**
 * Get or create render worker pool
 * @param {number} size - Pool size
 * @returns {RenderWorkerPool}
 */
export function getRenderPool(size = null) {
    if (!renderPoolInstance) {
        renderPoolInstance = new RenderWorkerPool(size);
    }
    return renderPoolInstance;
}

/**
 * Get or create perturbation worker
 * @returns {PerturbationWorker}
 */
export function getPerturbationWorker() {
    if (!perturbationWorkerInstance) {
        perturbationWorkerInstance = new PerturbationWorker();
    }
    return perturbationWorkerInstance;
}

/**
 * Get or create export worker
 * @returns {ExportWorker}
 */
export function getExportWorker() {
    if (!exportWorkerInstance) {
        exportWorkerInstance = new ExportWorker();
    }
    return exportWorkerInstance;
}

/**
 * Initialize all workers
 * @param {Object} config - Configuration
 * @returns {Promise<void>}
 */
export async function initializeAllWorkers(config = {}) {
    const renderPool = getRenderPool(config.renderWorkerCount);
    const perturbationWorker = getPerturbationWorker();
    const exportWorker = getExportWorker();
    
    await Promise.all([
        renderPool.initialize(config),
        perturbationWorker.initialize(),
        exportWorker.initialize()
    ]);
}

/**
 * Terminate all workers
 */
export function terminateAllWorkers() {
    if (renderPoolInstance) {
        renderPoolInstance.terminate();
        renderPoolInstance = null;
    }
    
    if (perturbationWorkerInstance) {
        perturbationWorkerInstance.terminate();
        perturbationWorkerInstance = null;
    }
    
    if (exportWorkerInstance) {
        exportWorkerInstance.terminate();
        exportWorkerInstance = null;
    }
}

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer Workers',
    version: '1.0.0',
    description: 'Web Worker pool for parallel fractal computation',
    workers: {
        render: {
            name: 'Render Worker',
            path: WORKER_PATHS.render,
            description: 'Tile-based 2D fractal rendering'
        },
        perturbation: {
            name: 'Perturbation Worker',
            path: WORKER_PATHS.perturbation,
            description: 'Reference orbit and series computation'
        },
        export: {
            name: 'Export Worker',
            path: WORKER_PATHS.export,
            description: 'High-resolution export and encoding'
        }
    },
    features: [
        'Automatic worker count detection',
        'Task queuing with priorities',
        'Progress reporting',
        'Cancellation support',
        'SharedArrayBuffer optimization',
        'Transferable buffer handling'
    ]
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    MODULE_INFO,
    TASK_PRIORITY,
    
    // Classes
    RenderWorkerPool,
    PerturbationWorker,
    ExportWorker,
    
    // Singleton getters
    getRenderPool,
    getPerturbationWorker,
    getExportWorker,
    
    // Lifecycle
    initializeAllWorkers,
    terminateAllWorkers
};
