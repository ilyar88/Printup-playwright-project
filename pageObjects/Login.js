class Login {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    email() {
        return this.page.healingLocator("input[type='email']");
    }

    password() {
        return this.page.healingLocator("input[type='password']");
    }

    forgotPassword() {
        return this.page.healingLocator("button[type='button']").nth(0);
    }

    login() {
        return this.page.healingLocator("button[type='submit']");
    }

    signup() {
        return this.page.healingLocator("button[type='button']").nth(1);
    }
}

module.exports = Login;
