/**
 * ============================================================================
 * ABYSS EXPLORER - TILE MANAGER
 * ============================================================================
 * 
 * Tile-based progressive rendering system for 2D fractals with:
 * - Spiral tile ordering (center-out for perceived responsiveness)
 * - Priority queue for viewport-visible tiles
 * - Dynamic tile sizing based on zoom level
 * - Cancellation and re-prioritization support
 * - Memory-efficient tile pooling
 * 
 * Tile Generation Strategies:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  SPIRAL (default)         HILBERT              ROW-MAJOR              │
 * │  ┌──┬──┬──┬──┬──┐        ┌──┬──┬──┬──┬──┐     ┌──┬──┬──┬──┬──┐       │
 * │  │17│16│15│14│13│        │ 1│ 2│15│16│17│     │ 1│ 2│ 3│ 4│ 5│       │
 * │  ├──┼──┼──┼──┼──┤        ├──┼──┼──┼──┼──┤     ├──┼──┼──┼──┼──┤       │
 * │  │18│ 5│ 4│ 3│12│        │ 4│ 3│14│19│18│     │ 6│ 7│ 8│ 9│10│       │
 * │  ├──┼──┼──┼──┼──┤        ├──┼──┼──┼──┼──┤     ├──┼──┼──┼──┼──┤       │
 * │  │19│ 6│ 1│ 2│11│        │ 5│ 6│13│20│21│     │11│12│13│14│15│       │
 * │  ├──┼──┼──┼──┼──┤        ├──┼──┼──┼──┼──┤     ├──┼──┼──┼──┼──┤       │
 * │  │20│ 7│ 8│ 9│10│        │ 8│ 7│12│11│22│     │16│17│18│19│20│       │
 * │  ├──┼──┼──┼──┼──┤        ├──┼──┼──┼──┼──┤     ├──┼──┼──┼──┼──┤       │
 * │  │21│22│23│24│25│        │ 9│10│25│24│23│     │21│22│23│24│25│       │
 * │  └──┴──┴──┴──┴──┘        └──┴──┴──┴──┴──┘     └──┴──┴──┴──┴──┘       │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Priority System:
 * - Tiles near viewport center get highest priority
 * - Tiles outside visible area get lower priority
 * - Priority recalculated on pan/zoom for responsive updates
 * 
 * @module rendering/tile-manager
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum tile size in pixels */
const MIN_TILE_SIZE = 32;

/** Maximum tile size in pixels */
const MAX_TILE_SIZE = 256;

/** Default tile size */
const DEFAULT_TILE_SIZE = 64;

/** Tile ordering strategies */
const TILE_ORDER = {
    SPIRAL: 'spiral',
    HILBERT: 'hilbert',
    ROW_MAJOR: 'row-major',
    RANDOM: 'random'
};

/** Tile states */
const TILE_STATE = {
    PENDING: 'pending',
    QUEUED: 'queued',
    RENDERING: 'rendering',
    COMPLETE: 'complete',
    CANCELLED: 'cancelled',
    ERROR: 'error'
};

// ============================================================================
// TILE CLASS
// ============================================================================

/**
 * Represents a single tile in the grid
 */
class Tile {
    /**
     * Create a new tile
     * @param {number} x - Pixel X coordinate (top-left)
     * @param {number} y - Pixel Y coordinate (top-left)
     * @param {number} width - Tile width in pixels
     * @param {number} height - Tile height in pixels
     * @param {number} gridX - Grid column index
     * @param {number} gridY - Grid row index
     */
    constructor(x, y, width, height, gridX, gridY) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.gridX = gridX;
        this.gridY = gridY;
        
        // State tracking
        this.state = TILE_STATE.PENDING;
        this.priority = 0;
        this.order = 0;
        
        // Timing
        this.queueTime = 0;
        this.startTime = 0;
        this.endTime = 0;
        
        // Result data
        this.data = null;
        this.error = null;
        
        // Worker assignment
        this.workerId = -1;
    }
    
    /**
     * Get the center point of the tile in pixels
     * @returns {{x: number, y: number}}
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
    
    /**
     * Check if a point is inside the tile
     * @param {number} px - Point X
     * @param {number} py - Point Y
     * @returns {boolean}
     */
    contains(px, py) {
        return px >= this.x && px < this.x + this.width &&
               py >= this.y && py < this.y + this.height;
    }
    
    /**
     * Get render duration in milliseconds
     * @returns {number}
     */
    getRenderTime() {
        if (this.state === TILE_STATE.COMPLETE) {
            return this.endTime - this.startTime;
        }
        return 0;
    }
    
    /**
     * Reset tile for re-rendering
     */
    reset() {
        this.state = TILE_STATE.PENDING;
        this.priority = 0;
        this.data = null;
        this.error = null;
        this.workerId = -1;
        this.queueTime = 0;
        this.startTime = 0;
        this.endTime = 0;
    }
}

