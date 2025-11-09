import { FastifyReply, FastifyRequest } from 'fastify';
import { eventQueue } from '../utils/queue';
import { BatchModel } from '../models/Batch';

export async function processBatch(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = request.params as { id: string };

    //Validate batch existence
    const batch = await BatchModel.findOne({ batch_id: id });
    if (!batch) {
      return reply.code(404).send({ error: 'Batch not found' });
    }

    //Ensure correct status
    if (batch.status !== 'uploaded') {
      return reply
        .code(400)
        .send({ error: 'Batch already processed or invalid status' });
    }

    //Push job to BullMQ queue
    await eventQueue.add('process-batch', { batchId: id });

    //Update status to queued
    batch.status = 'queued';
    await batch.save();

    reply.send({
      message: 'Batch queued for processing',
      batchId: id,
    });
  } catch (err: any) {
    request.log.error({ err }, 'Error queuing batch');
    reply.code(500).send({ error: 'Internal server error' });
  }
}
