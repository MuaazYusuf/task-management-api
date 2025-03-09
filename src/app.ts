import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { errorMiddleware } from './api/middlewares/error.middleware';
import { createAPIRouter } from './api/routes';
import { container } from './container';
import { env } from './config/env';
import { MongoDBConnection } from './infratstructure/database/mongodb.connection';

export class Application {
    private app: Express;

    constructor() {
        // Create Express app
        this.app = express();

        // Configure middleware
        this.configureMiddleware();

        // Configure routes
        this.configureRoutes();

        // Configure error handling
        this.configureErrorHandling();
    }

    private configureMiddleware(): void {
        // Security middleware
        this.app.use(helmet());

        // CORS
        this.app.use(cors());

        // Compression
        this.app.use(compression());

        // Body parser
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    }

    private configureRoutes(): void {
        // Health check endpoint
        this.app.get('/health', (_, res) => {
            res.status(200).json({
                status: 'success',
                message: 'Server is running'
            });
        });

        // API routes
        this.app.use(
            '/api/v1',
            createAPIRouter(
                container.getAuthController(),
                container.getTaskController(),
                container.getAuthMiddleware(),
                container.getNotificationController()
            )
        );

        // 404 handler
        this.app.use('*', (_, res) => {
            res.status(404).json({
                status: 'error',
                message: 'Route not found'
            });
        });
    }

    private configureErrorHandling(): void {
        // Global error handler
        this.app.use(errorMiddleware);
    }

    async start(): Promise<void> {
        try {
            // Connect to MongoDB
            await MongoDBConnection.getInstance().connect();

            // Initialize message bus if configured
            await container.getMessageBus().initialize();

            // Initialize event handlers
            await container.initializeEventHandlers();

            // Start server
            const port = parseInt(env.PORT, 10);
            this.app.listen(port, () => {
                console.log(`Server running on port ${port}`);
                console.log(`Health check: http://localhost:${port}/health`);
                console.log(`API base URL: http://localhost:${port}/api/v1`);
            });
        } catch (error) {
            console.error('Failed to start application:', error);
            process.exit(1);
        }
    }
}