# PrintUp - E2E Test Automation

End-to-end test automation suite for the PrintUp web application, built with **Playwright** and **Allure** reporting.

---

## Project Structure

```
Printup project/
├── base/                        # Base classes
│   └── BasePage.js              # Browser lifecycle & navigation
├── configuration/
│   └── playwright.config.js     # Playwright & browser config
├── fixtures/                    # Reusable test utilities
│   ├── Assert.js                # Assertion helpers with Allure steps
│   ├── Hooks.js                 # Setup, teardown & screenshot on failure
│   ├── User interface.js        # UI interactions (click, type, select, check and upload file)
│   └── Wait fixtures.js         # Wait conditions & synchronization
├── pageObjects/                 # Page Object Model (POM)
│   ├── Login.js
│   ├── ClientInfo.js
│   ├── ContactInfo.js
│   ├── ProjectInfo.js
│   ├── MaterialsInfo.js
│   └── UploadFiles.js
├── workflows/                   # Test flow orchestration
│   ├── index.js                 # Barrel export
│   ├── LoginFlow.js
│   ├── ClientInfoFlow.js
│   ├── ContactInfoFlow.js
│   ├── ProjectInfoFlow.js
│   └── MaterialsInfoFlow.js
├── Suite/                       # Test specs
│   └── SanityTest.spec.js       # Main sanity E2E suite
├── TDD/                         # Test data
│   ├── ExcelReader.js           # Excel parser utility
│   └── TestData.xlsx            # Data-driven test data
├── Matirals/                    # Upload test files (SVGs)
├── .github/workflows/
│   └── E2E test.yml             # GitHub Actions CI
├── .env                         # Environment variables
└── package.json
```

---

## Architecture

![Project Architecture](architecture.svg)

| Layer | Purpose |
|-------|---------|
| **Suite** | Test specs that define test cases in serial order |
| **Workflows** | Multi-step user flows (login, add client, add project, etc.) |
| **Page Objects** | Encapsulate UI element locators per page |
| **Fixtures** | Reusable utilities: assertions, UI actions, waits, hooks |
| **TDD** | Excel-driven test data parsed by ExcelReader |
| **Base** | Browser launch, navigation, and config access |

---

## Test Flow

Tests run **serially** since each step depends on the previous:

```
#1 Login  -->  #2 Add Client  -->  #3 Add Contact  -->  #4 Add Project  -->  #5 Add Material
```

Each workflow reads its data from `TestData.xlsx` and supports multiple iterations.

---

## Setup

### Prerequisites
- Node.js 20+
- Playwright browsers installed

### Install
```bash
npm install
npx playwright install --with-deps
```

---

## Running Tests

These scripts run the automation and open the Allure report:
```json
"scripts": {
    "test": "npx playwright test --config=configuration/playwright.config.js --project chrome",
    "test:report": "npm test && npm run allure:report",
    "allure:report": "npx allure generate allure-results --clean allure-report && npx allure open allure-report"
}
```

### Run chrome browser with Allure report
```bash
npm run test:report
```

---

## Multi-Browser Support

Configured in `playwright.config.js` with three projects:

| Command | Browser | Engine |
|---------|---------|--------|
| `/playwright.config.js --project chrome` | Google Chrome | Chromium |
| `/playwright.config.js --project edge` | Microsoft Edge | Chromium |
| `/playwright.config.js --project firefox` | Mozilla Firefox | Gecko |

---

## Reporting

### Allure Report
- Every UI action is logged as an **Allure step**
- Tests are tagged with **Allure features** (Login, Client info, etc.)
- **Screenshots** are automatically captured and attached on failure
- Sensitive data (passwords, emails) is **masked** in the report

### Screenshot on Failure
Saved to `screenshots/{YYYY-MM-DD}/{testTitle}.png` and attached to the Allure report.

---

## Data-Driven Testing

Test data lives in `TDD/TestData.xlsx`, organized by sections:

| Section | Description |
|---------|-------------|
| `ClientInfoFlow` | Client names, phone numbers, emails, roles |
| `ContactInfoFlow` | Additional contact details |
| `ProjectInfoFlow` | Project names, dates, urgency, file paths |
| `MaterialsInfoFlow` | Material types, thickness, colors, textures |

The `ExcelReader` parses each section by class name and returns an array of data objects.

---

## CI/CD - GitHub Actions

The workflow (`.github/workflows/E2E test.yml`) runs via **manual dispatch** with browser selection:

**Trigger:** GitHub Actions > Run workflow > Select browser (chrome/edge/firefox)

**Pipeline:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Install Playwright browsers
5. Run E2E tests with selected browser
6. Generate & upload Allure report as artifact (30-day retention)

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev/) | Browser automation & test runner |
| [Allure](https://allurereport.org/) | Test reporting |
| [xlsx](https://www.npmjs.com/package/xlsx) | Excel data parsing |
| [dotenv](https://www.npmjs.com/package/dotenv) | Environment variable management |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |
