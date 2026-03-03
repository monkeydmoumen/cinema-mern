// server/src/models/Room.ts — simplified, no hooks
import { Schema, model, Document } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  rows: number;
  columns: number;
  totalSeats: number;     // sent from frontend
  sections?: string[];
  createdAt: Date;
}

const roomSchema = new Schema<IRoom>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  rows: {
    type: Number,
    required: true,
    min: 1,
    max: 50,
  },
  columns: {
    type: Number,
    required: true,
    min: 1,
    max: 50,
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
  },
  sections: [{
    type: String,
    trim: true,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model<IRoom>('Room', roomSchema);