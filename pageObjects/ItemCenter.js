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
    items(name) {
        return this.page.locator(`div.relative.flex.items-center.justify-center > button[title="${name}"]`);
    }
}

module.exports = ItemCenter;
