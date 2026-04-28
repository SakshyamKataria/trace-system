pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Checked out branch: ${env.GIT_BRANCH}"
                echo "Checked out commit: ${env.GIT_COMMIT}"
            }
        }

        stage('Generate Build Logs') {
            steps {
                sh '''
echo "INFO: Build started"
echo "WARNING: Memory usage high"
echo "ERROR: Database connection failed"
echo "INFO: Build completed"
'''
}
        }
                      
        stage('Capture Logs') {
            steps {
                script {
                    
                    // Capture actual live Jenkins console output
                    def logContent = currentBuild.rawBuild.getLog(1000).join("\n")

                    // Get real build duration and result
                    def buildDuration = currentBuild.durationString?.replace(" and counting", "") ?: "Unknown"
                    def finalStatus = currentBuild.currentResult ?: "SUCCESS"

                    // Inject metadata header into the top of the logs
                    def enrichedLog = """
========================================
BUILD METADATA
----------------------------------------
Job Name: ${env.JOB_NAME}
Build #: ${env.BUILD_NUMBER}
Branch: ${env.GIT_BRANCH}
Commit: ${env.GIT_COMMIT}
Status: ${finalStatus}
Duration: ${buildDuration}
========================================

CONSOLE OUTPUT
----------------------------------------
${logContent}
"""
                    
                    // Escape JSON-breaking characters
                    def escapedLogContent = enrichedLog
                        .replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")

                    // Create structured data payload
                    writeFile file: 'log.json', text: """
{
  "build_id": "${env.JOB_NAME}-${env.BUILD_NUMBER}",
  "project": "${env.JOB_NAME}",
  "branch": "${env.GIT_BRANCH}",
  "commit_id": "${env.GIT_COMMIT}",
  "status": "${finalStatus}",
  "timestamp": "${new Date().format("yyyy-MM-dd'T'HH:mm:ss")}",
  "log": "${escapedLogContent}"
}
"""
                }
            }
        }

        stage('Send Logs to Backend') {
            steps {
                sh '''
curl -X POST http://trace-backend:8000/api/v1/ingest-log \
-H "Content-Type: application/json" \
-d @log.json
'''
            }
        }
    }
}                                                                                                                                                                                         




