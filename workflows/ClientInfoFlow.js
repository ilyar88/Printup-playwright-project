const ClientInfo = require('../pageObjects/ClientInfo');
const { typeText, click, isChecked } = require('../fixtures/User interface');
const { readExcel } = require('../TDD/ExcelReader');

// Automates the Client Info page by filling in contact details from test data.
class ClientInfoFlow {
    static data = readExcel('ClientInfoFlow');

    // Fills the client info form: creates a new customer, enters contact fields,
    // toggles phone/email checkboxes, and submits via "Add Contact".
    //Extract the phone number from the text without the condition "yes" or "no".
    static async clientInfoFlow(page, data) {
        const clientInfo = new ClientInfo(page);
        const checkboxes = clientInfo.checkboxes();
        await click(clientInfo.newCustomer());
        await typeText(clientInfo.clientName(), data.name_surname);
        await typeText(clientInfo.editorName(), data.editor_name);
        await typeText(clientInfo.contactName(), data.name_surname);
        await isChecked(checkboxes.nth(0), data.main_phone_number);
        await typeText(clientInfo.phoneNumber(), data.main_phone_number.split('-')[0].trim());
        await isChecked(checkboxes.nth(1), data.email);
        await typeText(clientInfo.email(), data.email.split('-')[0].trim());
        await typeText(clientInfo.role(), data.role);
        await typeText(clientInfo.notes(), data.notes);
        await click(clientInfo.addContact());
    }
}

module.exports = ClientInfoFlow;
