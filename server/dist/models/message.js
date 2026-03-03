"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/models/Message.ts
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    movie: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Showtime.movie', // or 'Movie' if separate
        required: true,
        index: true,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
        maxlength: 1000,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});
exports.default = (0, mongoose_1.model)('Message', messageSchema);
