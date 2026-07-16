const LayersInfo = require('../pageObjects/LayersInfo');
const ItemCenter = require('../pageObjects/ItemCenter');
const { uploadFile, click } = require('../fixtures/User interface');
const { readJson } = require('../fixtures/Hooks');

class LayersInfoFlow {
    static data = readJson('LayersInfoFlow');

    // Uploads a file per sheet tab, sets color/type dropdowns, then navigates to רשימה
    static async layersInfoFlow(page, data) {
        const layersInfo = new LayersInfo(page);
        const itemCenter = new ItemCenter(page);
        const [, category] = data.Type.split(","); // scope to this row's own category tab
        const sheets = await layersInfo.sheetsLayout(category);
        for (const sheet of sheets) {
            await click(sheet) // click the sheet tab to upload its file (e.g. טקסט צבע, הדפסה צבע)
            await uploadFile(layersInfo.upload(), data.Layers_path);
            var [description, option, type] = data.Description.split(",");
            await click(await layersInfo.color_type(description, data.index)); // open the color dropdown
            if (type) {
                await click(await layersInfo.chooseOption(option)); // machine method tab (CNC/לייזר/שולחני) first
                await click(layersInfo.machineType(type)); // then the cutting style within that tab
            } else {
                await click(await layersInfo.chooseOption(option));
            }
            [option, type] = data.Type.split(",");
            await click(await layersInfo.color_type(type, "0")); // open the type dropdown (הדפסה/חיתוך/צלבים)
            await click(await layersInfo.chooseOption(option));
        }
        await click(itemCenter.items('רשימה'));
    }
}

module.exports = LayersInfoFlow;
