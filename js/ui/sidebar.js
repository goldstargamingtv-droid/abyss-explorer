/**
 * ============================================================================
 * ABYSS EXPLORER - SIDEBAR
 * ============================================================================
 * 
 * Collapsible sidebar with organized tabs for fractal selection, parameters,
 * coloring, palettes, and animation controls. Responsive design with
 * hamburger menu on mobile.
 * 
 * Layout:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  ┌────────┬─────────────────────────────────────────────────────────┐ │
 * │  │SIDEBAR │                    CANVAS                               │ │
 * │  │        │                                                         │ │
 * │  │ [Tabs] │                                                         │ │
 * │  │ ────── │                                                         │ │
 * │  │ Fractal│                                                         │ │
 * │  │ Params │                                                         │ │
 * │  │ Color  │                                                         │ │
 * │  │ Palette│                                                         │ │
 * │  │ Animate│                                                         │ │
 * │  │        │                                                         │ │
 * │  │ [Panel]│                                                         │ │
 * │  │ ────── │                                                         │ │
 * │  │ Current│                                                         │ │
 * │  │ tab    │                                                         │ │
 * │  │ content│                                                         │ │
 * │  │        │                                                         │ │
 * │  └────────┴─────────────────────────────────────────────────────────┘ │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module ui/sidebar
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { UI_EVENTS } from './ui-manager.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Sidebar tabs */
export const TABS = {
    FRACTAL: 'fractal',
    PARAMS: 'params',
    COLORING: 'coloring',
    PALETTE: 'palette',
    ANIMATE: 'animate',
    EXPORT: 'export'
};

/** Tab icons (using emoji for simplicity, replace with SVG in production) */
const TAB_ICONS = {
    [TABS.FRACTAL]: '🌀',
    [TABS.PARAMS]: '⚙️',
    [TABS.COLORING]: '🎨',
    [TABS.PALETTE]: '🌈',
    [TABS.ANIMATE]: '🎬',
    [TABS.EXPORT]: '💾'
};

const TAB_LABELS = {
    [TABS.FRACTAL]: 'Fractal',
    [TABS.PARAMS]: 'Parameters',
    [TABS.COLORING]: 'Coloring',
    [TABS.PALETTE]: 'Palette',
    [TABS.ANIMATE]: 'Animation',
    [TABS.EXPORT]: 'Export'
};

// ============================================================================
// SIDEBAR CLASS
// ============================================================================

export class Sidebar {
    /**
     * Create sidebar
     * @param {Object} options - Sidebar options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.container = options.container || null;
        
        // State
        this.isOpen = options.isOpen ?? true;
        this.currentTab = options.currentTab || TABS.FRACTAL;
        this.width = options.width || 280;
        
        // Elements
        this.element = null;
        this.tabsElement = null;
        this.contentElement = null;
        this.toggleButton = null;
        
        // Data
        this.fractalTypes = options.fractalTypes || [];
        this.coloringAlgorithms = options.coloringAlgorithms || [];
        this.palettes = options.palettes || [];
        
        // Current values
        this.currentFractal = options.currentFractal || 'mandelbrot';
        this.parameters = options.parameters || {};
        
        // Build DOM
        if (this.container) {
            this._build();
        }
    }
    
    /**
     * Set UI manager reference
     * @param {UIManager} manager
     */
    setManager(manager) {
        this.manager = manager;
        this._setupEvents();
    }
    
    // ========================================================================
    // BUILD DOM
    // ========================================================================
    
