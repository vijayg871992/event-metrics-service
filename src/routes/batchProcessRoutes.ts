import { FastifyInstance } from 'fastify';
import { adminAuth } from '../middleware/auth';
import { processBatch } from '../controllers/batchController';

export default async function batchProcessRoutes(app: FastifyInstance) {
  app.post('/batches/:id/process', { preHandler: [adminAuth] }, processBatch);
}
