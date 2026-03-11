const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = process.env.ADMIN_TOKEN || 'kiosk-admin-token';
    return res.json({ token, username: user.username });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.' });
  }
});

module.exports = router;
