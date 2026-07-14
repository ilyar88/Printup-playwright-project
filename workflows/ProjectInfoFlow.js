const ProjectInfo = require('../pageObjects/ProjectInfo');
const ItemCenter = require('../pageObjects/ItemCenter');
const { typeText, click, selectOption, selectDate, isChecked } = require('../fixtures/User interface');
const { readExcel } = require('../TDD/ExcelReader');

class ProjectInfoFlow {
    static data = readExcel('ProjectInfoFlow');

    static async projectInfoFlow(page, data) {
        const projectInfo = new ProjectInfo(page);
        const itemCenter = new ItemCenter(page);
        await click(projectInfo.projectEstablish());
        await selectOption(projectInfo.customerName(), 'value', data.name_surname);
        await typeText(projectInfo.projectName(), data.Project_name);
        await typeText(projectInfo.subtitle(), data.Subtitle);
        await selectDate(projectInfo.date(), data.End_date);
        await isChecked(projectInfo.approved(), data.Final_approval);
        await selectOption(projectInfo.urgency(), 'value', data.Urgency);
        await typeText(projectInfo.time(), ProjectInfoFlow.formatTime(data.Hour));
        await typeText(projectInfo.folderPath(), data.Project_path);
        await typeText(projectInfo.notes(), data.Notes);
        await selectOption(projectInfo.status(), 'value', data.Status_condition);
        await click(itemCenter.items('חומרים'));  // navigate to Materials panel
    }
    // Excel stores time as a fraction of a day — convert to HH:MM
    static formatTime(fraction) {
        const totalMinutes = Math.round(fraction * 24 * 60);
        const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
        const mm = String(totalMinutes % 60).padStart(2, '0');
        return `${hh}:${mm}`;
    }
}

module.exports = ProjectInfoFlow;
