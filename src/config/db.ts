import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

export async function connectDB() {
  if (!MONGO_URI) throw new Error('MONGO_URI not set');

  await mongoose.connect(MONGO_URI, {
    autoIndex: true,
    serverSelectionTimeoutMS: 8000,
  });

  mongoose.connection.on('connected', () =>
    console.log('✅ MongoDB connected to cluster:', mongoose.connection.name)
  );
  mongoose.connection.on('error', (err) =>
    console.error('❌ MongoDB connection error:', err)
  );
}
