"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const movieSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String },
    posterUrl: { type: String },
    trailerUrl: { type: String }, // e.g. "https://www.youtube.com/watch?v=abc123"
    duration: { type: Number },
    genres: [{ type: String }], // array of strings
    createdAt: { type: Date, default: Date.now },
});
exports.default = (0, mongoose_1.model)('Movie', movieSchema);
