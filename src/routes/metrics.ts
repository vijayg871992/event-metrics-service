import { FastifyInstance } from 'fastify';
import { adminAuth } from '../middleware/auth';
import { getMetrics } from '../controllers/metricsController';

export default async function metricsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [adminAuth] }, getMetrics);
}
