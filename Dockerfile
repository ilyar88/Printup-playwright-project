FROM jenkins/jenkins:lts
USER root
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs
USER jenkins
RUN jenkins-plugin-cli --plugins configuration-as-code:latest job-dsl:latest workflow-aggregator:latest allure-jenkins-plugin:latest matrix-project:latest git:latest
