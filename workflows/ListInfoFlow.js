const ListInfo = require('../pageObjects/ListInfo');
const { readExcel } = require('../TDD/ExcelReader');
const { click } = require('../fixtures/User interface');

class ListInfoFlow {
    static data = readExcel('ListInfoFlow');

    static async listInfoFlow(page, data) {
        const itemCenter = new ItemCenter(page);
        await click(itemCenter.items('איש קשר'));
    }
}

module.exports = ListInfoFlow;
