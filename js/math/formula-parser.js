/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                 ABYSS EXPLORER - CUSTOM FORMULA PARSER                        ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║  Safe parser and compiler for user-defined complex fractal formulas           ║
 * ║                                                                                ║
 * ║  Architecture:                                                                 ║
 * ║  ═════════════                                                                 ║
 * ║  1. LEXER (Tokenizer): Converts formula string to token stream                ║
 * ║  2. PARSER: Builds Abstract Syntax Tree (AST) from tokens                     ║
 * ║  3. COMPILER: Generates executable JavaScript function from AST               ║
 * ║                                                                                ║
 * ║  Supported Syntax:                                                             ║
 * ║  ═════════════════                                                             ║
 * ║  Variables: z, c, pixel (p), n (iteration), i (imaginary unit)                ║
 * ║  Operations: +, -, *, /, ^ (power)                                            ║
 * ║  Functions: sin, cos, tan, exp, log, sqrt, abs, conj, real, imag              ║
 * ║  Constants: pi, e, phi (golden ratio)                                         ║
 * ║  Complex literals: 2+3i, 4i, -2.5                                             ║
 * ║                                                                                ║
 * ║  Example formulas:                                                             ║
 * ║  - "z^2 + c"              (Mandelbrot)                                        ║
 * ║  - "z^3 + c"              (Cubic Mandelbrot)                                  ║
 * ║  - "z^2 + c/z"            (Nova variant)                                      ║
 * ║  - "sin(z) + c"           (Trigonometric)                                     ║
 * ║  - "z^2 + p * sin(z)"     (Parameterized)                                     ║
 * ║                                                                                ║
 * ║  Security:                                                                     ║
 * ║  ══════════                                                                    ║
 * ║  - NO eval() or Function() with user strings                                  ║
 * ║  - Whitelist of allowed operations                                            ║
 * ║  - AST validation before compilation                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// =============================================================================
// IMPORTS
// =============================================================================

import { Complex } from './complex.js';
import { Logger } from '../utils/logger.js';

// =============================================================================
// TOKEN DEFINITIONS
// =============================================================================

/**
 * Token types
 * @enum {string}
 */
const TokenType = {
    NUMBER: 'NUMBER',
    IDENTIFIER: 'IDENTIFIER',
    OPERATOR: 'OPERATOR',
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    COMMA: 'COMMA',
    IMAGINARY: 'IMAGINARY',
    EOF: 'EOF'
};

/**
 * Operator precedence (higher = binds tighter)
 */
const PRECEDENCE = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3
};

/**
 * Right-associative operators
 */
const RIGHT_ASSOC = new Set(['^']);

/**
 * Built-in functions (whitelist)
 */
const FUNCTIONS = new Set([
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh',
    'asinh', 'acosh', 'atanh',
    'exp', 'log', 'ln', 'log10', 'log2',
    'sqrt', 'cbrt',
    'abs', 'arg', 'conj',
    'real', 'imag', 're', 'im',
    'floor', 'ceil', 'round', 'frac',
    'sign', 'norm'
]);

/**
 * Built-in constants
 */
const CONSTANTS = {
    'pi': Math.PI,
    'e': Math.E,
    'phi': (1 + Math.sqrt(5)) / 2, // Golden ratio
    'tau': 2 * Math.PI
};

/**
 * Built-in variables
 */
const VARIABLES = new Set(['z', 'c', 'p', 'pixel', 'n', 'i']);

// =============================================================================
// LEXER (TOKENIZER)
// =============================================================================

/**
 * Token class
 */
class Token {
    constructor(type, value, position) {
        this.type = type;
        this.value = value;
        this.position = position;
    }
}

/**
 * Lexer - converts formula string to tokens
 * 
 * @class Lexer
 */
class Lexer {
    /**
     * @param {string} input - Formula string
     */
    constructor(input) {
        this.input = input;
        this.position = 0;
        this.tokens = [];
    }

