'use strict';

const fs        = require('fs');
const path      = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const PAGE_OBJECTS_DIR = path.join(__dirname, '../pageObjects');
const FLOWS_DIR        = path.join(__dirname, '../workflows');

const escapeRe        = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isHebrew        = s => /[֐-׿]/.test(s);
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

/** Collects codebase context and uses Claude + Playwright ARIA snapshot to find a replacement selector. */
class AriaHealer {
    constructor() {
        this._cache    = new Map();
        this._ai       = null;
        this.pendingFn = null; // set during heal(), read by SelfHealing._updateFlowArgs
    }

    /** Lazy-initialises the Anthropic client once and reuses it. */
    _getAI() {
        return this._ai ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    /** Sends a single prompt to Claude and returns the cleaned CSS selector, or null. */
    async _askAI(prompt) {
        const res = await this._getAI().messages.create({
            model: 'claude-sonnet-4-6', max_tokens: 150,
            messages: [{ role: 'user', content: prompt }],
        });
        const raw = res.content[0]?.text?.trim() ?? null;
        return raw ? raw.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim() : null;
    }

    /**
     * Collects semantic context for the broken selector.
     * Phase 1 – POM: finds the owning method name + any comment above it.
     * Phase 2 – Flows: gathers // comments and inline hints from files that call that method.
     * Returns: { functionName, pomHint, flowHints[], isParamBased }
     */
    _getContext(selector) {
        const ctx = { functionName: null, pomHint: null, flowHints: [], isParamBased: false };

        // 1. POM: literal match first, then template-literal match for param-based functions
        for (const useTpl of [false, true]) {
            if (ctx.functionName) break;
            for (const file of fs.readdirSync(PAGE_OBJECTS_DIR).filter(f => f.endsWith('.js'))) {
                const src = fs.readFileSync(path.join(PAGE_OBJECTS_DIR, file), 'utf8');
                if (!useTpl && !src.includes(selector)) continue;
                const lines = src.split('\n');
                let commentAcc = [];
                for (let i = 0; i < lines.length; i++) {
                    const t = lines[i].trim();
                    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) {
                        commentAcc.push(t.replace(/^[/*\s]+|[/*\s]+$/g, '').trim());
                        continue;
                    }
                    const mMatch = t.match(/^(?:async\s+)?([a-zA-Z_]\w*)\s*\(/);
                    const body   = lines.slice(i, i + 10).join('\n');
                    if (mMatch && !JS_KEYWORDS.has(mMatch[1]) && (useTpl ? matchesTemplate(body, selector) : body.includes(selector))) {
                        ctx.functionName = mMatch[1];
                        ctx.pomHint      = commentAcc.filter(Boolean).join(' ').trim() || null;
                        ctx.isParamBased = useTpl;
                        break;
                    }
                    commentAcc = [];
                }
                if (ctx.functionName) break;
            }
        }

        if (!ctx.functionName || !fs.existsSync(FLOWS_DIR)) return ctx;

        // 2. Flows: collect comment hints near usages of the function
        // For parameterized functions, narrow to files that call it with the exact argument value
        const argVal = ctx.isParamBased
            ? [...selector.matchAll(/["']([^"']+)["']/g)].map(m => m[1])[0] ?? null
            : null;
        const fnCall = `${ctx.functionName}(`;
        for (const file of fs.readdirSync(FLOWS_DIR).filter(f => f.endsWith('.js'))) {
            const src = fs.readFileSync(path.join(FLOWS_DIR, file), 'utf8');
            if (!src.includes(fnCall)) continue;
            if (argVal && !src.includes(argVal)) continue;
            for (const line of src.split('\n')) {
                const t = line.trim();
                if (t.startsWith('//')) { ctx.flowHints.push(t.replace(/^\/\/\s*/, '').trim()); continue; }
                if (t.includes(fnCall) && t.includes('//'))
                    ctx.flowHints.push(t.slice(t.lastIndexOf('//') + 2).trim());
            }
        }
        ctx.flowHints = [...new Set(ctx.flowHints)].filter(Boolean);
        return ctx;
    }

    /** Collects codebase context then asks Claude twice — original language first, then translation fallback. */
    async heal(page, selector) {
        if (!process.env.ANTHROPIC_API_KEY) return null;
        if (this._cache.has(selector)) {
            console.warn(`[SelfHealing] Using cached: "${this._cache.get(selector)}"`);
            return this._cache.get(selector);
        }

        const { functionName, pomHint, flowHints, isParamBased } = this._getContext(selector);
        this.pendingFn = functionName;

        if (functionName)
            console.warn(`[SelfHealing] Context → fn: ${functionName} (${isParamBased ? 'parameterized' : 'static'})` +
                (pomHint ? `, hint: ${pomHint}` : '') +
                (flowHints.length ? `, flow: ${flowHints.slice(0, 3).join(' | ')}` : ''));

        const contextLines = [
            flowHints.length && `Flow hints        : ${flowHints.join(' | ')}`,
            functionName     && `POM function      : ${functionName} (${isParamBased ? 'parameterized — fix the string argument' : 'static — fix the CSS selector'})`,
            pomHint          && `POM comment       : ${pomHint}`,
        ].filter(Boolean).join('\n');

        const lang      = isHebrew([selector, pomHint, ...flowHints].filter(Boolean).join(' ')) ? 'Hebrew' : 'English';
        const otherLang = lang === 'Hebrew' ? 'English' : 'Hebrew';

        // ARIA snapshot — semantically richer than raw HTML, no size cap workaround needed
        const { full: snapshot } = await page._snapshotForAI();

        const base =
            `Playwright selector broke after a UI change.\nFailed: ${selector}\n` +
            (contextLines ? `\nSemantic context from codebase:\n${contextLines}\n` : '') +
            `\nReturn ONLY a valid CSS selector for the same element. No explanation.\n\nARIA snapshot:\n${snapshot}`;

        // Attempt 1 — search in the detected language
        let healed = await this._askAI(
            base + `\nExpected value language: ${lang}. Search for a ${lang} match in the snapshot.`
        );

        // Attempt 2 — retry with explicit language translation fallback
        if (!healed) {
            console.warn(`[SelfHealing] No ${lang} match — retrying with ${otherLang} translation...`);
            healed = await this._askAI(
                base + `\nNo ${lang} match found. Translate the string values in the selector to ${otherLang} and find the element.`
            );
        }

        // Both attempts failed
        if (!healed) {
            console.error(`[SelfHealing] Could not heal "${selector}" in ${lang} or ${otherLang}.`);
            return null;
        }

        this._cache.set(selector, healed);
        return healed;
    }
}

module.exports = AriaHealer;
