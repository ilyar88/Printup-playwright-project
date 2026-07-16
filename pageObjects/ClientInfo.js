class ClientInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    newCustomer() {
        return this.page.healingLocator("header > div > button.inline-flex");
    }

     clientName() {
        return this.page.healingLocator("input[name='name']");
    }

    editorName() {
        return this.page.healingLocator("input[name='editorName']");
    }

    contactName() {
        return this.page.healingLocator("input[name='contact.person']");
    }

    phoneNumber() {
        return this.page.healingLocator("input[name='contact.phone']");
    }

    email() {
        return this.page.healingLocator("input[name='contact.email']");
    }
    // Includes: מס טל' ראשי (main phone), אימייל (email)
    checkboxes() {
        return this.page.getByRole('checkbox');
    }

    role() {
        return this.page.healingLocator("input[name='contact.role']");
    }

    notes() {
        return this.page.healingLocator("textarea[name='notes']");
    }
    // Button labels: פרטים נוספים (more details), כתובת למשלוח (shipping address), הגדרת תשלומות (payment settings)
    async buttons() {
        return await this.page.healingLocator("button.inline-flex[type='button']").all();
    }

    addIcon() {
        return this.page.healingLocator("button[type='button'].font-medium.text-primary");
    }

    addContact() {
        return this.page.healingLocator("button.border-dashed");
    }

    nextButton() {
        return this.page.getByRole('button', { name: 'הבא' });
    }

    back() {
        return this.page.healingLocator("div.border-t.border-white > div > button");
    }
}

module.exports = ClientInfo;
