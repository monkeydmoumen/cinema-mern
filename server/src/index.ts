// server/src/index.ts
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
import chatRoutes from './routes/chat'; // ← NEW: we'll add this file

import { protect, adminOnly } from './middleware/auth';
import Booking from './models/Booking';
import Showtime from './models/Showtime';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
export const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // your frontend
    methods: ['GET', 'POST'],
  },
});

// Clients join room for specific showtime
io.on('connection', (socket) => {
  socket.on('join-showtime', (showtimeId: string) => {
    socket.join(`showtime:${showtimeId}`);
    console.log(`Client joined showtime: ${showtimeId}`);
  });
  // NEW: Join movie chat room
  socket.on('join-movie-chat', (movieId: string) => {
    if (movieId && typeof movieId === 'string') {
      socket.join(`movie:${movieId}`);
      console.log(`Socket ${socket.id} joined movie chat: ${movieId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
  
});

// Export notify function for routes
export const notifyShowtimeUpdate = (showtimeId: string) => {
  io.to(`showtime:${showtimeId}`).emit('seats-updated', { showtimeId });
  console.log(`Broadcasted update for showtime: ${showtimeId}`);
};

// Notify ALL connected clients about new movie
export const notifyNewMovie = (movie: any) => {
  io.emit('new-movie', { movie });
  console.log('Broadcast: New movie added', movie.title);
};

// Notify ALL connected clients about new showtime
export const notifyNewShowtime = (showtime: any) => {
  io.emit('new-showtime', { showtime });
  console.log('Broadcast: New showtime added', showtime._id);
};

app.use(cors({
  origin: [
    'http://localhost:5173',                     // local Vite
    'http://localhost:3000',                     // local CRA fallback
    'https://merry-creponne-f88dd5.netlify.app', // your Netlify URL — change if different
    '*'                                          // TEMP for testing — remove later
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Explicitly handle preflight OPTIONS (fixes some CORS issues)
app.options('*', cors());
app.use(express.json());

// Cleanup pending bookings every 5 minutes (expire if showtime < 12h away)
cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const pendingBookings = await Booking.find({ status: 'pending' })
      .populate<{ showtime: { startTime: Date } }>('showtime', 'startTime');

    const toDelete = pendingBookings.filter(b => 
      b.showtime && new Date(b.showtime.startTime) < in12h
    );

    if (toDelete.length > 0) {
      await Booking.deleteMany({ _id: { $in: toDelete.map(b => b._id) } });
      console.log(`Deleted ${toDelete.length} expired pending bookings`);
    }
  } catch (err) {
    console.error('Cron error:', err);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cinema backend alive' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', protect, adminOnly, adminRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 4000;
app.get('/debug', (req, res) => {
  res.status(200).json({
    status: 'alive',
    env: process.env.NODE_ENV,
    mongoUriExists: !!process.env.MONGO_URI,
    message: 'Backend reached this route'
  });
});
mongoose
  .connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

  export default app;