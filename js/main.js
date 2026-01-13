/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                     ABYSS EXPLORER - MAIN APPLICATION                         ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Application bootstrap - connects all modules and initializes the UI          ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Config } from './config.js';
import { State } from './core/state.js';
import { PerformanceMonitor } from './core/performance.js';
import { Logger } from './utils/logger.js';
import { EventBus, EVENTS } from './utils/event-bus.js';
import { ToastManager } from './ui/toast.js';
import { HUDManager } from './ui/hud.js';
import { ModalManager } from './ui/modals.js';
import { getStateFromURL, updateURLHash, generateShareURL } from './utils/url-state.js';

// =============================================================================
// WEBGL FRACTAL RENDERER (inline for reliability)
// =============================================================================

class FractalRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.uniforms = {};
        
        this._initWebGL();
    }
    
    _initWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) throw new Error('WebGL not supported');
        
        const gl = this.gl;
        
        // Vertex shader
        const vsSource = `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
        
        // Fragment shader with multiple fractal types
        const fsSource = `
            precision highp float;
            varying vec2 v_uv;
            
            uniform vec2 u_center;
            uniform float u_zoom;
            uniform float u_aspectRatio;
            uniform int u_maxIter;
            uniform int u_fractalType;
            uniform float u_colorOffset;
            uniform float u_power;
            uniform vec2 u_juliaC;
            uniform int u_paletteType;
            
            // Palettes
            vec3 inferno(float t) {
                const vec3 c0 = vec3(0.0, 0.0, 0.01);
                const vec3 c1 = vec3(0.5, 0.0, 0.4);
                const vec3 c2 = vec3(0.9, 0.3, 0.0);
                const vec3 c3 = vec3(1.0, 0.9, 0.5);
                t = clamp(t, 0.0, 1.0);
                if (t < 0.33) return mix(c0, c1, t * 3.0);
                if (t < 0.66) return mix(c1, c2, (t - 0.33) * 3.0);
                return mix(c2, c3, (t - 0.66) * 3.0);
            }
            
            vec3 viridis(float t) {
                const vec3 c0 = vec3(0.27, 0.0, 0.33);
                const vec3 c1 = vec3(0.13, 0.37, 0.55);
                const vec3 c2 = vec3(0.21, 0.72, 0.47);
                const vec3 c3 = vec3(0.99, 0.91, 0.15);
                t = clamp(t, 0.0, 1.0);
                if (t < 0.33) return mix(c0, c1, t * 3.0);
                if (t < 0.66) return mix(c1, c2, (t - 0.33) * 3.0);
                return mix(c2, c3, (t - 0.66) * 3.0);
            }
            
            vec3 plasma(float t) {
                const vec3 c0 = vec3(0.05, 0.03, 0.53);
                const vec3 c1 = vec3(0.65, 0.13, 0.62);
                const vec3 c2 = vec3(0.98, 0.45, 0.24);
                const vec3 c3 = vec3(0.94, 0.97, 0.13);
                t = clamp(t, 0.0, 1.0);
                if (t < 0.33) return mix(c0, c1, t * 3.0);
                if (t < 0.66) return mix(c1, c2, (t - 0.33) * 3.0);
                return mix(c2, c3, (t - 0.66) * 3.0);
            }
            
            vec3 rainbow(float t) {
                t = fract(t);
                vec3 c = abs(mod(t * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0;
                return clamp(c, 0.0, 1.0);
            }
            
            vec3 getColor(float t) {
                t = fract(t + u_colorOffset);
                if (u_paletteType == 1) return viridis(t);
                if (u_paletteType == 2) return plasma(t);
                if (u_paletteType == 3) return rainbow(t);
                return inferno(t);
            }
            
            void main() {
                float scale = 4.0 / u_zoom;
                float x0 = u_center.x + (v_uv.x - 0.5) * scale * u_aspectRatio;
                float y0 = u_center.y + (v_uv.y - 0.5) * scale;
                
                float x, y, x2, y2;
                int iter = 0;
                
                // Initialize based on fractal type
                // 0: mandelbrot, 1: julia, 2: burning ship, 3: tricorn
                // 4: multibrot, 5: celtic, 6: buffalo, 7: phoenix
                
                if (u_fractalType == 1) {
                    // Julia
                    x = x0; y = y0;
                } else {
                    x = 0.0; y = 0.0;
                }
                x2 = x * x; y2 = y * y;
                
                for (int i = 0; i < 10000; i++) {
                    if (i >= u_maxIter) break;
                    if (x2 + y2 > 4.0) break;
                    
                    float newX, newY;
                    
                    if (u_fractalType == 0) {
                        // Mandelbrot
                        newX = x2 - y2 + x0;
                        newY = 2.0 * x * y + y0;
                    } else if (u_fractalType == 1) {
                        // Julia
                        newX = x2 - y2 + u_juliaC.x;
                        newY = 2.0 * x * y + u_juliaC.y;
                    } else if (u_fractalType == 2) {
                        // Burning Ship
                        newX = x2 - y2 + x0;
                        newY = abs(2.0 * x * y) + y0;
                    } else if (u_fractalType == 3) {
                        // Tricorn
                        newX = x2 - y2 + x0;
                        newY = -2.0 * x * y + y0;
                    } else if (u_fractalType == 4) {
                        // Multibrot (power from uniform)
                        float r = sqrt(x2 + y2);
                        float theta = atan(y, x);
                        float rn = pow(r, u_power);
                        newX = rn * cos(u_power * theta) + x0;
                        newY = rn * sin(u_power * theta) + y0;
                    } else if (u_fractalType == 5) {
                        // Celtic
                        newX = abs(x2 - y2) + x0;
                        newY = 2.0 * x * y + y0;
                    } else if (u_fractalType == 6) {
                        // Buffalo
                        newX = abs(x2 - y2) + x0;
                        newY = abs(2.0 * x * y) + y0;
                    } else if (u_fractalType == 7) {
                        // Perpendicular Mandelbrot
                        newX = x2 - y2 + x0;
                        newY = -2.0 * abs(x) * y + y0;
                    } else {
                        // Default: Mandelbrot
                        newX = x2 - y2 + x0;
                        newY = 2.0 * x * y + y0;
                    }
                    
                    x = newX;
                    y = newY;
                    x2 = x * x;
                    y2 = y * y;
                    iter++;
                }
                
                if (iter >= u_maxIter) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    // Smooth coloring
                    float smoothed = float(iter) + 1.0 - log2(log2(x2 + y2 + 1.0));
                    float t = smoothed / 100.0;
                    vec3 color = getColor(t);
                    gl_FragColor = vec4(color, 1.0);
                }
            }
        `;
        
        const vs = this._compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this._compileShader(gl.FRAGMENT_SHADER, fsSource);
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Shader link failed: ' + gl.getProgramInfoLog(this.program));
        }
        
        // Setup geometry
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Get uniforms
        this.uniforms = {
            center: gl.getUniformLocation(this.program, 'u_center'),
            zoom: gl.getUniformLocation(this.program, 'u_zoom'),
            aspectRatio: gl.getUniformLocation(this.program, 'u_aspectRatio'),
            maxIter: gl.getUniformLocation(this.program, 'u_maxIter'),
            fractalType: gl.getUniformLocation(this.program, 'u_fractalType'),
            colorOffset: gl.getUniformLocation(this.program, 'u_colorOffset'),
            power: gl.getUniformLocation(this.program, 'u_power'),
            juliaC: gl.getUniformLocation(this.program, 'u_juliaC'),
            paletteType: gl.getUniformLocation(this.program, 'u_paletteType')
        };
    }
    
    _compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error('Shader compile error: ' + this.gl.getShaderInfoLog(shader));
        }
        return shader;
    }
    
    render(params) {
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(this.program);
        
        gl.uniform2f(this.uniforms.center, params.centerX, params.centerY);
        gl.uniform1f(this.uniforms.zoom, params.zoom);
        gl.uniform1f(this.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        gl.uniform1i(this.uniforms.maxIter, params.maxIterations);
        gl.uniform1f(this.uniforms.colorOffset, params.colorOffset || 0);
        gl.uniform1f(this.uniforms.power, params.power || 2);
        gl.uniform2f(this.uniforms.juliaC, params.juliaC?.x || -0.7, params.juliaC?.y || 0.27);
        gl.uniform1i(this.uniforms.paletteType, params.paletteType || 0);
        
        // Map fractal type string to number
        const typeMap = {
            'mandelbrot': 0, 'julia': 1, 'burning-ship': 2, 'burningship': 2,
            'tricorn': 3, 'multibrot': 4, 'celtic': 5, 'buffalo': 6,
            'perpendicular-mandelbrot': 7, 'perpendicular-burning-ship': 2,
            'perpendicular-celtic': 5
        };
        gl.uniform1i(this.uniforms.fractalType, typeMap[params.fractalType] || 0);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

// =============================================================================
// MAIN APPLICATION CLASS
// =============================================================================

class App {
    constructor() {
        this.logger = new Logger('App');
        this.logger.info('Creating application instance...');
        
        // Core systems
        this.events = new EventBus();
        this.state = null;
        this.renderer = null;
        this.performance = null;
        
        // UI managers
        this.toast = null;
        this.hud = null;
        this.modals = null;
        
        // Fractal parameters
        this.params = {
            centerX: -0.5,
            centerY: 0,
            zoom: 1,
            maxIterations: 500,
            fractalType: 'mandelbrot',
            colorOffset: 0,
            power: 2,
            paletteType: 0,
            juliaC: { x: -0.7, y: 0.27015 }
        };
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        
        // Bookmarks
        this.bookmarks = [];
        
        // Interaction state
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
    }
    
    async init() {
        this.logger.info('Initializing application...');
        this._updateLoadingStatus('Initializing systems...', 10);
        
        try {
            // Get canvas
            const canvas = document.getElementById('fractal-canvas-2d');
            if (!canvas) throw new Error('Canvas not found');
            
            // Initialize state
            this._updateLoadingStatus('Setting up state...', 20);
            this.state = new State({ events: this.events });
            await this.state.init();
            
            // Initialize renderer
            this._updateLoadingStatus('Initializing WebGL...', 40);
            this.renderer = new FractalRenderer(canvas);
            
            // Initialize UI managers
            this._updateLoadingStatus('Setting up UI...', 60);
            this.toast = new ToastManager({ events: this.events });
            this.hud = new HUDManager({ state: this.state, events: this.events });
            this.modals = new ModalManager({ events: this.events });
            
            // Setup canvas and events
            this._setupCanvas();
            this._setupEventListeners();
            this._setupUIBindings();
            
            // Load URL state if present
            this._loadURLState();
            
            // Load bookmarks
            this._loadBookmarks();
            
            // Initial render
            this._updateLoadingStatus('Rendering fractal...', 80);
            this.saveToHistory();
            this.render();
            
            this._updateLoadingStatus('Ready!', 100);
            this.logger.success('Application initialized!');
            
            // Hide loading screen
            await this._delay(300);
            this._hideLoadingScreen();
            
            // Show welcome toast
            this.toast?.info('Welcome to Abyss Explorer! Use mouse wheel to zoom, drag to pan.');
            
        } catch (error) {
            this.logger.error('Initialization failed:', error);
            this._showError(error.message);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════
    
    render() {
        if (!this.renderer) return;
        
        const start = performance.now();
        this.renderer.render(this.params);
        const elapsed = performance.now() - start;
        
        // Update displays
        this._updateInfo();
        this.events.emit('render:complete', { renderTime: elapsed, fps: 1000 / elapsed });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════
    
    zoomAt(factor, screenX = null, screenY = null) {
        const canvas = this.renderer?.canvas;
        if (!canvas) return;
        
        const scale = 4 / this.params.zoom;
        const ar = canvas.width / canvas.height;
        
        if (screenX !== null && screenY !== null) {
            const rect = canvas.getBoundingClientRect();
            const nx = (screenX - rect.left) / rect.width;
            const ny = 1 - (screenY - rect.top) / rect.height;
            
            const fx = this.params.centerX + (nx - 0.5) * scale * ar;
            const fy = this.params.centerY + (ny - 0.5) * scale;
            
            this.params.centerX = fx + (this.params.centerX - fx) / factor;
            this.params.centerY = fy + (this.params.centerY - fy) / factor;
        }
        
        this.params.zoom *= factor;
        this.render();
    }
    
    pan(dx, dy) {
        const canvas = this.renderer?.canvas;
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const scale = 4 / this.params.zoom;
        const ar = canvas.width / canvas.height;
        
        this.params.centerX -= (dx / rect.width) * scale * ar;
        this.params.centerY += (dy / rect.height) * scale;
        this.render();
    }
    
    reset() {
        const defaults = {
            'mandelbrot': { x: -0.5, y: 0 },
            'julia': { x: 0, y: 0 },
            'burning-ship': { x: -0.4, y: -0.6 },
            'tricorn': { x: -0.3, y: 0 },
            'multibrot': { x: 0, y: 0 },
            'celtic': { x: -0.5, y: 0 },
            'buffalo': { x: -0.5, y: 0 }
        };
        const d = defaults[this.params.fractalType] || { x: -0.5, y: 0 };
        this.params.centerX = d.x;
        this.params.centerY = d.y;
        this.params.zoom = 1;
        this.saveToHistory();
        this.render();
        this.toast?.info('View reset');
    }
    
    setFractalType(type) {
        this.logger.info('Setting fractal type:', type);
        this.params.fractalType = type;
        
        // Update UI
        const select = document.getElementById('fractal-select-2d');
        if (select) select.value = type;
        
        document.querySelectorAll('[data-fractal]').forEach(el => {
            el.classList.toggle('active', el.dataset.fractal === type);
        });
        
        this.reset();
    }
    
    setPalette(paletteType) {
        const types = { 'inferno': 0, 'viridis': 1, 'plasma': 2, 'rainbow': 3 };
        this.params.paletteType = types[paletteType] || 0;
        this.render();
        this.toast?.info(`Palette: ${paletteType}`);
    }
    
    setIterations(value) {
        this.params.maxIterations = value;
        this.render();
        
        // Update UI
        const slider = document.getElementById('max-iterations');
        const input = document.getElementById('max-iterations-value');
        if (slider) slider.value = value;
        if (input) input.value = value;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // HISTORY
    // ═══════════════════════════════════════════════════════════════════════
    
    saveToHistory() {
        const state = { ...this.params };
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(state);
        if (this.history.length > 50) this.history.shift();
        this.historyIndex = this.history.length - 1;
        this.events.emit(EVENTS.HISTORY_PUSH);
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            Object.assign(this.params, this.history[this.historyIndex]);
            this.render();
            this.toast?.info('Undo');
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            Object.assign(this.params, this.history[this.historyIndex]);
            this.render();
            this.toast?.info('Redo');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BOOKMARKS
    // ═══════════════════════════════════════════════════════════════════════
    
    _loadBookmarks() {
        try {
            this.bookmarks = JSON.parse(localStorage.getItem('abyss-bookmarks') || '[]');
        } catch { this.bookmarks = []; }
    }
    
    _saveBookmarks() {
        localStorage.setItem('abyss-bookmarks', JSON.stringify(this.bookmarks));
    }
    
    addBookmark(name = null) {
        const bookmark = {
            id: Date.now(),
            name: name || `Bookmark ${this.bookmarks.length + 1}`,
            ...this.params,
            timestamp: new Date().toISOString()
        };
        this.bookmarks.push(bookmark);
        this._saveBookmarks();
        this.toast?.success('Bookmark added!');
        this.events.emit(EVENTS.BOOKMARK_ADDED, bookmark);
    }
    
    loadBookmark(id) {
        const bookmark = this.bookmarks.find(b => b.id === id);
        if (bookmark) {
            Object.assign(this.params, bookmark);
            this.saveToHistory();
            this.render();
            this.toast?.info(`Loaded: ${bookmark.name}`);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════
    
    screenshot() {
        const canvas = this.renderer?.canvas;
        if (!canvas) return;
        
        const link = document.createElement('a');
        link.download = `abyss-${this.params.fractalType}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.toast?.success('Screenshot saved!');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
    }
    
    shareURL() {
        const url = generateShareURL(this.params);
        navigator.clipboard.writeText(url).then(() => {
            this.toast?.success('URL copied to clipboard!');
        }).catch(() => {
            prompt('Copy this URL:', url);
        });
    }
    
    randomLocation() {
        const locations = [
            { x: -0.7436447860, y: 0.1318252536, z: 1e6 },
            { x: -0.7453, y: 0.1127, z: 5000 },
            { x: -0.16, y: 1.0405, z: 100 },
            { x: -1.25066, y: 0.02012, z: 2000 },
            { x: 0.001643721971153, y: 0.822467633298876, z: 1e5 },
            { x: -0.77568377, y: 0.13646737, z: 1e8 }
        ];
        const loc = locations[Math.floor(Math.random() * locations.length)];
        this.params.centerX = loc.x;
        this.params.centerY = loc.y;
        this.params.zoom = loc.z;
        this.saveToHistory();
        this.render();
        this.toast?.info('Jumped to random location!');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SETUP
    // ═══════════════════════════════════════════════════════════════════════
    
    _setupCanvas() {
        const canvas = this.renderer?.canvas;
        if (!canvas) return;
        
        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect() || 
                        { width: window.innerWidth, height: window.innerHeight };
            this.renderer.resize(Math.floor(rect.width), Math.floor(rect.height));
            this.render();
        };
        
        resize();
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(resize, 100);
        });
    }
    
    _setupEventListeners() {
        const canvas = this.renderer?.canvas;
        if (!canvas) return;
        
        // Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomAt(e.deltaY > 0 ? 0.75 : 1.33, e.clientX, e.clientY);
        }, { passive: false });
        
        // Mouse drag
        canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.isDragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            // Emit for HUD
            const rect = canvas.getBoundingClientRect();
            this.events.emit('mouse:move', { x: e.clientX - rect.left, y: e.clientY - rect.top });
            
            if (!this.isDragging) return;
            this.pan(e.clientX - this.lastMouse.x, e.clientY - this.lastMouse.y);
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                canvas.style.cursor = 'crosshair';
                this.saveToHistory();
            }
        });
        
        // Double click zoom
        canvas.addEventListener('dblclick', (e) => {
            this.zoomAt(3, e.clientX, e.clientY);
            this.saveToHistory();
        });
        
        // Touch events
        this._setupTouchEvents(canvas);
        
        // Keyboard
        document.addEventListener('keydown', (e) => this._handleKeyboard(e));
        
        // Event bus subscriptions
        this.events.on('view:reset', () => this.reset());
        this.events.on('history:undo', () => this.undo());
        this.events.on('history:redo', () => this.redo());
        this.events.on('screenshot', () => this.screenshot());
        this.events.on('fullscreen:toggle', () => this.toggleFullscreen());
    }
    
    _setupTouchEvents(canvas) {
        let lastDist = 0, lastX = 0, lastY = 0, touching = false;
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touching = true;
            if (e.touches.length === 1) {
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                lastDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!touching) return;
            
            if (e.touches.length === 1) {
                this.pan(e.touches[0].clientX - lastX, e.touches[0].clientY - lastY);
                lastX = e.touches[0].clientX;
                lastY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (lastDist > 0) {
                    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    this.zoomAt(dist / lastDist, cx, cy);
                }
                lastDist = dist;
            }
        }, { passive: false });
        
        canvas.addEventListener('touchend', () => {
            touching = false;
            lastDist = 0;
            this.saveToHistory();
        });
    }
    
    _handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        
        switch (key) {
            case 'r': case ' ': e.preventDefault(); this.reset(); break;
            case '+': case '=': this.zoomAt(1.5); this.saveToHistory(); break;
            case '-': this.zoomAt(0.67); this.saveToHistory(); break;
            case 'arrowup': e.preventDefault(); this.pan(0, 50); break;
            case 'arrowdown': e.preventDefault(); this.pan(0, -50); break;
            case 'arrowleft': e.preventDefault(); this.pan(50, 0); break;
            case 'arrowright': e.preventDefault(); this.pan(-50, 0); break;
            case 'z': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.undo(); } break;
            case 'y': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.redo(); } break;
            case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.screenshot(); } break;
            case 'f': this.toggleFullscreen(); break;
            case 'escape': this.modals?.closeActive(); break;
            case '?': case 'h': this.modals?.toggle('modal-help'); break;
        }
    }
    
    _setupUIBindings() {
        this.logger.info('Setting up UI bindings...');
        
        // Helper to bind click handlers
        const bind = (id, handler) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    handler();
                });
            }
        };
        
        // Navigation
        bind('btn-home', () => this.reset());
        bind('btn-back', () => this.undo());
        bind('btn-forward', () => this.redo());
        bind('btn-undo', () => this.undo());
        bind('btn-redo', () => this.redo());
        bind('btn-zoom-in', () => { this.zoomAt(2); this.saveToHistory(); });
        bind('btn-zoom-out', () => { this.zoomAt(0.5); this.saveToHistory(); });
        bind('btn-reset-view', () => this.reset());
        bind('btn-center-origin', () => { this.params.centerX = 0; this.params.centerY = 0; this.render(); });
        
        // Export
        bind('btn-screenshot', () => this.screenshot());
        bind('btn-share', () => this.shareURL());
        bind('btn-copy-url', () => this.shareURL());
        
        // Actions
        bind('btn-fullscreen', () => this.toggleFullscreen());
        bind('btn-random-location', () => this.randomLocation());
        bind('btn-bookmark', () => this.addBookmark());
        
        // Panels
        bind('btn-history', () => this._togglePanel('history-panel'));
        bind('btn-history-sidebar', () => this._togglePanel('history-panel'));
        bind('btn-bookmarks', () => this._togglePanel('bookmarks-panel'));
        bind('btn-bookmarks-sidebar', () => this._togglePanel('bookmarks-panel'));
        
        // Modals
        bind('btn-help', () => this.modals?.toggle('modal-help'));
        bind('btn-settings', () => this.modals?.toggle('modal-settings'));
        bind('btn-export', () => this.modals?.toggle('modal-export'));
        bind('btn-edit-palette', () => this.modals?.toggle('modal-palette'));
        
        // Mode toggle (2D/3D)
        bind('mode-2d', () => this._setMode('2d'));
        bind('mode-3d', () => this._setMode('3d'));
        
        // Sidebar toggle
        bind('sidebar-toggle', () => {
            const sidebar = document.getElementById('sidebar');
            sidebar?.classList.toggle('collapsed');
        });
        
        // Fractal type select
        const fractalSelect = document.getElementById('fractal-select-2d');
        if (fractalSelect) {
            fractalSelect.addEventListener('change', (e) => this.setFractalType(e.target.value));
        }
        
        // Fractal dropdown items
        document.querySelectorAll('[data-fractal]').forEach(el => {
            el.addEventListener('click', () => {
                this.setFractalType(el.dataset.fractal);
                document.getElementById('fractal-dropdown')?.classList.remove('open');
            });
        });
        
        // Iterations slider
        const iterSlider = document.getElementById('max-iterations');
        const iterInput = document.getElementById('max-iterations-value');
        
        if (iterSlider) {
            iterSlider.value = this.params.maxIterations;
            iterSlider.addEventListener('input', (e) => {
                this.setIterations(parseInt(e.target.value));
            });
        }
        if (iterInput) {
            iterInput.value = this.params.maxIterations;
            iterInput.addEventListener('change', (e) => {
                this.setIterations(parseInt(e.target.value) || 500);
            });
        }
        
        // Quick iteration buttons
        document.querySelectorAll('[data-iter]').forEach(el => {
            el.addEventListener('click', () => {
                const val = parseInt(el.dataset.iter);
                this.setIterations(val);
                document.querySelectorAll('[data-iter]').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
            });
        });
        
        // Palette select
        const paletteSelect = document.getElementById('palette-preset');
        if (paletteSelect) {
            paletteSelect.addEventListener('change', (e) => this.setPalette(e.target.value));
        }
        
        // Data-action buttons
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', () => {
                const action = el.dataset.action;
                switch (action) {
                    case 'reset': this.reset(); break;
                    case 'undo': this.undo(); break;
                    case 'redo': this.redo(); break;
                    case 'screenshot': this.screenshot(); break;
                    case 'fullscreen': this.toggleFullscreen(); break;
                    case 'random': this.randomLocation(); break;
                    case 'bookmark': this.addBookmark(); break;
                    case 'copy-url': this.shareURL(); break;
                }
            });
        });
        
        this.logger.info('UI bindings complete');
    }
    
    _togglePanel(id) {
        const panel = document.getElementById(id);
        if (panel) {
            document.querySelectorAll('.slide-panel').forEach(p => {
                if (p.id !== id) p.hidden = true;
            });
            panel.hidden = !panel.hidden;
        }
    }
    
    _setMode(mode) {
        this.logger.info('Setting mode:', mode);
        document.querySelectorAll('.mode-btn').forEach(el => {
            el.classList.toggle('active', el.id === 'mode-' + mode);
        });
        // 3D mode would require Three.js integration
        if (mode === '3d') {
            this.toast?.warning('3D mode coming soon!');
        }
    }
    
    _loadURLState() {
        try {
            const urlState = getStateFromURL();
            if (urlState && Object.keys(urlState).length > 0) {
                Object.assign(this.params, urlState);
                this.logger.info('Loaded state from URL');
            }
        } catch (e) {
            this.logger.warn('Could not load URL state:', e);
        }
    }
    
    _updateInfo() {
        // Update zoom display
        const zoomEls = ['zoom-level', 'coord-zoom', 'zoom-level-value'];
        const zoomText = this._formatZoom(this.params.zoom);
        zoomEls.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = zoomText;
        });
        
        // Update coordinates
        const reEl = document.getElementById('coord-real') || document.getElementById('center-real');
        const imEl = document.getElementById('coord-imag') || document.getElementById('center-imag');
        if (reEl) reEl.textContent = this.params.centerX.toFixed(12);
        if (imEl) imEl.textContent = this.params.centerY.toFixed(12);
        
        // Update iterations
        const iterEl = document.getElementById('coord-iter');
        if (iterEl) iterEl.textContent = this.params.maxIterations;
    }
    
    _formatZoom(zoom) {
        const exp = Math.log10(zoom);
        return exp >= 3 ? `10^${exp.toFixed(1)}` : `${zoom.toFixed(2)}x`;
    }
    
    _updateLoadingStatus(msg, pct) {
        const status = document.getElementById('loading-status');
        const bar = document.getElementById('loading-progress-bar');
        if (status) status.textContent = msg;
        if (bar) bar.style.width = pct + '%';
    }
    
    _hideLoadingScreen() {
        const el = document.getElementById('loading-screen');
        if (el) {
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
            setTimeout(() => el.style.display = 'none', 500);
        }
    }
    
    _showError(msg) {
        const el = document.querySelector('.loading-text') || document.getElementById('loading-status');
        if (el) {
            el.textContent = `Error: ${msg}`;
            el.style.color = '#ff4444';
        }
    }
    
    _delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

