# AWS Deployment Guide for Task Management API

This guide provides step-by-step instructions for deploying the Task Management API to AWS using the included CI/CD pipeline with GitHub Actions.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Resource Setup](#aws-resource-setup)
3. [GitHub Repository Setup](#github-repository-setup)
4. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
5. [Deployment Process](#deployment-process)
6. [Verification and Testing](#verification-and-testing)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before proceeding with the deployment, ensure you have:

- An AWS account with administrator access
- A GitHub account with ownership of the repository
- AWS CLI installed and configured on your local machine
- Docker installed on your local machine
- Node.js and npm installed on your local machine

## AWS Resource Setup

### 1. Create an ECR Repository

1. Go to the AWS Management Console and open the ECR service
2. Click "Create repository"
3. Name: `task-management-api`
4. Set the tag immutability settings as needed
5. Click "Create repository"
6. Note the repository URI: `[account-id].dkr.ecr.[region].amazonaws.com/task-management-api`

### 2. Create an ECS Cluster

1. Go to the ECS service in the AWS Management Console
2. Click "Create Cluster"
3. Select "Networking only" for the cluster template
4. Name: `task-management-cluster`
5. Click "Create"

### 3. Set Up MongoDB Atlas

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) if you don't have one
2. Create a new project
3. Build a new cluster (choose AWS as the provider)
4. Select the same region as your ECS cluster
5. Choose the appropriate tier (M10 is recommended for production)
6. Configure security settings:
   - Create a database user with a strong password
   - Add your current IP to the IP Access List
   - Configure network access for your VPC in AWS
7. Get the connection string for your application

### 4. Set Up Amazon ElastiCache for Redis

1. Go to the ElastiCache service in the AWS Console
2. Click "Create cluster"
3. Select Redis as the engine
4. Name: `task-management-redis`
5. Node type: Select based on your requirements (e.g., cache.t3.small for development)
6. Number of replicas: At least 1 for production
7. Configure VPC security groups to allow access from your ECS tasks
8. Note the primary endpoint for configuration

### 5. Create Task Definition

1. Go to ECS and click "Task Definitions"
2. Click "Create new Task Definition"
3. Select "FARGATE" as the launch type
4. Configure:
   - Name: `task-management-api`
   - Task Role: Create a new role with AmazonECR-FullAccess policy
   - Network Mode: awsvpc
   - Task memory: 2GB
   - Task CPU: 1 vCPU
5. Add container:
   - Name: `task-management-container`
   - Image: Use the ECR URI from step 1
   - Port mappings: 3000
   - Environment variables: Add the required environment variables (see below)
6. Click "Create"

**Required Environment Variables:**
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster-url]/task-management?retryWrites=true&w=majority
REDIS_HOST=[elasticache-endpoint]
REDIS_PORT=6379
REDIS_PASSWORD=[if-configured]
JWT_ACCESS_SECRET=[secure-random-string]
JWT_REFRESH_SECRET=[different-secure-random-string]
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
RABBITMQ_URL=amqp://[username]:[password]@[host]:5672
```

### 6. Create ECS Service

1. Go to your ECS cluster created in step 2
2. Click "Create Service"
3. Configure:
   - Launch type: FARGATE
   - Task Definition: Select the one created in step 5
   - Service name: `task-management-service`
   - Number of tasks: 2 (for high availability)
4. Configure networking:
   - VPC: Select your VPC
   - Subnets: Select at least two different availability zones
   - Security group: Create a new one with inbound rule for port 3000
   - Auto-assign public IP: ENABLED
5. Load balancing:
   - Application Load Balancer
   - Create a new load balancer
   - Name: `task-management-lb`
   - Listener port: 80
   - Target group: Create new, Protocol: HTTP, Port: 3000
   - Health check path: `/health`
6. Auto Scaling: Configure as needed
7. Click "Create Service"

### 7. Create IAM User for CI/CD

1. Go to IAM in the AWS Console
2. Create a new user:
   - Name: `github-actions`
   - Access type: Programmatic access
3. Attach policies:
   - AmazonECR-FullAccess
   - AmazonECS-FullAccess
4. Save the Access Key ID and Secret Access Key

## GitHub Repository Setup

### 1. Create or Update Repository Secrets

In your GitHub repository:

1. Go to "Settings" > "Secrets and variables" > "Actions"
2. Add the following secrets:
   - `AWS_ACCESS_KEY_ID`: From the IAM user created earlier
   - `AWS_SECRET_ACCESS_KEY`: From the IAM user created earlier
   - `AWS_REGION`: Your chosen AWS region
   - `ECR_REPOSITORY`: Name of your ECR repository (task-management-api)
   - `ECS_CLUSTER`: Name of your ECS cluster (task-management-cluster)
   - `ECS_SERVICE`: Name of your ECS service (task-management-service)

## CI/CD Pipeline Configuration

The CI/CD pipeline is already configured in the `.github/workflows/ci.yml` file. Here's a breakdown of what it does:

1. **Test Stage**:
   - Runs linting and tests on every push and pull request
   - Ensures code quality before deployment

2. **Build Stage** (only on main branch):
   - Builds the application
   - Creates a Docker image
   - Tags the image with the commit SHA and 'latest'
   - Pushes the image to Amazon ECR

3. **Deploy Stage** (only on main branch):
   - Updates the ECS service to use the new image
   - Forces a new deployment of the service

## Deployment Process

The deployment process is triggered automatically when you push to the main branch. Here's what happens:

1. You push your changes to the main branch
2. GitHub Actions runs the CI/CD pipeline
3. Tests are executed to ensure code quality
4. If tests pass, a Docker image is built and pushed to ECR
5. The ECS service is updated to use the new image
6. ECS handles the deployment by starting new tasks with the new image
7. The load balancer routes traffic to the new tasks once they're healthy
8. Old tasks are terminated after new ones are running

## Verification and Testing

After deployment, verify that everything is working:

1. Get the load balancer URL from the ECS service
2. Test the `/health` endpoint: `http://[load-balancer-url]/health`
3. Use a tool like Postman to test the API endpoints
4. Check CloudWatch logs for any errors

## Monitoring and Maintenance

### CloudWatch Monitoring

1. Set up CloudWatch Dashboards:
   - ECS cluster metrics (CPU, Memory)
   - Application load balancer metrics
   - ElastiCache metrics
   - Custom metrics from your application

2. Configure Alarms:
   - High CPU/Memory usage
   - Error rates
   - Response times
   - Failed task count

### Log Management

1. View logs in CloudWatch Logs:
   - Navigate to CloudWatch > Log groups
   - Find the log group for your ECS tasks
   - Filter logs for errors or specific patterns

### Regular Maintenance

1. Database Backups:
   - MongoDB Atlas provides automated backups
   - Configure backup retention policy

2. Security Updates:
   - Regularly update dependencies
   - Apply security patches

## Troubleshooting

### Common Issues

1. **Deployment Failures**:
   - Check GitHub Actions logs for build or test failures
   - Verify AWS credentials are correct
   - Ensure IAM permissions are properly configured

2. **Container Startup Issues**:
   - Check ECS task logs in CloudWatch
   - Verify environment variables are set correctly
   - Check that MongoDB and Redis connections are working

3. **Performance Issues**:
   - Monitor CPU and memory usage
   - Check database connection pool settings
   - Consider scaling up or out if needed

4. **Connectivity Issues**:
   - Verify security group rules
   - Check network ACLs
   - Ensure VPC settings allow proper communication


---

This deployment documentation provides a comprehensive guide for deploying the Task Management API to AWS using the included CI/CD pipeline. Follow these steps to ensure a smooth deployment process.