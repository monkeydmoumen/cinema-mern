"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const showtimeSchema = new mongoose_1.Schema({
    movie: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Movie', required: true },
    room: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Room', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true }, // ← NEW
    price: { type: Number, required: true, default: 10 },
    createdAt: { type: Date, default: Date.now },
});
// Index for faster overlap queries
showtimeSchema.index({ room: 1, startTime: 1, endTime: 1 });
exports.default = (0, mongoose_1.model)('Showtime', showtimeSchema);
