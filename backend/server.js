const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// Leaderboard schema
const userSchema = new mongoose.Schema({
  username: String,
  wins: { type: Number, default: 0 },
});

const User = mongoose.model('User', userSchema);

// Socket.io setup
const http = require('http').createServer(app);
const io = new Server(http, { cors: { origin: '*' } });

/**
 * Helper function to fetch leaderboard and emit to clients
 */
const sendLeaderboardUpdate = async () => {
  const leaderboard = await User.find().sort({ wins: -1 }).limit(10); // Get top 10 players
  io.emit('leaderboardUpdated', leaderboard);
};

// When a user connects to the socket
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send updated leaderboard on connection
  sendLeaderboardUpdate();

  socket.on('updateLeaderboard', async () => {
    await sendLeaderboardUpdate();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// API routes

// Start game route
app.post('/api/start-game', async (req, res) => {
  try {
    const { username } = req.body;
    let user = await User.findOne({ username });
    
    // If the user does not exist, create a new user
    if (!user) {
      user = new User({ username });
      await user.save();
    }

    res.json({ message: 'Game started', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Win game route
app.post('/api/win', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (user) {
      user.wins += 1;
      await user.save();

      // Emit updated leaderboard to all clients
      await sendLeaderboardUpdate();

      res.json({ message: 'Game won', user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Server setup
http.listen(5000, () => {
  console.log('Server is running on port 5000');
});
