import app from './app';
import { config } from './config/index';
import { connectDatabase } from './config/db';
import mongoose from 'mongoose';

const PORT = config.port;

const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log('===============================================');
    console.log('🚀 NovaTrend Production API Engine is RUNNING!');
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`🍃 Environment: ${config.nodeEnv}`);
    console.log(`📦 API Base: http://localhost:${PORT}/api`);
    console.log('===============================================');
  });

  // Graceful Shutdown
  const shutdown = (signal: string) => {
    console.log(`\n[Process] Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('[Process] HTTP server closed.');
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(false);
          console.log('[MongoDB] Database connections cleanly closed.');
        }
      } catch (err: any) {
        console.error('[MongoDB] Error closing database connection:', err.message);
      }
      process.exit(0);
    });

    // Force close after 10s if connections linger
    setTimeout(() => {
      console.error('[Process] Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