    /**
     * Build sidebar DOM structure
     * @private
     */
    _build() {
        // Main container
        this.element = document.createElement('aside');
        this.element.className = 'sidebar';
        this.element.setAttribute('role', 'complementary');
        this.element.setAttribute('aria-label', 'Control Panel');
        
        // Toggle button (hamburger)
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'sidebar-toggle';
        this.toggleButton.setAttribute('aria-label', 'Toggle sidebar');
        this.toggleButton.setAttribute('aria-expanded', this.isOpen);
        this.toggleButton.innerHTML = `
            <span class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </span>
        `;
        this.toggleButton.addEventListener('click', () => this.toggle());
        
        // Sidebar content wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'sidebar-wrapper';
        
        // Header
        const header = document.createElement('header');
        header.className = 'sidebar-header';
        header.innerHTML = `
            <h2 class="sidebar-title">Abyss Explorer</h2>
            <button class="sidebar-close" aria-label="Close sidebar">×</button>
        `;
        header.querySelector('.sidebar-close').addEventListener('click', () => this.close());
        
        // Tabs
        this.tabsElement = this._buildTabs();
        
        // Content panels
        this.contentElement = document.createElement('div');
        this.contentElement.className = 'sidebar-content';
        this.contentElement.setAttribute('role', 'tabpanel');
        
        // Assemble
        wrapper.appendChild(header);
        wrapper.appendChild(this.tabsElement);
        wrapper.appendChild(this.contentElement);
        
        this.element.appendChild(wrapper);
        
        // Add to container
        this.container.appendChild(this.toggleButton);
        this.container.appendChild(this.element);
        
        // Initial state
        this._updateOpenState();
        this._renderCurrentPanel();
    }
    
    /**
     * Build tab navigation
     * @private
     */
    _buildTabs() {
        const nav = document.createElement('nav');
        nav.className = 'sidebar-tabs';
        nav.setAttribute('role', 'tablist');
        nav.setAttribute('aria-label', 'Control panels');
        
        Object.values(TABS).forEach(tab => {
            const button = document.createElement('button');
            button.className = `sidebar-tab ${tab === this.currentTab ? 'active' : ''}`;
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', tab === this.currentTab);
            button.setAttribute('data-tab', tab);
            button.setAttribute('title', TAB_LABELS[tab]);
            button.innerHTML = `
                <span class="tab-icon">${TAB_ICONS[tab]}</span>
                <span class="tab-label">${TAB_LABELS[tab]}</span>
            `;
            button.addEventListener('click', () => this.selectTab(tab));
            nav.appendChild(button);
        });
        
        return nav;
    }
    
    // ========================================================================
    // PANEL RENDERING
    // ========================================================================
    
    /**
     * Render current panel content
     * @private
     */
    _renderCurrentPanel() {
        this.contentElement.innerHTML = '';
        
        switch (this.currentTab) {
            case TABS.FRACTAL:
                this._renderFractalPanel();
                break;
            case TABS.PARAMS:
                this._renderParamsPanel();
                break;
            case TABS.COLORING:
                this._renderColoringPanel();
                break;
            case TABS.PALETTE:
                this._renderPalettePanel();
                break;
            case TABS.ANIMATE:
                this._renderAnimatePanel();
                break;
            case TABS.EXPORT:
                this._renderExportPanel();
                break;
        }
    }
    
    /**
     * Render fractal selection panel
     * @private
     */
    _renderFractalPanel() {
        const panel = this._createPanel('Select Fractal');
        
        // 2D Fractals
        panel.appendChild(this._createSection('2D Fractals', [
            this._createFractalButton('mandelbrot', 'Mandelbrot Set', 'The classic'),
            this._createFractalButton('julia', 'Julia Set', 'c = -0.7 + 0.27i'),
            this._createFractalButton('burning-ship', 'Burning Ship', 'Absolute value variant'),
            this._createFractalButton('tricorn', 'Tricorn', 'Conjugate Mandelbrot'),
            this._createFractalButton('phoenix', 'Phoenix', 'With memory term'),
            this._createFractalButton('newton', 'Newton Fractal', 'Root finding')
        ]));
        
        // 3D Fractals
        panel.appendChild(this._createSection('3D Fractals', [
            this._createFractalButton('mandelbulb', 'Mandelbulb', '3D power fractal'),
            this._createFractalButton('mandelbox', 'Mandelbox', 'Box-fold fractal'),
            this._createFractalButton('menger', 'Menger Sponge', 'IFS classic'),
            this._createFractalButton('sierpinski', 'Sierpinski', 'Tetrahedron'),
            this._createFractalButton('julia-quat', 'Julia 4D', 'Quaternion Julia')
        ]));
        
        // Custom formula button
        const customBtn = document.createElement('button');
        customBtn.className = 'btn btn-secondary btn-block';
        customBtn.innerHTML = '✏️ Custom Formula...';
        customBtn.addEventListener('click', () => {
            this.manager?.openModal('formula-editor');
        });
        panel.appendChild(customBtn);
        
        this.contentElement.appendChild(panel);
    }
    
