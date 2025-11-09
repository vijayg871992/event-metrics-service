import { EventModel } from '../models/Event';
import { BatchModel } from '../models/Batch';
import dotenv from 'dotenv';
dotenv.config();

export function startCleanupJob(appLog?: { info: Function; error: Function }) {
  const ttl = Number(process.env.CLEANUP_TTL_SECONDS || 86400);
  const interval = Number(process.env.CLEANUP_INTERVAL_SECONDS || 3600);

  async function cleanup() {
    try {
      const cutoff = new Date(Date.now() - ttl * 1000);

      // Step 1: Delete unprocessed old events
      const result = await EventModel.deleteMany({
        processed: false,
        created_at: { $lt: cutoff },
      });
      appLog?.info(
        `Cleanup: deleted ${result.deletedCount} unprocessed events older than ${ttl}s`
      );

      // ✅ Step 2: Delete old batches (simple, clean)
      const batchResult = await BatchModel.deleteMany({
        status: 'uploaded',  
        created_at: { $lt: cutoff },
      });
      appLog?.info(
        `Cleanup: deleted ${batchResult.deletedCount} old batches older than ${ttl}s`
      );

    } catch (err: any) {
      appLog?.error('Cleanup job failed:', err);
    }
  }

  // Run once at startup + interval
  cleanup();
  setInterval(cleanup, interval * 1000);
}
