// server/src/models/Message.ts
import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  movie: Types.ObjectId;
  user: Types.ObjectId;
  username: string; // cached for display
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  movie: {
    type: Schema.Types.ObjectId,
    ref: 'Showtime.movie', // or 'Movie' if separate
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default model<IMessage>('Message', messageSchema);