// ============================================================================
// TILE MANAGER CLASS
// ============================================================================

export class TileManager {
    /**
     * Create a new tile manager
     * @param {Object} renderer - Parent renderer reference
     */
    constructor(renderer) {
        this.renderer = renderer;
        
        // Tile grid
        this.tiles = [];
        this.tileMap = new Map();  // Quick lookup by "gridX,gridY"
        
        // Configuration
        this.tileSize = DEFAULT_TILE_SIZE;
        this.orderingStrategy = TILE_ORDER.SPIRAL;
        
        // Grid dimensions
        this.gridWidth = 0;
        this.gridHeight = 0;
        this.totalTiles = 0;
        
        // Queue management
        this.pendingQueue = [];
        this.activeQueue = [];
        this.completedTiles = 0;
        
        // Viewport tracking for priority
        this.viewportCenter = { x: 0, y: 0 };
        this.viewportSize = { width: 0, height: 0 };
        
        // Cancellation
        this.cancelRequested = false;
        
        // Statistics
        this.stats = {
            totalTiles: 0,
            completedTiles: 0,
            cancelledTiles: 0,
            totalRenderTime: 0,
            averageRenderTime: 0
        };
    }
    
    // ========================================================================
    // TILE GENERATION
    // ========================================================================
    
    /**
     * Generate tiles for the current viewport
     * @param {Object} options - Generation options
     * @returns {Tile[]} Array of tiles in render order
     */
    generateTiles(options = {}) {
        const config = this.renderer.config;
        const width = config.width;
        const height = config.height;
        
        // Determine tile size (can be overridden)
        this.tileSize = options.tileSize || this._calculateOptimalTileSize();
        
        // Calculate grid dimensions
        this.gridWidth = Math.ceil(width / this.tileSize);
        this.gridHeight = Math.ceil(height / this.tileSize);
        this.totalTiles = this.gridWidth * this.gridHeight;
        
        // Clear existing tiles
        this.tiles = [];
        this.tileMap.clear();
        this.pendingQueue = [];
        this.activeQueue = [];
        this.completedTiles = 0;
        this.cancelRequested = false;
        
        // Create tile grid
        for (let gy = 0; gy < this.gridHeight; gy++) {
            for (let gx = 0; gx < this.gridWidth; gx++) {
                const x = gx * this.tileSize;
                const y = gy * this.tileSize;
                
                // Handle edge tiles (may be smaller)
                const tileWidth = Math.min(this.tileSize, width - x);
                const tileHeight = Math.min(this.tileSize, height - y);
                
                const tile = new Tile(x, y, tileWidth, tileHeight, gx, gy);
                
                this.tiles.push(tile);
                this.tileMap.set(`${gx},${gy}`, tile);
            }
        }
        
        // Calculate priorities based on viewport center
        this.viewportCenter = {
            x: width / 2,
            y: height / 2
        };
        this.viewportSize = { width, height };
        this._calculatePriorities();
        
        // Apply ordering strategy
        const orderedTiles = this._applyOrdering(
            options.strategy || this.orderingStrategy
        );
        
        // Assign order indices
        orderedTiles.forEach((tile, index) => {
            tile.order = index;
        });
        
        // Initialize pending queue
        this.pendingQueue = [...orderedTiles];
        
        // Update stats
        this.stats.totalTiles = this.totalTiles;
        this.stats.completedTiles = 0;
        this.stats.cancelledTiles = 0;
        this.stats.totalRenderTime = 0;
        
        console.log(`[TileManager] Generated ${this.totalTiles} tiles ` +
                    `(${this.gridWidth}x${this.gridHeight}), size ${this.tileSize}px`);
        
        return orderedTiles;
    }
    
    /**
     * Calculate optimal tile size based on viewport and zoom
     * @private
     * @returns {number} Tile size in pixels
     */
    _calculateOptimalTileSize() {
        const config = this.renderer.config;
        const viewport = this.renderer.viewport;
        
        // Base tile size from config
        let size = config.tileSize || DEFAULT_TILE_SIZE;
        
        // Adjust based on zoom level for deep zooms
        // At very deep zooms, use smaller tiles to start showing results faster
        if (viewport && viewport.zoom > 1e10) {
            size = Math.max(MIN_TILE_SIZE, size / 2);
        }
        
        // Ensure it's a power of 2 for GPU efficiency
        size = Math.pow(2, Math.round(Math.log2(size)));
        
        // Clamp to valid range
        return Math.max(MIN_TILE_SIZE, Math.min(MAX_TILE_SIZE, size));
    }
    
