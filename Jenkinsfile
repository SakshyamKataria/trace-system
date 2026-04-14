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

                    // 🔥 Toggle mode
                    def useStatic = false   // true = mentor log, false = real Jenkins logs

                    def logContent = ""

                    if (useStatic) {
                        // ✅ Mentor log file
                        logContent = readFile('logs/jenkins_log.txt')
                    } else {
                        // ✅ Real Jenkins console logs (SAFE version)
                        logContent = currentBuild.rawBuild.getLog(1000).join("\n")
                    }

                    // Escape JSON-breaking characters
                    logContent = logContent
                        .replace("\\", "\\\\")
                        .replace("\"", "\\\"")
                        .replace("\n", "\\n")

                    // Create JSON payload
                    writeFile file: 'log.json', text: """
{
  "build_id": "build-${env.BUILD_NUMBER}",
  "job_name": "jenkins-job",
  "build_number": ${env.BUILD_NUMBER},
  "status": "SUCCESS",
  "project": "trace-system",
  "branch": "develop",
  "commit_id": "abc123",
  "timestamp": "${new Date().format("yyyy-MM-dd'T'HH:mm:ss")}",
  "log": "${logContent}"
}
"""
                }
            }
        }

        stage('Send Logs to Backend') {
            steps {
                sh '''
curl -X POST http://host.docker.internal:8000/api/v1/ingest-log \
-H "Content-Type: application/json" \
-d @log.json
'''
            }
        }
    }
}   




