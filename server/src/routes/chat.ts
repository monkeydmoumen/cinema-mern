// server/src/routes/chat.ts — NEW FILE: all chat endpoints
import { Router } from 'express';
import Message from '../models/message';
import { protect, AuthRequest } from '../middleware/auth';
import { io } from '../index'; // ← import io from main file

const router = Router();

// GET: Load last 50 messages for a movie (public - no auth needed)
router.get('/:movieId', async (req, res) => {
  try {
    const messages = await Message.find({ movie: req.params.movieId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages.reverse()); // oldest first for chat UI
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// POST: Send new message (must be logged in)
router.post('/:movieId', protect, async (req: AuthRequest, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    const message = new Message({
      movie: req.params.movieId,
      user: req.user!.id,
      username: req.user!.name || 'Anonymous', // ← now safe because name is in token
      text: text.trim(),
    });

    await message.save();

    // Broadcast only to people in this movie's chat room
    io.to(`movie:${req.params.movieId}`).emit('new-chat-message', {
      _id: message._id,
      username: message.username,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    });

    res.status(201).json(message);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;