    /**
     * Render parameters panel
     * @private
     */
    _renderParamsPanel() {
        const panel = this._createPanel('Parameters');
        
        // General parameters
        panel.appendChild(this._createSection('Iteration', [
            this._createSlider('maxIterations', 'Max Iterations', 100, 10000, 1000, 100),
            this._createSlider('bailout', 'Bailout Radius', 2, 1000, 4, 1)
        ]));
        
        // Fractal-specific parameters
        panel.appendChild(this._createSection('Fractal Options', [
            this._createSlider('power', 'Power', 2, 8, 2, 0.1),
            this._createCheckbox('smooth', 'Smooth Coloring', true)
        ]));
        
        // Julia parameters (shown only for Julia set)
        const juliaSection = this._createSection('Julia Seed', [
            this._createSlider('juliaReal', 'Real (c_r)', -2, 2, -0.7, 0.001),
            this._createSlider('juliaImag', 'Imag (c_i)', -2, 2, 0.27015, 0.001),
            this._createButton('Pick from Mandelbrot', () => {
                this.manager?.emit('julia:pick-mode');
            })
        ]);
        juliaSection.id = 'julia-params';
        panel.appendChild(juliaSection);
        
        this.contentElement.appendChild(panel);
    }
    
    /**
     * Render coloring panel
     * @private
     */
    _renderColoringPanel() {
        const panel = this._createPanel('Coloring Algorithm');
        
        // Algorithm selection
        const algorithms = [
            { id: 'smooth-iteration', name: 'Smooth Iteration', desc: 'Continuous color bands' },
            { id: 'orbit-trap', name: 'Orbit Trap', desc: 'Distance to shapes' },
            { id: 'distance-estimation', name: 'Distance Estimation', desc: 'Boundary glow' },
            { id: 'triangle-inequality', name: 'Triangle Inequality', desc: 'TIA coloring' },
            { id: 'stripe-average', name: 'Stripe Average', desc: 'Striped patterns' },
            { id: 'curvature', name: 'Curvature', desc: 'Orbit curvature' },
            { id: 'angle-decomposition', name: 'Angle Decomposition', desc: 'Binary decomposition' }
        ];
        
        const list = document.createElement('div');
        list.className = 'algorithm-list';
        
        algorithms.forEach(algo => {
            const item = document.createElement('button');
            item.className = 'algorithm-item';
            item.innerHTML = `
                <span class="algo-name">${algo.name}</span>
                <span class="algo-desc">${algo.desc}</span>
            `;
            item.addEventListener('click', () => {
                this.manager?.emit(UI_EVENTS.COLORING_CHANGE, algo.id);
                list.querySelectorAll('.algorithm-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            });
            list.appendChild(item);
        });
        
        panel.appendChild(list);
        
        // Algorithm-specific options
        panel.appendChild(this._createSection('Options', [
            this._createSlider('colorDensity', 'Color Density', 0.1, 10, 1, 0.1),
            this._createSlider('colorOffset', 'Color Offset', 0, 1, 0, 0.01),
            this._createCheckbox('interior', 'Color Interior', false)
        ]));
        
        this.contentElement.appendChild(panel);
    }
    
    /**
     * Render palette panel
     * @private
     */
    _renderPalettePanel() {
        const panel = this._createPanel('Color Palette');
        
        // Quick palette selector (grid of swatches)
        const grid = document.createElement('div');
        grid.className = 'palette-grid';
        
        const categories = ['rainbow', 'fire', 'ocean', 'nature', 'cosmic', 'classic'];
        
        categories.forEach(cat => {
            const swatch = document.createElement('button');
            swatch.className = 'palette-swatch';
            swatch.setAttribute('data-category', cat);
            swatch.style.background = this._getPaletteGradient(cat);
            swatch.title = cat.charAt(0).toUpperCase() + cat.slice(1);
            swatch.addEventListener('click', () => {
                this.manager?.emit(UI_EVENTS.PALETTE_CHANGE, { category: cat });
            });
            grid.appendChild(swatch);
        });
        
        panel.appendChild(grid);
        
        // Open full editor button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary btn-block';
        editBtn.innerHTML = '🎨 Open Palette Editor';
        editBtn.addEventListener('click', () => {
            this.manager?.openModal('palette-editor');
        });
        panel.appendChild(editBtn);
        
        // Quick adjustments
        panel.appendChild(this._createSection('Adjustments', [
            this._createSlider('paletteOffset', 'Offset', 0, 1, 0, 0.01),
            this._createSlider('paletteScale', 'Scale', 0.1, 10, 1, 0.1),
            this._createCheckbox('paletteReverse', 'Reverse', false),
            this._createCheckbox('paletteCycle', 'Auto-Cycle', false)
        ]));
        
        this.contentElement.appendChild(panel);
    }
    
    /**
     * Render animation panel
     * @private
     */
    _renderAnimatePanel() {
        const panel = this._createPanel('Animation');
        
        // Playback controls
        const controls = document.createElement('div');
        controls.className = 'animation-controls';
        controls.innerHTML = `
            <button class="anim-btn" data-action="play" title="Play">▶</button>
            <button class="anim-btn" data-action="pause" title="Pause">⏸</button>
            <button class="anim-btn" data-action="stop" title="Stop">⏹</button>
            <button class="anim-btn" data-action="record" title="Record">⏺</button>
        `;
        controls.querySelectorAll('.anim-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.manager?.emit(`animation:${action}`);
            });
        });
        panel.appendChild(controls);
        
        // Timeline
        const timeline = document.createElement('div');
        timeline.className = 'animation-timeline';
        timeline.innerHTML = `
            <input type="range" min="0" max="100" value="0" class="timeline-slider">
            <span class="timeline-time">0:00 / 0:00</span>
        `;
        panel.appendChild(timeline);
        
        // Speed control
        panel.appendChild(this._createSection('Speed', [
            this._createSlider('animSpeed', 'Playback Speed', 0.25, 4, 1, 0.25)
        ]));
        
        // Preset animations
        panel.appendChild(this._createSection('Presets', [
            this._createButton('Seahorse Valley Dive', () => this._playPreset('seahorse-valley')),
            this._createButton('Spiral Deep Dive', () => this._playPreset('spiral-deep-dive')),
            this._createButton('Mini-Mandelbrot Hunt', () => this._playPreset('mini-mandelbrot-hunt'))
        ]));
        
        // Load/Save
        panel.appendChild(this._createSection('Paths', [
            this._createButton('Load Path...', () => this.manager?.openModal('load-animation')),
            this._createButton('Save Current Path', () => this.manager?.emit('animation:save'))
        ]));
        
        this.contentElement.appendChild(panel);
    }
    
