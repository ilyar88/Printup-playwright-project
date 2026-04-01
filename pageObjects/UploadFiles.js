class UploadFiles {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
    } 

    uploadFiles() {
        return this.page.locator("input[type='file']");
    }

    designFiles() {
        return this.page.locator("button.border-\\[\\#5a8aa8\\].bg-white");
    }

    projectFiles() {
        return this.page.locator("button[type='button']").nth(0);
    }

    workOrder() {
        return this.page.locator("button[type='submit']");
    }

    projectArchive() {
        return this.page.locator("button[type='button']").nth(1);
    }

    addProject() {
        return this.page.locator("button.text-primary.font-light");
    }
}

module.exports = UploadFiles;
