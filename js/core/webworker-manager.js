/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                      ABYSS EXPLORER - WEB WORKER MANAGER                      ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Pool of Web Workers for parallel computation                                 ║
 * ║                                                                                ║
 * ║  Responsibilities:                                                             ║
 * ║  - Create and manage a pool of Web Workers                                    ║
 * ║  - Distribute tasks across workers                                            ║
 * ║  - Handle worker lifecycle and errors                                         ║
 * ║  - Support task queuing and cancellation                                      ║
 * ║  - Provide progress tracking for long-running tasks                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Config } from '../config.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Worker states
 * @enum {string}
 */
const WorkerState = {
    IDLE: 'idle',
    BUSY: 'busy',
    ERROR: 'error',
    TERMINATED: 'terminated'
};

/**
 * Task priorities
 * @enum {number}
 */
const TaskPriority = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

// =============================================================================
// WORKER MANAGER CLASS
// =============================================================================

/**
 * Web Worker Pool Manager
 * 
 * Manages a pool of Web Workers for parallel fractal computation.
 * Supports task queuing, priorities, cancellation, and progress tracking.
 * 
 * @class WorkerManager
 */
export class WorkerManager {
    /**
     * Create worker manager
     * 
     * @param {number} [workerCount=0] - Number of workers (0 = auto-detect)
     */
    constructor(workerCount = 0) {
        /** @type {Logger} */
        this.logger = new Logger('WorkerManager');

        // =================================================================
        // Worker Pool
        // =================================================================
        
        /** @type {WorkerWrapper[]} Pool of workers */
        this._workers = [];
        
        /** @type {number} Target worker count */
        this._targetCount = workerCount || this._detectOptimalWorkerCount();
        
        /** @type {string} Worker script URL */
        this._workerUrl = this._resolveWorkerUrl();

        // =================================================================
        // Task Queue
        // =================================================================
        
        /** @type {Task[]} Pending tasks queue */
        this._taskQueue = [];
        
        /** @type {Map<string, Task>} Active tasks by ID */
        this._activeTasks = new Map();
        
        /** @type {number} Next task ID */
        this._nextTaskId = 1;

        // =================================================================
        // Statistics
        // =================================================================
        
        /** @type {Object} Worker pool statistics */
        this._stats = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            cancelledTasks: 0,
            totalTime: 0
        };

        // =================================================================
        // State
        // =================================================================
        
        /** @type {boolean} Whether manager is initialized */
        this._initialized = false;
        
        /** @type {boolean} Whether manager is shutting down */
        this._shuttingDown = false;
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Initialize the worker pool
     * 
     * @async
     * @returns {Promise<void>}
     */
    async init() {
        if (this._initialized) {
            this.logger.warn('Already initialized');
            return;
        }

        this.logger.info(`Initializing worker pool with ${this._targetCount} workers...`);

        try {
            // Create workers
            const workerPromises = [];
            for (let i = 0; i < this._targetCount; i++) {
                workerPromises.push(this._createWorker(i));
            }

            // Wait for all workers to be ready
            const results = await Promise.allSettled(workerPromises);
            
            // Count successful workers
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            
            if (successCount === 0) {
                throw new Error('Failed to create any workers');
            }

            if (successCount < this._targetCount) {
                this.logger.warn(`Only ${successCount}/${this._targetCount} workers initialized`);
            }

            this._initialized = true;
            this.logger.info(`Worker pool initialized with ${successCount} workers`);

        } catch (error) {
            this.logger.error('Worker pool initialization failed', error);
            throw error;
        }
    }

