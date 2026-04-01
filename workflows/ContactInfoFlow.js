const ContactInfo = require('../pageObjects/ContactInfo');
const ClientInfo = require('../pageObjects/ClientInfo');
const { typeText, isChecked } = require('../fixtures/User interface');
const { readExcel } = require('../TDD/ExcelReader');

// Automates the Contact Info section by filling in additional contact details from test data.
class ContactInfoFlow {
    static data = readExcel('ContactInfoFlow');

    // Fills the contact info form: enters name, toggles phone/email checkboxes, 
    // phone, email, role, and notes fields.
    static async contactInfoFlow(page, data) {
        const clientInfo = new ClientInfo(page);
        const contactInfo = new ContactInfo(page);
        const checkboxes = clientInfo.checkboxes();
        await typeText(contactInfo.fullName(), data.fullName);
        await isChecked(checkboxes.nth(2), data.Main_phone_number);
        //Extract the phone number from the text without the condition "yes" or "no".
        await typeText(contactInfo.phoneNumber(), data.Main_phone_number.split('-')[0].trim());
        await isChecked(checkboxes.nth(3), data.Email);
        await typeText(contactInfo.email(), data.Email.split('-')[0].trim());
        await typeText(contactInfo.role(), data.Role);
        await typeText(contactInfo.notes(), data.Notes);
    }
}

module.exports = ContactInfoFlow;
