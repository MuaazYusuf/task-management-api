import { ID } from '../../common/types/id.type';

export interface IRepository<T> {
    findById(id: ID): Promise<T | null>;
    findOne(filter: Record<string, any>): Promise<T | null>;
    find(filter: Record<string, any>, options?: Record<string, any>): Promise<T[]>;
    create(data: Partial<T>): Promise<T>;
    update(id: ID, data: Partial<T>): Promise<T | null>;
    delete(id: ID): Promise<boolean>;
}