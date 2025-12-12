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
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.totalBots >= 50) {
      return res.status(400).json({ success: false, error: 'Maximum bot limit (50) reached' });
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
      { freeBotUsed: true, totalBots: user.totalBots + 1 }
    );

    console.log(`✅ Bot created: ${phoneNumber} for ${user.email}`);

    // Create bot instance
    botManager.createBot(newBot.id, phoneNumber).catch(err => {
      console.error('Bot creation error:', err);
    });

    res.json({
      success: true,
      bot: newBot,
      message: isFree 
        ? '🎉 Free bot created! Contact admin for setup.' 
        : 'Bot created! Contact admin for setup.'
    });
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's bots
router.get('/user/:userId', (req, res) => {
  try {
    const bots = botsDB.find({ userId: req.params.userId });
    res.json({ success: true, bots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get QR code
router.get('/qr/:botId', (req, res) => {
  try {
    const qrCode = botManager.getQR(req.params.botId);
    if (qrCode) {
      res.json({ success: true, qrCode });
    } else {
      res.json({ success: false, error: 'QR not ready yet' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    if (!/^[0-9]{10,15}$/.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid phone number format' 
      });
    }

    console.log(`🔗 Generating pairing code for bot ${botId}, number ${phoneNumber}`);

    const code = await botManager.getPairingCode(botId, phoneNumber);
    
    if (code) {
      console.log(`✅ Pairing code generated: ${code}`);
      res.json({ success: true, pairingCode: code });
    } else {
      console.log(`❌ Failed to generate pairing code`);
      res.status(400).json({ 
        success: false, 
        error: 'Could not generate pairing code. Bot may not be ready yet. Please wait 30 seconds and try again.' 
      });
    }
  } catch (error) {
    console.error('Pairing code error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete bot
router.delete('/:botId', async (req, res) => {
  try {
    const bot = botsDB.findOne({ id: req.params.botId });
    if (!bot) {
      return res.status(404).json({ success: false, error: 'Bot not found' });
    }

    await botManager.stopBot(req.params.botId);
    botsDB.delete({ id: req.params.botId });
    
    const user = usersDB.findOne({ id: bot.userId });
    if (user) {
      usersDB.update(
        { id: bot.userId },
        { totalBots: Math.max(0, user.totalBots - 1) }
      );
    }

    res.json({ success: true, message: 'Bot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bot status
router.get('/status/:botId', (req, res) => {
  try {
    const status = botManager.getStatus(req.params.botId);
    const bot = botsDB.findOne({ id: req.params.botId });
    res.json({ success: true, status, bot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
