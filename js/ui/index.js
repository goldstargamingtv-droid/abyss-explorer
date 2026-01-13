/**
 * ============================================================================
 * ABYSS EXPLORER - UI MODULE
 * ============================================================================
 * 
 * Complete user interface system for the fractal explorer.
 * Provides a polished, professional UI with responsive design,
 * accessibility features, and smooth interactions.
 * 
 * Architecture:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │                            UI MANAGER                                  │
 * │                         (Central Hub)                                  │
 * │                                                                        │
 * │    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
 * │    │ Toolbar  │  │ Sidebar  │  │  Modals  │  │  Notify  │            │
 * │    └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
 * │                                                                        │
 * │    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
 * │    │ Gallery  │  │ Presets  │  │ Formula  │  │ Context  │            │
 * │    └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
 * │                                                                        │
 * │    ┌──────────┐  ┌──────────┐                                        │
 * │    │  Info    │  │  Touch   │                                        │
 * │    │ Overlay  │  │ Handler  │                                        │
 * │    └──────────┘  └──────────┘                                        │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * Quick Start:
 * ```javascript
 * import { createUI } from './ui/index.js';
 * 
 * const ui = createUI({
 *     container: document.getElementById('app'),
 *     canvas: document.getElementById('canvas'),
 *     state: appState,
 *     camera2d: camera
 * });
 * 
 * // UI is ready to use!
 * ```
 * 
 * @module ui
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// CORE COMPONENTS
// ============================================================================

export { 
    UIManager, 
    EventEmitter, 
    UI_EVENTS, 
    THEME 
} from './ui-manager.js';

export { 
    Sidebar, 
    TABS 
} from './sidebar.js';

export { 
    Toolbar 
} from './toolbar.js';

// ============================================================================
// PANELS & BROWSERS
// ============================================================================

export { 
    Gallery, 
    GALLERY_LOCATIONS 
} from './gallery.js';

export { 
    PresetBrowser, 
    PRESET_TYPES 
} from './preset-browser.js';

export { 
    FormulaEditor, 
    PRESET_FORMULAS 
} from './formula-editor.js';

// ============================================================================
// OVERLAYS & MENUS
// ============================================================================

export { 
    InfoOverlay, 
    FRACTAL_INFO 
} from './info-overlay.js';

export { 
    ContextMenu, 
    DEFAULT_MENU_ITEMS 
} from './context-menu.js';

// ============================================================================
// MODALS & NOTIFICATIONS
// ============================================================================

export { 
    Modal, 
    ModalManager, 
    MODAL_TEMPLATES 
} from './modal.js';

export { 
    NotificationManager, 
    Notification, 
    NOTIFICATION_TYPE 
} from './notifications.js';

// ============================================================================
// INPUT HANDLING
// ============================================================================

export { 
    TouchHandler, 
    TouchPoint 
} from './touch-handler.js';

// ============================================================================
// MODULE INFO
// ============================================================================

export const MODULE_INFO = {
    name: 'Abyss Explorer UI System',
    version: '1.0.0',
    components: [
        'UIManager - Central coordinator and event hub',
        'Sidebar - Collapsible control panel with tabs',
        'Toolbar - Top navigation bar with mode switch',
        'Gallery - Location browser with thumbnails',
        'PresetBrowser - Searchable preset manager',
        'FormulaEditor - Custom formula input with preview',
        'InfoOverlay - On-canvas coordinate display',
        'ContextMenu - Right-click action menu',
        'Modal - Reusable dialog system',
        'NotificationManager - Toast notifications',
        'TouchHandler - Mobile gesture support'
    ],
    features: [
        // Accessibility
        'ARIA labels and roles throughout',
        'Keyboard navigation support',
        'Focus management in modals',
        'Screen reader friendly',
        
        // Responsiveness
        'Mobile-first design',
        'Responsive breakpoints',
        'Touch gesture support',
        'Virtual keyboard awareness',
        
        // UX
        'Dark/light/auto theming',
        'Smooth CSS animations',
        'Hover states and feedback',
        'Toast notifications',
        'Modal stacking',
        
        // Functionality
        'Keyboard shortcuts',
        'Search functionality',
        'Favorites system',
        'Preset management',
        'Share capabilities'
    ]
};

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create complete UI system
 * @param {Object} options - Configuration
 * @returns {Object} UI components
 */
