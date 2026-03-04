// server/src/index.ts — FULL UPDATED FILE (CORS fixed for Vercel + Socket.IO)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';
import { Server } from 'socket.io';
import http from 'http';

import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import publicRoutes from './routes/public';
import chatRoutes from './routes/chat';

import { protect, adminOnly } from './middleware/auth';
import Booking from './models/Booking';

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ===========================
   CORS CONFIG — UPDATED FOR VERCEL + RAILWAY
=========================== */

const allowedOrigins = [
  'http://localhost:5173',                     // local Vite dev
  'http://localhost:3000',                     // local fallback
  'https://merry-creponne-f88dd5.netlify.app', // old Netlify (optional)
  'https://cinema-mern-fx6t3yzkc-monkeydmoumens-projects.vercel.app', // your current Vercel domain
  'https://*.vercel.app',                      // allow all Vercel previews/domains
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile, etc.)
    if (!origin) return callback(null, true);

    // Allow Vercel domains (exact match or wildcard)
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // TEMP: allow all for quick test (remove after confirming it works)
    // return callback(null, true);

    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Explicitly handle preflight OPTIONS requests (critical for Socket.IO polling + CORS)
app.options('*', cors());

app.use(express.json());

/* ===========================
   SOCKET.IO SETUP — with same CORS
=========================== */

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins.concat(['https://*.vercel.app']), // same origins + wildcard
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-showtime', (showtimeId: string) => {
    socket.join(`showtime:${showtimeId}`);
  });

  socket.on('join-movie-chat', (movieId: string) => {
    socket.join(`movie:${movieId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

/* ===========================
   NOTIFY FUNCTIONS
=========================== */

export const notifyShowtimeUpdate = (showtimeId: string) => {
  io.to(`showtime:${showtimeId}`).emit('seats-updated', { showtimeId });
};

export const notifyNewMovie = (movie: any) => {
  io.emit('new-movie', { movie });
};

export const notifyNewShowtime = (showtime: any) => {
  io.emit('new-showtime', { showtime });
};

/* ===========================
   CRON JOB — Cleanup pending bookings
=========================== */

cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const pendingBookings = await Booking.find({ status: 'pending' })
      .populate<{ showtime: { startTime: Date } }>('showtime', 'startTime');

    const toDelete = pendingBookings.filter(
      (b) => b.showtime && new Date(b.showtime.startTime) < in12h
    );

    if (toDelete.length > 0) {
      await Booking.deleteMany({ _id: { $in: toDelete.map((b) => b._id) } });
      console.log(`Deleted ${toDelete.length} expired pending bookings`);
    }
  } catch (err) {
    console.error('Cron error:', err);
  }
});

/* ===========================
   ROUTES
=========================== */

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cinema backend alive' });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', protect, adminOnly, adminRoutes);
app.use('/api/chat', chatRoutes);

/* ===========================
   START SERVER — Only local, Railway ignores listen()
=========================== */

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('MongoDB connected');
    // Only listen in local dev — Railway/Vercel handle serverless
    if (process.env.NODE_ENV !== 'production') {
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;