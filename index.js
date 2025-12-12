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

// Session management (simple in-memory store)
const adminSessions = new Map();

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

initDirectories();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);

// Admin login endpoint for setup page
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'ashen.editz@gmail.com' && password === 'ashen@123') {
    const sessionId = require('crypto').randomBytes(32).toString('hex');
    adminSessions.set(sessionId, {
      email: email,
      loginTime: new Date().toISOString()
    });
    
    res.json({
      success: true,
      sessionId: sessionId,
      message: 'Admin login successful'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid admin credentials'
    });
  }
});

// Check admin session
app.post('/admin/check-session', (req, res) => {
  const { sessionId } = req.body;
  
  if (adminSessions.has(sessionId)) {
    res.json({ success: true, isAdmin: true });
  } else {
    res.json({ success: false, isAdmin: false });
  }
});

// Admin logout
app.post('/admin/logout', (req, res) => {
  const { sessionId } = req.body;
  adminSessions.delete(sessionId);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Root endpoint - Public Landing Page (NO ADMIN INFO)
app.get('/', (req, res) => {
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👑 Queen Selina Bot 💞</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg">
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
            max-width: 600px;
            width: 100%;
        }
        .logo {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            border: 5px solid white;
            margin-bottom: 30px;
            animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
        }
        h1 {
            font-size: 3em;
            margin-bottom: 20px;
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
        }
        .info-card {
            background: rgba(255, 255, 255, 0.15);
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
        }
        .info-card h3 {
            color: #38ef7d;
            margin-bottom: 15px;
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
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
        <h1>👑 Queen Selina Bot 💞</h1>
        <p style="font-size: 1.2em; margin-bottom: 20px;">Advanced WhatsApp Bot Platform</p>
        <div class="status-badge">✅ ONLINE</div>
        
        <div class="info-card">
            <h3>✨ Free WhatsApp Bot Service</h3>
            <p>Create and manage your own WhatsApp bots</p>
            <p>24/7 uptime • 50+ commands • 100% Free</p>
        </div>

        <div style="margin-top: 30px;">
            <a href="/health" class="btn">🏥 Health Check</a>
            <a href="/admin-access" class="btn">🔐 Admin Access</a>
        </div>

        <div class="developer-info">
            <p style="font-size: 1.1em;"><strong>Developer:</strong> AshenEditZ</p>
            <p><strong>Contact:</strong> +94 76 873 8555</p>
            <p style="margin-top: 10px; opacity: 0.7;">💞 Made with ❤️ in Sri Lanka 🇱🇰</p>
        </div>
    </div>
</body>
</html>
  `);
});

// Admin Access Page
app.get('/admin-access', (req, res) => {
  const serverUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : `http://localhost:${process.env.PORT || 3000}`;

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Admin Access - Queen Selina</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg">
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
            padding: 20px;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .logo {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #667eea;
            display: block;
            margin: 0 auto 20px;
        }
        h1 {
            color: #667eea;
            text-align: center;
            margin-bottom: 30px;
        }
        .input-group {
            margin-bottom: 20px;
        }
        .input-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
        }
        .input-group input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1em;
        }
        .input-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #764ba2;
        }
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            color: #667eea;
            text-decoration: none;
        }
        .admin-panel {
            display: none;
        }
        .admin-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
        }
        .cred-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
        }
        .cred-value {
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }
        .copy-btn {
            background: #38ef7d;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
        
        <div id="loginForm">
            <h1>🔐 Admin Login</h1>
            <div id="alertBox" class="alert alert-error"></div>
            
            <div class="input-group">
                <label>📧 Email</label>
                <input type="email" id="email" placeholder="Enter admin email">
            </div>
            
            <div class="input-group">
                <label>🔒 Password</label>
                <input type="password" id="password" placeholder="Enter admin password">
            </div>
            
            <button class="btn" onclick="adminLogin()">Login</button>
            <a href="/" class="back-link">← Back to Home</a>
        </div>

        <div id="adminPanel" class="admin-panel">
            <h1>👑 Admin Dashboard</h1>
            
            <div class="admin-box">
                <h3>🔐 Admin Credentials</h3>
                <div class="cred-item">
                    <span>Email:</span>
                    <span class="cred-value">ashen.editz@gmail.com</span>
                </div>
                <div class="cred-item">
                    <span>Password:</span>
                    <span class="cred-value">ashen@123</span>
                </div>
            </div>

            <div class="admin-box">
                <h3>🌐 Server Information</h3>
                <div class="cred-item">
                    <span>Server URL:</span>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 10px; word-break: break-all;">
                    <code style="color: white;">${serverUrl}</code>
                    <button class="copy-btn" onclick="copyUrl('${serverUrl}')">📋 Copy</button>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <a href="/health" class="btn" style="text-decoration: none; display: inline-block;">🏥 Health Check</a>
                <button class="btn" onclick="logout()" style="background: #ff4444; margin-top: 10px;">🚪 Logout</button>
            </div>
        </div>
    </div>

    <script>
        let sessionId = localStorage.getItem('adminSessionId');

        async function checkSession() {
            if (sessionId) {
                try {
                    const response = await fetch('/admin/check-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId })
                    });
                    const data = await response.json();
                    if (data.success && data.isAdmin) {
                        showAdminPanel();
                    }
                } catch (error) {
                    console.error('Session check failed:', error);
                }
            }
        }

        async function adminLogin() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const alertBox = document.getElementById('alertBox');

            if (!email || !password) {
                alertBox.textContent = '⚠️ Please enter email and password';
                alertBox.style.display = 'block';
                return;
            }

            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    sessionId = data.sessionId;
                    localStorage.setItem('adminSessionId', sessionId);
                    showAdminPanel();
                } else {
                    alertBox.textContent = '❌ Invalid admin credentials';
                    alertBox.style.display = 'block';
                }
            } catch (error) {
                alertBox.textContent = '❌ Login failed: ' + error.message;
                alertBox.style.display = 'block';
            }
        }

        function showAdminPanel() {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
        }

        async function logout() {
            try {
                await fetch('/admin/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
            localStorage.removeItem('adminSessionId');
            location.reload();
        }

        function copyUrl(url) {
            navigator.clipboard.writeText(url).then(() => {
                event.target.textContent = '✅ Copied!';
                setTimeout(() => {
                    event.target.textContent = '📋 Copy';
                }, 2000);
            });
        }

        window.onload = checkSession;

        document.getElementById('password').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') adminLogin();
        });
    </script>
