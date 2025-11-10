import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

const UPLOAD_LIMIT = Number(process.env.UPLOAD_LIMIT || 1);
const UPLOAD_WINDOW = Number(process.env.UPLOAD_WINDOW_SECONDS || 60);

export async function checkUploadRate(ip: string): Promise<boolean> {
  const key = `upload_rate:${ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, UPLOAD_WINDOW);
  }

  return current <= UPLOAD_LIMIT;
}
