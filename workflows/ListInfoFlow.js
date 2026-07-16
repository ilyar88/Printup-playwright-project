const ListInfo = require('../pageObjects/ListInfo');
const { readJson } = require('../fixtures/Hooks');
const { click } = require('../fixtures/User interface');

class ListInfoFlow {
    static data = readJson('ListInfoFlow');

    static async listInfoFlow(page, data) {
        const itemCenter = new ItemCenter(page);
        await click(itemCenter.items('איש קשר'));
    }
}

module.exports = ListInfoFlow;
