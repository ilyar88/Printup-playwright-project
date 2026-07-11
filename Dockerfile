FROM jenkins/jenkins:lts
USER root
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npx --yes playwright install --with-deps chromium firefox && \
    npm install -g allure-commandline@2.37.0 --prefix /opt/allure
USER jenkins
RUN jenkins-plugin-cli --plugins configuration-as-code:latest job-dsl:latest workflow-aggregator:latest allure-jenkins-plugin:latest matrix-project:latest git:latest
