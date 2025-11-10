import { Worker, Job, Queue } from 'bullmq';
import { EventModel } from '../models/Event';
import { DailyMetricsModel } from '../models/DailyMetrics';
import { connection } from '../config/redis';
import dotenv from 'dotenv';
dotenv.config();

const queue = new Queue('reprocess-daily-metrics', { connection });

export function startReprocessDailyMetricsJob(appLog?: { info: Function; error: Function }) {
  const worker = new Worker(
    'reprocess-daily-metrics',
    async (job: Job) => {
      appLog?.info('Starting daily metrics reprocessing...');

      const events = await EventModel.find({ processed: true });
      
      if (!events.length) {
        appLog?.info('No processed events found');
        return;
      }

      // Compute per-day, per-event_type metrics
      const metricsMap: Record<string, Record<string, number>> = {};

      for (const e of events) {
        const date = new Date(e.timestamp).toISOString().split('T')[1];
        const type = e.event_type;

        if (!metricsMap[date]) metricsMap[date] = {};
        if (!metricsMap[date][type]) metricsMap[date][type] = 0;
        metricsMap[date][type]++;
      }

      // Update metrics
      for (const [date, types] of Object.entries(metricsMap)) {
        const metrics = Object.entries(types).map(([event_type, count]) => ({ event_type, count }));
        await DailyMetricsModel.findOneAndUpdate(
          { date },
          { $set: { metrics } },
          { upsert: true, new: true }
        );
        appLog?.info(`Updated metrics for ${date}: ${JSON.stringify(metrics)}`);
      }

      appLog?.info('Daily metrics reprocessing completed');
    },
    { connection }
  );

  worker.on('failed', async (job, err) => {
    appLog?.error(`Reprocess job ${job?.id} failed: ${err.message}`);
  });

  // Schedule automatic midnight reprocess
  (async () => {
    try {
      await queue.add(
        'reprocess-daily-metrics-task',
        {},
        {
          repeat: { pattern: '0 0 * * *' }, 
          //delay: 10000, 
          removeOnComplete: true,
        }
      );
      appLog?.info('[Reprocess] Midnight reprocess job scheduled successfully');
    } catch (err) {
      appLog?.error('[Reprocess] Failed to schedule midnight job:', err);
    }
  })();

  appLog?.info('Daily metrics reprocessing worker is running...');
}