const os = require('os');
const path = require('path');
const { allure } = require('allure-playwright');
const { Eyes, Target } = require('@applitools/eyes-playwright');
const { waitForTime } = require('./Wait');

const envValues = Object.values(process.env).filter(v => v && v.length > 0);
const isSensitive = text => envValues.includes(text);
const mask = text => text[0] + '*'.repeat(text.length - 1);

// Clears and fills a field and masks sensitive values (env vars) in Allure reports.
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

// Returns whether the locator's text contains the given string.
async function hasText(locator, text) {
    return (await locator.textContent())?.includes(text) ?? false;
}

// Checks or unchecks a checkbox based on whether text includes 'yes'.
async function isChecked(locator, text) {
    const yes = text.includes('yes');
    await allure.step(yes ? 'Checkbox enabled' : 'Checkbox disabled', () =>
        yes ? locator.check() : locator.uncheck()
    );
}

// Selects a dropdown option by 'value' (native <select>, falling back to an autocomplete widget) or by 'index'.
async function selectOption(locator, option, value) {
    if (option === 'index') {
        await locator.selectOption({ index: parseInt(value) });
    } else if (option === 'value') {
        // Check the tag first — an <input> can never have an <option> child, avoiding a wasted timeout wait
        const isSelect = await locator.evaluate(el => el.tagName.toLowerCase()) === 'select';
        const current = isSelect
            ? await locator.locator('option:checked').textContent().catch(() => '')
            : await locator.inputValue().catch(() => '');
        if (current && current.trim().includes(value.trim())) {
            // Already selected — nothing to do
        } else if (isSelect) {
            // Wait for the target option, not just any option a placeholder is often already attached
            await locator.locator('option').filter({ hasText: value.trim() }).waitFor({ state: 'attached', timeout: 3000 }).catch(() => { });
            const match = await locator.locator('option').evaluateAll(
                (opts, v) => opts.find(o => o.textContent.trim().includes(v))?.value,
                value.trim()
            );
            if (match === undefined) throw new Error(`No option matching "${value}" found in <select>`);
            await locator.selectOption({ value: match });
        } else {
            // Autocomplete widget — type the value, then click the matching suggestion to select it and close the dropdown
            await locator.fill(value);
            const suggestion = locator.page().locator(`div button:visible`, { hasText: value }).first();
            if (await suggestion.count() > 0) await suggestion.click();
        }
    } else {
        throw new Error(`Invalid select type: ${option}`);
    }
    const checked = locator.locator('option:checked');
    if (await checked.count() > 0) {
        await allure.step(`Select option: ${await checked.textContent()}`, async () => { });
    }
}

// Fills a date input. Converts 'DD.MM.YYYY' format to 'YYYY-MM-DD' as expected by HTML date fields.
async function selectDate(locator, date) {
    const [d, m, y] = date.split('.');
    await allure.step(`Select date: ${date}`, () =>
        locator.fill(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    );
}

async function uploadFile(locator, filePath) {
    if (!filePath) return;

    const relativePath = filePath.split(/[\\/]/).join(path.sep);
    await allure.step(`Upload file: ${relativePath}`, async () => {
        const page = locator.page();
        // Brief pause before interacting — mimics a human pausing to pick the file rather than an instant action
        await waitForTime('300 Milliseconds');
        const isFileInput = await locator.evaluate(el => el.tagName === 'INPUT' && el.type === 'file');
        if (isFileInput) {
            await locator.setInputFiles(relativePath);
        } else {
            const [chooser] = await Promise.all([
                page.waitForEvent('filechooser'),
                locator.click(),
            ]);
            await chooser.setFiles(relativePath);
        }
        // Wait for the upload to finish settling before continuing
        await page.waitForLoadState('networkidle');
        await waitForTime('1 Seconds');

        // Dismiss the app's post-upload "still uploading?" dialog if it appears, so it doesn't block the next action
        const continueAnyway = page.locator('button', { hasText: 'המשך בכל זאת' });
        if (await continueAnyway.count() > 0) await continueAnyway.click();
    });
}

// Uploads via a native OS file dialog (AutoIt): opens the dialog, types the path, clicks Open.
async function uploadFileAutoIt(locator, title, filePath) {
    if (!filePath) return;
    // Loaded lazily — this Windows-only binding would crash module load on Linux CI if required at file scope
    const { init, winWaitActive, controlSetText, controlClick } = require('node-autoit-koffi');
    // Excel test data stores Windows-style backslashes — normalize so the path works on Linux too
    const relativePath = filePath.split(/[\\/]/).join(path.sep);
    await allure.step(`Upload file via dialog: ${relativePath}`, async () => {
        await init();
        await click(locator);
        await winWaitActive(title, undefined, 5000);
        // Quoted: the native dialog's filename field splits unquoted paths on spaces
        await controlSetText(title, undefined, 'Edit1', `"${relativePath}"`);
        await controlClick(title, undefined, 'Button1');
        await waitForTime('1 Seconds');
    });
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
        await eyes.close().catch(() => { });
        await page.setViewportSize(screenSize);
    });
}

module.exports = {
    typeText, click, hasText, selectOption, selectDate,
    isChecked, uploadFile, uploadFileAutoIt, checkUI
};
