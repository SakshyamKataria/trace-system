pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'develop', url: 'https://github.com/SakshyamKataria/trace-system.git'
            }
        }

        stage('Read Raw Log File') {
            steps {
                script {
                    // Read full raw log file
                    def logContent = readFile('logs/jenkins_log.txt')

                    // Escape quotes for JSON format
                    logContent = logContent.replace('"', '\\"')

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