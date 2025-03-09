import { AuthController } from "./api/controllers/auth.controller";
import { TaskController } from "./api/controllers/task.controller";
import { AuthMiddleware } from "./api/middlewares/auth.middleware";
import { INotificationRepository } from "./domain/interfaces/notification-repository.interface";
import { IAuthService } from "./domain/interfaces/services/auth-service.interface";
import { ITaskCommentRepository } from "./domain/interfaces/task-comment-repository.interface";
import { ITaskHistoryRepository } from "./domain/interfaces/task-history-repository.interface";
import { ITaskRepository } from "./domain/interfaces/task-repository.interface";
import { IUserRepository } from "./domain/interfaces/user-repository.interface";
import { IUserTaskRepository } from "./domain/interfaces/user-task-repository.interface";
import { AuthService } from "./domain/services/auth.service";
import { TaskService } from "./domain/services/task.service";
import { ICacheService } from "./infratstructure/cache/cache.service.interface";
import { RedisCacheService } from "./infratstructure/cache/redis.cache.service";
import { NotificationRepository } from "./infratstructure/database/repositories/notification.repository";
import { TaskCommentRepository } from "./infratstructure/database/repositories/task-comment.repository";
import { TaskHistoryRepository } from "./infratstructure/database/repositories/task-history.repository";
import { TaskRepository } from "./infratstructure/database/repositories/task.repository";
import { UserRepository } from "./infratstructure/database/repositories/user.repository";
import { KafkaService } from "./infratstructure/messaging/kafka.service";
import { RabbitMQService } from "./infratstructure/messaging/rabbitmq.service";
import { BullMQService } from "./infratstructure/queue/bullmq.queue.service";
import { IQueueService } from "./infratstructure/queue/queue.service.interface";
import { NotificationProcessor } from "./jobs/notification.processor";
import { TaskCleanupProcessor } from "./jobs/task-cleanup.processor";
import { ITaskService } from "./domain/interfaces/services/task-service.interface";

import { registerJobProcessors } from './jobs';
import { NotificationController } from "./api/controllers/notification.controller";
import { INotificationService } from "./domain/interfaces/services/notification-service.interface";
import { NotificationService } from "./domain/services/notification.service";
import { UserTaskRepository } from "./infratstructure/database/repositories/user-task.repository";
import { env } from "./config/env";
import { registerEventHandlers } from "./events";
import { IMessageBus } from "./infratstructure/messaging/message-bus.interface";
import { ITokenStore, RedisTokenStore } from "./infratstructure/cache/token.store";

class Container {
    // Repositories
    private userRepository: IUserRepository;
    private taskRepository: ITaskRepository;
    private userTaskRepository: IUserTaskRepository;
    private taskHistoryRepository: ITaskHistoryRepository;
    private taskCommentRepository: ITaskCommentRepository;
    private notificationRepository: INotificationRepository;

    // 
    private tokenStore: ITokenStore;
    
    // Services
    private authService: IAuthService;
    private taskService: ITaskService;
    private notificationService: INotificationService;
    
    // Infrastructure
    private cacheService: ICacheService;
    private queueService: IQueueService;
    private messageBus: IMessageBus;
    
    // Controllers
    private authController: AuthController;
    private taskController: TaskController;
    private notificationController: NotificationController;
    
    // Middlewares
    private authMiddleware: AuthMiddleware;
    
    // Job processors
    private notificationProcessor: NotificationProcessor;
    private taskCleanupProcessor: TaskCleanupProcessor;
    
    constructor() {
      // Initialize repositories
      this.userRepository = new UserRepository();
      this.taskRepository = new TaskRepository();
      this.userTaskRepository = new UserTaskRepository();
      this.taskHistoryRepository = new TaskHistoryRepository();
      this.taskCommentRepository = new TaskCommentRepository();
      this.notificationRepository = new NotificationRepository();

      this.tokenStore = new RedisTokenStore();
      
      // Initialize infrastructure services
      this.cacheService = new RedisCacheService();
      this.queueService = new BullMQService();
      
      // Select message bus implementation based on configuration
      if (env.KAFKA_BROKERS) {
        this.messageBus = new KafkaService();
      } else if (env.RABBITMQ_URL) {
        this.messageBus = new RabbitMQService();
      } else {
        // Default to RabbitMQ with a warning
        console.warn('No message bus configuration found. Defaulting to RabbitMQ with default settings.');
        this.messageBus = new RabbitMQService();
      }
      
      // Initialize services
      this.authService = new AuthService(this.userRepository,  this.tokenStore);
      this.taskService = new TaskService(
        this.taskRepository,
        this.userTaskRepository,
        this.taskHistoryRepository,
        this.taskCommentRepository,
        this.notificationRepository,
        this.cacheService,
        this.queueService,
        this.messageBus
      );
      this.notificationService = new NotificationService(this.notificationRepository);
      
      // Initialize controllers
      this.authController = new AuthController(this.authService);
      this.taskController = new TaskController(this.taskService);
      this.notificationController = new NotificationController(this.notificationService);
      
      // Initialize middlewares
      this.authMiddleware = new AuthMiddleware(this.authService);
      
      // Initialize job processors
      this.notificationProcessor = new NotificationProcessor(this.notificationRepository);
      this.taskCleanupProcessor = new TaskCleanupProcessor(
        this.userTaskRepository,
        this.taskHistoryRepository,
        this.taskCommentRepository
      );
      
      // Register job processors
      registerJobProcessors(
        this.queueService,
        this.notificationProcessor,
        this.taskCleanupProcessor
      );
    }
    
    // Getters for repositories
    getUserRepository(): IUserRepository {
      return this.userRepository;
    }
    
    getTaskRepository(): ITaskRepository {
      return this.taskRepository;
    }
    
    getUserTaskRepository(): IUserTaskRepository {
      return this.userTaskRepository;
    }
    
    getTaskHistoryRepository(): ITaskHistoryRepository {
      return this.taskHistoryRepository;
    }
    
    getTaskCommentRepository(): ITaskCommentRepository {
      return this.taskCommentRepository;
    }
    
    getNotificationRepository(): INotificationRepository {
      return this.notificationRepository;
    }
    
    // Getters for services
    getAuthService(): IAuthService {
      return this.authService;
    }
    
    getTaskService(): ITaskService {
      return this.taskService;
    }
    
    getNotificationService(): INotificationService {
      return this.notificationService;
    }
    
    getCacheService(): ICacheService {
      return this.cacheService;
    }
    
    getQueueService(): IQueueService {
      return this.queueService;
    }
    
    getMessageBus(): IMessageBus {
      return this.messageBus;
    }
    
    // Getters for controllers
    getAuthController(): AuthController {
      return this.authController;
    }
    
    getTaskController(): TaskController {
      return this.taskController;
    }
    
    getNotificationController(): NotificationController {
      return this.notificationController;
    }
    
    // Getters for middlewares
    getAuthMiddleware(): AuthMiddleware {
      return this.authMiddleware;
    }

    getTokenStore(): ITokenStore {
      return this.tokenStore;
    }

    async initializeEventHandlers(): Promise<void> {
      // Register event handlers
      registerEventHandlers(
        this.messageBus,
        this.queueService,
        this.taskRepository,
        this.userTaskRepository,
        this.notificationRepository
      );
    }
  }
  
  // Export a singleton instance
  export const container = new Container();