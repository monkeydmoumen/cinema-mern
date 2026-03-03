"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-long-random-secret-change-this';
// ─── REGISTER ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        const user = new User_1.default({
            email,
            password,
            name,
            role: role || 'user', // only allow 'admin' manually for now
        });
        await user.save();
        res.status(201).json({ message: 'User created', userId: user._id });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// ─── LOGIN ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user._id,
            email: user.email,
            name: user.name || 'User',
            role: user.role,
        }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name || 'User', // also return it
                role: user.role,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.default = router;
