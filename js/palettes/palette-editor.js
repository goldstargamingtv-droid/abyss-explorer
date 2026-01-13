/**
 * ============================================================================
 * ABYSS EXPLORER - PALETTE EDITOR
 * ============================================================================
 * 
 * Interactive palette editor with full UI integration. Allows users to
 * create, modify, and manage color palettes through intuitive controls.
 * 
 * Features:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │                                                                        │
 * │  • Drag-and-drop color stops on gradient bar                          │
 * │  • HSV/RGB color picker with sliders                                  │
 * │  • Add/remove color stops                                             │
 * │  • Real-time preview on fractal                                       │
 * │  • Undo/redo support (50 levels)                                      │
 * │  • Random palette generation                                          │
 * │  • Import/export JSON                                                 │
 * │  • Interpolation method selection                                     │
 * │  • Post-processing controls                                           │
 * │                                                                        │
 * └────────────────────────────────────────────────────────────────────────┘
 * 
 * @module palettes/palette-editor
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

import { 
    Palette, 
    ColorStop,
    INTERPOLATION, 
    COLOR_SPACE, 
    REPEAT_MODE,
    rgbToHsv,
    hsvToRgb,
    parseHex,
    toHex
} from './palette-engine.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum undo history length */
const MAX_UNDO_HISTORY = 50;

/** Editor modes */
export const EDITOR_MODE = {
    SELECT: 'select',
    ADD: 'add',
    DELETE: 'delete'
};

// ============================================================================
// PALETTE EDITOR CLASS
// ============================================================================

export class PaletteEditor {
    /**
     * Create a palette editor
     * @param {Object} options - Editor options
     */
    constructor(options = {}) {
        // Current palette being edited
        this.palette = options.palette || this._createDefaultPalette();
        
        // Selection state
        this.selectedStopIndex = -1;
        this.mode = EDITOR_MODE.SELECT;
        
        // Drag state
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartPosition = 0;
        
        // Undo/redo history
        this.undoStack = [];
        this.redoStack = [];
        
        // UI elements (set by attachToDOM)
        this.elements = {
            container: null,
            gradientBar: null,
            stopsContainer: null,
            colorPicker: null,
            hueSlider: null,
            satSlider: null,
            valSlider: null,
            redSlider: null,
            greenSlider: null,
            blueSlider: null,
            hexInput: null,
            positionInput: null,
            interpolationSelect: null,
            colorSpaceSelect: null,
            repeatModeSelect: null,
            gammaSlider: null,
            contrastSlider: null,
            saturationSlider: null,
            preview: null
        };
        
        // Callbacks
        this.onPaletteChange = options.onPaletteChange || null;
        this.onSelectionChange = options.onSelectionChange || null;
        
        // Preview settings
        this.previewSize = options.previewSize || { width: 256, height: 32 };
        
        // Bind methods
        this._handleStopMouseDown = this._handleStopMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleGradientClick = this._handleGradientClick.bind(this);
    }
    
    /**
     * Create default palette
     * @private
     */
    _createDefaultPalette() {
        return new Palette({
            name: 'New Palette',
            colors: [
                '#000000',
                '#0000ff',
                '#00ffff',
                '#ffff00',
                '#ffffff'
            ]
        });
    }
    
