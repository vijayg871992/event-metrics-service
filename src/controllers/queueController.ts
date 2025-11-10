import { FastifyReply, FastifyRequest } from 'fastify';
import { eventQueue } from '../utils/queue';

export async function getQueueDLQ(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { name } = request.params as { name: string };

    if (name !== 'event-processing') {
      return reply.code(404).send({ error: 'Queue not found' });
    }

    const failed = await eventQueue.getFailed(0, 100);

    return reply.send({
      queue: name,
      failed_count: failed.length,
      jobs: failed.map((job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
      })),
    });
  } catch (err: any) {
    request.log.error({ err }, 'Error fetching DLQ');
    return reply.code(500).send({ error: 'Internal server error' });
  }
}