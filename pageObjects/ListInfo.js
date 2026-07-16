class ListInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    options(value) {
        return this.page.healingLocator("div.overflow-visible[dir='ltr'] > :is(button, div)", { hasText: value });
    }

    columnNames(value) {
        return this.page.healingLocator(`tr.border-b > th:has([title="${value}"])`);
    }

    displayItems(value) {
        return this.page.healingLocator("td.text-center", { hasText: value });
    }

    exportSheet() { //יצא גליון
        return this.page.healingLocator("button[type='button'].rounded-lg");
    }
    // Icon values: הדפסה (print), שכבות (layers), תצוגה (view)
    icons(value) {
        return this.page.healingLocator("div.items-center > button.items-center > svg[stroke='currentColor']", { hasText: value });
    }
}

module.exports = ListInfo;
