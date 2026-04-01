class ClientInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    } 

    newCustomer() {
        return this.page.locator("header > div > button.inline-flex");
    }

    clientName() {
        return this.page.locator("input[name='name']");
    }

    contactName() {
        return this.page.locator("input[name='contact.person']");
    }

    phoneNumber() {
        return this.page.locator("input[name='contact.phone']");
    }

    email() {
        return this.page.locator("input[name='contact.email']");
    }
    /***
    * מס טל' ראשי - Main phone number
    * אימייל - Email
    ***/
    checkboxes() {
        return this.page.getByRole('checkbox');
    }

    role() {
        return this.page.locator("input[name='contact.role']");
    }

    notes() {
        return this.page.locator("textarea[name='notes']");
    }
    /***
    * פרטים נוספים - More Details
    * כתובת למשלוח - Shipping Address
    * הגדרת תשלומות - Payment Settings
    ***/
    async buttons() {
        return await this.page.locator("button.inline-flex[type='button']").all();
    }

    addIcon() {
        return this.page.locator("button[type='button'].font-medium.text-primary");
    }

     addContact() {
        return this.page.locator("button.border-dashed");
    }

    nextButton() {
        return this.page.locator("div > span> button");
    }

    back() {
        return this.page.locator("div.border-t.border-white > div > button");
    }
}

module.exports = ClientInfo;
