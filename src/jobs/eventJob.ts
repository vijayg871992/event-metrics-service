import { Worker, Job } from "bullmq";
import { EventModel } from "../models/Event";
import { BatchModel } from "../models/Batch";
import { DailyMetricsModel } from "../models/DailyMetrics";
import dotenv from "dotenv";
dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export function startEventJob(appLog?: { info: Function; error: Function }) {
  const worker = new Worker(
    "event-processing",
    async (job: Job) => {
      //throw new Error('Testing DLQ');
      const { batchId } = job.data;
      appLog?.info(`Processing batch: ${batchId}`);

      //Idempotency check
      const batch = await BatchModel.findOne({ batch_id: batchId });
      if (batch?.status === "completed") {
        appLog?.info(`Batch ${batchId} already processed, skipping`);
        return;
      }

      await BatchModel.updateOne(
        { batch_id: batchId },
        { status: "processing" }
      );

      const events = await EventModel.find({
        batch_id: batchId,
        processed: false,
      });
      if (!events.length) {
        appLog?.info(`No events found for batch ${batchId}`);
        return;
      }

      //Compute per-day, per-event_type metrics
      const metricsMap: Record<string, Record<string, number>> = {};

      for (const e of events) {
        const date = new Date(e.timestamp).toISOString().split("T")[0];
        const type = e.event_type;

        if (!metricsMap[date]) metricsMap[date] = {};
        if (!metricsMap[date][type]) metricsMap[date][type] = 0;
        metricsMap[date][type]++;
      }

      //Store metrics
      for (const [date, types] of Object.entries(metricsMap)) {
        const metrics = Object.entries(types).map(([event_type, count]) => ({
          event_type,
          count,
        }));
        await DailyMetricsModel.findOneAndUpdate(
          { date },
          { $set: { metrics } },
          { upsert: true, new: true }
        );
      }

      //Update DB
      await EventModel.updateMany({ batch_id: batchId }, { processed: true });
      await BatchModel.updateOne(
        { batch_id: batchId },
        { status: "completed" }
      );

      appLog?.info(`Batch ${batchId} processed successfully`);
    },
    {
      connection,
      concurrency: 2,
    }
  );

  //Handle failures (DLQ-style logging)
  worker.on("failed", async (job, err) => {
    appLog?.error(`Job ${job?.id} failed: ${err.message}`);
    if (job?.data?.batchId) {
      await BatchModel.updateOne(
        { batch_id: job.data.batchId },
        { status: "failed" }
      );
    }
  });

  appLog?.info("Event processing job is running...");
}
