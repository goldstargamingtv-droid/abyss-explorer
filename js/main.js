/**
 * ABYSS EXPLORER - Main Application (WebGL + Correct IDs)
 */

class App {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.isInitialized = false;
        
        this.params = {
            centerX: -0.5,
            centerY: 0,
            zoom: 1,
            maxIterations: 500,
            fractalType: 'mandelbrot',
            colorOffset: 0,
            juliaC: { x: -0.7, y: 0.27015 }
        };
        
        this.history = [];
        this.historyIndex = -1;
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
                vec3 a = vec3(0.0, 0.0, 0.02);
                vec3 b = vec3(0.9, 0.3, 0.0);
                vec3 c = vec3(1.0, 0.8, 0.2);
                vec3 d = vec3(1.0, 1.0, 0.6);
                t = fract(t + u_colorOffset);
                if (t < 0.33) return mix(a, b, t * 3.0);
                else if (t < 0.66) return mix(b, c, (t - 0.33) * 3.0);
                else return mix(c, d, (t - 0.66) * 3.0);
            }
            
            void main() {
                float scale = 4.0 / u_zoom;
                float x0 = u_center.x + (v_uv.x - 0.5) * scale * u_aspectRatio;
                float y0 = u_center.y + (v_uv.y - 0.5) * scale;
                
                float x = 0.0, y = 0.0;
                int iter = 0;
                
                if (u_fractalType == 1) {
                    x = x0; y = y0;
                    for (int i = 0; i < 10000; i++) {
                        if (i >= u_maxIter) break;
                        if (x*x + y*y > 4.0) break;
                        float xtemp = x*x - y*y + u_juliaC.x;
                        y = 2.0*x*y + u_juliaC.y;
                        x = xtemp;
                        iter++;
                    }
                } else if (u_fractalType == 2) {
                    for (int i = 0; i < 10000; i++) {
                        if (i >= u_maxIter) break;
                        if (x*x + y*y > 4.0) break;
                        float xtemp = x*x - y*y + x0;
                        y = abs(2.0*x*y) + y0;
                        x = xtemp;
                        iter++;
                    }
                } else if (u_fractalType == 3) {
                    for (int i = 0; i < 10000; i++) {
                        if (i >= u_maxIter) break;
                        if (x*x + y*y > 4.0) break;
                        float xtemp = x*x - y*y + x0;
                        y = -2.0*x*y + y0;
                        x = xtemp;
                        iter++;
                    }
                } else {
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
                    float smoothed = float(iter) + 1.0 - log2(log2(x*x + y*y + 1.0));
                    vec3 color = palette(smoothed / 100.0);
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
            this.canvas = document.getElementById('fractal-canvas-2d') || document.getElementById('fractal-canvas');
            if (!this.canvas) throw new Error('Canvas not found');
            console.log('[App] Canvas found:', this.canvas.id);
            
            this.updateLoadingStatus('Compiling shaders...', 40);
            await this.setupWebGL();
            console.log('[App] WebGL setup complete');
            
            this.setupCanvas();
            
            this.updateLoadingStatus('Setting up controls...', 60);
            this.setupEventListeners();
            this.setupUIControls();
            console.log('[App] Event listeners attached');
            
            this.updateLoadingStatus('Rendering fractal...', 80);
            this.saveToHistory();
            this.render();
            
            this.isInitialized = true;
            console.log('[App] ✅ Initialization complete!');
            
            this.updateLoadingStatus('Ready!', 100);
            await new Promise(r => setTimeout(r, 300));
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('[App] ❌ Init failed:', error);
            this.showError(error.message);
        }
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
        const vs = this.compileShader(gl.VERTEX_SHADER, this.getVertexShader());
        const fs = this.compileShader(gl.FRAGMENT_SHADER, this.getFragmentShader());
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Shader program failed: ' + gl.getProgramInfoLog(this.program));
        }
        
        const vertices = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const posLoc = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        
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
            throw new Error('Shader compile error: ' + gl.getShaderInfoLog(shader));
        }
        return shader;
    }
    
    setupCanvas() {
        const resize = () => {
            const rect = this.canvas.parentElement?.getBoundingClientRect() || 
                        { width: window.innerWidth, height: window.innerHeight };
            this.canvas.width = Math.floor(rect.width);
            this.canvas.height = Math.floor(rect.height);
            if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            if (this.isInitialized) this.render();
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
        
        gl.uniform2f(this.uniforms.center, this.params.centerX, this.params.centerY);
        gl.uniform1f(this.uniforms.zoom, this.params.zoom);
        gl.uniform1f(this.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        gl.uniform1i(this.uniforms.maxIter, this.params.maxIterations);
        gl.uniform1f(this.uniforms.colorOffset, this.params.colorOffset);
        gl.uniform2f(this.uniforms.juliaC, this.params.juliaC.x, this.params.juliaC.y);
        
        const types = { mandelbrot: 0, julia: 1, burningship: 2, 'burning-ship': 2, tricorn: 3, multibrot: 0 };
        gl.uniform1i(this.uniforms.fractalType, types[this.params.fractalType] || 0);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        this.updatePerformance(performance.now() - startTime);
        this.updateInfo();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════════════════
    
    setupEventListeners() {
        let isDragging = false, lastX, lastY;
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoomAt(e.deltaY > 0 ? 0.75 : 1.33, e.clientX, e.clientY);
        }, { passive: false });
        
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
        
        this.canvas.addEventListener('dblclick', (e) => {
            this.zoomAt(3, e.clientX, e.clientY);
            this.saveToHistory();
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
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
        switch (e.key.toLowerCase()) {
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
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // UI CONTROLS - Using CORRECT element IDs from HTML
    // ═══════════════════════════════════════════════════════════════════════
    
    setupUIControls() {
        console.log('[App] Setting up UI controls...');
        
        // === TOOLBAR BUTTONS ===
        this.bindClick('btn-home', () => this.reset());
        this.bindClick('btn-back', () => this.undo());
        this.bindClick('btn-forward', () => this.redo());
        this.bindClick('btn-undo', () => this.undo());
        this.bindClick('btn-redo', () => this.redo());
        this.bindClick('btn-zoom-in', () => { this.zoomAt(2); this.saveToHistory(); });
        this.bindClick('btn-zoom-out', () => { this.zoomAt(0.5); this.saveToHistory(); });
        this.bindClick('btn-reset-view', () => this.reset());
        this.bindClick('btn-fit-set', () => this.reset());
        this.bindClick('btn-center-origin', () => { this.params.centerX = 0; this.params.centerY = 0; this.render(); });
        
        // === EXPORT/SCREENSHOT ===
        this.bindClick('btn-screenshot', () => this.screenshot());
        this.bindClick('btn-export', () => this.toggleModal('modal-export'));
        this.bindClick('btn-share', () => this.toggleModal('modal-share'));
        this.bindClick('btn-copy-url', () => this.copyURL());
        
        // === FULLSCREEN ===
        this.bindClick('btn-fullscreen', () => this.toggleFullscreen());
        
        // === PANELS (use hidden attribute) ===
        this.bindClick('btn-history', () => this.togglePanel('history-panel'));
        this.bindClick('btn-history-sidebar', () => this.togglePanel('history-panel'));
        this.bindClick('btn-bookmarks', () => this.togglePanel('bookmarks-panel'));
        this.bindClick('btn-bookmarks-sidebar', () => this.togglePanel('bookmarks-panel'));
        
        // === MODALS (use active class) ===
        this.bindClick('btn-help', () => this.toggleModal('modal-help'));
        this.bindClick('btn-settings', () => this.toggleModal('modal-settings'));
        this.bindClick('btn-edit-palette', () => this.toggleModal('modal-palette'));
        
        // === BOOKMARK ===
        this.bindClick('btn-bookmark', () => this.addBookmark());
        
        // === RANDOM LOCATION ===
        this.bindClick('btn-random-location', () => this.randomLocation());
        
        // === 2D/3D MODE ===
        this.bindClick('mode-2d', () => this.setMode('2d'));
        this.bindClick('mode-3d', () => this.setMode('3d'));
        
        // === FRACTAL TYPE DROPDOWN ===
        // The dropdown button
        const fractalBtn = document.getElementById('fractal-selector-btn');
        const fractalDropdown = document.getElementById('fractal-dropdown');
        if (fractalBtn && fractalDropdown) {
            fractalBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fractalDropdown.classList.toggle('open');
                console.log('[App] Fractal dropdown toggled');
            });
        }
        
        // Fractal select dropdown (HTML select element)
        const fractalSelect = document.getElementById('fractal-select-2d');
        if (fractalSelect) {
            fractalSelect.addEventListener('change', (e) => {
                console.log('[App] Fractal select changed:', e.target.value);
                this.setFractalType(e.target.value);
            });
        }
        
        // Dropdown items with data-fractal attribute
        document.querySelectorAll('[data-fractal]').forEach(el => {
            el.addEventListener('click', (e) => {
                const type = el.dataset.fractal;
                console.log('[App] Fractal item clicked:', type);
                this.setFractalType(type);
                // Close dropdown
                if (fractalDropdown) fractalDropdown.classList.remove('open');
            });
        });
        
        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (fractalDropdown && !fractalDropdown.contains(e.target) && 
                fractalBtn && !fractalBtn.contains(e.target)) {
                fractalDropdown.classList.remove('open');
            }
        });
        
        // === ITERATIONS SLIDER (id="max-iterations") ===
        const iterSlider = document.getElementById('max-iterations');
        const iterValueInput = document.getElementById('max-iterations-value');
        
        if (iterSlider) {
            iterSlider.value = this.params.maxIterations;
            
            iterSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.params.maxIterations = val;
                if (iterValueInput) iterValueInput.value = val;
                console.log('[App] Iterations changed:', val);
                this.render();
            });
        }
        
        if (iterValueInput) {
            iterValueInput.value = this.params.maxIterations;
            
            iterValueInput.addEventListener('change', (e) => {
                const val = parseInt(e.target.value) || 500;
                this.params.maxIterations = val;
                if (iterSlider) iterSlider.value = val;
                console.log('[App] Iterations input changed:', val);
                this.render();
            });
        }
        
        // Quick iteration buttons (data-iter attribute)
        document.querySelectorAll('[data-iter]').forEach(el => {
            el.addEventListener('click', () => {
                const val = parseInt(el.dataset.iter);
                this.params.maxIterations = val;
                if (iterSlider) iterSlider.value = val;
                if (iterValueInput) iterValueInput.value = val;
                // Update active state
                document.querySelectorAll('[data-iter]').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
                console.log('[App] Quick iterations:', val);
                this.render();
            });
        });
        
        // === BAILOUT BUTTONS ===
        document.querySelectorAll('[data-bailout]').forEach(el => {
            el.addEventListener('click', () => {
                const val = parseInt(el.dataset.bailout);
                // Update active state
                document.querySelectorAll('[data-bailout]').forEach(b => b.classList.remove('active'));
                el.classList.add('active');
                console.log('[App] Bailout:', val);
                this.render();
            });
        });
        
        // === ZOOM BUTTONS ===
        document.querySelectorAll('[data-zoom]').forEach(el => {
            el.addEventListener('click', () => {
                const factor = parseFloat(el.dataset.zoom);
                this.zoomAt(factor);
                this.saveToHistory();
            });
        });
        
        // === GENERIC ACTION BUTTONS ===
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', () => {
                const action = el.dataset.action;
                console.log('[App] Action:', action);
                switch (action) {
                    case 'reset': this.reset(); break;
                    case 'undo': this.undo(); break;
                    case 'redo': this.redo(); break;
                    case 'screenshot': this.screenshot(); break;
                    case 'fullscreen': this.toggleFullscreen(); break;
                    case 'copy-url': this.copyURL(); break;
                    case 'random': this.randomLocation(); break;
                    case 'bookmark': this.addBookmark(); break;
                }
            });
        });
        
        // === SIDEBAR TOGGLE ===
        this.bindClick('sidebar-toggle', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('collapsed');
        });
        
        // === MODAL CLOSE BUTTONS ===
        document.querySelectorAll('.modal-close, [data-close-modal]').forEach(el => {
            el.addEventListener('click', () => {
                const modal = el.closest('.modal');
                if (modal) modal.classList.remove('active');
            });
        });
        
        // === MODAL OVERLAY CLICK ===
        document.querySelectorAll('.modal-overlay, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) {
                    const modal = el.closest('.modal');
                    if (modal) modal.classList.remove('active');
                }
            });
        });
        
        // === PANEL CLOSE BUTTONS ===
        document.querySelectorAll('.panel-close').forEach(el => {
            el.addEventListener('click', () => {
                const panel = el.closest('.slide-panel');
                if (panel) panel.hidden = true;
            });
        });
        
        // === PALETTE PRESET ===
        const paletteSelect = document.getElementById('palette-preset');
        if (paletteSelect) {
            paletteSelect.addEventListener('change', (e) => {
                console.log('[App] Palette changed:', e.target.value);
                // Could add palette switching here
                this.render();
            });
        }
        
        console.log('[App] UI controls setup complete');
    }
    
    bindClick(id, handler) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('[App] Button clicked:', id);
                handler();
            });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PANEL & MODAL TOGGLING
    // ═══════════════════════════════════════════════════════════════════════
    
    togglePanel(id) {
        const panel = document.getElementById(id);
        if (panel) {
            const isHidden = panel.hidden;
            // Close all panels first
            document.querySelectorAll('.slide-panel').forEach(p => p.hidden = true);
            // Toggle this one
            panel.hidden = !isHidden;
            console.log('[App] Panel toggled:', id, 'hidden:', panel.hidden);
        }
    }
    
    toggleModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.toggle('active');
            console.log('[App] Modal toggled:', id, 'active:', modal.classList.contains('active'));
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════
    
    zoomAt(factor, sx = null, sy = null) {
        const scale = 4 / this.params.zoom;
        const ar = this.canvas.width / this.canvas.height;
        
        if (sx !== null && sy !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const nx = (sx - rect.left) / rect.width;
            const ny = 1 - (sy - rect.top) / rect.height;
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
        this.params.centerY += (dy / rect.height) * scale;
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
        console.log('[App] View reset');
    }
    
    setFractalType(type) {
        console.log('[App] Setting fractal type:', type);
        this.params.fractalType = type;
        
        // Update select element
        const select = document.getElementById('fractal-select-2d');
        if (select) select.value = type;
        
        // Update dropdown items
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
                    tricorn: 'Tricorn',
                    multibrot: 'Multibrot'
                };
                nameEl.textContent = names[type] || type;
            }
        }
        
        this.reset();
    }
    
    setMode(mode) {
        console.log('[App] Setting mode:', mode);
        document.querySelectorAll('.mode-btn').forEach(el => {
            el.classList.toggle('active', el.id === 'mode-' + mode);
        });
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
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            Object.assign(this.params, this.history[this.historyIndex]);
            this.render();
            console.log('[App] Undo');
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            Object.assign(this.params, this.history[this.historyIndex]);
            this.render();
            console.log('[App] Redo');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BOOKMARKS
    // ═══════════════════════════════════════════════════════════════════════
    
    loadBookmarks() {
        try { return JSON.parse(localStorage.getItem('abyss-bookmarks') || '[]'); }
        catch { return []; }
    }
    
    saveBookmarks() {
        localStorage.setItem('abyss-bookmarks', JSON.stringify(this.bookmarks));
    }
    
    addBookmark() {
        this.bookmarks.push({
            id: Date.now(),
            name: `Bookmark ${this.bookmarks.length + 1}`,
            ...this.params,
            timestamp: new Date().toISOString()
        });
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
    
    copyURL() {
        const p = this.params;
        const url = `${location.origin}${location.pathname}#x=${p.centerX}&y=${p.centerY}&z=${p.zoom}&f=${p.fractalType}&i=${p.maxIterations}`;
        navigator.clipboard.writeText(url).then(() => {
            this.showNotification('URL copied!');
        }).catch(() => {
            prompt('Copy this URL:', url);
        });
    }
    
    randomLocation() {
        const locs = [
            { x: -0.7436447860, y: 0.1318252536, z: 1e8 },
            { x: -0.7453, y: 0.1127, z: 5000 },
            { x: -0.16, y: 1.0405, z: 100 },
            { x: -1.25066, y: 0.02012, z: 2000 },
            { x: 0.001643721971153, y: 0.822467633298876, z: 1e6 }
        ];
        const loc = locs[Math.floor(Math.random() * locs.length)];
        this.params.centerX = loc.x;
        this.params.centerY = loc.y;
        this.params.zoom = loc.z;
        this.saveToHistory();
        this.render();
        this.showNotification('Jumped to random location!');
    }
    
    showNotification(msg) {
        console.log('[App] Notification:', msg);
        const container = document.getElementById('toast-container');
        if (container) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = `<span class="toast-message">${msg}</span>`;
            container.appendChild(toast);
            // Trigger animation
            requestAnimationFrame(() => toast.classList.add('show'));
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
    
    updateInfo() {
        // Zoom displays
        const exp = Math.log10(this.params.zoom);
        const zoomText = exp >= 3 ? `10^${exp.toFixed(1)}` : `${this.params.zoom.toFixed(2)}x`;
        
        ['zoom-level', 'coord-zoom', 'zoom-level-value', 'zoom-mag'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = zoomText;
        });
        
        const zoomExp = document.getElementById('zoom-exponent') || document.getElementById('coord-zoom-exp');
        if (zoomExp) zoomExp.textContent = exp.toFixed(2);
        
        // Coordinate displays
        const coordRe = document.getElementById('coord-real') || document.getElementById('center-real');
        const coordIm = document.getElementById('coord-imag') || document.getElementById('center-imag');
        if (coordRe) coordRe.textContent = this.params.centerX.toFixed(12);
        if (coordIm) coordIm.textContent = this.params.centerY.toFixed(12);
        
        // Iteration display
        const iterEl = document.getElementById('coord-iter');
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
        if (el) { el.textContent = `Error: ${msg}`; el.style.color = '#ff4444'; }
    }
}

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
