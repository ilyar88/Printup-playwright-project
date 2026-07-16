'use strict';

const fs        = require('fs');
const path      = require('path');
const recast    = require('recast');
const babel     = require('@babel/parser');
const Anthropic = require('@anthropic-ai/sdk');
const { connectMcp } = require('./McpTools');

const RECAST_OPTS = {
    parser: { parse: src => babel.parse(src, { sourceType: 'script', plugins: ['classProperties'] }) },
};

const PAGE_OBJECTS_DIR = path.join(__dirname, '../pageObjects');
const FLOWS_DIR        = path.join(__dirname, '../workflows');
const MAX_TURNS        = 6;

// Only calls to healingLocator() get healing — plain page.locator()/getByRole()/getByText() calls bypass it
const ACTION_METHODS = new Set([
    'click', 'dblclick', 'fill', 'type', 'press', 'check', 'uncheck',
    'selectOption', 'waitFor', 'getAttribute', 'textContent', 'inputValue',
    'innerText', 'innerHTML', 'setInputFiles', 'tap', 'focus', 'blur',
    'hover', 'dispatchEvent', 'evaluate', 'scrollIntoViewIfNeeded',
    'isVisible', 'isEnabled', 'isChecked', 'isEditable', 'isHidden',
    'isDisabled', 'count', 'boundingBox',
]);

