class UploadFiles {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    }

    uploadFile() {
        return this.page.healingLocator("div.overflow-auto > div > div > button");
    }

    designFiles() {
        return this.page.healingLocator("button.border-\\[\\#5a8aa8\\].bg-white");
    }

    projectFiles() {
        return this.page.healingLocator("button[type='button']").nth(0);
    }

    workOrder() {
        return this.page.healingLocator("button[type='submit']");
    }

    projectArchive() {
        return this.page.healingLocator("button[type='button']").nth(1);
    }

    addProject() {
        return this.page.healingLocator("button.text-primary.font-light");
    }
}

module.exports = UploadFiles;
