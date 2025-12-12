const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const botRoutes = require('./routes/bots');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize directories
const initDirectories = () => {
  const dirs = ['sessions', 'data'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync('data/users.json')) {
    const adminUser = {
      id: 'admin-001',
      email: 'ashen.editz@gmail.com',
      password: 'ashen@123',
      role: 'admin',
      freeBotUsed: false,
      totalBots: 0,
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync('data/users.json', JSON.stringify([adminUser], null, 2));
  }

  if (!fs.existsSync('data/bots.json')) {
    fs.writeFileSync('data/bots.json', JSON.stringify([], null, 2));
  }

  if (!fs.existsSync('data/broadcasts.json')) {
    fs.writeFileSync('data/broadcasts.json', JSON.stringify([], null, 2));
  }

  if (!fs.existsSync('data/settings.json')) {
    fs.writeFileSync('data/settings.json', JSON.stringify([], null, 2));
  }
};

initDirectories();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Queen Selina is running! 👑',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ping for UptimeRobot
app.get('/ping', (req, res) => {
  res.send('pong');
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'Queen Selina Bot API',
    version: '4.0.0',
    developer: 'AshenEditZ',
    contact: '0768738555',
    status: 'online'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║     👑 QUEEN SELINA BOT 💞            ║
║                                       ║
║     Version: 4.0.0                    ║
║     Port: ${PORT}                        ║
║     Status: ONLINE ✅                 ║
║                                       ║
║     Developer: AshenEditZ             ║
║     Contact: 0726962984              ║
║                                       ║
╚═══════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
