// server/src/models/Booking.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  user: Types.ObjectId;
  showtime: Types.ObjectId;
  seats: string[];
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  showtime: {
    type: Schema.Types.ObjectId,
    ref: 'Showtime',
    required: true,
  },
  seats: {
    type: [String],
    required: true,
    minlength: 1,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'pending', // pending until paid
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent double-booking same seat for same showtime
bookingSchema.index({ showtime: 1, seats: 1 }, { unique: true });

export default model<IBooking>('Booking', bookingSchema);