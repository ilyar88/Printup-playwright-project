// Playwright and Allure reporting
const { test } = require('@playwright/test'), { allure } = require('allure-playwright');
const BasePage = require('../base/BasePage');
// Workflow steps for each form section
const { LoginFlow,
    ClientInfoFlow,
    ContactInfoFlow,
    ProjectInfoFlow,
    MaterialsInfoFlow,
    LayersInfoFlow } = require('../workflows');
const { setup, teardown } = require('../fixtures/Hooks');
const { iteration } = require('../fixtures/User interface');

// End-to-end sanity suite: login then fill each form section in order
class SanityPage extends BasePage {

    runTests() {
        setup(this);
        teardown(this);

        // Tests must run sequentially (each step depends on the previous)
        test.describe.configure({ mode: 'serial' });
        test.describe('Sanity test', () => {

            test('#1 Login to the website', async () => {
                await allure.feature('Login');
                await LoginFlow.login(this.page);
            });

            // Loop allows scaling to multiple data-driven iterations
            for (let i = 0; i < ClientInfoFlow.data.length; i++) {
                test(`#2 Add client - iteration ${i + 1}`, async () => {
                    await allure.feature('Client info');
                    await iteration(ClientInfoFlow, this.page, i);
                });
                test(`#3 Add contact - iteration ${i + 1}`, async () => {
                    await allure.feature('Contact info');
                    await iteration(ContactInfoFlow, this.page, i);
                });
                test(`#4 Add project - iteration ${i + 1}`, async () => {
                    await allure.feature('Project info');
                    await iteration(ProjectInfoFlow, this.page, i);
                });
                test(`#5 Add material - iteration ${i + 1}`, async () => {
                    await allure.feature('Material info');
                    await iteration(MaterialsInfoFlow, this.page, i);
                });
                test(`#6 Add layers - iteration ${i + 1}`, async () => {
                    await allure.feature('Layers info');
                    await iteration(LayersInfoFlow, this.page, i);
                });
            }
        });
    }
}

module.exports = SanityPage;

// Bootstrap: instantiate and register tests with Playwright
const sanity = new SanityPage(null);
sanity.runTests();
