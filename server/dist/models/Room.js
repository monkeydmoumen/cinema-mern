"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/models/Room.ts — simplified, no hooks
const mongoose_1 = require("mongoose");
const roomSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    rows: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
    },
    columns: {
        type: Number,
        required: true,
        min: 1,
        max: 50,
    },
    totalSeats: {
        type: Number,
        required: true,
        min: 1,
    },
    sections: [{
            type: String,
            trim: true,
        }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
exports.default = (0, mongoose_1.model)('Room', roomSchema);
