import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app';
import sequelize from './config/database';
import logger from './utils/logger';

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established.');

    const server = http.createServer(app);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Avazas Books API server listening on port ${PORT}`);
      logger.info(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Base URL: http://0.0.0.0:${PORT}/api/v1`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Gracefully closing server...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await sequelize.close();
          logger.info('Database connection pool closed.');
          process.exit(0);
        } catch (err) {
          logger.error('Error closing database:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}

export default app;
