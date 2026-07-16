const ContactInfo = require('../pageObjects/ContactInfo');
const ClientInfo = require('../pageObjects/ClientInfo');
const { typeText, click, isChecked } = require('../fixtures/User interface');
const { readJson } = require('../fixtures/Hooks');

// Automates the Contact Info section by filling in additional contact details from test data.
class ContactInfoFlow {
    static data = readJson('ContactInfoFlow');

    // Fills the contact form: name, phone/email (with checkboxes), role, and notes.
    static async contactInfoFlow(page, data) {
        const clientInfo = new ClientInfo(page);
        const contactInfo = new ContactInfo(page);
        const checkboxes = clientInfo.checkboxes();
        await typeText(contactInfo.fullName(), data.fullName);
        await isChecked(checkboxes.nth(2), data.Main_phone_number);
        // strip the trailing yes/no marker from the value
        await typeText(contactInfo.phoneNumber(), data.Main_phone_number.split('-')[0].trim());
        await isChecked(checkboxes.nth(3), data.Email);
        await typeText(contactInfo.email(), data.Email.split('-')[0].trim());
        await typeText(contactInfo.role(), data.Role);
        await typeText(contactInfo.notes(), data.Notes);
        await click(clientInfo.nextButton());
    }
}

module.exports = ContactInfoFlow;
