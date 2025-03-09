import mongoose from 'mongoose';
import { User, UserRole } from '../domain/models/User.model';
import { Task, TaskStatus, TaskPriority } from '../domain/models/Task.model';
import { UserTask } from '../domain/models/UserTask.model';
import { TaskComment } from '../domain/models/TaskComment.model';
import { TaskHistory, HistoryActionType } from '../domain/models/TaskHistory.model';
import { Notification, NotificationType } from '../domain/models/Notification.model';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI!;

const users = [
  {
    email: 'admin@example.com',
    password: 'Admin@123',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN
  },
  {
    email: 'manager@example.com',
    password: 'Manager@123',
    firstName: 'Manager',
    lastName: 'User',
    role: UserRole.MANAGER
  },
  {
    email: 'user1@example.com',
    password: 'User1@123',
    firstName: 'Regular',
    lastName: 'User1',
    role: UserRole.USER
  },
  {
    email: 'user2@example.com',
    password: 'User2@123',
    firstName: 'Regular',
    lastName: 'User2',
    role: UserRole.USER
  }
];

const taskTemplates = [
  {
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication with refresh tokens',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    dueDateOffset: -15 // days from now
  },
  {
    title: 'Design database schema',
    description: 'Create MongoDB schema for users, tasks, and related collections',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    dueDateOffset: -10
  },
  {
    title: 'Implement task API endpoints',
    description: 'Create CRUD endpoints for tasks with proper validation',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    dueDateOffset: 5
  },
  {
    title: 'Add task commenting feature',
    description: 'Users should be able to comment on tasks and receive notifications',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDateOffset: 10
  },
  {
    title: 'Implement task assignment',
    description: 'Allow managers to assign tasks to users',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDateOffset: 3
  },
  {
    title: 'Add caching with Redis',
    description: 'Implement Redis caching for frequently accessed data',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDateOffset: 15
  },
  {
    title: 'Create CI/CD pipeline',
    description: 'Set up GitHub Actions for automated testing and deployment',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDateOffset: 20
  },
  {
    title: 'Implement background jobs with BullMQ',
    description: 'Add background processing for notifications and emails',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.LOW,
    dueDateOffset: 7
  },
  {
    title: 'Add Kafka/RabbitMQ support',
    description: 'Implement event-driven architecture with message brokers',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDateOffset: 25
  },
  {
    title: 'Deploy to AWS/Azure',
    description: 'Set up cloud deployment with Docker and managed services',
    status: TaskStatus.TODO,
    priority: TaskPriority.URGENT,
    dueDateOffset: 30
  }
];

const commentTemplates = [
  'This looks good to me!',
  'I think we should reconsider the approach here.',
  'Can you provide more details on this?',
  'I\'ve started working on this task.',
  'I need some help with this task.',
  'This is taking longer than expected.',
  'Almost done with this one!',
  'This is ready for review.',
  'I\'ve fixed the issues mentioned in the review.',
  'This is now completed.'
];

// Seed function
async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await clearDatabase();
    console.log('Cleared existing data');

    // Create users
    const createdUsers = await createUsers();
    console.log(`Created ${createdUsers.length} users`);

    // Create tasks
    const createdTasks = await createTasks(createdUsers);
    console.log(`Created ${createdTasks.length} tasks`);

    // Assign tasks to users
    const createdAssignments = await assignTasks(createdUsers, createdTasks);
    console.log(`Created ${createdAssignments.length} task assignments`);

    // Create task history
    const createdHistory = await createTaskHistory(createdUsers, createdTasks);
    console.log(`Created ${createdHistory.length} task history records`);

    // Create task comments
    const createdComments = await createTaskComments(createdUsers, createdTasks);
    console.log(`Created ${createdComments.length} task comments`);

    // Create notifications
    const createdNotifications = await createNotifications(createdUsers, createdTasks, createdComments);
    console.log(`Created ${createdNotifications.length} notifications`);

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

async function clearDatabase() {
  await User.deleteMany({});
  await Task.deleteMany({});
  await UserTask.deleteMany({});
  await TaskHistory.deleteMany({});
  await TaskComment.deleteMany({});
  await Notification.deleteMany({});
}

async function createUsers() {
  const createdUsers = [];

  for (const user of users) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    const newUser = new User({
      email: user.email,
      password: hashedPassword,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    });

    const savedUser = await newUser.save();
    createdUsers.push(savedUser);
  }

  return createdUsers;
}

async function createTasks(users: any[]) {
  const adminUser = users.find(u => u.role === UserRole.ADMIN);
  const managerUser = users.find(u => u.role === UserRole.MANAGER);
  
  const createdTasks = [];

  for (const template of taskTemplates) {
    // Calculate due date based on offset
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.dueDateOffset);

    // Create task
    const newTask = new Task({
      title: template.title,
      description: template.description,
      status: template.status,
      priority: template.priority,
      dueDate: dueDate,
      createdBy: template.status === TaskStatus.DONE ? adminUser._id : managerUser._id
    });

    const savedTask = await newTask.save();
    createdTasks.push(savedTask);
  }

  return createdTasks;
}

