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

// get the length of the data from the TestData.json.
function dataProviderTest(testFn) {
    const data = Object.values(require('../TDD/TestData.json'))[0];
    data.forEach((row, i) => test(`Iteration ${i + 1} - ${row.name_surname}`, () => testFn(row, i)));
}

// Returns the pre-loaded test data rows for a given class name.
function readJson(className) {
    return require('../TDD/TestData.json')[className] ?? [];
}

// Runs a single data-driven iteration by calling the matching method on T using T.data[i].
async function iteration(T, page, i) {
    const method = T.name[0].toLowerCase() + T.name.slice(1);
    await allure.step(`${T.name} - iteration ${i + 1}`, async () => {
        T.data[i] && await T[method](page, T.data[i]);
    });
}

module.exports = { setup, teardown, dataProviderTest, readJson, iteration };
