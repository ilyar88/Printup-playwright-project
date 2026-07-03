class ResetPassword {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    password() {
        return this.page.locator("input[id='password']");
    }

    confirmPassword() {
        return this.page.locator("input[id='confirmPassword']");
    }

    resetPassword() {
        return this.page.locator("button[type='submit']");
    }

    backToLogin() {
        return this.page.locator("button[type='button']");
    }
}

module.exports = ResetPassword;