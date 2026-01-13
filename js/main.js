/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ABYSS EXPLORER - Main Application (Optimized)
 * ═══════════════════════════════════════════════════════════════════════════
 */

class App {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.isRendering = false;
        this.renderAborted = false;
        this.imageData = null;
        
        // Fractal parameters
        this.params = {
            centerX: -0.5,
            centerY: 0,
            zoom: 1,
            maxIterations: 500,
            fractalType: 'mandelbrot',
            palette: 'inferno',
            juliaC: { x: -0.7, y: 0.27015 }
        };
        
        // Render settings
        this.chunkSize = 50; // Rows per chunk
        
        // Color palettes (pre-computed for speed)
        this.paletteColors = null;
        this.initPalettes();
    }
    
    initPalettes() {
        this.palettes = {
            inferno: [[0,0,4],[22,11,57],[66,10,104],[106,23,110],[147,38,103],[186,54,85],[221,81,58],[243,118,27],[252,165,10],[246,215,70],[252,255,164]],
            viridis: [[68,1,84],[72,35,116],[64,67,135],[52,94,141],[41,120,142],[32,144,140],[34,167,132],[68,190,112],[121,209,81],[189,222,38],[253,231,37]],
            plasma: [[13,8,135],[65,4,157],[106,0,168],[143,13,163],[176,42,143],[203,71,119],[225,100,98],[242,132,75],[252,166,53],[252,206,37],[240,249,33]],
            magma: [[0,0,4],[20,14,54],[56,15,99],[99,19,122],[142,33,124],[184,55,118],[222,84,108],[247,124,109],[254,170,129],[254,216,167],[252,253,191]],
            ocean: [[0,0,32],[0,16,64],[0,48,96],[0,80,128],[0,112,160],[32,144,192],[80,176,208],[128,208,224],[176,232,240],[224,248,255]],
            fire: [[0,0,0],[32,0,0],[64,0,0],[128,0,0],[192,32,0],[224,64,0],[255,128,0],[255,192,64],[255,224,128],[255,255,224]],
            rainbow: [[255,0,0],[255,128,0],[255,255,0],[128,255,0],[0,255,0],[0,255,128],[0,255,255],[0,128,255],[0,0,255],[128,0,255],[255,0,255],[255,0,128]],
            grayscale: [[0,0,0],[32,32,32],[64,64,64],[96,96,96],[128,128,128],[160,160,160],[192,192,192],[224,224,224],[255,255,255]]
        };
        
        // Pre-compute expanded palette (256 colors for smooth gradients)
        this.expandPalette('inferno');
    }
    
    expandPalette(name) {
        const source = this.palettes[name] || this.palettes.inferno;
        this.paletteColors = new Uint8Array(256 * 3);
        
        for (let i = 0; i < 256; i++) {
            const t = i / 255 * (source.length - 1);
            const idx = Math.floor(t);
            const frac = t - idx;
            const c1 = source[idx];
            const c2 = source[Math.min(idx + 1, source.length - 1)];
            
            this.paletteColors[i * 3] = Math.floor(c1[0] + (c2[0] - c1[0]) * frac);
            this.paletteColors[i * 3 + 1] = Math.floor(c1[1] + (c2[1] - c1[1]) * frac);
            this.paletteColors[i * 3 + 2] = Math.floor(c1[2] + (c2[2] - c1[2]) * frac);
        }
    }
    
    async init() {
        console.log('🌀 Abyss Explorer v1.0.0 initializing...');
        
        try {
            this.canvas = document.getElementById('fractal-canvas-2d') || document.getElementById('fractal-canvas');
            if (!this.canvas) throw new Error('Canvas element not found');
            
            this.setupCanvas();
            this.setupEventListeners();
            this.setupUIControls();
            
            // Show loading progress
            this.updateLoadingStatus('Preparing render engine...', 50);
            
            // Small delay to let UI update
            await new Promise(r => setTimeout(r, 100));
            
            this.updateLoadingStatus('Rendering initial view...', 70);
            
            // Render with progress updates
            await this.render();
            
            this.isInitialized = true;
            console.log('✅ Abyss Explorer initialized successfully!');
            
            this.updateLoadingStatus('Ready!', 100);
            await new Promise(r => setTimeout(r, 300));
            
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError(error.message);
        }
    }
    
    updateLoadingStatus(message, progress) {
        const status = document.getElementById('loading-status');
        const bar = document.getElementById('loading-progress-bar');
        if (status) status.textContent = message;
        if (bar) bar.style.width = `${progress}%`;
    }
    
    setupCanvas() {
        const resize = () => {
            // Use 1:1 pixel ratio for performance
            const rect = this.canvas.parentElement?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
            
            this.canvas.width = Math.floor(rect.width);
            this.canvas.height = Math.floor(rect.height);
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';
            
            if (this.isInitialized) {
                this.render();
            }
        };
        
        resize();
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resize, 150);
        });
        
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.ctx.imageSmoothingEnabled = false;
    }
    
    setupEventListeners() {
        let isDragging = false;
        let lastX, lastY;
        let lastRenderTime = 0;
        const throttleMs = 50; // Throttle during interactions
        
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const now = Date.now();
            if (now - lastRenderTime < throttleMs) return;
            lastRenderTime = now;
            
            const zoomFactor = e.deltaY > 0 ? 0.75 : 1.33;
            this.zoom(zoomFactor, e.clientX, e.clientY);
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
            
            const now = Date.now();
            if (now - lastRenderTime < throttleMs) return;
            lastRenderTime = now;
            
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            this.pan(dx, dy);
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.canvas.style.cursor = 'crosshair';
                // Full quality render after drag
                this.render();
            }
        });
        
        // Double click zoom
        this.canvas.addEventListener('dblclick', (e) => {
            this.zoom(3, e.clientX, e.clientY);
        });
        
        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Touch
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        let lastDist = 0, lastX = 0, lastY = 0, touching = false;
        let lastRenderTime = 0;
        const throttleMs = 50;
        
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
            
            const now = Date.now();
            if (now - lastRenderTime < throttleMs) return;
            lastRenderTime = now;
            
            if (e.touches.length === 1) {
                const dx = e.touches[0].clientX - lastX;
                const dy = e.touches[0].clientY - lastY;
                this.pan(dx, dy);
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
                    this.zoom(dist / lastDist, cx, cy);
                }
                lastDist = dist;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            touching = false;
            lastDist = 0;
            this.render(); // Full quality
        });
    }
    
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key.toLowerCase()) {
            case 'r': case ' ': e.preventDefault(); this.reset(); break;
            case '+': case '=': this.zoom(1.5); break;
            case '-': case '_': this.zoom(0.67); break;
            case 'arrowup': e.preventDefault(); this.pan(0, 100); break;
            case 'arrowdown': e.preventDefault(); this.pan(0, -100); break;
            case 'arrowleft': e.preventDefault(); this.pan(100, 0); break;
            case 'arrowright': e.preventDefault(); this.pan(-100, 0); break;
            case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); this.exportImage(); } break;
            case 'f': this.toggleFullscreen(); break;
        }
    }
    
    setupUIControls() {
        // Fractal type
        document.querySelectorAll('[data-fractal-type]').forEach(el => {
            el.addEventListener('click', () => this.setFractalType(el.dataset.fractalType));
        });
        
        const fractalSelect = document.getElementById('fractal-type');
        if (fractalSelect) {
            fractalSelect.addEventListener('change', (e) => this.setFractalType(e.target.value));
        }
        
        // Iterations
        const iterSlider = document.getElementById('max-iterations');
        const iterValue = document.getElementById('iterations-value');
        if (iterSlider) {
            iterSlider.addEventListener('input', (e) => {
                this.params.maxIterations = parseInt(e.target.value);
                if (iterValue) iterValue.textContent = e.target.value;
            });
            iterSlider.addEventListener('change', () => this.render());
        }
        
        // Palette
        document.querySelectorAll('[data-palette]').forEach(el => {
            el.addEventListener('click', () => {
                this.params.palette = el.dataset.palette;
                this.expandPalette(el.dataset.palette);
                this.render();
            });
        });
        
        const paletteSelect = document.getElementById('palette');
        if (paletteSelect) {
            paletteSelect.addEventListener('change', (e) => {
                this.params.palette = e.target.value;
                this.expandPalette(e.target.value);
                this.render();
            });
        }
        
        // Buttons
        document.querySelectorAll('[data-action="reset"]').forEach(el => el.addEventListener('click', () => this.reset()));
        document.querySelectorAll('[data-action="export"]').forEach(el => el.addEventListener('click', () => this.exportImage()));
        document.querySelectorAll('[data-action="fullscreen"]').forEach(el => el.addEventListener('click', () => this.toggleFullscreen()));
        
        // Sidebar
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
        }
        
        // Modals
        document.querySelectorAll('.modal-close').forEach(el => {
            el.addEventListener('click', () => el.closest('.modal')?.classList.remove('active'));
        });
    }
    
    zoom(factor, sx = null, sy = null) {
        const scale = 4 / this.params.zoom;
        const ar = this.canvas.width / this.canvas.height;
        
        if (sx !== null && sy !== null) {
            const rect = this.canvas.getBoundingClientRect();
            const nx = (sx - rect.left) / rect.width;
            const ny = (sy - rect.top) / rect.height;
            
            const fx = this.params.centerX + (nx - 0.5) * scale * ar;
            const fy = this.params.centerY + (ny - 0.5) * scale;
            
            this.params.centerX = fx + (this.params.centerX - fx) / factor;
            this.params.centerY = fy + (this.params.centerY - fy) / factor;
        }
        
        this.params.zoom *= factor;
        this.updateInfo();
        this.render();
    }
    
    pan(dx, dy) {
        const rect = this.canvas.getBoundingClientRect();
        const scale = 4 / this.params.zoom;
        const ar = this.canvas.width / this.canvas.height;
        
        this.params.centerX -= (dx / rect.width) * scale * ar;
        this.params.centerY -= (dy / rect.height) * scale;
        
        this.updateInfo();
        this.render();
    }
    
    reset() {
        const defaults = {
            mandelbrot: { x: -0.5, y: 0 },
            julia: { x: 0, y: 0 },
            burningship: { x: -0.4, y: -0.6 },
            tricorn: { x: -0.3, y: 0 }
        };
        const d = defaults[this.params.fractalType] || { x: 0, y: 0 };
        this.params.centerX = d.x;
        this.params.centerY = d.y;
        this.params.zoom = 1;
        this.updateInfo();
        this.render();
    }
    
    setFractalType(type) {
        this.params.fractalType = type;
        document.querySelectorAll('[data-fractal-type]').forEach(el => {
            el.classList.toggle('active', el.dataset.fractalType === type);
        });
        this.reset();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // OPTIMIZED CHUNKED RENDERING
    // ═══════════════════════════════════════════════════════════════════════
    
    async render() {
        if (this.isRendering) {
            this.renderAborted = true;
            return;
        }
        
        this.isRendering = true;
        this.renderAborted = false;
        
        const startTime = performance.now();
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        if (!this.imageData || this.imageData.width !== w || this.imageData.height !== h) {
            this.imageData = this.ctx.createImageData(w, h);
        }
        
        const data = this.imageData.data;
        const { centerX, centerY, zoom, maxIterations, fractalType, juliaC } = this.params;
        const scale = 4 / zoom;
        const ar = w / h;
        const palette = this.paletteColors;
        
        // Render in chunks to keep UI responsive
        const chunkSize = this.chunkSize;
        
        for (let startY = 0; startY < h; startY += chunkSize) {
            if (this.renderAborted) break;
            
            const endY = Math.min(startY + chunkSize, h);
            
            // Render chunk
            for (let py = startY; py < endY; py++) {
                const y0Base = centerY + (py / h - 0.5) * scale;
                
                for (let px = 0; px < w; px++) {
                    const x0 = centerX + (px / w - 0.5) * scale * ar;
                    const y0 = y0Base;
                    
                    let iter, mag;
                    
                    // Inline iteration for speed
                    if (fractalType === 'mandelbrot') {
                        let x = 0, y = 0, x2 = 0, y2 = 0;
                        iter = 0;
                        while (x2 + y2 <= 4 && iter < maxIterations) {
                            y = 2 * x * y + y0;
                            x = x2 - y2 + x0;
                            x2 = x * x;
                            y2 = y * y;
                            iter++;
                        }
                        mag = x2 + y2;
                    } else if (fractalType === 'julia') {
                        let x = x0, y = y0, x2 = x * x, y2 = y * y;
                        iter = 0;
                        while (x2 + y2 <= 4 && iter < maxIterations) {
                            y = 2 * x * y + juliaC.y;
                            x = x2 - y2 + juliaC.x;
                            x2 = x * x;
                            y2 = y * y;
                            iter++;
                        }
                        mag = x2 + y2;
                    } else if (fractalType === 'burningship') {
                        let x = 0, y = 0, x2 = 0, y2 = 0;
                        iter = 0;
                        while (x2 + y2 <= 4 && iter < maxIterations) {
                            y = Math.abs(2 * x * y) + y0;
                            x = x2 - y2 + x0;
                            x2 = x * x;
                            y2 = y * y;
                            iter++;
                        }
                        mag = x2 + y2;
                    } else if (fractalType === 'tricorn') {
                        let x = 0, y = 0, x2 = 0, y2 = 0;
                        iter = 0;
                        while (x2 + y2 <= 4 && iter < maxIterations) {
                            y = -2 * x * y + y0;
                            x = x2 - y2 + x0;
                            x2 = x * x;
                            y2 = y * y;
                            iter++;
                        }
                        mag = x2 + y2;
                    } else {
                        // Default mandelbrot
                        let x = 0, y = 0, x2 = 0, y2 = 0;
                        iter = 0;
                        while (x2 + y2 <= 4 && iter < maxIterations) {
                            y = 2 * x * y + y0;
                            x = x2 - y2 + x0;
                            x2 = x * x;
                            y2 = y * y;
                            iter++;
                        }
                        mag = x2 + y2;
                    }
                    
                    const idx = (py * w + px) * 4;
                    
                    if (iter === maxIterations) {
                        data[idx] = 0;
                        data[idx + 1] = 0;
                        data[idx + 2] = 0;
                    } else {
                        // Smooth coloring
                        const smoothed = iter + 1 - Math.log2(Math.log2(mag + 1));
                        const colorIdx = Math.floor((smoothed * 4) % 256);
                        const ci = Math.max(0, Math.min(255, colorIdx)) * 3;
                        
                        data[idx] = palette[ci];
                        data[idx + 1] = palette[ci + 1];
                        data[idx + 2] = palette[ci + 2];
                    }
                    data[idx + 3] = 255;
                }
            }
            
            // Yield to browser every chunk
            if (startY + chunkSize < h) {
                this.ctx.putImageData(this.imageData, 0, 0);
                await new Promise(r => setTimeout(r, 0));
            }
        }
        
        // Final draw
        this.ctx.putImageData(this.imageData, 0, 0);
        
        const elapsed = performance.now() - startTime;
        this.updatePerformance(elapsed);
        this.isRendering = false;
        
        // If aborted, re-render with new params
        if (this.renderAborted) {
            this.renderAborted = false;
            this.render();
        }
    }
    
    exportImage() {
        const link = document.createElement('a');
        link.download = `abyss-${this.params.fractalType}-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }
    
    updateInfo() {
        const zoomEl = document.getElementById('zoom-level');
        if (zoomEl) {
            const exp = Math.log10(this.params.zoom);
            zoomEl.textContent = exp >= 3 ? `10^${exp.toFixed(1)}` : `${this.params.zoom.toFixed(2)}x`;
        }
        
        const coordEl = document.getElementById('coordinates');
        if (coordEl) {
            const sign = this.params.centerY >= 0 ? '+' : '';
            coordEl.textContent = `${this.params.centerX.toFixed(10)} ${sign}${this.params.centerY.toFixed(10)}i`;
        }
    }
    
    updatePerformance(ms) {
        const el = document.getElementById('render-time');
        if (el) el.textContent = `${ms.toFixed(0)}ms`;
        
        const fps = document.getElementById('fps');
        if (fps) fps.textContent = `${Math.round(1000 / ms)} FPS`;
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
        const el = document.querySelector('.loading-text');
        if (el) {
            el.textContent = `Error: ${msg}`;
            el.style.color = '#ff4444';
        }
    }
}

async function bootstrap() {
    const app = new App();
    await app.init();
    window.abyssExplorer = app;
    return app;
}

export { App, bootstrap };
export default App;
