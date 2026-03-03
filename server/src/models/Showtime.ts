import { Schema, model, Document, Types } from 'mongoose';

export interface IShowtime extends Document {
  movie: Types.ObjectId;
  room: Types.ObjectId;
  startTime: Date;
  endTime: Date;           // ← NEW: required for overlap checks
  price: number;
  createdAt: Date;
}

const showtimeSchema = new Schema<IShowtime>({
  movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },  // ← NEW
  price: { type: Number, required: true, default: 10 },
  createdAt: { type: Date, default: Date.now },
});

// Index for faster overlap queries
showtimeSchema.index({ room: 1, startTime: 1, endTime: 1 });

export default model<IShowtime>('Showtime', showtimeSchema);