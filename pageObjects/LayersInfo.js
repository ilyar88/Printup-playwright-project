class LayersInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    upload() {
        return this.page.getByRole('button', { name: 'העלה קבצים', exact: true });
    }

    layerOptions(value) {
        return this.page.locator("span.truncate.min-w-0", { hasText: value });
    }

    // Returns sheet tab buttons, scoped to the given category so unrelated tabs aren't processed with mismatched data
    async sheetsLayout(category) {
        const base = this.page.locator("button.rounded-t.border-white");
        return await (category ? base.filter({ hasText: category }) : base).all();
    }

    // Locates the chevron SVG inside the button to open the color/type dropdown, falling back to the currently selected row once "value" has already been set by a prior run
    async color_type(value, index) {
        const byValue = this.page.getByRole('button', { name: value, exact: true }).nth(parseInt(index));
        if (await byValue.count() > 0) return byValue.locator("svg.transition-transform[fill='currentColor']");
        return this.page.locator('tr[class*="border-l-[#3C7B9B]"] td:nth-child(2) button')
            .locator("svg.transition-transform[fill='currentColor']");
    }

    // div.absolute.top-full scopes to the currently open dropdown panel, falling back to the inline machine sub-panel scope when the floating panel has no match
    async chooseOption(value) {
        const floating = this.page.locator('div.absolute.top-full')
            .filter({ hasText: value })
            .getByRole('button', { name: value, exact: true });
        if (await floating.count() > 0) return floating;
        return this.page.locator('tr[class*="border-l-[#3C7B9B]"] td:nth-child(2)')
            .getByRole('button', { name: value, exact: true })
            .last();
    }

    // Selects a cutting style from the inline machine sub-panel; .last() skips the already-selected trigger button, which shares the same accessible name
    machineType(value) {
        return this.page.locator('tr[class*="border-l-[#3C7B9B]"] td:nth-child(2)')
            .getByRole('button', { name: value, exact: true })
            .last();
    }
}

module.exports = LayersInfo;