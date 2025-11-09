import mongoose, { Schema, Document } from 'mongoose';

export interface IBatch extends Document {
  batch_id: string;
  file_name: string;
  total_events: number;
  status: 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

const BatchSchema = new Schema<IBatch>({
  batch_id: { type: String, required: true, unique: true },
  file_name: { type: String, required: true },
  total_events: { type: Number, required: true },
  status: {
    type: String,
    enum: ['uploaded', 'queued', 'processing', 'completed', 'failed'],
    default: 'uploaded',
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

BatchSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export const BatchModel = mongoose.model<IBatch>('Batch', BatchSchema);
