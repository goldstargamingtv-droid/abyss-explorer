/**
 * ============================================================================
 * ABYSS EXPLORER - NOTIFICATIONS
 * ============================================================================
 * 
 * Toast notification system for displaying feedback messages to users.
 * Supports multiple notification types, auto-dismiss, and stacking.
 * 
 * @module ui/notifications
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NOTIFICATION_TYPE = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DURATION = 4000;
const ANIMATION_DURATION = 300;
const MAX_NOTIFICATIONS = 5;

// ============================================================================
// NOTIFICATION CLASS
// ============================================================================

class Notification {
    /**
     * Create a notification
     * @param {Object} options
     */
    constructor(options = {}) {
        this.id = options.id || `notif_${Date.now()}`;
        this.message = options.message || '';
        this.type = options.type || NOTIFICATION_TYPE.INFO;
        this.duration = options.duration ?? DEFAULT_DURATION;
        this.dismissible = options.dismissible ?? true;
        this.action = options.action || null;
        this.actionLabel = options.actionLabel || 'Action';
        
        // Callbacks
        this.onDismiss = options.onDismiss || null;
        this.onAction = options.onAction || null;
        
        // State
        this.element = null;
        this.timeout = null;
        this.dismissed = false;
        
        // Build
        this._build();
    }
    
    /**
     * Build notification DOM
     * @private
     */
    _build() {
        this.element = document.createElement('div');
        this.element.className = `notification notification-${this.type}`;
        this.element.setAttribute('role', 'alert');
        this.element.setAttribute('aria-live', 'polite');
        
        const icons = {
            [NOTIFICATION_TYPE.INFO]: 'ℹ️',
            [NOTIFICATION_TYPE.SUCCESS]: '✓',
            [NOTIFICATION_TYPE.WARNING]: '⚠️',
            [NOTIFICATION_TYPE.ERROR]: '✕'
        };
        
        this.element.innerHTML = `
            <div class="notification-icon">${icons[this.type]}</div>
            <div class="notification-content">
                <span class="notification-message">${this.message}</span>
                ${this.action ? `
                    <button class="notification-action">${this.actionLabel}</button>
                ` : ''}
            </div>
            ${this.dismissible ? `
                <button class="notification-close" aria-label="Dismiss">×</button>
            ` : ''}
            ${this.duration > 0 ? `
                <div class="notification-progress">
                    <div class="progress-bar"></div>
                </div>
            ` : ''}
        `;
        
        this._setupEvents();
    }
    
    /**
     * Setup event handlers
     * @private
     */
    _setupEvents() {
        // Close button
        const closeBtn = this.element.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.dismiss());
        }
        
        // Action button
        const actionBtn = this.element.querySelector('.notification-action');
        if (actionBtn) {
            actionBtn.addEventListener('click', () => {
                if (this.onAction) this.onAction();
                if (this.action) this.action();
                this.dismiss();
            });
        }
        
        // Pause on hover
        this.element.addEventListener('mouseenter', () => {
            this._pauseTimeout();
        });
        
        this.element.addEventListener('mouseleave', () => {
            this._resumeTimeout();
        });
    }
    
    /**
     * Show notification
     * @param {HTMLElement} container
     */
    show(container) {
        container.appendChild(this.element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.element.classList.add('show');
        });
        
        // Start progress bar animation
        const progressBar = this.element.querySelector('.progress-bar');
        if (progressBar && this.duration > 0) {
            progressBar.style.transition = `width ${this.duration}ms linear`;
            requestAnimationFrame(() => {
                progressBar.style.width = '0%';
            });
        }
        
        // Auto dismiss
        if (this.duration > 0) {
            this._startTimeout();
        }
    }
    
    /**
     * Dismiss notification
     */
    dismiss() {
        if (this.dismissed) return;
        this.dismissed = true;
        
        clearTimeout(this.timeout);
        this.element.classList.remove('show');
        this.element.classList.add('hide');
        
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            if (this.onDismiss) this.onDismiss();
        }, ANIMATION_DURATION);
    }
    
    /**
     * Start auto-dismiss timeout
     * @private
     */
    _startTimeout() {
        this._remainingTime = this.duration;
        this._timeoutStart = Date.now();
        this.timeout = setTimeout(() => this.dismiss(), this.duration);
    }
    
    /**
     * Pause timeout (on hover)
     * @private
     */
    _pauseTimeout() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this._remainingTime -= Date.now() - this._timeoutStart;
            
            const progressBar = this.element.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.transition = 'none';
            }
        }
    }
    
    /**
     * Resume timeout
     * @private
     */
    _resumeTimeout() {
        if (this._remainingTime > 0) {
            this._timeoutStart = Date.now();
            this.timeout = setTimeout(() => this.dismiss(), this._remainingTime);
            
            const progressBar = this.element.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.transition = `width ${this._remainingTime}ms linear`;
            }
        }
    }
}