    /**
     * Tokenize the entire input
     * @returns {Token[]}
     */
    tokenize() {
        this.tokens = [];
        
        while (this.position < this.input.length) {
            this.skipWhitespace();
            
            if (this.position >= this.input.length) break;
            
            const char = this.input[this.position];
            
            // Numbers (including decimals and scientific notation)
            if (this.isDigit(char) || (char === '.' && this.isDigit(this.peek(1)))) {
                this.tokens.push(this.readNumber());
            }
            // Identifiers (variables, functions, constants)
            else if (this.isAlpha(char)) {
                this.tokens.push(this.readIdentifier());
            }
            // Imaginary unit standalone
            else if (char === 'i' && !this.isAlphaNum(this.peek(1))) {
                this.tokens.push(new Token(TokenType.IMAGINARY, 'i', this.position));
                this.position++;
            }
            // Operators
            else if ('+-*/^'.includes(char)) {
                this.tokens.push(new Token(TokenType.OPERATOR, char, this.position));
                this.position++;
            }
            // Parentheses
            else if (char === '(') {
                this.tokens.push(new Token(TokenType.LPAREN, '(', this.position));
                this.position++;
            }
            else if (char === ')') {
                this.tokens.push(new Token(TokenType.RPAREN, ')', this.position));
                this.position++;
            }
            // Comma
            else if (char === ',') {
                this.tokens.push(new Token(TokenType.COMMA, ',', this.position));
                this.position++;
            }
            else {
                throw new SyntaxError(`Unexpected character '${char}' at position ${this.position}`);
            }
        }
        
        this.tokens.push(new Token(TokenType.EOF, null, this.position));
        return this.tokens;
    }

    /**
     * Skip whitespace characters
     */
    skipWhitespace() {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.position++;
        }
    }

    /**
     * Read a number token
     * @returns {Token}
     */
    readNumber() {
        const start = this.position;
        let hasDecimal = false;
        let hasExponent = false;
        
        // Integer part
        while (this.isDigit(this.current())) {
            this.position++;
        }
        
        // Decimal part
        if (this.current() === '.' && this.isDigit(this.peek(1))) {
            hasDecimal = true;
            this.position++; // Skip '.'
            while (this.isDigit(this.current())) {
                this.position++;
            }
        }
        
        // Exponent part
        if (this.current()?.toLowerCase() === 'e') {
            hasExponent = true;
            this.position++;
            if (this.current() === '+' || this.current() === '-') {
                this.position++;
            }
            while (this.isDigit(this.current())) {
                this.position++;
            }
        }
        
        // Check for imaginary suffix
        if (this.current()?.toLowerCase() === 'i') {
            this.position++;
            const value = this.input.slice(start, this.position - 1);
            return new Token(TokenType.IMAGINARY, parseFloat(value) || 1, start);
        }
        
        const value = this.input.slice(start, this.position);
        return new Token(TokenType.NUMBER, parseFloat(value), start);
    }

    /**
     * Read an identifier token
     * @returns {Token}
     */
    readIdentifier() {
        const start = this.position;
        
        while (this.isAlphaNum(this.current())) {
            this.position++;
        }
        
        const name = this.input.slice(start, this.position).toLowerCase();
        
        // Check if followed by imaginary suffix
        if (name === 'i') {
            return new Token(TokenType.IMAGINARY, 1, start);
        }
        
        return new Token(TokenType.IDENTIFIER, name, start);
    }

    /**
     * Get current character
     */
    current() {
        return this.input[this.position];
    }

    /**
     * Peek ahead
     */
    peek(offset = 1) {
        return this.input[this.position + offset];
    }

    /**
     * Check if character is a digit
     */
    isDigit(char) {
        return char && char >= '0' && char <= '9';
    }

    /**
     * Check if character is alphabetic
     */
    isAlpha(char) {
        return char && ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_');
    }

    /**
     * Check if character is alphanumeric
     */
    isAlphaNum(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }
}

// =============================================================================
// AST NODE TYPES
// =============================================================================

/**
 * AST node types
 * @enum {string}
 */
