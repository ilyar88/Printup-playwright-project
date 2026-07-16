const ClientInfo = require('../pageObjects/ClientInfo');
const { typeText, click, isChecked } = require('../fixtures/User interface');
const { readJson } = require('../fixtures/Hooks');

// Automates the Client Info page by filling in contact details from test data.
class ClientInfoFlow {
    static data = readJson('ClientInfoFlow');

    // Fills the client form: new customer, contact fields, phone/email checkboxes, submits via "Add Contact".
    static async clientInfoFlow(page, data) {
        const clientInfo = new ClientInfo(page);
        const checkboxes = clientInfo.checkboxes();
        await click(clientInfo.newCustomer());
        await typeText(clientInfo.clientName(), data.name_surname);
        await typeText(clientInfo.editorName(), data.editor_name);
        await typeText(clientInfo.contactName(), data.name_surname);
        await isChecked(checkboxes.nth(0), data.main_phone_number);
        // strip the trailing yes/no marker from the value
        await typeText(clientInfo.phoneNumber(), data.main_phone_number.split('-')[0].trim());
        await isChecked(checkboxes.nth(1), data.email);
        await typeText(clientInfo.email(), data.email.split('-')[0].trim());
        await typeText(clientInfo.role(), data.role);
        await typeText(clientInfo.notes(), data.notes);
        await click(clientInfo.addContact());
    }
}

module.exports = ClientInfoFlow;
