pipeline {
    agent any

    parameters {
        choice(name: 'BROWSER', choices: ['chrome', 'firefox', 'edge'], description: 'Browser to run tests')
    }

    environment {
        URL            = credentials('PRINTUP_URL')
        EMAIL          = credentials('PRINTUP_EMAIL')
        PASSWORD       = credentials('PRINTUP_PASSWORD')
        APPLITOOLS_KEY = credentials('PRINTUP_APPLITOOLS_KEY')
        HEADLESS       = 'true'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Install Browsers') {
            steps {
                sh 'npx playwright install --with-deps chromium'
            }
        }

        stage('Test') {
            steps {
                sh "npx rimraf allure-results && npx playwright test --config=configuration/playwright.config.js --project ${params.BROWSER}"
            }
        }
    }

    post {
        always {
            allure includeProperties: false, results: [[path: 'allure-results']]
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
        }
    }
}
