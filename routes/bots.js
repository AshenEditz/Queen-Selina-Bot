const express = require('express');
const router = express.Router();
const Database = require('../utils/database');
const { v4: uuidv4 } = require('uuid');
const BotManager = require('../bot');

const usersDB = new Database('users.json');
const botsDB = new Database('bots.json');
const botManager = new BotManager();

router.post('/create', async (req, res) => {
  try {
    const { userId, phoneNumber } = req.body;

    if (!userId || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'User ID and phone number required' });
    }

    const user = usersDB.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
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

    await botManager.createBot(newBot.id, phoneNumber);

    res.json({
      success: true,
      bot: newBot,
      message: isFree ? '🎉 Free bot created! Connect now.' : 'Bot created successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/:userId', (req, res) => {
  try {
    const bots = botsDB.find({ userId: req.params.userId });
    res.json({ success: true, bots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

router.post('/pairing-code', async (req, res) => {
  try {
    const { botId, phoneNumber } = req.body;
    
    if (!botId || !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Bot ID and phone number required' });
    }

    const code = await botManager.getPairingCode(botId, phoneNumber);
    
    if (code) {
      res.json({ success: true, pairingCode: code });
    } else {
      res.status(400).json({ success: false, error: 'Could not generate pairing code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:botId', async (req, res) => {
  try {
    await botManager.stopBot(req.params.botId);
    botsDB.delete({ id: req.params.botId });
    
    res.json({ success: true, message: 'Bot deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status/:botId', (req, res) => {
  try {
    const status = botManager.getStatus(req.params.botId);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
