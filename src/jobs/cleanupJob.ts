import { EventModel } from '../models/Event';
import dotenv from 'dotenv';
dotenv.config();

/**
 * 1. Cleanup runs at every server start and every 1 hour (editable)
 * 2. Events deleted after CLEANUP_TTL_SECONDS -> 5s to 24h
 */

export function startCleanupJob(appLog?: { info: Function; error: Function }) {

  const ttlSeconds = Number(process.env.CLEANUP_TTL_SECONDS); 
  const intervalMs = Number(process.env.CLEANUP_INTERVAL_SECONDS); 

  const logInfo = (msg: string) => (appLog?.info ? appLog.info(msg) : console.log(msg));
  const logError = (msg: string, err?: any) =>
    appLog?.error ? appLog.error(msg, err) : console.error(msg, err);

  const runCleanup = async (label = 'scheduled') => {
    const cutoff = new Date(Date.now() - ttlSeconds * 1000);
    try {
      const res = await EventModel.deleteMany({
        processed: false,
        created_at: { $lt: cutoff },
      });
      logInfo(
        `Cleanup (${label}): deleted ${res.deletedCount ?? 0} unprocessed events older than ${ttlSeconds}s`
      );
    } catch (err) {
      logError('Cleanup error during ' + label, err);
    }
  };

  //Cleanup at start
  runCleanup('startup');

  // Scheduled cleanup 
  setInterval(() => runCleanup(), intervalMs*1000);
}
