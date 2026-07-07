const MaterialsInfo = require('../pageObjects/MaterialsInfo');
const LayersInfo = require('../pageObjects/LayersInfo');
const ItemCenter = require('../pageObjects/ItemCenter');
const Assert = require('../fixtures/Assert');
const Wait = require("../fixtures/Wait");
const { click, isChecked, typeText, uploadFile } = require('../fixtures/User interface');
const { readExcel } = require('../TDD/ExcelReader');

// Automates the Materials Info page by uploading a file, selecting material options, and saving.
class MaterialsInfoFlow {
    static data = readExcel('MaterialsInfoFlow');

    // Uploads a project file, selects material dropdowns (type, thickness, color, texture),
    // picks a category, toggles "keep permanent", saves, and navigates to the next page.
    static async materialsInfoFlow(page, data) {
        const materialsInfo = new MaterialsInfo(page);
        const layersInfo = new LayersInfo(page);
        const itemCenter = new ItemCenter(page);
        const materialName = `${data.Material_type} ${data.Thickness_mm} ${data.Color} ${data.Texture_material}`;
        const existing = materialsInfo.savedMaterial(materialName);
        // page.evaluate bypasses the SelfHealing proxy — locator().count() is intercepted and waits 15s
        const alreadyExists = await page.evaluate(
            name => [...document.querySelectorAll('nav button')]
                .some(b => b.textContent.trim().replace(/\s+/g, ' ').includes(name)),
            materialName
        );
        // Material was already saved in a previous run — skip creation to avoid a duplicate server error
        if (alreadyExists) {
            await click(existing);
        } else {
            await click(materialsInfo.categoryMaterials(data.Category_materials));
            for (const [placeholder, value] of [
                ['בחר סוג חומר...', data.Material_type],
                ['בחר גוון...', data.Color],
                ['בחר מרקם...', data.Texture_material],
                ['בחר סוג...', data.Material_type_2],
            ]) {
                await materialsInfo.selectDropdown(placeholder, value);
            }
            await materialsInfo.fillThickness(data.Thickness_mm);
            await isChecked(materialsInfo.keepPermanent(), data.Keep_in_system);
            await Wait.waitFor(materialsInfo.save(), "ELEMENT_CLICKABLE", 10);
            // force:true bypasses a z-20 overlay that blocks the click even when the button is enabled
            await materialsInfo.save().click({ force: true });
            await Wait.waitFor(materialsInfo.savedMaterial(materialName), "ELEMENT_DISPLAYED", 10);
            // Must click the saved material in the nav list before the שכבות tab becomes accessible
            await click(materialsInfo.savedMaterial(materialName));
        }
        await uploadFile(materialsInfo.upload(), data.Material_path);
        await click(itemCenter.items('שכבות'));
        
        for (const [value] of [
            [data.Material_type],
            [data.Color],
            [data.Texture_material],
            [data.Material_type_2],
        ]) {
            Assert.verifyEquals(await layersInfo.layerOptions(value).textContent(), value);
        }
    }
}
    
module.exports = MaterialsInfoFlow;