// src/pages/TicTacToe.tsx
import { useState, useEffect } from 'react';
import { Page } from '@/components/Page';
import { Button, Text } from '@telegram-apps/telegram-ui';
import styles from './TicTacToe.module.css';

type Player = 'X' | 'O' | null;  // Change back to simple symbols
type Board = Player[];

export function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Player>(null);

  const checkWinner = (squares: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const minimax = (squares: Board, depth: number, isMax: boolean): number => {
    const winner = checkWinner(squares);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (squares.every(square => square !== null)) return 0;

    if (isMax) {
      let best = -1000;
      squares.forEach((square, idx) => {
        if (!square) {
          squares[idx] = 'O';
          best = Math.max(best, minimax(squares, depth + 1, !isMax));
          squares[idx] = null;
        }
      });
      return best;
    } else {
      let best = 1000;
      squares.forEach((square, idx) => {
        if (!square) {
          squares[idx] = 'X';
          best = Math.min(best, minimax(squares, depth + 1, !isMax));
          squares[idx] = null;
        }
      });
      return best;
    }
  };

  const findBestMove = (squares: Board): number => {
    let bestVal = -1000;
    let bestMove = -1;

    squares.forEach((square, idx) => {
      if (!square) {
        squares[idx] = 'O';
        const moveVal = minimax(squares, 0, false);
        squares[idx] = null;

        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = idx;
        }
      }
    });
    return bestMove;
  };

  const handleClick = (index: number) => {
    if (board[index] || gameOver || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = 'X';  // Change X to star
    setBoard(newBoard);
    setIsPlayerTurn(false);
  };

  useEffect(() => {
    const winner = checkWinner(board);
    if (winner) {
      setGameOver(true);
      setWinner(winner);
      return;
    }

    if (!isPlayerTurn && !gameOver) {
      const aiMove = findBestMove(board);
      setTimeout(() => {
        const newBoard = [...board];
        newBoard[aiMove] = 'O';  // Change O to ribbon
        setBoard(newBoard);
        setIsPlayerTurn(true);
      }, 500);
    }
  }, [board, isPlayerTurn]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameOver(false);
    setWinner(null);
  };

  return (
    <Page>
      <div className={styles.container}>
        <Text variant="h1" className={styles.title}>Tic-Tac-Toe</Text>
        <div className={styles.board}>
          {board.map((cell, index) => (
            <Button
              key={index}
              onClick={() => handleClick(index)}
              className={styles.cell}
              disabled={!!cell || gameOver || !isPlayerTurn}
              data-player={cell}
            >
              {cell}
            </Button>
          ))}
        </div>
        {gameOver && (
          <div className={styles.gameOver}>
            <Text variant="h2" className={styles.resultText}>
              {winner ? `${winner === 'X' ? 'You Win' : 'AI Wins'}` : "Draw"}
            </Text>
            <Button className={styles.playAgainBtn} onClick={resetGame}>
              New Game
            </Button>
          </div>
        )}
        {!gameOver && (
          <Text className={styles.status}>
            {isPlayerTurn ? "Your Move" : "AI Move"}
          </Text>
        )}
      </div>
    </Page>
  );
}