    /**
     * Render export panel
     * @private
     */
    _renderExportPanel() {
        const panel = this._createPanel('Export');
        
        // Image export
        panel.appendChild(this._createSection('Image', [
            this._createSelect('exportFormat', 'Format', [
                { value: 'png', label: 'PNG' },
                { value: 'jpg', label: 'JPEG' },
                { value: 'webp', label: 'WebP' }
            ]),
            this._createSelect('exportSize', 'Size', [
                { value: '1x', label: 'Current (1x)' },
                { value: '2x', label: 'Double (2x)' },
                { value: '4x', label: 'Quad (4x)' },
                { value: '4k', label: '4K (3840×2160)' },
                { value: '8k', label: '8K (7680×4320)' }
            ]),
            this._createButton('Export Image', () => this.manager?.emit(UI_EVENTS.EXPORT_IMAGE))
        ]));
        
        // Video export
        panel.appendChild(this._createSection('Video', [
            this._createSelect('videoFormat', 'Format', [
                { value: 'webm', label: 'WebM' },
                { value: 'mp4', label: 'MP4 (H.264)' }
            ]),
            this._createSlider('videoFps', 'FPS', 15, 60, 30, 1),
            this._createButton('Export Animation', () => this.manager?.emit('export:video'))
        ]));
        
        // Share
        panel.appendChild(this._createSection('Share', [
            this._createButton('Copy Link', () => this.manager?.emit(UI_EVENTS.SHARE)),
            this._createButton('Share on Twitter', () => this._shareTwitter())
        ]));
        
        this.contentElement.appendChild(panel);
    }
    