    /**
     * Calculate priority for each tile based on distance from viewport center
     * @private
     */
    _calculatePriorities() {
        const centerX = this.viewportCenter.x;
        const centerY = this.viewportCenter.y;
        const maxDist = Math.sqrt(
            Math.pow(this.viewportSize.width / 2, 2) +
            Math.pow(this.viewportSize.height / 2, 2)
        );
        
        for (const tile of this.tiles) {
            const tileCenter = tile.getCenter();
            const dist = Math.sqrt(
                Math.pow(tileCenter.x - centerX, 2) +
                Math.pow(tileCenter.y - centerY, 2)
            );
            
            // Priority: higher = render first
            // Closer to center = higher priority
            tile.priority = 1000 - Math.floor((dist / maxDist) * 1000);
        }
    }
    
    /**
     * Apply ordering strategy to tiles
     * @private
     * @param {string} strategy - Ordering strategy
     * @returns {Tile[]} Ordered tiles
     */
    _applyOrdering(strategy) {
        switch (strategy) {
            case TILE_ORDER.SPIRAL:
                return this._spiralOrder();
            case TILE_ORDER.HILBERT:
                return this._hilbertOrder();
            case TILE_ORDER.ROW_MAJOR:
                return this._rowMajorOrder();
            case TILE_ORDER.RANDOM:
                return this._randomOrder();
            default:
                return this._spiralOrder();
        }
    }
    
