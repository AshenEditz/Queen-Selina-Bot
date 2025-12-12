const express = require('express');
const router = express.Router();
const Database = require('../utils/database');

const settingsDB = new Database('settings.json');

router.get('/:botId', (req, res) => {
  try {
    let settings = settingsDB.findOne({ botId: req.params.botId });
    
    if (!settings) {
      settings = {
        botId: req.params.botId,
        autoReact: false,
        reactToCommands: true,
        reactions: ['❤️', '💞', '😊', '🔥', '👍', '⭐'],
        autoJoinChannel: true,
        welcomeMessage: true,
        antiSpam: true,
        createdAt: new Date().toISOString()
      };
      settingsDB.insert(settings);
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:botId', (req, res) => {
  try {
    const { botId } = req.params;
    const updates = req.body;

    let settings = settingsDB.findOne({ botId });
    
    if (!settings) {
      settings = {
        botId,
        ...updates,
        createdAt: new Date().toISOString()
      };
      settingsDB.insert(settings);
    } else {
      settingsDB.update({ botId }, updates);
      settings = settingsDB.findOne({ botId });
    }

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
