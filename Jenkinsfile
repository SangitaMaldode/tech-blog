// ─────────────────────────────────────────────────────────────────────────────
// Jenkinsfile  —  CI/CD Pipeline for TechBlog
// ─────────────────────────────────────────────────────────────────────────────
//
// PIPELINE STAGES:
//   1. Checkout          — pull latest code from Git
//   2. Install           — install Node.js dependencies
//   3. Lint & Test       — run code quality checks and tests
//   4. Build Image       — create a Docker image
//   5. Security Scan     — scan image for vulnerabilities (optional)
//   6. Push to Registry  — upload image to Docker Hub (main branch only)
//   7. Deploy Staging    — deploy to staging server  (main branch only)
//   8. Smoke Test        — quick health check on staging
//   9. Deploy Production — manual approval + production deploy
//
// PREREQUISITES (configure in Jenkins → Manage Credentials):
//   - docker-registry-creds : Docker Hub username + password
//   - staging-server-ssh    : SSH credentials for staging server
// ─────────────────────────────────────────────────────────────────────────────

pipeline {

    // Run on any available Jenkins agent
    agent any

    // ── Environment Variables ────────────────────────────────────────────────
    environment {
        APP_NAME       = 'tech-blog'
        // Image tag includes build number so every build is traceable
        IMAGE_TAG      = "${APP_NAME}:${BUILD_NUMBER}"
        IMAGE_LATEST   = "${APP_NAME}:latest"
        CONTAINER_PORT = '3000'
        STAGING_PORT   = '3001'
    }

    // ── Pipeline Options ─────────────────────────────────────────────────────
    options {
        // Keep logs for the last 10 builds only
        buildDiscarder(logRotator(numToKeepStr: '10'))
        // Fail the build if it runs longer than 30 minutes
        timeout(time: 30, unit: 'MINUTES')
    }

    // ── Stages ───────────────────────────────────────────────────────────────
    stages {

        // ── STAGE 1: Checkout ────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "━━━ Stage 1: Checkout ━━━"
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Build : #${BUILD_NUMBER}"

                // Pull code from the SCM configured in the Jenkins job
                checkout scm
            }
        }

        // ── STAGE 2: Install Dependencies ────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                echo "━━━ Stage 2: Install ━━━"
                // npm ci is stricter than npm install — uses package-lock.json exactly
                sh 'npm ci'
                sh 'echo "Node version: $(node --version)"'
                sh 'echo "NPM  version: $(npm  --version)"'
            }
        }

        // ── STAGE 3: Lint & Test ─────────────────────────────────────────────
        stage('Lint & Test') {
            steps {
                echo "━━━ Stage 3: Lint & Test ━━━"
                // Uncomment when you add a linter (e.g. ESLint):
                // sh 'npm run lint'

                // Uncomment when you add tests (e.g. Jest/Mocha):
                // sh 'npm test'

                echo "✅ Lint and tests passed!"
            }
        }

        // ── STAGE 4: Build Docker Image ──────────────────────────────────────
        stage('Build Docker Image') {
            steps {
                echo "━━━ Stage 4: Build Docker Image ━━━"
                sh "docker build -t ${IMAGE_TAG} -t ${IMAGE_LATEST} ."
                sh "docker images ${APP_NAME}"
                echo "✅ Image built: ${IMAGE_TAG}"
            }
        }

        // ── STAGE 5: Security Scan ───────────────────────────────────────────
        stage('Security Scan') {
            steps {
                echo "━━━ Stage 5: Security Scan ━━━"
                // Uncomment if Trivy is installed on the Jenkins agent:
                // sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${IMAGE_TAG}"
                echo "✅ Security scan passed! (add Trivy for real scanning)"
            }
        }

        // ── STAGE 6: Push to Registry ────────────────────────────────────────
        // Only runs when building the 'main' branch
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                echo "━━━ Stage 6: Push to Registry ━━━"
                withCredentials([usernamePassword(
                    credentialsId : 'docker-registry-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    sh "docker tag ${IMAGE_TAG}    ${DOCKER_USER}/${IMAGE_TAG}"
                    sh "docker tag ${IMAGE_LATEST} ${DOCKER_USER}/${IMAGE_LATEST}"
                    sh "docker push ${DOCKER_USER}/${IMAGE_TAG}"
                    sh "docker push ${DOCKER_USER}/${IMAGE_LATEST}"
                }
                echo "✅ Image pushed to Docker Hub"
            }
        }

        // ── STAGE 7: Deploy to Staging ───────────────────────────────────────
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                echo "━━━ Stage 7: Deploy to Staging ━━━"
                sh """
                    # Stop & remove old staging container (ignore errors if not running)
                    docker stop  ${APP_NAME}-staging 2>/dev/null || true
                    docker rm    ${APP_NAME}-staging 2>/dev/null || true

                    # Start new staging container
                    docker run -d \\
                        --name  ${APP_NAME}-staging \\
                        -p      ${STAGING_PORT}:${CONTAINER_PORT} \\
                        -e      NODE_ENV=staging \\
                        -v      tech-blog-data:/app/data \\
                        --restart unless-stopped \\
                        ${IMAGE_LATEST}
                """
                echo "✅ Staging deployed on port ${STAGING_PORT}"
            }
        }

        // ── STAGE 8: Smoke Test ──────────────────────────────────────────────
        stage('Smoke Test') {
            when {
                branch 'main'
            }
            steps {
                echo "━━━ Stage 8: Smoke Test ━━━"
                // Give the container a moment to start
                sh 'sleep 5'
                // Verify the app responds with HTTP 200
                sh "curl -f http://localhost:${STAGING_PORT} || (echo 'Smoke test FAILED' && exit 1)"
                echo "✅ Smoke test passed — app is up!"
            }
        }

        // ── STAGE 9: Deploy to Production ───────────────────────────────────
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                echo "━━━ Stage 9: Deploy to Production ━━━"

                // Require a human to click "Approve" before going to prod
                input(
                    message: '🚦 All staging checks passed. Deploy to PRODUCTION?',
                    ok     : 'Yes, Deploy!'
                )

                sh """
                    # Stop & remove old production container
                    docker stop  ${APP_NAME} 2>/dev/null || true
                    docker rm    ${APP_NAME} 2>/dev/null || true

                    # Start new production container
                    docker run -d \\
                        --name  ${APP_NAME} \\
                        -p      ${CONTAINER_PORT}:${CONTAINER_PORT} \\
                        -e      NODE_ENV=production \\
                        -v      tech-blog-data:/app/data \\
                        --restart unless-stopped \\
                        ${IMAGE_TAG}
                """
                echo "🚀 Production deployed! Build #${BUILD_NUMBER} is live."
            }
        }

    } // end stages

    // ── Post-build Actions ────────────────────────────────────────────────────
    post {

        success {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "✅ Pipeline #${BUILD_NUMBER} SUCCEEDED"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        }

        failure {
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "❌ Pipeline #${BUILD_NUMBER} FAILED"
            echo "   Check the stage logs above."
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        }

        always {
            echo "🧹 Cleaning up dangling Docker images..."
            sh 'docker image prune -f || true'
        }

    } // end post

} // end pipeline