const NodeType = {
    NUMBER: 'NUMBER',
    COMPLEX: 'COMPLEX',
    VARIABLE: 'VARIABLE',
    BINARY_OP: 'BINARY_OP',
    UNARY_OP: 'UNARY_OP',
    FUNCTION_CALL: 'FUNCTION_CALL'
};

/**
 * AST Node base class
 */
class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

/**
 * Number literal node
 */
class NumberNode extends ASTNode {
    constructor(value) {
        super(NodeType.NUMBER);
        this.value = value;
    }
}

/**
 * Complex literal node
 */
class ComplexNode extends ASTNode {
    constructor(re, im) {
        super(NodeType.COMPLEX);
        this.re = re;
        this.im = im;
    }
}

/**
 * Variable reference node
 */
class VariableNode extends ASTNode {
    constructor(name) {
        super(NodeType.VARIABLE);
        this.name = name;
    }
}

/**
 * Binary operation node
 */
class BinaryOpNode extends ASTNode {
    constructor(operator, left, right) {
        super(NodeType.BINARY_OP);
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
}

/**
 * Unary operation node
 */
class UnaryOpNode extends ASTNode {
    constructor(operator, operand) {
        super(NodeType.UNARY_OP);
        this.operator = operator;
        this.operand = operand;
    }
}

/**
 * Function call node
 */
class FunctionCallNode extends ASTNode {
    constructor(name, args) {
        super(NodeType.FUNCTION_CALL);
        this.name = name;
        this.args = args;
    }
}

// =============================================================================
// PARSER
// =============================================================================

/**
 * Parser - builds AST from tokens
 * 
 * Uses Pratt parsing (precedence climbing) for expressions.
 * 
 * @class Parser
 */
class Parser {
    /**
     * @param {Token[]} tokens
     */
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    /**
     * Parse the token stream into an AST
     * @returns {ASTNode}
     */
    parse() {
        const ast = this.parseExpression(0);
        
        if (!this.isAtEnd()) {
            throw new SyntaxError(`Unexpected token '${this.current().value}' at position ${this.current().position}`);
        }
        
        return ast;
    }

    /**
     * Parse expression with precedence climbing
     * @param {number} minPrec - Minimum precedence
     * @returns {ASTNode}
     */
    parseExpression(minPrec) {
        let left = this.parseUnary();
        
        while (!this.isAtEnd()) {
            const token = this.current();
            
            if (token.type !== TokenType.OPERATOR) break;
            
            const prec = PRECEDENCE[token.value];
            if (prec === undefined || prec < minPrec) break;
            
            this.advance();
            
            // Handle right associativity
            const nextPrec = RIGHT_ASSOC.has(token.value) ? prec : prec + 1;
            const right = this.parseExpression(nextPrec);
            
            left = new BinaryOpNode(token.value, left, right);
        }
        
        return left;
    }

    /**
     * Parse unary expression (prefix operators)
     * @returns {ASTNode}
     */
    parseUnary() {
        const token = this.current();
        
        // Unary minus or plus
        if (token.type === TokenType.OPERATOR && (token.value === '-' || token.value === '+')) {
            this.advance();
            const operand = this.parseUnary();
            
            if (token.value === '-') {
                return new UnaryOpNode('-', operand);
            }
            return operand; // Unary + is a no-op
        }
        
        return this.parsePrimary();
    }

    /**
     * Parse primary expression (atoms)
     * @returns {ASTNode}
     */
    parsePrimary() {
        const token = this.current();
        
        // Number literal
        if (token.type === TokenType.NUMBER) {
            this.advance();
            return new NumberNode(token.value);
        }
        
        // Imaginary literal
        if (token.type === TokenType.IMAGINARY) {
            this.advance();
            const imValue = typeof token.value === 'number' ? token.value : 1;
            return new ComplexNode(0, imValue);
        }
        
        // Identifier (variable, function, or constant)
        if (token.type === TokenType.IDENTIFIER) {
            const name = token.value;
            this.advance();
            
            // Function call
            if (this.current().type === TokenType.LPAREN) {
                return this.parseFunctionCall(name);
            }
            
            // Constant
            if (name in CONSTANTS) {
                return new NumberNode(CONSTANTS[name]);
            }
            
            // Variable
            if (VARIABLES.has(name)) {
                // 'i' is special - it's the imaginary unit
                if (name === 'i') {
                    return new ComplexNode(0, 1);
                }
                return new VariableNode(name);
            }
            
            throw new SyntaxError(`Unknown identifier '${name}' at position ${token.position}`);
        }
        
        // Parenthesized expression
        if (token.type === TokenType.LPAREN) {
            this.advance();
            const expr = this.parseExpression(0);
            this.expect(TokenType.RPAREN, ')');
            return expr;
        }
        
        throw new SyntaxError(`Unexpected token '${token.value}' at position ${token.position}`);
    }

