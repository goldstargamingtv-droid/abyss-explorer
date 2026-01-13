/**
 * ============================================================================
 * ABYSS EXPLORER - CONTEXT MENU
 * ============================================================================
 * 
 * Right-click context menu for canvas providing quick actions like copying
 * coordinates, adding to favorites, sharing, and navigation options.
 * 
 * @module ui/context-menu
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { UI_EVENTS } from './ui-manager.js';

// ============================================================================
// MENU ITEMS
// ============================================================================

const DEFAULT_MENU_ITEMS = [
    {
        id: 'copy-coords',
        label: 'Copy Coordinates',
        icon: '📋',
        shortcut: 'Ctrl+C',
        action: 'copy-coordinates'
    },
    {
        id: 'copy-link',
        label: 'Copy Link to Location',
        icon: '🔗',
        action: 'copy-link'
    },
    { type: 'separator' },
    {
        id: 'zoom-here',
        label: 'Zoom to Point',
        icon: '🔍',
        action: 'zoom-to-point'
    },
    {
        id: 'center-here',
        label: 'Center on Point',
        icon: '⊕',
        action: 'center-on-point'
    },
    {
        id: 'set-julia',
        label: 'Use as Julia Seed',
        icon: '🌀',
        action: 'set-julia-seed',
        condition: (ctx) => ctx.fractal !== 'julia'
    },
    { type: 'separator' },
    {
        id: 'add-favorite',
        label: 'Add to Favorites',
        icon: '⭐',
        action: 'add-favorite'
    },
    {
        id: 'add-keyframe',
        label: 'Add Keyframe Here',
        icon: '🎬',
        action: 'add-keyframe'
    },
    { type: 'separator' },
    {
        id: 'share',
        label: 'Share',
        icon: '📤',
        submenu: [
            { id: 'share-twitter', label: 'Twitter', icon: '🐦', action: 'share-twitter' },
            { id: 'share-reddit', label: 'Reddit', icon: '🔴', action: 'share-reddit' },
            { id: 'share-email', label: 'Email', icon: '✉️', action: 'share-email' }
        ]
    },
    {
        id: 'export',
        label: 'Export Image',
        icon: '💾',
        shortcut: 'E',
        action: 'export-image'
    },
    { type: 'separator' },
    {
        id: 'reset-view',
        label: 'Reset View',
        icon: '🔄',
        shortcut: 'Space',
        action: 'reset-view'
    },
    {
        id: 'fullscreen',
        label: 'Fullscreen',
        icon: '⛶',
        shortcut: 'F',
        action: 'toggle-fullscreen'
    }
];

// ============================================================================
// CONTEXT MENU CLASS
// ============================================================================

export class ContextMenu {
    /**
     * Create context menu
     * @param {Object} options - Options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.target = options.target || null; // Canvas element
        
        // Menu items
        this.items = options.items || [...DEFAULT_MENU_ITEMS];
        
        // State
        this.isOpen = false;
        this.clickPosition = { x: 0, y: 0 };
        this.complexPosition = { r: 0, i: 0 };
        this.activeSubmenu = null;
        
        // Context data
        this.context = {
            fractal: 'mandelbrot',
            zoom: 1,
            centerX: -0.5,
            centerY: 0
        };
        
        // Elements
        this.element = null;
        
        // Build
        this._build();
        
        // Attach to target
        if (this.target) {
            this._attachToTarget();
        }
    }
    
    /**
     * Set UI manager reference
     */
    setManager(manager) {
        this.manager = manager;
        this._setupEvents();
    }
    
    // ========================================================================
    // BUILD
    // ========================================================================
    
    /**
     * Build context menu DOM
     * @private
     */
    _build() {
        this.element = document.createElement('div');
        this.element.className = 'context-menu';
        this.element.setAttribute('role', 'menu');
        this.element.setAttribute('aria-label', 'Context menu');
        
        // Add to document
        document.body.appendChild(this.element);
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.close();
            }
        });
        
        // Close on scroll
        document.addEventListener('scroll', () => this.close(), true);
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }
    
    /**
     * Render menu items
     * @private
     */
    _render() {
        this.element.innerHTML = '';
        
        const visibleItems = this.items.filter(item => {
            if (item.condition && !item.condition(this.context)) {
                return false;
            }
            return true;
        });
        
        visibleItems.forEach((item, index) => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                separator.setAttribute('role', 'separator');
                this.element.appendChild(separator);
            } else {
                const menuItem = this._createMenuItem(item, index);
                this.element.appendChild(menuItem);
            }
        });
    }
    
    /**
     * Create a menu item element
     * @private
     */
    _createMenuItem(item, index) {
        const el = document.createElement('button');
        el.className = 'context-menu-item';
        el.setAttribute('role', 'menuitem');
        el.setAttribute('data-action', item.action || '');
        el.setAttribute('tabindex', index === 0 ? '0' : '-1');
        
        el.innerHTML = `
            <span class="menu-icon">${item.icon || ''}</span>
            <span class="menu-label">${item.label}</span>
            ${item.shortcut ? `<span class="menu-shortcut">${item.shortcut}</span>` : ''}
            ${item.submenu ? `<span class="menu-arrow">▶</span>` : ''}
        `;
        
        if (item.submenu) {
            el.classList.add('has-submenu');
            el.addEventListener('mouseenter', () => this._showSubmenu(el, item.submenu));
            el.addEventListener('mouseleave', (e) => {
                // Don't close if moving to submenu
                if (!e.relatedTarget?.closest('.context-submenu')) {
                    this._hideSubmenu();
                }
            });
        } else {
            el.addEventListener('click', () => this._handleAction(item.action));
        }
        
        // Keyboard navigation
        el.addEventListener('keydown', (e) => {
            this._handleKeyNav(e, el, item);
        });
        
        return el;
    }
    
    /**
     * Show submenu
     * @private
     */
    _showSubmenu(parentEl, items) {
        this._hideSubmenu();
        
        const submenu = document.createElement('div');
        submenu.className = 'context-submenu';
        submenu.setAttribute('role', 'menu');
        
        items.forEach(item => {
            const el = document.createElement('button');
            el.className = 'context-menu-item';
            el.setAttribute('role', 'menuitem');
            el.innerHTML = `
                <span class="menu-icon">${item.icon || ''}</span>
                <span class="menu-label">${item.label}</span>
            `;
            el.addEventListener('click', () => this._handleAction(item.action));
            submenu.appendChild(el);
        });
        
        // Position submenu
        const rect = parentEl.getBoundingClientRect();
        submenu.style.left = `${rect.right}px`;
        submenu.style.top = `${rect.top}px`;
        
        // Check if off-screen
        document.body.appendChild(submenu);
        const subRect = submenu.getBoundingClientRect();
        if (subRect.right > window.innerWidth) {
            submenu.style.left = `${rect.left - subRect.width}px`;
        }
        if (subRect.bottom > window.innerHeight) {
            submenu.style.top = `${window.innerHeight - subRect.height - 10}px`;
        }
        
        submenu.addEventListener('mouseleave', () => this._hideSubmenu());
        
        this.activeSubmenu = submenu;
    }
    
    /**
     * Hide submenu
     * @private
     */
    _hideSubmenu() {
        if (this.activeSubmenu) {
            this.activeSubmenu.remove();
            this.activeSubmenu = null;
        }
    }
    
    /**
     * Handle keyboard navigation
     * @private
     */
    _handleKeyNav(e, currentEl, item) {
        const items = Array.from(this.element.querySelectorAll('.context-menu-item'));
        const currentIndex = items.indexOf(currentEl);
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                items[prevIndex].focus();
                break;
            case 'ArrowRight':
                if (item.submenu) {
                    e.preventDefault();
                    this._showSubmenu(currentEl, item.submenu);
                    this.activeSubmenu?.querySelector('.context-menu-item')?.focus();
                }
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (item.action) {
                    this._handleAction(item.action);
                }
                break;
        }
    }
    
    // ========================================================================
    // ACTIONS
    // ========================================================================
    
    /**
     * Handle action
     * @private
     */
    _handleAction(action) {
        this.close();
        
        switch (action) {
            case 'copy-coordinates':
                this._copyCoordinates();
                break;
            case 'copy-link':
                this._copyLink();
                break;
            case 'zoom-to-point':
                this._zoomToPoint();
                break;
            case 'center-on-point':
                this._centerOnPoint();
                break;
            case 'set-julia-seed':
                this._setJuliaSeed();
                break;
            case 'add-favorite':
                this._addFavorite();
                break;
            case 'add-keyframe':
                this._addKeyframe();
                break;
            case 'share-twitter':
                this._shareTwitter();
                break;
            case 'share-reddit':
                this._shareReddit();
                break;
            case 'share-email':
                this._shareEmail();
                break;
            case 'export-image':
                this.manager?.emit(UI_EVENTS.EXPORT_IMAGE);
                break;
            case 'reset-view':
                this.manager?.resetView();
                break;
            case 'toggle-fullscreen':
                this.manager?.toggleFullscreen();
                break;
            default:
                this.manager?.emit(`context:${action}`, {
                    screenPosition: this.clickPosition,
                    complexPosition: this.complexPosition
                });
        }
    }
    
    /**
     * Copy coordinates to clipboard
     * @private
     */
    async _copyCoordinates() {
        const text = `${this.complexPosition.r}, ${this.complexPosition.i}i`;
        
        try {
            await navigator.clipboard.writeText(text);
            this.manager?.emit('notification', {
                message: 'Coordinates copied',
                type: 'success'
            });
        } catch {
            // Fallback
            this._copyFallback(text);
        }
    }
    
    /**
     * Copy link to clipboard
     * @private
     */
    async _copyLink() {
        const params = new URLSearchParams({
            x: this.context.centerX,
            y: this.context.centerY,
            z: this.context.zoom,
            f: this.context.fractal
        });
        
        const url = `${window.location.origin}${window.location.pathname}?${params}`;
        
        try {
            await navigator.clipboard.writeText(url);
            this.manager?.emit('notification', {
                message: 'Link copied to clipboard',
                type: 'success'
            });
        } catch {
            this._copyFallback(url);
        }
    }
    
    /**
     * Zoom to clicked point
     * @private
     */
    _zoomToPoint() {
        this.manager?.emit(UI_EVENTS.CAMERA_ANIMATE, {
            centerX: this.complexPosition.r,
            centerY: this.complexPosition.i,
            zoom: this.context.zoom * 2,
            duration: 1000
        });
    }
    
    /**
     * Center on clicked point
     * @private
     */
    _centerOnPoint() {
        this.manager?.emit(UI_EVENTS.CAMERA_ANIMATE, {
            centerX: this.complexPosition.r,
            centerY: this.complexPosition.i,
            duration: 800
        });
    }
    
    /**
     * Set as Julia seed
     * @private
     */
    _setJuliaSeed() {
        this.manager?.setParameter('juliaReal', this.complexPosition.r);
        this.manager?.setParameter('juliaImag', this.complexPosition.i);
        this.manager?.setFractal('julia');
        
        this.manager?.emit('notification', {
            message: `Julia seed: ${this.complexPosition.r.toFixed(4)} + ${this.complexPosition.i.toFixed(4)}i`,
            type: 'success'
        });
    }
    
    /**
     * Add current location to favorites
     * @private
     */
    _addFavorite() {
        const location = {
            id: `fav_${Date.now()}`,
            name: `Location at ${this.complexPosition.r.toFixed(4)}, ${this.complexPosition.i.toFixed(4)}i`,
            fractal: this.context.fractal,
            centerX: this.context.centerX,
            centerY: this.context.centerY,
            zoom: this.context.zoom
        };
        
        // Save to localStorage
        try {
            const favorites = JSON.parse(localStorage.getItem('abyss-favorites-locations') || '[]');
            favorites.push(location);
            localStorage.setItem('abyss-favorites-locations', JSON.stringify(favorites));
            
            this.manager?.emit('notification', {
                message: 'Added to favorites',
                type: 'success'
            });
        } catch (e) {
            this.manager?.emit('notification', {
                message: 'Failed to save favorite',
                type: 'error'
            });
        }
    }
    
    /**
     * Add keyframe at current position
     * @private
     */
    _addKeyframe() {
        this.manager?.emit('keyframe:add', {
            centerX: this.context.centerX,
            centerY: this.context.centerY,
            zoom: this.context.zoom
        });
        
        this.manager?.emit('notification', {
            message: 'Keyframe added',
            type: 'success'
        });
    }
    
    /**
     * Share on Twitter
     * @private
     */
    _shareTwitter() {
        const text = encodeURIComponent('Check out this fractal! 🌀');
        const url = encodeURIComponent(this._getShareUrl());
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }
    
    /**
     * Share on Reddit
     * @private
     */
    _shareReddit() {
        const title = encodeURIComponent('Interesting fractal location');
        const url = encodeURIComponent(this._getShareUrl());
        window.open(`https://reddit.com/submit?title=${title}&url=${url}`, '_blank');
    }
    
    /**
     * Share via email
     * @private
     */
    _shareEmail() {
        const subject = encodeURIComponent('Check out this fractal');
        const body = encodeURIComponent(`I found this interesting fractal location:\n\n${this._getShareUrl()}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
    
    /**
     * Get share URL
     * @private
     */
    _getShareUrl() {
        const params = new URLSearchParams({
            x: this.context.centerX,
            y: this.context.centerY,
            z: this.context.zoom,
            f: this.context.fractal
        });
        return `${window.location.origin}${window.location.pathname}?${params}`;
    }
    
    /**
     * Fallback copy method
     * @private
     */
    _copyFallback(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        this.manager?.emit('notification', {
            message: 'Copied to clipboard',
            type: 'success'
        });
    }
    
    // ========================================================================
    // EVENT HANDLING
    // ========================================================================
    
    /**
     * Attach to target element
     * @private
     */
    _attachToTarget() {
        this.target.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.open(e.clientX, e.clientY, e);
        });
    }
    
    /**
     * Setup manager events
     * @private
     */
    _setupEvents() {
        if (!this.manager) return;
        
        // Listen for context updates
        this.manager.on(UI_EVENTS.CAMERA_MOVE, (state) => {
            this.context = { ...this.context, ...state };
        });
        
        this.manager.on(UI_EVENTS.FRACTAL_CHANGE, (fractal) => {
            this.context.fractal = fractal;
        });
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Open context menu at position
     * @param {number} x - Screen X
     * @param {number} y - Screen Y
     * @param {MouseEvent} event - Original event
     */
    open(x, y, event = null) {
        this.clickPosition = { x, y };
        
        // Calculate complex position from screen position
        if (this.manager?.camera2d) {
            const camera = this.manager.camera2d;
            const canvas = this.target;
            if (canvas) {
                const rect = canvas.getBoundingClientRect();
                const canvasX = x - rect.left;
                const canvasY = y - rect.top;
                
                // Convert to complex coordinates
                const complex = camera.screenToComplex?.(canvasX, canvasY);
                if (complex) {
                    this.complexPosition = { r: complex.x, i: complex.y };
                }
            }
        }
        
        // Render items
        this._render();
        
        // Position menu
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        
        // Show
        this.isOpen = true;
        this.element.classList.add('open');
        
        // Adjust position if off-screen
        requestAnimationFrame(() => {
            const rect = this.element.getBoundingClientRect();
            
            if (rect.right > window.innerWidth) {
                this.element.style.left = `${x - rect.width}px`;
            }
            if (rect.bottom > window.innerHeight) {
                this.element.style.top = `${y - rect.height}px`;
            }
        });
        
        // Focus first item
        this.element.querySelector('.context-menu-item')?.focus();
    }
    
    /**
     * Close context menu
     */
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.element.classList.remove('open');
        this._hideSubmenu();
    }
    
    /**
     * Update context data
     * @param {Object} data
     */
    updateContext(data) {
        this.context = { ...this.context, ...data };
    }
    
    /**
     * Add menu item
     * @param {Object} item
     * @param {number} index - Insert position
     */
    addItem(item, index = -1) {
        if (index < 0) {
            this.items.push(item);
        } else {
            this.items.splice(index, 0, item);
        }
    }
    
    /**
     * Remove menu item
     * @param {string} id
     */
    removeItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index >= 0) {
            this.items.splice(index, 1);
        }
    }
    
    /**
     * Set target element
     * @param {HTMLElement} target
     */
    setTarget(target) {
        this.target = target;
        this._attachToTarget();
    }
    
    /**
     * Destroy context menu
     */
    destroy() {
        this.close();
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DEFAULT_MENU_ITEMS };
export default ContextMenu;
