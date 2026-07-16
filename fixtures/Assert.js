const { expect } = require('@playwright/test');
const { allure } = require('allure-playwright');

function verifyEquals(actual, expected) {
    expect(actual, `Verify equals failed: ${actual} is not equal to: ${expected}`).toBe(expected);
}

function verifyText(actual, expected) {
    expect(actual, `Verify text failed: '${actual}', does not contain: '${expected}'`).toContain(expected);
}

// Forces the test to fail with a custom message
function assertFailed(message) {
    expect(false, message).toBeTruthy();
}

async function isDisplayed(locator, expected) {
    await allure.step(`Verify element display: ${expected}`, async () => {
        if (expected) {
            await expect(locator).toBeVisible();
        } else {
            await expect(locator).not.toBeVisible();
        }
    });
}

// Soft assert — doesn't fail the test immediately if verification fails
function verifyTextSoft(actual, expected) {
    expect.soft(actual, `Verify text failed: '${actual}', does not contain: '${expected}'`).toContain(expected);
}

module.exports = { verifyEquals, verifyText, assertFailed, isDisplayed, verifyTextSoft };
