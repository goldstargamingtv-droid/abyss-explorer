/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                      ABYSS EXPLORER - TOAST MANAGER                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Toast notification system for user feedback                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { Logger } from '../utils/logger.js';

/**
 * Toast notification types
 */
export const TOAST_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

/**
 * Toast Manager - Shows temporary notifications
 */
export class ToastManager {
    /**
     * Create toast manager
     * @param {Object} options
     * @param {HTMLElement} [options.container] - Container element
     * @param {Object} [options.events] - Event bus
     */
    constructor(options = {}) {
        this.container = options.container || document.getElementById('toast-container');
        this.events = options.events;
        this.logger = new Logger('Toast');
        
        this.queue = [];
        this.maxVisible = 5;
        this.defaultDuration = 3000;
        
        this._init();
    }
    
    /**
     * Initialize toast manager
     * @private
     */
    _init() {
        // Create container if it doesn't exist
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
        
        // Subscribe to events
        if (this.events) {
            this.events.on('toast', (data) => this.show(data.message, data.type, data.duration));
            this.events.on('toast:info', (msg) => this.info(msg));
            this.events.on('toast:success', (msg) => this.success(msg));
            this.events.on('toast:warning', (msg) => this.warning(msg));
            this.events.on('toast:error', (msg) => this.error(msg));
        }
        
        this.logger.info('Toast manager initialized');
    }
    
    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} [type='info'] - Toast type
     * @param {number} [duration] - Duration in ms
     * @returns {HTMLElement} Toast element
     */
    show(message, type = TOAST_TYPES.INFO, duration = this.defaultDuration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icon based on type
        const icons = {
            [TOAST_TYPES.INFO]: '💡',
            [TOAST_TYPES.SUCCESS]: '✓',
            [TOAST_TYPES.WARNING]: '⚠',
            [TOAST_TYPES.ERROR]: '✕'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || ''}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">×</button>
        `;
        
        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn?.addEventListener('click', () => this._dismiss(toast));
        
        // Add to container
        this.container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this._dismiss(toast), duration);
        }
        
        // Remove oldest if too many
        const toasts = this.container.querySelectorAll('.toast');
        if (toasts.length > this.maxVisible) {
            this._dismiss(toasts[0]);
        }
        
        this.logger.debug(`Toast shown: ${message}`);
        return toast;
    }
    
    /**
     * Dismiss a toast
     * @private
     */
    _dismiss(toast) {
        if (!toast || !toast.parentElement) return;
        
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
    
    /**
     * Show info toast
     * @param {string} message
     * @param {number} [duration]
     */
    info(message, duration) {
        return this.show(message, TOAST_TYPES.INFO, duration);
    }
    
    /**
     * Show success toast
     * @param {string} message
     * @param {number} [duration]
     */
    success(message, duration) {
        return this.show(message, TOAST_TYPES.SUCCESS, duration);
    }
    
    /**
     * Show warning toast
     * @param {string} message
     * @param {number} [duration]
     */
    warning(message, duration) {
        return this.show(message, TOAST_TYPES.WARNING, duration);
    }
    
    /**
     * Show error toast
     * @param {string} message
     * @param {number} [duration]
     */
    error(message, duration = 5000) {
        return this.show(message, TOAST_TYPES.ERROR, duration);
    }
    
    /**
     * Clear all toasts
     */
    clear() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this._dismiss(toast));
    }
}

export default ToastManager;