// =============================================================================
// BOOTSTRAP
// =============================================================================

async function bootstrap() {
    console.log('🌀 Abyss Explorer starting...');
    
    const app = new App();
    await app.init();
    
    // Make globally accessible
    window.AbyssExplorer = app;
    window.abyssExplorer = app;
    
    // Expose methods that HTML expects
    window.AbyssExplorer.handleKeyDown = (e) => app._handleKeyboard(e);
    window.AbyssExplorer.setFractalType = (type) => app.setFractalType(type);
    window.AbyssExplorer.setMode = (mode) => app._setMode(mode);
    window.AbyssExplorer.reset = () => app.reset();
    window.AbyssExplorer.undo = () => app.undo();
    window.AbyssExplorer.redo = () => app.redo();
    window.AbyssExplorer.screenshot = () => app.screenshot();
    window.AbyssExplorer.toggleFullscreen = () => app.toggleFullscreen();
    window.AbyssExplorer.randomLocation = () => app.randomLocation();
    window.AbyssExplorer.addBookmark = () => app.addBookmark();
    window.AbyssExplorer.shareURL = () => app.shareURL();
    
    console.log('🌀 Abyss Explorer v1.0.0 Ready');
    console.log('Explore the infinite depths of mathematical beauty.');
    console.log('Press ? for keyboard shortcuts.');
    
    return app;
}

// Start on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

export { App, bootstrap };
export default App;
