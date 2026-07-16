'use strict';

const { z } = require('zod');
const { allure } = require('allure-playwright');
const { McpServer }         = require('@modelcontextprotocol/sdk/server/mcp.js');
const { Client }            = require('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js');

/** Spins up an in-process MCP server exposing the live page — and the original failed action — as tools. */
async function connectMcp(page, prop, args) {
    const server = new McpServer({ name: 'playwright-healer', version: '1.0.0' });
    const state = { done: false, healedSelector: null, actionResult: undefined };

    server.registerTool('get_snapshot', {
        description: 'Returns an ARIA accessibility snapshot of the current page, reflecting its live state.',
    }, async () => ({ content: [{ type: 'text', text: await page.locator('html').ariaSnapshot() }] }));

    server.registerTool('check_selector', {
        description: 'Checks how many elements a CSS selector matches on the current page and returns their text, so you can verify a candidate selector before using it.',
        inputSchema: { selector: z.string() },
    }, async ({ selector }) => {
        const texts = await page.locator(selector).all()
            .then(els => Promise.all(els.slice(0, 5).map(el => el.textContent().catch(() => ''))))
            .catch(() => null);
        return { content: [{ type: 'text', text: texts ? JSON.stringify({ count: texts.length, texts }) : 'Invalid selector' }] };
    });

    server.registerTool('perform_action', {
        description: `Performs the original "${prop}" action on the given selector. Call this once you've verified the selector with check_selector — this both confirms your fix and completes the healing.`,
        inputSchema: { selector: z.string() },
    }, async ({ selector }) => {
        try {
            state.actionResult = await page.locator(selector)[prop](...args);
            state.healedSelector = selector;
            state.done = true;
            return { content: [{ type: 'text', text: 'Action succeeded — healing complete.' }] };
        } catch (e) {
            return { content: [{ type: 'text', text: `Action failed: ${e.message}` }] };
        }
    });

    server.registerTool('report_dom_issue', {
        description: 'Records a DOM discrepancy you noticed while healing, visible in the test report.',
        inputSchema: { note: z.string() },
    }, async ({ note }) => {
        await allure.step(`[SelfHealing] DOM issue: ${note}`, () => {});
        return { content: [{ type: 'text', text: 'logged' }] };
    });

    const client = new Client({ name: 'healer-client', version: '1.0.0' });
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return { client, state, close: () => Promise.all([server.close(), client.close()]) };
}

module.exports = { connectMcp };
