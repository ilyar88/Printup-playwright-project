class ProjectInfo {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    projectEstablish() {
        return this.page.healingLocator("button.rounded-none").nth(0);
    }

    customerName() {
        return this.page.healingLocator("select.appearance-none.cursor-pointer");
    }

    projectName() {
        return this.page.healingLocator("input[name='name']");
    }

    subtitle() {
        return this.page.healingLocator("input[name='subtitle']");
    }

    date() {
        return this.page.healingLocator("input[name='endDate']");
    }

    approved() {
        return this.page.healingLocator("input[type='checkbox']");
    }

    urgency() {
        return this.page.healingLocator("div:nth-child(3) > select");
    }

    time() {
        return this.page.healingLocator("input[type='time']");
    }

    status() {
        return this.page.healingLocator("div.flex.items-center.justify-end > select");
    }

    folderPath() {
        return this.page.healingLocator("input[name='folderPath']");
    }

    notes() {
        return this.page.healingLocator("textarea[name='workNotes']");
    }
    // Status options: עבר לגרפיקה (moved to graphics), בתהליך יצור (in production), באריזה (in package)
    async selects() {
        return await this.page.healingLocator("div.grid-cols-3 select").all();
    }
}

module.exports = ProjectInfo;