    /**
     * Set the palette to edit
     * @param {Palette} palette - Palette to edit
     */
    setPalette(palette) {
        this._saveUndoState();
        this.palette = palette;
        this.selectedStopIndex = -1;
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Get the current palette
     * @returns {Palette}
     */
    getPalette() {
        return this.palette;
    }
    
    /**
     * Attach editor to DOM elements
     * @param {Object} elements - Map of element IDs or elements
     */
    attachToDOM(elements) {
        this.elements = { ...this.elements, ...elements };
        
        // Set up event listeners
        this._setupEventListeners();
        
        // Initial UI update
        this._updateUI();
    }
    
    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Gradient bar click (add stop)
        if (this.elements.gradientBar) {
            this.elements.gradientBar.addEventListener('click', this._handleGradientClick);
        }
        
        // Global mouse move/up for dragging
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
        
        // Color sliders
        if (this.elements.hueSlider) {
            this.elements.hueSlider.addEventListener('input', (e) => {
                this._updateSelectedColorFromHSV();
            });
        }
        if (this.elements.satSlider) {
            this.elements.satSlider.addEventListener('input', (e) => {
                this._updateSelectedColorFromHSV();
            });
        }
        if (this.elements.valSlider) {
            this.elements.valSlider.addEventListener('input', (e) => {
                this._updateSelectedColorFromHSV();
            });
        }
        
        // RGB sliders
        if (this.elements.redSlider) {
            this.elements.redSlider.addEventListener('input', () => this._updateSelectedColorFromRGB());
        }
        if (this.elements.greenSlider) {
            this.elements.greenSlider.addEventListener('input', () => this._updateSelectedColorFromRGB());
        }
        if (this.elements.blueSlider) {
            this.elements.blueSlider.addEventListener('input', () => this._updateSelectedColorFromRGB());
        }
        
        // Hex input
        if (this.elements.hexInput) {
            this.elements.hexInput.addEventListener('change', (e) => {
                if (this.selectedStopIndex >= 0) {
                    this._saveUndoState();
                    const color = parseHex(e.target.value);
                    this.palette.updateStop(this.selectedStopIndex, { color });
                    this._updateUI();
                    this._notifyChange();
                }
            });
        }
        
        // Position input
        if (this.elements.positionInput) {
            this.elements.positionInput.addEventListener('change', (e) => {
                if (this.selectedStopIndex >= 0) {
                    this._saveUndoState();
                    const position = parseFloat(e.target.value);
                    if (!isNaN(position)) {
                        this.palette.updateStop(this.selectedStopIndex, { 
                            position: Math.max(0, Math.min(1, position)) 
                        });
                        this._updateUI();
                        this._notifyChange();
                    }
                }
            });
        }
        
        // Interpolation select
        if (this.elements.interpolationSelect) {
            this.elements.interpolationSelect.addEventListener('change', (e) => {
                this._saveUndoState();
                this.palette.interpolation = e.target.value;
                this.palette._invalidateLUT();
                this._updatePreview();
                this._notifyChange();
            });
        }
        
        // Color space select
        if (this.elements.colorSpaceSelect) {
            this.elements.colorSpaceSelect.addEventListener('change', (e) => {
                this._saveUndoState();
                this.palette.colorSpace = e.target.value;
                this.palette._invalidateLUT();
                this._updatePreview();
                this._notifyChange();
            });
        }
        
        // Post-processing sliders
        if (this.elements.gammaSlider) {
            this.elements.gammaSlider.addEventListener('input', (e) => {
                this.palette.gamma = parseFloat(e.target.value);
                this.palette._invalidateLUT();
                this._updatePreview();
                this._notifyChange();
            });
        }
        if (this.elements.contrastSlider) {
            this.elements.contrastSlider.addEventListener('input', (e) => {
                this.palette.contrast = parseFloat(e.target.value);
                this.palette._invalidateLUT();
                this._updatePreview();
                this._notifyChange();
            });
        }
        if (this.elements.saturationSlider) {
            this.elements.saturationSlider.addEventListener('input', (e) => {
                this.palette.saturation = parseFloat(e.target.value);
                this.palette._invalidateLUT();
                this._updatePreview();
                this._notifyChange();
            });
        }
    }
    
    /**
     * Handle gradient bar click (add new stop)
     * @private
     */
    _handleGradientClick(e) {
        if (this.mode !== EDITOR_MODE.ADD && e.target === this.elements.gradientBar) {
            return;
        }
        
        const rect = this.elements.gradientBar.getBoundingClientRect();
        const position = (e.clientX - rect.left) / rect.width;
        
        // Get color at position
        const color = this.palette.getColor(position);
        
        this._saveUndoState();
        this.palette.addStop(position, color);
        
        // Select the new stop
        this.selectedStopIndex = this.palette.stops.findIndex(s => s.position === position);
        
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Handle stop mouse down (start drag)
     * @private
     */
    _handleStopMouseDown(e, index) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.mode === EDITOR_MODE.DELETE) {
            this._deleteStop(index);
            return;
        }
        