    // ========================================================================
    // UI HELPERS
    // ========================================================================
    
    /**
     * Create a panel container
     * @private
     */
    _createPanel(title) {
        const panel = document.createElement('div');
        panel.className = 'panel';
        
        if (title) {
            const header = document.createElement('h3');
            header.className = 'panel-title';
            header.textContent = title;
            panel.appendChild(header);
        }
        
        return panel;
    }
    
    /**
     * Create a collapsible section
     * @private
     */
    _createSection(title, children = []) {
        const section = document.createElement('div');
        section.className = 'panel-section';
        
        const header = document.createElement('button');
        header.className = 'section-header';
        header.innerHTML = `<span>${title}</span><span class="section-toggle">▼</span>`;
        header.addEventListener('click', () => {
            section.classList.toggle('collapsed');
        });
        
        const content = document.createElement('div');
        content.className = 'section-content';
        children.forEach(child => {
            if (child) content.appendChild(child);
        });
        
        section.appendChild(header);
        section.appendChild(content);
        
        return section;
    }
    
    /**
     * Create fractal selection button
     * @private
     */
    _createFractalButton(id, name, description) {
        const button = document.createElement('button');
        button.className = `fractal-btn ${id === this.currentFractal ? 'active' : ''}`;
        button.setAttribute('data-fractal', id);
        button.innerHTML = `
            <span class="fractal-name">${name}</span>
            <span class="fractal-desc">${description}</span>
        `;
        button.addEventListener('click', () => {
            this.selectFractal(id);
        });
        return button;
    }
    
    /**
     * Create slider control
     * @private
     */
    _createSlider(id, label, min, max, value, step) {
        const container = document.createElement('div');
        container.className = 'control-group slider-group';
        
        container.innerHTML = `
            <label for="${id}">${label}</label>
            <div class="slider-wrapper">
                <input type="range" id="${id}" 
                       min="${min}" max="${max}" value="${value}" step="${step}"
                       class="slider" aria-label="${label}">
                <span class="slider-value">${value}</span>
            </div>
        `;
        
        const slider = container.querySelector('input');
        const valueDisplay = container.querySelector('.slider-value');
        
        slider.addEventListener('input', (e) => {
            valueDisplay.textContent = e.target.value;
            this.manager?.setParameter(id, parseFloat(e.target.value));
        });
        
        return container;
    }
    
    /**
     * Create checkbox control
     * @private
     */
    _createCheckbox(id, label, checked) {
        const container = document.createElement('div');
        container.className = 'control-group checkbox-group';
        
        container.innerHTML = `
            <label class="checkbox-label">
                <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">${label}</span>
            </label>
        `;
        
        container.querySelector('input').addEventListener('change', (e) => {
            this.manager?.setParameter(id, e.target.checked);
        });
        
        return container;
    }
    
    /**
     * Create select dropdown
     * @private
     */
    _createSelect(id, label, options) {
        const container = document.createElement('div');
        container.className = 'control-group select-group';
        
        container.innerHTML = `
            <label for="${id}">${label}</label>
            <select id="${id}" class="select">
                ${options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
            </select>
        `;
        
        container.querySelector('select').addEventListener('change', (e) => {
            this.manager?.setParameter(id, e.target.value);
        });
        
        return container;
    }
    
