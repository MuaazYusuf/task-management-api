import { Document, Model } from 'mongoose';
import { IRepository } from '../../../domain/interfaces/repository.interface';
import { ID, toObjectId } from '../../../common/types/id.type';

export class BaseRepository<T extends Document> implements IRepository<T> {
    constructor(protected readonly model: Model<T>) { }

    async findById(id: ID): Promise<T | null> {
        try {
            return await this.model.findById(toObjectId(id));
        } catch (error) {
            throw error;
        }
    }

    async findOne(filter: Record<string, any>): Promise<T | null> {
        try {
            return await this.model.findOne(filter);
        } catch (error) {
            throw error;
        }
    }

    async find(filter: Record<string, any>, options: Record<string, any> = {}): Promise<T[]> {
        try {
            const { sort, limit, skip } = options;

            let query = this.model.find(filter);

            if (sort) query = query.sort(sort);
            if (limit) query = query.limit(limit);
            if (skip) query = query.skip(skip);

            return await query.exec();
        } catch (error) {
            throw error;
        }
    }

    async create(data: Partial<T>): Promise<T> {
        try {
            return await this.model.create(data);
        } catch (error) {
            throw error;
        }
    }

    async update(id: ID, data: Partial<T>): Promise<T | null> {
        try {
            return await this.model.findByIdAndUpdate(toObjectId(id), data, { new: true });
        } catch (error) {
            throw error;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.model.findByIdAndDelete(toObjectId(id));
            return !!result;
        } catch (error) {
            throw error;
        }
    }
}