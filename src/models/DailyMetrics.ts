import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyMetrics extends Document {
  date: string; // YYYY-MM-DD
  metrics: {
    event_type: string;
    count: number;
  }[];
  created_at: Date;
  updated_at: Date;
}

const DailyMetricsSchema = new Schema<IDailyMetrics>({
  date: { type: String, required: true, unique: true },
  metrics: [
    {
      event_type: { type: String, required: true },
      count: { type: Number, required: true },
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

DailyMetricsSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export const DailyMetricsModel = mongoose.model<IDailyMetrics>( 'DailyMetrics', DailyMetricsSchema );
