const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
require('dotenv').config();

const db = require('./db');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');

const app = express();
const PORT = process.env.PORT || 3000;
const appRoot = __dirname;
const generatedDir = path.join(appRoot, 'generated');
const dataDir = path.join(appRoot, 'data');

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

// Initialize database
db.init();

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, sameSite: 'lax' }
  })
);

// Static files
app.use('/generated', express.static(generatedDir));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    message: 'Video AI app is running.',
    user: req.session.userId ? { id: req.session.userId } : null
  });
});

// 404 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✨ Video AI app listening on http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth endpoints: /api/auth/register, /api/auth/login, /api/auth/logout\n`);
});

module.exports = app;
