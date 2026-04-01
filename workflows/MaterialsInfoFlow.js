
const MaterialsInfo = require('../pageObjects/MaterialsInfo');
const ClientInfo = require('../pageObjects/ClientInfo');
const UploadFiles = require('../pageObjects/UploadFiles');
const { click, selectOption, isChecked } = require('../fixtures/User interface');
const { readExcel } = require('../TDD/ExcelReader');

// Automates the Materials Info page by uploading a file, selecting material options, and saving.
class MaterialsInfoFlow {
    static data = readExcel('MaterialsInfoFlow');

    // Uploads a project file, selects material dropdowns (type, thickness, color, texture),
    // picks a category, toggles "keep permanent", saves, and navigates to the next page.
    static async materialsInfoFlow(page, data) {
        const materialsInfo = new MaterialsInfo(page);
        const uploadFiles = new UploadFiles(page);
        const clientInfo = new ClientInfo(page);
        await uploadFile(uploadFiles.uploadFile(), data.Project_path);
        await selectOption(materialsInfo.materialType(), 'value', data.Material_type);
        await selectOption(materialsInfo.thickness(), 'value', data.Thickness);
        await selectOption(materialsInfo.color(), 'value', data.Color);
        await selectOption(materialsInfo.textureMaterial(), 'value', data.Texture_material);
        await selectOption(materialsInfo.materialType_2(), 'value', data.Material_type_2);
        await click(materialsInfo.categoryMaterials(data.Category_materials));
        await isChecked(materialsInfo.keepPermanent());
        await click(materialsInfo.save());
        await click(clientInfo.nextButton());
    }
}

module.exports = MaterialsInfoFlow;