// ============================================================================
// NOTIFICATION MANAGER CLASS
// ============================================================================

export class NotificationManager {
    /**
     * Create notification manager
     * @param {Object} options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.position = options.position || 'bottom-right';
        this.maxNotifications = options.maxNotifications || MAX_NOTIFICATIONS;
        
        // Container
        this.container = null;
        
        // Active notifications
        this.notifications = [];
        
        // Build container
        this._buildContainer();
    }
    
    /**
     * Set UI manager reference
     */
    setManager(manager) {
        this.manager = manager;
        this._setupEvents();
    }
    
    /**
     * Build container element
     * @private
     */
    _buildContainer() {
        this.container = document.createElement('div');
        this.container.className = `notification-container position-${this.position}`;
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Notifications');
        
        document.body.appendChild(this.container);
    }
    
    /**
     * Setup manager events
     * @private
     */
    _setupEvents() {
        if (!this.manager) return;
        
        this.manager.on('notification', (data) => {
            this.show(data);
        });
        
        // Listen for common events
        this.manager.on('render:complete', () => {
            // Only show for long renders
        });
        
        this.manager.on('render:error', (error) => {
            this.error(error.message || 'Render failed');
        });
        
        this.manager.on('export:complete', () => {
            this.success('Export complete');
        });
    }
    
    /**
     * Show a notification
     * @param {Object|string} options - Options or message string
     * @returns {Notification}
     */
    show(options) {
        if (typeof options === 'string') {
            options = { message: options };
        }
        
        // Remove oldest if at max
        while (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            oldest.dismiss();
        }
        
        const notification = new Notification({
            ...options,
            onDismiss: () => {
                const index = this.notifications.indexOf(notification);
                if (index >= 0) {
                    this.notifications.splice(index, 1);
                }
            }
        });
        
        this.notifications.push(notification);
        notification.show(this.container);
        
        return notification;
    }
    
    /**
     * Show info notification
     * @param {string} message
     * @param {Object} options
     */
    info(message, options = {}) {
        return this.show({
            ...options,
            message,
            type: NOTIFICATION_TYPE.INFO
        });
    }
    
    /**
     * Show success notification
     * @param {string} message
     * @param {Object} options
     */
    success(message, options = {}) {
        return this.show({
            ...options,
            message,
            type: NOTIFICATION_TYPE.SUCCESS
        });
    }
    
    /**
     * Show warning notification
     * @param {string} message
     * @param {Object} options
     */
    warning(message, options = {}) {
        return this.show({
            ...options,
            message,
            type: NOTIFICATION_TYPE.WARNING
        });
    }
    
    /**
     * Show error notification
     * @param {string} message
     * @param {Object} options
     */
    error(message, options = {}) {
        return this.show({
            ...options,
            message,
            type: NOTIFICATION_TYPE.ERROR,
            duration: options.duration ?? 6000 // Longer for errors
        });
    }
    
    /**
     * Show notification with action
     * @param {string} message
     * @param {string} actionLabel
     * @param {Function} action
     * @param {Object} options
     */
    withAction(message, actionLabel, action, options = {}) {
        return this.show({
            ...options,
            message,
            actionLabel,
            action,
            duration: options.duration ?? 8000 // Longer for actionable
        });
    }
    
    /**
     * Dismiss all notifications
     */
    dismissAll() {
        this.notifications.forEach(n => n.dismiss());
        this.notifications = [];
    }
    
    /**
     * Set position
     * @param {string} position - top-left, top-right, bottom-left, bottom-right
     */
    setPosition(position) {
        this.container.classList.remove(`position-${this.position}`);
        this.position = position;
        this.container.classList.add(`position-${this.position}`);
    }
    
    /**
     * Destroy manager
     */
    destroy() {
        this.dismissAll();
        if (this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Notification };
export default NotificationManager;
