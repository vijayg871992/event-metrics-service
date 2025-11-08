import Fastify from 'fastify';
import pino from 'pino';
import { connectDB } from './config/db';

async function startServer() {
  try {
    // ✅ Fastify logger config (v5 style)
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
    app.log.info('✅ MongoDB connection established');

    // Health check route
    app.get('/health', async () => {
      return { status: 'ok', uptime: process.uptime() };
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    await app.listen({ port: Number(PORT), host: '0.0.0.0' });

    app.log.info(`🚀 Server running at http://localhost:${PORT}`);
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

startServer();
