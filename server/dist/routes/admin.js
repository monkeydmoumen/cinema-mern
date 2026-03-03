"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/admin.ts — FULL UPDATED with pending bookings support + Socket.IO notify
const express_1 = require("express");
const Movie_1 = __importDefault(require("../models/Movie"));
const Room_1 = __importDefault(require("../models/Room"));
const Showtime_1 = __importDefault(require("../models/Showtime"));
const Booking_1 = __importDefault(require("../models/Booking"));
const date_fns_1 = require("date-fns");
const index_1 = require("../index"); // ← import from main file for real-time
const index_2 = require("../index");
const router = (0, express_1.Router)();
// ────────────── MOVIES ────────────── (unchanged)
router.get('/movies', async (req, res) => {
    try {
        const movies = await Movie_1.default.find().sort({ createdAt: -1 });
        res.json(movies);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/movies', async (req, res) => {
    try {
        const movie = new Movie_1.default(req.body);
        await movie.save();
        // BROADCAST TO ALL USERS
        (0, index_2.notifyNewMovie)(movie);
        res.status(201).json(movie);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put('/movies/:id', async (req, res) => {
    try {
        const movie = await Movie_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!movie)
            return res.status(404).json({ error: 'Movie not found' });
        res.json(movie);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.delete('/movies/:id', async (req, res) => {
    try {
        const movie = await Movie_1.default.findByIdAndDelete(req.params.id);
        if (!movie)
            return res.status(404).json({ error: 'Movie not found' });
        await Showtime_1.default.deleteMany({ movie: req.params.id });
        res.json({ message: 'Movie deleted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// ────────────── ROOMS ────────────── (unchanged)
router.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room_1.default.find().sort({ createdAt: -1 });
        res.json(rooms);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/rooms', async (req, res) => {
    try {
        const room = new Room_1.default(req.body);
        await room.save();
        res.status(201).json(room);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.put('/rooms/:id', async (req, res) => {
    try {
        const room = await Room_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.delete('/rooms/:id', async (req, res) => {
    try {
        const room = await Room_1.default.findByIdAndDelete(req.params.id);
        if (!room)
            return res.status(404).json({ error: 'Room not found' });
        await Showtime_1.default.deleteMany({ room: req.params.id });
        res.json({ message: 'Room deleted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// ────────────── SHOWTIMES ────────────── (unchanged + notify on create/update/delete)
router.get('/showtimes', async (req, res) => {
    try {
        const showtimes = await Showtime_1.default.find()
            .populate('movie', 'title duration')
            .populate('room', 'name')
            .sort({ startTime: -1 });
        res.json(showtimes);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/showtimes', async (req, res) => {
    try {
        const { movie, room, startTime, price } = req.body;
        if (!movie || !room || !startTime || price == null) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const movieDoc = await Movie_1.default.findById(movie);
        if (!movieDoc)
            return res.status(404).json({ error: 'Movie not found' });
        if (!movieDoc.duration)
            return res.status(400).json({ error: 'Movie duration not set' });
        const newStart = new Date(startTime);
        const newEnd = new Date(newStart.getTime() + movieDoc.duration * 60 * 1000);
        const overlapping = await Showtime_1.default.find({
            room,
            $or: [
                { startTime: { $lt: newEnd, $gte: newStart } },
                { endTime: { $gt: newStart, $lte: newEnd } },
                { startTime: { $lte: newStart }, endTime: { $gte: newEnd } },
            ],
        }).populate('movie', 'title');
        if (overlapping.length > 0) {
            const conflict = overlapping[0];
            const movieTitle = conflict.movie?.title || 'Unknown Movie';
            const conflictStart = (0, date_fns_1.format)(new Date(conflict.startTime), 'MMM d, yyyy h:mm a');
            const conflictEnd = (0, date_fns_1.format)(new Date(conflict.endTime), 'h:mm a');
            const suggestedStart = (0, date_fns_1.format)((0, date_fns_1.addMinutes)(new Date(conflict.endTime), 5), 'MMM d, yyyy h:mm a');
            return res.status(409).json({
                error: `Room conflict with "${movieTitle}" from ${conflictStart} to ${conflictEnd}. Suggested start: ${suggestedStart}`,
            });
        }
        const showtime = new Showtime_1.default({
            movie,
            room,
            startTime: newStart,
            endTime: newEnd,
            price,
        });
        await showtime.save();
        const populated = await showtime.populate(['movie', 'room']);
        // Room-specific seat update (already there)
        (0, index_1.notifyShowtimeUpdate)(showtime._id.toString());
        // GLOBAL NOTIFICATION TO ALL USERS
        (0, index_2.notifyNewShowtime)(populated);
        res.status(201).json(populated);
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to create showtime' });
    }
});
router.put('/showtimes/:id', async (req, res) => {
    try {
        const { movie, room, startTime, price } = req.body;
        const existing = await Showtime_1.default.findById(req.params.id);
        if (!existing)
            return res.status(404).json({ error: 'Showtime not found' });
        const movieDoc = await Movie_1.default.findById(movie || existing.movie);
        if (!movieDoc)
            return res.status(404).json({ error: 'Movie not found' });
        if (!movieDoc.duration)
            return res.status(400).json({ error: 'Movie duration not set' });
        const finalRoom = room || existing.room;
        const finalStart = startTime ? new Date(startTime) : existing.startTime;
        const finalEnd = new Date(finalStart.getTime() + movieDoc.duration * 60 * 1000);
        const overlapping = await Showtime_1.default.find({
            room: finalRoom,
            _id: { $ne: req.params.id },
            $or: [
                { startTime: { $lt: finalEnd, $gte: finalStart } },
                { endTime: { $gt: finalStart, $lte: finalEnd } },
                { startTime: { $lte: finalStart }, endTime: { $gte: finalEnd } },
            ],
        }).populate('movie', 'title');
        if (overlapping.length > 0) {
            const conflict = overlapping[0];
            const movieTitle = conflict.movie?.title || 'Unknown Movie';
            const conflictStart = (0, date_fns_1.format)(new Date(conflict.startTime), 'MMM d, yyyy h:mm a');
            const conflictEnd = (0, date_fns_1.format)(new Date(conflict.endTime), 'h:mm a');
            const suggestedStart = (0, date_fns_1.format)((0, date_fns_1.addMinutes)(new Date(conflict.endTime), 5), 'MMM d, yyyy h:mm a');
            return res.status(409).json({
                error: `Room conflict with "${movieTitle}" from ${conflictStart} to ${conflictEnd}. ` +
                    `Suggested start: ${suggestedStart} (5 min buffer).`,
            });
        }
        const updated = await Showtime_1.default.findByIdAndUpdate(req.params.id, {
            movie: movie || existing.movie,
            room: finalRoom,
            startTime: finalStart,
            endTime: finalEnd,
            price: price ?? existing.price,
        }, { new: true, runValidators: true });
        if (!updated)
            return res.status(404).json({ error: 'Showtime not found after update' });
        const populated = await updated.populate(['movie', 'room']);
        (0, index_1.notifyShowtimeUpdate)(updated._id.toString());
        res.json(populated);
    }
    catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message || 'Failed to update showtime' });
    }
});
router.delete('/showtimes/:id', async (req, res) => {
    try {
        const showtime = await Showtime_1.default.findByIdAndDelete(req.params.id);
        if (!showtime)
            return res.status(404).json({ error: 'Showtime not found' });
        // Optional: notify if needed
        (0, index_1.notifyShowtimeUpdate)(req.params.id);
        res.json({ message: 'Showtime deleted' });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// ────────────── BOOKINGS (ADMIN) ────────────── (FULLY UPDATED)
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking_1.default.find()
            .populate('user', 'name email')
            .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title posterUrl' },
                { path: 'room', select: 'name' },
            ],
        })
            .sort({ bookedAt: -1 });
        res.json(bookings);
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
// Admin: Manually confirm a pending booking
router.patch('/bookings/:id/confirm', async (req, res) => {
    try {
        const booking = await Booking_1.default.findById(req.params.id);
        if (!booking)
            return res.status(404).json({ error: 'Booking not found' });
        if (booking.status !== 'pending')
            return res.status(400).json({ error: 'Booking not pending' });
        booking.status = 'confirmed';
        await booking.save();
        (0, index_1.notifyShowtimeUpdate)(booking.showtime.toString());
        const updated = await Booking_1.default.findById(booking._id)
            .populate('user', 'name email')
            .populate({
            path: 'showtime',
            populate: [
                { path: 'movie', select: 'title' },
                { path: 'room', select: 'name' },
            ],
        });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'Failed to confirm booking' });
    }
});
// Admin: Cancel any booking
router.delete('/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking_1.default.findById(req.params.id);
        if (!booking)
            return res.status(404).json({ error: 'Booking not found' });
        booking.status = 'cancelled';
        await booking.save();
        (0, index_1.notifyShowtimeUpdate)(booking.showtime.toString());
        res.json({ message: 'Booking cancelled' });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
