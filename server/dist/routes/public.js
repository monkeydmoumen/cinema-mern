"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/public.ts
const express_1 = require("express");
const Movie_1 = __importDefault(require("../models/Movie"));
const Showtime_1 = __importDefault(require("../models/Showtime"));
const Booking_1 = __importDefault(require("../models/Booking"));
const auth_1 = require("../middleware/auth");
const index_1 = require("../index"); // ← from main file
const router = (0, express_1.Router)();
// List all movies
router.get('/movies', async (req, res) => {
    try {
        const movies = await Movie_1.default.find()
            .sort({ createdAt: -1 })
            .select('title posterUrl description duration genres trailerUrl');
        res.json(movies);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Single movie
router.get('/movies/:id', async (req, res) => {
    try {
        const movie = await Movie_1.default.findById(req.params.id)
            .select('title posterUrl description duration genres trailerUrl');
        if (!movie)
            return res.status(404).json({ error: 'Movie not found' });
        res.json(movie);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Upcoming showtimes for movie
router.get('/showtimes/movie/:movieId', async (req, res) => {
    try {
        const now = new Date();
        const showtimes = await Showtime_1.default.find({
            movie: req.params.movieId,
            startTime: { $gte: now },
        })
            .populate('room', 'name rows columns totalSeats')
            .sort({ startTime: 1 })
            .limit(20);
        res.json(showtimes);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Create booking (pending)
router.post('/bookings', auth_1.protect, async (req, res) => {
    try {
        const { showtimeId, seats } = req.body;
        if (!showtimeId || !seats || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ error: 'Showtime ID and seats required' });
        }
        const normalizedSeats = seats.map((s) => s.trim().toUpperCase());
        const showtime = await Showtime_1.default.findById(showtimeId);
        if (!showtime)
            return res.status(404).json({ error: 'Showtime not found' });
        const conflicting = await Booking_1.default.find({
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
        const booking = new Booking_1.default({
            user: req.user.id,
            showtime: showtimeId,
            seats: normalizedSeats,
            totalPrice,
            status: 'pending',
        });
        await booking.save();
        // Real-time notify
        (0, index_1.notifyShowtimeUpdate)(showtimeId);
        const populated = await Booking_1.default.findById(booking._id)
            .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title posterUrl genres trailerUrl' },
                { path: 'room', select: 'name' },
            ],
        })
            .populate('user', 'name email');
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Failed to book' });
    }
});
// Booked seats (include pending)
router.get('/bookings/seats/:showtimeId', async (req, res) => {
    try {
        const filter = {
            showtime: req.params.showtimeId,
            status: { $in: ['confirmed', 'pending'] },
        };
        if (req.query.excludeBookingId) {
            filter._id = { $ne: req.query.excludeBookingId };
        }
        const bookings = await Booking_1.default.find(filter);
        const booked = new Set(bookings.flatMap(b => b.seats));
        res.json(Array.from(booked));
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// User's bookings (pending + confirmed)
router.get('/my-bookings', auth_1.protect, async (req, res) => {
    try {
        const bookings = await Booking_1.default.find({
            user: req.user.id,
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
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Cancel (only confirmed)
router.delete('/my-bookings/:bookingId', auth_1.protect, async (req, res) => {
    try {
        const booking = await Booking_1.default.findOne({
            _id: req.params.bookingId,
            user: req.user.id,
            status: 'confirmed',
        });
        if (!booking)
            return res.status(404).json({ error: 'Booking not found' });
        const showtime = await Showtime_1.default.findById(booking.showtime);
        if (!showtime || new Date(showtime.startTime) <= new Date()) {
            return res.status(400).json({ error: 'Cannot cancel past showtimes' });
        }
        booking.status = 'cancelled';
        await booking.save();
        (0, index_1.notifyShowtimeUpdate)(booking.showtime.toString());
        res.json({ message: 'Cancelled' });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Edit seats (only confirmed)
router.patch('/my-bookings/:bookingId', auth_1.protect, async (req, res) => {
    try {
        const { seats } = req.body;
        if (!seats || !Array.isArray(seats) || seats.length === 0) {
            return res.status(400).json({ error: 'Seats required' });
        }
        const normalizedSeats = seats.map((s) => s.trim().toUpperCase());
        const booking = await Booking_1.default.findOne({
            _id: req.params.bookingId,
            user: req.user.id,
            status: 'confirmed',
        });
        if (!booking)
            return res.status(404).json({ error: 'Booking not found' });
        const showtime = await Showtime_1.default.findById(booking.showtime);
        if (!showtime || new Date(showtime.startTime) <= new Date()) {
            return res.status(400).json({ error: 'Cannot edit past bookings' });
        }
        const conflicting = await Booking_1.default.find({
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
        (0, index_1.notifyShowtimeUpdate)(booking.showtime.toString());
        const updated = await Booking_1.default.findById(booking._id)
            .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title posterUrl genres trailerUrl' },
                { path: 'room', select: 'name' },
            ],
        })
            .populate('user', 'name email');
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Update failed' });
    }
});
// Pay pending booking (mock)
router.patch('/my-bookings/:bookingId/pay', auth_1.protect, async (req, res) => {
    try {
        const booking = await Booking_1.default.findOne({
            _id: req.params.bookingId,
            user: req.user.id,
            status: 'pending',
        });
        if (!booking)
            return res.status(404).json({ error: 'Pending booking not found' });
        // Mock delay (simulate processing)
        await new Promise(resolve => setTimeout(resolve, 2000));
        booking.status = 'confirmed';
        await booking.save();
        (0, index_1.notifyShowtimeUpdate)(booking.showtime.toString());
        const updated = await Booking_1.default.findById(booking._id)
            .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title posterUrl genres trailerUrl' },
                { path: 'room', select: 'name' },
            ],
        })
            .populate('user', 'name email');
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Payment failed' });
    }
});
// Upcoming showtimes (for filters)
router.get('/showtimes', async (req, res) => {
    try {
        const now = new Date();
        const limit = parseInt(req.query.limit) || 10;
        const showtimes = await Showtime_1.default.find({
            startTime: { $gte: now },
        })
            .populate('movie', 'title posterUrl') // ← populate title & poster
            .populate('room', 'name') // ← populate room name
            .select('movie startTime room price') // ← include price!
            .sort({ startTime: 1 })
            .limit(limit);
        res.json(showtimes);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Single showtime details
router.get('/showtimes/:id', async (req, res) => {
    try {
        const showtime = await Showtime_1.default.findById(req.params.id)
            .populate('movie', 'title posterUrl duration genres trailerUrl')
            .populate('room', 'name rows columns totalSeats');
        if (!showtime)
            return res.status(404).json({ error: 'Showtime not found' });
        res.json(showtime);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
