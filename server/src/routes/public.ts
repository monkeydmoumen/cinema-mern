// server/src/routes/public.ts
import { Router } from 'express';
import Movie from '../models/Movie';
import Showtime from '../models/Showtime';
import Booking from '../models/Booking';
import { protect, AuthRequest } from '../middleware/auth';
import { notifyShowtimeUpdate } from '../index'; // ← from main file

const router = Router();

// List all movies
router.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find()
      .sort({ createdAt: -1 })
      .select('title posterUrl description duration genres trailerUrl');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Single movie
router.get('/movies/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .select('title posterUrl description duration genres trailerUrl');
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upcoming showtimes for movie
router.get('/showtimes/movie/:movieId', async (req, res) => {
  try {
    const now = new Date();
    const showtimes = await Showtime.find({
      movie: req.params.movieId,
      startTime: { $gte: now },
    })
      .populate('room', 'name rows columns totalSeats')
      .sort({ startTime: 1 })
      .limit(20);

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create booking (pending)
router.post('/bookings', protect, async (req: AuthRequest, res) => {
  try {
    const { showtimeId, seats } = req.body;

    if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'Showtime ID and seats required' });
    }

    const normalizedSeats = seats.map((s: string) => s.trim().toUpperCase());

    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });

    const conflicting = await Booking.find({
      showtime: showtimeId,
      seats: { $in: normalizedSeats },
    });

    if (conflicting.length > 0) {
      const taken = conflicting.flatMap(b => b.seats);
      const conflicts = normalizedSeats.filter(s => taken.includes(s));
      return res.status(409).json({
        error: `Seats taken: ${conflicts.join(', ')}`,
      });
    }

    const totalPrice = showtime.price * normalizedSeats.length;

    const booking = new Booking({
      user: req.user!.id,
      showtime: showtimeId,
      seats: normalizedSeats,
      totalPrice,
      status: 'pending',
    });

    await booking.save();

    // Real-time notify
    notifyShowtimeUpdate(showtimeId);

    const populated = await Booking.findById(booking._id)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl genres trailerUrl' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate('user', 'name email');

    res.status(201).json(populated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to book' });
  }
});

// Booked seats (include pending)
router.get('/bookings/seats/:showtimeId', async (req, res) => {
  try {
    const filter: any = {
      showtime: req.params.showtimeId,
      status: { $in: ['confirmed', 'pending'] },
    };

    if (req.query.excludeBookingId) {
      filter._id = { $ne: req.query.excludeBookingId };
    }

    const bookings = await Booking.find(filter);
    const booked = new Set(bookings.flatMap(b => b.seats));

    res.json(Array.from(booked));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User's bookings (pending + confirmed)
router.get('/my-bookings', protect, async (req: AuthRequest, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user!.id,
      status: { $in: ['confirmed', 'pending'] },
    })
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl genres trailerUrl' },
          { path: 'room', select: 'name' },
        ],
      })
      .sort({ 'showtime.startTime': 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel (only confirmed)
router.delete('/my-bookings/:bookingId', protect, async (req: AuthRequest, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user!.id,
      status: 'confirmed',
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const showtime = await Showtime.findById(booking.showtime);
    if (!showtime || new Date(showtime.startTime) <= new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past showtimes' });
    }

    booking.status = 'cancelled';
    await booking.save();

    notifyShowtimeUpdate(booking.showtime.toString());

    res.json({ message: 'Cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Edit seats (only confirmed)
router.patch('/my-bookings/:bookingId', protect, async (req: AuthRequest, res) => {
  try {
    const { seats } = req.body;

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ error: 'Seats required' });
    }

    const normalizedSeats = seats.map((s: string) => s.trim().toUpperCase());

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user!.id,
      status: 'confirmed',
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const showtime = await Showtime.findById(booking.showtime);
    if (!showtime || new Date(showtime.startTime) <= new Date()) {
      return res.status(400).json({ error: 'Cannot edit past bookings' });
    }

    const conflicting = await Booking.find({
      showtime: booking.showtime,
      _id: { $ne: booking._id },
      seats: { $in: normalizedSeats },
    });

    if (conflicting.length > 0) {
      const taken = conflicting.flatMap(b => b.seats);
      const conflicts = normalizedSeats.filter(s => taken.includes(s));
      return res.status(409).json({ error: `Seats taken: ${conflicts.join(', ')}` });
    }

    booking.seats = normalizedSeats;
    booking.totalPrice = showtime.price * normalizedSeats.length;
    await booking.save();

    notifyShowtimeUpdate(booking.showtime.toString());

    const updated = await Booking.findById(booking._id)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl genres trailerUrl' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate('user', 'name email');

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Update failed' });
  }
});

// Pay pending booking (mock)
router.patch('/my-bookings/:bookingId/pay', protect, async (req: AuthRequest, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user!.id,
      status: 'pending',
    });

    if (!booking) return res.status(404).json({ error: 'Pending booking not found' });

    // Mock delay (simulate processing)
    await new Promise(resolve => setTimeout(resolve, 2000));

    booking.status = 'confirmed';
    await booking.save();

    notifyShowtimeUpdate(booking.showtime.toString());

    const updated = await Booking.findById(booking._id)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title posterUrl genres trailerUrl' },
          { path: 'room', select: 'name' },
        ],
      })
      .populate('user', 'name email');

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment failed' });
  }
});

// Upcoming showtimes (for filters)
router.get('/showtimes', async (req, res) => {
  try {
    const now = new Date();
    const limit = parseInt(req.query.limit as string) || 10;

    const showtimes = await Showtime.find({
      startTime: { $gte: now },
    })
      .populate('movie', 'title posterUrl') // ← populate title & poster
      .populate('room', 'name')             // ← populate room name
      .select('movie startTime room price') // ← include price!
      .sort({ startTime: 1 })
      .limit(limit);

    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Single showtime details
router.get('/showtimes/:id', async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie', 'title posterUrl duration genres trailerUrl')
      .populate('room', 'name rows columns totalSeats');
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
    res.json(showtime);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;