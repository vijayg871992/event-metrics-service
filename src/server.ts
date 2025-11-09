import Fastify from 'fastify';
import './config/redis';
import { connectDB } from './config/db';
import { adminAuth } from './middleware/auth';
import uploadRoutes from './routes/uploads';
import multipart from '@fastify/multipart';
import { startCleanupJob } from './jobs/cleanupJob';
import { startEventJob } from './jobs/eventJob';
import batchProcessRoutes from './routes/batchProcessRoutes';

async function startServer() {
  try {
    // Fastify logger config (v5 style)
    const app = Fastify({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',          
          options: { colorize: true },
        },
      },
    });
    // Connect to MongoDB
    await connectDB();
    app.log.info('MongoDB connection established');

    //Jobs - Worker functions
    startCleanupJob(app.log);
    startEventJob(app.log);

    app.get('/secure', { preHandler: adminAuth }, async () => {
    return { message: 'Secure route accessed' };
    });

    await app.register(multipart);

    await app.register(batchProcessRoutes);
    
    app.register(uploadRoutes, { prefix: '/uploads' });

    // Health check route
    app.get('/health', async () => {
      return { status: 'ok', uptime: process.uptime() };
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });

    app.log.info(`Server running at http://localhost:${PORT}`);
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
}

startServer();
