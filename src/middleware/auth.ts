import { FastifyReply, FastifyRequest } from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Allows request only if Authorization header matches ADMIN_TOKEN in .env.
 */
export async function adminAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers['authorization'];

  if (!authHeader) {
    reply.code(401).send({ error: 'Unauthorized: Missing Authorization header' });
    return;
  }

  // Header format →  Authorization: Bearer <token>
  const token = authHeader.replace('Bearer ', '').trim();

  if (token !== process.env.ADMIN_TOKEN) {
    reply.code(403).send({ error: 'Forbidden: Invalid admin token' });
    return;
  }
}
