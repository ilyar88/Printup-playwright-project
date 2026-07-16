class MaterialsInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    upload() {
        return this.page.healingLocator("input[type='file']");
    }

    dropdowns(value) {
        return this.page.healingLocator(`input[placeholder='${value}']`);
    }

    // :visible avoids matching a stale/hidden popup left over from a previous dropdown
    // (otherwise a leftover match causes a strict-mode violation — multiple elements matched)
    chooseOption(value) {
        return this.page.healingLocator(`div.absolute.z-50 button:visible`, { hasText: value });
    }
    // Category tab values: לפי החומר, קטוגריה A, רשימה B, Yuli design
    categoryMaterials(value) {
        return this.page.healingLocator(`.flex-row-reverse button`, { hasText: value });
    }

    keepPermanent() {
        return this.page.healingLocator("label:has(input[type='checkbox'].sr-only)");
    }

    anotherName() {
        return this.page.healingLocator(`div.grid:has(label:text-is("שם אחר")) input`);
    }

    save() {
        return this.page.healingLocator("button[type='submit']");
    }

    materialDetails(value) {
        return this.page.healingLocator(`span.flex.flex-col.items-center.text-center.leading-tight`, { hasText: value });
    }
}

module.exports = MaterialsInfo;
