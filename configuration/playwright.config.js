require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { defineConfig } = require('@playwright/test');

// Shared config object — consumed by both Playwright and BasePage
const config = {
    baseUrl: process.env.URL,
    applitoolsKey: process.env.APPLITOOLS_KEY,
    browser: {
        headless: process.env.HEADLESS === 'true',
        slowMo: 300,
        viewport: { width: 1280, height: 720 },
    },
};

module.exports = defineConfig({
    testDir: '../Suite',
    testMatch: '**/*.spec.js',
    timeout: 60000,
    expect: {
        timeout: 10000,
    },
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: [['html', { open: 'never' }], ['list'], ['allure-playwright']],
    use: {
        baseURL: config.baseUrl,
        headless: config.browser.headless,
        viewport: config.browser.headless ? config.browser.viewport : null,  // null lets --start-maximized take effect in headed mode
        actionTimeout: 30000,
        navigationTimeout: 30000,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    projects: [
        { name: 'chrome', browserName: 'chromium' },
        { name: 'edge', browserName: 'chromium' },
        { name: 'firefox', browserName: 'firefox' },
    ].map(({ name, browserName }) => ({
        name,
        use: {
            browserName,
            launchOptions: {
                slowMo: config.browser.slowMo,
                // --start-maximized is Chromium-only and only applies in headed mode
                ...(browserName !== 'firefox' && { args: config.browser.headless ? [] : ['--start-maximized'] }),
            },
        },
    })),
});

module.exports.config = config;
