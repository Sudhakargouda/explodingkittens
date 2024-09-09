import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUsername, startGame, drawCard, updateLeaderboard } from '../redux/gameSlice';
import axios from 'axios';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:5000');

const Game = () => {
  const dispatch = useDispatch();
  const { deck, username, leaderboard } = useSelector((state) => state.game);
  const [cardMessage, setCardMessage] = useState('');
  const [userInput, setUserInput] = useState(''); // For capturing username input
  const [currentCard, setCurrentCard] = useState(''); // To track the drawn card

  // Fetch leaderboard from the server when the component mounts
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/leaderboard');
        dispatch(updateLeaderboard(response.data)); // Update leaderboard in Redux
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
    fetchLeaderboard();
  }, [dispatch]);

  // Listening for real-time leaderboard updates from the server
  useEffect(() => {
    socket.on('leaderboardUpdated', (data) => {
      console.log('Received leaderboard update:', data); // Log the leaderboard data
      dispatch(updateLeaderboard(data));
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.off('leaderboardUpdated');
    };
  }, [dispatch]);

  // Function to handle username input and set it to Redux state
  const handleSetUsername = () => {
    dispatch(setUsername(userInput));
  };

  // Function to start the game and shuffle the deck
  const handleStartGame = async () => {
    const shuffledDeck = ['Cat 😼', 'Defuse 🙅‍♂️', 'Shuffle 🔀', 'Exploding Kitten 💣', 'Cat 😼'];
    dispatch(startGame(shuffledDeck.sort(() => Math.random() - 0.5)));
    await axios.post('http://localhost:5000/api/start-game', { username });
    setCardMessage(''); // Reset card message when starting a new game
    setCurrentCard(''); // Reset the current card display
  };

  // Function to handle card drawing and showing corresponding messages
  const handleDrawCard = async () => {
    const card = deck[0];
    setCurrentCard(card); // Track the current drawn card for display

    if (card === 'Exploding Kitten 💣') {
      setCardMessage('💣 Game Over! You drew the Exploding Kitten!');
    } else if (card === 'Shuffle 🔀') {
      handleStartGame(); // Restart the game
      setCardMessage('🔀 Deck shuffled!');
    } else if (card === 'Defuse 🙅‍♂️') {
      setCardMessage('🙅‍♂️ Defuse card drawn, you are safe!');
    } else {
      setCardMessage(`Card drawn: ${card}`);

      // Winning condition (for example: Cat card drawn means a win)
      if (card === 'Cat 😼') {
        try {
          // Send win request to the backend
          const response = await axios.post('http://localhost:5000/api/win', { username });
          console.log('Win recorded for', username, response.data);

          setCardMessage(`🎉 You won, ${username}!`);
        } catch (error) {
          console.error('Error updating win:', error);
        }
      }
    }

    dispatch(drawCard());
  };

  // Inline styles for a more visually appealing layout
  const styles = {
    container: {
      padding: '20px',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#333', // Dark gray background for the container
      color: '#f4f4f4', // Light color for text
      minHeight: '100vh', // Ensure container takes full height
    },
    header: {
      color: '#f4a261', // Lighter color for header text
      fontSize: '2rem',
    },
    button: {
      padding: '10px 20px',
      fontSize: '1rem',
      margin: '10px',
      backgroundColor: '#f4a261', // Button color
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      color: '#fff', // Button text color
    },
    input: {
      padding: '10px',
      margin: '10px',
      fontSize: '1rem',
      color: '#333', // Input text color
      backgroundColor: '#fff', // Input background color
      border: '1px solid #ccc', // Input border color
      borderRadius: '5px',
    },
    cardImage: {
      width: '150px',
      height: '150px',
      objectFit: 'cover',
      margin: '20px',
      borderRadius: '10px', // Rounded corners for images
    },
    leaderboard: {
      listStyleType: 'none',
      padding: '0',
      color: '#f4f4f4', // Leaderboard text color
    },
    leaderboardItem: {
      fontSize: '1.2rem',
      color: '#f4f4f4', // Leaderboard item color
    },
  };

  // Images for each card type
  const cardImages = {
    'Cat 😼': 'cat.jpg',
    'Defuse 🙅‍♂️': 'defuse.jpg',
    'Shuffle 🔀': 'shuffle.jpg',
    'Exploding Kitten 💣': 'Exploding_Kittens.png',
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Welcome to Exploding Kittens, {username || 'Player'}!</h1>

      {!username && (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            style={styles.input}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
          <button style={styles.button} onClick={handleSetUsername}>
            Play
          </button>
        </div>
      )}

      <button style={styles.button} onClick={handleStartGame}>
        Start Game
      </button>

      {deck.length > 0 && (
        <button style={styles.button} onClick={handleDrawCard}>
          Draw Card
        </button>
      )}

      {cardMessage && <p style={{ color: '#f4a261' }}>{cardMessage}</p>}

      {currentCard && (
        <div>
          <h2>Card Left in Deck: {deck.length}</h2>
          <img
            src={cardImages[currentCard]}
            alt="Current card"
            style={styles.cardImage}
          />
        </div>
      )}

      <h2>Leaderboard</h2>
      <ul style={styles.leaderboard}>
        {leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <li key={index} style={styles.leaderboardItem}>
              {user.username}: {user.wins} wins
            </li>
          ))
        ) : (
          <p>No data available</p>
        )}
      </ul>
    </div>
  );
};

export default Game;
