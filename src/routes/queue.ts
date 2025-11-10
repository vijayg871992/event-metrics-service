import { FastifyInstance } from 'fastify';
import { getQueueDLQ } from '../controllers/queueController';

export default async function queueRoutes(app: FastifyInstance) {
  app.get('/queues/:name/dlq', getQueueDLQ);
}