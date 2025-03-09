import mongoose from 'mongoose';
import { BadRequestError } from '../errors';
import { ID } from '../types/id.type';

export class IdUtils {
    /**
     * Validates if a string is a valid MongoDB ObjectId
     * @param id String to validate
     * @returns True if valid, false otherwise
     */
    static isValidObjectId(id: string): boolean {
        return mongoose.Types.ObjectId.isValid(id);
    }

    /**
     * Converts a string ID to MongoDB ObjectId
     * @param id String ID to convert
     * @returns MongoDB ObjectId
     * @throws BadRequestError if the ID is invalid
     */
    static toObjectId(id: ID): mongoose.Types.ObjectId {
        if (id instanceof mongoose.Types.ObjectId) {
            return id;
        }

        if (!this.isValidObjectId(id)) {
            throw new BadRequestError(`Invalid ID: ${id}`);
        }

        return new mongoose.Types.ObjectId(id);
    }

    /**
     * Safely converts a MongoDB ObjectId to string
     * @param id ObjectId to convert
     * @returns String representation of the ObjectId
     */
    static toString(id: mongoose.Types.ObjectId | string | undefined): string | undefined {
        if (!id) return undefined;

        if (typeof id === 'string') {
            return id;
        }

        return id.toString();
    }

    /**
     * Converts an array of IDs to array of ObjectIds
     * @param ids Array of string IDs
     * @returns Array of MongoDB ObjectIds
     */
    static toObjectIdArray(ids: ID[]): mongoose.Types.ObjectId[] {
        return ids.map(id => this.toObjectId(id));
    }
}