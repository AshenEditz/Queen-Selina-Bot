const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import routes
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

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Initialize directories
const initDirectories = () => {
  const dirs = ['sessions', 'data', 'routes', 'utils'];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });

  // Initialize database files
  const dbFiles = {
    'data/users.json': [{
      id: 'admin-001',
      email: 'ashen.editz@gmail.com',
      password: 'ashen@123',
      role: 'admin',
      freeBotUsed: false,
      totalBots: 0,
      createdAt: new Date().toISOString()
    }],
    'data/bots.json': [],
    'data/broadcasts.json': [],
    'data/settings.json': []
  };

  Object.keys(dbFiles).forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(dbFiles[file], null, 2));
      console.log(`✅ Created file: ${file}`);
    }
  });
};

// Initialize
initDirectories();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Root endpoint - Beautiful Landing Page
app.get('/', (req, res) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);

  const serverUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : `http://localhost:${process.env.PORT || 3000}`;

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👑 Queen Selina Bot 💞 - Backend Server</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg" type="image/jpeg">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            padding: 20px;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 700px;
            width: 100%;
        }
        .logo {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 5px solid white;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
        }
        h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .tagline {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 30px;
        }
        .status-badge {
            background: #38ef7d;
            color: white;
            padding: 15px 35px;
            border-radius: 50px;
            font-size: 1.3em;
            font-weight: bold;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 5px 20px rgba(56, 239, 125, 0.5);
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        .info-card {
            background: rgba(255, 255, 255, 0.15);
            padding: 20px;
            border-radius: 10px;
        }
        .info-card strong {
            display: block;
            color: #38ef7d;
            font-size: 1.8em;
            margin-bottom: 5px;
        }
        .info-card span {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .endpoints {
            text-align: left;
            background: rgba(0, 0, 0, 0.3);
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
        }
        .endpoints h3 {
            color: #38ef7d;
            margin-bottom: 20px;
            text-align: center;
            font-size: 1.5em;
        }
        .endpoint {
            background: rgba(255, 255, 255, 0.1);
            padding: 12px 15px;
            border-radius: 8px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s;
        }
        .endpoint:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateX(5px);
        }
        .method {
            background: #667eea;
            padding: 3px 10px;
            border-radius: 5px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .method.get { background: #38ef7d; }
        .method.post { background: #667eea; }
        .method.put { background: #ffd700; color: #333; }
        .method.delete { background: #ff4444; }
        .url-section {
            background: rgba(0, 0, 0, 0.4);
            padding: 20px;
            border-radius: 15px;
            margin: 25px 0;
        }
        .url-section h3 {
            color: #38ef7d;
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        .url-display {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            word-break: break-all;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        .url-text {
            flex: 1;
            color: white;
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
        }
        .copy-btn {
            background: #38ef7d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            font-size: 0.9em;
        }
        .copy-btn:hover {
            background: #11998e;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(56, 239, 125, 0.3);
        }
        .btn {
            display: inline-block;
            padding: 15px 35px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s;
            box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(255, 255, 255, 0.3);
        }
        .developer-info {
            margin-top: 30px;
            padding-top: 25px;
            border-top: 2px solid rgba(255, 255, 255, 0.2);
        }
        .developer-info p {
            margin: 10px 0;
            font-size: 1.1em;
        }
        .developer-info strong {
            color: #38ef7d;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .stat-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #38ef7d;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
            margin-top: 5px;
        }
        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
            }
            h1 {
                font-size: 2em;
            }
            .logo {
                width: 100px;
                height: 100px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .stats {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
        <h1>👑 Queen Selina Bot 💞</h1>
        <p class="tagline">Advanced WhatsApp Bot Backend Server</p>
        <div class="status-badge">✅ ONLINE & RUNNING</div>
        
        <div class="stats">
            <div class="stat-item">
                <div class="stat-value">v4.0.0</div>
                <div class="stat-label">Version</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${hours}h ${minutes}m ${seconds}s</div>
                <div class="stat-label">Uptime</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-card">
                <strong>${process.env.PORT || 3000}</strong>
                <span>Port</span>
            </div>
            <div class="info-card">
                <strong>Active</strong>
                <span>Status</span>
            </div>
            <div class="info-card">
                <strong>Node.js</strong>
                <span>Runtime</span>
            </div>
        </div>

        <div class="url-section">
            <h3>🔗 Your Server URL</h3>
            <div class="url-display">
                <div class="url-text" id="serverUrl">${serverUrl}</div>
                <button class="copy-btn" onclick="copyUrl()">📋 Copy</button>
            </div>
            <p style="margin-top: 15px; font-size: 0.9em; opacity: 0.8;">
                Use this URL to connect your frontend!
            </p>
        </div>

        <div class="endpoints">
            <h3>📡 Available API Endpoints</h3>
            
            <div class="endpoint">
                <span><span class="method get">GET</span> /</span>
                <span style="font-size: 0.8em; opacity: 0.7;">This page</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method get">GET</span> /health</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Health check</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method get">GET</span> /api</span>
                <span style="font-size: 0.8em; opacity: 0.7;">API docs</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method get">GET</span> /ping</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Ping test</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method post">POST</span> /api/auth/register</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Register user</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method post">POST</span> /api/auth/login</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Login user</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method post">POST</span> /api/bots/create</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Create bot</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method get">GET</span> /api/bots/user/:userId</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Get user bots</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method get">GET</span> /api/bots/qr/:botId</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Get QR code</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method post">POST</span> /api/bots/pairing-code</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Get pairing code</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method get">GET</span> /api/settings/:botId</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Get bot settings</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method put">PUT</span> /api/settings/:botId</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Update settings</span>
            </div>
            
            <div class="endpoint">
                <span><span class="method post">POST</span> /api/admin/broadcast</span>
                <span style="font-size: 0.8em; opacity: 0.7;">Send broadcast</span>
            </div>
        </div>

        <div style="margin-top: 30px;">
            <a href="/api" class="btn">📖 API Docs</a>
            <a href="/health" class="btn">🏥 Health Check</a>
        </div>

        <div class="developer-info">
            <h3 style="color: #38ef7d; margin-bottom: 15px;">👨‍💻 Developer Information</h3>
            <p><strong>Developer:</strong> AshenEditZ</p>
            <p><strong>Contact:</strong> +94 76 873 8555</p>
            <p><strong>Email:</strong> ashen.editz@gmail.com</p>
            <p style="margin-top: 20px; opacity: 0.7; font-size: 0.9em;">
                💞 Made with ❤️ in Sri Lanka 🇱🇰
            </p>
        </div>
    </div>

    <script>
        function copyUrl() {
            const url = document.getElementById('serverUrl').textContent;
            navigator.clipboard.writeText(url).then(() => {
                const btn = event.target;
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Copied!';
                btn.style.background = '#11998e';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '#38ef7d';
                }, 2000);
            }).catch(err => {
                alert('Failed to copy. Please copy manually: ' + url);
            });
        }

        // Auto refresh uptime every minute
        let refreshInterval = setInterval(() => {
            location.reload();
        }, 60000);

        // Show connection status
        window.addEventListener('online', () => {
            console.log('✅ Connection restored');
        });

        window.addEventListener('offline', () => {
            console.log('⚠️ Connection lost');
            clearInterval(refreshInterval);
        });

        // Log server URL to console
        console.log('%c👑 Queen Selina Bot Server 💞', 'color: #667eea; font-size: 20px; font-weight: bold;');
        console.log('%cServer URL: ${serverUrl}', 'color: #38ef7d; font-size: 14px;');
        console.log('%cDeveloper: AshenEditZ | +94 76 873 8555', 'color: #666; font-size: 12px;');
    </script>
</body>
</html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Queen Selina is running! 👑',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '4.0.0',
    developer: 'AshenEditZ'
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
    contact: '+94 76 873 8555',
    email: 'ashen.editz@gmail.com',
    description: 'Advanced WhatsApp Bot Backend API',
    documentation: 'https://github.com/ashenedit/queen-selina',
    endpoints: {
      authentication: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          body: { email: 'string', password: 'string' },
          description: 'Register a new user account'
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          body: { email: 'string', password: 'string' },
          description: 'Login to existing account'
        },
        getUser: {
          method: 'GET',
          path: '/api/auth/me/:userId',
          description: 'Get user information'
        }
      },
      bots: {
        create: {
          method: 'POST',
          path: '/api/bots/create',
          body: { userId: 'string', phoneNumber: 'string' },
          description: 'Create a new WhatsApp bot'
        },
        getUserBots: {
          method: 'GET',
          path: '/api/bots/user/:userId',
          description: 'Get all bots for a user'
        },
        getQR: {
          method: 'GET',
          path: '/api/bots/qr/:botId',
          description: 'Get QR code for bot connection'
        },
        getPairingCode: {
          method: 'POST',
          path: '/api/bots/pairing-code',
          body: { botId: 'string', phoneNumber: 'string' },
          description: 'Generate pairing code for bot'
        },
        delete: {
          method: 'DELETE',
          path: '/api/bots/:botId',
          description: 'Delete a bot'
        },
        status: {
          method: 'GET',
          path: '/api/bots/status/:botId',
          description: 'Get bot status'
        }
      },
      settings: {
        get: {
          method: 'GET',
          path: '/api/settings/:botId',
          description: 'Get bot settings'
        },
        update: {
          method: 'PUT',
          path: '/api/settings/:botId',
          body: { autoReact: 'boolean', reactToCommands: 'boolean', etc: '...' },
          description: 'Update bot settings'
        }
      },
      admin: {
        users: {
          method: 'POST',
          path: '/api/admin/users',
          body: { email: 'ashen.editz@gmail.com', password: 'ashen@123' },
          description: 'Get all users (admin only)'
        },
        bots: {
          method: 'POST',
          path: '/api/admin/bots',
          body: { email: 'ashen.editz@gmail.com', password: 'ashen@123' },
          description: 'Get all bots (admin only)'
        },
        broadcast: {
          method: 'POST',
          path: '/api/admin/broadcast',
          body: { email: 'ashen.editz@gmail.com', password: 'ashen@123', message: 'string' },
          description: 'Send broadcast to all active bots (admin only)'
        },
        stats: {
          method: 'POST',
          path: '/api/admin/stats',
          body: { email: 'ashen.editz@gmail.com', password: 'ashen@123' },
          description: 'Get system statistics (admin only)'
        }
      }
    },
    botCommands: [
      '.menu - Show all commands',
      '.ai <message> - Chat with AI',
      '.google <query> - Google search',
      '.tiktok <url> - Download TikTok video',
      '.instagram <url> - Download Instagram media',
      '.facebook <url> - Download Facebook video',
      '.spotify <url> - Download Spotify track',
      '.c2i <text> - Text to image',
      '.sticker - Convert image to sticker',
      '.weather <city> - Get weather info',
      '.joke - Random joke',
      '.quote - Inspirational quote',
      '.translate <text> - Translate text',
      '.yts <query> - Search movies',
      '.movie <url> - Get movie details',
      '.download <url> - Get download links',
      '.alive - Check bot status',
      '.owner - Developer info',
      '.settings - Bot settings'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'Please check API documentation at /api',
    requestedUrl: req.url,
    method: req.method
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  const serverUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : `http://localhost:${PORT}`;

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
║     Contact: +94 76 873 8555         ║
║     Email: ashen.editz@gmail.com     ║
║                                       ║
╚═══════════════════════════════════════╝

🌐 Server running on: http://0.0.0.0:${PORT}
🔗 Public URL: ${serverUrl}

✅ Backend is ready!
📱 Users can now create WhatsApp bots!

📋 Quick Links:
   • Landing Page: ${serverUrl}/
   • Health Check: ${serverUrl}/health
   • API Docs: ${serverUrl}/api
   • Ping Test: ${serverUrl}/ping

💡 Next Steps:
   1. Copy your server URL: ${serverUrl}
   2. Open in browser to see landing page
   3. Use this URL in your Vercel frontend
   4. Setup UptimeRobot with: ${serverUrl}/ping

🎯 Ready to connect with frontend!
  `);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

// Keep alive ping (log every 5 minutes)
setInterval(() => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  console.log(`⏰ Server alive | Uptime: ${hours}h ${minutes}m`);
}, 300000);

// Log memory usage every hour
setInterval(() => {
  const used = process.memoryUsage();
  console.log('💾 Memory Usage:');
  for (let key in used) {
    console.log(`   ${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
}, 3600000);

module.exports = app;
