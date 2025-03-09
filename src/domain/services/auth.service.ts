import jwt, { SignOptions } from 'jsonwebtoken';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IUser } from '../models/User.model';
import { ValidationError, UnauthorizedError, NotFoundError } from '../../common/errors';
import { IAuthService, TokenResponse, TokenPayload } from '../interfaces/services/auth-service.interface';
import { env } from '../../config/env';
import { ITokenStore } from '../../infratstructure/cache/token.store';

export class AuthService implements IAuthService {
    constructor(
        private userRepository: IUserRepository,
        private tokenStore: ITokenStore
    ) { }

    async register(userData: Partial<IUser>): Promise<IUser> {
        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(userData.email as string);
        if (existingUser) {
            throw new ValidationError('User with this email already exists');
        }

        // Create new user
        return await this.userRepository.create(userData);
    }

    async login(email: string, password: string): Promise<TokenResponse> {
        // Find user with password
        const user = await this.userRepository.findByEmailWithPassword(email);
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Generate tokens
        return this.generateTokens(user);
    }

    async refreshToken(refreshToken: string): Promise<TokenResponse> {
        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as TokenPayload;
            const userId = decoded.userId;

            // Verify the token exists in Redis
            const isValid = await this.tokenStore.verifyRefreshToken(userId, refreshToken);
            if (!isValid) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            // Get user
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new UnauthorizedError('Invalid refresh token');
            }

            // Remove the used refresh token (optional, depends on your security policy)
            await this.tokenStore.removeRefreshToken(userId, refreshToken);

            // Generate new tokens
            return this.generateTokens(user);
        } catch (error) {
            throw new UnauthorizedError('Invalid refresh token');
        }
    }

    async validateToken(token: string): Promise<TokenPayload | null> {
        try {
            // Decode the token without verification first to get the user ID
            const decoded = jwt.decode(token) as TokenPayload;
            if (!decoded || !decoded.userId) {
                return null;
            }

            // Verify the token exists in Redis
            const isValid = await this.tokenStore.verifyAccessToken(decoded.userId, token);
            if (!isValid) {
                return null;
            }

            // If it exists in Redis, verify the signature as well
            return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    async logout(userId: string): Promise<boolean> {
        try {
            // Remove all tokens for the user
            await this.tokenStore.removeTokens(userId);
            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
        try {
            // Find user with password
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Get user with password field
            const userWithPassword = await this.userRepository.findByEmailWithPassword(user.email);
            if (!userWithPassword) {
                throw new NotFoundError('User not found');
            }

            // Verify old password
            const isPasswordValid = await userWithPassword.comparePassword(oldPassword);
            if (!isPasswordValid) {
                throw new UnauthorizedError('Invalid current password');
            }

            // Update password
            userWithPassword.password = newPassword;
            await userWithPassword.save();

            // Invalidate all existing tokens (security best practice)
            await this.tokenStore.removeTokens(userId);

            return true;
        } catch (error) {
            throw error;
        }
    }

    private async generateTokens(user: IUser): Promise<TokenResponse> {
        const payload: TokenPayload = {
            userId: String(user._id),
            role: user.role
        };

        // Parse expiration times
        const accessExpiration = parseExpirationTime(env.JWT_ACCESS_EXPIRATION);
        const refreshExpiration = parseExpirationTime(env.JWT_REFRESH_EXPIRATION);

        // Generate access token
        const accessToken = jwt.sign(
            payload,
            env.JWT_ACCESS_SECRET,
            { expiresIn: env.JWT_ACCESS_EXPIRATION } as SignOptions
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
            payload,
            env.JWT_REFRESH_SECRET,
            { expiresIn: env.JWT_REFRESH_EXPIRATION } as SignOptions
        );

        // Store tokens in Redis
        await this.tokenStore.saveAccessToken(
            String(user._id),
            accessToken,
            accessExpiration.seconds
        );

        await this.tokenStore.saveRefreshToken(
            String(user._id),
            refreshToken,
            refreshExpiration.seconds
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: accessExpiration.seconds
        };
    }
}

// Helper function to parse JWT expiration time strings like "15m", "2h", "7d"
function parseExpirationTime(expirationString: string): { seconds: number, milliseconds: number } {
    const unit = expirationString.slice(-1);
    const value = parseInt(expirationString.slice(0, -1));

    let seconds = 0;

    switch (unit) {
        case 's': // seconds
            seconds = value;
            break;
        case 'm': // minutes
            seconds = value * 60;
            break;
        case 'h': // hours
            seconds = value * 60 * 60;
            break;
        case 'd': // days
            seconds = value * 24 * 60 * 60;
            break;
        default:
            // If no unit is provided, assume seconds
            seconds = parseInt(expirationString);
    }

    return {
        seconds,
        milliseconds: seconds * 1000
    };
}