</body>
</html>
  `);
});

// Protected Setup Page (Admin Only)
app.get('/setup/:botId', async (req, res) => {
  const { botId } = req.params;
  
  const Database = require('./utils/database');
  const botsDB = new Database('bots.json');
  const bot = botsDB.findOne({ id: botId });
  
  if (!bot) {
    return res.send(`
      <html>
      <head>
        <title>Bot Not Found</title>
        <style>
          body {
            font-family: Arial;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>❌ Bot Not Found</h1>
          <p>Invalid bot ID: ${botId}</p>
        </div>
      </body>
      </html>
    `);
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Admin Setup - Queen Selina</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg">
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
            padding: 20px;
        }
        .auth-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .auth-box {
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 400px;
            width: 100%;
        }
        .container {
            display: none;
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 600px;
            margin: 0 auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .logo {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #667eea;
            display: block;
            margin: 0 auto 20px;
        }
        h1, h2 {
            color: #667eea;
            text-align: center;
            margin-bottom: 20px;
        }
        .input-group {
            margin-bottom: 20px;
        }
        .input-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
        }
        .input-group input {
            width: 100%;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1em;
        }
        .btn {
            width: 100%;
            padding: 15px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn:hover {
            background: #764ba2;
        }
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .alert-error {
            background: #f8d7da;
            color: #721c24;
        }
        .alert-success {
            background: #d4edda;
            color: #155724;
        }
        .alert-info {
            background: #d1ecf1;
            color: #0c5460;
        }
        .tabs {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .tab-btn {
            flex: 1;
            padding: 15px;
            background: #f0f0f0;
            border: 2px solid #ddd;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
        }
        .tab-btn.active {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }
        .tab-content {
            display: none;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .tab-content.active {
            display: block;
        }
        .qr-code {
            background: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            margin: 20px 0;
        }
        .qr-code img {
            max-width: 300px;
            width: 100%;
        }
        .code {
            font-size: 3em;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 10px;
            margin: 20px 0;
        }
        .loading {
            text-align: center;
            padding: 40px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .instructions {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .instructions ol {
            margin-left: 20px;
        }
        .instructions li {
            margin: 10px 0;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div id="authOverlay" class="auth-overlay">
        <div class="auth-box">
            <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
            <h2>🔐 Admin Login Required</h2>
            <p style="text-align: center; color: #666; margin-bottom: 20px;">
                This page is restricted to admins only
            </p>
            <div id="authAlert" class="alert alert-error" style="display: none;"></div>
            
            <div class="input-group">
                <label>📧 Email</label>
                <input type="email" id="adminEmail" placeholder="Enter admin email">
            </div>
            
            <div class="input-group">
                <label>🔒 Password</label>
                <input type="password" id="adminPassword" placeholder="Enter admin password">
            </div>
            
            <button class="btn" onclick="verifyAdmin()">🔓 Unlock Setup Page</button>
        </div>
    </div>

    <div class="container" id="setupContainer">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
        <h1>👑 Setup Your Bot</h1>
        <p style="text-align: center; margin-bottom: 20px;">Bot ID: <code>${botId}</code></p>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('qr')">📱 QR Code</button>
            <button class="tab-btn" onclick="switchTab('pairing')">🔗 Pairing Code</button>
        </div>

        <div id="qr-tab" class="tab-content active">
            <div id="qr-container" class="loading">
                <div class="spinner"></div>
                <p>Generating QR Code...</p>
            </div>
            
            <div class="instructions">
                <h4>📱 How to Scan QR Code:</h4>
                <ol>
                    <li>Open <strong>WhatsApp</strong> on your phone</li>
                    <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong></li>
                    <li>Tap <strong>Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li><strong>Scan the QR code</strong> above</li>
                </ol>
            </div>
        </div>

        <div id="pairing-tab" class="tab-content">
            <div class="alert alert-info">
                💡 Use pairing code if you can't scan QR code
            </div>
            
            <div class="input-group">
                <label>📱 WhatsApp Number</label>
                <input type="text" id="phoneNumber" placeholder="94768738555" 
                       value="${bot.phoneNumber || ''}" 
                       pattern="[0-9]+">
                <small style="color: #666; display: block; margin-top: 5px;">
                    Enter with country code (e.g., 94768738555)
                </small>
            </div>
            
            <button class="btn" onclick="generatePairingCode()">🔗 Generate Pairing Code</button>
            
            <div id="pairing-result"></div>
            
            <div class="instructions">
                <h4>🔗 How to Use Pairing Code:</h4>
                <ol>
                    <li>Enter your WhatsApp number above</li>
                    <li>Click "Generate Pairing Code"</li>
                    <li>Open <strong>WhatsApp</strong> on your phone</li>
                    <li>Go to <strong>Settings → Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li>Tap <strong>"Link with phone number instead"</strong></li>
                    <li><strong>Enter the code</strong> shown below</li>
                </ol>
            </div>
        </div>
    </div>

    <script>
        const botId = '${botId}';
        let adminSessionId = localStorage.getItem('adminSessionId');

        async function verifyAdmin() {
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            const alertBox = document.getElementById('authAlert');

            if (!email || !password) {
                alertBox.textContent = '⚠️ Please enter email and password';
                alertBox.style.display = 'block';
                return;
            }

            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    adminSessionId = data.sessionId;
                    localStorage.setItem('adminSessionId', adminSessionId);
                    document.getElementById('authOverlay').style.display = 'none';
                    document.getElementById('setupContainer').style.display = 'block';
                    checkQRCode();
                } else {
                    alertBox.textContent = '❌ Invalid admin credentials';
                    alertBox.style.display = 'block';
                }
            } catch (error) {
                alertBox.textContent = '❌ Login failed: ' + error.message;
                alertBox.style.display = 'block';
            }
        }

        async function checkSession() {
            if (adminSessionId) {
                try {
                    const response = await fetch('/admin/check-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionId: adminSessionId })
                    });
                    const data = await response.json();
                    if (data.success && data.isAdmin) {
                        document.getElementById('authOverlay').style.display = 'none';
                        document.getElementById('setupContainer').style.display = 'block';
                        checkQRCode();
                    }
                } catch (error) {
                    console.error('Session check failed:', error);
                }
            }
        }

        function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            if (tab === 'qr') {
                document.querySelector('.tab-btn:first-child').classList.add('active');
                document.getElementById('qr-tab').classList.add('active');
            } else {
                document.querySelector('.tab-btn:last-child').classList.add('active');
                document.getElementById('pairing-tab').classList.add('active');
            }
        }

        async function checkQRCode() {
            try {
                const response = await fetch('/api/bots/qr/' + botId);
                const data = await response.json();

                if (data.success && data.qrCode) {
                    document.getElementById('qr-container').innerHTML = \`
                        <div class="qr-code">
                            <img src="\${data.qrCode}" alt="QR Code">
                        </div>
                        <p style="color: #38ef7d; font-weight: bold;">✅ QR Code Ready!</p>
                    \`;
                } else {
                    setTimeout(checkQRCode, 3000);
                }
            } catch (error) {
                setTimeout(checkQRCode, 5000);
            }
        }

        async function generatePairingCode() {
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            
            if (!phoneNumber || !/^[0-9]{10,15}$/.test(phoneNumber)) {
                alert('❌ Invalid phone number!');
                return;
            }

            const btn = event.target;
            btn.disabled = true;
            btn.textContent = '🔄 Generating...';

            document.getElementById('pairing-result').innerHTML = \`
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Generating pairing code...</p>
                </div>
            \`;

            try {
                const response = await fetch('/api/bots/pairing-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ botId, phoneNumber })
                });

                const data = await response.json();

                if (data.success && data.pairingCode) {
                    document.getElementById('pairing-result').innerHTML = \`
                        <div class="alert alert-success">✅ Pairing code generated!</div>
                        <div class="qr-code">
                            <p style="color: #666;">Your Pairing Code:</p>
                            <div class="code">\${data.pairingCode}</div>
                            <p style="color: #666;">Enter this in WhatsApp</p>
                        </div>
                    \`;
                } else {
                    document.getElementById('pairing-result').innerHTML = \`
                        <div class="alert alert-error">⚠️ \${data.error || 'Failed to generate code'}</div>
                    \`;
                }
            } catch (error) {
                document.getElementById('pairing-result').innerHTML = \`
                    <div class="alert alert-error">❌ Error: \${error.message}</div>
                \`;
            } finally {
                btn.disabled = false;
                btn.textContent = '🔗 Generate Pairing Code';
            }
        }

        window.onload = checkSession;

        document.getElementById('adminPassword').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') verifyAdmin();
        });
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
    version: '4.0.0'
  });
});

// Ping
app.get('/ping', (req, res) => {
  res.send('pong');
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: 'Queen Selina Bot API',
    version: '4.0.0',
    developer: 'AshenEditZ',
    endpoints: {
      auth: 'POST /api/auth/*',
      bots: 'POST /api/bots/*',
      admin: 'POST /api/admin/*'
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
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
╚═══════════════════════════════════════╝

🌐 Server: ${serverUrl}
🔐 Admin: ashen.editz@gmail.com / ashen@123
✅ Backend Ready!
  `);
});

const shutdown = () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
