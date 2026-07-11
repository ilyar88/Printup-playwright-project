pipeline {
    agent any

    parameters {
        choice(name: 'BROWSER', choices: ['chrome', 'firefox', 'edge'], description: 'Browser to run tests')
    }

    environment {
        APP_URL        = credentials('PRINTUP_URL')
        EMAIL          = credentials('PRINTUP_EMAIL')
        PASSWORD       = credentials('PRINTUP_PASSWORD')
        NEW_PASSWORD   = credentials('PRINTUP_NEW_PASSWORD')
        APP_PASSWORD   = credentials('PRINTUP_APP_PASSWORD')
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
                sh "npx playwright install --with-deps ${params.BROWSER == 'firefox' ? 'firefox' : 'chromium'}"
            }
        }

        stage('Test') {
            steps {
                withEnv(["URL=${APP_URL}"]) {
                    sh "npx rimraf allure-results && npx playwright test --config=configuration/playwright.config.js --project ${params.BROWSER}"
                }
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
