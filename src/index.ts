import { Application } from './app';

const app = new Application();

app.start().catch(error => {
    console.error('Application failed to start:', error);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});