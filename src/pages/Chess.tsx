// src/pages/Chess.tsx
import { useState, useEffect, useRef } from 'react';
import { Page } from '@/components/Page';
import { Button, Text } from '@telegram-apps/telegram-ui';
import { Chess as ChessLibrary, Move } from 'chess.js';
import styles from './Chess.module.css';

export function Chess() {
  // Initialize chess.js within useRef to persist across renders
  const chess = useRef(new ChessLibrary());

  // State variables
  const [board, setBoard] = useState(chess.current.board());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is White
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState("Your turn! 🎮");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null); // Added winner state

  // Helper function to get Unicode symbols for pieces
  const getPieceSymbol = (piece: { type: string; color: string } | null): string => {
    if (!piece) return '';
    const symbols: Record<string, Record<string, string>> = {
      w: {
        p: '♙',
        r: '♖',
        n: '♘',
        b: '♗',
        q: '♕',
        k: '♔',
      },
      b: {
        p: '♟︎',
        r: '♜',
        n: '♞',
        b: '♝',
        q: '♛',
        k: '♚',
      },
    };
    return symbols[piece.color][piece.type];
  };

  // Update the board state and check game status
  const updateBoard = () => {
    const currentBoard = chess.current.board();
    setBoard([...currentBoard]);

    console.log('Board updated:', currentBoard);

    // Check if the game is over
    if (chess.current.isGameOver()) {
      setGameOver(true);
      if (chess.current.isCheckmate()) {
        const winnerColor = chess.current.turn() === 'w' ? 'Black' : 'White';
        setWinner(winnerColor);
        setStatus(`${winnerColor} wins by checkmate! 🎉`);
        console.log(`Game Over: ${winnerColor} wins by checkmate`);
      } else if (chess.current.isDraw()) {
        setStatus("It's a Draw! ⚖️");
        console.log('Game Over: Draw');
      } else {
        setStatus("Game Over! 🛑");
        console.log('Game Over');
      }
    } else {
      // Toggle turn using functional update to prevent stale state
      setIsPlayerTurn((prev) => {
        const newTurn = !prev;
        setStatus(newTurn ? "Your turn! 🎮" : "AI thinking... 🤖");
        console.log('Turn toggled. Player turn:', newTurn);
        return newTurn;
      });
    }
  };

  // Handle player's move
  const handleMove = (from: string, to: string) => {
    console.log(`Player attempts to move from ${from} to ${to}`);
    const move: Move | null = chess.current.move({ from, to, promotion: 'q' }); // Promote to queen by default
    if (move) {
      console.log(`Player moved: ${move.san}`);
      updateBoard();
    } else {
      console.log("Invalid move attempted.");
    }
  };

  // Handle square clicks for selecting and moving
  const handleSquareClick = (square: string) => {
    if (gameOver) return;

    const piece = chess.current.get(square);
    console.log(`Square clicked: ${square}`, piece);

    if (selectedSquare === square) {
      // Deselect the square if the same square is clicked again
      setSelectedSquare(null);
      console.log(`Deselected piece at: ${square}`);
    } else if (selectedSquare) {
      // Attempt to move the selected piece to the clicked square
      handleMove(selectedSquare, square);
      setSelectedSquare(null);
    } else {
      // Select square if it has player's piece (white)
      if (piece && piece.color === 'w') { // Assuming player is White
        setSelectedSquare(square);
        console.log(`Piece selected at: ${square}`);
      }
    }
  };

  // AI makes a random valid move
  const aiMove = () => {
    try {
      const moves = chess.current.moves({ verbose: true });
      console.log("AI available moves:", moves);
      
      if (moves.length === 0) {
        console.log("No moves available for AI.");
        return;
      }

      const move = moves[Math.floor(Math.random() * moves.length)];
      console.log(`AI executing move:`, move);
      
      const result = chess.current.move(move);
      if (result) {
        console.log(`AI move successful:`, result);
        updateBoard();
      } else {
        console.error("AI move failed to execute");
      }
    } catch (error) {
      console.error("Error during AI move:", error);
      setStatus("AI move error occurred");
    }
  };

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (!isPlayerTurn && !gameOver) {
      console.log("AI turn detected, preparing move...");
      setStatus("AI is thinking... 🤖");
      
      timeoutId = setTimeout(() => {
        console.log("Executing AI move after delay");
        aiMove();
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isPlayerTurn, gameOver]);

  // Reset the game to initial state
  const resetGame = () => {
    chess.current.reset();
    setBoard(chess.current.board());
    setIsPlayerTurn(true);
    setGameOver(false);
    setStatus("Your turn! 🎮");
    setSelectedSquare(null);
    setWinner(null);
    console.log("Game has been reset.");
  };

  return (
    <Page>
      <div className={styles.container}>
        <Text className={styles.title}>Chess</Text>
        <div className={styles.board}>
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const square = `${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`;
              const isSelected = selectedSquare === square;
              const pieceSymbol = getPieceSymbol(cell);
              return (
                <Button
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`${styles.cell} ${isSelected ? styles.selected : ''}`}
                  disabled={ (!isPlayerTurn && cell?.color === 'b') || gameOver }
                >
                  {pieceSymbol}
                </Button>
              );
            })
          )}
        </div>
        <Text className={styles.status}>{status}</Text>
        {gameOver && (
          <Button className={styles.playAgainBtn} onClick={resetGame}>
            Play Again 🎯
          </Button>
        )}
      </div> 
    </Page>
  );
}