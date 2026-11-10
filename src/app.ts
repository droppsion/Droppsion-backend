import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config/index';
import { getDbStatus } from './config/db';

const app: Application = express();

// Enable reverse proxy trust (for Vercel, Railway, Render, AWS ALB, Nginx)
app.set('trust proxy', 1);

// Production Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Production & Development CORS Configuration
const allowedOrigins = [
  config.clientUrl,
  config.adminUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  ...(process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, curl, postman, and server-to-server with no origin header
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some(
        (allowed) => allowed && (origin === allowed || origin.startsWith(allowed))
      );

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy restriction: Origin ${origin} is not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsers with Security Size Limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request Logger (Masks sensitive query parameters in production)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health Check with Database Status
app.get('/health', (_req: Request, res: Response) => {
  const db = getDbStatus();
  const isHealthy = db.connected || process.env.NODE_ENV !== 'production';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    database: db,
    version: '1.0.0',
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
