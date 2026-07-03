const Login = require('../pageObjects/Login');
const resetPassword = require('../pageObjects/ResetPassword');
const { typeText, click, checkUI } = require('../fixtures/User interface');
const { verifyEquals } = require('../fixtures/Assert');
const { ImapFlow } = require('imapflow');
const BasePage = require('../base/BasePage');

class ForgotPasswordFlow {
    static async login(page) {
        const loginPage = new Login(page);
        await click(loginPage.forgotPassword());
        await typeText(loginPage.email(), process.env.EMAIL);
        await click(loginPage.login());
        const resetPage = await ForgotPasswordFlow.getResetPasswordUrl(page);
        const resetPasswordPage = new resetPassword(resetPage);
        const title = await resetPage.title();
        verifyEquals(title, 'Client');
        await typeText(resetPasswordPage.password(), process.env.NEW_PASSWORD);
        await typeText(resetPasswordPage.confirmPassword(), process.env.NEW_PASSWORD);
        await click(resetPasswordPage.resetPassword());
        await resetPage.close();
        await new BasePage(page).navigate();
        title = await page.title();
        verifyEquals(title, 'PrintUP test');
    }

    static async getResetPasswordUrl(page) {
        const client = new ImapFlow({
            host: 'imap.gmail.com',
            port: 993,
            secure: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.APP_PASSWORD,
            },
            logger: false,
        });

        await client.connect();
        const lock = await client.getMailboxLock('INBOX');

        try {
            let uids = [];
            const deadline = Date.now() + 30000;
            while (uids.length === 0 && Date.now() < deadline) {
                uids = await client.search({ body: 'reset-password?token', seen: false }, { uid: true });
                if (uids.length === 0) await new Promise(r => setTimeout(r, 3000));
            }
            const uid = uids[uids.length - 1];
            const message = await client.fetchOne(uid, { source: true }, { uid: true });
            const source = message.source.toString();
            const match = source.match(/https?:\/\/[^\s<>"]+\/reset-password\?token=[^\s<>"]+/i);
            const url = match[0];
            return await BasePage.openNewTab(page.context(), url);
        } finally {
            lock.release();
            await client.logout();
        }
    }
}

module.exports = ForgotPasswordFlow;