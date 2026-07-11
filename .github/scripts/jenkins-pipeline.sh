#!/usr/bin/env bash
set -e

capture_diagnostics() {
  {
    echo "BROWSER=$BROWSER"
    echo "QUEUE_URL=$QUEUE_URL"
    echo "NUMBER=$NUMBER"
  } > jenkins-debug-vars.log

  docker logs jenkins > jenkins-container.log 2>&1 || true

  if [ -n "$QUEUE_URL" ]; then
    curl -s --user "$AUTH" "${QUEUE_URL}api/json" -o jenkins-queue-item.json || true
  fi

  if [ -n "$NUMBER" ]; then
    curl -s --user "$AUTH" \
      "http://localhost:8080/job/printup/$NUMBER/consoleText" \
      -o jenkins-build-console.log || true
  fi
}
trap capture_diagnostics ERR

COOKIE_JAR=$(mktemp)
CRUMB_JSON=$(curl -s -c "$COOKIE_JAR" --user "$AUTH" "http://localhost:8080/crumbIssuer/api/json")
CRUMB_HEADER=$(echo "$CRUMB_JSON" | jq -r '.crumbRequestField'):$(echo "$CRUMB_JSON" | jq -r '.crumb')

QUEUE_URL=$(curl -si -X POST "http://localhost:8080/job/printup/buildWithParameters" \
  --user "$AUTH" -b "$COOKIE_JAR" -H "$CRUMB_HEADER" --data "BROWSER=$BROWSER" \
  | grep -i '^Location:' | tr -d '\r' | awk '{print $2}')

for i in $(seq 1 60); do
  NUMBER=$(curl -s --user "$AUTH" "${QUEUE_URL}api/json" | jq -r '.executable.number // empty')
  [ -n "$NUMBER" ] && break
  sleep 5
done

BUILD_URL="http://localhost:8080/job/printup/$NUMBER/api/json"
timeout 1800 bash -c "until [ \"\$(curl -s --user '$AUTH' '$BUILD_URL' | jq -r '.building')\" = 'false' ]; do sleep 5; done"

curl -sf --user "$AUTH" \
  "http://localhost:8080/job/printup/$NUMBER/artifact/allure-report/*zip*/allure-report.zip" \
  -o jenkins-allure-report.zip
unzip -o jenkins-allure-report.zip -d jenkins-allure-report
