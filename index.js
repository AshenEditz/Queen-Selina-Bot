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
        .admin-creds {
            background: rgba(255, 255, 255, 0.15);
            padding: 25px;
            border-radius: 15px;
            margin: 25px 0;
            border: 2px solid #38ef7d;
        }
        .admin-creds h3 {
            color: #38ef7d;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        .cred-item {
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .cred-label {
            font-weight: bold;
            color: #38ef7d;
        }
        .cred-value {
            font-family: 'Courier New', monospace;
            color: white;
            font-size: 1.1em;
        }
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
    </style>
</head>
<body>
    <div class="container">
        <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
        <h1>👑 Queen Selina Bot 💞</h1>
        <p class="tagline">Advanced WhatsApp Bot Backend Server</p>
        <div class="status-badge">✅ ONLINE & RUNNING</div>
        
        <div class="info-grid">
            <div class="info-card">
                <strong>v4.0.0</strong>
                <span>Version</span>
            </div>
            <div class="info-card">
                <strong>${hours}h ${minutes}m</strong>
                <span>Uptime</span>
            </div>
            <div class="info-card">
                <strong>${process.env.PORT || 3000}</strong>
                <span>Port</span>
            </div>
        </div>

        <div class="admin-creds">
            <h3>🔐 Admin Credentials</h3>
            <div class="cred-item">
                <span class="cred-label">Email:</span>
                <span class="cred-value">ashen.editz@gmail.com</span>
            </div>
            <div class="cred-item">
                <span class="cred-label">Password:</span>
                <span class="cred-value">ashen@123</span>
            </div>
            <p style="margin-top: 15px; font-size: 0.9em; opacity: 0.8;">
                Use these credentials to access admin panel
            </p>
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
            });
        }

        setInterval(() => location.reload(), 60000);
    </script>
