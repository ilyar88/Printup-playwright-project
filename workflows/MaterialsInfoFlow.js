const MaterialsInfo = require('../pageObjects/MaterialsInfo');
const LayersInfo = require('../pageObjects/LayersInfo');
const ItemCenter = require('../pageObjects/ItemCenter');
const Assert = require('../fixtures/Assert');
const Wait = require("../fixtures/Wait");
const { click, isChecked, typeText, uploadFile, selectOption, hasText } = require('../fixtures/User interface');
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

        await click(materialsInfo.categoryMaterials(data.Category_materials));
        for (const [placeholder, text] of [
            ['בחר סוג חומר...', data.Material_type],
            ['בחר עובי...', String(data.Thickness_mm)],
            ['בחר גוון...', data.Color],
            ['בחר מרקם...', data.Texture_material],
            ['בחר סוג...', data.Material_type_2],
        ]) {
            await selectOption(materialsInfo.dropdowns(placeholder), 'value', text);
        }
        await typeText(materialsInfo.anotherName(), data.Another_name);
        await isChecked(materialsInfo.keepPermanent(), data.Keep_in_system);
        await uploadFile(materialsInfo.upload(), data.Material_path);
        await click(materialsInfo.save());
        //When the saved material is selected, the "שכבות" (Layers) option becomes enabled
        const materialType = await materialsInfo.dropdowns('בחר סוג חומר...').inputValue();
        if (await itemCenter.items('שכבות').isDisabled()) {
            await click(page.locator('button', { hasText: materialType }).last());
        }
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