
const MaterialsInfo = require('../pageObjects/MaterialsInfo');
const ItemCenter = require('../pageObjects/ItemCenter');
const { click, isChecked, typeText } = require('../fixtures/User interface');
const { readExcel } = require('../TDD/ExcelReader');

// Automates the Materials Info page by uploading a file, selecting material options, and saving.
class MaterialsInfoFlow {
    static data = readExcel('MaterialsInfoFlow');

    // Uploads a project file, selects material dropdowns (type, thickness, color, texture),
    // picks a category, toggles "keep permanent", saves, and navigates to the next page.
    static async materialsInfoFlow(page, data) {
        const materialsInfo = new MaterialsInfo(page);
        const itemCenter = new ItemCenter(page);
        await click(materialsInfo.categoryMaterials(data.Category_materials));
        for (const [placeholder, value] of [
            ['בחר סוג חומר...', data.Material_type],
            ['בחר גוון...', data.Color],
            ['בחר מרקם...', data.Texture_material],
            ['בחר סוג...', data.Material_type_2],
        ]) {
            await click(materialsInfo.dropdowns(placeholder));
            await click(materialsInfo.chooseOption(value));
        }
        await typeText(materialsInfo.thickness(),data.Thickness_mm);       
        await isChecked(materialsInfo.keepPermanent(), data.Keep_in_system);
        await click(materialsInfo.save());
        await click(itemCenter.items('שכבות'));
    }
}
    
module.exports = MaterialsInfoFlow;