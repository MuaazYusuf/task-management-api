import { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { IUser, User } from '../../../domain/models/User.model';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
    constructor() {
        super(User);
    }

    async findByEmail(email: string): Promise<IUser | null> {
        try {
            return await this.model.findOne({ email });
        } catch (error) {
            throw error;
        }
    }

    async findByEmailWithPassword(email: string): Promise<IUser | null> {
        try {
            return await this.model.findOne({ email }).select('+password');
        } catch (error) {
            throw error;
        }
    }
}