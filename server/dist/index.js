"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyNewShowtime = exports.notifyNewMovie = exports.notifyShowtimeUpdate = exports.io = void 0;
// server/src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const node_cron_1 = __importDefault(require("node-cron"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const admin_1 = __importDefault(require("./routes/admin"));
const auth_1 = __importDefault(require("./routes/auth"));
const public_1 = __importDefault(require("./routes/public"));
const chat_1 = __importDefault(require("./routes/chat")); // ← NEW: we'll add this file
const auth_2 = require("./middleware/auth");
const Booking_1 = __importDefault(require("./models/Booking"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Socket.IO setup
exports.io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:5173', // your frontend
        methods: ['GET', 'POST'],
    },
});
// Clients join room for specific showtime
exports.io.on('connection', (socket) => {
    socket.on('join-showtime', (showtimeId) => {
        socket.join(`showtime:${showtimeId}`);
        console.log(`Client joined showtime: ${showtimeId}`);
    });
    // NEW: Join movie chat room
    socket.on('join-movie-chat', (movieId) => {
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
const notifyShowtimeUpdate = (showtimeId) => {
    exports.io.to(`showtime:${showtimeId}`).emit('seats-updated', { showtimeId });
    console.log(`Broadcasted update for showtime: ${showtimeId}`);
};
exports.notifyShowtimeUpdate = notifyShowtimeUpdate;
// Notify ALL connected clients about new movie
const notifyNewMovie = (movie) => {
    exports.io.emit('new-movie', { movie });
    console.log('Broadcast: New movie added', movie.title);
};
exports.notifyNewMovie = notifyNewMovie;
// Notify ALL connected clients about new showtime
const notifyNewShowtime = (showtime) => {
    exports.io.emit('new-showtime', { showtime });
    console.log('Broadcast: New showtime added', showtime._id);
};
exports.notifyNewShowtime = notifyNewShowtime;
app.use((0, cors_1.default)({ origin: 'http://localhost:5173' }));
app.use(express_1.default.json());
// Cleanup pending bookings every 5 minutes (expire if showtime < 12h away)
node_cron_1.default.schedule('*/5 * * * *', async () => {
    try {
        const now = new Date();
        const in12h = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        const pendingBookings = await Booking_1.default.find({ status: 'pending' })
            .populate('showtime', 'startTime');
        const toDelete = pendingBookings.filter(b => b.showtime && new Date(b.showtime.startTime) < in12h);
        if (toDelete.length > 0) {
            await Booking_1.default.deleteMany({ _id: { $in: toDelete.map(b => b._id) } });
            console.log(`Deleted ${toDelete.length} expired pending bookings`);
        }
    }
    catch (err) {
        console.error('Cron error:', err);
    }
});
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cinema backend alive' });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/public', public_1.default);
app.use('/api/admin', auth_2.protect, auth_2.adminOnly, admin_1.default);
app.use('/api/chat', chat_1.default);
const PORT = process.env.PORT || 4000;
mongoose_1.default
    .connect(process.env.MONGO_URI)
    .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