    /**
     * Create button
     * @private
     */
    _createButton(label, onClick) {
        const button = document.createElement('button');
        button.className = 'btn btn-secondary';
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }
    
    /**
     * Get palette gradient CSS
     * @private
     */
    _getPaletteGradient(category) {
        const gradients = {
            rainbow: 'linear-gradient(90deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff)',
            fire: 'linear-gradient(90deg, #000, #330000, #660000, #ff3300, #ff9900, #ffff00)',
            ocean: 'linear-gradient(90deg, #000510, #001020, #003060, #0080d0, #00ffff)',
            nature: 'linear-gradient(90deg, #1a0d00, #336633, #66cc66, #99ff99)',
            cosmic: 'linear-gradient(90deg, #000000, #1a0030, #6000a0, #ff60ff)',
            classic: 'linear-gradient(90deg, #000764, #206bcb, #edffff, #ffaa00, #000764)'
        };
        return gradients[category] || gradients.rainbow;
    }
    
    /**
     * Play preset animation
     * @private
     */
    _playPreset(name) {
        this.manager?.emit('animation:load-preset', name);
    }
    
    /**
     * Share on Twitter
     * @private
     */
    _shareTwitter() {
        const text = encodeURIComponent('Check out this fractal I found with Abyss Explorer! 🌀');
        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Select a tab
     * @param {string} tab - Tab name
     */
    selectTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        this.tabsElement.querySelectorAll('.sidebar-tab').forEach(btn => {
            const isActive = btn.dataset.tab === tab;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });
        
        // Render new content
        this._renderCurrentPanel();
        
        this.manager?.setSidebarTab(tab);
    }
    
    /**
     * Select a fractal
     * @param {string} id - Fractal ID
     */
    selectFractal(id) {
        this.currentFractal = id;
        
        // Update buttons
        this.contentElement.querySelectorAll('.fractal-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.fractal === id);
        });
        
        this.manager?.setFractal(id);
    }
    
    /**
     * Open sidebar
     */
    open() {
        this.isOpen = true;
        this._updateOpenState();
        this.manager?.toggleSidebar(true);
    }
    
    /**
     * Close sidebar
     */
    close() {
        this.isOpen = false;
        this._updateOpenState();
        this.manager?.toggleSidebar(false);
    }
    
    /**
     * Toggle sidebar
     */
    toggle() {
        this.isOpen = !this.isOpen;
        this._updateOpenState();
        this.manager?.toggleSidebar(this.isOpen);
    }
    
    /**
     * Update DOM open state
     * @private
     */
    _updateOpenState() {
        this.element?.classList.toggle('open', this.isOpen);
        this.toggleButton?.setAttribute('aria-expanded', this.isOpen);
        document.body.classList.toggle('sidebar-open', this.isOpen);
    }
    
    /**
     * Setup event listeners
     * @private
     */
    _setupEvents() {
        if (!this.manager) return;
        
        this.manager.on(UI_EVENTS.SIDEBAR_TOGGLE, (isOpen) => {
            this.isOpen = isOpen;
            this._updateOpenState();
        });
        
        this.manager.on(UI_EVENTS.FRACTAL_CHANGE, (type) => {
            this.currentFractal = type;
            if (this.currentTab === TABS.FRACTAL) {
                this._renderCurrentPanel();
            }
        });
    }
    
    /**
     * Update parameters display
     * @param {Object} params - New parameters
     */
    updateParameters(params) {
        this.parameters = { ...this.parameters, ...params };
        
        // Update sliders if panel is visible
        Object.entries(params).forEach(([key, value]) => {
            const slider = this.contentElement?.querySelector(`#${key}`);
            if (slider) {
                slider.value = value;
                const valueDisplay = slider.parentElement?.querySelector('.slider-value');
                if (valueDisplay) valueDisplay.textContent = value;
            }
        });
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { TABS };
export default Sidebar;
