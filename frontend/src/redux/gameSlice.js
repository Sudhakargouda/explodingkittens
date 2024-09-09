import { createSlice } from '@reduxjs/toolkit';

export const gameSlice = createSlice({
  name: 'game',
  initialState: {
    deck: [],
    username: '',
    wins: 0,
    leaderboard: [],
  },
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    startGame: (state, action) => {
      state.deck = action.payload;  // random shuffled cards
    },
    drawCard: (state) => {
      if (state.deck.length > 0) {
        state.deck.shift(); // removes the first card
      }
    },
    updateLeaderboard: (state, action) => {
      state.leaderboard = action.payload;
    },
    incrementWins: (state) => {
      state.wins += 1; // Increment win count
    },
    shuffleDeck: (state) => {
      state.deck = state.deck.sort(() => Math.random() - 0.5); // Shuffle the deck
    },
  },
});

export const { setUsername, startGame, drawCard, updateLeaderboard, incrementWins, shuffleDeck } = gameSlice.actions;

export default gameSlice.reducer;