    /**
     * Parse function call
     * @param {string} name - Function name
     * @returns {FunctionCallNode}
     */
    parseFunctionCall(name) {
        if (!FUNCTIONS.has(name)) {
            throw new SyntaxError(`Unknown function '${name}'`);
        }
        
        this.expect(TokenType.LPAREN, '(');
        
        const args = [];
        
        if (this.current().type !== TokenType.RPAREN) {
            args.push(this.parseExpression(0));
            
            while (this.current().type === TokenType.COMMA) {
                this.advance();
                args.push(this.parseExpression(0));
            }
        }
        
        this.expect(TokenType.RPAREN, ')');
        
        return new FunctionCallNode(name, args);
    }

    /**
     * Get current token
     */
    current() {
        return this.tokens[this.position];
    }

    /**
     * Advance to next token
     */
    advance() {
        if (!this.isAtEnd()) {
            this.position++;
        }
        return this.tokens[this.position - 1];
    }

    /**
     * Check if at end of tokens
     */
    isAtEnd() {
        return this.current().type === TokenType.EOF;
    }

    /**
     * Expect a specific token type
     */
    expect(type, expected) {
        const token = this.current();
        if (token.type !== type) {
            throw new SyntaxError(`Expected '${expected}' at position ${token.position}`);
        }
        this.advance();
    }
}

// =============================================================================
// COMPILER
// =============================================================================

/**
 * Compiler - generates executable function from AST
 * 
 * Compiles to a function that takes (z, c, p, n) and returns a Complex.
 * 
 * @class Compiler
 */
class Compiler {
    constructor() {
        this.logger = new Logger('FormulaCompiler');
    }

    /**
     * Compile AST to executable function
     * 
     * @param {ASTNode} ast
     * @returns {Function} (z: Complex, c: Complex, p: Complex, n: number) => Complex
     */
    compile(ast) {
        // Generate JavaScript code string
        const bodyCode = this.generateCode(ast);
        
        // Create function that evaluates the expression
        // We use a closure approach instead of Function() for safety
        return (z, c, p, n) => {
            return this.evaluate(ast, { z, c, p, pixel: p, n });
        };
    }

