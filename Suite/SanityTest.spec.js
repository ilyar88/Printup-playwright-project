// Playwright and Allure reporting
const { test } = require('@playwright/test'), { allure } = require('allure-playwright');
const BasePage = require('../base/BasePage');
// Workflow steps for each form section
const { LoginFlow,
    ClientInfoFlow,
    ContactInfoFlow,
    ProjectInfoFlow,
    MaterialsInfoFlow,
    LayersInfoFlow,
    ListInfoFlow } = require('../workflows');
const { setup, teardown, dataProviderTest, iteration } = require('../fixtures/Hooks');

// End-to-end sanity suite: login then fill each form section in order
class SanityPage extends BasePage {

    runTests() {
        setup(this);
        teardown(this);

        test.describe('Sanity test', () => {
            // Tests must run sequentially, in one browser, in order — each step depends on the previous
            test.describe.configure({ mode: 'serial' });

            test('#1 Login to the website', async () => {
                await allure.feature('Login');
                await LoginFlow.login(this.page);
            });

            // One test per ClientInfoFlow row via dataProviderTest
            dataProviderTest(
                async (row, i) => {
                    await test.step(`#2 Add client - iteration ${i + 1}`, async () => {
                        await allure.feature('Client info');
                        await iteration(ClientInfoFlow, this.page, i);
                    });
                    await test.step(`#3 Add contact - iteration ${i + 1}`, async () => {
                        await allure.feature('Contact info');
                        await iteration(ContactInfoFlow, this.page, i);
                    });
                    await test.step(`#4 Add project - iteration ${i + 1}`, async () => {
                        await allure.feature('Project info');
                        await iteration(ProjectInfoFlow, this.page, i);
                    });
                    await test.step(`#5 Add material - iteration ${i + 1}`, async () => {
                        await allure.feature('Material info');
                        await iteration(MaterialsInfoFlow, this.page, i);
                    });
                    await test.step(`#6 Add layers - iteration ${i + 1}`, async () => {
                        await allure.feature('Layers info');
                        await iteration(LayersInfoFlow, this.page, i);
                    });
                    await test.step(`#7 Add list - iteration ${i + 1}`, async () => {
                        await allure.feature('List info');
                        await iteration(ListInfoFlow, this.page, i);
                    });
                }
            );

/*             test('#8 Reset password', async () => {
                await allure.feature('Reset password');
                await ForgotPasswordFlow.login(this.page);
            }); */
        });
    }
}

module.exports = SanityPage;

// Bootstrap: instantiate and register tests with Playwright
const sanity = new SanityPage(null);
sanity.runTests();
