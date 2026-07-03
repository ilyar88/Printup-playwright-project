const { test } = require('@playwright/test');
const { allure } = require('allure-playwright');
const fs = require('fs');
const path = require('path');

// Launches the browser once before all tests and wires the shared page/browser/context onto the suite instance
function setup(page) {
    test.beforeAll(async () => {
        const opened = await page.constructor.openBrowser();
        page.page = opened.page;
        page.browser = opened.browser;
        page.context = opened.context;
    });
    // Capture and attach a screenshot to Allure only when the test fails
    test.afterEach(async ({}, testInfo) => {
        if (testInfo.status !== testInfo.expectedStatus) {
            const date = new Date().toISOString().split('T')[0];
            const dir = path.resolve(__dirname, `../screenshots/${date}`);
            fs.mkdirSync(dir, { recursive: true });
            const filePath = path.join(dir, `${testInfo.title}.png`);
            await page.page.screenshot({ path: filePath, fullPage: true });
            await allure.attachment(testInfo.title, fs.readFileSync(filePath), 'image/png');
        }
    });
}

// Kept separate from setup so tests that need the browser open after the last test can omit teardown()
function teardown(page) {
    test.afterAll(async () => {
        await page.closeBrowser();
    });
}

module.exports = { setup, teardown };
