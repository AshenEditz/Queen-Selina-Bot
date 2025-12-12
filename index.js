const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// Session management
const adminSessions = new Map();

// Admin credentials
const ADMIN_EMAIL = 'ashen.editz@gmail.com';
const ADMIN_PASSWORD = 'ashen@123';

// Clean expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of adminSessions.entries()) {
    if (now - session.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
      adminSessions.delete(sessionId);
    }
  }
}, 60 * 60 * 1000);

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

// Admin authentication endpoints
app.post('/api/admin-auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    adminSessions.set(sessionId, {
      email: email,
      timestamp: Date.now()
    });
    
    res.json({
      success: true,
      sessionId: sessionId,
      message: 'Admin authenticated'
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

app.post('/api/admin-auth/verify', (req, res) => {
  const { sessionId } = req.body;
  
  if (sessionId && adminSessions.has(sessionId)) {
    res.json({ success: true, authenticated: true });
  } else {
    res.json({ success: false, authenticated: false });
  }
});

app.post('/api/admin-auth/logout', (req, res) => {
  const { sessionId } = req.body;
  adminSessions.delete(sessionId);
  res.json({ success: true });
});

// Public landing page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👑 Queen Selina Bot 💞</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        h1 { font-size: 3em; margin-bottom: 20px; }
        .status { background: #38ef7d; padding: 15px 35px; border-radius: 50px; 
                  font-size: 1.3em; font-weight: bold; display: inline-block; margin: 20px 0; }
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
        .btn:hover { transform: translateY(-3px); }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
        <h1>👑 Queen Selina Bot 💞</h1>
        <p style="font-size: 1.2em; margin-bottom: 20px;">Advanced WhatsApp Bot Platform</p>
        <div class="status">✅ ONLINE</div>
        <div style="margin-top: 30px;">
            <a href="/admin-login" class="btn">🔐 Admin Login</a>
            <a href="/health" class="btn">🏥 Health Check</a>
        </div>
        <div style="margin-top: 30px; padding-top: 25px; border-top: 2px solid rgba(255,255,255,0.2);">
            <p><strong>Developer:</strong> AshenEditZ</p>
            <p><strong>Contact:</strong> +94 76 873 8555</p>
        </div>
    </div>
</body>
</html>
  `);
});

// Admin login page
app.get('/admin-login', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Admin Login</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
        h1 { color: #667eea; text-align: center; margin-bottom: 30px; }
        .input-group { margin-bottom: 20px; }
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
        }
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .alert-error { background: #f8d7da; color: #721c24; }
        .admin-panel { display: none; }
        .info-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
        }
        .cred-item {
            background: rgba(255,255,255,0.2);
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
        }
        .copy-btn {
            background: #38ef7d;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" class="logo">
        
        <div id="loginForm">
            <h1>🔐 Admin Login</h1>
            <div id="alert" class="alert alert-error"></div>
            
            <div class="input-group">
                <label>📧 Email</label>
                <input type="email" id="email" value="ashen.editz@gmail.com">
            </div>
            
            <div class="input-group">
                <label>🔒 Password</label>
                <input type="password" id="password">
            </div>
            
            <button class="btn" onclick="login()">Login</button>
        </div>

        <div id="adminPanel" class="admin-panel">
            <h1>👑 Admin Dashboard</h1>
            
            <div class="info-box">
                <h3>🔐 Admin Credentials</h3>
                <div class="cred-item">
                    <span>Email:</span>
                    <span>ashen.editz@gmail.com</span>
                </div>
                <div class="cred-item">
                    <span>Password:</span>
                    <span>ashen@123</span>
                </div>
            </div>

            <div class="info-box">
                <h3>🌐 Server URL</h3>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 10px; word-break: break-all;">
                    <code id="serverUrl" style="color: white;"></code>
                    <button class="copy-btn" onclick="copyUrl()">📋 Copy</button>
                </div>
            </div>

            <button class="btn" onclick="logout()" style="background: #ff4444; margin-top: 20px;">Logout</button>
        </div>
    </div>

    <script>
        const serverUrl = window.location.origin;
        document.getElementById('serverUrl').textContent = serverUrl;

        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const alert = document.getElementById('alert');

            try {
                const res = await fetch('/api/admin-auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('adminSession', data.sessionId);
                    document.getElementById('loginForm').style.display = 'none';
                    document.getElementById('adminPanel').style.display = 'block';
                } else {
                    alert.textContent = '❌ Invalid credentials';
                    alert.style.display = 'block';
                }
            } catch (error) {
                alert.textContent = '❌ Login failed';
                alert.style.display = 'block';
            }
        }

        function logout() {
            localStorage.removeItem('adminSession');
            location.reload();
        }

        function copyUrl() {
            navigator.clipboard.writeText(serverUrl);
            event.target.textContent = '✅ Copied!';
            setTimeout(() => event.target.textContent = '📋 Copy', 2000);
        }

        async function checkSession() {
            const sessionId = localStorage.getItem('adminSession');
            if (sessionId) {
                const res = await fetch('/api/admin-auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                });
                const data = await res.json();
                if (data.authenticated) {
                    document.getElementById('loginForm').style.display = 'none';
                    document.getElementById('adminPanel').style.display = 'block';
                }
            }
        }

        window.onload = checkSession;
        document.getElementById('password').addEventListener('keypress', e => {
            if (e.key === 'Enter') login();
        });
    </script>
</body>
</html>
  `);
});

