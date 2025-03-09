import mongoose from 'mongoose';

// Define a type that can handle both string IDs and MongoDB ObjectId
export type ID = string | mongoose.Types.ObjectId;

// Helper to convert string ID to ObjectId
export function toObjectId(id: ID): mongoose.Types.ObjectId {
    if (typeof id === 'string') {
        return new mongoose.Types.ObjectId(id);
    }
    return id;
}