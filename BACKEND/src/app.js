import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import errorHandler from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import incidentRoutes from './routes/incident.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import activityRoutes from './routes/activity.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activities', activityRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;