import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import AppError from '../utils/AppError.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

export const loginUser = async (email, password) => {
    const user = await prisma.user.findUnique({ 
        where: { email: email.toLowerCase() },
        include: { school: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new AppError('Invalid email or password.', 401);
    }

    if (!user.active) {
        throw new AppError('Account deactivated.', 403);
    }

    const accessToken = generateAccessToken(user.id, user.schoolId);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in DB for revocation capability
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.session.create({
        data: {
            userId: user.id,
            refreshToken,
            expiresAt
        }
    });

    // Remove password from response
    const { passwordHash, ...userResponse } = user;

    return { accessToken, refreshToken, user: userResponse };
};

export const refreshSession = async (token) => {
    if (!token) throw new AppError('No refresh token provided', 401);

    const session = await prisma.session.findUnique({
        where: { refreshToken: token },
        include: { user: true }
    });

    if (!session || session.expiresAt < new Date() || !session.user.active) {
        // If token is invalid or expired, delete it if it exists
        if (session) await prisma.session.delete({ where: { id: session.id } });
        throw new AppError('Invalid or expired refresh token', 401);
    }

    const accessToken = generateAccessToken(session.user.id, session.user.schoolId);
    return { accessToken };
};

export const logoutUser = async (token) => {
    if (!token) return;
    // Delete the session from DB to revoke access instantly
    await prisma.session.deleteMany({
        where: { refreshToken: token }
    });
};