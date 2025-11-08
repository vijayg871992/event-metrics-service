import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  event_id: string;
  batch_id: string;
  candidate_id: string;
  test_id: string;
  event_type: string;
  timestamp: Date;
  processed: boolean;
  created_at: Date;
}

const EventSchema = new Schema<IEvent>({
  event_id: { type: String, required: true },
  batch_id: { type: String, required: true },
  candidate_id: { type: String, required: true },
  test_id: { type: String, required: true },
  event_type: { type: String, required: true },
  timestamp: { type: Date, required: true },
  processed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

EventSchema.index({ batch_id: 1, event_id: 1 }, { unique: true });

export const EventModel = mongoose.model<IEvent>('Event', EventSchema);