// Protected setup page
app.get('/setup/:botId', async (req, res) => {
  const { botId } = req.params;
  const sessionId = req.query.session;
  
  // Verify admin session
  if (!sessionId || !adminSessions.has(sessionId)) {
    return res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🔒 Access Denied</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg">
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            text-align: center;
            padding: 20px;
        }
        .box {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            padding: 50px;
            border-radius: 20px;
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        a {
            display: inline-block;
            padding: 15px 35px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="box">
        <h1>🔒 Access Denied</h1>
        <p>This page requires admin authentication.</p>
        <a href="/admin-login">🔐 Admin Login</a>
    </div>
</body>
</html>
    `);
  }
  
  const Database = require('./utils/database');
  const botsDB = new Database('bots.json');
  const bot = botsDB.findOne({ id: botId });
  
  if (!bot) {
    return res.send(`
<html>
<head><title>Bot Not Found</title></head>
<body style="font-family: Arial; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center;">
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
    <title>Setup Bot - Queen Selina</title>
    <link rel="icon" href="https://i.imgur.com/rm1qWjR.jpeg">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
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
        h1 { color: #667eea; text-align: center; margin-bottom: 20px; }
        .tabs {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        .tab-btn {
            flex: 1;
            padding: 15px;
            background: #f0f0f0;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        .tab-btn.active {
            background: #667eea;
            color: white;
        }
        .tab-content {
            display: none;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .tab-content.active { display: block; }
        .qr-box {
            background: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            margin: 20px 0;
        }
        .qr-box img {
            max-width: 300px;
            width: 100%;
            border: 5px solid #667eea;
            border-radius: 10px;
        }
        .input-group { margin: 20px 0; }
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
        }
        .btn:hover { background: #764ba2; }
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
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .alert-success { background: #d4edda; color: #155724; }
        .alert-error { background: #f8d7da; color: #721c24; }
        .alert-info { background: #d1ecf1; color: #0c5460; }
        .instructions {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        .instructions ol { margin-left: 20px; }
        .instructions li { margin: 10px 0; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" class="logo">
        <h1>👑 Setup Bot</h1>
        <p style="text-align: center; color: #666; margin-bottom: 20px;">
            Bot: ${bot.phoneNumber} | Status: ${bot.status}
        </p>

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
                <h4>📱 How to Scan:</h4>
                <ol>
                    <li>Open <strong>WhatsApp</strong> on your phone</li>
                    <li>Go to <strong>Settings → Linked Devices</strong></li>
                    <li>Tap <strong>Link a Device</strong></li>
                    <li><strong>Scan the QR code</strong> above</li>
                </ol>
            </div>
        </div>

        <div id="pairing-tab" class="tab-content">
            <div class="alert alert-info">
                💡 Use pairing code if you can't scan QR
            </div>
            
            <div class="input-group">
                <label>📱 WhatsApp Number</label>
                <input type="text" id="phoneNumber" placeholder="94768738555" value="${bot.phoneNumber}">
                <small style="color: #666; display: block; margin-top: 5px;">
                    Format: Country code + number (no spaces)
                </small>
            </div>
            
            <button class="btn" onclick="generatePairingCode()">🔗 Generate Pairing Code</button>
            
            <div id="pairing-result"></div>
            
            <div class="instructions">
                <h4>🔗 How to Use Pairing Code:</h4>
                <ol>
                    <li>Enter your WhatsApp number above</li>
                    <li>Click "Generate Pairing Code"</li>
                    <li>Open WhatsApp → Settings → Linked Devices</li>
                    <li>Tap "Link a Device"</li>
                    <li>Tap "Link with phone number instead"</li>
                    <li>Enter the code shown below</li>
                </ol>
            </div>
        </div>
    </div>

    <script>
        const botId = '${botId}';
        let qrCheckInterval;

        function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            if (tab === 'qr') {
                document.querySelector('.tab-btn:first-child').classList.add('active');
                document.getElementById('qr-tab').classList.add('active');
                startQRCheck();
            } else {
                document.querySelector('.tab-btn:last-child').classList.add('active');
                document.getElementById('pairing-tab').classList.add('active');
                stopQRCheck();
            }
        }

        function startQRCheck() {
            checkQRCode();
            qrCheckInterval = setInterval(checkQRCode, 3000);
        }

        function stopQRCheck() {
            if (qrCheckInterval) {
                clearInterval(qrCheckInterval);
                qrCheckInterval = null;
            }
        }

        async function checkQRCode() {
            try {
                const response = await fetch('/api/bots/qr/' + botId);
                const data = await response.json();

                if (data.success && data.qrCode) {
                    document.getElementById('qr-container').innerHTML = \`
                        <div class="qr-box">
                            <img src="\${data.qrCode}" alt="QR Code">
                        </div>
                        <p style="color: #38ef7d; font-weight: bold; text-align: center;">✅ QR Code Ready!</p>
                        <p style="color: #666; text-align: center;">Scan with WhatsApp to connect</p>
                    \`;
                    stopQRCheck();
                }
            } catch (error) {
                console.error('QR check error:', error);
            }
        }

        async function generatePairingCode() {
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            
            if (!phoneNumber) {
                alert('❌ Please enter your WhatsApp number');
                return;
            }

            if (!/^[0-9]{10,15}$/.test(phoneNumber)) {
                alert('❌ Invalid number! Use: Country code + number\\nExample: 94768738555');
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
                        <div class="alert alert-success">✅ Code generated!</div>
                        <div class="qr-box">
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

        window.onload = startQRCheck;
        window.onbeforeunload = stopQRCheck;
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

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Queen Selina Bot API',
    version: '4.0.0',
    developer: 'AshenEditZ'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

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
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
