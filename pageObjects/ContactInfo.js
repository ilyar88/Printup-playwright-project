class ContactInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    fullName() {
        return this.page.healingLocator("input[name='contacts.0.name']");
    }

    phoneNumber() {
        return this.page.healingLocator("input[name='contacts.0.phone']");
    }

    email() {
        return this.page.healingLocator("input[name='contacts.0.email']");
    }

    role() {
        return this.page.healingLocator("input[name='contacts.0.role']");
    }

    notes() {
        return this.page.healingLocator("textarea[name='contacts.0.notes']");
    }

    nextButton() {
        return this.page.healingLocator("span.group.relative.inline-flex > button");
    }
}

module.exports = ContactInfo;
