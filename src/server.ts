import { connectDB } from './config/db';

async function startServer() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully!');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
  } finally {
    process.exit(0);
  }
}

startServer();
