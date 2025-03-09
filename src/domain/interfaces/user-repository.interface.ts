import { IRepository } from './repository.interface';
import { IUser } from '../models/User.model';

export interface IUserRepository extends IRepository<IUser> {
    findByEmail(email: string): Promise<IUser | null>;
    findByEmailWithPassword(email: string): Promise<IUser | null>;
}