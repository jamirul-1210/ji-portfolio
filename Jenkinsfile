pipeline {
    agent any

    options {
        disableConcurrentBuilds() 
        timestamps() 
    }

    environment{
        IMAGE_NAME = "my-portfolio"
        DOCKERHUB_USERNAME = "jamirul"
        IMAGE_TAG ="latest"
        CONTAINER_NAME = "my-portfolio-container"
        GITHUB_URL='https://github.com/localhostdev127/my-portfolio.git'
        SSH_CREDENTIALS_ID = 'remote-ssh-credentials'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        REMOTE_HOST = 'ubuntu@ec2-13-233-139-239.ap-south-1.compute.amazonaws.com'   
    }
    

    

    stages {

        stage("Workspace cleanup"){
            steps{
                script{
                    cleanWs()
                }
            }
        }
        
        stage('Clone Repository') {
            steps {
                git branch: 'main', url:GITHUB_URL , credentialsId: 'github-credentials' 
            }
        }

        stage('Docker: Clear all cached Images'){
            steps{
                script {
                    
                    sh '''
                        docker rm -v -f $(docker ps -qa) || echo "No conatiners to remove"
                        docker rmi -f $(docker images -aq) || echo "No images to remove"
                    '''
                }
            }
        }

        stage('Docker: Build Docker Image') {
            steps {
                sh "docker build --no-cache -t ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG} ."
            }
        }

        stage("Docker: Push to DockerHub"){
            steps{
                
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                    sh '''
                        echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
                    '''
                }
                sh "docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }


        stage('Test') {
            steps {
                echo 'skipping test ...'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sshagent (credentials: [env.SSH_CREDENTIALS_ID]) {
                        withCredentials([usernamePassword(credentialsId: env.DOCKER_CREDENTIALS_ID, passwordVariable: 'DOCKERHUB_PASS',usernameVariable: 'DOCKER_USERNAME')]) {
                            try {
                                sh """
                                ssh -o StrictHostKeyChecking=no $REMOTE_HOST << 'EOF'

                                echo "Logging into Docker Hub"
                                echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin

                                echo "Stopping all running containers"
                                docker ps -q | xargs --no-run-if-empty docker stop

                                echo "Removing all Docker containers"
                                docker ps -aq | xargs --no-run-if-empty docker rm

                                echo "Removing all Docker images"
                                docker images -q | xargs --no-run-if-empty docker rmi -f

                                echo "Pulling new image: $DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
                                docker pull $DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG

                                echo "Running new container: $CONTAINER_NAME"
                                docker run -p 80:80 -d --name $CONTAINER_NAME $DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG

                                echo "Deployment successful"
                                exit 0
                                EOF
                                """
                            } catch (Exception e) {
                                error("Deployment failed: ${e.message}")
                            } finally {
                                echo "SSH session completed."
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished!'
        }
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed.'
        }
    }
}
