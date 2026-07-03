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
}

module.exports = ItemCenter;
