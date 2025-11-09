import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisUrl = process.env.REDIS_URL as string; 
export const connection = new IORedis(redisUrl);

connection.on('connect', () => {
  console.log('Redis connected successfully at', redisUrl);
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});
