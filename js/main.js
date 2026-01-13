/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ABYSS EXPLORER - Main Application Entry Point
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Self-contained fractal visualization application.
 * 
 * @author Abyss Explorer Contributors
 * @version 1.0.0
 * @license MIT
 */

// ═══════════════════════════════════════════════════════════════════════════
// APP CLASS - Main Application Controller
// ═══════════════════════════════════════════════════════════════════════════

class App {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.isRendering = false;
        this.renderWorker = null;
        
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
        
        // Color palettes
        this.palettes = {
            inferno: [
                [0, 0, 4], [22, 11, 57], [66, 10, 104], [106, 23, 110],
                [147, 38, 103], [186, 54, 85], [221, 81, 58], [243, 118, 27],
                [252, 165, 10], [246, 215, 70], [252, 255, 164]
            ],
            viridis: [
                [68, 1, 84], [72, 35, 116], [64, 67, 135], [52, 94, 141],
                [41, 120, 142], [32, 144, 140], [34, 167, 132], [68, 190, 112],
                [121, 209, 81], [189, 222, 38], [253, 231, 37]
            ],
            plasma: [
                [13, 8, 135], [65, 4, 157], [106, 0, 168], [143, 13, 163],
                [176, 42, 143], [203, 71, 119], [225, 100, 98], [242, 132, 75],
                [252, 166, 53], [252, 206, 37], [240, 249, 33]
            ],
            magma: [
                [0, 0, 4], [20, 14, 54], [56, 15, 99], [99, 19, 122],
                [142, 33, 124], [184, 55, 118], [222, 84, 108], [247, 124, 109],
                [254, 170, 129], [254, 216, 167], [252, 253, 191]
            ],
            ocean: [
                [0, 0, 32], [0, 16, 64], [0, 48, 96], [0, 80, 128],
                [0, 112, 160], [32, 144, 192], [80, 176, 208], [128, 208, 224],
                [176, 232, 240], [224, 248, 255]
            ],
            fire: [
                [0, 0, 0], [32, 0, 0], [64, 0, 0], [128, 0, 0],
                [192, 32, 0], [224, 64, 0], [255, 128, 0], [255, 192, 64],
                [255, 224, 128], [255, 255, 224]
            ],
            rainbow: [
                [255, 0, 0], [255, 128, 0], [255, 255, 0], [128, 255, 0],
                [0, 255, 0], [0, 255, 128], [0, 255, 255], [0, 128, 255],
                [0, 0, 255], [128, 0, 255], [255, 0, 255], [255, 0, 128]
            ],
            grayscale: [
                [0, 0, 0], [32, 32, 32], [64, 64, 64], [96, 96, 96],
                [128, 128, 128], [160, 160, 160], [192, 192, 192], [224, 224, 224],
                [255, 255, 255]
            ]
        };
    }
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('🌀 Abyss Explorer v1.0.0 initializing...');
        
        try {
            // Get canvas element
            this.canvas = document.getElementById('fractal-canvas-2d');
            if (!this.canvas) {
                // Fallback to alternate ID
                this.canvas = document.getElementById('fractal-canvas');
            }
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            // Set up canvas
            this.setupCanvas();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up UI controls
            this.setupUIControls();
            
            // Initial render
            await this.render();
            
            this.isInitialized = true;
            console.log('✅ Abyss Explorer initialized successfully!');
            
            // Hide loading screen
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * Set up canvas sizing
     */
    setupCanvas() {
        const resize = () => {
            const container = this.canvas.parentElement || document.body;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            if (this.isInitialized) {
                this.render();
            }
        };
        
        resize();
        window.addEventListener('resize', () => {
            resize();
        });
        
        this.ctx = this.canvas.getContext('2d');
    }
    
    /**
     * Set up mouse and keyboard event listeners
     */
    setupEventListeners() {
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.8 : 1.25;
            this.zoom(zoomFactor, e.clientX, e.clientY);
        }, { passive: false });
        
        // Mouse drag pan
        let isDragging = false;
        let lastX, lastY;
        
        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - lastX;
            const dy = e.clientY - lastY;
            
            this.pan(dx, dy);
            
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            this.canvas.style.cursor = 'crosshair';
        });
        
        // Double click to zoom in
        this.canvas.addEventListener('dblclick', (e) => {
            this.zoom(3, e.clientX, e.clientY);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Touch events for mobile
        this.setupTouchEvents();
    }
    
    /**
     * Set up touch events for mobile
     */
    setupTouchEvents() {
        let lastTouchDistance = 0;
        let lastTouchX = 0;
        let lastTouchY = 0;
        let isTouching = false;
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isTouching = true;
            
            if (e.touches.length === 1) {
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                lastTouchDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isTouching) return;
            
            if (e.touches.length === 1) {
                const dx = e.touches[0].clientX - lastTouchX;
                const dy = e.touches[0].clientY - lastTouchY;
                this.pan(dx, dy);
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                if (lastTouchDistance > 0) {
                    const zoomFactor = distance / lastTouchDistance;
                    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    this.zoom(zoomFactor, centerX, centerY);
                }
                
                lastTouchDistance = distance;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            isTouching = false;
            lastTouchDistance = 0;
        });
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key.toLowerCase()) {
            case 'r':
                this.reset();
                break;
            case '+':
            case '=':
                this.zoom(1.5);
                break;
            case '-':
            case '_':
                this.zoom(0.67);
                break;
            case 'arrowup':
                e.preventDefault();
                this.pan(0, 100);
                break;
            case 'arrowdown':
                e.preventDefault();
                this.pan(0, -100);
                break;
            case 'arrowleft':
                e.preventDefault();
                this.pan(100, 0);
                break;
            case 'arrowright':
                e.preventDefault();
                this.pan(-100, 0);
                break;
            case 's':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    this.exportImage();
                }
                break;
            case 'f':
                this.toggleFullscreen();
                break;
            case ' ':
                e.preventDefault();
                this.reset();
                break;
        }
    }
    
    /**
     * Set up UI control bindings
     */
    setupUIControls() {
        // Fractal type selector
        document.querySelectorAll('[data-fractal-type]').forEach(el => {
            el.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.fractalType;
                this.setFractalType(type);
            });
        });
        
        const fractalSelect = document.getElementById('fractal-type');
        if (fractalSelect) {
            fractalSelect.addEventListener('change', (e) => {
                this.setFractalType(e.target.value);
            });
        }
        
        // Iterations slider
        const iterSlider = document.getElementById('max-iterations');
        const iterValue = document.getElementById('iterations-value');
        if (iterSlider) {
            iterSlider.addEventListener('input', (e) => {
                this.params.maxIterations = parseInt(e.target.value);
                if (iterValue) iterValue.textContent = e.target.value;
                this.render();
            });
        }
        
        // Palette selector
        document.querySelectorAll('[data-palette]').forEach(el => {
            el.addEventListener('click', (e) => {
                const palette = e.currentTarget.dataset.palette;
                this.params.palette = palette;
                this.render();
            });
        });
        
        const paletteSelect = document.getElementById('palette');
        if (paletteSelect) {
            paletteSelect.addEventListener('change', (e) => {
                this.params.palette = e.target.value;
                this.render();
            });
        }
        
        // Reset button
        document.querySelectorAll('[data-action="reset"]').forEach(el => {
            el.addEventListener('click', () => this.reset());
        });
        
        // Export button
        document.querySelectorAll('[data-action="export"]').forEach(el => {
            el.addEventListener('click', () => this.exportImage());
        });
        
        // Fullscreen button
        document.querySelectorAll('[data-action="fullscreen"]').forEach(el => {
            el.addEventListener('click', () => this.toggleFullscreen());
        });
        
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
        
        // Close buttons for modals
        document.querySelectorAll('.modal-close').forEach(el => {
            el.addEventListener('click', () => {
                el.closest('.modal')?.classList.remove('active');
            });
        });
        
        document.querySelectorAll('.modal-overlay').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el) {
                    el.closest('.modal')?.classList.remove('active');
                }
            });
        });
    }
    
    /**
     * Zoom the view
     */
    zoom(factor, screenX = null, screenY = null) {
        if (screenX !== null && screenY !== null) {
            const scale = 4 / this.params.zoom;
            const aspectRatio = this.canvas.width / this.canvas.height;
            
            const fractalX = this.params.centerX + (screenX / this.canvas.width - 0.5) * scale * aspectRatio;
            const fractalY = this.params.centerY + (screenY / this.canvas.height - 0.5) * scale;
            
            this.params.centerX = fractalX + (this.params.centerX - fractalX) / factor;
            this.params.centerY = fractalY + (this.params.centerY - fractalY) / factor;
        }
        
        this.params.zoom *= factor;
        this.updateInfo();
        this.render();
    }
    
    /**
     * Pan the view
     */
    pan(dx, dy) {
        const scale = 4 / this.params.zoom;
        const aspectRatio = this.canvas.width / this.canvas.height;
        
        this.params.centerX -= (dx / this.canvas.width) * scale * aspectRatio;
        this.params.centerY -= (dy / this.canvas.height) * scale;
        
        this.updateInfo();
        this.render();
    }
    
    /**
     * Reset to default view
     */
    reset() {
        const defaults = {
            mandelbrot: { x: -0.5, y: 0 },
            julia: { x: 0, y: 0 },
            burningship: { x: -0.4, y: -0.6 },
            tricorn: { x: -0.3, y: 0 },
            newton: { x: 0, y: 0 },
            phoenix: { x: 0, y: 0 }
        };
        
        const def = defaults[this.params.fractalType] || { x: 0, y: 0 };
        this.params.centerX = def.x;
        this.params.centerY = def.y;
        this.params.zoom = 1;
        
        this.updateInfo();
        this.render();
    }
    
    /**
     * Set the fractal type
     */
    setFractalType(type) {
        this.params.fractalType = type;
        this.reset();
        
        // Update UI
        document.querySelectorAll('[data-fractal-type]').forEach(el => {
            el.classList.toggle('active', el.dataset.fractalType === type);
        });
    }
    
    /**
     * Render the fractal
     */
    async render() {
        if (!this.ctx || this.isRendering) return;
        this.isRendering = true;
        
        const startTime = performance.now();
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;
        
        const { centerX, centerY, zoom, maxIterations, fractalType, palette, juliaC } = this.params;
        const scale = 4 / zoom;
        const aspectRatio = width / height;
        
        const colors = this.palettes[palette] || this.palettes.inferno;
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const x0 = centerX + (px / width - 0.5) * scale * aspectRatio;
                const y0 = centerY + (py / height - 0.5) * scale;
                
                const result = this.iterate(x0, y0, maxIterations, fractalType, juliaC);
                
                const idx = (py * width + px) * 4;
                
                if (result.iterations === maxIterations) {
                    data[idx] = 0;
                    data[idx + 1] = 0;
                    data[idx + 2] = 0;
                } else {
                    // Smooth coloring
                    const smoothIter = result.iterations + 1 - Math.log2(Math.log2(result.magnitude + 1));
                    const t = (smoothIter % colors.length) / colors.length;
                    const colorIdx = Math.floor(t * (colors.length - 1));
                    const nextIdx = Math.min(colorIdx + 1, colors.length - 1);
                    const frac = t * (colors.length - 1) - colorIdx;
                    
                    const c1 = colors[colorIdx];
                    const c2 = colors[nextIdx];
                    
                    data[idx] = Math.floor(c1[0] + (c2[0] - c1[0]) * frac);
                    data[idx + 1] = Math.floor(c1[1] + (c2[1] - c1[1]) * frac);
                    data[idx + 2] = Math.floor(c1[2] + (c2[2] - c1[2]) * frac);
                }
                data[idx + 3] = 255;
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        
        const elapsed = performance.now() - startTime;
        this.updatePerformance(elapsed);
        this.isRendering = false;
    }
    
    /**
     * Calculate iterations for a point
     */
    iterate(x0, y0, maxIter, type, juliaC) {
        let x = 0, y = 0;
        let iteration = 0;
        let x2 = 0, y2 = 0;
        
        switch (type) {
            case 'mandelbrot':
                while (x2 + y2 <= 4 && iteration < maxIter) {
                    y = 2 * x * y + y0;
                    x = x2 - y2 + x0;
                    x2 = x * x;
                    y2 = y * y;
                    iteration++;
                }
                break;
                
            case 'julia':
                x = x0;
                y = y0;
                x2 = x * x;
                y2 = y * y;
                while (x2 + y2 <= 4 && iteration < maxIter) {
                    y = 2 * x * y + juliaC.y;
                    x = x2 - y2 + juliaC.x;
                    x2 = x * x;
                    y2 = y * y;
                    iteration++;
                }
                break;
                
            case 'burningship':
                while (x2 + y2 <= 4 && iteration < maxIter) {
                    y = Math.abs(2 * x * y) + y0;
                    x = x2 - y2 + x0;
                    x2 = x * x;
                    y2 = y * y;
                    iteration++;
                }
                break;
                
            case 'tricorn':
                while (x2 + y2 <= 4 && iteration < maxIter) {
                    y = -2 * x * y + y0;
                    x = x2 - y2 + x0;
                    x2 = x * x;
                    y2 = y * y;
                    iteration++;
                }
                break;
                
            case 'phoenix':
                let px = 0, py = 0;
                x = x0;
                y = y0;
                const p = -0.5, q = 0;
                while (x * x + y * y <= 4 && iteration < maxIter) {
                    const newX = x * x - y * y + p + q * px;
                    const newY = 2 * x * y + q * py;
                    px = x;
                    py = y;
                    x = newX;
                    y = newY;
                    iteration++;
                }
                x2 = x * x;
                y2 = y * y;
                break;
                
            default:
                while (x2 + y2 <= 4 && iteration < maxIter) {
                    y = 2 * x * y + y0;
                    x = x2 - y2 + x0;
                    x2 = x * x;
                    y2 = y * y;
                    iteration++;
                }
        }
        
        return {
            iterations: iteration,
            magnitude: Math.sqrt(x2 + y2)
        };
    }
    
    /**
     * Export current view as image
     */
    exportImage() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `abyss-explorer-${this.params.fractalType}-${timestamp}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen not available:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    /**
     * Update info display
     */
    updateInfo() {
        const zoomDisplay = document.getElementById('zoom-level');
        if (zoomDisplay) {
            const zoomExp = Math.log10(this.params.zoom);
            if (zoomExp >= 3) {
                zoomDisplay.textContent = `10^${zoomExp.toFixed(1)}`;
            } else {
                zoomDisplay.textContent = `${this.params.zoom.toFixed(2)}x`;
            }
        }
        
        const coordDisplay = document.getElementById('coordinates');
        if (coordDisplay) {
            const x = this.params.centerX.toFixed(12);
            const y = this.params.centerY.toFixed(12);
            const sign = this.params.centerY >= 0 ? '+' : '';
            coordDisplay.textContent = `${x} ${sign}${y}i`;
        }
        
        const iterDisplay = document.getElementById('iterations-display');
        if (iterDisplay) {
            iterDisplay.textContent = this.params.maxIterations;
        }
    }
    
    /**
     * Update performance display
     */
    updatePerformance(renderTime) {
        const perfDisplay = document.getElementById('render-time');
        if (perfDisplay) {
            perfDisplay.textContent = `${renderTime.toFixed(0)}ms`;
        }
        
        const fpsDisplay = document.getElementById('fps');
        if (fpsDisplay) {
            const fps = Math.round(1000 / renderTime);
            fpsDisplay.textContent = `${fps} FPS`;
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.5s ease';
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `Error: ${message}`;
            loadingText.style.color = '#ff4444';
        }
        console.error('App Error:', message);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOTSTRAP
// ═══════════════════════════════════════════════════════════════════════════

async function bootstrap() {
    const app = new App();
    await app.init();
    window.abyssExplorer = app;
    return app;
}

export { App, bootstrap };
export default App;