export function createUI(options = {}) {
    const {
        container,
        canvas,
        state,
        camera2d,
        camera3d,
        renderer,
        paletteEngine
    } = options;
    
    // Create UI Manager (central hub)
    const manager = new UIManager({
        state,
        camera2d,
        camera3d,
        renderer,
        paletteEngine,
        theme: options.theme || THEME.DARK
    });
    
    // Create components
    const components = {};
    
    // Toolbar
    if (container) {
        components.toolbar = new Toolbar({
            container,
            manager
        });
        manager.register('toolbar', components.toolbar);
    }
    
    // Sidebar
    if (container) {
        components.sidebar = new Sidebar({
            container,
            manager,
            isOpen: !isMobile()
        });
        manager.register('sidebar', components.sidebar);
    }
    
    // Info Overlay
    if (container) {
        components.infoOverlay = new InfoOverlay({
            container,
            manager,
            position: 'bottom-left'
        });
        manager.register('infoOverlay', components.infoOverlay);
    }
    
    // Context Menu
    if (canvas) {
        components.contextMenu = new ContextMenu({
            target: canvas,
            manager
        });
        manager.register('contextMenu', components.contextMenu);
    }
    
    // Touch Handler
    if (canvas) {
        components.touchHandler = new TouchHandler({
            target: canvas,
            manager,
            onPan: (dx, dy) => {
                if (camera2d) {
                    camera2d.panByScreen(-dx, -dy);
                }
            },
            onZoom: (scale, x, y) => {
                if (camera2d) {
                    camera2d.zoomToward(scale, x, y);
                }
            }
        });
        manager.register('touchHandler', components.touchHandler);
    }
    
    // Modal Manager
    components.modalManager = new ModalManager({
        manager
    });
    manager.register('modalManager', components.modalManager);
    
    // Create panel components (for modals)
    components.gallery = new Gallery({
        manager,
        container: document.createElement('div')
    });
    components.modalManager.registerComponent('gallery', components.gallery);
    
    components.presetBrowser = new PresetBrowser({
        manager,
        container: document.createElement('div')
    });
    components.modalManager.registerComponent('preset-browser', components.presetBrowser);
    
    components.formulaEditor = new FormulaEditor({
        manager,
        container: document.createElement('div')
    });
    components.modalManager.registerComponent('formula-editor', components.formulaEditor);
    
    // Notification Manager
    components.notifications = new NotificationManager({
        manager,
        position: 'bottom-right'
    });
    manager.register('notifications', components.notifications);
    
    // Initialize manager
    manager.init();
    
    return {
        manager,
        ...components,
        
        // Convenience methods
        showNotification: (msg, type) => components.notifications.show({ message: msg, type }),
        openModal: (id, data) => components.modalManager.open(id, data),
        closeModal: () => components.modalManager.close(),
        
        // Cleanup
        destroy: () => {
            Object.values(components).forEach(c => c.destroy?.());
            manager.destroy();
        }
    };
}

/**
 * Check if mobile device
 * @returns {boolean}
 */
function isMobile() {
    return window.innerWidth <= 768 || 
           ('ontouchstart' in window && navigator.maxTouchPoints > 0);
}

/**
 * Create minimal UI (for embedding)
 * @param {Object} options
 * @returns {Object}
 */
export function createMinimalUI(options = {}) {
    const manager = new UIManager(options);
    
    const notifications = new NotificationManager({
        manager,
        position: 'bottom-right'
    });
    
    const touchHandler = options.canvas ? new TouchHandler({
        target: options.canvas,
        manager
    }) : null;
    
    manager.init();
    
    return {
        manager,
        notifications,
        touchHandler,
        showNotification: (msg, type) => notifications.show({ message: msg, type }),
        destroy: () => {
            notifications.destroy();
            touchHandler?.destroy();
            manager.destroy();
        }
    };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

import UIManagerDefault from './ui-manager.js';

export default {
    UIManager: UIManagerDefault,
    createUI,
    createMinimalUI,
    MODULE_INFO
};
