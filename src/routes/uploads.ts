import { FastifyInstance } from 'fastify';
import { adminAuth } from '../middleware/auth';
import { handleUpload } from '../controllers/uploadController';
import '@fastify/multipart';

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: adminAuth }, handleUpload);
}
