/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                      ABYSS EXPLORER - MODAL MANAGER                           ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Manages all modal dialogs in the application                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { Logger } from '../utils/logger.js';

/**
 * Modal Manager - Handles opening, closing, and managing modal dialogs
 */
export class ModalManager {
    /**
     * Create modal manager
     * @param {Object} options
     * @param {Object} [options.events] - Event bus
     */
    constructor(options = {}) {
        this.events = options.events;
        this.logger = new Logger('Modals');
        
        this.activeModal = null;
        this.modals = new Map();
        this.history = [];
        
        this._init();
    }
    
    /**
     * Initialize modal manager
     * @private
     */
    _init() {
        // Find all modals
        document.querySelectorAll('.modal').forEach(modal => {
            const id = modal.id;
            if (id) {
                this.modals.set(id, modal);
            }
        });
        
        // Global click handler for close buttons and overlays
        document.addEventListener('click', (e) => {
            // Close button
            if (e.target.closest('.modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) this.close(modal.id);
            }
            
            // Overlay/backdrop click
            if (e.target.classList.contains('modal-overlay') || 
                e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.closest('.modal');
                if (modal) this.close(modal.id);
            }
        });
        
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });
        
        // Subscribe to events
        if (this.events) {
            this.events.on('modal:open', (id) => this.open(id));
            this.events.on('modal:close', (id) => this.close(id));
            this.events.on('modal:toggle', (id) => this.toggle(id));
            this.events.on('escape', () => this.closeActive());
        }
        
        this.logger.info(`Modal manager initialized with ${this.modals.size} modals`);
    }
    
    /**
     * Open a modal
     * @param {string} id - Modal ID
     * @param {Object} [data] - Optional data to pass to modal
     */
    open(id, data = null) {
        const modal = this.modals.get(id) || document.getElementById(id);
        if (!modal) {
            this.logger.warn(`Modal not found: ${id}`);
            return;
        }
        
        // Close any active modal
        if (this.activeModal && this.activeModal !== id) {
            this.close(this.activeModal, false);
        }
        
        // Add active class
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Store as active
        this.activeModal = id;
        this.history.push(id);
        
        // Focus first focusable element
        this._focusFirstElement(modal);
        
        // Emit event
        this.events?.emit('modal:opened', { id, data });
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        this.logger.debug(`Modal opened: ${id}`);
    }
    
    /**
     * Close a modal
     * @param {string} [id] - Modal ID, or close active modal if not specified
     * @param {boolean} [emitEvent=true] - Whether to emit close event
     */
    close(id = null, emitEvent = true) {
        const modalId = id || this.activeModal;
        if (!modalId) return;
        
        const modal = this.modals.get(modalId) || document.getElementById(modalId);
        if (!modal) return;
        
        // Remove active class
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        
        // Clear active if this was the active modal
        if (this.activeModal === modalId) {
            this.activeModal = null;
        }
        
        // Remove from history
        const historyIndex = this.history.lastIndexOf(modalId);
        if (historyIndex !== -1) {
            this.history.splice(historyIndex, 1);
        }
        
        // Restore body scroll if no modals open
        if (!this.activeModal) {
            document.body.classList.remove('modal-open');
        }
        
        // Emit event
        if (emitEvent) {
            this.events?.emit('modal:closed', { id: modalId });
        }
        
        this.logger.debug(`Modal closed: ${modalId}`);
    }
    
    /**
     * Toggle a modal
     * @param {string} id - Modal ID
     */
    toggle(id) {
        const modal = this.modals.get(id) || document.getElementById(id);
        if (!modal) return;
        
        if (modal.classList.contains('active')) {
            this.close(id);
        } else {
            this.open(id);
        }
    }
    
    /**
     * Close the active modal
     */
    closeActive() {
        if (this.activeModal) {
            this.close(this.activeModal);
        }
    }
    
    /**
     * Close all modals
     */
    closeAll() {
        this.modals.forEach((modal, id) => {
            if (modal.classList.contains('active')) {
                this.close(id, false);
            }
        });
        document.body.classList.remove('modal-open');
        this.activeModal = null;
        this.history = [];
    }
    
    /**
     * Check if a modal is open
     * @param {string} id - Modal ID
     * @returns {boolean}
     */
    isOpen(id) {
        const modal = this.modals.get(id) || document.getElementById(id);
        return modal?.classList.contains('active') || false;
    }
    
    /**
     * Get the active modal ID
     * @returns {string|null}
     */
    getActive() {
        return this.activeModal;
    }
    
    /**
     * Focus first focusable element in modal
     * @private
     */
    _focusFirstElement(modal) {
        const focusable = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusable.length > 0) {
            // Skip close button, focus content
            const firstContent = [...focusable].find(el => !el.classList.contains('modal-close'));
            (firstContent || focusable[0]).focus();
        }
    }
    
    /**
     * Register a new modal
     * @param {string} id - Modal ID
     * @param {HTMLElement} element - Modal element
     */
    register(id, element) {
        this.modals.set(id, element);
    }
    
    /**
     * Unregister a modal
     * @param {string} id - Modal ID
     */
    unregister(id) {
        this.modals.delete(id);
        if (this.activeModal === id) {
            this.activeModal = null;
        }
    }
}

export default ModalManager;
