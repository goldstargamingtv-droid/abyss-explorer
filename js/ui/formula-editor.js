/**
 * ============================================================================
 * ABYSS EXPLORER - FORMULA EDITOR
 * ============================================================================
 * 
 * Custom formula input modal with syntax highlighting, validation,
 * variable sliders, and live preview.
 * 
 * Supported Syntax:
 * - Variables: z, c, n (iteration)
 * - Operators: +, -, *, /, ^, %
 * - Functions: sin, cos, tan, exp, log, abs, sqrt, conj, real, imag
 * - Constants: pi, e, i
 * - Complex literals: (a + bi), (a, b)
 * 
 * @module ui/formula-editor
 * @author Abyss Explorer Team
 * @version 1.0.0
 */

// ============================================================================
// SYNTAX HIGHLIGHTING RULES
// ============================================================================

const SYNTAX_RULES = [
    { pattern: /\b(z|c|n)\b/g, class: 'variable' },
    { pattern: /\b(sin|cos|tan|exp|log|abs|sqrt|conj|real|imag|norm|arg|pow)\b/g, class: 'function' },
    { pattern: /\b(pi|e|i)\b/g, class: 'constant' },
    { pattern: /\b\d+\.?\d*\b/g, class: 'number' },
    { pattern: /[+\-*\/\^%=]/g, class: 'operator' },
    { pattern: /[()]/g, class: 'paren' },
    { pattern: /\/\/.*/g, class: 'comment' }
];

// ============================================================================
// PRESET FORMULAS
// ============================================================================

const PRESET_FORMULAS = [
    {
        name: 'Mandelbrot',
        formula: 'z^2 + c',
        description: 'The classic Mandelbrot formula'
    },
    {
        name: 'Cubic',
        formula: 'z^3 + c',
        description: 'Cubic Mandelbrot variant'
    },
    {
        name: 'Burning Ship',
        formula: '(abs(real(z)) + i*abs(imag(z)))^2 + c',
        description: 'Burning Ship fractal'
    },
    {
        name: 'Tricorn',
        formula: 'conj(z)^2 + c',
        description: 'Mandelbar/Tricorn'
    },
    {
        name: 'Phoenix',
        formula: 'z^2 + c + p*z_prev',
        description: 'Phoenix with memory term (p=0.5)'
    },
    {
        name: 'Sine',
        formula: 'c * sin(z)',
        description: 'Sine fractal'
    },
    {
        name: 'Cosine',
        formula: 'c * cos(z)',
        description: 'Cosine fractal'
    },
    {
        name: 'Exponential',
        formula: 'exp(z) + c',
        description: 'Exponential fractal'
    },
    {
        name: 'Newton z³-1',
        formula: 'z - (z^3 - 1) / (3 * z^2)',
        description: 'Newton iteration for z³-1'
    },
    {
        name: 'Magnet Type I',
        formula: '((z^2 + c - 1) / (2*z + c - 2))^2',
        description: 'Magnet fractal Type I'
    },
    {
        name: 'Multi-Mandelbrot',
        formula: 'z^n + c',
        description: 'Mandelbrot with variable power (n)'
    }
];

// ============================================================================
// FORMULA EDITOR CLASS
// ============================================================================

export class FormulaEditor {
    /**
     * Create formula editor
     * @param {Object} options - Options
     */
    constructor(options = {}) {
        this.manager = options.manager || null;
        this.container = options.container || null;
        
        // State
        this.formula = options.formula || 'z^2 + c';
        this.variables = {
            n: { value: 2, min: 2, max: 10, step: 0.1, label: 'Power (n)' },
            p: { value: 0.5, min: -2, max: 2, step: 0.01, label: 'Parameter (p)' },
            a: { value: 1, min: -2, max: 2, step: 0.01, label: 'Parameter (a)' },
            b: { value: 0, min: -2, max: 2, step: 0.01, label: 'Parameter (b)' }
        };
        
        this.validationError = null;
        this.autoPreview = options.autoPreview ?? true;
        
        // Elements
        this.element = null;
        this.textArea = null;
        this.highlightArea = null;
        this.errorDisplay = null;
        this.previewCanvas = null;
        
        // Preview renderer
        this.previewCtx = null;
        this.previewWorker = null;
        this.previewDebounce = null;
        
        // Build
        if (this.container) {
            this._build();
        }
    }
    
