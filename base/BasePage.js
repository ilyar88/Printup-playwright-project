const { chromium } = require('@playwright/test');
const { config } = require('../configuration/playwright.config');
const { wrapPage } = require('./SelfHealing');

class BasePage {

    constructor(page) {
        this.page = wrapPage(page);  // wraps page with self-healing proxy
        this.baseUrl = config.baseUrl;
    }

    // Launches browser, opens a maximized context, navigates to baseUrl and returns the page instance
    static async openBrowser() {
        const browser = await chromium.launch({
            headless: config.browser.headless,
            slowMo: config.browser.slowMo,
            args: ['--start-maximized'],
        });
        const context = await browser.newContext({
            viewport: null,  // viewport: null respects the --start-maximized arg
        });
        const page = await context.newPage();
        const instance = new this(page);
        instance.browser = browser;
        instance.context = context;
        await instance.navigate();
        return instance;
    }

    // context.close() must come before browser.close() to flush pending network requests cleanly
    async closeBrowser() {
        await this.context.close();
        await this.browser.close();
    }

    async navigate(path = '') {
        await this.page.goto(`${this.baseUrl}${path}`);
    }

    // Opens a second tab in an existing context — used for flows that require comparing two pages
    static async openNewTab(context, url) {
        const newPage = await context.newPage();
        await newPage.goto(url);
        return newPage;
    }
}

module.exports = BasePage;
