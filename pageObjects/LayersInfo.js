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
        return this.page.healingLocator("span.truncate.min-w-0", { hasText: value });
    }

    // Sheet tab buttons, scoped to the given category to avoid processing unrelated tabs
    async sheetsLayout(category) {
        const base = this.page.healingLocator("button.rounded-t.border-white");
        return await (category ? base.filter({ hasText: category }) : base).all();
    }

    // Chevron SVG for the color/type dropdown; falls back to the selected row if set by a prior run
    async color_type(value, index) {
        const byValue = this.page.getByRole('button', { name: value, exact: true }).nth(parseInt(index));
        if (await byValue.count() > 0) return byValue.locator("svg.transition-transform[fill='currentColor']");
        return this.page.healingLocator('tr[class*="border-l-[#3C7B9B]"] td:nth-child(2) button')
            .locator("svg.transition-transform[fill='currentColor']");
    }

    // Scopes to the open floating dropdown panel, falling back to the inline machine sub-panel if no match
    async chooseOption(value) {
        const floating = this.page.healingLocator('div.absolute.top-full')
            .filter({ hasText: value })
            .getByRole('button', { name: value, exact: true });
        if (await floating.count() > 0) return floating;
        return this.page.healingLocator('tr[class*="border-l-[#3C7B9B]"] td:nth-child(2)')
            .getByRole('button', { name: value, exact: true })
            .last();
    }

    // Cutting style in the inline machine sub-panel; .last() skips the trigger button (same accessible name)
    machineType(value) {
        return this.page.healingLocator('tr[class*="border-l-[#3C7B9B]"] td:nth-child(2)')
            .getByRole('button', { name: value, exact: true })
            .last();
    }
}

module.exports = LayersInfo;
