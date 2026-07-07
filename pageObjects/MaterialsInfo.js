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

    chooseOption(value) {
        return this.page.locator(`div.absolute.z-50 button`, { hasText: value });
    }

    // dispatchEvent('change') is required because React controlled components ignore
    // programmatic value changes unless the synthetic change event is fired explicitly
    async selectDropdown(placeholder, value) {
        const input = this.dropdowns(placeholder);
        await input.click();
        const option = this.chooseOption(value);
        await option.waitFor({ state: 'visible', timeout: 5000 });
        await option.click();
        await input.dispatchEvent('change');
        await this.page.waitForTimeout(300);
    }

    thickness() {
        return this.page.locator("input[type='number']");
    }

    // Both 'input' and 'change' events needed: 'input' updates React state, 'change' enables the save button
    async fillThickness(value) {
        const input = this.thickness();
        await input.fill(String(value));
        await input.dispatchEvent('input');
        await input.dispatchEvent('change');
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

    save() {
        return this.page.locator("button[type='submit']");
    }

    // <nav> has an implicit ARIA role of "navigation", which getByRole('navigation') recognizes;
    // a [role="navigation"] CSS selector would only match if that attribute were explicitly set in the HTML
    savedMaterial(value) {
        return this.page.getByRole('navigation').getByRole('button', { name: value });
    }
}

module.exports = MaterialsInfo;