class ListInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    options(value) {
        return this.page.locator("div.overflow-visible[dir='ltr'] > :is(button, div)", { hasText: value });
    }

    columnNames(value) {
        return this.page.locator(`tr.border-b > th:has([title="${value}"])`);
    }

    displayItems(value) {
        return this.page.locator("td.text-center", { hasText: value });
    }

    exportSheet() { //יצא גליון
        return this.page.locator("button[type='button'].rounded-lg");
    }
    /***
    * הדפסה
    * שכבות
    * תצוגה
    ***/
    icons(value) {
        return this.page.locator("div.items-center > button.items-center > svg[stroke='currentColor']", { hasText: value });
    }
}

module.exports = ListInfo;