const escapeRe        = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchesTemplate = (body, selector) => {
    const tpl = body.match(/`([^`]+)`/)?.[1];
    if (!tpl?.includes('${')) return false;
    const re = new RegExp('^' + tpl.split(/\$\{[^}]+\}/).map(escapeRe).join('[^"\']+') + '$');
    return re.test(selector);
};

const JS_KEYWORDS = new Set([
    'if', 'for', 'while', 'switch', 'return', 'await', 'const', 'let', 'var',
    'new', 'throw', 'catch', 'try', 'else', 'class', 'static', 'function',
    'import', 'export', 'require', 'typeof', 'instanceof', 'constructor',
]);

/** Locator that heals itself via a tool-using AI agent (MCP, see McpTools.js) and persists the fix.
 *  Called explicitly per locator: healingLocator → _agentAct → _updateFile */
class SelfHealing {
    constructor() {
        this._cache = new Map();
        this._ai    = null;
    }

    /** Returns a Locator that runs normally if found (15 s), otherwise hands off to the AI agent on any ACTION_METHOD call. */
    healingLocator(page, selector, options) {
        return new Proxy(page.locator(selector, options), {
            get: (target, prop) => {
                const value = Reflect.get(target, prop);
                if (typeof value !== 'function' || !ACTION_METHODS.has(prop))
                    return (typeof value === 'function' && prop !== 'constructor') ? value.bind(target) : value;

                return async (...args) => {
                    const found = await target.waitFor({ state: 'attached', timeout: 15000 })
                        .then(() => true, () => false);
                    if (found) return await value.call(target, ...args);

                    console.warn(`[SelfHealing] "${selector}" not found — asking AI agent...`);
                    try {
                        return await this._agentAct(page, selector, prop, args);
                    } catch (e) {
                        throw new Error(`[SelfHealing] Could not heal "${selector}": ${e.message}`);
                    }
                };
            },
        });
    }

    _getAI() {
        return this._ai ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    /** Finds which POM function owns the broken selector (static or template match). */
    _findFunctionName(selector) {
        for (const useTpl of [false, true]) {
            for (const file of fs.readdirSync(PAGE_OBJECTS_DIR).filter(f => f.endsWith('.js'))) {
                const lines = fs.readFileSync(path.join(PAGE_OBJECTS_DIR, file), 'utf8').split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const mMatch = lines[i].trim().match(/^(?:async\s+)?([a-zA-Z_]\w*)\s*\(/);
                    if (!mMatch || JS_KEYWORDS.has(mMatch[1])) continue;
                    const body = lines.slice(i, i + 10).join('\n');
                    if (useTpl ? matchesTemplate(body, selector) : body.includes(selector)) return mMatch[1];
                }
            }
        }
        return null;
    }

    /** Agent loop: inspects the page, verifies a candidate selector, performs it via perform_action,
     *  then persists the fix once the action succeeds. */
    async _agentAct(page, selector, prop, args) {
        const functionName = this._findFunctionName(selector);
        if (functionName) console.warn(`[SelfHealing] Context → fn: ${functionName}`);

        if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');

        if (this._cache.has(selector)) {
            const healed = this._cache.get(selector);
            console.warn(`[SelfHealing] Using cached: "${healed}"`);
            return await page.locator(healed)[prop](...args);
        }

        const mcp = await connectMcp(page, prop, args);
        try {
            const { tools } = await mcp.client.listTools();
            const anthropicTools = tools.map(t => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));

            const messages = [{
                role: 'user',
                content: `A Playwright selector broke after a UI change.\nFailed: ${selector}` +
                    (functionName ? `\nUsed by POM function: ${functionName}` : '') +
                    `\n\nUse get_snapshot to inspect the current page, propose a replacement CSS selector for the ` +
                    `same element, use check_selector to confirm it matches exactly one element, then call ` +
                    `perform_action with that selector to complete the healing. If anything about the DOM looks ` +
                    `wrong beyond a simple rename (missing element, mismatched text, unexpected duplicates), call ` +
                    `report_dom_issue with a short note before continuing.`,
            }];

            let tokensUsed = 0;
            for (let turn = 0; turn < MAX_TURNS && !mcp.state.done; turn++) {
                let res;
                try {
                    res = await this._getAI().messages.create({
                        model: 'claude-sonnet-4-6', max_tokens: 500, tools: anthropicTools, messages,
                    });
                } catch (e) {
                    // Out of tokens/credit, rate-limited, etc. — stop instead of burning through MAX_TURNS on a dead API
                    throw new Error(`API call failed after ${tokensUsed} tokens used: ${e.message}`);
                }
                tokensUsed += (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0);
                messages.push({ role: 'assistant', content: res.content });

                const toolUses = res.content.filter(b => b.type === 'tool_use');
                if (toolUses.length === 0) break;

                const toolResults = [];
                for (const use of toolUses) {
                    const result = await mcp.client.callTool({ name: use.name, arguments: use.input });
                    toolResults.push({ type: 'tool_result', tool_use_id: use.id, content: result.content });
                }
                messages.push({ role: 'user', content: toolResults });
            }

            if (!mcp.state.done) throw new Error(`Agent could not heal "${selector}" (${tokensUsed} tokens used)`);
            this._cache.set(selector, mcp.state.healedSelector);
            // Set SELF_HEAL_PERSIST=false to heal the running test without writing the fix back to source
            if (process.env.SELF_HEAL_PERSIST !== 'false') this._updateFile(selector, mcp.state.healedSelector, functionName);
            return mcp.state.actionResult;
        } finally {
            await mcp.close();
        }
    }

    /** Parses, visits (via `makeVisitor(markPatched)`), and writes `filePath` back only if patched. */
    _patchFile(filePath, makeVisitor) {
        const ast = recast.parse(fs.readFileSync(filePath, 'utf8'), RECAST_OPTS);
        let patched = false;
        recast.visit(ast, makeVisitor(() => patched = true));
        if (patched) fs.writeFileSync(filePath, recast.print(ast).code, 'utf8');
        return patched;
    }

    /** Finds the POM file containing the old selector and replaces it with the healed one (AST-safe).
     *  If the selector is dynamic (template literal), updates the string arg in flow files instead. */
    _updateFile(oldSelector, newSelector, functionName) {
        for (const file of fs.readdirSync(PAGE_OBJECTS_DIR).filter(f => f.endsWith('.js'))) {
            const filePath = path.join(PAGE_OBJECTS_DIR, file);
            if (!fs.readFileSync(filePath, 'utf8').includes(oldSelector)) continue;

            const patched = this._patchFile(filePath, markPatched => ({
                visitStringLiteral(nodePath) {
                    if (nodePath.node.value === oldSelector) {
                        const q = nodePath.node.extra?.raw?.[0] ?? "'";
                        nodePath.node.value = newSelector;
                        nodePath.node.extra = { raw: `${q}${newSelector}${q}`, rawValue: newSelector };
                        markPatched();
                    }
                    this.traverse(nodePath);
                },
            }));
            if (patched) console.warn(`[SelfHealing] ✓ "${oldSelector}" → "${newSelector}" saved in ${file}`);
            return;
        }
        // Selector is built dynamically from a param — patch the string argument in flow files
        this._updateFlowArgs(oldSelector, newSelector, functionName);
    }

    /** For template-built selectors, extracts the quoted values from old/new, finds which one changed, and swaps that argument in the flow file calling `fn`. */
    _updateFlowArgs(oldSelector, newSelector, fn) {
        if (!fn || !fs.existsSync(FLOWS_DIR)) return;

        const extract = s => [...s.matchAll(/['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
        const changes = extract(oldSelector)
            .map((v, i) => [v, extract(newSelector)[i]])
            .filter(([o, n]) => o && n && o !== n);
        if (!changes.length) return;

        for (const file of fs.readdirSync(FLOWS_DIR).filter(f => f.endsWith('.js'))) {
            const filePath = path.join(FLOWS_DIR, file);
            if (!fs.readFileSync(filePath, 'utf8').includes(fn)) continue;

            this._patchFile(filePath, markPatched => ({
                visitCallExpression(nodePath) {
                    const callee = nodePath.node.callee;
                    const name   = callee.type === 'MemberExpression' ? callee.property.name : callee.name;
                    if (name === fn) {
                        for (const arg of nodePath.node.arguments) {
                            if (arg.type !== 'StringLiteral') continue;
                            const match = changes.find(([o]) => o === arg.value);
                            if (match) {
                                const q = arg.extra?.raw?.[0] ?? "'";
                                arg.value = match[1];
                                arg.extra = { raw: `${q}${match[1]}${q}`, rawValue: match[1] };
                                markPatched();
                                console.warn(`[SelfHealing] ✓ arg "${match[0]}" → "${match[1]}" in ${file}`);
                            }
                        }
                    }
                    this.traverse(nodePath);
                },
            }));
        }
    }
}

const selfHealing = new SelfHealing();
module.exports = { healingLocator: selfHealing.healingLocator.bind(selfHealing) };
