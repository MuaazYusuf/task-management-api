# Task Management API - Deployment Architecture

## Architecture Overview

The Task Management API is deployed on AWS using a containerized architecture with the following components:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                                  AWS Cloud                                     │
│                                                                               │
│  ┌────────────┐     ┌─────────────────┐     ┌──────────────────────────────┐  │
│  │            │     │                 │     │                              │  │
│  │   GitHub   │     │  Amazon ECR     │     │     Application Load         │  │
│  │  Actions   │────▶│  Repository     │────▶│        Balancer              │  │
│  │            │     │                 │     │                              │  │
│  └────────────┘     └─────────────────┘     └──────────────┬───────────────┘  │
│                                                            │                  │
│                                                            ▼                  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                           ECS Cluster                                   │  │
│  │                                                                         │  │
│  │   ┌─────────────────────┐      ┌─────────────────────┐                 │  │
│  │   │   Fargate Task 1    │      │   Fargate Task 2    │                 │  │
│  │   │                     │      │                     │                 │  │
│  │   │  ┌───────────────┐  │      │  ┌───────────────┐  │                 │  │
│  │   │  │  Application  │  │      │  │  Application  │  │                 │  │
│  │   │  │  Container    │  │      │  │  Container    │  │                 │  │
│  │   │  └───────────────┘  │      │  └───────────────┘  │                 │  │
│  │   └─────────────────────┘      └─────────────────────┘                 │  │
│  │                                                                         │  │
│  └───────────────┬─────────────────────────────────┬─────────────────┬────┘  │
│                  │                                 │                 │        │
│                  ▼                                 ▼                 ▼        │
│  ┌────────────────────┐     ┌─────────────────────────┐    ┌─────────────┐   │
│  │                    │     │                         │    │             │   │
│  │   Amazon          │     │   Amazon ElastiCache    │    │  MongoDB    │   │
│  │   CloudWatch      │     │   (Redis)               │    │  Atlas      │   │
│  │                    │     │                         │    │             │   │
│  └────────────────────┘     └─────────────────────────┘    └─────────────┘   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. CI/CD Pipeline (GitHub Actions)

The CI/CD pipeline automates the build, test, and deployment process:

- **Source Control**: Code is stored in GitHub repository
- **CI/CD**: GitHub Actions workflow
- **Workflow Stages**:
  - Test: Runs linting and unit tests
  - Build: Creates Docker image and pushes to ECR
  - Deploy: Updates ECS service with new image

### 2. Container Registry (Amazon ECR)

- Stores Docker images securely
- Provides image versioning and lifecycle policies
- Integrates with ECS for seamless deployments

### 3. Compute (Amazon ECS with Fargate)

- **ECS Cluster**: Logical grouping of tasks
- **Fargate**: Serverless compute for containers
- **Task Definition**: Configuration of containers
- **Service**: Maintains desired task count and handles deployment

**Task Configuration**:
- 2GB memory
- 1 vCPU
- Port mapping: 3000
- Environment variables for configuration

### 4. Load Balancer (AWS Application Load Balancer)

- Distributes traffic across multiple tasks
- Health checks to ensure only healthy tasks receive traffic
- SSL termination for HTTPS
- Path-based routing for API versions

### 5. Database (MongoDB Atlas)

- Fully managed MongoDB service
- Replica set for high availability
- Automated backups
- VPC peering for secure connectivity

### 6. Caching (Amazon ElastiCache for Redis)

- In-memory caching for improved performance
- Handles session data and token storage
- Supports pub/sub for real-time features

### 7. Message Broker (Amazon MQ or Self-Hosted RabbitMQ)

- Event-driven architecture
- Decouples services for better scalability
- Handles asynchronous processing

### 8. Monitoring & Logging (Amazon CloudWatch)

- Application logs
- Performance metrics
- Alarms for critical thresholds
- Custom dashboards

## Network Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                              VPC                                    │
│                                                                    │
│  ┌─────────────────────┐           ┌─────────────────────┐         │
│  │   Public Subnet     │           │   Public Subnet     │         │
│  │   (us-east-1a)      │           │   (us-east-1b)      │         │
│  │                     │           │                     │         │
│  │   ┌─────────────┐   │           │   ┌─────────────┐   │         │
│  │   │    ALB      │   │           │   │    ALB      │   │         │
│  │   └─────────────┘   │           │   └─────────────┘   │         │
│  │                     │           │                     │         │
│  └─────────┬───────────┘           └────────┬────────────┘         │
│            │                                │                      │
│            ▼                                ▼                      │
│  ┌─────────────────────┐           ┌─────────────────────┐         │
│  │   Private Subnet    │           │   Private Subnet    │         │
│  │   (us-east-1a)      │           │   (us-east-1b)      │         │
│  │                     │           │                     │         │
│  │   ┌─────────────┐   │           │   ┌─────────────┐   │         │
│  │   │ ECS Tasks   │   │           │   │ ECS Tasks   │   │         │
│  │   └─────────────┘   │           │   └─────────────┘   │         │
│  │                     │           │                     │         │
│  │   ┌─────────────┐   │           │   ┌─────────────┐   │         │
│  │   │ ElastiCache │   │           │   │ ElastiCache │   │         │
│  │   │   (Redis)   │   │           │   │  (Replica)  │   │         │
│  │   └─────────────┘   │           │   └─────────────┘   │         │
│  │                     │           │                     │         │
│  └─────────────────────┘           └─────────────────────┘         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
                         │                      │
                         ▼                      ▼
                ┌────────────────────────────────────┐
                │                                    │
                │          MongoDB Atlas              │
                │        (AWS us-east-1)             │
                │                                    │
                └────────────────────────────────────┘
```

## Security Architecture

The deployment includes multiple security layers:

1. **Network Security**:
   - VPC isolation
   - Security groups for fine-grained access control
   - Private subnets for database and application resources
   - Load balancer in public subnet as single point of entry

2. **Authentication & Authorization**:
   - JWT tokens secured with Redis storage
   - Token rotation and validation
   - Role-based access control

3. **Data Security**:
   - Data encryption in transit (TLS/SSL)
   - Data encryption at rest
   - Secure environment variable handling

4. **Infrastructure Security**:
   - IAM roles with least privilege
   - Secrets management
   - Regular security patching

## Scalability & High Availability

The architecture supports scaling and high availability:

1. **Horizontal Scaling**:
   - Multiple ECS tasks across availability zones
   - Auto-scaling based on CPU/memory usage
   - Load balancing for even distribution

2. **High Availability**:
   - Multi-AZ deployment
   - Database replication
   - Redis clustering with replicas

3. **Failure Recovery**:
   - Health checks and automatic task replacement
   - Task definition revisions for rollback
   - Database automated backups

## Cost Optimization

The deployment optimizes costs while maintaining performance:

1. **Serverless Compute**:
   - Fargate tasks scale to zero when unused
   - No need to provision or manage servers

2. **Managed Services**:
   - Reduces operational overhead
   - Pay for what you use

3. **Resource Sizing**:
   - Right-sized containers based on application needs
   - Database tier appropriate for workload

## Deployment Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Developer  │────▶│    GitHub   │────▶│  CI/CD      │────▶│   AWS       │
│  Push Code  │     │  Repository │     │  Pipeline   │     │  Resources  │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                              │
                           ┌─────────────────┐│┌─────────────────┐
                           │                 ││                 │
                           │    Test         ││      Build      │
                           │                 ││                 │
                           └─────────────────┘└─────────────────┘
```

This architecture ensures a robust, secure, and scalable deployment for the Task Management API on AWS, leveraging containerization and managed services to reduce operational overhead.