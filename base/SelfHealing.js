'use strict';

const fs     = require('fs');
const path   = require('path');
const recast = require('recast');
const babel  = require('@babel/parser');
const Healer = require('./AriaHealer');

const RECAST_OPTS = {
    parser: { parse: src => babel.parse(src, { sourceType: 'script', plugins: ['classProperties'] }) },
};

const PAGE_OBJECTS_DIR = path.join(__dirname, '../pageObjects');
const FLOWS_DIR        = path.join(__dirname, '../workflows');

// Only page.locator() is proxied — page.getByRole(), page.getByText(), page.evaluate(), and
// chained methods like .filter().getByRole() are NOT intercepted and bypass the 15s healing wait
const ACTION_METHODS = new Set([
    'click', 'dblclick', 'fill', 'type', 'press', 'check', 'uncheck',
    'selectOption', 'waitFor', 'getAttribute', 'textContent', 'inputValue',
    'innerText', 'innerHTML', 'setInputFiles', 'tap', 'focus', 'blur',
    'hover', 'dispatchEvent', 'evaluate', 'scrollIntoViewIfNeeded',
    'isVisible', 'isEnabled', 'isChecked', 'isEditable', 'isHidden',
    'isDisabled', 'count', 'boundingBox',
]);

/** Intercepts Playwright locators and persists healed selectors back to source files.
 *  Flow: wrapPage → _selfHealingLocator → healer.heal() → _updateFile */
class SelfHealing {
    constructor() {
        this._healer = new Healer();
    }

    /** Proxies page.locator() through self-healing; forwards everything else unchanged. */
    wrapPage(rawPage) {
        if (!rawPage) return rawPage;
        return new Proxy(rawPage, {
            get: (target, prop) => prop === 'locator'
                ? (selector, options) => this._selfHealingLocator(target, selector, options)
                : typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop],
        });
    }

    /** Intercepts ACTION_METHOD calls: runs normally if found (15 s), otherwise heals and persists. */
    _selfHealingLocator(page, selector, options) {
        return new Proxy(page.locator(selector, options), {
            get: (target, prop) => {
                const value = Reflect.get(target, prop);
                if (typeof value !== 'function' || !ACTION_METHODS.has(prop))
                    return (typeof value === 'function' && prop !== 'constructor') ? value.bind(target) : value;

                return async (...args) => {
                    const found = await target.waitFor({ state: 'attached', timeout: 15000 })
                        .then(() => true, () => false);

                    if (!found) {
                        console.warn(`[SelfHealing] "${selector}" not found — asking AI...`);
                        const healed = await this._healer.heal(page, selector).catch(e => {
                            console.error(`[SelfHealing] AI error: ${e.message}`);
                            return null;
                        });
                        if (healed) {
                            let result, succeeded = false;
                            try   { result = await page.locator(healed)[prop](...args); succeeded = true; }
                            catch (e) { console.error(`[SelfHealing] Healed selector "${healed}" failed: ${e.message}`); }
                            if (succeeded) { this._updateFile(selector, healed); return result; }
                        }
                        throw new Error(`[SelfHealing] Could not heal "${selector}"`);
                    }
                    return await value.call(target, ...args);
                };
            },
        });
    }

    /** Finds the POM file containing the old selector and replaces it with the healed one (AST-safe).
     *  If the selector is dynamic (template literal), updates the string arg in flow files instead. */
    _updateFile(oldSelector, newSelector) {
        for (const file of fs.readdirSync(PAGE_OBJECTS_DIR).filter(f => f.endsWith('.js'))) {
            const filePath = path.join(PAGE_OBJECTS_DIR, file);
            const src = fs.readFileSync(filePath, 'utf8');
            if (!src.includes(oldSelector)) continue;

            let patched = false;
            const ast = recast.parse(src, RECAST_OPTS);
            recast.visit(ast, {
                visitStringLiteral(nodePath) {
                    if (nodePath.node.value === oldSelector) {
                        const q = nodePath.node.extra?.raw?.[0] ?? "'";
                        nodePath.node.value = newSelector;
                        nodePath.node.extra = { raw: `${q}${newSelector}${q}`, rawValue: newSelector };
                        patched = true;
                    }
                    this.traverse(nodePath);
                },
            });

            if (patched) {
                fs.writeFileSync(filePath, recast.print(ast).code, 'utf8');
                console.warn(`[SelfHealing] ✓ "${oldSelector}" → "${newSelector}" saved in ${file}`);
            }
            return;
        }
        // Selector is built dynamically from a param — patch the string argument in flow files
        this._updateFlowArgs(oldSelector, newSelector);
    }

    /** For param-based POM functions: finds changed string values and updates the argument in flow files (AST-safe). */
    _updateFlowArgs(oldSelector, newSelector) {
        if (!this._healer.pendingFn || !fs.existsSync(FLOWS_DIR)) return;

        const extract = s => [...s.matchAll(/['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
        const changes = extract(oldSelector)
            .map((v, i) => [v, extract(newSelector)[i]])
            .filter(([o, n]) => o && n && o !== n);
        if (!changes.length) return;

        const fn = this._healer.pendingFn;
        for (const file of fs.readdirSync(FLOWS_DIR).filter(f => f.endsWith('.js'))) {
            const filePath = path.join(FLOWS_DIR, file);
            const src = fs.readFileSync(filePath, 'utf8');
            if (!src.includes(fn)) continue;

            let patched = false;
            const ast = recast.parse(src, RECAST_OPTS);
            recast.visit(ast, {
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
                                patched = true;
                                console.warn(`[SelfHealing] ✓ arg "${match[0]}" → "${match[1]}" in ${path.basename(file)}`);
                            }
                        }
                    }
                    this.traverse(nodePath);
                },
            });

            if (patched) fs.writeFileSync(filePath, recast.print(ast).code, 'utf8');
        }
    }
}

const selfHealing = new SelfHealing();
module.exports = { wrapPage: selfHealing.wrapPage.bind(selfHealing) };
