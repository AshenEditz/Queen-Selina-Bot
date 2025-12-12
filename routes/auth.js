const express = require('express');
const router = express.Router();
const Database = require('../utils/database');
const { v4: uuidv4 } = require('uuid');

const usersDB = new Database('users.json');

router.post('/register', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const existingUser = usersDB.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const newUser = {
      id: uuidv4(),
      email,
      password,
      role: 'user',
      freeBotUsed: false,
      totalBots: 0,
      createdAt: new Date().toISOString()
    };

    usersDB.insert(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    res.json({
      success: true,
      user: userWithoutPassword,
      message: '🎉 Registration successful! You get 1 FREE bot!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = usersDB.findOne({ email, password });
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      token: Buffer.from(user.id).toString('base64')
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me/:userId', (req, res) => {
  try {
    const user = usersDB.findOne({ id: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
