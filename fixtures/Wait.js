const { expect } = require('@playwright/test');
const { allure } = require('allure-playwright');
const { verifyText, assertFailed } = require('./Assert');

// Waits for a locator state by name — supports ELEMENT_EXISTS, ELEMENT_DISPLAYED, ELEMENT_INVISIBLE, ELEMENT_CLICKABLE
async function waitFor(locator, forElement, seconds) {
    const timeout = seconds * 1000;
    switch (For.parse(forElement)) {
        case For.ELEMENT_EXISTS:
            await expect(locator).toBeAttached({ timeout });
            break;
        case For.ELEMENT_DISPLAYED:
            await expect(locator).toBeVisible({ timeout });
            break;
        case For.ELEMENT_INVISIBLE:
            await expect(locator).toBeHidden({ timeout });
            break;
        case For.ELEMENT_CLICKABLE: {
            await expect(locator).toBeVisible({ timeout });
            await expect(locator).toBeEnabled({ timeout });
            break;
        }
        default:
            throw new Error(`Unsupported wait condition: ${forElement}`);
    }
}

async function waitForListSize(locator, size, seconds) {
    const timeout = seconds * 1000;
    try {
        await expect(locator).toHaveCount(size, { timeout });
    } catch (e) {
        // Report actual count instead of a raw Playwright timeout error
        const count = await locator.count();
        assertFailed(`Expected list size >= ${size} but found ${count}`);
    }
}

async function waitUntilUrlContains(page, uri) {
    await allure.step(`Wait for uri: ${uri}`, async () => {
        try {
            await expect(page).toHaveURL(new RegExp(uri), { timeout: 5000 });
        } catch (e) {
            // Fallback to a soft text assertion so the failure message shows the actual URL
            const actual = page.url();
            verifyText(actual, uri);
        }
    });
}

// Accepts a human-readable string e.g. "30 Seconds", "2 Minutes", "1 Hours"
async function waitForTime(timeText) {
    const parts = timeText.split(' ');
    const value = parseInt(parts[0]);
    const unit = parts[1];
    let millis;
    switch (unit) {
        case 'Seconds':
            millis = value * 1000;
            break;
        case 'Minutes':
            millis = value * 60000;
            break;
        case 'Hours':
            millis = value * 3600000;
            break;
        default:
            throw new Error(`Invalid unit: ${unit}`);
    }
    await new Promise(r => setTimeout(r, millis));
}

const For = {
    ELEMENT_EXISTS: 'ELEMENT_EXISTS',
    ELEMENT_DISPLAYED: 'ELEMENT_DISPLAYED',
    ELEMENT_CLICKABLE: 'ELEMENT_CLICKABLE',
    ELEMENT_INVISIBLE: 'ELEMENT_INVISIBLE',
    parse(s) {
        const key = s.trim().replace(/[ -]/g, '_').toUpperCase();
        return For[key] || For.ELEMENT_EXISTS;
    }
};

module.exports = { waitFor, waitForListSize, waitUntilUrlContains, waitForTime };