    /**
     * Set UI manager reference
     */
    setManager(manager) {
        this.manager = manager;
    }
    
    // ========================================================================
    // BUILD
    // ========================================================================
    
    /**
     * Build formula editor DOM
     * @private
     */
    _build() {
        this.element = document.createElement('div');
        this.element.className = 'formula-editor';
        this.element.setAttribute('role', 'dialog');
        this.element.setAttribute('aria-label', 'Formula Editor');
        
        this.element.innerHTML = `
            <div class="formula-layout">
                <aside class="formula-sidebar">
                    <h4>Preset Formulas</h4>
                    <div class="formula-presets">
                        ${PRESET_FORMULAS.map(p => `
                            <button class="preset-formula" 
                                    data-formula="${p.formula}"
                                    title="${p.description}">
                                <span class="preset-name">${p.name}</span>
                                <code class="preset-code">${p.formula}</code>
                            </button>
                        `).join('')}
                    </div>
                    
                    <h4>Variables</h4>
                    <div class="formula-variables">
                        ${Object.entries(this.variables).map(([key, v]) => `
                            <div class="variable-slider">
                                <label>${v.label}</label>
                                <input type="range" 
                                       min="${v.min}" max="${v.max}" 
                                       step="${v.step}" value="${v.value}"
                                       data-var="${key}">
                                <span class="var-value">${v.value}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    <h4>Help</h4>
                    <div class="formula-help">
                        <p><strong>Variables:</strong> z, c, n</p>
                        <p><strong>Functions:</strong> sin, cos, tan, exp, log, abs, sqrt, conj, real, imag</p>
                        <p><strong>Operators:</strong> + - * / ^ %</p>
                        <p><strong>Constants:</strong> pi, e, i</p>
                    </div>
                </aside>
                
                <main class="formula-main">
                    <div class="formula-input-container">
                        <h4>Iteration Formula</h4>
                        <p class="formula-hint">Enter the formula for z<sub>n+1</sub> in terms of z and c</p>
                        
                        <div class="code-editor">
                            <div class="code-highlight" aria-hidden="true"></div>
                            <textarea class="code-input" 
                                      spellcheck="false"
                                      autocomplete="off"
                                      autocorrect="off"
                                      autocapitalize="off"
                                      placeholder="z^2 + c"
                                      aria-label="Formula input"></textarea>
                            <div class="line-numbers"></div>
                        </div>
                        
                        <div class="formula-error" role="alert" aria-live="polite"></div>
                    </div>
                    
                    <div class="formula-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="autoPreview" checked>
                            <span>Auto-preview</span>
                        </label>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="usePerturb">
                            <span>Use perturbation (for deep zoom)</span>
                        </label>
                    </div>
                </main>
                
                <aside class="formula-preview">
                    <h4>Preview</h4>
                    <canvas class="preview-canvas" width="200" height="200"></canvas>
                    <button class="btn btn-secondary refresh-preview">
                        🔄 Refresh Preview
                    </button>
                    
                    <div class="preview-stats">
                        <span class="stat-fps">-- fps</span>
                        <span class="stat-valid">✓ Valid</span>
                    </div>
                </aside>
            </div>
            
            <footer class="formula-footer">
                <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button class="btn btn-secondary" data-action="save">Save as Preset</button>
                <button class="btn btn-primary" data-action="apply">Apply Formula</button>
            </footer>
        `;
        
        // Get references
        this.textArea = this.element.querySelector('.code-input');
        this.highlightArea = this.element.querySelector('.code-highlight');
        this.errorDisplay = this.element.querySelector('.formula-error');
        this.previewCanvas = this.element.querySelector('.preview-canvas');
        this.previewCtx = this.previewCanvas.getContext('2d');
        
        // Setup events
        this._setupEvents();
        
        // Set initial formula
        this.setFormula(this.formula);
        
        // Add to container
        this.container.appendChild(this.element);
    }
    
    /**
     * Setup event handlers
     * @private
     */
    _setupEvents() {
        // Text input
        this.textArea.addEventListener('input', () => {
            this._onFormulaChange();
        });
        
        this.textArea.addEventListener('keydown', (e) => {
            // Tab to insert spaces
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.textArea.selectionStart;
                const end = this.textArea.selectionEnd;
                this.textArea.value = this.textArea.value.substring(0, start) + '  ' + this.textArea.value.substring(end);
                this.textArea.selectionStart = this.textArea.selectionEnd = start + 2;
                this._onFormulaChange();
            }
        });
        
        this.textArea.addEventListener('scroll', () => {
            this.highlightArea.scrollTop = this.textArea.scrollTop;
            this.highlightArea.scrollLeft = this.textArea.scrollLeft;
        });
        
        // Preset buttons
        this.element.querySelectorAll('.preset-formula').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFormula(btn.dataset.formula);
            });
        });
        
        // Variable sliders
        this.element.querySelectorAll('.variable-slider input').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const varName = slider.dataset.var;
                const value = parseFloat(e.target.value);
                this.variables[varName].value = value;
                slider.nextElementSibling.textContent = value.toFixed(2);
                
                if (this.autoPreview) {
                    this._updatePreview();
                }
            });
        });
        
        // Auto-preview toggle
        this.element.querySelector('#autoPreview').addEventListener('change', (e) => {
            this.autoPreview = e.target.checked;
        });
        
        // Refresh preview button
        this.element.querySelector('.refresh-preview').addEventListener('click', () => {
            this._updatePreview();
        });
        
        // Footer buttons
        this.element.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.manager?.closeModal();
        });
        
        this.element.querySelector('[data-action="save"]').addEventListener('click', () => {
            this._saveAsPreset();
        });
        
        this.element.querySelector('[data-action="apply"]').addEventListener('click', () => {
            this.apply();
        });
    }
    
    // ========================================================================
    // SYNTAX HIGHLIGHTING
    // ========================================================================
    
    /**
     * Apply syntax highlighting
     * @private
     */
    _highlight(code) {
        let html = this._escapeHtml(code);
        
        // Apply syntax rules in order
        SYNTAX_RULES.forEach(rule => {
            html = html.replace(rule.pattern, match => 
                `<span class="syntax-${rule.class}">${match}</span>`
            );
        });
        
        return html;
    }
    
    /**
     * Escape HTML entities
     * @private
     */
    _escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * Update line numbers
     * @private
     */
    _updateLineNumbers() {
        const lines = this.textArea.value.split('\n').length;
        const lineNumbers = this.element.querySelector('.line-numbers');
        lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => 
            `<span>${i + 1}</span>`
        ).join('');
    }
    
    // ========================================================================
    // VALIDATION
    // ========================================================================
    
    /**
     * Validate formula
     * @private
     */
    _validate(formula) {
        this.validationError = null;
        
        if (!formula.trim()) {
            this.validationError = 'Formula cannot be empty';
            return false;
        }
        
        // Check for balanced parentheses
        let parenCount = 0;
        for (const char of formula) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (parenCount < 0) {
                this.validationError = 'Unmatched closing parenthesis';
                return false;
            }
        }
        if (parenCount !== 0) {
            this.validationError = 'Unmatched opening parenthesis';
            return false;
        }
        
        // Check for invalid characters
        const validPattern = /^[a-zA-Z0-9_+\-*\/\^%().,\s]+$/;
        if (!validPattern.test(formula)) {
            const invalidChar = formula.match(/[^a-zA-Z0-9_+\-*\/\^%().,\s]/)?.[0];
            this.validationError = `Invalid character: ${invalidChar}`;
            return false;
        }
        
        // Check for required variables
        if (!formula.includes('z')) {
            this.validationError = 'Formula must contain variable z';
            return false;
        }
        
        // Try to parse (basic check)
        try {
            this._parseFormula(formula);
        } catch (e) {
            this.validationError = e.message;
            return false;
        }
        
        return true;
    }
    
    /**
     * Basic formula parser for validation
     * @private
     */
    _parseFormula(formula) {
        // Replace known tokens for basic parsing
        let parsed = formula
            .replace(/\bz\b/g, 'Z')
            .replace(/\bc\b/g, 'C')
            .replace(/\bn\b/g, 'N')
            .replace(/\bp\b/g, 'P')
            .replace(/\ba\b/g, 'A')
            .replace(/\bb\b/g, 'B')
            .replace(/\bz_prev\b/g, 'ZPREV')
            .replace(/\bpi\b/g, 'Math.PI')
            .replace(/\be\b/g, 'Math.E')
            .replace(/\bi\b/g, 'I')
            .replace(/\bsin\b/g, 'SIN')
            .replace(/\bcos\b/g, 'COS')
            .replace(/\btan\b/g, 'TAN')
            .replace(/\bexp\b/g, 'EXP')
            .replace(/\blog\b/g, 'LOG')
            .replace(/\babs\b/g, 'ABS')
            .replace(/\bsqrt\b/g, 'SQRT')
            .replace(/\bconj\b/g, 'CONJ')
            .replace(/\breal\b/g, 'REAL')
            .replace(/\bimag\b/g, 'IMAG')
            .replace(/\bnorm\b/g, 'NORM')
            .replace(/\barg\b/g, 'ARG')
            .replace(/\bpow\b/g, 'POW')
            .replace(/\^/g, '**');
        
        // Check for unknown identifiers
        const unknownMatch = parsed.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
        if (unknownMatch) {
            const known = ['Z', 'C', 'N', 'P', 'A', 'B', 'ZPREV', 'Math', 'PI', 'E', 'I',
                          'SIN', 'COS', 'TAN', 'EXP', 'LOG', 'ABS', 'SQRT', 'CONJ',
                          'REAL', 'IMAG', 'NORM', 'ARG', 'POW'];
            const unknown = unknownMatch.find(m => !known.includes(m));
            if (unknown) {
                throw new Error(`Unknown identifier: ${unknown.toLowerCase()}`);
            }
        }
        
        return true;
    }
    
    /**
     * Update error display
     * @private
     */
    _updateErrorDisplay() {
        if (this.validationError) {
            this.errorDisplay.textContent = `⚠️ ${this.validationError}`;
            this.errorDisplay.classList.add('visible');
            this.element.querySelector('.stat-valid').textContent = '✗ Invalid';
            this.element.querySelector('.stat-valid').classList.add('error');
        } else {
            this.errorDisplay.textContent = '';
            this.errorDisplay.classList.remove('visible');
            this.element.querySelector('.stat-valid').textContent = '✓ Valid';
            this.element.querySelector('.stat-valid').classList.remove('error');
        }
    }
    
    // ========================================================================
    // PREVIEW
    // ========================================================================
    
    /**
     * Handle formula change
     * @private
     */
    _onFormulaChange() {
        this.formula = this.textArea.value;
        
        // Update highlighting
        this.highlightArea.innerHTML = this._highlight(this.formula);
        this._updateLineNumbers();
        
        // Validate
        const isValid = this._validate(this.formula);
        this._updateErrorDisplay();
        
        // Update preview if valid and auto-preview enabled
        if (isValid && this.autoPreview) {
            clearTimeout(this.previewDebounce);
            this.previewDebounce = setTimeout(() => {
                this._updatePreview();
            }, 300);
        }
    }
    
    /**
     * Update preview render
     * @private
     */
    _updatePreview() {
        if (!this._validate(this.formula)) return;
        
        const width = this.previewCanvas.width;
        const height = this.previewCanvas.height;
        const imageData = this.previewCtx.createImageData(width, height);
        
        // Simple preview render (runs on main thread for simplicity)
        const startTime = performance.now();
        
        const centerX = -0.5;
        const centerY = 0;
        const zoom = 1;
        const maxIter = 100;
        
        const viewSize = 4 / zoom;
        const pixelSize = viewSize / width;
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const cr = centerX + (px - width / 2) * pixelSize;
                const ci = centerY - (py - height / 2) * pixelSize;
                
                let zr = 0, zi = 0;
                let iter = 0;
                
                // Simplified iteration (Mandelbrot-like)
                while (iter < maxIter && zr * zr + zi * zi < 4) {
                    const zr2 = zr * zr;
                    const zi2 = zi * zi;
                    
                    // Apply formula (basic z^n + c)
                    const power = this.variables.n.value;
                    
                    if (power === 2) {
                        const newZr = zr2 - zi2 + cr;
                        zi = 2 * zr * zi + ci;
                        zr = newZr;
                    } else {
                        // Polar form for arbitrary power
                        const r = Math.sqrt(zr2 + zi2);
                        const theta = Math.atan2(zi, zr);
                        const rn = Math.pow(r, power);
                        const newTheta = theta * power;
                        zr = rn * Math.cos(newTheta) + cr;
                        zi = rn * Math.sin(newTheta) + ci;
                    }
                    
                    iter++;
                }
                
                const idx = (py * width + px) * 4;
                
                if (iter === maxIter) {
                    imageData.data[idx] = 0;
                    imageData.data[idx + 1] = 0;
                    imageData.data[idx + 2] = 0;
                } else {
                    const t = iter / maxIter;
                    const hue = t * 360;
                    const [r, g, b] = this._hsvToRgb(hue, 0.8, 1);
                    imageData.data[idx] = r;
                    imageData.data[idx + 1] = g;
                    imageData.data[idx + 2] = b;
                }
                imageData.data[idx + 3] = 255;
            }
        }
        
        this.previewCtx.putImageData(imageData, 0, 0);
        
        const elapsed = performance.now() - startTime;
        this.element.querySelector('.stat-fps').textContent = 
            `${Math.round(1000 / elapsed)} fps`;
    }
    
    /**
     * HSV to RGB conversion
     * @private
     */
    _hsvToRgb(h, s, v) {
        h = h % 360;
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        
        return [
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        ];
    }
    
    // ========================================================================
    // PUBLIC API
    // ========================================================================
    
    /**
     * Set formula
     * @param {string} formula
     */
    setFormula(formula) {
        this.formula = formula;
        if (this.textArea) {
            this.textArea.value = formula;
            this._onFormulaChange();
        }
    }
    
    /**
     * Get formula
     * @returns {string}
     */
    getFormula() {
        return this.formula;
    }
    
    /**
     * Get variables
     * @returns {Object}
     */
    getVariables() {
        const result = {};
        Object.entries(this.variables).forEach(([key, v]) => {
            result[key] = v.value;
        });
        return result;
    }
    
    /**
     * Apply formula to main renderer
     */
    apply() {
        if (!this._validate(this.formula)) {
            this.manager?.emit('notification', {
                message: this.validationError,
                type: 'error'
            });
            return;
        }
        
        this.manager?.emit('formula:apply', {
            formula: this.formula,
            variables: this.getVariables()
        });
        
        this.manager?.closeModal();
        
        this.manager?.emit('notification', {
            message: 'Custom formula applied',
            type: 'success'
        });
    }
    
    /**
     * Save as preset
     * @private
     */
    _saveAsPreset() {
        if (!this._validate(this.formula)) {
            return;
        }
        
        const name = prompt('Preset name:', 'My Formula');
        if (!name) return;
        
        const preset = {
            id: `formula_${Date.now()}`,
            type: 'formula',
            name,
            formula: this.formula,
            variables: this.getVariables(),
            created: Date.now()
        };
        
        this.manager?.emit('preset:save', preset);
        
        this.manager?.emit('notification', {
            message: 'Formula preset saved',
            type: 'success'
        });
    }
    
    /**
     * Get element for modal
     * @returns {HTMLElement}
     */
    getElement() {
        return this.element;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { PRESET_FORMULAS, SYNTAX_RULES };
export default FormulaEditor;