async function assignTasks(users: any[], tasks: any[]) {
  const createdAssignments = [];
  const regularUsers = users.filter(u => u.role === UserRole.USER);
  const managerUser = users.find(u => u.role === UserRole.MANAGER);

  for (let i = 0; i < tasks.length; i++) {
    // Assign each task to 1-2 users
    const numAssignees = Math.floor(Math.random() * 2) + 1;
    
    for (let j = 0; j < numAssignees; j++) {
      const userIndex = (i + j) % regularUsers.length;
      
      const assignment = new UserTask({
        userId: regularUsers[userIndex]._id,
        taskId: tasks[i]._id,
        assignedAt: new Date(),
        assignedBy: managerUser._id
      });

      const savedAssignment = await assignment.save();
      createdAssignments.push(savedAssignment);
    }
  }

  return createdAssignments;
}

async function createTaskHistory(users: any[], tasks: any[]) {
  const createdHistory = [];
  const managerUser = users.find(u => u.role === UserRole.MANAGER);
  const adminUser = users.find(u => u.role === UserRole.ADMIN);

  for (const task of tasks) {
    // Created history
    const createdHistory1 = new TaskHistory({
      taskId: task._id,
      userId: task.createdBy,
      action: HistoryActionType.CREATED,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000) // Random date in last 10 days
    });
    const saved1 = await createdHistory1.save();
    createdHistory.push(saved1);

    // Add status changes for some tasks
    if (task.status !== TaskStatus.TODO) {
      const statusHistory = new TaskHistory({
        taskId: task._id,
        userId: managerUser._id,
        action: HistoryActionType.STATUS_CHANGED,
        previousValue: TaskStatus.TODO,
        newValue: task.status === TaskStatus.DONE ? TaskStatus.IN_PROGRESS : task.status,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // Random date in last 7 days
      });
      const saved2 = await statusHistory.save();
      createdHistory.push(saved2);
    }

    // Add another status change for DONE tasks
    if (task.status === TaskStatus.DONE) {
      const doneHistory = new TaskHistory({
        taskId: task._id,
        userId: adminUser._id,
        action: HistoryActionType.STATUS_CHANGED,
        previousValue: TaskStatus.IN_PROGRESS,
        newValue: TaskStatus.DONE,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000) // Random date in last 3 days
      });
      const saved3 = await doneHistory.save();
      createdHistory.push(saved3);
    }
  }

  return createdHistory;
}

async function createTaskComments(users: any[], tasks: any[]) {
  const createdComments = [];
  const regularUsers = users.filter(u => u.role === UserRole.USER);

  for (const task of tasks) {
    // Add 0-3 comments per task
    const numComments = Math.floor(Math.random() * 4);
    
    for (let i = 0; i < numComments; i++) {
      const userIndex = Math.floor(Math.random() * regularUsers.length);
      const commentIndex = Math.floor(Math.random() * commentTemplates.length);
      
      const comment = new TaskComment({
        taskId: task._id,
        userId: regularUsers[userIndex]._id,
        text: commentTemplates[commentIndex],
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000) // Random date in last 5 days
      });

      const savedComment = await comment.save();
      createdComments.push(savedComment);
    }
  }

  return createdComments;
}

async function createNotifications(users: any[], tasks: any[], comments: any[]) {
  const createdNotifications = [];
  const regularUsers = users.filter(u => u.role === UserRole.USER);

  // Create task assignment notifications
  for (const user of regularUsers) {
    const numNotifications = Math.floor(Math.random() * 5) + 1; // 1-5 notifications per user
    
    for (let i = 0; i < numNotifications; i++) {
      const taskIndex = Math.floor(Math.random() * tasks.length);
      const notificationType = getRandomNotificationType();
      
      let content = '';
      let relatedModel = 'Task';
      let relatedId = tasks[taskIndex]._id;
      
      switch (notificationType) {
        case NotificationType.TASK_ASSIGNED:
          content = `You have been assigned to task "${tasks[taskIndex].title}"`;
          break;
        case NotificationType.TASK_UPDATED:
          content = `Task "${tasks[taskIndex].title}" has been updated`;
          break;
        case NotificationType.COMMENT_ADDED:
          content = `New comment on task "${tasks[taskIndex].title}"`;
          if (comments.length > 0) {
            const commentIndex = Math.floor(Math.random() * comments.length);
            relatedModel = 'TaskComment';
            relatedId = comments[commentIndex]._id;
          }
          break;
        case NotificationType.DEADLINE_REMINDER:
          content = `Reminder: Task "${tasks[taskIndex].title}" is due soon`;
          break;
      }
      
      const notification = new Notification({
        userId: user._id,
        type: notificationType,
        content: content,
        relatedTo: {
          model: relatedModel,
          id: relatedId
        },
        isRead: Math.random() > 0.7, // 30% chance of being read
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // Random date in last 7 days
      });

      const savedNotification = await notification.save();
      createdNotifications.push(savedNotification);
    }
  }

  return createdNotifications;
}

function getRandomNotificationType() {
  const types = [
    NotificationType.TASK_ASSIGNED,
    NotificationType.TASK_UPDATED,
    NotificationType.COMMENT_ADDED,
    NotificationType.DEADLINE_REMINDER
  ];
  
  return types[Math.floor(Math.random() * types.length)];
}

// Run the seed function
seed()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });