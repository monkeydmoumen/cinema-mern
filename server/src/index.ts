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
   CORS CONFIG (IMPORTANT)
=========================== */

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://merry-creponne-f88dd5.netlify.app' // ← replace if needed
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

/* ===========================
   SOCKET.IO SETUP
=========================== */

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
   CRON JOB
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
      console.log(`Deleted ${toDelete.length} expired bookings`);
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
   START SERVER
=========================== */

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

export default app;