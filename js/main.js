/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ABYSS EXPLORER - Main Application (WebGL Accelerated)
 * ═══════════════════════════════════════════════════════════════════════════
 */

class App {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.isInitialized = false;
        this.animationFrame = null;
        
        // Fractal parameters
        this.params = {
            centerX: -0.5,
            centerY: 0,
            zoom: 1,
            maxIterations: 500,
            fractalType: 'mandelbrot',
            colorOffset: 0,
            juliaC: { x: -0.7, y: 0.27015 }
        };
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        // Bookmarks
        this.bookmarks = this.loadBookmarks();
        
        console.log('[App] Constructor called');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // WEBGL SHADERS
    // ═══════════════════════════════════════════════════════════════════════
    
    getVertexShader() {
        return `
            attribute vec2 a_position;
            varying vec2 v_uv;
            void main() {
                v_uv = a_position * 0.5 + 0.5;
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;
    }
    
    getFragmentShader() {
        return `
            precision highp float;
            varying vec2 v_uv;
            
            uniform vec2 u_center;
            uniform float u_zoom;
            uniform float u_aspectRatio;
            uniform int u_maxIter;
            uniform int u_fractalType;
            uniform float u_colorOffset;
            uniform vec2 u_juliaC;
            
            vec3 palette(float t) {
                // Inferno-like palette
                vec3 a = vec3(0.0, 0.0, 0.02);
                vec3 b = vec3(0.9, 0.3, 0.0);
                vec3 c = vec3(1.0, 0.8, 0.2);
                vec3 d = vec3(1.0, 1.0, 0.6);
                
                t = fract(t + u_colorOffset);
                
                if (t < 0.33) {
                    return mix(a, b, t * 3.0);
                } else if (t < 0.66) {
                    return mix(b, c, (t - 0.33) * 3.0);
                } else {
                    return mix(c, d, (t - 0.66) * 3.0);
                }
            }
            
            void main() {
                float scale = 4.0 / u_zoom;
                float x0 = u_center.x + (v_uv.x - 0.5) * scale * u_aspectRatio;
                float y0 = u_center.y + (v_uv.y - 0.5) * scale;
                
                float x = 0.0;
                float y = 0.0;
                int iter = 0;
                
                // Fractal type: 0=mandelbrot, 1=julia, 2=burningship, 3=tricorn
                if (u_fractalType == 1) {
                    // Julia
                    x = x0;
                    y = y0;
                    for (int i = 0; i < 10000; i++) {
                        if (i >= u_maxIter) break;
                        if (x*x + y*y > 4.0) break;
                        float xtemp = x*x - y*y + u_juliaC.x;
                        y = 2.0*x*y + u_juliaC.y;
                        x = xtemp;
                        iter++;
                    }
                } else if (u_fractalType == 2) {
                    // Burning Ship
                    for (int i = 0; i < 10000; i++) {
                        if (i >= u_maxIter) break;
                        if (x*x + y*y > 4.0) break;
                        float xtemp = x*x - y*y + x0;
                        y = abs(2.0*x*y) + y0;
                        x = xtemp;
                        iter++;
                    }
                } else if (u_fractalType == 3) {
                    // Tricorn
                    for (int i = 0; i < 10000; i++) {
                        if (i >= u_maxIter) break;
                        if (x*x + y*y > 4.0) break;
                        float xtemp = x*x - y*y + x0;
                        y = -2.0*x*y + y0;
                        x = xtemp;
                        iter++;
                    }
                } else {
                    // Mandelbrot (default)
                    for (int i = 0; i < 10000; i++) {
                        if (i >= u_maxIter) break;
                        if (x*x + y*y > 4.0) break;
                        float xtemp = x*x - y*y + x0;
                        y = 2.0*x*y + y0;
                        x = xtemp;
                        iter++;
                    }
                }
                
                if (iter >= u_maxIter) {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                } else {
                    // Smooth coloring
                    float smoothed = float(iter) + 1.0 - log2(log2(x*x + y*y + 1.0));
                    float t = smoothed / 100.0;
                    vec3 color = palette(t);
                    gl_FragColor = vec4(color, 1.0);
                }
            }
        `;
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════
    
    async init() {
        console.log('[App] Initializing...');
        this.updateLoadingStatus('Setting up WebGL...', 20);
        
        try {
            // Get canvas
            this.canvas = document.getElementById('fractal-canvas-2d') || document.getElementById('fractal-canvas');
            if (!this.canvas) throw new Error('Canvas not found');
            console.log('[App] Canvas found:', this.canvas.id);
            
            // Setup WebGL
            this.updateLoadingStatus('Compiling shaders...', 40);
            await this.setupWebGL();
            console.log('[App] WebGL setup complete');
            
            // Setup canvas size
            this.setupCanvas();
            
            // Setup all event listeners
            this.updateLoadingStatus('Setting up controls...', 60);
            this.setupEventListeners();
            this.setupUIControls();
            console.log('[App] Event listeners attached');
            
            // Initial render
            this.updateLoadingStatus('Rendering fractal...', 80);
            this.saveToHistory();
            this.render();
            
            this.isInitialized = true;
            console.log('[App] ✅ Initialization complete!');
            
            this.updateLoadingStatus('Ready!', 100);
            await this.delay(300);
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('[App] ❌ Init failed:', error);
            this.showError(error.message);
        }
    }
    
    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    
    updateLoadingStatus(msg, pct) {
        const status = document.getElementById('loading-status');
        const bar = document.getElementById('loading-progress-bar');
        if (status) status.textContent = msg;
        if (bar) bar.style.width = pct + '%';
    }
    
    async setupWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) throw new Error('WebGL not supported');
        
        const gl = this.gl;
        
        // Compile shaders
        const vs = this.compileShader(gl.VERTEX_SHADER, this.getVertexShader());
        const fs = this.compileShader(gl.FRAGMENT_SHADER, this.getFragmentShader());
        
        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Shader program failed: ' + gl.getProgramInfoLog(this.program));
        }
        
        // Create fullscreen quad
        const vertices = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        // Setup attribute
        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
        // Get uniform locations
        this.uniforms = {
            center: gl.getUniformLocation(this.program, 'u_center'),
            zoom: gl.getUniformLocation(this.program, 'u_zoom'),
            aspectRatio: gl.getUniformLocation(this.program, 'u_aspectRatio'),
            maxIter: gl.getUniformLocation(this.program, 'u_maxIter'),
            fractalType: gl.getUniformLocation(this.program, 'u_fractalType'),
            colorOffset: gl.getUniformLocation(this.program, 'u_colorOffset'),
            juliaC: gl.getUniformLocation(this.program, 'u_juliaC')
        };
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error('Shader compile error: ' + error);
        }
        return shader;
    }
    
    setupCanvas() {
        const resize = () => {
            const rect = this.canvas.parentElement?.getBoundingClientRect() || 
                        { width: window.innerWidth, height: window.innerHeight };
            this.canvas.width = Math.floor(rect.width);
            this.canvas.height = Math.floor(rect.height);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            
            if (this.gl) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
            if (this.isInitialized) {
                this.render();
            }
        };
        
        resize();
        let timeout;
        window.addEventListener('resize', () => {
            clearTimeout(timeout);
            timeout = setTimeout(resize, 100);
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════
    
    render() {
        const gl = this.gl;
        if (!gl || !this.program) return;
        
        const startTime = performance.now();
        
        gl.useProgram(this.program);
        
        // Set uniforms
        gl.uniform2f(this.uniforms.center, this.params.centerX, this.params.centerY);
        gl.uniform1f(this.uniforms.zoom, this.params.zoom);
        gl.uniform1f(this.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        gl.uniform1i(this.uniforms.maxIter, this.params.maxIterations);
        gl.uniform1f(this.uniforms.colorOffset, this.params.colorOffset);
        gl.uniform2f(this.uniforms.juliaC, this.params.juliaC.x, this.params.juliaC.y);
        
        // Fractal type
        const types = { mandelbrot: 0, julia: 1, burningship: 2, 'burning-ship': 2, tricorn: 3 };
        gl.uniform1i(this.uniforms.fractalType, types[this.params.fractalType] || 0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        const elapsed = performance.now() - startTime;
        this.updatePerformance(elapsed);
        this.updateInfo();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════
    
    setupEventListeners() {
        let isDragging = false;
        let lastX, lastY;
        
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.75 : 1.33;
            this.zoomAt(factor, e.clientX, e.clientY);
        }, { passive: false });
        
        // Mouse drag
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            this.pan(e.clientX - lastX, e.clientY - lastY);
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.canvas.style.cursor = 'crosshair';
                this.saveToHistory();
            }
        });
        
        // Double click zoom
        this.canvas.addEventListener('dblclick', (e) => {
            this.zoomAt(3, e.clientX, e.clientY);
            this.saveToHistory();
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Touch
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        let lastDist = 0, lastX = 0, lastY = 0, touching = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
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
        
        this.canvas.addEventListener('touchmove', (e) => {
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
        
        this.canvas.addEventListener('touchend', () => {
            touching = false;
            lastDist = 0;
            this.saveToHistory();
        });
    }
    
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const key = e.key.toLowerCase();
        
        switch (key) {
            case 'r': case ' ': e.preventDefault(); this.reset(); break;
            case '+': case '=': this.zoomAt(1.5); this.saveToHistory(); break;
            case '-': case '_': this.zoomAt(0.67); this.saveToHistory(); break;
            case 'arrowup': e.preventDefault(); this.pan(0, 50); break;
            case 'arrowdown': e.preventDefault(); this.pan(0, -50); break;
            case 'arrowleft': e.preventDefault(); this.pan(50, 0); break;
            case 'arrowright': e.preventDefault(); this.pan(-50, 0); break;
            case 'z': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.undo(); } break;
            case 'y': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.redo(); } break;
            case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.screenshot(); } break;
            case 'f': this.toggleFullscreen(); break;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UI CONTROLS - Connect to HTML buttons
    // ═══════════════════════════════════════════════════════════════════════
    
    setupUIControls() {
        console.log('[App] Setting up UI controls...');
        
        // Navigation buttons
        this.bindButton('btn-home', () => this.reset());
        this.bindButton('btn-back', () => this.undo());
        this.bindButton('btn-forward', () => this.redo());
        this.bindButton('btn-undo', () => this.undo());
        this.bindButton('btn-redo', () => this.redo());
        this.bindButton('btn-zoom-in', () => { this.zoomAt(2); this.saveToHistory(); });
        this.bindButton('btn-zoom-out', () => { this.zoomAt(0.5); this.saveToHistory(); });
        this.bindButton('btn-reset-view', () => this.reset());
        
        // Export/Screenshot
        this.bindButton('btn-screenshot', () => this.screenshot());
        this.bindButton('btn-export', () => this.screenshot());
        
        // Fullscreen
        this.bindButton('btn-fullscreen', () => this.toggleFullscreen());
        
        // Bookmarks
        this.bindButton('btn-bookmark', () => this.addBookmark());
        this.bindButton('btn-bookmarks', () => this.toggleModal('bookmarks-modal'));
        this.bindButton('btn-bookmarks-sidebar', () => this.toggleModal('bookmarks-modal'));
        
        // Share
        this.bindButton('btn-share', () => this.shareLocation());
        this.bindButton('btn-copy-url', () => this.copyURL());
        
        // Help
        this.bindButton('btn-help', () => this.toggleModal('help-modal'));
        
        // Settings
        this.bindButton('btn-settings', () => this.toggleModal('settings-modal'));
        
        // History
        this.bindButton('btn-history', () => this.toggleModal('history-modal'));
        this.bindButton('btn-history-sidebar', () => this.toggleModal('history-modal'));
        
        // Random location
        this.bindButton('btn-random-location', () => this.randomLocation());
        
        // 2D/3D Mode switcher
        this.bindButton('mode-2d', () => this.setMode('2d'));
        this.bindButton('mode-3d', () => this.setMode('3d'));
        
        // Fractal type dropdown items
        document.querySelectorAll('[data-fractal]').forEach(el => {
            el.addEventListener('click', () => {
                const type = el.dataset.fractal;
                console.log('[App] Fractal selected:', type);
                this.setFractalType(type);
            });
        });
        
        // Fractal selector button (dropdown toggle)
        const fractalBtn = document.getElementById('fractal-selector-btn');
        const fractalDropdown = document.getElementById('fractal-dropdown');
        if (fractalBtn && fractalDropdown) {
            fractalBtn.addEventListener('click', () => {
                fractalDropdown.classList.toggle('open');
            });
            // Close on outside click
            document.addEventListener('click', (e) => {
                if (!fractalBtn.contains(e.target) && !fractalDropdown.contains(e.target)) {
                    fractalDropdown.classList.remove('open');
                }
            });
        }
        
        // Iterations slider
        const iterSlider = document.getElementById('slider-iterations');
        const iterInput = document.getElementById('input-iterations');
        if (iterSlider) {
            iterSlider.addEventListener('input', (e) => {
                this.params.maxIterations = parseInt(e.target.value);
                if (iterInput) iterInput.value = e.target.value;
                this.render();
            });
        }
        if (iterInput) {
            iterInput.addEventListener('change', (e) => {
                this.params.maxIterations = parseInt(e.target.value) || 500;
                if (iterSlider) iterSlider.value = this.params.maxIterations;
                this.render();
            });
        }
        
        // Quick iteration buttons
        document.querySelectorAll('[data-iterations]').forEach(el => {
            el.addEventListener('click', () => {
                this.params.maxIterations = parseInt(el.dataset.iterations);
                if (iterSlider) iterSlider.value = this.params.maxIterations;
                if (iterInput) iterInput.value = this.params.maxIterations;
                this.render();
            });
        });
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
        
        // Modal close buttons
        document.querySelectorAll('.modal-close, [data-close-modal]').forEach(el => {
            el.addEventListener('click', () => {
                el.closest('.modal')?.classList.remove('active');
            });
        });
        
        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) {
                    el.closest('.modal')?.classList.remove('active');
                }
            });
        });
        
        console.log('[App] UI controls setup complete');
    }
    
    bindButton(id, handler) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[App] Button clicked:', id);
                handler();
            });
        } else {
            // Try class-based selector
            document.querySelectorAll('.' + id).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('[App] Button clicked:', id);
                    handler();
                });
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NAVIGATION METHODS
    // ═══════════════════════════════════════════════════════════════════════
    
    zoomAt(factor, screenX = null, screenY = null) {
        const scale = 4 / this.params.zoom;
        const ar = this.canvas.width / this.canvas.height;
        
        if (screenX !== null && screenY !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const nx = (screenX - rect.left) / rect.width;
            const ny = 1 - (screenY - rect.top) / rect.height; // Flip Y
            
            const fx = this.params.centerX + (nx - 0.5) * scale * ar;
            const fy = this.params.centerY + (ny - 0.5) * scale;
            
            this.params.centerX = fx + (this.params.centerX - fx) / factor;
            this.params.centerY = fy + (this.params.centerY - fy) / factor;
        }
        
        this.params.zoom *= factor;
        this.render();
    }
    
    pan(dx, dy) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = 4 / this.params.zoom;
        const ar = this.canvas.width / this.canvas.height;
        
        this.params.centerX -= (dx / rect.width) * scale * ar;
        this.params.centerY += (dy / rect.height) * scale; // Flip Y
        this.render();
    }
    
    reset() {
        const defaults = {
            mandelbrot: { x: -0.5, y: 0 },
            julia: { x: 0, y: 0 },
            burningship: { x: -0.4, y: -0.6 },
            'burning-ship': { x: -0.4, y: -0.6 },
            tricorn: { x: -0.3, y: 0 }
        };
        const d = defaults[this.params.fractalType] || { x: -0.5, y: 0 };
        this.params.centerX = d.x;
        this.params.centerY = d.y;
        this.params.zoom = 1;
        this.saveToHistory();
        this.render();
    }
    
    setFractalType(type) {
        console.log('[App] Setting fractal type:', type);
        this.params.fractalType = type;
        
        // Update UI
        document.querySelectorAll('[data-fractal]').forEach(el => {
            el.classList.toggle('active', el.dataset.fractal === type);
        });
        
        // Update button text
        const btn = document.getElementById('fractal-selector-btn');
        if (btn) {
            const nameEl = btn.querySelector('.fractal-name');
            if (nameEl) {
                const names = {
                    mandelbrot: 'Mandelbrot Set',
                    julia: 'Julia Set',
                    burningship: 'Burning Ship',
                    'burning-ship': 'Burning Ship',
                    tricorn: 'Tricorn'
                };
                nameEl.textContent = names[type] || type;
            }
        }
        
        // Close dropdown
        document.getElementById('fractal-dropdown')?.classList.remove('open');
        
        this.reset();
    }
    
    setMode(mode) {
        console.log('[App] Setting mode:', mode);
        // For now just log - 3D would need Three.js
        document.querySelectorAll('.mode-btn').forEach(el => {
            el.classList.toggle('active', el.id === 'mode-' + mode);
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // HISTORY (UNDO/REDO)
    // ═══════════════════════════════════════════════════════════════════════
    
    saveToHistory() {
        const state = {
            centerX: this.params.centerX,
            centerY: this.params.centerY,
            zoom: this.params.zoom,
            fractalType: this.params.fractalType
        };
        
        // Remove any future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(state);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        this.historyIndex = this.history.length - 1;
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
        }
    }
    
    restoreState(state) {
        this.params.centerX = state.centerX;
        this.params.centerY = state.centerY;
        this.params.zoom = state.zoom;
        this.params.fractalType = state.fractalType;
        this.render();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BOOKMARKS
    // ═══════════════════════════════════════════════════════════════════════
    
    loadBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('abyss-bookmarks') || '[]');
        } catch { return []; }
    }
    
    saveBookmarks() {
        localStorage.setItem('abyss-bookmarks', JSON.stringify(this.bookmarks));
    }
    
    addBookmark() {
        const bookmark = {
            id: Date.now(),
            name: `Bookmark ${this.bookmarks.length + 1}`,
            centerX: this.params.centerX,
            centerY: this.params.centerY,
            zoom: this.params.zoom,
            fractalType: this.params.fractalType,
            timestamp: new Date().toISOString()
        };
        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        this.showNotification('Bookmark added!');
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UTILITIES
    // ═══════════════════════════════════════════════════════════════════════
    
    screenshot() {
        const link = document.createElement('a');
        link.download = `abyss-${this.params.fractalType}-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        this.showNotification('Screenshot saved!');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }
    
    toggleModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.toggle('active');
        }
    }
    
    shareLocation() {
        const url = this.getShareURL();
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('URL copied to clipboard!');
        }).catch(() => {
            prompt('Copy this URL:', url);
        });
    }
    
    copyURL() {
        this.shareLocation();
    }
    
    getShareURL() {
        const p = this.params;
        const hash = `#x=${p.centerX}&y=${p.centerY}&z=${p.zoom}&f=${p.fractalType}&i=${p.maxIterations}`;
        return window.location.origin + window.location.pathname + hash;
    }
    
    randomLocation() {
        // Random interesting locations in Mandelbrot set
        const locations = [
            { x: -0.7436447860, y: 0.1318252536, z: 1e8 },
            { x: -0.7453, y: 0.1127, z: 5000 },
            { x: -0.16, y: 1.0405, z: 100 },
            { x: -1.25066, y: 0.02012, z: 2000 },
            { x: -0.748, y: 0.1, z: 300 },
            { x: 0.001643721971153, y: 0.822467633298876, z: 1e6 }
        ];
        const loc = locations[Math.floor(Math.random() * locations.length)];
        this.params.centerX = loc.x;
        this.params.centerY = loc.y;
        this.params.zoom = loc.z;
        this.saveToHistory();
        this.render();
        this.showNotification('Jumped to random location!');
    }
    
    showNotification(msg) {
        console.log('[App] Notification:', msg);
        // Try to use existing notification system
        const container = document.getElementById('notifications') || document.getElementById('toast-container');
        if (container) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = msg;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
    
    updateInfo() {
        const zoomEl = document.getElementById('zoom-level') || document.getElementById('info-zoom');
        if (zoomEl) {
            const exp = Math.log10(this.params.zoom);
            zoomEl.textContent = exp >= 3 ? `10^${exp.toFixed(1)}` : `${this.params.zoom.toFixed(2)}x`;
        }
        
        const coordRe = document.getElementById('coord-real');
        const coordIm = document.getElementById('coord-imag');
        if (coordRe) coordRe.textContent = this.params.centerX.toFixed(12);
        if (coordIm) coordIm.textContent = this.params.centerY.toFixed(12);
        
        const iterEl = document.getElementById('info-iterations');
        if (iterEl) iterEl.textContent = this.params.maxIterations;
    }
    
    updatePerformance(ms) {
        const el = document.getElementById('render-time') || document.getElementById('info-render-time');
        if (el) el.textContent = `${ms.toFixed(1)}ms`;
    }
    
    hideLoadingScreen() {
        const el = document.getElementById('loading-screen');
        if (el) {
            el.style.transition = 'opacity 0.5s';
            el.style.opacity = '0';
            setTimeout(() => el.style.display = 'none', 500);
        }
    }
    
    showError(msg) {
        const el = document.querySelector('.loading-text') || document.getElementById('loading-status');
        if (el) {
            el.textContent = `Error: ${msg}`;
            el.style.color = '#ff4444';
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════════════════

async function bootstrap() {
    console.log('[Bootstrap] Starting...');
    const app = new App();
    await app.init();
    window.AbyssExplorer = app;
    window.abyssExplorer = app;
    return app;
}

export { App, bootstrap };
export default App;