    /**
     * Generate spiral ordering (center-out)
     * @private
     * @returns {Tile[]}
     */
    _spiralOrder() {
        const result = [];
        const visited = new Set();
        
        // Start from center
        let cx = Math.floor(this.gridWidth / 2);
        let cy = Math.floor(this.gridHeight / 2);
        
        // Spiral directions: right, down, left, up
        const dx = [1, 0, -1, 0];
        const dy = [0, 1, 0, -1];
        
        let x = cx, y = cy;
        let dir = 0;
        let stepsInDir = 1;
        let stepsTaken = 0;
        let dirChanges = 0;
        
        while (result.length < this.totalTiles) {
            // Add current tile if valid and not visited
            if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
                const key = `${x},${y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    const tile = this.tileMap.get(key);
                    if (tile) {
                        result.push(tile);
                    }
                }
            }
            
            // Move in current direction
            x += dx[dir];
            y += dy[dir];
            stepsTaken++;
            
            // Check if we need to turn
            if (stepsTaken >= stepsInDir) {
                stepsTaken = 0;
                dir = (dir + 1) % 4;
                dirChanges++;
                
                // Increase steps after every 2 direction changes
                if (dirChanges % 2 === 0) {
                    stepsInDir++;
                }
            }
        }
        
        return result;
    }
    
    /**
     * Generate Hilbert curve ordering
     * @private
     * @returns {Tile[]}
     */
    _hilbertOrder() {
        const result = [];
        
        // Calculate the order of the Hilbert curve needed
        const maxDim = Math.max(this.gridWidth, this.gridHeight);
        const order = Math.ceil(Math.log2(maxDim));
        const n = Math.pow(2, order);
        
        // Generate all Hilbert points
        const hilbertPoints = [];
        for (let i = 0; i < n * n; i++) {
            const [x, y] = this._hilbertD2XY(n, i);
            if (x < this.gridWidth && y < this.gridHeight) {
                hilbertPoints.push({ x, y, d: i });
            }
        }
        
        // Sort by Hilbert distance
        hilbertPoints.sort((a, b) => a.d - b.d);
        
        // Map to tiles
        for (const point of hilbertPoints) {
            const tile = this.tileMap.get(`${point.x},${point.y}`);
            if (tile) {
                result.push(tile);
            }
        }
        
        return result;
    }
    
    /**
     * Convert Hilbert distance to (x, y) coordinates
     * @private
     */
    _hilbertD2XY(n, d) {
        let x = 0, y = 0;
        let rx, ry, s, t = d;
        
        for (s = 1; s < n; s *= 2) {
            rx = 1 & (t / 2);
            ry = 1 & (t ^ rx);
            [x, y] = this._hilbertRot(s, x, y, rx, ry);
            x += s * rx;
            y += s * ry;
            t = Math.floor(t / 4);
        }
        
        return [x, y];
    }
    
    /**
     * Hilbert rotation helper
     * @private
     */
    _hilbertRot(n, x, y, rx, ry) {
        if (ry === 0) {
            if (rx === 1) {
                x = n - 1 - x;
                y = n - 1 - y;
            }
            return [y, x];
        }
        return [x, y];
    }
    
    /**
     * Generate row-major ordering
     * @private
     * @returns {Tile[]}
     */
    _rowMajorOrder() {
        return [...this.tiles];
    }
    
    /**
     * Generate random ordering
     * @private
     * @returns {Tile[]}
     */
    _randomOrder() {
        const shuffled = [...this.tiles];
        
        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }
    
    // ========================================================================
    // QUEUE MANAGEMENT
    // ========================================================================
    
    /**
     * Get the next tile to render
     * @returns {Tile|null} Next tile or null if queue is empty
     */
    getNextTile() {
        if (this.cancelRequested || this.pendingQueue.length === 0) {
            return null;
        }
        
        const tile = this.pendingQueue.shift();
        tile.state = TILE_STATE.QUEUED;
        tile.queueTime = performance.now();
        
        this.activeQueue.push(tile);
        
        return tile;
    }
    
    /**
     * Mark a tile as started (being rendered)
     * @param {Tile} tile - The tile
     * @param {number} workerId - Worker ID
     */
    markStarted(tile, workerId) {
        tile.state = TILE_STATE.RENDERING;
        tile.startTime = performance.now();
        tile.workerId = workerId;
    }
    
    /**
     * Mark a tile as completed
     * @param {Tile} tile - The tile
     * @param {Object} data - Rendered data
     */
    markCompleted(tile, data) {
        tile.state = TILE_STATE.COMPLETE;
        tile.endTime = performance.now();
        tile.data = data;
        
        // Remove from active queue
        const idx = this.activeQueue.indexOf(tile);
        if (idx !== -1) {
            this.activeQueue.splice(idx, 1);
        }
        
        this.completedTiles++;
        this.stats.completedTiles = this.completedTiles;
        this.stats.totalRenderTime += tile.getRenderTime();
        this.stats.averageRenderTime = this.stats.totalRenderTime / this.completedTiles;
    }
    
    /**
     * Mark a tile as failed
     * @param {Tile} tile - The tile
     * @param {Error} error - The error
     */
    markFailed(tile, error) {
        tile.state = TILE_STATE.ERROR;
        tile.endTime = performance.now();
        tile.error = error;
        
        // Remove from active queue
        const idx = this.activeQueue.indexOf(tile);
        if (idx !== -1) {
            this.activeQueue.splice(idx, 1);
        }
        
        console.warn(`[TileManager] Tile (${tile.gridX}, ${tile.gridY}) failed:`, error);
    }
    
    /**
     * Cancel all pending tiles
     */
    cancelAll() {
        this.cancelRequested = true;
        
        // Mark all pending as cancelled
        for (const tile of this.pendingQueue) {
            tile.state = TILE_STATE.CANCELLED;
            this.stats.cancelledTiles++;
        }
        
        this.pendingQueue = [];
        
        console.log(`[TileManager] Cancelled ${this.stats.cancelledTiles} pending tiles`);
    }
    
    /**
     * Cancel tiles outside a given region
     * @param {Object} rect - Region to keep {x, y, width, height}
     */
    cancelOutsideRegion(rect) {
        const newPending = [];
        
        for (const tile of this.pendingQueue) {
            if (this._tileIntersects(tile, rect)) {
                newPending.push(tile);
            } else {
                tile.state = TILE_STATE.CANCELLED;
                this.stats.cancelledTiles++;
            }
        }
        
        this.pendingQueue = newPending;
    }
    
    /**
     * Check if a tile intersects a rectangle
     * @private
     */
    _tileIntersects(tile, rect) {
        return !(tile.x + tile.width < rect.x ||
                 tile.x > rect.x + rect.width ||
                 tile.y + tile.height < rect.y ||
                 tile.y > rect.y + rect.height);
    }
    
    // ========================================================================
    // PRIORITY UPDATES
    // ========================================================================
    
    /**
     * Update priorities based on new viewport center
     * @param {number} centerX - New center X
     * @param {number} centerY - New center Y
     */
    updatePriorities(centerX, centerY) {
        this.viewportCenter = { x: centerX, y: centerY };
        this._calculatePriorities();
        
        // Re-sort pending queue by priority (descending)
        this.pendingQueue.sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * Reprioritize tiles for a sub-region (e.g., mouse hover area)
     * @param {number} x - Region center X
     * @param {number} y - Region center Y
     * @param {number} radius - Boost radius in pixels
     * @param {number} boost - Priority boost amount
     */
    boostRegion(x, y, radius, boost = 500) {
        for (const tile of this.pendingQueue) {
            const center = tile.getCenter();
            const dist = Math.sqrt(
                Math.pow(center.x - x, 2) +
                Math.pow(center.y - y, 2)
            );
            
            if (dist < radius) {
                tile.priority += boost * (1 - dist / radius);
            }
        }
        
        // Re-sort
        this.pendingQueue.sort((a, b) => b.priority - a.priority);
    }
    
    // ========================================================================
    // QUERIES
    // ========================================================================
    
    /**
     * Get tile at pixel coordinates
     * @param {number} px - Pixel X
     * @param {number} py - Pixel Y
     * @returns {Tile|null}
     */
    getTileAt(px, py) {
        const gx = Math.floor(px / this.tileSize);
        const gy = Math.floor(py / this.tileSize);
        
        return this.tileMap.get(`${gx},${gy}`) || null;
    }
    
    /**
     * Get all tiles in a region
     * @param {Object} rect - Region {x, y, width, height}
     * @returns {Tile[]}
     */
    getTilesInRegion(rect) {
        const result = [];
        
        const startGX = Math.floor(rect.x / this.tileSize);
        const startGY = Math.floor(rect.y / this.tileSize);
        const endGX = Math.ceil((rect.x + rect.width) / this.tileSize);
        const endGY = Math.ceil((rect.y + rect.height) / this.tileSize);
        
        for (let gy = startGY; gy < endGY; gy++) {
            for (let gx = startGX; gx < endGX; gx++) {
                const tile = this.tileMap.get(`${gx},${gy}`);
                if (tile) {
                    result.push(tile);
                }
            }
        }
        
        return result;
    }
    
    /**
     * Get incomplete tiles in a region (for re-rendering)
     * @param {Object} rect - Region
     * @returns {Tile[]}
     */
    getIncompleteTilesInRegion(rect) {
        return this.getTilesInRegion(rect).filter(
            tile => tile.state !== TILE_STATE.COMPLETE
        );
    }
    
    /**
     * Get progress information
     * @returns {Object} Progress stats
     */
    getProgress() {
        return {
            total: this.totalTiles,
            completed: this.completedTiles,
            pending: this.pendingQueue.length,
            active: this.activeQueue.length,
            cancelled: this.stats.cancelledTiles,
            percentage: this.totalTiles > 0 
                ? (this.completedTiles / this.totalTiles) * 100 
                : 0,
            averageRenderTime: this.stats.averageRenderTime,
            estimatedTimeRemaining: this.pendingQueue.length * this.stats.averageRenderTime
        };
    }
    
    /**
     * Get statistics
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }
    
    // ========================================================================
    // INVALIDATION
    // ========================================================================
    
    /**
     * Invalidate all tiles (force re-render)
     */
    invalidateAll() {
        for (const tile of this.tiles) {
            tile.reset();
        }
        
        this.pendingQueue = [...this.tiles];
        this._applyOrdering(this.orderingStrategy);
        this.completedTiles = 0;
        this.stats.completedTiles = 0;
    }
    
    /**
     * Invalidate tiles in a region
     * @param {Object} rect - Region to invalidate
     */
    invalidateRegion(rect) {
        const tiles = this.getTilesInRegion(rect);
        
        for (const tile of tiles) {
            if (tile.state === TILE_STATE.COMPLETE) {
                tile.reset();
                this.pendingQueue.push(tile);
                this.completedTiles--;
            }
        }
        
        // Re-sort pending queue
        this.pendingQueue.sort((a, b) => b.priority - a.priority);
    }
    
    // ========================================================================
    // SERIALIZATION
    // ========================================================================
    
    /**
     * Export tile state for debugging/visualization
     * @returns {Object}
     */
    exportState() {
        return {
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            tileSize: this.tileSize,
            totalTiles: this.totalTiles,
            tiles: this.tiles.map(t => ({
                x: t.x,
                y: t.y,
                gridX: t.gridX,
                gridY: t.gridY,
                state: t.state,
                priority: t.priority,
                order: t.order,
                renderTime: t.getRenderTime()
            }))
        };
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TileManager;
export { Tile, TILE_ORDER, TILE_STATE };
