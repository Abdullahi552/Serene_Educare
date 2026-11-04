import * as authService from '../services/auth.service.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';

export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.loginUser(email, password);

    // Set Refresh Token in HttpOnly Cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        token: accessToken,
        user
    });
});

export const refresh = catchAsync(async (req, res) => {
    const token = req.cookies.refreshToken;
    const { accessToken } = await authService.refreshSession(token);
    res.status(200).json({ token: accessToken });
});

export const logout = catchAsync(async (req, res) => {
    const token = req.cookies.refreshToken;
    await authService.logoutUser(token);
    
    // Clear the cookie
    res.clearCookie('refreshToken');
    res.status(204).send();
});