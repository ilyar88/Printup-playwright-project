class MaterialsInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }
    //Dropdown
    dropdowns(name) {
        return this.page.locator(`input[placeholder='${name}']`);
    }

    chooseOption(name) {
        return this.page.locator(`div.absolute.z-50 button`, { hasText: name });
    }

    thickness() {
        return this.page.locator("input[type='number']");
    }
    /***
    * Yuli design
    * רשימה B
    * קטוגריה A
    * לפי החומר
    ***/
    categoryMaterials(name) {
        return this.page.locator(`.flex-row-reverse button`, { hasText: name });
    }

    keepPermanent() {
        return this.page.locator("label:has(input[type='checkbox'].sr-only)");
    }

    save() {
        return this.page.locator("button[type='submit']");
    }
}

module.exports = MaterialsInfo;