    /**
     * Create a single worker
     * @private
     * @param {number} index - Worker index
     * @returns {Promise<WorkerWrapper>}
     */
    async _createWorker(index) {
        return new Promise((resolve, reject) => {
            try {
                const worker = new Worker(this._workerUrl, { type: 'module' });
                const wrapper = new WorkerWrapper(worker, index);

                // Set up message handler
                worker.onmessage = (event) => {
                    this._handleWorkerMessage(wrapper, event.data);
                };

                // Set up error handler
                worker.onerror = (error) => {
                    this._handleWorkerError(wrapper, error);
                };

                // Initialize worker
                worker.postMessage({
                    type: 'init',
                    config: {
                        workerId: index,
                        capabilities: Config.capabilities
                    }
                });

                // Wait for ready signal
                const timeout = setTimeout(() => {
                    reject(new Error(`Worker ${index} initialization timeout`));
                }, 5000);

                const originalHandler = worker.onmessage;
                worker.onmessage = (event) => {
                    if (event.data.type === 'ready') {
                        clearTimeout(timeout);
                        worker.onmessage = originalHandler;
                        wrapper.state = WorkerState.IDLE;
                        this._workers.push(wrapper);
                        resolve(wrapper);
                    } else {
                        originalHandler(event);
                    }
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Detect optimal worker count based on hardware
     * @private
     * @returns {number}
     */
    _detectOptimalWorkerCount() {
        const cores = navigator.hardwareConcurrency || 4;
        
        // Use cores - 1 to leave one for main thread, minimum 1, max from config
        const optimal = Math.max(1, Math.min(cores - 1, Config.performance.maxWorkers));
        
        this.logger.info(`Detected ${cores} cores, using ${optimal} workers`);
        return optimal;
    }

    /**
     * Resolve worker script URL
     * @private
     * @returns {string}
     */
    _resolveWorkerUrl() {
        // Get base path from current script location
        const scripts = document.getElementsByTagName('script');
        let basePath = '';
        
        for (const script of scripts) {
            if (script.src && script.src.includes('/js/')) {
                basePath = script.src.substring(0, script.src.lastIndexOf('/js/') + 4);
                break;
            }
        }

        return basePath + 'workers/compute.worker.js';
    }

    // =========================================================================
    // TASK SUBMISSION
    // =========================================================================

    /**
     * Submit a task to the worker pool
     * 
     * @param {string} type - Task type
     * @param {Object} data - Task data
     * @param {Object} [options] - Task options
     * @param {number} [options.priority=1] - Task priority
     * @param {AbortSignal} [options.signal] - Abort signal
     * @param {Function} [options.onProgress] - Progress callback
     * @param {boolean} [options.transferable=false] - Use transferable objects
     * @returns {Promise<*>} Task result
     */
    async submitTask(type, data, options = {}) {
        if (!this._initialized) {
            throw new Error('Worker manager not initialized');
        }

        if (this._shuttingDown) {
            throw new Error('Worker manager is shutting down');
        }

        const {
            priority = TaskPriority.NORMAL,
            signal = null,
            onProgress = null,
            transferable = false
        } = options;

        // Create task
        const task = new Task({
            id: `task_${this._nextTaskId++}`,
            type,
            data,
            priority,
            signal,
            onProgress,
            transferable
        });

        // Handle abort signal
        if (signal) {
            if (signal.aborted) {
                return Promise.reject(new DOMException('Aborted', 'AbortError'));
            }

            signal.addEventListener('abort', () => {
                this._cancelTask(task.id);
            });
        }

        // Update stats
        this._stats.totalTasks++;

        // Try to run immediately or queue
        return this._submitOrQueue(task);
    }

    /**
     * Submit task immediately or add to queue
     * @private
     * @param {Task} task
     * @returns {Promise<*>}
     */
    _submitOrQueue(task) {
        // Find an idle worker
        const worker = this._getIdleWorker();

        if (worker) {
            return this._runTask(worker, task);
        }

        // Queue the task
        return new Promise((resolve, reject) => {
            task.resolve = resolve;
            task.reject = reject;
            
            // Insert based on priority
            const insertIndex = this._taskQueue.findIndex(t => t.priority < task.priority);
            if (insertIndex === -1) {
                this._taskQueue.push(task);
            } else {
                this._taskQueue.splice(insertIndex, 0, task);
            }

            this.logger.debug(`Task ${task.id} queued (${this._taskQueue.length} pending)`);
        });
    }

    /**
     * Run a task on a specific worker
     * @private
     * @param {WorkerWrapper} worker
     * @param {Task} task
     * @returns {Promise<*>}
     */
    _runTask(worker, task) {
        return new Promise((resolve, reject) => {
            // Store resolve/reject
            task.resolve = resolve;
            task.reject = reject;

            // Mark worker as busy
            worker.state = WorkerState.BUSY;
            worker.currentTask = task;

            // Store in active tasks
            this._activeTasks.set(task.id, task);

            // Record start time
            task.startTime = performance.now();

            // Send to worker
            const message = {
                type: 'task',
                taskId: task.id,
                taskType: task.type,
                data: task.data
            };

            if (task.transferable && task.data.buffer) {
                worker.worker.postMessage(message, [task.data.buffer]);
            } else {
                worker.worker.postMessage(message);
            }

            this.logger.debug(`Task ${task.id} started on worker ${worker.index}`);
        });
    }

    /**
     * Get an idle worker
     * @private
     * @returns {WorkerWrapper|null}
     */
    _getIdleWorker() {
        return this._workers.find(w => w.state === WorkerState.IDLE) || null;
    }

    // =========================================================================
    // BATCH OPERATIONS
    // =========================================================================

    /**
     * Submit multiple tasks as a batch
     * 
     * @param {Array<{type: string, data: Object}>} tasks - Array of tasks
     * @param {Object} [options] - Options applied to all tasks
     * @returns {Promise<Array>} Results in same order as input
     */
    async submitBatch(tasks, options = {}) {
        const promises = tasks.map((task, index) => 
            this.submitTask(task.type, task.data, {
                ...options,
                // Optionally track batch progress
                onProgress: options.onProgress 
                    ? (p) => options.onProgress({ ...p, taskIndex: index })
                    : null
            })
        );

        return Promise.all(promises);
    }

    /**
     * Submit tasks for parallel processing with combined result
     * 
     * @param {Array<{type: string, data: Object}>} tasks - Tasks to process
     * @param {Function} combiner - Function to combine results
     * @param {Object} [options] - Options
     * @returns {Promise<*>} Combined result
     */
    async submitParallel(tasks, combiner, options = {}) {
        const results = await this.submitBatch(tasks, options);
        return combiner(results);
    }

    // =========================================================================
    // TILE RENDERING
    // =========================================================================

    /**
     * Render tiles in parallel
     * 
     * Specialized method for fractal tile rendering with optimal distribution.
     * 
     * @param {Object[]} tiles - Array of tile descriptors
     * @param {Object} params - Rendering parameters
     * @param {Object} [options] - Options
     * @param {AbortSignal} [options.signal] - Abort signal
     * @param {Function} [options.onTileComplete] - Callback per tile
     * @param {Function} [options.onProgress] - Overall progress callback
     * @returns {Promise<ImageData[]>} Rendered tiles
     */
    async renderTiles(tiles, params, options = {}) {
        const { signal, onTileComplete, onProgress } = options;
        const results = new Array(tiles.length);
        let completedCount = 0;

        // Create tasks for each tile
        const tasks = tiles.map((tile, index) => ({
            type: 'renderTile',
            data: { ...params, tile, tileIndex: index }
        }));

        // Submit all tasks
        const promises = tasks.map((task, index) =>
            this.submitTask(task.type, task.data, {
                priority: TaskPriority.NORMAL,
                signal,
                transferable: true
            }).then(result => {
                results[index] = result;
                completedCount++;

                // Callback per tile
                if (onTileComplete) {
                    onTileComplete(result, index);
                }

                // Overall progress
                if (onProgress) {
                    onProgress({
                        completed: completedCount,
                        total: tiles.length,
                        percent: (completedCount / tiles.length) * 100
                    });
                }

                return result;
            })
        );

        await Promise.all(promises);
        return results;
    }

    // =========================================================================
    // MESSAGE HANDLING
    // =========================================================================

    /**
     * Handle message from worker
     * @private
     * @param {WorkerWrapper} worker
     * @param {Object} data
     */
    _handleWorkerMessage(worker, data) {
        switch (data.type) {
            case 'taskComplete':
                this._handleTaskComplete(worker, data);
                break;

            case 'taskError':
                this._handleTaskError(worker, data);
                break;

            case 'taskProgress':
                this._handleTaskProgress(data);
                break;

            case 'log':
                this.logger.debug(`[Worker ${worker.index}] ${data.message}`);
                break;

            default:
                this.logger.warn(`Unknown message type from worker: ${data.type}`);
        }
    }

    /**
     * Handle task completion
     * @private
     * @param {WorkerWrapper} worker
     * @param {Object} data
     */
    _handleTaskComplete(worker, data) {
        const task = this._activeTasks.get(data.taskId);
        
        if (!task) {
            this.logger.warn(`Task ${data.taskId} not found (possibly cancelled)`);
            return;
        }

        // Calculate duration
        const duration = performance.now() - task.startTime;
        this._stats.completedTasks++;
        this._stats.totalTime += duration;

        // Clean up
        this._activeTasks.delete(data.taskId);
        worker.state = WorkerState.IDLE;
        worker.currentTask = null;

        // Resolve task
        task.resolve(data.result);

        this.logger.debug(`Task ${data.taskId} completed in ${duration.toFixed(1)}ms`);

        // Process next queued task
        this._processQueue();
    }

    /**
     * Handle task error
     * @private
     * @param {WorkerWrapper} worker
     * @param {Object} data
     */
    _handleTaskError(worker, data) {
        const task = this._activeTasks.get(data.taskId);
        
        if (!task) {
            return;
        }

        this._stats.failedTasks++;
        
        // Clean up
        this._activeTasks.delete(data.taskId);
        worker.state = WorkerState.IDLE;
        worker.currentTask = null;

        // Reject task
        task.reject(new Error(data.error));

        this.logger.error(`Task ${data.taskId} failed: ${data.error}`);

        // Process next queued task
        this._processQueue();
    }

    /**
     * Handle task progress
     * @private
     * @param {Object} data
     */
    _handleTaskProgress(data) {
        const task = this._activeTasks.get(data.taskId);
        
        if (task && task.onProgress) {
            task.onProgress(data.progress);
        }
    }

    /**
     * Handle worker error
     * @private
     * @param {WorkerWrapper} worker
     * @param {ErrorEvent} error
     */
    _handleWorkerError(worker, error) {
        this.logger.error(`Worker ${worker.index} error:`, error);

        // Mark worker as errored
        worker.state = WorkerState.ERROR;

        // Reject current task if any
        if (worker.currentTask) {
            const task = worker.currentTask;
            this._activeTasks.delete(task.id);
            task.reject(new Error('Worker error: ' + error.message));
            this._stats.failedTasks++;
        }

        // Try to restart worker
        this._restartWorker(worker);
    }

    /**
     * Restart a failed worker
     * @private
     * @param {WorkerWrapper} worker
     */
    async _restartWorker(worker) {
        this.logger.info(`Restarting worker ${worker.index}...`);

        try {
            // Terminate old worker
            worker.worker.terminate();
            
            // Remove from pool
            const index = this._workers.indexOf(worker);
            if (index !== -1) {
                this._workers.splice(index, 1);
            }

            // Create new worker
            await this._createWorker(worker.index);
            
            this.logger.info(`Worker ${worker.index} restarted`);
        } catch (error) {
            this.logger.error(`Failed to restart worker ${worker.index}`, error);
        }
    }

    // =========================================================================
    // QUEUE PROCESSING
    // =========================================================================

    /**
     * Process next task in queue
     * @private
     */
    _processQueue() {
        if (this._taskQueue.length === 0) return;

        const worker = this._getIdleWorker();
        if (!worker) return;

        const task = this._taskQueue.shift();
        
        // Check if task was cancelled while queued
        if (task.signal?.aborted) {
            this._stats.cancelledTasks++;
            task.reject(new DOMException('Aborted', 'AbortError'));
            this._processQueue(); // Process next
            return;
        }

        this._runTask(worker, task)
            .then(task.resolve)
            .catch(task.reject);
    }

    // =========================================================================
    // CANCELLATION
    // =========================================================================

    /**
     * Cancel a specific task
     * @private
     * @param {string} taskId
     */
    _cancelTask(taskId) {
        // Check active tasks
        const task = this._activeTasks.get(taskId);
        if (task) {
            // Send cancel to worker
            const worker = this._workers.find(w => 
                w.currentTask && w.currentTask.id === taskId
            );

            if (worker) {
                worker.worker.postMessage({
                    type: 'cancel',
                    taskId
                });
            }

            this._activeTasks.delete(taskId);
            this._stats.cancelledTasks++;
            task.reject(new DOMException('Aborted', 'AbortError'));
            return;
        }

        // Check queue
        const queueIndex = this._taskQueue.findIndex(t => t.id === taskId);
        if (queueIndex !== -1) {
            const queuedTask = this._taskQueue.splice(queueIndex, 1)[0];
            this._stats.cancelledTasks++;
            queuedTask.reject(new DOMException('Aborted', 'AbortError'));
        }
    }

    /**
     * Cancel all pending and active tasks
     */
    cancelAll() {
        // Cancel queued tasks
        for (const task of this._taskQueue) {
            this._stats.cancelledTasks++;
            task.reject(new DOMException('Aborted', 'AbortError'));
        }
        this._taskQueue = [];

        // Cancel active tasks
        for (const [taskId, task] of this._activeTasks) {
            const worker = this._workers.find(w => 
                w.currentTask && w.currentTask.id === taskId
            );

            if (worker) {
                worker.worker.postMessage({ type: 'cancel', taskId });
            }

            this._stats.cancelledTasks++;
            task.reject(new DOMException('Aborted', 'AbortError'));
        }
        this._activeTasks.clear();

        this.logger.info('All tasks cancelled');
    }

    // =========================================================================
    // STATUS & STATISTICS
    // =========================================================================

    /**
     * Get worker pool status
     * @returns {Object}
     */
    getStatus() {
        return {
            initialized: this._initialized,
            workerCount: this._workers.length,
            idleWorkers: this._workers.filter(w => w.state === WorkerState.IDLE).length,
            busyWorkers: this._workers.filter(w => w.state === WorkerState.BUSY).length,
            queuedTasks: this._taskQueue.length,
            activeTasks: this._activeTasks.size,
            stats: { ...this._stats }
        };
    }

    /**
     * Get average task time
     * @returns {number}
     */
    getAverageTaskTime() {
        if (this._stats.completedTasks === 0) return 0;
        return this._stats.totalTime / this._stats.completedTasks;
    }

    // =========================================================================
    // LIFECYCLE
    // =========================================================================

    /**
     * Terminate all workers and clean up
     */
    async dispose() {
        this.logger.info('Disposing worker manager...');

        this._shuttingDown = true;

        // Cancel all tasks
        this.cancelAll();

        // Terminate all workers
        for (const worker of this._workers) {
            worker.state = WorkerState.TERMINATED;
            worker.worker.terminate();
        }
        this._workers = [];

        this._initialized = false;
        this.logger.info('Worker manager disposed');
    }
}

// =============================================================================
// WORKER WRAPPER CLASS
// =============================================================================

/**
 * Wrapper for Web Worker instance
 * @private
 */
class WorkerWrapper {
    constructor(worker, index) {
        /** @type {Worker} */
        this.worker = worker;
        
        /** @type {number} */
        this.index = index;
        
        /** @type {WorkerState} */
        this.state = WorkerState.IDLE;
        
        /** @type {Task|null} */
        this.currentTask = null;
    }
}

// =============================================================================
// TASK CLASS
// =============================================================================

/**
 * Task descriptor
 * @private
 */
class Task {
    constructor(options) {
        /** @type {string} */
        this.id = options.id;
        
        /** @type {string} */
        this.type = options.type;
        
        /** @type {Object} */
        this.data = options.data;
        
        /** @type {number} */
        this.priority = options.priority;
        
        /** @type {AbortSignal|null} */
        this.signal = options.signal;
        
        /** @type {Function|null} */
        this.onProgress = options.onProgress;
        
        /** @type {boolean} */
        this.transferable = options.transferable;
        
        /** @type {Function|null} */
        this.resolve = null;
        
        /** @type {Function|null} */
        this.reject = null;
        
        /** @type {number} */
        this.startTime = 0;
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { WorkerManager, TaskPriority };
export default WorkerManager;
