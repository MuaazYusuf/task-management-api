import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../../domain/models/Task.model';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional().default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
  dueDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  assignees: z.array(z.string()).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be at most 100 characters').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ).optional(),
  assignees: z.array(z.string()).optional()
});

export const getTasksQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '10')),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDateFrom: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  dueDateTo: z.string().optional().refine(
    (date) => !date || !isNaN(Date.parse(date)),
    { message: 'Invalid date format' }
  ),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export const addCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(500, 'Comment must be at most 500 characters')
});

export const assignTaskSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});