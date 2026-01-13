/**
 * ============================================================================
 * ABYSS EXPLORER - MODAL SYSTEM
 * ============================================================================
 * 
 * Reusable modal system supporting stacking, animations, keyboard navigation,
 * and accessibility features.
 * 
 * @module ui/modal
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { UI_EVENTS } from './ui-manager.js';

// ============================================================================
// MODAL TEMPLATES
// ============================================================================

const MODAL_TEMPLATES = {
    help: {
        title: 'Help & Keyboard Shortcuts',
        size: 'large',
        content: `
            <div class="help-content">
                <section class="help-section">
                    <h3>Navigation</h3>
                    <div class="shortcut-list">
                        <div class="shortcut"><kbd>Drag</kbd> Pan view</div>
                        <div class="shortcut"><kbd>Scroll</kbd> Zoom in/out</div>
                        <div class="shortcut"><kbd>Double-click</kbd> Zoom to point</div>
                        <div class="shortcut"><kbd>Space</kbd> Reset view</div>
                        <div class="shortcut"><kbd>R</kbd> Random explore</div>
                    </div>
                </section>
                
                <section class="help-section">
                    <h3>Controls</h3>
                    <div class="shortcut-list">
                        <div class="shortcut"><kbd>S</kbd> Toggle sidebar</div>
                        <div class="shortcut"><kbd>F</kbd> Fullscreen</div>
                        <div class="shortcut"><kbd>I</kbd> Info overlay</div>
                        <div class="shortcut"><kbd>H</kbd> Help (this panel)</div>
                        <div class="shortcut"><kbd>Esc</kbd> Close modal</div>
                    </div>
                </section>
                
                <section class="help-section">
                    <h3>Parameters</h3>
                    <div class="shortcut-list">
                        <div class="shortcut"><kbd>[</kbd> / <kbd>]</kbd> Adjust iterations</div>
                        <div class="shortcut"><kbd>,</kbd> / <kbd>.</kbd> Cycle palettes</div>
                        <div class="shortcut"><kbd>1</kbd> 2D mode</div>
                        <div class="shortcut"><kbd>2</kbd> 3D mode</div>
                    </div>
                </section>
                
                <section class="help-section">
                    <h3>3D Mode (WASD)</h3>
                    <div class="shortcut-list">
                        <div class="shortcut"><kbd>W/A/S/D</kbd> Move camera</div>
                        <div class="shortcut"><kbd>Space</kbd> Move up</div>
                        <div class="shortcut"><kbd>Ctrl</kbd> Move down</div>
                        <div class="shortcut"><kbd>Shift</kbd> Sprint</div>
                    </div>
                </section>
                
                <section class="help-section">
                    <h3>About Abyss Explorer</h3>
                    <p>A high-performance fractal visualization tool supporting deep zooms, 
                    3D fractals, custom formulas, and cinematic animations.</p>
                    <p class="version">Version 1.0.0</p>
                </section>
            </div>
        `
    },
    
    settings: {
        title: 'Settings',
        size: 'medium',
        content: `
            <div class="settings-content">
                <section class="settings-section">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <label>Theme</label>
                        <select id="setting-theme">
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                            <option value="auto">Auto (System)</option>
                        </select>
                    </div>
                </section>
                
                <section class="settings-section">
                    <h3>Performance</h3>
                    <div class="setting-item">
                        <label>Render Quality</label>
                        <select id="setting-quality">
                            <option value="low">Low (Fast)</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="ultra">Ultra</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Worker Threads</label>
                        <select id="setting-workers">
                            <option value="auto">Auto</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="4">4</option>
                            <option value="8">8</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-gpu">
                            Use GPU Acceleration
                        </label>
                    </div>
                </section>
                
                <section class="settings-section">
                    <h3>Interface</h3>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-info" checked>
                            Show Info Overlay
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="setting-animations" checked>
                            Enable Animations
                        </label>
                    </div>
                </section>
            </div>
        `
    },
    
    error: {
        title: 'Error',
        size: 'small',
        content: `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <p class="error-message"></p>
            </div>
        `
    },
    
    confirm: {
        title: 'Confirm',
        size: 'small',
        content: `
            <div class="confirm-content">
                <p class="confirm-message"></p>
            </div>
        `,
        buttons: [
            { label: 'Cancel', action: 'cancel', class: 'btn-secondary' },
            { label: 'Confirm', action: 'confirm', class: 'btn-primary' }
        ]
    }
};

// ============================================================================
// MODAL CLASS
// ============================================================================

export class Modal {
    /**
     * Create modal instance
     * @param {Object} options - Modal options
     */
    constructor(options = {}) {
        this.id = options.id || `modal_${Date.now()}`;
        this.title = options.title || '';
        this.content = options.content || '';
        this.size = options.size || 'medium'; // small, medium, large, fullscreen
        this.closable = options.closable ?? true;
        this.buttons = options.buttons || [];
        
        // Callbacks
        this.onOpen = options.onOpen || null;
        this.onClose = options.onClose || null;
        this.onAction = options.onAction || null;
        
        // State
        this.isOpen = false;
        
        // Element
        this.element = null;
        this.contentElement = null;
        
        // Build
        this._build();
    }
    
    /**
     * Build modal DOM
     * @private
     */
    _build() {
        this.element = document.createElement('div');
        this.element.className = `modal modal-${this.size}`;
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-modal', 'true');
        this.element.setAttribute('aria-labelledby', `${this.id}-title`);
        
        this.element.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <h2 class="modal-title" id="${this.id}-title">${this.title}</h2>
                    ${this.closable ? `
                        <button class="modal-close" aria-label="Close modal">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" 
                                      stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
                <div class="modal-body">
                    ${this.content}
                </div>
                ${this.buttons.length > 0 ? `
                    <div class="modal-footer">
                        ${this.buttons.map(btn => `
                            <button class="btn ${btn.class || 'btn-secondary'}" 
                                    data-action="${btn.action}">
                                ${btn.label}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        this.contentElement = this.element.querySelector('.modal-body');
        
        // Setup events
        this._setupEvents();
    }
    
    /**
     * Setup event handlers
     * @private
     */
    _setupEvents() {
        // Close button
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // Backdrop click
        this.element.querySelector('.modal-backdrop').addEventListener('click', () => {
            if (this.closable) this.close();
        });
        
        // Button actions
        this.element.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (this.onAction) {
                    this.onAction(action);
                }
                if (action === 'cancel' || action === 'close') {
                    this.close();
                }
            });
        });
        
        // Escape key
        this._handleKeyDown = (e) => {
            if (e.key === 'Escape' && this.closable) {
                this.close();
            }
        };
    }
    
    /**
     * Open modal
     */
    open() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        document.body.appendChild(this.element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.element.classList.add('open');
        });
        
        // Trap focus
        document.addEventListener('keydown', this._handleKeyDown);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first focusable element
        const focusable = this.element.querySelector('button, input, select, textarea');
        if (focusable) focusable.focus();
        
        if (this.onOpen) this.onOpen();
    }
    
    /**
     * Close modal
     */
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.element.classList.remove('open');
        
        // Remove after animation
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 300);
        
        document.removeEventListener('keydown', this._handleKeyDown);
        document.body.style.overflow = '';
        
        if (this.onClose) this.onClose();
    }
    
    /**
     * Set content
     * @param {string} content - HTML content
     */
    setContent(content) {
        this.content = content;
        if (this.contentElement) {
            this.contentElement.innerHTML = content;
        }
    }
    
    /**
     * Set title
     * @param {string} title
     */
    setTitle(title) {
        this.title = title;
        const titleEl = this.element.querySelector('.modal-title');
        if (titleEl) titleEl.textContent = title;
    }
    
    /**
     * Destroy modal
     */
    destroy() {
        this.close();
        document.removeEventListener('keydown', this._handleKeyDown);
    }
}

// ============================================================================
// MODAL MANAGER CLASS
// ============================================================================

export class ModalManager {
    /**
     * Create modal manager
     * @param {Object} options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.container = options.container || document.body;
        
        // Modal stack
        this.stack = [];
        this.activeModal = null;
        
        // Registered modal components (Gallery, PresetBrowser, etc.)
        this.components = new Map();
        
        // Custom content modals
        this.modals = new Map();
    }
    
    /**
     * Set UI manager reference
     */
    setManager(manager) {
        this.manager = manager;
        this._setupEvents();
    }
    
    /**
     * Setup manager events
     * @private
     */
    _setupEvents() {
        if (!this.manager) return;
        
        this.manager.on(UI_EVENTS.MODAL_OPEN, ({ id, data }) => {
            this.open(id, data);
        });
        
        this.manager.on(UI_EVENTS.MODAL_CLOSE, ({ id, all }) => {
            if (all) {
                this.closeAll();
            } else {
                this.close();
            }
        });
    }
    
    /**
     * Register a modal component
     * @param {string} id - Modal ID
     * @param {Object} component - Component with getElement() method
     */
    registerComponent(id, component) {
        this.components.set(id, component);
    }
    
    /**
     * Open a modal
     * @param {string} id - Modal ID or template name
     * @param {Object} data - Optional data to pass
     */
    open(id, data = {}) {
        // Check if it's a registered component
        if (this.components.has(id)) {
            const component = this.components.get(id);
            const element = component.getElement?.() || component.element;
            
            if (element) {
                const modal = new Modal({
                    id,
                    title: data.title || this._getComponentTitle(id),
                    content: '',
                    size: data.size || 'large',
                    onClose: () => {
                        this._removeFromStack(modal);
                    }
                });
                
                // Insert component element
                modal.contentElement.appendChild(element);
                
                this._addToStack(modal);
                modal.open();
                return modal;
            }
        }
        
        // Check templates
        if (MODAL_TEMPLATES[id]) {
            const template = MODAL_TEMPLATES[id];
            const modal = new Modal({
                id,
                title: data.title || template.title,
                content: template.content,
                size: data.size || template.size,
                buttons: template.buttons,
                onClose: () => {
                    this._removeFromStack(modal);
                },
                onAction: data.onAction
            });
            
            // Update content with data
            if (data.message) {
                const msgEl = modal.element.querySelector('.error-message, .confirm-message');
                if (msgEl) msgEl.textContent = data.message;
            }
            if (data.content) {
                modal.setContent(data.content);
            }
            
            this._addToStack(modal);
            modal.open();
            return modal;
        }
        
        // Create generic modal
        const modal = new Modal({
            id,
            title: data.title || 'Modal',
            content: data.content || '',
            size: data.size || 'medium',
            buttons: data.buttons,
            onClose: () => {
                this._removeFromStack(modal);
            },
            onAction: data.onAction
        });
        
        this._addToStack(modal);
        modal.open();
        return modal;
    }
    
    /**
     * Close current modal
     */
    close() {
        if (this.activeModal) {
            this.activeModal.close();
        }
    }
    
    /**
     * Close all modals
     */
    closeAll() {
        while (this.stack.length > 0) {
            const modal = this.stack.pop();
            modal.close();
        }
        this.activeModal = null;
    }
    
    /**
     * Add modal to stack
     * @private
     */
    _addToStack(modal) {
        this.stack.push(modal);
        this.activeModal = modal;
    }
    
    /**
     * Remove modal from stack
     * @private
     */
    _removeFromStack(modal) {
        const index = this.stack.indexOf(modal);
        if (index >= 0) {
            this.stack.splice(index, 1);
        }
        this.activeModal = this.stack[this.stack.length - 1] || null;
    }
    
    /**
     * Get component title
     * @private
     */
    _getComponentTitle(id) {
        const titles = {
            gallery: 'Gallery',
            'preset-browser': 'Preset Browser',
            'formula-editor': 'Formula Editor',
            'palette-editor': 'Palette Editor',
            help: 'Help',
            settings: 'Settings'
        };
        return titles[id] || id;
    }
    
    // ========================================================================
    // CONVENIENCE METHODS
    // ========================================================================
    
    /**
     * Show alert modal
     * @param {string} message
     * @param {string} title
     */
    alert(message, title = 'Alert') {
        return this.open('error', { 
            title, 
            message,
            buttons: [{ label: 'OK', action: 'close', class: 'btn-primary' }]
        });
    }
    
    /**
     * Show confirm modal
     * @param {string} message
     * @param {string} title
     * @returns {Promise<boolean>}
     */
    confirm(message, title = 'Confirm') {
        return new Promise(resolve => {
            this.open('confirm', {
                title,
                message,
                onAction: (action) => {
                    resolve(action === 'confirm');
                }
            });
        });
    }
    
    /**
     * Show error modal
     * @param {string} message
     */
    error(message) {
        return this.open('error', { message });
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { MODAL_TEMPLATES };
export default ModalManager;