        this.selectedStopIndex = index;
        this.isDragging = true;
        this.dragStartX = e.clientX;
        this.dragStartPosition = this.palette.stops[index].position;
        
        this._updateUI();
        
        if (this.onSelectionChange) {
            this.onSelectionChange(index, this.palette.stops[index]);
        }
    }
    
    /**
     * Handle mouse move (dragging)
     * @private
     */
    _handleMouseMove(e) {
        if (!this.isDragging || this.selectedStopIndex < 0) return;
        
        const rect = this.elements.gradientBar.getBoundingClientRect();
        const deltaX = e.clientX - this.dragStartX;
        const deltaNorm = deltaX / rect.width;
        
        let newPosition = this.dragStartPosition + deltaNorm;
        newPosition = Math.max(0, Math.min(1, newPosition));
        
        this.palette.updateStop(this.selectedStopIndex, { position: newPosition });
        this._updateStopPositions();
        this._updatePreview();
    }
    
    /**
     * Handle mouse up (end drag)
     * @private
     */
    _handleMouseUp(e) {
        if (this.isDragging) {
            this._saveUndoState();
            this.isDragging = false;
            this._notifyChange();
        }
    }
    
    /**
     * Delete a stop
     * @private
     */
    _deleteStop(index) {
        if (this.palette.stops.length <= 2) {
            console.warn('[PaletteEditor] Cannot delete: minimum 2 stops required');
            return;
        }
        
        this._saveUndoState();
        this.palette.removeStop(index);
        
        if (this.selectedStopIndex === index) {
            this.selectedStopIndex = Math.max(0, index - 1);
        } else if (this.selectedStopIndex > index) {
            this.selectedStopIndex--;
        }
        
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Update selected color from HSV sliders
     * @private
     */
    _updateSelectedColorFromHSV() {
        if (this.selectedStopIndex < 0) return;
        
        const h = parseFloat(this.elements.hueSlider?.value || 0);
        const s = parseFloat(this.elements.satSlider?.value || 0);
        const v = parseFloat(this.elements.valSlider?.value || 0);
        
        const rgb = hsvToRgb(h, s, v);
        
        this.palette.updateStop(this.selectedStopIndex, {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b
        });
        
        this._updateColorDisplay();
        this._updatePreview();
        this._updateStopColors();
        this._notifyChange();
    }
    
    /**
     * Update selected color from RGB sliders
     * @private
     */
    _updateSelectedColorFromRGB() {
        if (this.selectedStopIndex < 0) return;
        
        const r = parseFloat(this.elements.redSlider?.value || 0) / 255;
        const g = parseFloat(this.elements.greenSlider?.value || 0) / 255;
        const b = parseFloat(this.elements.blueSlider?.value || 0) / 255;
        
        this.palette.updateStop(this.selectedStopIndex, { r, g, b });
        
        this._updateColorDisplay();
        this._updatePreview();
        this._updateStopColors();
        this._notifyChange();
    }
    
    /**
     * Update entire UI
     * @private
     */
    _updateUI() {
        this._updateGradientBar();
        this._updateStops();
        this._updateColorDisplay();
        this._updateControls();
        this._updatePreview();
    }
    
    /**
     * Update gradient bar background
     * @private
     */
    _updateGradientBar() {
        if (!this.elements.gradientBar) return;
        
        // Create CSS gradient
        const stops = this.palette.stops.map(s => 
            `${toHex(s.r, s.g, s.b)} ${(s.position * 100).toFixed(1)}%`
        ).join(', ');
        
        this.elements.gradientBar.style.background = `linear-gradient(to right, ${stops})`;
    }
    
    /**
     * Update stop markers
     * @private
     */
    _updateStops() {
        if (!this.elements.stopsContainer) return;
        
        // Clear existing stops
        this.elements.stopsContainer.innerHTML = '';
        
        // Create stop markers
        this.palette.stops.forEach((stop, index) => {
            const marker = document.createElement('div');
            marker.className = 'palette-stop' + (index === this.selectedStopIndex ? ' selected' : '');
            marker.style.left = `${stop.position * 100}%`;
            marker.style.backgroundColor = toHex(stop.r, stop.g, stop.b);
            
            marker.addEventListener('mousedown', (e) => this._handleStopMouseDown(e, index));
            marker.addEventListener('dblclick', (e) => {
                e.preventDefault();
                this._deleteStop(index);
            });
            
            this.elements.stopsContainer.appendChild(marker);
        });
    }
    
    /**
     * Update stop positions only (during drag)
     * @private
     */
    _updateStopPositions() {
        if (!this.elements.stopsContainer) return;
        
        const markers = this.elements.stopsContainer.querySelectorAll('.palette-stop');
        this.palette.stops.forEach((stop, index) => {
            if (markers[index]) {
                markers[index].style.left = `${stop.position * 100}%`;
            }
        });
        
        this._updateGradientBar();
    }
    
    /**
     * Update stop colors only
     * @private
     */
    _updateStopColors() {
        if (!this.elements.stopsContainer) return;
        
        const markers = this.elements.stopsContainer.querySelectorAll('.palette-stop');
        this.palette.stops.forEach((stop, index) => {
            if (markers[index]) {
                markers[index].style.backgroundColor = toHex(stop.r, stop.g, stop.b);
            }
        });
        
        this._updateGradientBar();
    }
    
    /**
     * Update color picker display for selected stop
     * @private
     */
    _updateColorDisplay() {
        if (this.selectedStopIndex < 0) return;
        
        const stop = this.palette.stops[this.selectedStopIndex];
        if (!stop) return;
        
        const hsv = rgbToHsv(stop.r, stop.g, stop.b);
        
        // Update HSV sliders
        if (this.elements.hueSlider) this.elements.hueSlider.value = hsv.h;
        if (this.elements.satSlider) this.elements.satSlider.value = hsv.s;
        if (this.elements.valSlider) this.elements.valSlider.value = hsv.v;
        
        // Update RGB sliders
        if (this.elements.redSlider) this.elements.redSlider.value = Math.round(stop.r * 255);
        if (this.elements.greenSlider) this.elements.greenSlider.value = Math.round(stop.g * 255);
        if (this.elements.blueSlider) this.elements.blueSlider.value = Math.round(stop.b * 255);
        
        // Update hex input
        if (this.elements.hexInput) this.elements.hexInput.value = toHex(stop.r, stop.g, stop.b);
        
        // Update position input
        if (this.elements.positionInput) this.elements.positionInput.value = stop.position.toFixed(3);
        
        // Update color preview swatch
        if (this.elements.colorPicker) {
            this.elements.colorPicker.style.backgroundColor = toHex(stop.r, stop.g, stop.b);
        }
    }
    
    /**
     * Update control values
     * @private
     */
    _updateControls() {
        if (this.elements.interpolationSelect) {
            this.elements.interpolationSelect.value = this.palette.interpolation;
        }
        if (this.elements.colorSpaceSelect) {
            this.elements.colorSpaceSelect.value = this.palette.colorSpace;
        }
        if (this.elements.repeatModeSelect) {
            this.elements.repeatModeSelect.value = this.palette.repeatMode;
        }
        if (this.elements.gammaSlider) {
            this.elements.gammaSlider.value = this.palette.gamma;
        }
        if (this.elements.contrastSlider) {
            this.elements.contrastSlider.value = this.palette.contrast;
        }
        if (this.elements.saturationSlider) {
            this.elements.saturationSlider.value = this.palette.saturation;
        }
    }
    
    /**
     * Update preview canvas
     * @private
     */
    _updatePreview() {
        if (!this.elements.preview) return;
        
        const canvas = this.elements.preview;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        for (let x = 0; x < width; x++) {
            const t = x / (width - 1);
            const color = this.palette.getColor(t);
            
            const r = Math.round(color.r * 255);
            const g = Math.round(color.g * 255);
            const b = Math.round(color.b * 255);
            
            for (let y = 0; y < height; y++) {
                const idx = (y * width + x) * 4;
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // ========================================================================
    // UNDO/REDO
    // ========================================================================
    
    /**
     * Save current state for undo
     * @private
     */
    _saveUndoState() {
        this.undoStack.push(this.palette.toJSON());
        
        if (this.undoStack.length > MAX_UNDO_HISTORY) {
            this.undoStack.shift();
        }
        
        // Clear redo stack on new action
        this.redoStack = [];
    }
    
    /**
     * Undo last action
     */
    undo() {
        if (this.undoStack.length === 0) return;
        
        // Save current state to redo stack
        this.redoStack.push(this.palette.toJSON());
        
        // Restore previous state
        const state = this.undoStack.pop();
        this.palette = Palette.fromJSON(state);
        
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Redo last undone action
     */
    redo() {
        if (this.redoStack.length === 0) return;
        
        // Save current state to undo stack
        this.undoStack.push(this.palette.toJSON());
        
        // Restore redo state
        const state = this.redoStack.pop();
        this.palette = Palette.fromJSON(state);
        
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Check if undo is available
     * @returns {boolean}
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
    
    /**
     * Check if redo is available
     * @returns {boolean}
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    
    // ========================================================================
    // ACTIONS
    // ========================================================================
    
    /**
     * Add a new stop at position
     * @param {number} position - Position (0-1)
     * @param {Object|string} color - Color
     */
    addStop(position, color) {
        this._saveUndoState();
        const stop = this.palette.addStop(position, color || this.palette.getColor(position));
        this.selectedStopIndex = this.palette.stops.indexOf(stop);
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Delete selected stop
     */
    deleteSelectedStop() {
        if (this.selectedStopIndex >= 0) {
            this._deleteStop(this.selectedStopIndex);
        }
    }
    
    /**
     * Select a stop
     * @param {number} index - Stop index
     */
    selectStop(index) {
        if (index >= 0 && index < this.palette.stops.length) {
            this.selectedStopIndex = index;
            this._updateUI();
            
            if (this.onSelectionChange) {
                this.onSelectionChange(index, this.palette.stops[index]);
            }
        }
    }
    
    /**
     * Deselect all stops
     */
    clearSelection() {
        this.selectedStopIndex = -1;
        this._updateUI();
    }
    
    /**
     * Reverse the palette
     */
    reverse() {
        this._saveUndoState();
        this.palette.reverse();
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Shift palette colors
     * @param {number} amount - Shift amount (0-1)
     */
    shift(amount) {
        this._saveUndoState();
        this.palette.shift(amount);
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Spread stops evenly
     */
    distributeEvenly() {
        this._saveUndoState();
        
        const count = this.palette.stops.length;
        for (let i = 0; i < count; i++) {
            this.palette.stops[i].position = i / (count - 1);
        }
        this.palette._sortStops();
        this.palette._invalidateLUT();
        
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Generate random palette
     * @param {Object} options - Generation options
     */
    generateRandom(options = {}) {
        this._saveUndoState();
        
        const stopCount = options.stops || 5;
        const harmony = options.harmony || 'random';
        
        this.palette.stops = [];
        
        // Generate base hue
        const baseHue = Math.random() * 360;
        
        for (let i = 0; i < stopCount; i++) {
            const position = i / (stopCount - 1);
            let h, s, v;
            
            switch (harmony) {
                case 'complementary':
                    h = (baseHue + (i % 2) * 180) % 360;
                    s = 0.5 + Math.random() * 0.5;
                    v = 0.3 + Math.random() * 0.7;
                    break;
                    
                case 'analogous':
                    h = (baseHue + (i - stopCount/2) * 30) % 360;
                    s = 0.5 + Math.random() * 0.5;
                    v = 0.3 + Math.random() * 0.7;
                    break;
                    
                case 'triadic':
                    h = (baseHue + (i % 3) * 120) % 360;
                    s = 0.5 + Math.random() * 0.5;
                    v = 0.3 + Math.random() * 0.7;
                    break;
                    
                case 'monochromatic':
                    h = baseHue;
                    s = Math.random() * 0.3;
                    v = i / (stopCount - 1);
                    break;
                    
                case 'random':
                default:
                    h = Math.random() * 360;
                    s = 0.3 + Math.random() * 0.7;
                    v = 0.2 + Math.random() * 0.8;
            }
            
            const rgb = hsvToRgb(h, s, v);
            this.palette.addStop(position, rgb);
        }
        
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Import palette from JSON string
     * @param {string} jsonString - JSON palette data
     */
    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this._saveUndoState();
            this.palette = Palette.fromJSON(data);
            this.selectedStopIndex = -1;
            this._updateUI();
            this._notifyChange();
            return true;
        } catch (e) {
            console.error('[PaletteEditor] Import failed:', e);
            return false;
        }
    }
    
    /**
     * Export palette to JSON string
     * @returns {string}
     */
    exportJSON() {
        return JSON.stringify(this.palette.toJSON(), null, 2);
    }
    
    /**
     * Create palette from image
     * @param {HTMLImageElement|ImageData} image - Source image
     * @param {number} stopCount - Number of stops to extract
     */
    extractFromImage(image, stopCount = 5) {
        this._saveUndoState();
        
        // Create canvas to read pixel data
        let imageData;
        if (image instanceof ImageData) {
            imageData = image;
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
        
        // Sample colors from image
        const colors = [];
        const data = imageData.data;
        const sampleCount = Math.min(1000, data.length / 4);
        
        for (let i = 0; i < sampleCount; i++) {
            const idx = Math.floor(Math.random() * (data.length / 4)) * 4;
            colors.push({
                r: data[idx] / 255,
                g: data[idx + 1] / 255,
                b: data[idx + 2] / 255
            });
        }
        
        // Simple k-means clustering to find dominant colors
        const centroids = this._kMeans(colors, stopCount);
        
        // Sort by brightness
        centroids.sort((a, b) => 
            (0.299 * a.r + 0.587 * a.g + 0.114 * a.b) -
            (0.299 * b.r + 0.587 * b.g + 0.114 * b.b)
        );
        
        // Create new palette
        this.palette.stops = [];
        centroids.forEach((color, i) => {
            this.palette.addStop(i / (stopCount - 1), color);
        });
        
        this._updateUI();
        this._notifyChange();
    }
    
    /**
     * Simple k-means clustering
     * @private
     */
    _kMeans(colors, k, iterations = 10) {
        // Initialize centroids randomly
        let centroids = [];
        for (let i = 0; i < k; i++) {
            centroids.push({ ...colors[Math.floor(Math.random() * colors.length)] });
        }
        
        for (let iter = 0; iter < iterations; iter++) {
            // Assign colors to nearest centroid
            const clusters = centroids.map(() => []);
            
            for (const color of colors) {
                let minDist = Infinity;
                let nearest = 0;
                
                for (let i = 0; i < centroids.length; i++) {
                    const dist = 
                        Math.pow(color.r - centroids[i].r, 2) +
                        Math.pow(color.g - centroids[i].g, 2) +
                        Math.pow(color.b - centroids[i].b, 2);
                    
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = i;
                    }
                }
                
                clusters[nearest].push(color);
            }
            
            // Update centroids
            for (let i = 0; i < k; i++) {
                if (clusters[i].length > 0) {
                    centroids[i] = {
                        r: clusters[i].reduce((s, c) => s + c.r, 0) / clusters[i].length,
                        g: clusters[i].reduce((s, c) => s + c.g, 0) / clusters[i].length,
                        b: clusters[i].reduce((s, c) => s + c.b, 0) / clusters[i].length
                    };
                }
            }
        }
        
        return centroids;
    }
    
    /**
     * Notify listeners of palette change
     * @private
     */
    _notifyChange() {
        if (this.onPaletteChange) {
            this.onPaletteChange(this.palette);
        }
    }
    
    /**
     * Destroy editor and clean up
     */
    destroy() {
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
        
        if (this.elements.gradientBar) {
            this.elements.gradientBar.removeEventListener('click', this._handleGradientClick);
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PaletteEditor;
