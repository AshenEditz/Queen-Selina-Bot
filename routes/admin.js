const express = require('express');
const router = express.Router();
const Database = require('../utils/database');
const BotManager = require('../bot');

const usersDB = new Database('users.json');
const botsDB = new Database('bots.json');
const broadcastsDB = new Database('broadcasts.json');
const botManager = new BotManager();

const ADMIN_EMAIL = 'ashen.editz@gmail.com';
const ADMIN_PASS = 'ashen@123';

const checkAdmin = (req, res, next) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Unauthorized' });
  }
};

router.post('/users', checkAdmin, (req, res) => {
  try {
    const users = usersDB.read();
    const sanitized = users.map(({ password, ...user }) => user);
    res.json({ success: true, users: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bots', checkAdmin, (req, res) => {
  try {
    const bots = botsDB.read();
    res.json({ success: true, bots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/broadcast', checkAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    const bots = botsDB.find({ status: 'active' });

    const broadcast = {
      id: require('uuid').v4(),
      message,
      sentTo: 0,
      createdAt: new Date().toISOString()
    };

    let totalSent = 0;
    for (const bot of bots) {
      const sent = await botManager.sendBroadcast(bot.id, message);
      totalSent += sent;
    }

    broadcast.sentTo = totalSent;
    broadcastsDB.insert(broadcast);

    res.json({
      success: true,
      message: `Broadcast sent to ${totalSent} users`,
      broadcast
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/stats', checkAdmin, (req, res) => {
  try {
    const users = usersDB.read();
    const bots = botsDB.read();
    const broadcasts = broadcastsDB.read();

    const stats = {
      totalUsers: users.length,
      totalBots: bots.length,
      activeBots: bots.filter(b => b.status === 'active').length,
      freeBots: bots.filter(b => b.isFree).length,
      paidBots: bots.filter(b => !b.isFree).length,
      totalBroadcasts: broadcasts.length
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
