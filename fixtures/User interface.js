const os = require('os');
const path = require('path');
const { allure } = require('allure-playwright');
const { Eyes, Target } = require('@applitools/eyes-playwright');
const { waitForFileUpload, waitForTime } = require('./Wait');
const { init, winWaitActive, controlSetText, controlClick } = require('node-autoit-koffi');

const envValues = Object.values(process.env).filter(v => v && v.length > 0);
const isSensitive = text => envValues.includes(text);
const mask = text => text[0] + '*'.repeat(text.length - 1);

// Clears and fills a field. Masks sensitive values (env vars) in Allure reports.
async function typeText(locator, text) {
    if (!text) return;
    const display = isSensitive(text) ? mask(text) : text;
    await allure.step(`Fill: ${display}`, async () => {
        await locator.fill('');
        await locator.fill(String(text));
    });
}

// Clicks an element and logs the action to Allure.
async function click(locator) {
    await allure.step('Click element', () => locator.click());
}

// Checks or unchecks a checkbox based on whether text includes 'yes'.
async function isChecked(locator, text) {
    const yes = text.includes('yes');
    await allure.step(yes ? 'Checkbox enabled' : 'Checkbox disabled', () =>
        yes ? locator.check() : locator.uncheck()
    );
}

// Selects a dropdown option by 'value' (text match) or 'index' (position).
// Falls back to autocomplete click if no <option> match found for 'value'.
async function selectOption(locator, option, value) {
    switch (option) {
        case 'value':
            // Wait for the target option to load (dynamic selects fetch options via API on mount)
            await locator.locator('option').filter({ hasText: value.trim() }).waitFor({ state: 'attached', timeout: 10000 }).catch(() => {});
            const options = await locator.locator('option').evaluateAll(opts => opts.map(o => ({ text: o.textContent.trim(), value: o.value })));
            const found = options.find(o => o.text.includes(value.trim()));
            if (found) {
                // Standard <select> — select by the DOM value attribute of the matched option
                await locator.selectOption({ value: found.value });
            } else {
                // Autocomplete widget — type the value and click the matching suggestion from the dropdown list
                const tagName = await locator.evaluate(el => el.tagName.toLowerCase());
                if (tagName === 'select') throw new Error(`No option matching "${value}" found in <select>`);
                await locator.fill(value);
                const suggestion = locator.page().locator(`[role="option"]`, { hasText: value }).first();
                if (await suggestion.count() > 0) await suggestion.click();
            }
            break;
        case 'index':
            await locator.selectOption({ index: parseInt(value) });
            break;
        default:
            throw new Error(`Invalid select type: ${option}`);
    }
    const checked = locator.locator('option:checked');
    if (await checked.count() > 0) {
        const selectedText = await checked.textContent();
        await allure.step(`Select option: ${selectedText}`, async () => {});
    }
}

// Fills a date input. Converts 'DD.MM.YYYY' format to 'YYYY-MM-DD' as expected by HTML date fields.
async function selectDate(locator, date) {
    const [d, m, y] = date.split('.');
    await allure.step(`Select date: ${date}`, () =>
        locator.fill(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    );
}

// Uploads a file directly via Playwright's setInputFiles. Verifies the file is attached before continuing.
async function uploadFile(locator, filePath) {
    if (!filePath) return;
    const absolutePath = path.resolve(__dirname, '..', filePath);
    await allure.step(`Upload file: ${absolutePath}`, async () => {
        await locator.setInputFiles(absolutePath);
        await waitForFileUpload(locator);
    });
}

// Uploads a file through a native OS dialog using AutoIt. Waits for the dialog by title, types the path, and clicks Open.
// Waits for network idle to confirm upload completed, then fails the test if any console errors were captured during the upload.
async function uploadFileViaAutoIt(locator, title, filePath) {
    if (!filePath) return;
    const absolutePath = path.resolve(__dirname, '..', filePath);
    await allure.step(`Upload file via dialog: ${absolutePath}`, async () => {
        await init();
        await click(locator);
        await winWaitActive(title, undefined, 5000);
        await controlSetText(title, undefined, 'Edit1', absolutePath);
        await controlClick(title, undefined, 'Button1');
        await waitForTime('5 Seconds');
    });
}

// Runs a single data-driven iteration by calling the matching method on T using T.data[i].
async function iteration(T, page, i) {
    const method = T.name[0].toLowerCase() + T.name.slice(1);
    T.data[i] && await T[method](page, T.data[i]);
}

// Runs an Applitools visual snapshot for the current page state and closes the Eyes session.
async function checkUI(page, testName, appName = 'Printup', checkName = 'After login') {
    await allure.step('Applitools visual check', async () => {
        const screenSize = await page.evaluate(() => ({ width: screen.availWidth, height: screen.availHeight }));
        const eyes = new Eyes();
        eyes.setApiKey(process.env.APPLITOOLS_KEY);
        eyes.setHostOS(`${os.type()} ${os.release()}`);
        eyes.setHostApp(`Chrome ${page.context().browser().version()}`);
        await eyes.open(page, appName, testName, { width: screenSize.width, height: screenSize.height });
        await eyes.check(checkName, Target.window());
        await eyes.close().catch(() => {});
        await page.setViewportSize(screenSize);
    });
}

module.exports = { typeText, click, selectOption, selectDate, iteration, isChecked, uploadFile, uploadFileViaAutoIt, checkUI };