    /**
     * Generate JavaScript code from AST (for debugging)
     * @param {ASTNode} node
     * @returns {string}
     */
    generateCode(node) {
        switch (node.type) {
            case NodeType.NUMBER:
                return `new Complex(${node.value}, 0)`;
                
            case NodeType.COMPLEX:
                return `new Complex(${node.re}, ${node.im})`;
                
            case NodeType.VARIABLE:
                return node.name;
                
            case NodeType.BINARY_OP:
                return this.generateBinaryOp(node);
                
            case NodeType.UNARY_OP:
                return this.generateUnaryOp(node);
                
            case NodeType.FUNCTION_CALL:
                return this.generateFunctionCall(node);
                
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    /**
     * Generate binary operation code
     */
    generateBinaryOp(node) {
        const left = this.generateCode(node.left);
        const right = this.generateCode(node.right);
        
        switch (node.operator) {
            case '+': return `(${left}).add(${right})`;
            case '-': return `(${left}).sub(${right})`;
            case '*': return `(${left}).mul(${right})`;
            case '/': return `(${left}).div(${right})`;
            case '^': return `(${left}).pow(${right})`;
            default: throw new Error(`Unknown operator: ${node.operator}`);
        }
    }

    /**
     * Generate unary operation code
     */
    generateUnaryOp(node) {
        const operand = this.generateCode(node.operand);
        
        switch (node.operator) {
            case '-': return `(${operand}).neg()`;
            default: throw new Error(`Unknown unary operator: ${node.operator}`);
        }
    }

    /**
     * Generate function call code
     */
    generateFunctionCall(node) {
        const args = node.args.map(arg => this.generateCode(arg)).join(', ');
        return `(${this.generateCode(node.args[0])}).${node.name}()`;
    }

    /**
     * Evaluate AST directly (safer than code generation)
     * 
     * @param {ASTNode} node
     * @param {Object} context - Variable bindings
     * @returns {Complex}
     */
    evaluate(node, context) {
        switch (node.type) {
            case NodeType.NUMBER:
                return new Complex(node.value, 0);
                
            case NodeType.COMPLEX:
                return new Complex(node.re, node.im);
                
            case NodeType.VARIABLE:
                return this.resolveVariable(node.name, context);
                
            case NodeType.BINARY_OP:
                return this.evaluateBinaryOp(node, context);
                
            case NodeType.UNARY_OP:
                return this.evaluateUnaryOp(node, context);
                
            case NodeType.FUNCTION_CALL:
                return this.evaluateFunctionCall(node, context);
                
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    /**
     * Resolve variable to Complex value
     */
    resolveVariable(name, context) {
        if (name === 'pixel') name = 'p';
        
        if (name in context) {
            const value = context[name];
            if (value instanceof Complex) return value;
            if (typeof value === 'number') return new Complex(value, 0);
            throw new Error(`Invalid value for variable '${name}'`);
        }
        
        throw new Error(`Undefined variable '${name}'`);
    }

    /**
     * Evaluate binary operation
     */
    evaluateBinaryOp(node, context) {
        const left = this.evaluate(node.left, context);
        const right = this.evaluate(node.right, context);
        
        switch (node.operator) {
            case '+': return left.add(right);
            case '-': return left.sub(right);
            case '*': return left.mul(right);
            case '/': return left.div(right);
            case '^':
                // Power can be complex or real
                if (right.isReal) {
                    return left.pow(right.re);
                }
                return left.cpow(right);
            default:
                throw new Error(`Unknown operator: ${node.operator}`);
        }
    }

    /**
     * Evaluate unary operation
     */
    evaluateUnaryOp(node, context) {
        const operand = this.evaluate(node.operand, context);
        
        switch (node.operator) {
            case '-': return operand.neg();
            default: throw new Error(`Unknown unary operator: ${node.operator}`);
        }
    }

    /**
     * Evaluate function call
     */
    evaluateFunctionCall(node, context) {
        const args = node.args.map(arg => this.evaluate(arg, context));
        const z = args[0];
        
        switch (node.name) {
            // Trigonometric
            case 'sin': return z.sin();
            case 'cos': return z.cos();
            case 'tan': return z.tan();
            case 'cot': return z.cot();
            case 'sec': return z.sec();
            case 'csc': return z.csc();
            
            // Inverse trig
            case 'asin': return z.asin();
            case 'acos': return z.acos();
            case 'atan': return z.atan();
            
            // Hyperbolic
            case 'sinh': return z.sinh();
            case 'cosh': return z.cosh();
            case 'tanh': return z.tanh();
            case 'asinh': return z.asinh();
            case 'acosh': return z.acosh();
            case 'atanh': return z.atanh();
            
            // Exponential/logarithmic
            case 'exp': return z.exp();
            case 'log': case 'ln': return z.log();
            case 'log10': return z.log10();
            case 'log2': return z.log2();
            
            // Roots
            case 'sqrt': return z.sqrt();
            case 'cbrt': return z.nthRoot(3);
            
            // Complex-specific
            case 'abs': return new Complex(z.magnitude, 0);
            case 'arg': return new Complex(z.argument, 0);
            case 'conj': return z.conj();
            case 'real': case 're': return new Complex(z.re, 0);
            case 'imag': case 'im': return new Complex(z.im, 0);
            case 'norm': return new Complex(z.magnitudeSquared, 0);
            
            // Rounding
            case 'floor': return z.floor();
            case 'ceil': return z.ceil();
            case 'round': return z.round();
            case 'frac': return z.frac();
            
            // Other
            case 'sign': return z.sign();
            
            default:
                throw new Error(`Unknown function: ${node.name}`);
        }
    }
}

// =============================================================================
// FORMULA PARSER CLASS
// =============================================================================

/**
 * Formula Parser
 * 
 * High-level interface for parsing and compiling user formulas.
 * 
 * @class FormulaParser
 */
export class FormulaParser {
    constructor() {
        this.logger = new Logger('FormulaParser');
        this.compiler = new Compiler();
        
        /** @type {Map<string, {ast: ASTNode, fn: Function}>} Cached compiled formulas */
        this.cache = new Map();
    }

    /**
     * Parse a formula string
     * 
     * @param {string} formula - Formula string (e.g., "z^2 + c")
     * @returns {{ast: ASTNode, code: string}} Parsed result
     */
    parse(formula) {
        // Tokenize
        const lexer = new Lexer(formula);
        const tokens = lexer.tokenize();
        
        // Parse
        const parser = new Parser(tokens);
        const ast = parser.parse();
        
        // Generate code for debugging
        const code = this.compiler.generateCode(ast);
        
        return { ast, code };
    }

    /**
     * Compile a formula to executable function
     * 
     * @param {string} formula
     * @returns {Function} (z, c, p, n) => Complex
     */
    compile(formula) {
        // Check cache
        if (this.cache.has(formula)) {
            return this.cache.get(formula).fn;
        }
        
        // Parse and compile
        const { ast } = this.parse(formula);
        const fn = this.compiler.compile(ast);
        
        // Cache result
        this.cache.set(formula, { ast, fn });
        
        return fn;
    }

    /**
     * Validate a formula without compiling
     * 
     * @param {string} formula
     * @returns {{valid: boolean, error?: string}}
     */
    validate(formula) {
        try {
            this.parse(formula);
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Get variable dependencies of a formula
     * 
     * @param {string} formula
     * @returns {Set<string>} Set of variable names used
     */
    getDependencies(formula) {
        const { ast } = this.parse(formula);
        const deps = new Set();
        
        const walk = (node) => {
            if (node.type === NodeType.VARIABLE) {
                deps.add(node.name);
            } else if (node.type === NodeType.BINARY_OP) {
                walk(node.left);
                walk(node.right);
            } else if (node.type === NodeType.UNARY_OP) {
                walk(node.operand);
            } else if (node.type === NodeType.FUNCTION_CALL) {
                node.args.forEach(walk);
            }
        };
        
        walk(ast);
        return deps;
    }

    /**
     * Clear compilation cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// =============================================================================
// PREDEFINED FORMULAS
// =============================================================================

/**
 * Library of predefined fractal formulas
 */
export const PredefinedFormulas = {
    mandelbrot: 'z^2 + c',
    julia: 'z^2 + p',
    burningShip: 'abs(z)^2 + c',
    tricorn: 'conj(z)^2 + c',
    
    multibrot3: 'z^3 + c',
    multibrot4: 'z^4 + c',
    multibrot5: 'z^5 + c',
    
    phoenix: 'z^2 + c + p*conj(z)',
    
    sine: 'sin(z) + c',
    cosine: 'cos(z) + c',
    exponential: 'exp(z) + c',
    
    nova: 'z - (z^3 - 1)/(3*z^2) + c',
    
    spider: 'z^2 + c',  // With special c update
    
    collatz: '(2 + 7*z - (2 + 5*z)*cos(pi*z))/4',
    
    biomorph: 'sin(z) + z^2 + c',
    
    custom: null // User-defined
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
    TokenType,
    NodeType,
    Lexer,
    Parser,
    Compiler,
    FUNCTIONS,
    CONSTANTS,
    VARIABLES
};

export default FormulaParser;
