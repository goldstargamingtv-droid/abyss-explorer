/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                        ABYSS EXPLORER - LOGGER                                ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Centralized logging utility with levels and formatting                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// Log levels
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

// Current log level (can be changed at runtime)
let currentLevel = LOG_LEVELS.DEBUG;

// Color schemes for console
const COLORS = {
    DEBUG: '#888888',
    INFO: '#6366f1',
    WARN: '#f59e0b',
    ERROR: '#ef4444',
    SUCCESS: '#22c55e'
};

/**
 * Logger class for tagged, leveled logging
 */
export class Logger {
    /**
     * Create a new logger instance
     * @param {string} tag - Tag/name for this logger (e.g., 'Engine', 'Renderer')
     */
    constructor(tag = 'App') {
        this.tag = tag;
    }

    /**
     * Format a log message with timestamp and tag
     * @private
     */
    _format(level, message) {
        const timestamp = new Date().toISOString().substr(11, 12);
        return [`%c[${timestamp}] [${this.tag}] ${level}:`, `color: ${COLORS[level] || '#888'}`, message];
    }

    /**
     * Log a debug message
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    debug(message, ...args) {
        if (currentLevel <= LOG_LEVELS.DEBUG) {
            console.debug(...this._format('DEBUG', message), ...args);
        }
    }

    /**
     * Log an info message
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    info(message, ...args) {
        if (currentLevel <= LOG_LEVELS.INFO) {
            console.info(...this._format('INFO', message), ...args);
        }
    }

    /**
     * Log a warning message
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    warn(message, ...args) {
        if (currentLevel <= LOG_LEVELS.WARN) {
            console.warn(...this._format('WARN', message), ...args);
        }
    }

    /**
     * Log an error message
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    error(message, ...args) {
        if (currentLevel <= LOG_LEVELS.ERROR) {
            console.error(...this._format('ERROR', message), ...args);
        }
    }

    /**
     * Log a success message (always shown unless NONE)
     * @param {string} message - Message to log
     * @param {...any} args - Additional arguments
     */
    success(message, ...args) {
        if (currentLevel < LOG_LEVELS.NONE) {
            console.log(`%c[${this.tag}] ✓ ${message}`, `color: ${COLORS.SUCCESS}; font-weight: bold`, ...args);
        }
    }

    /**
     * Log a group of related messages
     * @param {string} label - Group label
     * @param {Function} fn - Function containing log calls
     */
    group(label, fn) {
        console.group(`[${this.tag}] ${label}`);
        try {
            fn();
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Log a collapsed group
     * @param {string} label - Group label
     * @param {Function} fn - Function containing log calls
     */
    groupCollapsed(label, fn) {
        console.groupCollapsed(`[${this.tag}] ${label}`);
        try {
            fn();
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Log timing information
     * @param {string} label - Timer label
     */
    time(label) {
        console.time(`[${this.tag}] ${label}`);
    }

    /**
     * End timing and log result
     * @param {string} label - Timer label
     */
    timeEnd(label) {
        console.timeEnd(`[${this.tag}] ${label}`);
    }

    /**
     * Log a table
     * @param {Array|Object} data - Data to display as table
     */
    table(data) {
        console.table(data);
    }

    /**
     * Create a child logger with a sub-tag
     * @param {string} subTag - Sub-tag to append
     * @returns {Logger} New logger instance
     */
    child(subTag) {
        return new Logger(`${this.tag}:${subTag}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Set the global log level
 * @param {string|number} level - Level name or number
 */
Logger.setLevel = function(level) {
    if (typeof level === 'string') {
        currentLevel = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.DEBUG;
    } else {
        currentLevel = level;
    }
};

/**
 * Get the current log level
 * @returns {number}
 */
Logger.getLevel = function() {
    return currentLevel;
};

/**
 * Log levels enum
 */
Logger.LEVELS = LOG_LEVELS;

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

// Create a default logger instance
const defaultLogger = new Logger('Abyss');

export default Logger;
export { LOG_LEVELS, defaultLogger };
