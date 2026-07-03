const Login = require('../pageObjects/Login');
const { typeText, click, checkUI } = require('../fixtures/User interface');
const { verifyEquals } = require('../fixtures/Assert');

// Automates the login page using credentials from environment variables.
class LoginFlow {
    static async login(page) {
        const loginPage = new Login(page);
        await typeText(loginPage.email(), process.env.EMAIL);
        await typeText(loginPage.password(), process.env.PASSWORD);
        await click(loginPage.login());
        const title = await page.title();
        verifyEquals(title, 'PrintUP test');
        //await checkUI(page, 'Login page UI');
    }
}

module.exports = LoginFlow;
