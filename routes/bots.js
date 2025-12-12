const express = require('express');
const router = express.Router();
const Database = require('../utils/database');
const { v4: uuidv4 } = require('uuid');
const BotManager = require('../bot');

const usersDB = new Database('users.json');
const botsDB = new Database('bots.json');
const botManager = new BotManager();

// Create new bot
router.post('/create', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and phone number required' 
      });
    }

    const user = usersDB.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    if (user.totalBots >= 50) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum bot limit (50) reached' 
      });
    }

    const isFree = !user.freeBotUsed;

    const newBot = {
      id: uuidv4(),
      userId: userId,
      phoneNumber,
      status: 'pending',
      isFree,
      qrCode: null,
      pairingCode: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    botsDB.insert(newBot);

    usersDB.update(
      { id: userId },
      { 
        freeBotUsed: true,
        totalBots: user.totalBots + 1 
      }
    );

    console.log(`✅ Bot created: ${phoneNumber} for user ${user.email}`);

    // Create bot in background
    botManager.createBot(newBot.id, phoneNumber).catch(err => {
      console.error('Bot creation error:', err);
    });

    // Generate setup URL
    const setupUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/setup/${newBot.id}`
      : `http://localhost:${process.env.PORT || 3000}/setup/${newBot.id}`;

    res.json({
      success: true,
      bot: newBot,
      setupUrl: setupUrl,
      adminCredentials: {
        email: 'ashen.editz@gmail.com',
        password: 'ashen@123'
      },
      message: isFree 
        ? '🎉 Free bot created! Open setup URL to connect.' 
        : 'Bot created successfully! Open setup URL to connect.'
    });
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get user's bots
router.get('/user/:userId', (req, res) => {
  try {
    const bots = botsDB.find({ userId: req.params.userId });
    res.json({ 
      success: true, 
      bots 
    });
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get QR code
router.get('/qr/:botId', (req, res) => {
  try {
    const qrCode = botManager.getQR(req.params.botId);
    if (qrCode) {
      res.json({ 
        success: true, 
        qrCode 
      });
    } else {
      res.json({ 
        success: false, 
        error: 'QR code not ready yet. Please wait...' 
      });
    }
  } catch (error) {
    console.error('Get QR error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate pairing code
router.post('/pairing-code', async (req, res) => {
  try {
    const { botId, phoneNumber } = req.body;
    
    if (!botId || !phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Bot ID and phone number required' 
      });
    }

    // Validate phone number
    if (!/^[0-9]{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format. Use country code + number (e.g., 94768738555)' 
      });
    }

    console.log(`🔗 Requesting pairing code for bot ${botId}, number ${phoneNumber}`);

    const code = await botManager.getPairingCode(botId, phoneNumber);
    
    if (code) {
      console.log(`✅ Pairing code generated: ${code}`);
      res.json({ 
        success: true, 
        pairingCode: code,
        message: 'Pairing code generated successfully'
      });
    } else {
      console.log(`❌ Failed to generate pairing code for bot ${botId}`);
      res.status(400).json({ 
        success: false, 
        error: 'Could not generate pairing code. Please ensure bot is initializing and try again in a few seconds.' 
      });
    }
  } catch (error) {
    console.error('Pairing code error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete bot
router.delete('/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    const bot = botsDB.findOne({ id: botId });
    
    if (!bot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bot not found' 
      });
    }

    await botManager.stopBot(botId);
    botsDB.delete({ id: botId });
    
    // Update user's total bots
    const user = usersDB.findOne({ id: bot.userId });
    if (user) {
      usersDB.update(
        { id: bot.userId },
        { totalBots: Math.max(0, user.totalBots - 1) }
      );
    }

    console.log(`🗑️ Bot deleted: ${botId}`);
    
    res.json({ 
      success: true, 
      message: 'Bot deleted successfully' 
    });
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get bot status
router.get('/status/:botId', (req, res) => {
  try {
    const status = botManager.getStatus(req.params.botId);
    const bot = botsDB.findOne({ id: req.params.botId });
    
    res.json({ 
      success: true, 
      status,
      bot: bot || null
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get bot setup info
router.get('/setup-info/:botId', (req, res) => {
  try {
    const bot = botsDB.findOne({ id: req.params.botId });
    
    if (!bot) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bot not found' 
      });
    }

    const setupUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/setup/${bot.id}`
      : `http://localhost:${process.env.PORT || 3000}/setup/${bot.id}`;

    res.json({
      success: true,
      bot,
      setupUrl,
      adminCredentials: {
        email: 'ashen.editz@gmail.com',
        password: 'ashen@123'
      }
    });
  } catch (error) {
    console.error('Get setup info error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
