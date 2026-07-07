const LayersInfo = require('../pageObjects/LayersInfo');
const ItemCenter = require('../pageObjects/ItemCenter');
const { uploadFile, click } = require('../fixtures/User interface');
const { readExcel } = require('../TDD/ExcelReader');

class LayersInfoFlow {
    static data = readExcel('LayersInfoFlow');

    // Iterates over all sheet tabs, uploads an SVG/PDF per sheet, sets color/type dropdowns, and navigates to רשימה
    static async layersInfoFlow(page, data) {
        const layersInfo = new LayersInfo(page);
        const itemCenter = new ItemCenter(page);
        const [, category] = data.Type.split(","); // scope to the tab matching this row's own category
        const sheets = await layersInfo.sheetsLayout(category);
        for (const sheet of sheets) {
            await click(sheet) //Click on the sheets to uplaod the file, like: טקסט צבע, צלבים צבע, חיתוך צורני, הדפסה צבע
            await uploadFile(layersInfo.upload(), data.Layers_path);
            var [description, option, type] = data.Description.split(",");
            await click(await layersInfo.color_type(description, data.index)); //Click on color drop-down to open the options
            if (type) {
                await click(await layersInfo.chooseOption(option)); // select the machine method tab (CNC/לייזר/שולחני) first
                await click(layersInfo.machineType(type)); // then select the cutting style within that tab
            } else {
                await click(await layersInfo.chooseOption(option));
            }
            [option, type] = data.Type.split(",");
            await click(await layersInfo.color_type(type, "0")); //Click on type drop-down to open the options for type, like: הדפסה, חיתוך, צלבים
            await click(await layersInfo.chooseOption(option));
        }
        await click(itemCenter.items('רשימה'));
    }
}

module.exports = LayersInfoFlow;
