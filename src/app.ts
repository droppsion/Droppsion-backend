import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/index';
import { getDbStatus } from './config/db';

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: [
      config.clientUrl,
      config.adminUrl,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req: Request, _res: Response, next) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health Check with Database Status
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    database: getDbStatus(),
  });
});

// API Routes Mounted on /api and /api/v1
app.use('/api', routes);
app.use('/api/v1', routes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found. Refer to /api for available routes.',
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
