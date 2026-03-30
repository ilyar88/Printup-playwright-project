require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { defineConfig } = require('@playwright/test');

const config = {
    baseUrl: process.env.URL,
    browser: {
        headless: false,
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
        viewport: config.browser.headless ? config.browser.viewport : null,
        actionTimeout: 30000,
        navigationTimeout: 30000,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
                launchOptions: {
                    slowMo: config.browser.slowMo,
                    args: config.browser.headless ? [] : ['--start-maximized'],
                },
            },
        },
    ],
});

module.exports.config = config;
