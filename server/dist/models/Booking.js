"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/models/Booking.ts
const mongoose_1 = require("mongoose");
const bookingSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    showtime: {
        type: mongoose_1.Schema.Types.ObjectId,
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
exports.default = (0, mongoose_1.model)('Booking', bookingSchema);