</body>
</html>
  `);
});

// Web Setup Page
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
    <title>Setup WhatsApp Bot - Queen Selina💞</title>
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
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid #667eea;
            margin-bottom: 20px;
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .status {
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            display: inline-block;
            margin: 10px 0;
        }
        .status.pending { background: #ffd700; color: #333; }
        .status.active { background: #38ef7d; color: white; }
        .admin-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            border: 3px solid #38ef7d;
        }
        .admin-box h3 {
            margin-bottom: 15px;
            font-size: 1.3em;
        }
        .cred-item {
            background: rgba(255, 255, 255, 0.2);
            padding: 12px;
            border-radius: 8px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
        }
        .cred-label {
            font-weight: bold;
        }
        .cred-value {
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
        }
        .tabs {
            display: flex;
            gap: 10px;
            margin: 30px 0 20px 0;
        }
        .tab-btn {
            flex: 1;
            padding: 15px;
            background: #f0f0f0;
            border: 2px solid #ddd;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
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
        .qr-box {
            text-align: center;
            padding: 20px;
        }
        .qr-code {
            background: white;
            padding: 20px;
            border-radius: 15px;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .qr-code img {
            max-width: 300px;
            width: 100%;
            border-radius: 10px;
        }
        .instructions {
            text-align: left;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 10px;
        }
        .instructions ol {
            margin-left: 20px;
        }
        .instructions li {
            margin: 10px 0;
            line-height: 1.6;
        }
        .input-group {
            margin: 20px 0;
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
        .pairing-code-display {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin: 20px 0;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
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
        .alert {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        .alert-info { background: #d1ecf1; color: #0c5460; }
        .alert-success { background: #d4edda; color: #155724; }
        .alert-warning { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.imgur.com/rm1qWjR.jpeg" alt="Queen Selina" class="logo">
            <h1>👑 Setup Your Bot</h1>
            <p>Bot ID: <code>${botId}</code></p>
            <span class="status ${bot.status}">${bot.status.toUpperCase()}</span>
        </div>

        <div class="admin-box">
            <h3>🔐 Admin Credentials</h3>
            <div class="cred-item">
                <span class="cred-label">Email:</span>
                <span class="cred-value">ashen.editz@gmail.com</span>
            </div>
            <div class="cred-item">
                <span class="cred-label">Password:</span>
                <span class="cred-value">ashen@123</span>
            </div>
        </div>

        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab('qr')">📱 QR Code</button>
            <button class="tab-btn" onclick="switchTab('pairing')">🔗 Pairing Code</button>
        </div>

        <div id="qr-tab" class="tab-content active">
            <div class="qr-box">
                <h3>Scan QR Code</h3>
                <div id="qr-container" class="loading">
                    <div class="spinner"></div>
                    <p>Generating QR Code...</p>
                </div>
                
                <div class="instructions">
                    <h4>📱 How to Scan:</h4>
                    <ol>
                        <li>Open <strong>WhatsApp</strong> on your phone</li>
                        <li>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong></li>
                        <li>Tap <strong>Linked Devices</strong></li>
                        <li>Tap <strong>Link a Device</strong></li>
                        <li><strong>Scan this QR code</strong> ↓</li>
                    </ol>
                </div>
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
            
            <div class="instructions" style="margin-top: 20px;">
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

        function switchTab(tab) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            if (tab === 'qr') {
                document.querySelector('.tab-btn:first-child').classList.add('active');
                document.getElementById('qr-tab').classList.add('active');
                checkQRCode();
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
                        <p style="color: #666;">Scan with WhatsApp to connect</p>
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
            
            if (!phoneNumber) {
                alert('❌ Please enter your WhatsApp number');
                return;
            }

            if (!/^[0-9]{10,15}$/.test(phoneNumber)) {
                alert('❌ Invalid phone number!\\nUse: Country code + number\\nExample: 94768738555');
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
                    body: JSON.stringify({
                        botId: botId,
                        phoneNumber: phoneNumber
                    })
                });

                const data = await response.json();

                if (data.success && data.pairingCode) {
                    document.getElementById('pairing-result').innerHTML = \`
                        <div class="alert alert-success">
                            ✅ Pairing code generated successfully!
                        </div>
                        <div class="pairing-code-display">
                            <p style="color: #666; margin-bottom: 10px;">Your Pairing Code:</p>
                            <div class="code">\${data.pairingCode}</div>
                            <p style="color: #666;">Enter this code in WhatsApp</p>
                        </div>
                    \`;
                } else {
                    document.getElementById('pairing-result').innerHTML = \`
                        <div class="alert alert-warning">
                            ⚠️ \${data.error || 'Could not generate pairing code'}
                        </div>
                    \`;
                }
            } catch (error) {
                document.getElementById('pairing-result').innerHTML = \`
                    <div class="alert alert-warning">❌ Error: \${error.message}</div>
                \`;
            } finally {
                btn.disabled = false;
                btn.textContent = '🔗 Generate Pairing Code';
            }
        }

        window.onload = function() {
            checkQRCode();
        };
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
    contact: '+94 76 873 8555',
    email: 'ashen.editz@gmail.com',
    admin: {
      email: 'ashen.editz@gmail.com',
      password: 'ashen@123'
    },
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      bots: {
        create: 'POST /api/bots/create',
        list: 'GET /api/bots/user/:userId',
        qr: 'GET /api/bots/qr/:botId',
        pairing: 'POST /api/bots/pairing-code'
      },
      admin: {
        users: 'POST /api/admin/users',
        bots: 'POST /api/admin/bots',
        broadcast: 'POST /api/admin/broadcast',
        stats: 'POST /api/admin/stats'
      }
    }
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
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
║                                       ║
╚═══════════════════════════════════════╝

🌐 Server URL: ${serverUrl}

🔐 Admin Credentials:
   Email: ashen.editz@gmail.com
   Password: ashen@123

✅ Backend is ready!
📱 Users can create WhatsApp bots!
  `);
});

// Shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

module.exports = app;
