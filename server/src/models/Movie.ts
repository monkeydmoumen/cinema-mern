import { Schema, model, Document } from 'mongoose';

export interface IMovie extends Document {
  title: string;
  description?: string;
  posterUrl?: string;
  trailerUrl?: string;          // ← NEW: trailer link (YouTube, etc.)
  duration?: number;            // minutes
  genres: string[];             // ← NEW: array of genres (e.g. ["Action", "Comedy", "Romance"])
  createdAt: Date;
}

const movieSchema = new Schema<IMovie>({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  posterUrl: { type: String },
  trailerUrl: { type: String }, // e.g. "https://www.youtube.com/watch?v=abc123"
  duration: { type: Number },
  genres: [{ type: String }],   // array of strings
  createdAt: { type: Date, default: Date.now },
});

export default model<IMovie>('Movie', movieSchema);