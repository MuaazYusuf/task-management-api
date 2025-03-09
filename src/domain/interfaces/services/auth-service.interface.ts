import { UserRole, IUser } from "../../models/User.model";

export interface TokenPayload {
    userId: string;
    role: UserRole;
}

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface IAuthService {
    register(userData: Partial<IUser>): Promise<IUser>;
    login(email: string, password: string): Promise<TokenResponse>;
    refreshToken(refreshToken: string): Promise<TokenResponse>;
    validateToken(token: string): Promise<TokenPayload | null>;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    logout(userId: string): Promise<boolean>;
}