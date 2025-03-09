# Task Management API

A robust Task Management API built with Node.js, Express, TypeScript, and MongoDB, following clean architecture principles and implementing the Repository Pattern.

## Features

- 🔐 JWT Authentication with refresh tokens
- 👮‍♂️ Role-Based Access Control (RBAC)
- 📝 Complete Task Management functionality
- 📊 Task history and audit logging
- 💬 Task commenting system
- 🔔 Notification system
- 🚀 Redis caching
- 📨 Background job processing with BullMQ
- 📡 Event-driven architecture with Kafka/RabbitMQ
- 🐳 Docker and Docker Compose setup
- 🚢 CI/CD pipeline with GitHub Actions
- ☁️ AWS/Azure deployment ready

## Project Structure

The project follows a clean architecture approach with the Repository Pattern:

```
task-management-api/
├── src/
│   ├── api/                      # API routes and controllers
│   ├── domain/                   # Domain models and business logic
│   ├── infrastructure/           # External infrastructure connections
│   ├── common/                   # Shared utilities
│   ├── jobs/                     # Background job processors
│   └── app.ts                    # Application entry point
├── docker/                       # Docker configuration
├── scripts/                      # Utility scripts
├── Dockerfile                    # Docker build configuration
└── docker-compose.yml           # Docker compose configuration
```

## Prerequisites

- Node.js 18+
- MongoDB
- Redis
- RabbitMQ or Kafka (optional, based on configuration)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-management-api.git
   cd task-management-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create an `.env` file in the root directory based on `.env.example`:
   ```
   NODE_ENV=development
   PORT=3000
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/task-management
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   
   # JWT
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   
   # RabbitMQ
   RABBITMQ_URL=amqp://localhost:5672
   ```

### Running the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm run build
npm start
```

### Docker Deployment

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. To stop the containers:
   ```bash
   docker-compose down
   ```

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and receive tokens
- `POST /api/v1/auth/refresh-token` - Refresh the access token
- `POST /api/v1/auth/change-password` - Change user password

### Task Endpoints

- `POST /api/v1/tasks` - Create a new task
- `GET /api/v1/tasks/:id` - Get task details
- `PUT /api/v1/tasks/:id` - Update task
- `DELETE /api/v1/tasks/:id` - Delete task
- `GET /api/v1/tasks/user/:userId` - Get all tasks assigned to a user
- `POST /api/v1/tasks/:id/assign` - Assign task to a user
- `DELETE /api/v1/tasks/:id/assign/:userId` - Unassign task from a user
- `POST /api/v1/tasks/:id/comments` - Add comment to a task
- `GET /api/v1/tasks/:id/comments` - Get task comments
- `GET /api/v1/tasks/:id/history` - Get task history
- `GET /api/v1/tasks/status/counts` - Get task status counts

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Seeding database

```bash
# Run seed script dev
npm run seed

# Run seed script prod
npm run seed:prod
```

## Deployment

### AWS Deployment

The API can be deployed to AWS using the included CI/CD pipeline. See the [deployment documentation](/deployment.md) for details.
