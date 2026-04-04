class MaterialsInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    //Dropdown
    materialType() {
        return this.page.locator("input[placeholder='שם מותאם']");
    }
    //Dropdown
    thickness() {
        return this.page.locator("input[type='number']");
    }
    //Dropdown
    color() {
        return this.page.locator("input[placeholder='בחר גוון...']");
    }
    //Dropdown
    textureMaterial() {
        return this.page.locator("input[placeholder='בחר מרקם...']");
    }
    //Dropdown
    materialType_2() {
        return this.page.locator("input[placeholder='בחר סוג...']");
    }
    /***
    * Yuli design
    * רשימה B
    * קטוגריה A
    * לפי החומר
    ***/
    async categoryMaterials(names) {
        for (const name of names) {
            await this.page.locator(`.flex-row-reverse button`, { hasText: name }).click();
        }
    }

    keepPermanent() {
        return this.page.locator("input[type='checkbox']");
    }

    save() {
        return this.page.locator("button[type='submit']");
    }
}

module.exports = MaterialsInfo;