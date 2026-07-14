class ItemCenter {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    //titles
    //הוסף חומר חדש
    //העלאה
    //חומרים
    //שכבות
    //תמונה
    //רשימה
    //תצוגת רשת
    //הגדרות
    //התראה
    //הדפסה
    items(value) {
        return this.page.locator(`button[title="${value}"]`, { exact: true });
    }

    // Open document tab (e.g. "הדפסת שכבות") — an alternate route into a section when its
    // sidebar icon button (items()) is disabled
    documentTab(value) {
        return this.page.locator('button', { hasText: value }).first();
    }
}

module.exports = ItemCenter;
