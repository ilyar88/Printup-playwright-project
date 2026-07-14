class MaterialsInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }
  
    upload() {
        return this.page.locator("input[type='file']");
    }

    dropdowns(value) {
        return this.page.locator(`input[placeholder='${value}']`);
    }

    // :visible excludes stale/hidden popups left in the DOM from a previous dropdown that
    // wasn't fully unmounted — without it, matching text in another popup causes a strict-mode
    // violation (multiple elements matched).
    chooseOption(value) {
        return this.page.locator(`div.absolute.z-50 button:visible`, { hasText: value });
    }
    /***
    * Yuli design
    * רשימה B
    * קטוגריה A
    * לפי החומר
    ***/
    categoryMaterials(value) {
        return this.page.locator(`.flex-row-reverse button`, { hasText: value });
    }

    keepPermanent() {
        return this.page.locator("label:has(input[type='checkbox'].sr-only)");
    }

    anotherName() {
        return this.page.locator(`div.grid:has(label:text-is("שם אחר")) input`);
    }

    save() {
        return this.page.locator("button[type='submit']");
    }

    materialDetails(value) {
        return this.page.locator(`span.flex.flex-col.items-center.text-center.leading-tight`, { hasText: value });
    }
}

module.exports = MaterialsInfo;