const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8081;
const JWT_SECRET = process.env.JWT_SECRET || 'cloudshop-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory user store (replace with PostgreSQL in production)
const users = new Map();

// Seed a test user
const seedUser = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    users.set('admin@cloudshop.com', {
        id: uuidv4(),
        email: 'admin@cloudshop.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString()
    });
    console.log('✅ Test user seeded: admin@cloudshop.com / password123');
};
seedUser();

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Register new user
app.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        if (users.has(email)) {
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: uuidv4(),
            email,
            password: hashedPassword,
            name,
            role: 'user',
            createdAt: new Date().toISOString()
        };

        users.set(email, user);

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = users.get(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        res.json({
            message: 'Login successful',
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify token
app.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            valid: true,
            user: decoded
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token', valid: false });
    }
});

// Get current user
app.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.get(decoded.email);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// List all users (admin only)
app.get('/users', (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const userList = Array.from(users.values()).map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            createdAt: u.createdAt
        }));

        res.json(userList);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔐 Auth Service running on port ${PORT}`);
});

module.exports = app;
