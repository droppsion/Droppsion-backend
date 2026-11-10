import app from './app';
import { config } from './config/index';
import { connectDatabase } from './config/db';

const PORT = config.port;

const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 NovaTrend Backend Server is RUNNING!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🩺 Health: http://localhost:${PORT}/health`);
    console.log(`🍃 Database Status: http://localhost:${PORT}/api/db/status`);
    console.log(`📦 API Docs: http://localhost:${PORT}/api`);
    console.log(`🌐 Allowed Origins: ${config.clientUrl}, ${config.adminUrl}`);
    console.log(`===============================================`);
  });

  // Graceful Shutdown
  const shutdown = () => {
    console.log('Shutting down HTTP server...');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
