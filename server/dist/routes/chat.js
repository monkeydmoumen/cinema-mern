"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/chat.ts — NEW FILE: all chat endpoints
const express_1 = require("express");
const message_1 = __importDefault(require("../models/message"));
const auth_1 = require("../middleware/auth");
const index_1 = require("../index"); // ← import io from main file
const router = (0, express_1.Router)();
// GET: Load last 50 messages for a movie (public - no auth needed)
router.get('/:movieId', async (req, res) => {
    try {
        const messages = await message_1.default.find({ movie: req.params.movieId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(messages.reverse()); // oldest first for chat UI
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load messages' });
    }
});
// POST: Send new message (must be logged in)
router.post('/:movieId', auth_1.protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        if (text.trim().length > 1000) {
            return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
        }
        const message = new message_1.default({
            movie: req.params.movieId,
            user: req.user.id,
            username: req.user.name || 'Anonymous', // ← now safe because name is in token
            text: text.trim(),
        });
        await message.save();
        // Broadcast only to people in this movie's chat room
        index_1.io.to(`movie:${req.params.movieId}`).emit('new-chat-message', {
            _id: message._id,
            username: message.username,
            text: message.text,
            createdAt: message.createdAt.toISOString(),
        });
        res.status(201).json(message);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
exports.default = router;
