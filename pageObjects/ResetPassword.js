class ResetPassword {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    password() {
        return this.page.healingLocator("input[id='password']");
    }

    confirmPassword() {
        return this.page.healingLocator("input[id='confirmPassword']");
    }

    resetPassword() {
        return this.page.healingLocator("button[type='submit']");
    }

    backToLogin() {
        return this.page.healingLocator("button[type='button']");
    }
}

module.exports = ResetPassword;
